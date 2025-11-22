/**
 * Facilities Service
 * 
 * Business logic for facility management and CSV/Excel import
 * 
 * @module modules/facilities/facilities.service
 */

const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs').promises;
const facilitiesRepository = require('./facilities.repository');
const db = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler.middleware');
const validators = require('../../utils/validators');
const logger = require('../../utils/logger');

/**
 * Get facility by ID
 * 
 * @param {string} facilityId - Facility ID
 * @returns {Promise<Object>} Facility object
 */
async function getFacilityById(facilityId) {
  const facility = await facilitiesRepository.findById(facilityId);
  
  if (!facility) {
    throw new AppError('Facility not found', 404);
  }
  
  return facility;
}

/**
 * Get all facilities with pagination and filters
 * 
 * @param {Object} filters - Query filters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Facilities and pagination info
 */
async function getAllFacilities(filters = {}, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  
  const [facilities, total] = await Promise.all([
    facilitiesRepository.findAll(filters, limit, offset),
    facilitiesRepository.count(filters)
  ]);
  
  return {
    facilities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Parse CSV file
 * 
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Parsed records
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('fs').createReadStream(filePath);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Parse Excel file
 * 
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} Parsed records
 */
async function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
}

/**
 * Validate and normalize facility data
 * 
 * @param {Object} row - Raw facility data
 * @returns {Object} Validated facility data
 */
function validateFacilityRow(row) {
  const errors = [];
  
  // Required fields
  if (!row.name || !row.name.trim()) {
    errors.push('Missing facility name');
  }
  
  if (!row.council_name && !row.councilName && !row.council_id && !row.councilId) {
    errors.push('Missing council information');
  }
  
  // Validate coordinates if provided
  const lat = parseFloat(row.latitude || row.lat);
  const lon = parseFloat(row.longitude || row.lon || row.lng);
  
  if ((lat || lon) && !validators.isValidCoordinates(lat, lon)) {
    errors.push(`Invalid coordinates: ${lat}, ${lon}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: (row.name || '').trim(),
      code: (row.code || row.facility_code || '').trim() || null,
      type: (row.type || row.facility_type || '').trim() || null,
      latitude: lat || null,
      longitude: lon || null,
      address: (row.address || '').trim() || null,
      contactPhone: (row.contact_phone || row.phone || '').trim() || null,
      contactEmail: (row.contact_email || row.email || '').trim() || null,
      councilName: (row.council_name || row.councilName || '').trim(),
      councilId: row.council_id || row.councilId || null
    }
  };
}

/**
 * Import facilities from CSV/Excel file
 * 
 * @param {string} filePath - Path to import file
 * @param {string} mimeType - File MIME type
 * @returns {Promise<Object>} Import results
 */
async function importFacilities(filePath, mimeType) {
  let records;
  
  // Parse file based on type
  if (mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel') {
    records = await parseCSV(filePath);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    records = await parseExcel(filePath);
  } else {
    throw new AppError('Unsupported file format', 400);
  }
  
  logger.info('Parsed import file', { recordCount: records.length });
  
  const results = {
    total: records.length,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  const facilitiesToInsert = [];
  
  // Validate all records first
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const validation = validateFacilityRow(row);
    
    if (!validation.isValid) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        errors: validation.errors,
        data: row
      });
      continue;
    }
    
    // Get council ID if not provided
    if (!validation.data.councilId && validation.data.councilName) {
      const councilResult = await db.query(
        'SELECT id FROM councils WHERE name ILIKE $1 LIMIT 1',
        [validation.data.councilName]
      );
      
      if (councilResult.rows.length === 0) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          errors: [`Council not found: ${validation.data.councilName}`],
          data: row
        });
        continue;
      }
      
      validation.data.councilId = councilResult.rows[0].id;
    }
    
    facilitiesToInsert.push(validation.data);
  }
  
  // Bulk insert valid facilities
  if (facilitiesToInsert.length > 0) {
    try {
      const inserted = await facilitiesRepository.bulkInsert(facilitiesToInsert);
      results.successful = inserted.length;
      
      logger.info('Facilities imported successfully', {
        successful: results.successful,
        failed: results.failed
      });
    } catch (error) {
      logger.error('Bulk insert failed', { error: error.message });
      throw new AppError('Failed to import facilities', 500);
    }
  }
  
  // Clean up uploaded file
  try {
    await fs.unlink(filePath);
  } catch (error) {
    logger.warn('Failed to delete uploaded file', { filePath });
  }
  
  return results;
}

module.exports = {
  getFacilityById,
  getAllFacilities,
  importFacilities
};
