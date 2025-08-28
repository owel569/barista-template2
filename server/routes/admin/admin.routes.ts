import { Router } from 'express';
import { requireRoleHierarchy } from '../../middleware/security';
import { validateBody } from '../../middleware/validation';
import { z } from 'zod';

// Import des sous-routes admin
import customersRoutes from './customers.routes';
import menuAdminRoutes from './menu-admin.routes';
import statisticsRoutes from './statistics.routes';

const router = Router();

// Connecter les sous-routes
router.use('/customers', customersRoutes);
router.use('/menu', menuAdminRoutes);
router.use('/statistics', statisticsRoutes);

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
  role: z.enum(['employee', 'manager', 'admin'])
});

// Configuration du restaurant - Seuls les managers+ peuvent voir
router.get('/settings', requireRoleHierarchy('manager'), async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
});

// Mettre à jour la configuration - Seuls les admins peuvent modifier
router.put('/settings', requireRoleHierarchy('admin'), validateBody(SettingsSchema), async (req, res) => {
  try {
    const settings = req.body;
    
    // TODO: Valider et sauvegarder en base de données
    
    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres'
    });
  }
});

// Gestion des utilisateurs - Seuls les admins peuvent créer des utilisateurs
router.post('/users', requireRoleHierarchy('admin'), validateBody(UserCreateSchema), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // TODO: Créer l'utilisateur en base de données
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

// Activer/désactiver un utilisateur
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    // TODO: Mettre à jour le statut en base de données
    
    res.json({
      success: true,
      message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// Logs d'activité
router.get('/activity-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    // TODO: Récupérer depuis la base de données
    const logs = [
      {
        id: '1',
        userId: '1',
        username: 'admin',
        action: 'login',
        description: 'Connexion à l\'administration',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1'
      },
      {
        id: '2',
        userId: '1',
        username: 'admin',
        action: 'menu_update',
        description: 'Modification du prix du Cappuccino',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        ipAddress: '192.168.1.1'
      }
    ];
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: logs.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs'
    });
  }
});

export default router;