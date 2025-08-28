
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';
import { createLogger } from '../../middleware/logging';
import { authenticateUser, requireRoles } from '../../middleware/auth';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../../middleware/validation';
import { getDb } from '../../db';
import { menuCategories, menuItems, customers, loyaltyTransactions } from '../../../shared/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache-advanced';

const router = Router();
const logger = createLogger('MENU_ROUTES');

// Schémas de validation
const CreateMenuItemSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  description: z.string().optional(),
  price: z.number().positive('Prix doit être positif'),
  categoryId: z.string().uuid('ID catégorie invalide'),
  available: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  nutritionInfo: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional()
  }).optional()
});

const UpdateMenuItemSchema = CreateMenuItemSchema.partial();

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(50),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).default(0)
});

// Routes pour les catégories
router.get('/categories',
  cacheMiddleware({ ttl: 10 * 60 * 1000, tags: ['menu', 'categories'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    
    const categories = await db
      .select()
      .from(menuCategories)
      .orderBy(menuCategories.displayOrder, menuCategories.name);

    logger.info('Catégories récupérées', { count: categories.length });

    res.json({
      success: true,
      data: categories
    });
  })
);

router.post('/categories',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(CreateCategorySchema),
  invalidateCache(['menu', 'categories']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    
    const [category] = await db
      .insert(menuCategories)
      .values(req.body)
      .returning();

    logger.info('Catégorie créée', { categoryId: category.id, name: category.name });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Catégorie créée avec succès'
    });
  })
);

// Routes pour les articles de menu
router.get('/',
  validateQuery(z.object({
    categoryId: z.string().uuid().optional(),
    available: z.boolean().optional(),
    search: z.string().optional(),
    ...commonSchemas.paginationSchema.shape,
    ...commonSchemas.sortSchema.shape
  })),
  cacheMiddleware({ ttl: 5 * 60 * 1000, tags: ['menu', 'items'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { categoryId, available, search, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query;

    let query = db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        categoryId: menuItems.categoryId,
        available: menuItems.available,
        imageUrl: menuItems.imageUrl,
        ingredients: menuItems.ingredients,
        allergens: menuItems.allergens,
        nutritionInfo: menuItems.nutritionInfo,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: menuCategories.name
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id));

    // Filtres
    const conditions = [];
    
    if (categoryId) {
      conditions.push(eq(menuItems.categoryId, categoryId));
    }
    
    if (available !== undefined) {
      conditions.push(eq(menuItems.available, available));
    }
    
    if (search) {
      conditions.push(
        sql`${menuItems.name} ILIKE ${`%${search}%`} OR ${menuItems.description} ILIKE ${`%${search}%`}`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Tri
    const orderColumn = sortBy === 'price' ? menuItems.price : 
                       sortBy === 'createdAt' ? menuItems.createdAt : 
                       menuItems.name;
    
    query = sortOrder === 'desc' ? 
      query.orderBy(desc(orderColumn)) : 
      query.orderBy(orderColumn);

    // Pagination
    const offset = (page - 1) * limit;
    const items = await query.limit(limit).offset(offset);

    // Compte total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(menuItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    logger.info('Articles de menu récupérés', { 
      count: items.length, 
      total: count,
      filters: { categoryId, available, search }
    });

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  })
);

router.get('/:id',
  validateParams(commonSchemas.idSchema),
  cacheMiddleware({ ttl: 10 * 60 * 1000, tags: ['menu', 'items'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [item] = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        categoryId: menuItems.categoryId,
        available: menuItems.available,
        imageUrl: menuItems.imageUrl,
        ingredients: menuItems.ingredients,
        allergens: menuItems.allergens,
        nutritionInfo: menuItems.nutritionInfo,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: menuCategories.name
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(eq(menuItems.id, id));

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Article de menu non trouvé'
      });
    }

    logger.info('Article de menu récupéré', { itemId: id, name: item.name });

    res.json({
      success: true,
      data: item
    });
  })
);

router.post('/',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateBody(CreateMenuItemSchema),
  invalidateCache(['menu', 'items']),
  asyncHandler(async (req, res) => {
    const db = getDb();

    // Vérifier que la catégorie existe
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.id, req.body.categoryId));

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    const [item] = await db
      .insert(menuItems)
      .values({
        ...req.body,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    logger.info('Article de menu créé', { 
      itemId: item.id, 
      name: item.name,
      price: item.price,
      userId: (req as any).user?.id 
    });

    res.status(201).json({
      success: true,
      data: item,
      message: 'Article de menu créé avec succès'
    });
  })
);

router.put('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(commonSchemas.idSchema),
  validateBody(UpdateMenuItemSchema),
  invalidateCache(['menu', 'items']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    // Vérifier que l'article existe
    const [existingItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Article de menu non trouvé'
      });
    }

    // Vérifier la catégorie si elle est modifiée
    if (req.body.categoryId && req.body.categoryId !== existingItem.categoryId) {
      const [category] = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.id, req.body.categoryId));

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }
    }

    const [updatedItem] = await db
      .update(menuItems)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, id))
      .returning();

    logger.info('Article de menu mis à jour', { 
      itemId: id, 
      changes: Object.keys(req.body),
      userId: (req as any).user?.id 
    });

    res.json({
      success: true,
      data: updatedItem,
      message: 'Article de menu mis à jour avec succès'
    });
  })
);

router.delete('/:id',
  authenticateUser,
  requireRoles(['admin']),
  validateParams(commonSchemas.idSchema),
  invalidateCache(['menu', 'items']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [deletedItem] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Article de menu non trouvé'
      });
    }

    logger.info('Article de menu supprimé', { 
      itemId: id, 
      name: deletedItem.name,
      userId: (req as any).user?.id 
    });

    res.json({
      success: true,
      message: 'Article de menu supprimé avec succès'
    });
  })
);

// Route pour les recommandations personnalisées
router.get('/recommendations/:customerId',
  authenticateUser,
  validateParams(z.object({ customerId: z.string().uuid() })),
  cacheMiddleware({ ttl: 2 * 60 * 1000, tags: ['menu', 'recommendations'] }),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { customerId } = req.params;

    // Obtenir les préférences du client basées sur ses commandes passées
    const customerPreferences = await db
      .select({
        categoryId: menuItems.categoryId,
        count: sql<number>`count(*)`
      })
      .from(loyaltyTransactions)
      .leftJoin(menuItems, eq(loyaltyTransactions.orderId, menuItems.id))
      .where(eq(loyaltyTransactions.customerId, customerId))
      .groupBy(menuItems.categoryId)
      .orderBy(desc(sql`count(*)`))
      .limit(3);

    const preferredCategories = customerPreferences.map(p => p.categoryId).filter(Boolean);

    // Recommander des articles des catégories préférées
    const recommendations = await db
      .select()
      .from(menuItems)
      .where(
        and(
          eq(menuItems.available, true),
          preferredCategories.length > 0 ? 
            inArray(menuItems.categoryId, preferredCategories) : 
            sql`true`
        )
      )
      .orderBy(sql`random()`)
      .limit(6);

    logger.info('Recommandations générées', { 
      customerId, 
      recommendationsCount: recommendations.length,
      preferredCategories 
    });

    res.json({
      success: true,
      data: recommendations
    });
  })
);

export default router;
```
