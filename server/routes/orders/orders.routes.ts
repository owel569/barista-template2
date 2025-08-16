import { Router } from 'express';
import { Request, Response } from 'express';
import { db } from '../../db';
import { orders } from '../../../shared/schema';
import { desc } from 'drizzle-orm';
import { logger } from '../../utils/logger';

const router = Router();

// Obtenir toutes les commandes
router.get('/', async (req: Request, res: Response) => {
  try {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    res.json({
      success: true,
      data: allOrders
    });

  } catch (error) {
    logger.error('Erreur récupération commandes', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;