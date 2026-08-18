# 🧬 Module 2: Advanced Metaprogramming in Depth

Welcome to the **Advanced Metaprogramming** module in Level 3.

Metaprogramming is the art of writing code that inspects, modifies, generates, or alters the behavior of other code at runtime. In Python, "code is data" and classes are first-class runtime objects.

Metaprogramming forms the underlying magic behind Python's most sophisticated enterprise frameworks:
- **SQLAlchemy & Django ORM**: Mapping class attributes to relational database columns and enforcing constraints.
- **Pydantic & FastAPI**: Parsing type annotations and generating runtime validation schemas.
- **Pytest & Mypy**: Introspecting class structures and enforcing structural contracts.

---

## 🎯 Module Overview

In this module, you will master:
- **Python Descriptors**: The foundation of Python's attribute lookup protocol (`__get__`, `__set__`, `__delete__`, `__set_name__`), Data vs Non-Data descriptors, and how `@property`, `@classmethod`, `@staticmethod`, and methods actually work under the hood.
- **Metaclasses & Class Factories**: The `type` metaclass, class construction lifecycle (`__new__` vs `__init__`), intercepting class creation, registering plugins, and building custom DSLs.
- **Modern Metaprogramming with `__init_subclass__` (PEP 487)**: Lightweight, cleaner, and composable subclass hooks that eliminate the need for complex metaclasses in modern Python 3.6+.

---

## 📑 Articles in this Module

1. **[Descriptors & Attribute Lookup Protocol](descriptors.md)**
   - The descriptor protocol, Data vs Non-Data descriptors, `__set_name__` (PEP 487), method binding mechanics, attribute lookup precedence order, and building typed field validators.
2. **[Metaclasses & Dynamic Class Factories](metaclasses.md)**
   - The `type` metaclass, `__prepare__` namespace customization, `__new__` vs `__init__`, class registries, enforcing design constraints, and singleton/schema factories.
3. **[Modern Metaprogramming with `__init_subclass__`](init-subclass-and-class-creation.md)**
   - PEP 487 subclass hooks, keyword arguments in class definitions, lightweight validation, registering subclasses, and comparing Metaclasses vs `__init_subclass__` vs Class Decorators.

---

## 🗺️ Progression Path

```
descriptors.md ──► metaclasses.md ──► init-subclass-and-class-creation.md
                                                │
                                                ▼
                   [Next Module: Concurrency & Parallelism](../concurrency/README.md)
```
