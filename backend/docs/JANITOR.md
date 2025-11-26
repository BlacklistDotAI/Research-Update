# Janitor Service

The janitor is a background service that monitors the task queue for "zombie tasks" - tasks that have been stuck in the `processing` state for too long (likely due to worker crashes or network issues).

## How It Works

1. **Monitoring**: Every 30 seconds, the janitor scans the `queue:processing` sorted set for tasks older than `TASK_TIMEOUT_SECONDS`
2. **Retry Logic**: For stuck tasks:
   - If `retry_count < MAX_TASK_RETRIES`: Move task back to `queue:pending` and increment retry counter
   - If `retry_count >= MAX_TASK_RETRIES`: Move task to `queue:failed` with error message
3. **Logging**: Prints rescue/failure messages for monitoring

## Configuration

Set these environment variables in `.env`:

```bash
# Maximum number of times a task can be retried by janitor (default: 1)
MAX_TASK_RETRIES=1

# Timeout in seconds before a task is considered stuck (default: 30)
TASK_TIMEOUT_SECONDS=30
```

## Running the Janitor

### With Docker Compose
The janitor runs automatically as a separate service:
```bash
docker-compose up -d janitor
```

### Standalone (Development)
```bash
python -m janitor.janitor
```

## Monitoring

Check janitor logs:
```bash
docker-compose logs -f janitor
```

Example output:
```
Janitor started – Zombie task hunter (max retries: 1)
Rescued zombie task abc123 (retry 1/1)
Failed zombie task def456 after 1 retries
```

## Architecture

The janitor should run alongside workers, not the API server:
- **Server**: Handles HTTP requests, enqueues tasks
- **Worker**: Processes tasks from queue
- **Janitor**: Cleans up stuck tasks (runs as separate process)
