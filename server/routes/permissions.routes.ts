
import { Router } from 'express';''
import { authenticateToken, requireRole } from '''../middleware/auth';''
import { ROLES } from '''../utils/constants';

const router = Router();

// Types des rôles''
export type Role = '''directeur' | '''manager'' | '''serveur' | '''cuisinier'' | '''caissier' | '''employe'';

// Routes permissions utilisateur'
router.get('''/users/:userId/permissions'', authenticateToken, requireRole('''directeur'), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {''
      return res.status(400).json({ error: '''Paramètre userId manquant' });
    }
    const userIdNum = Number.parseInt(userId);
    if (Number.isNaN(userIdNum)) {''
      return res.status(400).json({ error: '''ID utilisateur invalide' });
    }
    const permissions = [''
      { id: 1, name: '''Gérer les réservations', module: '''reservations'', granted: true },'
      { id: 2, name: '''Gérer les clients'', module: '''customers', granted: true },''
      { id: 3, name: '''Gérer les employés', module: '''employees'', granted: false },'
      { id: 4, name: '''Gérer le menu'', module: '''menu', granted: true },''
      { id: 5, name: '''Voir les statistiques', module: '''statistics'', granted: true },'
      { id: 6, name: '''Gérer les paramètres'', module: '''settings', granted: false }
    ];
    return res.json(permissions);
  } catch (error) {''
    return res.status(500).json({ error: '''Erreur lors de la récupération des permissions' });
  }
});
''
router.put('''/users/:userId/permissions', authenticateToken, requireRole('''directeur''), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {'
      return res.status(400).json({ error: '''Paramètre userId manquant'' });
    }
    const userIdNum = Number.parseInt(userId);
    if (Number.isNaN(userIdNum)) {'
      return res.status(400).json({ error: '''ID utilisateur invalide'' });
    }
    const { permissionId, granted } = req.body;
    
    const updatedPermission = {
      userId: userIdNum,
      permissionId: Number.parseInt(permissionId),
      granted: Boolean(granted),
      updatedAt: new Date().toISOString()
    };
    '
    return res.json({ message: '''Permission mise à jour avec succès'', data: updatedPermission });
  } catch (error) {'
    return res.status(500).json({ error: '''Erreur lors de la mise à jour de la permission'' });
  }
});
'
router.put('''/users/:userId/status'', authenticateToken, requireRole('''directeur'), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {''
      return res.status(400).json({ error: '''Paramètre userId manquant' });
    }
    const userIdNum = Number.parseInt(userId);
    if (Number.isNaN(userIdNum)) {''
      return res.status(400).json({ error: '''ID utilisateur invalide' });
    }
    const { active } = req.body;
    
    const updatedUser = {
      userId: userIdNum,
      active: Boolean(active),
      updatedAt: new Date().toISOString()
    };
    ''
    return res.json({ message: '''Statut utilisateur mis à jour avec succès', data: updatedUser });
  } catch (error) {''
   return res.status(500).json({ error: '''Erreur lors de la mise à jour du statut' });
  }
});

// Route pour obtenir toutes les permissions disponibles''
router.get('''/available', authenticateToken, requireRole('''directeur''), async (req, res) => {
  try {
    const permissions = [
      {
        id: 1,'
        name: '''manage_reservations'','
        displayName: '''Gérer les réservations'','
        description: '''Créer, modifier et supprimer des réservations'','
        module: '''reservations'','
        actions: ['''create'', '''read', '''update'', '''delete']
      },
      {
        id: 2,''
        name: '''manage_customers',''
        displayName: '''Gérer les clients',''
        description: '''Gérer la base de données clients',''
        module: '''customers',''
        actions: ['''create', '''read'', '''update', '''delete'']
      },
      {
        id: 3,'
        name: '''manage_menu'','
        displayName: '''Gérer le menu'','
        description: '''Modifier les articles et catégories du menu'','
        module: '''menu'','
        actions: ['''create'', '''read', '''update'', '''delete']
      },
      {
        id: 4,''
        name: '''view_analytics',''
        displayName: '''Voir les analyses',''
        description: '''Accéder aux statistiques et rapports',''
        module: '''analytics',''
        actions: ['''read']
      },
      {
        id: 5,''
        name: '''manage_staff',''
        displayName: '''Gérer le personnel',''
        description: '''Gérer les employés et leurs horaires',''
        module: '''staff',''
        actions: ['''create', '''read'', '''update', '''delete'']
      },
      {
        id: 6,'
        name: '''manage_inventory'','
        displayName: '''Gérer l''inventaire''','
        description: ''Gérer les stocks et commandes fournisseurs''','
        module: ''inventory''','
        actions: [''create''', 'read''', ''update''', 'delete''']
      },
      {
        id: 7,''
        name: 'manage_finances''',''
        displayName: 'Gérer les finances''',''
        description: 'Accéder à la comptabilité et aux finances''',''
        module: 'finances''',''
        actions: ['read''', ''update''']
      },
      {
        id: 8,'
        name: ''system_admin''','
        displayName: ''Administration système''','
        description: ''Gérer les paramètres système et sauvegardes''','
        module: ''system''','
        actions: [''create''', 'read''', ''update''', 'delete''']
      }
    ];
    res.json(permissions);
  } catch (error) {''
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions''' });
  }
});
''
// Route pour obtenir les permissions d'un utilisateur''
router.get('''/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {''
      return res.status(400).json({ error: '''Paramètre userId manquant' });
    }
    const userIdNum = Number.parseInt(userId);
    if (Number.isNaN(userIdNum)) {''
      return res.status(400).json({ error: '''ID utilisateur invalide' });
    }
    // Simuler la récupération des permissions utilisateur
    const userPermissions = {
      userId: userIdNum,
      permissions: [''
        { permissionId: 1, granted: true, grantedAt: '''2024-01-15T10:00:00Z' },''
        { permissionId: 2, granted: true, grantedAt: '''2024-01-15T10:00:00Z' },
        { permissionId: 3, granted: false, grantedAt: null },''
        { permissionId: 4, granted: true, grantedAt: '''2024-01-15T10:00:00Z' }
      ]
    };
    return res.json(userPermissions);
  } catch (error) {''
    return res.status(500).json({ error: '''Erreur lors de la récupération des permissions utilisateur' });
  }
});
''
// Route pour mettre à jour les permissions d'''un utilisateur'
router.put(''/user/:userId''', authenticateToken, requireRole('directeur'''), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {''
      return res.status(400).json({ error: 'Paramètre userId manquant''' });
    }
    const userIdNum = Number.parseInt(userId);
    if (Number.isNaN(userIdNum)) {''
      return res.status(400).json({ error: 'ID utilisateur invalide''' });
    }
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {''
      return res.status(400).json({ error: 'Format de permissions invalide''' });
    }
    
    const updatedPermissions = permissions.map(perm => ({
      ...perm,
      userId: userIdNum,
      updatedAt: new Date().toISOString()
    }));
    
    return res.json({
      success: true,''
      message: 'Permissions mises à jour avec succès''',
      permissions: updatedPermissions
    });
  } catch (error) {''
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des permissions''' });
  }
});

// Route pour les rôles prédéfinis''
router.get('/roles''', authenticateToken, requireRole(''directeur'''), async (req, res) => {
  try {
    const roles = [
      {
        id: 1,'
        name: ''directeur''','
        displayName: ''Directeur''','
        description: ''Accès complet à toutes les fonctionnalités''',
        permissions: [1, 2, 3, 4, 5, 6, 7, 8]
      },
      {
        id: 2,'
        name: ''manager''','
        displayName: ''Manager''','
        description: ''Gestion opérationnelle du restaurant''',
        permissions: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 3,'
        name: ''employe''','
        displayName: ''Employé''','
        description: ''Accès limité aux fonctions de base''',
        permissions: [1, 2, 4]
      },
      {
        id: 4,'
        name: ''caissier''','
        displayName: ''Caissier''','
        description: ''Gestion des commandes et paiements''',
        permissions: [1, 2]
      }
    ];
    res.json(roles);
  } catch (error) {'
    res.status(500).json({ error: ''Erreur lors de la récupération des rôles''' });
  }
});

export default router;
''