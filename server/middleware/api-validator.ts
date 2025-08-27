import { Request, Response, NextFunction } from 'express';
import { logger } from './logger'; // Correction de l'import - utiliser l'export nommé

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
  timestamp: string;
  path?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

// Interface pour les erreurs standardisées
interface StandardError {
  name?: string;
  message: string;
  stack?: string;
  details?: unknown;
}

export const apiResponseValidator = (req: Request, res: Response, next: NextFunction): void => {
  // Validation uniquement pour les routes API
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Définition du format standard de réponse avec valeurs par défaut
  const standardResponse: Omit<ApiResponse, 'success' | 'message' | 'data' | 'error'> = {
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode: res.statusCode
  };

  // Sauvegarde des méthodes originales
  const originalJson = res.json;
  const originalSend = res.send;
  const originalStatus = res.status;

  // Override res.status pour garder trace du code de statut
  res.status = function(code: number): Response {
    // Utiliser 'this' pour accéder à la propriété statusCode définie dans le scope de la fonction
    (this as any).statusCode = code;
    return originalStatus.call(this, code);
  };

  // Override res.json pour standardiser le format de réponse
  res.json = function(body: unknown): Response {
    // Headers pour forcer le JSON
    this.setHeader('Content-Type', 'application/json');

    let parsedBody: unknown = body;

    // Validation du contenu
    if (typeof body === 'string') {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        logger.error('🚨 Réponse API non-JSON détectée:', body.substring(0, 100));
        const errorResponse: ApiResponse<string> = {
          ...standardResponse,
          success: false,
          message: 'Erreur de format de réponse',
          error: 'Invalid JSON format',
          timestamp: standardResponse.timestamp
        };
        return originalJson.call(this, errorResponse);
      }
    }

    // Standardisation de la réponse
    let response: ApiResponse;
    if (isApiResponse(parsedBody)) {
      response = {
        ...standardResponse,
        ...parsedBody,
        timestamp: parsedBody.timestamp || standardResponse.timestamp
      };
    } else {
      response = {
        ...standardResponse,
        success: true,
        data: parsedBody,
        timestamp: standardResponse.timestamp
      };
    }

    // Validation du schéma de réponse
    if (!validateResponseSchema(response)) {
      logger.warn('Schéma de réponse non standard', response);
    }

    return originalJson.call(this, response);
  };

  // Override res.send pour intercepter les réponses non-JSON
  res.send = function(body: string | Buffer): Response {
    if (typeof body === 'string') {
      // Détection de HTML
      if (body.includes('<!DOCTYPE') || body.startsWith('<html')) {
        logger.error('🚨 Tentative d\'envoi de HTML sur route API:', req.path);
        const errorResponse: ApiResponse<string> = {
          ...standardResponse,
          success: false,
          message: 'Erreur interne - format de réponse incorrect',
          error: 'HTML response not allowed in API routes',
          timestamp: standardResponse.timestamp
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

export const errorResponseHandler = (error: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (!req.path.startsWith('/api/')) {
    return next(error);
  }

  const statusCode = getErrorStatusCode(error);
  const message = getErrorMessage(error);

  const errorResponse: ApiResponse<string> = {
    success: false,
    message: message,
    statusCode: statusCode,
    error: process.env.NODE_ENV === 'development' ? getErrorDetails(error) : undefined,
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
  // Validation basique du schéma
  const isValid =
    typeof response.success === 'boolean' &&
    (response.message === undefined || typeof response.message === 'string') &&
    (response.timestamp === undefined || typeof response.timestamp === 'string') &&
    (response.statusCode === undefined || typeof response.statusCode === 'number');

  if (!isValid) {
    logger.warn('Response schema validation failed:', response);
  }

  return isValid;
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
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Erreur interne du serveur';
}

function getErrorDetails(error: unknown): StandardError | string {
  if (error instanceof Error) {
    // Modification pour supporter la propriété 'cause'
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // Vérification sécurisée pour la propriété 'cause'
      details: 'cause' in error && error.cause !== undefined ? error.cause : undefined
    };
  }
  if (typeof error === 'string') return error;
  return String(error);
}

// Middleware pour valider le Content-Type des requêtes API
export const apiContentTypeValidator = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path.startsWith('/api/') && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      const errorResponse: ApiResponse<string> = {
        success: false,
        message: 'Unsupported Media Type: Content-Type must be application/json',
        statusCode: 415,
        timestamp: new Date().toISOString(),
        path: req.path
      };
      res.status(415).json(errorResponse);
      return;
    }
  }
  next();
};

// Middleware pour valider le body des requêtes
export const apiBodyValidator = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path.startsWith('/api/') && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      // Validation basique du body
      if (req.body && typeof req.body !== 'object') {
        const errorResponse: ApiResponse<string> = {
          success: false,
          message: 'Invalid request body',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path
        };
        res.status(400).json(errorResponse);
        return;
      }
    } catch (error) {
      const errorResponse: ApiResponse<string> = {
        success: false,
        message: 'Error parsing request body',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path
      };
      res.status(400).json(errorResponse);
      return;
    }
  }
  next();
};

// Export par défaut pour une utilisation facile
const apiValidators = {
  apiResponseValidator,
  errorResponseHandler,
  apiContentTypeValidator,
  apiBodyValidator
};

export default apiValidators;