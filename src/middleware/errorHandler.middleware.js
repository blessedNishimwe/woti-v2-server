/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the application
 * 
 * @module middleware/errorHandler
 */

const logger = require('../utils/logger');

/**
 * Application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error handler
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function notFound(req, res, next) {
  const error = new AppError(`Resource not found: ${req.originalUrl}`, 404);
  next(error);
}

/**
 * Global error handler middleware
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  logger.error('Error occurred', {
    message: err.message,
    statusCode: error.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // PostgreSQL errors
  if (err.code === '23505') {
    error = new AppError('Duplicate field value entered', 400);
  }

  if (err.code === '23503') {
    error = new AppError('Referenced resource does not exist', 400);
  }

  if (err.code === '22P02') {
    error = new AppError('Invalid input syntax', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = new AppError('Validation failed', 400);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File size too large', 400);
    } else {
      error = new AppError('File upload error', 400);
    }
  }

  // Send error response
  const response = {
    success: false,
    status: error.status || 'error',
    message: error.message || 'Internal server error'
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(error.statusCode).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler
};
