# AsyncIO Event Loop & Coroutines in Python

## Introduction

In modern cloud computing, web backends frequently handle tens of thousands of concurrent client connections—such as incoming HTTP web requests, real-time WebSockets, microservice RPC calls, and streaming database queries.

Historically, servers used **Multi-Threading** to handle concurrent I/O: allocating one operating system thread per client connection. However, scaling to 10,000+ threads consumes gigabytes of RAM (each thread requires an 8 KB–8 MB stack) and burns CPU cycles on operating system kernel context switching (**The C10K Problem**).

Python solves this with **`asyncio`** (Asynchronous I/O), introduced in Python 3.4 (PEP 3156) and refined with native `async`/`await` syntax in Python 3.5 (PEP 492).

AsyncIO runs a single-threaded, cooperative **Event Loop** that leverages OS socket multiplexers (**`epoll` on Linux, `kqueue` on macOS, and `IOCP` on Windows**). Instead of blocking an OS thread while waiting for a network packet or database response, AsyncIO suspends the current **Coroutine** and executes other coroutines on the same thread, achieving extreme concurrency with minimal RAM.

This lesson opens **Module 4: Asynchronous Programming (AsyncIO) in Depth**, exploring coroutine mechanics, the event loop lifecycle, non-blocking I/O multiplexing, and avoiding the cardinal sin of AsyncIO: blocking the event loop.

---

## Prerequisites

Before studying AsyncIO, ensure you have:

- Completed [Iterators & Generators](../../intermediate/iterators-generators/README.md) (understanding `yield` and generator execution).
- Completed [Threading vs Multiprocessing](../concurrency/threading-vs-multiprocessing.md).
- Understanding of network I/O sockets and non-blocking operations.

---

## Core Concept: The AsyncIO Event Loop & Non-Blocking Multiplexing

```
                             THE ASYNCIO EVENT LOOP MODEL

     Single Operating System Thread
    ┌────────────────────────────────────────────────────────────────────────┐
    │                         THE EVENT LOOP                                 │
    │                                                                        │
    │    ┌──────────────────┐               ┌──────────────────┐             │
    │    │ Coroutine A      │               │ Coroutine B      │             │
    │    │ (Runs to await)  │               │ (Runs to await)  │             │
    │    └────────┬─────────┘               └────────┬─────────┘             │
    │             │                                  │                       │
    │             ▼ await non_blocking_io()          ▼ await db_query()      │
    │        [ Suspends ]                       [ Suspends ]                 │
    │             │                                  │                       │
    │             └────────────────┬─────────────────┘                       │
    │                              │                                         │
    │                              ▼                                         │
    │              OS Kernel Socket Multiplexer (epoll / kqueue)             │
    │              (Notifies event loop when network data arrives!)          │
    └────────────────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential AsyncIO Patterns

```python
import asyncio
import time

# 1. Defining a Native Coroutine Function
async def fetch_customer_record(customer_id: int) -> dict:
    print(f"📡 [START] Fetching Customer #{customer_id}...")
    # asyncio.sleep() is NON-BLOCKING: yields control back to event loop!
    await asyncio.sleep(0.5)
    print(f"✅ [DONE]  Customer #{customer_id} retrieved.")
    return {"id": customer_id, "name": "Hesam", "status": "ACTIVE"}

# 2. Main Coroutine Entrypoint
async def main():
    start_time = time.perf_counter()

    # Sequential execution: await one by one
    c1 = await fetch_customer_record(101)
    c2 = await fetch_customer_record(102)

    total_time = time.perf_counter() - start_time
    print(f"Sequential Execution Time: {total_time:.2f}s (0.5s + 0.5s = 1.0s)")

# 3. Starting the Event Loop (Root Entrypoint)
if __name__ == "__main__":
    # asyncio.run() creates a new event loop, executes main(), and cleans up
    asyncio.run(main())
```

---

## Detailed Explanation

### 1. What is a Coroutine?

When you define a function with **`async def`**, Python creates a **Coroutine Function**.

Calling a coroutine function does **NOT** execute its body immediately:
```python
async def sample():
    return 42

result = sample()
print(result) # <coroutine object sample at 0x104b28...> (Did NOT run yet!)
```
Calling `sample()` returns an un-executed **Coroutine Object**.

To execute a coroutine:
1. You must **`await`** it inside another coroutine: `val = await sample()`.
2. Or you must pass it to the root event loop: **`asyncio.run(sample())`**.

---

### 2. The 3 Types of "Awaitables" in Python

In Python, an object is **Awaitable** if it can be used in an `await` expression. There are exactly 3 types of awaitables:

1. **Coroutines**: Functions defined with `async def`.
2. **Tasks (`asyncio.Task`)**: Wrappers around coroutines that schedule them onto the event loop to run concurrently in the background.
3. **Futures (`asyncio.Future`)**: Low-level objects representing the eventual result of an asynchronous operation (similar to `concurrent.futures.Future`).

---

### 3. The Cardinal Sin of AsyncIO: Blocking the Event Loop

AsyncIO runs on a **single thread**.

If you call a synchronous, blocking function (like `time.sleep()`, `requests.get()`, or an infinite CPU loop) inside a coroutine:
- The entire thread freezes.
- The event loop cannot tick.
- **ALL other thousands of concurrent coroutines, WebSockets, and HTTP requests are completely frozen!**

```python
# 🚨 DISASTROUS ASYNCIO ANTI-PATTERN:
async def broken_handler():
    time.sleep(5) # 💥 FREEZES THE ENTIRE SERVER FOR 5 SECONDS!

# ✅ CORRECT NON-BLOCKING PATTERN:
async def correct_handler():
    await asyncio.sleep(5) # ⚡ Yields control to other coroutines!
```

---

### 4. What to Do with Blocking Sync Code: `asyncio.to_thread`

If you *must* call a legacy synchronous library (like standard `requests` or `boto3`), offload it to a worker thread using **`asyncio.to_thread()`** (Python 3.9+):

```python
import asyncio
import time

def legacy_blocking_file_read(filepath: str) -> str:
    time.sleep(0.5)  # Synchronous blocking I/O
    return f"Contents of {filepath}"

async def async_service():
    print("Reading file without freezing the event loop...")
    # Runs the synchronous function on a separate thread in ThreadPoolExecutor!
    contents = await asyncio.to_thread(legacy_blocking_file_read, "data.csv")
    print("Read completed:", contents)
```

---

## Examples

### 1. Simple: Inspecting Coroutine Lifecycle & State
Observing the creation, state, and execution of a coroutine.

```python
import asyncio
import inspect

async def compute_tax(amount: float) -> float:
    await asyncio.sleep(0.01)
    return amount * 0.15

async def demo():
    coro = compute_tax(100.0)
    print("Is it a coroutine object?", inspect.iscoroutine(coro)) # True
    print("Coroutine object representation:", coro)

    # Execute coroutine
    result = await coro
    print("Executed Result:", result)

asyncio.run(demo())
```

### 2. Beginner: Concurrent Execution with `asyncio.gather`
Demonstrating true cooperative concurrency by fetching 3 resources in parallel on a single thread.

```python
import asyncio
import time

async def async_download(file_name: str, delay: float):
    print(f"⬇️ [START] Downloading {file_name}...")
    await asyncio.sleep(delay)  # Non-blocking pause
    print(f"📦 [DONE]  Downloaded {file_name}")
    return f"{file_name} (Size: 1.2MB)"

async def main():
    start = time.perf_counter()

    # Run all 3 downloads concurrently on a single thread!
    results = await asyncio.gather(
        async_download("asset_1.png", 0.3),
        async_download("asset_2.png", 0.2),
        async_download("asset_3.png", 0.4),
    )

    elapsed = time.perf_counter() - start
    print(f"\nAll 3 downloads completed in {elapsed:.2f}s (Concurrent wall-clock time!)")
    print("Downloaded Assets:", results)

asyncio.run(main())
```

### 3. Intermediate: Event Loop Scheduling with `loop.call_later()`
Inspecting the running event loop and scheduling delayed callbacks.

```python
import asyncio
import time

def scheduled_heartbeat(msg: str):
    print(f"💓 [HEARTBEAT at {time.strftime('%X')}] {msg}")

async def main():
    loop = asyncio.get_running_loop()
    print("Current Running Event Loop:", loop)

    # Schedule non-async callback functions to execute at future timestamps
    loop.call_later(0.1, scheduled_heartbeat, "Ping 1")
    loop.call_later(0.3, scheduled_heartbeat, "Ping 2")
    loop.call_later(0.5, scheduled_heartbeat, "Ping 3")

    # Keep event loop running while timers fire
    await asyncio.sleep(0.6)

asyncio.run(main())
```

### 4. Real-World: Non-Blocking Microservice Health Checker
Pinging multiple microservice dependencies concurrently with latency metrics.

```python
import asyncio
import time
from dataclasses import dataclass

@dataclass
class ServiceHealth:
    service_name: str
    is_up: bool
    latency_ms: float

async def ping_microservice(name: str, simulated_delay: float, should_fail: bool = False) -> ServiceHealth:
    t0 = time.perf_counter()
    await asyncio.sleep(simulated_delay)
    
    if should_fail:
        return ServiceHealth(name, is_up=False, latency_ms=0.0)

    elapsed = (time.perf_counter() - t0) * 1000.0
    return ServiceHealth(name, is_up=True, latency_ms=round(elapsed, 1))

async def audit_all_services():
    print("Auditing Microservice Fleet Health Concurrently...")
    services = [
        ("AuthService", 0.15, False),
        ("BillingAPI", 0.25, False),
        ("SearchCluster", 0.40, True),  # Down
        ("NotificationBus", 0.10, False),
    ]

    # Gather health checks
    results = await asyncio.gather(*(ping_microservice(*s) for s in services))

    print("-" * 55)
    for res in results:
        status_icon = "✅ HEALTHY" if res.is_up else "🚨 OUTAGE"
        print(f"  • {res.service_name:<18} : {status_icon:<10} ({res.latency_ms:>5.1f} ms)")
    print("-" * 55)

asyncio.run(audit_all_services())
```

### 5. Advanced: Implementing a Custom Awaitable Class with `__await__`
Building a custom class that can be used directly in `await` expressions.

```python
import asyncio

class CustomAsyncTimer:
    """A custom awaitable object implementing the __await__ dunder method."""
    def __init__(self, duration_sec: float):
        self.duration_sec = duration_sec

    def __await__(self):
        # Must return an iterator (generator)
        return asyncio.sleep(self.duration_sec).__await__()

async def custom_timer_demo():
    print("Starting custom timer...")
    timer = CustomAsyncTimer(0.2)
    
    # Awaiting a custom object!
    await timer
    print("Custom timer expired successfully!")

asyncio.run(custom_timer_demo())
```

---

## Code Explanation

In Example 2 (`Concurrent asyncio.gather`):
1. Calling `async_download(...)` creates 3 coroutine objects.
2. **`asyncio.gather(*coroutines)`** wraps each coroutine in an `asyncio.Task` and registers all 3 tasks onto the active event loop.
3. The event loop starts Task 1 $\rightarrow$ Task 1 hits `await asyncio.sleep(0.3)` $\rightarrow$ yields control.
4. The event loop starts Task 2 $\rightarrow$ Task 2 hits `await asyncio.sleep(0.2)` $\rightarrow$ yields control.
5. The event loop starts Task 3 $\rightarrow$ Task 3 hits `await asyncio.sleep(0.4)` $\rightarrow$ yields control.
6. When the 0.2s timer expires, the OS notifies the event loop, which wakes up Task 2.
7. Total wall-clock time is **$\approx 0.4$ seconds (the duration of the slowest task)**, executed on a **single CPU thread**.

---

## Common Mistakes

### Mistake 1: Calling a Coroutine Without `await`
Writing `fetch_data(101)` inside an `async def` function without `await`.
- Python emits: `RuntimeWarning: coroutine 'fetch_data' was never awaited`.
- The function is **never executed**.

### Mistake 2: Calling `asyncio.run()` Inside an Already Running Event Loop
Calling `asyncio.run()` inside a FastAPI route or Jupyter Notebook raises:
`RuntimeError: asyncio.run() cannot be called from a running event loop`.
Inside existing async functions, simply use **`await`** or **`asyncio.create_task()`**.

---

## Best Practices

### Use `PYTHONASYNCIODEBUG=1` in Development
Enable AsyncIO debug mode during local development to automatically detect slow coroutines that block the event loop for $> 100\text{ ms}$:

```bash
PYTHONASYNCIODEBUG=1 python app.py
```

---

## Performance Considerations

| Concurrency Architecture | 10,000 Connections RAM | Context Switching Overhead |
|---|---|---|
| **Multi-Threading (`threading`)** | **~80 MB – 1 GB** | High (OS Kernel Preemption) |
| **Multi-Processing (`multiprocessing`)**| **~200 GB (Crash!)** | Extreme |
| **AsyncIO Event Loop** | **< 20 MB** | **Zero (User-space Cooperative)** |

---

## Security Considerations

1. **Async Denial-of-Service (Slowloris Attacks)**: If an attacker opens 10,000 slow network connections that never send data, an unbounded event loop can exhaust file descriptors. Always configure explicit timeouts on all async sockets.

---

## Real-World Usage

- **FastAPI / Starlette**: High-speed ASGI web backends.
- **Discord.py & Slack SDKs**: Handling thousands of live WebSocket event streams.
- **Celery Async Workers & Temporal**: Distributed workflow orchestrators.

---

## Comparison: AsyncIO vs Threading vs Multiprocessing

| Dimension | AsyncIO | Threading | Multiprocessing |
|---|---|---|---|
| **Paradigm** | **Cooperative Single-Thread**| Preemptive Multi-Thread | Preemptive Multi-Process |
| **Bypasses GIL?** | ❌ No | ❌ No | **✅ Yes (Multi-Core)** |
| **Memory Overhead** | **Lowest (< 1 KB / task)** | Moderate (~8 KB / thread)| High (~25 MB / proc) |
| **Best For** | **High-Scale Network I/O** | Legacy I/O Libraries | Heavy CPU Computation |

---

## Advanced Concepts: The CPython `_PyCoro_GetAwaitableIter` C-Slot

In CPython's C-core (`Objects/coroutineobject.c`), coroutines implement the `am_await` slot in their `PyAsyncMethods` struct. When `await` is compiled into bytecode (`GET_AWAITABLE`), the virtual machine extracts the internal iterator and yields control through the C-stack.

---

## Exercises

### Exercise 1 — Beginner
Write an `async def greet(name, delay)` coroutine that sleeps for `delay` seconds and prints a greeting. Use `asyncio.run()` and `asyncio.gather()` to greet 3 people concurrently.

### Exercise 2 — Intermediate
Write a function that uses `asyncio.to_thread()` to run a blocking synchronous function (like `hashlib.pbkdf2_hmac` with 1,000,000 rounds) without freezing the AsyncIO event loop.

### Exercise 3 — Advanced
Build a `RateLimitedAsyncPoller` that polls an async endpoint every 0.1s, measures latency variance, and logs a warning if any event loop tick was delayed by $> 50\text{ ms}$.

---

## Mini Project: Enterprise Event Loop Latency Monitor & Non-Blocking Async Poller

### Requirements
Build an operational event loop performance monitor named `event_loop_latency_monitor.py`. Measure event loop lag (the delay between when a coroutine was scheduled and when it actually executes), detect blocking operations, run concurrent async polling tasks, and generate formatted loop health statistics.

### Implementation Blueprint
```python
import asyncio
import time
from dataclasses import dataclass

# =====================================================================
# 1. EVENT LOOP LAG MONITOR
# =====================================================================

@dataclass
class LoopHealthMetrics:
    total_ticks: int
    max_lag_ms: float
    avg_lag_ms: float
    blocking_spikes_detected: int

class EventLoopLagMonitor:
    def __init__(self, check_interval_sec: float = 0.05, threshold_spike_ms: float = 20.0):
        self.check_interval = check_interval_sec
        self.threshold_spike_ms = threshold_spike_ms
        self.lags_ms: list[float] = []
        self.spikes = 0
        self._is_running = False

    async def start(self):
        self._is_running = True
        print(f"🔍 [LOOP MONITOR STARTED] Checking event loop jitter every {self.check_interval*1000:.0f} ms...")

        while self._is_running:
            expected_time = time.perf_counter() + self.check_interval
            await asyncio.sleep(self.check_interval)
            actual_time = time.perf_counter()

            # Lag is the difference between when we expected to wake up and when we actually did!
            lag_ms = (actual_time - expected_time) * 1000.0
            self.lags_ms.append(lag_ms)

            if lag_ms > self.threshold_spike_ms:
                self.spikes += 1
                print(f"  ⚠️ [EVENT LOOP JITTER SPIKE] Loop delayed by {lag_ms:.2f} ms (Blocking code detected!)")

    def stop(self) -> LoopHealthMetrics:
        self._is_running = False
        total = len(self.lags_ms)
        max_lag = max(self.lags_ms) if self.lags_ms else 0.0
        avg_lag = sum(self.lags_ms) / total if total > 0 else 0.0

        return LoopHealthMetrics(
            total_ticks=total,
            max_lag_ms=round(max_lag, 2),
            avg_lag_ms=round(avg_lag, 2),
            blocking_spikes_detected=self.spikes
        )

# =====================================================================
# 2. CONCURRENT ASYNC WORKLOAD
# =====================================================================

async def cooperative_task(task_id: int):
    for i in range(3):
        await asyncio.sleep(0.1)  # Clean non-blocking async
        # print(f"    • Task #{task_id} step {i+1}")

async def uncooperative_blocking_simulation():
    await asyncio.sleep(0.2)
    print("  🚨 [INJECTING SYNCHRONOUS BLOCK] Simulating 100ms blocking CPU calculation...")
    time.sleep(0.1)  # Intentionally blocking the thread!

# =====================================================================
# 3. VERIFICATION & RUNTIME ANALYSIS
# =====================================================================

async def main():
    border = "=" * 68
    print(border)
    print("      ENTERPRISE ASYNCIO EVENT LOOP HEALTH & JITTER MONITOR")
    print(border)

    monitor = EventLoopLagMonitor(check_interval_sec=0.05, threshold_spike_ms=25.0)
    monitor_task = asyncio.create_task(monitor.start())

    # Run cooperative tasks alongside simulated blocking spike
    await asyncio.gather(
        cooperative_task(1),
        cooperative_task(2),
        uncooperative_blocking_simulation(),
    )

    # Allow monitor to record final tick
    await asyncio.sleep(0.1)
    metrics = monitor.stop()
    monitor_task.cancel()

    # Render Report
    print("\n" + border)
    print("📊 EVENT LOOP HEALTH AUDIT REPORT:")
    print(border)
    print(f"  • Total Loop Ticks Measured : {metrics.total_ticks:>5}")
    print(f"  • Average Event Loop Lag    : {metrics.avg_lag_ms:>8.2f} ms")
    print(f"  • Maximum Lag Spike         : {metrics.max_lag_ms:>8.2f} ms")
    print(f"  • Blocking Spikes Detected  : {metrics.blocking_spikes_detected:>5}")
    print("-" * 68)
    if metrics.blocking_spikes_detected > 0:
        print("  ⚠️ ADVISORY: Event loop experienced blocking delays. Review synchronous calls.")
    else:
        print("  ✅ ADVISORY: Clean event loop execution with minimal jitter.")
    print(border)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Summary

In this lesson, you mastered the AsyncIO Event Loop and Coroutines:
- **AsyncIO** runs a single-threaded **Event Loop** multiplexing thousands of non-blocking I/O connections using OS kernel primitives (`epoll`/`kqueue`).
- **`async def`** defines a coroutine function that returns an un-executed **Coroutine Object**.
- **`await`** pauses the current coroutine, yielding control back to the event loop to execute other tasks.
- The 3 types of **Awaitables** are **Coroutines**, **Tasks**, and **Futures**.
- **Never call blocking synchronous code** (`time.sleep()`, `requests.get()`) inside coroutines; offload them using **`asyncio.to_thread()`**.
- Start root applications using **`asyncio.run()`**.

---

## Best Practices Checklist

- [ ] Always `await` coroutine calls to prevent `RuntimeWarning` unawaited errors.
- [ ] Use `asyncio.sleep()` instead of `time.sleep()`.
- [ ] Wrap unavoidable blocking synchronous libraries in `asyncio.to_thread()`.
- [ ] Use `asyncio.run()` only once at the top-level entrypoint of your application.
- [ ] Enable `PYTHONASYNCIODEBUG=1` during development to identify event loop blocking spikes.

---

## What's Next?

Now that you understand the Event Loop and Coroutines, continue to:
👉 **[Tasks, Gathering & Structured Concurrency](tasks-gathering-and-timeouts.md)** to master `create_task`, Python 3.11+ `TaskGroup`, handling `ExceptionGroup`, and cancellation timeouts!
