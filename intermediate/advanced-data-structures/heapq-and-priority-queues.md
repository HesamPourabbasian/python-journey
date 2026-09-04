# Heapq & Priority Queues in Python

## Introduction

In computer science, a **Priority Queue** is an abstract data structure where each element has an associated "priority." Elements with the highest priority are always served before elements with lower priority, regardless of when they were inserted.

If you attempt to implement a priority queue using a standard Python `list`:
- Keeping the list sorted on every insertion requires **$O(N)$ linear time** (shifting elements).
- Inserting $N$ items one-by-one results in slow **$O(N^2)$ quadratic complexity**.

Python solves this with the standard library **`heapq`** module, which implements a **Binary Min-Heap** directly on top of standard Python lists.

A **Binary Heap** is a complete binary tree that satisfies the **Heap Invariant**: every parent node is less than or equal to its children. This guarantees that the smallest element is **always at the root (`heap[0]`) in $O(1)$ constant time**, while insertions (`heappush`) and extractions (`heappop`) execute in lightning-fast **$O(\log N)$ logarithmic time**.

This lesson explores binary min-heap mechanics, `heapq` operations, linear $O(N)$ heap creation via `heapify`, solving the **Priority Queue Tie-Breaker Problem**, and computing streaming **Top-$K$** analytics.

---

## Prerequisites

Before studying `heapq`, ensure you have:

- Completed [The `collections` Module](collections-module.md).
- Completed [Magic & Dunder Methods](../oop/magic-methods-dunder.md) (specifically rich comparisons `__lt__`).
- A solid grasp of algorithmic time complexity ($O(1)$, $O(\log N)$, $O(N)$).

---

## Core Concept: The Binary Min-Heap Invariant

In Python's `heapq`, a binary tree is stored efficiently in a flat, contiguous 0-indexed Python `list`:

$$\text{For any element at index } k:$$

$$\text{Parent Index} = \lfloor(k - 1) / 2\rfloor$$

$$\text{Left Child Index} = 2k + 1, \quad \text{Right Child Index} = 2k + 2$$

$$\textbf{Heap Invariant: } \text{heap}[k] \le \text{heap}[2k + 1] \quad\text{and}\quad \text{heap}[k] \le \text{heap}[2k + 2]$$

```
                        BINARY MIN-HEAP TREE vs ARRAY STORAGE

              TREE REPRESENTATION                         ARRAY STORAGE
                     ( 10 )                         Index:  0   1   2   3   4   5
                    /      \                               ┌───┬───┬───┬───┬───┬───┐
                ( 25 )    ( 15 )                   heap =  │ 10│ 25│ 15│ 40│ 30│ 50│
                /    \    /                                └───┴───┴───┴───┴───┴───┘
            ( 40 ) ( 30 )( 50 )                             ▲
                                                            └─ Always Minimum Element!
```

---

## Syntax & Essential `heapq` Patterns

```python
import heapq

# 1. heappush (O(log N)) and heappop (O(log N))
min_heap = []
heapq.heappush(min_heap, 40)
heapq.heappush(min_heap, 10)
heapq.heappush(min_heap, 25)

print("Smallest Element (heap[0]):", min_heap[0]) # 10 (O(1) peek!)
print("Popped Smallest          :", heapq.heappop(min_heap)) # 10 (Restores invariant in O(log N))
print("Next Smallest            :", heapq.heappop(min_heap)) # 25

# 2. Linear-Time Heap Transformation with heapify() (O(N) time!)
raw_numbers = [90, 15, 45, 10, 30, 5]
heapq.heapify(raw_numbers)  # Re-orders list in-place into a valid heap in O(N)!
print("Heapified Array          :", raw_numbers) # [5, 10, 45, 15, 30, 90]

# 3. Top-K Largest and Smallest Elements
scores = [88, 92, 79, 100, 65, 95, 84]
print("Top 3 Scores (nlargest)  :", heapq.nlargest(3, scores)) # [100, 95, 92]
print("Bottom 2 Scores (nsmallest):", heapq.nsmallest(2, scores)) # [65, 79]

# 4. Merging Multiple Sorted Streams Lazily
stream_a = [10, 30, 50]
stream_b = [20, 40, 60]
merged = list(heapq.merge(stream_a, stream_b))
print("Merged Sorted Streams    :", merged) # [10, 20, 30, 40, 50, 60]
```

---

## Detailed Explanation

### 1. Why `heapify(list)` is $O(N)$ Linear Time

A common misconception is that heapifying a list of $N$ items requires $N \times O(\log N) = O(N \log N)$ operations.

Python's `heapq.heapify()` uses **Floyd's Heap Construction Algorithm**:
1. It starts at the deepest internal parent node $(\lfloor N/2 \rfloor - 1)$ and sifts down towards the root.
2. Most nodes in a binary tree reside near the bottom: $N/2$ leaf nodes require 0 swaps, $N/4$ nodes require at most 1 swap, $N/8$ nodes require at most 2 swaps.
3. The mathematical sum of infinite geometric series yields $\sum \frac{h}{2^h} = 2$, proving that the total number of operations is strictly bounded by **$2N = O(N)$ Linear Time**.

**Golden Rule**: If you have an existing list of items, **always call `heapq.heapify(lst)` once** rather than calling `heappush()` in a loop!

---

### 2. The Priority Queue Tie-Breaking Problem

When building a priority queue, tasks are typically stored as tuples: `(priority, task)`.

```python
# 🚨 CRITICAL BUG (Equal priorities cause TypeError on unorderable tasks!):
class Task:
    def __init__(self, name: str): self.name = name

pq = []
heapq.heappush(pq, (1, Task("Deploy Build")))
# Inserting another task with the SAME priority (1):
# heapq.heappush(pq, (1, Task("Run Backup")))
# 💥 TypeError: '<' not supported between instances of 'Task' and 'Task'!
```

#### Why Does This Crash?
Python compares tuples element-by-element: `(p1, task1) < (p2, task2)`. If `p1 == p2`, Python attempts to compare `task1 < task2`. Because `Task` does not implement `__lt__`, Python crashes!

#### The Solution: The 3-Tuple Pattern with a Monotonic Counter
Include a unique sequence counter in the middle: **`(priority, count, task)`**.

Because `count` is strictly unique and monotonic, `priority` collisions are broken by `count`, and Python **never compares the `task` objects**:

```python
# ✅ CORRECT PATTERN (3-Tuple with sequence counter):
import itertools
counter = itertools.count()

heapq.heappush(pq, (1, next(counter), Task("Deploy Build")))
heapq.heappush(pq, (1, next(counter), Task("Run Backup"))) # Works perfectly! ✅
```

---

### 3. Simulating Max-Heaps with Sign Inversion

Python's `heapq` only provides Min-Heaps. To implement a **Max-Heap** (where the largest element has the highest priority), invert the numeric signs:

```python
max_heap = []
# To push value X, push -X:
heapq.heappush(max_heap, -100)
heapq.heappush(max_heap, -250)
heapq.heappush(max_heap, -50)

# Pop and invert back:
largest = -heapq.heappop(max_heap)
print("Largest Value Popped from Max-Heap:", largest) # 250
```

---

## Examples

### 1. Simple: Basic Min-Heap Task Priority Dispatcher
Extracting tasks in strict priority order.

```python
import heapq

# Priority: Lower numbers = Higher urgency
task_heap = []
heapq.heappush(task_heap, (3, "Low: Generate Monthly PDF Report"))
heapq.heappush(task_heap, (1, "CRITICAL: Database Primary Failover!"))
heapq.heappush(task_heap, (2, "Medium: Clear Redis Staging Cache"))

print("Processing Tasks in Heap Priority Order:")
while task_heap:
    priority, task_name = heapq.heappop(task_heap)
    print(f"  [Priority {priority}] -> {task_name}")
```

### 2. Beginner: Top-K Extraction with `heapq.nlargest`
Extracting the top 3 highest-earning salespeople from a dataset.

```python
import heapq

sales_records = [
    {"agent": "Hesam", "revenue": 145_000.00},
    {"agent": "Sarah", "revenue": 210_000.00},
    {"agent": "Alex",  "revenue": 95_000.00},
    {"agent": "Elena", "revenue": 320_000.00},
    {"agent": "David", "revenue": 180_000.00},
]

# Extract top 2 agents using revenue key
top_agents = heapq.nlargest(2, sales_records, key=lambda x: x["revenue"])

print("🏆 Top 2 Sales Leaders:")
for rank, agent in enumerate(top_agents, start=1):
    print(f"  #{rank} {agent['agent']:<10} : ${agent['revenue']:>10,.2f}")
```

### 3. Intermediate: Robust Object-Oriented Priority Queue Class
Building a thread-safe, tie-breaking priority queue class.

```python
import heapq
import itertools
from dataclasses import dataclass

@dataclass
class JobPayload:
    job_id: str
    command: str

class PriorityQueue:
    def __init__(self):
        self._heap = []
        self._counter = itertools.count()

    def push(self, priority: int, item: JobPayload):
        """Push item with priority (lower number = higher priority)."""
        count = next(self._counter)
        heapq.heappush(self._heap, (priority, count, item))

    def pop(self) -> JobPayload:
        if not self._heap:
            raise IndexError("Pop from empty priority queue.")
        priority, count, item = heapq.heappop(self._heap)
        return item

    def __len__(self) -> int:
        return len(self._heap)

pq = PriorityQueue()
pq.push(priority=2, item=JobPayload("JOB-01", "Compile Assets"))
pq.push(priority=1, item=JobPayload("JOB-02", "Security Patch"))
pq.push(priority=2, item=JobPayload("JOB-03", "Sync S3 Bucket")) # Same priority as JOB-01!

print("Executing Priority Queue Jobs:")
while len(pq) > 0:
    job = pq.pop()
    print(f"  ⚙️ Executing {job.job_id}: '{job.command}'")
```

### 4. Real-World: Streaming Top-$K$ Frequent Items in Constant Memory
Processing an infinite stream of numbers and maintaining the top 3 largest items using `heapq.heappushpop()`.

```python
import heapq
import random

def stream_top_k_largest(stream, k: int = 3):
    """Maintains a min-heap of size K to track top K items in O(N log K) time and O(K) RAM."""
    min_heap = []

    for num in stream:
        if len(min_heap) < k:
            heapq.heappush(min_heap, num)
        elif num > min_heap[0]:
            # Efficiently pop smallest and push new larger item in a single C-step!
            heapq.heappushpop(min_heap, num)

    return sorted(min_heap, reverse=True)

# Simulate streaming 100,000 numbers
simulated_stream = (random.randint(1, 1_000_000) for _ in range(100_000))
top_3 = stream_top_k_largest(simulated_stream, k=3)
print("Top 3 Largest Numbers in Stream:", top_3)
```

### 5. Advanced: Chronological Log Merger with `heapq.merge`
Merging multiple independent pre-sorted log feeds into a single consolidated chronological stream with zero memory buffering.

```python
import heapq

# 3 independent server log streams, pre-sorted by timestamp
server_a_logs = [
    ("10:00:01", "Server-A: Connection established"),
    ("10:00:05", "Server-A: Query executed"),
    ("10:00:09", "Server-A: Connection closed"),
]

server_b_logs = [
    ("10:00:02", "Server-B: CPU high warning"),
    ("10:00:06", "Server-B: Autoscaling triggered"),
]

server_c_logs = [
    ("10:00:03", "Server-C: Auth token renewed"),
    ("10:00:04", "Server-C: Database backup completed"),
]

# heapq.merge streams all iterables lazily using a min-heap under the hood!
consolidated_stream = heapq.merge(server_a_logs, server_b_logs, server_c_logs, key=lambda x: x[0])

print("Chronologically Consolidated Event Stream:")
print("-" * 55)
for timestamp, message in consolidated_stream:
    print(f"[{timestamp}] -> {message}")
```

---

## Code Explanation

In Example 5 (`heapq.merge`):
1. Merging $M$ sorted lists of total length $N$ by concatenating and calling `sorted()` takes $O(N \log N)$ time and requires buffering all $N$ items in RAM.
2. `heapq.merge()` initializes a min-heap of size $M$ (holding only the head of each stream).
3. On every iteration, it pops the smallest head element and fetches the next item from that specific stream into the heap in **$O(\log M)$ time**.
4. The entire consolidation runs in **$O(N \log M)$ time** with **constant $O(M)$ memory**, allowing multi-terabyte log files to be merged seamlessly.

---

## Common Mistakes

### Mistake 1: Assuming a Heap Array is Completely Sorted
A binary heap guarantees **only that `heap[0]` is the minimum element**. Inspecting `heap[1]` or `heap[2]` does **not** guarantee ascending order! To extract sorted data, you must call `heappop()` iteratively.

### Mistake 2: Mutating Elements In-Place Inside a Heap
If you mutate an object stored in a heap (e.g. `heap[3].priority = 0`), you break the heap invariant! Python does not automatically re-heapify. If an element's priority changes, you must re-run `heapq.heapify(heap)`.

---

## Best Practices

### Use `heapq.heappushpop()` for Fixed-Capacity Streams
When maintaining a fixed top-$K$ buffer, use `heappushpop(heap, item)` rather than a separate `heappop()` followed by `heappush()`. It executes ~30% faster by combining sifting into a single C-pass.

Good:
```python
if num > min_heap[0]:
    heapq.heappushpop(min_heap, num)
```

---

## Performance Considerations

| Operation | Time Complexity | Notes |
|---|---|---|
| **Peek Minimum (`heap[0]`)** | **$O(1)$** | Immediate array lookup |
| **`heappush(heap, item)`** | **$O(\log N)$** | Sifts up along tree height |
| **`heappop(heap)`** | **$O(\log N)$** | Sifts down replacement root |
| **`heapify(list)`** | **$O(N)$** | Linear Floyd construction |
| **`heappushpop(heap, item)`** | **$O(\log N)$** | Combined single-pass sift |
| **`nlargest(K, data)`** | **$O(N \log K)$** | Outperforms sorting for $K \ll N$ |

---

## Security Considerations

1. **Priority Inversion & Starvation**: If high-priority tasks arrive continuously, low-priority tasks may starve and never execute. Implement dynamic priority aging (gradually boosting priority over time) in long-running job schedulers.
2. **Preventing Memory Denial of Service**: Use bounded heaps (`nlargest`) on unbounded streaming endpoints to prevent attackers from causing heap memory exhaustion crashes.

---

## Real-World Usage

- **Dijkstra's Shortest Path & A* Pathfinding**: Finding optimal paths in graph routing engines.
- **Operating System Task Schedulers**: Prioritizing CPU threads and I/O tasks.
- **Financial Order Books**: Matching limit orders based on price/time priority.

---

## Comparison: Priority Queue Implementations

| Data Structure | Peek Min | Insert | Pop Min | Space Complexity |
|---|---|---|---|---|
| **Unsorted List** | $O(N)$ | $O(1)$ | $O(N)$ | $O(N)$ |
| **Sorted List** | $O(1)$ | $O(N)$ | $O(1)$ | $O(N)$ |
| **Binary Min-Heap (`heapq`)**| **$O(1)$** | **$O(\log N)$** | **$O(\log N)$**| **$O(N)$ (Flat Array)**|
| **Balanced BST (`Red-Black`)**| $O(\log N)$| $O(\log N)$ | $O(\log N)$ | $O(N)$ + Pointer overhead |

---

## Advanced Concepts: The C-Accelerated `_heapq` Module

Python's standard library implements `heapq` in pure C (`Modules/_heapq.c`) with a fallback Python implementation in `Lib/heapq.py`. The C implementation manipulates `PyListObject` memory buffers directly, executing pushes and pops in under **$80\text{ nanoseconds}$**.

---

## Exercises

### Exercise 1 — Beginner
Create a list of 10 random integers. Use `heapq.heapify()` to turn it into a min-heap, and pop all elements one-by-one into a new list to verify that it sorts the numbers.

### Exercise 2 — Intermediate
Build a `MedianFinder` class with methods `add_num(num: float)` and `find_median() -> float` that computes the running median of a data stream in $O(\log N)$ time using two heaps (a Max-Heap for the lower half and a Min-Heap for the upper half).

### Exercise 3 — Advanced
Build an asynchronous or multi-threaded `DistributedJobScheduler` using `heapq` that supports task cancellation by marking job IDs as invalid in an auxiliary set without modifying the heap array.

---

## Mini Project: Enterprise Asynchronous Job Scheduler & SLA Deadline Engine

### Requirements
Build an operational task scheduler named `sla_job_scheduler.py`. Implement a priority queue engine with monotonic tie-breaking, scheduled execution timestamps, SLA deadline tracking, job cancellation, and dispatching in strict chronological priority order.

### Implementation Blueprint
```python
import heapq
import itertools
import time
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. TASK DATA STRUCTURES
# =====================================================================

@dataclass
class JobTask:
    job_id: str
    target_service: str
    payload: dict

class SLAJobScheduler:
    """Priority Job Scheduler based on Binary Min-Heap with SLA timestamps."""

    def __init__(self):
        self._heap = []
        self._counter = itertools.count()
        self._cancelled_jobs = set()

    def schedule_job(self, priority: int, job: JobTask, delay_sec: float = 0.0):
        """Schedule a job with priority level (1=Highest) and execution timestamp."""
        execution_time = time.time() + delay_sec
        count = next(self._counter)
        
        # Heap Entry: (execution_time, priority, count, job)
        heapq.heappush(self._heap, (execution_time, priority, count, job))
        print(f"📅 [SCHEDULED] {job.job_id} for '{job.target_service}' (Priority: {priority}, Delay: {delay_sec}s)")

    def cancel_job(self, job_id: str):
        """Marks a job as cancelled (lazy deletion pattern)."""
        self._cancelled_jobs.add(job_id)
        print(f"🚫 [CANCELLED] Job #{job_id} marked as cancelled.")

    def run_due_jobs(self):
        """Processes all jobs whose scheduled execution time has arrived."""
        now = time.time()
        processed_count = 0

        while self._heap and self._heap[0][0] <= now:
            exec_time, priority, count, job = heapq.heappop(self._heap)
            
            # Check if job was cancelled
            if job.job_id in self._cancelled_jobs:
                print(f"  ⏭️ [SKIPPED] Job #{job.job_id} was cancelled.")
                self._cancelled_jobs.remove(job.job_id)
                continue

            # Execute job
            print(f"  🚀 [EXECUTING #{job.job_id}] Service: {job.target_service} (Priority {priority}) -> Payload: {job.payload}")
            processed_count += 1

        return processed_count

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE SLA JOB SCHEDULER & BINARY HEAP ENGINE")
    print("=" * 68)
    
    scheduler = SLAJobScheduler()
    
    # 1. Schedule Jobs with varying priorities and delays
    scheduler.schedule_job(
        priority=3,
        job=JobTask("JOB-101", "BillingEmailService", {"invoice": "INV-01"}),
        delay_sec=0.0
    )
    scheduler.schedule_job(
        priority=1,
        job=JobTask("JOB-102", "SecurityFirewallService", {"block_ip": "10.0.4.1"}),
        delay_sec=0.0
    )
    scheduler.schedule_job(
        priority=2,
        job=JobTask("JOB-103", "DataWarehouseSync", {"batch": "Q2_TRANSACTIONS"}),
        delay_sec=0.5
    )
    scheduler.schedule_job(
        priority=1,
        job=JobTask("JOB-104", "ObsoleteTask", {"data": "junk"}),
        delay_sec=0.0
    )
    
    # 2. Cancel Job-104
    scheduler.cancel_job("JOB-104")
    
    # 3. Process Immediate Due Jobs
    print("\n--- Running Immediate Batch (T=0) ---")
    scheduler.run_due_jobs()
    
    # 4. Wait for Delayed Job
    print("\n--- Sleeping 0.6s for Delayed Jobs (T=0.5s) ---")
    time.sleep(0.6)
    scheduler.run_due_jobs()
    print("\n" + "=" * 68)
```

---

## Summary

In this lesson, you mastered Python's `heapq` module and binary min-heaps:
- A **Binary Min-Heap** guarantees the minimum element is at `heap[0]` in **$O(1)$ constant time**.
- Insertions (`heappush`) and extractions (`heappop`) execute in **$O(\log N)$ logarithmic time**.
- **`heapq.heapify(list)`** transforms an existing list into a valid min-heap in **$O(N)$ linear time**.
- Always use the **`(priority, counter, task)` 3-Tuple Pattern** to prevent crashes when task priorities collide.
- Simulate **Max-Heaps** by negating numeric priorities (`-priority`).
- Use **`heapq.nlargest()`** and **`heapq.nsmallest()`** for top-$K$ filtering without sorting massive datasets.
- Use **`heapq.merge()`** to consolidate multiple pre-sorted streams in constant memory.

---

## Best Practices Checklist

- [ ] Use `(priority, count, task)` tuples to prevent unorderable object comparison errors.
- [ ] Use `heapq.heapify()` instead of repeated `heappush()` calls on existing collections.
- [ ] Use `heapq.heappushpop()` for fixed-capacity streaming top-$K$ buffers.
- [ ] Implement lazy deletion via cancellation sets rather than searching and deleting from inside heaps.
- [ ] Never mutate an object's priority directly while it resides inside a heap array without re-heapifying.

---

## What's Next?

Now that you understand Heaps and Priority Queues, continue to the final article in this module:
👉 **[The `bisect` Module & Binary Search](bisect-module.md)** to master logarithmic $O(\log N)$ array search, insertion point calculation, and tier lookups!
