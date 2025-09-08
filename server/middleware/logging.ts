import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Types pour le logging
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  meta?: Record<string, unknown>;
  requestId?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxFileSize: number;
  maxFiles: number;
  enableRotation: boolean;
}

// Configuration par défaut
const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  logDir: './logs',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  enableRotation: true
};

// Niveaux de log avec priorités
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

// Couleurs pour la console
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Vert
  warn: '\x1b[33m',  // Jaune
  error: '\x1b[31m', // Rouge
  fatal: '\x1b[35m'  // Magenta
};

const RESET_COLOR = '\x1b[0m';

// Classe principale du logger
export class Logger {
  private config: LoggerConfig;
  private currentLogFile: string | null = null;
  private fileStream: fs.WriteStream | null = null;

  constructor(
    private module: string,
    config: Partial<LoggerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLogger();
  }

  private initializeLogger(): void {
    if (this.config.enableFile) {
      this.ensureLogDirectory();
      this.createLogFile();
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private createLogFile(): void {
    const date = new Date().toISOString().split('T')[0];
    const logFileName = `app-${date}.log`;
    const logFilePath = path.join(this.config.logDir, logFileName);

    if (this.fileStream && this.currentLogFile !== logFilePath) {
      this.fileStream.end();
    }

    if (this.currentLogFile !== logFilePath) {
      this.currentLogFile = logFilePath;
      this.fileStream = fs.createWriteStream(logFilePath, { flags: 'a' });

      this.fileStream.on('error', (error) => {
        console.error('Erreur lors de l\'écriture du log:', error);
      });
    }

    // Rotation des logs si nécessaire
    if (this.config.enableRotation) {
      this.rotateLogsIfNeeded();
    }
  }

  private rotateLogsIfNeeded(): void {
    if (!this.currentLogFile) return;

    try {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size > this.config.maxFileSize) {
        this.rotateLogs();
      }
    } catch (error) {
      // Fichier n'existe pas encore, pas de problème
    }
  }

  private rotateLogs(): void {
    if (!this.fileStream || !this.currentLogFile) return;

    this.fileStream.end();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFileName = this.currentLogFile.replace('.log', `-${timestamp}.log`);

    fs.renameSync(this.currentLogFile, rotatedFileName);

    // Supprimer les anciens fichiers
    this.cleanOldLogs();

    // Créer un nouveau fichier
    this.createLogFile();
  }

  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDir, file),
          mtime: fs.statSync(path.join(this.config.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Supprimer les fichiers en excès
      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatLogEntry(entry: LogEntry): string {
    const meta = entry.meta ? ` | ${JSON.stringify(entry.meta)}` : '';
    const requestInfo = entry.requestId ? ` [${entry.requestId}]` : '';
    const userInfo = entry.userId ? ` (User: ${entry.userId})` : '';

    return `${entry.timestamp} [${entry.level.toUpperCase()}] [${entry.module}]${requestInfo}${userInfo} - ${entry.message}${meta}`;
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const color = LOG_COLORS[entry.level];
    const formattedMessage = this.formatLogEntry(entry);
    console.log(`${color}${formattedMessage}${RESET_COLOR}`);
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.config.enableFile || !this.fileStream) return;

    const formattedMessage = this.formatLogEntry(entry);
    this.fileStream.write(formattedMessage + '\n');
  }

  private sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    Object.entries(meta).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMeta(value as Record<string, unknown>);
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...[TRUNCATED]';
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      meta: meta || {}
    };

    this.writeToConsole(entry);
    this.writeToFile(entry);

    // Rotation quotidienne
    if (this.config.enableRotation) {
      const currentDate = new Date().toISOString().split('T')[0];
      const logFileDate = this.currentLogFile?.includes(currentDate);
      if (!logFileDate) {
        this.createLogFile();
      }
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.log('fatal', message, meta);
  }

  // Méthodes de logging contextuel pour les requêtes
  logRequest(req: Request, message: string, meta?: Record<string, unknown>): void {
    const contextMeta = {
      ...meta,
      requestId: (req as any).requestId,
      userId: req.user?.id,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    };

    this.info(message, contextMeta);
  }

  logError(req: Request, error: Error, meta?: Record<string, unknown>): void {
    const contextMeta = {
      ...meta,
      requestId: (req as any).requestId,
      userId: req.user?.id,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    this.error('Request error', contextMeta);
  }

  // Nettoyage lors de la fermeture
  close(): void {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }
}

// Factory pour créer des loggers
const loggerInstances = new Map<string, Logger>();

export function createLogger(module: string, config?: Partial<LoggerConfig>): Logger {
  const key = `${module}-${JSON.stringify(config || {})}`;

  if (!loggerInstances.has(key)) {
    loggerInstances.set(key, new Logger(module, config));
  }

  return loggerInstances.get(key)!;
}

// Logger principal de l'application
export const mainLogger = createLogger('APP');

// Middleware de logging des requêtes
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Attacher l'ID de requête
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Logger de requête
  const logger = createLogger('REQUEST');

  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Intercepter la réponse
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware de logging des erreurs
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const logger = createLogger('ERROR');

  logger.logError(req, error, {
    statusCode: res.statusCode,
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(error);
};

// Nettoyage au shutdown
process.on('SIGINT', () => {
  loggerInstances.forEach(logger => logger.close());
  process.exit(0);
});

process.on('SIGTERM', () => {
  loggerInstances.forEach(logger => logger.close());
  process.exit(0);
});

// Export du logger par défaut
export default mainLogger;