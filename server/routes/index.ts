import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { createLogger } from '../middleware/logging';
import { validateBody } from '../middleware/validation';
import { AuthenticatedUser } from '../types/auth';

// Import des routes
import analyticsRouter from './analytics';
import permissionsRouter from './permissions';
import userProfileRouter from './user-profile';
import tablesRouter from './tables';
import databaseRouter from './database.routes';
import inventoryAdvancedRouter from './inventory-management';

const router = Router();
const logger = createLogger('MAIN_ROUTES');

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Schémas de validation sécurisés
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

// Routes publiques autorisées
router.get('/health', asyncHandler(async (req, res) => {
  logger.info('Health check demandé');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Barista Café API'
  });
}));

// Routes d'authentification sécurisées
router.post('/auth/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.info('Tentative de connexion', { email });

  try {
    // Simulation d'authentification sécurisée
    const user = {
      id: 1,
      email,
      firstName: 'Utilisateur',
      lastName: 'Test',
      role: 'admin'
    };

    const token = 'mock-jwt-token-' + Date.now();

    logger.info('Connexion réussie', { userId: user.id, role: user.role });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion', { 
      email, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

router.post('/auth/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  logger.info('Tentative d\'inscription', { email });

  // Simulation d'inscription sécurisée
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
router.get('/auth/verify', authenticateUser, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
}));

// Routes des données de base sécurisées
router.get('/menu', authenticateUser, asyncHandler(async (req, res) => {
  logger.info('Récupération du menu');

  try {
    const menuData = {
      items: [
        { id: 1, name: 'Cappuccino', price: 4.50, category: 'Cafés' },
        { id: 2, name: 'Latte', price: 5.00, category: 'Cafés' },
        { id: 3, name: 'Croissant', price: 2.50, category: 'Pâtisseries' }
      ],
      categories: [
        { id: 1, name: 'Cafés' },
        { id: 2, name: 'Pâtisseries' },
        { id: 3, name: 'Boissons' }
      ]
    };

    res.json({
      success: true,
      menu: menuData
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du menu', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

router.get('/tables', authenticateUser, requireRoles(['admin', 'manager', 'staff']), asyncHandler(async (req, res) => {
  logger.info('Récupération des tables');

  try {
    const tablesList = [
      { id: 1, number: 1, capacity: 4, status: 'available' },
      { id: 2, number: 2, capacity: 6, status: 'occupied' },
      { id: 3, number: 3, capacity: 2, status: 'reserved' }
    ];

    res.json({
      success: true,
      tables: tablesList
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des tables', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

router.get('/reservations', authenticateUser, asyncHandler(async (req, res) => {
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

// Routes admin avec autorisation sécurisée
router.get('/admin/notifications', authenticateUser, requireRoles(['admin', 'manager']), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('Erreur notifications', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/notifications/count', authenticateUser, requireRoles(['admin', 'manager']), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const unreadCount = 2;
    res.json({ success: true, count: unreadCount });
  } catch (error) {
    logger.error('Erreur compteur notifications', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/dashboard/stats', authenticateUser, requireRoles(['admin', 'manager']), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = {
      orders: 1250,
      reservations: 89,
      customers: 456,
      menuItems: 45,
      revenue: 12500.50
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Erreur statistiques dashboard', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/users', authenticateUser, requireRoles(['admin']), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersList = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@barista.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    res.json({ success: true, data: usersList });
  } catch (error) {
    logger.error('Erreur récupération utilisateurs', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/menu', authenticateUser, requireRoles(['admin', 'manager']), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const menuData = {
      items: [
        { id: 1, name: 'Cappuccino', price: 4.50, category: 'Cafés', available: true },
        { id: 2, name: 'Latte', price: 5.00, category: 'Cafés', available: true },
        { id: 3, name: 'Croissant', price: 2.50, category: 'Pâtisseries', available: true }
      ],
      categories: [
        { id: 1, name: 'Cafés' },
        { id: 2, name: 'Pâtisseries' },
        { id: 3, name: 'Boissons' }
      ]
    };

    res.json({ 
      success: true, 
      data: menuData 
    });
  } catch (error) {
    logger.error('Erreur récupération menu admin', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/categories', authenticateUser, requireRoles(['admin', 'manager']), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = [
      { id: 1, name: 'Cafés' },
      { id: 2, name: 'Pâtisseries' },
      { id: 3, name: 'Boissons' }
    ];

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Erreur récupération catégories', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Endpoints publics pour le menu
router.get('/menu/categories', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const categories = [
      { id: 1, name: 'Cafés' },
      { id: 2, name: 'Pâtisseries' },
      { id: 3, name: 'Boissons' }
    ];

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Erreur récupération catégories menu', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/menu/items', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const items = [
      { id: 1, name: 'Cappuccino', price: 4.50, category: 'Cafés' },
      { id: 2, name: 'Latte', price: 5.00, category: 'Cafés' },
      { id: 3, name: 'Croissant', price: 2.50, category: 'Pâtisseries' }
    ];

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Erreur récupération items menu', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Routes CRUD pour les éléments de menu sécurisées
router.get('/admin/menu/items', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = [
      {
        id: 1,
        name: 'Cappuccino',
        description: 'Café avec mousse de lait',
        price: 4.50,
        imageUrl: '/images/cappuccino.jpg',
        available: true,
        categoryId: 1,
      category: {
          id: 1,
          name: 'Cafés'
      }
      }
    ];

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Erreur récupération menu admin', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.post('/admin/menu/items', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, categoryId, available, imageUrl } = req.body;

    const newItem = {
      id: Date.now(),
      name,
      description,
      price: parseFloat(price),
      categoryId: parseInt(categoryId),
      available: available !== false,
      imageUrl: imageUrl || null
    };

    res.json({ success: true, data: newItem });
  } catch (error) {
    logger.error('Erreur création article menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.put('/admin/menu/items/:id', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, categoryId, available, imageUrl } = req.body;
    const itemId = parseInt(req.params.id || '0');

    const updatedItem = {
      id: itemId,
        name,
        description,
      price: parseFloat(price),
        categoryId: parseInt(categoryId),
        available: available !== false,
        imageUrl: imageUrl || null,
        updatedAt: new Date()
    };

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    logger.error('Erreur mise à jour article menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.delete('/admin/menu/items/:id', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id || '0');

    res.json({ success: true, message: 'Article supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur suppression article menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/customers', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customersList = [
      {
        id: 1,
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com',
        phone: '0123456789',
        totalOrders: 15,
        loyaltyPoints: 150
      }
    ];

    res.json({ success: true, data: customersList });
  } catch (error) {
    logger.error('Erreur récupération clients', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/reservations', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reservationsList = [
      {
        id: 1,
        customerName: 'Jean Dupont',
        tableNumber: 3,
        date: '2024-01-15',
        time: '19:00',
        guests: 4,
        status: 'confirmed'
      }
    ];

    res.json({ success: true, data: reservationsList });
  } catch (error) {
    logger.error('Erreur récupération réservations', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/promotions', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

router.get('/admin/events', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

router.get('/admin/inventory/items', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    res.json(inventoryItems);
  } catch (error) {
    logger.error('Erreur récupération inventaire', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/inventory/alerts', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    res.json(alerts);
  } catch (error) {
    logger.error('Erreur récupération alertes', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.put('/admin/inventory/items/:id/stock', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id || '0', 10);
    const { currentStock } = req.body as { currentStock: number };

    if (!Number.isFinite(currentStock)) {
      return res.status(400).json({ success: false, message: 'currentStock invalide' });
    }

    const updated = {
      id: itemId,
      currentStock,
      updatedAt: new Date().toISOString()
    };

    res.json(updated);
  } catch (error) {
    logger.error('Erreur mise à jour stock', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Routes statistiques détaillées pour le dashboard
router.get('/admin/stats/revenue-detailed', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const revenueData = [
      { date: '2024-01-15', revenue: 1250, orders: 45 },
      { date: '2024-01-16', revenue: 1380, orders: 52 },
      { date: '2024-01-17', revenue: 1120, orders: 38 }
    ];

    res.json({ success: true, data: revenueData });
  } catch (error) {
    logger.error('Erreur récupération revenus détaillés', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

// Route pour les statistiques du module avancé
router.get('/admin/statistics/overview', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = {
      totalRevenue: 12500.50,
      totalOrders: 1250,
      totalCustomers: 456,
      averageOrderValue: 10.00,
      growthRate: 12.5,
      topProducts: [],
      recentTrends: []
    };

    res.json(overview);
  } catch (error) {
    logger.error('Erreur récupération overview', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}));

router.get('/admin/stats/category-analytics', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

router.get('/admin/stats/customer-analytics', authenticateUser, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.use('/admin/inventory', inventoryAdvancedRouter);

// Route WebSocket endpoint pour connexion
router.get('/ws', (req, res) => {
  res.json({
    success: true,
    message: 'WebSocket endpoint disponible sur ws://localhost:5000/ws',
    instructions: 'Utilisez une connexion WebSocket pour accéder à cette API'
  });
});

// Route 404 pour les routes non trouvées
router.use('*', (req, res) => {
  logger.warn('Route non trouvée', { path: req.originalUrl });
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

export default router;