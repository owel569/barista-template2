import { Router } from 'express';''
import { z } from '''zod';''
import { validateBody, validateParams } from '''../middleware/validation';''
import { asyncHandler } from '''../middleware/error-handler';''
import { authenticateToken, requireRole, requireRoles } from '''../middleware/auth';''
import { createLogger } from '''../middleware/logging';''
import { PLATFORMS, ORDER_STATUSES, PAYMENT_METHODS } from '''../../constants/online-order';''
import type { OnlineOrder, OrderItem } from '''../../types/online-order';''
import { db } from '''../db'; ''
import { cache } from '''../../lib/cache';''
import { onlineOrders, orderItems, platforms } from '''../../shared/schema';''
import { and, eq, sql } from '''drizzle-orm';''
import { emitOrderUpdate } from '''../../lib/socket';''
import { sendPushNotification } from '''../services/notifications';

const router = Router();''
const logger = createLogger('''ONLINE_ORDERS');

// Types avancés
type OrderStatus = typeof ORDER_STATUSES[number];
type PaymentMethod = typeof PAYMENT_METHODS[number];
type Platform = typeof PLATFORMS[number];

// Schémas de validation étendus
const OrderItemSchema = z.object({''
  name: z.string().min(1, { message: "Le nom de l'''article est requis" }),'
  quantity: z.number().int().positive({ message: ''La quantité doit être positive''' }),'
  price: z.number().positive({ message: ''Le prix doit être positif''' }),
  options: z.array(z.string()).optional(),
  specialInstructions: z.string().max(500).optional()
}).strict();

const OrderCreateSchema = z.object({'
  platform: z.enum(PLATFORMS, { invalid_type_error: ''Plateforme invalide''' }),
  customer: z.object({
    name: z.string().min(2).max(100),'
    phone: z.string().regex(/^\+?[\d\s]{8,15}$/, ''Numéro de téléphone invalide'''),'
    email: z.string().email(''Email invalide''')
  }),'
  items: z.array(OrderItemSchema).min(1, ''Au moins un article est requis'''),
  delivery: z.object({
    address: z.string().max(200).optional(),'
    fee: z.number().nonnegative(''Les frais de livraison doivent être positifs''')
  }).optional(),
  payment: z.object({
    method: z.enum(PAYMENT_METHODS),'
    status: z.enum([''pending''', 'paid''', ''failed''']).default('pending''')
  }),
  notes: z.string().max(1000).optional()
}).strict();

const StatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  estimatedTime: z.string().optional(),
  notes: z.string().optional()
});

// Middleware de sécurité
router.use(authenticateToken);

/**
 * @openapi
 * tags:
 *   name: OnlineOrders
 *   description: Gestion des commandes en ligne
 */

/**
 * @openapi
 * /online-orders:
 *   get:
 *     tags: [OnlineOrders]
 *     summary: Liste les commandes en ligne
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, accepted, preparing, ready, dispatched, delivered, cancelled]
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [Uber Eats, Deliveroo, Just Eat]
 *     responses:
 *       200:
 *         description: Liste des commandes
 */''
router.get('/''', asyncHandler(async (req, res) => {
  const { status, platform } = req.query;
  const cacheKey = `orders_${status}_${platform}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {''
    logger.info('Retour des données en cache''', { cacheKey });
    return res.json(cached);
  }

  const whereConditions = [];
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    whereConditions.push(eq(onlineOrders.status, status as OrderStatus));
  }
  if (platform && PLATFORMS.includes(platform as Platform)) {
    whereConditions.push(eq(onlineOrders.platform, platform as Platform));
  }

  const orders = await db.query.onlineOrders.findMany({
    where: whereConditions.length ? and(...whereConditions) : undefined,
    with: { items: true },
    orderBy: [onlineOrders.createdAt]
  });

  cache.set(cacheKey, orders, 300); // Cache de 5 minutes
 return res.json(orders);
}));

/**
 * @openapi
 * /online-orders/stats:
 *   get:
 *     tags: [OnlineOrders]
 *     summary: Statistiques des commandes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des commandes
 */''
router.get('/stats''', requireRoles([''directeur''', 'manager''']), asyncHandler(async (req, res) => {
  const [summary, platformStats, hourlyTrends] = await Promise.all([
    getOrderSummaryStats(),
    getPlatformStats(),
    getHourlyTrends()
  ]);

  res.json({
    summary,
    platforms: platformStats,
    trends: hourlyTrends
  });
}));

/**
 * @openapi
 * /online-orders:
 *   post:
 *     tags: [OnlineOrders]
 *     summary: Crée une nouvelle commande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:''
 *             $ref: '#/components/schemas/OrderCreate'''
 *     responses:
 *       201:
 *         description: Commande créée
 */''
router.post('/''', validateBody(OrderCreateSchema), asyncHandler(async (req, res) => {
  const orderData = req.body;
  const orderNumber = generateOrderNumber();
  const subtotal = calculateSubtotal(orderData.items);
  const total = subtotal + (orderData.delivery?.fee || 0);

  const newOrder = await db.transaction(async (tx) => {
    const [order] = await tx.insert(onlineOrders).values({
      orderNumber: orderData.orderNumber,
      platform: orderData.platform,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,''
      status: 'pending''',
      subtotal: orderData.subtotal.toString(),
      tax: orderData.tax.toString(),
      total: orderData.total.toString(),
      deliveryAddress: orderData.deliveryAddress,
      estimatedTime: orderData.estimatedTime,
      paymentMethod: orderData.paymentMethod,''
      paymentStatus: 'pending''',
      notes: orderData.notes || null
    }).returning();

    if (!order) {''
      throw new Error('Erreur lors de la création de la commande''');
    }

    // Insérer les éléments de commande
    await tx.insert(orderItems).values(
      orderData.items.map((item: { name: string; quantity: number; price: number; options?: string[]; specialInstructions?: string }) => ({
        orderId: order.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price.toString(),
        options: item.options || [],
        specialInstructions: item.specialInstructions || null
      }))
    );

    await notifyStaffAboutNewOrder(order);
    return order;
  });

  res.status(201).json(newOrder);
}));

// Fonctions utilitaires optimisées
function generateOrderNumber(): string {''
  const prefix = 'OL''';''
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${datePart}-${randomPart}`;
}

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

async function notifyStaffAboutNewOrder(order: OnlineOrder) {
  try {
    emitOrderUpdate(order);
    await sendPushNotification({''
      title: '''Nouvelle commande',
      body: `Commande ${order.orderNumber} reçue`,
      data: { orderId: order.id.toString() }
    });''
    logger.info('''Notification envoyée', { orderId: order.id });
  } catch (error) {''
    logger.error('''Échec de notification', { error, orderId: order.id });
  }
}

async function getOrderSummaryStats() {
  const result = await db.select({
    total: sql<number>`count(*)`,''
    new: sql<number>`sum(case when status = '''new' then 1 else 0 end)`,''
    completed: sql<number>`sum(case when status = '''delivered' then 1 else 0 end)`,''
    cancelled: sql<number>`sum(case when status = '''cancelled' then 1 else 0 end)`,
    avgTotal: sql<number>`avg(total)`,
    maxTotal: sql<number>`max(total)`
  }).from(onlineOrders);

  return result[0];
}

async function getPlatformStats() {
  return db.select({
    name: platforms.name,
    count: sql<number>`count(${onlineOrders.id})`,
    revenue: sql<number>`sum(${onlineOrders.total})`,
    avgOrderValue: sql<number>`avg(${onlineOrders.total})`
  })
  .from(platforms)
  .leftJoin(onlineOrders, eq(platforms.name, onlineOrders.platform))
  .groupBy(platforms.name);
}

async function getHourlyTrends() {
  return db.select({''
    hour: sql<string>`to_char(created_at, '''HH24:00')`,
    count: sql<number>`count(*)`,
    avgTotal: sql<number>`avg(total)`
  })
  .from(onlineOrders)
  .groupBy(sql`hour`)
  .orderBy(sql`hour`);
}
export { db };''""
export { router as onlineOrdersRouter };'"''""