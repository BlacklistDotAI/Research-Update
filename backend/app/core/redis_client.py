import redis
from redis import ConnectionPool, Redis
from redis.exceptions import RedisError, ConnectionError
import time
import logging
from functools import wraps
from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def retry_with_backoff(max_attempts: int, base_delay: float, max_delay: float):
    """
    Retry decorator with exponential backoff for Redis operations.
    
    Args:
        max_attempts: Maximum number of retry attempts
        base_delay: Initial delay in seconds (doubles each retry)
        max_delay: Maximum delay between retries in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except (RedisError, ConnectionError) as e:
                    if attempt == max_attempts - 1:
                        logger.error(f"Redis connection failed after {max_attempts} attempts: {e}")
                        raise
                    
                    # Calculate exponential backoff delay: min(base_delay * 2^attempt, max_delay)
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    logger.warning(
                        f"Redis connection failed (attempt {attempt + 1}/{max_attempts}), "
                        f"retrying in {delay}s: {e}"
                    )
                    time.sleep(delay)
            return None
        return wrapper
    return decorator


# Create connection pool with health checks and retry configuration
connection_pool = ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=settings.REDIS_MAX_CONNECTIONS,
    socket_keepalive=settings.REDIS_SOCKET_KEEPALIVE,
    socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
    retry_on_timeout=True,
    health_check_interval=30  # Check connection health every 30 seconds
)

# Initialize Redis client with connection pool
redis_client = Redis(connection_pool=connection_pool)


@retry_with_backoff(
    max_attempts=settings.REDIS_RETRY_MAX_ATTEMPTS,
    base_delay=settings.REDIS_RETRY_BASE_DELAY,
    max_delay=settings.REDIS_RETRY_MAX_DELAY
)
def get_redis() -> Redis:
    """
    Get Redis client with automatic retry and exponential backoff.
    
    Returns:
        Redis: Configured Redis client instance
        
    Raises:
        RedisError: If connection fails after all retry attempts
    """
    # Test connection
    redis_client.ping()
    return redis_client


# For initial connection test at startup
try:
    redis_client.ping()
    logger.info("✅ Redis connection established successfully")
except Exception as e:
    logger.warning(f"⚠️  Initial Redis connection failed, will retry on demand: {e}")