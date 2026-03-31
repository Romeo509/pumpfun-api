const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    if (isDev) {
      console.log(`[${timestamp}] INFO: ${message}`, meta);
    } else {
      console.log(JSON.stringify({ timestamp, level: 'info', message, ...meta }));
    }
  },

  error: (message, error, meta = {}) => {
    const timestamp = new Date().toISOString();
    const errorMeta = error ? { errorMessage: error.message, stack: error.stack } : {};
    if (isDev) {
      console.error(`[${timestamp}] ERROR: ${message}`, errorMeta, meta);
    } else {
      console.log(JSON.stringify({ timestamp, level: 'error', message, ...errorMeta, ...meta }));
    }
  },

  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    if (isDev) {
      console.warn(`[${timestamp}] WARN: ${message}`, meta);
    } else {
      console.log(JSON.stringify({ timestamp, level: 'warn', message, ...meta }));
    }
  },

  debug: (message, meta = {}) => {
    if (isDev) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG: ${message}`, meta);
    }
  }
};
