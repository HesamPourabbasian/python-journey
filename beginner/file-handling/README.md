# 📁 Module 10: File Handling & Pathlib

Welcome to the **File Handling & Pathlib** module. Persistent storage is how computer programs retain state, ingest external datasets, export analytical reports, and communicate across system boundaries.

---

## 🎯 Module Overview

File handling in Python spans several levels of abstraction: from raw operating system file descriptors and low-level byte buffers, to resource-safe Context Managers (`with` statement), to structured format serialization (`CSV`, `JSON`), and modern object-oriented filesystem manipulation with the **`pathlib`** standard library module.

---

## 📑 Articles in this Module

1. **[Reading & Writing Files](reading-writing-files.md)**
   - The `open()` built-in function, file access modes (`r`, `w`, `a`, `x`, `b`, `+`), text vs binary modes, character encoding (`utf-8`), buffering strategies, and file pointer manipulation with `.seek()` and `.tell()`.
2. **[Context Managers & The `with` Statement](context-managers-with-statement.md)**
   - Deterministic resource cleanup, the Context Management Protocol (`__enter__` and `__exit__`), handling exceptions in context managers, and writing custom context managers with `@contextlib.contextmanager`.
3. **[Working with CSV & JSON Data](working-with-csv-json.md)**
   - Structured tabular data with the `csv` module (`reader`, `writer`, `DictReader`, `DictWriter`), and structured hierarchical document interchange with the `json` module (`dump`, `load`, `dumps`, `loads`, and custom schema encoders).
4. **[Modern Filesystem Operations with `pathlib`](pathlib-module.md)**
   - The object-oriented filesystem standard (PEP 428), `Path` objects, path arithmetic with the `/` operator, cross-platform compatibility (Windows vs POSIX), directory traversal (`glob`, `rglob`), and metadata inspection.

---

## 🗺️ Progression Path

```
reading-writing-files.md ──► context-managers-with-statement.md ──► working-with-csv-json.md ──► pathlib-module.md
                                                                                                         │
                                                                                                         ▼
                                                                             [Next Module: Exception Handling](../exceptions/README.md)
```
