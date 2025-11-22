# Offline Sync Design

## Overview

The WOTI Attendance v2 system supports offline-first attendance recording for mobile clients in areas with poor connectivity. The sync design ensures data consistency while resolving conflicts automatically.

## Sync Metadata

Each attendance record includes metadata for offline sync:

```json
{
  "synced": false,
  "client_timestamp": "2024-01-01T08:00:00Z",
  "server_timestamp": null,
  "device_id": "unique_device_identifier",
  "sync_version": 1,
  "conflict_resolution_strategy": "server_wins",
  "metadata": {
    "app_version": "1.0.0",
    "platform": "android"
  }
}
```

### Metadata Fields

- **synced** (boolean): Whether record has been synced to server
- **client_timestamp** (timestamp): When record was created on device
- **server_timestamp** (timestamp): When server received the record
- **device_id** (string): Unique device identifier for tracking
- **sync_version** (integer): Version number for conflict detection
- **conflict_resolution_strategy** (enum): How to resolve conflicts
  - `client_wins`: Mobile data takes precedence
  - `server_wins`: Server data takes precedence (default)
  - `manual`: Flag for manual admin review

## Sync Protocol

### 1. Client-Side Storage

Mobile clients store attendance records locally:

```javascript
// Example local storage structure
{
  "pending_sync": [
    {
      "id": "local_uuid",
      "facilityId": "uuid",
      "clockIn": "2024-01-01T08:00:00Z",
      "clockOut": "2024-01-01T17:00:00Z",
      "latitude": -1.9536,
      "longitude": 30.0606,
      "device_id": "device_123",
      "client_timestamp": "2024-01-01T08:00:00Z",
      "sync_version": 1
    }
  ]
}
```

### 2. Sync Request

Client sends bulk sync request when connectivity restored:

```http
POST /api/attendance/sync
Authorization: Bearer <jwt_token>

{
  "records": [
    {
      "facilityId": "uuid",
      "clockIn": "2024-01-01T08:00:00Z",
      "clockOut": "2024-01-01T17:00:00Z",
      "clockInLatitude": -1.9536,
      "clockInLongitude": 30.0606,
      "deviceId": "device_123",
      "clientTimestamp": "2024-01-01T08:00:00Z",
      "syncVersion": 1,
      "conflictResolutionStrategy": "server_wins"
    }
  ]
}
```

### 3. Server Processing

Server processes each record:

1. **Validate Metadata**: Check required fields
2. **Check Duplicates**: Query by `device_id` + `client_timestamp`
3. **Detect Conflicts**: Compare sync versions and timestamps
4. **Resolve Conflicts**: Apply resolution strategy
5. **Store Record**: Insert or update database
6. **Return Response**: Sync results to client

### 4. Sync Response

```json
{
  "success": true,
  "synced": 10,
  "conflicts": 0,
  "errors": 0,
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "synced": [
      {"id": "uuid", "action": "created"},
      {"id": "uuid", "action": "updated"}
    ],
    "conflicts": [],
    "errors": []
  }
}
```

## Conflict Detection

### Conflict Scenarios

1. **Time Mismatch**: Clock in/out times differ by > 1 minute
2. **Version Mismatch**: Sync versions don't match
3. **Dual Modification**: Both client and server modified same record

### Detection Algorithm

```javascript
function hasConflict(clientRecord, serverRecord) {
  // No server record = no conflict
  if (!serverRecord) return false;
  
  // Version mismatch
  if (clientRecord.syncVersion !== serverRecord.syncVersion) {
    return true;
  }
  
  // Timestamp difference > 1 minute
  const timeDiff = Math.abs(
    new Date(clientRecord.clockIn) - 
    new Date(serverRecord.clockIn)
  );
  if (timeDiff > 60000) return true;
  
  return false;
}
```

## Conflict Resolution

### Strategy 1: Server Wins (Default)

Server data is authoritative. Client data discarded.

**Use Case**: Central management control, prevent user manipulation

**Implementation**:
```javascript
if (strategy === 'server_wins') {
  return serverRecord;
}
```

### Strategy 2: Client Wins

Mobile data takes precedence. Useful for field corrections.

**Use Case**: Field staff knows correct data

**Implementation**:
```javascript
if (strategy === 'client_wins') {
  return {
    ...clientRecord,
    syncVersion: serverRecord.syncVersion + 1
  };
}
```

### Strategy 3: Manual Resolution

Flagged for administrator review.

**Use Case**: Critical data discrepancies

**Implementation**:
```javascript
if (strategy === 'manual') {
  // Store both versions
  await storeConflict({
    clientRecord,
    serverRecord,
    status: 'pending_review'
  });
}
```

## Batch Sync Optimization

### Chunking

Large sync batches split into chunks:

```javascript
const CHUNK_SIZE = 50;
const chunks = [];

for (let i = 0; i < records.length; i += CHUNK_SIZE) {
  chunks.push(records.slice(i, i + CHUNK_SIZE));
}

// Process each chunk
for (const chunk of chunks) {
  await syncChunk(chunk);
}
```

### Rate Limiting

- **Limit**: 20 sync requests per 5 minutes per user
- **Prevents**: Server overload from aggressive retry logic
- **Response**: 429 Too Many Requests with retry-after header

### Retry Strategy

Mobile clients implement exponential backoff:

```javascript
async function syncWithRetry(records, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sync(records);
    } catch (error) {
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await sleep(delay);
    }
  }
  throw new Error('Sync failed after retries');
}
```

## Client-Side Requirements

### Local Database Schema

```sql
CREATE TABLE attendance_local (
  id TEXT PRIMARY KEY,
  facility_id TEXT,
  clock_in TEXT,
  clock_out TEXT,
  latitude REAL,
  longitude REAL,
  device_id TEXT,
  client_timestamp TEXT,
  sync_version INTEGER DEFAULT 1,
  synced INTEGER DEFAULT 0,
  sync_attempts INTEGER DEFAULT 0,
  last_sync_attempt TEXT
);
```

### Sync Queue Management

1. **Priority**: Oldest records synced first
2. **Failed Records**: Retry with exponential backoff
3. **Max Attempts**: 5 attempts before manual intervention
4. **Cleanup**: Remove successfully synced records after confirmation

### Background Sync

```javascript
// Service worker or background task
setInterval(async () => {
  if (isOnline() && hasToken()) {
    const pending = await getPendingRecords();
    if (pending.length > 0) {
      await syncRecords(pending);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

## Performance Considerations

### Database Indexes

Optimized queries for sync operations:

```sql
-- Find duplicates
CREATE INDEX idx_attendance_device_client ON attendance(device_id, client_timestamp);

-- Sync status queries
CREATE INDEX idx_attendance_synced ON attendance(synced);

-- User sync history
CREATE INDEX idx_attendance_user_synced ON attendance(user_id, synced);
```

### Bulk Insert Optimization

```javascript
// Transaction for atomic bulk insert
async function bulkInsert(records) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const record of records) {
      await client.query(INSERT_QUERY, values);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Security Considerations

1. **Authentication**: JWT required for all sync requests
2. **User Isolation**: Users can only sync their own records
3. **Facility Validation**: Verify user has access to facility
4. **Timestamp Validation**: Reject records with future timestamps
5. **Rate Limiting**: Prevent abuse via excessive sync requests
6. **Audit Trail**: Log all sync operations in activities table

## Monitoring & Debugging

### Metrics to Track

- Sync success rate
- Average sync latency
- Conflict frequency
- Failed sync reasons
- Records pending sync (per user)

### Logging

```javascript
logger.info('Offline sync completed', {
  userId,
  synced: synced.length,
  conflicts: conflicts.length,
  errors: errors.length,
  duration: Date.now() - startTime
});
```

### Admin Dashboard

Provide visibility into:
- Pending sync records across all users
- Conflict records requiring manual resolution
- Sync failure patterns
- Device-specific issues

## Future Enhancements

1. **Differential Sync**: Only sync changed fields
2. **Compression**: Compress large sync payloads
3. **Delta Encoding**: Send only differences
4. **WebSocket**: Real-time sync notifications
5. **Conflict UI**: Admin interface for manual resolution
6. **Smart Merging**: ML-based conflict resolution
