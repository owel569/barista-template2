
import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erreur serveur interne';

  // Logger l'erreur
  console.error(`[${new Date().toISOString()}] [ERROR] ${req.method} ${req.path}:`, {
    message: error.message,
    stack: error.stack,
    statusCode,
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user?.username
  });

  // En production, ne pas exposer les détails de l'erreur
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { 
      stack: error.stack,
      details: error
    })
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} non trouvée`
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
