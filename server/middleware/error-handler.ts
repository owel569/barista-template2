import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';

// Utilitaire pour identifier les erreurs de base de données
const isDatabaseError = (err: any): boolean => {
  const dbCodes = ['ECONNREFUSED', 'ENOTFOUND', '23505', '23503', '23502', '42P01'];
  return dbCodes.includes(err.code?.toString());
};

// Typage amélioré pour asyncHandler
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Timestamp uniforme
  const timestamp = new Date().toISOString();

  // Log structuré pour monitoring
  const errorLog = {
    timestamp,
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    error: {
      name: err.name,
      message: err.message,
      code: err.code?.toString(),
      status: err.status || err.statusCode
    }
  };

  console.error('🚨 [ERROR]', JSON.stringify(errorLog, null, 2));

  // S'assurer que toutes les réponses API sont en JSON
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // Erreur de validation Zod
    if (err instanceof ZodError || err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données de requête invalides',
        errors: err.errors?.map((e: any) => ({
          field: e.path?.join('.') || 'unknown',
          message: e.message
        })) || [],
        timestamp
      });
    }

    // Erreur de base de données
    if (isDatabaseError(err)) {
      return res.status(503).json({
        success: false,
        message: 'Service temporairement indisponible',
        timestamp,
        retryAfter: 30
      });
    }

    // Erreur d'authentification
    if (err.name === 'UnauthorizedError' || err.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        timestamp
      });
    }

    // Erreur d'autorisation
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        timestamp
      });
    }

    // Erreur de limite de taux
    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes, veuillez patienter',
        timestamp,
        retryAfter: err.retryAfter || 60
      });
    }

    // Erreur par défaut pour API
    return res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Une erreur interne s\'est produite' 
        : err.message,
      timestamp,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    });
  }

  // Pour les pages HTML, redirection vers une page d'erreur ou réponse JSON simple
  // Si vous avez des pages HTML, remplacez par res.redirect('/error') ou un template
  res.status(err.status || 500).json({
    success: false,
    message: 'Une erreur s\'est produite',
    timestamp
  });
};