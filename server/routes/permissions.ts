import { Router } from 'express';
import { eq, and, or, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation';
import { asyncHandler } from '../middleware/error-handler';
import { getDb } from '../db';
import { permissions, users, activityLogs } from '../../shared/schema';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Modules disponibles dans le système
const AVAILABLE_MODULES = [
  'dashboard',
  'users',
  'customers',
  'menu',
  'orders',
  'reservations',
  'tables',
  'employees',
  'analytics',
  'reports',
  'settings',
  'logs',
  'inventory',
  'payments',
  'delivery',
  'loyalty',
  'feedback',
  'maintenance',
  'backup'
] as const;

const permissionSchema = z.object({
  userId: z.number().positive(),
  module: z.enum(AVAILABLE_MODULES),
  canView: z.boolean().default(true),
  canCreate: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false)
});

const bulkPermissionSchema = z.object({
  userId: z.number().positive(),
  permissions: z.array(z.object({
    module: z.enum(AVAILABLE_MODULES),
    canView: z.boolean().default(true),
    canCreate: z.boolean().default(false),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false)
  }))
});

// Modèles de permissions prédéfinis
const PERMISSION_TEMPLATES = {
  admin: {
    name: 'Administrateur',
    permissions: AVAILABLE_MODULES.map(module => ({
      module,
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true
    }))
  },
  manager: {
    name: 'Manager',
    permissions: [
      { module: 'dashboard', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'users', canView: true, canCreate: false, canUpdate: true, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'menu', canView: true, canCreate: true, canUpdate: true, canDelete: true },
      { module: 'orders', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'reservations', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'tables', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'employees', canView: true, canCreate: false, canUpdate: true, canDelete: false },
      { module: 'analytics', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'reports', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'settings', canView: true, canCreate: false, canUpdate: true, canDelete: false },
      { module: 'logs', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'inventory', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'payments', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'delivery', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'loyalty', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'feedback', canView: true, canCreate: false, canUpdate: true, canDelete: false },
      { module: 'maintenance', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'backup', canView: false, canCreate: false, canUpdate: false, canDelete: false }
    ]
  },
  employee: {
    name: 'Employé',
    permissions: [
      { module: 'dashboard', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'users', canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'customers', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'menu', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'orders', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'reservations', canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: 'tables', canView: true, canCreate: false, canUpdate: true, canDelete: false },
      { module: 'employees', canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'analytics', canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'reports', canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'settings', canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'logs', canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'inventory', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'payments', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'delivery', canView: true, canCreate: false, canUpdate: true, canDelete: false },
      { module: 'loyalty', canView: true, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'feedback', canView: true, canCreate: true, canUpdate: false, canDelete: false },
      { module: 'maintenance', canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: 'backup', canView: false, canCreate: false, canUpdate: false, canDelete: false }
    ]
  },
  viewer: {
    name: 'Consultation seule',
    permissions: AVAILABLE_MODULES.map(module => ({
      module,
      canView: ['dashboard', 'menu', 'orders', 'reservations', 'tables'].includes(module),
      canCreate: false,
      canUpdate: false,
      canDelete: false
    }))
  }
};

// Obtenir toutes les permissions d'un utilisateur
router.get('/user/:userId', authenticateUser, validateParams(z.object({ userId: z.coerce.number() })), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { userId } = req.params;

  const userPermissions = await db.select({
    id: permissions.id,
    module: permissions.module,
    canView: permissions.canView,
    canCreate: permissions.canCreate,
    canUpdate: permissions.canUpdate,
    canDelete: permissions.canDelete
  }).from(permissions)
    .where(eq(permissions.userId, Number(userId)));

  // Créer un objet avec tous les modules et leurs permissions
  const permissionsMap = AVAILABLE_MODULES.reduce((acc, module) => {
    const modulePermission = userPermissions.find((p: any) => p.module === module);
    acc[module] = modulePermission || {
      module,
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false
    };
    return acc;
  }, {} as Record<string, any>);

  res.json({
    success: true,
    permissions: permissionsMap,
    availableModules: AVAILABLE_MODULES
  });
}));

// Obtenir les modèles de permissions
router.get('/templates', authenticateUser, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    templates: PERMISSION_TEMPLATES
  });
}));

// Créer ou mettre à jour une permission
router.post('/permission', authenticateUser, validateBody(permissionSchema), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { userId, module, canView, canCreate, canUpdate, canDelete } = req.body;

  // Vérifier si la permission existe déjà
  const existingPermission = await db.select()
    .from(permissions)
    .where(and(
      eq(permissions.userId, userId),
      eq(permissions.module, module)
    ))
    .limit(1);

  let result;
  if (existingPermission.length > 0) {
    // Mettre à jour la permission existante
    result = await db.update(permissions)
      .set({ canView, canCreate, canUpdate, canDelete })
      .where(eq(permissions.id, existingPermission[0].id))
      .returning();
  } else {
    // Créer une nouvelle permission
    result = await db.insert(permissions)
      .values({ userId, module, canView, canCreate, canUpdate, canDelete })
      .returning();
  }

  // Log de l'activité
  await db.insert(activityLogs).values({
    userId: req.user.id,
    action: existingPermission.length > 0 ? 'update' : 'create',
    entity: 'permission',
    entityId: result[0].id,
    details: `Permission ${module} pour l'utilisateur ${userId}`
  });

  res.json({
    success: true,
    message: 'Permission mise à jour avec succès',
    permission: result[0]
  });
}));

// Mettre à jour plusieurs permissions en une fois
router.post('/bulk-update', authenticateUser, validateBody(bulkPermissionSchema), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { userId, permissions: userPermissions } = req.body;

  // Supprimer toutes les permissions existantes pour cet utilisateur
  await db.delete(permissions).where(eq(permissions.userId, userId));

  // Insérer les nouvelles permissions
  const newPermissions = await db.insert(permissions)
    .values(userPermissions.map(p => ({
      userId,
      module: p.module,
      canView: p.canView,
      canCreate: p.canCreate,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete
    })))
    .returning();

  // Log de l'activité
  await db.insert(activityLogs).values({
    userId: req.user.id,
    action: 'bulk_update',
    entity: 'permission',
    entityId: userId,
    details: `Mise à jour en masse des permissions pour l'utilisateur ${userId}`
  });

  res.json({
    success: true,
    message: 'Permissions mises à jour avec succès',
    permissions: newPermissions
  });
}));

// Appliquer un modèle de permissions
router.post('/apply-template', authenticateUser, validateBody(z.object({
  userId: z.number().positive(),
  templateName: z.enum(['admin', 'manager', 'employee', 'viewer'])
})), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { userId, templateName } = req.body;

  const template = PERMISSION_TEMPLATES[templateName];
  if (!template) {
    return res.status(400).json({
      success: false,
      message: 'Modèle de permissions non trouvé'
    });
  }

  // Supprimer toutes les permissions existantes pour cet utilisateur
  await db.delete(permissions).where(eq(permissions.userId, userId));

  // Insérer les nouvelles permissions basées sur le modèle
  const newPermissions = await db.insert(permissions)
    .values(template.permissions.map(p => ({
      userId,
      module: p.module,
      canView: p.canView,
      canCreate: p.canCreate,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete
    })))
    .returning();

  // Log de l'activité
  await db.insert(activityLogs).values({
    userId: req.user.id,
    action: 'apply_template',
    entity: 'permission',
    entityId: userId,
    details: `Application du modèle ${template.name} pour l'utilisateur ${userId}`
  });

  res.json({
    success: true,
    message: `Modèle ${template.name} appliqué avec succès`,
    permissions: newPermissions
  });
}));

// Obtenir les permissions de tous les utilisateurs (vue d'ensemble)
router.get('/overview', authenticateUser, asyncHandler(async (req, res) => {
  const db = await getDb();

  const usersWithPermissions = await db.select({
    userId: users.id,
    username: users.username,
    firstName: users.firstName,
    lastName: users.lastName,
    role: users.role,
    module: permissions.module,
    canView: permissions.canView,
    canCreate: permissions.canCreate,
    canUpdate: permissions.canUpdate,
    canDelete: permissions.canDelete
  }).from(users)
    .leftJoin(permissions, eq(users.id, permissions.userId))
    .orderBy(users.username);

  // Regrouper par utilisateur
  const userPermissionsMap = usersWithPermissions.reduce((acc, row: unknown) => {
    if (!acc[row.userId]) {
      acc[row.userId] = {
        id: row.userId,
        username: row.username,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        permissions: {}
      };
    }

    if (row.module) {
      acc[row.userId].permissions[row.module] = {
        canView: row.canView,
        canCreate: row.canCreate,
        canUpdate: row.canUpdate,
        canDelete: row.canDelete
      };
    }

    return acc;
  }, {} as Record<number, any>);

  res.json({
    success: true,
    users: Object.values(userPermissionsMap),
    availableModules: AVAILABLE_MODULES
  });
}));

// Vérifier une permission spécifique
router.get('/check/:userId/:module/:action', authenticateUser, validateParams(z.object({
  userId: z.coerce.number(),
  module: z.enum(AVAILABLE_MODULES),
  action: z.enum(['view', 'create', 'update', 'delete'])
})), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { userId, module, action } = req.params;

  const permission = await db.select()
    .from(permissions)
    .where(and(
      eq(permissions.userId, Number(userId)),
      eq(permissions.module, module)
    ))
    .limit(1);

  let hasPermission = false;
  if (permission.length > 0) {
    const p = permission[0];
    switch (action) {
      case 'view':
        hasPermission = p.granted; // Utiliser le champ granted existant
        break;
      case 'create':
        hasPermission = p.granted;
        break;
      case 'update':
        hasPermission = p.granted;
        break;
      case 'delete':
        hasPermission = p.granted;
        break;
    }
  }

  res.json({
    success: true,
    hasPermission,
    module,
    action
  });
}));

// Supprimer toutes les permissions d'un utilisateur
router.delete('/user/:userId', authenticateUser, validateParams(z.object({ userId: z.coerce.number() })), asyncHandler(async (req, res) => {
  const db = await getDb();
  const { userId } = req.params;

  await db.delete(permissions).where(eq(permissions.userId, Number(userId)));

  // Log de l'activité
  await db.insert(activityLogs).values({
    userId: req.user?.id || 0,
    action: 'delete',
    entity: 'permission',
    entityId: Number(userId),
    details: `Suppression de toutes les permissions pour l'utilisateur ${userId}`
  });

  res.json({
    success: true,
    message: 'Toutes les permissions ont été supprimées'
  });
}));

export default router;