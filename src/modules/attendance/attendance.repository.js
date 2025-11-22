/**
 * Attendance Repository
 * 
 * Database queries for attendance with offline sync support
 * 
 * @module modules/attendance/attendance.repository
 */

const db = require('../../config/database');

/**
 * Find attendance by ID
 * 
 * @param {string} attendanceId - Attendance ID
 * @returns {Promise<Object|null>} Attendance object or null
 */
async function findById(attendanceId) {
  const result = await db.query(
    `SELECT 
      a.*,
      u.first_name, u.last_name, u.email, u.employee_id,
      f.name as facility_name
    FROM attendance a
    INNER JOIN users u ON a.user_id = u.id
    INNER JOIN facilities f ON a.facility_id = f.id
    WHERE a.id = $1`,
    [attendanceId]
  );

  return result.rows.length > 0 ? formatAttendance(result.rows[0]) : null;
}

/**
 * Find user's attendance records
 * 
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @param {number} limit - Result limit
 * @param {number} offset - Result offset
 * @returns {Promise<Array>} Array of attendance records
 */
async function findByUserId(userId, filters = {}, limit = 50, offset = 0) {
  const conditions = ['a.user_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (filters.startDate) {
    conditions.push(`a.clock_in >= $${paramIndex++}`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`a.clock_in <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  if (filters.status) {
    conditions.push(`a.status = $${paramIndex++}`);
    params.push(filters.status);
  }

  params.push(limit, offset);

  const result = await db.query(
    `SELECT 
      a.*,
      f.name as facility_name
    FROM attendance a
    INNER JOIN facilities f ON a.facility_id = f.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.clock_in DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return result.rows.map(row => formatAttendance(row));
}

/**
 * Find active attendance (clocked in, not clocked out)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Active attendance or null
 */
async function findActiveAttendance(userId) {
  const result = await db.query(
    `SELECT * FROM attendance 
     WHERE user_id = $1 AND status = 'clocked_in' AND clock_out IS NULL
     ORDER BY clock_in DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Create attendance record
 * 
 * @param {Object} attendanceData - Attendance data
 * @returns {Promise<Object>} Created attendance
 */
async function create(attendanceData) {
  const result = await db.query(
    `INSERT INTO attendance (
      user_id, facility_id, clock_in,
      clock_in_latitude, clock_in_longitude,
      notes, status, synced, client_timestamp, device_id,
      sync_version, conflict_resolution_strategy, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      attendanceData.userId,
      attendanceData.facilityId,
      attendanceData.clockIn || new Date(),
      attendanceData.clockInLatitude || null,
      attendanceData.clockInLongitude || null,
      attendanceData.notes || null,
      'clocked_in',
      attendanceData.synced || true,
      attendanceData.clientTimestamp || null,
      attendanceData.deviceId || null,
      attendanceData.syncVersion || 1,
      attendanceData.conflictResolutionStrategy || 'server_wins',
      attendanceData.metadata || {}
    ]
  );

  return result.rows[0];
}

/**
 * Update attendance (clock out)
 * 
 * @param {string} attendanceId - Attendance ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated attendance
 */
async function update(attendanceId, updates) {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = [
    'clock_out', 'clock_out_latitude', 'clock_out_longitude',
    'notes', 'status', 'synced', 'sync_version', 'metadata'
  ];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      params.push(updates[key]);
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  params.push(attendanceId);

  const result = await db.query(
    `UPDATE attendance 
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  return result.rows[0];
}

/**
 * Bulk insert attendance records for sync
 * 
 * @param {Array} records - Array of attendance records
 * @returns {Promise<Array>} Created records
 */
async function bulkInsert(records) {
  const client = await db.getClient();
  const inserted = [];

  try {
    await client.query('BEGIN');

    for (const record of records) {
      const result = await client.query(
        `INSERT INTO attendance (
          user_id, facility_id, clock_in, clock_out,
          clock_in_latitude, clock_in_longitude,
          clock_out_latitude, clock_out_longitude,
          notes, status, synced, client_timestamp, device_id,
          sync_version, conflict_resolution_strategy, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          record.userId,
          record.facilityId,
          record.clockIn,
          record.clockOut || null,
          record.clockInLatitude || null,
          record.clockInLongitude || null,
          record.clockOutLatitude || null,
          record.clockOutLongitude || null,
          record.notes || null,
          record.status || (record.clockOut ? 'clocked_out' : 'clocked_in'),
          true,
          record.clientTimestamp,
          record.deviceId,
          record.syncVersion || 1,
          record.conflictResolutionStrategy || 'server_wins',
          record.metadata || {}
        ]
      );
      inserted.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Format attendance record
 * 
 * @param {Object} row - Database row
 * @returns {Object} Formatted attendance
 */
function formatAttendance(row) {
  return {
    id: row.id,
    userId: row.user_id,
    facilityId: row.facility_id,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    clockInLatitude: row.clock_in_latitude ? parseFloat(row.clock_in_latitude) : null,
    clockInLongitude: row.clock_in_longitude ? parseFloat(row.clock_in_longitude) : null,
    clockOutLatitude: row.clock_out_latitude ? parseFloat(row.clock_out_latitude) : null,
    clockOutLongitude: row.clock_out_longitude ? parseFloat(row.clock_out_longitude) : null,
    notes: row.notes,
    status: row.status,
    synced: row.synced,
    clientTimestamp: row.client_timestamp,
    serverTimestamp: row.server_timestamp,
    deviceId: row.device_id,
    syncVersion: row.sync_version,
    conflictResolutionStrategy: row.conflict_resolution_strategy,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    facilityName: row.facility_name,
    userName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : undefined
  };
}

module.exports = {
  findById,
  findByUserId,
  findActiveAttendance,
  create,
  update,
  bulkInsert
};
