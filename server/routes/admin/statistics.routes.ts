import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { requireRoleHierarchy } from '../../middleware/security';
import { db } from '../../db';
import { menuItems, menuCategories, customers, users } from '../../../shared/schema';
import { sql, eq, gte, desc } from 'drizzle-orm';

const router = Router();

// GET /api/admin/statistics/dashboard - Statistiques principales du tableau de bord
router.get('/dashboard', authenticateUser, requireRoleHierarchy('staff'), async (req, res): Promise<void> => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalCustomers,
      totalMenuItems,
      activeMenuItems,
      totalCategories,
      newCustomersThisMonth,
      topCustomers
    ] = await Promise.all([
      // Total des clients
      db.select({ count: sql<number>`count(*)::integer` }).from(customers),

      // Total des éléments du menu
      db.select({ count: sql<number>`count(*)::integer` }).from(menuItems),

      // Éléments du menu disponibles
      db.select({ count: sql<number>`count(*)::integer` }).from(menuItems).where(eq(menuItems.available, true)),

      // Total des catégories
      db.select({ count: sql<number>`count(*)::integer` }).from(menuCategories),

      // Nouveaux clients ce mois
      db.select({ count: sql<number>`count(*)::integer` })
        .from(customers)
        .where(gte(customers.createdAt, startOfMonth)),

      // Top 5 clients par points de fidélité
      db.select()
        .from(customers)
        .orderBy(desc(customers.loyaltyPoints))
        .limit(5)
    ]);

    const stats = {
      customers: {
        total: totalCustomers[0]?.count || 0,
        newThisMonth: newCustomersThisMonth[0]?.count || 0,
        topCustomers: topCustomers
      },
      menu: {
        totalItems: totalMenuItems[0]?.count || 0,
        activeItems: activeMenuItems[0]?.count || 0,
        totalCategories: totalCategories[0]?.count || 0
      },
      // Données simulées pour la démo
      revenue: {
        today: 1250.00,
        thisMonth: 35000.00,
        lastMonth: 32000.00,
        growth: 9.4
      },
      orders: {
        today: 42,
        pending: 8,
        completed: 34,
        averageValue: 29.76
      },
      reservations: {
        today: 15,
        thisWeek: 78,
        confirmed: 12,
        pending: 3
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/admin/statistics/revenue - Statistiques de revenus
router.get('/revenue', authenticateUser, requireRoleHierarchy('manager'), async (req, res): Promise<void> => {
  try {
    // Données simulées pour la démo - à remplacer par de vraies données de commandes
    const revenueData = {
      daily: [
        { date: '2024-01-01', revenue: 850 },
        { date: '2024-01-02', revenue: 920 },
        { date: '2024-01-03', revenue: 780 },
        { date: '2024-01-04', revenue: 1100 },
        { date: '2024-01-05', revenue: 950 },
        { date: '2024-01-06', revenue: 1200 },
        { date: '2024-01-07', revenue: 1350 }
      ],
      monthly: [
        { month: 'Jan', revenue: 28000 },
        { month: 'Fév', revenue: 32000 },
        { month: 'Mar', revenue: 35000 },
        { month: 'Avr', revenue: 31000 },
        { month: 'Mai', revenue: 38000 },
        { month: 'Juin', revenue: 42000 }
      ],
      byCategory: [
        { category: 'Cafés', revenue: 15000, percentage: 35 },
        { category: 'Pâtisseries', revenue: 12000, percentage: 28 },
        { category: 'Boissons', revenue: 8000, percentage: 19 },
        { category: 'Petits Déjeuners', revenue: 7500, percentage: 18 }
      ]
    };

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des revenus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des revenus'
    });
  }
});

// GET /api/admin/statistics/popular-items - Articles populaires
router.get('/popular-items', authenticateUser, requireRoleHierarchy('staff'), async (req, res): Promise<void> => {
  try {
    // Pour l'instant, on retourne les éléments du menu avec des données simulées
    const items = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        price: menuItems.price,
        categoryName: menuCategories.name
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(eq(menuItems.available, true))
      .limit(10);

    // Ajouter des données simulées de popularité
    const popularItems = items.map((item, index) => ({
      ...item,
      orderCount: Math.floor(Math.random() * 100) + 20,
      revenue: parseFloat(item.price) * (Math.floor(Math.random() * 100) + 20),
      rank: index + 1
    })).sort((a, b) => b.orderCount - a.orderCount);

    res.json({
      success: true,
      data: popularItems
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des articles populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles populaires'
    });
  }
});

// GET /api/admin/statistics/customer-analytics - Analyse des clients
router.get('/customer-analytics', authenticateUser, requireRoleHierarchy('manager'), async (req, res): Promise<void> => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      averageLoyaltyPoints,
      customersByMonth
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customers),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.isActive, true)),
      db.select({ avg: sql<number>`avg(loyalty_points)` }).from(customers),
      db.select({
        month: sql<string>`to_char(created_at, 'YYYY-MM')`,
        count: sql<number>`count(*)`
      })
      .from(customers)
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM')`)
      .limit(12)
    ]);

    const analytics = {
      overview: {
        total: totalCustomers[0]?.count || 0,
        active: activeCustomers[0]?.count || 0,
        averageLoyaltyPoints: Math.round(averageLoyaltyPoints[0]?.avg || 0)
      },
      growth: customersByMonth,
      demographics: {
        // Données simulées
        ageGroups: [
          { range: '18-25', count: 45, percentage: 22 },
          { range: '26-35', count: 78, percentage: 38 },
          { range: '36-45', count: 52, percentage: 25 },
          { range: '46+', count: 30, percentage: 15 }
        ],
        loyaltyDistribution: [
          { tier: 'Bronze', count: 120, points: '0-99' },
          { tier: 'Silver', count: 65, points: '100-299' },
          { tier: 'Gold', count: 25, points: '300-499' },
          { tier: 'Platinum', count: 8, points: '500+' }
        ]
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse des clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse des clients'
    });
  }
});

export default router;