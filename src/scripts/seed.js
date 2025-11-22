/**
 * Database Seed Script
 * 
 * Seeds the database with initial data
 * 
 * Usage:
 *   node src/scripts/seed.js
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');
const logger = require('../utils/logger');

const SEEDS_DIR = path.join(__dirname, '../../database/seeds');

/**
 * Run database seeds
 */
async function seed() {
  try {
    logger.info('Running database seeds');

    // Get seed files
    const files = await fs.readdir(SEEDS_DIR);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      logger.warn('No seed files found');
      return;
    }

    // Run each seed
    for (const file of sqlFiles) {
      const filePath = path.join(SEEDS_DIR, file);
      const sql = await fs.readFile(filePath, 'utf8');

      logger.info(`Executing seed: ${file}`);
      await db.query(sql);
      logger.info(`Seed completed: ${file}`);
    }

    logger.info('All seeds completed successfully');
  } catch (error) {
    logger.error('Seeding failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await db.close();
  }
}

// Run seeds
seed()
  .then(() => {
    console.log('Database seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  });
