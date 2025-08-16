import { Request, Response, NextFunction } from 'express';
import logger from './logger'; // Assurez-vous d'avoir un système de logging configuré

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown> | Array<unknown>;
  error?: unknown;
  timestamp: string;
  path?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

export const apiResponseValidator = (req: Request, res: Response, next: NextFunction) => {
  // Validation uniquement pour les routes API
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Définition du format standard de réponse
  const standardResponse: Partial<ApiResponse> = {
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: res.statusCode
  };

  // Sauvegarde des méthodes originales
  const originalJson = res.json;
  const originalSend = res.send;
  const originalStatus = res.status;

  // Override res.status pour garder trace du code de statut
  res.status = function(code: number) {
    this.statusCode = code;
    standardResponse.statusCode = code;
    return originalStatus.call(this, code);
  };

  // Override res.json pour standardiser le format de réponse
  res.json = function(body: unknown) {
    // Headers pour forcer le JSON
    this.setHeader('Content-Type', 'application/json');

    // Validation du contenu
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        logger.error('🚨 Réponse API non-JSON détectée:', body.substring(0, 100));
        const errorResponse: ApiResponse = {
          ...standardResponse,
          success: false,
          message: 'Erreur de format de réponse',
          error: 'Invalid JSON format'
        };
        return originalJson.call(this, errorResponse);
      }
    }

    // Standardisation de la réponse
    let response: ApiResponse;
    if (isApiResponse(body)) {
      response = {
        ...standardResponse,
        ...body
      };
    } else {
      response = {
        ...standardResponse,
        success: true,
        data: body
      };
    }

    // Validation du schéma de réponse
    if (!validateResponseSchema(response)) {
      logger.warn('Schéma de réponse non standard', response);
    }

    return originalJson.call(this, response);
  };

  // Override res.send pour intercepter les réponses non-JSON
  res.send = function(body: string | Buffer) {
    if (typeof body === 'string') {
      // Détection de HTML
      if (body.includes('<!DOCTYPE') || body.startsWith('<html')) {
        logger.error('🚨 Tentative d\'envoi de HTML sur route API:', req.path);
        const errorResponse: ApiResponse = {
          ...standardResponse,
          success: false,
          message: 'Erreur interne - format de réponse incorrect',
          error: 'HTML response not allowed in API routes'
        };
        return originalJson.call(this, errorResponse);
      }

      // Tentative de conversion automatique pour les chaînes JSON
      if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(body);
          return this.json(parsed);
        } catch (e) {
          // Si ce n'est pas du JSON valide, on continue avec send
        }
      }
    }

    // Pour les autres cas (fichiers, buffers, etc.)
    return originalSend.call(this, body);
  };

  next();
};

export const errorResponseHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api/')) {
    return next(error);
  }

  const statusCode = getErrorStatusCode(error);
  const message = getErrorMessage(error);

  const errorResponse: ApiResponse = {
    success: false,
    message: message,
    statusCode: statusCode,
    error: process.env.NODE_ENV === 'development' ? {
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      details: error
    } : undefined,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Log de l'erreur
  logger.error(`API Error [${statusCode}] at ${req.path}: ${message}`, {
    error: error,
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    }
  });

  res.status(statusCode).json(errorResponse);
};

// Fonctions utilitaires
function isApiResponse(obj: unknown): obj is ApiResponse {
  return typeof obj === 'object' && obj !== null && 'success' in obj;
}

function validateResponseSchema(response: ApiResponse): boolean {
  // Implémentez ici votre validation de schéma (peut utiliser JSON Schema, Zod, etc.)
  return true;
}

function getErrorStatusCode(error: unknown): number {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && typeof error.status === 'number') return error.status;
    if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode;
  }
  return 500;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erreur interne du serveur';
}

// Middleware pour valider le Content-Type des requêtes API
export const apiContentTypeValidator = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/') && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported Media Type: Content-Type must be application/json',
        statusCode: 415,
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
};