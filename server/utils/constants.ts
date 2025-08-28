export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const API_MESSAGES = {
  SUCCESS: 'Opération réussie',
  CREATED: 'Ressource créée avec succès',
  UPDATED: 'Ressource mise à jour avec succès',
  DELETED: 'Ressource supprimée avec succès',
  NOT_FOUND: 'Ressource non trouvée',
  UNAUTHORIZED: 'Authentification requise',
  FORBIDDEN: 'Permissions insuffisantes',
  VALIDATION_ERROR: 'Données de requête invalides',
  INTERNAL_ERROR: 'Erreur interne du serveur',
  DATABASE_ERROR: 'Erreur de base de données',
  RATE_LIMIT: 'Trop de requêtes, veuillez patienter'
} as const;

export const CACHE_KEYS = {
  MENU_ITEMS: 'menu:items',
  INVENTORY: 'inventory:list',
  ORDERS: 'orders:list',
  USERS: 'users:list',
  STATS: 'stats:dashboard',
  ANALYTICS: 'analytics:data'
} as const;

export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_PATTERN: /^\+?[\d\s\-()]+$/,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
} as const;

export const ROLES = {
  ADMIN: 'admin',
  DIRECTEUR: 'directeur',
  MANAGER: 'manager',
  EMPLOYE: 'employe',
  SERVEUR: 'serveur',
  CUISINIER: 'cuisinier',
  CUSTOMER: 'customer',
  WAITER: 'waiter',
  CHEF: 'chef'
} as const;

export const PERMISSIONS = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  USER: 'user',
  CUSTOMER: 'customer'
} as const;

export const MODULES = {
  USERS: 'users',
  MENU: 'menu',
  ORDERS: 'orders',
  RESERVATIONS: 'reservations',
  ANALYTICS: 'analytics',
  INVENTORY: 'inventory',
  EMPLOYEES: 'employees',
  CUSTOMERS: 'customers',
  SETTINGS: 'settings'
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];