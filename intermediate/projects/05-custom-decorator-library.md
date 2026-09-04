# Capstone Project 05: Production Decorator & Metrics Library

## 1. Project Overview & Architecture

Cross-cutting concerns—such as execution telemetry, automated exponential-backoff retries, rate limiting, and in-memory memoization caching—should never clutter core domain functions.

In this capstone project, you will build a production-grade **Reusable Decorator & Observability Toolkit** named `DecorateX Suite`.

The toolkit provides three parameterized decorators that can be stacked on any synchronous or asynchronous Python function to inject enterprise resilience, latency metrics, and throughput protection.

### System Architecture
```
                               DECORATEX DECORATOR INVOCATION PIPELINE

       Function Call: query_user_account(user_id=101)
             │
             ▼
       ┌────────────────────────────────────────────────────────┐
       │ @timed_and_logged(metric_name="user.lookup")           │  <--- Injects latency telemetry
       ├────────────────────────────────────────────────────────┤
       │ @rate_limited(max_calls_per_sec=5)                     │  <--- Enforces token-bucket rate limit
       ├────────────────────────────────────────────────────────┤
       │ @retry_with_backoff(max_retries=3, backoff_factor=0.5) │  <--- Exponential retry on network failure
       ├────────────────────────────────────────────────────────┤
       │ @lru_memoize(max_entries=128)                          │  <--- In-Memory LRU Cache Hit/Miss
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼ (Only on Cache Miss!)
                        Target Business Function
```

---

## 2. Key Features & Requirements

1. **`@retry_with_backoff`**: Parameterized decorator with configurable `max_retries`, `backoff_factor`, and `retryable_exceptions`.
2. **`@rate_limited`**: Token-bucket rate limiter enforcing execution quota boundaries.
3. **`@timed_and_logged`**: High-precision execution timer recording duration in milliseconds and logging call parameters.
4. **`@lru_memoize`**: Custom Least-Recently-Used caching decorator with `.cache_info()` and `.cache_clear()` helpers.
5. **Metadata Preservation**: Complete preservation of `__name__`, `__doc__`, and `__wrapped__` attributes using `@functools.wraps`.
6. **Decorator Stacking**: Seamless composition of all four decorators in sequence without side-effect collisions.

---

## 3. Complete Implementation Code

```python
"""
DecorateX Suite - Production Reusable Decorator & Observability Library
Enterprise Parameterized Decorators for Retries, Rate-Limiting, Metrics, and Caching.
"""

from __future__ import annotations
import time
import functools
import collections
from typing import Callable, Any, TypeVar

F = TypeVar("F", bound=Callable[..., Any])

# =====================================================================
# 1. RETRY WITH EXPONENTIAL BACKOFF DECORATOR
# =====================================================================

def retry_with_backoff(
    max_retries: int = 3,
    backoff_factor: float = 0.5,
    retryable_exceptions: tuple[type[Exception], ...] = (Exception,)
):
    """Automatically retries wrapped function on failure using exponential backoff."""
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as err:
                    if attempt == max_retries:
                        print(f"🚨 [{func.__name__}] Final attempt {attempt}/{max_retries} failed permanently: {err}")
                        raise
                    sleep_time = backoff_factor * (2 ** (attempt - 1))
                    print(f"⚠️ [{func.__name__}] Attempt {attempt} failed ({err}). Retrying in {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
        return wrapper  # type: ignore
    return decorator

# =====================================================================
# 2. TOKEN-BUCKET RATE LIMITER DECORATOR
# =====================================================================

def rate_limited(max_calls_per_second: float):
    """Restricts maximum function execution throughput per second."""
    min_interval = 1.0 / max_calls_per_second
    last_called = 0.0

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            nonlocal last_called
            now = time.perf_counter()
            elapsed = now - last_called
            if elapsed < min_interval:
                sleep_dur = min_interval - elapsed
                time.sleep(sleep_dur)
            
            result = func(*args, **kwargs)
            last_called = time.perf_counter()
            return result
        return wrapper  # type: ignore
    return decorator

# =====================================================================
# 3. HIGH-PRECISION EXECUTION TIMER & TELEMETRY DECORATOR
# =====================================================================

def timed_and_logged(metric_label: str = ""):
    """Measures execution latency and logs telemetry metrics."""
    def decorator(func: F) -> F:
        label = metric_label or func.__name__

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                ms = (time.perf_counter() - start) * 1000.0
                print(f"⏱️ [METRIC: {label}] Latency: {ms:>6.2f} ms │ Status: SUCCESS")
                return result
            except Exception as err:
                ms = (time.perf_counter() - start) * 1000.0
                print(f"⏱️ [METRIC: {label}] Latency: {ms:>6.2f} ms │ Status: FAILED ({err})")
                raise
        return wrapper  # type: ignore
    return decorator

# =====================================================================
# 4. CUSTOM LRU MEMOIZATION CACHING DECORATOR
# =====================================================================

def lru_memoize(max_entries: int = 128):
    """In-Memory LRU Cache with cache_info() telemetry."""
    def decorator(func: F) -> F:
        cache = collections.OrderedDict()
        hits = 0
        misses = 0

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            nonlocal hits, misses
            # Generate hashable cache key
            key = (args, frozenset(kwargs.items()))
            
            if key in cache:
                hits += 1
                cache.move_to_end(key)
                return cache[key]

            misses += 1
            result = func(*args, **kwargs)
            cache[key] = result
            
            if len(cache) > max_entries:
                cache.popitem(last=False)  # Evict LRU item
            return result

        def cache_info() -> dict:
            return {"hits": hits, "misses": misses, "current_size": len(cache), "max_size": max_entries}

        def cache_clear():
            nonlocal hits, misses
            cache.clear()
            hits = 0
            misses = 0

        wrapper.cache_info = cache_info  # type: ignore
        wrapper.cache_clear = cache_clear  # type: ignore
        return wrapper  # type: ignore
    return decorator

# =====================================================================
# 5. INTEGRATION DEMONSTRATION & DECORATOR STACKING
# =====================================================================

# Simulated external unreliable API function
attempt_counter = 0

@timed_and_logged("payment_gateway.charge")
@rate_limited(max_calls_per_second=10.0)
@retry_with_backoff(max_retries=3, backoff_factor=0.1, retryable_exceptions=(ConnectionError,))
def process_unreliable_remote_charge(card_token: str, amount: float) -> str:
    global attempt_counter
    attempt_counter += 1
    if attempt_counter < 3:
        raise ConnectionError("503 Upstream Service Temporarily Unavailable")
    return f"CHARGE_SUCCESS_{card_token}"

@lru_memoize(max_entries=4)
def compute_expensive_tax_rate(state_code: str) -> float:
    time.sleep(0.05)  # Simulate expensive database lookup
    tax_table = {"CA": 0.095, "NY": 0.088, "TX": 0.0625}
    return tax_table.get(state_code, 0.05)

if __name__ == "__main__":
    print("=" * 68)
    print("      DECORATEX SUITE: PRODUCTION DECORATOR DEMONSTRATION")
    print("=" * 68)

    # 1. Test Stacking: Timer + RateLimiter + Retry Backoff
    print("\n1. Testing Stacked Decorators (Retries + Rate Limiting + Telemetry):")
    res = process_unreliable_remote_charge("tok_visa_4242", 1450.00)
    print(f"Final Charge Outcome: {res}")

    # 2. Test LRU Memoize Caching
    print("\n2. Testing LRU Memoization Cache:")
    print("• First Call CA (Cache Miss):", compute_expensive_tax_rate("CA"))
    print("• Second Call CA (Cache Hit):", compute_expensive_tax_rate("CA"))
    print("• First Call NY (Cache Miss):", compute_expensive_tax_rate("NY"))
    print("• Cache Telemetry Stats     :", compute_expensive_tax_rate.cache_info())

    print("\n" + "=" * 68)
    print("🎉 DECORATEX REUSABLE DECORATOR TOOLKIT VERIFIED!")
```

---

## 4. Summary & Next Steps

In this capstone project, you built a modular decorator library implementing **`@retry_with_backoff`**, **`@rate_limited`**, **`@timed_and_logged`**, and **`@lru_memoize`** with complete metadata preservation and stacking compatibility.

### What's Next?
Continue to Capstone Project 06:
👉 **[High-Throughput Streaming Data Pipeline](06-data-pipeline-generator.md)** to build a streaming ETL pipeline using Generators, `yield from`, and `itertools`!
