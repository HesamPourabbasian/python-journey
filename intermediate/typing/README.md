# 🏷️ Module 5: Type Hints & Static Analysis in Depth

Welcome to the **Type Hints & Static Analysis** module in Level 2.

Historically, Python was renowned strictly for its dynamic typing: variables could hold any type at runtime without compiler checks. While dynamic typing enables rapid prototyping, large-scale enterprise codebases (millions of lines of code with hundreds of engineers) suffer from subtle type errors, refactoring bugs, and unclear API contracts.

Beginning with **PEP 484** in Python 3.5 and expanding through modern **PEP 585, PEP 604, PEP 612, and PEP 647**, Python introduced a modern, gradual static typing system.

Type hints in Python do not alter runtime execution speed or behavior; instead, they power **Static Analysis Tools (like `mypy` and Pyright)** and IDE intelligence, catching bugs before code is ever executed in production.

---

## 🎯 Module Overview

In this module, you will master:
- Modern Python 3.10+ type syntax (`int | str`, `list[int]`, `dict[str, Any]`, `Literal`, `Optional`, `TypedDict`).
- **Generics & `TypeVar`**: Writing type-safe generic data structures and functions with bounded constraints and variance (Covariant `covariant=True`, Contravariant).
- **Structural Typing with `typing.Protocol`**: Static duck typing (compile-time interface checking without inheritance) and `@runtime_checkable`.
- Advanced Type System Features: **`TypeGuard`** (PEP 647) for narrowing types in conditionals and **`ParamSpec` / `Concatenate`** (PEP 612) for perfectly preserving decorator function signatures.
- **Static Analysis with `mypy`**: Configuring `mypy.ini` / `pyproject.toml`, strict mode flags, understanding error codes, and CI/CD automated linting integration.

---

## 📑 Articles in this Module

1. **[Type Hints & Modern Syntax](type-hints-basics.md)**
   - PEP 484 to PEP 604 syntax (`|` union operator), built-in collection generics (`list[str]`, `dict[str, int]`), `Optional`, `Union`, `Any`, `Never`, `Literal`, `Final`, and `TypedDict`.
2. **[Generics & TypeVar](generics-and-typevar.md)**
   - `TypeVar`, bounded generics (`TypeVar('T', bound=Base)`), generic classes (`Generic[T]`), generic methods, generic type aliases, covariance, and contravariance.
3. **[Structural Subtyping with Protocol](typing-protocols-and-duck-typing.md)**
   - `typing.Protocol`, static duck typing vs nominal inheritance (ABCs), `@runtime_checkable`, recursive protocols, and building decoupled library interfaces.
4. **[TypeGuard, ParamSpec & Advanced Typing](typeguard-and-paramspec.md)**
   - Type narrowing with `TypeGuard` (PEP 647), decorator type preservation with `ParamSpec` and `Concatenate` (PEP 612), `Self` type (PEP 673), and `Annotated` metadata.
5. **[Static Analysis & Mypy in CI/CD](mypy-static-analysis.md)**
   - Installing and configuring `mypy`, `--strict` configuration in `pyproject.toml`, handling untyped third-party libraries (`types-*` stubs), type-ignoring rules (`# type: ignore[code]`), and CI/CD quality gates.

---

## 🗺️ Progression Path

```
type-hints-basics.md ──► generics-and-typevar.md ──► typing-protocols-and-duck-typing.md ──► typeguard-and-paramspec.md ──► mypy-static-analysis.md
                                                                                                                                   │
                                                                                                                                   ▼
                                                                                   [Next Module: Advanced Data Structures](../advanced-data-structures/README.md)
```
