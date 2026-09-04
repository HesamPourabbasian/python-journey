# 🔄 Module 2: Iterators & Generators in Depth

Welcome to the **Iterators & Generators** module in Level 2.

In modern computing, data volumes frequently exceed available physical runtime memory. Loading a 50 GB log file or querying a 10-million-row database table into a Python list will instantly cause an Out-Of-Memory (OOM) operating system crash.

To process infinite data streams and massive datasets with high performance, Python is fundamentally built on the **Lazy Evaluation Model** through **Iterators and Generators**.

---

## 🎯 Module Overview

In this module, you will master:
- The **Python Iteration Protocol**: `__iter__()`, `__next__()`, and `StopIteration`.
- Writing custom, stateful iterable sequence classes.
- **Generator Functions & The `yield` Statement**: Pausing and resuming execution frames on the CPython call stack with constant $O(1)$ memory.
- Two-way coroutine communication via generator methods: `.send()`, `.throw()`, and `.close()`.
- Sub-generator delegation with **`yield from`**.
- **Generator Expressions**: Memory-efficient generator syntax vs list comprehensions.
- The standard library **`itertools`** power-toolkit: infinite iterators (`count`, `cycle`, `repeat`), terminating filters (`islice`, `takewhile`, `dropwhile`, `groupby`, `accumulate`), and combinatorics (`product`, `permutations`, `combinations`).

---

## 📑 Articles in this Module

1. **[The Iterator Protocol](iterator-protocol.md)**
   - Iterables vs Iterators, `iter()`, `next()`, `__iter__()`, `__next__()`, `StopIteration`, custom sequence iterators, and the sentinel `iter(callable, sentinel)` pattern.
2. **[Generator Functions & The `yield` Statement](generator-functions-and-yield.md)**
   - Generator functions, stack frame suspension (`PyGenObject`), lazy streams, two-way communication with `.send()`, `.throw()`, `.close()`, and sub-generator chaining via `yield from`.
3. **[Generator Expressions & Memory Profiling](generator-expressions.md)**
   - Generator expression syntax `(...)`, generator chaining pipelines, memory footprint benchmarking with `tracemalloc`, and lazy data transforms.
4. **[The `itertools` Module in Depth](itertools-module.md)**
   - Infinite streams (`count`, `cycle`, `repeat`), combinatorial generators (`product`, `permutations`, `combinations`), grouping with `groupby()`, `islice()`, `accumulate()`, and high-performance streaming pipelines.

---

## 🗺️ Progression Path

```
iterator-protocol.md ──► generator-functions-and-yield.md ──► generator-expressions.md ──► itertools-module.md
                                                                                                    │
                                                                                                    ▼
                                                                [Next Module: Closures & Decorators](../decorators/README.md)
```
