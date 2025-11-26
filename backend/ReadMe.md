# Blacklist Voice Scam Detection System

Production-ready, fully distributed, fault-tolerant voice scam detection platform with phone number reporting (TrueCaller-style). Built with FastAPI, Redis, PostgreSQL, and Cloudflare Turnstile (100% free captcha).

## Features

- Voice file upload with instant presigned URL (S3-compatible: AWS S3, Cloudflare R2, MinIO, etc.)
- Real-time queue position + estimated wait time
- Optional email notification on result (only if wait > 5 minutes)
- Public phone number reporting API (moderated)
- Full admin dashboard: tasks, workers, phone reports
- Cloudflare Turnstile – completely free, unlimited, privacy-friendly anti-spam
- Horizontal scaling – workers can run anywhere in the world
- No lost tasks – Janitor + automatic retry mechanism
- Durable storage in PostgreSQL (admin accounts, workers, task results, phone reports)
- Zero downtime deploys – fix code → one API call → all failed tasks reprocessed

## Architecture

```
Client (Web/Mobile App)
        ↓ HTTPS + Turnstile
   FastAPI Server (Control Plane)
        ↓
   Redis (queue + fast state) + PostgreSQL (durable data)
        ↓
   Workers (any machine, any location)
        ↓
   Janitor (zombie task recovery)
```

## Project Structure

```
blacklist-system/
├── app/
│   ├── main.py
│   ├── core/                  # config, redis, postgres, captcha
│   ├── schemas/
│   ├── services/              # queue, phone, email, storage, captcha
│   ├── api/v1/
│   │   ├── admin_tasks.py
│   │   ├── admin_workers.py
│   │   ├── admin_phones.py
│   │   ├── client_tasks.py
│   │   ├── client_uploads.py
│   │   └── client_phone.py
│   └── templates/             # Jinja2 email templates
├── worker/
│   └── worker.py
├── janitor/
│   └── janitor.py
├── migrations/                # Alembic migrations
├── Dockerfile.server
├── Dockerfile.worker
├── docker-compose.yml         # dev all-in-one
├── docker-compose.server.yml  # prod server + db
├── docker-compose.worker.yml  # prod workers only
├── requirements.txt
└── .env.example
```

## Quick Start (Development)

```bash
git clone https://github.com/yourname/blacklist-system.git
cd blacklist-system
cp .env.example .env

# Generate strong secrets
python -c "import secrets; print('ADMIN_JWT_SECRET_KEY=' + secrets.token_urlsafe(64))"
python -c "import secrets; print('WORKER_JWT_SECRET_KEY=' + secrets.token_urlsafe(64))"

docker-compose up --build
```

API docs: http://localhost:8000/docs

## Production Deployment

### 1. Run Server + Databases

```bash
docker-compose -f docker-compose.server.yml up -d
```

### 2. Create First Admin

```bash
curl -X POST http://localhost:8000/api/v1/admin/seed
# → Creates admin / default_password_change_me (change immediately!)
```

### 3. Login & Register Worker

```bash
# Login
curl -X POST http://localhost:8000/api/v1/admin/login -d "username=admin&password=..."

# Register worker
curl -X POST http://localhost:8000/api/v1/admin/workers \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "worker-prod-01"}'
# → Returns worker_token (never expires)
```

### 4. Deploy Workers Anywhere

```bash
# On any machine worldwide
export WORKER_TOKEN=eyJhbGciOi...
docker-compose -f docker-compose.worker.yml up -d --scale worker=20
```

## API Endpoints

| Method | Endpoint                                 | Description                                 | Auth       |
|--------|------------------------------------------|---------------------------------------------|------------|
| POST   | /api/v1/client/uploads/presigned-url     | Get secure upload URL (Turnstile required)  | Public     |
| POST   | /api/v1/client/tasks                     | Submit voice for processing (Turnstile)     | Public     |
| POST   | /api/v1/client/phones/report             | Report phone number (Turnstile)             | Public     |
| POST   | /api/v1/admin/login                      | Admin login                                 | -          |
| POST   | /api/v1/admin/seed                       | Create first admin (run once)               | -          |
| POST   | /api/v1/admin/workers                    | Register new worker                         | Admin      |
| GET    | /api/v1/admin/workers                    | List workers                                | Admin      |
| DELETE | /api/v1/admin/workers/{id}               | Revoke worker                               | Admin      |
| GET    | /api/v1/admin/queue/stats                | Queue statistics                            | Admin      |
| POST   | /api/v1/admin/tasks/retry-all-failed     | Requeue all failed tasks after fix          | Admin      |
| POST   | /api/v1/admin/tasks/{id}/retry          | Requeue single task                         | Admin      |
| GET    | /api/v1/admin/phones                     | List phone reports                          | Admin      |
| POST   | /api/v1/admin/phones/{id}/approve       | Mark phone as dangerous                     | Admin      |
| POST   | /api/v1/admin/phones/{id}/reject        | Reject report                               | Admin      |
| DELETE | /api/v1/admin/phones/{id}                | Delete report                               | Admin      |

## Environment Variables (.env)

```env
# Redis
REDIS_URL=redis_url

# Postgres
POSTGRES_PASSWORD=strongpgpassword

# JWT
ADMIN_JWT_SECRET_KEY=very_long_random_string_64_chars
WORKER_JWT_SECRET_KEY=another_very_long_random_string

# Cloudflare Turnstile (FREE FOREVER)
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAA...

# S3-Compatible Storage (R2 example)
S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=blacklist-uploads
S3_REGION=auto

# Email (Resend recommended)
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXX
```

## Security

- Cloudflare Turnstile – free, unlimited, privacy-first captcha
- Worker tokens never expire but instantly revocable
- Admin JWT short-lived + blocklist
- All queue operations atomic
- Presigned URLs enforce Content-Type & Length

## Scaling

```bash
docker-compose -f docker-compose.worker.yml up -d --scale worker=100
```

## Contributing

1. Fork → create feature branch
2. Keep worker completely independent
3. All queue operations must be atomic
4. Use Turnstile for any public endpoint

## License

MIT

**Ready for production. Scale infinitely. Zero cost captcha. Never lose a task.**

Happy hunting scam calls! 🚀