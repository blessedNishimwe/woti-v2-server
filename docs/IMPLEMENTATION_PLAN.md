# Implementation Plan

## Overview

This document outlines the detailed implementation plan for the WOTI Attendance v2 backend system, covering all phases from database setup to deployment.

## Phase 1: Database Setup (Completed)

### 1.1 Schema Creation
- ✅ Created 6 core tables (regions, councils, facilities, users, attendance, activities)
- ✅ Implemented UUID primary keys across all tables
- ✅ Added foreign key constraints with appropriate CASCADE/SET NULL rules
- ✅ Created CHECK constraints for enums and data validation
- ✅ Implemented coordinate validation constraints

### 1.2 Indexes & Performance
- ✅ Created indexes on frequently queried columns
- ✅ Composite indexes for common query patterns
- ✅ Geolocation indexes for coordinate-based queries

### 1.3 Triggers
- ✅ Implemented auto-update trigger for `updated_at` columns
- ✅ Applied triggers to all tables with timestamps

### 1.4 Seed Data
- ✅ Rwanda regions (5 regions)
- ✅ Districts/councils (30 districts)
- ✅ Initial admin user with default credentials

### 1.5 Migration Strategy

**Up Migrations**:
```bash
npm run migrate:up
```

**Down Migrations**:
Implement rollback scripts for each migration

**Version Control**:
- Track migrations in `database/migrations/`
- Sequential numbering: `001_`, `002_`, etc.
- Descriptive names: `001_initial_schema.sql`

### 1.6 Backup Strategy

**Automated Daily Backups**:
```bash
pg_dump -Fc woti_attendance > backup_$(date +%Y%m%d).dump
```

**Point-in-Time Recovery**:
- Enable WAL archiving
- Configure archive_mode and archive_command
- Test recovery procedures

**Backup Retention**:
- Daily: Keep 7 days
- Weekly: Keep 4 weeks
- Monthly: Keep 12 months

## Phase 2: Core Infrastructure (Completed)

### 2.1 Connection Pooling
- ✅ pg Pool configuration (20-100 connections)
- ✅ Connection timeout: 3 seconds
- ✅ Idle timeout: 10 seconds
- ✅ Graceful shutdown handling
- ✅ Pool monitoring and logging

### 2.2 PgBouncer Integration
- ✅ Docker compose configuration
- ✅ Transaction pooling mode
- ✅ Max client connections: 1,000
- ✅ Connection pooling: 25-100 per database

### 2.3 Error Handling
- ✅ Centralized error middleware
- ✅ Custom AppError class
- ✅ PostgreSQL error mapping
- ✅ JWT error handling
- ✅ Validation error formatting
- ✅ Production vs development error responses

### 2.4 Logging Strategy
- ✅ Winston logger configuration
- ✅ Log levels: error, warn, info, debug
- ✅ File rotation (10MB max, 5 files)
- ✅ Structured JSON logging
- ✅ Request/response logging
- ✅ Error stack traces

## Phase 3: Authentication Module (Completed)

### 3.1 Password Service
- ✅ bcrypt hashing (12 rounds)
- ✅ Password comparison
- ✅ Strength validation
- ✅ Unit tests

### 3.2 JWT Implementation
- ✅ Access token generation (24h expiry)
- ✅ Refresh token generation (7d expiry)
- ✅ Token verification
- ✅ Token payload structure
- ✅ Algorithm: HS256

### 3.3 Authentication Middleware
- ✅ JWT verification
- ✅ User attachment to request
- ✅ Token expiry handling
- ✅ Optional authentication

### 3.4 Authorization Middleware
- ✅ Role-based access control
- ✅ Minimum role level checking
- ✅ Self-or-admin authorization
- ✅ Supervisor authorization

### 3.5 Rate Limiting
- ✅ General API: 100/15min
- ✅ Auth endpoints: 5/15min
- ✅ Upload endpoints: 10/15min
- ✅ Sync endpoints: 20/5min

## Phase 4: User & Facility Management (Completed)

### 4.1 Users Module
- ✅ User repository with parameterized queries
- ✅ User service with business logic
- ✅ User controller and routes
- ✅ Full hierarchy queries (facility → council → region)
- ✅ Supervisor relationship handling
- ✅ User search and filtering

### 4.2 Facilities Module
- ✅ Facility repository
- ✅ CSV/Excel import service
- ✅ Latitude/longitude validation
- ✅ Council lookup and validation
- ✅ Bulk insert operations
- ✅ Duplicate handling

### 4.3 Import Functionality
**CSV Format**:
```csv
name,code,type,latitude,longitude,council_name,address,phone
Health Center A,HC001,Hospital,-1.9536,30.0606,Gasabo,Kigali,+250788123456
```

**Excel Support**: XLSX format via `xlsx` library

**Validation**:
- Required fields check
- Coordinate validation
- Council existence verification
- Duplicate code handling

## Phase 5: Attendance & Offline Sync (Completed)

### 5.1 Attendance Repository
- ✅ Clock in/out operations
- ✅ Active attendance lookup
- ✅ User attendance history
- ✅ Bulk insert for sync

### 5.2 Sync Metadata
- ✅ `synced` boolean flag
- ✅ `client_timestamp` tracking
- ✅ `server_timestamp` recording
- ✅ `device_id` identification
- ✅ `sync_version` for conflicts
- ✅ `conflict_resolution_strategy`

### 5.3 Conflict Resolution
**Strategies**:
1. **server_wins** (default): Server data authoritative
2. **client_wins**: Mobile data takes precedence
3. **manual**: Admin review required

**Implementation**:
- Conflict detection algorithm
- Strategy application
- Version incrementing
- Audit logging

### 5.4 Sync Protocol
1. Client sends batch of records
2. Server validates each record
3. Check for duplicates (device_id + client_timestamp)
4. Detect conflicts
5. Apply resolution strategy
6. Store records
7. Return sync response

## Phase 6: Testing Strategy

### 6.1 Unit Tests (Partially Complete)
**Completed**:
- ✅ Password service tests
- ✅ Validators tests
- ✅ Sync resolver tests

**To Do**:
- [ ] Auth service tests
- [ ] Users service tests
- [ ] Facilities service tests
- [ ] Attendance service tests

### 6.2 Integration Tests (To Do)
**Priority Endpoints**:
- [ ] POST /api/auth/login
- [ ] POST /api/auth/register
- [ ] GET /api/users/me
- [ ] POST /api/attendance/clock-in
- [ ] POST /api/attendance/sync
- [ ] POST /api/facilities/import

**Test Database**: Separate test database with automated setup/teardown

### 6.3 Load Testing (To Do)
**Goal**: Support 1,000 concurrent users

**Tools**: Artillery or k6

**Test Scenarios**:
1. Concurrent logins (200 users/second)
2. Simultaneous clock-ins (500 concurrent)
3. Bulk sync operations (100 users, 50 records each)
4. Mixed workload simulation

**Metrics to Track**:
- Response times (p50, p95, p99)
- Throughput (requests/second)
- Error rates
- Database connection usage
- Memory consumption

### 6.4 Performance Benchmarks

**Target Metrics**:
- Login: < 200ms
- Clock in: < 300ms
- Sync 50 records: < 2s
- User list query: < 500ms
- Facility import (100 records): < 5s

## Phase 7: CI/CD Strategy (Partially Complete)

### 7.1 Continuous Integration
**GitHub Actions** (Completed):
- ✅ Linting (ESLint)
- ✅ Unit tests
- ✅ Integration tests (configured)
- ✅ Security audit (npm audit)

**Pipeline Steps**:
1. Install dependencies
2. Run linting
3. Run migrations on test DB
4. Run unit tests
5. Run integration tests
6. Generate coverage report
7. Security audit

### 7.2 Continuous Deployment (To Configure)
**Environments**:
1. **Development**: Auto-deploy on push to `develop`
2. **Staging**: Auto-deploy on push to `staging`
3. **Production**: Manual approval required

**Deployment Steps**:
1. Build Docker image
2. Tag with commit SHA
3. Push to container registry
4. Run database migrations
5. Deploy to target environment
6. Run smoke tests
7. Health check verification

### 7.3 Blue-Green Deployment
**Strategy**:
1. Deploy to "green" environment
2. Run health checks
3. Switch traffic to green
4. Monitor for issues
5. Keep blue for rollback

**Rollback Plan**:
- Keep previous version running
- Switch traffic back in < 5 minutes
- Database rollback (if needed)

## Phase 8: Monitoring & Observability (To Implement)

### 8.1 Application Metrics
**Metrics to Track**:
- Request rate
- Response times
- Error rates
- Active users
- Database queries/second

**Tools**: Prometheus + Grafana

### 8.2 Database Monitoring
- Connection pool usage
- Query performance
- Slow query log
- Table sizes
- Index usage

**Tools**: pg_stat_statements, pgAdmin

### 8.3 Logging & Alerting
**Log Aggregation**: ELK Stack or CloudWatch Logs

**Alert Conditions**:
- Error rate > 5%
- Response time > 2s
- Database connections > 90%
- Disk usage > 85%
- Memory usage > 85%

## Phase 9: Security Hardening (Completed + Enhancements)

### 9.1 Completed Measures
- ✅ bcrypt password hashing
- ✅ JWT authentication
- ✅ Parameterized queries
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Audit logging

### 9.2 Future Enhancements
- [ ] Two-factor authentication
- [ ] Account lockout policy
- [ ] IP whitelisting
- [ ] Advanced session management
- [ ] Web Application Firewall
- [ ] DDoS protection

## Phase 10: Documentation (Partially Complete)

### 10.1 Completed Documentation
- ✅ API_DOCUMENTATION.md
- ✅ DATABASE_DESIGN.md
- ✅ OFFLINE_SYNC_DESIGN.md
- ✅ SECURITY.md
- ✅ IMPLEMENTATION_PLAN.md

### 10.2 To Complete
- [ ] Update README.md with:
  - Setup instructions
  - Quick start guide
  - Development guide
  - API overview
  - Contributing guidelines

## Phase 11: Production Readiness Checklist

### 11.1 Infrastructure
- [ ] Production database provisioned
- [ ] Database backups configured
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] CDN for static assets (if needed)
- [ ] DNS configured

### 11.2 Configuration
- [ ] Environment variables set
- [ ] Secrets properly stored
- [ ] Connection limits tuned
- [ ] Log rotation configured
- [ ] Monitoring enabled

### 11.3 Security
- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Secrets rotated
- [ ] Firewall rules configured
- [ ] DDoS protection enabled

### 11.4 Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] User acceptance testing done
- [ ] Smoke tests configured

### 11.5 Operations
- [ ] Runbook documented
- [ ] Incident response plan
- [ ] Backup/restore tested
- [ ] Rollback procedure documented
- [ ] On-call rotation defined

## Success Criteria

### MVP Success Criteria
✅ Users can register with facility/council/region assignment
✅ Admin can import facilities from CSV/Excel
✅ Users can login and receive JWT (24h expiry)
✅ GET /api/users/me returns full hierarchy
✅ System handles 1,000 concurrent connections (to be verified)
✅ Passwords hashed with bcrypt (12 rounds)
✅ All routes protected with JWT middleware
✅ Attendance records include offline sync metadata
✅ Parameterized queries prevent SQL injection
✅ Audit logs track critical operations
✅ Database includes proper indexes
✅ Connection pool configured (20-100)
✅ Docker setup for local development
✅ CI/CD pipeline configured
✅ Comprehensive documentation provided

## Timeline Estimate

- **Phase 1-5**: ✅ Completed
- **Phase 6**: 3-5 days (testing)
- **Phase 7**: 2-3 days (CD setup)
- **Phase 8**: 3-4 days (monitoring)
- **Phase 9**: 2-3 days (security enhancements)
- **Phase 10**: 1-2 days (documentation)
- **Phase 11**: 5-7 days (production readiness)

**Total Remaining**: 16-24 days for full production deployment

## Risk Mitigation

### Technical Risks
1. **Database Performance**: Monitor query performance, optimize as needed
2. **Connection Pool Exhaustion**: Tune pool size, implement queuing
3. **Sync Conflicts**: Comprehensive conflict testing, admin tools

### Operational Risks
1. **Data Loss**: Regular backups, PITR enabled, restore testing
2. **Security Breach**: Security audits, incident response plan
3. **Downtime**: Blue-green deployment, quick rollback capability

## Maintenance Plan

### Daily
- Monitor error logs
- Check system health
- Review failed sync attempts

### Weekly
- Database maintenance (VACUUM, ANALYZE)
- Dependency updates
- Security patch review

### Monthly
- Performance review
- Capacity planning
- Security audit
- Backup restore test

### Quarterly
- Major version updates
- Architecture review
- Disaster recovery drill
- User feedback review

## Conclusion

This implementation plan provides a comprehensive roadmap for building, testing, and deploying the WOTI Attendance v2 backend. The core functionality is complete, with remaining work focused on testing, monitoring, and production hardening.
