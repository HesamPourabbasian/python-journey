# Concurrent Futures & Worker Pools in Python

## Introduction

Before Python 3.2, writing concurrent software required managing low-level primitives: creating individual `threading.Thread` or `multiprocessing.Process` instances, managing synchronization locks, handling shared queues, and manually writing exception-forwarding logic.

To provide a modern, high-level, and unified concurrency abstraction, Python introduced the **`concurrent.futures`** module (PEP 3148).

`concurrent.futures` provides a clean, polymorphic **Executor Architecture**:
- **`ThreadPoolExecutor`**: High-performance thread pool for **I/O-bound workloads** (network APIs, database queries, disk access).
- **`ProcessPoolExecutor`**: Multi-core process pool for **CPU-bound workloads** (data crunching, cryptography, image processing).
- **`Future` Objects**: Encapsulate asynchronous execution, allowing callers to inspect progress (`done()`), cancel tasks (`cancel()`), attach completion callbacks (`add_done_callback()`), and catch exceptions (`result()`).
- **Stream Processing**: Consume completed tasks in real-time as they finish using **`as_completed()`**.

Because both executors adhere to the identical abstract `Executor` interface, you can switch an entire enterprise application from multi-threading to multi-processing by changing a single line of code.

This lesson concludes **Module 3: Concurrency & Parallelism in Depth**, exploring executor lifecycles, future states, error propagation, and bridging synchronous workers into AsyncIO.

---

## Prerequisites

Before studying `concurrent.futures`, ensure you have:

- Completed [Threading vs Multiprocessing](threading-vs-multiprocessing.md) and [Multiprocessing, Pools & IPC](multiprocessing-pools-and-queues.md).
- Understanding of futures/promises design patterns in computer science.
- Familiarity with exception handling and context managers.

---

## Core Concept: The Unified Executor & Future Lifecycle

```
                         THE UNIFIED EXECUTOR & FUTURE LIFECYCLE

      Client Application                                 Executor Worker Pool
     ┌────────────────────────────┐                     ┌───────────────────────────────┐
     │ future = executor.submit() │ ══════════════════► │ Worker Thread / Process 1     │
     │                            │                     │ Worker Thread / Process 2     │
     │ future.result()            │ ◄══════════════════ │ Worker Thread / Process 3     │
     └────────────────────────────┘                     └───────────────────────────────┘

                              THE FUTURE STATE TRANSITION GRAPH

                     ┌───────────┐  cancel()   ┌─────────────┐
                     │  PENDING  │ ──────────► │  CANCELLED  │
                     └─────┬─────┘             └─────────────┘
                           │ Task Starts
                           ▼
                     ┌───────────┐
                     │  RUNNING  │ (Cannot be cancelled once running!)
                     └─────┬─────┘
                           │ Task Completes / Exception
                           ▼
                     ┌───────────┐
                     │ FINISHED  │ ──► Triggers future.add_done_callback(fn)
                     └───────────┘
```

---

## Syntax & Essential `concurrent.futures` Patterns

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
import time

def fetch_data(item_id: int) -> dict:
    time.sleep(0.1)  # Simulate network latency
    return {"item_id": item_id, "status": "FETCHED"}

# 1. ThreadPoolExecutor with as_completed (Fastest-First Order!)
if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Submit tasks and collect Future objects
        future_to_id = {executor.submit(fetch_data, i): i for i in range(1, 6)}

        # as_completed yields futures the instant they complete!
        for future in as_completed(future_to_id):
            item_id = future_to_id[future]
            try:
                data = future.result(timeout=2.0)
                print(f"✅ Finished Task #{item_id} -> {data}")
            except Exception as err:
                print(f"🚨 Task #{item_id} failed: {err}")

    # 2. executor.map (Preserves Input Order!)
    with ThreadPoolExecutor(max_workers=2) as executor:
        results = executor.map(lambda x: x * 10, [1, 2, 3, 4])
        print("Mapped Results:", list(results)) # [10, 20, 30, 40]
```

---

## Detailed Explanation

### 1. `executor.submit()` vs `executor.map()`

- **`executor.submit(fn, *args, **kwargs)`**:
  - Submits a single task immediately and returns a **`Future`** object.
  - Allows passing arbitrary keyword arguments.
  - Allows attaching callbacks (`future.add_done_callback()`) and fine-grained exception handling.
  - Used with **`as_completed()`** for responsive streaming pipelines.
- **`executor.map(fn, *iterables, timeout=None, chunksize=1)`**:
  - Equivalent to built-in `map()`, but executes calls across worker threads/processes concurrently.
  - **Preserves input order**: Even if item #5 finishes before item #1, the iterator will not yield item #5 until items #1 through #4 have been yielded.

---

### 2. Exception Handling in Futures

A critical architectural feature of `concurrent.futures` is **Safe Exception Encapsulation**:

If a function executing inside a worker thread raises an unhandled exception (e.g. `ZeroDivisionError` or `ConnectionError`), **the worker thread does NOT crash the main program**.

Instead:
1. The executor catches the exception and stores it inside the `Future` object.
2. The future transitions to state `FINISHED`.
3. When the main thread calls **`future.result()`**, the saved exception is **re-raised in the main thread** with its original traceback!
4. Alternatively, you can inspect exceptions safely without raising using **`future.exception()`**.

---

### 3. Worker Pool Sizing Guidelines

How many workers should you configure in `max_workers`?

- **For `ThreadPoolExecutor` (I/O-Bound Workloads)**:
  $$\text{max\_workers} = \min(32, \text{os.cpu_count}() + 4) \quad\text{or up to } 100\text{ for slow network APIs}$$
  *Reason*: Threads spend most of their time sleeping during I/O; having many threads keeps the CPU saturated.
- **For `ProcessPoolExecutor` (CPU-Bound Workloads)**:
  $$\text{max\_workers} = \text{os.cpu_count}()$$
  *Reason*: Creating more processes than physical CPU cores causes CPU core thrashing and context-switch degradation.

---

## Examples

### 1. Simple: Submitting Tasks and Inspecting `Future` State
Inspecting future status methods (`done()`, `running()`, `result()`).

```python
from concurrent.futures import ThreadPoolExecutor
import time

def slow_calculation(x: int) -> int:
    time.sleep(0.2)
    return x * 100

with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(slow_calculation, 5)
    print("Is Future Done Immediately?", future.done()) # False

    # Block until result is available
    result = future.result()
    print("Is Future Done After Result?", future.done()) # True
    print("Computed Result:", result)
```

### 2. Beginner: Handling Exceptions in Worker Tasks Gracefully
Catching task failures without disrupting sibling worker tasks.

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def divide_numbers(a: int, b: int) -> float:
    if b == 0: raise ValueError(f"Cannot divide {a} by zero!")
    return a / b

tasks = [(10, 2), (20, 0), (30, 5), (40, 0), (50, 10)]

with ThreadPoolExecutor(max_workers=3) as executor:
    future_map = {executor.submit(divide_numbers, a, b): (a, b) for a, b in tasks}

    for future in as_completed(future_map):
        a, b = future_map[future]
        try:
            res = future.result()
            print(f"✅ Success: {a} / {b} = {res:.2f}")
        except ValueError as err:
            print(f"❌ Handled Error for ({a}, {b}): {err}")
```

### 3. Intermediate: Polymorphic Switching: ThreadPool vs ProcessPool
Writing a unified function that switches between threads and processes based on a configuration flag.

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, Executor
import time
import os

def worker_task(x: int) -> int:
    return x * x

def run_concurrent_pipeline(executor_cls: type[Executor], items: list[int]):
    with executor_cls(max_workers=4) as executor:
        start = time.perf_counter()
        results = list(executor.map(worker_task, items))
        elapsed = time.perf_counter() - start
        print(f"⚡ [{executor_cls.__name__}] Processed {len(items)} items in {elapsed:.4f}s")
        return results

if __name__ == "__main__":
    dataset = list(range(100_000))

    # Switch between ThreadPool and ProcessPool seamlessly!
    run_concurrent_pipeline(ThreadPoolExecutor, dataset)
    run_concurrent_pipeline(ProcessPoolExecutor, dataset)
```

### 4. Real-World: High-Throughput Notification Dispatcher with Callbacks
Using `future.add_done_callback()` to log audit metrics asynchronously without blocking.

```python
from concurrent.futures import ThreadPoolExecutor, Future
import time

class NotificationDispatcher:
    def __init__(self, workers: int = 4):
        self.executor = ThreadPoolExecutor(max_workers=workers)

    def _log_audit_callback(self, future: Future):
        try:
            receipt = future.result()
            print(f"📝 [AUDIT LOGGED] Notification delivered: {receipt['msg_id']} ({receipt['latency_ms']:.1f} ms)")
        except Exception as err:
            print(f"🚨 [AUDIT ERROR] Delivery failed: {err}")

    def send_notification(self, msg_id: str, recipient: str):
        def _send():
            t0 = time.perf_counter()
            time.sleep(0.1)  # Simulate network latency to Twilio/SendGrid
            return {"msg_id": msg_id, "to": recipient, "latency_ms": (time.perf_counter() - t0) * 1000}

        future = self.executor.submit(_send)
        # Attach callback: Runs automatically when future finishes!
        future.add_done_callback(self._log_audit_callback)

    def shutdown(self):
        self.executor.shutdown(wait=True)

dispatcher = NotificationDispatcher(workers=2)
for i in range(1, 4):
    dispatcher.send_notification(f"MSG-90{i}", f"user_{i}@domain.com")

dispatcher.shutdown()
```

### 5. Advanced: Bridging Synchronous CPU Functions into AsyncIO with `run_in_executor`
Executing blocking CPU-heavy calculations from within an AsyncIO event loop without freezing async HTTP servers.

```python
import asyncio
import time
from concurrent.futures import ProcessPoolExecutor

def heavy_cpu_blocking_prime_count(limit: int) -> int:
    """Synchronous CPU-bound calculation (Bypasses AsyncIO event loop)."""
    count = 0
    for num in range(2, limit):
        if all(num % i != 0 for i in range(2, int(num**0.5) + 1)):
            count += 1
    return count

async def async_web_endpoint():
    loop = asyncio.get_running_loop()

    # Offload CPU work to a separate ProcessPoolExecutor!
    with ProcessPoolExecutor() as process_pool:
        print("🌐 [ASYNC ENDPOINT] Offloading CPU task to ProcessPoolExecutor...")
        
        # loop.run_in_executor bridges sync workers into async/await!
        prime_count = await loop.run_in_executor(
            process_pool,
            heavy_cpu_blocking_prime_count,
            50_000
        )
        print(f"🌐 [ASYNC ENDPOINT] Result Received: {prime_count:,d} primes found!")

# if __name__ == "__main__":
#     asyncio.run(async_web_endpoint())
```

---

## Code Explanation

In Example 5 (`AsyncIO + run_in_executor`):
1. AsyncIO runs on a single thread. Calling a CPU-heavy synchronous function directly inside an `async def` route would freeze the entire event loop, blocking all other incoming HTTP requests.
2. **`loop.run_in_executor(process_pool, func, *args)`** offloads the CPU calculation to a background `ProcessPoolExecutor` running on a separate hardware CPU core.
3. The event loop awaits the completion of the future asynchronously without blocking other coroutines.
4. This is the standard enterprise architecture used by **FastAPI** to execute synchronous dependencies and heavy computation.

---

## Common Mistakes

### Mistake 1: Submitting Unbounded Millions of Tasks
Calling `executor.submit()` inside an infinite loop with millions of items fills memory with millions of `Future` objects, exhausting RAM. Use **`executor.map(..., chunksize=N)`** or a bounded queue instead.

### Mistake 2: Assuming `future.cancel()` Stops Running Tasks
If a task is already executing on a worker thread (`RUNNING` state), calling `future.cancel()` **returns False and does NOT stop the task**. `cancel()` only prevents tasks currently waiting in the `PENDING` queue from starting.

---

## Best Practices

### Always Use Context Managers for Executors
Wrapping executor usage in `with ThreadPoolExecutor() as executor:` guarantees that `executor.shutdown(wait=True)` is called automatically upon block exit, preventing orphaned threads and dangling processes.

Good:
```python
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(worker, item) for item in items]
```

---

## Performance Considerations

| Scenario | Recommendation |
|---|---|
| **Downloading 100 REST API Endpoints** | `ThreadPoolExecutor(max_workers=20)` |
| **Resizing 1,000 High-Res Images** | `ProcessPoolExecutor(max_workers=os.cpu_count())` |
| **Real-Time Streaming Output** | Iterate using `as_completed(futures)` |
| **Ordered Batch Transformations** | Iterate using `executor.map(func, items)` |

---

## Security Considerations

1. **Worker Task Timeouts**: Always specify a `timeout` argument on `future.result(timeout=10.0)` or `as_completed(futures, timeout=10.0)` to prevent hung worker tasks from freezing downstream services indefinitely.

---

## Real-World Usage

- **FastAPI / Starlette**: Offloading blocking database calls and I/O tasks to thread pool executors.
- **AWS Lambda & Cloud Functions**: Parallel fan-out processing of SQS messages and S3 uploads.
- **CI/CD Test Runners (Pytest-xdist)**: Distributing test suites across process worker pools.

---

## Comparison: Concurrency Execution Frameworks

| Framework | Abstraction Level | Workload Target | Result Management |
|---|---|---|---|
| **`threading.Thread`** | Low-Level | I/O-Bound | Manual Queues / Shared state |
| **`multiprocessing.Pool`**| Medium-Level | CPU-Bound | `AsyncResult` callbacks |
| **`concurrent.futures`** | **High-Level Unified**| **Both (I/O & CPU)**| **Polymorphic `Future` Objects**|
| **`asyncio.TaskGroup`** | AsyncIO Native | High-Concurrency I/O| Coroutines & `async/await` |

---

## Advanced Concepts: Custom Executors

You can subclass `concurrent.futures.Executor` to build custom distributed cluster executors (e.g. dispatching tasks across Kubernetes pods or Celery brokers) while retaining the standard Python `submit()` and `Future` interface.

---

## Exercises

### Exercise 1 — Beginner
Use `ThreadPoolExecutor` and `executor.map()` to fetch the string lengths of a list of 10 website domain names concurrently.

### Exercise 2 — Intermediate
Build a `BatchImageProcessor` using `ProcessPoolExecutor` and `as_completed()` that processes 8 image tasks, handles simulated errors on 2 tasks, and prints success/failure summaries.

### Exercise 3 — Advanced
Build a `ResilientTaskOrchestrator` that submits tasks with `future.add_done_callback()` to track execution duration, automatically retrying any future that raised an exception up to 3 times.

---

## Mini Project: Enterprise Multi-Cloud Infrastructure Health Scanner & Latency Benchmark Engine

### Requirements
Build an operational cloud infrastructure diagnostic scanner named `cloud_health_scanner.py`. Concurrently ping and audit multiple simulated cloud data center endpoints using `ThreadPoolExecutor`, `as_completed()`, granular timeouts, exception recovery, and render an executive multi-cloud availability report.

### Implementation Blueprint
```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import random
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. CLOUD ENDPOINT DATA MODEL
# =====================================================================

@dataclass
class EndpointAuditResult:
    region_name: str
    endpoint_url: str
    is_healthy: bool
    latency_ms: float
    error_message: Optional[str] = None

# =====================================================================
# 2. AUDIT WORKER FUNCTION
# =====================================================================

def probe_cloud_endpoint(region: str, url: str) -> EndpointAuditResult:
    """Probes cloud endpoint health and measures roundtrip response time."""
    t0 = time.perf_counter()
    
    # Simulate network latency and intermittent outages
    latency = random.uniform(0.05, 0.25)
    time.sleep(latency)

    # Simulate region outage for AP-SOUTH-02
    if "ap-south-02" in url:
        raise ConnectionResetError("503 Gateway Connection Reset by Peer")

    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return EndpointAuditResult(
        region_name=region,
        endpoint_url=url,
        is_healthy=True,
        latency_ms=round(elapsed_ms, 2)
    )

# =====================================================================
# 3. CONCURRENT AUDIT SCANNER ORCHESTRATOR
# =====================================================================

class CloudInfrastructureScanner:
    TARGET_CLUSTERS = {
        "US-EAST-VA":   "https://va.cloud.internal/health",
        "US-WEST-OR":   "https://or.cloud.internal/health",
        "EU-CENTRAL-FR":"https://fr.cloud.internal/health",
        "EU-WEST-IRL":  "https://irl.cloud.internal/health",
        "AP-SOUTH-02":  "https://ap-south-02.cloud.internal/health", # Down
        "AP-EAST-TYO":  "https://tyo.cloud.internal/health",
    }

    @classmethod
    def run_fleet_scan(cls, max_workers: int = 4) -> list[EndpointAuditResult]:
        border = "=" * 70
        print(border)
        print("      ENTERPRISE MULTI-CLOUD INFRASTRUCTURE SCANNER")
        print(border)
        print(f"Probing {len(cls.TARGET_CLUSTERS)} Distributed Cloud Endpoints with ThreadPoolExecutor...")

        results = []
        start_time = time.perf_counter()

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all probes concurrently
            future_to_region = {
                executor.submit(probe_cloud_endpoint, region, url): region
                for region, url in cls.TARGET_CLUSTERS.items()
            }

            # Process results as they finish (fastest-first!)
            for future in as_completed(future_to_region):
                region = future_to_region[future]
                try:
                    audit_res = future.result(timeout=3.0)
                    results.append(audit_res)
                    print(f"  ✅ [{audit_res.region_name:<14}] Latency: {audit_res.latency_ms:>6.1f} ms │ Status: HEALTHY")
                except Exception as err:
                    failed_res = EndpointAuditResult(
                        region_name=region,
                        endpoint_url=cls.TARGET_CLUSTERS[region],
                        is_healthy=False,
                        latency_ms=0.0,
                        error_message=str(err)
                    )
                    results.append(failed_res)
                    print(f"  🚨 [{region:<14}] FAILED: {err}")

        total_elapsed = (time.perf_counter() - start_time) * 1000.0

        # Render Executive Report
        print("-" * 70)
        healthy_count = sum(1 for r in results if r.is_healthy)
        print(f"📊 FLEET AUDIT COMPLETE in {total_elapsed:.1f} ms:")
        print(f"  • Operational Clusters : {healthy_count} / {len(cls.TARGET_CLUSTERS)}")
        print(f"  • Health Availability  : {(healthy_count / len(cls.TARGET_CLUSTERS)) * 100:.1f}%")
        print(border)
        return results

if __name__ == "__main__":
    CloudInfrastructureScanner.run_fleet_scan(max_workers=4)
```

---

## Summary

In this lesson, you mastered Python's `concurrent.futures` module:
- **`concurrent.futures`** provides a high-level, unified API for asynchronous execution via **`ThreadPoolExecutor`** (I/O-bound) and **`ProcessPoolExecutor`** (CPU-bound).
- **`Future`** objects encapsulate pending, running, finished, and cancelled execution states.
- **`as_completed()`** processes results dynamically in **fastest-first order**, maximizing pipeline responsiveness.
- **`executor.map()`** executes batch iterations concurrently while **preserving strict input ordering**.
- Worker task exceptions are safely encapsulated and re-raised upon calling **`future.result()`**.
- Bridge synchronous CPU-heavy functions into **AsyncIO** using **`loop.run_in_executor()`**.

---

## Best Practices Checklist

- [ ] Use `ThreadPoolExecutor` for I/O tasks and `ProcessPoolExecutor` for CPU computation.
- [ ] Always wrap executors in `with ... as executor:` context managers.
- [ ] Use `as_completed()` for real-time streaming result consumption.
- [ ] Always set explicit timeouts on `future.result(timeout=N)` to prevent hangs.
- [ ] Size thread pools to $N\times$ CPU cores and process pools to $1\times$ CPU cores.

---

## 🏆 MODULE 3: CONCURRENCY & PARALLELISM COMPLETE!

Congratulations! You have completed all 4 comprehensive articles of **Module 3: Concurrency & Parallelism in Depth**.

### What's Next?
Now advance to **Module 4: Asynchronous Programming (AsyncIO)**:
👉 **[AsyncIO Module Overview](../async/README.md)** to master Event Loops, Coroutines, TaskGroups, Async Context Managers, and Async Queues!
