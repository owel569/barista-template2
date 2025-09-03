
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { createLogger } from './logging';

const logger = createLogger('VALIDATION_ENHANCED');

interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

export class ValidationError extends Error {
  public statusCode: number;
  public details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[]) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export function validateBodyStrict<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const details: ValidationErrorDetail[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as { received?: unknown }).received : undefined
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: details
        });

        const error = new ValidationError('Validation failed', details);
        return next(error);
      }

      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      next(error);
    }
  };
}

export function validateQueryStrict<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const details: ValidationErrorDetail[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as { received?: unknown }).received : undefined
        }));

        const error = new ValidationError('Query validation failed', details);
        return next(error);
      }

      req.query = result.data as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParamsStrict<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const details: ValidationErrorDetail[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as { received?: unknown }).received : undefined
        }));

        const error = new ValidationError('Parameters validation failed', details);
        return next(error);
      }

      req.params = result.data as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Schémas de validation réutilisables
export const commonValidationSchemas = {
  id: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric').transform(Number)
  }),
  
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  }),

  email: z.string().email('Format d\'email invalide'),
  
  password: z.string()
    .min(8, 'Mot de passe trop court (min 8 caractères)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),

  phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,}$/, 'Format de téléphone invalide')
    .optional(),

  date: z.string().datetime('Format de date invalide'),
  
  money: z.number().positive('Le montant doit être positif').multipleOf(0.01),
  
  text: z.string().min(1, 'Ce champ ne peut pas être vide').max(1000, 'Texte trop long')
};
