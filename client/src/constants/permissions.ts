// Types pour une meilleure sécurité de type
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'respond' | 'use';
// Rôles unifiés pour Barista Café (4-role system)
export type Role = 'directeur' | 'gerant' | 'employe' | 'customer';

export type PermissionsMap = Record<string, PermissionAction[]>;

// Rôles avec accès complet
export const ALL_ACCESS_ROLES: Role[] = ['directeur'];

// Permissions par défaut pour chaque rôle avec granularité fine
export const DEFAULT_PERMISSIONS: Record<UserRole, Record<ModuleName, PermissionAction[]>> = {
  directeur: {
    // Le directeur a accès à tout
    dashboard: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    menu: ['view', 'create', 'edit', 'delete'],
    reservations: ['view', 'create', 'edit', 'delete', 'respond'],
    customers: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    employees: ['view', 'create', 'edit', 'delete'],
    analytics: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'create', 'edit', 'delete'],
    permissions: ['view', 'create', 'edit', 'delete'],
    tables: ['view', 'create', 'edit', 'delete'],
    delivery: ['view', 'create', 'edit', 'delete'],
    events: ['view', 'create', 'edit', 'delete'],
    feedback: ['view', 'create', 'edit', 'delete', 'respond'],
    notifications: ['view', 'create', 'edit', 'delete'],
    loyalty: ['view', 'create', 'edit', 'delete'],
    maintenance: ['view', 'create', 'edit', 'delete'],
    accounting: ['view', 'create', 'edit', 'delete'],
    backup: ['view', 'create', 'edit', 'delete'],
    quality: ['view', 'create', 'edit', 'delete'],
    suppliers: ['view', 'create', 'edit', 'delete'],
    calendar: ['view', 'create', 'edit', 'delete'],
    messages: ['view', 'create', 'edit', 'delete'],
    pos: ['view', 'create', 'edit', 'delete'],
    scheduling: ['view', 'create', 'edit', 'delete'],
    users: ['view', 'create', 'edit', 'delete'],
    gallery: ['view', 'create', 'edit', 'delete']
  },

  gerant: {
    // Le gérant a accès à la plupart des fonctionnalités sauf administration système
    dashboard: ['view', 'create', 'edit'],
    orders: ['view', 'create', 'edit', 'delete'],
    menu: ['view', 'create', 'edit'],
    reservations: ['view', 'create', 'edit', 'delete', 'respond'],
    customers: ['view', 'create', 'edit'],
    inventory: ['view', 'create', 'edit'],
    employees: ['view', 'edit'],
    analytics: ['view', 'create'],
    reports: ['view', 'create'],
    settings: ['view', 'edit'],
    permissions: ['view'],
    tables: ['view', 'edit'],
    delivery: ['view', 'create', 'edit'],
    events: ['view', 'create', 'edit'],
    feedback: ['view', 'respond'],
    notifications: ['view', 'create'],
    loyalty: ['view', 'create', 'edit'],
    maintenance: ['view', 'create', 'edit'],
    accounting: ['view'],
    backup: [],
    quality: ['view', 'create', 'edit'],
    suppliers: ['view', 'edit'],
    calendar: ['view', 'create', 'edit'],
    messages: ['view', 'create', 'edit'],
    pos: ['view', 'use'],
    scheduling: ['view', 'create', 'edit'],
    users: ['view'],
    gallery: ['view', 'create', 'edit']
  },

  employe: {
    // L'employé a accès aux fonctionnalités opérationnelles de base
    dashboard: ['view'],
    orders: ['view', 'create', 'edit'],
    menu: ['view'],
    reservations: ['view', 'create', 'edit'],
    customers: ['view'],
    inventory: ['view'],
    employees: ['view'],
    analytics: ['view'],
    reports: ['view'],
    settings: ['view'],
    permissions: [],
    tables: ['view', 'edit'],
    delivery: ['view'],
    events: ['view'],
    feedback: ['view'],
    notifications: ['view'],
    loyalty: ['view'],
    maintenance: ['view'],
    accounting: [],
    backup: [],
    quality: ['view'],
    suppliers: ['view'],
    calendar: ['view'],
    messages: ['view'],
    pos: ['view', 'use'],
    scheduling: ['view'],
    users: ['view'],
    gallery: ['view']
  },
  customer: {
    // Accès très limité pour les clients (interface publique)
    reservations: ['view', 'create'],
    orders: ['view', 'create'],
    menu: ['view'],
    inventory: [],
    employees: [],
    customers: [],
    analytics: [],
    maintenance: [],
    calendar: ['view'],
    messages: ['create'],
    settings: [],
    permissions: [],
    reports: [],
    backups: [],
    accounting: [],
    loyalty: ['view'],
    events: ['view'],
    promotions: ['view'],
    delivery: ['view'],
    online_orders: ['view', 'create'],
    tables: [],
    user_profile: ['view', 'edit'],
    image_management: []
  }
};

// Modules disponibles dans l'application
export const AVAILABLE_MODULES = Object.keys(DEFAULT_PERMISSIONS.directeur);

// Actions disponibles
export const AVAILABLE_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'respond', 'use'];

// Modules critiques qui nécessitent une autorisation spéciale
export const CRITICAL_MODULES = [
  'permissions',
  'backups',
  'accounting',
  'settings'
];

// Modules visibles par défaut dans la navigation
export const DEFAULT_VISIBLE_MODULES = [
  'reservations',
  'orders',
  'menu',
  'customers',
  'analytics',
  'calendar'
];