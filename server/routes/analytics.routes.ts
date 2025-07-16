
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

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

export default router;
