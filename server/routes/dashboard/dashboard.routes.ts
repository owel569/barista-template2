
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateQuery, commonSchemas } from '../../middleware/validation';
import { getDb } from '../../db';
import { 
  orders, 
  orderItems, 
  menuItems, 
  menuCategories,
  customers, 
  users, 
  reservations,
  tables,
  loyaltyTransactions 
} from '../../../shared/schema';
import { eq, and, desc, sql, gte, lte, count } from 'drizzle-orm';
import { cacheMiddleware } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('DASHBOARD_ROUTES');

// Schémas de validation
const DashboardQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']).default('today'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Fonction utilitaire pour obtenir les dates selon la période
function getDateRange(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  switch (period) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = startDate ? new Date(startDate) : new Date(now);
      end = endDate ? new Date(endDate) : new Date(now);
  }

  return { start, end };
}

// Vue d'ensemble du tableau de bord
router.get('/overview',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(DashboardQuerySchema),
  cacheMiddleware({ ttl: 2 * 60 * 1000, tags: ['dashboard', 'stats'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { period, startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Statistiques des commandes
    const orderStats = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end)
      ))
      .groupBy(orders.status);

    // Statistiques générales
    const [generalStats] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        averageOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)`
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end)
      ));

    // Nouveaux clients
    const [newCustomersCount] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(customers)
      .where(and(
        gte(customers.createdAt, start),
        lte(customers.createdAt, end)
      ));

    // Réservations du jour (si période = today)
    let reservationStats = null;
    if (period === 'today') {
      reservationStats = await db
        .select({
          status: reservations.status,
          count: sql<number>`count(*)`
        })
        .from(reservations)
        .where(and(
          gte(reservations.date, start),
          lte(reservations.date, end)
        ))
        .groupBy(reservations.status);
    }

    // Articles les plus vendus
    const topProducts = await db
      .select({
        menuItemId: orderItems.menuItemId,
        menuItemName: menuItems.name,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
        totalRevenue: sql<number>`sum(${orderItems.totalPrice})`
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end)
      ))
      .groupBy(orderItems.menuItemId, menuItems.name)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5);

    // Catégories les plus populaires
    const topCategories = await db
      .select({
        categoryId: menuItems.categoryId,
        categoryName: menuCategories.name,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
        totalRevenue: sql<number>`sum(${orderItems.totalPrice})`
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end)
      ))
      .groupBy(menuItems.categoryId, menuCategories.name)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5);

    const result = {
      period,
      dateRange: { start, end },
      overview: {
        totalOrders: generalStats?.totalOrders || 0,
        totalRevenue: generalStats?.totalRevenue || 0,
        averageOrderValue: Math.round((generalStats?.averageOrderValue || 0) * 100) / 100,
        newCustomers: newCustomersCount?.count || 0
      },
      orders: {
        byStatus: orderStats,
        total: orderStats.reduce((sum, stat) => sum + stat.count, 0)
      },
      reservations: reservationStats,
      topProducts,
      topCategories
    };

    logger.info('Vue d\'ensemble tableau de bord récupérée', { 
      period, 
      totalOrders: result.overview.totalOrders,
      totalRevenue: result.overview.totalRevenue 
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// Données en temps réel
router.get('/realtime',
  authenticateUser,
  requireRoles(['admin', 'manager', 'staff']),
  cacheMiddleware({ ttl: 30 * 1000, tags: ['dashboard', 'realtime'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Commandes en cours
    const activeOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        orderType: orders.orderType,
        total: orders.total,
        createdAt: orders.createdAt,
        tableNumber: tables.number,
        customerName: sql<string>`coalesce(${customers.firstName} || ' ' || ${customers.lastName}, ${orders.customerInfo}->>'name')`
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .where(and(
        gte(orders.createdAt, today),
        sql`${orders.status} IN ('pending', 'confirmed', 'preparing', 'ready')`
      ))
      .orderBy(orders.createdAt)
      .limit(20);

    // Réservations du jour
    const todayReservations = await db
      .select({
        id: reservations.id,
        time: reservations.time,
        partySize: reservations.partySize,
        status: reservations.status,
        tableNumber: tables.number,
        customerName: sql<string>`coalesce(${customers.firstName} || ' ' || ${customers.lastName}, ${reservations.contactPhone})`
      })
      .from(reservations)
      .leftJoin(customers, eq(reservations.customerId, customers.id))
      .leftJoin(tables, eq(reservations.tableId, tables.id))
      .where(eq(reservations.date, today))
      .orderBy(reservations.time);

    // Tables occupées
    const occupiedTables = await db
      .select({
        id: tables.id,
        number: tables.number,
        capacity: tables.capacity,
        status: tables.status,
        currentOrderId: orders.id
      })
      .from(tables)
      .leftJoin(orders, and(
        eq(orders.tableId, tables.id),
        sql`${orders.status} IN ('confirmed', 'preparing', 'ready', 'served')`
      ))
      .where(sql`${tables.status} = 'occupied' OR ${orders.id} IS NOT NULL`);

    // Métriques de performance en temps réel
    const [performanceMetrics] = await db
      .select({
        ordersToday: sql<number>`count(case when ${orders.createdAt} >= ${today} then 1 end)`,
        revenueToday: sql<number>`coalesce(sum(case when ${orders.createdAt} >= ${today} then ${orders.total} end), 0)`,
        avgPreparationTime: sql<number>`coalesce(avg(extract(epoch from ${orders.updatedAt} - ${orders.createdAt})), 0)`
      })
      .from(orders)
      .where(gte(orders.createdAt, today));

    const result = {
      timestamp: new Date().toISOString(),
      activeOrders,
      todayReservations,
      occupiedTables,
      metrics: {
        ordersToday: performanceMetrics?.ordersToday || 0,
        revenueToday: performanceMetrics?.revenueToday || 0,
        avgPreparationTime: Math.round((performanceMetrics?.avgPreparationTime || 0) / 60), // en minutes
        activeOrdersCount: activeOrders.length,
        occupiedTablesCount: occupiedTables.length
      }
    };

    logger.info('Données temps réel récupérées', { 
      activeOrders: result.activeOrders.length,
      todayReservations: result.todayReservations.length,
      occupiedTables: result.occupiedTables.length 
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// Graphiques de revenus
router.get('/revenue-chart',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(DashboardQuerySchema),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['dashboard', 'revenue'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { period, startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    // Déterminer le format de groupement selon la période
    let dateFormat: string;
    let dateLabel: string;
    
    switch (period) {
      case 'today':
        dateFormat = 'HH24:MI';
        dateLabel = 'hour';
        break;
      case 'week':
        dateFormat = 'YYYY-MM-DD';
        dateLabel = 'day';
        break;
      case 'month':
        dateFormat = 'YYYY-MM-DD';
        dateLabel = 'day';
        break;
      case 'year':
        dateFormat = 'YYYY-MM';
        dateLabel = 'month';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        dateLabel = 'day';
    }

    const revenueData = await db
      .select({
        period: sql<string>`to_char(${orders.createdAt}, '${dateFormat}')`,
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        orderCount: sql<number>`count(*)`
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end),
        sql`${orders.status} != 'cancelled'`
      ))
      .groupBy(sql`to_char(${orders.createdAt}, '${dateFormat}')`)
      .orderBy(sql`to_char(${orders.createdAt}, '${dateFormat}')`);

    const result = {
      period,
      dateRange: { start, end },
      dateLabel,
      data: revenueData,
      summary: {
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: revenueData.reduce((sum, item) => sum + item.orderCount, 0),
        averageRevenuePerPeriod: revenueData.length > 0 ? 
          revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length : 0
      }
    };

    logger.info('Graphique de revenus récupéré', { 
      period, 
      dataPoints: revenueData.length,
      totalRevenue: result.summary.totalRevenue 
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// Alertes et notifications
router.get('/alerts',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  cacheMiddleware({ ttl: 1 * 60 * 1000, tags: ['dashboard', 'alerts'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const alerts = [];

    // Commandes en attente depuis plus de 30 minutes
    const pendingOrders = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        total: orders.total
      })
      .from(orders)
      .where(and(
        eq(orders.status, 'pending'),
        sql`${orders.createdAt} < NOW() - INTERVAL '30 minutes'`
      ));

    if (pendingOrders.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'orders',
        title: 'Commandes en attente',
        message: `${pendingOrders.length} commande(s) en attente depuis plus de 30 minutes`,
        data: pendingOrders,
        priority: 'high'
      });
    }

    // Réservations sans confirmation
    const unconfirmedReservations = await db
      .select({
        id: reservations.id,
        date: reservations.date,
        time: reservations.time,
        partySize: reservations.partySize
      })
      .from(reservations)
      .where(and(
        eq(reservations.status, 'pending'),
        gte(reservations.date, new Date())
      ));

    if (unconfirmedReservations.length > 0) {
      alerts.push({
        type: 'info',
        category: 'reservations',
        title: 'Réservations à confirmer',
        message: `${unconfirmedReservations.length} réservation(s) en attente de confirmation`,
        data: unconfirmedReservations,
        priority: 'medium'
      });
    }

    // Vérifier le pic d'activité (plus de 10 commandes dans l'heure)
    const [hourlyOrders] = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= NOW() - INTERVAL '1 hour'`);

    if (hourlyOrders && hourlyOrders.count > 10) {
      alerts.push({
        type: 'success',
        category: 'performance',
        title: 'Pic d\'activité',
        message: `${hourlyOrders.count} commandes dans la dernière heure`,
        data: { count: hourlyOrders.count },
        priority: 'low'
      });
    }

    const result = {
      timestamp: new Date().toISOString(),
      alerts,
      summary: {
        total: alerts.length,
        byPriority: {
          high: alerts.filter(a => a.priority === 'high').length,
          medium: alerts.filter(a => a.priority === 'medium').length,
          low: alerts.filter(a => a.priority === 'low').length
        },
        byCategory: alerts.reduce((acc, alert) => {
          acc[alert.category] = (acc[alert.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    logger.info('Alertes récupérées', { 
      totalAlerts: alerts.length,
      categories: Object.keys(result.summary.byCategory) 
    });

    res.json({
      success: true,
      data: result
    });
  })
);

export default router;
```
