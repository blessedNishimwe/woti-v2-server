/**
 * Database Migration Script
 * 
 * Runs database migrations up or down
 * 
 * Usage:
 *   node src/scripts/migrate.js up
 *   node src/scripts/migrate.js down
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

/**
 * Run migration
 * 
 * @param {string} direction - 'up' or 'down'
 */
async function migrate(direction = 'up') {
  try {
    logger.info(`Running migrations: ${direction}`);

    // Get migration files
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      logger.warn('No migration files found');
      return;
    }

    // Run each migration
    for (const file of sqlFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = await fs.readFile(filePath, 'utf8');

      logger.info(`Executing migration: ${file}`);
      await db.query(sql);
      logger.info(`Migration completed: ${file}`);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await db.close();
  }
}

// Get direction from command line
const direction = process.argv[2] || 'up';

if (!['up', 'down'].includes(direction)) {
  console.error('Invalid direction. Use "up" or "down"');
  process.exit(1);
}

// Run migrations
migrate(direction)
  .then(() => {
    console.log('Migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exit(1);
  });
