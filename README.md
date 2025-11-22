# WOTI Attendance v2 - Backend Server

High-performance, secure monolithic backend for WOTI Attendance v2 MVP. Built with Node.js, Express, and PostgreSQL, supporting React Native mobile clients and React web admin panel.

## 🚀 Features

- **JWT Authentication** - Secure authentication with 24-hour token expiry
- **Role-Based Access Control** - 7 user roles with hierarchical permissions
- **Offline Sync** - Mobile-first design with conflict resolution
- **CSV/Excel Import** - Bulk facility data import
- **Geolocation Support** - Coordinate validation for facilities and attendance
- **Audit Logging** - Comprehensive activity tracking
- **Connection Pooling** - Optimized database connections (20-100 pool)
- **Rate Limiting** - Protection against abuse
- **Production Ready** - Docker, CI/CD, comprehensive security

## 📋 Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Docker Setup](#docker-setup)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)

## Requirements

- **Node.js**: 18.x or higher
- **PostgreSQL**: 15.x or higher
- **npm**: 9.x or higher

## Quick Start

```bash
# Clone the repository
git clone https://github.com/blessedNishimwe/woti-v2-server.git
cd woti-v2-server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run with Docker (easiest)
docker-compose up

# Or run locally
npm run migrate:up
npm run seed
npm run dev
```

Server will be running at `http://localhost:3000`

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=woti_attendance
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# bcrypt
BCRYPT_ROUNDS=12
```

### 3. Setup PostgreSQL Database

**Option A: Using Docker**
```bash
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**
```bash
createdb woti_attendance
```

### 4. Run Migrations

```bash
npm run migrate:up
```

### 5. Seed Database

```bash
npm run seed
```

This creates:
- 5 regions (Rwanda administrative divisions)
- 30 councils/districts
- 1 admin user (email: admin@woti.rw, password: Admin@123)

**⚠️ Important**: Change the default admin password immediately in production!

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | woti_attendance |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `DB_POOL_MIN` | Minimum pool connections | 20 |
| `DB_POOL_MAX` | Maximum pool connections | 100 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Access token expiry | 24h |
| `BCRYPT_ROUNDS` | Password hash rounds | 12 |
| `CORS_ORIGIN` | Allowed CORS origins | localhost:3001 |
| `LOG_LEVEL` | Logging level | info |

See `.env.example` for complete list.

## Database Setup

### Migration Commands

```bash
# Run all migrations
npm run migrate:up

# Rollback migrations (implement down scripts)
npm run migrate:down

# Seed database
npm run seed
```

### Database Schema

6 core tables:
- **regions** - Geographic top level
- **councils** - Mid-level hierarchy
- **facilities** - Health facilities with geolocation
- **users** - Staff with roles and hierarchy
- **attendance** - Clock records with offline sync
- **activities** - Audit logs

See [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) for detailed schema.

## Running the Application

### Development Mode

```bash
npm run dev
```

Uses nodemon for auto-restart on file changes.

### Production Mode

```bash
npm start
```

### Health Check

```bash
curl http://localhost:3000/health
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require JWT token:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register user (admin only)
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users/me` - Get profile with hierarchy
- `GET /api/users` - List users (admin/supervisor)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

#### Facilities
- `POST /api/facilities/import` - Import CSV/Excel (admin)
- `GET /api/facilities` - List facilities
- `GET /api/facilities/:id` - Get facility

#### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `POST /api/attendance/sync` - Bulk sync offline records
- `GET /api/attendance/my-records` - Get attendance history

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for complete API reference.

## Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests

```bash
npm run test:unit
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Load Testing

```bash
npm run test:load
```

Tests 1,000 concurrent users (to be implemented).

## Docker Setup

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Services included:
- **postgres** - PostgreSQL 15
- **pgbouncer** - Connection pooler
- **app** - Node.js application

### Build Custom Image

```bash
docker build -t woti-v2-server .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_secret \
  woti-v2-server
```

## Project Structure

```
woti-v2-server/
├── database/
│   ├── migrations/          # Database migrations
│   ├── seeds/              # Seed data
│   └── schema/             # Schema reference
├── docs/                   # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_DESIGN.md
│   ├── OFFLINE_SYNC_DESIGN.md
│   ├── SECURITY.md
│   └── IMPLEMENTATION_PLAN.md
├── src/
│   ├── config/             # Configuration
│   │   ├── app.js
│   │   ├── auth.js
│   │   └── database.js
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── roleAuth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── rateLimiter.middleware.js
│   ├── modules/           # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── facilities/
│   │   └── attendance/
│   ├── utils/             # Utilities
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── syncResolver.js
│   ├── scripts/           # CLI scripts
│   │   ├── migrate.js
│   │   └── seed.js
│   └── server.js          # Entry point
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── load/              # Load tests
├── .env.example           # Environment template
├── docker-compose.yml     # Docker setup
├── Dockerfile             # Docker image
├── package.json
└── README.md
```

## Security

### Implemented Security Measures

- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT authentication (24-hour expiry)
- ✅ Parameterized SQL queries (SQL injection prevention)
- ✅ Role-based access control
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Audit logging

### Default Admin User

**Email**: admin@woti.rw  
**Password**: Admin@123

**⚠️ CRITICAL**: Change this password immediately after first deployment!

```bash
PUT /api/users/{admin_id}
{
  "password": "YourNewSecurePassword@123"
}
```

See [SECURITY.md](docs/SECURITY.md) for complete security documentation.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix linting issues |
| `npm run migrate:up` | Run database migrations |
| `npm run migrate:down` | Rollback migrations |
| `npm run seed` | Seed database |

## Performance

### Benchmarks

Target performance metrics:
- Login: < 200ms
- Clock in: < 300ms
- Sync 50 records: < 2s
- User list query: < 500ms

### Scalability

- Supports 1,000 concurrent users
- Connection pooling (20-100 connections)
- Read replica ready
- Horizontal scaling ready

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Verify connection
psql -h localhost -U postgres -d woti_attendance
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Migration Errors

```bash
# Reset database
dropdb woti_attendance
createdb woti_attendance
npm run migrate:up
npm run seed
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow existing code style (ESLint configured)
- Write tests for new features
- Update documentation
- Use conventional commits

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/blessedNishimwe/woti-v2-server/issues)
- Email: support@woti.rw (configure)

## Acknowledgments

- Built for WOTI Attendance v2 MVP
- Rwanda administrative data included
- Open source dependencies listed in package.json
