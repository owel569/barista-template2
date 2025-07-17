
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip?: string;
  userId?: number;
  message: string;
  metadata?: any;
}

class Logger {
  private logDir = path.join(process.cwd(), 'logs');

  constructor() {
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry) {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.log`);
    const logLine = JSON.stringify(entry) + '\n';

    fs.appendFileSync(logFile, logLine);
  }

  info(message: string, metadata?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      metadata
    };
    
    console.log(`ℹ️ [INFO] ${message}`, metadata || '');
    this.writeLog(entry);
  }

  warn(message: string, metadata?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      metadata
    };
    
    console.warn(`⚠️ [WARN] ${message}`, metadata || '');
    this.writeLog(entry);
  }

  error(message: string, error?: any, metadata?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      metadata: { error: error?.message || error, stack: error?.stack, ...metadata }
    };
    
    console.error(`🚨 [ERROR] ${message}`, error || '');
    this.writeLog(entry);
  }

  debug(message: string, metadata?: any) {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message,
        metadata
      };
      
      console.debug(`🔍 [DEBUG] ${message}`, metadata || '');
      this.writeLog(entry);
    }
  }
}

const logger = new Logger();

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'ERROR' : 'INFO',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id,
      message: `${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`,
      metadata: {
        requestSize: req.get('content-length') || 0,
        responseSize: Buffer.byteLength(body || ''),
        referer: req.get('referer')
      }
    };

    logger.writeLog(logEntry);
    
    // Console log pour développement
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    console.log(
      `${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`
    );

    return originalSend.call(this, body);
  };

  next();
};

export { logger };
