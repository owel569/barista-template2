import { Router } from 'express';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { commonSchemas } from '../../middleware/validation';
import { getDb } from '../../db';
import { users, customers, activityLogs } from '../../../shared/schema';
import { eq, and, or, desc, sql, ilike } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';
import * as crypto from 'crypto';
import { Request, Response } from 'express';

const router = Router();
const logger = createLogger('USERS_ROUTES');

// Schémas de validation
const CreateUserSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min 2 caractères)').max(50),
  lastName: z.string().min(2, 'Nom requis (min 2 caractères)').max(50),
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Mot de passe requis (min 8 caractères)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'staff', 'customer']),
  isActive: z.boolean().default(true)
});

const UpdateUserSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'staff', 'customer']).optional(),
  isActive: z.boolean().optional()
});

const UpdatePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Mot de passe requis (min 8 caractères)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
});

// Fonction utilitaire pour enregistrer une activité
async function logActivity(
  userId: string,
  action: string,
  details: string,
  req: Request,
  targetUserId?: string
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      userId: parseInt(userId, 10),
      action,
      entity: 'users',
      entityId: targetUserId ? parseInt(targetUserId, 10) : undefined,
      details: targetUserId ? `${details} (Utilisateur: ${targetUserId})` : details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    logger.error('Erreur enregistrement activité', {
      userId,
      action,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Liste des utilisateurs avec filtres et pagination
router.get('/',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateQuery(z.object({
    role: z.enum(['admin', 'manager', 'staff', 'customer']).optional(),
    isActive: z.boolean().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })),
  cacheMiddleware({ ttl: 2 * 60 * 1000, tags: ['users', 'employees'] }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const {
      role: rawRole,
      isActive: rawIsActive,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Conversion des types
    const role = typeof rawRole === 'string' ? rawRole : undefined;
    const isActive = rawIsActive === 'true' ? true : rawIsActive === 'false' ? false : undefined;

    let query = db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt
      })
      .from(users);

    // Construire les conditions
    const conditions = [];

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Tri
    const orderColumn = sortBy === 'firstName' ? users.firstName :
                       sortBy === 'lastName' ? users.lastName :
                       sortBy === 'email' ? users.email :
                       sortBy === 'role' ? users.role :
                       sortBy === 'lastLoginAt' ? users.lastLoginAt :
                       users.createdAt;

    query = (sortOrder === 'desc' ?
      query.orderBy(desc(orderColumn)) :
      query.orderBy(orderColumn)) as typeof query;

    // Pagination
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const offset = (pageNum - 1) * limitNum;
    const usersData = await query.limit(limitNum).offset(offset);

    // Compte total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const count = countResult[0]?.count || 0;

    logger.info('Utilisateurs récupérés', {
      count: usersData.length,
      total: count,
      filters: { role, isActive, search }
    });

    res.json({
      success: true,
      data: usersData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    });
    return;
  })
);

// Détails d'un utilisateur
router.get('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(commonSchemas.idSchema),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['users'] }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const userIdParam = req.params.id;
    const id = userIdParam ? parseInt(userIdParam, 10) : 0;

    if (!id || isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
      return;
    }

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    // Si c'est un client, récupérer les données client associées
    let customerData = null;
    if (user.role === 'customer') {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, id));
      customerData = customer;
    }

    // Récupérer les dernières activités
    const recentActivities = await db
      .select({
        action: activityLogs.action,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        ipAddress: activityLogs.ipAddress
      })
      .from(activityLogs)
      .where(eq(activityLogs.userId, id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(10);

    const result = {
      ...user,
      customerData,
      recentActivities
    };

    logger.info('Utilisateur récupéré', { userId: id, role: user.role });

    res.json({
      success: true,
      data: result
    });
    return;
  })
);

// Créer un utilisateur
router.post('/',
  authenticateUser,
  requireRoles(['admin']),
  validateBody(CreateUserSchema),
  invalidateCache(['users', 'employees']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { password, ...userData } = req.body;

    // Vérifier si l'email existe déjà
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userData.email));

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 12);

    // Créer l'utilisateur
    const userIdNumber = Math.floor(Math.random() * 1000000) + 1;
    const [newUser] = await db
      .insert(users)
      .values({
        id: userIdNumber,
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt
      });

    // Si c'est un client, créer aussi l'entrée customer
    if (userData.role === 'customer') {
      await db.insert(customers).values({
        userId: userIdNumber, // Utilisez userIdNumber ici
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        totalOrders: 0,
        loyaltyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Enregistrer l'activité
    await logActivity(
      currentUser.id,
      'CREATE_USER',
      `Utilisateur créé: ${userData.firstName} ${userData.lastName}`,
      req,
      String(userIdNumber) // Convertir en string pour logActivity
    );

    logger.info('Utilisateur créé', {
      userId: userIdNumber,
      email: userData.email,
      role: userData.role,
      createdBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Utilisateur créé avec succès'
    });
    return;
  })
);

// Mettre à jour un utilisateur
router.put('/:id',
  authenticateUser,
  requireRoles(['admin']),
  validateParams(commonSchemas.idSchema),
  validateBody(UpdateUserSchema),
  invalidateCache(['users', 'employees']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;
    const userIdParam = req.params.id;
    const id = userIdParam ? parseInt(userIdParam, 10) : 0;

    if (!id || isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
      return;
    }

    // Vérifier que l'utilisateur existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    // Vérifier l'email en cas de modification
    if (req.body.email && req.body.email !== existingUser.email) {
      const [emailExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.email, req.body.email),
          sql`${users.id} != ${id}`
        ));

      if (emailExists) {
        res.status(409).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
        return;
      }
    }

    // Mettre à jour l'utilisateur
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        email: req.body.email,
        phone: req.body.phone || null,
        role: req.body.role,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    // Si c'est un client, mettre à jour aussi l'entrée customer
    if (updatedUser.role === 'customer') {
      await db
        .update(customers)
        .set({
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          updatedAt: new Date()
        })
        .where(eq(customers.userId, id));
    }

    // Enregistrer l'activité
    await logActivity(
      currentUser.id,
      'UPDATE_USER',
      `Utilisateur mis à jour: ${Object.keys(req.body).join(', ')}`,
      req,
      String(id)
    );

    logger.info('Utilisateur mis à jour', {
      userId: id,
      changes: Object.keys(req.body),
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Utilisateur mis à jour avec succès'
    });
  })
);

// Mettre à jour le mot de passe d'un utilisateur
router.patch('/:id/password',
  authenticateUser,
  requireRoles(['admin']),
  validateParams(commonSchemas.idSchema),
  validateBody(UpdatePasswordSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;
    const userIdParam = req.params.id;
    const id = userIdParam ? parseInt(userIdParam, 10) : 0;

    if (!id || isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
      return;
    }

    // Vérifier que l'utilisateur existe
    const [existingUser] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, id));

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hash(req.body.password, 12);

    // Mettre à jour le mot de passe
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));

    // Enregistrer l'activité
    await logActivity(
      currentUser.id,
      'UPDATE_USER_PASSWORD',
      `Mot de passe réinitialisé pour: ${existingUser.firstName} ${existingUser.lastName}`,
      req,
      String(id)
    );

    logger.info('Mot de passe utilisateur mis à jour', {
      userId: id,
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  })
);

// Supprimer un utilisateur (désactivation)
router.delete('/:id',
  authenticateUser,
  requireRoles(['admin']),
  validateParams(commonSchemas.idSchema),
  invalidateCache(['users', 'employees']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const currentUser = (req as any).user;
    const userIdParam = req.params.id;
    const id = userIdParam ? parseInt(userIdParam, 10) : 0;

    if (!id || isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
      return;
    }

    // Empêcher la suppression de son propre compte
    if (id === currentUser.id) {
      res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
      return;
    }

    // Désactiver l'utilisateur au lieu de le supprimer
    const [deactivatedUser] = await db
      .update(users)
      .set({
        isActive: false, // Utilisation de isActive au lieu de active
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      });

    if (!deactivatedUser) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    // Enregistrer l'activité
    await logActivity(
      currentUser.id,
      'DEACTIVATE_USER',
      `Utilisateur désactivé: ${deactivatedUser.firstName} ${deactivatedUser.lastName}`,
      req,
      String(id)
    );

    logger.info('Utilisateur désactivé', {
      userId: id,
      email: deactivatedUser.email,
      deactivatedBy: currentUser.id
    });

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });
  })
);

// Statistiques des utilisateurs
router.get('/stats/overview',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['users', 'stats'] }),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();

    const stats = await db
      .select({
        role: users.role,
        isActive: users.isActive,
        count: sql<number>`count(*)`
      })
      .from(users)
      .groupBy(users.role, users.isActive);

    const result = {
      total: stats.reduce((sum, stat) => sum + stat.count, 0),
      byRole: stats.reduce((acc, stat) => {
        if (!acc[stat.role]) {
          acc[stat.role] = { total: 0, active: 0, inactive: 0 };
        }
        const roleStats = acc[stat.role];
        if (roleStats) {
          roleStats.total += stat.count;
          if (stat.isActive) {
            roleStats.active += stat.count;
          } else {
            roleStats.inactive += stat.count;
          }
        }
        return acc;
      }, {} as Record<string, { total: number; active: number; inactive: number }>)
    };

    logger.info('Statistiques utilisateurs récupérées', result);

    res.json({
      success: true,
      data: result
    });
  })
);

export default router;