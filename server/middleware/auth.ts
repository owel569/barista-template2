import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getDb } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from './logging';
import { AppError, AuthenticationError, AuthorizationError } from './error-handler-enhanced';
import { AuthenticatedUser, AppRole } from '../types/auth';

const logger = createLogger('AUTH');

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: AppRole;
  permissions: string[];
  isActive: boolean;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: AppRole;
  iat?: number;
  exp?: number;
}

// Hiérarchie des rôles (plus le chiffre est élevé, plus le rôle est élevé)
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../types/auth';

// Configuration JWT sécurisée
const JWT_SECRET = process.env.JWT_SECRET || 'barista-cafe-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

// Cache des utilisateurs pour éviter les requêtes répétées
class UserCache {
  private cache = new Map<number, { user: AuthUser; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(userId: number, user: AuthUser): void {
    this.cache.set(userId, { user, timestamp: Date.now() });
  }

  get(userId: number): AuthUser | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }

    return cached.user;
  }

  delete(userId: number): void {
    this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }
}

const userCache = new UserCache();

// Schémas de validation
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court')
});

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Mot de passe doit contenir au moins 8 caractères')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  firstName: z.string().min(2, 'Prénom trop court').max(50, 'Prénom trop long'),
  lastName: z.string().min(2, 'Nom trop court').max(50, 'Nom trop long'),
  role: z.enum(['customer', 'waiter', 'chef', 'manager', 'admin']).default('customer')
});

// Utilitaires de sécurité
export class AuthService {
  /**
   * Génère un token JWT sécurisé
   */
  static generateToken(user: Partial<AuthUser>): string {
    const payload: JWTPayload = {
      userId: user.id!,
      email: user.email!,
      role: user.role!
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'barista-cafe',
      audience: 'barista-cafe-users'
    });
  }

  /**
   * Vérifie et décode un token JWT
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'barista-cafe',
        audience: 'barista-cafe-users'
      }) as JWTPayload;
    } catch (error) {
      logger.warn('Token invalide', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      throw new AuthenticationError('Token invalide ou expiré');
    }
  }

  /**
   * Hash sécurisé d'un mot de passe
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Vérifie un mot de passe
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Récupère un utilisateur par ID avec cache
   */
  static async getUserById(userId: number): Promise<AuthUser | null> {
    // Vérifier le cache d'abord
    const cached = userCache.get(userId);
    if (cached) return cached;

    try {
      const db = await getDb();
      const result = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (result.length === 0) return null;

      const user = result[0];
      if (!user) return null;
      
      const authUser: AuthUser = {
        id: user.id,
        username: user.username || user.email?.split('@')[0] || '',
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: (user.role as AppRole) || 'customer',
        permissions: this.getRolePermissions(user.role as AppRole),
        isActive: user.isActive ?? true
      };

      // Mettre en cache
      userCache.set(userId, authUser);
      return authUser;
    } catch (error) {
      logger.error('Erreur récupération utilisateur', { userId, error: error instanceof Error ? error.message : 'Erreur inconnue' });
      return null;
    }
  }

  /**
   * Récupère les permissions d'un rôle
   */
  static getRolePermissions(role: AppRole): string[] {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.customer;
  }

  /**
   * Vérifie si un utilisateur a une permission
   */
  static hasPermission(user: AuthUser, permission: string): boolean {
    if (!user.isActive) return false;

    // Admin a toutes les permissions
    if (user.role === 'admin') return true;

    return user.permissions.includes(permission);
  }

  /**
   * Vérifie la hiérarchie des rôles
   */
  static hasRoleLevel(userRole: AppRole, requiredRole: AppRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  }
}

// Middleware d'authentification principal
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token d\'authentification requis');
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);

    const user = await AuthService.getUserById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('Utilisateur non trouvé');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Compte désactivé');
    }

    // Attacher l'utilisateur à la requête
    req.user = user;

    logger.info('Utilisateur authentifié', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Erreur authentification', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    throw new AuthenticationError('Échec de l\'authentification');
  }
};

// Middleware pour vérifier les rôles requis
export const requireRoles = (roles: AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError(`Rôle requis: ${roles.join(' ou ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware de vérification des permissions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      if (!AuthService.hasPermission(req.user, permission)) {
        throw new AuthorizationError(`Permission requise: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware de vérification de niveau hiérarchique
export const requireRoleLevel = (requiredRole: AppRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      if (!AuthService.hasRoleLevel(req.user.role, requiredRole)) {
        throw new AuthorizationError(`Niveau requis: ${requiredRole} ou supérieur`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware optionnel (n'échoue pas si pas authentifié)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignorer les erreurs en mode optionnel
    logger.debug('Auth optionnelle échouée', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }

  next();
};

// Middleware de vérification de propriété
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      // Admin et manager peuvent accéder à tout
      if (['admin', 'manager'].includes(req.user.role)) {
        return next();
      }

      const resourceId = parseInt(req.params[resourceIdParam] || '0');
      const customerId = req.user.id;

      if (isNaN(resourceId)) {
        throw new AppError('ID de ressource invalide', 400);
      }

      // Pour les clients, vérifier que la ressource leur appartient
      if (req.user.role === 'customer' && resourceId !== customerId) {
        throw new AuthorizationError('Accès à la ressource non autorisé');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Export des utilitaires
export { loginSchema, registerSchema, userCache };

// Déclaration globale pour TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}