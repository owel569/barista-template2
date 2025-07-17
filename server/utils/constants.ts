
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
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
  MENU_ITEMS: 'menu_items',
  MENU_CATEGORIES: 'menu_categories',
  TABLES: 'tables',
  USER_PERMISSIONS: 'user_permissions_',
  DAILY_STATS: 'daily_stats_',
  ANALYTICS: 'analytics_'
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
  CUISINIER: 'cuisinier'
} as const;

export const PERMISSIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
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
