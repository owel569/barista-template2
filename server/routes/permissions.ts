import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error-handler-enhanced';
import { createLogger } from '../middleware/logging';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { validateBody, validateParams } from '../middleware/validation';
import { getDb } from '../db';
import { permissions, users, activityLogs } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();
const logger = createLogger('PERMISSIONS');

// ==========================================
// TYPES ET INTERFACES
// ==========================================

import type { Permission, ApiResponse, PaginatedResponse } from '@custom-types';

export interface PermissionTemplate {
  name: string;
  description: string;
  permissions: Record<string, {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
}

export interface BulkPermissionUpdate {
  userId: number;
  permissions: Array<{
    module: string;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
}

// ==========================================
// CONSTANTES
// ==========================================

const AVAILABLE_MODULES = [
  'dashboard',
  'orders',
  'inventory',
  'customers',
  'employees',
  'reports',
  'settings',
  'analytics',
  'loyalty',
  'delivery'
];

const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    name: 'Manager',
    description: 'Accès complet à tous les modules',
    permissions: AVAILABLE_MODULES.reduce((acc, module) => {
      acc[module] = {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      };
      return acc;
    }, {} as Record<string, any>)
  },
  {
    name: 'Staff',
    description: 'Accès limité aux opérations quotidiennes',
    permissions: AVAILABLE_MODULES.reduce((acc, module) => {
      acc[module] = {
        canView: true,
        canCreate: ['orders', 'customers'].includes(module),
        canUpdate: ['orders', 'customers'].includes(module),
        canDelete: false
      };
      return acc;
    }, {} as Record<string, any>)
  },
  {
    name: 'Viewer',
    description: 'Accès en lecture seule',
    permissions: AVAILABLE_MODULES.reduce((acc, module) => {
      acc[module] = {
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false
      };
      return acc;
    }, {} as Record<string, any>)
  }
];

// ==========================================
// SCHÉMAS DE VALIDATION ZOD
// ==========================================

const permissionSchema = z.object({
  userId: z.number().positive('ID utilisateur invalide'),
  module: z.string().min(1, 'Module requis'),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean()
});

const bulkPermissionSchema = z.object({
  userId: z.number().positive('ID utilisateur invalide'),
  permissions: z.array(z.object({
    module: z.string().min(1, 'Module requis'),
    canView: z.boolean(),
    canCreate: z.boolean(),
    canUpdate: z.boolean(),
    canDelete: z.boolean()
  }))
});

const templateSchema = z.object({
  userId: z.number().positive('ID utilisateur invalide'),
  templateName: z.string().min(1, 'Nom du template requis')
});

// ==========================================
// ROUTES AVEC AUTHENTIFICATION ET VALIDATION
// ==========================================

// Routes des permissions avec authentification et autorisation
router.get('/overview', authenticateUser, requireRoles(['admin']), asyncHandler(async (req, res) => {
  try {
  const db = await getDb();
    
    // Récupérer les statistiques des permissions
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalPermissions = await db.select({ count: sql<number>`count(*)` }).from(permissions);
    
    const overview = {
      totalUsers: totalUsers[0]?.count || 0,
      totalPermissions: totalPermissions[0]?.count || 0,
      templates: PERMISSION_TEMPLATES,
      modules: AVAILABLE_MODULES
    };

    return res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Erreur overview permissions', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des permissions'
    });
  }
}));

router.get('/user/:userId', authenticateUser, requireRoles(['admin']), requirePermission('users', 'canView'), validateParams(z.object({
  userId: z.string().regex(/^\d+$/, 'ID utilisateur doit être un nombre')
})), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userIdNum = parseInt(userId || '0');
  
  try {
  const db = await getDb();

    // Récupérer les permissions de l'utilisateur
    const userPermissions = await db.select()
    .from(permissions)
      .where(eq(permissions.userId, userIdNum));
    
    // Récupérer les informations de l'utilisateur
    const user = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role
    }).from(users).where(eq(users.id, userIdNum)).limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    return res.json({
      success: true,
      data: {
        user: user[0],
        permissions: userPermissions
      }
    });
  } catch (error) {
    logger.error('Erreur permissions utilisateur', { 
      userId, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des permissions'
    });
  }
}));

router.get('/templates', authenticateUser, requireRoles(['admin']), asyncHandler(async (req, res) => {
  try {
  return res.json({
    success: true,
      data: PERMISSION_TEMPLATES
    });
  } catch (error) {
    logger.error('Erreur templates permissions', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des templates'
    });
  }
}));

router.post('/permission', authenticateUser, requireRoles(['admin']), requirePermission('users', 'canUpdate'), validateBody(z.object({
  userId: z.number().positive('ID utilisateur invalide'),
  module: z.string().min(1, 'Module requis'),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean()
})), asyncHandler(async (req, res) => {
  const { userId, module, canView, canCreate, canUpdate, canDelete } = req.body;
  
  try {
  const db = await getDb();
    
    // Vérifier que l'utilisateur existe
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier que le module est valide
    if (!AVAILABLE_MODULES.includes(module)) {
    return res.status(400).json({
      success: false,
        message: 'Module invalide'
      });
    }
    
    // Créer ou mettre à jour la permission
    const existingPermission = await db.select()
      .from(permissions)
      .where(and(eq(permissions.userId, userId), eq(permissions.module, module)))
      .limit(1);
    
    if (existingPermission.length > 0) {
      // Mettre à jour
      await db.update(permissions)
        .set({ canView, canCreate, canUpdate, canDelete })
        .where(and(eq(permissions.userId, userId), eq(permissions.module, module)));
    } else {
      // Créer
      await db.insert(permissions).values({
      userId,
        module,
        canView,
        canCreate,
        canUpdate,
        canDelete
      });
    }
    
    // Enregistrer l'activité
    await db.insert(activityLogs).values({
      userId: req.user?.id,
      action: 'permission_updated',
      entity: 'permissions',
      details: `Permission ${module} mise à jour pour l'utilisateur ${userId}`
    });

    res.json({
      success: true,
      message: 'Permission mise à jour avec succès'
    });
  } catch (error) {
    logger.error('Erreur mise à jour permission', { 
      userId, 
      module, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la permission'
    });
  }
}));

router.post('/bulk-update', authenticateUser, requireRoles(['admin']), requirePermission('users', 'canUpdate'), validateBody(z.object({
  updates: z.array(z.object({
    userId: z.number().positive('ID utilisateur invalide'),
    permissions: z.array(z.object({
      module: z.string().min(1, 'Module requis'),
      canView: z.boolean(),
      canCreate: z.boolean(),
      canUpdate: z.boolean(),
      canDelete: z.boolean()
    }))
  }))
})), asyncHandler(async (req, res) => {
  const { updates } = req.body;
  
  try {
  const db = await getDb();

    for (const update of updates) {
      const { userId, permissions } = update;
      
      // Vérifier que l'utilisateur existe
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0) {
        continue; // Ignorer cet utilisateur
      }
      
      for (const permission of permissions) {
        const { module, canView, canCreate, canUpdate, canDelete } = permission;
        
        if (!AVAILABLE_MODULES.includes(module)) {
          continue; // Ignorer ce module invalide
        }
        
        // Mettre à jour ou créer la permission
        const existingPermission = await db.select()
          .from(permissions)
          .where(and(eq(permissions.userId, userId), eq(permissions.module, module)))
          .limit(1);
        
        if (existingPermission.length > 0) {
          await db.update(permissions)
            .set({ canView, canCreate, canUpdate, canDelete })
            .where(and(eq(permissions.userId, userId), eq(permissions.module, module)));
        } else {
          await db.insert(permissions).values({
            userId,
            module,
            canView,
            canCreate,
            canUpdate,
            canDelete
          });
        }
      }
    }
    
    // Enregistrer l'activité
    await db.insert(activityLogs).values({
      userId: req.user?.id || 0,
      action: 'bulk_permissions_update',
      entity: 'permissions',
      details: `Mise à jour en masse de ${updates.length} utilisateurs`
    });

    res.json({
      success: true,
      message: 'Permissions mises à jour en masse avec succès'
    });
  } catch (error) {
    logger.error('Erreur mise à jour masse permissions', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour en masse des permissions'
    });
  }
}));

router.post('/apply-template', authenticateUser, requireRoles(['admin']), requirePermission('users', 'canUpdate'), validateBody(z.object({
  userId: z.number().positive('ID utilisateur invalide'),
  templateName: z.string().min(1, 'Nom du template requis')
}))), asyncHandler(async (req, res) => {
  const { userId, templateName } = req.body;
  
  try {
  const db = await getDb();
    
    // Vérifier que l'utilisateur existe
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Trouver le template
    const template = PERMISSION_TEMPLATES.find(t => t.name === templateName);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé'
      });
    }
    
    // Appliquer le template
    for (const [module, permFlags] of Object.entries(template.permissions)) {
      const existingPermission = await db.select()
        .from(permissions)
        .where(and(eq(permissions.userId, userId), eq(permissions.module, module)))
        .limit(1);

      if (existingPermission.length > 0) {
        await db.update(permissions)
          .set(permFlags)
          .where(and(eq(permissions.userId, userId), eq(permissions.module, module)));
      } else {
        await db.insert(permissions).values({
          userId,
          module,
          ...permFlags
        });
      }
    }
    
    // Enregistrer l'activité
    await db.insert(activityLogs).values({
      userId: req.user?.id || 0,
      action: 'template_applied',
      entity: 'permissions',
      details: `Template ${templateName} appliqué à l'utilisateur ${userId}`
    });

    return res.json({
      success: true,
      message: `Template ${templateName} appliqué avec succès`
    });
  } catch (error) {
    logger.error('Erreur application template', { 
      userId, 
      templateName, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'application du template'
    });
  }
});

router.delete('/user/:userId', authenticateUser, requireRoles(['admin']), requirePermission('users', 'canDelete'), validateParams(z.object({
  userId: z.string().regex(/^\d+$/, 'ID utilisateur doit être un nombre')
}))), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userIdNum = parseInt(userId || '0');
  
  try {
  const db = await getDb();

    // Supprimer toutes les permissions de l'utilisateur
    await db.delete(permissions).where(eq(permissions.userId, userIdNum));

    // Enregistrer l'activité
    await db.insert(activityLogs).values({
      userId: req.user?.id || 0,
      action: 'permissions_deleted',
      entity: 'permissions',
      entityId: userIdNum,
      details: `Toutes les permissions supprimées pour l'utilisateur ${userIdNum}`
    });

    res.json({
      success: true,
      message: 'Permissions supprimées avec succès'
    });
  } catch (error) {
    logger.error('Erreur suppression permissions', { 
      userId, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des permissions'
    });
  }
});

export default router;