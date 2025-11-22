/**
 * Users Routes
 * 
 * Route definitions for user management endpoints
 * 
 * @module modules/users/users.routes
 */

const express = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const {
  authorize,
  authorizeSelfOrAdmin
} = require('../../middleware/roleAuth.middleware');
const {
  validateUserUpdate,
  validateUuidParam
} = require('../../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile with full hierarchy
 * @access  Private
 */
router.get('/me', usersController.getMe);

/**
 * @route   GET /api/users
 * @desc    Get all users with filters (admin, supervisor, backstopper)
 * @access  Private
 */
router.get(
  '/',
  authorize('admin', 'supervisor', 'backstopper'),
  usersController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateUuidParam('id'),
  usersController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (self or admin)
 */
router.put(
  '/:id',
  validateUserUpdate,
  authorizeSelfOrAdmin('id'),
  usersController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  validateUuidParam('id'),
  authorize('admin'),
  usersController.deleteUser
);

module.exports = router;
