# Async Iterators, Generators & Context Managers in Python

## Introduction

When building scalable real-time systems—such as live market price feeds, Server-Sent Events (SSE), WebSocket message streams, or reading multi-gigabyte log files from cloud object storage—loading entire datasets into memory at once is impossible.

In synchronous Python, we use **Iterators** (`__iter__`/`__next__`) and **Generators** (`yield`) to stream data lazily in constant $O(1)$ RAM. However, synchronous iterators block the entire operating system thread during I/O.

To bring streaming data capabilities to the AsyncIO event loop, Python introduced:
- **Asynchronous Iterators (PEP 492)**: The **`__aiter__()`** and **`__anext__()`** protocol consumed using **`async for`**.
- **Asynchronous Generators (PEP 525)**: Functions combining `async def` and `yield` that stream data asynchronously without blocking.
- **Asynchronous Context Managers (PEP 492)**: The **`__aenter__()`** and **`__aexit__()`** protocol consumed using **`async with`** to ensure deterministic resource setup and teardown for network sockets and database connections.
- **`contextlib.asynccontextmanager`**: A decorator for writing lightweight async context managers with standard `yield` statements.

This lesson explores asynchronous iteration, streaming data pipelines in constant memory, async comprehensions, and building production-grade async resource managers.

---

## Prerequisites

Before studying async iterators and context managers, ensure you have:

- Completed [Iterators & Generators](../../intermediate/iterators-generators/README.md).
- Completed [AsyncIO Event Loop & Coroutines](asyncio-event-loop-coroutines.md) and [Tasks & Structured Concurrency](tasks-gathering-and-timeouts.md).
- Understanding of generator execution and the `yield` statement.

---

## Core Concept: The Async Iterator & Context Manager Protocols

```
                       THE ASYNCHRONOUS ITERATOR PROTOCOL

      class AsyncDataStream:
          def __aiter__(self): ...           <--- Returns the async iterator (self)
          async def __anext__(self): ...      <--- Awaitable: Returns next item or raises StopAsyncIteration

      Consumed with: async for item in AsyncDataStream(): ...

                    THE ASYNCHRONOUS CONTEXT MANAGER PROTOCOL

      class AsyncResourceSession:
          async def __aenter__(self): ...     <--- Awaitable: Connects socket / Opens DB transaction
          async def __aexit__(self, exc_type, exc_val, exc_tb): ... <--- Awaitable: Closes connection

      Consumed with: async with AsyncResourceSession() as session: ...
```

---

## Syntax & Essential Async Streaming Patterns

```python
import asyncio
from contextlib import asynccontextmanager

# 1. Asynchronous Generator Function (yield inside async def)
async def async_event_stream(total_events: int):
    for i in range(1, total_events + 1):
        await asyncio.sleep(0.1)  # Non-blocking async I/O simulation
        yield f"EVENT-{i:03d}"

# 2. Consuming Async Stream with 'async for' and Async Comprehension
async def stream_consumer():
    print("--- 1. Consuming Async Stream with 'async for' ---")
    async for event in async_event_stream(3):
        print(f"  Received: {event}")

    print("\n--- 2. Async List Comprehension (PEP 530) ---")
    all_events = [evt async for evt in async_event_stream(3)]
    print(f"  Aggregated List: {all_events}")

# 3. Clean Async Context Manager with @asynccontextmanager
@asynccontextmanager
async def managed_database_session(db_url: str):
    print(f"🔌 [AENTER] Connecting to {db_url}...")
    await asyncio.sleep(0.1)  # Async handshake
    session = {"url": db_url, "status": "CONNECTED"}
    try:
        yield session  # Hand control to block
    finally:
        print(f"⚡ [AEXIT] Disconnecting from {db_url}...")
        await asyncio.sleep(0.05)  # Async teardown

async def context_demo():
    async with managed_database_session("postgresql://prod-db:5432") as db:
        print(f"  Executing queries in session: {db['status']}")

if __name__ == "__main__":
    asyncio.run(stream_consumer())
    asyncio.run(context_demo())
```

---

## Detailed Explanation

### 1. The Asynchronous Iterator Protocol: `__aiter__` & `__anext__`

To create an asynchronous iterator class, implement two methods:
1. **`__aiter__(self)`**: Must return an object that implements `__anext__()` (usually `self`).
2. **`__anext__(self)`**: Must return an **Awaitable** that yields the next value on each iteration.
   - When the stream ends, it must raise **`StopAsyncIteration`** (the async equivalent of `StopIteration`).

```python
# Low-Level Async Iterator Class:
class AsyncCounter:
    def __init__(self, limit: int):
        self.limit = limit
        self.count = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.count >= self.limit:
            raise StopAsyncIteration  # Signals end of async stream!
        await asyncio.sleep(0.05)
        self.count += 1
        return self.count
```

---

### 2. Asynchronous Generators (PEP 525)

Writing explicit `__aiter__` and `__anext__` classes involves significant boilerplate. **Asynchronous Generators** simplify this dramatically:

Whenever you place a **`yield` statement inside an `async def` function**, Python compiles it into an **Async Generator**:
- Every time `async for` requests a value, the generator executes until it encounters `yield`.
- It yields the value to the consumer, pauses its local execution frame, and returns control to the event loop.
- Memory consumption is strictly **$O(1)$ constant RAM**, regardless of whether you process 10 items or 10,000,000 items.

---

### 3. Asynchronous Context Managers: `__aenter__` & `__aexit__`

Standard synchronous context managers (`__enter__` / `__exit__`) cannot contain `await` expressions.

An **Asynchronous Context Manager** implements:
1. **`async def __aenter__(self)`**: Executed upon entering `async with`. Its return value is bound to the `as target` variable.
2. **`async def __aexit__(self, exc_type, exc_val, exc_tb)`**: Executed upon exiting the block, guaranteeing that network connections, locks, and file buffers are cleaned up asynchronously even if exceptions occur.

---

## Examples

### 1. Simple: Consuming Async Streams with `async for`
Iterating over a streaming number generator with non-blocking delays.

```python
import asyncio

async def async_range(start: int, stop: int, delay_sec: float = 0.05):
    for num in range(start, stop):
        await asyncio.sleep(delay_sec)
        yield num

async def main():
    print("Streaming Numbers Asynchronously:")
    async for val in async_range(1, 6):
        print(f"  • Streamed Number: {val}")

asyncio.run(main())
```

### 2. Beginner: High-Speed Streaming Log Parser
Reading and parsing simulated log streams in real-time in constant $O(1)$ RAM.

```python
import asyncio

async def log_tail_streamer(num_lines: int):
    severities = ["INFO", "WARNING", "ERROR", "CRITICAL"]
    for i in range(1, num_lines + 1):
        await asyncio.sleep(0.08)  # Simulates streaming network socket
        sev = severities[i % len(severities)]
        yield f"[{sev}] Service request #{i} processed"

async def filter_critical_errors():
    print("Streaming and Filtering Log Pipeline:")
    async for log_line in log_tail_streamer(8):
        if "ERROR" in log_line or "CRITICAL" in log_line:
            print(f"  🚨 ALERT: {log_line}")
        else:
            print(f"  ℹ️ {log_line}")

asyncio.run(filter_critical_errors())
```

### 3. Intermediate: Async Database Transaction Context Manager
Building an async context manager that automatically commits or rolls back database transactions.

```python
import asyncio

class AsyncDatabaseTransaction:
    def __init__(self, tx_id: str):
        self.tx_id = tx_id
        self.is_committed = False

    async def __aenter__(self):
        print(f"🗄️ [BEGIN] Opening Transaction '{self.tx_id}'...")
        await asyncio.sleep(0.05)  # Async network handshake
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            print(f"🚨 [ROLLBACK] Transaction '{self.tx_id}' failed with error: {exc_val}")
            await asyncio.sleep(0.05)  # Async rollback command
            return False  # Re-raise exception
        else:
            print(f"✅ [COMMIT] Transaction '{self.tx_id}' committed successfully.")
            await asyncio.sleep(0.05)  # Async commit command
            self.is_committed = True

async def main():
    # 1. Successful Transaction
    async with AsyncDatabaseTransaction("TX-1001") as tx:
        print("  • Executing INSERT INTO users VALUES ('Hesam');")

    # 2. Failed Transaction (Auto-Rollback)
    try:
        async with AsyncDatabaseTransaction("TX-1002") as tx:
            print("  • Executing UPDATE accounts SET balance = -100;")
            raise ValueError("Balance constraint violation!")
    except ValueError as err:
        print(f"  Caught handled error: {err}")

asyncio.run(main())
```

### 4. Real-World: Server-Sent Events (SSE) Streaming Pipeline with Async Generator
Building a streaming event endpoint generator suitable for FastAPI / Starlette `StreamingResponse`.

```python
import asyncio
import json
import time

async def real_time_market_sse_stream(ticker: str, max_ticks: int = 5):
    """Async Generator yielding SSE (Server-Sent Events) formatted strings."""
    price = 100.0
    for tick_id in range(1, max_ticks + 1):
        await asyncio.sleep(0.1)  # 100ms market tick rate
        price += (tick_id * 0.75)
        
        payload = {
            "tick": tick_id,
            "ticker": ticker,
            "price": round(price, 2),
            "timestamp": time.time()
        }
        
        # SSE Wire Format: data: <json>\n\n
        sse_event = f"data: {json.dumps(payload)}\n\n"
        yield sse_event

async def sse_client_consumer():
    print("Listening to Server-Sent Events (SSE) Stream:")
    print("-" * 55)
    async for sse_chunk in real_time_market_sse_stream("AAPL", max_ticks=4):
        # Strip trailing newlines for clean printing
        print(f"📡 [SSE RECEIVED] {sse_chunk.strip()}")
    print("-" * 55)

asyncio.run(sse_client_consumer())
```

### 5. Advanced: Distributed Async Lock Context with `@asynccontextmanager`
Building an async distributed lock pattern using `@contextlib.asynccontextmanager`.

```python
import asyncio
from contextlib import asynccontextmanager

class MockRedisCluster:
    def __init__(self):
        self.active_locks = set()

    async def acquire_lock(self, lock_key: str) -> bool:
        await asyncio.sleep(0.02)
        if lock_key in self.active_locks: return False
        self.active_locks.add(lock_key)
        return True

    async def release_lock(self, lock_key: str):
        await asyncio.sleep(0.02)
        self.active_locks.discard(lock_key)

redis_cluster = MockRedisCluster()

@asynccontextmanager
async def distributed_async_lock(resource_name: str, timeout_sec: float = 2.0):
    lock_key = f"lock:{resource_name}"
    acquired = await redis_cluster.acquire_lock(lock_key)
    if not acquired:
        raise TimeoutError(f"Could not acquire distributed lock for '{resource_name}'")

    print(f"🔒 [LOCKED] Acquired lock for resource: {resource_name}")
    try:
        yield lock_key
    finally:
        await redis_cluster.release_lock(lock_key)
        print(f"🔓 [UNLOCKED] Released lock for resource: {resource_name}")

async def distributed_worker(worker_id: int):
    async with distributed_async_lock("order_settlement_pipeline"):
        print(f"  Worker #{worker_id} executing critical order settlement...")
        await asyncio.sleep(0.1)

async def main():
    await distributed_worker(1)

asyncio.run(main())
```

---

## Code Explanation

In Example 4 (`SSE Streaming Generator`):
1. **`real_time_market_sse_stream`** is an asynchronous generator.
2. When called, it does not generate all ticks in memory; instead, it returns an **Async Generator Object**.
3. Inside `async for`, the consumer requests the next chunk $\rightarrow$ the generator executes until `await asyncio.sleep(0.1)` $\rightarrow$ yields the formatted SSE chunk $\rightarrow$ suspends.
4. This delivers a continuous, real-time data stream to thousands of connected web clients simultaneously, with **zero thread blocking and minimal memory footprint**.

---

## Common Mistakes

### Mistake 1: Using Regular `for` on an Async Generator
Writing `for item in async_generator():`
- Raises: `TypeError: 'async_generator' object is not iterable`.
- Always use **`async for item in async_generator():`**.

### Mistake 2: Using Regular `with` on an Async Context Manager
Writing `with async_context():`
- Raises: `AttributeError: __enter__`.
- Always use **`async with async_context():`**.

---

## Best Practices

### Use `@contextlib.asynccontextmanager` for Lightweight Resources
Instead of writing full classes with `__aenter__` and `__aexit__`, use the standard library `@asynccontextmanager` decorator for clean, concise resource management.

Good:
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def async_resource():
    resource = await setup()
    try:
        yield resource
    finally:
        await teardown(resource)
```

---

## Performance Considerations

| Approach | 100,000 Records Memory | Stream Latency |
|---|---|---|
| **Eager List (`return [records]`)** | **~50 MB RAM** | High (Waits for full batch) |
| **Async Generator (`yield record`)**| **< 1 KB RAM ($O(1)$)** | **Near-Zero (Real-Time)** |

---

## Security Considerations

1. **Deterministic Resource Cleanup in `__aexit__`**: Ensure that database connections, cryptographic sessions, and file descriptors are unconditionally closed inside `finally:` or `__aexit__` blocks, even when unexpected `asyncio.CancelledError` exceptions occur.

---

## Real-World Usage

- **FastAPI / Starlette `StreamingResponse`**: Streaming large CSVs, audio files, and LLM token completions (`async for token in llm.stream()`).
- **`asyncpg` Database Cursors**: Streaming millions of database rows via `async for record in connection.cursor()`.
- **`aiofiles`**: Non-blocking asynchronous file reading and writing.

---

## Comparison: Iterators & Context Managers

| Protocol | Synchronous | Asynchronous | Execution Mode |
|---|---|---|---|
| **Iteration** | `for x in iter:` (`__iter__`/`__next__`) | **`async for x in iter:` (`__aiter__`/`__anext__`)**| Non-blocking event loop |
| **Generators** | `def gen(): yield x` | **`async def gen(): yield x`** | Lazy $O(1)$ RAM streaming |
| **Context Managers**| `with ctx:` (`__enter__`/`__exit__`) | **`async with ctx:` (`__aenter__`/`__aexit__`)**| Async setup and teardown |

---

## Advanced Concepts: Cleaning Up Async Generators with `aclosing()`

If an `async for` loop breaks early (e.g. via `break` or an exception), the async generator might not execute its `finally` cleanup block immediately. Use **`contextlib.aclosing()`** to guarantee immediate cleanup:

```python
from contextlib import aclosing

async def process_partial():
    async with aclosing(real_time_market_sse_stream("TSLA", 100)) as stream:
        async for chunk in stream:
            print("Received:", chunk.strip())
            break  # Early exit! aclosing guarantees generator is cleanly closed!
```

---

## Exercises

### Exercise 1 — Beginner
Write an async generator `async_countdown(n)` that counts down from $n$ to 1 with a 0.1s delay. Consume it with `async for`.

### Exercise 2 — Intermediate
Build an async context manager `AsyncFileLogger(filename)` that opens a simulated file on `__aenter__`, provides a `.log(msg)` method, and flushes/closes the file on `__aexit__`.

### Exercise 3 — Advanced
Build an `AsyncBatchAggregator` async generator that consumes an incoming single-item async stream and yields batched chunks of size $N$ (or flushes early if a 0.5s timeout occurs).

---

## Mini Project: Enterprise Real-Time Financial Tick Stream Ingestor & Streaming Analytics Pipeline

### Requirements
Build an operational real-time market tick ingestor named `market_tick_streamer.py`. Implement an async generator streaming synthetic stock ticks, build an async context manager managing an audit session, compute rolling volume-weighted statistics lazily with $O(1)$ memory, and render streaming analytics to the console.

### Implementation Blueprint
```python
import asyncio
import random
import time
from dataclasses import dataclass
from contextlib import asynccontextmanager

# =====================================================================
# 1. STREAMING DATA MODEL
# =====================================================================

@dataclass
class MarketTick:
    symbol: str
    price: float
    volume: int
    timestamp: float

# =====================================================================
# 2. ASYNC STREAM GENERATOR (O(1) MEMORY)
# =====================================================================

async def live_market_feed(symbol: str, base_price: float, total_ticks: int = 8):
    """Asynchronous generator streaming live market ticks."""
    current_price = base_price
    print(f"📡 [FEED ACTIVE] Subscribed to real-time ticker stream for '{symbol}'...")

    for i in range(1, total_ticks + 1):
        await asyncio.sleep(0.08)  # 80ms interval
        
        # Random walk price variation
        price_delta = random.uniform(-0.50, 0.65)
        current_price = max(1.0, current_price + price_delta)
        volume = random.randint(10, 500)
        
        yield MarketTick(symbol, round(current_price, 2), volume, time.time())

# =====================================================================
# 3. ASYNC AUDIT SESSION CONTEXT MANAGER
# =====================================================================

@asynccontextmanager
async def market_audit_session(session_id: str):
    print(f"\n🔐 [AUDIT SESSION BEGIN] Initializing Audit Session '{session_id}'...")
    await asyncio.sleep(0.05)
    
    session_metadata = {"session_id": session_id, "start_time": time.time(), "ticks_processed": 0}
    
    try:
        yield session_metadata
    finally:
        duration = time.time() - session_metadata["start_time"]
        print(f"\n🔒 [AUDIT SESSION CLOSED] Session '{session_id}' finalized.")
        print(f"   • Total Ticks Processed : {session_metadata['ticks_processed']}")
        print(f"   • Session Duration      : {duration:.2f} seconds")

# =====================================================================
# 4. STREAMING ANALYTICS CONSUMER
# =====================================================================

async def run_streaming_pipeline():
    border = "=" * 68
    print(border)
    print("      ENTERPRISE REAL-TIME ASYNC TICK STREAMING PIPELINE")
    print(border)

    async with market_audit_session("AUDIT-NY-9901") as session:
        symbol = "NVDA"
        total_vol = 0
        weighted_sum = 0.0
        min_price = float("inf")
        max_price = float("-inf")

        print(f"{'TICK':<6} {'SYMBOL':<8} {'PRICE ($)':>10} {'VOLUME':>8} {'CUMULATIVE VWAP':>18}")
        print("-" * 68)

        # Consuming Async Generator with async for
        tick_idx = 1
        async for tick in live_market_feed(symbol, base_price=125.00, total_ticks=6):
            session["ticks_processed"] += 1
            
            # Update running statistics in constant O(1) RAM!
            total_vol += tick.volume
            weighted_sum += (tick.price * tick.volume)
            vwap = weighted_sum / total_vol
            min_price = min(min_price, tick.price)
            max_price = max(max_price, tick.price)

            print(f"#{tick_idx:<5} {tick.symbol:<8} ${tick.price:>9.2f} {tick.volume:>8} ${vwap:>17.2f}")
            tick_idx += 1

        print("-" * 68)
        print(f"📊 SUMMARY METRICS: Min Price: ${min_price:.2f} │ Max Price: ${max_price:.2f}")

    print(border)

if __name__ == "__main__":
    asyncio.run(run_streaming_pipeline())
```

---

## Summary

In this lesson, you mastered Async Iterators, Generators, and Context Managers in Python:
- **`__aiter__()`** and **`__anext__()`** define the Asynchronous Iterator protocol, consumed via **`async for`**.
- **Asynchronous Generators** (`yield` inside `async def`) stream real-time data lazily in **constant $O(1)$ memory**.
- **`__aenter__()`** and **`__aexit__()`** define Asynchronous Context Managers, consumed via **`async with`** for deterministic non-blocking cleanup.
- Use **`@contextlib.asynccontextmanager`** to build clean, lightweight async resource managers.
- Use **`async for` in comprehensions** (`[x async for x in stream]`) for clean stream aggregation.

---

## Best Practices Checklist

- [ ] Use `async for` when consuming asynchronous iterators and generators.
- [ ] Use `async with` for non-blocking resource acquisition and teardown.
- [ ] Use `@contextlib.asynccontextmanager` for clean, generator-based async context managers.
- [ ] Stream large datasets using async generators to maintain constant $O(1)$ RAM.
- [ ] Wrap unconsumed async generators in `contextlib.aclosing()` to ensure cleanup.

---

## What's Next?

Now that you understand Async Iteration and Context Managers, continue to:
👉 **[Async Queues & Synchronization Primitives](async-queues-and-synchronization.md)** to master async Producer-Consumer pipelines, `asyncio.Queue`, `asyncio.Lock`, and `asyncio.Semaphore`!
