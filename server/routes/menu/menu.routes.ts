import { Router } from 'express';
import { Request, Response } from 'express';
import { db } from '../../db';
import { menuCategories, menuItems } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';
// Temporary logger replacement
const logger = {
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta)
};

const router = Router();

// Obtenir toutes les catégories avec leurs items
router.get('/categories', async (req: Request, res: Response) => {
  try {
    console.log('Fetching categories...');
    const categories = await db.select().from(menuCategories).orderBy(desc(menuCategories.sortOrder));
    console.log('Categories found:', categories.length);
    
    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const items = await db.select()
          .from(menuItems)
          .where(eq(menuItems.categoryId, category.id))
          .orderBy(desc(menuItems.sortOrder));
        
        return {
          ...category,
          items
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithItems
    });

  } catch (error) {
    logger.error('Erreur récupération menu', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir tous les items du menu
router.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(menuItems).orderBy(desc(menuItems.sortOrder));

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    logger.error('Erreur récupération items', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;