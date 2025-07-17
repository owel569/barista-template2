import { Router } from 'express';
import { createLogger } from '../middleware/logging';
import { asyncHandler } from '../middleware/error-handler';
import { authenticateToken } from '../middleware/auth';
import { validateRequestWithLogging } from '../middleware/logging';
import { z } from 'zod';

// Import des routes
import analyticsRouter from './analytics';
import permissionsRouter from './permissions';
import userProfileRouter from './user-profile';
import tablesRouter from './tables';

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
router.post('/auth/login', validateRequestWithLogging(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.info('Tentative de connexion', { email });

  // Simulation d'authentification (à remplacer par vraie logique)
  if (email === 'admin@barista.com' && password === 'admin123') {
    const token = 'mock-jwt-token-' + Date.now();
    const user = {
      id: 1,
      email,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };

    logger.info('Connexion réussie', { userId: user.id, role: user.role });

    res.json({
      success: true,
      user,
      token
    });
  } else {
    logger.warn('Échec de connexion', { email });
    res.status(401).json({
      success: false,
      message: 'Identifiants invalides'
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

// Routes des modules
router.use('/analytics', analyticsRouter);
router.use('/permissions', permissionsRouter);
router.use('/user-profile', userProfileRouter);
router.use('/tables', tablesRouter);

// Routes des données de base
router.get('/menu', asyncHandler(async (req, res) => {
  logger.info('Récupération du menu');

  const menu = [
    {
      id: 1,
      name: 'Espresso',
      price: 2.50,
      category: 'Cafés',
      image: '/images/espresso.jpg',
      description: 'Café court et intense'
    },
    {
      id: 2,
      name: 'Cappuccino',
      price: 3.50,
      category: 'Cafés',
      image: '/images/cappuccino.jpg',
      description: 'Café avec mousse de lait'
    },
    {
      id: 3,
      name: 'Croissant',
      price: 2.00,
      category: 'Pâtisseries',
      image: '/images/croissant.jpg',
      description: 'Viennoiserie française'
    }
  ];

  res.json({
    success: true,
    menu
  });
}));

router.get('/tables', asyncHandler(async (req, res) => {
  logger.info('Récupération des tables');

  const tables = [
    { id: 1, number: 1, capacity: 2, status: 'available' },
    { id: 2, number: 2, capacity: 4, status: 'occupied' },
    { id: 3, number: 3, capacity: 6, status: 'reserved' },
    { id: 4, number: 4, capacity: 2, status: 'available' }
  ];

  res.json({
    success: true,
    tables
  });
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

// Gestion des erreurs 404
router.use('*', (req, res) => {
  logger.warn('Route non trouvée', { path: req.originalUrl });
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

export default router;