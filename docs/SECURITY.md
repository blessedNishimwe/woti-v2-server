# Security Documentation

## Security Checklist

### ✅ Implemented Security Measures

- [x] bcrypt password hashing (12 rounds)
- [x] JWT authentication with 24-hour expiry
- [x] Parameterized SQL queries (prevents SQL injection)
- [x] Role-based access control (RBAC)
- [x] Rate limiting on all endpoints
- [x] HTTPS enforcement (configurable)
- [x] CORS configuration
- [x] Helmet.js security headers
- [x] Input validation on all endpoints
- [x] Audit logging for critical operations
- [x] Secure session management
- [x] Password strength requirements
- [x] Graceful error handling (no sensitive data exposure)

## Authentication & Authorization

### Password Security

**Hashing**: bcrypt with 12 rounds (configurable via `BCRYPT_ROUNDS`)

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Password Storage**: Never stored in plain text, only bcrypt hashes stored in database.

### JWT Implementation

**Token Structure**:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "data_clerk",
  "facilityId": "uuid",
  "iat": 1234567890,
  "exp": 1234654290,
  "iss": "woti-attendance-v2",
  "aud": "woti-app"
}
```

**Token Lifecycle**:
- **Access Token**: 24-hour expiry
- **Refresh Token**: 7-day expiry
- **Algorithm**: HS256
- **Secret**: Stored in environment variable

**Token Transmission**: Sent via Authorization header: `Bearer <token>`

### Role-Based Access Control (RBAC)

**Role Hierarchy** (ascending permissions):
1. tester (level 1)
2. data_clerk (level 2)
3. focal (level 3)
4. ddo (level 4)
5. supervisor (level 5)
6. backstopper (level 6)
7. admin (level 7)

**Access Control**:
- Users can access own resources
- Supervisors can access supervised users' resources
- Admins have full access

**Implementation**:
```javascript
// Route protection example
router.post('/register', 
  authenticate,        // Verify JWT
  adminOnly,          // Check admin role
  validateInput,      // Validate request
  controller.register
);
```

## SQL Injection Prevention

**Parameterized Queries**: All database queries use parameterized statements:

```javascript
// ✅ SAFE
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ UNSAFE (never do this)
await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**Input Validation**: All user inputs validated before processing:
- Email format validation
- UUID format validation
- Coordinate range validation
- Enum value validation

## Rate Limiting

**General API**: 100 requests per 15 minutes
**Authentication**: 5 requests per 15 minutes
**File Upload**: 10 requests per 15 minutes
**Sync Endpoint**: 20 requests per 5 minutes

**Implementation**: express-rate-limit middleware

**Response on Limit**:
```json
{
  "success": false,
  "status": "error",
  "message": "Too many requests, please try again later"
}
```

## Input Validation

**Validation Layers**:
1. **express-validator**: Request validation middleware
2. **Custom validators**: Business logic validation
3. **Database constraints**: Final safety net

**Sanitization**:
- Trim whitespace
- Remove dangerous characters
- Normalize email addresses
- Validate data types

**Example**:
```javascript
body('email')
  .isEmail()
  .withMessage('Valid email required')
  .normalizeEmail()
  .trim()
```

## CORS Configuration

**Allowed Origins**: Configurable via `CORS_ORIGIN` environment variable

**Development**:
```
http://localhost:3001
http://localhost:19006 (React Native)
```

**Production**: Only production domains allowed

**Configuration**:
```javascript
{
  origin: ['https://app.woti.rw'],
  credentials: true
}
```

## HTTPS Enforcement

**Production**: Force HTTPS via `FORCE_HTTPS=true` environment variable

**Implementation**: Helmet middleware with HSTS enabled

**Certificate**: Use Let's Encrypt or commercial SSL certificate

## Audit Logging

**Activities Table**: Tracks all critical operations

**Logged Actions**:
- User registration
- Login attempts (success/failure)
- User updates
- Clock in/out
- Facility imports
- Data modifications

**Log Entry Structure**:
```javascript
{
  user_id: 'uuid',
  action: 'LOGIN_SUCCESS',
  entity_type: 'user',
  entity_id: 'uuid',
  description: 'User logged in',
  ip_address: '192.168.1.1',
  metadata: { /* additional context */ },
  created_at: '2024-01-01T10:00:00Z'
}
```

## Error Handling

**Security Principles**:
- Never expose stack traces in production
- Never reveal database schema details
- Use generic error messages for security failures
- Log detailed errors server-side

**Production Error Response**:
```json
{
  "success": false,
  "status": "error",
  "message": "An error occurred"
}
```

**Development Error Response** (includes debugging info):
```json
{
  "success": false,
  "status": "error",
  "message": "Detailed error message",
  "stack": "Error stack trace...",
  "error": { /* error object */ }
}
```

## Database Security

**Connection Security**:
- SSL/TLS enabled in production
- Connection pooling (20-100 connections)
- Timeout configurations
- Graceful connection cleanup

**User Permissions**:
- Application uses dedicated database user
- Principle of least privilege
- No DDL permissions for application user
- Read-only replica for reports (optional)

**Backup Security**:
- Encrypted backups
- Secure backup storage
- Regular backup testing
- Point-in-time recovery enabled

## Secrets Management

**Environment Variables**: All secrets in `.env` file (not committed)

**Required Secrets**:
- `JWT_SECRET` - JWT signing key
- `JWT_REFRESH_SECRET` - Refresh token key
- `DB_PASSWORD` - Database password
- `SESSION_SECRET` - Session encryption key

**Production**: Use secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)

**Secret Rotation**: Plan for periodic secret rotation

## API Security Headers

**Helmet.js**: Automatic security headers

**Headers Applied**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

## File Upload Security

**Validation**:
- File type checking (CSV, Excel only)
- File size limit (10MB default)
- Filename sanitization
- Virus scanning (implement if needed)

**Storage**:
- Files stored outside web root
- Temporary files cleaned up after processing
- No execution permissions on upload directory

## Session Management

**Token Invalidation**: Implement token blacklist for logout

**Password Change**: Invalidate all sessions on password change

**Concurrent Sessions**: Track and limit concurrent sessions per user

## Vulnerability Management

### Known Vulnerabilities

Currently: None identified

### Dependency Management

**Tools**:
- `npm audit` - Automated vulnerability scanning
- Dependabot - Automated dependency updates
- Regular manual reviews

**Process**:
1. Monthly security audits
2. Immediate patching of critical vulnerabilities
3. Testing after updates
4. Security-focused code reviews

## Incident Response

### Security Incident Plan

1. **Detection**: Monitor logs and alerts
2. **Assessment**: Determine severity and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve

### Contact

Security issues: security@woti.rw (implement actual contact)

## Compliance

### Data Protection

- User consent for data collection
- Right to data deletion
- Data minimization
- Purpose limitation

### Audit Trail

- Complete activity logs
- Immutable audit records
- Log retention policy
- Regular audit reviews

## Security Best Practices

### For Developers

1. Never commit secrets to version control
2. Always use parameterized queries
3. Validate all inputs
4. Use HTTPS in production
5. Keep dependencies updated
6. Review code for security issues
7. Test authentication flows
8. Implement proper error handling

### For Administrators

1. Use strong passwords
2. Enable 2FA (when implemented)
3. Regular security audits
4. Monitor failed login attempts
5. Review audit logs
6. Keep backups secure
7. Rotate secrets periodically
8. Test disaster recovery

### For Users

1. Use unique, strong passwords
2. Never share credentials
3. Log out when finished
4. Report suspicious activity
5. Keep devices secure
6. Use official apps only

## Security Roadmap

### Planned Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Account lockout after failed attempts
- [ ] IP whitelisting for admin accounts
- [ ] Enhanced session management
- [ ] Security information and event management (SIEM)
- [ ] Automated penetration testing
- [ ] Bug bounty program
- [ ] Web Application Firewall (WAF)
- [ ] DDoS protection
- [ ] Advanced threat detection

## Security Testing

### Regular Security Tests

1. **Penetration Testing**: Annual professional audit
2. **Vulnerability Scanning**: Monthly automated scans
3. **Code Review**: Security-focused code reviews
4. **Dependency Audits**: Weekly npm audit runs
5. **Authentication Testing**: Login flow security tests
6. **Authorization Testing**: Access control verification

### Test Checklist

- [ ] SQL injection attempts
- [ ] XSS attack vectors
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts
- [ ] Session hijacking
- [ ] Rate limit effectiveness
- [ ] Input validation coverage
- [ ] Error message information disclosure
- [ ] Sensitive data exposure

## Responsible Disclosure

If you discover a security vulnerability:

1. **DO NOT** disclose publicly
2. Email security@woti.rw with details
3. Allow 90 days for remediation
4. Receive acknowledgment and updates
5. Get credited (if desired) after fix

## Conclusion

Security is an ongoing process. This document should be reviewed and updated regularly as new threats emerge and the application evolves.

**Last Updated**: 2024-01-01
**Next Review**: 2024-04-01
