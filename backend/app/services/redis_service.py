# app/core/redis_service.py
"""
RedisService - Centralized Redis operations with proper encapsulation.
Provides a clean interface for all Redis operations used throughout the application.
"""
import logging
from typing import Any, Optional
from redis import Redis
from redis.client import Pipeline
from app.core.redis_client import redis_client, get_redis

logger = logging.getLogger(__name__)


class RedisService:
    """
    Service class for Redis operations.
    Centralizes all Redis interactions with proper error handling and logging.
    """
    
    def __init__(self, client: Optional[Redis] = None):
        """
        Initialize RedisService with a Redis client.
        
        Args:
            client: Redis client instance. If None, uses the default client.
        """
        self.client = client or get_redis()
    
    # ============================================================================
    # CONNECTION & HEALTH
    # ============================================================================
    
    def ping(self) -> bool:
        """Test Redis connection."""
        try:
            return self.client.ping()
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False
    
    def close(self) -> None:
        """Close Redis connection."""
        if self.client:
            self.client.close()
    
    # ============================================================================
    # STRING OPERATIONS
    # ============================================================================
    
    def get(self, key: str) -> Optional[str]:
        """Get value by key."""
        return self.client.get(key)
    
    def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        """
        Set key to value.
        
        Args:
            key: Redis key
            value: Value to set
            ex: Expiration time in seconds
        """
        return self.client.set(key, value, ex=ex)
    
    def delete(self, *keys: str) -> int:
        """Delete one or more keys."""
        return self.client.delete(*keys)
    
    def exists(self, key: str) -> bool:
        """Check if key exists."""
        return self.client.exists(key) > 0
    
    # ============================================================================
    # HASH OPERATIONS
    # ============================================================================
    
    def hget(self, name: str, key: str) -> Optional[str]:
        """Get hash field value."""
        return self.client.hget(name, key)
    
    def hgetall(self, name: str) -> dict:
        """Get all hash fields and values."""
        return self.client.hgetall(name)
    
    def hset(self, name: str, key: str = None, value: Any = None, mapping: dict = None) -> int:
        """
        Set hash field(s).
        
        Args:
            name: Hash name
            key: Field name (if setting single field)
            value: Field value (if setting single field)
            mapping: Dictionary of field-value pairs (if setting multiple)
        """
        if mapping:
            return self.client.hset(name, mapping=mapping)
        return self.client.hset(name, key, value)
    
    def hdel(self, name: str, *keys: str) -> int:
        """Delete hash fields."""
        return self.client.hdel(name, *keys)
    
    # ============================================================================
    # LIST OPERATIONS
    # ============================================================================
    
    def lpush(self, name: str, *values: Any) -> int:
        """Push values to the left (head) of list."""
        return self.client.lpush(name, *values)
    
    def rpush(self, name: str, *values: Any) -> int:
        """Push values to the right (tail) of list."""
        return self.client.rpush(name, *values)
    
    def lpop(self, name: str) -> Optional[str]:
        """Remove and return the first element of list."""
        return self.client.lpop(name)
    
    def rpop(self, name: str) -> Optional[str]:
        """Remove and return the last element of list."""
        return self.client.rpop(name)
    
    def lrange(self, name: str, start: int, end: int) -> list:
        """Get a range of elements from list."""
        return self.client.lrange(name, start, end)
    
    def llen(self, name: str) -> int:
        """Get the length of list."""
        return self.client.llen(name)
    
    # ============================================================================
    # SET OPERATIONS
    # ============================================================================
    
    def sadd(self, name: str, *values: Any) -> int:
        """Add values to set."""
        return self.client.sadd(name, *values)
    
    def srem(self, name: str, *values: Any) -> int:
        """Remove values from set."""
        return self.client.srem(name, *values)
    
    def sismember(self, name: str, value: Any) -> bool:
        """Check if value is member of set."""
        return self.client.sismember(name, value)
    
    def smembers(self, name: str) -> set:
        """Get all members of set."""
        return self.client.smembers(name)
    
    # ============================================================================
    # SORTED SET OPERATIONS
    # ============================================================================
    
    def zadd(self, name: str, mapping: dict, **kwargs) -> int:
        """
        Add members to sorted set.
        
        Args:
            name: Sorted set name
            mapping: Dict of {member: score}
        """
        return self.client.zadd(name, mapping, **kwargs)
    
    def zrem(self, name: str, *values: Any) -> int:
        """Remove members from sorted set."""
        return self.client.zrem(name, *values)
    
    def zrange(self, name: str, start: int, end: int, withscores: bool = False) -> list:
        """Get a range of members from sorted set."""
        return self.client.zrange(name, start, end, withscores=withscores)
    
    def zcard(self, name: str) -> int:
        """Get the number of members in sorted set."""
        return self.client.zcard(name)
    
    # ============================================================================
    # PIPELINE
    # ============================================================================
    
    def pipeline(self, transaction: bool = True) -> Pipeline:
        """
        Create a pipeline for batch operations.
        
        Args:
            transaction: Whether to use MULTI/EXEC transaction
        """
        return self.client.pipeline(transaction=transaction)


# Singleton instance
_redis_service: Optional[RedisService] = None


def get_redis_service() -> RedisService:
    """
    Get singleton RedisService instance.
    
    Returns:
        RedisService: Singleton service instance
    """
    global _redis_service
    if _redis_service is None:
        _redis_service = RedisService()
    return _redis_service
