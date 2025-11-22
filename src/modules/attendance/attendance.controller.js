/**
 * Attendance Controller
 * 
 * Handles HTTP requests for attendance endpoints
 * 
 * @module modules/attendance/attendance.controller
 */

const attendanceService = require('./attendance.service');
const { asyncHandler } = require('../../middleware/errorHandler.middleware');

/**
 * Clock in
 * POST /api/attendance/clock-in
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clockIn = asyncHandler(async (req, res) => {
  const {
    facilityId,
    latitude,
    longitude,
    notes,
    deviceId,
    clientTimestamp,
    clockIn
  } = req.body;

  const attendance = await attendanceService.clockIn(req.user.id, {
    facilityId,
    latitude,
    longitude,
    notes,
    deviceId,
    clientTimestamp,
    clockIn
  });

  res.status(201).json({
    success: true,
    message: 'Clocked in successfully',
    data: attendance
  });
});

/**
 * Clock out
 * POST /api/attendance/clock-out
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clockOut = asyncHandler(async (req, res) => {
  const {
    attendanceId,
    latitude,
    longitude,
    notes,
    clockOut
  } = req.body;

  const attendance = await attendanceService.clockOut(req.user.id, {
    attendanceId,
    latitude,
    longitude,
    notes,
    clockOut
  });

  res.status(200).json({
    success: true,
    message: 'Clocked out successfully',
    data: attendance
  });
});

/**
 * Get user's attendance records
 * GET /api/attendance/my-records
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMyRecords = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    status,
    page = 1,
    limit = 50
  } = req.query;

  const filters = {
    startDate,
    endDate,
    status
  };

  const result = await attendanceService.getUserAttendance(
    req.user.id,
    filters,
    parseInt(page, 10),
    parseInt(limit, 10)
  );

  res.status(200).json({
    success: true,
    data: result.records,
    pagination: result.pagination
  });
});

/**
 * Sync offline records
 * POST /api/attendance/sync
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const syncOfflineRecords = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({
      success: false,
      message: 'Records must be an array'
    });
  }

  const result = await attendanceService.syncOfflineRecords(req.user.id, records);

  res.status(200).json({
    success: true,
    message: 'Sync completed',
    data: result
  });
});

module.exports = {
  clockIn,
  clockOut,
  getMyRecords,
  syncOfflineRecords
};
