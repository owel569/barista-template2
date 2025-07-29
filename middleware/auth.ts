import { Request, Response, NextFunction } from 'express';
import type { User } from '../shared/schema'; // Doit contenir le champ "role"
import { LRUCache } from 'lru-cache';

// Typage strict des rôles
export type AppRole = 'customer' | 'waiter' | 'chef' | 'manager' | 'admin';

// Hiérarchie des rôles (plus le chiffre est élevé, plus le rôle est élevé)
const ROLE_HIERARCHY: Record<AppRole, number> = {
  customer: 1,
  waiter: 2,
  chef: 3,
  manager: 4,
  admin: 5
};

// Cache pour limiter les tentatives d'accès non autorisées
const authAttemptCache = new LRUCache<string, number>({
  max: 100,
  ttl: 1000 * 60 * 15 // 15 minutes
});

/**
 * Middleware de contrôle d'accès par rôle (avec options avancées)
 */
export function requireRole(
  roles: AppRole | AppRole[],
  options: { hierarchy?: boolean; allowApiKey?: boolean } = {}
) {
  const rolesArray = Array.isArray(roles) ? roles : [roles];

  return async (req: Request & { user?: User }, res: Response, next: NextFunction) => {
    // 1. Vérification de l'API Key si activé
    if (options.allowApiKey && req.headers['x-api-key'] === process.env.API_KEY) {
      return next();
    }

    // 2. Vérification de l'authentification de base
    if (!req.user) {
      logAuthAttempt(req.ip, 'no-user');
      return res.status(401).json({
        message: 'Authentification requise',
        suggestion: 'Connectez-vous ou fournissez un token valide'
      });
    }

    // 3. Vérification du rôle
    const userRole = req.user.role as AppRole;
    const ip = req.ip || req.socket.remoteAddress || '';

    // Option hiérarchique (si un rôle supérieur a accès)
    if (options.hierarchy) {
      const requiredLevel = Math.min(...rolesArray.map(r => ROLE_HIERARCHY[r] || 0));
      const userLevel = ROLE_HIERARCHY[userRole] || 0;

      if (userLevel < requiredLevel) {
        logAuthAttempt(ip, 'insufficient-role');
        return sendForbidden(res, userRole, rolesArray);
      }
    }
    // Vérification standard
    else if (!rolesArray.includes(userRole)) {
      logAuthAttempt(ip, 'wrong-role');
      return sendForbidden(res, userRole, rolesArray);
    }

    // 4. Vérification des tentatives abusives
    if (checkAuthAbuse(ip)) {
      return res.status(429).json({
        message: 'Trop de tentatives non autorisées',
        solution: 'Réessayez dans 15 minutes'
      });
    }

    next();
  };
}

// Fonctions utilitaires internes
function sendForbidden(res: Response, userRole: AppRole, allowedRoles: AppRole[]) {
  return res.status(403).json({
    message: 'Accès non autorisé',
    yourRole: userRole,
    requiredRoles: allowedRoles,
    documentation: '/docs/authorization'
  });
}

function logAuthAttempt(ip: string | undefined, reason: string) {
  if (!ip) return;
  const attempts = (authAttemptCache.get(ip) || 0) + 1;
  authAttemptCache.set(ip, attempts);

  // Utilise un logger pro si dispo, sinon console.warn
  console.warn(`Tentative d'accès non autorisée depuis ${ip}`, {
    reason,
    attempts,
    timestamp: new Date().toISOString()
  });
}

function checkAuthAbuse(ip: string | undefined): boolean {
  return ip ? (authAttemptCache.get(ip) || 0) > 5 : false;
}

// Middlewares complémentaires
export const requireCustomer = requireRole('customer');
export const requireStaff = requireRole(['waiter', 'chef', 'manager', 'admin'], { hierarchy: true });
export const requireAdmin = requireRole('admin');