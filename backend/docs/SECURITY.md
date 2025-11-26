# Security Documentation

## Overview

This document outlines the security measures implemented in the Blacklist Distributed Task System.

---

## Table of Contents

1. [CORS Configuration](#cors-configuration)
2. [Rate Limiting](#rate-limiting)
3. [Authentication & Authorization](#authentication--authorization)
4. [Input Validation](#input-validation)
5. [Security Headers](#security-headers)
6. [API Keys](#api-keys)
7. [Environment Configuration](#environment-configuration)
8. [Security Best Practices](#security-best-practices)
9. [Security Checklist](#security-checklist)

---

## CORS Configuration

### Environment Variables

Configure CORS in `.env`:

```bash
# Development - Allow all origins
CORS_ORIGINS=*

# Production - Specific origins only (comma-separated)
CORS_ORIGINS=https://app.example.com,https://admin.example.com

# CORS Settings
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_ALLOW_HEADERS=*
CORS_MAX_AGE=600
```

### Features

- ✅ Configurable allowed origins from environment
- ✅ Support for multiple origins (comma-separated)
- ✅ Credential support (cookies, auth headers)
- ✅ Method and header restrictions
- ✅ Preflight caching

### Examples

**Allow specific domains:**
```bash
CORS_ORIGINS=https://app.example.com,https://www.example.com
```

**Development (allow all):**
```bash
CORS_ORIGINS=*
```

**Restrict methods:**
```bash
CORS_ALLOW_METHODS=GET,POST
```

---

## Rate Limiting

### Configuration

```bash
# General API rate limit
API_RATE_LIMIT=100/minute

# Admin endpoint rate limit (stricter)
ADMIN_RATE_LIMIT=30/minute
```

### Implementation

Uses `slowapi` for distributed rate limiting:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/endpoint")
@limiter.limit("5/minute")
async def endpoint():
    return {"data": "protected"}
```

### Rate Limit Responses

When rate limit exceeded:
```json
{
  "error": "Rate limit exceeded",
  "detail": "100 per 1 minute"
}
```

---

## Authentication & Authorization

### JWT Tokens

**Admin Authentication:**
- Access token: 30 minutes
- Refresh token: 7 days
- Algorithm: HS256
- Secret: `ADMIN_JWT_SECRET_KEY` (env)

**Worker Authentication:**
- Long-lived tokens
- No expiration (controlled via revocation)
- Algorithm: HS256
- Secret: `WORKER_JWT_SECRET_KEY` (env)

### Token Blocklist

Logged-out tokens stored in Redis:
```
auth:admin_blocklist -> Set of revoked JTIs
```

### API Keys (Optional Additional Layer)

```bash
# Optional API keys for additional security
ADMIN_API_KEY=sk_admin_your_secret_key_here
WORKER_API_KEY=sk_worker_your_secret_key_here
```

Usage:
```bash
curl -H "X-Admin-API-Key: sk_admin_..." \
     -H "Authorization: Bearer <jwt_token>" \
     https://api.example.com/admin/endpoint
```

---

## Input Validation

### Implemented Protections

1. **SQL Injection Prevention**
   - Pattern detection for SQL keywords
   - Parameterized queries with SQLAlchemy
   - Input sanitization

2. **XSS Prevention**
   - Script tag detection
   - Event handler detection
   - HTML entity encoding

3. **Input Sanitization**
   - Null byte removal
   - Control character filtering
   - Length limiting

### Validation Functions

```python
from app.core.security import (
    validate_input_security,
    validate_phone_number,
    validate_email,
    validate_url
)

# Comprehensive validation
safe_input = validate_input_security(user_input, "username")

# Phone validation
if not validate_phone_number("+84123456789"):
    raise ValueError("Invalid phone number")

# Email validation
if not validate_email("user@example.com"):
    raise ValueError("Invalid email")

# URL validation
if not validate_url("https://example.com"):
    raise ValueError("Invalid URL")
```

---

## Security Headers

### Automatically Applied Headers

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-XSS-Protection | 1; mode=block | XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer control |
| Content-Security-Policy | (see below) | XSS/injection protection |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS (prod only) |

### Content Security Policy (Production)

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self';
```

---

## Trusted Host Protection

### Configuration

```bash
# Allow all hosts (development)
ALLOWED_HOSTS=*

# Specific hosts only (production)
ALLOWED_HOSTS=api.example.com,app.example.com
```

Prevents Host header attacks and DNS rebinding.

---

## Password Security

### Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

### Hashing

- Algorithm: bcrypt
- Cost factor: 12 (default)
- Automatic salt generation

### Validation

```python
from app.core.security import validate_password_strength

is_valid, message = validate_password_strength("MyP@ssw0rd")
if not is_valid:
    raise ValueError(message)
```

---

## Environment Configuration

### Security-Related Variables

```bash
# Environment
ENVIRONMENT=production        # development, staging, production
DEBUG=false                   # Disable in production

# CORS
CORS_ORIGINS=https://app.example.com
CORS_ALLOW_CREDENTIALS=true

# Security
ALLOWED_HOSTS=api.example.com
TRUST_PROXY_HEADERS=true     # If behind reverse proxy
API_RATE_LIMIT=100/minute
ADMIN_RATE_LIMIT=30/minute

# API Keys (Optional)
ADMIN_API_KEY=sk_admin_...
WORKER_API_KEY=sk_worker_...

# JWT Secrets (MUST BE STRONG!)
ADMIN_JWT_SECRET_KEY=<64+ character random string>
WORKER_JWT_SECRET_KEY=<64+ character random string>
JWT_ALGORITHM=HS256

# Captcha
CLOUDFLARE_TURNSTILE_SITE_KEY=...
CLOUDFLARE_TURNSTILE_SECRET_KEY=...
```

### Generate Secure Secrets

```python
# Python
import secrets
print(secrets.token_urlsafe(64))
```

```bash
# Bash
openssl rand -base64 64
```

---

## Request Logging

All requests are logged with:
- Method and path
- Status code
- Duration
- Client IP
- Timestamp

Example log:
```
2024-11-19 10:30:15 - Request: POST /api/v1/admin/login
2024-11-19 10:30:15 - Response: POST /api/v1/admin/login Status: 200 Duration: 0.142s
```

---

## Error Handling

### Production Mode

Internal errors are hidden:
```json
{
  "detail": "Internal server error"
}
```

### Development Mode

Full error details provided for debugging.

---

## Security Best Practices

### For Deployment

1. **Never commit `.env` file**
   ```bash
   # Add to .gitignore
   .env
   .env.*
   !.env.example
   ```

2. **Use strong JWT secrets**
   - Minimum 64 characters
   - Random generation
   - Never reuse secrets

3. **Configure CORS properly**
   - Never use `*` in production
   - List specific allowed origins

4. **Enable HTTPS only**
   ```bash
   ENVIRONMENT=production
   # HSTS header will be added automatically
   ```

5. **Use environment variables**
   - Never hardcode secrets
   - Use different values per environment

6. **Regular updates**
   ```bash
   pip install --upgrade -r requirements.txt
   pip audit  # Check for vulnerabilities
   ```

7. **Monitor logs**
   - Set up log aggregation
   - Alert on suspicious patterns
   - Track failed auth attempts

8. **Database security**
   - Use strong passwords
   - Enable SSL/TLS connections
   - Restrict network access

9. **Redis security**
   - Enable password authentication
   - Bind to localhost only (if local)
   - Use SSL/TLS (if remote)

10. **Reverse proxy**
    ```bash
    # Nginx configuration
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $host;
    ```

---

## Security Checklist

### Pre-Deployment

- [ ] Strong JWT secrets configured
- [ ] CORS origins set to specific domains
- [ ] `DEBUG=false` in production
- [ ] HTTPS enabled
- [ ] Database passwords rotated
- [ ] Redis password configured
- [ ] API keys generated (if using)
- [ ] Rate limits configured
- [ ] Allowed hosts configured
- [ ] Logging enabled
- [ ] Error handling tested
- [ ] Security headers verified
- [ ] Dependencies updated
- [ ] Vulnerability scan completed

### Post-Deployment

- [ ] Monitor logs for suspicious activity
- [ ] Set up alerting
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Dependency updates
- [ ] Backup verification
- [ ] Incident response plan
- [ ] Access control review

---

## Vulnerability Reporting

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@example.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

---

## Additional Security Tools

### Recommended

```bash
# Install security scanning tools
pip install bandit safety

# Scan for security issues
bandit -r app/

# Check for known vulnerabilities
safety check

# Audit dependencies
pip-audit
```

### Docker Security

```dockerfile
# Use specific versions
FROM python:3.12-slim

# Run as non-root user
RUN useradd -m -u 1000 blacklist
USER blacklist

# Read-only filesystem
docker run --read-only ...
```

---

## Compliance

### GDPR Considerations

- User data encryption at rest
- Data retention policies
- Right to deletion
- Data export capability
- Privacy policy

### OWASP Top 10 Coverage

1. ✅ Broken Access Control - JWT + API keys
2. ✅ Cryptographic Failures - bcrypt, HTTPS
3. ✅ Injection - Input validation, ORM
4. ✅ Insecure Design - Security by design
5. ✅ Security Misconfiguration - Hardened defaults
6. ✅ Vulnerable Components - Regular updates
7. ✅ Auth Failures - Strong passwords, rate limiting
8. ✅ Integrity Failures - CSP, SRI
9. ✅ Logging Failures - Comprehensive logging
10. ✅ SSRF - URL validation

---

## Updates

This security documentation should be reviewed and updated:
- After major releases
- When new vulnerabilities discovered
- Quarterly security reviews
- After security incidents

**Last Updated:** 2024-11-19
