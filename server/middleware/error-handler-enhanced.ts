import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createLogger } from './logging';

// Skeleton component for loading state
const Skeleton = ({ className }: { className: string }) => (
  `<div class="animate-pulse ${className} bg-gray-300 rounded"></div>`
);

const logger = createLogger('ERROR_HANDLER');

// Classes d'erreurs personnalisées
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    requestId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.requestId = requestId || '';

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly validationErrors?: any;

  constructor(message: string, field?: string, validationErrors?: any) {
    super(message, 400);
    this.field = field || '';
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Non authentifié') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource') {
    super(`${resource} non trouvé(e)`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Trop de requêtes') {
    super(message, 429);
  }
}

// Interface pour les réponses d'erreur
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    details?: any;
    stack?: string;
  };
}

interface SecureError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

// Gestionnaire principal d'erreurs
export const errorHandler = (err: SecureError, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   Math.random().toString(36).substring(7);

  // Log de l'erreur
  logger.error('Erreur interceptée', {
    error: err.message,
    stack: err.stack,
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  let errorResponse: ErrorResponse;

  // Gestion des différents types d'erreurs
  if (err instanceof AppError) {
    errorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.constructor.name,
        statusCode: err.statusCode || 500, // Fallback to 500 if not set
        timestamp: err.timestamp ? err.timestamp.toISOString() : new Date().toISOString(), // Ensure timestamp exists
        requestId: err.requestId || requestId
      }
    };

    // Ajouter des détails spécifiques pour certaines erreurs
    if (err instanceof ValidationError && err.validationErrors) {
      errorResponse.error.details = err.validationErrors;
    }

  } else if (err instanceof ZodError) {
    errorResponse = {
      success: false,
      error: {
        message: 'Erreur de validation des données',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId,
        details: err.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    };

  } else {
    // Erreur inconnue
    const statusCode = 500;
    errorResponse = {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'Erreur interne du serveur' 
          : err.message,
        code: 'INTERNAL_SERVER_ERROR',
        statusCode,
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    // Ajouter la stack trace en développement
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      errorResponse.error.stack = err.stack;
    }
  }

  // Envoyer la réponse d'erreur
  res.status(errorResponse.error.statusCode).json(errorResponse);
};

// Gestionnaire pour les erreurs asynchrones
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware pour les routes non trouvées
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

// Gestionnaire d'erreurs non capturées
export const handleUncaughtErrors = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Exception non capturée', { 
      error: error.message, 
      stack: error.stack 
    });

    // Arrêt gracieux en production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Promesse rejetée non gérée', { 
      reason: reason?.message || reason,
      stack: reason?.stack 
    });

    // Arrêt gracieux en production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
};

// Validation du schéma de requête
export const validateRequest = (schema: any, property: 'body' | 'params' | 'query' = 'body') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req[property]);
      req[property] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(
          'Données de requête invalides',
          property,
          error.errors
        );
      }
      throw error;
    }
  });
};

export default errorHandler;