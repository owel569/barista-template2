// Constantes pour les permissions - Amélioration #1 des attached_assets
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'respond' | 'use';
export type Role = 'directeur' | 'employe';

export type PermissionsMap = Record<string, PermissionAction[]>;

export const DEFAULT_PERMISSIONS: Record<Role, PermissionsMap> = {
  directeur: {
    dashboard: ['view', 'use'],
    users: ['view', 'create', 'edit', 'delete'],
    menu: ['view', 'create', 'edit', 'delete'],
    categories: ['view', 'create', 'edit', 'delete'],
    tables: ['view', 'create', 'edit', 'delete'],
    reservations: ['view', 'create', 'edit', 'delete', 'respond'],
    orders: ['view', 'create', 'edit', 'delete'],
    customers: ['view', 'create', 'edit', 'delete'],
    employees: ['view', 'create', 'edit', 'delete'],
    calendar: ['view', 'create', 'edit', 'delete'],
    statistics: ['view', 'use'],
    reports: ['view', 'create', 'use'],
    messages: ['view', 'create', 'edit', 'delete', 'respond'],
    permissions: ['view', 'edit'],
    settings: ['view', 'edit'],
  },
  employe: {
    dashboard: ['view', 'use'],
    menu: ['view'],
    categories: ['view'],
    tables: ['view'],
    reservations: ['view', 'create', 'edit'],
    orders: ['view', 'create', 'edit'],
    customers: ['view', 'create', 'edit'],
    calendar: ['view'],
    statistics: ['view'],
    messages: ['view', 'respond'],
  },
};

export const ALL_ACCESS_ROLES: Role[] = ['directeur'];

// Clés localStorage centralisées
export const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'auth_user',
  theme: 'app_theme',
  preferences: 'user_preferences'
} as const;