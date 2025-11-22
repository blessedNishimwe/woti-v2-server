/**
 * Validation Middleware
 * 
 * Request validation using express-validator
 * 
 * @module middleware/validation
 */

const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler.middleware');
const validators = require('../utils/validators');

/**
 * Handle validation results
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    throw new AppError('Validation failed', 400, true, errorMessages);
  }
  
  next();
}

/**
 * Validation rules for user registration
 */
const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name too long'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name too long'),
  body('role')
    .custom(validators.isValidRole)
    .withMessage('Invalid role'),
  body('facilityId')
    .optional()
    .custom(validators.isValidUUID)
    .withMessage('Invalid facility ID'),
  body('supervisorId')
    .optional()
    .custom(validators.isValidUUID)
    .withMessage('Invalid supervisor ID'),
  body('phone')
    .optional()
    .custom(validators.isValidPhone)
    .withMessage('Invalid phone number'),
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Validation rules for user update
 */
const validateUserUpdate = [
  param('id')
    .custom(validators.isValidUUID)
    .withMessage('Invalid user ID'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name too long'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name too long'),
  body('role')
    .optional()
    .custom(validators.isValidRole)
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .custom(validators.isValidUserStatus)
    .withMessage('Invalid status'),
  body('phone')
    .optional()
    .custom(validators.isValidPhone)
    .withMessage('Invalid phone number'),
  handleValidationErrors
];

/**
 * Validation rules for clock in
 */
const validateClockIn = [
  body('facilityId')
    .custom(validators.isValidUUID)
    .withMessage('Valid facility ID is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('deviceId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Device ID cannot be empty'),
  handleValidationErrors
];

/**
 * Validation rules for clock out
 */
const validateClockOut = [
  body('attendanceId')
    .custom(validators.isValidUUID)
    .withMessage('Valid attendance ID is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  handleValidationErrors
];

/**
 * Validation rules for facility creation
 */
const validateFacility = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Facility name is required')
    .isLength({ max: 255 })
    .withMessage('Facility name too long'),
  body('councilId')
    .custom(validators.isValidUUID)
    .withMessage('Valid council ID is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('status')
    .optional()
    .custom(validators.isValidFacilityStatus)
    .withMessage('Invalid facility status'),
  handleValidationErrors
];

/**
 * Validation rules for UUID parameter
 */
const validateUuidParam = (paramName = 'id') => [
  param(paramName)
    .custom(validators.isValidUUID)
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateUserUpdate,
  validateClockIn,
  validateClockOut,
  validateFacility,
  validateUuidParam
};
