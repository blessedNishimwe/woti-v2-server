# Deployment Guide

## Overview

This guide covers deploying the WOTI Attendance v2 backend to production environments.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15+ (or use Docker)
- Domain name with SSL certificate
- Server with 2GB+ RAM, 2+ CPU cores

## Quick Deploy with Docker

### 1. Clone Repository

```bash
git clone https://github.com/blessedNishimwe/woti-v2-server.git
cd woti-v2-server
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update production values:
```env
NODE_ENV=production
PORT=3000

# Database (use strong password!)
DB_HOST=postgres
DB_PASSWORD=<strong_random_password>

# JWT (generate strong secrets!)
JWT_SECRET=<generate_strong_random_secret>
JWT_REFRESH_SECRET=<generate_another_strong_secret>

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Security
FORCE_HTTPS=true
```

### 3. Deploy

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
docker-compose exec app npm run migrate:up
docker-compose exec app npm run seed
```

### 5. Change Default Admin Password

```bash
# Login with default credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@woti.rw","password":"Admin@123"}'

# Update password
curl -X PUT http://localhost:3000/api/users/{admin_id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"password":"NewSecurePassword@123"}'
```

### 6. Verify Deployment

```bash
curl http://localhost:3000/health
```

## Production Checklist

### Before Deployment

- [ ] Change all default secrets in .env
- [ ] Configure SSL/TLS certificates
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Review security settings
- [ ] Test backup/restore procedures
- [ ] Set up log rotation
- [ ] Configure firewall rules

### After Deployment

- [ ] Change default admin password
- [ ] Verify all endpoints working
- [ ] Test authentication flows
- [ ] Verify database connections
- [ ] Check log outputs
- [ ] Monitor resource usage
- [ ] Set up uptime monitoring
- [ ] Document deployment details

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
FORCE_HTTPS=false
```

### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
FORCE_HTTPS=true
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=error
FORCE_HTTPS=true
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
apt-get install certbot

# Get certificate
certbot certonly --standalone -d your-domain.com

# Configure nginx/reverse proxy with certificates
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Backups

### Automated Daily Backups

```bash
# Create backup script
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="woti_backup_$DATE.dump"

docker-compose exec -T postgres pg_dump \
  -U postgres -Fc woti_attendance > $BACKUP_DIR/$FILENAME

# Keep only last 7 days
find $BACKUP_DIR -name "woti_backup_*.dump" -mtime +7 -delete

echo "Backup completed: $FILENAME"
EOF

chmod +x /root/backup-db.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

### Restore from Backup

```bash
docker-compose exec -T postgres pg_restore \
  -U postgres -d woti_attendance -c < backup_file.dump
```

## Monitoring

### Health Check Endpoint

Monitor `/health` endpoint:

```bash
curl https://your-domain.com/health
```

Response should be:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": {
    "status": "healthy"
  }
}
```

### Log Monitoring

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f postgres

# View specific time range
docker-compose logs --since 1h app
```

## Scaling

### Horizontal Scaling

1. **Add Load Balancer** (nginx, HAProxy)
2. **Deploy Multiple App Instances**
3. **Configure Session Affinity** (if needed)
4. **Set up Read Replicas** for database

### Vertical Scaling

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check container status
docker-compose ps

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose exec postgres psql -U postgres -d woti_attendance -c "SELECT NOW();"

# Check connection pool
docker-compose logs app | grep "Database"
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Adjust pool size in .env
DB_POOL_MAX=50
```

## Maintenance

### Updating Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run new migrations
docker-compose exec app npm run migrate:up
```

### Database Maintenance

```bash
# Vacuum and analyze
docker-compose exec postgres psql -U postgres -d woti_attendance -c "VACUUM ANALYZE;"

# Reindex
docker-compose exec postgres psql -U postgres -d woti_attendance -c "REINDEX DATABASE woti_attendance;"
```

## Security Hardening

### Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw enable
```

### Regular Updates

```bash
# Update system packages
apt update && apt upgrade -y

# Update npm dependencies
npm audit fix

# Update Docker images
docker-compose pull
docker-compose up -d
```

### Security Audits

```bash
# Run npm audit
npm audit

# Check for vulnerabilities
docker scan woti-v2-server:latest
```

## Rollback Procedure

If deployment fails:

1. **Stop current deployment**
   ```bash
   docker-compose down
   ```

2. **Checkout previous version**
   ```bash
   git checkout <previous_commit>
   ```

3. **Rollback database** (if needed)
   ```bash
   npm run migrate:down
   ```

4. **Restart services**
   ```bash
   docker-compose up -d
   ```

## Support

For deployment issues:
- Check logs: `docker-compose logs`
- Health endpoint: `/health`
- GitHub Issues: [Create an issue](https://github.com/blessedNishimwe/woti-v2-server/issues)

## Best Practices

1. **Never commit secrets** - Use environment variables
2. **Regular backups** - Automated daily backups
3. **Monitor logs** - Set up log aggregation
4. **Update regularly** - Keep dependencies current
5. **Test before deploying** - Use staging environment
6. **Document changes** - Keep deployment log
7. **Monitor performance** - Track metrics
8. **Security first** - Regular security audits
