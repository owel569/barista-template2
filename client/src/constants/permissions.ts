// Types pour une meilleure sécurité de type
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'respond' | 'use';
// Rôles unifiés pour Barista Café (4-role system)
export type Role = 'directeur' | 'gerant' | 'employe' | 'customer';

export type PermissionsMap = Record<string, PermissionAction[]>;

// Rôles avec accès complet
export const ALL_ACCESS_ROLES: Role[] = ['directeur'];

// Permissions par défaut pour chaque rôle (4-role system)
export const DEFAULT_PERMISSIONS: Record<Role, PermissionsMap> = {
  directeur: {
    // Accès complet à tout
    reservations: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    menu: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    employees: ['view', 'create', 'edit', 'delete'],
    customers: ['view', 'create', 'edit', 'delete'],
    analytics: ['view', 'create', 'edit', 'delete'],
    maintenance: ['view', 'create', 'edit', 'delete'],
    calendar: ['view', 'create', 'edit', 'delete'],
    messages: ['view', 'create', 'edit', 'delete', 'respond'],
    settings: ['view', 'create', 'edit', 'delete'],
    permissions: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'create', 'edit', 'delete'],
    backups: ['view', 'create', 'edit', 'delete'],
    accounting: ['view', 'create', 'edit', 'delete'],
    loyalty: ['view', 'create', 'edit', 'delete'],
    events: ['view', 'create', 'edit', 'delete'],
    promotions: ['view', 'create', 'edit', 'delete'],
    delivery: ['view', 'create', 'edit', 'delete'],
    online_orders: ['view', 'create', 'edit', 'delete'],
    tables: ['view', 'create', 'edit', 'delete'],
    user_profile: ['view', 'edit'],
    image_management: ['view', 'create', 'edit', 'delete']
  },
  gerant: {
    // Accès intermédiaire pour les gérants
    reservations: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    menu: ['view', 'create', 'edit'],
    inventory: ['view', 'create', 'edit'],
    employees: ['view', 'create', 'edit'],
    customers: ['view', 'create', 'edit', 'delete'],
    analytics: ['view', 'create'],
    maintenance: ['view', 'create', 'edit'],
    calendar: ['view', 'create', 'edit', 'delete'],
    messages: ['view', 'create', 'edit', 'respond'],
    settings: ['view', 'edit'],
    permissions: ['view'],
    reports: ['view', 'create'],
    backups: ['view'],
    accounting: ['view', 'create'],
    loyalty: ['view', 'create', 'edit'],
    events: ['view', 'create', 'edit'],
    promotions: ['view', 'create', 'edit'],
    delivery: ['view', 'create', 'edit', 'delete'],
    online_orders: ['view', 'create', 'edit', 'delete'],
    tables: ['view', 'create', 'edit'],
    user_profile: ['view', 'edit'],
    image_management: ['view', 'create', 'edit']
  },
  employe: {
    // Accès limité pour les employés
    reservations: ['view', 'create', 'edit'],
    orders: ['view', 'create', 'edit'],
    menu: ['view',],
    inventory: ['view',],
    employees: ['view',],
    customers: ['view', 'create', 'edit'],
    analytics: ['view',],
    maintenance: ['view',],
    calendar: ['view',],
    messages: ['view', 'create', 'respond'],
    settings: ['view',],
    permissions: [],
    reports: ['view',],
    backups: [],
    accounting: [],
    loyalty: ['view',],
    events: ['view',],
    promotions: ['view',],
    delivery: ['view', 'create', 'edit'],
    online_orders: ['view', 'create', 'edit'],
    tables: ['view',],
    user_profile: ['view', 'edit'],
    image_management: ['view']
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