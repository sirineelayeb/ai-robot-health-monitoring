// Simple logger utility with color support
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const formatMessage = (level, color, ...args) => {
  const timestamp = new Date().toISOString();
  const prefix = `${color}[${level}]${colors.reset} ${colors.gray}${timestamp}${colors.reset}`;
  return [prefix, ...args];
};

const logger = {
  info: (...args) => {
    console.log(...formatMessage('INFO', colors.green, ...args));
  },

  error: (...args) => {
    console.error(...formatMessage('ERROR', colors.red, ...args));
  },

  warn: (...args) => {
    console.warn(...formatMessage('WARN', colors.yellow, ...args));
  },

  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...formatMessage('DEBUG', colors.cyan, ...args));
    }
  },

  success: (...args) => {
    console.log(...formatMessage('SUCCESS', colors.bright + colors.green, ...args));
  }
};

export default logger;