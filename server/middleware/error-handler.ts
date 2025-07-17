import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  // Erreur Zod (validation)
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: err.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message
      }))
    });
    return;
  }

  // Erreur base de données
  if (err.code === 'SQLITE_CONSTRAINT') {
    res.status(409).json({
      success: false,
      message: 'Conflit de données'
    });
    return;
  }

  // Erreur d'authentification
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      message: 'Non autorisé'
    });
    return;
  }

  // Erreur par défaut
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message
  });
};