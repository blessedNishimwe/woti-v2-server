/**
 * Offline Sync Conflict Resolution Utility
 * 
 * Handles conflict resolution for offline-first attendance records
 * 
 * @module utils/syncResolver
 */

const logger = require('./logger');

/**
 * Resolve conflict between client and server records
 * 
 * @param {Object} clientRecord - Record from mobile client
 * @param {Object} serverRecord - Existing record on server
 * @param {string} strategy - Resolution strategy ('client_wins', 'server_wins', 'manual')
 * @returns {Object} Resolved record and metadata
 */
function resolveConflict(clientRecord, serverRecord, strategy = 'server_wins') {
  logger.info('Resolving sync conflict', {
    clientTimestamp: clientRecord.client_timestamp,
    serverTimestamp: serverRecord.server_timestamp,
    strategy
  });

  switch (strategy) {
    case 'client_wins':
      return {
        resolved: clientRecord,
        winner: 'client',
        reason: 'Client-wins strategy applied'
      };

    case 'server_wins':
      return {
        resolved: serverRecord,
        winner: 'server',
        reason: 'Server-wins strategy applied'
      };

    case 'manual':
      // For manual resolution, return both records for admin review
      return {
        resolved: null,
        winner: 'manual',
        reason: 'Manual resolution required',
        clientRecord,
        serverRecord
      };

    default:
      // Default to server wins for safety
      logger.warn('Unknown conflict resolution strategy, defaulting to server_wins', {
        strategy
      });
      return {
        resolved: serverRecord,
        winner: 'server',
        reason: 'Unknown strategy, defaulted to server_wins'
      };
  }
}

/**
 * Determine if records are in conflict
 * 
 * @param {Object} clientRecord - Record from mobile client
 * @param {Object} serverRecord - Existing record on server
 * @returns {boolean} True if records conflict
 */
function hasConflict(clientRecord, serverRecord) {
  // No server record means no conflict
  if (!serverRecord) {
    return false;
  }

  // Check if sync versions differ
  if (clientRecord.sync_version !== serverRecord.sync_version) {
    return true;
  }

  // Check if key fields differ
  const clientTime = new Date(clientRecord.clock_in).getTime();
  const serverTime = new Date(serverRecord.clock_in).getTime();
  
  if (Math.abs(clientTime - serverTime) > 60000) { // More than 1 minute difference
    return true;
  }

  // Check clock_out differences
  if (clientRecord.clock_out && serverRecord.clock_out) {
    const clientOutTime = new Date(clientRecord.clock_out).getTime();
    const serverOutTime = new Date(serverRecord.clock_out).getTime();
    
    if (Math.abs(clientOutTime - serverOutTime) > 60000) {
      return true;
    }
  }

  return false;
}

/**
 * Merge records using last-write-wins strategy
 * 
 * @param {Object} clientRecord - Record from mobile client
 * @param {Object} serverRecord - Existing record on server
 * @returns {Object} Merged record
 */
function mergeRecords(clientRecord, serverRecord) {
  const clientTimestamp = new Date(clientRecord.client_timestamp || clientRecord.updated_at).getTime();
  const serverTimestamp = new Date(serverRecord.server_timestamp || serverRecord.updated_at).getTime();

  // Use the most recent timestamp
  if (clientTimestamp > serverTimestamp) {
    return {
      ...serverRecord,
      ...clientRecord,
      sync_version: Math.max(clientRecord.sync_version || 1, serverRecord.sync_version || 1) + 1,
      merged: true,
      merge_timestamp: new Date().toISOString()
    };
  }

  return {
    ...clientRecord,
    ...serverRecord,
    sync_version: Math.max(clientRecord.sync_version || 1, serverRecord.sync_version || 1) + 1,
    merged: true,
    merge_timestamp: new Date().toISOString()
  };
}

/**
 * Validate sync metadata
 * 
 * @param {Object} record - Record to validate
 * @returns {Object} Validation result
 */
function validateSyncMetadata(record) {
  const errors = [];

  if (!record.device_id) {
    errors.push('Missing device_id');
  }

  if (!record.client_timestamp) {
    errors.push('Missing client_timestamp');
  }

  if (record.sync_version && typeof record.sync_version !== 'number') {
    errors.push('Invalid sync_version type');
  }

  if (record.conflict_resolution_strategy) {
    const validStrategies = ['client_wins', 'server_wins', 'manual'];
    if (!validStrategies.includes(record.conflict_resolution_strategy)) {
      errors.push('Invalid conflict_resolution_strategy');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create sync response for client
 * 
 * @param {Array} syncedRecords - Successfully synced records
 * @param {Array} conflicts - Records with conflicts
 * @param {Array} errors - Records with errors
 * @returns {Object} Sync response
 */
function createSyncResponse(syncedRecords, conflicts, errors) {
  return {
    success: true,
    synced: syncedRecords.length,
    conflicts: conflicts.length,
    errors: errors.length,
    timestamp: new Date().toISOString(),
    data: {
      synced: syncedRecords,
      conflicts,
      errors
    }
  };
}

module.exports = {
  resolveConflict,
  hasConflict,
  mergeRecords,
  validateSyncMetadata,
  createSyncResponse
};
