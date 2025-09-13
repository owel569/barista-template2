// Types de rôles unifiés pour Barista Café
export type AppRole = 'directeur' | 'gerant' | 'employe' | 'customer';

// Type alias pour compatibilité ascendante  
export type LegacyRole = 'admin' | 'manager' | 'staff' | 'waiter' | 'chef' | 'employee' | 'serveur' | 'cuisinier';

// Alias pour compatibilité
export type UserRole = AppRole;

export interface UserPayload {
  id: number;
  username: string;
  email: string;
  role: AppRole;
  firstName?: string;
  lastName?: string;
}

export interface AuthenticatedUser extends UserPayload {
  permissions: string[];
  isActive: boolean;
  iat?: number;
  exp?: number;
}

// Interface pour étendre Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      startTime?: number;
    }

    interface Response {
      success?: boolean;
    }
  }
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthContext {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
}

// Permissions par rôle pour Barista Café (UNIFIÉ)
export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  customer: [
    'orders:create',
    'orders:read:own',
    'reservations:create',
    'reservations:read:own',
    'profile:read:own',
    'profile:update:own'
  ],
  employe: [
    'orders:read',
    'orders:create',
    'customers:read',
    'customers:create',
    'menu:read',
    'reservations:read',
    'reservations:create',
    'tables:read',
    'inventory:read',
    'calendar:read',
    'messages:read',
    'messages:create',
    'user_profile:read',
    'user_profile:update'
  ],
  gerant: [
    'orders:read',
    'orders:create',
    'orders:update',
    'orders:delete',
    'customers:read',
    'customers:create',
    'customers:update',
    'customers:delete',
    'menu:read',
    'menu:create',
    'menu:update',
    'reservations:manage',
    'tables:manage',
    'inventory:manage',
    'employees:read',
    'employees:create',
    'employees:update',
    'analytics:read',
    'analytics:create',
    'reports:read',
    'reports:create',
    'calendar:manage',
    'messages:manage',
    'settings:read',
    'settings:update',
    'user_profile:manage'
  ],
  directeur: [
    'users:manage',
    'analytics:full',
    'reports:full',
    'inventory:manage',
    'menu:manage',
    'staff:manage',
    'financial:manage',
    'settings:manage',
    'permissions:manage',
    'backups:manage',
    'accounting:manage',
    'system:manage',
    'security:manage'
  ]
};

// Hiérarchie des rôles unifiée pour Barista Café
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  customer: 1,    // Clients publics (niveau le plus bas)
  employe: 2,     // Employés de base
  gerant: 3,      // Gérants (niveau intermédiaire)
  directeur: 4    // Directeur (niveau le plus élevé)
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}