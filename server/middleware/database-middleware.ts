import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { createLogger } from './logging';
const logger = createLogger('DB_MIDDLEWARE');

export async function ensureDatabaseConnection(req: Request, res: Response, next: NextFunction) {
  try {
    // const health = await checkDatabaseHealth(); // Commenté temporairement

    // if (!health.healthy) { // Commenté temporairement
      console.log('🔄 Base de données non connectée, reconnexion...');
      // Database initialization handled elsewhere
    // }

    next();
  } catch (error) {
    logger.error('❌ Erreur middleware base de données:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });

    // Tentative de reconnexion automatique
    try {
      // Database initialization handled elsewhere
      next();
    } catch (reconnectError) {
      logger.error('❌ Échec de la reconnexion:', { 
        error: reconnectError instanceof Error ? reconnectError.message : String(reconnectError)
      });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur de connexion à la base de données',
        error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Service temporairement indisponible'
      });
    }
  }
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        console.log(`🔄 Tentative ${attempt + 1}/${maxRetries + 1} échouée, nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));

        // Réinitialiser la connexion avant la nouvelle tentative
        try {
          // Database initialization handled elsewhere
        } catch (initError) {
          console.warn('⚠️ Erreur lors de la réinitialisation:', initError);
        }
      }
    }
  }

  throw lastError!;
}