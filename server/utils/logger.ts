
import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logDir: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 5;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const baseLog = `[${entry.timestamp}] ${entry.level}: ${entry.message}`;
    
    if (entry.context || entry.requestId || entry.userId) {
      const metadata = {
        ...(entry.requestId && { requestId: entry.requestId }),
        ...(entry.userId && { userId: entry.userId }),
        ...(entry.ip && { ip: entry.ip }),
        ...(entry.userAgent && { userAgent: entry.userAgent }),
        ...(entry.context && { context: entry.context })
      };
      return `${baseLog} | ${JSON.stringify(metadata)}`;
    }
    
    return baseLog;
  }

  private writeToFile(level: LogLevel, entry: LogEntry): void {
    if (process.env.NODE_ENV === 'test') return;

    const filename = `${level.toLowerCase()}.log`;
    const filepath = path.join(this.logDir, filename);
    const logLine = this.formatLogEntry(entry) + '\n';

    try {
      // Vérifier la taille du fichier et faire une rotation si nécessaire
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(filepath);
        }
      }

      fs.appendFileSync(filepath, logLine);
    } catch (error) {
      console.error('Erreur écriture log:', error);
    }
  }

  private rotateLogFile(filepath: string): void {
    const dir = path.dirname(filepath);
    const ext = path.extname(filepath);
    const basename = path.basename(filepath, ext);

    // Décaler les fichiers existants
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldFile = path.join(dir, `${basename}.${i}${ext}`);
      const newFile = path.join(dir, `${basename}.${i + 1}${ext}`);
      
      if (fs.existsSync(oldFile)) {
        if (i === this.maxFiles - 1) {
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Renommer le fichier actuel
    const rotatedFile = path.join(dir, `${basename}.1${ext}`);
    fs.renameSync(filepath, rotatedFile);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, requestId?: string, userId?: number, ip?: string, userAgent?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId,
      userId,
      ip,
      userAgent
    };

    // Log vers la console en développement
    if (process.env.NODE_ENV === 'development') {
      const colorMap = {
        [LogLevel.ERROR]: '\x1b[31m',
        [LogLevel.WARN]: '\x1b[33m',
        [LogLevel.INFO]: '\x1b[36m',
        [LogLevel.DEBUG]: '\x1b[37m'
      };
      const resetColor = '\x1b[0m';
      const color = colorMap[level];
      
      console.log(`${color}${this.formatLogEntry(entry)}${resetColor}`);
    }

    // Log vers fichier en production
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile(level, entry);
    }
  }

  error(message: string, context?: Record<string, any>, requestId?: string, userId?: number, ip?: string, userAgent?: string): void {
    this.log(LogLevel.ERROR, message, context, requestId, userId, ip, userAgent);
  }

  warn(message: string, context?: Record<string, any>, requestId?: string, userId?: number, ip?: string, userAgent?: string): void {
    this.log(LogLevel.WARN, message, context, requestId, userId, ip, userAgent);
  }

  info(message: string, context?: Record<string, any>, requestId?: string, userId?: number, ip?: string, userAgent?: string): void {
    this.log(LogLevel.INFO, message, context, requestId, userId, ip, userAgent);
  }

  debug(message: string, context?: Record<string, any>, requestId?: string, userId?: number, ip?: string, userAgent?: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(LogLevel.DEBUG, message, context, requestId, userId, ip, userAgent);
    }
  }
}

export const logger = new Logger();
