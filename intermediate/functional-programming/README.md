# 🧩 Module 4: Functional Programming in Depth

Welcome to the **Functional Programming** module in Level 2.

Python is a multi-paradigm programming language. While it is predominantly object-oriented, Python provides rich native support for **Functional Programming (FP)**. Functional programming emphasizes **Pure Functions** (functions with no side-effects that always return the same output for the same input), **Immutability**, and **Function Composition** through higher-order functions.

---

## 🎯 Module Overview

In this module, you will master:
- The classic higher-order functional trinity: **`map()`**, **`filter()`**, and **`functools.reduce()`**.
- Performance and readability trade-offs between functional primitives and Pythonic list/generator comprehensions.
- The standard library **`operator`** module (`itemgetter`, `attrgetter`, `methodcaller`) for high-speed C-level attribute extraction.
- Advanced **`functools`** tools: `partial` application, single-dispatch generic polymorphism (`@singledispatch`), and function composition pipelines.

---

## 📑 Articles in this Module

1. **[Map, Filter & Reduce](map-filter-reduce.md)**
   - Higher-order functions, transforming streams with `map()`, conditional extraction with `filter()`, cumulative aggregation with `functools.reduce()`, lambda integration, and comparisons against comprehensions.
2. **[Functools & Operator Modules](functools-itertools-operator.md)**
   - High-speed item extraction with `operator.itemgetter` and `attrgetter`, method invocation with `methodcaller`, partial evaluation with `functools.partial`, and single-dispatch function polymorphism with `@functools.singledispatch`.

---

## 🗺️ Progression Path

```
map-filter-reduce.md ──► functools-itertools-operator.md ──► [Next Module: Type Hints & Static Analysis](../typing/README.md)
```
