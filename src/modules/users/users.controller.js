/**
 * Users Controller
 * 
 * Handles HTTP requests for user management endpoints
 * 
 * @module modules/users/users.controller
 */

const usersService = require('./users.service');
const { asyncHandler } = require('../../middleware/errorHandler.middleware');

/**
 * Get current user profile with full hierarchy
 * GET /api/users/me
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Get all users with filters
 * GET /api/users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role,
    status,
    facilityId,
    supervisorId,
    search,
    page = 1,
    limit = 50
  } = req.query;

  const filters = {
    role,
    status,
    facilityId,
    supervisorId,
    search
  };

  const result = await usersService.getAllUsers(
    filters,
    parseInt(page, 10),
    parseInt(limit, 10)
  );

  res.status(200).json({
    success: true,
    data: result.users,
    pagination: result.pagination
  });
});

/**
 * Update user
 * PUT /api/users/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = asyncHandler(async (req, res) => {
  const updates = req.body;
  const user = await usersService.updateUser(req.params.id, updates);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

/**
 * Delete user
 * DELETE /api/users/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = asyncHandler(async (req, res) => {
  await usersService.deleteUser(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

module.exports = {
  getMe,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
};
