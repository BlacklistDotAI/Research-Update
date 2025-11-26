# Lightweight standalone worker - minimal dependencies
FROM python:3.12-slim

WORKDIR /app

# Create non-root user
RUN useradd -m -u 1000 worker && \
    chown -R worker:worker /app

# Copy worker files
COPY --chown=worker:worker worker.py .
COPY --chown=worker:worker requirements.txt .

# Install dependencies (only httpx needed)
RUN pip install --no-cache-dir -r requirements.txt

# Switch to non-root user
USER worker

# Run worker
CMD ["python", "worker.py"]