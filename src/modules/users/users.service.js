/**
 * Users Service
 * 
 * Business logic for user management
 * 
 * @module modules/users/users.service
 */

const usersRepository = require('./users.repository');
const { AppError } = require('../../middleware/errorHandler.middleware');
const logger = require('../../utils/logger');

/**
 * Get user by ID
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
async function getUserById(userId) {
  const user = await usersRepository.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
}

/**
 * Get all users with pagination and filters
 * 
 * @param {Object} filters - Query filters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Users and pagination info
 */
async function getAllUsers(filters = {}, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    usersRepository.findAll(filters, limit, offset),
    usersRepository.count(filters)
  ]);
  
  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Update user
 * 
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
async function updateUser(userId, updates) {
  // Check if user exists
  const existingUser = await usersRepository.findById(userId);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed and is unique
  if (updates.email && updates.email !== existingUser.email) {
    const emailExists = await usersRepository.findByEmail(updates.email);
    if (emailExists) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Update user
  const updatedUser = await usersRepository.update(userId, updates);

  logger.info('User updated', {
    userId,
    updatedFields: Object.keys(updates)
  });

  return usersRepository.findById(updatedUser.id);
}

/**
 * Delete user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteUser(userId) {
  const user = await usersRepository.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const success = await usersRepository.deleteUser(userId);
  
  logger.info('User deleted', { userId });
  
  return success;
}

module.exports = {
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
};
