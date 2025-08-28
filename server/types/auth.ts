
export type AppRole = 'customer' | 'waiter' | 'chef' | 'manager' | 'admin';

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
  role: AppRole;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: AuthenticatedUser;
  message?: string;
  expiresAt?: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: AppRole;
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
  chef: [
    'orders:read',
    'orders:update',
    'menu:read',
    'inventory:read',
    'kitchen:manage'
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
  chef: 3,
  manager: 4,
  admin: 5
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
