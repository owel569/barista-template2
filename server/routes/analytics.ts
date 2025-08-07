/**
 * Routes Analytics - Logique métier professionnelle et sécurisée
 * Optimisé pour la longévité du système
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateRequestWithLogging } from '../middleware/logging';

const router = Router();

// ==========================================
// TYPES ET INTERFACES
// ==========================================

export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface CustomerBehavior {
  customerId: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastVisit: string;
  favoriteItems: string[];
}

export interface ProductPerformance {
  productId: number;
  name: string;
  quantitySold: number;
  revenue: number;
  profitMargin: number;
  popularity: number;
}

export interface AIInsights {
  type: 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CustomerSegment {
  segment: string;
  count: number;
  averageValue: number;
  retentionRate: number;
  characteristics: string[];
}

// ==========================================
// SCHÉMAS DE VALIDATION
// ==========================================

const PeriodQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const CustomerIdParamSchema = z.object({
  customerId: z.string().regex(/^\d+$/, 'ID client doit être un nombre')
});

const ProductIdParamSchema = z.object({
  productId: z.string().regex(/^\d+$/, 'ID produit doit être un nombre')
});

// ==========================================
// SERVICES MÉTIER
// ==========================================

class AnalyticsService {
  /**
   * Calcule les revenus pour une période donnée
   */
  static async calculateRevenue(period: AnalyticsPeriod): Promise<RevenueData[]> {
    // Simulation de données pour le développement
    const mockData: RevenueData[] = [
      {
        date: '2024-01-01',
        revenue: 1250.50,
        orders: 45,
        averageOrderValue: 27.79
      },
      {
        date: '2024-01-02',
        revenue: 1380.75,
        orders: 52,
        averageOrderValue: 26.55
      },
      {
        date: '2024-01-03',
        revenue: 1150.25,
        orders: 41,
        averageOrderValue: 28.05
      }
    ];

    return mockData;
  }

  /**
   * Analyse le comportement d'un client
   */
  static async analyzeCustomerBehavior(customerId: number): Promise<CustomerBehavior> {
    // Simulation de données pour le développement
    return {
      customerId,
      totalOrders: 15,
      totalSpent: 450.75,
      averageOrderValue: 30.05,
      lastVisit: new Date().toISOString(),
      favoriteItems: ['Cappuccino', 'Croissant', 'Espresso']
    };
  }

  /**
   * Génère des insights IA basés sur les données
   */
  static async generateAIInsights(): Promise<AIInsights[]> {
    // Simulation d'insights IA basés sur des règles métier
    return [
      {
        type: 'trend',
        title: 'Augmentation des commandes en ligne',
        description: 'Les commandes en ligne ont augmenté de 25% ce mois-ci',
        confidence: 0.85,
        impact: 'high',
        actionable: true
      },
      {
        type: 'recommendation',
        title: 'Optimisation des stocks',
        description: 'Réduire le stock de thé vert de 20%',
        confidence: 0.92,
        impact: 'medium',
        actionable: true
      },
      {
        type: 'anomaly',
        title: 'Baisse inattendue des ventes',
        description: 'Diminution de 15% des ventes de café le weekend',
        confidence: 0.78,
        impact: 'high',
        actionable: true
      }
    ];
  }

  /**
   * Analyse les performances des produits
   */
  static async analyzeProductPerformance(): Promise<ProductPerformance[]> {
    // Simulation de données pour le développement
    return [
      {
        productId: 1,
        name: 'Cappuccino',
        quantitySold: 150,
        revenue: 525.00,
        profitMargin: 0.65,
        popularity: 0.85
      },
      {
        productId: 2,
        name: 'Espresso',
        quantitySold: 120,
        revenue: 360.00,
        profitMargin: 0.70,
        popularity: 0.75
      },
      {
        productId: 3,
        name: 'Croissant',
        quantitySold: 200,
        revenue: 400.00,
        profitMargin: 0.55,
        popularity: 0.90
      }
    ];
  }

  /**
   * Analyse les segments de clients
   */
  static async analyzeCustomerSegments(): Promise<CustomerSegment[]> {
    // Simulation de données pour le développement
    return [
      {
        segment: 'Clients Premium',
        count: 45,
        averageValue: 85.50,
        retentionRate: 0.92,
        characteristics: ['Fréquence élevée', 'Valeur moyenne élevée', 'Fidélité']
      },
      {
        segment: 'Clients Réguliers',
        count: 120,
        averageValue: 35.25,
        retentionRate: 0.78,
        characteristics: ['Visites régulières', 'Valeur moyenne', 'Satisfaction élevée']
      },
      {
        segment: 'Clients Occasionnels',
        count: 85,
        averageValue: 18.75,
        retentionRate: 0.45,
        characteristics: ['Visites irrégulières', 'Valeur faible', 'Potentiel de conversion']
      }
    ];
  }
}

// ==========================================
// ROUTES API
// ==========================================

/**
 * GET /api/analytics/revenue
 * Récupère les données de revenus pour une période donnée
 */
router.get('/revenue', 
  validateRequestWithLogging(PeriodQuerySchema, 'query'),
  async (req, res) => {
    try {
      const { period, startDate, endDate } = req.query as z.infer<typeof PeriodQuerySchema>;
      
      // Calculer la période si non fournie
      const now = new Date();
      const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate ? new Date(endDate) : now;

      const analyticsPeriod: AnalyticsPeriod = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        period: period || 'month'
      };

      const revenueData = await AnalyticsService.calculateRevenue(analyticsPeriod);

    res.json({
      success: true,
        data: revenueData,
        period: analyticsPeriod
    });
  } catch (error) {
      console.error('Erreur lors du calcul des revenus:', error);
    res.status(500).json({
      success: false,
        message: 'Erreur lors du calcul des revenus'
      });
    }
  }
);

/**
 * GET /api/analytics/customer/:customerId/behavior
 * Analyse le comportement d'un client spécifique
 */
router.get('/customer/:customerId/behavior',
  validateRequestWithLogging(CustomerIdParamSchema, 'params'),
  async (req, res) => {
    try {
      const { customerId } = req.params as z.infer<typeof CustomerIdParamSchema>;
      const customerBehavior = await AnalyticsService.analyzeCustomerBehavior(parseInt(customerId));

    res.json({
        success: true,
        data: customerBehavior
    });
  } catch (error) {
      console.error('Erreur lors de l\'analyse du comportement client:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'analyse du comportement client' 
      });
    }
  }
);

/**
 * GET /api/analytics/insights
 * Génère des insights IA basés sur les données
 */
router.get('/insights', async (req, res) => {
  try {
    const insights = await AnalyticsService.generateAIInsights();

    res.json({
        success: true,
      data: insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la génération des insights:', error);
      res.status(500).json({ 
        success: false,
      message: 'Erreur lors de la génération des insights'
    });
  }
});

/**
 * GET /api/analytics/products/performance
 * Analyse les performances des produits
 */
router.get('/products/performance', async (req, res) => {
    try {
    const productPerformance = await AnalyticsService.analyzeProductPerformance();

      res.json({
        success: true,
      data: productPerformance
      });
  } catch (error) {
    console.error('Erreur lors de l\'analyse des performances produits:', error);
      res.status(500).json({ 
        success: false,
      message: 'Erreur lors de l\'analyse des performances produits'
      });
    }
});

/**
 * GET /api/analytics/customers/segments
 * Analyse les segments de clients
 */
router.get('/customers/segments', async (req, res) => {
    try {
    const customerSegments = await AnalyticsService.analyzeCustomerSegments();

      res.json({
        success: true,
      data: customerSegments
      });
    } catch (error) {
    console.error('Erreur lors de l\'analyse des segments clients:', error);
      res.status(500).json({ 
        success: false,
      message: 'Erreur lors de l\'analyse des segments clients'
      });
    }
});

/**
 * GET /api/analytics/dashboard
 * Récupère toutes les données pour le tableau de bord
 */
router.get('/dashboard', async (req, res) => {
    try {
    const [revenueData, insights, productPerformance, customerSegments] = await Promise.all([
      AnalyticsService.calculateRevenue({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: new Date().toISOString(),
        period: 'month'
      }),
      AnalyticsService.generateAIInsights(),
      AnalyticsService.analyzeProductPerformance(),
      AnalyticsService.analyzeCustomerSegments()
    ]);

    res.json({ 
      success: true, 
      data: {
        revenue: revenueData,
        insights,
        productPerformance,
        customerSegments,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des données du tableau de bord'
      });
    }
});

export default router;