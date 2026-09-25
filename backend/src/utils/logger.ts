/**
 * Logger utility — structured console logging with timestamps and log levels.
 */

const LOG_LEVELS: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel: string = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const formatMessage = (level: string, message: string, meta?: any): string => {
  const ts = new Date().toISOString();
  const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const shouldLog = (level: string): boolean => (LOG_LEVELS[level] ?? 3) <= (LOG_LEVELS[currentLevel] ?? 3);

export const logger = {
  error: (message: string, meta?: any): void => {
    if (shouldLog('error')) console.error(formatMessage('error', message, meta));
  },
  warn: (message: string, meta?: any): void => {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, meta));
  },
  info: (message: string, meta?: any): void => {
    if (shouldLog('info')) console.info(formatMessage('info', message, meta));
  },
  debug: (message: string, meta?: any): void => {
    if (shouldLog('debug')) console.log(formatMessage('debug', message, meta));
  },
  /** Log an incoming API request */
  request: (req: any): void => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', `${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        user: req.user?.id || 'anonymous'
      }));
    }
  }
};

export default logger;
