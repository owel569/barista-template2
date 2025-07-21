
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

// Interface pour les entrées de cache
interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
  ttl: number;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

// Classe de gestion du cache en mémoire
class AdvancedCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 1000;
  private readonly cleanupInterval = 60 * 1000; // 1 minute

  constructor() {
    // Nettoyage automatique du cache
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  // Générer une clé de cache
  private generateKey(req: Request): string {
    const keyData = {
      method: req.method,
      url: req.url,
      query: req.query,
      user: req.user?.id || 'anonymous'
    };
    return createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  // Obtenir une entrée du cache
  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  // Stocker une entrée dans le cache
  set(key: string, data: Record<string, unknown>, ttl: number = this.defaultTTL, tags: string[] = []): void {
    // Vérifier la taille du cache
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  // Supprimer une entrée du cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Invalider le cache par tags
  invalidateByTags(tags: string[]): number {
    let invalidatedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    return invalidatedCount;
  }

  // Invalider le cache par pattern
  invalidateByPattern(pattern: RegExp): number {
    let invalidatedCount = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    return invalidatedCount;
  }

  // Nettoyer les entrées expirées
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Éviction des entrées les moins utilisées
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastUsedCount || 
          (entry.accessCount === leastUsedCount && entry.lastAccessed < oldestAccess)) {
        leastUsedKey = key;
        leastUsedCount = entry.accessCount;
        oldestAccess = entry.lastAccessed;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  // Obtenir les statistiques du cache
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
    averageAccessCount: number;
  } {
    const totalAccesses = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    const averageAccessCount = this.cache.size > 0 ? totalAccesses / this.cache.size : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Calculé dynamiquement par le middleware
      totalAccesses,
      averageAccessCount
    };
  }

  // Vider le cache
  clear(): void {
    this.cache.clear();
  }
}

// Instance globale du cache
const cache = new AdvancedCache();

// Statistiques des hits/misses
let cacheHits = 0;
let cacheMisses = 0;

// Middleware de cache principal
export const cacheMiddleware = (options: {
  ttl?: number;
  tags?: string[];
  condition?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
} = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si le cache doit être ignoré
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    // Vérifier la condition
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Générer la clé de cache
    const cacheKey = options.keyGenerator ? options.keyGenerator(req) : cache['generateKey'](req);

    // Essayer de récupérer depuis le cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      cacheHits++;
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.json(cachedData);
    }

    cacheMisses++;
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);

    // Intercepter la réponse pour la mettre en cache
    const originalSend = res.json;
    res.json = function(data: Record<string, unknown>) {
      // Mettre en cache seulement les réponses réussies
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, options.ttl, options.tags || []);
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

// Middleware spécialisé pour le cache du menu
export const menuCacheMiddleware = cacheMiddleware({
  ttl: 10 * 60 * 1000, // 10 minutes
  tags: ['menu', 'categories'],
  condition: (req) => req.method === 'GET'
});

// Middleware spécialisé pour le cache des statistiques
export const statsCacheMiddleware = cacheMiddleware({
  ttl: 2 * 60 * 1000, // 2 minutes
  tags: ['stats', 'dashboard'],
  condition: (req) => req.method === 'GET'
});

// Middleware spécialisé pour le cache des utilisateurs
export const usersCacheMiddleware = cacheMiddleware({
  ttl: 15 * 60 * 1000, // 15 minutes
  tags: ['users', 'employees'],
  condition: (req) => req.method === 'GET'
});

// Middleware d'invalidation du cache
export const invalidateCache = (tags: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Invalider le cache après une modification réussie
    const originalSend = res.json;
    res.json = function(data: Record<string, unknown>) {
      if (res.statusCode >= 200 && res.statusCode < 300 && tags.length > 0) {
        const invalidatedCount = cache.invalidateByTags(tags);
        res.setHeader('X-Cache-Invalidated', invalidatedCount.toString());
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

// Route pour obtenir les statistiques du cache
export const getCacheStats = (req: Request, res: Response) => {
  const stats = cache.getStats();
  const totalRequests = cacheHits + cacheMisses;
  
  res.json({
    success: true,
    stats: {
      ...stats,
      hitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      hits: cacheHits,
      misses: cacheMisses,
      totalRequests
    }
  });
};

// Route pour vider le cache
export const clearCache = (req: Request, res: Response) => {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  
  res.json({
    success: true,
    message: 'Cache vidé avec succès'
  });
};

// Route pour invalider le cache par tags
export const invalidateCacheByTags = (req: Request, res: Response) => {
  const { tags } = req.body;
  if (!tags || !Array.isArray(tags)) {
    return res.status(400).json({
      success: false,
      message: 'Tags requis et doit être un tableau'
    });
  }

  const invalidatedCount = cache.invalidateByTags(tags);
  
  res.json({
    success: true,
    message: `${invalidatedCount} entrées invalidées`,
    invalidatedCount
  });
};

export default cache;
