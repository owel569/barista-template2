import { Router } from 'express';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

const router = Router();

// Routes d'administration de base
router.get('/system-info', async (req: Request, res: Response) => {
  try {
    const systemInfo = {
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    logger.error('Erreur info système', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;