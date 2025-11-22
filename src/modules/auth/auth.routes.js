/**
 * Authentication Routes
 * 
 * Route definitions for authentication endpoints
 * 
 * @module modules/auth/auth.routes
 */

const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { adminOnly } = require('../../middleware/roleAuth.middleware');
const { authLimiter } = require('../../middleware/rateLimiter.middleware');
const {
  validateRegistration,
  validateLogin
} = require('../../middleware/validation.middleware');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (admin only)
 * @access  Private/Admin
 */
router.post(
  '/register',
  authLimiter,
  authenticate,
  adminOnly,
  validateRegistration,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validateLogin,
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  authController.refresh
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

module.exports = router;
