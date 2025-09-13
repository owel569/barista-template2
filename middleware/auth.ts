import { Request, Response, NextFunction } from 'express';
import type { User } from '../shared/schema';
// Import corrigé pour lru-cache

// Typage strict des rôles - SYSTÈME UNIFIÉ 4-RÔLES
export type AppRole = 'customer' | 'employe' | 'gerant' | 'directeur';

// Hiérarchie des rôles unifiée pour Barista Café (plus le chiffre est élevé, plus le rôle est élevé)
const ROLE_HIERARCHY: Record<AppRole, number> = {
  customer: 1,    // Clients publics (niveau le plus bas)
  employe: 2,     // Employés de base
  gerant: 3,      // Gérants (niveau intermédiaire)
  directeur: 4    // Directeur (niveau le plus élevé)
};

// Cache pour limiter les tentatives d'accès non autorisées (simplifié)
const authAttemptCache = new Map<string, { count: number; lastAttempt: number }>();

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
  const currentData = authAttemptCache.get(ip) || { count: 0, lastAttempt: 0 };
  const newData = {
    count: currentData.count + 1,
    lastAttempt: Date.now()
  };
  authAttemptCache.set(ip, newData);

  // Utilise un logger pro si dispo, sinon console.warn
  console.warn(`Tentative d'accès non autorisée depuis ${ip}`, {
    reason,
    attempts: newData.count,
    timestamp: new Date().toISOString()
  });
}

function checkAuthAbuse(ip: string | undefined): boolean {
  if (!ip) return false;
  const data = authAttemptCache.get(ip);
  if (!data) return false;
  
  // Reset si la dernière tentative date de plus de 15 minutes
  const fifteenMinutes = 15 * 60 * 1000;
  if (Date.now() - data.lastAttempt > fifteenMinutes) {
    authAttemptCache.delete(ip);
    return false;
  }
  
  return data.count > 5;
}

// Middlewares complémentaires - SYSTÈME UNIFIÉ
export const requireCustomer = requireRole('customer');
export const requireEmploye = requireRole('employe', { hierarchy: true });
export const requireGerant = requireRole('gerant', { hierarchy: true });
export const requireDirecteur = requireRole('directeur');

// Alias pour compatibilité ascendante
export const requireStaff = requireRole(['employe', 'gerant', 'directeur'], { hierarchy: true });
export const requireAdmin = requireRole('directeur'); // Alias: admin -> directeur