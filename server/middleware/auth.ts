import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'barista-secret-key-ultra-secure-2025';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token manquant',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        console.log('Token verification failed:', err.message);
        return res.status(403).json({ 
          success: false,
          message: 'Token invalide',
          code: 'TOKEN_INVALID'
        });
      }
      
      // Vérifier que l'utilisateur est toujours actif
      if (user && user.id) {
        (req as any).user = user;
        return next();
      } else {
        return res.status(403).json({ 
          success: false,
          message: 'Utilisateur invalide',
          code: 'USER_INVALID'
        });
      }
    });
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erreur serveur d\'authentification',
      code: 'AUTH_ERROR'
    });
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || (user.role !== role && user.role !== 'directeur')) {
      return res.status(403).json({ message: 'Accès refusé - rôle insuffisant' });
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

export const generateToken = (user: any): string => {
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