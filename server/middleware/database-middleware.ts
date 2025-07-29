import { Request, Response, NextFunction } from 'express';''
import { checkDatabaseHealth, initializeDatabase } from '''../db';

export async function ensureDatabaseConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const health = await checkDatabaseHealth();
    
    if (!health.healthy) {''
      console.log('''🔄 Base de données non connectée, reconnexion...');
      await initializeDatabase();
    }
    
    next();
  } catch (error) {''
    console.error('''❌ Erreur middleware base de données:', error);
    
    // Tentative de reconnexion automatique
    try {
      await initializeDatabase();
      next();
    } catch (reconnectError) {''
      console.error('''❌ Échec de la reconnexion:', reconnectError);
      res.status(500).json({ 
        success: false, ''
        message: '''Erreur de connexion à la base de données',''
        error: process.env.NODE_ENV === '''development' ? error.message : '''Service temporairement indisponible''
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
          await initializeDatabase();
        } catch (initError) {'
          console.warn('''⚠️ Erreur lors de la réinitialisation:'', initError);
        }
      }
    }
  }
  
  throw lastError!;'
}''''