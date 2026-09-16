/**
 * Logger utility — structured console logging with timestamps and log levels.
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const formatMessage = (level, message, meta) => {
  const ts = new Date().toISOString();
  const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const shouldLog = (level) => LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];

const logger = {
  error: (message, meta) => {
    if (shouldLog('error')) console.error(formatMessage('error', message, meta));
  },
  warn: (message, meta) => {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, meta));
  },
  info: (message, meta) => {
    if (shouldLog('info')) console.info(formatMessage('info', message, meta));
  },
  debug: (message, meta) => {
    if (shouldLog('debug')) console.log(formatMessage('debug', message, meta));
  },
  /** Log an incoming API request */
  request: (req) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', `${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        user: req.user?.id || 'anonymous'
      }));
    }
  }
};

module.exports = logger;
