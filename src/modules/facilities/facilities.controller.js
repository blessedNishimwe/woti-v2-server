/**
 * Facilities Controller
 * 
 * Handles HTTP requests for facility management endpoints
 * 
 * @module modules/facilities/facilities.controller
 */

const facilitiesService = require('./facilities.service');
const { asyncHandler } = require('../../middleware/errorHandler.middleware');

/**
 * Get all facilities
 * GET /api/facilities
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllFacilities = asyncHandler(async (req, res) => {
  const {
    councilId,
    regionId,
    status,
    type,
    search,
    page = 1,
    limit = 50
  } = req.query;

  const filters = {
    councilId,
    regionId,
    status,
    type,
    search
  };

  const result = await facilitiesService.getAllFacilities(
    filters,
    parseInt(page, 10),
    parseInt(limit, 10)
  );

  res.status(200).json({
    success: true,
    data: result.facilities,
    pagination: result.pagination
  });
});

/**
 * Get facility by ID
 * GET /api/facilities/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFacilityById = asyncHandler(async (req, res) => {
  const facility = await facilitiesService.getFacilityById(req.params.id);

  res.status(200).json({
    success: true,
    data: facility
  });
});

/**
 * Import facilities from CSV/Excel
 * POST /api/facilities/import
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const importFacilities = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const result = await facilitiesService.importFacilities(
    req.file.path,
    req.file.mimetype
  );

  res.status(200).json({
    success: true,
    message: 'Facilities import completed',
    data: result
  });
});

module.exports = {
  getAllFacilities,
  getFacilityById,
  importFacilities
};
