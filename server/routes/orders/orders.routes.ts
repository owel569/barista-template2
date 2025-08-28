
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../../middleware/validation';
import { getDb } from '../../db';
import { orders, orderItems, menuItems, customers, tables } from '../../../shared/schema';
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('ORDERS_ROUTES');

// Schémas de validation
const CreateOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  items: z.array(z.object({
    menuItemId: z.string().uuid('ID article invalide'),
    quantity: z.number().int().positive('Quantité doit être positive'),
    specialInstructions: z.string().optional()
  })).min(1, 'Au moins un article requis'),
  specialRequests: z.string().optional(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']).default('dine_in'),
  customerInfo: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional()
  }).optional()
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled']),
  notes: z.string().optional()
});

// Routes principales
router.get('/',
  authenticateUser,
  validateQuery(z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled']).optional(),
    orderType: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
    customerId: z.string().uuid().optional(),
    tableId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    ...commonSchemas.paginationSchema.shape,
    ...commonSchemas.sortSchema.shape
  })),
  cacheMiddleware({ ttl: 30 * 1000, tags: ['orders', 'realtime'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { 
      status, 
      orderType, 
      customerId, 
      tableId, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    let query = db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        tableId: orders.tableId,
        status: orders.status,
        orderType: orders.orderType,
        subtotal: orders.subtotal,
        tax: orders.tax,
        total: orders.total,
        specialRequests: orders.specialRequests,
        customerInfo: orders.customerInfo,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: customers.firstName,
        tableNumber: tables.number
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(tables, eq(orders.tableId, tables.id));

    // Construire les conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(orders.status, status));
    }
    
    if (orderType) {
      conditions.push(eq(orders.orderType, orderType));
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

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'total' ? orders.total :
                       sortBy === 'status' ? orders.status :
                       sortBy === 'updatedAt' ? orders.updatedAt :
                       orders.createdAt;

    query = sortOrder === 'desc' ?
      query.orderBy(desc(orderColumn)) :
      query.orderBy(orderColumn);

    // Pagination
    const offset = (page - 1) * limit;
    const ordersData = await query.limit(limit).offset(offset);

    // Récupérer les articles pour chaque commande
    const orderIds = ordersData.map(order => order.id);
    const orderItemsData = orderIds.length > 0 ? await db
      .select({
        orderId: orderItems.orderId,
        menuItemId: orderItems.menuItemId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        specialInstructions: orderItems.specialInstructions,
        menuItemName: menuItems.name,
        menuItemImage: menuItems.imageUrl
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(inArray(orderItems.orderId, orderIds)) : [];

    // Regrouper les articles par commande
    const orderItemsMap = orderItemsData.reduce((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = [];
      }
      acc[item.orderId].push(item);
      return acc;
    }, {} as Record<string, typeof orderItemsData>);

    // Combiner les données
    const result = ordersData.map(order => ({
      ...order,
      items: orderItemsMap[order.id] || []
    }));

    // Compte total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    logger.info('Commandes récupérées', { 
      count: result.length, 
      total: count,
      filters: { status, orderType, customerId, tableId }
    });

    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  })
);

router.get('/:id',
  authenticateUser,
  validateParams(commonSchemas.idSchema),
  cacheMiddleware({ ttl: 30 * 1000, tags: ['orders'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [order] = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        tableId: orders.tableId,
        status: orders.status,
        orderType: orders.orderType,
        subtotal: orders.subtotal,
        tax: orders.tax,
        total: orders.total,
        specialRequests: orders.specialRequests,
        customerInfo: orders.customerInfo,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: customers.firstName,
        customerEmail: customers.email,
        tableNumber: tables.number
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

    // Récupérer les articles de la commande
    const items = await db
      .select({
        id: orderItems.id,
        menuItemId: orderItems.menuItemId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        specialInstructions: orderItems.specialInstructions,
        menuItemName: menuItems.name,
        menuItemDescription: menuItems.description,
        menuItemImage: menuItems.imageUrl
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, id));

    const result = {
      ...order,
      items
    };

    logger.info('Commande récupérée', { orderId: id, itemsCount: items.length });

    res.json({
      success: true,
      data: result
    });
  })
);

router.post('/',
  validateBody(CreateOrderSchema),
  invalidateCache(['orders', 'realtime', 'stats']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { items: orderItemsData, ...orderData } = req.body;

    // Vérifier les articles de menu
    const menuItemIds = orderItemsData.map(item => item.menuItemId);
    const menuItemsFromDb = await db
      .select()
      .from(menuItems)
      .where(and(
        inArray(menuItems.id, menuItemIds),
        eq(menuItems.available, true)
      ));

    if (menuItemsFromDb.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Certains articles ne sont pas disponibles'
      });
    }

    // Calculer les totaux
    let subtotal = 0;
    const itemsWithPrices = orderItemsData.map(item => {
      const menuItem = menuItemsFromDb.find(mi => mi.id === item.menuItemId);
      if (!menuItem) {
        throw new Error(`Article ${item.menuItemId} non trouvé`);
      }
      
      const totalPrice = menuItem.price * item.quantity;
      subtotal += totalPrice;
      
      return {
        ...item,
        unitPrice: menuItem.price,
        totalPrice
      };
    });

    const tax = subtotal * 0.1; // 10% de taxe
    const total = subtotal + tax;

    // Créer la commande
    const orderId = crypto.randomUUID();
    const [newOrder] = await db
      .insert(orders)
      .values({
        id: orderId,
        ...orderData,
        subtotal,
        tax,
        total,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Créer les articles de commande
    const orderItemsToInsert = itemsWithPrices.map(item => ({
      id: crypto.randomUUID(),
      orderId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      specialInstructions: item.specialInstructions,
      createdAt: new Date()
    }));

    await db.insert(orderItems).values(orderItemsToInsert);

    logger.info('Commande créée', {
      orderId,
      customerId: orderData.customerId,
      total,
      itemsCount: orderItemsData.length,
      orderType: orderData.orderType
    });

    res.status(201).json({
      success: true,
      data: {
        ...newOrder,
        items: itemsWithPrices
      },
      message: 'Commande créée avec succès'
    });
  })
);

router.patch('/:id/status',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  validateParams(commonSchemas.idSchema),
  validateBody(UpdateOrderStatusSchema),
  invalidateCache(['orders', 'realtime', 'stats']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { status, notes } = req.body;

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    logger.info('Statut de commande mis à jour', {
      orderId: id,
      oldStatus: updatedOrder.status,
      newStatus: status,
      userId: (req as any).user?.id,
      notes
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: `Commande ${status === 'cancelled' ? 'annulée' : 'mise à jour'} avec succès`
    });
  })
);

// Statistiques des commandes en temps réel
router.get('/stats/realtime',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  cacheMiddleware({ ttl: 30 * 1000, tags: ['orders', 'stats'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${orders.totalAmount})`
      })
      .from(orders)
      .where(gte(orders.createdAt, today))
      .groupBy(orders.status);

    const result = {
      today: {
        totalOrders: stats.reduce((sum, stat) => sum + stat.count, 0),
        totalRevenue: stats.reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0),
        byStatus: stats
      }
    };

    logger.info('Statistiques temps réel récupérées', result.today);

    res.json({
      success: true,
      data: result
    });
  })
);

export default router;
