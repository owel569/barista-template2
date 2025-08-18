import { Router } from 'express';

const router = Router();

// Statistiques générales du dashboard
router.get('/stats', async (req, res) => {
  try {
    // TODO: Calculer depuis la base de données
    const stats = {
      today: {
        orders: 45,
        revenue: 234.50,
        customers: 38
      },
      week: {
        orders: 312,
        revenue: 1456.75,
        customers: 198
      },
      month: {
        orders: 1287,
        revenue: 6234.25,
        customers: 567
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Commandes récentes
router.get('/recent-orders', async (req, res) => {
  try {
    // TODO: Récupérer depuis la base de données
    const recentOrders = [
      {
        id: '1',
        customerName: 'Marie Martin',
        total: 12.50,
        status: 'terminé',
        createdAt: new Date(Date.now() - 300000).toISOString() // 5 min ago
      },
      {
        id: '2',
        customerName: 'Pierre Durand',
        total: 8.75,
        status: 'en_preparation',
        createdAt: new Date(Date.now() - 600000).toISOString() // 10 min ago
      }
    ];
    
    res.json({
      success: true,
      data: recentOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes récentes'
    });
  }
});

// Articles populaires
router.get('/popular-items', async (req, res) => {
  try {
    // TODO: Calculer depuis la base de données
    const popularItems = [
      { name: 'Cappuccino', orders: 125, revenue: 437.50 },
      { name: 'Espresso', orders: 98, revenue: 245.00 },
      { name: 'Croissant', orders: 87, revenue: 174.00 }
    ];
    
    res.json({
      success: true,
      data: popularItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles populaires'
    });
  }
});

// Données pour graphiques de ventes
router.get('/sales-chart', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // TODO: Calculer depuis la base de données
    const salesData = [
      { date: '2025-01-13', sales: 245.50 },
      { date: '2025-01-14', sales: 312.75 },
      { date: '2025-01-15', sales: 189.25 },
      { date: '2025-01-16', sales: 267.00 },
      { date: '2025-01-17', sales: 298.50 },
      { date: '2025-01-18', sales: 156.25 },
      { date: '2025-01-19', sales: 234.75 }
    ];
    
    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de vente'
    });
  }
});

export default router;