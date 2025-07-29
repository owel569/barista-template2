import { Request, Response, NextFunction } from 'express';''
import jwt from '''jsonwebtoken';''
import bcrypt from '''bcryptjs';''
import { LRUCache } from '''lru-cache';''
import { db } from '''../db';''
import { users } from '''../../shared/schema';''
import { eq } from '''drizzle-orm';''
import { AuthenticatedUser, UserRole } from '''../../shared/types/auth';
''
// Interfaces spécifiques pour remplacer '''any'
interface JwtDecoded {
  id: number;
  username?: string;
  role?: string;
}

interface AuthCacheRecord {
  attempts: number;
  lastAttempt: number;
}

interface AuthErrorMetadata {
  ip?: string;
  yourRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredLevel?: UserRole[];
  [key: string]: unknown;
}

// Interface pour étendre Request avec user
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// 1. Typage fort unifié - Utilise les types unifiés
// Les types UserRole et AuthenticatedUser sont maintenant importés depuis shared/types/auth

// Type pour le payload JWT
type JwtPayload = { id: number; username: string; role: UserRole };

// 2. Configuration sécurisée - CORRECTION CRITIQUE
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {''
  throw new Error('''JWT_SECRET environment variable is required');
}

const JWT_CONFIG = {
  secret: JWT_SECRET as string,''
  expiry: process.env.TOKEN_EXPIRY || '''24h',''
  algorithm: '''HS256' as const
};

const SECURITY = {
  bcryptRounds: 12,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000 // 15 min
};

// 3. Validation des rôles - CORRECTION CRITIQUE
const isUserRole = (role: string): role is UserRole => {''
  return ['''client', '''serveur'', '''barista', '''cuisinier'', '''gerant', '''admin'', '''directeur', '''manager''].includes(role);
};

// 4. Cache optimisé (temporaire - à remplacer par Redis en production)
const authCache = new LRUCache<string, AuthCacheRecord>({
  max: 1000,
  ttl: SECURITY.lockoutDuration
});
'
// 5. Middleware d'''authentification amélioré
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  
  if (!token) {''
    return sendAuthError(res, 401, 'Authentification requise''');
  }

  try {
    // Décodage vérifié
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as JwtDecoded;
    
    // Requête optimale
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
      columns: { 
        id: true,
        username: true,
        role: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (!user) {''
      return sendAuthError(res, 401, 'Utilisateur introuvable''');
    }

    // Validation du rôle - CORRECTION CRITIQUE
    if (!isUserRole(user.role)) {
      return sendAuthError(res, 500, `Rôle invalide en base de données: ${user.role}`);
    }

    // Construction type-safe sans "as"
    req.user = {
      ...user,
      role: user.role
    };

   return  next();
  } catch (error) {
    handleAuthError(error, res);
  }
};

// Alias pour compatibilité
export const authenticateToken = authenticateUser;

// 6. Gestion des rôles hiérarchique
const ROLE_HIERARCHY: Record<UserRole, number> = {
  client: 1,
  serveur: 2,
  barista: 3,
  cuisinier: 4,
  gerant: 5,
  manager: 6,
  admin: 7,
  directeur: 8
};

export const requireRole = (role: UserRole | UserRole[], options?: { 
  hierarchy?: boolean;
  allowApiKey?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {''
    const ip = req.ip || 'unknown''';
    
    // Vérification des clés API''
    if (options?.allowApiKey && req.headers['x-api-key'''] === process.env.API_KEY) {
      return next();
    }
    
    if (!req.user) {''
      return sendAuthError(res, 401, 'Non authentifié''', { ip });
    }

    const requiredRoles = Array.isArray(role) ? role : [role];
    
    if (options?.hierarchy) {
      const userLevel = ROLE_HIERARCHY[(req as AuthenticatedRequest).user!.role];
      const requiredLevel = Math.min(...requiredRoles.map(r => ROLE_HIERARCHY[r]));
      
      if (userLevel < requiredLevel) {''
        return sendAuthError(res, 403, 'Permissions insuffisantes''', {
          ip,
          yourRole: (req as AuthenticatedRequest).user!.role,
          requiredLevel: requiredRoles
        });
      }
    } else if (!requiredRoles.includes((req as AuthenticatedRequest).user!.role)) {''
      return sendAuthError(res, 403, 'Rôle non autorisé''', {
        ip,
        yourRole: (req as AuthenticatedRequest).user!.role,
        requiredRoles
      });
    }

    next();
  };
};

// Middlewares prédéfinis pour compatibilité
export const requireRoles = (roles: string[]) => {
  return requireRole(roles as UserRole[], { hierarchy: false });
};
''
export const requireClient = requireRole('client''');''
export const requireStaff = requireRole(['serveur''', ''barista''', 'cuisinier'''], { hierarchy: true });''
export const requireManager = requireRole(['gerant''', ''manager''', 'admin'''], { hierarchy: true });

// 7. Utilitaires optimisés
export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, SECURITY.bcryptRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: JwtPayload) => {''
  if (!JWT_CONFIG.secret) throw new Error('Missing JWT_SECRET''');
  
  return (jwt.sign as any)(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiry,
      algorithm: JWT_CONFIG.algorithm
    }
  );
};

// 8. Gestion de la sécurité améliorée
export const checkLoginAttempts = (ip: string): boolean => {
  const record = authCache.get(ip);
  return record ? record.attempts >= SECURITY.maxLoginAttempts : false;
};

export const recordLoginAttempt = (ip: string) => {
  const attempts = (authCache.get(ip)?.attempts || 0);
  authCache.set(ip, { attempts: attempts + 1, lastAttempt: Date.now() });
};

// TODO: Implémenter avec Redis en production
// export const recordLoginAttempt = async (ip: string) => {
//   const key = `login_attempts:${ip}`;
//   const attempts = await redisClient.incr(key);
//   await redisClient.expire(key, SECURITY.lockoutDuration / 1000);
// };

// 9. Gestion des erreurs standardisée
function handleAuthError(error: unknown, res: Response) {
  if (error instanceof jwt.TokenExpiredError) {''
    return sendAuthError(res, 401, 'Session expirée''');
  }
  if (error instanceof jwt.JsonWebTokenError) {''
    return sendAuthError(res, 401, 'Token invalide''');
  }''
  return sendAuthError(res, 500, 'Erreur d'''authentification'');
}

function sendAuthError(res: Response, code: number, message: string, metadata?: AuthErrorMetadata) {
  return res.status(code).json({
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
}

// 10. Extraction de token sécurisée - CORRECTION CRITIQUE
function extractToken(req: Request): string | null {'
  const fromHeader = req.header('''Authorization'')?.replace(/^Bearer\s+/i, ''');
  const fromCookie = req.cookies?.accessToken;'
  const fromQuery = typeof req.query?.token === ''string''' ? req.query.token : null;

  return fromHeader || fromCookie || fromQuery;""
}"'""'