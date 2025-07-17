
import { Request, Response, NextFunction } from 'express';

interface MetricData {
  timestamp: number;
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  memoryUsage: number;
}

class MetricsCollector {
  private metrics: MetricData[] = [];
  private readonly maxMetrics = 1000;

  addMetric(data: MetricData) {
    this.metrics.push(data);
    
    // Gardez seulement les dernières métriques
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Métriques de la dernière heure
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < oneHour);
    
    return {
      total: recentMetrics.length,
      averageResponseTime: recentMetrics.length > 0 
        ? Math.round(recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length)
        : 0,
      statusCodes: this.groupBy(recentMetrics, 'statusCode'),
      routes: this.groupBy(recentMetrics, 'route'),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  private groupBy(arr: MetricData[], key: keyof MetricData) {
    return arr.reduce((acc, item) => {
      const group = String(item[key]);
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const metricsCollector = new MetricsCollector();

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - start;
    
    metricsCollector.addMetric({
      timestamp: start,
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode,
      duration,
      memoryUsage: process.memoryUsage().heapUsed,
    });

    return originalEnd.apply(this, args);
  };

  next();
};
