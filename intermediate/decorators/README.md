# 🎭 Module 3: Closures & Decorators in Depth

Welcome to the **Closures & Decorators** module in Level 2.

In Python, functions are **First-Class Objects**: they can be passed as arguments, returned from other functions, assigned to variables, and stored in data structures. This foundational design allows Python to support powerful metaprogramming abstractions through **Closures** and **Decorators**.

Decorators are the syntactic mechanism that powers modern Python frameworks—from routing in Flask and FastAPI (`@app.get("/users")`) to ORM models in Django, caching in `functools.lru_cache`, and access control in authentication middleware.

---

## 🎯 Module Overview

In this module, you will master:
- First-class function mechanics, lexical closures, free variables, and the `__closure__` cell object architecture.
- Syntactic sugar of decorators (`@decorator`) and the wrapper execution model.
- Preserving function introspection metadata (`__name__`, `__doc__`, annotations) using **`@functools.wraps`**.
- Parameterized decorators with arguments (the 3-level nested closure pattern).
- Caching and memoization using **`@functools.lru_cache`** and custom caching decorators.
- Class Decorators (decorating class definitions) and Classes as Decorators (implementing `__call__`).

---

## 📑 Articles in this Module

1. **[Closures & First-Class Functions](first-class-functions-closures.md)**
   - First-class functions, inner functions, lexical scoping, free variables, `PyCellObject`, inspection via `__closure__` and `__code__.co_freevars`, and closure factories.
2. **[Function Decorators & Wrapper Architecture](function-decorators.md)**
   - The `@` decorator syntax, wrapping function calls, `*args` and `**kwargs` forwarding, preserving metadata with `@functools.wraps`, timing, logging, and retry decorators.
3. **[Decorators with Arguments & `functools`](decorator-arguments-and-functools.md)**
   - Parameterizing decorators (3-tier nested closures), stacking multiple decorators (execution order), and high-performance memoization with `@functools.lru_cache` and `@functools.cache`.
4. **[Class Decorators & Decorating Classes](class-decorators.md)**
   - Using callable classes as decorators via `__call__`, writing class decorators to inspect and mutate class definitions, registration patterns, and method vs function decoration nuances.

---

## 🗺️ Progression Path

```
first-class-functions-closures.md ──► function-decorators.md ──► decorator-arguments-and-functools.md ──► class-decorators.md
                                                                                                                   │
                                                                                                                   ▼
                                                                               [Next Module: Functional Programming](../functional-programming/README.md)
```
