
// Configuration centralisée de l'application
export const APP_CONFIG = {
  // Application
  APP_NAME: 'Barista Café',
  APP_VERSION: '1.0.0',
  
  // API
  API_BASE_URL: process.env.VITE_API_URL || '/api',
  API_TIMEOUT: 10000,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache
  CACHE_TTL: 300000, // 5 minutes
  
  // WebSocket
  WS_RECONNECT_INTERVAL: 5000,
  WS_MAX_RETRIES: 5,
  
  // Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Business
  RESTAURANT: {
    NAME: 'Barista Café',
    ADDRESS: '123 Rue du Café, Casablanca, Maroc',
    PHONE: '+212 522 123 456',
    EMAIL: 'contact@barista-cafe.ma',
    OPENING_HOURS: {
      MONDAY: { open: '08:00', close: '23:00' },
      TUESDAY: { open: '08:00', close: '23:00' },
      WEDNESDAY: { open: '08:00', close: '23:00' },
      THURSDAY: { open: '08:00', close: '23:00' },
      FRIDAY: { open: '08:00', close: '23:00' },
      SATURDAY: { open: '08:00', close: '23:00' },
      SUNDAY: { open: '08:00', close: '23:00' }
    }
  }
} as const;

export const ROUTES = {
  // Public routes
  HOME: '/',
  MENU: '/menu',
  RESERVATION: '/reservation',
  CONTACT: '/contact',
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Dashboard routes
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  
  // API routes
  API: {
    AUTH: '/api/auth',
    USERS: '/api/users',
    MENU: '/api/menu',
    ORDERS: '/api/orders',
    ANALYTICS: '/api/analytics',
    DASHBOARD: '/api/dashboard'
  }
} as const;
