/**
 * Users Repository
 * 
 * Database queries for users with parameterized statements
 * 
 * @module modules/users/users.repository
 */

const db = require('../../config/database');

/**
 * Find user by ID with full hierarchy
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findById(userId) {
  const result = await db.query(
    `SELECT 
      u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.status,
      u.employee_id, u.date_of_birth, u.hire_date, u.avatar_url,
      u.facility_id, u.supervisor_id, u.last_login_at, u.created_at, u.updated_at,
      f.id as facility_id, f.name as facility_name, f.code as facility_code,
      f.council_id,
      c.id as council_id, c.name as council_name, c.code as council_code,
      c.region_id,
      r.id as region_id, r.name as region_name, r.code as region_code,
      s.id as supervisor_id, s.first_name as supervisor_first_name,
      s.last_name as supervisor_last_name, s.email as supervisor_email
    FROM users u
    LEFT JOIN facilities f ON u.facility_id = f.id
    LEFT JOIN councils c ON f.council_id = c.id
    LEFT JOIN regions r ON c.region_id = r.id
    LEFT JOIN users s ON u.supervisor_id = s.id
    WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return formatUser(row);
}

/**
 * Find user by email
 * 
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
async function findByEmail(email) {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Find all users with optional filters
 * 
 * @param {Object} filters - Query filters
 * @param {number} limit - Result limit
 * @param {number} offset - Result offset
 * @returns {Promise<Array>} Array of users
 */
async function findAll(filters = {}, limit = 50, offset = 0) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.role) {
    conditions.push(`u.role = $${paramIndex++}`);
    params.push(filters.role);
  }

  if (filters.status) {
    conditions.push(`u.status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.facilityId) {
    conditions.push(`u.facility_id = $${paramIndex++}`);
    params.push(filters.facilityId);
  }

  if (filters.supervisorId) {
    conditions.push(`u.supervisor_id = $${paramIndex++}`);
    params.push(filters.supervisorId);
  }

  if (filters.search) {
    conditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await db.query(
    `SELECT 
      u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.status,
      u.employee_id, u.facility_id, u.supervisor_id, u.created_at,
      f.name as facility_name,
      c.name as council_name,
      r.name as region_name
    FROM users u
    LEFT JOIN facilities f ON u.facility_id = f.id
    LEFT JOIN councils c ON f.council_id = c.id
    LEFT JOIN regions r ON c.region_id = r.id
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return result.rows.map(row => formatUserList(row));
}

/**
 * Count users with filters
 * 
 * @param {Object} filters - Query filters
 * @returns {Promise<number>} User count
 */
async function count(filters = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(filters.role);
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.facilityId) {
    conditions.push(`facility_id = $${paramIndex++}`);
    params.push(filters.facilityId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Update user
 * 
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
async function update(userId, updates) {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = [
    'email', 'first_name', 'last_name', 'phone', 'role', 'status',
    'facility_id', 'supervisor_id', 'employee_id', 'date_of_birth',
    'hire_date', 'avatar_url', 'preferences'
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

  params.push(userId);

  const result = await db.query(
    `UPDATE users 
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  return result.rows[0];
}

/**
 * Delete user (soft delete by setting status to inactive)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteUser(userId) {
  const result = await db.query(
    `UPDATE users SET status = 'inactive' WHERE id = $1`,
    [userId]
  );

  return result.rowCount > 0;
}

/**
 * Format user object with hierarchy
 * 
 * @param {Object} row - Database row
 * @returns {Object} Formatted user
 */
function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    status: row.status,
    employeeId: row.employee_id,
    dateOfBirth: row.date_of_birth,
    hireDate: row.hire_date,
    avatarUrl: row.avatar_url,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    facility: row.facility_id ? {
      id: row.facility_id,
      name: row.facility_name,
      code: row.facility_code,
      councilId: row.council_id
    } : null,
    council: row.council_id ? {
      id: row.council_id,
      name: row.council_name,
      code: row.council_code,
      regionId: row.region_id
    } : null,
    region: row.region_id ? {
      id: row.region_id,
      name: row.region_name,
      code: row.region_code
    } : null,
    supervisor: row.supervisor_id ? {
      id: row.supervisor_id,
      firstName: row.supervisor_first_name,
      lastName: row.supervisor_last_name,
      email: row.supervisor_email
    } : null
  };
}

/**
 * Format user for list view
 * 
 * @param {Object} row - Database row
 * @returns {Object} Formatted user
 */
function formatUserList(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    status: row.status,
    employeeId: row.employee_id,
    facilityName: row.facility_name,
    councilName: row.council_name,
    regionName: row.region_name,
    createdAt: row.created_at
  };
}

module.exports = {
  findById,
  findByEmail,
  findAll,
  count,
  update,
  deleteUser
};
