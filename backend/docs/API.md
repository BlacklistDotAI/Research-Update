# API Documentation

Complete API reference for the Blacklist Voice Scam Detection System.

---

## Base URL

- **Development:** `http://localhost:8000`
- **Production:** `https://api.yourdomain.com`

## API Versions

- **Current:** `/api/v1`

## Interactive Documentation

- **Swagger UI:** `/docs`
- **ReDoc:** `/redoc`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Client Endpoints](#client-endpoints)
3. [Admin Endpoints](#admin-endpoints)
4. [Worker Endpoints](#worker-endpoints)
5. [Response Formats](#response-formats)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

### Admin Authentication (JWT)

**Login to get access token:**

```http
POST /api/v1/admin/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=your_password
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Use token in requests:**

```http
GET /api/v1/admin/workers
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Worker Authentication

Workers use long-lived JWT tokens provided during registration.

```http
GET /api/v1/worker/jobs
Authorization: Bearer <worker_token>
```

### API Keys (Optional)

If API keys are configured, include them in headers:

```http
X-Admin-API-Key: sk_admin_your_key
X-Worker-API-Key: sk_worker_your_key
```

---

## Client Endpoints

### Get Upload URL

Get presigned S3 URL for file upload.

**Endpoint:** `POST /api/v1/client/uploads/presigned-url`

**Auth:** Public (Turnstile required)

**Request:**

```json
{
  "filename": "recording.wav",
  "content_type": "audio/wav",
  "file_size_mb": 5.2,
  "turnstile_token": "0.ABC123..."
}
```

**Response:**

```json
{
  "upload_url": "https://bucket.s3.amazonaws.com/...",
  "file_key": "uploads/2024/11/19/abc123.wav",
  "expires_in": 3600
}
```

**Usage:**

```bash
# 1. Get presigned URL
RESPONSE=$(curl -X POST http://localhost:8000/api/v1/client/uploads/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.wav",
    "content_type": "audio/wav",
    "file_size_mb": 2.5,
    "turnstile_token": "mock_token"
  }')

# 2. Upload file to S3
UPLOAD_URL=$(echo $RESPONSE | jq -r .upload_url)
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: audio/wav" \
  --data-binary @test.wav
```

---

### Submit Task

Submit voice file for scam detection.

**Endpoint:** `POST /api/v1/client/tasks`

**Auth:** Public (Turnstile required)

**Request:**

```json
{
  "file_key": "uploads/2024/11/19/abc123.wav",
  "email": "user@example.com",
  "turnstile_token": "0.ABC123..."
}
```

**Response:**

```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "PENDING",
  "queue_position": 5,
  "estimated_wait_seconds": 150,
  "email_notification": true,
  "sse_url": "/api/v1/client/tasks/123e4567-e89b-12d3-a456-426614174000/stream"
}
```

---

### Get Task Status

Get current task status and result.

**Endpoint:** `GET /api/v1/client/tasks/{task_id}`

**Auth:** Public

**Response:**

```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "COMPLETED",
  "result": {
    "is_scam": true,
    "confidence": 0.92,
    "scam_type": "investment_fraud",
    "transcript": "This is a guaranteed investment...",
    "analysis": "Contains high-pressure sales tactics..."
  },
  "created_at": "2024-11-19T10:30:00Z",
  "completed_at": "2024-11-19T10:32:15Z",
  "processing_time_seconds": 135
}
```

**Task Status Values:**

- `PENDING` - Waiting in queue
- `PROCESSING` - Being processed by worker
- `COMPLETED` - Successfully completed
- `FAILED` - Processing failed

---

### Stream Task Updates (SSE)

Real-time task status updates using Server-Sent Events.

**Endpoint:** `GET /api/v1/client/tasks/{task_id}/stream`

**Auth:** Public

**Response:** (text/event-stream)

```
event: status
data: {"status": "PENDING", "queue_position": 5}

event: status
data: {"status": "PROCESSING", "worker_id": "worker-01"}

event: complete
data: {"status": "COMPLETED", "result": {...}}
```

**Client Example (JavaScript):**

```javascript
const eventSource = new EventSource(
  `http://localhost:8000/api/v1/client/tasks/${taskId}/stream`
);

eventSource.addEventListener('status', (e) => {
  const data = JSON.parse(e.data);
  console.log('Status:', data.status);
});

eventSource.addEventListener('complete', (e) => {
  const data = JSON.parse(e.data);
  console.log('Result:', data.result);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('Stream error:', e);
  eventSource.close();
});
```

---

### Report Phone Number

Report a phone number as scam/spam.

**Endpoint:** `POST /api/v1/client/phones/report`

**Auth:** Public (Turnstile required)

**Request:**

```json
{
  "phone_number": "+84123456789",
  "report_type": "SCAM",
  "notes": "Claimed to be from bank, asked for OTP",
  "reported_by_email": "reporter@example.com",
  "turnstile_token": "0.ABC123..."
}
```

**Report Types:**

- `SCAM` - Confirmed scam call
- `SPAM` - Unwanted marketing
- `SUSPICIOUS` - Suspicious behavior
- `ROBOCALL` - Automated call

**Response:**

```json
{
  "id": 42,
  "phone_number": "+84123456789",
  "report_type": "SCAM",
  "status": "PENDING",
  "created_at": "2024-11-19T10:30:00Z",
  "message": "Report submitted for review"
}
```

---

### Search Phone Number

Check if a phone number has been reported.

**Endpoint:** `GET /api/v1/client/phones/search?phone={number}`

**Auth:** Public

**Response:**

```json
{
  "phone_number": "+84123456789",
  "is_reported": true,
  "verified_scam": true,
  "report_count": 15,
  "most_common_type": "SCAM",
  "risk_score": 95,
  "last_reported": "2024-11-19T10:30:00Z"
}
```

---

## Admin Endpoints

### Create First Admin

Create the initial admin account (runs once).

**Endpoint:** `POST /api/v1/admin/seed`

**Auth:** None (only works if no admins exist)

**Response:**

```json
{
  "username": "admin",
  "email": "admin@system.local",
  "message": "Default admin created. Change password immediately!"
}
```

**Default credentials:**

- Username: `admin`
- Password: `default_password_change_me`

---

### Admin Login

**Endpoint:** `POST /api/v1/admin/login`

**Request:**

```
username=admin&password=your_password
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### Admin Logout

**Endpoint:** `POST /api/v1/admin/logout`

**Auth:** Admin JWT

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

### Register Worker

**Endpoint:** `POST /api/v1/admin/workers`

**Auth:** Admin JWT

**Request:**

```json
{
  "name": "worker-prod-01"
}
```

**Response:**

```json
{
  "worker_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "worker-prod-01",
  "worker_token": "eyJhbGciOiJIUzI1NiIs...",
  "registered_at": "2024-11-19T10:30:00Z",
  "message": "Worker registered. Save the token securely!"
}
```

> **Important:** Worker token is shown only once! Save it securely.

---

### List Workers

**Endpoint:** `GET /api/v1/admin/workers`

**Auth:** Admin JWT

**Response:**

```json
{
  "workers": [
    {
      "worker_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "worker-prod-01",
      "is_active": true,
      "registered_at": "2024-11-19T10:30:00Z",
      "last_active": "2024-11-19T11:45:23Z"
    }
  ],
  "total": 1,
  "active": 1
}
```

---

### Revoke Worker

**Endpoint:** `DELETE /api/v1/admin/workers/{worker_id}`

**Auth:** Admin JWT

**Response:**

```json
{
  "message": "Worker revoked successfully"
}
```

---

### Get Queue Statistics

**Endpoint:** `GET /api/v1/admin/queue/stats`

**Auth:** Admin JWT

**Response:**

```json
{
  "pending": 15,
  "processing": 3,
  "completed": 1250,
  "failed": 5,
  "total_processed": 1255,
  "active_workers": 5,
  "avg_processing_time_seconds": 120,
  "queue_health": "HEALTHY"
}
```

---

### List Tasks

**Endpoint:** `GET /api/v1/admin/tasks?status=FAILED&limit=50&offset=0`

**Auth:** Admin JWT

**Query Parameters:**

- `status` (optional): Filter by status
- `limit` (default: 50): Number of results
- `offset` (default: 0): Pagination offset

**Response:**

```json
{
  "tasks": [
    {
      "task_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "FAILED",
      "created_at": "2024-11-19T10:30:00Z",
      "error_message": "Worker timeout"
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

---

### Retry Failed Task

**Endpoint:** `POST /api/v1/admin/tasks/{task_id}/retry`

**Auth:** Admin JWT

**Response:**

```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "old_status": "FAILED",
  "new_status": "PENDING",
  "message": "Task requeued successfully"
}
```

---

### Retry All Failed Tasks

**Endpoint:** `POST /api/v1/admin/tasks/retry-all-failed`

**Auth:** Admin JWT

**Response:**

```json
{
  "requeued_count": 5,
  "message": "5 failed tasks requeued"
}
```

---

### List Phone Reports

**Endpoint:** `GET /api/v1/admin/phones?status=PENDING&limit=50`

**Auth:** Admin JWT

**Query Parameters:**

- `status` (optional): PENDING, APPROVED, REJECTED
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**

```json
{
  "reports": [
    {
      "id": 42,
      "phone_number": "+84123456789",
      "report_type": "SCAM",
      "status": "PENDING",
      "notes": "Claimed to be from bank",
      "reported_by_email": "user@example.com",
      "created_at": "2024-11-19T10:30:00Z"
    }
  ],
  "total": 100,
  "pending": 50,
  "approved": 30,
  "rejected": 20
}
```

---

### Approve Phone Report

**Endpoint:** `POST /api/v1/admin/phones/{report_id}/approve`

**Auth:** Admin JWT

**Response:**

```json
{
  "id": 42,
  "phone_number": "+84123456789",
  "status": "APPROVED",
  "is_verified": true,
  "message": "Report approved"
}
```

---

### Reject Phone Report

**Endpoint:** `POST /api/v1/admin/phones/{report_id}/reject`

**Auth:** Admin JWT

**Response:**

```json
{
  "id": 42,
  "status": "REJECTED",
  "message": "Report rejected"
}
```

---

### Delete Phone Report

**Endpoint:** `DELETE /api/v1/admin/phones/{report_id}`

**Auth:** Admin JWT

**Response:**

```json
{
  "message": "Report deleted successfully"
}
```

---

## Worker Endpoints

### Get Jobs

Get next task from queue.

**Endpoint:** `GET /api/v1/worker/jobs`

**Auth:** Worker JWT

**Response (task available):**

```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "payload": {
    "file_key": "uploads/2024/11/19/abc123.wav",
    "email": "user@example.com"
  },
  "created_at": "2024-11-19T10:30:00Z"
}
```

**Response (no tasks):**

```json
{
  "message": "No tasks available"
}
```

---

### Submit Result

Submit task processing result.

**Endpoint:** `POST /api/v1/worker/jobs/{task_id}/result`

**Auth:** Worker JWT

**Request (success):**

```json
{
  "status": "COMPLETED",
  "result": {
    "is_scam": true,
    "confidence": 0.92,
    "scam_type": "investment_fraud",
    "transcript": "...",
    "analysis": "..."
  }
}
```

**Request (failure):**

```json
{
  "status": "FAILED",
  "error_message": "Audio file corrupted"
}
```

**Response:**

```json
{
  "message": "Result submitted successfully"
}
```

---

### Heartbeat

Send heartbeat to update worker status.

**Endpoint:** `POST /api/v1/worker/heartbeat`

**Auth:** Worker JWT

**Response:**

```json
{
  "message": "Heartbeat received",
  "server_time": "2024-11-19T10:30:00Z"
}
```

---

## Response Formats

### Success Response

```json
{
  "data": {...},
  "message": "Success",
  "timestamp": "2024-11-19T10:30:00Z"
}
```

### Error Response

```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2024-11-19T10:30:00Z"
}
```

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 400 | INVALID_TURNSTILE | Turnstile validation failed |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | UNPROCESSABLE_ENTITY | Request validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Rate Limiting

### Default Limits

- **Client endpoints:** 100 requests/minute per IP
- **Admin endpoints:** 30 requests/minute per IP
- **Worker endpoints:** No limit (authenticated)

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700401234
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "detail": "100 per 1 minute",
  "retry_after": 45
}
```

---

## SDKs and Examples

### Python Client

```python
import requests

class BlacklistClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()

    def submit_task(self, file_key, email, turnstile_token):
        response = self.session.post(
            f"{self.base_url}/api/v1/client/tasks",
            json={
                "file_key": file_key,
                "email": email,
                "turnstile_token": turnstile_token
            }
        )
        response.raise_for_status()
        return response.json()

    def get_task_status(self, task_id):
        response = self.session.get(
            f"{self.base_url}/api/v1/client/tasks/{task_id}"
        )
        response.raise_for_status()
        return response.json()

# Usage
client = BlacklistClient("https://api.yourdomain.com")
task = client.submit_task("uploads/abc123.wav", "user@example.com", "token")
print(f"Task ID: {task['task_id']}")
```

### JavaScript/Node.js Client

```javascript
class BlacklistClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async submitTask(fileKey, email, turnstileToken) {
    const response = await fetch(`${this.baseUrl}/api/v1/client/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_key: fileKey,
        email: email,
        turnstile_token: turnstileToken
      })
    });
    return response.json();
  }

  async getTaskStatus(taskId) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/client/tasks/${taskId}`
    );
    return response.json();
  }
}

// Usage
const client = new BlacklistClient('https://api.yourdomain.com');
const task = await client.submitTask('uploads/abc123.wav', 'user@example.com', 'token');
console.log(`Task ID: ${task.task_id}`);
```

---

## Postman Collection

Import this collection for testing:

[Download Postman Collection](./postman_collection.json)

---

## Changelog

### v1.0.0 (2024-11-19)

- Initial API release
- Admin, client, and worker endpoints
- JWT authentication
- Turnstile CAPTCHA integration
- SSE for real-time updates

---

**Last Updated:** 2024-11-19
