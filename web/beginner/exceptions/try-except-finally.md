# Try, Except, Else & Finally in Python

## Introduction

In software systems, unexpected runtime failures are inevitable. A requested database server might experience a temporary network outage, an external REST API might return a malformed payload, a required configuration file might be missing from disk, or a user might enter an alphabetic string when prompted for a numeric account ID.

Without robust error handling, any unexpected condition will crash the Python interpreter immediately, outputting an unformatted traceback and abruptly terminating the application.

Python approaches error handling through a structured, object-oriented **Exception Model**. Rather than relying on cryptic C-style integer error codes (e.g., returning `-1` on failure), Python raises explicit **Exception Objects**. These exceptions propagate up the execution call stack until intercepted by a matching **`try-except-else-finally`** block.

Furthermore, Python is fundamentally architected around the philosophical principle of **EAFP (Easier to Ask for Forgiveness than Permission)**, contrasting with the traditional **LBYL (Look Before You Leap)** approach favored in other languages.

This lesson opens **Module 11: Exception Handling**, exploring the complete four-part exception handling lifecycle, the built-in exception inheritance hierarchy, the EAFP design paradigm, and the mechanics of resilient software architecture.

---

## Prerequisites

Before studying exception handling, ensure you have:

- Completed [Defining Functions & Execution Model](../functions/defining-functions.md).
- Completed [Reading & Writing Files](../file-handling/reading-writing-files.md).
- A solid understanding of Python execution frames and the call stack.

---

## Core Concept: The 4-Part Exception Handling Lifecycle

A complete Python exception block consists of four distinct clauses:

```
                            THE 4-PART EXCEPTION EXECUTION LIFECYCLE

                                      [ Enter try Block ]
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         ▼ (No Exception Raised)                     ▼ (Exception Raised!)
               [ Execute else Block ]                     [ Find Matching except Block ]
                         │                                           │
                         │                         ┌─────────────────┴─────────────────┐
                         │                         ▼ (Match Found)                     ▼ (No Match)
                         │               [ Execute except Block ]             [ Propagate to Caller ]
                         │                         │                                   │
                         └─────────────────────────┼───────────────────────────────────┘
                                                   │
                                                   ▼
                                        [ Execute finally Block ]
                                        (ALWAYS Runs Guaranteed!)
                                                   │
                                                   ▼
                                         [ Continue Program ]
```

### The 4 Clauses Defined:
1. **`try`**: Wraps the code that might potentially raise an exception.
2. **`except ExceptionType as e`**: Intercepts and handles specific exception types if raised.
3. **`else`**: Executes **only if the `try` block completed successfully with ZERO exceptions**.
4. **`finally`**: Executes **unconditionally**, regardless of whether an exception occurred, was handled, was unhandled, or if an early `return` was executed.

---

## Syntax & Essential Handling Patterns

```python
# 1. Catching Specific Exceptions
try:
    number = int(input("Enter a positive number: "))
    result = 100 / number
except ValueError as err:
    print("Invalid Input: Please enter numeric digits only.")
except ZeroDivisionError:
    print("Math Error: Cannot divide 100 by zero.")
else:
    # Runs ONLY if int conversion and division succeeded!
    print(f"Calculation Successful: Result = {result:.2f}")
finally:
    # Runs in ALL cases (success, error, or input cancellation)
    print("Execution cycle complete.")

# 2. Catching Multiple Exception Types in a Single Block
try:
    with open("config.json", "r") as f:
        data = f.read()
except (FileNotFoundError, PermissionError) as os_err:
    print(f"OS Filesystem Error: {os_err}")

# 3. Accessing Exception Metadata
try:
    int("invalid_text")
except ValueError as exc:
    print("Exception Type :", type(exc).__name__) # ValueError
    print("Exception Args :", exc.args)            # ("invalid literal for int()...",)
```

---

## Detailed Explanation

### 1. The Built-in Exception Class Hierarchy

All built-in exceptions in Python form an **Inheritance Tree** rooted at **`BaseException`**:

```
                              PYTHON EXCEPTION INHERITANCE TREE

                                       BaseException
                                             │
                  ┌──────────────────────────┼──────────────────────────┐
                  ▼                          ▼                          ▼
            SystemExit              KeyboardInterrupt               Exception
          (sys.exit())                 (Ctrl + C)                       │
                                             ┌──────────────────────────┴──────────────────────────┐
                                             ▼                                                     ▼
                                       StandardError                                        Custom Exceptions
                                             │                                         (class MyError(Exception))
        ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
        ▼                   ▼                ▼                   ▼                   ▼
    ArithmeticError      LookupError      OSError            TypeError           ValueError
        ├── ZeroDivision    ├── IndexError   ├── FileNotFoundError
        └── OverflowError   └── KeyError     └── PermissionError
```

#### Why You Must NEVER Use Bare `except:`
Writing `except:` (or `except BaseException:`) catches `KeyboardInterrupt` (when a developer presses `Ctrl+C` to stop a script) and `SystemExit` (when `sys.exit()` is called). This traps the developer in an un-killable loop.

**The Golden Rule**: Always catch **`Exception`** or specific subclasses, never `BaseException` or bare `except:`.

```python
# FORBIDDEN ANTI-PATTERN:
# try:
#     run_server()
# except:             # Traps Ctrl+C! Cannot stop script!
#     pass

# CORRECT:
try:
    run_server()
except Exception as err:
    print(f"Handled application error: {err}")
```

---

### 2. The Crucial Purpose of the `else` Clause

Why does Python have an `else` clause in `try-except`?

**Principle: Keep `try` blocks as small as possible.**
If you place code that depends on the `try` block's success inside the `try` block itself, an exception in that secondary code might accidentally be caught by the same `except` handler, masking bugs.

```python
# AVOID (Catching unintended errors):
try:
    user = db.get_user(user_id)
    send_welcome_email(user)  # If this raises a ValueError, it's caught below!
except ValueError:
    print("User ID not found in database.")  # MISLEADING ERROR MESSAGE!

# GOOD (Clean separation with 'else'):
try:
    user = db.get_user(user_id)
except ValueError:
    print("User ID not found in database.")
else:
    # Runs ONLY if get_user succeeded. Errors here will NOT be falsely attributed to database!
    send_welcome_email(user)
```

---

### 3. EAFP vs LBYL Programming Paradigms

- **LBYL (Look Before You Leap)**: Check every precondition with defensive `if` statements before attempting an operation.
- **EAFP (Easier to Ask for Forgiveness than Permission)**: Assume operations will succeed, and handle exceptions if they fail.

```python
# 1. LBYL APPROACH (Look Before You Leap) - Prone to Race Conditions!
if os.path.exists("data.txt"):
    # RACE CONDITION (TOCTOU): Another process could delete the file right HERE!
    with open("data.txt") as f:
        content = f.read()

# 2. EAFP APPROACH (Easier to Ask for Forgiveness than Permission) - Atomic & Pythonic!
try:
    with open("data.txt") as f:
        content = f.read()
except FileNotFoundError:
    content = "DEFAULT_DATA"
```

In concurrent environments, LBYL introduces **TOCTOU (Time-of-Check to Time-of-Use)** race conditions. EAFP is faster and thread-safe.

---

## Examples

### 1. Simple: Safe Type Conversion and Mathematical Bounds
Parsing user inputs with multi-branch exception handling.

```python
def calculate_inverse(raw_input_str: str) -> float | None:
    try:
        val = float(raw_input_str)
        return 1.0 / val
    except ValueError:
        print(f"Error: '{raw_input_str}' is not a valid number.")
        return None
    except ZeroDivisionError:
        print("Error: Cannot calculate inverse of 0.0.")
        return None

print("Inverse of '5' :", calculate_inverse("5"))
print("Inverse of '0' :", calculate_inverse("0"))
print("Inverse of 'abc':", calculate_inverse("abc"))
```

### 2. Beginner: Complete 4-Part `try-except-else-finally` File Pipeline
Demonstrating all four lifecycle clauses operating in unison.

```python
def process_user_metrics(filepath: str):
    file_handle = None
    print(f"Initiating pipeline for: {filepath}")
    
    try:
        file_handle = open(filepath, "r", encoding="utf-8")
        data = file_handle.read()
    except FileNotFoundError:
        print("  ❌ [EXCEPT] File does not exist on disk.")
    except PermissionError:
        print("  ❌ [EXCEPT] Insufficient file permissions.")
    else:
        # Executes ONLY on successful read
        word_count = len(data.split())
        print(f"  ✅ [ELSE] File read successfully! Word count: {word_count}")
    finally:
        # Executes ALWAYS
        if file_handle is not None and not file_handle.closed:
            file_handle.close()
            print("  🔒 [FINALLY] Closed open file handle.")
        print("  🏁 [FINALLY] Pipeline execution step finalized.\n")

# Test missing file
process_user_metrics("non_existent_file.txt")
```

### 3. Intermediate: EAFP vs LBYL Dictionary Key Access
Comparing performance and readability when querying deeply nested JSON configurations.

```python
config = {
    "database": {
        "connections": {
            "max_active": 20
        }
    }
}

# LBYL Approach (Verbose, deep defensive checks)
def get_max_connections_lbyl(cfg: dict) -> int:
    if "database" in cfg and isinstance(cfg["database"], dict):
        if "connections" in cfg["database"] and isinstance(cfg["database"]["connections"], dict):
            if "max_active" in cfg["database"]["connections"]:
                return cfg["database"]["connections"]["max_active"]
    return 10  # Default

# EAFP Approach (Clean, idiomatic Python)
def get_max_connections_eafp(cfg: dict) -> int:
    try:
        return cfg["database"]["connections"]["max_active"]
    except (KeyError, TypeError):
        return 10  # Default fallback

print("LBYL Result :", get_max_connections_lbyl(config))
print("EAFP Result :", get_max_connections_eafp(config))
```

### 4. Real-World: Resilient HTTP Network Client with Retries & Exponential Backoff
Simulating an enterprise HTTP client that catches specific network timeouts and recovers gracefully.

```python
import time
import random

class NetworkTimeoutError(Exception): pass
class ServerUnavailableError(Exception): pass

def simulate_flaky_api_call() -> dict:
    rand = random.random()
    if rand < 0.4:
        raise NetworkTimeoutError("Socket read timeout (1000ms exceeded)")
    elif rand < 0.7:
        raise ServerUnavailableError("HTTP 503: Service Unavailable")
    return {"status": 200, "payload": "SECURE_DATA_PACKET"}

def fetch_with_resilience(max_retries: int = 3) -> dict | None:
    attempt = 1
    backoff_delay = 0.5
    
    while attempt <= max_retries:
        print(f"[Attempt #{attempt}] Contacting API Gateway...")
        try:
            response = simulate_flaky_api_call()
        except (NetworkTimeoutError, ServerUnavailableError) as net_err:
            print(f"  ⚠️ [RETRYABLE ERROR] {net_err}. Retrying in {backoff_delay:.1f}s...")
            time.sleep(backoff_delay)
            backoff_delay *= 2.0
            attempt += 1
        except Exception as unhandled_err:
            print(f"  🚨 [FATAL ERROR] Non-retryable error: {unhandled_err}")
            return None
        else:
            # Executes ONLY on successful response
            print("  ✅ [SUCCESS] Data ingested successfully.")
            return response
            
    print("❌ Maximum retry threshold exhausted. Operation aborted.")
    return None

# Execute resilient fetch
fetch_with_resilience(max_retries=3)
```

### 5. Advanced: The `return` in `finally` Trap
Inspecting the dangerous behavior when a `return` statement is placed inside a `finally` block.

```python
def dangerous_finally_behavior() -> str:
    try:
        raise ValueError("Critical System Failure!")
    except ValueError:
        return "EXCEPT_RETURN_VALUE"
    finally:
        # WARNING: Placing a return in finally OVERWRITES all previous returns AND exceptions!
        return "FINALLY_RETURN_VALUE"

print("Function Output:", dangerous_finally_behavior())  # Prints "FINALLY_RETURN_VALUE"!
```

---

## Code Explanation

In Example 5 (The `finally` Return Trap):
1. The `try` block raises a `ValueError`.
2. The `except` block catches it and queues a return value of `"EXCEPT_RETURN_VALUE"`.
3. Before the function returns control to the caller, Python executes the `finally` block.
4. Because the `finally` block executes `return "FINALLY_RETURN_VALUE"`, it **discards the previous return value and suppresses any active exceptions**.
5. **Architectural Rule**: **Never place `return`, `break`, or `continue` inside a `finally` block**; use `finally` strictly for cleanups (closing files, releasing locks).

---

## Common Mistakes

### Mistake 1: Swallowing Exceptions Silently with `pass`
Catching broad exceptions and doing nothing hides bugs, making debugging in production impossible.

```python
# DANGEROUS ANTI-PATTERN:
try:
    execute_critical_business_logic()
except Exception:
    pass  # Silently swallows all bugs, syntax errors, and missing variables! ❌

# CORRECT:
try:
    execute_critical_business_logic()
except Exception as err:
    logger.error(f"Failed to execute business logic: {err}", exc_info=True)
    raise  # Re-raise or handle explicitly
```

### Mistake 2: Putting the Entire Function Body Inside `try:`
Wrapping 100 lines of code inside a single `try` block makes it impossible to determine which specific line failed. Keep `try` blocks narrowly scoped around the exact statement that can fail.

---

## Best Practices

### Catch Specific Exceptions Low in the Inheritance Tree
Always catch specific exceptions (`FileNotFoundError`, `KeyError`, `ValueError`) rather than the broad generic `Exception`.

Good:
```python
try:
    user_id = int(payload["id"])
except KeyError:
    handle_missing_key()
except ValueError:
    handle_invalid_integer()
```

Avoid:
```python
try:
    user_id = int(payload["id"])
except Exception:
    handle_error()  # Ambiguous! Was the key missing or was the integer invalid?
```

---

## Performance Considerations

1. **Python 3.11+ Zero-Cost Exceptions (PEP 657)**: In modern Python, `try` blocks incur **0.0 nanoseconds of overhead** when no exception occurs. The CPython runtime maps exception handlers to a static bytecode table rather than dynamically registering handlers.
2. **Cost When Exceptions Are Raised**: While entering a `try` block is free, actually *raising* and *catching* an exception involves unwinding the stack and building tracebacks (~1 microsecond). Use exceptions for exceptional cases, not for routine loop control flow.

---

## Security Considerations

1. **Information Leakage via Unsanitized Tracebacks**: Never return raw Python exception tracebacks or internal database error strings directly to HTTP API clients in production. An attacker can use database tracebacks to map table schemas and SQL injection vectors. Log tracebacks internally and return generic messages (`"Internal Server Error: Ref #9901"`).
2. **Resource Exhaustion in Finally**: Ensure `finally` blocks handle errors defensively so that cleanup failures do not mask root cause exceptions.

---

## Real-World Usage

- **Database Connection Pools**: Wrapping queries in `try-except` to rollback transactions on error and `finally` to return connections to the pool.
- **REST API Middleware (FastAPI / Flask)**: Catching unhandled domain exceptions at the top level and translating them into standard HTTP 400/500 JSON error responses.
- **File Ingestion Daemons**: Catching `PermissionError` and `FileNotFoundError` during directory monitoring.

---

## Comparison: Error Handling Strategies

| Strategy | When to Use | Pros | Cons |
|---|---|---|---|
| **EAFP (`try-except`)** | Standard Pythonic design | Atomic, thread-safe, clean | Overhead if exception is frequent |
| **LBYL (`if-else`)** | Simple scalar validation | Fast for common cases | Verbose, prone to TOCTOU race conditions |
| **`try-except-else`** | Operations dependent on `try` | Minimal `try` block scope | Slightly more syntax |
| **Context Manager (`with`)**| Deterministic resources | Cleanest syntax | Limited to setup/teardown pairs |

---

## Advanced Concepts: Python 3.11 Exception Table Bytecode

In Python 3.11+, disassembling a `try-except` block reveals that Python generates no dynamic setup opcodes (like legacy `SETUP_FINALLY`). Instead, it embeds an **Exception Table**:

```python
import dis

def exception_demo():
    try:
        x = 1 / 0
    except ZeroDivisionError:
        return 0

dis.dis(exception_demo)
```

The compiled bytecode stores an internal lookup table mapping instruction offset ranges directly to handler addresses, ensuring that standard execution paths run at peak C speed.

---

## Exercises

### Exercise 1 — Beginner
Write a function `safe_list_get(items: list, index: int, default: any = None) -> any` using the EAFP approach (`try-except IndexError`) that returns the item at `index` or `default` if the index is out of bounds.

### Exercise 2 — Intermediate
Write a function `parse_server_port(port_str: str) -> int` that attempts to convert `port_str` to an integer, validates that it falls between 1 and 65535, and uses `try-except-else` to return the integer or raise a `ValueError` with a descriptive message.

### Exercise 3 — Advanced
Build a `ResilientFileLoader` class. Implement `load_json_with_fallback(primary_path: Path, fallback_path: Path) -> dict` that attempts to load and parse JSON from `primary_path`. If `primary_path` is missing or corrupted, catch the errors, log a warning, load from `fallback_path`, and ensure any open file handles are closed in `finally`.

---

## Mini Project: Resilient Network API Client & Auto-Retry Engine

### Requirements
Build an enterprise API client named `resilient_api_client.py` that implements full `try-except-else-finally` lifecycle handling, catches transient network timeouts, applies exponential backoff delays, logs error telemetry, and gracefully degrades to cached data on complete failures.

### Implementation Blueprint
```python
import time
import random

class APIConnectionError(Exception): pass
class APIAuthenticationError(Exception): pass

class ResilientAPIClient:
    def __init__(self, endpoint_url: str):
        self.endpoint = endpoint_url
        self._cache = {"cached_status": "OFFLINE_FALLBACK_DATA"}
        self.total_requests = 0

    def _simulate_network_request(self) -> dict:
        self.total_requests += 1
        rand = random.random()
        
        if rand < 0.2:
            raise APIAuthenticationError("HTTP 401: Invalid API Key")  # Non-retryable
        elif rand < 0.6:
            raise APIConnectionError("HTTP 504: Gateway Timeout")       # Retryable
            
        return {"status": 200, "data": f"LIVE_PAYLOAD_REQ_{self.total_requests}"}

    def fetch_data(self, max_retries: int = 3) -> tuple[dict, str]:
        attempt = 1
        delay_sec = 0.3
        
        print("=" * 65)
        print(f"Initiating Request to: {self.endpoint}")
        print("=" * 65)
        
        while attempt <= max_retries:
            print(f"🔄 [Attempt #{attempt}/{max_retries}] Dispatching network packet...")
            
            try:
                payload = self._simulate_network_request()
            except APIAuthenticationError as auth_err:
                # Fatal security error -> Do not retry!
                print(f"  🚨 [AUTH FATAL] {auth_err}. Aborting retries immediately.")
                break
            except APIConnectionError as conn_err:
                print(f"  ⚠️ [TRANSIENT ERROR] {conn_err}. Retrying in {delay_sec:.1f}s...")
                time.sleep(delay_sec)
                delay_sec *= 2.0
                attempt += 1
            except Exception as unexpected:
                print(f"  🚨 [UNEXPECTED ERROR] {unexpected}")
                break
            else:
                # Executes ONLY on 100% success!
                print("  ✅ [SUCCESS] HTTP 200 OK: Live payload received.")
                return payload, "LIVE_NETWORK"
            finally:
                # Executes on every attempt cycle
                print(f"  📊 [AUDIT] Attempt #{attempt} cycle finished.")

        # Fallback Graceful Degradation
        print("\n⚠️ Network unreachable or failed. Engaging cached fallback...")
        return self._cache, "CACHED_FALLBACK"

if __name__ == "__main__":
    client = ResilientAPIClient("https://api.cloud.internal/v1/telemetry")
    
    data, source = client.fetch_data(max_retries=3)
    print("\n" + "-" * 65)
    print(f"Final Data Returned (Source: {source}):\n{data}")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's exception handling lifecycle:
- The 4-part exception lifecycle: **`try`** (attempt), **`except`** (handle), **`else`** (success only), **`finally`** (cleanup always).
- Catch specific exceptions (`Exception` subclasses); **never use bare `except:`** or catch `BaseException`.
- Use the **`else`** clause to keep `try` blocks small and avoid masking secondary bugs.
- The **`finally`** block is guaranteed to run, even on early returns or unhandled exceptions.
- Python follows **EAFP (Easier to Ask for Forgiveness than Permission)**, which is cleaner and thread-safe compared to LBYL.
- In Python 3.11+, entering a `try` block incurs **zero runtime cost**.

---

## Best Practices Checklist

- [ ] Catch specific exception classes rather than broad `Exception`.
- [ ] Never use bare `except:` (which traps `KeyboardInterrupt` and `SystemExit`).
- [ ] Use `else` for code that should execute only when `try` raises zero exceptions.
- [ ] Keep `try` blocks as small and focused as possible.
- [ ] Never place `return` or `break` inside a `finally` block.

---

## What's Next?

Now that you understand exception interception, continue to:
👉 **[Raising Exceptions & Exception Chaining](raising-exceptions.md)** to master raising exceptions, re-raising errors, and explicit chaining with `raise from`.
