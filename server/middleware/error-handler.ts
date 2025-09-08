/**
 * Middleware de gestion d'erreurs professionnel et sécurisé
 * Version améliorée avec :
 * - Typage TypeScript strict
 * - Gestion des erreurs spécifiques (DB, Validation, Auth, Rate Limit)
 * - Logging structuré avec contexte
 * - Protection contre les fuites d'informations
 * - Prise en charge des erreurs personnalisées
 * - Compatibilité avec les microservices
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
// Types sécurisés pour les erreurs
interface IAppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string | number;
  retryAfter?: number;
  details?: any;
  isOperational?: boolean;
  timestamp?: Date;
}

interface DatabaseError extends IAppError {
  code: string;
  severity?: string;
  constraint?: string;
}

interface IValidationError extends IAppError {
  errors: Array<{
    field: string;
    message: string;
    type: string;
  }>;
}

// Codes d'erreur de base de données courants
const DATABASE_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  UNDEFINED_TABLE: '42P01',
  CONNECTION_REFUSED: 'ECONNREFUSED',
  CONNECTION_TIMEOUT: 'ETIMEDOUT',
  CONNECTION_RESET: 'ECONNRESET'
};

// Utilitaire pour identifier les erreurs de base de données
const isDatabaseError = (err: IAppError): err is DatabaseError => {
  return Object.values(DATABASE_ERROR_CODES).includes(err.code?.toString() || '');
};

// Typage amélioré pour asyncHandler avec support générique
export const asyncHandler = <P, ResBody, ReqBody, ReqQuery>(
  fn: RequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Fonction de logging structuré avec contexte enrichi
const logError = (err: IAppError, req: Request): void => {
  const errorContext = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    request: {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      params: req.params,
      query: req.query,
      headers: {
        'user-agent': req.get('user-agent'),
        referer: req.get('referer'),
        'content-type': req.get('content-type')
      },
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id || 'anonymous'
    },
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      status: err.status || err.statusCode,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      isOperational: err.isOperational || false,
      details: err.details
    }
  };

  // Log avec différents niveaux selon le type d'erreur
  if (err.statusCode && err.statusCode < 500) {
    logger.warn('Client error occurred', errorContext);
  } else {
    logger.error('Server error occurred', errorContext);
    // Note: metrics service removed - not available in server context
  }
};

// Fonction pour créer une réponse d'erreur standardisée et sécurisée
const createErrorResponse = (
  status: number,
  message: string,
  options: {
    code?: string | undefined;
    details?: any;
    retryAfter?: number;
    expose?: boolean;
  } = {}
) => {
  const { code, details, retryAfter, expose = false } = options;
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';

  const response: Record<string, any> = {
    success: false,
    error: {
      status,
      message: isProduction && !expose ? 'Une erreur est survenue' : message,
      timestamp,
      ...(code && { code })
    }
  };

  // Ajout des détails en développement ou si explicitement autorisé
  if ((!isProduction || expose) && details) {
    response.error.details = details;
  }

  // Information de réessai pour les erreurs 429/503
  if (retryAfter) {
    response.error.retryAfter = `${retryAfter} seconds`;
    if (status === 429) {
      response.error.message = 'Trop de requêtes. Veuillez réessayer plus tard.';
    }
  }

  return response;
};

// Middleware principal de gestion d'erreurs
export const errorHandler = (
  err: IAppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Enrichir l'erreur avec des métadonnées
  err.timestamp = new Date();
  err.isOperational = err.isOperational || false;

  // Journalisation de l'erreur
  logError(err, req);

  // Déterminer si l'erreur doit être exposée au client
  const exposeError = err.isOperational || process.env.NODE_ENV !== 'production';

  // Gestion spécifique des erreurs API
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // Erreur de validation Zod
    if (err instanceof ZodError) {
      const validationErrors = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code
      }));

      return res.status(400).json(
        createErrorResponse(400, 'Validation des données échouée', {
          code: 'VALIDATION_ERROR',
          details: { errors: validationErrors },
          expose: true
        })
      );
    }

    // Erreur de base de données
    if (isDatabaseError(err)) {
      // Note: metrics service removed - not available in server context

      let message = 'Erreur de base de données';
      let status = 503;
      let code = 'DATABASE_ERROR';

      // Messages spécifiques selon le code d'erreur
      switch (err.code) {
        case DATABASE_ERROR_CODES.UNIQUE_VIOLATION:
          message = 'Violation de contrainte d\'unicité';
          status = 409;
          code = 'UNIQUE_VIOLATION';
          break;
        case DATABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION:
          message = 'Violation de clé étrangère';
          status = 409;
          code = 'FOREIGN_KEY_VIOLATION';
          break;
        case DATABASE_ERROR_CODES.CONNECTION_REFUSED:
          message = 'Base de données indisponible';
          status = 503;
          code = 'DB_CONNECTION_REFUSED';
          break;
      }

      return res.status(status).json(
        createErrorResponse(status, message, {
          code,
          retryAfter: 30,
          expose: true
        })
      );
    }

    // Erreur d'authentification
    if (err.name === 'UnauthorizedError' || err.status === 401) {
      return res.status(401).json(
        createErrorResponse(401, 'Authentification requise', {
          code: 'UNAUTHORIZED',
          expose: true
        })
      );
    }

    // Erreur d'autorisation
    if (err.status === 403) {
      return res.status(403).json(
        createErrorResponse(403, 'Permissions insuffisantes', {
          code: 'FORBIDDEN',
          expose: true
        })
      );
    }

    // Erreur de limite de taux
    if (err.status === 429) {
      return res.status(429).json(
        createErrorResponse(429, 'Trop de requêtes', {
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: err.retryAfter || 60,
          expose: true
        })
      );
    }

    // Erreur personnalisée opérationnelle
    if (err.isOperational) {
      return res.status(err.statusCode || 500).json(
        createErrorResponse(err.statusCode || 500, err.message, {
          code: err.code?.toString() || undefined,
          details: err.details,
          expose: true
        })
      );
    }

    // Erreur serveur générique
    const status = err.status || err.statusCode || 500;
    const message = exposeError ? err.message : 'Une erreur interne est survenue';

    return res.status(status).json(
      createErrorResponse(status, message, {
        code: 'INTERNAL_SERVER_ERROR',
        details: exposeError ? { stack: err.stack } : undefined,
        expose: exposeError
      })
    );
  }

  // Gestion des erreurs pour les pages HTML
  if (req.accepts('html')) {
    // Redirection vers une page d'erreur dédiée
    const status = err.status || err.statusCode || 500;
    return res.status(status).render('error', {
      title: `Erreur ${status}`,
      message: exposeError ? err.message : 'Une erreur est survenue',
      status,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  }

  // Fallback pour les autres types de requêtes
  return res.status(err.status || 500).json(
    createErrorResponse(err.status || 500, 'Une erreur est survenue', {
      expose: false
    })
  );
};

// Classe d'erreur personnalisée pour une meilleure gestion
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number, options: {
    name?: string;
    details?: any;
    isOperational?: boolean;
    code?: string;
  } = {}) {
    super(message);

    this.statusCode = statusCode;
    this.name = options.name || 'AppError';
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    if (options.code) (this as any).code = options.code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erreurs spécifiques prédéfinies
export class NotFoundError extends AppError {
  constructor(resource = 'Ressource') {
    super(`${resource} non trouvé`, 404, { name: 'NotFoundError' });
  }
}

export class ValidationError extends AppError {
  constructor(errors: IValidationError['errors']) {
    super('Validation échouée', 400, {
      name: 'ValidationError',
      details: { errors }
    });
  }
}

export class DatabaseConnectionError extends AppError {
  constructor() {
    super('Erreur de connexion à la base de données', 503, {
      name: 'DatabaseConnectionError',
      code: 'DB_CONNECTION_FAILED'
    });
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Limite de taux dépassée', 429, {
      name: 'RateLimitError',
      code: 'RATE_LIMIT_EXCEEDED'
    });
    (this as any).retryAfter = retryAfter;
  }
}