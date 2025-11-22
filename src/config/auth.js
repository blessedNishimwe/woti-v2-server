/**
 * Authentication Configuration Module
 * 
 * Centralizes authentication-related configuration:
 * - JWT secret and expiry
 * - bcrypt rounds
 * - Token settings
 * 
 * @module config/auth
 */

module.exports = {
  /**
   * JWT configuration
   */
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_change_in_production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: 'woti-attendance-v2',
    audience: 'woti-app'
  },

  /**
   * bcrypt configuration
   */
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  },

  /**
   * Password policy
   */
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },

  /**
   * Session configuration
   */
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxRefreshAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }
};
