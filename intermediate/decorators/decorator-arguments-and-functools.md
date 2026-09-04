# Decorators with Arguments & `functools` in Python

## Introduction

In the previous lesson, you learned that standard function decorators act as wrappers around target functions. However, in enterprise software development, decorators frequently require **Configuration Parameters**:
- A retry decorator needs custom retry counts: `@retry(max_attempts=5, delay_sec=2.0)`.
- A web framework router needs URL paths: `@app.route("/api/v1/users", methods=["GET"])`.
- A rate limiter needs specific quotas: `@rate_limit(max_calls=100, period_sec=60)`.

To accept arguments, Python requires a **3-Tier Nested Closure Architecture (A Decorator Factory)**.

Additionally, Python's standard library **`functools`** module provides world-class metaprogramming and optimization utilities, most notably **`@functools.lru_cache`** (Least Recently Used cache) and **`@functools.cache`**—which automatically memoize expensive function calls in memory, turning $O(2^N)$ exponential algorithms into instant $O(N)$ linear operations.

This lesson explores parameterized decorator factories, decorator stacking order, optional argument decorators, and high-performance memoization with `functools`.

---

## Prerequisites

Before studying decorators with arguments, ensure you have:

- Completed [Closures & First-Class Functions](first-class-functions-closures.md).
- Completed [Function Decorators & Wrapper Architecture](function-decorators.md).
- A solid understanding of Python hashability and caching concepts.

---

## Core Concept: The 3-Tier Decorator Factory

When a decorator accepts arguments, the `@` syntax executes the outer function *first*, which returns the actual decorator, which in turn returns the wrapper:

```
                          THE 3-TIER PARAMETERIZED DECORATOR PIPELINE

      @retry(max_attempts=3, delay=1.0)
      def fetch_data(): ...
                │
                ▼
      fetch_data = retry(max_attempts=3, delay=1.0)(fetch_data)

      ┌────────────────────────────────────────────────────────────┐
      │ TIER 1: Decorator Factory: def retry(max_attempts, delay): │  <--- Receives CONFIGURATION
      │   ┌────────────────────────────────────────────────────────┤
      │   │ TIER 2: Actual Decorator: def decorator(func):         │  <--- Receives TARGET FUNCTION
      │   │   ┌────────────────────────────────────────────────────┤
      │   │   │ TIER 3: Runtime Wrapper: def wrapper(*args, **kw): │  <--- Receives RUNTIME ARGUMENTS
      │   │   │   # Executes func(*args, **kw) with config!        │
      │   │   │   return result                                    │
      │   │   └────────────────────────────────────────────────────┤
      │   │   return wrapper                                       │
      │   └────────────────────────────────────────────────────────┤
      │   return decorator                                         │
      └────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Parameterized Patterns

```python
import functools
import time

# 1. The 3-Tier Parameterized Decorator
def repeat(num_times: int = 3):
    """Decorator factory that executes a function N times."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for i in range(1, num_times + 1):
                print(f"🔄 [EXECUTION #{i}/{num_times}] Calling {func.__name__}...")
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(num_times=2)
def send_ping(host: str):
    print(f"  Pinging host -> {host}")

send_ping("10.0.0.1")

# 2. High-Performance Memoization with @functools.lru_cache
@functools.lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    """Computes Nth Fibonacci number with instant O(N) LRU caching."""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(100):", fibonacci(100)) # Instantaneous!
print("Cache Statistics :", fibonacci.cache_info())
# Output: CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)
```

---

## Detailed Explanation

### 1. Stacking Multiple Decorators & Execution Order

When multiple decorators are stacked on a single function, Python evaluates them **from the inside out (Bottom-Up execution order)**:

```python
@decorator_a
@decorator_b
@decorator_c
def my_function():
    pass

# EQUIVALENT TO:
# my_function = decorator_a(decorator_b(decorator_c(my_function)))
```

```python
def make_bold(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return f"<b>{func(*args, **kwargs)}</b>"
    return wrapper

def make_italic(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return f"<i>{func(*args, **kwargs)}</i>"
    return wrapper

# Stacking Order: make_italic runs FIRST (innermost), then make_bold wraps it!
@make_bold
@make_italic
def render_text(msg: str) -> str:
    return msg

print(render_text("Hello World")) # "<b><i>Hello World</i></b>"
```

---

### 2. Memoization Deep Dive with `@functools.lru_cache`

**Memoization** is an optimization technique that caches the return values of expensive, deterministic functions based on their input arguments.

- **`maxsize`**: The maximum number of entries to keep in cache. When the cache fills, the **Least Recently Used (LRU)** item is evicted. If `maxsize=None`, the cache grows unbounded.
- **`typed=False` (Default)**: Treats `fib(3)` and `fib(3.0)` as identical cache keys. If `typed=True`, distinct types are cached separately.

#### The Hashability Requirement:
All arguments passed to an `@lru_cache` decorated function **must be hashable** (`int`, `str`, `tuple`, `frozenset`). Passing mutable arguments (like `list` or `dict`) raises a `TypeError: unhashable type: 'list'`.

#### Cache Control Methods:
- **`func.cache_info()`**: Returns `CacheInfo(hits, misses, maxsize, currsize)`.
- **`func.cache_clear()`**: Flushes and empties the active cache.

---

### 3. The Universal Decorator (Works with or without parentheses)

A common usability issue in custom decorators is requiring parentheses `@my_decorator()` even when using default arguments.

Using the **Optional Argument Pattern**, you can build decorators that work seamlessly as both `@timer` and `@timer(precision=4)`:

```python
def universal_timer(_func=None, *, precision: int = 2):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            result = func(*args, **kwargs)
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            print(f"⏱️ [{func.__name__}] {elapsed_ms:.{precision}f} ms")
            return result
        return wrapper

    # If called without arguments (@universal_timer), _func is the target function!
    if _func is not None:
        return decorator(_func)
    # If called with arguments (@universal_timer(precision=4)), return the decorator!
    return decorator

# Valid Form 1: Without parentheses
@universal_timer
def task_a(): pass

# Valid Form 2: With keyword arguments
@universal_timer(precision=6)
def task_b(): pass
```

---

## Examples

### 1. Simple: Configurable Text Prefix & Suffix Decorator
Formatting function outputs with configurable wrapping characters.

```python
import functools

def text_decorator(prefix: str = ">>> ", suffix: str = " <<<"):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            return f"{prefix}{result}{suffix}"
        return wrapper
    return decorator

@text_decorator(prefix="💎 [STATUS: ", suffix="] 💎")
def get_system_health() -> str:
    return "ALL SYSTEMS OPERATIONAL"

print(get_system_health())
```

### 2. Beginner: Configurable Exponential Backoff Retry Decorator
Retrying failed network functions with configurable attempt limits and backoff multipliers.

```python
import functools
import time
import random

def retry(max_retries: int = 3, initial_delay: float = 0.1, backoff_factor: float = 2.0):
    """Configurable retry decorator factory."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as err:
                    if attempt == max_retries:
                        print(f"🚨 [FINAL ATTEMPT #{attempt}] Failed ({err}). Aborting.")
                        raise
                    print(f"⚠️ [ATTEMPT #{attempt}] {err}. Retrying in {delay:.2f}s...")
                    time.sleep(delay)
                    delay *= backoff_factor
        return wrapper
    return decorator

@retry(max_retries=3, initial_delay=0.05, backoff_factor=2.0)
def unstable_network_fetch():
    if random.random() < 0.7:
        raise ConnectionResetError("Socket timeout on remote port 443")
    return {"status": "SUCCESS", "payload": [1, 2, 3]}

response = unstable_network_fetch()
print("Final Output:", response)
```

### 3. Intermediate: Performance Benchmark: Raw vs LRU-Cached Recursion
Comparing computational time on recursive combinatorial calculations.

```python
import functools
import time

# 1. Uncached Raw Recursion
def raw_fib(n: int) -> int:
    if n < 2: return n
    return raw_fib(n - 1) + raw_fib(n - 2)

# 2. Cached Recursion
@functools.lru_cache(maxsize=256)
def cached_fib(n: int) -> int:
    if n < 2: return n
    return cached_fib(n - 1) + cached_fib(n - 2)

# Benchmark n = 32
start = time.perf_counter()
res_raw = raw_fib(32)
time_raw = time.perf_counter() - start

start = time.perf_counter()
res_cached = cached_fib(32)
time_cached = time.perf_counter() - start

print(f"Raw Recursion Time   : {time_raw:.6f}s (Result: {res_raw})")
print(f"Cached Recursion Time: {time_cached:.6f}s (Result: {res_cached})")
print(f"🚀 Speedup Factor    : {time_raw / max(time_cached, 1e-9):,.1f}x FASTER!")
```

### 4. Real-World: Multi-Tiered User Rate Limiter with In-Memory Buckets
Enforcing per-user request limits with custom time windows.

```python
import functools
import time
from collections import defaultdict

def rate_limit(max_requests: int, window_seconds: float):
    """Enforces rate limits on decorated functions using user identifier keywords."""
    def decorator(func):
        user_buckets = defaultdict(list)

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract user identifier
            user_id = kwargs.get("user_id", "ANONYMOUS")
            now = time.time()
            timestamps = user_buckets[user_id]

            # Purge timestamps older than the sliding window
            user_buckets[user_id] = [t for t in timestamps if now - t < window_seconds]

            if len(user_buckets[user_id]) >= max_requests:
                print(f"🚫 [RATE LIMITED] User '{user_id}' exceeded {max_requests} req / {window_seconds}s!")
                raise RuntimeError(f"Rate limit exceeded. Please wait {window_seconds} seconds.")

            user_buckets[user_id].append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(max_requests=2, window_seconds=1.0)
def query_profile(user_id: str):
    print(f"✅ Profile loaded for: {user_id}")

query_profile(user_id="hesam_admin")
query_profile(user_id="hesam_admin")

# 3rd request inside window is blocked:
try:
    query_profile(user_id="hesam_admin")
except RuntimeError as err:
    print("Caught:", err)
```

### 5. Advanced: Partial Function Application with `functools.partial`
Pre-configuring function parameters into reusable specialized callables.

```python
import functools

def send_notification(service: str, priority: str, recipient: str, message: str):
    print(f"[{service.upper()} - {priority.upper()}] -> To: {recipient} │ Body: '{message}'")

# Create specialized pre-bound callable functions using functools.partial:
send_critical_slack = functools.partial(send_notification, "Slack", "CRITICAL")
send_info_email = functools.partial(send_notification, "Email", "INFO")

send_critical_slack("devops-alerts", "Cluster Node 04 OOM Crash!")
send_info_email("user@domain.com", "Your monthly invoice is ready.")
```

---

## Code Explanation

In Example 4 (`rate_limit`):
1. `rate_limit(max_requests=2, window_seconds=1.0)` acts as the **Tier 1 Factory**, capturing limits in its closure scope.
2. `decorator(func)` acts as **Tier 2**, receiving the target function and initializing a local `user_buckets = defaultdict(list)` state table.
3. `wrapper(*args, **kwargs)` acts as **Tier 3**, executing on every call, sliding the timestamp window, verifying limits, and rejecting violations.
4. Because `user_buckets` resides in the decorator's closure, each decorated function maintains its own independent state table in memory.

---

## Common Mistakes

### Mistake 1: Passing Mutable Arguments to `@lru_cache`
Passing a list or dictionary as an argument to an `@lru_cache` function raises `TypeError: unhashable type: 'list'`. Always convert mutable collections to immutable tuples (`tuple(my_list)`) before passing them to cached functions.

### Mistake 2: Missing One Tier of Nesting
Writing only 2 levels of functions when defining a decorator with arguments causes Python to pass the configuration argument where the function was expected, crashing with `TypeError: decorator() takes 0 positional arguments but 1 was given`.

---

## Best Practices

### Clear Caches in Unit Tests
When unit testing functions decorated with `@lru_cache`, call `my_func.cache_clear()` inside `setUp()` or fixtures to prevent test contamination.

Good:
```python
def test_pricing_calculation():
    calculate_tax.cache_clear()
    assert calculate_tax(100) == 120
```

---

## Performance Considerations

1. **`@functools.cache` (Python 3.9+)**: If you do not need size limits or LRU eviction, use `@functools.cache` (equivalent to `@lru_cache(maxsize=None)`). It is slightly faster because it avoids maintaining doubly-linked list eviction pointers.
2. **Thread Safety**: `@functools.lru_cache` is **thread-safe** in CPython; it wraps internal dictionary reads and writes in internal C-level mutex locks.

---

## Security Considerations

1. **Unbounded Memory Growth**: Avoid using `@functools.cache` or `@lru_cache(maxsize=None)` on functions accepting arbitrary user-supplied input strings (like search queries), as an attacker can flood your application with millions of unique strings, filling all server RAM. Always specify an explicit `maxsize` (e.g. `maxsize=1024`).
2. **Side Effects in Cached Functions**: Cached functions must be **pure and deterministic**. Never cache functions that perform database mutations or charge credit cards!

---

## Real-World Usage

- **Flask / FastAPI Route Blueprints**: `@api_router.get("/v1/items", tags=["Catalog"])`.
- **PyTest Fixtures**: `@pytest.fixture(scope="module", autouse=True)`.
- **Django Database Cache Queries**: `@cached_property` and query cache decorators.

---

## Comparison: Caching & Parameterized Decorators

| Mechanism | Configuration Syntax | Eviction Strategy | Argument Requirement | Best Fit |
|---|---|---|---|---|
| **Custom Parameterized**| `def factory(): def dec(): def wrap():` | Custom Logic | Any | Rate limiting, Auth, Routing |
| **`@lru_cache(maxsize=N)`**| Standard Library | **Least Recently Used (LRU)**| **Hashable Only** | Math, heavy read algorithms |
| **`@functools.cache`** | Standard Library | **None (Unbounded)** | **Hashable Only** | Finite deterministic lookups |
| **`functools.partial`** | `partial(fn, arg1)` | N/A | Any | Pre-binding function arguments |

---

## Advanced Concepts: `lru_cache` CPython Implementation

Under the hood in CPython (`Modules/_functoolsmodule.c`), `lru_cache` is implemented using a **Hash Table paired with a Doubly-Linked List**:
- The hash table provides $O(1)$ key lookups.
- The doubly-linked list maintains access order: whenever a key is hit, its node is spliced and moved to the root head in $O(1)$ pointer operations.
- When `currsize > maxsize`, the tail node is removed from both the list and the hash table in $O(1)$ time.

---

## Exercises

### Exercise 1 — Beginner
Write a decorator factory `@prefix_printer(tag="DEBUG")` that prints `[{tag}] Executing {func.__name__}` before calling the function. Test with different tags (`"INFO"`, `"WARNING"`).

### Exercise 2 — Intermediate
Build an `@enforce_types(str, int)` decorator factory that verifies the types of positional arguments against the decorator's parameters, raising `TypeError` on mismatches.

### Exercise 3 — Advanced
Build a `@timed_memoize(ttl_seconds=5.0)` decorator that caches return values with an expiration timestamp, returning cached values if called within `ttl_seconds` and re-computing once expired.

---

## Mini Project: Enterprise Cached REST API Gateway & Dynamic Rate Limiter

### Requirements
Build a resilient API gateway client named `cached_api_gateway.py`. Implement a 3-tier `@gateway_endpoint(rate_limit=3, ttl_sec=2.0)` decorator factory that enforces sliding-window rate limits, memoizes JSON query results in memory with TTL expiration, and provides cache management utilities.

### Implementation Blueprint
```python
import functools
import time
from typing import Callable

# =====================================================================
# 1. 3-TIER PARAMETERIZED GATEWAY DECORATOR
# =====================================================================

def gateway_endpoint(max_calls_per_sec: int = 2, ttl_sec: float = 2.0):
    """Decorator factory configuring rate limits and TTL caching."""
    def decorator(func: Callable) -> Callable:
        cache_store = {}
        call_timestamps = []

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()

            # 1. Rate Limiting Check
            nonlocal call_timestamps
            call_timestamps = [t for t in call_timestamps if now - t < 1.0]
            if len(call_timestamps) >= max_calls_per_sec:
                raise RuntimeError(f"🚨 [429 TOO MANY REQUESTS] Rate limit exceeded ({max_calls_per_sec} req/sec) on {func.__name__}()")
            call_timestamps.append(now)

            # 2. TTL Cache Query
            cache_key = (args, tuple(sorted(kwargs.items())))
            if cache_key in cache_store:
                cached_time, cached_val = cache_store[cache_key]
                if now - cached_time < ttl_sec:
                    print(f"⚡ [CACHE HIT] Returning cached response for {func.__name__}{args}")
                    return cached_val

            # 3. Execute Live Function
            print(f"🌐 [NETWORK FETCH] Executing live request: {func.__name__}{args}")
            result = func(*args, **kwargs)
            cache_store[cache_key] = (now, result)
            return result

        # Attach cache purge utility to wrapper
        def clear_cache():
            cache_store.clear()
            print(f"🧹 Cache cleared for {func.__name__}()")

        wrapper.clear_cache = clear_cache
        return wrapper
    return decorator

# =====================================================================
# 2. DECORATED API ENDPOINTS
# =====================================================================

@gateway_endpoint(max_calls_per_sec=3, ttl_sec=1.5)
def get_user_profile(user_id: int) -> dict:
    time.sleep(0.01)  # Simulate network latency
    return {"user_id": user_id, "username": f"User_{user_id}", "status": "ACTIVE"}

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE CACHED API GATEWAY & RATE LIMITER")
    print("=" * 65)
    
    # 1. Initial Request -> Live Network Fetch
    res1 = get_user_profile(101)
    print("Response 1:", res1)
    
    # 2. Immediate Repeat Request -> Cache Hit!
    res2 = get_user_profile(101)
    print("Response 2 (Cached):", res2)
    
    # 3. Query Different User -> Live Network Fetch
    res3 = get_user_profile(202)
    
    # 4. Trigger Rate Limiting Violation
    print("\n--- Testing Rate Limiter (Burst Trigger) ---")
    try:
        get_user_profile(301)
        get_user_profile(302)  # Hits 3rd call in 1 sec window
        get_user_profile(303)  # Exceeds limit -> Raises 429 error!
    except RuntimeError as rate_err:
        print(rate_err)
        
    # 5. Wait for TTL Expiration
    print("\n--- Testing TTL Expiration (Sleeping 1.6s) ---")
    time.sleep(1.6)
    res4 = get_user_profile(101)  # Cache expired -> Refetches live!
    print("Response 4 (Post-TTL):", res4)
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered parameterized decorators and `functools`:
- **Parameterized Decorators** use a **3-Tier Nested Closure Architecture**: Factory $\rightarrow$ Decorator $\rightarrow$ Wrapper.
- **Multiple Stacked Decorators** execute from the inside out (**Bottom-Up**).
- **`@functools.lru_cache(maxsize=N)`** provides C-speed memoization for deterministic functions with hashable arguments.
- Use **`func.cache_info()`** and **`func.cache_clear()`** to monitor and manage LRU caches.
- Use **`functools.partial`** to freeze and pre-bind arguments on functions.
- Set explicit `maxsize` boundaries on caches to prevent memory exhaustion vulnerabilities.

---

## Best Practices Checklist

- [ ] Use 3-tier nesting when building decorators that accept arguments.
- [ ] Specify an explicit `maxsize` on all `@lru_cache` decorators to prevent unbounded memory growth.
- [ ] Ensure arguments to cached functions are immutable and hashable.
- [ ] Clear caches in unit test fixtures using `func.cache_clear()`.
- [ ] Ensure cached functions are pure, deterministic, and free of side effects.

---

## What's Next?

Now that you understand parameterized decorators, continue to the final article in this module:
👉 **[Class Decorators & Decorating Classes](class-decorators.md)** to master callable decorator classes (`__call__`), decorating class definitions, and metaclass alternatives.
