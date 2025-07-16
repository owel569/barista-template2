
import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  };

  constructor(private maxSize = 1000, private defaultTtl = 300000) {
    // Nettoyage automatique toutes les 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  generateKey(req: Request): string {
    const { method, originalUrl, user } = req;
    const userId = (user as any)?.id || 'anonymous';
    return `${method}:${originalUrl}:${userId}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    // Éviction LRU si nécessaire
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      hits: 0
    });

    this.stats.sets++;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache nettoyé: ${cleaned} entrées supprimées`);
    }
  }

  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

const cache = new AdvancedCache();

export const advancedCacheMiddleware = (ttl?: number, condition?: (req: Request) => boolean) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifier la condition si fournie
    if (condition && !condition(req)) {
      return next();
    }

    // Ne pas cacher les requêtes non-GET
    if (req.method !== 'GET') {
      return next();
    }

    const key = cache.generateKey(req);
    const cached = cache.get(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', key);
      return res.json(cached);
    }

    // Intercepter la réponse
    const originalJson = res.json;
    res.json = function(data: any) {
      // Mettre en cache seulement les réponses 200
      if (res.statusCode === 200) {
        cache.set(key, data, ttl);
      }
      
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', key);
      return originalJson.call(this, data);
    };

    next();
  };
};

export const invalidateCache = (pattern: string) => {
  return cache.invalidatePattern(pattern);
};

export const getCacheStats = () => {
  return cache.getStats();
};
