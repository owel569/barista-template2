import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Middleware d'authentification simple
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  // Validation JWT simplifiée
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barista-secret-key-ultra-secure-2025');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Schema pour les permissions
const permissionSchema = z.object({
  module: z.string(),
  actions: z.array(z.string())
});

// Récupérer les permissions d'un utilisateur
router.get('/users/:userId/permissions', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Si c'est un directeur, il a toutes les permissions
    if (req.user?.role === 'directeur') {
      return res.json({
        role: 'directeur',
        hasAllPermissions: true,
        permissions: 'all'
      });
    }

    // Pour les employés, retourner les permissions par défaut
    const defaultPermissions = {
      reservations: ['view', 'create', 'edit'],
      customers: ['view', 'create', 'edit'],
      menu: ['view'],
      orders: ['view', 'create', 'edit'],
      tables: ['view'],
      statistics: ['view']
    };

    res.json(defaultPermissions);
  } catch (error) {
    console.error('Erreur permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour les permissions
router.put('/users/:userId/permissions', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { permissionId, granted, module, action } = req.body;

    // Vérifier que l'utilisateur est directeur
    if (req.user?.role !== 'directeur') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Simuler la mise à jour
    console.log(`Permission ${granted ? 'accordée' : 'révoquée'} pour utilisateur ${userId} - Module: ${module}, Action: ${action}`);

    res.json({ 
      success: true, 
      message: `Permission ${granted ? 'accordée' : 'révoquée'} avec succès`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur mise à jour permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer toutes les permissions disponibles
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const permissions = [
      { id: 1, name: 'Gérer les réservations', module: 'reservations', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 2, name: 'Gérer les clients', module: 'customers', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 3, name: 'Gérer les employés', module: 'employees', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 4, name: 'Gérer le menu', module: 'menu', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 5, name: 'Voir les statistiques', module: 'statistics', actions: ['view'] },
      { id: 6, name: 'Gérer les paramètres', module: 'settings', actions: ['view', 'edit'] },
      { id: 7, name: 'Gérer les commandes', module: 'orders', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 8, name: 'Gérer les tables', module: 'tables', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 9, name: 'Gérer l\'inventaire', module: 'inventory', actions: ['view', 'create', 'edit', 'delete'] },
      { id: 10, name: 'Gérer la fidélité', module: 'loyalty', actions: ['view', 'create', 'edit', 'delete'] }
    ];
    res.json(permissions);
  } catch (error) {
    res.status(500).json([]);
  }
});

export default router;