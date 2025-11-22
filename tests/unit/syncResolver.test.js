/**
 * Unit Tests for Sync Resolver
 */

const syncResolver = require('../../src/utils/syncResolver');

describe('Sync Resolver', () => {
  describe('resolveConflict', () => {
    const clientRecord = {
      id: '1',
      clock_in: '2023-01-01T10:00:00Z',
      client_timestamp: '2023-01-01T10:00:00Z'
    };

    const serverRecord = {
      id: '1',
      clock_in: '2023-01-01T09:50:00Z',
      server_timestamp: '2023-01-01T09:55:00Z'
    };

    it('should resolve with client_wins strategy', () => {
      const result = syncResolver.resolveConflict(
        clientRecord,
        serverRecord,
        'client_wins'
      );

      expect(result.winner).toBe('client');
      expect(result.resolved).toEqual(clientRecord);
    });

    it('should resolve with server_wins strategy', () => {
      const result = syncResolver.resolveConflict(
        clientRecord,
        serverRecord,
        'server_wins'
      );

      expect(result.winner).toBe('server');
      expect(result.resolved).toEqual(serverRecord);
    });

    it('should handle manual resolution', () => {
      const result = syncResolver.resolveConflict(
        clientRecord,
        serverRecord,
        'manual'
      );

      expect(result.winner).toBe('manual');
      expect(result.resolved).toBeNull();
      expect(result.clientRecord).toBeDefined();
      expect(result.serverRecord).toBeDefined();
    });
  });

  describe('validateSyncMetadata', () => {
    it('should validate valid metadata', () => {
      const record = {
        device_id: 'device123',
        client_timestamp: '2023-01-01T10:00:00Z',
        sync_version: 1,
        conflict_resolution_strategy: 'server_wins'
      };

      const result = syncResolver.validateSyncMetadata(record);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing device_id', () => {
      const record = {
        client_timestamp: '2023-01-01T10:00:00Z'
      };

      const result = syncResolver.validateSyncMetadata(record);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createSyncResponse', () => {
    it('should create proper sync response', () => {
      const synced = [{ id: '1' }, { id: '2' }];
      const conflicts = [{ id: '3' }];
      const errors = [];

      const response = syncResolver.createSyncResponse(synced, conflicts, errors);

      expect(response.success).toBe(true);
      expect(response.synced).toBe(2);
      expect(response.conflicts).toBe(1);
      expect(response.errors).toBe(0);
      expect(response.data.synced).toEqual(synced);
    });
  });
});
