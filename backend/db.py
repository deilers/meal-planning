import os
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

_client: redis.Redis | None = None


def get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client
