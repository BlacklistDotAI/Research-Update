# Docker Deployment Guide

## Overview

The Blacklist system uses Docker for containerized deployment with the following services:
- **Server**: FastAPI application (port 8000)
- **Janitor**: Background task cleanup service
- **Worker**: Standalone task processor (deployed separately)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache and task queue (port 6379)

## Quick Start

### 1. Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 2. Production Deployment

```bash
# Build images
docker-compose build

# Start in production mode
docker-compose up -d

# Scale janitor if needed
docker-compose up -d --scale janitor=2
```

## Docker Images

### Server Image (Multi-stage Build)

**Features:**
- ✅ Multi-stage build (smaller image size)
- ✅ Non-root user (security)
- ✅ Health checks
- ✅ Minimal dependencies

**Size:** ~200-300MB (vs ~1GB without multi-stage)

**Build:**
```bash
docker build -t blacklist-server:latest .
```

### Worker Image (Lightweight)

**Features:**
- ✅ Standalone (only needs httpx)
- ✅ Non-root user
- ✅ Minimal base image

**Size:** ~150MB

**Build:**
```bash
cd worker
docker build -t blacklist-worker:latest .
```

## Multi-Stage Build Benefits

### Server Dockerfile

**Stage 1 (Builder):**
- Installs build tools (gcc)
- Compiles Python packages
- Creates wheel files

**Stage 2 (Runtime):**
- Copies only compiled packages
- No build tools included
- Smaller attack surface

**Size Comparison:**
- Single-stage: ~1.2GB
- Multi-stage: ~300MB
- **Savings: 75%**

### Worker Dockerfile

**Simple single-stage** (already minimal):
- Only Python + httpx
- No database drivers
- No build dependencies

## Environment Variables

Required in `.env`:

```bash
# Database
POSTGRES_USER=blacklist_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=blacklist_db

# Redis
REDIS_PASSWORD=redis_password

# JWT Secrets
ADMIN_JWT_SECRET_KEY=your_admin_secret
WORKER_JWT_SECRET_KEY=your_worker_secret

# S3/R2 Storage
S3_ENDPOINT_URL=https://...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...

# Captcha
CLOUDFLARE_TURNSTILE_SITE_KEY=...
CLOUDFLARE_TURNSTILE_SECRET_KEY=...
```

## Deployment Scenarios

### Scenario 1: All-in-One (Development)

```bash
docker-compose up -d
```

**Services:**
- Server
- Janitor
- PostgreSQL
- Redis

### Scenario 2: Distributed Workers (Production)

**Main Server:**
```bash
# On main server
docker-compose up -d server janitor postgres redis
```

**Worker Nodes:**
```bash
# On worker machines
cd worker
docker run -d \
  -e SERVER_URL=https://api.yourserver.com \
  -e WORKER_TOKEN=<token_from_admin_panel> \
  -e WORKER_ID=worker-01 \
  --restart unless-stopped \
  blacklist-worker:latest
```

### Scenario 3: Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blacklist-worker
spec:
  replicas: 10
  selector:
    matchLabels:
      app: blacklist-worker
  template:
    metadata:
      labels:
        app: blacklist-worker
    spec:
      containers:
      - name: worker
        image: blacklist-worker:latest
        env:
        - name: SERVER_URL
          value: "http://blacklist-server:8000"
        - name: WORKER_TOKEN
          valueFrom:
            secretKeyRef:
              name: worker-secrets
              key: token
```

## Health Checks

### Server Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Blacklist Distributed Task System",
  "version": "1.0.0",
  "redis": "ok",
  "db": "ok"
}
```

### Docker Health Check

Server container includes automatic health checks:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health', timeout=5)" || exit 1
```

## Security Best Practices

### 1. Non-Root User

Both images run as non-root:
```dockerfile
RUN useradd -m -u 1000 blacklist
USER blacklist
```

### 2. Minimal Base Image

Using `python:3.12-slim` instead of full Python image:
- Smaller attack surface
- Fewer vulnerabilities
- Faster builds

### 3. No Secrets in Image

All secrets via environment variables:
```bash
docker run -e POSTGRES_PASSWORD=... blacklist-server
```

### 4. Network Isolation

Services communicate via Docker network:
```yaml
networks:
  blacklist-network:
    driver: bridge
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f janitor

# Last 100 lines
docker-compose logs --tail=100 server
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats blacklist_server
```

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "8001:8000"
```

### Issue: Container Won't Start

```bash
# Check logs
docker-compose logs server

# Check health
docker-compose ps

# Restart service
docker-compose restart server
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# Check connection string in .env
POSTGRES_URL=postgresql://user:pass@postgres:5432/db
```

## Image Registry

### Push to Registry

```bash
# Tag images
docker tag blacklist-server:latest registry.example.com/blacklist-server:v1.0.0
docker tag blacklist-worker:latest registry.example.com/blacklist-worker:v1.0.0

# Push
docker push registry.example.com/blacklist-server:v1.0.0
docker push registry.example.com/blacklist-worker:v1.0.0
```

### Pull on Production

```bash
docker pull registry.example.com/blacklist-server:v1.0.0
docker pull registry.example.com/blacklist-worker:v1.0.0
```

## Performance Optimization

### Build Cache

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker build -t blacklist-server .
```

### Layer Caching

Dependencies are cached separately from code:
```dockerfile
# This layer is cached
COPY requirements.txt .
RUN pip install -r requirements.txt

# Code changes don't invalidate dependency cache
COPY app ./app
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker rmi blacklist-server:latest blacklist-worker:latest

# Clean up everything
docker system prune -a
```
