import { Router } from 'express';
import { createLogger } from '../middleware/logging';
import { asyncHandler } from '../middleware/error-handler';
import { authenticateToken } from '../middleware/auth';
import { validateRequestWithLogging } from '../middleware/logging';
import { z } from 'zod';

// Import des routes
import analyticsRouter from './analytics';
import permissionsRouter from './permissions';
import { userProfileRouter } from './user-profile';
import { tablesRouter } from './tables';

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

    res.json({
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
  } catch (error) {
    logger.error('Erreur lors de la connexion', { error: error.message });
    res.status(500).json({
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
    user: (req as any).user
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
    logger.error('Erreur lors de la récupération du menu', { error: error.message });
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
    logger.error('Erreur lors de la récupération des tables', { error: error.message });
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
router.get('/admin/notifications', authenticateToken, asyncHandler(async (req, res) => {
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
    logger.error('Erreur notifications', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/notifications/count', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const unreadCount = 2; // Nombre de notifications non lues
    res.json({ success: true, count: unreadCount });
  } catch (error) {
    logger.error('Erreur compteur notifications', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { getDb } = await import('../db.js');
    const { orders, reservations, customers, menuItems } = await import('@shared/schema.js');
    const { count, sum } = await import('drizzle-orm');

    const db = await getDb();
    
    // Récupérer les statistiques
    const [ordersCount] = await db.select({ count: count() }).from(orders);
    const [reservationsCount] = await db.select({ count: count() }).from(reservations);
    const [customersCount] = await db.select({ count: count() }).from(customers);
    const [menuItemsCount] = await db.select({ count: count() }).from(menuItems);
    
    // Revenus totaux (simulation)
    const [totalRevenue] = await db.select({ 
      total: sum(orders.totalAmount) 
    }).from(orders) || [{ total: 0 }];

    const stats = {
      orders: ordersCount.count || 0,
      reservations: reservationsCount.count || 0,
      customers: customersCount.count || 0,
      menuItems: menuItemsCount.count || 0,
      revenue: totalRevenue.total || 0,
      todayOrders: 0, // À implémenter avec filtre date
      todayRevenue: 0, // À implémenter avec filtre date
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Erreur statistiques dashboard', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/users', authenticateToken, asyncHandler(async (req, res) => {
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
    logger.error('Erreur récupération utilisateurs', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/menu', authenticateToken, asyncHandler(async (req, res) => {
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
    logger.error('Erreur récupération menu admin', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/categories', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { getDb } = await import('../db.js');
    const { menuCategories } = await import('@shared/schema.js');

    const db = await getDb();
    
    const categories = await db.select().from(menuCategories);

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Erreur récupération catégories', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Gestion des erreurs 404
router.use('*', (req, res) => {
  logger.warn('Route non trouvée', { path: req.originalUrl });
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

export default router;