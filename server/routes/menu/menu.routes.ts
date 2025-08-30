import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
import { commonSchemas } from '../../utils/validation';
import { getDb } from '../../db';
import { menuItems, menuCategories, activityLogs, categories } from '../../../shared/schema';
import { eq, and, or, desc, sql, ilike, inArray } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('MENU_ROUTES');

// Schémas de validation
const CreateMenuItemSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  description: z.string().min(10, 'Description requise (min 10 caractères)').max(500),
  price: z.number().min(0.01, 'Prix doit être > 0'),
  categoryId: z.string().uuid('ID catégorie invalide'),
  imageUrl: z.string().url('URL image invalide').optional(),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  preparationTime: z.number().int().min(1, 'Temps de préparation minimum 1 minute').max(120),
  allergens: z.array(z.string()).default([]),
  nutritionalInfo: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional()
  }).optional(),
  ingredients: z.array(z.string()).default([])
});

const UpdateMenuItemSchema = CreateMenuItemSchema.partial().extend({
  id: z.string().uuid('ID invalide')
});

const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)').max(50),
  description: z.string().max(200).optional(),
  imageUrl: z.string().url('URL image invalide').optional(),
  displayOrder: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true)
});

// Fonction utilitaire pour enregistrer une activité
async function logMenuActivity(
  userId: string,
  action: string,
  details: string,
  req: any,
  itemId?: string
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      userId,
      action,
      details: itemId ? `${details} (Article: ${itemId})` : details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      createdAt: new Date()
    });
  } catch (error) {
    logger.error('Erreur enregistrement activité menu', {
      userId,
      action,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Liste des articles du menu avec filtres
router.get('/',
  validateQuery(z.object({
    categoryId: z.string().uuid().optional(),
    isAvailable: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),
    isVegan: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    search: z.string().optional(),
    ...commonSchemas.pagination.shape,
    sortBy: z.string().optional(),
    sortOrder: commonSchemas.sortOrder
  })),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['menu', 'categories'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const {
      categoryId,
      isAvailable,
      isVegetarian,
      isVegan,
      isGlutenFree,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    let query = db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        categoryId: menuItems.categoryId,
        categoryName: categories.name,
        imageUrl: menuItems.imageUrl,
        isAvailable: menuItems.isAvailable,
        isVegetarian: menuItems.isVegetarian,
        isVegan: menuItems.isVegan,
        isGlutenFree: menuItems.isGlutenFree,
        preparationTime: menuItems.preparationTime,
        allergens: menuItems.allergens,
        nutritionalInfo: menuItems.nutritionalInfo,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id));

    // Construire les conditions
    const conditions = [];

    if (categoryId) {
      conditions.push(eq(menuItems.categoryId, categoryId));
    }

    if (isAvailable !== undefined) {
      conditions.push(eq(menuItems.isAvailable, isAvailable));
    }

    if (isVegetarian !== undefined) {
      conditions.push(eq(menuItems.isVegetarian, isVegetarian));
    }

    if (isVegan !== undefined) {
      conditions.push(eq(menuItems.isVegan, isVegan));
    }

    if (isGlutenFree !== undefined) {
      conditions.push(eq(menuItems.isGlutenFree, isGlutenFree));
    }

    if (search) {
      conditions.push(
        or(
          ilike(menuItems.name, `%${search}%`),
          ilike(menuItems.description, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'name' ? menuItems.name :
                       sortBy === 'price' ? menuItems.price :
                       sortBy === 'preparationTime' ? menuItems.preparationTime :
                       sortBy === 'createdAt' ? menuItems.createdAt :
                       menuItems.name;

    query = sortOrder === 'desc' ?
      query.orderBy(desc(orderColumn)) :
      query.orderBy(orderColumn);

    // Pagination
    const offset = (page - 1) * limit;
    const menuData = await query.limit(limit).offset(offset);

    // Compte total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    logger.info('Menu récupéré', {
      count: menuData.length,
      total: count,
      filters: { categoryId, isAvailable, search }
    });

    res.json({
      success: true,
      data: menuData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  })
);

// Détails d'un article
router.get('/:id',
  validateParams(commonSchemas.idSchema),
  cacheMiddleware({ ttl: 10 * 60 * 1000, tags: ['menu'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [menuItem] = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        categoryId: menuItems.categoryId,
        categoryName: categories.name,
        imageUrl: menuItems.imageUrl,
        isAvailable: menuItems.isAvailable,
        isVegetarian: menuItem.isVegetarian || false,
        isVegan: menuItem.isVegan || false,
        isGlutenFree: menuItem.isGlutenFree || false,
        preparationTime: menuItems.preparationTime,
        allergens: menuItems.allergens,
        nutritionalInfo: menuItems.nutritionalInfo,
        ingredients: menuItems.ingredients,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(eq(menuItems.id, id));

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    logger.info('Article menu récupéré', { itemId: id });

    res.json({
      success: true,
      data: menuItem
    });
  })
);

// Créer un article (admin seulement)
router.post('/',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(CreateMenuItemSchema),
  invalidateCache(['menu']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;

    // Vérifier que la catégorie existe
    const [category] = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, req.body.categoryId));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier l'unicité du nom
    const [existingItem] = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.name, req.body.name));

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Un article avec ce nom existe déjà'
      });
    }

    // Créer l'article
    const itemId = crypto.randomUUID();
    const [newItem] = await db
      .insert(menuItems)
      .values({
        id: itemId,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'CREATE_MENU_ITEM',
      `Article créé: ${req.body.name}`,
      req,
      itemId
    );

    logger.info('Article menu créé', {
      itemId,
      name: req.body.name,
      category: category.name,
      createdBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Article créé avec succès'
    });
  })
);

// Mettre à jour un article
router.put('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(commonSchemas.idSchema),
  validateBody(UpdateMenuItemSchema.omit({ id: true })),
  invalidateCache(['menu']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;

    // Vérifier que l'article existe
    const [existingItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier l'unicité du nom si modifié
    if (req.body.name && req.body.name !== existingItem.name) {
      const [nameExists] = await db
        .select({ id: menuItems.id })
        .from(menuItems)
        .where(and(
          eq(menuItems.name, req.body.name),
          sql`${menuItems.id} != ${id}`
        ));

      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: 'Un article avec ce nom existe déjà'
        });
      }
    }

    // Mettre à jour l'article
    const [updatedItem] = await db
      .update(menuItems)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, id))
      .returning();

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'UPDATE_MENU_ITEM',
      `Article mis à jour: ${Object.keys(req.body).join(', ')}`,
      req,
      id
    );

    logger.info('Article menu mis à jour', {
      itemId: id,
      changes: Object.keys(req.body),
      updatedBy: currentUser.id
    });

    res.json({
      success: true,
      data: updatedItem,
      message: 'Article mis à jour avec succès'
    });
  })
);

// Supprimer un article (désactivation)
router.delete('/:id',
  authenticateUser,
  requireRoles(['admin']),
  validateParams(commonSchemas.idSchema),
  invalidateCache(['menu']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;
    const { id } = req.params;

    // Désactiver l'article au lieu de le supprimer
    const [deactivatedItem] = await db
      .update(menuItems)
      .set({
        isAvailable: false,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, id))
      .returning({
        name: menuItems.name
      });

    if (!deactivatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'DEACTIVATE_MENU_ITEM',
      `Article désactivé: ${deactivatedItem.name}`,
      req,
      id
    );

    logger.info('Article menu désactivé', {
      itemId: id,
      name: deactivatedItem.name,
      deactivatedBy: currentUser.id
    });

    res.json({
      success: true,
      message: 'Article désactivé avec succès'
    });
  })
);

// Liste des catégories
router.get('/categories/list',
  cacheMiddleware({ ttl: 10 * 60 * 1000, tags: ['categories'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();

    const categoriesData = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.displayOrder, categories.name);

    logger.info('Catégories récupérées', { count: categoriesData.length });

    res.json({
      success: true,
      data: categoriesData
    });
  })
);

// Créer une catégorie
router.post('/categories',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(CreateCategorySchema),
  invalidateCache(['categories']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;

    // Vérifier l'unicité du nom
    const [existingCategory] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, req.body.name));

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà'
      });
    }

    // Créer la catégorie
    const categoryId = crypto.randomUUID();
    const [newCategory] = await db
      .insert(categories)
      .values({
        id: categoryId,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'CREATE_CATEGORY',
      `Catégorie créée: ${req.body.name}`,
      req
    );

    logger.info('Catégorie créée', {
      categoryId,
      name: req.body.name,
      createdBy: currentUser.id
    });

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Catégorie créée avec succès'
    });
  })
);

export default router;