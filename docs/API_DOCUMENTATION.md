# API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-production-url.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### POST /auth/register
Register a new user (Admin only)

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "data_clerk",
  "facilityId": "uuid",
  "supervisorId": "uuid",
  "phone": "+250788123456",
  "employeeId": "EMP001"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "data_clerk"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": "24h"
    }
  }
}
```

### POST /auth/login
Login user

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "data_clerk"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": "24h"
    }
  }
}
```

### POST /auth/refresh
Refresh access token

**Request Body**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "expiresIn": "24h"
  }
}
```

### GET /auth/me
Get current user profile

**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "data_clerk",
    "facility": {
      "id": "uuid",
      "name": "Health Center A"
    },
    "council": {
      "id": "uuid",
      "name": "Gasabo"
    },
    "region": {
      "id": "uuid",
      "name": "City of Kigali"
    }
  }
}
```

## Users

### GET /users/me
Get current user with full hierarchy

**Authentication**: Required

**Response (200)**: Same as GET /auth/me

### GET /users
List all users with filters

**Authentication**: Required (Admin, Supervisor, Backstopper)

**Query Parameters**:
- `role` - Filter by role
- `status` - Filter by status
- `facilityId` - Filter by facility
- `supervisorId` - Filter by supervisor
- `search` - Search by name or email
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response (200)**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### GET /users/:id
Get user by ID

**Authentication**: Required

**Response (200)**: User object with full hierarchy

### PUT /users/:id
Update user

**Authentication**: Required (Self or Admin)

**Request Body**: Any updateable user fields

### DELETE /users/:id
Delete user (soft delete)

**Authentication**: Required (Admin only)

## Facilities

### POST /facilities/import
Import facilities from CSV/Excel

**Authentication**: Required (Admin only)

**Request**: Multipart form-data with file

**CSV/Excel Format**:
```csv
name,code,type,latitude,longitude,council_name,address,contact_phone
Health Center A,HC001,Health Center,-1.9536,30.0606,Gasabo,Kigali,+250788123456
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Facilities import completed",
  "data": {
    "total": 100,
    "successful": 95,
    "failed": 5,
    "errors": [...]
  }
}
```

### GET /facilities
List all facilities

**Authentication**: Required

**Query Parameters**: `councilId`, `regionId`, `status`, `type`, `search`, `page`, `limit`

### GET /facilities/:id
Get facility by ID with hierarchy

**Authentication**: Required

## Attendance

### POST /attendance/clock-in
Clock in

**Authentication**: Required

**Request Body**:
```json
{
  "facilityId": "uuid",
  "latitude": -1.9536,
  "longitude": 30.0606,
  "notes": "Optional notes",
  "deviceId": "device_unique_id",
  "clientTimestamp": "2024-01-01T08:00:00Z"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "facilityId": "uuid",
    "clockIn": "2024-01-01T08:00:00Z",
    "status": "clocked_in"
  }
}
```

### POST /attendance/clock-out
Clock out

**Authentication**: Required

**Request Body**:
```json
{
  "attendanceId": "uuid",
  "latitude": -1.9536,
  "longitude": 30.0606,
  "notes": "Optional notes",
  "clockOut": "2024-01-01T17:00:00Z"
}
```

### GET /attendance/my-records
Get user's attendance history

**Authentication**: Required

**Query Parameters**: `startDate`, `endDate`, `status`, `page`, `limit`

**Response (200)**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### POST /attendance/sync
Bulk sync offline records

**Authentication**: Required

**Request Body**:
```json
{
  "records": [
    {
      "facilityId": "uuid",
      "clockIn": "2024-01-01T08:00:00Z",
      "clockOut": "2024-01-01T17:00:00Z",
      "clockInLatitude": -1.9536,
      "clockInLongitude": 30.0606,
      "deviceId": "device_id",
      "clientTimestamp": "2024-01-01T08:00:00Z",
      "syncVersion": 1,
      "conflictResolutionStrategy": "server_wins"
    }
  ]
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Sync completed",
  "data": {
    "success": true,
    "synced": 10,
    "conflicts": 0,
    "errors": 0,
    "timestamp": "2024-01-01T10:00:00Z"
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "status": "error",
  "message": "Error description"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- File uploads: 10 requests per 15 minutes
- Sync endpoint: 20 requests per 5 minutes
