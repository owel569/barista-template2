import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation';
// Import retiré car non utilisé
import { getDb } from '../../db';
import { menuItems, menuCategories, activityLogs } from '../../../shared/schema';
import { eq, and, or, desc, sql, ilike } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('MENU_ROUTES');

// Schémas de validation
const CreateMenuItemSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  description: z.string().min(10, 'Description requise (min 10 caractères)').max(500),
  price: z.number().min(0.01, 'Prix doit être > 0'),
  categoryId: z.number().int().positive('ID catégorie invalide'),
  imageUrl: z.string().url('URL image invalide').optional(),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  stock: z.number().int().min(0).default(0)
});

const UpdateMenuItemSchema = CreateMenuItemSchema.partial().extend({
  id: z.number().int().positive('ID invalide')
});

const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)').max(50),
  description: z.string().max(200).optional(),
  imageUrl: z.string().url('URL image invalide').optional(),
  sortOrder: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true)
});

// Fonction utilitaire pour enregistrer une activité
async function logMenuActivity(
  userId: number,
  action: string,
  details: string,
  req: { ip?: string | undefined; connection?: { remoteAddress?: string | undefined } | undefined; get?: (header: string) => string | undefined },
  itemId?: number
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      userId,
      action,
      entity: 'menu_item',
      details: itemId ? `${details} (Article: ${itemId})` : details,
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.get?.('User-Agent') || '',
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

// === ROUTES SPÉCIFIQUES AVANT LES PARAMÈTRES ===

// Liste des articles du menu avec filtres
router.get('/items',
  validateQuery(z.object({
    categoryId: z.coerce.number().int().positive().optional(),
    isAvailable: z.coerce.boolean().optional(),
    isVegetarian: z.coerce.boolean().optional(),
    isGlutenFree: z.coerce.boolean().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['menu', 'categories'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const {
      categoryId,
      isAvailable,
      isVegetarian,
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
        categoryName: menuCategories.name,
        imageUrl: menuItems.imageUrl,
        isAvailable: menuItems.available,
        isVegetarian: menuItems.isVegetarian,
        isGlutenFree: menuItems.isGlutenFree,
        stock: menuItems.stock,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id));

    // Construire les conditions
    const conditions = [];

    if (categoryId && typeof categoryId === 'number') {
      conditions.push(eq(menuItems.categoryId, categoryId));
    }

    if (isAvailable !== undefined && typeof isAvailable === 'boolean') {
      conditions.push(eq(menuItems.available, isAvailable));
    }

    if (isVegetarian !== undefined && typeof isVegetarian === 'boolean') {
      conditions.push(eq(menuItems.isVegetarian, isVegetarian));
    }

    if (isGlutenFree !== undefined && typeof isGlutenFree === 'boolean') {
      conditions.push(eq(menuItems.isGlutenFree, isGlutenFree));
    }

    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(menuItems.name, `%${search}%`),
          ilike(menuItems.description, `%${search}%`)
        )
      );
    }

    // Appliquer les conditions
    let filteredQuery = query as any;
    if (conditions.length > 0) {
      filteredQuery = filteredQuery.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'name' ? menuItems.name :
                       sortBy === 'price' ? menuItems.price :
                       sortBy === 'createdAt' ? menuItems.createdAt :
                       menuItems.name;

    filteredQuery = (sortOrder === 'desc' ?
      filteredQuery.orderBy(desc(orderColumn)) :
      filteredQuery.orderBy(orderColumn)) as typeof filteredQuery;

    // Pagination
    const pageNum = typeof page === 'number' ? page : 1;
    const limitNum = typeof limit === 'number' ? limit : 20;
    const offset = (pageNum - 1) * limitNum;
    const menuData = await filteredQuery.limit(limitNum).offset(offset);

    // Compte total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(menuItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const count = countResult[0]?.count || 0;

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
        totalPages: Math.ceil(count / limitNum)
      }
    });
  })
);

// === ROUTES SPÉCIFIQUES AVANT LES PARAMÈTRES ===

// Liste des catégories
router.get('/categories/list',
  cacheMiddleware({ ttl: 10 * 60 * 1000, tags: ['categories'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();

    const categoriesData = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.isActive, true))
      .orderBy(menuCategories.sortOrder, menuCategories.name);

    logger.info('Catégories récupérées', { count: categoriesData.length });

    return res.json({
      success: true,
      data: categoriesData
    });
  })
);

// Créer une catégorie
router.post('/categories',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateBody(CreateCategorySchema),
  invalidateCache(['categories']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = (req as any).user;

    // Vérifier l'unicité du nom
    const [existingCategory] = await db
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(eq(menuCategories.name, req.body.name));

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà'
      });
    }

    // Créer la catégorie
    const [newCategory] = await db
      .insert(menuCategories)
      .values({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!newCategory) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la catégorie'
      });
    }

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'CREATE_CATEGORY',
      `Catégorie créée: ${req.body.name}`,
      req,
      newCategory.id
    );

    logger.info('Catégorie créée', {
      categoryId: newCategory.id,
      name: req.body.name,
      createdBy: currentUser.id
    });

    return res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Catégorie créée avec succès'
    });
  })
);

// Obtenir toutes les catégories
router.get('/categories', asyncHandler(async (req, res) => {
  try {
    const db = getDb();
    const categories = await db
      .select()
      .from(menuCategories)
      .orderBy(menuCategories.sortOrder);

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Erreur récupération catégories:', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des catégories'
    });
  }
}));

// === ROUTES AVEC PARAMÈTRES APRÈS ===

// Détails d'un article du menu
router.get('/items/:id',
  validateParams(z.object({ id: z.string().regex(/^\d+$/, 'ID doit être numérique').transform(Number) })),
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
        imageUrl: menuItems.imageUrl,
        isAvailable: menuItems.available,
        isVegetarian: menuItems.isVegetarian,
        isGlutenFree: menuItems.isGlutenFree,
        stock: menuItems.stock,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt
      })
      .from(menuItems)
      .where(eq(menuItems.id, Number(id)));

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    logger.info('Article menu récupéré', { itemId: id });

    return res.json({
      success: true,
      data: menuItem
    });
  })
);

// Route racine - redirection vers /items
router.get('/', (req, res) => {
  res.redirect('/api/menu/items');
});

// Créer un article (admin seulement)
router.post('/items',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateBody(CreateMenuItemSchema),
  invalidateCache(['menu']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
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

    // Créer l'article avec mapping correct des champs
    const [newItem] = await db
      .insert(menuItems)
      .values({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        categoryId: req.body.categoryId,
        imageUrl: req.body.imageUrl || null,
        available: req.body.isAvailable ?? true,
        isVegetarian: req.body.isVegetarian ?? false,
        isGlutenFree: req.body.isGlutenFree ?? false,
        stock: req.body.stock ?? 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!newItem) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'article'
      });
    }

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'CREATE_MENU_ITEM',
      `Article créé: ${req.body.name}`,
      req,
      newItem.id
    );

    logger.info('Article menu créé', {
      itemId: newItem.id,
      name: req.body.name,
      category: req.body.categoryId,
      createdBy: currentUser.id
    });

    return res.status(201).json({
      success: true,
      data: newItem,
      message: 'Article créé avec succès'
    });
  })
);

// Mettre à jour un article
router.put('/items/:id',
  authenticateUser,
  requireRoles(['directeur', 'gerant']),
  validateParams(z.object({ id: z.string().regex(/^\d+$/, 'ID doit être numérique').transform(Number) })),
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
      .where(eq(menuItems.id, Number(id)));

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
          sql`${menuItems.id} != ${Number(id)}`
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
      .where(eq(menuItems.id, Number(id)))
      .returning();

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'UPDATE_MENU_ITEM',
      `Article mis à jour: ${Object.keys(req.body).join(', ')}`,
      req,
      Number(id)
    );

    logger.info('Article menu mis à jour', {
      itemId: id,
      changes: Object.keys(req.body),
      updatedBy: currentUser.id
    });

    return res.json({
      success: true,
      data: updatedItem,
      message: 'Article mis à jour avec succès'
    });
  })
);

// Supprimer un article (désactivation)
router.delete('/items/:id',
  authenticateUser,
  requireRoles(['directeur']),
  validateParams(z.object({ id: z.string().regex(/^\d+$/, 'ID doit être numérique').transform(Number) })),
  invalidateCache(['menu']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const currentUser = req.user;
    const { id } = req.params;

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que l'article existe avant de le désactiver
    const [existingItem] = await db
      .select({ 
        id: menuItems.id, 
        name: menuItems.name,
        available: menuItems.available 
      })
      .from(menuItems)
      .where(eq(menuItems.id, Number(id)));

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    if (!existingItem.available) {
      return res.status(400).json({
        success: false,
        message: 'Article déjà désactivé'
      });
    }

    // Désactiver l'article au lieu de le supprimer
    const [deactivatedItem] = await db
      .update(menuItems)
      .set({
        available: false,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, Number(id)))
      .returning({
        id: menuItems.id,
        name: menuItems.name,
        available: menuItems.available
      });

    if (!deactivatedItem) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la désactivation de l\'article'
      });
    }

    // Enregistrer l'activité
    await logMenuActivity(
      currentUser.id,
      'DEACTIVATE_MENU_ITEM',
      `Article désactivé: ${deactivatedItem.name}`,
      req,
      Number(id)
    );

    logger.info('Article menu désactivé', {
      itemId: Number(id),
      name: deactivatedItem.name,
      deactivatedBy: currentUser.id
    });

    return res.json({
      success: true,
      data: deactivatedItem,
      message: 'Article désactivé avec succès'
    });
  })
);

export default router;