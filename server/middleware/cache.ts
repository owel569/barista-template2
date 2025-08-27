import { Request, Response, NextFunction } from 'express';
import { createLogger } from './logging';

const logger = createLogger('CACHE');

// Cache simple en mémoire pour les requêtes fréquentes
type SimpleCacheEntry = { data: unknown; timestamp: number; ttl: number };
const cache = new Map<string, SimpleCacheEntry>();

// Middleware de cache pour les requêtes GET
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Seulement pour les requêtes GET
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      logger.info(`Cache hit for ${key}`);
      return res.json({
        success: true,
        data: cached.data
      });
    }

    // Intercepter la réponse pour la mettre en cache
    const originalJson: typeof res.json = res.json.bind(res);
    res.json = function(body: any) {
      // Mettre en cache seulement si la réponse est un succès
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data: body,
          timestamp: Date.now(),
          ttl: ttlSeconds
        });
        logger.info(`Cached response for ${key} (TTL: ${ttlSeconds}s)`);
      }
      return originalJson(body);
    };

    next();
  };
};

// Invalidation du cache pour des patterns spécifiques
export const invalidateCache = (pattern: string) => {
  let deleted = 0;
  for (const [key] of cache) {
    if (key.includes(pattern)) {
      cache.delete(key);
      deleted++;
    }
  }
  logger.info(`Invalidated ${deleted} cache entries for pattern: ${pattern}`);
};

// Nettoyage périodique du cache
export const cleanupCache = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of cache) {
    if (now - value.timestamp > value.ttl * 1000) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired cache entries`);
  }
};

// Nettoyage automatique toutes les 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);