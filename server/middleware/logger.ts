
import { Request, Response, NextFunction } from 'express';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  userId?: number;
  message: string;
  metadata?: any;
}

class Logger {
  private log(level: LogLevel, message: string, metadata?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(metadata && { metadata })
    };

    const logMessage = `[${entry.level}] ${entry.timestamp} - ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, metadata);
        break;
      case 'WARN':
        console.warn(logMessage, metadata);
        break;
      case 'INFO':
        console.info(logMessage, metadata);
        break;
      case 'DEBUG':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage, metadata);
        }
        break;
    }
  }

  error(message: string, metadata?: any) {
    this.log('ERROR', message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log('WARN', message, metadata);
  }

  info(message: string, metadata?: any) {
    this.log('INFO', message, metadata);
  }

  debug(message: string, metadata?: any) {
    this.log('DEBUG', message, metadata);
  }
}

export const logger = new Logger();

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log de la requête entrante
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentLength: req.get('content-length')
  });

  // Override de res.end pour capturer la durée
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - start;
    
    // Log de la réponse
    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
        status: res.statusCode,
        duration,
        ip: req.ip
      });
    } else {
      logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
        status: res.statusCode,
        duration,
        ip: req.ip
      });
    }

    return originalEnd.apply(this, args);
  };

  next();
};

export const dbLogger = {
  connection: () => logger.debug('🔗 Nouvelle connexion DB établie'),
  query: (query: string, duration: number) => 
    logger.debug(`📊 Requête DB (${duration}ms)`, { query: query.substring(0, 100) }),
  error: (error: any) => logger.error('❌ Erreur DB', error),
  poolStatus: (active: number, idle: number) => 
    logger.debug(`🏊 Pool DB: ${active} actives, ${idle} inactives`)
};
