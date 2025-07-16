
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes KPIs temps réel
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const kpis = {
      timestamp: new Date().toISOString(),
      revenue: {
        today: 1247.50,
        target: 1500.00,
        yesterday: 1156.30,
        change: 7.9,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          revenue: Math.random() * 100 + 20
        }))
      },
      orders: {
        total: 45,
        completed: 42,
        pending: 3,
        cancelled: 0,
        averageTime: 12.5,
        peakHour: 14
      },
      customers: {
        total: 38,
        new: 5,
        returning: 33,
        satisfaction: 4.6,
        segments: {
          vip: 8,
          regular: 25,
          new: 5
        }
      },
      staff: {
        present: 6,
        scheduled: 8,
        efficiency: 94.2,
        breaks: 2
      },
      inventory: {
        lowStock: 3,
        outOfStock: 0,
        totalItems: 156,
        lastUpdate: new Date().toISOString()
      }
    };
    res.json(kpis);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des KPIs' });
  }
});

router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = [
      { id: 1, type: 'inventory', message: 'Stock faible: Lait entier (8L restants)', severity: 'warning' },
      { id: 2, type: 'orders', message: 'Commande en attente depuis 15 min', severity: 'urgent' },
      { id: 3, type: 'staff', message: 'Pause prévue dans 10 min', severity: 'info' }
    ];
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

export default router;
