# 📚 Module 6: Built-in Collections

Welcome to the **Built-in Collections** module. Data structures are the core containers that organize, store, and manage computational data in memory.

---

## 🎯 Module Overview

Python provides four foundational, highly optimized built-in data structures: **Lists**, **Tuples**, **Dictionaries**, and **Sets**. Choosing the correct data structure is the single most important architectural decision an engineer makes when designing algorithms. This module explores the memory layouts, time complexities, internal hash table mechanics, mutability characteristics, and standard utility functions across all Python collection types.

---

## 📑 Articles in this Module

1. **[Lists in Depth](lists.md)**
   - Dynamic arrays, memory over-allocation and growth patterns (`PyListObject`), indexing, slicing, mutation methods (`append`, `extend`, `insert`, `pop`, `remove`, `sort`), and $O(1)$ vs $O(N)$ operations.
2. **[Tuples & Named Tuples](tuples.md)**
   - Immutable sequences, memory optimization, tuple packing and unpacking, swap idioms, hashability for dictionary keys, and `collections.namedtuple`.
3. **[Dictionaries & Hash Tables](dictionaries.md)**
   - Hash tables, key-value mappings, insertion order preservation (Python 3.7+ compact dict layout), hash collisions, dictionary views (`keys()`, `values()`, `items()`), `.get()`, `.setdefault()`, and dictionary merging.
4. **[Sets & Frozensets](sets.md)**
   - Hash sets, mathematical set theory operations (Union `|`, Intersection `&`, Difference `-`, Symmetric Difference `^`, Subsets/Supersets), deduplication, and immutable `frozenset`.
5. **[Built-in Collection Helpers](built-in-collection-functions.md)**
   - Essential built-in functional utilities: `enumerate()`, `zip()`, `reversed()`, `sorted()`, `min()`, `max()`, `sum()`, `any()`, `all()`, and the `key=` parameter.

---

## 🗺️ Progression Path

```
lists.md ──► tuples.md ──► dictionaries.md ──► sets.md ──► built-in-collection-functions.md
                                                                       │
                                                                       ▼
                                                    [Next Module: Functions & Scope](../functions/README.md)
```
