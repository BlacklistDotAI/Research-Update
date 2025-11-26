# Worker API Endpoint Mapping

Complete mapping of worker API endpoints and their server-side implementations.

## Worker → Server Communication

### Authentication
All worker endpoints require JWT authentication via `Authorization: Bearer <token>` header.

| Worker Action | HTTP Method | Endpoint | Server Handler | Redis Operations |
|--------------|-------------|----------|----------------|------------------|
| Poll for task | `GET` | `/api/v1/worker/tasks/next` | `worker_tasks.get_next_task()` | `RPOP queue:pending` |
| Update status | `PATCH` | `/api/v1/worker/tasks/{id}/status` | `worker_tasks.update_task_status()` | `HSET task:{id}` |
| Complete task | `POST` | `/api/v1/worker/tasks/{id}/complete` | `worker_tasks.complete_task()` | `ZREM queue:processing`<br>`HSET task:{id}` |
| Fail task | `POST` | `/api/v1/worker/tasks/{id}/fail` | `worker_tasks.fail_task()` | `ZREM queue:processing`<br>`ZADD queue:failed`<br>`HSET task:{id}` |
| Send heartbeat | `POST` | `/api/v1/worker/heartbeat` | `worker_tasks.worker_heartbeat()` | `HSET worker:{id}` |

## Detailed Endpoint Specifications

### 1. GET /api/v1/worker/tasks/next

**Purpose**: Poll for next available task

**Request**:
```http
GET /api/v1/worker/tasks/next HTTP/1.1
Authorization: Bearer <worker_token>
```

**Response (200 OK)**:
```json
{
  "task_id": "abc123",
  "payload": {
    "phone_number": "+1234567890",
    "audio_url": "https://..."
  },
  "created_at": "2025-01-20T10:00:00Z",
  "eta": 30
}
```

**Response (204 No Content)**: No tasks available

**Server Flow**:
1. Authenticate worker via JWT
2. `RPOP queue:pending` (atomic) → get task_id
3. If no task: return 204
4. `HGETALL task:{task_id}` → get task data
5. `ZADD queue:processing {task_id: timestamp}` + `HSET task:{task_id} status=STARTED` (transactional)
6. Return task data

**Concurrency**: ✅ Safe - `RPOP` is atomic, each worker gets unique task

---

### 2. PATCH /api/v1/worker/tasks/{task_id}/status

**Purpose**: Update task status (e.g., progress updates)

**Request**:
```http
PATCH /api/v1/worker/tasks/abc123/status HTTP/1.1
Authorization: Bearer <worker_token>
Content-Type: application/json

{
  "status": "PROCESSING"
}
```

**Response (200 OK)**:
```json
{
  "message": "Status updated",
  "task_id": "abc123",
  "status": "PROCESSING"
}
```

**Server Flow**:
1. Authenticate worker
2. Verify task exists
3. `HSET task:{task_id} status={new_status}`

**Concurrency**: ✅ Safe - `HSET` is atomic, last-write-wins

---

### 3. POST /api/v1/worker/tasks/{task_id}/complete

**Purpose**: Mark task as completed with result

**Request**:
```http
POST /api/v1/worker/tasks/abc123/complete HTTP/1.1
Authorization: Bearer <worker_token>
Content-Type: application/json

{
  "result": {
    "scam_score": 0.85,
    "risk_level": "HIGH",
    "reasons": ["Suspicious pattern"]
  }
}
```

**Response (200 OK)**:
```json
{
  "message": "Task completed",
  "task_id": "abc123"
}
```

**Server Flow**:
1. Authenticate worker
2. Verify task exists
3. Transaction:
   - `ZREM queue:processing {task_id}`
   - `HSET task:{task_id} status=SUCCESS result={json}`
   - `HSET task:{task_id} completed_at={timestamp}`

**Concurrency**: ✅ Safe - Redis pipeline with `transaction=True`

---

### 4. POST /api/v1/worker/tasks/{task_id}/fail

**Purpose**: Mark task as failed with error

**Request**:
```http
POST /api/v1/worker/tasks/abc123/fail HTTP/1.1
Authorization: Bearer <worker_token>
Content-Type: application/json

{
  "error": "ValueError: Invalid audio format"
}
```

**Response (200 OK)**:
```json
{
  "message": "Task marked as failed",
  "task_id": "abc123"
}
```

**Server Flow**:
1. Authenticate worker
2. Verify task exists
3. Increment retry count
4. Transaction:
   - `ZREM queue:processing {task_id}`
   - `ZADD queue:failed {task_id: timestamp}`
   - `HSET task:{task_id} status=FAILURE traceback={error} retries={count}`

**Concurrency**: ✅ Safe - Redis pipeline with `transaction=True`

---

### 5. POST /api/v1/worker/heartbeat

**Purpose**: Update worker last_active timestamp

**Request**:
```http
POST /api/v1/worker/heartbeat HTTP/1.1
Authorization: Bearer <worker_token>
```

**Response (200 OK)**:
```json
{
  "message": "Heartbeat received",
  "worker_id": "worker-01"
}
```

**Server Flow**:
1. Authenticate worker
2. `HSET worker:{worker_id} last_active={timestamp}`

**Concurrency**: ✅ Safe - `HSET` is atomic

---

## Redis Data Structures

### Queues
```
queue:pending      → LIST    [task_id1, task_id2, ...]
queue:processing   → ZSET    {task_id: start_timestamp}
queue:failed       → ZSET    {task_id: fail_timestamp}
```

### Task Data
```
task:{task_id}     → HASH    {
                                task_id: str
                                status: str
                                payload: json
                                created_at: iso8601
                                started_at: iso8601
                                completed_at: iso8601
                                retries: int
                                traceback: str
                                worker_id: str
                                result: json
                              }
```

### Worker Data
```
worker:{worker_id} → HASH    {
                                worker_id: str
                                name: str
                                jwt_hash: str
                                registered_at: iso8601
                                last_active: iso8601
                              }
```

## Concurrency Guarantees

### Atomic Operations
- ✅ `RPOP` - Task assignment (one task per worker)
- ✅ `HSET` - Status updates (last-write-wins)
- ✅ `ZADD` - Add to sorted set (atomic)
- ✅ `ZREM` - Remove from sorted set (atomic)

### Transactional Operations
- ✅ `MULTI/EXEC` via `pipeline(transaction=True)`
- ✅ All-or-nothing execution
- ✅ No partial state updates

### Race Condition Prevention
1. **Task Assignment**: `RPOP` removes task atomically → no duplicates
2. **Status Updates**: Transactional pipelines → consistent state
3. **Completion**: Remove from processing + update status → atomic
4. **Failure**: Remove from processing + add to failed → atomic

## Load Testing Results

Run the concurrency test:
```bash
python tests/test_worker_concurrency.py <admin_token> <worker_token>
```

Expected output:
```
✅ PASSED: No duplicate task processing detected
✅ PASSED: No errors during processing
✅ ALL TESTS PASSED - Worker API is concurrency-safe!
```

## Performance Characteristics

### Throughput
- **Single Worker**: ~10-60 tasks/min (depends on processing time)
- **10 Workers**: ~100-600 tasks/min (linear scaling)
- **100 Workers**: ~1000-6000 tasks/min (linear scaling)

### Latency
- **Poll Request**: <10ms (Redis `RPOP`)
- **Complete Request**: <20ms (Redis pipeline)
- **Heartbeat**: <5ms (Redis `HSET`)

### Scalability
- ✅ **Horizontal**: Add more workers for higher throughput
- ✅ **Vertical**: Redis handles 10k+ ops/sec easily
- ✅ **Geographic**: Workers can be deployed globally

## Error Handling

### Worker Errors
- **401 Unauthorized**: Invalid/expired token → Re-register worker
- **404 Not Found**: Task/worker not found → Skip and continue
- **204 No Content**: No tasks available → Wait and retry
- **500 Internal Error**: Server issue → Exponential backoff

### Server Errors
- **Redis Connection**: Auto-retry with exponential backoff
- **Invalid Payload**: Return 400 Bad Request
- **Task Not Found**: Return 404 Not Found

## Monitoring

### Metrics to Track
1. **Queue Length**: `LLEN queue:pending`
2. **Processing Count**: `ZCARD queue:processing`
3. **Failed Count**: `ZCARD queue:failed`
4. **Active Workers**: Count workers with recent `last_active`
5. **Task Throughput**: Tasks completed per minute
6. **Error Rate**: Failed tasks / total tasks

### Health Checks
```bash
# Check queue stats
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/v1/admin/queue/stats

# Check active workers
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/v1/admin/workers
```
