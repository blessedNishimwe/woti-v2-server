/**
 * Attendance Routes
 * 
 * Route definitions for attendance endpoints
 * 
 * @module modules/attendance/attendance.routes
 */

const express = require('express');
const attendanceController = require('./attendance.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { syncLimiter } = require('../../middleware/rateLimiter.middleware');
const {
  validateClockIn,
  validateClockOut
} = require('../../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/attendance/clock-in
 * @desc    Clock in
 * @access  Private
 */
router.post(
  '/clock-in',
  validateClockIn,
  attendanceController.clockIn
);

/**
 * @route   POST /api/attendance/clock-out
 * @desc    Clock out
 * @access  Private
 */
router.post(
  '/clock-out',
  validateClockOut,
  attendanceController.clockOut
);

/**
 * @route   GET /api/attendance/my-records
 * @desc    Get user's attendance history
 * @access  Private
 */
router.get(
  '/my-records',
  attendanceController.getMyRecords
);

/**
 * @route   POST /api/attendance/sync
 * @desc    Bulk sync offline records
 * @access  Private
 */
router.post(
  '/sync',
  syncLimiter,
  attendanceController.syncOfflineRecords
);

module.exports = router;
