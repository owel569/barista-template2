/**
 * Middleware de gestion d'erreurs professionnel et sécurisé
 * Logique métier optimisée pour la longévité du système
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';

// Types sécurisés pour les erreurs
interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  retryAfter?: number;
}

interface DatabaseError extends AppError {
  code: string;
}

// Utilitaire pour identifier les erreurs de base de données
const isDatabaseError = (err: AppError): boolean => {
  const dbCodes = ['ECONNREFUSED', 'ENOTFOUND', '23505', '23503', '23502', '42P01'];
  return dbCodes.includes(err.code?.toString() || '');
};

// Typage amélioré pour asyncHandler
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Fonction de logging sécurisée
const logError = (err: AppError, req: Request): void => {
  const timestamp = new Date().toISOString();

  const errorLog = {
    timestamp,
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent') || 'Unknown',
    ip: req.ip || req.connection.remoteAddress,
    error: {
      name: err.name,
      message: err.message,
      code: err.code?.toString(),
      status: err.status || err.statusCode
    }
  };

  console.error('🚨 [ERROR]', JSON.stringify(errorLog, null, 2));
};

// Fonction pour créer une réponse d'erreur sécurisée
const createErrorResponse = (
  success: boolean,
  message: string,
  status: number,
  additionalData?: Record<string, unknown>
) => {
  const timestamp = new Date().toISOString();
  
  return {
    success,
    message,
    timestamp,
    ...additionalData
  };
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log de l'erreur
  logError(err, req);

  // S'assurer que toutes les réponses API sont en JSON
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // Erreur de validation Zod
    if (err instanceof ZodError || err.name === 'ZodError') {
      const zodError = err as ZodError;
      const errors = zodError.errors.map((e) => ({
        field: e.path.join('.'),
          message: e.message
      }));

      res.status(400).json(createErrorResponse(
        false,
        'Données de requête invalides',
        400,
        { errors }
      ));
      return;
    }

    // Erreur de base de données
    if (isDatabaseError(err)) {
      res.status(503).json(createErrorResponse(
        false,
        'Service temporairement indisponible',
        503,
        { retryAfter: 30 }
      ));
      return;
    }

    // Erreur d'authentification
    if (err.name === 'UnauthorizedError' || err.status === 401) {
      res.status(401).json(createErrorResponse(
        false,
        'Authentification requise',
        401
      ));
      return;
    }

    // Erreur d'autorisation
    if (err.status === 403) {
      res.status(403).json(createErrorResponse(
        false,
        'Permissions insuffisantes',
        403
      ));
      return;
    }

    // Erreur de limite de taux
    if (err.status === 429) {
      res.status(429).json(createErrorResponse(
        false,
        'Trop de requêtes, veuillez patienter',
        429,
        { retryAfter: err.retryAfter || 60 }
      ));
      return;
    }

    // Erreur par défaut pour API
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Une erreur interne s\'est produite' 
      : err.message;

    const response = createErrorResponse(false, message, status);
    
    if (process.env.NODE_ENV === 'development') {
      const devResponse = {
        ...response,
        stack: err.stack,
        details: err 
      };
      res.status(status).json(devResponse);
    } else {
      res.status(status).json(response);
    }
    return;
  }

  // Pour les pages HTML, réponse JSON simple
  res.status(err.status || err.statusCode || 500).json(createErrorResponse(
    false,
    'Une erreur s\'est produite',
    err.status || err.statusCode || 500
  ));
};