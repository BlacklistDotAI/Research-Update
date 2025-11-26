# Production Deployment Guide

Complete guide for deploying the Blacklist Voice Scam Detection System to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Server Deployment](#server-deployment)
5. [Worker Deployment](#worker-deployment)
6. [Reverse Proxy Configuration](#reverse-proxy-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Scaling](#scaling)

---

## Prerequisites

### Required Services

- **PostgreSQL 14+** (managed service recommended: AWS RDS, DigitalOcean, etc.)
- **Redis 7+** (managed service recommended: AWS ElastiCache, Redis Cloud, etc.)
- **S3-Compatible Storage** (AWS S3, Cloudflare R2, MinIO, etc.)
- **Domain name** with DNS access
- **Server(s)** (minimum 2GB RAM, 2 vCPU per component)

### Required Accounts

- Cloudflare account (for Turnstile - free forever)
- Email service (Resend, SendGrid, or AWS SES)
- S3 provider account

---

## Infrastructure Setup

### Recommended Architecture

```
                    Internet
                       ↓
                  Cloudflare CDN
                       ↓
               [Load Balancer]
                       ↓
          ┌────────────┴────────────┐
          ↓                         ↓
    FastAPI Server 1         FastAPI Server 2
          ↓                         ↓
          └────────────┬────────────┘
                       ↓
              [Redis Cluster]
                       ↓
              [PostgreSQL]
                       ↓
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
    Worker Pool 1  Worker Pool 2  Worker Pool 3
    (Location A)   (Location B)   (Location C)
```

### Minimum Production Setup

- 1x Application Server (FastAPI)
- 1x PostgreSQL instance
- 1x Redis instance
- 2+ Worker nodes (can scale to hundreds)

---

## Database Setup

### PostgreSQL Configuration

#### 1. Create Database and User

```sql
-- Connect as postgres superuser
CREATE DATABASE blacklist;
CREATE USER blacklist_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE blacklist TO blacklist_user;

-- Connect to blacklist database
\c blacklist

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO blacklist_user;
```

#### 2. Enable Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
```

#### 3. Configure Connection Limits

Edit `postgresql.conf`:

```ini
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
```

#### 4. Run Migrations

```bash
# Set database URL
export DATABASE_URL="postgresql://blacklist_user:password@db-host:5432/blacklist"

# Run migrations
alembic upgrade head
```

See [MIGRATIONS.md](./MIGRATIONS.md) for detailed migration guide.

### Redis Configuration

#### redis.conf

```ini
# Security
requirepass your_strong_redis_password
bind 0.0.0.0
protected-mode yes

# Performance
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence (optional but recommended)
save 900 1
save 300 10
save 60 10000
```

#### Test Connection

```bash
redis-cli -h redis-host -p 6379 -a your_password ping
# Should return: PONG
```

---

## Server Deployment

### 1. Environment Configuration

Create production `.env`:

```bash
# Environment
ENVIRONMENT=production
DEBUG=false

# Database
REDIS_URL=redis://:password@redis-host:6379/0
POSTGRES_HOST=db-host
POSTGRES_PORT=5432
POSTGRES_USER=blacklist_user
POSTGRES_PASSWORD=strong_password
POSTGRES_DB=blacklist

# JWT Secrets (generate strong secrets!)
ADMIN_JWT_SECRET_KEY=<64+ character random string>
WORKER_JWT_SECRET_KEY=<64+ character random string>
JWT_ALGORITHM=HS256

# CORS (your actual domains)
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOW_HEADERS=*
CORS_MAX_AGE=600

# Security
ALLOWED_HOSTS=api.yourdomain.com
TRUST_PROXY_HEADERS=true
API_RATE_LIMIT=100/minute
ADMIN_RATE_LIMIT=30/minute

# Optional API Keys (recommended for production)
ADMIN_API_KEY=sk_admin_<generate_32_char_random>
WORKER_API_KEY=sk_worker_<generate_32_char_random>

# S3 Storage (Cloudflare R2 example)
S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=blacklist-production
S3_REGION=auto
S3_PRESIGNED_EXPIRE=3600
S3_MAX_UPLOAD_MB=25

# Cloudflare Turnstile
CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAAAA...
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAAAA...

# Email (Resend example)
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXX
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Generate Strong Secrets

```bash
# JWT secrets (64+ characters)
python3 -c "import secrets; print('ADMIN_JWT_SECRET_KEY=' + secrets.token_urlsafe(64))"
python3 -c "import secrets; print('WORKER_JWT_SECRET_KEY=' + secrets.token_urlsafe(64))"

# API keys
python3 -c "import secrets; print('ADMIN_API_KEY=sk_admin_' + secrets.token_urlsafe(32))"
python3 -c "import secrets; print('WORKER_API_KEY=sk_worker_' + secrets.token_urlsafe(32))"
```

### 3. Docker Deployment

#### Build and Run

```bash
# Clone repository
git clone https://github.com/yourorg/blacklist-system.git
cd blacklist-system

# Copy environment file
cp .env.example .env
# Edit .env with production values

# Build and start server
docker-compose -f docker-compose.server.yml up -d

# Check logs
docker-compose -f docker-compose.server.yml logs -f
```

#### docker-compose.server.yml

```yaml
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 4. Create First Admin

```bash
curl -X POST https://api.yourdomain.com/api/v1/admin/seed
# Response: {"username": "admin", "message": "Default admin created"}

# Login and change password immediately
curl -X POST https://api.yourdomain.com/api/v1/admin/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=default_password_change_me"
```

### 5. Verify Deployment

```bash
# Health check
curl https://api.yourdomain.com/health

# API docs
curl https://api.yourdomain.com/docs
```

---

## Worker Deployment

### 1. Register Worker

```bash
# Login as admin
TOKEN=$(curl -X POST https://api.yourdomain.com/api/v1/admin/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=your_admin_password" | jq -r .access_token)

# Register worker
WORKER_TOKEN=$(curl -X POST https://api.yourdomain.com/api/v1/admin/workers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "worker-prod-01"}' | jq -r .worker_token)

echo "Worker Token: $WORKER_TOKEN"
# Save this token securely!
```

### 2. Deploy Workers

#### Option A: Docker (Recommended)

```bash
# On worker machine
export WORKER_TOKEN=eyJhbGciOiJIUzI1NiIs...
export REDIS_URL=redis://:password@redis-host:6379/0

docker run -d \
  --name blacklist-worker \
  --restart always \
  -e WORKER_TOKEN=$WORKER_TOKEN \
  -e REDIS_URL=$REDIS_URL \
  yourorg/blacklist-worker:latest

# Scale multiple workers on same machine
docker-compose -f docker-compose.worker.yml up -d --scale worker=10
```

#### Option B: Systemd Service

Create `/etc/systemd/system/blacklist-worker.service`:

```ini
[Unit]
Description=Blacklist Worker
After=network.target

[Service]
Type=simple
User=blacklist
WorkingDirectory=/opt/blacklist
ExecStart=/usr/bin/python3 /opt/blacklist/worker/worker.py
Restart=always
RestartSec=10
Environment="WORKER_TOKEN=eyJhbGci..."
Environment="REDIS_URL=redis://:password@host:6379/0"

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable blacklist-worker
sudo systemctl start blacklist-worker
sudo systemctl status blacklist-worker
```

### 3. Verify Worker Connection

```bash
# Check worker list
curl https://api.yourdomain.com/api/v1/admin/workers \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Reverse Proxy Configuration

### Nginx

#### /etc/nginx/sites-available/blacklist

```nginx
upstream blacklist_backend {
    server 127.0.0.1:8000;
    # Add more servers for load balancing
    # server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers (redundant with FastAPI but extra layer)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/blacklist-access.log;
    error_log /var/log/nginx/blacklist-error.log;

    # Proxy settings
    location / {
        proxy_pass http://blacklist_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for SSE)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Rate limiting (additional to FastAPI)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Upload size limit
    client_max_body_size 30M;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/blacklist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/TLS Setup

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Cloudflare (Recommended)

1. **Enable Cloudflare proxy** (orange cloud)
2. **SSL/TLS mode:** Full (strict)
3. **Enable features:**
   - Always Use HTTPS
   - Automatic HTTPS Rewrites
   - Minimum TLS Version: 1.2
4. **Origin certificates:** Create and install on your server

---

## Monitoring & Logging

### Application Logs

```bash
# Docker logs
docker-compose logs -f --tail=100 server

# File logs
tail -f logs/app.log
```

### Monitoring Stack (Optional)

#### Prometheus + Grafana

Add to `server.py`:

```python
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)
```

#### Health Check Monitoring

Use services like:
- UptimeRobot (free)
- Better Uptime
- Pingdom

Configure checks for:
- `GET /health` every 1 minute
- Alert on 3 consecutive failures

### Database Monitoring

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Backup Strategy

### PostgreSQL Backup

#### Daily Automated Backup

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

BACKUP_DIR=/backups/postgres
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="blacklist_$DATE.sql.gz"

pg_dump -U blacklist_user -h db-host blacklist | gzip > $BACKUP_DIR/$FILENAME

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/$FILENAME s3://your-backup-bucket/postgres/
```

Add to crontab:

```bash
0 2 * * * /opt/scripts/backup-db.sh
```

### Redis Backup

Redis automatically creates `dump.rdb` based on `save` configuration.

Additional backup:

```bash
redis-cli -h redis-host -p 6379 -a password BGSAVE
cp /var/lib/redis/dump.rdb /backups/redis/dump_$(date +%Y%m%d).rdb
```

---

## Scaling

### Horizontal Scaling

#### Add More Servers

```bash
# Server 2, 3, 4...
docker-compose -f docker-compose.server.yml up -d
```

Update Nginx upstream:

```nginx
upstream blacklist_backend {
    server 10.0.1.10:8000;
    server 10.0.1.11:8000;
    server 10.0.1.12:8000;
}
```

#### Add More Workers

```bash
# Scale workers on existing machine
docker-compose -f docker-compose.worker.yml up -d --scale worker=50

# Deploy workers to new locations
# Asia
ssh asia-server "docker run -d -e WORKER_TOKEN=$TOKEN blacklist-worker"

# Europe
ssh eu-server "docker run -d -e WORKER_TOKEN=$TOKEN blacklist-worker"

# US
ssh us-server "docker run -d -e WORKER_TOKEN=$TOKEN blacklist-worker"
```

### Vertical Scaling

Increase resources:
- Server: 4 vCPU, 8GB RAM
- Redis: 4GB memory
- PostgreSQL: 4 vCPU, 16GB RAM

### Load Testing

```bash
# Install tools
pip install locust

# Run load test
locust -f tests/load_test.py --host=https://api.yourdomain.com
```

---

## Security Checklist

Before going live:

- [ ] Strong JWT secrets configured (64+ characters)
- [ ] CORS restricted to actual domains (no `*`)
- [ ] `DEBUG=false` in production
- [ ] HTTPS enabled and enforced
- [ ] Database passwords rotated
- [ ] Redis password configured
- [ ] API keys generated (optional but recommended)
- [ ] Rate limits configured
- [ ] Firewall rules configured
- [ ] Security headers verified
- [ ] Backups tested
- [ ] Monitoring configured
- [ ] Log aggregation set up

See [SECURITY.md](./SECURITY.md) for complete security guide.

---

## Troubleshooting

### Server won't start

```bash
# Check logs
docker-compose logs server

# Check environment
docker-compose config

# Verify database connection
docker exec -it blacklist-server python -c "from app.core.postgres_client import get_db; next(get_db())"
```

### Workers not connecting

```bash
# Verify worker token
curl https://api.yourdomain.com/api/v1/worker/heartbeat \
  -H "Authorization: Bearer $WORKER_TOKEN"

# Check Redis connection
redis-cli -h redis-host -p 6379 -a password PING
```

### High latency

```bash
# Check database performance
psql -U blacklist_user -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check Redis memory
redis-cli -h redis-host INFO memory

# Check server resources
docker stats
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check disk space
- Verify backups

**Monthly:**
- Update dependencies
- Review security alerts
- Database optimization (VACUUM)
- Review worker distribution

**Quarterly:**
- Load testing
- Security audit
- Disaster recovery drill

---

## Quick Deployment Checklist

```bash
# 1. Prepare infrastructure
[ ] PostgreSQL running
[ ] Redis running
[ ] S3 bucket created
[ ] Domain configured

# 2. Configure environment
[ ] .env file created with production values
[ ] Secrets generated
[ ] CORS configured

# 3. Deploy server
docker-compose -f docker-compose.server.yml up -d

# 4. Initialize database
alembic upgrade head

# 5. Create admin
curl -X POST https://api.yourdomain.com/api/v1/admin/seed

# 6. Register workers
curl -X POST https://api.yourdomain.com/api/v1/admin/workers ...

# 7. Deploy workers
docker-compose -f docker-compose.worker.yml up -d --scale worker=10

# 8. Configure reverse proxy
sudo systemctl reload nginx

# 9. Verify
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/api/v1/admin/queue/stats

# 10. Monitor
tail -f logs/app.log
```

---

**Last Updated:** 2024-11-19
