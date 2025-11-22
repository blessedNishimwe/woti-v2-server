/**
 * Rate Limiter Middleware
 * 
 * Protects endpoints from abuse using express-rate-limit
 * 
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const appConfig = require('../config/app');
const logger = require('../utils/logger');

/**
 * General rate limiter for API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: appConfig.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      status: 'error',
      message: appConfig.rateLimit.message
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: appConfig.authRateLimit.windowMs,
  max: appConfig.authRateLimit.max,
  message: appConfig.authRateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email
    });
    res.status(429).json({
      success: false,
      status: 'error',
      message: appConfig.authRateLimit.message
    });
  }
});

/**
 * Rate limiter for file upload endpoints
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id
    });
    res.status(429).json({
      success: false,
      status: 'error',
      message: 'Too many upload requests, please try again later'
    });
  }
});

/**
 * Rate limiter for sync endpoints
 */
const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 sync requests per window
  message: 'Too many sync requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Sync rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      deviceId: req.body?.deviceId
    });
    res.status(429).json({
      success: false,
      status: 'error',
      message: 'Too many sync requests, please try again later'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  syncLimiter
};
