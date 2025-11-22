/**
 * Attendance Service
 * 
 * Business logic for attendance management and offline sync
 * 
 * @module modules/attendance/attendance.service
 */

const attendanceRepository = require('./attendance.repository');
const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');
const syncResolver = require('../../utils/syncResolver');
const logger = require('../../utils/logger');

/**
 * Clock in user
 * 
 * @param {string} userId - User ID
 * @param {Object} clockInData - Clock in data
 * @returns {Promise<Object>} Created attendance record
 */
async function clockIn(userId, clockInData) {
  // Check if user has active attendance
  const activeAttendance = await attendanceRepository.findActiveAttendance(userId);
  
  if (activeAttendance) {
    throw new AppError('User already clocked in. Please clock out first.', 400);
  }

  // Verify facility exists
  const facilityResult = await db.query(
    'SELECT id FROM facilities WHERE id = $1 AND status = $2',
    [clockInData.facilityId, 'active']
  );

  if (facilityResult.rows.length === 0) {
    throw new AppError('Facility not found or inactive', 404);
  }

  // Create attendance record
  const attendance = await attendanceRepository.create({
    userId,
    facilityId: clockInData.facilityId,
    clockIn: clockInData.clockIn || new Date(),
    clockInLatitude: clockInData.latitude,
    clockInLongitude: clockInData.longitude,
    notes: clockInData.notes,
    deviceId: clockInData.deviceId,
    clientTimestamp: clockInData.clientTimestamp,
    synced: true
  });

  // Log activity
  await db.query(
    `INSERT INTO activities (user_id, action, entity_type, entity_id, description, metadata)
     VALUES ($1, 'CLOCK_IN', 'attendance', $2, 'User clocked in', $3)`,
    [userId, attendance.id, JSON.stringify({ facilityId: clockInData.facilityId })]
  );

  logger.info('User clocked in', {
    userId,
    attendanceId: attendance.id,
    facilityId: clockInData.facilityId
  });

  return attendanceRepository.findById(attendance.id);
}

/**
 * Clock out user
 * 
 * @param {string} userId - User ID
 * @param {Object} clockOutData - Clock out data
 * @returns {Promise<Object>} Updated attendance record
 */
async function clockOut(userId, clockOutData) {
  // Get attendance record
  let attendance;
  
  if (clockOutData.attendanceId) {
    attendance = await attendanceRepository.findById(clockOutData.attendanceId);
  } else {
    attendance = await attendanceRepository.findActiveAttendance(userId);
  }

  if (!attendance) {
    throw new AppError('No active attendance record found', 404);
  }

  if (attendance.userId !== userId) {
    throw new AppError('Not authorized to clock out this attendance', 403);
  }

  if (attendance.clockOut) {
    throw new AppError('Already clocked out', 400);
  }

  // Update attendance record
  const updated = await attendanceRepository.update(attendance.id, {
    clock_out: clockOutData.clockOut || new Date(),
    clock_out_latitude: clockOutData.latitude,
    clock_out_longitude: clockOutData.longitude,
    notes: clockOutData.notes || attendance.notes,
    status: 'clocked_out',
    sync_version: attendance.syncVersion + 1
  });

  // Log activity
  await db.query(
    `INSERT INTO activities (user_id, action, entity_type, entity_id, description)
     VALUES ($1, 'CLOCK_OUT', 'attendance', $2, 'User clocked out')`,
    [userId, attendance.id]
  );

  logger.info('User clocked out', {
    userId,
    attendanceId: attendance.id
  });

  return attendanceRepository.findById(updated.id);
}

/**
 * Get user's attendance records
 * 
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Attendance records and pagination
 */
async function getUserAttendance(userId, filters = {}, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  
  const records = await attendanceRepository.findByUserId(userId, filters, limit, offset);
  
  // Count total records
  const countResult = await db.query(
    `SELECT COUNT(*) FROM attendance WHERE user_id = $1`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);
  
  return {
    records,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Sync offline attendance records
 * 
 * @param {string} userId - User ID
 * @param {Array} records - Array of offline records
 * @returns {Promise<Object>} Sync results
 */
async function syncOfflineRecords(userId, records) {
  const synced = [];
  const conflicts = [];
  const errors = [];

  for (const record of records) {
    try {
      // Validate sync metadata
      const validation = syncResolver.validateSyncMetadata(record);
      
      if (!validation.isValid) {
        errors.push({
          record,
          errors: validation.errors
        });
        continue;
      }

      // Check for existing record with same device_id and client_timestamp
      const existingResult = await db.query(
        `SELECT * FROM attendance 
         WHERE device_id = $1 AND client_timestamp = $2`,
        [record.deviceId, record.clientTimestamp]
      );

      if (existingResult.rows.length > 0) {
        const existingRecord = existingResult.rows[0];
        
        // Check for conflicts
        if (syncResolver.hasConflict(record, existingRecord)) {
          const resolution = syncResolver.resolveConflict(
            record,
            existingRecord,
            record.conflictResolutionStrategy || 'server_wins'
          );

          if (resolution.winner === 'manual') {
            conflicts.push({
              record,
              existingRecord,
              resolution
            });
            continue;
          }

          // Update with resolved data
          if (resolution.winner === 'client') {
            await attendanceRepository.update(existingRecord.id, {
              ...record,
              sync_version: existingRecord.sync_version + 1
            });
          }

          synced.push({
            id: existingRecord.id,
            action: 'updated',
            resolution: resolution.winner
          });
        } else {
          synced.push({
            id: existingRecord.id,
            action: 'no_change'
          });
        }
      } else {
        // Create new record
        const created = await attendanceRepository.create({
          userId,
          facilityId: record.facilityId,
          clockIn: record.clockIn,
          clockOut: record.clockOut || null,
          clockInLatitude: record.clockInLatitude,
          clockInLongitude: record.clockInLongitude,
          clockOutLatitude: record.clockOutLatitude,
          clockOutLongitude: record.clockOutLongitude,
          notes: record.notes,
          deviceId: record.deviceId,
          clientTimestamp: record.clientTimestamp,
          syncVersion: record.syncVersion || 1,
          conflictResolutionStrategy: record.conflictResolutionStrategy,
          metadata: record.metadata,
          synced: true
        });

        synced.push({
          id: created.id,
          action: 'created'
        });
      }
    } catch (error) {
      logger.error('Sync error for record', {
        record,
        error: error.message
      });
      
      errors.push({
        record,
        errors: [error.message]
      });
    }
  }

  logger.info('Offline sync completed', {
    userId,
    synced: synced.length,
    conflicts: conflicts.length,
    errors: errors.length
  });

  return syncResolver.createSyncResponse(synced, conflicts, errors);
}

module.exports = {
  clockIn,
  clockOut,
  getUserAttendance,
  syncOfflineRecords
};
