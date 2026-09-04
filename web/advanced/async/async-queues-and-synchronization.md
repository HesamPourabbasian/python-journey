# Async Queues & Synchronization Primitives in Python

## Introduction

A widespread myth among intermediate Python developers is: *"Because AsyncIO runs on a single thread, race conditions cannot happen."*

This assumption is false and dangerous.

While AsyncIO avoids operating system thread preemption, **task context switches occur at every single `await` expression**. If a coroutine reads shared mutable state, yields control via `await`, and writes back to that state upon resuming, another concurrent coroutine may have mutated that state in the interim—resulting in data corruption, double-spending, and inconsistent state.

To synchronize coroutines and decouple high-throughput data streams, the **`asyncio`** module provides a dedicated suite of asynchronous synchronization primitives and queue structures:
- **`asyncio.Lock`**: Mutual exclusion across concurrent coroutines.
- **`asyncio.Semaphore`**: Throttling concurrent async tasks (e.g. capping outbound API requests to avoid HTTP 429 errors).
- **`asyncio.Event`**: Non-blocking binary flag signaling across coroutines.
- **`asyncio.Queue`**: High-performance, non-blocking **Producer-Consumer Queues** with backpressure support (`maxsize`), `task_done()`, and `join()`.

This lesson explores async race conditions, the async synchronization toolkit, building resilient producer-consumer architectures, and backpressure management.

---

## Prerequisites

Before studying async queues and synchronization, ensure you have:

- Completed [AsyncIO Event Loop & Coroutines](asyncio-event-loop-coroutines.md).
- Completed [Tasks, Gathering & Structured Concurrency](tasks-gathering-and-timeouts.md).
- Understanding of FIFO Queues and the Producer-Consumer design pattern.

---

## Core Concept: The Async Producer-Consumer & Synchronization Model

```
                     ASYNC PRODUCER-CONSUMER QUEUE ARCHITECTURE

    3 Ingestion Producers                                2 Compute Consumers
   ┌───────────────────────┐                            ┌─────────────────────┐
   │ Producer 1 (Webhooks) │ ───┐                  ┌──► │ Consumer A (DB Sink)│
   ├───────────────────────┤    ▼                  │    ├─────────────────────┤
   │ Producer 2 (SSE Feed) │ ──► [ asyncio.Queue ] ───► │ Consumer B (DB Sink)│
   ├───────────────────────┤    ▲ (maxsize=100)    │    └─────────────────────┘
   │ Producer 3 (Kafka)    │ ───┘ (Backpressure!)  │
   └───────────────────────┘                       │
                                                   ▼
                                         queue.task_done() ──► queue.join()
```

---

## Syntax & Essential Async Synchronization Patterns

```python
import asyncio

# 1. Protecting Shared State with asyncio.Lock
shared_balance = 100.0
async_mutex = asyncio.Lock()

async def safe_withdraw(amount: float):
    global shared_balance
    async with async_mutex:  # Non-blocking async lock!
        if shared_balance >= amount:
            await asyncio.sleep(0.01)  # Context switch point!
            shared_balance -= amount
            return True
        return False

# 2. Rate-Limiting Outbound Calls with asyncio.Semaphore
api_throttle = asyncio.Semaphore(value=3)  # Max 3 concurrent requests

async def call_external_api(url: str):
    async with api_throttle:
        print(f"📡 [ACQUIRED SLOT] Calling {url}...")
        await asyncio.sleep(0.1)
        print(f"✅ [RELEASED SLOT] Completed {url}")

# 3. Asynchronous Producer-Consumer Queue
async def queue_demo():
    q = asyncio.Queue(maxsize=5)  # Bounded queue (Backpressure!)
    await q.put("DATA_PAYLOAD_01")
    item = await q.get()
    q.task_done()
    print("Processed Item from Queue:", item)

if __name__ == "__main__":
    asyncio.run(queue_demo())
```

---

## Detailed Explanation

### 1. Anatomy of an Async Race Condition

Consider this unsafe bank withdrawal coroutine:

```python
# 🚨 DANGEROUS ASYNC RACE CONDITION:
balance = 100.0

async def unsafe_withdraw(amount: float):
    global balance
    if balance >= amount: # Coroutine A checks balance ($100 >= $80) -> True!
        await asyncio.sleep(0.05) # 💥 Context Switch! Event loop switches to Coroutine B!
        # Coroutine B checks balance ($100 >= $80) -> True!
        # Coroutine B executes: balance -= 80 ($20 remaining)
        # Coroutine A resumes: balance -= 80 ($-60 OVERDRAFT!)
        balance -= amount

# Two concurrent withdraws of $80 result in a negative balance of -$60!
```

$$\textbf{Lesson: Wrapping the critical section in \texttt{async with asyncio.Lock():} guarantees}$$

$$\textbf{that no other coroutine can enter until the current coroutine completes its state mutation.}$$

---

### 2. The Mechanics of `asyncio.Queue`

The `asyncio.Queue` class is the primary data structure for building high-throughput, decoupled async data pipelines:

- **`await q.put(item)`**: Inserts an item. If `len(q) >= maxsize`, it **suspends the producer coroutine** until a consumer removes an item (**Backpressure**).
- **`await q.get()`**: Retrieves and removes an item. If the queue is empty, it **suspends the consumer coroutine** until a producer inserts an item.
- **`q.task_done()`**: Informs the queue that processing of a retrieved item has finished.
- **`await q.join()`**: Blocks the caller until **every single item put into the queue has received a corresponding `task_done()` call**.

---

### 3. Backpressure & Memory Protection with Bounded Queues

If an API receives 50,000 requests per second while your database can only write 5,000 records per second:
- **Unbounded Queue (`maxsize=0`)**: The queue grows without limit, consuming hundreds of megabytes of RAM until the Python process crashes with an **Out-Of-Memory (OOM)** error.
- **Bounded Queue (`maxsize=500`)**: When the queue hits 500 items, `await q.put()` automatically suspends incoming network ingestion until the database consumers catch up (**Backpressure**).

---

## Examples

### 1. Simple: Benchmarking Unsafe vs Safe Async Counters
Demonstrating race condition prevention with `asyncio.Lock`.

```python
import asyncio

UNSAFE_VAL = 0
SAFE_VAL = 0
lock = asyncio.Lock()

async def unsafe_worker():
    global UNSAFE_VAL
    for _ in range(500):
        curr = UNSAFE_VAL
        await asyncio.sleep(0.0001)  # Injects context switch!
        UNSAFE_VAL = curr + 1

async def safe_worker():
    global SAFE_VAL
    for _ in range(500):
        async with lock:
            curr = SAFE_VAL
            await asyncio.sleep(0.0001)
            SAFE_VAL = curr + 1

async def main():
    # Run Unsafe
    await asyncio.gather(*(unsafe_worker() for _ in range(4)))
    # Run Safe
    await asyncio.gather(*(safe_worker() for _ in range(4)))

    print(f"Unsafe Counter (Expected 2,000) : {UNSAFE_VAL} (Data Lost! ❌)")
    print(f"Safe Counter   (Expected 2,000) : {SAFE_VAL} (100% Accurate! ✅)")

asyncio.run(main())
```

### 2. Beginner: Throttling High-Concurrency Web Requests with `asyncio.Semaphore`
Restricting 10 concurrent requests to a maximum concurrency limit of 3.

```python
import asyncio
import time

class RateLimitedFetcher:
    def __init__(self, max_concurrent: int = 3):
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def fetch(self, request_id: int):
        async with self.semaphore:
            print(f"🌐 [FETCHING] Request #{request_id} (Active Concurrency: {3 - self.semaphore._value})")
            await asyncio.sleep(0.15)  # Simulate network latency
            print(f"⚡ [COMPLETED] Request #{request_id}")

async def main():
    fetcher = RateLimitedFetcher(max_concurrent=3)
    start = time.perf_counter()
    
    # Launch 8 requests concurrently
    await asyncio.gather(*(fetcher.fetch(i) for i in range(1, 9)))
    
    elapsed = time.perf_counter() - start
    print(f"\nAll 8 requests completed in {elapsed:.2f}s (Throttled in batches of 3)")

asyncio.run(main())
```

### 3. Intermediate: Worker Coordination with `asyncio.Event`
Broadcasting a system initialization signal to awaken multiple waiting worker coroutines.

```python
import asyncio

system_ready_event = asyncio.Event()

async def background_worker(worker_id: int):
    print(f"🧵 Worker #{worker_id} waiting for system readiness...")
    # Wait asynchronously without consuming CPU!
    await system_ready_event.wait()
    print(f"🚀 Worker #{worker_id} executing live production jobs!")

async def main():
    # Launch 3 workers
    workers = [asyncio.create_task(background_worker(i)) for i in range(1, 4)]
    
    print("[MAIN] Loading configuration files & warming caches...")
    await asyncio.sleep(0.3)
    
    print("[MAIN] System operational! Broadcasting system_ready_event.set()...\n")
    system_ready_event.set()  # Awaken all waiting workers simultaneously!
    
    await asyncio.gather(*workers)

asyncio.run(main())
```

### 4. Real-World: High-Throughput Async Producer-Consumer Ingestion Pipeline
Building an operational producer-consumer engine with bounded queues, multiple worker pools, and poison pill shutdown.

```python
import asyncio
import random
import time

class AsyncIngestionPipeline:
    def __init__(self, queue_capacity: int = 5, num_consumers: int = 2):
        self.queue = asyncio.Queue(maxsize=queue_capacity)
        self.num_consumers = num_consumers
        self.processed_count = 0

    async def producer(self, producer_id: int, total_items: int):
        for i in range(1, total_items + 1):
            item = f"MSG-P{producer_id}-{i:03d}"
            # await put() enforces backpressure if queue is full!
            await self.queue.put(item)
            print(f"📥 [PRODUCED] {item} (Queue Depth: {self.queue.qsize()})")
            await asyncio.sleep(random.uniform(0.02, 0.05))

    async def consumer(self, consumer_id: int):
        while True:
            # await get() suspends until an item is available
            item = await self.queue.get()
            
            if item is None:  # Poison pill shutdown sentinel!
                self.queue.task_done()
                print(f"🛑 [CONSUMER #{consumer_id} OFFLINE]")
                break

            # Simulate database persistence
            await asyncio.sleep(0.08)
            self.processed_count += 1
            print(f"  ⚙️ [SAVED TO DB] Consumer #{consumer_id} processed: {item}")
            
            # Notify queue that item processing is complete
            self.queue.task_done()

    async def run(self, total_items_per_producer: int = 4):
        # 1. Start Consumers
        consumer_tasks = [
            asyncio.create_task(self.consumer(i)) for i in range(1, self.num_consumers + 1)
        ]

        # 2. Run 2 Producers Concurrently
        await asyncio.gather(
            self.producer(1, total_items_per_producer),
            self.producer(2, total_items_per_producer),
        )

        # 3. Wait for all items in queue to be processed
        await self.queue.join()

        # 4. Send Poison Pills to stop consumers cleanly
        for _ in range(self.num_consumers):
            await self.queue.put(None)

        await asyncio.gather(*consumer_tasks)
        print(f"\n🎉 Pipeline Finished! Total Records Processed: {self.processed_count}")

asyncio.run(AsyncIngestionPipeline().run())
```

### 5. Advanced: Priority-Based SLA Job Scheduler with `asyncio.PriorityQueue`
Scheduling urgent VIP tasks ahead of standard background jobs using priority heaps.

```python
import asyncio
from dataclasses import dataclass, field

@dataclass(order=True)
class PrioritizedTask:
    priority: int  # Lower number = Higher priority!
    task_id: str = field(compare=False)
    payload: str = field(compare=False)

async def priority_worker(queue: asyncio.PriorityQueue):
    while not queue.empty():
        job = await queue.get()
        print(f"⚡ [EXECUTING] Priority {job.priority} -> {job.task_id} ({job.payload})")
        await asyncio.sleep(0.05)
        queue.task_done()

async def main():
    pq = asyncio.PriorityQueue()

    # Enqueue jobs in random priority order
    print("Enqueueing jobs with different SLA priorities:")
    await pq.put(PrioritizedTask(priority=3, task_id="JOB-101", payload="Standard Email Digest"))
    await pq.put(PrioritizedTask(priority=1, task_id="JOB-102", payload="CRITICAL Payment Webhook"))
    await pq.put(PrioritizedTask(priority=2, task_id="JOB-103", payload="User Password Reset"))
    await pq.put(PrioritizedTask(priority=1, task_id="JOB-104", payload="FRAUD ALERT Security Check"))

    print("\nWorker consuming jobs (Ordered by Priority):")
    await priority_worker(pq)

asyncio.run(main())
```

---

## Code Explanation

In Example 4 (`AsyncIngestionPipeline`):
1. **Bounded Queue (`maxsize=5`)**: Limits queue size to 5 items. If producers generate data faster than consumers can save it to the database, `await self.queue.put(item)` automatically pauses the producer, providing **Backpressure**.
2. **`await self.queue.get()`**: Consumers retrieve items asynchronously without busy loops.
3. **`self.queue.task_done()`**: Decrements the queue's unfinished task counter.
4. **`await self.queue.join()`**: The orchestrator pauses until all enqueued items have been completely processed.
5. **Poison Pill Sentinels (`None`)**: Signals consumers to exit their `while True:` loop cleanly, ensuring zero dropped messages or hanging tasks.

---

## Common Mistakes

### Mistake 1: Forgetting `queue.task_done()`
If a consumer calls `await q.get()` but forgets to call `q.task_done()`, the queue's internal unfinished task counter never decrements. Calling **`await q.join()` will hang permanently!**

### Mistake 2: Using Synchronous `threading.Lock` in AsyncIO
Using `threading.Lock()` instead of `asyncio.Lock()`.
Calling synchronous `thread_lock.acquire()` inside a coroutine **blocks the entire OS thread**, freezing all other concurrent coroutines on the event loop. Always use **`asyncio.Lock()`** with **`async with lock:`**.

---

## Best Practices

### Always Bound Queues with `maxsize`
Never create unbounded `asyncio.Queue()` instances in production services handling external HTTP traffic. Always set `maxsize=1000` (or appropriate buffer size) to prevent memory exhaustion under traffic spikes.

Good:
```python
queue = asyncio.Queue(maxsize=500)
```

---

## Performance Considerations

- **Async Lock vs Thread Lock**: `asyncio.Lock` operates entirely in user-space inside the single Python process, avoiding operating system kernel context switches and mutex syscalls. Acquiring an async lock takes **$< 150\text{ nanoseconds}$**.

---

## Security Considerations

1. **Denial-of-Service via Queue Exhaustion**: Bounded queues prevent memory exhaustion attacks where an attacker floods an endpoint with requests faster than downstream workers can process them.

---

## Real-World Usage

- **Web Crawlers**: Queuing discovered URLs with `asyncio.PriorityQueue`.
- **FastAPI Background Sinks**: Buffering audit telemetry to database writes.
- **Message Broker Consumers**: Reading Kafka/RabbitMQ partitions into async worker pools.

---

## Comparison: Python Queue Implementations

| Queue Class | Module | Thread-Safe? | Async-Safe? | Best Used For |
|---|---|---|---|---|
| **`queue.Queue`** | `queue` | **✅ Yes** | ❌ No (Blocks thread) | Synchronous multi-threading |
| **`multiprocessing.Queue`**| `multiprocessing`| **✅ Yes** | ❌ No (IPC Pickle) | Multi-process worker pools |
| **`asyncio.Queue`** | `asyncio` | ❌ No | **✅ Yes (`await` safe)**| **AsyncIO event loop pipelines**|

---

## Advanced Concepts: Async Token Bucket Rate Limiter

Implementing an asynchronous Token Bucket rate limiter using `asyncio.Lock`:

```python
import asyncio
import time

class AsyncTokenBucket:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate_per_sec
        self.last_refill = time.monotonic()
        self.lock = asyncio.Lock()

    async def acquire(self):
        async with self.lock:
            while True:
                now = time.monotonic()
                elapsed = now - self.last_refill
                self.tokens = min(self.capacity, self.tokens + (elapsed * self.refill_rate))
                self.last_refill = now

                if self.tokens >= 1.0:
                    self.tokens -= 1.0
                    return
                # Wait for token refill
                await asyncio.sleep((1.0 - self.tokens) / self.refill_rate)
```

---

## Exercises

### Exercise 1 — Beginner
Build an `AsyncCounter` class with an `increment()` coroutine protected by `asyncio.Lock`. Verify that 10 concurrent tasks incrementing it 100 times each results in an exact total of 1,000.

### Exercise 2 — Intermediate
Build an async web scraper pipeline where 1 producer discovers 10 URLs and puts them into an `asyncio.Queue(maxsize=3)`, while 3 consumers download them, using `task_done()` and `join()`.

### Exercise 3 — Advanced
Build an `AsyncDistributedJobQueue` with `asyncio.PriorityQueue` supporting 3 priority levels (CRITICAL, HIGH, NORMAL), tracking worker latency and processing jobs in strict priority order.

---

## Mini Project: Enterprise Distributed Async Event Ingestion & Priority Stream Engine

### Requirements
Build an operational async event processing pipeline named `async_event_pipeline.py`. Use `asyncio.PriorityQueue` with bounded capacity, manage multiple producer and consumer tasks, throttle outbound API sinks with `asyncio.Semaphore`, coordinate graceful shutdown with poison pills, and render real-time pipeline throughput statistics.

### Implementation Blueprint
```python
import asyncio
import random
import time
from dataclasses import dataclass, field

# =====================================================================
# 1. EVENT DATA MODEL WITH PRIORITY HEAP
# =====================================================================

@dataclass(order=True)
class PipelineEvent:
    priority: int  # 1 = CRITICAL (Security), 2 = HIGH (Payment), 3 = NORMAL (Telemetry)
    event_id: str = field(compare=False)
    event_type: str = field(compare=False)
    timestamp: float = field(compare=False)

# =====================================================================
# 2. INGESTION PIPELINE ENGINE
# =====================================================================

class EnterpriseEventPipeline:
    def __init__(self, queue_capacity: int = 10, max_sink_concurrency: int = 3):
        self.queue = asyncio.PriorityQueue(maxsize=queue_capacity)
        self.sink_throttle = asyncio.Semaphore(max_sink_concurrency)
        self.processed_metrics: dict[int, int] = {1: 0, 2: 0, 3: 0}
        self._lock = asyncio.Lock()

    async def ingest_producer(self, producer_name: str, event_specs: list[tuple[int, str]]):
        """Producer that pushes events into priority queue with backpressure."""
        for priority, event_type in event_specs:
            evt_id = f"EVT-{random.randint(1000, 9999)}"
            event = PipelineEvent(priority, evt_id, event_type, time.time())
            
            # await put() provides backpressure if queue is full!
            await self.queue.put(event)
            p_label = "🚨 CRITICAL" if priority == 1 else ("⚡ HIGH" if priority == 2 else "ℹ️ NORMAL")
            print(f"📥 [{producer_name}] Enqueued {evt_id:<8} ({p_label}) │ Queue Depth: {self.queue.qsize()}")
            await asyncio.sleep(0.04)

    async def processing_consumer(self, consumer_id: int):
        """Consumer that pulls prioritized events and writes to external DB sink."""
        while True:
            event = await self.queue.get()
            
            # Sentinel check for shutdown
            if event is None:
                self.queue.task_done()
                print(f"🛑 [CONSUMER #{consumer_id} OFFLINE]")
                break

            # Throttle downstream database sink writes
            async with self.sink_throttle:
                await asyncio.sleep(0.08)  # Simulate DB write latency
                
                async with self._lock:
                    self.processed_metrics[event.priority] += 1

                p_label = "CRITICAL" if event.priority == 1 else ("HIGH" if event.priority == 2 else "NORMAL")
                print(f"  ⚙️ [DB SINK #{consumer_id}] Processed {event.event_id} ({p_label})")

            self.queue.task_done()

    async def execute_pipeline(self):
        border = "=" * 70
        print(border)
        print("      ENTERPRISE PRIORITY ASYNC EVENT STREAMING PIPELINE")
        print(border)

        # 1. Start 3 Concurrent Consumer Workers
        num_consumers = 3
        consumers = [asyncio.create_task(self.processing_consumer(i)) for i in range(1, num_consumers + 1)]

        # 2. Define Workloads for 2 Producers
        prod_1_events = [(3, "UserClick"), (1, "AuthBruteForceAlert"), (2, "CheckoutCompleted"), (3, "PageView")]
        prod_2_events = [(2, "SubscriptionRenewed"), (1, "SQLInjectionAttempt"), (3, "TelemetryHeartbeat")]

        start_time = time.perf_counter()

        # 3. Ingest Events Concurrently
        await asyncio.gather(
            self.ingest_producer("WebhookIngestor", prod_1_events),
            self.ingest_producer("AuditLogIngestor", prod_2_events),
        )

        # 4. Wait for all items to be processed
        await self.queue.join()

        # 5. Graceful Consumer Shutdown via Poison Pills
        for _ in range(num_consumers):
            await self.queue.put(None)
        await asyncio.gather(*consumers)

        elapsed = time.perf_counter() - start_time

        # 6. Render Executive Report
        print("-" * 70)
        total_events = sum(self.processed_metrics.values())
        print(f"📊 PIPELINE EXECUTION AUDIT (Completed in {elapsed:.2f}s):")
        print(f"  • Total Events Processed : {total_events}")
        print(f"  • Priority 1 (CRITICAL)  : {self.processed_metrics[1]} events")
        print(f"  • Priority 2 (HIGH)      : {self.processed_metrics[2]} events")
        print(f"  • Priority 3 (NORMAL)    : {self.processed_metrics[3]} events")
        print(f"  • Pipeline Throughput    : {total_events / elapsed:.1f} events/sec")
        print(border)

if __name__ == "__main__":
    pipeline = EnterpriseEventPipeline(queue_capacity=5, max_sink_concurrency=2)
    asyncio.run(pipeline.execute_pipeline())
```

---

## Summary

In this lesson, you mastered Async Queues and Synchronization Primitives:
- **Async race conditions occur at `await` points**; use **`asyncio.Lock`** with **`async with lock:`** to protect critical sections.
- **`asyncio.Semaphore(N)`** throttles concurrent async operations, preventing API rate-limit violations and connection exhaustion.
- **`asyncio.Event`** provides one-to-many broadcast wakeups across coroutines.
- **`asyncio.Queue`** decouples data ingestion from processing, with **`maxsize`** providing automatic **Backpressure**.
- Always call **`queue.task_done()`** after processing items to allow **`await queue.join()`** to resolve cleanly.
- Use **`asyncio.PriorityQueue`** to process urgent SLA jobs ahead of standard background tasks.

---

## Best Practices Checklist

- [ ] Always wrap async lock acquisitions in `async with asyncio.Lock():`.
- [ ] Use `asyncio.Semaphore` to rate-limit outbound HTTP requests.
- [ ] Bound all queues with `maxsize > 0` to prevent memory exhaustion under load.
- [ ] Always call `q.task_done()` after calling `await q.get()`.
- [ ] Use `None` poison pill sentinels for graceful consumer worker shutdown.

---

## What's Next?

Now that you understand async synchronization and queues, continue to the final article in this module:
👉 **[High-Throughput Async HTTP & Databases](aiohttp-and-async-databases.md)** to master production async HTTP servers with `aiohttp`/`httpx`, `asyncpg` PostgreSQL connection pools, and Async SQLAlchemy 2.0!
