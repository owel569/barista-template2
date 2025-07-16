/**
 * Middleware d'authentification pour les routes avancées
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    (req as any).user = user;
    next();
  });
};

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    if (user.role !== requiredRole && user.role !== 'directeur') {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }
    
    next();
  };
};
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'barista-secret-key-ultra-secure-2025';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Token invalide' });
    }
    (req as any).user = user;
    next();
  });
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ message: 'Accès refusé - rôle insuffisant' });
    }
    next();
  };
};
