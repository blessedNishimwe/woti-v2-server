/**
 * Application Configuration Module
 * 
 * Centralizes application-level configuration
 * 
 * @module config/app
 */

module.exports = {
  /**
   * Application settings
   */
  app: {
    name: process.env.APP_NAME || 'WOTI Attendance v2',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0'
  },

  /**
   * CORS configuration
   */
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3001', 'http://localhost:19006'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  /**
   * Rate limiting configuration
   */
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message: 'Too many requests from this IP, please try again later'
  },

  /**
   * Authentication rate limiting (stricter)
   */
  authRateLimit: {
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),
    message: 'Too many authentication attempts, please try again later'
  },

  /**
   * File upload configuration
   */
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
    dir: process.env.UPLOAD_DIR || 'uploads',
    allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  },

  /**
   * Logging configuration
   */
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },

  /**
   * Security configuration
   */
  security: {
    forceHttps: process.env.FORCE_HTTPS === 'true',
    sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_change_in_production'
  }
};
