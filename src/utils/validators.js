/**
 * Validation Utility Module
 * 
 * Common validation functions for input data
 * 
 * @module utils/validators
 */

/**
 * Validate email format
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate coordinates (latitude, longitude)
 * 
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {boolean} True if valid coordinates
 */
function isValidCoordinates(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  
  return latitude >= -90 && latitude <= 90 && 
         longitude >= -180 && longitude <= 180;
}

/**
 * Validate user role
 * 
 * @param {string} role - User role to validate
 * @returns {boolean} True if valid role
 */
function isValidRole(role) {
  const validRoles = ['tester', 'data_clerk', 'focal', 'ddo', 'supervisor', 'backstopper', 'admin'];
  return validRoles.includes(role);
}

/**
 * Validate user status
 * 
 * @param {string} status - User status to validate
 * @returns {boolean} True if valid status
 */
function isValidUserStatus(status) {
  const validStatuses = ['active', 'inactive', 'suspended'];
  return validStatuses.includes(status);
}

/**
 * Validate facility status
 * 
 * @param {string} status - Facility status to validate
 * @returns {boolean} True if valid status
 */
function isValidFacilityStatus(status) {
  const validStatuses = ['active', 'inactive', 'maintenance'];
  return validStatuses.includes(status);
}

/**
 * Validate attendance status
 * 
 * @param {string} status - Attendance status to validate
 * @returns {boolean} True if valid status
 */
function isValidAttendanceStatus(status) {
  const validStatuses = ['clocked_in', 'clocked_out', 'incomplete'];
  return validStatuses.includes(status);
}

/**
 * Validate conflict resolution strategy
 * 
 * @param {string} strategy - Strategy to validate
 * @returns {boolean} True if valid strategy
 */
function isValidConflictStrategy(strategy) {
  const validStrategies = ['client_wins', 'server_wins', 'manual'];
  return validStrategies.includes(strategy);
}

/**
 * Validate UUID format
 * 
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input
 * 
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate phone number (basic validation)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
function isValidPhone(phone) {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

module.exports = {
  isValidEmail,
  validatePassword,
  isValidCoordinates,
  isValidRole,
  isValidUserStatus,
  isValidFacilityStatus,
  isValidAttendanceStatus,
  isValidConflictStrategy,
  isValidUUID,
  sanitizeString,
  isValidPhone
};
