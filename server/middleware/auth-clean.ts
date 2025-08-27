import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createLogger } from './logging';
const logger = createLogger('AUTH');

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

interface UserPayload {
  id: number;
  username: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'barista-secret-key-ultra-secure-2025';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant', success: false, code: 'TOKEN_MISSING' });
  }

  try {
    jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined) => {
      if (err) {
        console.log('Token verification failed:', err.message);
        return res.status(403).json({ message: 'Token invalide', success: false, code: 'TOKEN_INVALID' });
      }
      (req as AuthenticatedRequest).user = decoded as UserPayload;
      return next();
    });
  } catch (error){
    logger.error('Erreur d\'authentification:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    return res.status(500).json({ message: 'Erreur serveur d\'authentification', success: false, code: 'AUTH_ERROR' });
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ message: 'Accès refusé - rôle insuffisant' });
    }
    next();
  };
};

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
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