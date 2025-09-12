/**
 * Types et permissions sophistiqués pour le système de gestion du café
 * Typage strict et sécurisé pour tous les rôles
 */

// Types de base
export type UserRole = 'directeur' | 'gerant' | 'employe';

export type Permission = 
  | 'dashboard.view'
  | 'dashboard.advanced'
  | 'menu.view' | 'menu.create' | 'menu.edit' | 'menu.delete'
  | 'orders.view' | 'orders.create' | 'orders.edit' | 'orders.cancel'
  | 'reservations.view' | 'reservations.create' | 'reservations.edit' | 'reservations.cancel'
  | 'customers.view' | 'customers.create' | 'customers.edit' | 'customers.delete'
  | 'inventory.view' | 'inventory.create' | 'inventory.edit' | 'inventory.delete'
  | 'schedule.view' | 'schedule.create' | 'schedule.edit' | 'schedule.delete'
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete'
  | 'permissions.view' | 'permissions.edit'
  | 'reports.view' | 'reports.create' | 'reports.advanced'
  | 'analytics.view' | 'analytics.advanced'
  | 'notifications.view' | 'notifications.send'
  | 'backup.view' | 'backup.create' | 'backup.restore'
  | 'maintenance.view' | 'maintenance.advanced'
  | 'suppliers.view' | 'suppliers.edit'
  | 'tables.view' | 'tables.edit'
  | 'delivery.view' | 'delivery.manage'
  | 'events.view' | 'events.create' | 'events.edit'
  | 'feedback.view' | 'feedback.respond'
  | 'quality.view' | 'quality.manage'
  | 'activity_logs.view'
  | 'settings.view' | 'settings.edit';

// Matrice des permissions par rôle - Configuration sécurisée
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  directeur: [
    // Accès total - Directeur a tous les droits
    'dashboard.view', 'dashboard.advanced',
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
    'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'schedule.view', 'schedule.create', 'schedule.edit', 'schedule.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'permissions.view', 'permissions.edit',
    'reports.view', 'reports.create', 'reports.advanced',
    'analytics.view', 'analytics.advanced',
    'notifications.view', 'notifications.send',
    'backup.view', 'backup.create', 'backup.restore',
    'maintenance.view', 'maintenance.advanced',
    'suppliers.view', 'suppliers.edit',
    'tables.view', 'tables.edit',
    'delivery.view', 'delivery.manage',
    'events.view', 'events.create', 'events.edit',
    'feedback.view', 'feedback.respond',
    'quality.view', 'quality.manage',
    'activity_logs.view',
    'settings.view', 'settings.edit'
  ],
  
  gerant: [
    // Accès de gestion - Gérant a la plupart des droits sauf administration système
    'dashboard.view',
    'menu.view', 'menu.create', 'menu.edit',
    'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel',
    'customers.view', 'customers.create', 'customers.edit',
    'inventory.view', 'inventory.create', 'inventory.edit',
    'schedule.view', 'schedule.create', 'schedule.edit',
    'users.view', 'users.edit',
    'reports.view', 'reports.create',
    'analytics.view',
    'notifications.view',
    'maintenance.view',
    'suppliers.view', 'suppliers.edit',
    'tables.view', 'tables.edit',
    'delivery.view', 'delivery.manage',
    'events.view', 'events.create', 'events.edit',
    'feedback.view', 'feedback.respond',
    'quality.view',
    'settings.view'
  ],

  employe: [
    // Accès employé - Opérations de base
    'dashboard.view',
    'menu.view',
    'orders.view', 'orders.create', 'orders.edit',
    'reservations.view', 'reservations.create', 'reservations.edit',
    'customers.view',
    'inventory.view',
    'schedule.view',
    'tables.view', 'tables.edit',
    'delivery.view',
    'feedback.view'
  ]rd.advanced',
    'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
    'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel',
    'customers.view', 'customers.create', 'customers.edit',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'schedule.view', 'schedule.create', 'schedule.edit', 'schedule.delete',
    'reports.view', 'reports.create',
    'analytics.view', 'analytics.advanced',
    'notifications.view', 'notifications.send',
    'maintenance.view',
    'suppliers.view', 'suppliers.edit',
    'tables.view', 'tables.edit',
    'delivery.view', 'delivery.manage',
    'events.view', 'events.create', 'events.edit',
    'feedback.view', 'feedback.respond',
    'quality.view', 'quality.manage',
    'activity_logs.view'
  ],
  
  employe: [
    // Accès limité - Employé a accès en lecture principalement + quelques actions
    'dashboard.view',
    'menu.view',
    'orders.view', 'orders.create', 'orders.edit',
    'reservations.view', 'reservations.create', 'reservations.edit',
    'customers.view',
    'inventory.view',
    'schedule.view',
    'notifications.view',
    'tables.view',
    'delivery.view',
    'feedback.view'
  ]
};

// Interface utilisateur avec typage strict
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissions?: Permission[];
}

// Interface pour la vérification des permissions
export interface PermissionCheckProps {
  user: AuthenticatedUser | null;
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Interface pour les props des composants protégés
export interface RoleProtectedProps {
  requiredPermissions: Permission[];
  user: AuthenticatedUser | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = toutes les permissions requises, false = au moins une
}

// Types pour les composants admin avec typage strict
export interface AdminComponentProps {
  userRole: UserRole;
  user?: AuthenticatedUser | null;
}

// Configuration des modules par rôle
export type AdminModule = 
  | 'dashboard' | 'menu' | 'orders' | 'reservations' | 'customers'
  | 'inventory' | 'schedule' | 'permissions' | 'reports' | 'analytics'
  | 'notifications' | 'backup' | 'maintenance' | 'suppliers' | 'tables'
  | 'delivery' | 'events' | 'feedback' | 'quality' | 'activity_logs' | 'settings';

export const ROLE_MODULES: Record<UserRole, AdminModule[]> = {
  directeur: [
    'dashboard', 'menu', 'orders', 'reservations', 'customers',
    'inventory', 'schedule', 'permissions', 'reports', 'analytics',
    'notifications', 'backup', 'maintenance', 'suppliers', 'tables',
    'delivery', 'events', 'feedback', 'quality', 'activity_logs', 'settings'
  ],
  gerant: [
    'dashboard', 'menu', 'orders', 'reservations', 'customers',
    'inventory', 'schedule', 'reports', 'analytics',
    'notifications', 'maintenance', 'suppliers', 'tables',
    'delivery', 'events', 'feedback', 'quality', 'activity_logs'
  ],
  employe: [
    'dashboard', 'menu', 'orders', 'reservations', 'customers',
    'inventory', 'schedule', 'notifications', 'tables', 'delivery', 'feedback'
  ]
};

// Helper functions avec typage strict
export const hasPermission = (user: AuthenticatedUser | null, permission: Permission): boolean => {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
};

export const hasAnyPermission = (user: AuthenticatedUser | null, permissions: Permission[]): boolean => {
  if (!user || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

export const hasAllPermissions = (user: AuthenticatedUser | null, permissions: Permission[]): boolean => {
  if (!user || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

export const canAccessModule = (user: AuthenticatedUser | null, module: AdminModule): boolean => {
  if (!user) return false;
  return ROLE_MODULES[user.role]?.includes(module) ?? false;
};

// Types pour les erreurs de permissions
export class PermissionError extends Error {
  constructor(
    public readonly requiredPermission: Permission,
    public readonly userRole: UserRole | null
  ) {
    super(`Permission refusée: ${requiredPermission} pour le rôle ${userRole ?? 'anonyme'}`);
    this.name = 'PermissionError';
  }
}

// Configuration des couleurs et icônes par rôle
export const ROLE_CONFIG = {
  directeur: {
    label: 'Directeur',
    color: 'red',
    badge: 'bg-red-100 text-red-800',
    description: 'Accès complet à toutes les fonctionnalités'
  },
  gerant: {
    label: 'Gérant',
    color: 'blue', 
    badge: 'bg-blue-100 text-blue-800',
    description: 'Gestion opérationnelle et supervision'
  },
  employe: {
    label: 'Employé',
    color: 'green',
    badge: 'bg-green-100 text-green-800', 
    description: 'Opérations quotidiennes et service client'
  } service client'
  }
} as const;