
import { Request, Response, NextFunction } from 'express';

/**
 * Enum pour l’état de santé du système
 */
export enum SystemHealth {''
  EXCELLENT = '''excellent',''
  GOOD = '''good',''
  WARNING = '''warning',''
  CRITICAL = '''critical'
}

/**
 * Interface pour la persistance des métriques
 */
export interface MetricsStorage {
  save(metrics: Metrics): Promise<void>;
  load(): Promise<Metrics>;
  }

/**
 * Listener pour observer les seuils critiques
 */
export type MetricListener = (metricName: string, value: number) => void;

/**
 * Typage strict des métriques
 */
export interface Metrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    byStatus: Record<number, number>;
    byMethod: Record<string, number>;
    byRoute: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    responseTimeHistory: number[];
  };
  database: {
    queries: number;
    slowQueries: number;
    errors: number;
    averageQueryTime: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  uptime: number;
  lastReset: string;
}

/**
 * Collecteur de métriques extensible avec support observer et persistance
 */
export class MetricsCollector {
  private metrics!: Metrics;
  private startTime: number;
  private listeners: MetricListener[] = [];
  private storage: MetricsStorage | null = null;

  constructor(storage?: MetricsStorage) {
    this.startTime = Date.now();
    this.resetMetrics();
    if (storage) this.storage = storage;
  }

  /**
   * Réinitialise toutes les métriques
   */
  private resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byStatus: {},
        byMethod: {},
        byRoute: {}
      },
      performance: {
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimeHistory: []
      },
      database: {
        queries: 0,
        slowQueries: 0,
        errors: 0,
        averageQueryTime: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      uptime: 0,
      lastReset: new Date().toISOString()
    };
  }

  /**
   * Ajoute un listener pour les seuils critiques
   */
  onThreshold(listener: MetricListener) {
    this.listeners.push(listener);
  }

  /**
   * Notifie tous les listeners
   */
  private notify(metricName: string, value: number) {
    this.listeners.forEach(listener => listener(metricName, value));
  }

  /**
   * Enregistre une requête HTTP
   */
  recordRequest(method: string, route: string, statusCode: number, responseTime: number) {
    this.metrics.requests.total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byRoute[route] = (this.metrics.requests.byRoute[route] || 0) + 1;
    // Performance
    this.metrics.performance.responseTimeHistory.push(responseTime);
    if (this.metrics.performance.responseTimeHistory.length > 1000) {
      this.metrics.performance.responseTimeHistory.shift();
    }
    this.metrics.performance.minResponseTime = Math.min(this.metrics.performance.minResponseTime, responseTime);
    this.metrics.performance.maxResponseTime = Math.max(this.metrics.performance.maxResponseTime, responseTime);
    const sum = this.metrics.performance.responseTimeHistory.reduce((a, b) => a + b, 0);
    this.metrics.performance.averageResponseTime = sum / this.metrics.performance.responseTimeHistory.length;
    // Notifier si seuil dépassé
    this.checkThresholds();
  }

  /**
   * Enregistre une requête DB
   */
  recordDatabaseQuery(queryTime: number, isError: boolean = false) {
    this.metrics.database.queries++;
    if (isError) this.metrics.database.errors++;
    if (queryTime > 1000) this.metrics.database.slowQueries++;
    // Moyenne mobile
    const currentAvg = this.metrics.database.averageQueryTime;
    const count = this.metrics.database.queries;
    this.metrics.database.averageQueryTime = (currentAvg * (count - 1) + queryTime) / count;
  }

  /**
   * Met à jour les métriques mémoire
   */
  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100
    };
  }

  /**
   * Retourne les métriques + santé
   */
  getMetrics(): Metrics & { health: SystemHealth } {
    this.updateMemoryMetrics();
    this.metrics.uptime = Math.round((Date.now() - this.startTime) / 1000);
    // Calcul santé
    const errorRate = this.metrics.requests.total > 0 
      ? this.metrics.requests.errors / this.metrics.requests.total 
      : 0;
    const avgResponseTime = this.metrics.performance.averageResponseTime;
    const memoryUsage = this.metrics.memory.heapUsed / (this.metrics.memory.heapTotal || 1);
    let health: SystemHealth = SystemHealth.EXCELLENT;
    if (errorRate > 0.1 || avgResponseTime > 2000 || memoryUsage > 0.9) {
      health = SystemHealth.CRITICAL;
    } else if (errorRate > 0.05 || avgResponseTime > 1000 || memoryUsage > 0.7) {
      health = SystemHealth.WARNING;
    } else if (errorRate > 0.01 || avgResponseTime > 500 || memoryUsage > 0.5) {
      health = SystemHealth.GOOD;
    }
    return { ...this.metrics, health };
  }

  /**
   * Vérifie les seuils critiques et notifie si besoin
   */
  checkThresholds() {
    const { averageResponseTime } = this.metrics.performance;
    if (averageResponseTime > 2000) {''
      this.notify('''averageResponseTime', averageResponseTime);
    }''
    // Ajoute d'''autres seuils si besoin
  }

  /**
   * Persiste les métriques si storage défini
   */
  async saveMetrics(): Promise<void> {
    if (this.storage) {
      await this.storage.save(this.metrics);
    }
  }

  /**
   * Charge les métriques depuis le storage
   */
  async loadMetrics(): Promise<void> {
    if (this.storage) {
      const loadedMetrics = await this.storage.load();
      this.metrics = loadedMetrics;
    }
  }

  /**
   * Pour compatibilité avec l’ancien collect()
   */
  collect(data: {
    timestamp: number;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userId?: string;
  }) {
    this.recordRequest(data.method, data.endpoint, data.statusCode, data.responseTime);
  }

  /**
   * Réinitialise tout
   */
  reset() {
    this.resetMetrics();
    this.startTime = Date.now();
  }
}

// Singleton par défaut (en mémoire)
export const metricsCollector = new MetricsCollector();

/**
 * Middleware Express pour collecter les métriques
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const originalSend = res.send;
  res.send = function (body?: unknown): Response {
    const responseTime = Date.now() - startTime;
    const route = req.route?.path || req.path;
    metricsCollector.collect({
      timestamp: Date.now(),
      endpoint: route,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      userId: (req as any).user?.id
    });
    return originalSend.call(this, body);
  };
  next();
};
''