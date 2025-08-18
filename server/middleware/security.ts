import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Schémas de validation pour la sécurité
const LoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const OrderSchema = z.object({
  customerName: z.string().min(1).max(100),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive().max(10)
  })).min(1).max(20),
  notes: z.string().max(500).optional(),
});

// Middleware de validation
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: 'Erreur de validation'
      });
      return;
    }
  };
};

// Middleware de limitation du taux de requêtes (rate limiting)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (clientData.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
      return;
    }
    
    clientData.count++;
    next();
  };
};

// Middleware de validation des rôles avec hiérarchie
export const requireRoleHierarchy = (minRole: string) => {
  const roleHierarchy = {
    'client': 0,
    'employee': 1,
    'manager': 2,
    'admin': 3,
    'superadmin': 4
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
      return;
    }

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({
        success: false,
        message: `Accès refusé. Niveau ${minRole} ou supérieur requis.`
      });
      return;
    }

    next();
  };
};

// Middleware de nettoyage des données d'entrée
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Nettoyer les chaînes de caractères dans req.body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Enlever les balises HTML et les caractères dangereux
    return obj
      .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
      .replace(/[<>&"']/g, '') // Supprimer les caractères dangereux
      .trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Export des schémas pour réutilisation
export { LoginSchema, RegisterSchema, OrderSchema };