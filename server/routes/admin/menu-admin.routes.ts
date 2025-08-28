import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { requireRoleHierarchy } from '../../middleware/security';
import { validateBody } from '../../middleware/security';
import { db } from '../../db';
import { menuItems, menuCategories } from '../../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

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
router.get('/items', authenticateUser, requireRoleHierarchy('staff'), async (req, res): Promise<void> => {
  try {
    const items = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        categoryId: menuItems.categoryId,
        imageUrl: menuItems.imageUrl,
        isAvailable: menuItems.isAvailable,
        isVegetarian: menuItems.isVegetarian,
        isGlutenFree: menuItems.isGlutenFree,
        allergens: menuItems.allergens,
        nutritionalInfo: menuItems.nutritionalInfo,
        sortOrder: menuItems.sortOrder,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: menuCategories.name
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .orderBy(menuItems.sortOrder, menuItems.name);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des éléments du menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des éléments du menu'
    });
  }
});

// POST /api/admin/menu/items - Créer un nouvel élément de menu
router.post('/items', authenticateUser, requireRoleHierarchy('manager'), validateBody(MenuItemSchema), async (req, res): Promise<void> => {
  try {
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
  } catch (error) {
    console.error('Erreur lors de la création de l\'élément:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'élément'
    });
  }
});

// PUT /api/admin/menu/items/:id - Mettre à jour un élément de menu
router.put('/items/:id', authenticateUser, requireRoleHierarchy('manager'), validateBody(MenuItemSchema.partial()), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
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
      return res.status(404).json({
        success: false,
        message: 'Élément de menu non trouvé'
      });
    }

    res.json({
      success: true,
      data: updatedItem,
      message: 'Élément mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

// DELETE /api/admin/menu/items/:id - Supprimer un élément de menu
router.delete('/items/:id', authenticateUser, requireRoleHierarchy('manager'), async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const [deletedItem] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément de menu non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Élément supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// GET /api/admin/menu/categories - Récupérer toutes les catégories
router.get('/categories', authenticateUser, requireRoleHierarchy('staff'), async (req, res): Promise<void> => {
  try {
    const categories = await db
      .select()
      .from(menuCategories)
      .orderBy(menuCategories.sortOrder, menuCategories.name);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

// POST /api/admin/menu/categories - Créer une nouvelle catégorie
router.post('/categories', authenticateUser, requireRoleHierarchy('manager'), validateBody(CategorySchema), async (req, res): Promise<void> => {
  try {
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
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie'
    });
  }
});

// GET /api/admin/menu/stats - Statistiques du menu
router.get('/stats', authenticateUser, requireRoleHierarchy('staff'), async (req, res): Promise<void> => {
  try {
    const [
      totalItems,
      availableItems,
      categoriesCount,
      topCategories
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(menuItems),
      db.select({ count: sql<number>`count(*)` }).from(menuItems).where(eq(menuItems.isAvailable, true)),
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
        totalItems: totalItems[0].count,
        availableItems: availableItems[0].count,
        categoriesCount: categoriesCount[0].count,
        topCategories
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router;