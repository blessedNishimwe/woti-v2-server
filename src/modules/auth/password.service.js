/**
 * Password Service
 * 
 * Handles password hashing and verification using bcrypt with 12 rounds
 * 
 * @module modules/auth/password.service
 */

const bcrypt = require('bcrypt');
const authConfig = require('../../config/auth');
const logger = require('../../utils/logger');

/**
 * Hash a password using bcrypt
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, authConfig.bcrypt.rounds);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Password hashing failed', {
      error: error.message
    });
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare password with hash
 * 
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function comparePassword(password, hash) {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    logger.debug('Password comparison completed', { isMatch });
    return isMatch;
  } catch (error) {
    logger.error('Password comparison failed', {
      error: error.message
    });
    throw new Error('Failed to compare password');
  }
}

/**
 * Validate password strength
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePasswordStrength(password) {
  const errors = [];
  const config = authConfig.password;

  if (!password || password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
