/**
 * Database Configuration Module
 * 
 * Configures PostgreSQL connection pooling with support for:
 * - Connection pooling (20-100 connections)
 * - PgBouncer integration
 * - Graceful shutdown
 * - Health checks
 * - Environment-based configuration
 * 
 * @module config/database
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * Database configuration from environment variables
 */
const config = {
  host: process.env.PGBOUNCER_ENABLED === 'true' 
    ? process.env.PGBOUNCER_HOST 
    : process.env.DB_HOST,
  port: process.env.PGBOUNCER_ENABLED === 'true' 
    ? parseInt(process.env.PGBOUNCER_PORT || '6432', 10)
    : parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN || '20', 10),
  max: parseInt(process.env.DB_POOL_MAX || '100', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '3000', 10),
  // Enable SSL in production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
};

/**
 * PostgreSQL connection pool instance
 * @type {Pool}
 */
const pool = new Pool(config);

/**
 * Pool error handler
 */
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', {
    error: err.message,
    stack: err.stack
  });
});

/**
 * Pool connect event
 */
pool.on('connect', (client) => {
  logger.debug('New database connection established', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

/**
 * Pool remove event
 */
pool.on('remove', (client) => {
  logger.debug('Database connection removed from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

/**
 * Execute a query with connection from pool
 * 
 * @param {string} text - SQL query text with placeholders ($1, $2, etc.)
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Query executed', {
      query: text.substring(0, 100),
      duration,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query execution failed', {
      query: text.substring(0, 100),
      duration,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * 
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  const client = await pool.connect();
  
  // Add query method to client for convenience
  const originalQuery = client.query;
  const originalRelease = client.release;
  
  // Track if client has been released
  let released = false;
  
  client.query = (...args) => {
    if (released) {
      throw new Error('Cannot execute query on released client');
    }
    return originalQuery.apply(client, args);
  };
  
  client.release = () => {
    if (released) {
      logger.warn('Client already released');
      return;
    }
    released = true;
    return originalRelease.apply(client);
  };
  
  return client;
}

/**
 * Execute a transaction with automatic rollback on error
 * 
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<*>} Transaction result
 */
async function transaction(callback) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check database connection health
 * 
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    const result = await pool.query('SELECT NOW()');
    return {
      status: 'healthy',
      timestamp: result.rows[0].now,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error.message
    });
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Gracefully close all connections in the pool
 * 
 * @returns {Promise<void>}
 */
async function close() {
  logger.info('Closing database connection pool');
  await pool.end();
  logger.info('Database connection pool closed');
}

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  healthCheck,
  close
};
