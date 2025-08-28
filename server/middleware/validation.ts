
import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema, ZodTypeAny } from 'zod';
import { ValidationError } from './error-handler-enhanced';
import { createLogger } from './logging';

const logger = createLogger('VALIDATION');

// Types pour la validation
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ValidationResult {
  success: boolean;
  data?: unknown;
  errors?: ValidationErrorDetail[];
}

// Classe utilitaire pour la validation
export class ValidationService {
  /**
   * Valide des données avec un schéma Zod
   */
  static validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.path.length > 0 ? this.getNestedValue(data, err.path) : data
        }));
        
        return { success: false, errors };
      }
      
      throw error;
    }
  }

  /**
   * Récupère une valeur nested dans un objet
   */
  private static getNestedValue(obj: unknown, path: (string | number)[]): unknown {
    return path.reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string | number, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Sanitise les données d'entrée
   */
  static sanitizeInput<T extends Record<string, unknown>>(input: T): T {
    const sanitized = { ...input };
    
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];
      
      if (typeof value === 'string') {
        // Nettoyer les chaînes
        sanitized[key] = value
          .trim()
          .replace(/\s+/g, ' ') // Normaliser les espaces
          .substring(0, 10000) as T[Extract<keyof T, string>]; // Limiter la longueur
      } else if (Array.isArray(value)) {
        // Limiter la taille des tableaux
        sanitized[key] = value.slice(0, 1000) as T[Extract<keyof T, string>];
      } else if (value && typeof value === 'object') {
        // Récursion pour les objets
        sanitized[key] = this.sanitizeInput(value as Record<string, unknown>) as T[Extract<keyof T, string>];
      }
    });
    
    return sanitized;
  }

  /**
   * Valide une adresse email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Valide un numéro de téléphone français
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(?:\+33|0)[1-9](?:[.\s-]?\d{2}){4}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Valide un mot de passe fort
   */
  static isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Au moins 8 caractères requis');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Au moins une lettre minuscule requise');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Au moins une lettre majuscule requise');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Au moins un chiffre requis');
    }
    
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      errors.push('Au moins un caractère spécial requis (!@#$%^&*)');
    }
    
    if (password.length > 128) {
      errors.push('Maximum 128 caractères');
    }
    
    return { valid: errors.length === 0, errors };
  }
}

// Schémas communs réutilisables
export const commonSchemas = {
  id: z.number().int().positive('ID doit être un entier positif'),
  
  email: z.string()
    .email('Email invalide')
    .max(255, 'Email trop long')
    .transform(email => email.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Mot de passe trop court (minimum 8 caractères)')
    .max(128, 'Mot de passe trop long (maximum 128 caractères)')
    .regex(/(?=.*[a-z])/, 'Au moins une lettre minuscule requise')
    .regex(/(?=.*[A-Z])/, 'Au moins une lettre majuscule requise')
    .regex(/(?=.*\d)/, 'Au moins un chiffre requis'),
  
  phone: z.string()
    .regex(/^(?:\+33|0)[1-9](?:[.\s-]?\d{2}){4}$/, 'Numéro de téléphone français invalide')
    .transform(phone => phone.replace(/[\s.-]/g, '')),
  
  name: z.string()
    .min(2, 'Nom trop court (minimum 2 caractères)')
    .max(50, 'Nom trop long (maximum 50 caractères)')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Caractères invalides dans le nom')
    .transform(name => name.trim()),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .refine(date => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed >= new Date('1900-01-01');
    }, 'Date invalide'),
  
  datetime: z.string()
    .datetime('Format datetime invalide'),
  
  positiveNumber: z.number()
    .positive('Doit être un nombre positif')
    .finite('Doit être un nombre fini'),
  
  percentage: z.number()
    .min(0, 'Pourcentage minimum: 0')
    .max(100, 'Pourcentage maximum: 100'),
  
  currency: z.number()
    .min(0, 'Montant ne peut pas être négatif')
    .max(999999.99, 'Montant trop élevé')
    .multipleOf(0.01, 'Maximum 2 décimales pour le montant'),
  
  url: z.string()
    .url('URL invalide')
    .max(2048, 'URL trop longue'),
  
  slug: z.string()
    .min(1, 'Slug requis')
    .max(100, 'Slug trop long')
    .regex(/^[a-z0-9-]+$/, 'Slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
  
  searchQuery: z.string()
    .max(200, 'Recherche trop longue')
    .transform(query => query.trim()),
  
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  pagination: z.object({
    page: z.number().int().min(1, 'Page minimum: 1').default(1),
    limit: z.number().int().min(1, 'Limite minimum: 1').max(100, 'Limite maximum: 100').default(20),
    offset: z.number().int().min(0, 'Offset minimum: 0').optional()
  }).transform(data => ({
    ...data,
    offset: data.offset ?? (data.page - 1) * data.limit
  }))
};

// Middleware de validation du body
export const validateBody = <T extends ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitiser les données d'entrée
      const sanitizedData = ValidationService.sanitizeInput(req.body || {});
      
      // Valider avec le schéma
      const result = ValidationService.validate(schema, sanitizedData);
      
      if (!result.success) {
        logger.warn('Validation body échouée', { 
          errors: result.errors,
          originalData: req.body 
        });
        
        throw new ValidationError('Données invalides dans le corps de la requête', {
          validationErrors: result.errors
        });
      }
      
      // Remplacer le body par les données validées
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware de validation des paramètres
export const validateParams = <T extends ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = ValidationService.validate(schema, req.params);
      
      if (!result.success) {
        logger.warn('Validation params échouée', { 
          errors: result.errors,
          originalParams: req.params 
        });
        
        throw new ValidationError('Paramètres invalides', {
          validationErrors: result.errors
        });
      }
      
      req.params = result.data as Record<string, string>;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware de validation des query parameters
export const validateQuery = <T extends ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Conversion des types pour les query params
      const processedQuery = this.processQueryParams(req.query);
      const result = ValidationService.validate(schema, processedQuery);
      
      if (!result.success) {
        logger.warn('Validation query échouée', { 
          errors: result.errors,
          originalQuery: req.query 
        });
        
        throw new ValidationError('Paramètres de requête invalides', {
          validationErrors: result.errors
        });
      }
      
      req.query = result.data as Record<string, unknown>;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Utilitaire pour traiter les query params
function processQueryParams(query: Record<string, unknown>): Record<string, unknown> {
  const processed: Record<string, unknown> = {};
  
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Tentative de conversion automatique
      if (value === 'true' || value === 'false') {
        processed[key] = value === 'true';
      } else if (/^\d+$/.test(value)) {
        processed[key] = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        processed[key] = parseFloat(value);
      } else {
        processed[key] = value;
      }
    } else {
      processed[key] = value;
    }
  });
  
  return processed;
}

// Middleware de validation conditionnelle
export const validateConditional = <T extends ZodTypeAny>(
  condition: (req: Request) => boolean,
  schema: T,
  target: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!condition(req)) {
      return next();
    }
    
    const middleware = target === 'body' ? validateBody(schema) :
                      target === 'params' ? validateParams(schema) :
                      validateQuery(schema);
    
    middleware(req, res, next);
  };
};

// Middleware de validation de fichiers
export const validateFiles = (options: {
  required?: boolean;
  maxSize?: number; // en bytes
  allowedTypes?: string[];
  maxFiles?: number;
} = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB par défaut
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 1
  } = options;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      
      if (required && (!files || files.length === 0)) {
        throw new ValidationError('Fichier requis');
      }
      
      if (files && files.length > 0) {
        if (files.length > maxFiles) {
          throw new ValidationError(`Maximum ${maxFiles} fichier(s) autorisé(s)`);
        }
        
        for (const file of files) {
          if (file.size > maxSize) {
            throw new ValidationError(
              `Fichier trop volumineux: ${file.originalname} (max: ${maxSize / 1024 / 1024}MB)`
            );
          }
          
          if (!allowedTypes.includes(file.mimetype)) {
            throw new ValidationError(
              `Type de fichier non autorisé: ${file.mimetype}. Types autorisés: ${allowedTypes.join(', ')}`
            );
          }
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Export des utilitaires
export { ValidationService };
