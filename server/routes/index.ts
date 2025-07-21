import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { users, menuCategories, menuItems, tables, customers, employees, 
         reservations, orders, orderItems, workShifts, activityLogs, permissions } from '../../shared/schema';
import { eq, and, desc, asc, sql, count, sum, avg, min, max, like, gte, lte, between, inArray } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    email: string;
  };
}
import { createLogger } from '../middleware/logging';
import { validateRequestWithLogging } from '../middleware/logging';
import { z } from 'zod';

// Import des routes
import analyticsRouter from './analytics';
import permissionsRouter from './permissions';
import { userProfileRouter } from './user-profile';
import { tablesRouter } from './tables';
import databaseRouter from './database.routes';

const router = Router();
const logger = createLogger('MAIN_ROUTES');

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court')
});

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe requis'),
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis')
});

// Route de santé
router.get('/health', asyncHandler(async (req, res) => {
  logger.info('Health check demandé');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Barista Café API'
  });
}));

// Routes d'authentification
router.post('/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  logger.info('Tentative de connexion', { username });

  try {
    const { getDb } = await import('../db.js');
    const { users } = await import('@shared/schema.js');
    const { comparePassword, generateToken } = await import('../middleware/auth.js');
    const { eq } = await import('drizzle-orm');

    const db = await getDb();

    // Rechercher l'utilisateur
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
      logger.warn('Utilisateur non trouvé', { username });
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      logger.warn('Mot de passe incorrect', { username });
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Générer le token JWT
    const token = generateToken(user);

    logger.info('Connexion réussie', { userId: user.id, role: user.role });

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email
      },
      token
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lors de la connexion', { error: errorMessage });
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

router.post('/auth/register', validateRequestWithLogging(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  logger.info('Tentative d\'inscription', { email });

  // Simulation d'inscription
  const user = {
    id: Date.now(),
    email,
    firstName,
    lastName,
    role: 'user'
  };

  logger.info('Inscription réussie', { userId: user.id });

  res.status(201).json({
    success: true,
    user,
    message: 'Compte créé avec succès'
  });
}));

// Route de vérification du token
router.get('/auth/verify', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
}));



// Routes des données de base
router.get('/menu', asyncHandler(async (req, res) => {
  logger.info('Récupération du menu');

  try {
    const { getDb } = await import('../db.js');
    const { menuItems, menuCategories } = await import('@shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const db = await getDb();

    // Récupérer tous les articles avec leurs catégories
    const items = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        imageUrl: menuItems.imageUrl,
        available: menuItems.available,
        category: menuCategories.name,
        categorySlug: menuCategories.slug
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(eq(menuItems.available, true));

    res.json({
      success: true,
      menu: items
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

router.get('/tables', asyncHandler(async (req, res) => {
  logger.info('Récupération des tables');

  try {
    const { getDb } = await import('../db.js');
    const { tables } = await import('@shared/schema.js');

    const db = await getDb();

    const tablesList = await db.select().from(tables);

    res.json({
      success: true,
      tables: tablesList
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des tables', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

router.get('/reservations', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Récupération des réservations');

  const reservations = [
    {
      id: 1,
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      tableNumber: 3,
      date: '2024-01-15',
      time: '19:00',
      guests: 4,
      status: 'confirmed'
    },
    {
      id: 2,
      customerName: 'Marie Martin',
      customerEmail: 'marie@example.com',
      tableNumber: 2,
      date: '2024-01-15',
      time: '20:00',
      guests: 2,
      status: 'pending'
    }
  ];

  res.json({
    success: true,
    reservations
  });
}));

// Route de test
router.get('/test', (req, res) => {
  res.json({ message: 'API fonctionne!' });
});

// Routes admin avec authentification
router.get('/admin/notifications', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = [
      {
        id: 1,
        type: 'reservation',
        title: 'Nouvelle réservation',
        message: 'Table 4 réservée pour 19h30',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'order',
        title: 'Commande terminée',
        message: 'Commande #1247 prête',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false
      }
    ];

    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('Erreur notifications', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/notifications/count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const unreadCount = 2; // Nombre de notifications non lues
    res.json({ success: true, count: unreadCount });
  } catch (error) {
    logger.error('Erreur compteur notifications', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/dashboard/stats', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { orders, reservations, customers, menuItems } = await import('@shared/schema.js');
    const { count, sum } = await import('drizzle-orm');

    const db = await getDb();

    // Récupérer les statistiques
    const ordersCountResult = await db.select({ count: count() }).from(orders);
    const reservationsCountResult = await db.select({ count: count() }).from(reservations);
    const customersCountResult = await db.select({ count: count() }).from(customers);
    const menuItemsCountResult = await db.select({ count: count() }).from(menuItems);

    // Revenus totaux (simulation)
    const totalRevenueResult = await db.select({ 
      total: sum(orders.totalAmount) 
    }).from(orders);

    const stats = {
      orders: ordersCountResult[0]?.count || 0,
      reservations: reservationsCountResult[0]?.count || 0,
      customers: customersCountResult[0]?.count || 0,
      menuItems: menuItemsCountResult[0]?.count || 0,
      revenue: totalRevenueResult[0]?.total || 0,
      todayOrders: 0, // À implémenter avec filtre date
      todayRevenue: 0, // À implémenter avec filtre date
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Erreur statistiques dashboard', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/users', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { users } = await import('@shared/schema.js');

    const db = await getDb();

    const usersList = await db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    }).from(users);

    res.json({ success: true, data: usersList });
  } catch (error) {
    logger.error('Erreur récupération utilisateurs', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/menu', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuItems, menuCategories } = await import('@shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const db = await getDb();

    const items = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        imageUrl: menuItems.imageUrl,
        available: menuItems.available,
        categoryId: menuItems.categoryId,
        category: menuCategories.name,
        categorySlug: menuCategories.slug,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id));

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Erreur récupération menu admin', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/categories', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuCategories } = await import('@shared/schema.js');

    const db = await getDb();

    const categories = await db.select().from(menuCategories);

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Erreur récupération catégories', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Endpoints publics pour le menu
router.get('/menu/categories', asyncHandler(async (req, res) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuCategories } = await import('@shared/schema.js');
    const { withDatabaseRetry } = await import('../middleware/database-middleware.js');

    const categories = await withDatabaseRetry(async () => {
      const db = await getDb();
      return await db.select().from(menuCategories);
    });

    res.json({ success: true, categories });
  } catch (error) {
    logger.error('Erreur récupération catégories publiques', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/menu/items', asyncHandler(async (req, res) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuItems, menuCategories } = await import('@shared/schema.js');
    const { eq } = await import('drizzle-orm');
    const { withDatabaseRetry } = await import('../middleware/database-middleware.js');

    const items = await withDatabaseRetry(async () => {
      const db = await getDb();
      return await db
        .select({
          id: menuItems.id,
          name: menuItems.name,
          description: menuItems.description,
          price: menuItems.price,
          imageUrl: menuItems.imageUrl,
          available: menuItems.available,
          category: {
            id: menuCategories.id,
            name: menuCategories.name,
            slug: menuCategories.slug
          }
        })
        .from(menuItems)
        .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
        .where(eq(menuItems.available, true));
    });

    res.json({ success: true, items });
  } catch (error) {
    logger.error('Erreur récupération articles publics', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Routes CRUD pour les éléments de menu
router.get('/admin/menu/items', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuItems, menuCategories } = await import('@shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const db = await getDb();

    const items = await db.select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      imageUrl: menuItems.imageUrl,
      available: menuItems.available,
      categoryId: menuItems.categoryId,
      category: {
        id: menuCategories.id,
        name: menuCategories.name,
        slug: menuCategories.slug
      }
    })
    .from(menuItems)
    .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id));

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Erreur récupération menu admin', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.post('/admin/menu/items', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuItems } = await import('@shared/schema.js');
    const { name, description, price, categoryId, available, imageUrl } = req.body;

    const db = await getDb();

    const [newItem] = await db.insert(menuItems).values({
      name,
      description,
      price: parseFloat(price),
      categoryId: parseInt(categoryId),
      available: available !== false,
      imageUrl: imageUrl || null
    }).returning();

    res.json({ success: true, data: newItem });
  } catch (error) {
    logger.error('Erreur création article menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.put('/admin/menu/items/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuItems } = await import('@shared/schema.js');
    const { eq } = await import('drizzle-orm');
    const { name, description, price, categoryId, available, imageUrl } = req.body;
    const itemId = parseInt(req.params.id);

    const db = await getDb();

    const [updatedItem] = await db.update(menuItems)
      .set({
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        available: available !== false,
        imageUrl: imageUrl || null,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, itemId))
      .returning();

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    logger.error('Erreur mise à jour article menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.delete('/admin/menu/items/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuItems } = await import('@shared/schema.js');
    const { eq } = await import('drizzle-orm');
    const itemId = parseInt(req.params.id);

    const db = await getDb();

    const [deletedItem] = await db.delete(menuItems)
      .where(eq(menuItems.id, itemId))
      .returning();

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    res.json({ success: true, message: 'Article supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur suppression article menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/customers', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { customers } = await import('@shared/schema.js');

    const db = await getDb();
    const customersList = await db.select().from(customers);

    res.json({ success: true, data: customersList });
  } catch (error) {
    logger.error('Erreur récupération clients', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/reservations', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { reservations, customers, tables } = await import('@shared/schema.js');
    const { eq } = await import('drizzle-orm');

    const db = await getDb();

    const reservationsList = await db.select()
      .from(reservations)
      .leftJoin(customers, eq(reservations.customerId, customers.id))
      .leftJoin(tables, eq(reservations.tableId, tables.id));

    res.json({ success: true, data: reservationsList });
  } catch (error) {
    logger.error('Erreur récupération réservations', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/promotions', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const promotions = [
      {
        id: 1,
        name: "Happy Hour",
        description: "20% de réduction de 14h à 16h",
        discount: 20,
        active: true,
        startDate: "2025-01-01",
        endDate: "2025-12-31"
      },
      {
        id: 2,
        name: "Menu Étudiant", 
        description: "Tarif préférentiel pour étudiants",
        discount: 15,
        active: true,
        startDate: "2025-01-01",
        endDate: "2025-12-31"
      }
    ];

    res.json({ success: true, data: promotions });
  } catch (error) {
    logger.error('Erreur récupération promotions', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/events', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const events = [
      {
        id: 1,
        name: "Soirée Jazz",
        description: "Concert de jazz en live",
        date: "2025-07-25",
        time: "20:00",
        capacity: 50,
        booked: 32,
        status: "confirmed"
      },
      {
        id: 2,
        name: "Dégustation Café",
        description: "Découverte des cafés du monde", 
        date: "2025-07-30",
        time: "15:00",
        capacity: 20,
        booked: 8,
        status: "confirmed"
      }
    ];

    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Erreur récupération événements', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/inventory/items', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const inventoryItems = [
      {
        id: 1,
        name: "Grains de café Arabica",
        category: "Matières premières",
        currentStock: 25,
        minStock: 10,
        unit: "kg",
        supplier: "Café Premium Import",
        lastRestocked: "2025-07-15",
        status: "ok"
      },
      {
        id: 2,
        name: "Lait entier",
        category: "Produits frais",
        currentStock: 8,
        minStock: 15,
        unit: "litres",
        supplier: "Laiterie Locale",
        lastRestocked: "2025-07-17",
        status: "low"
      }
    ];

    res.json({ success: true, data: inventoryItems });
  } catch (error) {
    logger.error('Erreur récupération inventaire', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/inventory/alerts', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = [
      {
        id: 1,
        type: "low_stock",
        message: "Stock faible : Lait entier (8/15)",
        severity: "warning",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        type: "expiry_soon",
        message: "Expire bientôt : Pâtisseries (2 jours)",
        severity: "info",
        createdAt: new Date().toISOString()
      }
    ];

    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Erreur récupération alertes', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Routes statistiques détaillées pour le dashboard
router.get('/admin/stats/revenue-detailed', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { orders } = await import('@shared/schema.js');
    const { sql } = await import('drizzle-orm');

    const db = await getDb();

    // Récupérer les données des 7 derniers jours
    const dateParam = req.query.date?.toString() || new Date().toISOString().split('T')[0];
    const revenueData = await db.select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`SUM(${orders.totalAmount})`,
      orders: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`)
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

    res.json({ success: true, data: revenueData });
  } catch (error) {
    logger.error('Erreur récupération revenus détaillés', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Route pour les statistiques du module avancé
router.get('/admin/statistics/overview', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import('../db.js');
    const { orders, customers, menuItems } = await import('@shared/schema.js');
    const { count, sum, avg } = await import('drizzle-orm');

    const db = await getDb();

    const [totalRevenueResult] = await db.select({ total: sum(orders.totalAmount) }).from(orders);
    const [totalOrdersResult] = await db.select({ count: count() }).from(orders);
    const [totalCustomersResult] = await db.select({ count: count() }).from(customers);
    const [avgOrderValueResult] = await db.select({ avg: avg(orders.totalAmount) }).from(orders);

    const overview = {
      totalRevenue: totalRevenueResult.total || 0,
      totalOrders: totalOrdersResult.count || 0,
      totalCustomers: totalCustomersResult.count || 0,
      averageOrderValue: avgOrderValueResult.avg || 0,
      growthRate: 12.5, // Calculer basé sur les données historiques
      topProducts: [],
      recentTrends: []
    };

    res.json(overview);
  } catch (error) {
    logger.error('Erreur récupération overview', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/stats/category-analytics', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categoryData = [
      { name: 'Cafés', sales: 3250, percentage: 45 },
      { name: 'Boissons', sales: 1890, percentage: 26 },
      { name: 'Pâtisseries', sales: 1420, percentage: 20 },
      { name: 'Plats', sales: 650, percentage: 9 }
    ];

    res.json({ success: true, data: categoryData });
  } catch (error) {
    logger.error('Erreur analytics catégories', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/stats/customer-analytics', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerData = {
      newCustomers: 156,
      returningCustomers: 324,
      averageOrderValue: 12.75,
      satisfactionScore: 4.6,
      peakHours: [
        { hour: '8:00', customers: 25 },
        { hour: '12:00', customers: 45 },
        { hour: '15:00', customers: 32 },
        { hour: '18:00', customers: 38 }
      ]
    };

    res.json({ success: true, data: customerData });
  } catch (error) {
    logger.error('Erreur analytics clients', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Montage des sous-routeurs
router.use('/analytics', analyticsRouter);
router.use('/permissions', permissionsRouter);
router.use('/user-profile', userProfileRouter);
router.use('/tables', tablesRouter);
router.use('/database', databaseRouter);

// Route WebSocket endpoint pour connexion
router.get('/ws', (req, res) => {
  res.json({
    success: true,
    message: 'WebSocket endpoint disponible sur ws://localhost:5000/ws',
    instructions: 'Utilisez une connexion WebSocket pour accéder à cette API'
  });
});

// Gestion des erreurs 404
router.use('*', (req, res) => {
  logger.warn('Route non trouvée', { path: req.originalUrl });
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

export default router;