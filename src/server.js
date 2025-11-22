/**
 * WOTI Attendance v2 Server
 * 
 * Main application entry point
 * 
 * @module server
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const appConfig = require('./config/app');
const db = require('./config/database');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const facilitiesRoutes = require('./modules/facilities/facilities.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(appConfig.cors));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      environment: appConfig.app.env
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/attendance', attendanceRoutes);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: appConfig.app.name,
    version: '1.0.0',
    status: 'running',
    environment: appConfig.app.env,
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      facilities: '/api/facilities',
      attendance: '/api/attendance'
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(appConfig.app.port, appConfig.app.host, () => {
  logger.info(`Server started`, {
    port: appConfig.app.port,
    host: appConfig.app.host,
    environment: appConfig.app.env,
    nodeVersion: process.version
  });
  
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  WOTI Attendance v2 Server                           ║
║  Environment: ${appConfig.app.env.padEnd(40)}║
║  Port: ${appConfig.app.port.toString().padEnd(45)}║
║  Health Check: http://localhost:${appConfig.app.port}/health${' '.repeat(15)}║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await db.close();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', {
        error: error.message
      });
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', {
    reason,
    promise
  });
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
