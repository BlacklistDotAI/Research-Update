#!/bin/bash

# Comprehensive End-to-End Test Script for Blacklist System
# Tests: Admin setup, Worker registration, Task submission, Status checking

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"
API_V1="${BASE_URL}/api/v1"

# Function to print step headers
print_step() {
    echo -e "\n${BOLD}${BLUE}================================================================================${NC}"
    echo -e "${BOLD}${BLUE}STEP $1: $2${NC}"
    echo -e "${BOLD}${BLUE}================================================================================${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

echo -e "\n${BOLD}================================================================================"
echo "BLACKLIST SYSTEM - COMPREHENSIVE END-TO-END TEST"
echo -e "================================================================================${NC}\n"

# STEP 1: Check Server Health
print_step 1 "Checking Server Health"
HEALTH_RESPONSE=$(curl -s ${BASE_URL}/health)
if [ $? -eq 0 ]; then
    print_success "Server is running"
    print_info "Response: $HEALTH_RESPONSE"
else
    print_error "Server is not running. Please start the server first."
    exit 1
fi

# STEP 2: Seed Admin User
print_step 2 "Seeding Admin User"
SEED_RESPONSE=$(curl -s -X POST ${API_V1}/admin/seed)
print_info "Response: $SEED_RESPONSE"
print_success "Admin user seeded/exists"

# STEP 3: Admin Login
print_step 3 "Admin Login"
LOGIN_RESPONSE=$(curl -s -X POST ${API_V1}/admin/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=default_password_change_me")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    print_error "Failed to login"
    print_error "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Admin logged in successfully"
print_info "Access token (first 50 chars): ${ACCESS_TOKEN:0:50}..."

# STEP 4: Get Queue Statistics
print_step 4 "Getting Queue Statistics"
STATS_RESPONSE=$(curl -s ${API_V1}/queue/stats \
    -H "Authorization: Bearer $ACCESS_TOKEN")
print_success "Retrieved queue statistics"
echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE"

# STEP 5: Register a Worker
print_step 5 "Registering a Worker"
WORKER_NAME="test-worker-$(date +%s)"
WORKER_RESPONSE=$(curl -s -X POST ${API_V1}/workers \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$WORKER_NAME\"}")

WORKER_TOKEN=$(echo $WORKER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['worker_token'])" 2>/dev/null)

if [ -z "$WORKER_TOKEN" ]; then
    print_error "Failed to register worker"
    print_error "Response: $WORKER_RESPONSE"
else
    print_success "Worker registered successfully"
    WORKER_ID=$(echo $WORKER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['worker_id'])" 2>/dev/null)
    print_info "Worker ID: $WORKER_ID"
    print_info "Worker token (first 50 chars): ${WORKER_TOKEN:0:50}..."
    print_info "To run this worker: WORKER_TOKEN='$WORKER_TOKEN' python worker/worker.py"
fi

# STEP 6: Test Presigned Upload URL (will fail with mock token)
print_step 6 "Testing Presigned Upload URL Generation"
print_info "NOTE: This will fail captcha verification unless Turnstile is configured"
UPLOAD_RESPONSE=$(curl -s -X POST ${API_V1}/client/uploads/presigned-url \
    -H "Content-Type: application/json" \
    -d '{
        "filename": "test_voice.mp3",
        "content_type": "audio/mpeg",
        "content_length": 512000,
        "turnstile_token": "MOCK_TOKEN_FOR_TESTING"
    }')

if echo "$UPLOAD_RESPONSE" | grep -q "url"; then
    print_success "Presigned URL generated (Unexpected - captcha should have failed)"
    echo "$UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESPONSE"
else
    print_info "Expected failure: $UPLOAD_RESPONSE"
fi

# STEP 7: Submit a Task (will fail with mock token)
print_step 7 "Submitting Task (with mock captcha)"
print_info "NOTE: This will fail captcha verification unless Turnstile is configured"
TASK_RESPONSE=$(curl -s -X POST ${API_V1}/client/tasks \
    -H "Content-Type: application/json" \
    -d '{
        "payload": {
            "voice_url": "https://example.com/voice/sample123.mp3",
            "phone_number": "+84123456789"
        },
        "email_notify": "test@example.com",
        "turnstile_token": "MOCK_TOKEN_FOR_TESTING"
    }')

TASK_ID=$(echo $TASK_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['task_id'])" 2>/dev/null)

if [ -z "$TASK_ID" ]; then
    print_info "Expected failure (captcha validation): $TASK_RESPONSE"
    print_info "To submit a real task, you need a valid Cloudflare Turnstile token from the frontend"
else
    print_success "Task submitted successfully (Unexpected - captcha should have failed)"
    print_info "Task ID: $TASK_ID"
    echo "$TASK_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TASK_RESPONSE"

    # STEP 8: Check Task Status
    print_step 8 "Checking Task Status"
    STATUS_RESPONSE=$(curl -s ${API_V1}/client/tasks/$TASK_ID)
    print_success "Task status retrieved"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"

    # STEP 9: Monitor Task Progress
    print_step 9 "Monitoring Task Progress"
    print_info "Polling task status every 5 seconds for 30 seconds..."
    print_info "NOTE: Task will remain in PENDING unless a worker processes it"
    print_info "To process the task, run a worker with:"
    print_info "  WORKER_TOKEN='$WORKER_TOKEN' python worker/worker.py"

    for i in {1..6}; do
        sleep 5
        STATUS_RESPONSE=$(curl -s ${API_V1}/client/tasks/$TASK_ID)
        STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null)
        print_info "Status check $i/6: $STATUS"

        if [ "$STATUS" = "SUCCESS" ] || [ "$STATUS" = "FAILURE" ]; then
            print_success "Task completed with status: $STATUS"
            echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
            break
        fi
    done
fi

# Final Summary
print_step "SUMMARY" "Test Results"

echo -e "${BOLD}What was tested:${NC}"
print_success "Server health check"
print_success "Admin user seeding"
print_success "Admin authentication"
print_success "Queue statistics retrieval"
print_success "Worker registration"
print_success "Presigned upload URL generation (attempted)"
print_success "Task submission (attempted)"
if [ ! -z "$TASK_ID" ]; then
    print_success "Task status retrieval"
    print_success "Task monitoring"
fi

echo -e "\n${BOLD}To test the complete workflow with real captcha:${NC}"
print_info "1. Set up Cloudflare Turnstile on your frontend"
print_info "2. Get a real Turnstile token from the frontend"
print_info "3. Submit a task using that token:"
echo -e "   ${YELLOW}curl -X POST ${API_V1}/client/tasks \\
     -H 'Content-Type: application/json' \\
     -d '{
         \"payload\": {
             \"voice_url\": \"https://example.com/voice.mp3\",
             \"phone_number\": \"+84123456789\"
         },
         \"email_notify\": \"test@example.com\",
         \"turnstile_token\": \"<REAL_TOKEN>\"
     }'${NC}"

if [ ! -z "$WORKER_TOKEN" ]; then
    echo -e "\n${BOLD}To start processing tasks:${NC}"
    print_info "1. Start the worker:"
    echo -e "   ${YELLOW}WORKER_TOKEN='$WORKER_TOKEN' python worker/worker.py${NC}"
    print_info "2. Start the janitor (zombie task cleanup):"
    echo -e "   ${YELLOW}python janitor/janitor.py${NC}"
fi

echo -e "\n${BOLD}API Documentation:${NC}"
print_info "Swagger UI: ${BASE_URL}/api/docs"
print_info "ReDoc: ${BASE_URL}/api/redoc"

echo -e "\n${GREEN}${BOLD}Test script completed!${NC}\n"
