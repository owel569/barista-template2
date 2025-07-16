
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes analytiques
router.get('/kpis', authenticateToken, async (req, res) => {
  try {
    const kpis = {
      timestamp: new Date().toISOString(),
      revenue: {
        today: 1247.50,
        target: 1500.00,
        yesterday: 1156.30,
        change: 7.9
      },
      orders: {
        total: 45,
        completed: 42,
        pending: 3,
        cancelled: 0
      },
      customers: {
        total: 38,
        new: 5,
        returning: 33,
        satisfaction: 4.6
      },
      products: {
        topSelling: 'Cappuccino',
        lowStock: 2,
        totalSold: 127
      }
    };
    res.json(kpis);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des KPIs' });
  }
});

router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const trends = {
      sales: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500) + 800,
        orders: Math.floor(Math.random() * 20) + 30
      })),
      products: [
        { name: 'Cappuccino', sales: 145, trend: '+12%' },
        { name: 'Latte', sales: 123, trend: '+8%' },
        { name: 'Espresso', sales: 98, trend: '-3%' }
      ]
    };
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des tendances' });
  }
});

export default router;
