import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { createLogger } from './logging';
import { ValidationError } from './error-handler-enhanced';

const logger = createLogger('VALIDATION');

// Types pour les différentes parties de la requête
type RequestPart = 'body' | 'params' | 'query' | 'headers';

// Interface pour les options de validation
interface ValidationOptions {
  stripUnknown?: boolean;
  allowUnknown?: boolean;
  abortEarly?: boolean;
  transform?: boolean;
}

// Interface pour le résultat de validation
interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
    value?: any;
  }>;
}

// Schémas de validation communs réutilisables
export const commonSchemas = {
  id: z.coerce.number().int().positive('ID doit être un entier positif'),

  email: z.string()
    .email('Format d\'email invalide')
    .min(1, 'Email requis')
    .max(254, 'Email trop long'),

  password: z.string()
    .min(8, 'Mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
    ),

  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Format de téléphone invalide')
    .optional(),

  pagination: z.object({
    page: z.coerce.number().int().min(1, 'Page doit être >= 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limite doit être >= 1').max(100, 'Limite max 100').default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  dateRange: z.object({
    startDate: z.string().datetime('Date de début invalide').optional(),
    endDate: z.string().datetime('Date de fin invalide').optional()
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: 'Date de début doit être antérieure à la date de fin' }
  ),

  search: z.object({
    q: z.string().min(1, 'Terme de recherche requis').max(100, 'Terme trop long').optional(),
    category: z.string().optional(),
    status: z.string().optional()
  }),

  idSchema: z.object({
    id: z.coerce.number().int().positive('ID invalide')
  })
};

// Classe de validation avancée
class AdvancedValidator {
  /**
   * Valide les données avec un schéma Zod
   */
  static validate<T>(
    schema: ZodSchema<T>,
    data: unknown,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    try {
      // Vérification que le schema n'est pas undefined
      if (!schema) {
        throw new Error('Schema de validation manquant');
      }

      const parseOptions = {
        errorMap: (issue: any, ctx: any) => {
          switch (issue.code) {
            case 'invalid_type':
              return { message: `Attendu ${issue.expected}, reçu ${issue.received}` };
            case 'too_small':
              return { message: `Valeur trop petite (min: ${issue.minimum})` };
            case 'too_big':
              return { message: `Valeur trop grande (max: ${issue.maximum})` };
            case 'invalid_string':
              return { message: `Format invalide: ${issue.validation}` };
            default:
              return { message: ctx.defaultError };
          }
        }
      };

      const validatedData = schema.parse(data, parseOptions);

      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.') || 'root',
          message: err.message,
          code: err.code,
          value: (err as any).received || undefined
        }));

        return {
          success: false,
          errors
        };
      }

      throw error;
    }
  }

  /**
   * Validation conditionnelle basée sur d'autres champs
   */
  static createConditionalSchema<T>(
    baseSchema: ZodSchema<T>,
    conditions: Array<{
      when: (data: any) => boolean;
      then: ZodSchema<any>;
      otherwise?: ZodSchema<any>;
    }>
  ): ZodSchema<T> {
    return z.any().superRefine((data, ctx) => {
      // Validation de base
      const baseResult = baseSchema.safeParse(data);
      if (!baseResult.success) {
        baseResult.error.errors.forEach(err => {
          ctx.addIssue(err);
        });
        return;
      }

      // Validations conditionnelles
      conditions.forEach(condition => {
        const schema = condition.when(data) ? condition.then : condition.otherwise;
        if (schema) {
          const result = schema.safeParse(data);
          if (!result.success) {
            result.error.errors.forEach(err => {
              ctx.addIssue(err);
            });
          }
        }
      });
    }) as ZodSchema<T>;
  }
}

// Middleware de validation principal
export const validateRequest = (
  schema: ZodSchema<any>,
  part: RequestPart = 'body',
  options: ValidationOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Vérification que le schema existe
      if (!schema) {
        logger.error('Schema de validation manquant', {
          part,
          method: req.method,
          path: req.path
        });
        return next(new Error('Configuration de validation manquante'));
      }

      const dataToValidate = req[part];

      logger.debug('Validation en cours', {
        part,
        method: req.method,
        path: req.path,
        dataKeys: dataToValidate ? Object.keys(dataToValidate) : []
      });

      const result = AdvancedValidator.validate(schema, dataToValidate, options);

      if (!result.success) {
        logger.warn('Validation échouée', {
          part,
          errors: result.errors,
          method: req.method,
          path: req.path
        });

        throw new ValidationError(
          `Erreur de validation pour ${part}`,
          part,
          result.errors
        );
      }

      // Remplacer les données validées dans la requête
      (req as any)[part] = result.data;

      logger.debug('Validation réussie', {
        part,
        method: req.method,
        path: req.path
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middlewares de validation spécialisés
export const validateBody = (schema: z.ZodSchema, options?: ValidationOptions) =>
  validateRequest(schema, 'body', options);

export const validateParams = (schema: z.ZodSchema, options?: ValidationOptions) =>
  validateRequest(schema, 'params', options);

export const validateQuery = (schema: z.ZodSchema, options?: ValidationOptions) =>
  validateRequest(schema, 'query', options);

export const validateHeaders = (schema: z.ZodSchema, options?: ValidationOptions) =>
  validateRequest(schema, 'headers', options);

// Validation multiple (plusieurs parties à la fois)
export const validateMultiple = (validations: Array<{
  schema: ZodSchema<any>;
  part: RequestPart;
  options?: ValidationOptions;
}>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: Array<{ part: string; errors: any[] }> = [];

      for (const validation of validations) {
        const result = AdvancedValidator.validate(
          validation.schema,
          req[validation.part],
          validation.options
        );

        if (!result.success) {
          errors.push({
            part: validation.part,
            errors: result.errors || []
          });
        } else {
          (req as any)[validation.part] = result.data;
        }
      }

      if (errors.length > 0) {
        logger.warn('Validation multiple échouée', {
          errors,
          method: req.method,
          path: req.path
        });

        const flatErrors = errors.flatMap(e =>
          e.errors.map(err => ({ ...err, part: e.part }))
        );

        throw new ValidationError(
          'Erreurs de validation multiples',
          'multiple',
          flatErrors
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validation optionnelle (n'échoue pas si les données sont absentes)
export const validateOptional = (
  schema: ZodSchema<any>,
  part: RequestPart = 'body',
  options?: ValidationOptions
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate = req[part];

      // Si pas de données, passer au middleware suivant
      if (!dataToValidate || (typeof dataToValidate === 'object' && Object.keys(dataToValidate).length === 0)) {
        return next();
      }

      const result = AdvancedValidator.validate(schema, dataToValidate, options);

      if (!result.success) {
        logger.warn('Validation optionnelle échouée', {
          part,
          errors: result.errors,
          method: req.method,
          path: req.path
        });

        throw new ValidationError(
          `Erreur de validation optionnelle pour ${part}`,
          part,
          result.errors
        );
      }

      (req as any)[part] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validation avec transformation de données
export const validateAndTransform = <T>(
  schema: ZodSchema<T>,
  part: RequestPart = 'body',
  transformer?: (data: T) => any
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate = req[part];
      const result = AdvancedValidator.validate(schema, dataToValidate);

      if (!result.success) {
        throw new ValidationError(
          `Erreur de validation et transformation pour ${part}`,
          part,
          result.errors
        );
      }

      let transformedData = result.data;
      if (transformer) {
        transformedData = transformer(result.data!);
      }

      (req as any)[part] = transformedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Schémas de validation pour l'authentification
export const authSchemas = {
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Mot de passe requis'),
    rememberMe: z.boolean().optional()
  }),

  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(2, 'Prénom trop court').max(50, 'Prénom trop long'),
    lastName: z.string().min(2, 'Nom trop court').max(50, 'Nom trop long'),
    phone: commonSchemas.phone,
    role: z.enum(['customer', 'waiter', 'chef', 'manager', 'admin']).default('customer')
  }),

  forgotPassword: z.object({
    email: commonSchemas.email
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token requis'),
    password: commonSchemas.password
  })
};

// Schémas pour les opérations CRUD
export const crudSchemas = {
  create: <T>(schema: ZodSchema<T>) => schema,

  update: <T>(schema: z.ZodObject<any>) => schema.partial(),

  delete: z.object({
    id: commonSchemas.id
  }),

  getById: z.object({
    id: commonSchemas.id
  }),

  list: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
};

// Types pour l'authentification
export type AppRole = 'admin' | 'manager' | 'staff' | 'user' | 'customer';

// Export des utilitaires
export { AdvancedValidator, ValidationOptions, ValidationResult };