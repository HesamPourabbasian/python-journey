# Tasks, Gathering & Structured Concurrency in Python

## Introduction

In basic AsyncIO, running coroutines sequentially with `await my_coroutine()` executes them one after another.

To achieve true concurrent execution, we wrap coroutines into **`asyncio.Task`** objects using **`asyncio.create_task()`**, which schedules them to run immediately in the background on the active Event Loop.

Historically, Python developers coordinated multiple background tasks using **`asyncio.gather()`**. However, `gather` suffered from **Unstructured Concurrency**: if one task raised an unhandled exception, sibling tasks continued running in the background as orphaned "zombie" tasks, leaking memory, open sockets, and database connections.

To solve this, Python 3.11 introduced **Structured Concurrency (PEP 654 & PEP 678)** via **`asyncio.TaskGroup`** and **`ExceptionGroup` (`except*`)**:
- An `asyncio.TaskGroup` context manager guarantees that **all child tasks must complete or be cancelled before the context block exits**.
- If any child task fails, all sibling tasks in the group are **automatically cancelled immediately**.
- Multiple concurrent exceptions are bundled into an **`ExceptionGroup`** and handled cleanly using the **`except*`** syntax.
- Granular, composable timeouts are handled via **`async with asyncio.timeout()`**.

This lesson explores `create_task`, `gather`, the modern `TaskGroup` architecture, task cancellation mechanics (`CancelledError`), and timeout management.

---

## Prerequisites

Before studying tasks and structured concurrency, ensure you have:

- Completed [AsyncIO Event Loop & Coroutines](asyncio-event-loop-coroutines.md).
- Solid understanding of Python exception handling (`try`/`except`/`finally`).
- Familiarity with context managers (`with` / `async with`).

---

## Core Concept: Unstructured vs Structured Concurrency

```
                     UNSTRUCTURED CONCURRENCY (asyncio.gather / create_task)
      Main Task
          │
          ├───► Task 1: ════════════════════════════════════════════► (Finished)
          ├───► Task 2: ═══════════► 💥 FAILS! (Raises Exception)
          └───► Task 3: ════════════════════════════════════════════► 🧟 ORPHANED LEAK!
                (Task 3 continues running indefinitely in background!)

                     STRUCTURED CONCURRENCY (Python 3.11+ asyncio.TaskGroup)
      Main Task
          │
      async with asyncio.TaskGroup() as tg:
          ├───► Task 1: ═══════► 🛑 CANCELLED! (Auto-cancelled upon Task 2 failure)
          ├───► Task 2: ═══════► 💥 FAILS! (Raises Exception)
          └───► Task 3: ═══════► 🛑 CANCELLED! (Auto-cancelled upon Task 2 failure)
          │
      (Guaranteed: Zero orphaned tasks leave this block!)
```

---

## Syntax & Essential Structured Concurrency Patterns

```python
import asyncio

async def worker(task_id: int, delay_sec: float) -> str:
    await asyncio.sleep(delay_sec)
    return f"Task-{task_id} OK"

# 1. Structured Concurrency with asyncio.TaskGroup (Python 3.11+)
async def modern_structured_demo():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(worker(1, 0.1))
        t2 = tg.create_task(worker(2, 0.2))
        t3 = tg.create_task(worker(3, 0.15))
    
    # Both tasks are GUARANTEED to be finished once context manager exits!
    print("All tasks completed:", [t1.result(), t2.result(), t3.result()])

# 2. Modern Timeout Management with asyncio.timeout (Python 3.11+)
async def timeout_demo():
    try:
        async with asyncio.timeout(0.3):  # 300ms deadline!
            await asyncio.sleep(0.5)      # Will exceed deadline!
    except TimeoutError:
        print("⚡ Operation cancelled: Exceeded 0.3s deadline!")

if __name__ == "__main__":
    asyncio.run(modern_structured_demo())
    asyncio.run(timeout_demo())
```

---

## Detailed Explanation

### 1. The Mechanics of `asyncio.TaskGroup`

The `asyncio.TaskGroup` context manager provides strict structural guarantees:

1. **Deterministic Lifetime**: When the `async with asyncio.TaskGroup() as tg:` block is entered, you spawn tasks via `tg.create_task(coro)`.
2. **Cooperative Barrier**: When the block reaches the end, it waits asynchronously until **every single task in the group has completed**.
3. **Automatic Error Cascading**: If *any* task raises an exception:
   - The TaskGroup immediately calls `task.cancel()` on **all remaining active tasks in the group**.
   - It waits for cancelled tasks to perform cleanup.
   - It collects all raised exceptions and raises a compound **`ExceptionGroup`**.

---

### 2. Exception Groups & The `except*` Syntax (Python 3.11+)

When multiple concurrent tasks raise different exceptions simultaneously, standard Python `except ValueError:` cannot catch multiple unrelated errors at once.

Python 3.11 introduced **`except*`** to match and handle specific types of errors from an `ExceptionGroup`:

```python
async def faulty_task_1():
    raise ValueError("Invalid configuration value!")

async def faulty_task_2():
    raise KeyError("Missing authentication token!")

async def error_handling_demo():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(faulty_task_1())
            tg.create_task(faulty_task_2())
    except* ValueError as eg:
        # Handles all ValueErrors in the group!
        print(f"Caught ValueErrors: {eg.exceptions}")
    except* KeyError as eg:
        # Handles all KeyErrors in the group!
        print(f"Caught KeyErrors: {eg.exceptions}")
```

---

### 3. Task Cancellation & `asyncio.CancelledError`

When `task.cancel()` is called:
1. The next time the task hits an `await` expression, CPython injects an **`asyncio.CancelledError`** exception into the coroutine.
2. The task can execute `try ... finally` blocks to close open sockets and clean up resources.
3. 🚨 **Critical Rule**: If you catch `CancelledError`, you **MUST re-raise it** unless you are intentionally ignoring the cancellation! Catching `Exception` will **not** catch `CancelledError` (in Python 3.8+, `CancelledError` inherits from `BaseException`).

---

## Examples

### 1. Simple: Spawning Background Tasks with `asyncio.create_task`
Launching non-blocking background tasks and waiting for their results.

```python
import asyncio
import time

async def async_fetch(source_name: str, delay: float) -> str:
    print(f"🌐 [START] Querying {source_name}...")
    await asyncio.sleep(delay)
    print(f"✅ [DONE]  Received data from {source_name}")
    return f"Data from {source_name}"

async def main():
    t0 = time.perf_counter()

    # create_task schedules coroutines onto the event loop immediately!
    task1 = asyncio.create_task(async_fetch("Database", 0.3))
    task2 = asyncio.create_task(async_fetch("RedisCache", 0.1))
    task3 = asyncio.create_task(async_fetch("Elasticsearch", 0.2))

    # Await results concurrently
    r1 = await task1
    r2 = await task2
    r3 = await task3

    elapsed = time.perf_counter() - t0
    print(f"\nAll 3 tasks finished in {elapsed:.2f}s (Concurrent wall-clock time!)")

asyncio.run(main())
```

### 2. Beginner: Error Tolerant Gathering with `asyncio.gather(return_exceptions=True)`
Gathering multiple tasks where individual failures return exception objects instead of crashing sibling tasks.

```python
import asyncio

async def reliable_service():
    await asyncio.sleep(0.1)
    return "Service A OK"

async def broken_service():
    await asyncio.sleep(0.15)
    raise ConnectionRefusedError("Database port 5432 unreachable!")

async def fallback_service():
    await asyncio.sleep(0.05)
    return "Service C OK"

async def main():
    # return_exceptions=True captures exceptions as return values!
    results = await asyncio.gather(
        reliable_service(),
        broken_service(),
        fallback_service(),
        return_exceptions=True
    )

    print("Gathered Results:")
    for i, res in enumerate(results, start=1):
        if isinstance(res, Exception):
            print(f"  • Task #{i} FAILED  : {res}")
        else:
            print(f"  • Task #{i} SUCCESS : {res}")

asyncio.run(main())
```

### 3. Intermediate: Structured Concurrency with `asyncio.TaskGroup`
Using Python 3.11+ `TaskGroup` to guarantee zero task leakage.

```python
import asyncio

async def fetch_user_data(user_id: int) -> dict:
    await asyncio.sleep(0.1)
    return {"user_id": user_id, "name": "Hesam"}

async def fetch_user_orders(user_id: int) -> list[str]:
    await asyncio.sleep(0.15)
    return ["ORD-101", "ORD-102"]

async def main():
    print("Executing Structured Concurrency TaskGroup...")
    async with asyncio.TaskGroup() as tg:
        user_task = tg.create_task(fetch_user_data(101))
        order_task = tg.create_task(fetch_user_orders(101))

    # Context block will not exit until both tasks finish!
    user = user_task.result()
    orders = order_task.result()

    print(f"Aggregated Profile: {user['name']} has orders {orders}")

asyncio.run(main())
```

### 4. Real-World: Resilient Multi-API Query with `asyncio.timeout`
Enforcing strict latency SLAs across third-party API queries with automatic timeout cancellation.

```python
import asyncio
import time

async def third_party_partner_api(partner_name: str, simulated_latency: float) -> str:
    print(f"🚀 [CALLING] {partner_name} (Latency: {simulated_latency}s)...")
    await asyncio.sleep(simulated_latency)
    return f"Response from {partner_name}"

async def query_with_sla(partner_name: str, latency: float, sla_timeout_sec: float) -> str:
    try:
        # Enforce strict SLA timeout
        async with asyncio.timeout(sla_timeout_sec):
            return await third_party_partner_api(partner_name, latency)
    except TimeoutError:
        print(f"⚠️ [SLA VIOLATION] {partner_name} timed out after {sla_timeout_sec}s! Using Fallback.")
        return f"Fallback cached data for {partner_name}"

async def main():
    start = time.perf_counter()
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(query_with_sla("StripeAPI", 0.15, sla_timeout_sec=0.3)) # Will succeed
        t2 = tg.create_task(query_with_sla("LegacyVendor", 0.80, sla_timeout_sec=0.3)) # Will timeout!

    print(f"\nFinal Aggregation: {[t1.result(), t2.result()]}")
    print(f"Total Elapsed Time: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
```

### 5. Advanced: Graceful Task Cancellation & Resource Cleanup
Handling `CancelledError` to ensure open database transactions are rolled back during task cancellation.

```python
import asyncio

async def long_running_database_transaction():
    print("🗄️ [DB] Transaction opened. Beginning 5-second batch insert...")
    try:
        for i in range(1, 6):
            await asyncio.sleep(0.5)
            print(f"   • Inserted batch #{i}")
        print("🗄️ [DB] Transaction committed successfully!")
    except asyncio.CancelledError:
        print("🚨 [DB CANCELLED] Received cancellation signal! Performing rollback...")
        await asyncio.sleep(0.05)  # Simulate DB rollback cleanup
        print("🛡️ [DB ROLLBACK COMPLETE] Database integrity preserved.")
        raise  # CRITICAL: Re-raise CancelledError!

async def main():
    task = asyncio.create_task(long_running_database_transaction())
    
    # Let task run for 1.2 seconds, then cancel it!
    await asyncio.sleep(1.2)
    print("\n[MAIN] Cancelling transaction task...")
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print("[MAIN] Task cancellation confirmed cleanly.")

asyncio.run(main())
```

---

## Code Explanation

In Example 5 (`Graceful Cancellation`):
1. The transaction worker runs in the background, executing batch inserts.
2. When the main task calls `task.cancel()`, AsyncIO injects an **`asyncio.CancelledError`** into the worker at its next `await asyncio.sleep()` suspension point.
3. The worker enters the `except asyncio.CancelledError:` block, executing critical database rollback logic.
4. The worker executes `raise` to re-raise the `CancelledError`, informing the event loop that the task has successfully cancelled.
5. This prevents dangling uncommitted database locks in production microservices.

---

## Common Mistakes

### Mistake 1: Swallowing `asyncio.CancelledError`
```python
# 🚨 DANGEROUS BUG:
try:
    await asyncio.sleep(10)
except BaseException: # Or except asyncio.CancelledError:
    pass # 💥 Swallowed! The event loop cannot cancel this task!
```
$$\textbf{Rule: If you catch \texttt{CancelledError}, perform cleanup and ALWAYS re-raise it!}$$

### Mistake 2: Not Storing a Strong Reference to Background Tasks
Calling `asyncio.create_task(some_coro())` without storing the returned task variable in a set or list.
In CPython, if the task variable goes out of scope, the **Garbage Collector can destroy the Task object mid-execution**, abruptly terminating your background job!

---

## Best Practices

### Default to `asyncio.TaskGroup` in Python 3.11+
Always prefer `asyncio.TaskGroup` over `asyncio.gather` for new code. It provides structured concurrency, guarantees zero orphaned background tasks, and provides clean exception handling via `except*`.

Good:
```python
async with asyncio.TaskGroup() as tg:
    t1 = tg.create_task(task_a())
    t2 = tg.create_task(task_b())
```

---

## Performance Considerations

- **Task Allocation**: Spawning an `asyncio.Task` allocates $< 1\text{ KB}$ of RAM and executes in under 2 microseconds. You can comfortably spawn 50,000+ concurrent tasks in a single process.
- **TaskGroup Overhead**: `TaskGroup` adds near-zero overhead while eliminating the severe performance and resource leak penalties of orphaned background tasks.

---

## Security Considerations

1. **Unbounded Task Spawning DoS**: Never spawn tasks directly from unauthenticated user HTTP inputs without concurrency rate limits. Use `asyncio.Semaphore` to cap active background tasks.

---

## Real-World Usage

- **FastAPI Dependency Injection**: Executing multiple async database queries and auth checks concurrently with `TaskGroup`.
- **High-Frequency Trading Engines**: Querying multiple market liquidity providers simultaneously with sub-millisecond timeouts.
- **Microservice Orchestration**: Fan-out / Fan-in distributed API aggregation.

---

## Comparison: Async Task Orchestration APIs

| Tool | Python Version | Concurrency Model | Error Behavior |
|---|---|---|---|
| **`asyncio.gather()`** | 3.4+ | Unstructured | Sibling tasks continue running on error |
| **`asyncio.create_task()`**| 3.7+ | Fire-and-Forget | Unbounded, manual tracking needed |
| **`asyncio.TaskGroup`** | **3.11+** | **Structured Concurrency**| **Auto-cancels all siblings on error!** |
| **`asyncio.timeout()`** | **3.11+** | **Context Manager** | **Clean `TimeoutError` cancellation** |

---

## Advanced Concepts: Task Introspection

You can introspect all currently active tasks running on the event loop:

```python
import asyncio

async def inspect_active_tasks():
    current = asyncio.current_task()
    all_active = asyncio.all_tasks()
    print(f"Current Task: {current.get_name()}")
    print(f"Total Active Tasks on Loop: {len(all_active)}")

asyncio.run(inspect_active_tasks())
```

---

## Exercises

### Exercise 1 — Beginner
Use `asyncio.create_task()` to spawn 3 background tasks fetching data with different delays, await them, and print the completed results.

### Exercise 2 — Intermediate
Use `asyncio.TaskGroup` to run 4 tasks concurrently. Make one task raise a `ValueError`, and catch it using Python 3.11+ `except* ValueError:`, verifying that sibling tasks were cleanly cancelled.

### Exercise 3 — Advanced
Build a `ResilientAsyncRequester` that executes an async HTTP request with a 200ms `asyncio.timeout()`, retrying up to 3 times with exponential backoff if a timeout occurs.

---

## Mini Project: Enterprise Resilient Multi-Provider Market Price Aggregator

### Requirements
Build an operational financial market price aggregation engine named `market_price_aggregator.py`. Concurrently query multiple mock cryptocurrency exchange endpoints using `asyncio.TaskGroup`, enforce strict latency SLAs with `asyncio.timeout()`, handle simulated exchange failures, calculate volume-weighted average prices, and generate formatted price ticker reports.

### Implementation Blueprint
```python
import asyncio
import time
import random
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. MARKET DATA MODEL
# =====================================================================

@dataclass
class MarketQuote:
    exchange_name: str
    symbol: str
    price_usd: float
    volume_24h: float
    latency_ms: float
    is_success: bool
    error_reason: Optional[str] = None

# =====================================================================
# 2. EXCHANGE QUERY WORKER
# =====================================================================

async def query_exchange_feed(exchange: str, symbol: str, base_price: float) -> MarketQuote:
    t0 = time.perf_counter()
    
    # Simulate network latency
    delay = random.uniform(0.05, 0.28)
    await asyncio.sleep(delay)

    # Simulate random exchange outage for 'KrakenSim'
    if exchange == "KrakenSim":
        raise ConnectionResetError("Exchange API Rate Limit Exceeded (HTTP 429)")

    # Price variance (+/- 0.5%)
    variance = random.uniform(-0.005, 0.005)
    price = round(base_price * (1.0 + variance), 2)
    volume = round(random.uniform(500, 5000), 1)

    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return MarketQuote(exchange, symbol, price, volume, round(elapsed_ms, 1), is_success=True)

# =====================================================================
# 3. STRUCTURED CONCURRENCY AGGREGATOR
# =====================================================================

class MarketPriceAggregator:
    EXCHANGES = ["BinanceSim", "CoinbaseSim", "KrakenSim", "BybitSim", "OKXSim"]

    @classmethod
    async def fetch_aggregated_ticker(cls, symbol: str, base_price: float, timeout_sec: float = 0.20) -> list[MarketQuote]:
        quotes: list[MarketQuote] = []

        async def _safe_fetch(exchange_name: str):
            try:
                # Enforce strict per-feed SLA timeout!
                async with asyncio.timeout(timeout_sec):
                    q = await query_exchange_feed(exchange_name, symbol, base_price)
                    quotes.append(q)
            except TimeoutError:
                quotes.append(MarketQuote(
                    exchange_name=exchange_name,
                    symbol=symbol,
                    price_usd=0.0,
                    volume_24h=0.0,
                    latency_ms=timeout_sec * 1000.0,
                    is_success=False,
                    error_reason=f"SLA Timeout (> {timeout_sec*1000:.0f}ms)"
                ))
            except Exception as err:
                quotes.append(MarketQuote(
                    exchange_name=exchange_name,
                    symbol=symbol,
                    price_usd=0.0,
                    volume_24h=0.0,
                    latency_ms=0.0,
                    is_success=False,
                    error_reason=str(err)
                ))

        # Structured Concurrency: Query all exchanges in parallel!
        async with asyncio.TaskGroup() as tg:
            for exc in cls.EXCHANGES:
                tg.create_task(_safe_fetch(exc))

        return quotes

    @classmethod
    def render_report(cls, symbol: str, quotes: list[MarketQuote]):
        border = "=" * 70
        print("\n" + border)
        print(f"      ENTERPRISE MARKET PRICE AGGREGATION ENGINE: {symbol}")
        print(border)
        print(f"{'EXCHANGE':<14} {'STATUS':<10} {'PRICE (USD)':>14} {'VOLUME':>10} {'LATENCY':>12}")
        print("-" * 70)

        valid_quotes = [q for q in quotes if q.is_success]
        for q in quotes:
            if q.is_success:
                print(f"{q.exchange_name:<14} {'✅ OK':<10} ${q.price_usd:>13,.2f} {q.volume_24h:>10,.1f} {q.latency_ms:>10.1f}ms")
            else:
                print(f"{q.exchange_name:<14} {'❌ FAIL':<10} {'N/A':>14} {'N/A':>10} {q.error_reason:>22}")

        print("-" * 70)
        if valid_quotes:
            # Volume-Weighted Average Price (VWAP)
            total_vol = sum(q.volume_24h for q in valid_quotes)
            vwap = sum(q.price_usd * q.volume_24h for q in valid_quotes) / total_vol
            print(f"📊 CONSOLIDATED VWAP PRICE : ${vwap:,.2f} USD across {len(valid_quotes)} healthy feeds")
        print(border)

if __name__ == "__main__":
    async def run():
        results = await MarketPriceAggregator.fetch_aggregated_ticker("BTC/USD", base_price=64_500.00, timeout_sec=0.20)
        MarketPriceAggregator.render_report("BTC/USD", results)

    asyncio.run(run())
```

---

## Summary

In this lesson, you mastered Tasks, Gathering, and Structured Concurrency in AsyncIO:
- **`asyncio.create_task()`** schedules coroutines onto the active event loop for concurrent execution.
- **`asyncio.TaskGroup` (Python 3.11+)** delivers **Structured Concurrency**: all child tasks are guaranteed to complete or cancel before block exit.
- If one task fails inside a `TaskGroup`, all remaining sibling tasks are **automatically cancelled immediately**, eliminating orphaned zombie tasks.
- Handle compound concurrent errors cleanly with **`except* ExceptionGroup`**.
- Enforce composable deadlines with **`async with asyncio.timeout(seconds):`**.
- Always re-raise **`asyncio.CancelledError`** after executing resource cleanup logic.

---

## Best Practices Checklist

- [ ] Use `asyncio.TaskGroup` for all multi-task orchestration in Python 3.11+.
- [ ] Keep strong references to background tasks to prevent garbage collection mid-flight.
- [ ] Always re-raise `asyncio.CancelledError` after performing cleanup.
- [ ] Wrap external async network calls in `async with asyncio.timeout()`.
- [ ] Use `except*` to pattern-match multiple concurrent exceptions.

---

## What's Next?

Now that you understand Tasks and Structured Concurrency, continue to:
👉 **[Async Iterators, Generators & Context Managers](async-iterators-and-context-managers.md)** to master streaming async pipelines, `__aiter__`, `__anext__`, and `async with` resource managers!
