import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler-enhanced';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/error-handler-enhanced';
import { getDb } from '../db';
import { orders, menuItems, customers, reservations } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql, count, sum, avg } from 'drizzle-orm';

const router = Router();
const logger = createLogger('ANALYTICS');

// Schémas de validation
const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  limit: z.coerce.number().min(1).max(100).default(50)
});

const kpiQuerySchema = z.object({
  period: z.enum(['today', 'yesterday', 'week', 'month', 'year']).default('month'),
  compare: z.boolean().default(false)
});

// ==========================================
// ROUTES PUBLIQUES (Admin/Manager uniquement)
// ==========================================

/**
 * Récupère les KPIs principaux
 * GET /api/analytics/kpis
 */
router.get('/kpis',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateRequest(kpiQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const validatedQuery = kpiQuerySchema.parse(req.query);
    const { period, compare } = validatedQuery;
    const db = await getDb();

    // Calcul des dates selon la période
    const now = new Date();
    const periods = getPeriodDates(period, now);

    try {
      // KPIs principaux
      const [
        revenueData,
        ordersData,
        customersData,
        averageOrderData
      ] = await Promise.all([
        // Revenus totaux
        db.select({
          total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
          count: sql<number>`COUNT(*)`
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, periods.start),
          lte(orders.createdAt, periods.end)
        )),

        // Nombre de commandes
        db.select({
          count: sql<number>`COUNT(*)`,
          delivered: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`,
          pending: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`,
          cancelled: sql<number>`COUNT(CASE WHEN ${orders.status} = 'cancelled' THEN 1 END)`
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, periods.start),
          lte(orders.createdAt, periods.end)
        )),

        // Nouveaux clients
        db.select({
          count: sql<number>`COUNT(*)`
        })
        .from(customers)
        .where(and(
          gte(customers.createdAt, periods.start),
          lte(customers.createdAt, periods.end)
        )),

        // Panier moyen
        db.select({
          average: sql<number>`COALESCE(AVG(${orders.total}), 0)`
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, periods.start),
          lte(orders.createdAt, periods.end),
          eq(orders.status, 'delivered')
        ))
      ]);

      let comparisonData = null;
      if (compare) {
        const previousPeriods = getPreviousPeriodDates(period, periods.start);
        // Implémentation de la comparaison avec la période précédente
        comparisonData = await getPreviousPeriodKpis(db, previousPeriods);
      }

      const kpis = {
        revenue: {
          current: revenueData[0]?.total || 0,
          previous: comparisonData?.revenue || 0,
          growth: calculateGrowth(revenueData[0]?.total || 0, comparisonData?.revenue || 0)
        },
        orders: {
          total: ordersData[0]?.count || 0,
          delivered: ordersData[0]?.delivered || 0,
          pending: ordersData[0]?.pending || 0,
          cancelled: ordersData[0]?.cancelled || 0,
          completionRate: calculateCompletionRate(ordersData[0])
        },
        customers: {
          new: customersData[0]?.count || 0,
          growth: comparisonData ? calculateGrowth(
            customersData[0]?.count || 0,
            comparisonData.newCustomers || 0
          ) : 0
        },
        averageOrder: {
          current: Math.round((averageOrderData[0]?.average || 0) * 100) / 100,
          previous: comparisonData?.averageOrder || 0,
          growth: calculateGrowth(
            averageOrderData[0]?.average || 0,
            comparisonData?.averageOrder || 0
          )
        },
        period: {
          name: period,
          start: periods.start,
          end: periods.end
        }
      };

      logger.info('KPIs récupérés avec succès', {
        userId: req.user!.id,
        period,
        compare,
        revenue: kpis.revenue.current
      });

      res.json({
        success: true,
        data: kpis
      });

    } catch (error) {
      logger.error('Erreur récupération KPIs', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        userId: req.user!.id
      });
      throw error;
    }
  })
);

/**
 * Récupère les données de revenus par période
 * GET /api/analytics/revenue
 */
router.get('/revenue',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateRequest(analyticsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const { startDate, endDate, period } = validatedQuery;
    const db = await getDb();

    const dates = getDateRange(startDate, endDate, period);

    try {
      const revenueData = await db.select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        orderCount: sql<number>`COUNT(*)`
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, dates.start),
        lte(orders.createdAt, dates.end),
        eq(orders.status, 'delivered')
      ))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

      logger.info('Données de revenus récupérées', {
        userId: req.user!.id,
        period,
        recordCount: revenueData.length
      });

      res.json({
        success: true,
        data: {
          revenue: revenueData,
          summary: {
            totalRevenue: revenueData.reduce((sum: number, item: any) => sum + item.revenue, 0),
            totalOrders: revenueData.reduce((sum: number, item: any) => sum + item.orderCount, 0),
            averageOrderValue: revenueData.length > 0
              ? revenueData.reduce((sum: number, item: any) => sum + item.revenue, 0) / revenueData.length
              : 0
          }
        }
      });

    } catch (error) {
      logger.error('Erreur récupération revenus', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        userId: req.user!.id
      });
      throw error;
    }
  })
);

/**
 * Récupère les produits les plus vendus
 * GET /api/analytics/top-products
 */
router.get('/top-products',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateRequest(analyticsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const validatedQuery = analyticsQuerySchema.parse(req.query);
    const { startDate, endDate, limit } = validatedQuery;
    const db = await getDb();

    const dates = getDateRange(startDate, endDate);

    try {
      // Note: Cette requête nécessiterait une table orderItems pour être complète
      // Pour l'instant, nous simulons avec les données disponibles
      const topProducts = await db.select({
        itemId: menuItems.id,
        name: menuItems.name,
        categoryId: menuItems.categoryId,
        price: menuItems.price,
        // Ces champs nécessiteraient une table orderItems
        totalSold: sql<number>`COALESCE(COUNT(*), 0)`,
        revenue: sql<number>`COALESCE(SUM(${menuItems.price}), 0)`
      })
      .from(menuItems)
      // .leftJoin(orderItems, eq(menuItems.id, orderItems.menuItemId))
      // .leftJoin(orders, eq(orderItems.orderId, orders.id))
      // .where(and(
      //   gte(orders.createdAt, dates.start),
      //   lte(orders.createdAt, dates.end),
      //   eq(orders.status, 'completed')
      // ))
      .groupBy(menuItems.id)
      .orderBy(desc(sql`revenue`))
      .limit(limit || 10);

      res.json({
        success: true,
        data: topProducts
      });

    } catch (error) {
      logger.error('Erreur récupération top produits', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        userId: req.user!.id
      });
      throw error;
    }
  })
);

// ==========================================
// UTILITAIRES
// ==========================================

function getPeriodDates(period: string, referenceDate: Date = new Date()) {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

function getPreviousPeriodDates(period: string, currentStart: Date) {
  const diff = new Date().getTime() - currentStart.getTime();
  return {
    start: new Date(currentStart.getTime() - diff),
    end: new Date(currentStart.getTime() - 1)
  };
}

function getDateRange(startDate?: string, endDate?: string, period: string = 'month') {
  if (startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate)
    };
  }

  return getPeriodDates(period);
}

async function getPreviousPeriodKpis(db: any, periods: { start: Date; end: Date }) {
  // Implémentation simplifiée pour l'exemple
  return {
    revenue: 0,
    newCustomers: 0,
    averageOrder: 0
  };
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function calculateCompletionRate(ordersData: any): number {
  const total = ordersData?.count || 0;
  const delivered = ordersData?.delivered || 0;
  return total > 0 ? Math.round((delivered / total) * 100) : 0;
}

export default router;