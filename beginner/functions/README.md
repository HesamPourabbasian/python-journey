# 🧩 Module 7: Functions & Scope

Welcome to the **Functions & Scope** module. Functions are the primary building blocks of modular, maintainable, and testable software applications.

---

## 🎯 Module Overview

In Python, functions are **First-Class Citizens**—they can be passed as arguments, assigned to variables, returned from other functions, and stored in data structures. This module covers the full spectrum of function architecture: function definition mechanics, the CPython execution frame call stack, advanced parameter handling (`*args`, `**kwargs`, keyword-only arguments `/` and `*`), the **LEGB Variable Scope Hierarchy**, lambda functions, and professional PEP 257 docstring standards.

---

## 📑 Articles in this Module

1. **[Defining Functions & Execution Model](defining-functions.md)**
   - Function definitions (`def`), the `return` statement, implicit `None`, the call stack, execution frames (`PyFrameObject`), pure functions vs side-effects, and first-class functions.
2. **[Parameters & Arguments](parameters-and-arguments.md)**
   - Positional vs keyword arguments, default parameters, the mutable default argument trap, variable-length arguments (`*args`, `**kwargs`), positional-only parameters (`/`, PEP 570), and keyword-only parameters (`*`).
3. **[Variable Scope & The LEGB Rule](scope-and-lifetime.md)**
   - Namespaces, the **LEGB** lookup hierarchy (Local, Enclosing, Global, Built-in), the `global` keyword, the `nonlocal` keyword, closures, and variable lifetimes.
4. **[Lambda Functions](lambda-functions.md)**
   - Anonymous single-expression functions (`lambda x: ...`), functional contexts (`map`, `filter`, `sorted`), syntactic limitations, and readability trade-offs.
5. **[Docstrings & Type Annotations](docstrings-and-annotations.md)**
   - PEP 257 docstring conventions, Google, Sphinx, and NumPy docstring styles, function annotations (`__annotations__`), and type hints.

---

## 🗺️ Progression Path

```
defining-functions.md ──► parameters-and-arguments.md ──► scope-and-lifetime.md ──► lambda-functions.md ──► docstrings-and-annotations.md
                                                                                                                   │
                                                                                                                   ▼
                                                                                                [Next Module: Comprehensions](../comprehensions/README.md)
```
