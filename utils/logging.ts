import pino from 'pino';

export const createLogger = (name: string) => pino({
  name,
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { 
      colorize: true,
      translateTime: 'HH:MM:ss Z'
    }
  } : undefined
}); 