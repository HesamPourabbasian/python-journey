# ⚡ Module 3: Concurrency & Parallelism in Depth

Welcome to the **Concurrency & Parallelism** module in Level 3.

Modern computer systems feature multi-core CPUs, hyper-threading, distributed nodes, and asynchronous network devices. To write high-throughput web applications, real-time data streaming engines, and heavy scientific computation pipelines, senior software engineers must understand how to leverage multiple execution threads and multiple operating system processes safely and efficiently.

---

## 🎯 Module Overview

In this module, you will master:
- The distinction between **Concurrency** (managing multiple tasks at once) and **Parallelism** (executing multiple tasks simultaneously on separate hardware cores).
- **Threading vs Multiprocessing**: OS threads, processes, memory models, Inter-Process Communication (IPC), and CPU-bound vs I/O-bound workload allocation.
- **Thread Synchronization & Race Condition Defenses**: `threading.Lock`, `RLock`, `Semaphore`, `Event`, `Condition`, `Barrier`, and deadlock prevention strategies.
- **Multiprocessing Architectures**: Process creation models (`spawn`, `fork`, `forkserver`), `multiprocessing.Process`, `Pool`, `Queue`, `Pipe`, and high-performance **Shared Memory (`multiprocessing.shared_memory`)**.
- **High-Level Pool Orchestration with `concurrent.futures`**: `ThreadPoolExecutor`, `ProcessPoolExecutor`, Futures lifecycle, `as_completed`, and worker management.

---

## 📑 Articles in this Module

1. **[Threading vs Multiprocessing](threading-vs-multiprocessing.md)**
   - Operating system threads vs processes, shared virtual memory vs isolated memory spaces, context switching costs, the GIL's impact on CPU vs I/O workloads, and IPC mechanisms.
2. **[Thread Synchronization & Locks](thread-synchronization-locks.md)**
   - Critical sections, mutual exclusion with `Lock` and re-entrant `RLock`, throttling with `Semaphore`, thread signaling with `Event` and `Condition`, thread rendezvous with `Barrier`, and deadlock detection.
3. **[Multiprocessing, Pools & IPC](multiprocessing-pools-and-queues.md)**
   - Process lifecycles, start methods (`spawn` vs `fork`), parallel mapping with `multiprocessing.Pool`, inter-process communication with `Queue` and `Pipe`, and zero-copy `shared_memory.SharedMemory`.
4. **[Concurrent Futures & Worker Pools](concurrent-futures.md)**
   - Unified executor interface (`ThreadPoolExecutor`, `ProcessPoolExecutor`), `Future` objects, `executor.map()`, `as_completed()`, exception handling in worker threads, and graceful shutdowns.

---

## 🗺️ Progression Path

```
threading-vs-multiprocessing.md ──► thread-synchronization-locks.md ──► multiprocessing-pools-and-queues.md ──► concurrent-futures.md
                                                                                                                        │
                                                                                                                        ▼
                                                                                   [Next Module: AsyncIO](../async/README.md)
```
