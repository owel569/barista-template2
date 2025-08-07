/**
 * Middleware de logging professionnel et sécurisé
 * Logique métier optimisée pour la longévité du système
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Types sécurisés pour le logging
interface LogData {
  [key: string]: unknown;
}

// Configuration de logging centralisé et sécurisé
export const createLogger = (module: string) => {
  const formatTimestamp = (): string => {
    return new Date().toISOString();
  };

  const sanitizeData = (data: unknown): string => {
    try {
    if (data instanceof Error) {
        return JSON.stringify({
          message: data.message,
          stack: data.stack,
          name: data.name
        });
      }
      
      if (typeof data === 'object' && data !== null) {
        // Filtrer les données sensibles
        const sanitized = { ...data as Record<string, unknown> };
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
        
        sensitiveKeys.forEach(key => {
          if (key in sanitized) {
            sanitized[key] = '[REDACTED]';
          }
        });
        
        return JSON.stringify(sanitized);
      }
      
      return String(data);
    } catch {
      return '[UNSERIALIZABLE_DATA]';
    }
  };

  return {
    info: (message: string, data?: LogData): void => {
      const timestamp = formatTimestamp();
      const sanitizedData = data ? sanitizeData(data) : '';
      console.log(`[${timestamp}] [${module}] INFO: ${message}${sanitizedData ? ` ${sanitizedData}` : ''}`);
    },
    
    error: (message: string, data?: LogData | Error): void => {
      const timestamp = formatTimestamp();
      const sanitizedData = data ? sanitizeData(data) : '';
      console.error(`[${timestamp}] [${module}] ERROR: ${message}${sanitizedData ? ` ${sanitizedData}` : ''}`);
  },
    
    warn: (message: string, data?: LogData): void => {
      const timestamp = formatTimestamp();
      const sanitizedData = data ? sanitizeData(data) : '';
      console.warn(`[${timestamp}] [${module}] WARN: ${message}${sanitizedData ? ` ${sanitizedData}` : ''}`);
    },
    
    debug: (message: string, data?: LogData): void => {
      if (process.env.NODE_ENV === 'development') {
        const timestamp = formatTimestamp();
        const sanitizedData = data ? sanitizeData(data) : '';
        console.debug(`[${timestamp}] [${module}] DEBUG: ${message}${sanitizedData ? ` ${sanitizedData}` : ''}`);
  }
    }
  };
};

// Middleware de logging des requêtes avec sécurité renforcée
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const logger = createLogger('REQUEST');
  
  // Capturer les informations de base de la requête
  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    timestamp: new Date().toISOString()
  };

  // Capturer la réponse JSON de manière sécurisée
  let capturedResponse: unknown = undefined;
  const originalResJson = res.json;

  res.json = function(bodyJson: unknown) {
    capturedResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  // Logger la fin de la requête
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseInfo = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || '0'
    };

    // Log sécurisé sans données sensibles
    if (req.path.startsWith('/api')) {
      const logData: LogData = {
        ...requestInfo,
        ...responseInfo,
        success: res.statusCode < 400
      };

      // Ne pas logger les réponses d'erreur complètes en production
      if (process.env.NODE_ENV === 'production' && res.statusCode >= 400) {
        logData.response = '[ERROR_RESPONSE]';
      } else if (capturedResponse) {
        logData.response = capturedResponse;
      }

      logger.info(`${req.method} ${req.path}`, logData);
    }
  });

  next();
};

// Validation centralisée avec logging sécurisé
export const validateRequestWithLogging = (
  schema: z.ZodSchema, 
  type: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const logger = createLogger('VALIDATION');
    
    try {
      // Récupérer les données à valider
      const dataToValidate = type === 'body' ? req.body : 
                            type === 'params' ? req.params : 
                            req.query;
      
      // Validation avec Zod
      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        // Log de l'échec de validation (sans données sensibles)
        logger.warn(`Validation failed for ${req.method} ${req.path}`, {
          type,
          errorCount: result.error.errors.length,
          firstError: result.error.errors[0]?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        // Réponse d'erreur sécurisée
        res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: result.error.errors.map(error => ({
            field: error.path.join('.'),
            message: error.message
          }))
        });
        return;
      }
      
      // Remplacer les données par les données validées
      if (type === 'body') {
        req.body = result.data;
      } else if (type === 'params') {
        req.params = result.data as Record<string, string>;
      } else {
        req.query = result.data as Record<string, string>;
      }
      
      // Log de succès en mode debug
      logger.debug(`Validation successful for ${req.method} ${req.path}`, {
        type,
        dataKeys: Object.keys(result.data)
      });
      
      next();
    } catch (error) {
      // Log d'erreur de validation
      logger.error(`Validation error for ${req.method} ${req.path}`, error as Error);
      
      // Réponse d'erreur générique pour éviter l'exposition d'informations sensibles
      res.status(500).json({
        success: false,
        message: 'Erreur de validation interne'
      });
      return;
    }
  };
};

// Middleware de logging d'erreurs global
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const logger = createLogger('ERROR');
  
  logger.error('Unhandled error occurred', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  next(error);
};

// Middleware de performance monitoring
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();
  const logger = createLogger('PERFORMANCE');
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convertir en millisecondes
    
    // Alerter si la requête est trop lente
    if (duration > 1000) { // Plus d'1 seconde
      logger.warn(`Slow request detected: ${req.method} ${req.path}`, {
        duration: `${duration.toFixed(2)}ms`,
        threshold: '1000ms'
      });
    }
    
    // Log de performance en mode debug
    logger.debug(`Request performance`, {
      method: req.method,
      path: req.path,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode
    });
  });
  
  next();
};

// Export du logger principal
export const logger = createLogger('SYSTEM'); 