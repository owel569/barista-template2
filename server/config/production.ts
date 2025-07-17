
export const productionConfig = {
  // Database
  database: {
    maxConnections: process.env.NODE_ENV === 'production' ? 25 : 15,
    minConnections: process.env.NODE_ENV === 'production' ? 10 : 5,
    idleTimeoutMs: 300000, // 5 minutes
    statementTimeoutMs: 30000,
    queryTimeoutMs: 25000,
    lockTimeoutMs: 15000,
  },

  // API
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requêtes par IP en prod
    },
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'https://your-domain.com']
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      maxAge: 86400, // 24h cache preflight
    },
    bodyLimit: '10mb',
    compressionLevel: 6,
  },

  // Security
  security: {
    jwt: {
      expiresIn: process.env.NODE_ENV === 'production' ? '8h' : '24h',
      algorithm: 'HS256',
    },
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
      hsts: process.env.NODE_ENV === 'production',
    },
    bcrypt: {
      saltRounds: 12,
    },
  },

  // Monitoring
  monitoring: {
    enableDetailedLogs: process.env.NODE_ENV === 'development',
    enablePerformanceMetrics: true,
    errorReporting: process.env.NODE_ENV === 'production',
    healthCheckInterval: 60000, // 1 minute
  },

  // Cache
  cache: {
    defaultTTL: 300, // 5 minutes
    maxKeys: 1000,
    enableCompression: true,
  },
};

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
