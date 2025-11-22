/**
 * Authentication Middleware
 * 
 * JWT verification and user attachment to requests
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('./errorHandler.middleware');
const authConfig = require('../config/auth');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Verify JWT token and attach user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new AppError('Not authorized to access this route', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, authConfig.jwt.secret, {
      algorithms: [authConfig.jwt.algorithm],
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    });

    // Get user from database
    const result = await db.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.status,
        u.facility_id, u.supervisor_id, u.phone, u.employee_id,
        f.id as facility_id, f.name as facility_name, f.council_id,
        c.id as council_id, c.name as council_name, c.region_id,
        r.id as region_id, r.name as region_name
      FROM users u
      LEFT JOIN facilities f ON u.facility_id = f.id
      LEFT JOIN councils c ON f.council_id = c.id
      LEFT JOIN regions r ON c.region_id = r.id
      WHERE u.id = $1 AND u.status = 'active'`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or inactive', 401);
    }

    const user = result.rows[0];

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      facilityId: user.facility_id,
      supervisorId: user.supervisor_id,
      phone: user.phone,
      employeeId: user.employee_id,
      facility: user.facility_id ? {
        id: user.facility_id,
        name: user.facility_name,
        councilId: user.council_id
      } : null,
      council: user.council_id ? {
        id: user.council_id,
        name: user.council_name,
        regionId: user.region_id
      } : null,
      region: user.region_id ? {
        id: user.region_id,
        name: user.region_name
      } : null
    };

    logger.debug('User authenticated', {
      userId: user.id,
      role: user.role
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired', 401);
    }
    throw error;
  }
});

/**
 * Optional authentication - attach user if token exists but don't require it
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  try {
    await authenticate(req, res, next);
  } catch (error) {
    // If authentication fails, continue without user
    req.user = null;
    next();
  }
});

module.exports = {
  authenticate,
  optionalAuthenticate
};
