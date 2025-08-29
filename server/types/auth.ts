export type AppRole = 'customer' | 'waiter' | 'chef' | 'manager' | 'admin' | 'directeur' | 'employe' | 'serveur' | 'cuisinier';

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

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  customer: [
    'orders:create',
    'orders:read:own',
    'reservations:create',
    'reservations:read:own',
    'profile:read:own',
    'profile:update:own'
  ],
  waiter: [
    'orders:read',
    'orders:update',
    'reservations:read',
    'reservations:update',
    'tables:read',
    'tables:update',
    'customers:read'
  ],
  serveur: [
    'orders:read',
    'orders:update',
    'reservations:read',
    'reservations:update',
    'tables:read',
    'tables:update',
    'customers:read'
  ],
  chef: [
    'orders:read',
    'orders:update',
    'menu:read',
    'inventory:read',
    'kitchen:manage'
  ],
  cuisinier: [
    'orders:read',
    'orders:update',
    'menu:read',
    'inventory:read',
    'kitchen:manage'
  ],
  employe: [
    'orders:read',
    'customers:read',
    'inventory:read',
    'basic:operations'
  ],
  manager: [
    'users:read',
    'users:update',
    'analytics:read',
    'reports:read',
    'inventory:manage',
    'menu:manage',
    'staff:manage'
  ],
  directeur: [
    'users:manage',
    'analytics:full',
    'reports:full',
    'inventory:manage',
    'menu:manage',
    'staff:manage',
    'financial:manage'
  ],
  admin: [
    'users:manage',
    'system:manage',
    'analytics:full',
    'reports:full',
    'settings:manage',
    'security:manage'
  ]
};

// Hiérarchie des rôles
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  customer: 1,
  waiter: 2,
  serveur: 2,
  chef: 3,
  cuisinier: 3,
  employe: 3,
  manager: 4,
  directeur: 4,
  admin: 5
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}