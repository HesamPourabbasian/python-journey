# Context Managers & The `with` Statement in Python

## Introduction

In computer systems, applications constantly acquire and release finite operating system resources—including file descriptors, network sockets, database connections, thread synchronization locks, and temporary directory handles. If a program acquires a resource and crashes before releasing it, that resource remains locked in operating system memory. Over time, these **Resource Leaks** lead to file lock contention, database connection pool exhaustion, memory bloat, and server outages.

Historically, languages relied on manual `try...finally` blocks to guarantee resource cleanup. However, manual `finally` blocks are verbose and prone to developer oversight.

Introduced in **PEP 343**, Python provides a clean, declarative solution: **Context Managers and the `with` Statement**.

Context managers encapsulate the entire setup and teardown lifecycle of a resource. By implementing Python's **Context Management Protocol (`__enter__` and `__exit__`)**, a context manager guarantees that cleanup logic executes **deterministically**, regardless of whether the enclosed code block finishes successfully, returns early, or raises an unhandled exception.

This lesson explores the inner mechanics of the `with` statement, exception handling and suppression in `__exit__`, writing class-based context managers, building generator-based context managers using `@contextlib.contextmanager`, and managing multi-resource pipelines.

---

## Prerequisites

Before studying context managers, ensure you have:

- Completed [Reading & Writing Files](reading-writing-files.md).
- Completed [Defining Functions](../functions/defining-functions.md).
- A basic understanding of Python exception handling (`try`, `except`, `finally`).

---

## Core Concept: The Context Management Protocol

A Context Manager is any Python object that implements two special dunder methods:
1. **`__enter__()`**: Prepares the resource, executes setup logic, and returns the target object bound to the `as` variable.
2. **`__exit__(exc_type, exc_val, exc_tb)`**: Executes cleanup logic after the `with` block finishes, receiving any active exception metadata.

```
                           THE 'with' STATEMENT EXECUTION LIFECYCLE

      1. EVALUATE CONTEXT EXPRESSION
         mgr = ContextExpression()
                     │
                     ▼
      2. CALL __enter__()
         target = mgr.__enter__()
         Bind to 'as target' (if present)
                     │
                     ▼
      3. EXECUTE NESTED BLOCK
         [ Code inside with block runs ]
                     │
         ┌───────────┴───────────┐
         ▼ (No Exception)        ▼ (Exception Raised)
      [ Normal Finish ]       [ Error Occurs ]
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
      4. CALL __exit__(exc_type, exc_val, exc_tb)
         Execute cleanup / teardown logic!
                     │
         ┌───────────┴───────────┐
         ▼ (__exit__ returns True)▼ (__exit__ returns False/None)
      [ Exception Suppressed ]  [ Exception Propagated Upward ]
```

---

## Syntax & Essential Context Manager Forms

```python
# 1. Standard Built-in File Context Manager
with open("system.log", "w", encoding="utf-8") as f:
    f.write("System online.\n")
# File is GUARANTEED closed here, even if write raised an error!

# 2. Multi-Resource Context Manager (Python 3.10+ Parenthesized Syntax)
with (
    open("source.txt", "r", encoding="utf-8") as src,
    open("backup.txt", "w", encoding="utf-8") as dst
):
    dst.write(src.read())

# 3. Class-Based Custom Context Manager
class PerformanceTimer:
    import time
    def __enter__(self):
        self.start = self.time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = self.time.perf_counter() - self.start
        print(f"⏱️ Code block executed in {elapsed:.6f}s")
        return False  # Do not suppress exceptions

with PerformanceTimer():
    total = sum(x ** 2 for x in range(1_000_000))

# 4. Generator-Based Context Manager (@contextlib.contextmanager)
from contextlib import contextmanager

@contextmanager
def temporary_flag(obj: dict, key: str, temp_value: any):
    old_value = obj.get(key)
    obj[key] = temp_value  # Setup
    try:
        yield obj          # Yield control to the with block
    finally:
        obj[key] = old_value  # Teardown (Guaranteed!)
```

---

## Detailed Explanation

### 1. The Anatomy of `__exit__(exc_type, exc_val, exc_tb)`

When the code block inside a `with` statement exits, Python invokes `__exit__()` passing three arguments:
- **`exc_type`**: The exception class (e.g., `<class 'ValueError'>`), or `None` if no exception occurred.
- **`exc_val`**: The exception instance (e.g., `ValueError("invalid payload")`), or `None`.
- **`exc_tb`**: The traceback object, or `None`.

#### Exception Suppression Rules:
- If `__exit__()` returns **`True`**, Python **suppresses the exception**, swallowing the error and continuing normal execution after the `with` block.
- If `__exit__()` returns **`False`** (or `None`), Python **propagates the exception** up the call stack.

```python
class SuppressValueError:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None and issubclass(exc_type, ValueError):
            print(f"🛡️ [SUPPRESSED] Handled ValueError: {exc_val}")
            return True  # Suppress the exception!
        return False     # Propagate other exceptions (e.g., TypeError, KeyError)

# This will NOT crash the script!
with SuppressValueError():
    raise ValueError("Something went wrong with the input data!")

print("Program continues executing normally.")
```

---

### 2. Generator-Based Context Managers (`@contextlib.contextmanager`)

Writing a full class with `__enter__` and `__exit__` can feel verbose for simple setup/teardown tasks. Python's standard library provides the **`@contextlib.contextmanager`** decorator to create context managers using a generator function:

1. Code **before the `yield`** executes during setup (`__enter__`).
2. The value in **`yield target`** is bound to the `as target` variable.
3. Code **after the `yield` inside `finally`** executes during teardown (`__exit__`).

```python
import os
from contextlib import contextmanager

@contextmanager
def change_working_directory(new_dir: str):
    """Safely switch directory and guarantee return to original path."""
    original_cwd = os.getcwd()
    os.chdir(new_dir)
    try:
        yield os.getcwd()
    finally:
        # Guaranteed to execute even if an error occurred in the with block!
        os.chdir(original_cwd)
```

---

## Examples

### 1. Simple: Benchmarking Code Execution with `Timer`
Creating a reusable benchmarking tool.

```python
import time

class CodeTimer:
    def __init__(self, label: str):
        self.label = label

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.duration_ms = (time.perf_counter() - self.start_time) * 1000.0
        print(f"[{self.label}] Elapsed: {self.duration_ms:.3f} ms")
        return False

with CodeTimer("List Comprehension Sort"):
    items = sorted([x ** 2 for x in range(500_000)], reverse=True)
```

### 2. Beginner: Standard Library `contextlib.suppress`
Ignoring expected, benign exceptions cleanly.

```python
import os
from contextlib import suppress

# Instead of verbose try/except FileNotFoundError:
# try:
#     os.remove("temp_cache.tmp")
# except FileNotFoundError:
#     pass

# IDIOMATIC:
with suppress(FileNotFoundError):
    os.remove("temp_cache.tmp")
```

### 3. Intermediate: Mock Database Transaction with Auto-Rollback
Simulating a transactional database session that automatically commits on success and rolls back on failure.

```python
class MockDatabaseTransaction:
    def __init__(self, session_name: str):
        self.session = session_name
        self.active_mutations = []

    def __enter__(self):
        print(f"🔄 [BEGIN TX] Transaction started on '{self.session}'")
        return self

    def execute_sql(self, query: str):
        print(f"  -> Executing: {query}")
        self.active_mutations.append(query)

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # An error occurred: Rollback all mutations!
            print(f"🚨 [ROLLBACK] Transaction failed ({exc_val})! Reverting {len(self.active_mutations)} queries.")
            self.active_mutations.clear()
            return False  # Propagate exception to caller
        else:
            # Success: Commit transaction
            print(f"✅ [COMMIT] Transaction committed {len(self.active_mutations)} mutations successfully.")
            return True

# Test 1: Successful Transaction
with MockDatabaseTransaction("Production_DB") as tx:
    tx.execute_sql("UPDATE accounts SET balance = balance - 100 WHERE id = 101")
    tx.execute_sql("UPDATE accounts SET balance = balance + 100 WHERE id = 202")

# Test 2: Failed Transaction with Auto-Rollback
try:
    with MockDatabaseTransaction("Production_DB") as tx:
        tx.execute_sql("UPDATE inventory SET stock = stock - 1 WHERE sku = 'ITEM-9'")
        raise RuntimeError("Payment Gateway Timeout!")
except RuntimeError as err:
    print("Caught Outer Exception:", err)
```

### 4. Real-World: Concurrency Lock Management
Using context managers to ensure thread locks are always released, preventing thread deadlocks.

```python
import threading
import time

class SharedCounter:
    def __init__(self):
        self.value = 0
        self._lock = threading.Lock()

    def increment(self):
        # 'with self._lock' acquires lock in __enter__ and releases in __exit__
        with self._lock:
            current = self.value
            time.sleep(0.001)  # Simulate work
            self.value = current + 1

counter = SharedCounter()
threads = [threading.Thread(target=counter.increment) for _ in range(10)]

for t in threads: t.start()
for t in threads: t.join()

print("Final Counter Value:", counter.value)  # Guaranteed 10!
```

### 5. Advanced: Atomic File Writer Context Manager
Writing data to a temporary file first, and atomically replacing the target destination file only on complete success.

```python
import os
import tempfile
from contextlib import contextmanager

@contextmanager
def atomic_write(filepath: str, mode: str = "w", encoding: str = "utf-8"):
    """Safely write to a temporary file and atomically replace target on success."""
    temp_dir = os.path.dirname(os.path.abspath(filepath))
    # Create temp file in same directory (ensures same filesystem for atomic rename)
    temp_file = tempfile.NamedTemporaryFile(mode=mode, dir=temp_dir, delete=False, encoding=encoding)
    temp_path = temp_file.name
    
    try:
        with temp_file as f:
            yield f
        # Atomic OS rename (Replaces destination file instantaneously)
        os.replace(temp_path, filepath)
        print(f"🔒 [ATOMIC WRITE] Successfully committed data to: {filepath}")
    except Exception:
        # Clean up temporary file on failure without touching original file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"❌ [ABORTED] Write failed! Original file '{filepath}' remains untouched.")
        raise

# Test Atomic Write
target_config = "app_config_live.json"

# Successful Atomic Write
with atomic_write(target_config) as f:
    f.write('{"status": "ONLINE", "version": "1.0"}')

# Failed Atomic Write (Original file is NOT corrupted!)
try:
    with atomic_write(target_config) as f:
        f.write('{"status": "CORRUPT...')
        raise IOError("Disk full or network disconnect!")
except IOError:
    pass

# Verify original file remains intact
with open(target_config, "r", encoding="utf-8") as f:
    print("Live Config Content:", f.read())
```

---

## Code Explanation

In Example 5 (Atomic File Writer):
1. Writing directly to a live configuration file (`with open("config.json", "w")`) risks leaving a corrupted, half-written file if the server crashes halfway through.
2. `atomic_write` creates a temporary scratch file using `tempfile.NamedTemporaryFile`.
3. If writing succeeds, `os.replace(temp_path, filepath)` executes a native POSIX atomic rename syscall, swapping the files in a single atomic filesystem step.
4. If an exception occurs, the `except` block deletes the temporary file, ensuring the original production file remains completely pristine.
5. This is the gold standard architectural pattern for writing configuration files and database journal logs.

---

## Common Mistakes

### Mistake 1: Accidentally Suppressing All Exceptions
Returning a truthy value (or forgetting a return check) in `__exit__` will swallow **all** exceptions (including `KeyboardInterrupt`, `NameError`, and `SyntaxError`), hiding critical bugs.

```python
# DANGEROUS BUG:
class BrokenManager:
    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        return True  # Swallows ALL errors silently! ❌

# with BrokenManager():
#     call_non_existent_function() # Bug is hidden! Script continues!
```

### Mistake 2: Multiple Yields in `@contextmanager`
A generator-based context manager **must yield exactly once**. Yielding zero or multiple times raises a `RuntimeError`.

---

## Best Practices

### Combine Context Managers Using Parentheses in Python 3.10+
Use parenthesized syntax to group multiple context managers across lines cleanly.

Good:
```python
with (
    open("file_a.txt", "r", encoding="utf-8") as a,
    open("file_b.txt", "w", encoding="utf-8") as b,
    threading.Lock()
):
    b.write(a.read())
```

---

## Performance Considerations

1. **CPython 3.11+ Zero-Cost Try Blocks**: In Python 3.11+, context managers incur **zero runtime cost** when no exception occurs. The CPython bytecode compiler maps context boundaries into static exception tables rather than dynamically pushing frame handlers.
2. **Deterministic Memory Deallocation**: Closing files with context managers immediately frees OS file descriptors and allows CPython's reference counting garbage collector to reclaim buffer memory instantly.

---

## Security Considerations

1. **Preventing File Descriptor Exhaustion Attacks**: Web APIs accepting file uploads must wrap all file processing in context managers. Leaking file descriptors will eventually cause the OS kernel to reject all new incoming network sockets (`OSError: Too many open files`).
2. **Zeroing Sensitive Memory**: Use custom context managers to zero out encryption keys and plaintext passwords from byte arrays in `__exit__`.

---

## Real-World Usage

- **SQLAlchemy / Django Database Sessions**: `with session.begin(): ...` (commits on success, rolls back on exception).
- **Mocking in Unit Testing (`unittest.mock.patch`)**: `with patch("module.Class") as mock_obj: ...` (restores original class upon exit).
- **Temporary Files & Directories (`tempfile.TemporaryDirectory`)**: Auto-deleting temporary folders after test suites finish.

---

## Comparison: Resource Management Techniques

| Pattern | Syntax | Deterministic Cleanup? | Readability | Best Use Case |
|---|---|---|---|---|
| **Manual `close()`** | `f = open(); f.close()`| **No (Fails on error)** | Low | **AVOID** |
| **`try...finally`** | `try: ... finally: f.close()`| **Yes** | Moderate (Verbose) | Low-level C extensions |
| **Class Context Manager**| `class CM: __enter__, __exit__`| **Yes** | **High** | Complex stateful managers |
| **`@contextmanager`**| `@contextmanager def gen():` | **Yes** | **Highest (Concise)**| Lightweight functional setups |

---

## Advanced Concepts: Asynchronous Context Managers (`async with`)

In asynchronous Python frameworks (FastAPI, AsyncIO, Aiohttp), context managers support non-blocking asynchronous setup and teardown via **`__aenter__`** and **`__aexit__`**:

```python
class AsyncDatabaseConnection:
    async def __aenter__(self):
        # Non-blocking async connection acquisition
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Non-blocking async disconnect
        await self.disconnect()
        return False
```

Used via `async with AsyncDatabaseConnection() as conn: ...`.

---

## Exercises

### Exercise 1 — Beginner
Write a context manager class named `ExecutionTracker` that prints `"Entering task..."` on entry and `"Exited task."` on exit, tracking the number of times it has been used across the program.

### Exercise 2 — Intermediate
Using `@contextlib.contextmanager`, write a generator context manager `redirect_errors_to_log(log_filepath: str)` that catches any exceptions raised inside the block, writes the exception message and timestamp to `log_filepath`, and suppresses the exception.

### Exercise 3 — Advanced
Build a `ConnectionPoolManager` context manager that acquires a connection from an internal pool of 5 connections upon `__enter__` and returns the connection to the pool upon `__exit__`. If all connections are in use, raise a `TimeoutError`.

---

## Mini Project: Enterprise Atomic File Writer & Config Rollback Engine

### Requirements
Build a resilient configuration manager named `config_rollback_manager.py` using class-based context managers that safely modifies JSON settings files, creates automated backup snapshots, validates schema invariants, and executes an automated rollback if validation fails.

### Implementation Blueprint
```python
import json
import os
import shutil

class SafeConfigUpdater:
    def __init__(self, config_filepath: str):
        self.filepath = config_filepath
        self.backup_path = f"{config_filepath}.bak"
        self.config_data = {}

    def __enter__(self) -> dict:
        print(f"📦 [SETUP] Creating safety backup snapshot: {self.backup_path}")
        if os.path.exists(self.filepath):
            shutil.copy2(self.filepath, self.backup_path)
            with open(self.filepath, "r", encoding="utf-8") as f:
                self.config_data = json.load(f)
        else:
            self.config_data = {}
            
        return self.config_data

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # An error occurred: Revert configuration to backup!
            print(f"🚨 [ERROR] Modification failed: {exc_val}")
            if os.path.exists(self.backup_path):
                shutil.copy2(self.backup_path, self.filepath)
                os.remove(self.backup_path)
                print(f"🔄 [ROLLBACK] Reverted '{self.filepath}' to original snapshot.")
            return False  # Propagate exception
        else:
            # Validate schema integrity before committing
            if not isinstance(self.config_data.get("version"), (int, float)):
                if os.path.exists(self.backup_path):
                    shutil.copy2(self.backup_path, self.filepath)
                    os.remove(self.backup_path)
                raise ValueError("Schema Validation Failed: 'version' must be a numeric field!")
                
            # Commit changes to disk
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.config_data, f, indent=2)
                
            # Remove backup snapshot
            if os.path.exists(self.backup_path):
                os.remove(self.backup_path)
            print(f"✅ [COMMIT] New configuration committed successfully to: {self.filepath}")
            return True

if __name__ == "__main__":
    conf_file = "production_app_config.json"
    
    # Initialize base config
    with open(conf_file, "w", encoding="utf-8") as f:
        json.dump({"app": "AuthServer", "version": 1.0, "port": 8000}, f)
        
    print("=" * 65)
    print("           ENTERPRISE SAFE CONFIGURATION MANAGER")
    print("=" * 65)
    
    # Test 1: Successful Update
    print("\n--- Test 1: Valid Update ---")
    with SafeConfigUpdater(conf_file) as config:
        config["version"] = 1.1
        config["port"] = 9000
        config["ssl_enabled"] = True
        
    # Test 2: Invalid Schema Update (Triggers Rollback!)
    print("\n--- Test 2: Corrupted Schema Update (Auto-Rollback) ---")
    try:
        with SafeConfigUpdater(conf_file) as config:
            config["version"] = "INVALID_STRING_VERSION"  # Schema violation!
            config["port"] = 9999
    except ValueError as err:
        print("Caught Handled Error:", err)
        
    # Verify file was rolled back
    with open(conf_file, "r", encoding="utf-8") as f:
        print("\nFinal Restored File Contents:\n", f.read())
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's context managers and the `with` statement:
- Context managers provide **deterministic resource cleanup** and prevent resource leaks.
- The **Context Management Protocol** consists of `__enter__()` and `__exit__()`.
- `__exit__()` receives active exception details and can **suppress exceptions by returning `True`**.
- Use **`@contextlib.contextmanager`** to build generator-based context managers cleanly.
- Use parenthesized syntax in Python 3.10+ for multi-resource `with` statements.
- Build transactional context managers for database commits, lock acquisition, and atomic file updates.

---

## Best Practices Checklist

- [ ] Always use the `with` statement for files, network sockets, and thread locks.
- [ ] Return `False` in `__exit__` unless you explicitly intend to suppress specific errors.
- [ ] Use `@contextlib.contextmanager` with `try...finally` for functional context managers.
- [ ] Use `contextlib.suppress()` instead of empty `try...except` blocks.
- [ ] Implement atomic file writing for critical production configuration files.

---

## What's Next?

Now that you understand context managers, continue to:
👉 **[Working with CSV & JSON Data](working-with-csv-json.md)** to master structured data serialization and tabular data handling.
