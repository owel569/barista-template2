import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { getDb } from '../../db';
import { menuItems, menuCategories } from '../../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler-enhanced';

const router = Router();

const MenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  categoryId: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  allergens: z.any().optional(),
  nutritionalInfo: z.any().optional(),
  sortOrder: z.number().int().optional()
});

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

// GET /api/admin/menu/items - Récupérer tous les éléments du menu
router.get('/items',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const items = await db
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
        allergens: menuItems.allergens,
        nutritionalInfo: menuItems.nutritionalInfo,
        // sortOrder absent sur menuItems
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: menuCategories.name
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .orderBy(menuItems.name);

    res.json({
      success: true,
      data: items
    });
  })
);

// POST /api/admin/menu/items - Créer un nouvel élément de menu
router.post('/items',
  authenticateUser,
  validateBody(MenuItemSchema),
  asyncHandler(async (req: Request, res: Response): Promise<Response | void> => {
    const db = getDb();
    const itemData = req.body;

    const [newItem] = await db
      .insert(menuItems)
      .values({
        ...itemData,
        price: itemData.price.toString()
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Élément de menu créé avec succès'
    });
  })
);

// PUT /api/admin/menu/items/:id - Mettre à jour un élément de menu
router.put('/items/:id',
  authenticateUser,
  validateBody(MenuItemSchema.partial()),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID requis'
      });
      return;
    }

    const updateData = req.body;
    const [updatedItem] = await db
      .update(menuItems)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    if (!updatedItem) {
      res.status(404).json({
        success: false,
        message: 'Élément de menu non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      data: updatedItem,
      message: 'Élément mis à jour avec succès'
    });
  })
);

// DELETE /api/admin/menu/items/:id - Supprimer un élément de menu
router.delete('/items/:id',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID requis'
      });
      return;
    }

    const [deletedItem] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    if (!deletedItem) {
      res.status(404).json({
        success: false,
        message: 'Élément de menu non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Élément supprimé avec succès'
    });
  })
);

// GET /api/admin/menu/categories - Récupérer toutes les catégories
router.get('/categories',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const categories = await db
      .select()
      .from(menuCategories)
      .orderBy(menuCategories.sortOrder, menuCategories.name);

    res.json({
      success: true,
      data: categories
    });
  })
);

// POST /api/admin/menu/categories - Créer une nouvelle catégorie
router.post('/categories',
  authenticateUser,
  validateBody(CategorySchema),
  asyncHandler(async (req: Request, res: Response): Promise<Response | void> => {
    const db = getDb();
    const categoryData = req.body;

    const [newCategory] = await db
      .insert(menuCategories)
      .values(categoryData)
      .returning();

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Catégorie créée avec succès'
    });
  })
);

// GET /api/admin/menu/stats - Statistiques du menu
router.get('/stats',
  authenticateUser,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const db = getDb();

    const [
      totalItems,
      availableItems,
      categoriesCount,
      topCategories
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(menuItems),
      db.select({ count: sql<number>`count(*)` }).from(menuItems).where(eq(menuItems.available, true)),
      db.select({ count: sql<number>`count(*)` }).from(menuCategories),
      db.select({
        categoryId: menuItems.categoryId,
        categoryName: menuCategories.name,
        itemCount: sql<number>`count(*)`
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .groupBy(menuItems.categoryId, menuCategories.name)
      .orderBy(sql`count(*) desc`)
      .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        totalItems: totalItems[0]?.count || 0,
        availableItems: availableItems[0]?.count || 0,
        categoriesCount: categoriesCount[0]?.count || 0,
        topCategories
      }
    });
  })
);

export default router;