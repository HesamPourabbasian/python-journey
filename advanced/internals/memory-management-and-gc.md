# Memory Management & Garbage Collection in Python

## Introduction

In lower-level systems programming languages like C and C++, memory management is entirely manual: developers must explicitly call `malloc()` and `free()`. A single forgotten `free()` causes memory leaks, while calling `free()` too early triggers disastrous **Use-After-Free** security vulnerabilities and segmentation faults.

Python relieves developers of this burden through an automated, dual-tier memory management system:
1. **Tier 1: Reference Counting**: The primary, immediate, and deterministic garbage collector. The moment an object's reference count drops to zero, its memory is freed immediately.
2. **Tier 2: Generational Cyclic Garbage Collector (`gc`)**: A background collector that periodically runs graph-traversal algorithms to detect and reclaim unreachable **Circular Reference Cycles** (e.g. Object A referencing Object B, which references Object A).

Underpinning both tiers is **PyMalloc**, CPython's specialized, high-speed small-object memory allocator designed to eliminate memory fragmentation.

Understanding Python's memory lifecycle, reference counting, cyclic GC thresholds, and **Weak References (`weakref`)** is essential for debugging memory bloat, eliminating memory leaks in production services, and building high-throughput systems.

---

## Prerequisites

Before studying memory management, ensure you have:

- Completed [CPython Execution Pipeline](cpython-architecture.md) and [The Global Interpreter Lock](gil-global-interpreter-lock.md).
- Solid understanding of heap vs stack allocation and pointers.
- Familiarity with object-oriented programming.

---

## Core Concept: CPython's 4-Layer Memory Allocator & Dual-Tier GC

```
                          CPYTHON 4-LAYER MEMORY ALLOCATOR HIERARCHY

       Layer 3: Object-Specific Allocators (e.g. PyListObject, PyDictObject)
      ┌────────────────────────────────────────────────────────────────────────┐
      │ PyObject_New(), PyObject_Free()                                        │
      └───────────────────────────────────┬────────────────────────────────────┘
                                          │
       Layer 2: PyMalloc Small-Object Allocator (Objects <= 512 Bytes)
      ┌────────────────────────────────────────────────────────────────────────┐
      │ 256 KB Arenas ──► 4 KB Pools ──► Size-Class Blocks (8, 16, 24 ... 512B)│
      └───────────────────────────────────┬────────────────────────────────────┘
                                          │
       Layer 1: PyMem (Python Raw Memory Allocator)
      ┌────────────────────────────────────────────────────────────────────────┐
      │ PyMem_RawMalloc(), PyMem_RawFree()                                     │
      └───────────────────────────────────┬────────────────────────────────────┘
                                          │
       Layer 0: Operating System Raw Heap (C Standard Library)
      ┌────────────────────────────────────────────────────────────────────────┐
      │ malloc(), free(), mmap()                                               │
      └────────────────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Memory Diagnostics

```python
import sys
import gc
import weakref
import tracemalloc

# 1. Reference Counting Inspection
x = [1, 2, 3]
print("Reference Count of x:", sys.getrefcount(x) - 1) # Subtract 1 for getrefcount parameter!

# 2. Inspecting Generational GC Thresholds
# Returns: (threshold_gen0, threshold_gen1, threshold_gen2)
print("GC Generational Thresholds:", gc.get_threshold()) # (700, 10, 10)

# 3. Manual Garbage Collection of Circular References
unreachable_objects = gc.collect()
print(f"Manual GC Sweep Collected: {unreachable_objects} circular objects")

# 4. Weak References (Referencing without incrementing ob_refcnt!)
class HeavyAsset: pass
asset = HeavyAsset()
ref = weakref.ref(asset)
print("Weak Reference Value:", ref()) # <HeavyAsset object>
del asset
print("Weak Reference After Deletion:", ref()) # None (Garbage collected immediately!)

# 5. Line-by-Line Memory Profiling with tracemalloc
tracemalloc.start()
data_buffer = [bytearray(1024) for _ in range(1000)] # Allocates ~1 MB
current_mem, peak_mem = tracemalloc.get_traced_memory()
tracemalloc.stop()
print(f"Peak Memory Allocated: {peak_mem / 1024:.2f} KB")
```

---

## Detailed Explanation

### 1. Reference Counting: Mechanics & The `del` Statement

In CPython, every `PyObject` contains an internal `ob_refcnt` field.

- **Reference Increments (`Py_INCREF`)**:
  - Variable assignment: `y = x`
  - Passing as argument: `func(x)`
  - Storing in a container: `my_list.append(x)`
- **Reference Decrements (`Py_DECREF`)**:
  - Variable goes out of scope (function returns)
  - Variable reassigned: `x = 99`
  - Removed from container: `my_list.clear()`
  - Explicit deletion: `del x`

#### What Does `del x` Actually Do?
A common misconception is that `del x` destroys the object. In reality:
1. `del x` **removes the name `x` from the current namespace**.
2. It decrements the target object's `ob_refcnt` by 1.
3. **ONLY if `ob_refcnt == 0`** does CPython call the object's `tp_dealloc` destructor to free the memory.

---

### 2. The Circular Reference Problem

Reference counting has one fatal architectural flaw: **Circular References**.

```python
# Circular Reference Example:
class Node:
    def __init__(self):
        self.partner = None

node_a = Node()
node_b = Node()
node_a.partner = node_b # node_b ref count = 2
node_b.partner = node_a # node_a ref count = 2

del node_a # node_a ref count drops from 2 -> 1
del node_b # node_b ref count drops from 2 -> 1
# BOTH objects are now UNREACHABLE by the program,
# BUT their ref counts are still 1! Reference counting CANNOT free them! 🚨
```

---

### 3. The Tri-Generational Cyclic Garbage Collector

To solve the circular reference leak, CPython runs a secondary **Cyclic Garbage Collector** (`gc` module):
- Every tracked container object (`list`, `dict`, `set`, custom class instances) has an invisible **`PyGC_Head`** struct prepended to it in memory, linking all container objects into doubly-linked lists.
- **The 3 Generations**:
  - **Generation 0 (Young)**: Newly allocated container objects. Collected frequently.
  - **Generation 1 (Intermediate)**: Objects that survived a Generation 0 collection sweep.
  - **Generation 2 (Old)**: Long-lived objects (survived Gen 1 collections). Collected least frequently.
- **The Cycle Detection Algorithm**:
  1. The GC temporarily copies all reference counts (`gc_refs`).
  2. For every container object, it decrements the reference counts of all objects it points to.
  3. Any object whose `gc_refs` drops to zero is **only referenced from within the cycle** (unreachable from outside).
  4. The GC breaks the cycles and reclaims the memory.

---

### 4. PyMalloc: Arenas, Pools, and Blocks

Why doesn't CPython use standard OS `malloc()` for every small object?
Calling OS `malloc()` for millions of small 28-byte integers or strings causes massive system call overhead and severe **Heap Fragmentation**.

**PyMalloc Architecture (Objects $\le 512$ Bytes)**:
- **Arenas (256 KB)**: Allocated directly from the OS using `mmap()` or `malloc()`.
- **Pools (4 KB)**: Each Arena is divided into 64 Pools. Each pool is dedicated to a single **Size-Class** (e.g. Pool A allocates only 16-byte blocks; Pool B allocates only 32-byte blocks).
- **Blocks**: The actual memory chunks holding the `PyObject`.

#### Why Python Memory Doesn't Shrink in Activity Monitor:
When you delete 1,000,000 small objects, PyMalloc frees their blocks inside its internal 4KB Pools. However, **the 256 KB Arena cannot be returned to the OS unless ALL 64 of its Pools are 100% empty**. The memory remains cached inside the Python process for future allocations.

---

## Examples

### 1. Simple: Observing Reference Count Lifecycles
Tracking reference count changes as an object is shared across variables and containers.

```python
import sys

target = {"name": "Hesam"}
print("Initial References      :", sys.getrefcount(target) - 1) # 1

alias = target
print("After Alias Assignment  :", sys.getrefcount(target) - 1) # 2

container = [target, target]
print("After Appending to List :", sys.getrefcount(target) - 1) # 4 (alias + 2 list slots)

del alias
container.clear()
print("After Cleanup           :", sys.getrefcount(target) - 1) # 1
```

### 2. Beginner: Detecting and Cleaning Circular References with `gc`
Demonstrating how `gc.collect()` detects and reclaims circular references.

```python
import gc

class CyclicNode:
    def __init__(self, name: str):
        self.name = name
        self.cycle = None

# Disable automatic GC to observe manual collection
gc.disable()

# Create isolated circular graph
node_1 = CyclicNode("Node-1")
node_2 = CyclicNode("Node-2")
node_1.cycle = node_2
node_2.cycle = node_1

# Destroy global references (Objects still hold each other in RAM!)
del node_1
del node_2

print("Running manual GC sweep...")
collected_cycles = gc.collect()
print(f"✅ GC successfully identified and freed {collected_cycles} circular objects.")

gc.enable() # Re-enable automatic GC
```

### 3. Intermediate: Eliminating Circular Leaks with `weakref`
Using `weakref.ref` to build a bidirectional parent-child tree without circular reference leaks.

```python
import weakref
import sys

class Parent:
    def __init__(self, name: str):
        self.name = name
        self.children = []

    def add_child(self, child: Child):
        self.children.append(child)
        # Store weak reference to parent in child (Prevents cycle!)
        child.parent = weakref.ref(self)

class Child:
    def __init__(self, name: str):
        self.name = name
        self.parent = None  # Weak reference to Parent

parent_instance = Parent("ParentNode")
child_instance = Child("ChildNode")
parent_instance.add_child(child_instance)

# Access parent via weak reference
resolved_parent = child_instance.parent()
print(f"Child's resolved parent: {resolved_parent.name}")

# Delete parent -> Deallocated immediately without waiting for cyclic GC!
del parent_instance
print(f"Child's parent after deletion: {child_instance.parent()}") # None!
```

### 4. Real-World: Diagnosing Memory Leaks with `tracemalloc`
Tracing top memory-allocating lines in a simulated memory leak.

```python
import tracemalloc

def leaky_cache_simulation():
    # Simulates an unbounded global memory leak
    cache = []
    for i in range(10_000):
        cache.append({"user_id": f"USR-{i}", "payload": "x" * 500})
    return cache

# Start tracing memory allocations
tracemalloc.start()

# Execute target workload
leaked_data = leaky_cache_simulation()

# Take snapshot of memory allocations
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("lineno")

print("=" * 68)
print("TRACEMALLOC MEMORY ALLOCATION REPORT (TOP 3 LINES):")
print("=" * 68)
for rank, stat in enumerate(top_stats[:3], start=1):
    print(f"#{rank} {stat.traceback[0].filename}:{stat.traceback[0].lineno}")
    print(f"   Size: {stat.size / 1024:.2f} KB │ Count: {stat.count} allocations")

tracemalloc.stop()
```

### 5. Advanced: Inspecting Cyclic Containers with `gc.get_referents()`
Traversing object dependency graphs programmatically to diagnose retention trees.

```python
import gc

class ServiceRegistry:
    def __init__(self):
        self.endpoints = ["/auth", "/billing", "/reports"]
        self.config = {"timeout": 30}

registry = ServiceRegistry()

# Inspect all objects referenced directly by registry
referents = gc.get_referents(registry)

print("=" * 60)
print(f"Object Retention Graph for ServiceRegistry:")
print("=" * 60)
for ref in referents:
    print(f"  • Type: {type(ref).__name__:<12} │ Value: {repr(ref)[:40]}")
```

---

## Code Explanation

In Example 3 (`weakref Tree`):
1. In a naive bidirectional graph, `parent.children` holds strong references to `child`, and `child.parent` holds a strong reference to `parent`.
2. This creates a circular reference: deleting the parent variable does **not** free the parent from memory because the child still holds a reference to it.
3. By setting `child.parent = weakref.ref(self)`, the child references the parent **without incrementing the parent's `ob_refcnt`**.
4. When `del parent_instance` runs, the parent's reference count drops to 0 and it is **immediately deallocated from RAM in $O(1)$ constant time**.

---

## Common Mistakes

### Mistake 1: Relying on `__del__` for Critical Resource Cleanup
Writing cleanup logic (like closing database connections or flushing network buffers) inside `__del__()`.
In CPython:
- `__del__` is not guaranteed to be called immediately if circular references exist.
- If the Python interpreter is exiting, `__del__` methods might not be called at all!
- Always use **Context Managers (`with` statements)** for deterministic resource cleanup.

### Mistake 2: Unbounded Caches and Event Listener Retention
Storing objects inside global lists, dictionaries, or event listener registries without eviction policies. This keeps their reference count $> 0$ indefinitely, causing massive memory leaks in long-running services (FastAPI, Celery, Django).

---

## Best Practices

### Use `weakref.WeakValueDictionary` for In-Memory Caches
When building in-memory caches, use `WeakValueDictionary`. When no other active part of the application references the cached object, it is automatically removed from the cache and deallocated from RAM.

Good:
```python
import weakref
cache = weakref.WeakValueDictionary()
```

---

## Performance Considerations

| GC Mechanism | Trigger Condition | Execution Latency | Notes |
|---|---|---|---|
| **Reference Counting** | `ob_refcnt == 0` | **Deterministic ($< 1\mu\text{s}$)**| Immediate deallocation |
| **Generation 0 GC** | Allocations > 700 | Fast (~0.1 ms) | Small young-object scan |
| **Generation 1 GC** | Gen 0 sweeps > 10 | Moderate (~1 ms) | Intermediate scan |
| **Generation 2 GC** | Gen 1 sweeps > 10 | **Slow (10–100+ ms)** | **Full heap scan (Can cause latency spikes!)**|

In ultra-low-latency financial systems or batch ML loaders, engineers sometimes temporarily call `gc.disable()` during hot loops and run `gc.collect()` during idle periods.

---

## Security Considerations

1. **Memory Exhaustion Denial of Service (DoS)**: If user requests allocate large buffers without size limits, attackers can exhaust the server's RAM and trigger the Linux **OOM Killer** to terminate the service.
2. **Sensitive Secret Lingering in RAM**: Memory holding decrypted passwords or cryptographic keys remains in memory until overwritten or deallocated. Use `bytearray` and zero-fill (`b[:] = 0`) sensitive memory immediately after use.

---

## Real-World Usage

- **Instagram Backend Engineering**: Famous for disabling cyclic GC in Gunicorn pre-forked workers to maximize copy-on-write (COW) memory sharing across processes.
- **Game Engines & Low-Latency Servers**: Using `weakref` for entity-component systems and scene graphs.
- **Large-Scale Data Engineering**: Diagnosing pandas DataFrame memory bloat with `tracemalloc`.

---

## Comparison: Memory Management Models

| Language / Engine | Model | Latency | Deterministic? | Memory Overhead |
|---|---|---|---|---|
| **CPython** | **Reference Counting + Tri-Gen GC**| **Low (mostly instant)**| **Yes (except cycles)**| Moderate (`PyGC_Head` headers) |
| **Java (JVM)** | Tracing Mark-and-Sweep GC | High (Stop-the-world)| No | Low per-object headers |
| **Go** | Concurrent Tri-Color GC | Ultra-Low | No | Low |
| **C / C++** | Manual (`malloc`/`free`) | Zero GC latency | Yes | Lowest |
| **Rust** | Ownership / RAII (Compile Time)| Zero GC latency | Yes | Lowest |

---

## Advanced Concepts: The `PyGC_Head` Struct Header

In CPython, every object tracked by the cyclic garbage collector has a `PyGC_Head` header prepended before the `PyObject` in memory:

```c
/* Include/internal/pycore_gc.h */
typedef struct {
    uintptr_t _gc_next;
    uintptr_t _gc_prev;
} PyGC_Head;
```

This 16-byte header creates a doubly-linked ring of all active container objects in the generation, enabling the cycle-detection algorithm to traverse the object graph in $O(N)$ time.

---

## Exercises

### Exercise 1 — Beginner
Create an object, pass it to 3 different functions, and print its reference count with `sys.getrefcount()` at each stage to observe how reference counting increases and decreases.

### Exercise 2 — Intermediate
Build a circular reference between two instances of a `User` class. Use `gc.set_debug(gc.DEBUG_STATS)` and `gc.collect()` to observe the generational collector reclaiming the cycle.

### Exercise 3 — Advanced
Build a `WeakObserverRegistry` where subject instances notify observers using `weakref.ref`. Verify that deleting an observer instance automatically removes it from the subject's notification list.

---

## Mini Project: Enterprise Memory Leak Diagnostic & Object Graph Profiler

### Requirements
Build an operational memory leak detection engine named `memory_leak_diagnostics.py`. Profile memory allocations with `tracemalloc`, track cyclic container references with the `gc` module, detect circular graph retentions, and generate formatted memory health reports.

### Implementation Blueprint
```python
import sys
import gc
import tracemalloc
from dataclasses import dataclass
from typing import Any

# =====================================================================
# 1. MEMORY HEALTH REPORT MODEL
# =====================================================================

@dataclass
class MemoryDiagnosticReport:
    total_gc_objects: int
    gen0_count: int
    gen1_count: int
    gen2_count: int
    peak_ram_kb: float
    circular_leaks_found: int

# =====================================================================
# 2. DIAGNOSTIC PROFILING SUITE
# =====================================================================

class MemoryDiagnosticSuite:
    def __init__(self):
        self.snapshots = []

    def start_profiling(self):
        gc.collect()  # Clean baseline
        tracemalloc.start()

    def run_diagnostics(self) -> MemoryDiagnosticReport:
        current_mem, peak_mem = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        # Inspect GC Generational Population
        gen_counts = gc.get_count()
        total_tracked = len(gc.get_objects())

        # Collect circular references
        reclaimed_cycles = gc.collect()

        return MemoryDiagnosticReport(
            total_gc_objects=total_tracked,
            gen0_count=gen_counts[0],
            gen1_count=gen_counts[1],
            gen2_count=gen_counts[2],
            peak_ram_kb=round(peak_mem / 1024.0, 2),
            circular_leaks_found=reclaimed_cycles
        )

    @classmethod
    def render_report(cls, report: MemoryDiagnosticReport):
        border = "=" * 68
        print("\n" + border)
        print("          CPYTHON MEMORY & GARBAGE COLLECTION AUDIT")
        print(border)
        print(f"  • Total GC-Tracked Objects   : {report.total_gc_objects:>6,d}")
        print(f"  • Generation 0 Population     : {report.gen0_count:>6,d}")
        print(f"  • Generation 1 Population     : {report.gen1_count:>6,d}")
        print(f"  • Generation 2 Population     : {report.gen2_count:>6,d}")
        print(f"  • Peak Allocated Heap Memory  : {report.peak_ram_kb:>9,.2f} KB")
        print(f"  • Circular Leaks Reclaimed    : {report.circular_leaks_found:>6,d}")
        print("-" * 68)

        if report.circular_leaks_found > 0:
            print("  ⚠️ ADVISORY: Circular reference cycles detected and purged by GC.")
        else:
            print("  ✅ ADVISORY: Clean memory profile with zero uncollected cycles.")
        print(border)

# =====================================================================
# 3. VERIFICATION & RUNTIME ANALYSIS
# =====================================================================

class LeakyGraphNode:
    def __init__(self, node_id: int):
        self.node_id = node_id
        self.partner = None

def simulate_workload():
    # Generate 5,000 circular reference pairs
    for i in range(5000):
        n1 = LeakyGraphNode(i)
        n2 = LeakyGraphNode(i)
        n1.partner = n2
        n2.partner = n1

if __name__ == "__main__":
    suite = MemoryDiagnosticSuite()
    suite.start_profiling()
    
    # Run workload that generates circular references
    simulate_workload()
    
    report = suite.run_diagnostics()
    MemoryDiagnosticSuite.render_report(report)
```

---

## Summary

In this lesson, you mastered CPython's memory management and garbage collection architecture:
- **Reference Counting** provides immediate, deterministic object deallocation when `ob_refcnt == 0`.
- The **`del` statement** removes names from namespaces and decrements reference counts; it does not destroy memory directly.
- The **Tri-Generational Cyclic Garbage Collector (`gc`)** detects and purges circular reference cycles across Generations 0, 1, and 2.
- **PyMalloc** allocates small objects ($\le 512$ bytes) into **Arenas (256 KB)**, **Pools (4 KB)**, and **Size-Class Blocks** to eliminate fragmentation.
- Use **Weak References (`weakref`)** in parent-child trees, observers, and caches to prevent circular reference memory leaks.
- Use **`tracemalloc`** for line-by-line memory allocation profiling in production services.

---

## Best Practices Checklist

- [ ] Always use Context Managers (`with`) instead of `__del__` for resource cleanup.
- [ ] Use `weakref.WeakValueDictionary` for in-memory caches.
- [ ] Use `tracemalloc` to diagnose memory leaks and allocation hotspots.
- [ ] Avoid circular references in high-throughput data models.
- [ ] Tune GC thresholds (`gc.set_threshold`) for memory-intensive batch applications.

---

## 🏆 MODULE 1: CPYTHON INTERNALS & MEMORY ARCHITECTURE COMPLETE!

Congratulations! You have completed all 4 comprehensive articles of **Module 1: CPython Internals & Memory Architecture**.

### What's Next?
Now advance to **Module 2: Advanced Metaprogramming**:
👉 **[Advanced Metaprogramming Module Overview](../metaprogramming/README.md)** to master Descriptors (`__get__`/`__set__`), Custom Metaclasses, and PEP 487 `__init_subclass__` class factories!
