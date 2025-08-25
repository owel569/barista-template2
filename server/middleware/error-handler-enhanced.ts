import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse, SafeError } from '../../shared/types-server';

// Types d'erreur personnalisés
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentification requise') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Accès non autorisé') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND_ERROR', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflit détecté') {
    super(message, 409, 'CONFLICT_ERROR', true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Limite de taux dépassée') {
    super(message, 429, 'RATE_LIMIT_ERROR', true);
  }
}

// Utilitaires d'erreur
function isDatabaseError(err: any): boolean {
  return err.code && typeof err.code === 'string' && (
    err.code.startsWith('23') || // Contrainte PostgreSQL
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ETIMEDOUT'
  );
}

function createSafeError(err: any, requestId: string): SafeError {
  return {
    message: err.message || 'Une erreur est survenue',
    code: err.code,
    statusCode: err.statusCode || 500,
    details: process.env.NODE_ENV === 'development' ? err.details : undefined,
    timestamp: new Date(),
    requestId,
  };
}

function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: SafeError,
  message?: string,
  requestId: string = 'unknown'
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
    requestId,
    timestamp: new Date(),
  };
}

// Logger sécurisé
class Logger {
  private sanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    const sensitive = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitive.some(s => lowerKey.includes(s))) {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitize(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR] ${message}`, this.sanitize(meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, this.sanitize(meta));
  }

  info(message: string, meta?: any): void {
    console.info(`[INFO] ${message}`, this.sanitize(meta));
  }
}

const logger = new Logger();

// Middleware principal de gestion d'erreurs
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as any).requestId || 'unknown';

  // Journalisation sécurisée
  logger.error('Error occurred', {
    requestId,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });

  // Gestion des erreurs Zod
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    res.status(400).json(createApiResponse(
      false,
      undefined,
      createSafeError(new ValidationError('Erreur de validation', { errors: validationErrors }), requestId),
      'Données invalides',
      requestId
    ));
    return;
  }

  // Gestion des erreurs de base de données
  if (isDatabaseError(err)) {
    let message = 'Erreur de base de données';
    let statusCode = 503;
    let code = 'DATABASE_ERROR';

    switch (err.code) {
      case '23505': // Unique violation
        message = 'Cette ressource existe déjà';
        statusCode = 409;
        code = 'UNIQUE_VIOLATION';
        break;
      case '23503': // Foreign key violation
        message = 'Référence invalide';
        statusCode = 400;
        code = 'FOREIGN_KEY_VIOLATION';
        break;
      case 'ECONNREFUSED':
        message = 'Base de données indisponible';
        statusCode = 503;
        code = 'DB_CONNECTION_REFUSED';
        break;
    }

    res.status(statusCode).json(createApiResponse(
      false,
      undefined,
      createSafeError(new AppError(message, statusCode, code), requestId),
      message,
      requestId
    ));
    return;
  }

  // Gestion des erreurs personnalisées
  if (err instanceof AppError) {
    res.status(err.statusCode).json(createApiResponse(
      false,
      undefined,
      createSafeError(err, requestId),
      err.message,
      requestId
    ));
    return;
  }

  // Gestion des erreurs non gérées
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Une erreur interne est survenue' 
    : err.message;

  res.status(statusCode).json(createApiResponse(
    false,
    undefined,
    createSafeError(new AppError(message, statusCode), requestId),
    message,
    requestId
  ));
};

// Middleware pour les erreurs async
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware pour les 404
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).requestId || 'unknown';
  const error = new NotFoundError(`Route ${req.originalUrl} non trouvée`);
  
  res.status(404).json(createApiResponse(
    false,
    undefined,
    createSafeError(error, requestId),
    error.message,
    requestId
  ));
};

// Middleware pour générer un requestId unique
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
};

// Gestionnaire pour les erreurs non capturées
export const setupUncaughtExceptionHandlers = (): void => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
      error: err.message,
      stack: err.stack,
    });
    
    // Sortie propre
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
};

export {
  logger,
  createApiResponse,
  createSafeError,
};