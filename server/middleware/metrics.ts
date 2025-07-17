
import { Request, Response, NextFunction } from 'express';

interface Metrics {
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

class MetricsCollector {
  private metrics: Metrics;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.resetMetrics();
  }

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

  recordRequest(method: string, route: string, statusCode: number, responseTime: number) {
    this.metrics.requests.total++;
    
    // Status
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
  }

  recordDatabaseQuery(queryTime: number, isError: boolean = false) {
    this.metrics.database.queries++;
    
    if (isError) {
      this.metrics.database.errors++;
    }

    if (queryTime > 1000) { // Requêtes lentes > 1s
      this.metrics.database.slowQueries++;
    }

    // Moyenne mobile des temps de requête
    const currentAvg = this.metrics.database.averageQueryTime;
    const count = this.metrics.database.queries;
    this.metrics.database.averageQueryTime = (currentAvg * (count - 1) + queryTime) / count;
  }

  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100
    };
  }

  getMetrics(): Metrics & { health: string } {
    this.updateMemoryMetrics();
    this.metrics.uptime = Math.round((Date.now() - this.startTime) / 1000);

    // Calcul de la santé du système
    const errorRate = this.metrics.requests.total > 0 
      ? this.metrics.requests.errors / this.metrics.requests.total 
      : 0;
    
    const avgResponseTime = this.metrics.performance.averageResponseTime;
    const memoryUsage = this.metrics.memory.heapUsed / this.metrics.memory.heapTotal;

    let health = 'excellent';
    if (errorRate > 0.1 || avgResponseTime > 2000 || memoryUsage > 0.9) {
      health = 'critical';
    } else if (errorRate > 0.05 || avgResponseTime > 1000 || memoryUsage > 0.7) {
      health = 'warning';
    } else if (errorRate > 0.01 || avgResponseTime > 500 || memoryUsage > 0.5) {
      health = 'good';
    }

    return { ...this.metrics, health };
  }

  reset() {
    this.resetMetrics();
    this.startTime = Date.now();
  }
}

const metricsCollector = new MetricsCollector();

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    const route = req.route?.path || req.path;
    
    metricsCollector.recordRequest(req.method, route, res.statusCode, responseTime);
    
    return originalSend.call(this, body);
  };

  next();
};

export { metricsCollector };
