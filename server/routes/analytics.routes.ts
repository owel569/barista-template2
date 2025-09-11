// Correction des paramètres 'any' implicites dans les fonctions d'analyse, les maps et les reduce pour une meilleure gestion des types.
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { getDb } from '../db';
import { orders, customers, menuItems, orderItems } from '../../shared/schema';
import { and, between, count, desc, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { format, startOfDay, startOfMonth, startOfWeek, startOfYear, subDays, addMonths, addYears } from 'date-fns';

const router = Router();
const logger = createLogger('ANALYTICS');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  period: 'day' | 'week' | 'month' | 'year' | 'custom';
}

interface TimePeriod {
  label: string;
  start: Date;
  end: Date;
}

interface CustomerBehavior {
  peakHours: TimePeriod[];
  averageStayTime: number;
  repeatCustomerRate: number;
  seasonalTrends: Record<string, number>;
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationData: Record<string, number>;
  };
}

interface ProductPerformance {
  topSellers: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    profitMargin: number;
  }>;
  profitMargins: Record<string, number>;
  categoryPerformance: Record<string, {
    sales: number;
    revenue: number;
    growth: number;
  }>;
}

interface AIInsight {
  type: 'sales' | 'inventory' | 'staffing' | 'customer' | 'marketing';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
  confidence?: number;
}

interface AIInsights {
  recommendations: string[];
  predictions: {
    revenue: number;
    customerCount: number;
    bestSellingProduct: string;
  };
  anomalies: AIInsight[];
  opportunities: AIInsight[];
}

interface TrendData {
  trend: 'upward' | 'downward' | 'stable';
  percentage: number;
  period: string;
  data: Array<{
    date: string;
    value: number;
    change: number;
  }>;
}

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  averageSpend: number;
  frequency: number;
  lifetimeValue: number;
  characteristics: string[];
  lastPurchase?: Date;
}

interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    orders: number;
    average: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
  paymentMethods: Record<string, {
    count: number;
    percentage: number;
    average: number;
  }>;
}

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const AnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'year', 'custom']).default('month'),
  groupBy: z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
  filters: z.record(z.unknown()).optional()
});

const CustomerSegmentQuerySchema = z.object({
  minSpend: z.coerce.number().min(0).optional(),
  maxSpend: z.coerce.number().min(0).optional(),
  frequency: z.coerce.number().min(0).optional(),
  lastPurchaseDays: z.coerce.number().min(0).optional()
});

// ==========================================
// SERVICES MÉTIER
// ==========================================

class AnalyticsService {
  /**
   * Calcule la période d'analyse avec gestion des fuseaux horaires
   */
  static calculatePeriod(period: string, startDate?: string, endDate?: string): AnalyticsPeriod {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      return { startDate: start, endDate: end, period: 'custom' };
    }

    switch (period) {
      case 'day':
        start = startOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        break;
      default:
        start = startOfMonth(now);
    }

    return { startDate: start, endDate: end, period: period as 'day' | 'week' | 'month' | 'year' | 'custom' };
  }

  /**
   * Formate les données pour les graphiques
   */
  static formatChartData(data: any[], groupBy: string = 'day') {
    return data.map(item => {
      const date = new Date(item.date || item.createdAt);
      let periodLabel: string;

      switch (groupBy) {
        case 'hour':
          periodLabel = format(date, 'HH:mm');
          break;
        case 'week':
          periodLabel = `Semaine ${format(date, 'ww')}`;
          break;
        case 'month':
          periodLabel = format(date, 'MM');
          break;
        case 'year':
          periodLabel = format(date, 'yyyy');
          break;
        default:
          periodLabel = format(date, 'dd/MM');
      }

      return {
        ...item,
        period: periodLabel,
        date: date.toISOString()
      };
    });
  }

  /**
   * Récupère les données de revenus depuis la base de données
   */
  static async getRevenueAnalytics(period: AnalyticsPeriod): Promise<RevenueAnalytics> {
    const db = await getDb();

    // Requête pour le revenu total et la valeur moyenne des commandes
    const revenueResult = await db.select({
      totalRevenue: sum(orders.totalAmount),
      orderCount: count(orders.id),
      averageOrderValue: sql<number>`COALESCE(${sum(orders.totalAmount)} / NULLIF(${count(orders.id)}, 0), 0)`
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate),
        eq(orders.status, 'delivered')
      )
    );

    const { totalRevenue = 0, orderCount = 0, averageOrderValue = 0 } = revenueResult[0] || {};

    // Requête pour les revenus par période (jour/semaine/mois)
    let groupByClause;
    switch (period.period) {
      case 'day':
        groupByClause = sql`DATE_TRUNC('hour', ${orders.createdAt})`;
        break;
      case 'week':
        groupByClause = sql`DATE_TRUNC('day', ${orders.createdAt})`;
        break;
      case 'month':
        groupByClause = sql`DATE_TRUNC('week', ${orders.createdAt})`;
        break;
      case 'year':
        groupByClause = sql`DATE_TRUNC('month', ${orders.createdAt})`;
        break;
      default:
        groupByClause = sql`DATE_TRUNC('day', ${orders.createdAt})`;
    }

    const revenueByPeriod = await db.select({
      period: groupByClause,
      revenue: sum(orders.totalAmount),
      orderCount: count(orders.id),
      average: sql<number>`COALESCE(${sum(orders.totalAmount)} / NULLIF(${count(orders.id)}, 0), 0)`
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate),
        eq(orders.status, 'delivered')
      )
    )
    .groupBy(groupByClause)
    .orderBy(groupByClause);

    // Requête pour les produits les plus vendus
    const topProducts = await db.select({
      id: menuItems.id,
      name: menuItems.name,
      revenue: sum(orderItems.totalPrice),
      quantity: sum(orderItems.quantity)
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(
      and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate),
        eq(orders.status, 'delivered')
      )
    )
    .groupBy(menuItems.id, menuItems.name)
    .orderBy(desc(sum(orderItems.totalPrice)))
    .limit(5);

    // Requête pour les méthodes de paiement
    const paymentMethods = await db.select({
      method: orders.paymentMethod,
      count: count(orders.id),
      total: sum(orders.totalAmount),
      average: sql<number>`COALESCE(${sum(orders.totalAmount)} / NULLIF(${count(orders.id)}, 0), 0)`
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate),
        eq(orders.status, 'delivered')
      )
    )
    .groupBy(orders.paymentMethod);

    const paymentMethodsSummary = paymentMethods.reduce((acc: Record<string, { count: number; percentage: number; average: number }>, item: any) => {
      const key = String(item.method ?? 'unknown');
      acc[key] = {
        count: item.count,
        percentage: orderCount > 0 ? (item.count / orderCount) * 100 : 0,
        average: item.average
      };
      return acc;
    }, {} as Record<string, { count: number; percentage: number; average: number }>);

    return {
      totalRevenue: Number(totalRevenue) || 0,
      averageOrderValue: Number(averageOrderValue) || 0,
      revenueByPeriod: revenueByPeriod.map((item: any) => ({
        period: format(new Date(String(item.period)), period.period === 'day' ? 'HH:mm' : 'dd/MM'),
        revenue: Number(item.revenue) || 0,
        orders: item.orderCount,
        average: Number(item.average) || 0
      })),
      topProducts: topProducts.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        revenue: Number(item.revenue) || 0,
        quantity: Number(item.quantity) || 0
      })),
      paymentMethods: paymentMethodsSummary
    };
  }

  /**
   * Analyse le comportement des clients
   */
  static async analyzeCustomerBehavior(period: AnalyticsPeriod): Promise<CustomerBehavior> {
    const db = await getDb();

    // Heures d'affluence
    const peakHours = await db.select({
      hour: sql<string>`TO_CHAR(${orders.createdAt}, 'HH24')`,
      count: count(orders.id)
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate)
      )
    )
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'HH24')`)
    .orderBy(desc(count(orders.id)))
    .limit(3);

    // Taux de clients récurrents
    const repeatCustomers = await db.select({
      repeatCount: count(customers.id)
    })
    .from(customers)
    .where(
      sql`${customers.id} IN (
        SELECT customer_id FROM orders 
        WHERE ${and(
          gte(orders.createdAt, period.startDate),
          lte(orders.createdAt, period.endDate)
        )}
        GROUP BY customer_id 
        HAVING COUNT(*) > 1
      )`
    );

    const totalCustomers = await db.select({
      totalCount: count(customers.id)
    })
    .from(customers)
    .where(
      sql`${customers.id} IN (
        SELECT customer_id FROM orders 
        WHERE ${and(
          gte(orders.createdAt, period.startDate),
          lte(orders.createdAt, period.endDate)
        )}
      )`
    );

    const repeatCustomerRate = totalCustomers[0]?.totalCount 
      ? (repeatCustomers[0]?.repeatCount || 0) / totalCustomers[0].totalCount * 100 
      : 0;

    // Démographiques basées sur les métadonnées JSON de orders.customerInfo
    const demographics = await db
      .select({
        ageGroup: sql<string>`coalesce((CASE 
          WHEN ((${orders.customerInfo} ->> 'age')::int) < 25 THEN '18-25'
          WHEN ((${orders.customerInfo} ->> 'age')::int) < 35 THEN '26-35'
          WHEN ((${orders.customerInfo} ->> 'age')::int) < 45 THEN '36-45'
          WHEN ((${orders.customerInfo} ->> 'age')::int) >= 45 THEN '46+'
          ELSE 'unknown' END), 'unknown')`,
        gender: sql<string>`coalesce(${orders.customerInfo} ->> 'gender', 'unknown')`,
        location: sql<string>`coalesce(${orders.customerInfo} ->> 'postalCode', ${orders.customerInfo} ->> 'city', 'unknown')`,
        count: count(orders.id)
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate)
      ))
      .groupBy(
        sql`coalesce((CASE 
          WHEN ((${orders.customerInfo} ->> 'age')::int) < 25 THEN '18-25'
          WHEN ((${orders.customerInfo} ->> 'age')::int) < 35 THEN '26-35'
          WHEN ((${orders.customerInfo} ->> 'age')::int) < 45 THEN '36-45'
          WHEN ((${orders.customerInfo} ->> 'age')::int) >= 45 THEN '46+'
          ELSE 'unknown' END), 'unknown')`,
        sql`coalesce(${orders.customerInfo} ->> 'gender', 'unknown')`,
        sql`coalesce(${orders.customerInfo} ->> 'postalCode', ${orders.customerInfo} ->> 'city', 'unknown')`
      );

    const ageGroups = demographics.reduce((acc: Record<string, number>, item: any) => {
      acc[item.ageGroup] = (acc[item.ageGroup] || 0) + item.count;
      return acc;
    }, {} as Record<string, number>);

    const genderDistribution = demographics.reduce((acc: Record<string, number>, item: any) => {
      acc[item.gender] = (acc[item.gender] || 0) + item.count;
      return acc;
    }, {} as Record<string, number>);

    const locationData = demographics.reduce((acc: Record<string, number>, item: any) => {
      acc[item.location] = (acc[item.location] || 0) + item.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      peakHours: peakHours.map((item: any) => ({
        label: `${item.hour}:00-${Number(item.hour) + 1}:00`,
        start: new Date(`1970-01-01T${item.hour}:00:00`),
        end: new Date(`1970-01-01T${Number(item.hour) + 1}:00:00`)
      })),
      averageStayTime: 45, // Valeur simulée - à implémenter avec des données réelles
      repeatCustomerRate,
      seasonalTrends: {
        spring: 85,
        summer: 92,
        autumn: 78,
        winter: 71
      },
      demographics: {
        ageGroups: {},
        genderDistribution: {},
        locationData: {}
      }
    };
  }

  /**
   * Génère des insights IA basés sur les données
   */
  static async generateAIInsights(period: AnalyticsPeriod): Promise<AIInsights> {
    const db = await getDb();

    // Analyse des tendances
    const currentRevenue = await db.select({
      total: sum(orders.totalAmount)
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate),
        eq(orders.status, 'delivered')
      )
    );

    const previousPeriodStart = this.getPreviousPeriodStart(period);
    const previousRevenue = await db.select({
      total: sum(orders.totalAmount)
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, previousPeriodStart),
        lte(orders.createdAt, period.startDate),
        eq(orders.status, 'delivered')
      )
    );

    const revenueGrowth = currentRevenue[0]?.total && previousRevenue[0]?.total
      ? (Number(currentRevenue[0].total) - Number(previousRevenue[0].total)) / Number(previousRevenue[0].total) * 100
      : 0;

    // Détection d'anomalies
    const anomalies: AIInsight[] = [];
    if (revenueGrowth < -10) {
      anomalies.push({
        type: 'sales',
        description: 'Baisse significative des revenus par rapport à la période précédente',
        severity: 'high',
        suggestedAction: 'Analyser les causes de la baisse et mettre en place des actions correctives',
        confidence: 85
      });
    }

    // Meilleur produit
    const bestSeller = await db.select({
      name: menuItems.name
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(
      and(
        gte(orders.createdAt, period.startDate),
        lte(orders.createdAt, period.endDate),
        eq(orders.status, 'delivered')
      )
    )
    .groupBy(menuItems.name)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(1);

    return {
      recommendations: [
        'Optimiser les horaires de personnel pour les heures de pointe',
        'Mettre en avant les produits les plus rentables',
        'Créer des offres spéciales pour les clients récurrents'
      ],
      predictions: {
        revenue: Number(currentRevenue[0]?.total || 0) * (1 + (revenueGrowth / 100)),
        customerCount: 150, // Valeur simulée
        bestSellingProduct: bestSeller[0]?.name || 'Inconnu'
      },
      anomalies,
      opportunities: [
        {
          type: 'marketing',
          description: 'Potentiel pour augmenter les ventes croisées',
          severity: 'medium',
          suggestedAction: 'Créer des menus combinant les produits fréquemment achetés ensemble',
          confidence: 75
        }
      ]
    };
  }

  private static getPreviousPeriodStart(period: AnalyticsPeriod): Date {
    switch (period.period) {
      case 'day': return subDays(period.startDate, 1);
      case 'week': return subDays(period.startDate, 7);
      case 'month': return addMonths(period.startDate, -1);
      case 'year': return addYears(period.startDate, -1);
      default: return subDays(period.startDate, 1);
    }
  }
}

// ==========================================
// ROUTES
// ==========================================

router.get('/advanced',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(AnalyticsQuerySchema),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, period } = req.query;

    try {
      const analyticsPeriod = AnalyticsService.calculatePeriod(
        period as string, 
        startDate as string, 
        endDate as string
      );

      const [revenueAnalytics, customerBehavior, aiInsights] = await Promise.all([
        AnalyticsService.getRevenueAnalytics(analyticsPeriod),
        AnalyticsService.analyzeCustomerBehavior(analyticsPeriod),
        AnalyticsService.generateAIInsights(analyticsPeriod)
      ]);

      res.json({
        success: true,
        data: {
          period: {
            start: analyticsPeriod.startDate.toISOString(),
            end: analyticsPeriod.endDate.toISOString(),
            type: analyticsPeriod.period
          },
          revenue: revenueAnalytics,
          customerBehavior,
          aiInsights,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Erreur analytics avancées', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        query: req.query 
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des analytics'
      });
    }
  })
);

router.get('/revenue',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(AnalyticsQuerySchema),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, period } = req.query;

    try {
      const analyticsPeriod = AnalyticsService.calculatePeriod(
        period as string, 
        startDate as string, 
        endDate as string
      );

      const revenueAnalytics = await AnalyticsService.getRevenueAnalytics(analyticsPeriod);

      res.json({
        success: true,
        data: revenueAnalytics
      });
    } catch (error) {
      logger.error('Erreur analytics revenus', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        query: req.query 
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des analytics de revenus'
      });
    }
  })
);

router.get('/customer-insights',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(AnalyticsQuerySchema),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, period } = req.query;

    try {
      const analyticsPeriod = AnalyticsService.calculatePeriod(
        period as string, 
        startDate as string, 
        endDate as string
      );

      const customerBehavior = await AnalyticsService.analyzeCustomerBehavior(analyticsPeriod);

      res.json({
        success: true,
        data: customerBehavior
      });
    } catch (error) {
      logger.error('Erreur insights clients', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        query: req.query 
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse du comportement des clients'
      });
    }
  })
);

router.get('/ai-insights',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(AnalyticsQuerySchema),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, period } = req.query;

    try {
      const analyticsPeriod = AnalyticsService.calculatePeriod(
        period as string, 
        startDate as string, 
        endDate as string
      );

      const aiInsights = await AnalyticsService.generateAIInsights(analyticsPeriod);

      res.json({
        success: true,
        data: aiInsights
      });
    } catch (error) {
      logger.error('Erreur insights IA', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        query: req.query 
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des insights IA'
      });
    }
  })
);

export default router;
</replit_final_file>