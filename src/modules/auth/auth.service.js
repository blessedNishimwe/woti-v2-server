/**
 * Authentication Service
 * 
 * Business logic for user authentication, registration, and JWT management
 * 
 * @module modules/auth/auth.service
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const authConfig = require('../../config/auth');
const db = require('../../config/database');
const passwordService = require('./password.service');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler.middleware');

/**
 * Generate JWT access token
 * 
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    facilityId: user.facility_id || null
  };

  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn,
    algorithm: authConfig.jwt.algorithm,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience
  });
}

/**
 * Generate JWT refresh token
 * 
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn,
    algorithm: authConfig.jwt.algorithm,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience
  });
}

/**
 * Verify refresh token
 * 
 * @param {string} token - Refresh token
 * @returns {Object} Decoded token payload
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, authConfig.jwt.refreshSecret, {
      algorithms: [authConfig.jwt.algorithm],
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}

/**
 * Register a new user
 * 
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user and tokens
 */
async function register(userData) {
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
  } = userData;

  // Validate password strength
  const passwordValidation = passwordService.validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(', '), 400);
  }

  // Check if email already exists
  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('Email already registered', 400);
  }

  // Validate facility exists if provided
  if (facilityId) {
    const facility = await db.query(
      'SELECT id FROM facilities WHERE id = $1',
      [facilityId]
    );
    if (facility.rows.length === 0) {
      throw new AppError('Facility not found', 404);
    }
  }

  // Validate supervisor exists if provided
  if (supervisorId) {
    const supervisor = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [supervisorId]
    );
    if (supervisor.rows.length === 0) {
      throw new AppError('Supervisor not found', 404);
    }
  }

  // Hash password
  const passwordHash = await passwordService.hashPassword(password);

  // Create user
  const result = await db.query(
    `INSERT INTO users (
      email, password_hash, first_name, last_name, role,
      facility_id, supervisor_id, phone, employee_id, status,
      password_changed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', CURRENT_TIMESTAMP)
    RETURNING id, email, first_name, last_name, role, facility_id, 
              supervisor_id, phone, employee_id, status, created_at`,
    [
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      facilityId || null,
      supervisorId || null,
      phone || null,
      employeeId || null
    ]
  );

  const user = result.rows[0];

  // Log activity
  await db.query(
    `INSERT INTO activities (user_id, action, entity_type, entity_id, description)
     VALUES ($1, 'USER_REGISTERED', 'user', $2, 'User registered successfully')`,
    [user.id, user.id]
  );

  logger.info('User registered', {
    userId: user.id,
    email: user.email,
    role: user.role
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      facilityId: user.facility_id,
      supervisorId: user.supervisor_id,
      phone: user.phone,
      employeeId: user.employee_id,
      status: user.status
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: authConfig.jwt.expiresIn
    }
  };
}

/**
 * Login user
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<Object>} User and tokens
 */
async function login(email, password, ipAddress = null) {
  // Get user from database
  const result = await db.query(
    `SELECT id, email, password_hash, first_name, last_name, role, 
            facility_id, supervisor_id, phone, employee_id, status
     FROM users 
     WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('Account is not active', 401);
  }

  // Verify password
  const isPasswordValid = await passwordService.comparePassword(
    password,
    user.password_hash
  );

  if (!isPasswordValid) {
    // Log failed login attempt
    await db.query(
      `INSERT INTO activities (user_id, action, entity_type, entity_id, description, ip_address)
       VALUES ($1, 'LOGIN_FAILED', 'user', $2, 'Failed login attempt', $3)`,
      [user.id, user.id, ipAddress]
    );

    throw new AppError('Invalid email or password', 401);
  }

  // Update last login timestamp
  await db.query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Log successful login
  await db.query(
    `INSERT INTO activities (user_id, action, entity_type, entity_id, description, ip_address)
     VALUES ($1, 'LOGIN_SUCCESS', 'user', $2, 'User logged in successfully', $3)`,
    [user.id, user.id, ipAddress]
  );

  logger.info('User logged in', {
    userId: user.id,
    email: user.email,
    role: user.role,
    ipAddress
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      facilityId: user.facility_id,
      supervisorId: user.supervisor_id,
      phone: user.phone,
      employeeId: user.employee_id,
      status: user.status
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: authConfig.jwt.expiresIn
    }
  };
}

/**
 * Refresh access token
 * 
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */
async function refreshAccessToken(refreshToken) {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Get user from database
  const result = await db.query(
    `SELECT id, email, role, facility_id, status
     FROM users 
     WHERE id = $1 AND status = 'active'`,
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found or inactive', 401);
  }

  const user = result.rows[0];

  // Generate new access token
  const accessToken = generateAccessToken(user);

  logger.info('Access token refreshed', {
    userId: user.id
  });

  return {
    accessToken,
    expiresIn: authConfig.jwt.expiresIn
  };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  generateAccessToken,
  generateRefreshToken
};
