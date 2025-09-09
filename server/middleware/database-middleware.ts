import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { createLogger } from './logging';
const logger = createLogger('DB_MIDDLEWARE');

export async function ensureDatabaseConnection(req: Request, res: Response, next: NextFunction) {
  try {
    // Test simple de connexion
    await db.execute('SELECT 1');
    next();
  } catch (error) {
    logger.error('❌ Erreur middleware base de données:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    
    res.status(500).json({ 
      success: false, 
      message: 'Erreur de connexion à la base de données',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Service temporairement indisponible'
    });
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
          await db.execute('SELECT 1');
        } catch (initError) {
          console.warn('⚠️ Erreur lors de la réinitialisation:', initError);
        }
      }
    }
  }
  
  throw lastError!;
}