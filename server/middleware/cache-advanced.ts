import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { createLogger } from './logging';

const logger = createLogger('CACHE_ADVANCED');

// Interface pour les entrées de cache
interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
  ttl: number;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

// Configuration du cache
interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

// Interface pour les options de middleware de cache
interface CacheMiddlewareOptions {
  ttl?: number;
  tags?: string[];
  condition?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  skipMethods?: string[];
}

// Interface pour les métriques du cache
interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  cleanups: number;
}

// Classe de gestion du cache en mémoire optimisée
class AdvancedCache {
  private cache = new Map<string, CacheEntry>();
  private readonly config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    cleanups: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      maxSize: config.maxSize || 1000,
      cleanupInterval: config.cleanupInterval || 60 * 1000 // 1 minute
    };

    this.startCleanupTimer();

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Démarre le timer de nettoyage automatique
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      cleanup();
    }, this.config.cleanupInterval) as NodeJS.Timeout;
  }

  /**
   * Génère une clé de cache sécurisée
   */
  generateKey(req: Request): string {
    const keyData = {
      method: req.method,
      url: req.url,
      query: req.query,
      user: (req as any).user?.id || 'anonymous',
      timestamp: Math.floor(Date.now() / (5 * 60 * 1000)) // Groupe par 5 minutes
    };

    return createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Obtient une entrée du cache
   */
  get(key: string): Record<string, unknown> | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.metrics.hits++;

    logger.debug('Cache hit', { key, accessCount: entry.accessCount });
    return entry.data;
  }

  /**
   * Stocke une entrée dans le cache
   */
  set(key: string, data: Record<string, unknown>, ttl?: number, tags: string[] = []): void {
    try {
      // Vérifier la taille du cache
      if (this.cache.size >= this.config.maxSize) {
        this.evictLeastUsed();
      }

      const entry: CacheEntry = {
        data: JSON.parse(JSON.stringify(data)), // Deep clone pour éviter les mutations
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        tags: [...tags],
        accessCount: 0,
        lastAccessed: Date.now()
      };

      this.cache.set(key, entry);

      logger.debug('Cache set', { 
        key, 
        ttl: entry.ttl, 
        tags: entry.tags,
        cacheSize: this.cache.size 
      });

    } catch (error) {
      logger.error('Erreur lors de la mise en cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
    }
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  /**
   * Invalide le cache par tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidatedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      logger.info('Cache invalidated by tags', { 
        tags, 
        invalidatedCount 
      });
    }

    return invalidatedCount;
  }

  /**
   * Invalide le cache par pattern regex
   */
  invalidateByPattern(pattern: RegExp): number {
    let invalidatedCount = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      logger.info('Cache invalidated by pattern', { 
        pattern: pattern.toString(), 
        invalidatedCount 
      });
    }

    return invalidatedCount;
  }

  /**
   * Nettoie les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    this.metrics.cleanups++;

    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', { 
        cleanedCount, 
        remainingSize: this.cache.size 
      });
    }
  }

  /**
   * Éviction des entrées les moins utilisées (LRU)
   */
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score basé sur la fréquence d'accès et la récence
      const ageScore = (Date.now() - entry.lastAccessed) / 1000; // secondes
      const frequencyScore = entry.accessCount > 0 ? 1 / entry.accessCount : 100;
      const totalScore = ageScore * frequencyScore;

      if (totalScore < leastScore) {
        leastScore = totalScore;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.metrics.evictions++;

      logger.debug('Cache entry evicted', { 
        key: leastUsedKey, 
        score: leastScore 
      });
    }
  }

  /**
   * Obtient les statistiques complètes du cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
    averageAccessCount: number;
    metrics: CacheMetrics;
  } {
    const totalAccesses = this.metrics.hits + this.metrics.misses;
    const hitRate = totalAccesses > 0 ? (this.metrics.hits / totalAccesses) * 100 : 0;

    const totalAccessCount = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);

    const averageAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      totalAccesses,
      averageAccessCount: Math.round(averageAccessCount * 100) / 100,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();

    // Reset metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      cleanups: 0
    };

    logger.info('Cache cleared completely', { previousSize });
  }

  /**
   * Arrêt propre du cache
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
    logger.info('Cache shutdown completed');
  }
}

// Instance globale du cache
const cache = new AdvancedCache();

// Middleware de cache principal avec options avancées
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Vérifications préliminaires
    if (options.skipCache?.(req)) {
      return next();
    }

    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Ignorer certaines méthodes HTTP
    const skipMethods = options.skipMethods || ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (skipMethods.includes(req.method)) {
      return next();
    }

    // Générer la clé de cache
    const cacheKey = options.keyGenerator ? 
      options.keyGenerator(req) : 
      cache.generateKey(req);

    // Essayer de récupérer depuis le cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      res.setHeader('X-Cache-TTL', options.ttl?.toString() || '300');
      res.json(cachedData);
      return;
    }

    // Cache miss
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);

    // Intercepter la réponse pour la mettre en cache
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Mettre en cache seulement les réponses réussies
      if (res.statusCode >= 200 && res.statusCode < 300 && data) {
        try {
          cache.set(cacheKey, data as Record<string, unknown>, options.ttl, options.tags || []);
          res.setHeader('X-Cache-Stored', 'true');
        } catch (error) {
          logger.error('Erreur stockage cache', { 
            cacheKey, 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
          });
        }
      }
      return originalJson(data);
    };

    next();
  };
};

// Middlewares spécialisés pour différents types de contenu
export const menuCacheMiddleware = cacheMiddleware({
  ttl: 10 * 60 * 1000, // 10 minutes
  tags: ['menu', 'categories'],
  condition: (req) => req.method === 'GET' && req.path.includes('/api/menu')
});

export const statsCacheMiddleware = cacheMiddleware({
  ttl: 2 * 60 * 1000, // 2 minutes
  tags: ['stats', 'analytics', 'dashboard'],
  condition: (req) => req.method === 'GET' && req.path.includes('/api/analytics')
});

export const usersCacheMiddleware = cacheMiddleware({
  ttl: 15 * 60 * 1000, // 15 minutes
  tags: ['users', 'employees', 'profiles'],
  condition: (req) => req.method === 'GET' && req.path.includes('/api/users')
});

export const ordersCacheMiddleware = cacheMiddleware({
  ttl: 30 * 1000, // 30 secondes pour les commandes (données très dynamiques)
  tags: ['orders', 'realtime'],
  condition: (req) => req.method === 'GET' && req.path.includes('/api/orders')
});

// Middleware d'invalidation intelligente
export const invalidateCache = (tags: string[] = [], patterns: RegExp[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function(data: any) {
      // Invalider seulement après une modification réussie
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let totalInvalidated = 0;

        // Invalidation par tags
        if (tags.length > 0) {
          totalInvalidated += cache.invalidateByTags(tags);
        }

        // Invalidation par patterns
        patterns.forEach(pattern => {
          totalInvalidated += cache.invalidateByPattern(pattern);
        });

        if (totalInvalidated > 0) {
          res.setHeader('X-Cache-Invalidated', totalInvalidated.toString());
          res.setHeader('X-Cache-Invalidated-Tags', tags.join(','));
        }
      }

      return originalJson(data);
    };

    next();
  };
};

// Routes d'administration du cache
export const getCacheStats = (req: Request, res: Response): void => {
  try {
    const stats = cache.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erreur récupération stats cache', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques du cache'
    });
  }
};

export const clearCache = (req: Request, res: Response): Response<any> | void => {
  try {
    const statsBefore = cache.getStats();
    cache.clear();

    logger.info('Cache vidé manuellement', { 
      previousSize: statsBefore.size,
      user: (req as any).user?.id 
    });

    res.json({
      success: true,
      message: 'Cache vidé avec succès',
      previousStats: statsBefore
    });
  } catch (error) {
    logger.error('Erreur vidage cache', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du cache'
    });
  }
};

export const invalidateCacheByTags = (req: Request, res: Response): void => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      res.status(400).json({
        success: false,
        message: 'Tags requis et doit être un tableau'
      });
    }

    const invalidatedCount = cache.invalidateByTags(tags);

    logger.info('Cache invalidé par tags', { 
      tags, 
      invalidatedCount, 
      user: (req as any).user?.id 
    });

    res.json({
      success: true,
      message: `${invalidatedCount} entrées invalidées`,
      invalidatedCount,
      tags
    });
  } catch (error) {
    logger.error('Erreur invalidation cache par tags', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'invalidation du cache'
    });
  }
};

// Export de l'instance de cache pour usage direct
export { cache as cacheInstance };
export default cache;