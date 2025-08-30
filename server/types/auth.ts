import { Request } from 'express';
import { z } from 'zod';

// Types d'authentification avancés pour Restaurant Barista Café
export type AppRole = 'customer' | 'waiter' | 'chef' | 'manager' | 'admin' | 'staff';

export interface AuthenticatedUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: AppRole;
  permissions: string[];
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: Date;
  metadata?: Record<string, unknown>;
}

// Interface de base pour l'utilisateur authentifié
export interface AuthUser extends AuthenticatedUser {}

// Permission system avancé pour restaurant
export interface PermissionConfig {
  resource: string;
  actions: PermissionAction[];
  role: AppRole;
  conditions?: PermissionCondition[];
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'view' | 'edit' | 'manage' | 'approve' | 'assign';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: unknown;
}

// Extensions pour Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      permissions?: string[];
      isAuthenticated?: boolean;
    }
  }
}

// Schémas de validation métier
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court')
});

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Mot de passe doit contenir au moins 8 caractères')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mot de passe doit contenir une majuscule, minuscule et chiffre'),
  firstName: z.string().min(2, 'Prénom trop court').max(50),
  lastName: z.string().min(2, 'Nom trop court').max(50),
  role: z.enum(['customer', 'waiter', 'chef', 'manager', 'admin', 'staff']).default('customer')
});

// Configuration avancée des rôles pour restaurant
export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  customer: [
    'orders:create', 'orders:read:own', 'reservations:create', 'reservations:read:own',
    'menu:read', 'profile:read:own', 'profile:update:own', 'loyalty:read:own'
  ],
  waiter: [
    'orders:read', 'orders:update', 'orders:assign', 'tables:read', 'tables:update',
    'reservations:read', 'reservations:update', 'customers:read', 'menu:read'
  ],
  staff: [
    'orders:read', 'orders:update', 'tables:read', 'tables:update',
    'reservations:read', 'customers:read', 'inventory:read'
  ],
  chef: [
    'orders:read', 'orders:update', 'menu:read', 'inventory:read', 'inventory:update',
    'kitchen:manage', 'recipes:manage', 'ingredients:manage'
  ],
  manager: [
    'users:read', 'users:update', 'analytics:read', 'reports:read', 'inventory:manage',
    'menu:manage', 'staff:manage', 'finances:read', 'marketing:manage'
  ],
  admin: [
    'users:manage', 'system:manage', 'analytics:full', 'reports:full',
    'settings:manage', 'security:manage', 'database:manage', 'backups:manage'
  ]
};

// Hiérarchie des rôles pour autorisation en cascade
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  customer: 1,
  waiter: 2,
  staff: 2,
  chef: 3,
  manager: 4,
  admin: 5
};

// Types métier avancés pour le restaurant
export interface StaffMember extends AuthenticatedUser {
  employeeId: string;
  department: 'kitchen' | 'service' | 'management' | 'cleaning';
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  hourlyRate: number;
  skills: string[];
  certifications: string[];
  availability: Record<string, boolean>;
}

export interface RestaurantPermission {
  id: string;
  name: string;
  description: string;
  category: 'orders' | 'menu' | 'staff' | 'finance' | 'system';
  level: 'basic' | 'advanced' | 'critical';
}

// Configuration de sécurité avancée
export interface SecurityConfig {
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  twoFactorEnabled: boolean;
}

export interface AuthContext {
  user: AuthenticatedUser | null;
  permissions: string[];
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string, action: PermissionAction) => boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthenticatedUser;
  permissions: string[];
  expiresIn: number;
  refreshToken?: string;
}