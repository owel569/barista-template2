
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'respond' | 'use';
export type Role = 'directeur' | 'employe';

export type PermissionsMap = Record<string, PermissionAction[]>;

export const ALL_ACCESS_ROLES: Role[] = ['directeur'];

export const DEFAULT_PERMISSIONS: Record<Role, PermissionsMap> = {
  directeur: {
    // Administration et gestion
    dashboard: ['view', 'edit'],
    statistics: ['view', 'edit'],
    settings: ['view', 'edit'],
    permissions: ['view', 'edit'],
    backup: ['view', 'edit', 'create'],
    
    // Menu et commandes
    menu: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    
    // Clients et réservations
    customers: ['view', 'create', 'edit', 'delete'],
    reservations: ['view', 'create', 'edit', 'delete'],
    
    // Personnel
    employees: ['view', 'create', 'edit', 'delete'],
    schedule: ['view', 'create', 'edit', 'delete'],
    
    // Communication
    messages: ['view', 'respond', 'delete'],
    notifications: ['view', 'create', 'edit'],
    
    // Fonctionnalités avancées
    tables: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'create', 'edit'],
    analytics: ['view', 'create', 'edit'],
    promotions: ['view', 'create', 'edit', 'delete'],
    loyalty: ['view', 'create', 'edit', 'delete'],
    calendar: ['view', 'create', 'edit', 'delete'],
    suppliers: ['view', 'create', 'edit', 'delete'],
    maintenance: ['view', 'create', 'edit', 'delete'],
    delivery: ['view', 'create', 'edit', 'delete'],
    accounting: ['view', 'create', 'edit'],
    quality: ['view', 'create', 'edit'],
    pos: ['view', 'use']
  },
  
  employe: {
    // Consultation de base
    dashboard: ['view'],
    statistics: ['view'],
    
    // Menu (consultation uniquement)
    menu: ['view'],
    
    // Commandes et réservations
    orders: ['view', 'create', 'edit'],
    reservations: ['view', 'create', 'edit'],
    customers: ['view', 'create'],
    
    // Gestion des tables
    tables: ['view', 'edit'],
    
    // Communication
    messages: ['view', 'respond'],
    notifications: ['view'],
    
    // Fonctionnalités limitées
    inventory: ['view'],
    calendar: ['view'],
    pos: ['view', 'use'],
    delivery: ['view', 'edit']
  }
};
