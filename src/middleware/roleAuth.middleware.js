/**
 * Role-Based Authorization Middleware
 * 
 * Restricts access based on user roles
 * 
 * @module middleware/roleAuth
 */

const { AppError } = require('./errorHandler.middleware');
const logger = require('../utils/logger');

/**
 * Role hierarchy for authorization
 * Higher number = more permissions
 */
const roleHierarchy = {
  tester: 1,
  data_clerk: 2,
  focal: 3,
  ddo: 4,
  supervisor: 5,
  backstopper: 6,
  admin: 7
};

/**
 * Check if user has required role
 * 
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
      
      throw new AppError('Not authorized to access this resource', 403);
    }

    logger.debug('Authorization successful', {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: roles
    });

    next();
  };
}

/**
 * Check if user has minimum role level
 * 
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Middleware function
 */
function authorizeMinimumRole(minimumRole) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      logger.warn('Insufficient role level', {
        userId: req.user.id,
        userRole: req.user.role,
        userLevel,
        minimumRole,
        requiredLevel,
        path: req.path
      });

      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
}

/**
 * Check if user is accessing their own resource or has admin privileges
 * 
 * @param {string} paramName - Request parameter name containing user ID
 * @returns {Function} Middleware function
 */
function authorizeSelfOrAdmin(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const targetUserId = req.params[paramName] || req.body[paramName];
    const isOwn = targetUserId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwn && !isAdmin) {
      logger.warn('Unauthorized resource access attempt', {
        userId: req.user.id,
        targetUserId,
        path: req.path
      });

      throw new AppError('Not authorized to access this resource', 403);
    }

    next();
  };
}

/**
 * Check if user has supervisor privileges for target user
 * 
 * @param {string} paramName - Request parameter name containing user ID
 * @returns {Function} Middleware function
 */
function authorizeSupervisor(paramName = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const targetUserId = req.params[paramName] || req.body[paramName];
    const isOwn = targetUserId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isSupervisor = req.user.role === 'supervisor' || req.user.role === 'backstopper';

    if (isOwn || isAdmin) {
      return next();
    }

    if (!isSupervisor) {
      throw new AppError('Not authorized to access this resource', 403);
    }

    // Check if the target user is supervised by the current user
    const db = require('../config/database');
    const result = await db.query(
      'SELECT id FROM users WHERE id = $1 AND supervisor_id = $2',
      [targetUserId, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Not authorized to access this resource', 403);
    }

    next();
  };
}

/**
 * Admin-only access
 */
const adminOnly = authorize('admin');

/**
 * Admin or supervisor access
 */
const adminOrSupervisor = authorize('admin', 'supervisor', 'backstopper');

module.exports = {
  authorize,
  authorizeMinimumRole,
  authorizeSelfOrAdmin,
  authorizeSupervisor,
  adminOnly,
  adminOrSupervisor
};
