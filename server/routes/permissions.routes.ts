
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes permissions utilisateur
router.get('/users/:userId/permissions', authenticateToken, requireRole('directeur'), async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions = [
      { id: 1, name: 'Gérer les réservations', module: 'reservations', granted: true },
      { id: 2, name: 'Gérer les clients', module: 'customers', granted: true },
      { id: 3, name: 'Gérer les employés', module: 'employees', granted: false },
      { id: 4, name: 'Gérer le menu', module: 'menu', granted: true },
      { id: 5, name: 'Voir les statistiques', module: 'statistics', granted: true },
      { id: 6, name: 'Gérer les paramètres', module: 'settings', granted: false }
    ];
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions' });
  }
});

router.put('/users/:userId/permissions', authenticateToken, requireRole('directeur'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissionId, granted } = req.body;
    
    const updatedPermission = {
      userId: Number(userId),
      permissionId: Number(permissionId),
      granted: Boolean(granted),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ message: 'Permission mise à jour avec succès', data: updatedPermission });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la permission' });
  }
});

router.put('/users/:userId/status', authenticateToken, requireRole('directeur'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { active } = req.body;
    
    const updatedUser = {
      userId: Number(userId),
      active: Boolean(active),
      updatedAt: new Date().toISOString()
    };
    
    res.json({ message: 'Statut utilisateur mis à jour avec succès', data: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

export default router;
