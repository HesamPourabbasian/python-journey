# 🧱 Module 6: Advanced Data Structures in Depth

Welcome to the **Advanced Data Structures** module in Level 2.

While standard Python built-ins (`list`, `dict`, `set`, `tuple`) are sufficient for basic scripts, high-throughput systems, low-latency search engines, and real-time scheduling algorithms demand specialized, high-performance data structures.

Python's standard library provides world-class C-accelerated modules designed specifically for advanced data structures:
- **`collections`**: High-performance container datatypes (`deque`, `defaultdict`, `Counter`, `OrderedDict`, `namedtuple`, `ChainMap`).
- **`heapq`**: Binary Heap algorithms providing $O(\log N)$ Priority Queues and Top-$K$ element extraction.
- **`bisect`**: Fast logarithmic $O(\log N)$ Binary Search and sorted array insertion algorithms.

---

## 🎯 Module Overview

In this module, you will master:
- The standard library **`collections`** toolkit:
  - **`deque`**: Double-ended queues with $O(1)$ push/pop at both ends (vs $O(N)$ list pops).
  - **`defaultdict`**: Eliminating `KeyError` with automated default factories.
  - **`Counter`**: High-performance multi-set frequency counting and multiset arithmetic (`+`, `-`, `&`, `|`).
  - **`OrderedDict`**: LRU cache building with `move_to_end()` and `popitem()`.
  - **`ChainMap`**: Layered configuration and namespace lookups across multiple dictionaries.
- **`heapq` & Binary Min-Heaps**: Heap invariant maintenance, priority queue architectures, `heappush`, `heappop`, `heapify`, `nlargest`, and `nsmallest`.
- **`bisect` & Binary Search**: `bisect_left`, `bisect_right`, `insort`, finding insertion points in sorted collections in $O(\log N)$ time, and building numeric range / tier lookup tables.

---

## 📑 Articles in this Module

1. **[The `collections` Module in Depth](collections-module.md)**
   - `deque`, `defaultdict`, `Counter`, `OrderedDict`, `namedtuple`, `ChainMap`, underlying C implementation details, and algorithmic time complexity comparisons.
2. **[Heapq & Priority Queues](heapq-and-priority-queues.md)**
   - Binary min-heaps, heap invariants, priority queue task scheduling, tie-breaking strategies, `heapify` ($O(N)$ creation), and top-$K$ queries (`nlargest`, `nsmallest`).
3. **[The `bisect` Module & Binary Search](bisect-module.md)**
   - Binary search algorithms ($O(\log N)$), `bisect_left` vs `bisect_right`, `insort`, building score / tax tier lookup tables, and maintaining sorted arrays dynamically.

---

## 🗺️ Progression Path

```
collections-module.md ──► heapq-and-priority-queues.md ──► bisect-module.md ──► [Next Module: Databases & ORM](../databases/README.md)
```
