/**
 * Facilities Repository
 * 
 * Database queries for facilities
 * 
 * @module modules/facilities/facilities.repository
 */

const db = require('../../config/database');

/**
 * Find facility by ID with hierarchy
 * 
 * @param {string} facilityId - Facility ID
 * @returns {Promise<Object|null>} Facility object or null
 */
async function findById(facilityId) {
  const result = await db.query(
    `SELECT 
      f.id, f.name, f.code, f.type, f.latitude, f.longitude,
      f.address, f.contact_phone, f.contact_email, f.status,
      f.metadata, f.created_at, f.updated_at,
      c.id as council_id, c.name as council_name, c.code as council_code,
      r.id as region_id, r.name as region_name, r.code as region_code
    FROM facilities f
    INNER JOIN councils c ON f.council_id = c.id
    INNER JOIN regions r ON c.region_id = r.id
    WHERE f.id = $1`,
    [facilityId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return formatFacility(result.rows[0]);
}

/**
 * Find all facilities with filters
 * 
 * @param {Object} filters - Query filters
 * @param {number} limit - Result limit
 * @param {number} offset - Result offset
 * @returns {Promise<Array>} Array of facilities
 */
async function findAll(filters = {}, limit = 50, offset = 0) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.councilId) {
    conditions.push(`f.council_id = $${paramIndex++}`);
    params.push(filters.councilId);
  }

  if (filters.regionId) {
    conditions.push(`r.id = $${paramIndex++}`);
    params.push(filters.regionId);
  }

  if (filters.status) {
    conditions.push(`f.status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.type) {
    conditions.push(`f.type = $${paramIndex++}`);
    params.push(filters.type);
  }

  if (filters.search) {
    conditions.push(`(f.name ILIKE $${paramIndex} OR f.code ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await db.query(
    `SELECT 
      f.id, f.name, f.code, f.type, f.latitude, f.longitude,
      f.status, f.created_at,
      c.id as council_id, c.name as council_name,
      r.id as region_id, r.name as region_name
    FROM facilities f
    INNER JOIN councils c ON f.council_id = c.id
    INNER JOIN regions r ON c.region_id = r.id
    ${whereClause}
    ORDER BY f.name ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return result.rows.map(row => formatFacilityList(row));
}

/**
 * Count facilities with filters
 * 
 * @param {Object} filters - Query filters
 * @returns {Promise<number>} Facility count
 */
async function count(filters = {}) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.councilId) {
    conditions.push(`council_id = $${paramIndex++}`);
    params.push(filters.councilId);
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT COUNT(*) FROM facilities ${whereClause}`,
    params
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Create facility
 * 
 * @param {Object} facilityData - Facility data
 * @returns {Promise<Object>} Created facility
 */
async function create(facilityData) {
  const result = await db.query(
    `INSERT INTO facilities (
      council_id, name, code, type, latitude, longitude,
      address, contact_phone, contact_email, status, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      facilityData.councilId,
      facilityData.name,
      facilityData.code || null,
      facilityData.type || null,
      facilityData.latitude || null,
      facilityData.longitude || null,
      facilityData.address || null,
      facilityData.contactPhone || null,
      facilityData.contactEmail || null,
      facilityData.status || 'active',
      facilityData.metadata || {}
    ]
  );

  return result.rows[0];
}

/**
 * Bulk insert facilities
 * 
 * @param {Array} facilities - Array of facility data
 * @returns {Promise<Array>} Created facilities
 */
async function bulkInsert(facilities) {
  const client = await db.getClient();
  const inserted = [];

  try {
    await client.query('BEGIN');

    for (const facility of facilities) {
      const result = await client.query(
        `INSERT INTO facilities (
          council_id, name, code, type, latitude, longitude,
          address, contact_phone, contact_email, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude
        RETURNING *`,
        [
          facility.councilId,
          facility.name,
          facility.code || null,
          facility.type || null,
          facility.latitude || null,
          facility.longitude || null,
          facility.address || null,
          facility.contactPhone || null,
          facility.contactEmail || null,
          facility.status || 'active',
          facility.metadata || {}
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
 * Format facility with hierarchy
 * 
 * @param {Object} row - Database row
 * @returns {Object} Formatted facility
 */
function formatFacility(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    address: row.address,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    council: {
      id: row.council_id,
      name: row.council_name,
      code: row.council_code
    },
    region: {
      id: row.region_id,
      name: row.region_name,
      code: row.region_code
    }
  };
}

/**
 * Format facility for list view
 * 
 * @param {Object} row - Database row
 * @returns {Object} Formatted facility
 */
function formatFacilityList(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    status: row.status,
    councilName: row.council_name,
    regionName: row.region_name,
    createdAt: row.created_at
  };
}

module.exports = {
  findById,
  findAll,
  count,
  create,
  bulkInsert
};
