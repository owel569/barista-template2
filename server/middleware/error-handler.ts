
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const asyncHandler = (fn: Function) => {
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
  // Log structuré pour monitoring
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      status: err.status || err.statusCode
    }
  };

  console.error('🚨 [ERROR]', JSON.stringify(errorLog, null, 2));

  // S'assurer que toutes les réponses API sont en JSON
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // Erreur de validation Zod
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données de requête invalides',
        errors: err.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        })),
        timestamp: new Date().toISOString()
      });
    }

    // Erreur de base de données
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === '23505') {
      return res.status(503).json({
        success: false,
        message: 'Service temporairement indisponible',
        timestamp: new Date().toISOString(),
        retryAfter: 30
      });
    }

    // Erreur d'authentification
    if (err.name === 'UnauthorizedError' || err.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        timestamp: new Date().toISOString()
      });
    }

    // Erreur d'autorisation
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        timestamp: new Date().toISOString()
      });
    }

    // Erreur de limite de taux
    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes, veuillez patienter',
        timestamp: new Date().toISOString(),
        retryAfter: err.retryAfter || 60
      });
    }

    // Erreur par défaut pour API
    return res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Une erreur interne s\'est produite' 
        : err.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    });
  }

  // Erreur par défaut pour pages HTML
  res.status(err.status || 500).json({
    success: false,
    message: 'Une erreur s\'est produite',
    timestamp: new Date().toISOString()
  });
};
