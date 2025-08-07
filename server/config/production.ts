
import helmet from 'helmet';
import compression from 'compression';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import rateLimit from 'express-rate-limit';

export const productionConfig = {
  // Sécurité avec Helmet
  security: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'",],
        styleSrc: ["'self'", "'unsafe-inline'", "https: //fonts.googleapis.com",],
        fontSrc: ["'self'", "https: //fonts.gstatic.com",],
        imgSrc: ["'self'", "data:", "https:", "blob: ",],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "ws:", "wss: ",],
        mediaSrc: ["'self'",],
        objectSrc: ["'none'",],
        childSrc: ["'self'",],
        workerSrc: ["'self'",],
        frameSrc: ["'none'",],
        formAction: ["'self'",],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      )}
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),

  // Compression
  compression: compression({
    level: 6,
    threshold: 1024,
    filter: (req: ExpressRequest, res: ExpressResponse)}) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }),

  // Rate limiting
  rateLimiter: {
    general: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limite à 1000 requêtes par fenêtre par IP
      message: {
        success: false,
        message: 'Trop de requêtes, veuillez patienter',
        retryAfter: 15 * 60
      )},
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Trop de requêtes depuis cette IP, veuillez patienter',
          retryAfter: Math.round(req.rateLimit?.resetTime / 1000}) || 900
        });
      }
    }),

    auth: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10, // Plus strict pour l'authentification
      message: {
        success: false,
        message: 'Trop de tentatives de connexion, veuillez patienter',
        retryAfter: 15 * 60
      },
      skipSuccessfulRequests: true
    }),

    api: rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 300, // 300 requêtes par minute pour les API
      message: {
        success: false,
        message: 'Limite de requêtes API atteinte',
        retryAfter: 60
      }
    })
  },

  // Optimisations performances
  performance: {
    // Keep-alive connections
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
    
    // JSON settings
    jsonLimit: '10mb',
    urlEncodedLimit: '10mb',
    
    // Trust proxy
    trustProxy: true,
    
    // Disable x-powered-by
    poweredBy: false
  },

  // CORS optimisé
  cors: {
    origin: (origin: string, callback: Function) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://replit.com',
        'https://*.replit.dev',
        'https://*.replit.app'
      ].filter(Boolean);

      if (!origin || allowedOrigins.some(allowed => 
        allowed.includes('*') ? 
        origin.match(allowed.replace('*', '.*')) : 
        origin === allowed
      )) {
        callback(null, true);
      } else {
        callback(new Error('Non autorisé par CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-*'],
    maxAge: 86400 // 24h pour les preflight
  },

  // Monitoring
  monitoring: {
    healthCheck: {
      endpoint: '/health',
      checks: {
        database: true,
        memory: true,
        diskSpace: false, // Pas nécessaire sur Replit
        uptime: true
      }
    },
    
    metrics: {
      endpoint: '/metrics',
      enabled: process.env.NODE_ENV === 'production',
      retention: 24 * 60 * 60 * 1000 // 24h
    }
  }
};
