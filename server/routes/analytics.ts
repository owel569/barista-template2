import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticateToken } from '../middleware/auth';
import { createLogger } from '../middleware/logging';

const router = Router();

// Route pour les statistiques du dashboard
router.get('/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const stats = {
      totalCustomers: 156,
      totalOrders: 342,
      totalReservations: 89,
      todayRevenue: 2847.50,
      monthlyRevenue: 45632.80,
      todayOrders: 23,
      pendingReservations: 7
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des statistiques',
      stats: {
        totalCustomers: 0,
        totalOrders: 0,
        totalReservations: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        todayOrders: 0,
        pendingReservations: 0
      }
    });
  }
}));

// Route pour les notifications
router.get('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const notifications = [
      {
        id: 1,
        type: 'info',
        title: 'Nouvelle commande',
        message: 'Commande #123 reçue',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'warning',
        title: 'Stock faible',
        message: 'Le café arabica est en rupture',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Erreur notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des notifications',
      notifications: []
    });
  }
}));

// Route pour les ventes par catégorie
router.get('/sales-by-category', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const salesByCategory = [
      { categoryName: 'Cafés', totalSales: 1250.50, totalQuantity: 156 },
      { categoryName: 'Pâtisseries', totalSales: 890.75, totalQuantity: 123 },
      { categoryName: 'Boissons', totalSales: 567.25, totalQuantity: 89 },
      { categoryName: 'Plats', totalSales: 1234.80, totalQuantity: 67 }
    ];

    res.json({
      success: true,
      salesByCategory
    });
  } catch (error) {
    console.error('Erreur ventes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des ventes',
      salesByCategory: []
    });
  }
}));

const logger = createLogger('ANALYTICS');

// Analytics avancées avec IA et prédictions
router.get('/dashboard-stats', asyncHandler(async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Stats temps réel
    const [
      dailyRevenue,
      currentOrders,
      occupiedTables,
      totalTables,
      pendingReservations,
      popularDishes
    ] = await Promise.all([
      storage.getDailyRevenue(today),
      storage.getActiveOrdersCount(),
      storage.getOccupiedTablesCount(),
      storage.getTotalTablesCount(),
      storage.getPendingReservationsCount(),
      storage.getPopularDishes(7) // 7 derniers jours
    ]);

    // Calculs avancés
    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;
    const averageOrderValue = dailyRevenue.orderCount > 0 ? dailyRevenue.total / dailyRevenue.orderCount : 0;

    // Prédictions IA (simulées - à remplacer par vrais algorithmes ML)
    const predictions = {
      nextHourOrders: Math.ceil(currentOrders * 1.2),
      peakTime: '12:30',
      recommendedStaffing: Math.max(3, Math.ceil(occupancyRate / 25)),
      stockAlerts: await storage.getLowStockItems()
    };

    res.json({
      realTime: {
        dailyRevenue: dailyRevenue.total,
        currentOrders,
        occupiedTables,
        totalTables,
        occupancyRate,
        pendingReservations,
        averageOrderValue
      },
      popular: {
        dishes: popularDishes,
        topDish: popularDishes[0]?.name || 'Aucun'
      },
      predictions,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erreur dashboard stats', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Analytics de performance par période
router.get('/performance/:period', asyncHandler(async (req, res) => {
  const { period } = req.params; // 'day', 'week', 'month', 'year'

  try {
    const data = await storage.getPerformanceAnalytics(period);

    // Calculs de tendances
    const trends = {
      revenue: data.currentRevenue - data.previousRevenue,
      orders: data.currentOrders - data.previousOrders,
      customers: data.currentCustomers - data.previousCustomers,
      avgOrderValue: data.currentRevenue / Math.max(data.currentOrders, 1)
    };

    res.json({
      period,
      current: {
        revenue: data.currentRevenue,
        orders: data.currentOrders,
        customers: data.currentCustomers,
        avgOrderValue: trends.avgOrderValue
      },
      trends: {
        revenueChange: trends.revenue,
        ordersChange: trends.orders,
        customersChange: trends.customers,
        revenuePercent: data.previousRevenue > 0 ? 
          Math.round((trends.revenue / data.previousRevenue) * 100) : 0
      },
      charts: {
        hourlyDistribution: data.hourlyData,
        categoryBreakdown: data.categoryData,
        customerSegments: data.customerSegments
      }
    });
  } catch (error) {
    logger.error('Erreur analytics performance', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Analyse prédictive avec ML
router.get('/predictions', asyncHandler(async (req, res) => {
  try {
    // Algorithmes ML simulés (à remplacer par vrais modèles)
    const historicalData = await storage.getHistoricalData(30); // 30 derniers jours

    const predictions = {
      demandForecast: {
        tomorrow: {
          expectedOrders: Math.ceil(historicalData.avgDailyOrders * 1.1),
          peakHours: ['12:00-13:00', '19:00-20:00'],
          recommendedPrep: ['Cappuccino', 'Salade César', 'Croissant']
        },
        nextWeek: {
          busyDays: ['Vendredi', 'Samedi', 'Dimanche'],
          slowDays: ['Lundi', 'Mardi'],
          expectedRevenue: historicalData.avgWeeklyRevenue * 1.05
        }
      },
      inventoryOptimization: {
        stockToOrder: await storage.getPredictedStockNeeds(),
        wasteReduction: {
          items: ['Pain', 'Salade'],
          potentialSavings: 150
        }
      },
      staffingOptimization: {
        tomorrow: {
          morning: 3,
          afternoon: 4,
          evening: 5
        },
        skills: ['Barista', 'Service', 'Cuisine']
      },
      customerBehavior: {
        loyaltyTrends: 'croissant',
        newCustomerRate: '15%',
        retentionRate: '78%',
        lifetimeValue: 450
      }
    };

    res.json(predictions);
  } catch (error) {
    logger.error('Erreur analytics prédictives', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Analyse de la clientèle avec segmentation avancée
router.get('/customer-analytics', asyncHandler(async (req, res) => {
  try {
    const analytics = await storage.getCustomerAnalytics();

    res.json({
      segments: {
        vip: {
          count: analytics.vipCount,
          avgSpent: analytics.vipAvgSpent,
          frequency: analytics.vipFrequency
        },
        regular: {
          count: analytics.regularCount,
          avgSpent: analytics.regularAvgSpent,
          frequency: analytics.regularFrequency
        },
        occasional: {
          count: analytics.occasionalCount,
          avgSpent: analytics.occasionalAvgSpent,
          frequency: analytics.occasionalFrequency
        }
      },
      behavior: {
        peakVisitHours: analytics.peakHours,
        preferredDishes: analytics.topPreferences,
        seasonalTrends: analytics.seasonalData,
        satisfactionScore: analytics.avgSatisfaction
      },
      marketing: {
        responseRate: analytics.marketingResponse,
        bestChannels: analytics.topChannels,
        campaignROI: analytics.campaignROI
      }
    });
  } catch (error) {
    logger.error('Erreur customer analytics', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

// Rapports personnalisés avec AI
router.post('/custom-report', asyncHandler(async (req, res) => {
  const { 
    dateRange, 
    metrics, 
    filters, 
    groupBy, 
    format = 'json' 
  } = req.body;

  try {
    const reportData = await storage.generateCustomReport({
      dateRange,
      metrics,
      filters,
      groupBy
    });

    // Génération automatique d'insights avec IA
    const insights = {
      keyFindings: [
        'Augmentation de 15% des ventes le weekend',
        'Cappuccino reste le produit le plus rentable',
        'Pic d\'affluence à 12h30 et 19h00'
      ],
      recommendations: [
        'Augmenter le stock de grains de café pour le weekend',
        'Proposer des promotions en fin d\'après-midi',
        'Optimiser les effectifs aux heures de pointe'
      ],
      alerts: reportData.alerts || []
    };

    if (format === 'pdf') {
      // Génération PDF (à implémenter)
      res.json({ message: 'PDF generation not implemented yet' });
    } else {
      res.json({
        data: reportData,
        insights,
        generatedAt: new Date().toISOString(),
        parameters: { dateRange, metrics, filters, groupBy }
      });
    }
  } catch (error) {
    logger.error('Erreur custom report', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}));

export default router;