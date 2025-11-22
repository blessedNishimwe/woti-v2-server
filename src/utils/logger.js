/**
 * Logging Utility Module
 * 
 * Provides structured logging using Winston
 * 
 * @module utils/logger
 */

const winston = require('winston');
const path = require('path');
const appConfig = require('../config/app');

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Create logger transports
 */
const transports = [
  // Console transport
  new winston.transports.Console({
    format: appConfig.app.env === 'production' ? logFormat : consoleFormat
  })
];

// File transport for production
if (appConfig.app.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: appConfig.logging.file,
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(path.dirname(appConfig.logging.file), 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10485760,
      maxFiles: 5
    })
  );
}

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: appConfig.logging.level,
  format: logFormat,
  defaultMeta: {
    service: appConfig.app.name,
    environment: appConfig.app.env
  },
  transports,
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

/**
 * Stream for Morgan HTTP logging
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
