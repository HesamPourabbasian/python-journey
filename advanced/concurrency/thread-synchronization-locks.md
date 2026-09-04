# Thread Synchronization & Locks in Python

## Introduction

When multiple threads execute concurrently within a single process, they share the same memory space, global variables, heap objects, and file descriptors.

If multiple threads attempt to read and write to the same shared mutable state simultaneously without coordination, the result is a **Race Condition**: data structures become corrupted, invariants are violated, and software behaves non-deterministically.

A common misconception among intermediate Python developers is believing that CPython's Global Interpreter Lock (GIL) makes Python programs thread-safe. While the GIL protects CPython's internal C-structures (like reference counts), it does **not** protect your application's business logic.

To write thread-safe software, Python provides a rich suite of **Synchronization Primitives** in the standard library **`threading`** module:
- **`Lock`**: Basic mutual exclusion mutex guarding critical sections.
- **`RLock`**: Re-entrant lock allowing the same thread to acquire a lock recursively.
- **`Semaphore`**: Counting semaphore throttling concurrent access to bounded resources.
- **`Event`**: Thread signaling flag allowing one thread to awaken multiple worker threads.
- **`Condition`**: Complex state-change signaling for producer-consumer coordination.
- **`Barrier`**: Rendezvous point synchronizing a fixed group of threads.

This lesson explores thread synchronization mechanics, eliminating race conditions, preventing the fatal **Deadlock**, and building thread-safe enterprise systems.

---

## Prerequisites

Before studying synchronization, ensure you have:

- Completed [Threading vs Multiprocessing](threading-vs-multiprocessing.md).
- Completed [Context Managers & The `with` Statement](../../beginner/file-handling/context-managers-with-statement.md).
- Solid understanding of threads, shared memory, and race conditions.

---

## Core Concept: The Synchronization Primitives Toolkit

```
                             THE PYTHON THREAD SYNCHRONIZATION TOOLKIT

      Primitive             Primary Purpose & Behavioral Invariant
     ┌────────────────────┬─────────────────────────────────────────────────────────────┐
     │ 1. Lock            │ Mutual Exclusion (1 Thread at a time in critical section).  │
     ├────────────────────┼─────────────────────────────────────────────────────────────┤
     │ 2. RLock           │ Re-entrant Lock (Same thread can re-acquire without deadlock│
     ├────────────────────┼─────────────────────────────────────────────────────────────┤
     │ 3. Semaphore       │ Resource Throttling (Allows N concurrent threads).          │
     ├────────────────────┼─────────────────────────────────────────────────────────────┤
     │ 4. Event           │ Binary State Flag (One-to-Many thread wakeup signaling).    │
     ├────────────────────┼─────────────────────────────────────────────────────────────┤
     │ 5. Condition       │ State Notification (notify/wait for producer-consumer).     │
     ├────────────────────┼─────────────────────────────────────────────────────────────┤
     │ 6. Barrier         │ Synchronized Rendezvous (Waits until N threads arrive).     │
     └────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Synchronization Patterns

```python
import threading
import time

# 1. Mutual Exclusion Lock (with context manager)
shared_counter = 0
mutex = threading.Lock()

def safe_increment():
    global shared_counter
    with mutex:  # Acquires lock on entry, releases on exit (even on exception!)
        shared_counter += 1

# 2. Resource Throttling with Semaphore (Limit to 3 concurrent connections)
pool_semaphore = threading.BoundedSemaphore(value=3)

def access_database_connection(thread_id: int):
    with pool_semaphore:
        print(f"🔌 Thread #{thread_id} acquired DB connection.")
        time.sleep(0.2)
        print(f"⚡ Thread #{thread_id} released DB connection.")

# 3. Thread-Safe Event Signaling
shutdown_event = threading.Event()

def background_worker():
    while not shutdown_event.is_set():
        print("Worker running task...")
        shutdown_event.wait(timeout=0.1) # Non-busy waiting!
    print("Worker received shutdown signal. Exiting.")
```

---

## Detailed Explanation

### 1. The Anatomy of a Race Condition

Why is `counter += 1` not thread-safe in Python?

At the bytecode level, `counter += 1` compiles into **4 separate bytecode instructions**:
1. `LOAD_GLOBAL (counter)`
2. `LOAD_CONST (1)`
3. `BINARY_OP (+)`
4. `STORE_GLOBAL (counter)`

If Thread A executes steps 1–3 and the GIL switch timer fires (every 5ms), CPython interrupts Thread A and switches to Thread B. Thread B executes steps 1–4 and stores its result. When Thread A resumes, it overwrites Thread B's update with its stale calculation.

**Wrapping the code in `with lock:` ensures all 4 instructions execute as an atomic, indivisible Critical Section.**

---

### 2. `Lock` vs `RLock` (Re-entrant Locks)

- **Standard `Lock`**: Cannot be acquired more than once by the same thread. If a function holding a `Lock` calls another function that attempts to acquire the same `Lock`, **the thread permanently deadlocks on itself!**
- **Re-entrant `RLock`**: Tracks the owning thread and a recursion depth counter. The owning thread can acquire the lock multiple times (`depth += 1`) and must release it the same number of times (`depth -= 1`).

```python
# RLock allows recursive/nested calls within the same thread:
class BankAccount:
    def __init__(self):
        self.balance = 100
        self.lock = threading.RLock()

    def withdraw(self, amt):
        with self.lock:
            self.balance -= amt

    def withdraw_and_log(self, amt):
        with self.lock:          # Lock Depth = 1
            self.withdraw(amt)   # Lock Depth = 2 (Would DEADLOCK with standard Lock!)
            print(f"Logged withdrawal of ${amt}")
```

---

### 3. Deadlock Mechanics & The Coffman Conditions

A **Deadlock** occurs when two or more threads are permanently blocked, each waiting for a lock held by the other.

```
                               THE CLASSIC CIRCULAR DEADLOCK

               Thread 1                                          Thread 2
       ┌──────────────────────┐                          ┌──────────────────────┐
       │ Holds: Lock A        │                          │ Holds: Lock B        │
       │ Wants: Lock B        │ ═══════════════════════► │ Wants: Lock A        │
       │ (Waiting forever...) │ ◄═══════════════════════ │ (Waiting forever...) │
       └──────────────────────┘                          └──────────────────────┘
```

#### The 4 Coffman Conditions for Deadlocks:
1. **Mutual Exclusion**: Resources cannot be shared.
2. **Hold and Wait**: Threads hold resources while requesting others.
3. **No Preemption**: Locks cannot be forcibly taken away.
4. **Circular Wait**: Thread 1 waits for Thread 2, which waits for Thread 1.

#### How to Prevent Deadlocks in Python:
1. **Lock Hierarchy (Global Lock Ordering)**: Always acquire locks in the exact same order everywhere in the codebase (e.g. always acquire `Lock A` before `Lock B`).
2. **Timeout Acquisition**: Use `lock.acquire(timeout=5.0)` instead of blocking indefinitely.

---

## Examples

### 1. Simple: Benchmarking Race Conditions with and without `Lock`
Proving that `threading.Lock` eliminates data loss in concurrent counter increments.

```python
import threading

UNSAFE_COUNTER = 0
SAFE_COUNTER = 0
lock = threading.Lock()

def unsafe_worker():
    global UNSAFE_COUNTER
    for _ in range(50_000):
        UNSAFE_COUNTER += 1

def safe_worker():
    global SAFE_COUNTER
    for _ in range(50_000):
        with lock:
            SAFE_COUNTER += 1

# Run Unsafe
threads_unsafe = [threading.Thread(target=unsafe_worker) for _ in range(4)]
for t in threads_unsafe: t.start()
for t in threads_unsafe: t.join()

# Run Safe
threads_safe = [threading.Thread(target=safe_worker) for _ in range(4)]
for t in threads_safe: t.start()
for t in threads_safe: t.join()

print(f"Unsafe Counter (Expected 200,000) : {UNSAFE_COUNTER:,d} (Data Lost! ❌)")
print(f"Safe Counter   (Expected 200,000) : {SAFE_COUNTER:,d} (100% Accurate! ✅)")
```

### 2. Beginner: Throttling Concurrent Outbound HTTP Calls with `BoundedSemaphore`
Restricting outbound HTTP requests to a maximum of 3 concurrent connections.

```python
import threading
import time

class RateLimitedHttpClient:
    def __init__(self, max_concurrent: int = 3):
        self.semaphore = threading.BoundedSemaphore(max_concurrent)

    def fetch_url(self, url: str):
        with self.semaphore:  # Blocks if 3 threads are already executing!
            print(f"🌐 [ACQUIRED SLOT] Fetching {url} on Thread {threading.current_thread().name}")
            time.sleep(0.3)
            print(f"⚡ [RELEASED SLOT] Completed {url}")

client = RateLimitedHttpClient(max_concurrent=2)
urls = [f"https://api.service.com/item/{i}" for i in range(1, 6)]

threads = [threading.Thread(target=client.fetch_url, args=(u,), name=f"T-{i}") for i, u in enumerate(urls, 1)]
for t in threads: t.start()
for t in threads: t.join()
```

### 3. Intermediate: Worker Coordination with `threading.Event`
Signaling multiple worker threads to start simultaneously when an initialization phase completes.

```python
import threading
import time

ready_event = threading.Event()

def worker(worker_id: int):
    print(f"🧵 Worker #{worker_id} waiting for READY signal...")
    # Wait until main thread sets event!
    ready_event.wait()
    print(f"🚀 Worker #{worker_id} STARTED processing at {time.strftime('%X')}!")

threads = [threading.Thread(target=worker, args=(i,)) for i in range(1, 4)]
for t in threads: t.start()

print("\n[MAIN] Performing system initialization (Loading models, connecting DB)...")
time.sleep(0.5)

print("[MAIN] System Ready! Broadcasting signal to all workers via ready_event.set()...\n")
ready_event.set()  # Awaken all waiting threads simultaneously!

for t in threads: t.join()
```

### 4. Real-World: High-Performance Multi-Threaded Producer-Consumer with `threading.Condition`
Building a bounded thread-safe task queue using `Condition.wait()` and `Condition.notify()`.

```python
import threading
import time
import collections

class ThreadSafeBoundedQueue:
    def __init__(self, max_capacity: int = 3):
        self.max_capacity = max_capacity
        self.queue = collections.deque()
        self.condition = threading.Condition()

    def put(self, item: any):
        with self.condition:
            while len(self.queue) >= self.max_capacity:
                print(f"⚠️ [QUEUE FULL] Producer waiting... ({len(self.queue)}/{self.max_capacity})")
                self.condition.wait()  # Drops lock and sleeps until consumer notifies!
            
            self.queue.append(item)
            print(f"📦 [PRODUCED] {item} (Queue Size: {len(self.queue)})")
            self.condition.notify()  # Notify waiting consumers!

    def get(self) -> any:
        with self.condition:
            while not self.queue:
                print("⏳ [QUEUE EMPTY] Consumer waiting...")
                self.condition.wait()  # Drops lock and sleeps until producer notifies!

            item = self.queue.popleft()
            print(f"🛠️ [CONSUMED] {item} (Queue Size: {len(self.queue)})")
            self.condition.notify()  # Notify waiting producers!
            return item

# Test Producer-Consumer
q = ThreadSafeBoundedQueue(max_capacity=2)

def producer_task():
    for i in range(1, 5):
        q.put(f"Task-{i}")
        time.sleep(0.05)

def consumer_task():
    for _ in range(4):
        time.sleep(0.15)
        q.get()

p = threading.Thread(target=producer_task)
c = threading.Thread(target=consumer_task)
p.start(); c.start()
p.join(); c.join()
```

### 5. Advanced: Thread Rendezvous Synchronization with `threading.Barrier`
Synchronizing multiple microservice health checkers that must all complete before the gateway opens.

```python
import threading
import time

def check_subsystem(name: str, latency: float, barrier: threading.Barrier):
    print(f"🔍 Checking subsystem: {name}...")
    time.sleep(latency)
    print(f"✅ Subsystem {name} READY. Waiting at barrier rendezvous point...")
    
    # Blocks until all 3 threads call wait()!
    barrier.wait()
    print(f"🚀 Subsystem {name} proceeding into production traffic!")

# Barrier for 3 threads
rendezvous_barrier = threading.Barrier(parties=3)

t1 = threading.Thread(target=check_subsystem, args=("DatabaseCluster", 0.1, rendezvous_barrier))
t2 = threading.Thread(target=check_subsystem, args=("RedisCache", 0.3, rendezvous_barrier))
t3 = threading.Thread(target=check_subsystem, args=("AuthGateway", 0.2, rendezvous_barrier))

t1.start(); t2.start(); t3.start()
t1.join(); t2.join(); t3.join()
```

---

## Code Explanation

In Example 4 (`ThreadSafeBoundedQueue`):
1. **`threading.Condition`** encapsulates a `Lock` and provides **`wait()`** and **`notify()`** primitives.
2. When `put()` finds the queue full, calling `self.condition.wait()` **releases the underlying lock and places the thread into a sleep queue in the OS kernel**.
3. When `get()` consumes an item, calling `self.condition.notify()` awakens one waiting producer thread, which re-acquires the lock and inserts its item.
4. This eliminates CPU-burning busy loops (`while len(queue) >= max: pass`) and delivers optimal, event-driven thread synchronization.

---

## Common Mistakes

### Mistake 1: Acquiring Locks Without Context Managers
Writing `lock.acquire()` and `lock.release()` manually. If an exception occurs between `acquire()` and `release()`, the lock is **never released**, permanently deadlocking all other threads in the program. Always use **`with lock:`**.

### Mistake 2: Busy-Waiting Loops Instead of `Event` or `Condition`
Writing `while not ready: time.sleep(0.001)` wastes CPU cycles and context switches. Always use **`event.wait()`** or **`condition.wait()`**.

---

## Best Practices

### Use `BoundedSemaphore` Instead of `Semaphore`
`BoundedSemaphore` raises a `ValueError` if you call `release()` more times than `acquire()`. This catches subtle logic bugs where a thread accidentally releases a semaphore it didn't hold.

Good:
```python
semaphore = threading.BoundedSemaphore(value=5)
```

---

## Performance Considerations

- **Lock Contention**: If 100 threads fight for a single coarse-grained lock, throughput collapses because threads spend 95% of their time waiting.
- **Solution**: Use fine-grained locks (locking individual records rather than the entire table) or lock-free data structures like the thread-safe **`queue.Queue`**.

---

## Security Considerations

1. **Denial-of-Service via Deadlock**: Deadlocks freeze server worker threads. An attacker triggering a deadlock in an un-timed lock acquisition can exhaust all web server worker threads, taking down the application. Always use `lock.acquire(timeout=N)`.

---

## Real-World Usage

- **Thread-Safe In-Memory Caches**: Protecting LRU caches from concurrent write corruption.
- **Database Connection Pools**: Managing pooled sockets with `BoundedSemaphore`.
- **Operating System Thread Pools (`concurrent.futures.ThreadPoolExecutor`)**: Synchronizing worker task queues.

---

## Comparison: Synchronization Primitives

| Primitive | State | Key Methods | Best Used For |
|---|---|---|---|
| **`Lock`** | Binary (0 or 1) | `acquire()`, `release()` | Mutual exclusion in critical sections |
| **`RLock`** | Re-entrant Counter | `acquire()`, `release()` | Recursive methods within same thread |
| **`Semaphore`**| Integer Counter | `acquire()`, `release()` | Resource pools, connection throttling |
| **`Event`** | Boolean Flag | `set()`, `clear()`, `wait()` | One-to-many broadcast signaling |
| **`Condition`**| State + Lock | `wait()`, `notify()`, `notify_all()` | Complex Producer-Consumer queues |
| **`Barrier`** | Fixed Party Count | `wait()` | Synchronizing thread phase rendezvous |

---

## Advanced Concepts: Thread-Local Storage with `threading.local()`

When each thread needs its own independent copy of a variable (such as a database connection or request ID) without passing it through every function argument:

```python
import threading

thread_local_storage = threading.local()

def process_request():
    # Accesses the current thread's private value!
    print(f"Thread {threading.current_thread().name} handling Request ID: {thread_local_storage.request_id}")

def thread_entry(req_id: str):
    thread_local_storage.request_id = req_id
    process_request()

t1 = threading.Thread(target=thread_entry, args=("REQ-001",), name="Worker-A")
t2 = threading.Thread(target=thread_entry, args=("REQ-002",), name="Worker-B")
t1.start(); t2.start()
t1.join(); t2.join()
```

---

## Exercises

### Exercise 1 — Beginner
Build a thread-safe `Counter` class using `threading.Lock` and verify that 5 threads incrementing it 20,000 times each results in an exact final value of 100,000.

### Exercise 2 — Intermediate
Build a `ConnectionPoolManager` using `threading.BoundedSemaphore(3)` that simulates acquiring, using, and releasing database connections across 8 concurrent client threads.

### Exercise 3 — Advanced
Build a `ThreadSafeReadWriteLock` (RWLock) allowing multiple concurrent reader threads when no writer is present, but granting exclusive access to a single writer thread.

---

## Mini Project: Enterprise Thread-Safe In-Memory Cache & Connection Throttler Suite

### Requirements
Build an operational thread-safe caching and request throttling engine named `thread_safe_cache.py`. Implement re-entrant lock synchronization (`RLock`), resource throttling with `BoundedSemaphore`, cache expiration, and concurrent multi-thread verification.

### Implementation Blueprint
```python
import threading
import time
from dataclasses import dataclass
from typing import Any, Optional

# =====================================================================
# 1. THREAD-SAFE CACHE & CONNECTION THROTTLER
# =====================================================================

@dataclass
class CacheEntry:
    value: Any
    expires_at: float

class ThreadSafeEnterpriseCache:
    def __init__(self, max_concurrent_fetches: int = 3):
        self._store: dict[str, CacheEntry] = {}
        self._lock = threading.RLock()  # Re-entrant Lock for thread safety!
        self._fetch_semaphore = threading.BoundedSemaphore(max_concurrent_fetches)
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is not None:
                if entry.expires_at > time.time():
                    self._hits += 1
                    return entry.value
                else:
                    # Expired entry cleanup
                    del self._store[key]

            self._misses += 1
            return None

    def set(self, key: str, value: Any, ttl_seconds: float = 30.0):
        with self._lock:
            expires_at = time.time() + ttl_seconds
            self._store[key] = CacheEntry(value, expires_at)

    def get_or_compute(self, key: str, compute_func: callable, ttl: float = 10.0) -> Any:
        """Thread-safe Cache-Aside pattern with connection throttling."""
        # 1. Fast Path: Check Cache
        cached_val = self.get(key)
        if cached_val is not None:
            return cached_val

        # 2. Slow Path: Throttle concurrent external database computations
        with self._fetch_semaphore:
            # Double-Check Locking Pattern
            with self._lock:
                entry = self._store.get(key)
                if entry and entry.expires_at > time.time():
                    return entry.value

            print(f"⚙️ [FETCHING FROM DB] Computing '{key}' on Thread {threading.current_thread().name}...")
            computed_value = compute_func()
            self.set(key, computed_value, ttl_seconds=ttl)
            return computed_value

    def stats(self) -> dict:
        with self._lock:
            return {
                "active_keys": len(self._store),
                "cache_hits": self._hits,
                "cache_misses": self._misses,
                "hit_ratio_pct": round(self._hits / (self._hits + self._misses) * 100, 1) if (self._hits + self._misses) > 0 else 0.0
            }

# =====================================================================
# 2. CONCURRENT MULTI-THREAD VERIFICATION
# =====================================================================

def expensive_database_query():
    time.sleep(0.2)  # Simulate expensive database fetch
    return {"user_id": 101, "role": "ADMIN", "data": "SECURE_PAYLOAD"}

if __name__ == "__main__":
    print("=" * 68)
    print("      THREAD-SAFE ENTERPRISE CACHE & THROTTLER SUITE")
    print("=" * 68)

    cache = ThreadSafeEnterpriseCache(max_concurrent_fetches=2)

    def client_worker(worker_id: int):
        # 8 threads all request the same key concurrently!
        result = cache.get_or_compute("user:101", expensive_database_query, ttl=2.0)
        print(f"  • Worker #{worker_id} retrieved: {result['role']} (Thread {threading.current_thread().name})")

    threads = [threading.Thread(target=client_worker, args=(i,), name=f"Client-{i}") for i in range(1, 9)]

    start_all = time.perf_counter()
    for t in threads: t.start()
    for t in threads: t.join()
    elapsed = time.perf_counter() - start_all

    print("-" * 68)
    print("📊 CACHE METRICS & CONCURRENCY STATS:")
    print("  Total Duration :", f"{elapsed:.3f} seconds")
    print("  Cache Stats    :", cache.stats())
    print("=" * 68)
```

---

## Summary

In this lesson, you mastered Thread Synchronization and Locks in Python:
- **Race Conditions** occur when multiple threads mutate shared memory concurrently; the GIL does **not** protect application state.
- **`threading.Lock`** provides mutual exclusion, ensuring only 1 thread executes a critical section. Always use **`with lock:`**.
- **`threading.RLock`** allows the same thread to acquire a lock recursively without self-deadlock.
- **`BoundedSemaphore(N)`** throttles concurrent access to pools and shared resources.
- **`Event`** provides one-to-many broadcast wakeups, and **`Condition`** coordinates complex producer-consumer queues.
- Prevent **Deadlocks** by enforcing a **Global Lock Ordering Hierarchy** and using lock acquisition timeouts.

---

## Best Practices Checklist

- [ ] Always wrap lock acquisitions in `with lock:` context managers.
- [ ] Use `RLock` when class methods with locks call other methods within the same class.
- [ ] Use `BoundedSemaphore` for database and API connection pools.
- [ ] Avoid busy-waiting loops; use `Event.wait()` or `Condition.wait()`.
- [ ] Always establish a strict lock acquisition order to prevent circular deadlocks.

---

## What's Next?

Now that you understand thread synchronization, continue to:
👉 **[Multiprocessing, Pools & IPC](multiprocessing-pools-and-queues.md)** to master process pools, inter-process communication (`Queue`, `Pipe`), and high-speed zero-copy Shared Memory!
