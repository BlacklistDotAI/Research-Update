# Blacklist Worker

Standalone worker service for processing voice scam detection tasks. Communicates with the main server via HTTP API only.

## Architecture

The worker is **completely standalone** and does not require:
- Direct Redis connection
- Direct database connection
- Access to main application code

It communicates with the server through HTTP API endpoints:
- `GET /api/v1/worker/tasks/next` - Poll for next task
- `PATCH /api/v1/worker/tasks/{task_id}/status` - Update task status
- `POST /api/v1/worker/tasks/{task_id}/complete` - Mark task complete
- `POST /api/v1/worker/tasks/{task_id}/fail` - Mark task failed
- `POST /api/v1/worker/heartbeat` - Send worker heartbeat

## Setup

### 1. Register Worker

First, register a worker through the admin panel:
1. Login to admin dashboard
2. Go to "Workers" page
3. Click "Add Worker"
4. Copy the generated `WORKER_TOKEN`

### 2. Configure Environment

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env`:
```bash
SERVER_URL=https://your-server.com  # Your main server URL
WORKER_TOKEN=eyJhbGc...              # Token from admin panel
WORKER_ID=worker-01                  # Unique worker identifier
POLL_INTERVAL=5                      # How often to poll for tasks (seconds)
REQUEST_TIMEOUT=30                   # HTTP request timeout (seconds)
```

### 3. Install Dependencies

```bash
pip install httpx asyncio
```

Or use the provided `requirements.txt`:
```bash
pip install -r requirements.txt
```

## Running

### Local Development

```bash
python worker.py
```

### Docker

Build and run:
```bash
docker build -f Dockerfile -t blacklist-worker .
docker run --env-file .env blacklist-worker
```

### Docker Compose (Multiple Workers)

```bash
docker-compose up -d --scale worker=10
```

This will start 10 worker instances.

### Production Deployment

The worker can be deployed anywhere:
- **Separate VPS**: Deploy on different servers for load distribution
- **Kubernetes**: Use deployment with replicas
- **Cloud Run / Fly.io / Render**: Deploy as serverless workers
- **Auto-scaling**: Scale based on queue length

Example Kubernetes deployment:
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
        image: your-registry/blacklist-worker:latest
        env:
        - name: SERVER_URL
          value: "https://api.blacklist.com"
        - name: WORKER_TOKEN
          valueFrom:
            secretKeyRef:
              name: worker-secrets
              key: token
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERVER_URL` | Yes | - | Main server API URL |
| `WORKER_TOKEN` | Yes | - | JWT token from worker registration |
| `WORKER_ID` | No | hostname | Unique worker identifier |
| `POLL_INTERVAL` | No | 5 | Seconds between task polls |
| `REQUEST_TIMEOUT` | No | 30 | HTTP request timeout in seconds |

## Monitoring

### Logs

The worker outputs structured logs:
```
2025-01-20 10:00:00 - Worker worker-01 started
2025-01-20 10:00:05 - Received task abc123
2025-01-20 10:00:15 - Processing voice task abc123
2025-01-20 10:01:20 - Task abc123 completed with risk level: HIGH
```

### Health Check

The worker sends heartbeat every 60 seconds to mark itself as active in the admin dashboard.

### Metrics

Monitor through admin dashboard:
- Active workers count
- Tasks processed per worker
- Worker last active time

## Task Processing

The worker processes voice scam detection tasks:

1. **Poll**: Continuously polls server for new tasks
2. **Receive**: Gets task with payload (audio file info, metadata)
3. **Process**: Runs ML model for scam detection
4. **Complete**: Sends result back to server

### Custom Processing Logic

Replace the `process_voice_task()` function with your actual ML model:

```python
async def process_voice_task(payload: Dict[str, Any], task_id: str) -> Dict[str, Any]:
    # Your ML model here
    audio_url = payload.get("audio_url")
    
    # Download audio
    # Run model
    # Generate result
    
    return {
        "scam_score": 0.85,
        "risk_level": "HIGH",
        "reasons": ["Suspicious pattern detected"],
        "confidence": 0.92
    }
```

## Scaling

### Horizontal Scaling

Add more workers to increase throughput:
```bash
# Docker Compose
docker-compose up -d --scale worker=20

# Kubernetes
kubectl scale deployment blacklist-worker --replicas=20
```

### Auto-scaling

Set up auto-scaling based on queue length:
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: blacklist-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: blacklist-worker
  minReplicas: 2
  maxReplicas: 50
  metrics:
  - type: External
    external:
      metric:
        name: queue_length
      target:
        type: AverageValue
        averageValue: "10"
```

## Troubleshooting

### Worker not receiving tasks

1. Check `SERVER_URL` is correct
2. Verify `WORKER_TOKEN` is valid (check admin panel)
3. Check network connectivity to server
4. Review server logs for API errors

### Tasks failing

1. Check worker logs for error details
2. Verify task payload format
3. Check processing logic for bugs
4. Monitor resource usage (CPU, memory)

### Connection issues

1. Increase `REQUEST_TIMEOUT` if server is slow
2. Check firewall rules
3. Verify SSL/TLS certificates if using HTTPS
4. Check server health status

## Security

- **Token Security**: Keep `WORKER_TOKEN` secret, rotate regularly
- **HTTPS**: Always use HTTPS in production for `SERVER_URL`
- **Network**: Use VPN or private network for worker-server communication
- **Isolation**: Workers should not have access to production databases

## Development

### Testing Locally

1. Start main server: `python server.py`
2. Register worker in admin panel
3. Copy token to worker `.env`
4. Start worker: `python worker.py`
5. Submit test task through API

### Mock Mode

For testing without actual ML model, the worker includes a mock processor that simulates task processing with random results.
