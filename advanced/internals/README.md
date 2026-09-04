# ⚙️ Module 1: CPython Internals & Memory Architecture

Welcome to the **CPython Internals & Memory Architecture** module in Level 3.

To write high-performance, memory-efficient, and deadlock-free Python applications, senior software engineers must understand what happens under the hood when Python executes source code.

This module deconstructs **CPython** (the standard C implementation of Python), walking through the 5-stage compilation pipeline, stack machine bytecode execution, the mechanics and evolution of the **Global Interpreter Lock (GIL)**, and low-level **Memory Management and Garbage Collection**.

---

## 🎯 Module Overview

In this module, you will master:
- The **5-Stage CPython Execution Pipeline**: Tokenizer $\rightarrow$ Parser (PEG) $\rightarrow$ Abstract Syntax Tree (AST) $\rightarrow$ Symbol Table $\rightarrow$ Compiler $\rightarrow$ Code Object $\rightarrow$ CEval Loop.
- **Python Bytecode & The `dis` Module**: Examining opcodes (`LOAD_FAST`, `BINARY_OP`, `CALL`), stack frame mechanics (`PyFrameObject`), and peephole bytecode optimizations.
- The **Global Interpreter Lock (GIL)**: GIL mechanics, mutual exclusion, thread switching intervals, CPU-bound vs I/O-bound bottlenecks, and the revolutionary **Free-Threaded (No-GIL) Python 3.13 (PEP 703)** architecture.
- **Memory Management & Garbage Collection**: CPython's 4-layer memory hierarchy (PyMalloc, Arenas, Pools, Blocks), Reference Counting (`PyObject.ob_refcnt`), cyclic references, and the tri-generational Garbage Collector (`gc` module, Generations 0, 1, 2).

---

## 📑 Articles in this Module

1. **[CPython Execution Pipeline & Architecture](cpython-architecture.md)**
   - The CPython architecture, `PyObject` C-struct anatomy, the PEG parser, AST generation, symbol tables, code objects (`PyCodeObject`), and the `_PyEval_EvalFrameDefault` evaluation loop.
2. **[Python Bytecode & The `dis` Module](bytecode-and-dis-module.md)**
   - Bytecode instruction formats, stack evaluation machine, disassembling functions with `dis.dis()`, code object attributes (`co_code`, `co_consts`, `co_varnames`), and CPython 3.11+ Specialized Adaptive Interpreter (PEP 659).
3. **[The Global Interpreter Lock (GIL) in Depth](gil-global-interpreter-lock.md)**
   - GIL mutex internals, thread contention, I/O release semantics, CPU-bound performance degradation, and Python 3.13 free-threaded no-GIL builds (PEP 703).
4. **[Memory Management & Garbage Collection](memory-management-and-gc.md)**
   - Reference counting mechanics, circular reference detection, the generational garbage collector (`gc.collect()`), PyMalloc small-object memory allocator, and memory leak diagnosis with `tracemalloc` & `objgraph`.

---

## 🗺️ Progression Path

```
cpython-architecture.md ──► bytecode-and-dis-module.md ──► gil-global-interpreter-lock.md ──► memory-management-and-gc.md
                                                                                                      │
                                                                                                      ▼
                                                             [Next Module: Advanced Metaprogramming](../metaprogramming/README.md)
```
