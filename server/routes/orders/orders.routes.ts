
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { commonSchemas } from '../../utils/validation';
import { getDb } from '../../db';
import { orders, orderItems, menuItems, customers, tables, activityLogs } from '../../../shared/schema';
import { eq, and, or, desc, sql, ilike, gte, lte, count, sum } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('ORDERS_ROUTES');

// Types métier spécifiques pour les commandes
interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  specialRequests?: string;
  subtotal: number;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  tableId: number;
  tableNumber: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  popularItems: Array<{
    itemId: number;
    name: string;
    count: number;
    revenue: number;
  }>;
}

// Schémas de validation Zod
const CreateOrderSchema = z.object({
  customerId: z.number().int().positive('ID client invalide').optional(),
  tableId: z.number().int().positive('ID table invalide'),
  items: z.array(z.object({
    menuItemId: z.number().int().positive('ID article invalide'),
    quantity: z.number().int().min(1, 'Quantité minimum: 1').max(10, 'Quantité maximum: 10'),
    specialRequests: z.string().max(200, 'Demande spéciale trop longue').optional()
  })).min(1, 'Au moins un article requis'),
  notes: z.string().max(500, 'Notes trop longues').optional()
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Statut invalide' })
  }),
  notes: z.string().max(500).optional()
});

// Fonction utilitaire pour log d'activité
async function logOrderActivity(
  userId: number,
  action: string,
  details: string,
  req: any,
  orderId?: number
): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId,
      action,
      details: orderId ? `${details} (Commande: ${orderId})` : details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      createdAt: new Date()
    });
  } catch (error) {
    logger.error('Erreur log activité commande', {
      userId,
      action,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Liste des commandes avec filtres avancés
router.get('/',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff', 'waiter']),
  validateQuery(z.object({
    status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
    customerId: z.coerce.number().int().positive().optional(),
    tableId: z.coerce.number().int().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().optional(),
    ...commonSchemas.pagination.shape,
    sortBy: z.enum(['createdAt', 'totalAmount', 'status', 'tableId']).default('createdAt'),
    sortOrder: commonSchemas.sortOrder
  })),
  cacheMiddleware({ ttl: 2 * 60 * 1000, tags: ['orders'] }),
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const {
      status,
      customerId,
      tableId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        customerName: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
        tableId: orders.tableId,
        tableNumber: tables.number,
        status: orders.status,
        subtotal: orders.subtotal,
        tax: orders.tax,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(tables, eq(orders.tableId, tables.id));

    // Construction des conditions de filtrage
    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (customerId) {
      conditions.push(eq(orders.customerId, customerId));
    }

    if (tableId) {
      conditions.push(eq(orders.tableId, tableId));
    }

    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)));
    }

    if (search) {
      conditions.push(
        or(
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`),
          sql`CAST(${tables.number} AS TEXT) ILIKE ${`%${search}%`}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'totalAmount' ? orders.totalAmount :
                       sortBy === 'status' ? orders.status :
                       sortBy === 'tableId' ? orders.tableId :
                       orders.createdAt;

    query = sortOrder === 'desc' ?
      query.orderBy(desc(orderColumn)) :
      query.orderBy(orderColumn);

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    const ordersData = await query.limit(Number(limit)).offset(offset);

    // Récupération des articles pour chaque commande
    const orderIds = ordersData.map(order => order.id);
    const orderItemsData = orderIds.length > 0 ? await db
      .select({
        orderId: orderItems.orderId,
        menuItemId: orderItems.menuItemId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        specialRequests: orderItems.specialRequests,
        itemName: menuItems.name
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(sql`${orderItems.orderId} IN (${orderIds.join(',')})`) : [];

    // Groupement des articles par commande
    const orderItemsMap = orderItemsData.reduce((acc, item) => {
      const orderId = item.orderId;
      if (orderId && !acc[orderId]) {
        acc[orderId] = [];
      }
      if (orderId) {
        acc[orderId].push(item);
      }
      return acc;
    }, {} as Record<number, typeof orderItemsData>);

    // Construction des commandes complètes
    const completeOrders = ordersData.map(order => ({
      ...order,
      items: orderItemsMap[order.id] || []
    }));

    // Compte total
    const countResult = await db
      .select({ count: count() })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    logger.info('Commandes récupérées', {
      count: completeOrders.length,
      total,
      filters: { status, customerId, tableId, search }
    });

    res.json({
      success: true,
      data: completeOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  })
);

// Détails d'une commande
router.get('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff', 'waiter']),
  validateParams(z.object({ id: z.string().regex(/^\d+$/) })),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['orders'] }),
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const id = parseInt(req.params.id!, 10);

    const [order] = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        customerName: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
        customerEmail: customers.email,
        tableId: orders.tableId,
        tableNumber: tables.number,
        status: orders.status,
        subtotal: orders.subtotal,
        tax: orders.tax,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .where(eq(orders.id, id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Récupération des articles de la commande
    const items = await db
      .select({
        id: orderItems.id,
        menuItemId: orderItems.menuItemId,
        name: menuItems.name,
        price: orderItems.price,
        quantity: orderItems.quantity,
        specialRequests: orderItems.specialRequests,
        subtotal: sql<number>`${orderItems.price} * ${orderItems.quantity}`
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, id));

    const orderDetails: OrderDetails = {
      ...order,
      items: items.map(item => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name || '',
        price: Number(item.price),
        quantity: item.quantity,
        specialRequests: item.specialRequests || undefined,
        subtotal: Number(item.subtotal)
      }))
    };

    logger.info('Détails commande récupérés', { orderId: id });

    res.json({
      success: true,
      data: orderDetails
    });
  })
);

// Créer une nouvelle commande
router.post('/',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff', 'waiter']),
  validateBody(CreateOrderSchema),
  invalidateCache(['orders']),
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const currentUser = (req as any).user;
    const { customerId, tableId, items, notes } = req.body;

    // Récupération des prix des articles
    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuItemsData = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        price: menuItems.price,
        isAvailable: menuItems.isAvailable
      })
      .from(menuItems)
      .where(sql`${menuItems.id} IN (${menuItemIds.join(',')})`);

    // Vérification de disponibilité
    const unavailableItems = menuItemsData.filter(item => !item.isAvailable);
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Articles non disponibles: ${unavailableItems.map(i => i.name).join(', ')}`
      });
    }

    // Calcul des totaux
    const itemsWithPrices = items.map((item: any) => {
      const menuItem = menuItemsData.find(mi => mi.id === item.menuItemId);
      if (!menuItem) {
        throw new Error(`Article non trouvé: ${item.menuItemId}`);
      }

      const totalPrice = Number(menuItem.price) * item.quantity;

      return {
        ...item,
        price: Number(menuItem.price),
        subtotal: totalPrice
      };
    });

    const subtotal = itemsWithPrices.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Math.round(subtotal * 0.20 * 100) / 100; // TVA 20%
    const totalAmount = subtotal + tax;

    // Transaction de base de données
    const result = await db.transaction(async (tx) => {
      // Création de la commande
      const [newOrder] = await tx
        .insert(orders)
        .values({
          customerId,
          tableId,
          status: 'pending',
          subtotal: subtotal.toString(),
          tax: tax.toString(),
          totalAmount: totalAmount.toString(),
          total: totalAmount.toString(),
          notes,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      if (!newOrder) {
        throw new Error('Erreur création commande');
      }

      // Création des articles de commande
      const orderItemsToInsert = itemsWithPrices.map((item: any) => ({
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price.toString(),
        specialRequests: item.specialRequests,
        createdAt: new Date()
      }));

      await tx.insert(orderItems).values(orderItemsToInsert);

      // Log d'activité
      await logOrderActivity(
        currentUser.id,
        'CREATE_ORDER',
        `Commande créée pour table ${tableId}`,
        req,
        newOrder.id
      );

      return newOrder;
    });

    logger.info('Commande créée', {
      orderId: result.id,
      customerId,
      tableId,
      totalAmount,
      createdBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Commande créée avec succès'
    });
  })
);

// Mettre à jour le statut d'une commande
router.patch('/:id/status',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff', 'waiter']),
  validateParams(z.object({ id: z.string().regex(/^\d+$/) })),
  validateBody(UpdateOrderStatusSchema),
  invalidateCache(['orders']),
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const currentUser = (req as any).user;
    const id = parseInt(req.params.id!, 10);
    const { status, notes } = req.body;

    // Vérification que la commande existe
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Mise à jour du statut
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        notes: notes || existingOrder.notes,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();

    // Log d'activité
    await logOrderActivity(
      currentUser.id,
      'UPDATE_ORDER_STATUS',
      `Statut modifié: ${existingOrder.status} → ${status}`,
      req,
      id
    );

    logger.info('Statut commande mis à jour', {
      orderId: id,
      previousStatus: existingOrder.status,
      newStatus: status,
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Statut de commande mis à jour'
    });
  })
);

// Statistiques des commandes
router.get('/stats/overview',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    period: z.enum(['today', 'week', 'month', 'year']).default('month')
  })),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['orders', 'stats'] }),
  asyncHandler(async (req, res) => {
    const db = await getDb();
    const { startDate, endDate, period } = req.query;

    // Calcul des dates selon la période
    const now = new Date();
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = now;
      }
    }

    // Statistiques générales
    const [generalStats] = await db
      .select({
        totalOrders: count(),
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end)
      ));

    // Calcul du panier moyen
    const averageOrderValue = generalStats.totalOrders > 0 
      ? Math.round((generalStats.totalRevenue / generalStats.totalOrders) * 100) / 100
      : 0;

    // Distribution par statut
    const statusStats = await db
      .select({
        status: orders.status,
        count: count()
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end)
      ))
      .groupBy(orders.status);

    const ordersByStatus = statusStats.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const statistics: OrderStatistics = {
      totalOrders: generalStats.totalOrders,
      totalRevenue: generalStats.totalRevenue,
      averageOrderValue,
      ordersByStatus,
      popularItems: [] // À implémenter avec orderItems
    };

    logger.info('Statistiques commandes récupérées', {
      period,
      totalOrders: statistics.totalOrders,
      totalRevenue: statistics.totalRevenue
    });

    res.json({
      success: true,
      data: statistics
    });
  })
);

export default router;
