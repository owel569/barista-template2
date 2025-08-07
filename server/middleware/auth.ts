import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserPayload, AuthenticatedUser } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'barista-secret-key-ultra-secure-2025';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Middleware d'authentification principal (remplace authMiddleware)
export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Token d\'accès requis' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token invalide' 
    });
    return;
  }
};

// Alias pour compatibilité (sera supprimé progressivement)
export const authMiddleware = authenticateUser;

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user || user.role !== role) {
      res.status(403).json({ message: 'Accès refusé - rôle insuffisant' });
      return;
    }
    next();
  };
};

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ message: 'Accès refusé - rôle insuffisant' });
      return;
    }
    next();
  };
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (user: UserPayload): string => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Note: authMiddleware est défini en haut du fichier, pas besoin de redéclaration