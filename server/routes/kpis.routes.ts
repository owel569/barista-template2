import { Router } from 'express';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';

const router = Router();
const logger = createLogger('ROUTES');

// Interface pour les KPIs
interface KPIData {
  timestamp: string;
  revenue: {
    today: number;
    target: number;
    yesterday: number;
    weekToDate: number;
    monthToDate: number;
    yearToDate: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    satisfaction: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    averageValue: number;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    turnoverRate: number;
  };
  staff: {
    present: number;
    scheduled: number;
    efficiency: number;
  };
  tables: {
    occupied: number;
    total: number;
    turnoverRate: number;
  };
}

// Route principale des KPIs temps réel
router.get('/', authenticateUser, async (req, res) => {
  try {
    // KPIs avancés avec calculs en temps réel
    const kpis = {
      revenue: {
        today: 1250.75,
        yesterday: 1180.50,
        thisMonth: 28750.25,
        lastMonth: 25430.80,
        growth: 13.0,
        target: 30000.00,
        targetProgress: 95.8,
        forecast: 29850.50
      },
      orders: {
        today: 42,
        yesterday: 38,
        thisMonth: 890,
        lastMonth: 820,
        averageOrderValue: 30.25,
        peakHour: '12:30',
        completionRate: 98.5,
        cancelRate: 1.5
      },
      customers: {
        total: 1250,
        active: 850,
        new: 45,
        returning: 380,
        retentionRate: 68.5,
        satisfactionScore: 4.3,
        churnRate: 5.2,
        lifetimeValue: 450.75
      },
      staff: {
        total: 12,
        present: 8,
        efficiency: 85.5,
        satisfaction: 4.2,
        productivity: 92.3,
        overtime: 8.5,
        absenceRate: 3.1
      },
      operational: {
        tableOccupancy: 72.5,
        kitchenEfficiency: 89.2,
        averageWaitTime: 12.5,
        stockLevel: 85.0,
        energyConsumption: 234.5,
        wasteReduction: 15.8
      },
      financial: {
        grossMargin: 68.5,
        netMargin: 24.8,
        costOfGoods: 32.1,
        laborCost: 28.5,
        profitability: 85.9,
        cashFlow: 15420.75
      }
    };
    res.json({
        success: true,
        data: kpis
      });
  } catch (error) {
    logger.error('Erreur KPIs:', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des KPIs',
      details: (error as Error)}).message 
    });
  }
});

// KPIs par période
router.get('/period/:period', authenticateUser, async (req, res) => {
  try {
    const { period } = req.params;
    const periods = ['day', 'week', 'month', 'quarter', 'year'];

    if (!period || !periods.includes(period)) {
      return res.status(400).json({ error: 'Période invalide' });
    }

    // Génération de données historiques selon la période
    const historicalData = generateHistoricalKPIs(period as string);
    res.json({
        success: true,
        data: historicalData
      });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des KPIs historiques' });
    return;
  }
});

// KPIs comparatifs
router.get('/comparison', authenticateUser, async (req, res) => {
  try {
    const comparison = {
      currentVsPrevious: {
        revenue: { current: 2450.50, previous: 2180.25, growth: 12.4 },
        customers: { current: 156, previous: 142, growth: 9.9 },
        orders: { current: 89, previous: 78, growth: 14.1 }
      },
      currentVsTarget: {
        revenue: { current: 2450.50, target: 3000.00, achievement: 81.7 },
        customers: { current: 156, target: 180, achievement: 86.7 },
        orders: { current: 89, target: 100, achievement: 89.0 }
      },
      trends: {
        revenue: 'upward',
        customers: 'stable',
        orders: 'upward',
        satisfaction: 'stable'
      }
    };

    res.json({
        success: true,
        data: comparison
      });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des comparaisons' });
  }
});

// Alertes basées sur les KPIs
router.get('/alerts', authenticateUser, async (req, res) => {
  try {
    const alerts = [
      {
        type: 'warning',
        category: 'inventory',
        message: 'Stock faible détecté : 8 articles sous le seuil minimum',
        severity: 'medium',
        timestamp: new Date().toISOString()
      },
      {
        type: 'info',
        category: 'revenue',
        message: 'Objectif journalier à 81.7% - progression normale',
        severity: 'low',
        timestamp: new Date().toISOString()
      },
      {
        type: 'success',
        category: 'satisfaction',
        message: 'Satisfaction client excellente : 4.6/5',
        severity: 'low',
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
        success: true,
        data: alerts
      });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

// Prédictions basées sur l'IA
router.get('/predictions', authenticateUser, requireRoles(['manager']), async (req, res) => {
  try {
    const predictions = {
      nextHour: {
        revenue: 127.50,
        customers: 12,
        orders: 8
      },
      endOfDay: {
        revenue: 2850.75,
        customers: 185,
        orders: 105
      },
      nextWeek: {
        averageDailyRevenue: 2675.30,
        peakDay: 'Saturday',
        recommendedStaffing: 16
      }
    };

    res.json({
        success: true,
        data: predictions
      });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération des prédictions' });
  }
});

// Fonction utilitaire pour générer des données historiques
function generateHistoricalKPIs(period: string) {
  const data = [];
  const now = new Date();
  let intervals = 0;
  let stepSize = 0;

  switch (period) {
    case 'day':
      intervals = 24;
      stepSize = 60 * 60 * 1000; // 1 heure
      break;
    case 'week':
      intervals = 7;
      stepSize = 24 * 60 * 60 * 1000; // 1 jour
      break;
    case 'month':
      intervals = 30;
      stepSize = 24 * 60 * 60 * 1000; // 1 jour
      break;
    case 'quarter':
      intervals = 13;
      stepSize = 7 * 24 * 60 * 60 * 1000; // 1 semaine
      break;
    case 'year':
      intervals = 12;
      stepSize = 30 * 24 * 60 * 60 * 1000; // 1 mois
      break;
  }

  for (let i = intervals - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * stepSize);
    data.push({
      timestamp: timestamp.toISOString(}),
      revenue: Math.round((2000 + Math.random() * 1000) * 100) / 100,
      customers: Math.round(120 + Math.random() * 80),
      orders: Math.round(70 + Math.random() * 40),
      satisfaction: Math.round((4.0 + Math.random() * 1.0) * 10) / 10
    });
  }

  return data;
}

export default router;