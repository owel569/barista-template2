import { Router, Request, Response } from 'express';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { z } from 'zod';

const logger = createLogger('ADMIN');

// Import des sous-routes admin
import customersRoutes from './customers.routes';
import menuAdminRoutes from './menu-admin.routes';
import statisticsRoutes from './statistics.routes';
import reservationsRoutes from './reservations.routes';

const router = Router();

// Connecter les sous-routes
router.use('/customers', customersRoutes);
router.use('/menu', menuAdminRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/reservations', reservationsRoutes);

// Routes de maintenance
router.get('/maintenance', 
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Récupérer les tâches de maintenance depuis la base
    res.json({
      success: true,
      data: [],
      message: 'Liste des tâches de maintenance'
    });
  })
);

router.post('/maintenance',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Créer une nouvelle tâche de maintenance
    res.status(201).json({
      success: true,
      message: 'Tâche de maintenance créée'
    });
  })
);

// Routes des équipements  
router.get('/equipment',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Récupérer la liste des équipements
    res.json({
      success: true,
      data: [],
      message: 'Liste des équipements'
    });
  })
);

router.post('/equipment',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Ajouter un nouvel équipement
    res.status(201).json({
      success: true,
      message: 'Équipement ajouté'
    });
  })
);

// Schémas de validation pour l'admin
const SettingsSchema = z.object({
  restaurantName: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/),
  email: z.string().email(),
  openingHours: z.record(z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/)
  })),
  taxRate: z.number().min(0).max(100),
  currency: z.string().length(3)
});

const UserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['employe', 'gerant', 'directeur'])
});

// Configuration du restaurant - Seuls les managers+ peuvent voir
router.get('/settings', 
  authenticateUser, 
  requireRoles(['gerant', 'directeur']),
  asyncHandler(async (req: Request, res: Response) => {
  try {
    // TODO: Récupérer depuis la base de données
    const settings = {
      restaurantName: 'Barista Café',
      address: '123 Rue de la Paix, Paris',
      phone: '+33 1 23 45 67 89',
      email: 'contact@barista-cafe.fr',
      openingHours: {
        monday: { open: '07:00', close: '19:00' },
        tuesday: { open: '07:00', close: '19:00' },
        wednesday: { open: '07:00', close: '19:00' },
        thursday: { open: '07:00', close: '19:00' },
        friday: { open: '07:00', close: '20:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '09:00', close: '18:00' }
      },
      taxRate: 20.0,
      currency: 'EUR'
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Erreur récupération settings', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
  })
);

// Mettre à jour la configuration - Seuls les admins peuvent modifier
router.put('/settings', 
  authenticateUser, 
  requireRoles(['directeur']),
  validateBody(SettingsSchema), 
  asyncHandler(async (req: Request, res: Response) => {
    const settings = req.body;

    // TODO: Valider et sauvegarder en base de données

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès'
    });
  })
);

// Gestion des utilisateurs - Seuls les admins peuvent créer des utilisateurs
router.post('/users', 
  authenticateUser, 
  requireRoles(['directeur']),
  validateBody(UserCreateSchema), 
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;

    // Vérification supplémentaire côté serveur
    if (req.user?.role !== 'directeur') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Permissions insuffisantes'
      });
    }

    // TODO: Créer l'utilisateur en base de données
    logger.info('Création utilisateur demandée', { 
      requestedBy: req.user?.username, 
      targetUser: username,
      targetRole: role 
    });

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès'
    });
  })
);

// Supprimer un utilisateur - Seuls les directeurs
router.delete('/users/:id', 
  authenticateUser,
  requireRoles(['directeur']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Vérification supplémentaire
    if (req.user?.role !== 'directeur') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les directeurs peuvent supprimer des utilisateurs'
      });
    }

    // TODO: Supprimer l'utilisateur de la base de données
    logger.info('Suppression utilisateur demandée', { 
      requestedBy: req.user?.username, 
      targetUserId: id 
    });

    return res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  })
);

// Activer/désactiver un utilisateur - Directeurs et gérants
router.patch('/users/:id/status', 
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Validation du booléen
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le statut doit être un booléen'
      });
    }

    // TODO: Mettre à jour le statut en base de données
    logger.info('Modification statut utilisateur', { 
      requestedBy: req.user?.username, 
      targetUserId: id,
      newStatus: active 
    });

    return res.json({
      success: true,
      message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`
    });
  })
);

// Logs d'activité
router.get('/activity-logs', authenticateUser, async (req, res) => {
  try {
    // Simulation des logs d'activité
    const logs = [
      {
        id: 1,
        action: 'Connexion utilisateur',
        user: 'admin@barista-cafe.com',
        timestamp: new Date().toISOString(),
        details: 'Connexion réussie'
      },
      {
        id: 2,
        action: 'Création réservation',
        user: 'client@example.com',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        details: 'Réservation table 4 pour 4 personnes'
      }
    ];

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Erreur récupération logs:', error as Record<string, unknown>);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour les notifications count
router.get('/notifications/count', authenticateUser, async (req, res) => {
  try {
    const notifications = {
      pendingReservations: 3,
      newMessages: 2,
      pendingOrders: 5,
      lowStockItems: 2
    };

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Erreur notifications count:', error as Record<string, unknown>);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;