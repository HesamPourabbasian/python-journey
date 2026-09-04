# 📦 Module 2: Variables & Data Types

Welcome to the **Variables & Data Types** module. In Python, data is the core substance of every algorithm, and variables are the references through which we manipulate that data in memory.

---

## 🎯 Module Overview

Unlike languages where variables act as fixed memory "boxes" typed at compile time, Python uses a dynamic object-reference model. In Python, **everything is an object**, and variables are merely symbolic name tags bound to objects residing on the heap. This module dissects how memory allocation, dynamic typing, primitive scalar types, type casting, and object mutability operate.

---

## 📑 Articles in this Module

1. **[Variables & Name Binding](variables.md)**
   - Memory referencing model, identity (`id()`), naming conventions (PEP 8), keywords, garbage collection and reference counting.
2. **[Dynamic Typing vs Static Typing](dynamic-typing.md)**
   - Dynamic vs static analysis, strong vs weak type systems, runtime type checking, `type()` and `isinstance()`.
3. **[Integers & Floats](integers-floats.md)**
   - Arbitrary-precision integers (`int`), IEEE 754 floating-point arithmetic (`float`), decimal precision with `decimal`, complex numbers, and `math`.
4. **[Strings Fundamentals](strings.md)**
   - Unicode architecture, string literals, escape characters, raw strings (`r""`), immutability, and encoding.
5. **[Booleans & The NoneType](booleans-none.md)**
   - `bool` as a subclass of `int`, truth value testing (truthiness), the `None` singleton, and identity testing (`is` vs `==`).
6. **[Type Casting & Conversion](type-casting.md)**
   - Implicit type coercion vs explicit casting (`int()`, `float()`, `str()`, `bool()`), safe conversion patterns, and parsing errors.
7. **[Mutable vs Immutable Objects](mutable-vs-immutable.md)**
   - Deep dive into object identity, shallow vs deep copying (`copy` module), mutable default arguments trap, and memory layout.

---

## 🗺️ Progression Path

```
variables.md ──► dynamic-typing.md ──► integers-floats.md ──► strings.md ──► booleans-none.md ──► type-casting.md ──► mutable-vs-immutable.md
                                                                                                                              │
                                                                                                                              ▼
                                                                                                    [Next Module: Operators & Expressions](../operators/README.md)
```
