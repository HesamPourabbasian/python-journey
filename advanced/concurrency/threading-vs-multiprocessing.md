# Threading vs Multiprocessing in Python

## Introduction

In modern software engineering, one of the most critical architectural decisions is choosing the right concurrency model for your workload.

As Rob Pike (co-creator of Go and Unix pioneer) famously stated:
> *"Concurrency is about **dealing** with lots of things at once. Parallelism is about **doing** lots of things at once."*

In Python, the operating system gives us two fundamental execution models:
1. **Operating System Threads (`threading`)**: Multiple execution threads running inside a **single shared operating system process**. They share the same memory space, global variables, and heap allocations. However, due to CPython's Global Interpreter Lock (GIL), only one thread executes pure-Python bytecode at any given instant.
2. **Operating System Processes (`multiprocessing`)**: Multiple independent operating system processes, each with its own **isolated virtual memory space** and its own **independent CPython interpreter and GIL**. Processes can execute in true parallel on separate physical CPU hardware cores.

Choosing between threading and multiprocessing requires understanding memory virtualization, the cost of Inter-Process Communication (IPC), operating system context switching, and the nature of your workload (I/O-bound vs CPU-bound).

This lesson opens **Module 3: Concurrency & Parallelism in Depth**, exploring operating system execution architectures, memory isolation, daemon lifecycles, and building hybrid concurrency pipelines.

---

## Prerequisites

Before studying threading and multiprocessing, ensure you have:

- Completed [CPython Execution Pipeline & Architecture](../internals/cpython-architecture.md).
- Completed [The Global Interpreter Lock (GIL)](../internals/gil-global-interpreter-lock.md).
- Solid understanding of operating system processes, threads, and memory allocation.

---

## Core Concept: Process Memory Isolation vs Thread Memory Sharing

```
                        PROCESS ISOLATION vs THREAD MEMORY SHARING

    MULTIPROCESSING (Isolated Memory Spaces)         MULTITHREADING (Shared Memory Space)
   ┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
   │ Process 1 (PID 1001)                   │       │ Single Process (PID 1003)              │
   │ ┌────────────────────────────────────┐ │       │ ┌────────────────────────────────────┐ │
   │ │ Virtual Memory (Heap, Globals)     │ │       │ │ Shared Heap, Global Variables,     │ │
   │ │ CPython Interpreter 1 (Own GIL!)   │ │       │ │ Open Sockets, File Descriptors     │ │
   │ └────────────────────────────────────┘ │       │ └────────────────────────────────────┘ │
   └───────────────────┬────────────────────┘       │                                        │
                       │ IPC (Pickle / Pipe)        │ ┌──────────────┐      ┌──────────────┐ │
   ┌───────────────────▼────────────────────┐       │ │ Thread 1     │      │ Thread 2     │ │
   │ Process 2 (PID 1002)                   │       │ │ (Stack: 8KB) │      │ (Stack: 8KB) │ │
   │ ┌────────────────────────────────────┐ │       │ └──────────────┘      └──────────────┘ │
   │ │ Virtual Memory (Heap, Globals)     │ │       │  (Contend for Single Process GIL)      │
   │ │ CPython Interpreter 2 (Own GIL!)   │ │       └────────────────────────────────────────┘
   │ └────────────────────────────────────┘ │
   └────────────────────────────────────────┘
```

---

## Syntax & Essential Concurrency Patterns

```python
import threading
import multiprocessing
import time
import os

# 1. Threading Pattern (I/O-Bound Workload)
def io_worker(task_name: str, delay_sec: float):
    print(f"🧵 [THREAD START] {task_name} on Thread ID: {threading.get_ident()} (PID: {os.getpid()})")
    time.sleep(delay_sec)  # time.sleep releases the GIL!
    print(f"✅ [THREAD DONE]  {task_name}")

thread = threading.Thread(target=io_worker, args=("DownloadTask", 0.5), daemon=False)
thread.start()
thread.join()  # Wait for thread to finish

# 2. Multiprocessing Pattern (CPU-Bound Workload)
def cpu_worker(worker_id: int, iterations: int):
    print(f"⚙️ [PROCESS START] Worker #{worker_id} on Process PID: {os.getpid()}")
    count = 0
    for _ in range(iterations):
        count += 1
    print(f"🎉 [PROCESS DONE]  Worker #{worker_id} calculated {count:,d} loops.")

if __name__ == "__main__":
    # In multiprocessing, ALWAYS protect entrypoint with if __name__ == '__main__'!
    process = multiprocessing.Process(target=cpu_worker, args=(1, 10_000_000))
    process.start()
    process.join()  # Wait for process to finish
```

---

## Detailed Explanation

### 1. Memory Sharing vs The Pickling Serialization Tax

- **Threads Share Memory Directly**: If Thread A updates `global_cache["user_101"] = user_object`, Thread B sees that exact memory pointer immediately with **zero serialization overhead**.
- **Processes Have Isolated Memory**: Process A **cannot** access Process B's memory. To send data between processes, Python must:
  1. **Serialize (Pickle)** the Python object into a binary byte sequence.
  2. Transmit the bytes across an operating system pipe, socket, or shared memory buffer (**IPC**).
  3. **Deserialize (Unpickle)** the bytes back into a new Python object inside Process B's heap.

$$\textbf{The Pickling Tax: If your workload passes multi-gigabyte datasets between processes,}$$

$$\textbf{the time spent serializing and copying bytes can exceed the parallel CPU speedup!}$$

---

### 2. Process Start Methods: `spawn` vs `fork`

Python supports 3 distinct methods for creating new operating system processes:

1. **`spawn` (Default on Windows & macOS)**:
   - Starts a completely fresh, blank Python interpreter process.
   - Re-imports the main module and initializes only necessary resources.
   - Slower startup, but 100% safe and free from inherited mutex locks.
2. **`fork` (Legacy default on Linux)**:
   - Uses the POSIX `fork()` system call to clone the entire parent process memory space (**Copy-On-Write**).
   - Extremely fast startup, but **inherits parent thread locks in an inconsistent state**, frequently causing deadlocks in multi-threaded programs.
3. **`forkserver`**:
   - A dedicated single-threaded server process handles all subsequent `fork()` calls, combining safety with fast startup.

```python
# Setting Process Start Method in Python:
# multiprocessing.set_start_method("spawn") # Recommended for cross-platform safety!
```

---

### 3. Daemon Threads vs Non-Daemon Threads

- **Non-Daemon Threads (Default: `daemon=False`)**: The Python process **will not exit** until all non-daemon threads have completed their execution.
- **Daemon Threads (`daemon=True`)**: Background threads (like telemetry collectors or heartbeat emitters) that are **abruptly killed by the operating system the instant all non-daemon threads exit**.
  - 🚨 *Warning*: Daemon threads do not execute `finally` blocks or flush file buffers when abruptly killed!

---

## Examples

### 1. Simple: Inspecting Process IDs and Thread Identifiers
Demonstrating that threads share a single PID while processes receive unique OS PIDs.

```python
import os
import threading
import multiprocessing

def print_thread_identity():
    print(f"🧵 Thread ID: {threading.get_ident():<16} │ Host Process PID: {os.getpid()}")

def print_process_identity():
    print(f"⚙️ Process PID: {os.getpid():<16} │ Parent Process PID: {os.getppid()}")

if __name__ == "__main__":
    print(f"🚀 Main Application Process PID: {os.getpid()}\n")

    print("--- Spawning 2 Threads ---")
    t1 = threading.Thread(target=print_thread_identity)
    t2 = threading.Thread(target=print_thread_identity)
    t1.start(); t2.start()
    t1.join(); t2.join()

    print("\n--- Spawning 2 Processes ---")
    p1 = multiprocessing.Process(target=print_process_identity)
    p2 = multiprocessing.Process(target=print_process_identity)
    p1.start(); p2.start()
    p1.join(); p2.join()
```

### 2. Beginner: High-Throughput I/O Scraping with Multi-Threading
Fetching multiple simulated URLs concurrently using `threading.Thread`.

```python
import threading
import time

def fetch_web_resource(url: str, latency: float):
    start = time.perf_counter()
    # Simulated network latency (Releases GIL!)
    time.sleep(latency)
    elapsed = (time.perf_counter() - start) * 1000.0
    print(f"🌐 [FETCHED] {url:<28} in {elapsed:>6.1f} ms (Thread: {threading.current_thread().name})")

urls = [
    ("https://api.stripe.com/v1/charges", 0.3),
    ("https://api.github.com/repos",      0.2),
    ("https://api.openai.com/v1/models",  0.4),
    ("https://api.slack.com/methods",     0.25),
]

start_all = time.perf_counter()
threads = [
    threading.Thread(target=fetch_web_resource, args=(u, lat), name=f"Worker-{i}")
    for i, (u, lat) in enumerate(urls, start=1)
]

for t in threads: t.start()
for t in threads: t.join()

total_sec = time.perf_counter() - start_all
print(f"\n✅ All 4 I/O network calls completed in {total_sec:.2f}s (Concurrent wall-clock speedup!)")
```

### 3. Intermediate: Parallel CPU Hashing Across Multi-Core Processors
Distributing cryptographic SHA-256 password hashing across multiple CPU cores with `multiprocessing`.

```python
import multiprocessing
import hashlib
import time

def compute_heavy_hashes(worker_id: int, count: int):
    t0 = time.perf_counter()
    sample = "enterprise_secure_password_salt_9901"
    for _ in range(count):
        sample = hashlib.sha256(sample.encode("utf-8")).hexdigest()
    
    elapsed = time.perf_counter() - t0
    print(f"⚙️ Process #{worker_id} (PID {os.getpid()}) completed {count:,d} SHA-256 iterations in {elapsed:.3f}s")

if __name__ == "__main__":
    TOTAL_HASHES = 3_000_000
    NUM_WORKERS = 4
    chunk = TOTAL_HASHES // NUM_WORKERS

    print(f"Distributing {TOTAL_HASHES:,d} Cryptographic Hashes across {NUM_WORKERS} OS Processes:")
    print("-" * 65)

    start = time.perf_counter()
    processes = [
        multiprocessing.Process(target=compute_heavy_hashes, args=(i, chunk))
        for i in range(1, NUM_WORKERS + 1)
    ]

    for p in processes: p.start()
    for p in processes: p.join()

    print("-" * 65)
    print(f"🎉 Total Parallel Execution Time: {time.perf_counter() - start:.3f}s across {NUM_WORKERS} cores!")
```

### 4. Real-World: Background Telemetry Flusher with Daemon Threads
Using a daemon thread to periodically flush in-memory log batches to disk without blocking the main program.

```python
import threading
import time
import collections

class BackgroundTelemetryLogger:
    def __init__(self, flush_interval_sec: float = 0.5):
        self.flush_interval = flush_interval_sec
        self.buffer = collections.deque()
        self.lock = threading.Lock()
        
        # Daemon Thread: Automatically terminates when main thread finishes!
        self._daemon_thread = threading.Thread(target=self._flusher_loop, daemon=True)
        self._daemon_thread.start()

    def log(self, message: str):
        with self.lock:
            self.buffer.append(f"[{time.strftime('%X')}] {message}")

    def _flusher_loop(self):
        while True:
            time.sleep(self.flush_interval)
            items_to_flush = []
            with self.lock:
                while self.buffer:
                    items_to_flush.append(self.buffer.popleft())
            
            if items_to_flush:
                print(f"💾 [FLUSHED {len(items_to_flush)} LOGS TO DISK]:")
                for item in items_to_flush:
                    print(f"   • {item}")

# Test Background Flusher
logger = BackgroundTelemetryLogger(flush_interval_sec=0.2)
logger.log("User login: alice")
logger.log("API call: /checkout")
time.sleep(0.3)  # Allows background daemon to flush
logger.log("Payment processed: $150.00")
time.sleep(0.3)  # Second flush
```

### 5. Advanced: Memory Footprint & Resource Benchmark: Threads vs Processes
Measuring operating system RAM consumption and process creation overhead.

```python
import threading
import multiprocessing
import time
import os

def minimal_task():
    time.sleep(0.1)

if __name__ == "__main__":
    N = 50

    # 1. Benchmark 50 Threads
    t0 = time.perf_counter()
    threads = [threading.Thread(target=minimal_task) for _ in range(N)]
    for t in threads: t.start()
    for t in threads: t.join()
    thread_duration = time.perf_counter() - t0

    # 2. Benchmark 50 Processes
    t0 = time.perf_counter()
    processes = [multiprocessing.Process(target=minimal_task) for _ in range(N)]
    for p in processes: p.start()
    for p in processes: p.join()
    process_duration = time.perf_counter() - t0

    border = "=" * 60
    print(border)
    print("CONCURRENCY OVERHEAD BENCHMARK (50 WORKERS):")
    print(border)
    print(f"  50 Threads Creation & Execution   : {thread_duration:.4f}s  (~8 KB RAM / thread)")
    print(f"  50 Processes Creation & Execution : {process_duration:.4f}s  (~25 MB RAM / process)")
    print(f"  Process Creation Overhead Ratio   : {process_duration / thread_duration:.1f}x heavier!")
    print(border)
```

---

## Code Explanation

In Example 5 (`Benchmark Comparison`):
1. **Thread Creation**: Creating a thread simply allocates a small 8 KB execution stack and registers the thread with the OS kernel within the existing process. 50 threads execute in milliseconds with minimal RAM overhead.
2. **Process Creation**: Creating an OS process requires the kernel to allocate a brand-new Virtual Memory table, duplicate file descriptors, spawn a new CPython runtime interpreter, import `sys` and `builtins`, and initialize the runtime state.
3. This demonstrates why **`threading` is ideal for lightweight, high-concurrency I/O connections**, while **`multiprocessing` should be reserved for heavy CPU-bound tasks** where the computation duration justifies the process startup overhead.

---

## Common Mistakes

### Mistake 1: Omitting `if __name__ == '__main__':` in Multiprocessing
On Windows and macOS (which use `spawn`), child processes import the main script to start execution. If your process creation code is outside `if __name__ == '__main__':`, each child process will spawn new children in an infinite recursive loop, crashing the OS (**Fork Bomb!**).

### Mistake 2: Assuming Global Variables are Shared Across Processes
Mutating a global variable inside a `multiprocessing.Process` mutates only that child's private copy of the variable; the parent process and sibling processes will **never see the change**. Use `multiprocessing.Value`, `Queue`, or `Manager`.

---

## Best Practices

### Match Concurrency Paradigm to Workload

```
                        ARCHITECTURAL DECISION MATRIX

                   I/O-Bound (Waiting on Network/Disk)
                   ───────────────────────────────────
                   • Use: asyncio (Highest throughput) or threading
                   • Benefits: Low memory overhead, instant startup

                   CPU-Bound (Heavy Mathematical Compute)
                   ──────────────────────────────────────
                   • Use: multiprocessing or ProcessPoolExecutor
                   • Benefits: Bypasses the GIL, scales across all CPU cores
```

---

## Performance Considerations

| Metric | `threading.Thread` | `multiprocessing.Process` |
|---|---|---|
| **RAM per Worker** | **~8 to 16 KB** | **~25 to 40 MB** |
| **Max Practical Workers** | 1,000 to 5,000 | 1 to $2\times$ CPU Cores |
| **Data Sharing Speed** | **Instant (Direct Memory Pointer)**| IPC (Pickling Serialization Overhead)|
| **Bypasses GIL?** | ❌ No (Bytecode limited) | **✅ Yes (100% Parallel Multi-Core)** |

---

## Security Considerations

1. **Unpickling Untrusted IPC Payloads**: `multiprocessing.Queue` and `Pipe` use `pickle` under the hood. Never allow untrusted network clients to write raw bytes directly into internal IPC pipes, as malicious pickled payloads can execute arbitrary shell commands.

---

## Real-World Usage

- **Gunicorn / uWSGI Web Servers**: Pre-forking 4–8 worker processes to bypass the GIL, with each worker running asynchronous event loops.
- **Video & Image Encoding (FFmpeg / OpenCV)**: Distributing video frame rendering across separate CPU processes.
- **Background Telemetry Agents**: Running daemon threads to ship metrics to DataDog or Prometheus.

---

## Comparison: Python Concurrency Models

| Feature | `threading` | `multiprocessing` | `asyncio` |
|---|---|---|---|
| **Execution Model** | Preemptive OS Threads | Preemptive OS Processes | **Cooperative Event Loop** |
| **Parallel CPU Cores?**| ❌ No | **✅ Yes** | ❌ No |
| **Memory Isolation** | Shared Memory | **Isolated Virtual Memory**| Shared Memory |
| **Context Switching** | Kernel Preemption | Kernel Preemption | **User-Space (`await`)** |

---

## Advanced Concepts: POSIX `fork()` & Copy-On-Write (COW)

On Linux, `multiprocessing` historically used POSIX `fork()`. The operating system does not copy memory immediately; instead, parent and child share physical RAM pages in read-only mode until one process writes to memory (**Copy-On-Write**).

However, CPython's **Reference Counting** mutates `ob_refcnt` even on read-only operations (e.g. iterating over a list increments ref counts), which triggers COW page faults and forces the OS to duplicate memory anyway! Python 3.12+ introduced **Immortal Objects (PEP 683)** to solve this problem for shared immutable constants.

---

## Exercises

### Exercise 1 — Beginner
Write a script that creates 3 threads and 3 processes. Have each print its worker index and sleep for 0.2s. Verify that all 3 threads share one PID while the 3 processes have 3 distinct PIDs.

### Exercise 2 — Intermediate
Write an image thumbnail processing simulator. Implement both a multi-threaded and a multi-processed version that processes 20 image buffers, comparing total execution time to prove `multiprocessing` runs faster for CPU work.

### Exercise 3 — Advanced
Build a `HybridWorkerPool` that spawns 2 background CPU worker processes for mathematical data crunching and 4 I/O threads for downloading incoming network requests, communicating between them using `multiprocessing.Queue`.

---

## Mini Project: Enterprise Hybrid Multi-Threaded I/O Ingestor & Multi-Processed Compute Pipeline

### Requirements
Build an operational hybrid concurrency pipeline named `hybrid_concurrency_pipeline.py`. Use multi-threaded workers for high-concurrency network I/O ingestion and multi-process workers for CPU-intensive data hashing, coordinating data flow across process boundaries using `multiprocessing.Queue`.

### Implementation Blueprint
```python
import time
import os
import hashlib
import threading
import multiprocessing
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. DATA MODELS & WORKLOADS
# =====================================================================

@dataclass
class RawPayload:
    batch_id: str
    data_string: str
    received_at: str

@dataclass
class ProcessedResult:
    batch_id: str
    sha256_hash: str
    processed_by_pid: int
    duration_ms: float

# =====================================================================
# 2. CPU COMPUTE WORKER (MULTIPROCESSING)
# =====================================================================

def cpu_crypto_worker(task_queue: multiprocessing.Queue, result_queue: multiprocessing.Queue):
    """Runs inside a separate OS Process: Bypasses the GIL!"""
    pid = os.getpid()
    print(f"⚙️ [CPU WORKER ONLINE] Process PID: {pid}")

    while True:
        payload = task_queue.get()
        if payload is None:  # Poison pill shutdown sentinel
            print(f"🛑 [CPU WORKER EXIT] Process PID: {pid}")
            break

        t0 = time.perf_counter()
        
        # Heavy CPU hashing loop
        h = payload.data_string
        for _ in range(500_000):
            h = hashlib.sha256(h.encode("utf-8")).hexdigest()

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        result_queue.put(ProcessedResult(payload.batch_id, h, pid, elapsed_ms))

# =====================================================================
# 3. I/O INGESTION WORKER (MULTITHREADING)
# =====================================================================

def io_network_ingestor(batch_id: str, task_queue: multiprocessing.Queue):
    """Runs inside a lightweight Thread: Fetches network I/O and queues for CPU processing."""
    # Simulate network latency (Releases GIL!)
    time.sleep(0.1)
    
    raw_data = f"payload_data_block_{batch_id}_{time.time()}"
    ts = datetime.now(timezone.utc).strftime("%X")
    
    payload = RawPayload(batch_id, raw_data, ts)
    task_queue.put(payload)
    print(f"📥 [I/O INGESTED] {batch_id} (Thread: {threading.current_thread().name})")

# =====================================================================
# 4. HYBRID PIPELINE ORCHESTRATOR
# =====================================================================

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE HYBRID CONCURRENCY PIPELINE (I/O + CPU)")
    print("=" * 68)

    task_queue = multiprocessing.Queue()
    result_queue = multiprocessing.Queue()

    # 1. Start 2 CPU Worker Processes (Parallel compute cores)
    num_cpu_workers = 2
    cpu_processes = [
        multiprocessing.Process(target=cpu_crypto_worker, args=(task_queue, result_queue))
        for _ in range(num_cpu_workers)
    ]
    for p in cpu_processes: p.start()

    # 2. Launch 6 I/O Ingestion Threads (Concurrent network fetch)
    num_batches = 6
    io_threads = [
        threading.Thread(target=io_network_ingestor, args=(f"BATCH-{i:03d}", task_queue), name=f"IO-Thread-{i}")
        for i in range(1, num_batches + 1)
    ]

    start_all = time.perf_counter()
    for t in io_threads: t.start()
    for t in io_threads: t.join()

    # 3. Collect Results from CPU Workers
    print("\n📊 COLLECTING COMPUTED HASH RESULTS:")
    print("-" * 68)
    for _ in range(num_batches):
        res = result_queue.get()
        print(f"  • [{res.batch_id}] Hash: {res.sha256_hash[:16]}... │ Processed by PID: {res.processed_by_pid} ({res.duration_ms:.1f} ms)")

    # 4. Send Poison Pills to stop CPU worker processes
    for _ in range(num_cpu_workers):
        task_queue.put(None)
    for p in cpu_processes:
        p.join()

    total_time = time.perf_counter() - start_all
    print("-" * 68)
    print(f"🎉 Hybrid Pipeline Processed {num_batches} Batches in {total_time:.2f}s Total Wall-Clock Time!")
    print("=" * 68)
```

---

## Summary

In this lesson, you mastered Threading vs Multiprocessing in Python:
- **`threading`** runs lightweight threads within a **single shared memory process**, ideal for **I/O-bound workloads** (network, disk).
- **`multiprocessing`** spawns **isolated operating system processes** with independent GILs, delivering true multi-core **parallelism for CPU-bound computation**.
- Data sharing in multiprocessing incurs a **Pickling Serialization Overhead** across IPC boundaries.
- Use **`daemon=True`** for non-critical background services, but avoid daemons for tasks requiring graceful file flushing.
- Always guard multiprocessing scripts with **`if __name__ == '__main__':`** to prevent recursive fork bombs.

---

## Best Practices Checklist

- [ ] Use `threading` or `asyncio` for I/O-bound network/database tasks.
- [ ] Use `multiprocessing` for CPU-intensive mathematical/cryptographic workloads.
- [ ] Always protect multiprocessing code with `if __name__ == '__main__':`.
- [ ] Minimize the size of data objects passed across IPC queues to avoid pickling latency.
- [ ] Explicitly shut down worker processes using sentinel values (poison pills).

---

## What's Next?

Now that you understand the difference between Threads and Processes, continue to:
👉 **[Thread Synchronization & Locks](thread-synchronization-locks.md)** to master mutual exclusion (`Lock`, `RLock`), Semaphores, Events, Conditions, and Deadlock Defenses!
