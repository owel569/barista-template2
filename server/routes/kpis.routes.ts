
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const kpiData: KPIData = {
      timestamp: new Date().toISOString(),
      revenue: {
        today: 2450.50,
        target: 3000.00,
        yesterday: 2180.25,
        weekToDate: 15420.75,
        monthToDate: 68750.30,
        yearToDate: 245680.90
      },
      customers: {
        total: 156,
        new: 23,
        returning: 133,
        satisfaction: 4.6
      },
      orders: {
        total: 89,
        pending: 12,
        completed: 72,
        cancelled: 5,
        averageValue: 27.53
      },
      inventory: {
        totalItems: 245,
        lowStock: 8,
        outOfStock: 2,
        turnoverRate: 85.2
      },
      staff: {
        present: 12,
        scheduled: 15,
        efficiency: 92.3
      },
      tables: {
        occupied: 18,
        total: 25,
        turnoverRate: 3.2
      }
    };

    res.json(kpiData);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des KPIs' });
  }
});

// KPIs par période
router.get('/period/:period', authenticateToken, async (req, res) => {
  try {
    const { period } = req.params;
    const periods = ['day', 'week', 'month', 'quarter', 'year'];
    
    if (!periods.includes(period)) {
      return res.status(400).json({ error: 'Période invalide' });
    }

    // Génération de données historiques selon la période
    const historicalData = generateHistoricalKPIs(period);
    res.json(historicalData);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des KPIs historiques' });
  }
});

// KPIs comparatifs
router.get('/comparison', authenticateToken, async (req, res) => {
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

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des comparaisons' });
  }
});

// Alertes basées sur les KPIs
router.get('/alerts', authenticateToken, async (req, res) => {
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

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

// Prédictions basées sur l'IA
router.get('/predictions', authenticateToken, requireRole('manager'), async (req, res) => {
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

    res.json(predictions);
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
      timestamp: timestamp.toISOString(),
      revenue: Math.round((2000 + Math.random() * 1000) * 100) / 100,
      customers: Math.round(120 + Math.random() * 80),
      orders: Math.round(70 + Math.random() * 40),
      satisfaction: Math.round((4.0 + Math.random() * 1.0) * 10) / 10
    });
  }

  return data;
}

export default router;
