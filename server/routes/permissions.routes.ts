import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middleware/auth';
import type { Permission, ApiResponse, PaginatedResponse } from '../../types';

const router = Router();

// Routes permissions utilisateur
router.get('/users/:userId/permissions', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions: Permission[] = [
      { id: 1, name: 'Gérer les réservations', module: 'reservations', granted: true },
      { id: 2, name: 'Gérer les clients', module: 'customers', granted: true },
      { id: 3, name: 'Gérer les employés', module: 'employees', granted: false },
      { id: 4, name: 'Gérer le menu', module: 'menu', granted: true },
      { id: 5, name: 'Voir les statistiques', module: 'statistics', granted: true },
      { id: 6, name: 'Gérer les paramètres', module: 'settings', granted: false }
    ];
    const response: ApiResponse<Permission[]> = { data: permissions, success: true, message: 'Permissions récupérées avec succès' };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions', details: errorMessage });
  }
});

router.put('/users/:userId/permissions', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissionId, granted } = req.body;

    // Validation des entrées
    if (typeof permissionId === 'undefined' || typeof granted === 'undefined') {
      return res.status(400).json({ error: 'permissionId et granted sont requis' });
    }

    const updatedPermission = {
      userId: Number(userId),
      permissionId: Number(permissionId),
      granted: Boolean(granted),
      updatedAt: new Date().toISOString()
    };
    const response: ApiResponse<{ userId: number; permissionId: number; granted: boolean; updatedAt: string }> = { message: 'Permission mise à jour avec succès', data: updatedPermission, success: true };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la permission', details: errorMessage });
  }
});

router.put('/users/:userId/status', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { active } = req.body;

    // Validation des entrées
    if (typeof active === 'undefined') {
      return res.status(400).json({ error: 'Le statut active est requis' });
    }

    const updatedUser = {
      userId: Number(userId),
      active: Boolean(active),
      updatedAt: new Date().toISOString()
    };
    const response: ApiResponse<{ userId: number; active: boolean; updatedAt: string }> = { message: 'Statut utilisateur mis à jour avec succès', data: updatedUser, success: true };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut', details: errorMessage });
  }
});

// Route pour obtenir toutes les permissions disponibles
router.get('/available', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const permissions: Permission[] = [
      {
        id: 1,
        name: 'manage_reservations',
        displayName: 'Gérer les réservations',
        description: 'Créer, modifier et supprimer des réservations',
        module: 'reservations',
        actions: ['create', 'read', 'update', 'delete']
      },
      {
        id: 2,
        name: 'manage_customers',
        displayName: 'Gérer les clients',
        description: 'Gérer la base de données clients',
        module: 'customers',
        actions: ['create', 'read', 'update', 'delete']
      },
      {
        id: 3,
        name: 'manage_menu',
        displayName: 'Gérer le menu',
        description: 'Modifier les articles et catégories du menu',
        module: 'menu',
        actions: ['create', 'read', 'update', 'delete']
      },
      {
        id: 4,
        name: 'view_analytics',
        displayName: 'Voir les analyses',
        description: 'Accéder aux statistiques et rapports',
        module: 'analytics',
        actions: ['read']
      },
      {
        id: 5,
        name: 'manage_staff',
        displayName: 'Gérer le personnel',
        description: 'Gérer les employés et leurs horaires',
        module: 'staff',
        actions: ['create', 'read', 'update', 'delete']
      },
      {
        id: 6,
        name: 'manage_inventory',
        displayName: 'Gérer l\'inventaire',
        description: 'Gérer les stocks et commandes fournisseurs',
        module: 'inventory',
        actions: ['create', 'read', 'update', 'delete']
      },
      {
        id: 7,
        name: 'manage_finances',
        displayName: 'Gérer les finances',
        description: 'Accéder à la comptabilité et aux finances',
        module: 'finances',
        actions: ['read', 'update']
      },
      {
        id: 8,
        name: 'system_admin',
        displayName: 'Administration système',
        description: 'Gérer les paramètres système et sauvegardes',
        module: 'system',
        actions: ['create', 'read', 'update', 'delete']
      }
    ];
    const response: ApiResponse<Permission[]> = { data: permissions, success: true, message: 'Permissions disponibles récupérées avec succès' };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions', details: errorMessage });
  }
});

// Route pour obtenir les permissions d'un utilisateur
router.get('/user/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }

    // Simuler la récupération des permissions utilisateur
    const userPermissions = {
      userId: parseInt(userId),
      permissions: [
        { permissionId: 1, granted: true, grantedAt: '2024-01-15T10:00:00Z' },
        { permissionId: 2, granted: true, grantedAt: '2024-01-15T10:00:00Z' },
        { permissionId: 3, granted: false, grantedAt: null },
        { permissionId: 4, granted: true, grantedAt: '2024-01-15T10:00:00Z' }
      ]
    };
    const response: ApiResponse<typeof userPermissions> = { data: userPermissions, success: true, message: 'Permissions utilisateur récupérées avec succès' };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions utilisateur', details: errorMessage });
  }
});

// Route pour mettre à jour les permissions d'un utilisateur
router.put('/user/:userId', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }
    const { permissions } = req.body;

    // Validation des données
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Format de permissions invalide' });
    }

    // Simuler la mise à jour
    const updatedPermissions = permissions.map((perm: any) => ({
      ...perm,
      userId: parseInt(userId),
      updatedAt: new Date().toISOString()
    }));
    const response: ApiResponse<typeof updatedPermissions> = {
      success: true,
      message: 'Permissions mises à jour avec succès',
      data: updatedPermissions
    };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur lors de la mise à jour des permissions', details: errorMessage });
  }
});

// Route pour les rôles prédéfinis
router.get('/roles', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const roles = [
      {
        id: 1,
        name: 'admin',
        displayName: 'Administrateur',
        description: 'Accès complet à toutes les fonctionnalités',
        permissions: [1, 2, 3, 4, 5, 6, 7, 8]
      },
      {
        id: 2,
        name: 'manager',
        displayName: 'Manager',
        description: 'Gestion opérationnelle du restaurant',
        permissions: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 3,
        name: 'employe',
        displayName: 'Employé',
        description: 'Accès limité aux fonctions de base',
        permissions: [1, 2, 4]
      },
      {
        id: 4,
        name: 'caissier',
        displayName: 'Caissier',
        description: 'Gestion des commandes et paiements',
        permissions: [1, 2]
      }
    ];
    const response: ApiResponse<typeof roles> = { data: roles, success: true, message: 'Rôles récupérés avec succès' };
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur lors de la récupération des rôles', details: errorMessage });
  }
});

export default router;