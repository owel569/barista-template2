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

interface JwtPayload {
  userId: number;
  email: string;
  role: AppRole;
  iat?: number;
  exp?: number;
}

// Hiérarchie des rôles (plus le chiffre est élevé, plus le rôle est élevé)
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../types/auth';

// Configuration JWT sécurisée
const JWT_SECRET = process.env.JWT_SECRET || 'barista-cafe-secret-key-2024-production-secure';
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
    const payload: JwtPayload = {
      userId: user.id!,
      email: user.email!,
      role: user.role!
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'barista-cafe',
      audience: 'barista-users'
    });
  }

  /**
   * Vérifie et décode un token JWT
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'barista-cafe',
        audience: 'barista-users'
      }) as JwtPayload;
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

      // Assurez-vous que le rôle est correctement mappé ou géré
      const userRole = (user.role as AppRole) || 'customer'; // Assurez-vous que 'customer' est une AppRole valide

      const authUser: AuthUser = {
        id: user.id,
        username: user.username || user.email?.split('@')[0] || '',
        email: user.email!,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: userRole,
        permissions: this.getRolePermissions(userRole),
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

    // Directeur a toutes les permissions
    if (user.role === 'directeur') return true;

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
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({ success: false, message: 'Token manquant' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (typeof decoded === 'string' || !decoded.userId) {
      res.status(401).json({ success: false, message: 'Token invalide' });
      return;
    }

    // Récupérer l'utilisateur depuis la base de données
    const db = getDb();
    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (userResult.length === 0) {
      res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }

    const userData = userResult[0];
    console.log('Utilisateur authentifié:', { id: userData.id, email: userData.email, role: userData.role });

    // S'assurer que req.user a toutes les propriétés nécessaires
    req.user = {
      id: userData.id,
      username: userData.username || userData.email?.split('@')[0] || '',
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role as any,
      isActive: userData.isActive ?? true,
      permissions: AuthService.getRolePermissions(userData.role as any)
    };
    
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: 'Token expiré ou invalide' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'authentification' });
    }
  }
};

// Middleware pour vérifier les rôles requis
export const requireRoles = (allowedRoles: AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
      return;
    }

    // Mapping bidirectionnel des rôles pour compatibilité
    const roleMapping: { [key: string]: AppRole } = {
      'admin': 'directeur',
      'manager': 'gerant',
      'employee': 'employe',
      'waiter': 'employe', // Ajout pour couvrir 'waiter'
      'chef': 'employe', // Ajout pour couvrir 'chef'
      'customer': 'customer',
      // Reverse mapping (si nécessaire, mais les types AppRole devraient suffire)
      'directeur': 'directeur',
      'gerant': 'gerant',
      'employe': 'employe'
    };

    const userRole = roleMapping[req.user.role] || req.user.role;
    const normalizedAllowedRoles = allowedRoles.map(role => roleMapping[role] || role);

    // Debug log pour diagnostiquer
    logger.info('Vérification des rôles', {
      userId: req.user.id,
      userRole: req.user.role,
      mappedUserRole: userRole,
      allowedRoles,
      normalizedAllowedRoles,
      hasAccess: normalizedAllowedRoles.includes(userRole)
    });

    if (!normalizedAllowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}. Votre rôle: ${userRole}`,
        debug: {
          originalRole: req.user.role,
          mappedRole: userRole,
          allowedRoles,
          normalizedAllowedRoles
        }
      });
      return;
    }

    next();
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

      // Directeur et gérant peuvent accéder à tout
      if (['directeur', 'gerant'].includes(req.user.role)) {
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