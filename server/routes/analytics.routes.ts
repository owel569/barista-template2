
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Schémas de validation
const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional()
});

const reportParamsSchema = z.object({
  reportType: z.enum(['sales', 'customers', 'products', 'revenue'])
});

// Analytics avancées avec IA
router.get('/advanced', authenticateToken, async (req, res) => {
  try {
    const analytics = {
      customerBehavior: {
        peakHours: ['12:00-14:00', '18:00-20:00'],
        averageStayTime: 45, // minutes
        repeatCustomerRate: 68.5,
        seasonalTrends: {
          spring: 85,
          summer: 92,
          autumn: 78,
          winter: 71
        }
      },
      productPerformance: {
        topSellers: [
          { name: 'Cappuccino', sales: 245, revenue: 1225.00 },
          { name: 'Croissant', sales: 189, revenue: 567.00 },
          { name: 'Americano', sales: 167, revenue: 501.00 }
        ],
        profitMargins: {
          beverages: 72.5,
          food: 58.3,
          desserts: 65.8
        }
      },
      aiInsights: {
        recommendations: [
          'Augmenter le stock de Cappuccino pour demain (+15%)',
          'Promouvoir les desserts pendant les heures creuses',
          'Optimiser les horaires du personnel pour 18h-20h'
        ],
        predictions: {
          tomorrowRevenue: 2675.30,
          weeklyGrowth: 8.5,
          customerInflux: 'High during lunch, Medium during dinner'
        }
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des analytics' });
  }
});

// Analyse des tendances
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const trends = {
      revenue: {
        trend: 'upward',
        percentage: 12.5,
        period: 'last_month',
        data: generateTrendData('revenue')
      },
      customers: {
        trend: 'stable',
        percentage: 2.1,
        period: 'last_month', 
        data: generateTrendData('customers')
      },
      satisfaction: {
        trend: 'upward',
        percentage: 5.8,
        period: 'last_month',
        data: generateTrendData('satisfaction')
      }
    };

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tendances' });
  }
});

// Analytics par segment de clientèle
router.get('/customer-segments', authenticateToken, async (req, res) => {
  try {
    const segments = {
      vip: {
        count: 23,
        averageSpend: 45.67,
        frequency: 'Weekly',
        preferences: ['Premium Coffee', 'Pastries']
      },
      regular: {
        count: 156,
        averageSpend: 27.89,
        frequency: 'Bi-weekly',
        preferences: ['Americano', 'Sandwiches']
      },
      occasional: {
        count: 89,
        averageSpend: 18.45,
        frequency: 'Monthly',
        preferences: ['Espresso', 'Croissants']
      }
    };

    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des segments' });
  }
});

// Rapport de performance en temps réel
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const realtime = {
      currentOrders: 12,
      activeCustomers: 45,
      revenueToday: 2450.50,
      staffPerformance: {
        totalOrders: 89,
        averageOrderTime: 8.5, // minutes
        customerSatisfaction: 4.6
      },
      kitchenStatus: {
        pendingOrders: 7,
        averagePrepTime: 12.3, // minutes
        capacity: 85 // percentage
      }
    };

    res.json(realtime);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données temps réel' });
  }
});

// Export de données analytics
router.post('/export', authenticateToken, requireRole('manager'), async (req, res) => {
  try {
    const { format, period, metrics } = req.body;
    
    const exportData = {
      exportId: Date.now(),
      format: format || 'json',
      period: period || 'month',
      metrics: metrics || ['revenue', 'customers', 'orders'],
      generatedAt: new Date().toISOString(),
      url: `/api/analytics/download/${Date.now()}`
    };

    res.json({
      success: true,
      export: exportData,
      message: 'Export généré avec succès'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
});

// Fonction utilitaire pour générer des données de tendance
function generateTrendData(type: string) {
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    let value = 0;
    
    switch (type) {
      case 'revenue':
        value = Math.round((2000 + Math.random() * 1000) * 100) / 100;
        break;
      case 'customers':
        value = Math.round(120 + Math.random() * 80);
        break;
      case 'satisfaction':
        value = Math.round((4.0 + Math.random() * 1.0) * 10) / 10;
        break;
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: value
    });
  }
  
  return data;
}

// Route pour analytics détaillées
router.get('/detailed/:reportType', 
  authenticateToken, 
  validateParams(reportParamsSchema),
  validateQuery(analyticsQuerySchema),
  async (req, res) => {
    try {
      const { reportType } = req.params;
      const { startDate, endDate, period = 'month' } = req.query;

      let analyticsData;
      
      switch (reportType) {
        case 'sales':
          analyticsData = {
            totalSales: 45230.75,
            salesGrowth: 12.5,
            topProducts: [
              { name: 'Cappuccino', sales: 1250, revenue: 4375.00 },
              { name: 'Espresso', sales: 980, revenue: 2450.00 },
              { name: 'Latte', sales: 850, revenue: 3400.00 }
            ],
            salesByPeriod: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              sales: Math.random() * 1500 + 500
            }))
          };
          break;
        case 'customers':
          analyticsData = {
            totalCustomers: 1250,
            newCustomers: 85,
            returningCustomers: 420,
            customerRetention: 68.5,
            averageOrderValue: 23.45,
            topCustomers: [
              { name: 'Marie Dubois', orders: 45, spent: 890.50 },
              { name: 'Jean Martin', orders: 38, spent: 765.25 },
              { name: 'Sophie Laurent', orders: 32, spent: 680.75 }
            ]
          };
          break;
        case 'products':
          analyticsData = {
            totalProducts: 45,
            activeProducts: 42,
            topPerformers: [
              { name: 'Cappuccino', sales: 1250, margin: 65 },
              { name: 'Croissant', sales: 890, margin: 45 },
              { name: 'Sandwich Club', sales: 450, margin: 55 }
            ],
            categoryPerformance: [
              { category: 'Cafés', sales: 3250, percentage: 45 },
              { category: 'Pâtisseries', sales: 1850, percentage: 25 },
              { category: 'Plats', sales: 2150, percentage: 30 }
            ]
          };
          break;
        case 'revenue':
          analyticsData = {
            totalRevenue: 45230.75,
            monthlyRevenue: 8750.00,
            revenueGrowth: 15.2,
            profitMargin: 32.5,
            revenueByCategory: [
              { category: 'Boissons', revenue: 20353.85, percentage: 45 },
              { category: 'Alimentation', revenue: 15692.20, percentage: 35 },
              { category: 'Desserts', revenue: 9184.70, percentage: 20 }
            ],
            monthlyTrends: Array.from({ length: 12 }, (_, i) => ({
              month: new Date(2024, i).toLocaleString('fr-FR', { month: 'long' }),
              revenue: Math.random() * 10000 + 5000
            }))
          };
          break;
        default:
          return res.status(400).json({ error: 'Type de rapport invalide' });
      }

      res.json(analyticsData);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des analytics' });
    }
  }
);

// Route pour métriques en temps réel
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const realtimeData = {
      currentOrders: 12,
      todayRevenue: 1250.75,
      activeCustomers: 45,
      averageWaitTime: 8.5,
      kitchenLoad: 75,
      tableOccupancy: 68,
      lastUpdated: new Date().toISOString()
    };
    res.json(realtimeData);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données temps réel' });
  }
});

// Route pour export de données
router.post('/export', authenticateToken, async (req, res) => {
  try {
    const { format, dataType, dateRange } = req.body;
    
    const exportData = {
      exportId: Date.now(),
      format,
      dataType,
      dateRange,
      status: 'processing',
      downloadUrl: null,
      createdAt: new Date().toISOString()
    };

    // Simuler le traitement d'export
    setTimeout(() => {
      exportData.status = 'completed';
      exportData.downloadUrl = `/api/downloads/export-${exportData.exportId}.${format}`;
    }, 2000);

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
});

export default router;
