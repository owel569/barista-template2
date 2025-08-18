/**
 * Middleware de validation professionnel et sécurisé
 * Logique métier optimisée pour la longévité du système
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createLogger } from './logging';

const logger = createLogger('VALIDATION');

// Types sécurisés pour la validation
interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  success: boolean;
  message: string;
  errors?: ValidationError[];
}

// Fonction utilitaire pour créer une réponse d'erreur de validation
const createValidationErrorResponse = (errors: z.ZodError): ValidationResult => {
  return {
    success: false,
    message: 'Données invalides',
    errors: errors.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  };
};

// Fonction utilitaire pour logger les erreurs de validation
const logValidationError = (error: z.ZodError, req: Request, context: string): void => {
  logger.warn(`Validation ${context} échouée`, {
    errors: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    })),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    path: req.path,
    method: req.method
  });
};

/**
 * Middleware de validation du body de la requête
 */
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logValidationError(error, req, 'body');
        const errorResponse = createValidationErrorResponse(error);
        res.status(400).json(errorResponse);
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware de validation des paramètres de requête
 */
export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      // Type assertion car Express query est toujours string-based
      (req.query as any) = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logValidationError(error, req, 'query');
        const errorResponse = createValidationErrorResponse(error);
        res.status(400).json(errorResponse);
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware de validation des paramètres d'URL
 */
export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.params);
      // Type assertion car Express params sont toujours string-based
      (req.params as any) = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logValidationError(error, req, 'params');
        const errorResponse = createValidationErrorResponse(error);
        res.status(400).json(errorResponse);
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware de validation personnalisée avec logique métier
 */
export const validateWithBusinessLogic = <T>(
  schema: z.ZodSchema<T>,
  businessLogicValidator?: (data: T) => boolean | string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      
      // Validation de la logique métier si fournie
      if (businessLogicValidator) {
        const businessValidation = businessLogicValidator(validatedData);
        if (businessValidation !== true) {
          const errorMessage = typeof businessValidation === 'string' 
            ? businessValidation 
            : 'Validation métier échouée';
          
          logger.warn('Validation métier échouée', {
            error: errorMessage,
            ip: req.ip || req.connection.remoteAddress,
            path: req.path
          });
          
          res.status(400).json({
          success: false,
            message: errorMessage
          });
          return;
        }
      }
      
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logValidationError(error, req, 'business');
        const errorResponse = createValidationErrorResponse(error);
        res.status(400).json(errorResponse);
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware de validation conditionnelle
 */
export const validateConditionally = <T>(
  condition: (req: Request) => boolean,
  schema: z.ZodSchema<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      validateBody(schema)(req, res, next);
    } else {
      next();
    }
  };
};

/**
 * Middleware de validation de sécurité
 */
export const validateSecurity = (req: Request, res: Response, next: NextFunction): void => {
  // Validation des en-têtes de sécurité
  const contentType = req.get('Content-Type');
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('Content-Type invalide', {
        contentType,
        ip: req.ip || req.connection.remoteAddress,
        path: req.path
      });
      
      res.status(400).json({
        success: false,
        message: 'Content-Type doit être application/json'
      });
      return;
    }
  }
  
  // Validation de la taille du body
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 1024 * 1024) { // 1MB max
    logger.warn('Body trop volumineux', {
      contentLength,
      ip: req.ip || req.connection.remoteAddress,
      path: req.path
    });
    
    res.status(413).json({
      success: false,
      message: 'Payload trop volumineux'
    });
    return;
  }
  
  next();
};

// Export des types pour utilisation externe
export type { ValidationError, ValidationResult };
