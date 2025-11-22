/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints
 * 
 * @module modules/auth/auth.controller
 */

const authService = require('./auth.service');
const { asyncHandler } = require('../../middleware/errorHandler.middleware');
const logger = require('../../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    role,
    facilityId,
    supervisorId,
    phone,
    employeeId
  } = req.body;

  const result = await authService.register({
    email,
    password,
    firstName,
    lastName,
    role,
    facilityId,
    supervisorId,
    phone,
    employeeId
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result
  });
});

/**
 * Login user
 * POST /api/auth/login
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;

  const result = await authService.login(email, password, ipAddress);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: result
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = asyncHandler(async (req, res) => {
  // Log logout activity
  const db = require('../../config/database');
  await db.query(
    `INSERT INTO activities (user_id, action, entity_type, entity_id, description, ip_address)
     VALUES ($1, 'LOGOUT', 'user', $2, 'User logged out', $3)`,
    [req.user.id, req.user.id, req.ip]
  );

  logger.info('User logged out', {
    userId: req.user.id,
    email: req.user.email
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout
};
