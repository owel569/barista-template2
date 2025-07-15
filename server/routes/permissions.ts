
import { Router } from 'express';
import { db } from '../db.js';
import { users, permissions, userPermissions } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Récupérer les permissions d'un utilisateur spécifique
router.get('/users/:userId/permissions', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Si c'est un directeur, retourner toutes les permissions
    if (user[0].role === 'directeur') {
      return res.json({
        role: 'directeur',
        hasAllPermissions: true,
        permissions: 'all'
      });
    }

    // Pour les employés, récupérer les permissions spécifiques
    const userPerms = await db
      .select({
        module: permissions.module,
        actions: permissions.actions
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.granted, true)
      ));

    // Formater les permissions selon le format attendu
    const formattedPermissions: Record<string, string[]> = {};
    userPerms.forEach(perm => {
      if (!formattedPermissions[perm.module]) {
        formattedPermissions[perm.module] = [];
      }
      formattedPermissions[perm.module].push(...perm.actions);
    });

    res.json(formattedPermissions);
  } catch (error) {
    console.error('Erreur permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour les permissions d'un utilisateur
router.put('/users/:userId/permissions', authenticateToken, requireRole(['directeur']), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { permissionId, granted, module, action } = req.body;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher la modification des permissions d'un directeur
    if (user[0].role === 'directeur') {
      return res.status(403).json({ 
        error: 'Les permissions du directeur ne peuvent pas être modifiées' 
      });
    }

    // Vérifier si la permission existe déjà
    const existingPerm = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permissionId, permissionId)
      ))
      .limit(1);

    if (existingPerm.length) {
      // Mettre à jour la permission existante
      await db
        .update(userPermissions)
        .set({ 
          granted,
          updatedAt: new Date(),
          updatedBy: req.user?.username || 'system'
        })
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId)
        ));
    } else {
      // Créer une nouvelle permission
      await db.insert(userPermissions).values({
        userId,
        permissionId,
        granted,
        grantedBy: req.user?.username || 'system',
        grantedAt: new Date()
      });
    }

    // Log de l'activité
    console.log(`Permission ${granted ? 'accordée' : 'révoquée'} pour l'utilisateur ${userId} - Module: ${module}, Action: ${action}`);

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

export default router;
