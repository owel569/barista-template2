import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Configuration de logging centralisé
export const createLogger = (module: string) => ({
  info: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] [${module}] INFO: ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] [${module}] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[${new Date().toISOString()}] [${module}] WARN: ${message}`, data ? JSON.stringify(data) : '');
  }
});

// Middleware de logging des requêtes
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
};

// Validation centralisée avec logging
export const validateRequestWithLogging = (schema: z.ZodSchema, type: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const logger = createLogger('VALIDATION');
    
    try {
      const dataToValidate = type === 'body' ? req.body : 
                            type === 'params' ? req.params : 
                            req.query;
      
      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        logger.warn(`Validation failed for ${req.method} ${req.path}`, {
          errors: result.error.errors,
          data: dataToValidate
        });
        
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: result.error.errors
        });
      }
      
      // Remplacer les données par les données validées
      if (type === 'body') req.body = result.data;
      else if (type === 'params') req.params = result.data;
      else req.query = result.data;
      
      next();
    } catch (error) {
      logger.error(`Validation error for ${req.method} ${req.path}`, error);
      res.status(500).json({
        success: false,
        message: 'Erreur de validation'
      });
    }
  };
};