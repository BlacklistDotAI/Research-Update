# Multi-stage build for production server
# Stage 1: Builder - Install dependencies
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime - Minimal production image
FROM python:3.12-slim

WORKDIR /app

# Create non-root user for security
RUN useradd -m -u 1000 blacklist && \
    chown -R blacklist:blacklist /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/blacklist/.local

# Copy application code
COPY --chown=blacklist:blacklist app ./app
COPY --chown=blacklist:blacklist templates ./templates
COPY --chown=blacklist:blacklist server.py .
COPY --chown=blacklist:blacklist janitor ./janitor
COPY --chown=blacklist:blacklist migrations ./migrations

# Set PATH to include user-installed packages
ENV PATH=/home/blacklist/.local/bin:$PATH

# Switch to non-root user
USER blacklist

# Expose port
EXPOSE 8000

# Run server
CMD ["python", "server.py"]