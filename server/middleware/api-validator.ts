
import { Request, Response, NextFunction } from 'express';

export const apiResponseValidator = (req: Request, res: Response, next: NextFunction) => {
  // Validation uniquement pour les routes API
  if (req.path.startsWith('/api/')) {
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override res.json pour garantir le format JSON
    res.json = function(body: Record<string, unknown> | string | number | boolean | null) {
      // Headers pour forcer le JSON
      this.setHeader('Content-Type', 'application/json');
      
      // Validation du contenu
      if (typeof body === 'string') {
        try {
          JSON.parse(body);
        } catch (e) {
          console.error('🚨 Réponse API non-JSON détectée:', body.substring(0, 100));
          return originalJson.call(this, {
            success: false,
            message: 'Erreur de format de réponse',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return originalJson.call(this, body);
    };

    // Override res.send pour intercepter les réponses HTML
    res.send = function(body: string | Buffer) {
      if (typeof body === 'string' && body.includes('<!DOCTYPE')) {
        console.error('🚨 Tentative d\'envoi de HTML sur route API:', req.path);
        return originalJson.call(this, {
          success: false,
          message: 'Erreur interne - format de réponse incorrect',
          timestamp: new Date().toISOString()
        });
      }
      return originalSend.call(this, body);
    };
  }
  
  next();
};

export const errorResponseHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    const statusCode = (error as any).status || (error as any).statusCode || 500;
    
    return res.status(statusCode).json({
      success: false,
      message: (error as Error).message || 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        details: error
      } : undefined,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
  
  next(error);
};
