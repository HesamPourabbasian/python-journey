# Lists & Dynamic Arrays in Python

## Introduction

In computer science, ordered sequential data is ubiquitous. Whether managing a backlog of pending user jobs, maintaining a sequence of chronological telemetry readings, sorting database query results, or manipulating rows of tabular data, applications require an expressive, mutable sequence container. In Python, the premier data structure for ordered, mutable collections is the built-in **`list`**.

Python lists are not linked lists; they are implemented under the hood as **Dynamic Arrays of Object References (`PyListObject`)**. This architectural choice provides instantaneous $O(1)$ constant-time random access by index and amortized $O(1)$ time complexity when appending elements to the end.

Mastering Python lists requires a deep understanding of memory over-allocation strategies, the distinction between in-place mutation methods (like `.sort()` and `.reverse()`) and non-mutating built-in functions (like `sorted()` and `reversed()`), the algorithmic penalties of modifying lists at their beginning versus their end, and how Python's world-class hybrid sorting algorithm—**Timsort**—operates under the hood.

This lesson opens **Module 6: Built-in Collections**, establishing the foundational concepts of sequence mutation, memory allocation, and algorithmic time complexity.

---

## Prerequisites

Before studying lists in depth, ensure you have:

- Completed [Mutable vs Immutable Objects](../variables-data-types/mutable-vs-immutable.md).
- Completed [String Slicing & Indexing](../strings/string-slicing.md) (slice notation applies identically to lists).
- Completed [For Loops & The Iteration Protocol](../control-flow/for-loops.md).

---

## Core Concept

A Python list is a **mutable, dynamic array of pointers**. 

```
                               CPYTHON PyListObject MEMORY MODEL

   Variable: my_list ────► [ PyListObject Header ]
                           • ob_size = 3 (Length)
                           • allocated = 4 (Allocated capacity)
                           • ob_item ────► [ Pointer Array in Contiguous Memory ]
                                           ├── [0] ────► Heap Object: "Hesam" (str)
                                           ├── [1] ────► Heap Object: 1048576 (int)
                                           ├── [2] ────► Heap Object: 3.14159 (float)
                                           └── [3] ────► NULL (Over-allocated spare slot)
```

### Key Architectural Characteristics:
1. **Contiguous Pointers**: The list stores a contiguous array of 64-bit pointers (memory addresses) pointing to objects on the heap.
2. **Heterogeneous Elements**: Because the array stores pointers rather than raw values, a single list can contain elements of any mix of types (integers, strings, dictionaries, custom objects, or other lists).
3. **Amortized $O(1)$ Resizing**: When the allocated capacity is exhausted, CPython allocates a larger contiguous block of memory with extra headroom, ensuring that appending elements remains $O(1)$ on average.

---

## Syntax & Essential List Methods

```python
# 1. Creation
empty_list = []
numbers = [10, 20, 30, 40, 50]
matrix = [[1, 2], [3, 4]]

# 2. Insertion and Appending
numbers.append(60)            # Adds 60 to end: [10, 20, 30, 40, 50, 60]
numbers.insert(0, 5)          # Inserts 5 at index 0 (O(N) operation!): [5, 10, ...]
numbers.extend([70, 80])      # Appends multiple elements: [..., 60, 70, 80]

# 3. Deletion and Removal
last_item = numbers.pop()     # Removes and returns last item (80)
first_item = numbers.pop(0)   # Removes and returns item at index 0 (5)
numbers.remove(30)            # Searches and removes first occurrence of 30
del numbers[1:3]              # Deletes slice of elements

# 4. Searching and Counting
pos = numbers.index(40)       # Returns index of 40 (raises ValueError if missing)
freq = numbers.count(20)      # Counts occurrences of 20

# 5. In-Place Transformation
numbers.reverse()             # Reverses list in-place (returns None)
numbers.sort()                # Sorts list in-place using Timsort (returns None)
```

---

## Detailed Explanation

### 1. The CPython Memory Over-Allocation Strategy

When you continuously call `.append()`, Python does not re-allocate memory on every single append. Instead, it over-allocates extra capacity using the geometric growth formula defined in `Objects/listobject.c`:

$$\text{allocated} = \text{new\_size} + (\text{new\_size} \gg 3) + (\text{new\_size} < 9 \ ? \ 3 : 6)$$

```
Length (ob_size):      0  1  2  3  4  5  6  7  8  9 ...
Allocated Capacity:    0  4  4  4  4  8  8  8  8 16 ...
```

By doubling or expanding capacity exponentially, the expensive operation of allocating new RAM and copying pointers occurs infrequently, guaranteeing **Amortized $O(1)$ append time**.

### 2. Time Complexity Profile of List Operations

Understanding operation costs is vital for designing scalable software:

| Operation | Syntax | Time Complexity | Notes |
|---|---|---|---|
| **Index Access** | `l[i]` | **$O(1)$ Constant** | Direct pointer arithmetic |
| **Index Assignment** | `l[i] = x` | **$O(1)$ Constant** | Updates pointer at index |
| **Append (End)** | `l.append(x)` | **$O(1)$ Amortized** | Fast; uses pre-allocated capacity |
| **Pop (End)** | `l.pop()` | **$O(1)$ Constant** | Shrinks pointer array offset |
| **Insert (Front/Middle)**| `l.insert(0, x)` | **$O(N)$ Linear** | Must shift all $N$ pointers right |
| **Pop (Front/Middle)** | `l.pop(0)` | **$O(N)$ Linear** | Must shift all $N-1$ pointers left |
| **Delete / Remove** | `l.remove(val)` | **$O(N)$ Linear** | Linear search + pointer shifting |
| **Slice Extraction** | `l[a:b]` | **$O(K)$ Sliced length**| Copies $K$ pointers into new list |
| **Sort** | `l.sort()` | **$O(N \log N)$** | Highly optimized Timsort |

**Critical Takeaway**: Avoid using `list.insert(0, x)` or `list.pop(0)` for FIFO queues in large datasets; use `collections.deque` instead (which provides $O(1)$ operations at both ends).

### 3. In-Place `.sort()` vs Built-in `sorted()`

- `list.sort(key=..., reverse=...)`: Sorts the list **in place**, modifies the existing object, and returns `None`.
- `sorted(iterable, key=..., reverse=...)`: Leaves the original iterable untouched and returns a **brand-new sorted list**.

```python
original = [5, 2, 8, 1, 9]

# Using sorted():
new_sorted = sorted(original)
print("original after sorted() :", original)    # [5, 2, 8, 1, 9] (Unmodified)
print("new_sorted returned     :", new_sorted)  # [1, 2, 5, 8, 9]

# Using .sort():
result = original.sort()
print("original after .sort()  :", original)    # [1, 2, 5, 8, 9] (Mutated!)
print("return value of .sort() :", result)      # None
```

---

## Examples

### 1. Simple: Slicing, Copying, and Element Replacement
Replacing multiple elements simultaneously using slice assignment.

```python
colors = ["red", "green", "blue", "yellow", "purple"]

# Replace slice [1:3] ('green', 'blue') with three new colors
colors[1:3] = ["emerald", "cyan", "sapphire"]
print("After slice replacement:", colors)

# Clear list using slice deletion
colors[:] = []
print("After clearing slice   :", colors)  # []
```

### 2. Beginner: Implementing a LIFO Stack Data Structure
Using a Python list as a high-performance Last-In, First-Out (LIFO) stack.

```python
class BrowserHistoryStack:
    def __init__(self):
        self._history = []

    def visit(self, url: str):
        print(f"Navigating to: {url}")
        self._history.append(url)  # O(1) Push

    def back(self) -> str:
        if not self._history:
            return "About:Blank"
        popped = self._history.pop()  # O(1) Pop
        print(f"Going back from: {popped}")
        return self._history[-1] if self._history else "About:Blank"

history = BrowserHistoryStack()
history.visit("google.com")
history.visit("github.com")
history.visit("python.org")

print("Current Page:", history.back())  # Returns to github.com
print("Current Page:", history.back())  # Returns to google.com
```

### 3. Intermediate: Multi-Attribute Sorting with `key=lambda`
Sorting complex domain records by multiple criteria (e.g., department ascending, salary descending).

```python
employees = [
    {"name": "Hesam", "dept": "Engineering", "salary": 140_000},
    {"name": "Sarah", "dept": "Engineering", "salary": 165_000},
    {"name": "Elena", "dept": "Marketing", "salary": 95_000},
    {"name": "David", "dept": "Engineering", "salary": 120_000},
    {"name": "Alex", "dept": "Marketing", "salary": 110_000},
]

# Sort by Department (A-Z), then Salary (Descending: negated salary)
employees.sort(key=lambda emp: (emp["dept"], -emp["salary"]))

print(f"{'NAME':<10} {'DEPARTMENT':<15} {'SALARY':>10}")
print("-" * 38)
for e in employees:
    print(f"{e['name']:<10} {e['dept']:<15} ${e['salary']:>9,d}")
```

### 4. Real-World: In-Memory Priority Job Backlog Manager
Managing a list of queued worker jobs with deduplication and state updates.

```python
class JobBacklog:
    def __init__(self):
        self._jobs = []

    def add_job(self, job_id: str, priority: int, payload: str):
        # Prevent duplicate jobs
        for job in self._jobs:
            if job["id"] == job_id:
                print(f"⚠️ Job '{job_id}' already exists in backlog.")
                return
                
        self._jobs.append({"id": job_id, "priority": priority, "payload": payload})
        # Keep backlog sorted by priority descending (highest priority first)
        self._jobs.sort(key=lambda j: j["priority"], reverse=True)
        print(f"✅ Enqueued Job '{job_id}' (Priority {priority})")

    def pop_next_job(self) -> dict | None:
        if not self._jobs:
            return None
        return self._jobs.pop(0)  # Pop highest priority job

backlog = JobBacklog()
backlog.add_job("JOB-101", priority=2, payload="Send Newsletter")
backlog.add_job("JOB-102", priority=5, payload="Process Credit Card Batch")
backlog.add_job("JOB-103", priority=1, payload="Purge Temp Logs")
backlog.add_job("JOB-104", priority=5, payload="Database Failover Check")

print("\n--- Dispatching Jobs in Priority Order ---")
while (next_job := backlog.pop_next_job()):
    print(f"Executing: [{next_job['priority']}] {next_job['id']} -> {next_job['payload']}")
```

### 5. Advanced: Observing CPython List Memory Growth in Real Time
Writing a diagnostic script using `sys.getsizeof()` to witness CPython's dynamic array over-allocation curve.

```python
import sys

def trace_list_allocation(total_elements: int):
    items = []
    prev_capacity_bytes = sys.getsizeof(items)
    
    print(f"{'Length':<8} {'Size (Bytes)':<14} {'Event / Growth Notice'}")
    print("=" * 45)
    
    for i in range(total_elements):
        current_len = len(items)
        current_bytes = sys.getsizeof(items)
        
        if current_bytes != prev_capacity_bytes or i == 0:
            print(f"{current_len:<8} {current_bytes:<14} 🚀 Re-allocation! New memory allocated.")
            prev_capacity_bytes = current_bytes
            
        items.append(i)

trace_list_allocation(30)
```

---

## Code Explanation

In Example 5 (Tracing Memory Allocation):
1. An empty list `[]` starts with a base object header size (~56 bytes in 64-bit CPython).
2. As elements are appended, `sys.getsizeof(items)` remains constant across several appends because Python pre-allocated extra pointer slots.
3. When the allocated buffer is filled, CPython allocates a larger contiguous pointer array, and `sys.getsizeof()` jumps in discrete steps (from 88 bytes $\rightarrow$ 120 bytes $\rightarrow$ 184 bytes).
4. This experiment proves empirically that Python lists do not re-allocate RAM on every append, providing predictable $O(1)$ amortized insertion efficiency.

---

## Common Mistakes

### Mistake 1: Assigning the Result of `.sort()` or `.reverse()`
In-place methods modify the list directly and return `None`. Assigning the result overwrites the variable with `None`.

```python
# BROKEN:
scores = [90, 70, 85]
scores = scores.sort()  # scores is now None! ❌

# CORRECT:
scores = [90, 70, 85]
scores.sort()           # scores is now [70, 85, 90] ✅
```

### Mistake 2: Creating a 2D Matrix with Shared Reference Multiplication
Using `[[0] * 3] * 3` creates a list of three references pointing to the **exact same inner list object**.

```python
# BROKEN (Shared Reference Trap):
grid = [[0] * 3] * 3
grid[0][0] = 99
print(grid)  # [[99, 0, 0], [99, 0, 0], [99, 0, 0]] ❌ All rows mutated!

# CORRECT (List Comprehension with distinct inner lists):
grid = [[0] * 3 for _ in range(3)]
grid[0][0] = 99
print(grid)  # [[99, 0, 0], [0, 0, 0], [0, 0, 0]] ✅ Isolated!
```

---

## Best Practices

### Use `list.extend()` or `+=` Instead of Appending in a Loop
When adding all elements from another iterable, use `extend()` or `+=` rather than looping with `append()`.

Good:
```python
# Single C-level buffer resize
active_users.extend(newly_registered_users)
```

Avoid:
```python
for u in newly_registered_users:
    active_users.append(u)  # Multiple repeated Python interpreter frame dispatches
```

---

## Performance Considerations

1. **`list.insert(0, x)` vs `collections.deque.appendleft(x)`**:
   Inserting 100,000 items at the beginning of a list takes **~2.5 seconds** ($O(N^2)$ pointer shifts). Doing the same with `collections.deque` takes **~0.008 seconds** ($O(1)$ node insertion).
2. **Pre-allocating Fixed Sizes**: If you know the exact final size of a list, pre-allocating with `[None] * size` and setting elements by index `l[i] = val` is faster than sequential `.append()` calls.

---

## Security Considerations

1. **Denial of Service via Unbounded List Appends**: API endpoints accepting user-uploaded batches must enforce hard item count caps (e.g., max 1,000 items per request). Appending millions of unvalidated items into an in-memory list can trigger Out-Of-Memory (OOM) operating system kills.
2. **Type Inconsistency Bugs**: Because Python lists are heterogeneous, inadvertently appending an unexpected type (e.g., inserting a string into a list of integers) can cause downstream arithmetic loops to crash with `TypeError`. Use type hints (`list[int]`).

---

## Real-World Usage

- **Database Query Result Sets**: ORMs (SQLAlchemy, Django) return database records as lists of model instances.
- **Data Engineering Batching**: Partitioning large data streams into manageable chunks of 500 rows for bulk database insertion.
- **Web UI Pagination**: Slicing in-memory collections for page display: `page_items = items[offset : offset + page_size]`.

---

## Comparison: List vs Alternative Python Collections

| Feature | `list` | `tuple` | `collections.deque` | `set` | `array.array` |
|---|---|---|---|---|---|
| **Mutability** | Mutable | **Immutable** | Mutable | Mutable | Mutable |
| **Ordering** | Ordered | Ordered | Ordered | **Unordered** | Ordered |
| **Index Access**| **$O(1)$** | **$O(1)$** | $O(N)$ (Middle) | No indexing | **$O(1)$** |
| **Front Pop/Insert**| $O(N)$ (Slow) | N/A | **$O(1)$ (Instant)**| N/A | $O(N)$ |
| **Memory Storage**| Pointers | Pointers | Blocked Chunks | Hash Buckets | Raw C Primitives |

---

## Advanced Concepts: Understanding Timsort

Python's built-in sorting algorithm (`list.sort()` and `sorted()`) is **Timsort**, created by Tim Peters in 2002. Timsort is an adaptive, stable hybrid of **Merge Sort and Insertion Sort**:
- **Stability**: Elements with equal keys preserve their original relative order.
- **Adaptive**: Real-world data often contains pre-sorted ascending or descending sub-sequences called **"runs"**. Timsort identifies existing natural runs, requiring only $O(N)$ time for already sorted data.
- **Worst-Case**: Guaranteed $O(N \log N)$ time and $O(N)$ auxiliary memory.

---

## Exercises

### Exercise 1 — Beginner
Create a list containing 6 programming languages. Perform operations to: (1) append `"Rust"`, (2) insert `"C++"` at index 1, (3) remove the 3rd element using `pop()`, (4) sort the list alphabetically in-place, and (5) print the final list and its length.

### Exercise 2 — Intermediate
Write a function `remove_consecutive_duplicates(numbers: list[int]) -> list[int]` that takes a list of integers and returns a new list where adjacent identical numbers are condensed to a single number (e.g., `[1, 2, 2, 3, 3, 3, 2, 1]` $\rightarrow$ `[1, 2, 3, 2, 1]`).

### Exercise 3 — Advanced
Build a `RotatingBuffer` class with a fixed maximum capacity $K$. When new items are added beyond capacity, the oldest items are automatically dropped. Implement `append()`, `extend()`, `get_all()`, and `__len__()` using pure list operations and slice re-assignment.

---

## Mini Project: In-Memory Priority Task Scheduler & Job Processing Engine

### Requirements
Build an enterprise task scheduler named `task_scheduler.py` that maintains an active job queue using a Python list, allows enqueuing tasks with priority levels, supports task completion tracking, handles multi-criteria sorting, and renders a formatted terminal backlog report.

### Implementation Blueprint
```python
class TaskScheduler:
    def __init__(self):
        self.backlog = []
        self.completed = []

    def add_task(self, task_id: str, title: str, priority: int, estimated_hours: float):
        task = {
            "id": task_id,
            "title": title,
            "priority": priority,  # 1 (Low) to 5 (Critical)
            "hours": estimated_hours
        }
        self.backlog.append(task)
        # Sort backlog: Highest priority first (descending), shortest job first (ascending)
        self.backlog.sort(key=lambda t: (-t["priority"], t["hours"]))
        print(f"📌 Task Added: [{priority}★] {task_id} - {title}")

    def execute_next_task(self) -> dict | None:
        if not self.backlog:
            print("No tasks remaining in backlog.")
            return None
        current = self.backlog.pop(0)
        self.completed.append(current)
        print(f"🚀 Executing Task: {current['id']} - {current['title']} ({current['hours']}h)")
        return current

    def display_backlog(self):
        print("\n" + "=" * 62)
        print(f"           ACTIVE TASK BACKLOG ({len(self.backlog)} Tasks Pending)")
        print("=" * 62)
        print(f"{'PRIORITY':<10} {'TASK ID':<10} {'EST. HOURS':>12}   {'TITLE'}")
        print("-" * 62)
        for t in self.backlog:
            p_stars = "★" * t["priority"]
            print(f"{p_stars:<10} {t['id']:<10} {f'{t[\"hours\"]:.1f}h':>12}   {t['title']}")
        print("=" * 62 + "\n")

if __name__ == "__main__":
    scheduler = TaskScheduler()
    scheduler.add_task("TASK-01", "Update TLS Certificates", priority=5, estimated_hours=1.5)
    scheduler.add_task("TASK-02", "Refactor Auth Middleware", priority=3, estimated_hours=4.0)
    scheduler.add_task("TASK-03", "Fix CSS Alignment Glitch", priority=1, estimated_hours=0.5)
    scheduler.add_task("TASK-04", "Patch Critical Zero-Day Vulnerability", priority=5, estimated_hours=0.8)
    scheduler.add_task("TASK-05", "Write Unit Tests for Billing", priority=3, estimated_hours=2.5)
    
    scheduler.display_backlog()
    scheduler.execute_next_task()
    scheduler.execute_next_task()
    scheduler.display_backlog()
```

---

## Summary

In this lesson, you mastered Python's list and dynamic array architecture:
- Python lists are **mutable dynamic arrays of object pointers** (`PyListObject`).
- Element access and appending at the end operate in **$O(1)$ constant/amortized time**.
- Inserting or popping elements at the beginning requires **$O(N)$ linear pointer shifting**.
- In-place methods (`.sort()`, `.reverse()`) modify the existing list and return `None`.
- Python uses **Timsort** ($O(N \log N)$ adaptive, stable sorting) with the `key=` customization function.
- Avoid modifying lists during direct iteration; use list comprehensions or iterate over copies.

---

## Best Practices Checklist

- [ ] Use `list.append()` and `list.pop()` for $O(1)$ LIFO stack operations.
- [ ] Use `collections.deque` when high-performance FIFO queues or front inserts/pops are needed.
- [ ] Never assign the return value of in-place list methods like `l = l.sort()`.
- [ ] Construct 2D lists using list comprehensions (`[[0]*N for _ in range(M)]`) to avoid shared row references.
- [ ] Use `extend()` or `+=` rather than appending multiple items in a loop.

---

## What's Next?

Now that you understand mutable lists, continue to:
👉 **[Tuples & Named Tuples](tuples.md)** to master immutable sequences, tuple packing/unpacking, and dictionary key hashability.
