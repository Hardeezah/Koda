import hashlib
import json
import logging
import os
from functools import wraps
from typing import Any, Callable, TypeVar

from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Attempt to initialize Upstash Redis
redis_client = None
try:
    upstash_url = os.environ.get("UPSTASH_REDIS_REST_URL")
    upstash_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    if upstash_url and upstash_token:
        from upstash_redis.asyncio import Redis as UpstashRedis
        redis_client = UpstashRedis(url=upstash_url, token=upstash_token)
        logger.info("Initialized Upstash Redis cache")
    else:
        logger.info("UPSTASH_REDIS credentials missing, LLM caching will be disabled.")
except Exception as e:
    logger.warning("Failed to initialize Upstash Redis: %s", e)


def llm_cache(ttl_seconds: int = 86400, response_model: type[BaseModel] = None):
    """
    Decorator to cache LLM responses using Upstash Redis.
    Hashes all the arguments and uses it as the cache key.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            if redis_client is None:
                return await func(*args, **kwargs)

            # Create a deterministic hash of the arguments
            cache_payload = {
                "func": func.__name__,
                "args": [str(a) for a in args[1:]], # Skip 'self'
                "kwargs": {k: str(v) for k, v in kwargs.items()}
            }
            payload_str = json.dumps(cache_payload, sort_keys=True)
            cache_key = f"llm_cache:{hashlib.sha256(payload_str.encode()).hexdigest()}"

            try:
                cached_data = await redis_client.get(cache_key)
                if cached_data:
                    logger.info("LLM Cache HIT for %s", func.__name__)
                    if isinstance(cached_data, str):
                        data = json.loads(cached_data)
                    else:
                        data = cached_data

                    if response_model:
                        # If the original function returns a dictionary but it's meant to be a model
                        return data # Depending on intelligence.py returning dicts.
                    return data
            except Exception as e:
                logger.warning("Cache GET failed for %s: %s", func.__name__, e)

            # Cache Miss
            logger.info("LLM Cache MISS for %s", func.__name__)
            result = await func(*args, **kwargs)

            try:
                # result might be a dict or a Pydantic model
                if isinstance(result, BaseModel):
                    to_cache = result.model_dump()
                else:
                    to_cache = result

                await redis_client.set(cache_key, json.dumps(to_cache), ex=ttl_seconds)
            except Exception as e:
                logger.warning("Cache SET failed for %s: %s", func.__name__, e)

            return result

        return wrapper
    return decorator
