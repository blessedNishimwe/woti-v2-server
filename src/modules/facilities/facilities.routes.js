/**
 * Facilities Routes
 * 
 * Route definitions for facility management endpoints
 * 
 * @module modules/facilities/facilities.routes
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const facilitiesController = require('./facilities.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { adminOnly } = require('../../middleware/roleAuth.middleware');
const { uploadLimiter } = require('../../middleware/rateLimiter.middleware');
const { validateUuidParam } = require('../../middleware/validation.middleware');
const appConfig = require('../../config/app');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, appConfig.upload.dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'facility-import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: appConfig.upload.maxSize
  },
  fileFilter: (req, file, cb) => {
    if (appConfig.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/facilities/import
 * @desc    Import facilities from CSV/Excel (admin only)
 * @access  Private/Admin
 */
router.post(
  '/import',
  adminOnly,
  uploadLimiter,
  upload.single('file'),
  facilitiesController.importFacilities
);

/**
 * @route   GET /api/facilities
 * @desc    Get all facilities
 * @access  Private
 */
router.get('/', facilitiesController.getAllFacilities);

/**
 * @route   GET /api/facilities/:id
 * @desc    Get facility by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateUuidParam('id'),
  facilitiesController.getFacilityById
);

module.exports = router;
