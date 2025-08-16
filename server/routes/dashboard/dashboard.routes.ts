import { Router } from 'express';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

const router = Router();

// Obtenir les données du tableau de bord
router.get('/', async (req: Request, res: Response) => {
  try {
    const dashboardData = {
      summary: {
        todayOrders: 0,
        todayRevenue: 0,
        activeReservations: 0,
        popularItems: []
      },
      recentActivity: [],
      alerts: []
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Erreur récupération dashboard', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;