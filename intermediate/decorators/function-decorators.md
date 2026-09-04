# Function Decorators & Wrapper Architecture in Python

## Introduction

In software architecture, applications frequently require functionality that applies across dozens or hundreds of independent functions: measuring execution time, logging input arguments, enforcing user authentication, caching results, retrying transient network failures, and validating input schemas.

In procedural programming, developers often repeat these **Cross-Cutting Concerns** manually inside every function body:

```python
# The Messy Procedural Anti-Pattern:
def fetch_user_data(user_id):
    start = time.time()             # Repetitive timing code
    if not is_authenticated(): ...  # Repetitive auth check
    # --- Actual Business Logic ---
    data = db.query(user_id)
    log_duration(time.time() - start) # Repetitive logging
    return data
```

This violates the **DRY (Don't Repeat Yourself)** principle and pollutes clean business logic with operational boilerplate.

Introduced in **PEP 318**, Python provides a clean, declarative metaprogramming solution: **Function Decorators**.

A **Decorator** is a callable that takes a function as an argument, extends or alters its behavior without modifying its source code, and returns a new callable wrapper. Using the iconic **`@` (pie syntax)**, decorators separate cross-cutting concerns cleanly from domain logic.

This lesson explores decorator anatomy, argument forwarding (`*args`, `**kwargs`), preserving function metadata using **`@functools.wraps`**, inspecting wrapped functions via `__wrapped__`, and building production-grade monitoring and security decorators.

---

## Prerequisites

Before studying decorators, ensure you have:

- Completed [Closures & First-Class Functions](first-class-functions-closures.md).
- Mastered [Parameters & Arguments (`*args`, `**kwargs`)](../../beginner/functions/parameters-and-arguments.md).
- A solid understanding of Python function execution and return values.

---

## Core Concept: The `@` Syntactic Sugar

The `@decorator` syntax is simply an expressive shorthand for passing a function through a higher-order wrapper function at definition time:

```
                            THE DECORATOR SYNTACTIC EQUIVALENCE

           DECLARATIVE SYNTAX                       UNDERLYING PYTHON BYTECODE
     ┌─────────────────────────────┐           ┌─────────────────────────────┐
     │ @my_decorator               │           │ def calculate_tax(amount):  │
     │ def calculate_tax(amount):  │  ══════►  │     return amount * 0.20    │
     │     return amount * 0.20    │           │                             │
     └─────────────────────────────┘           │ calculate_tax =             │
                                               │   my_decorator(calculate_tax│
                                               └─────────────────────────────┘
```

---

## Syntax & Essential Decorator Patterns

```python
import functools
import time
from typing import Callable, Any

# 1. The Standard Decorator Template (Always use functools.wraps!)
def execution_timer(func: Callable) -> Callable:
    """Decorator that logs function execution time."""
    
    @functools.wraps(func)  # Preserves __name__, __doc__, and type annotations!
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_t = time.perf_counter()
        
        # Execute original wrapped function
        result = func(*args, **kwargs)
        
        elapsed_ms = (time.perf_counter() - start_t) * 1000.0
        print(f"⏱️ [{func.__name__}] Executed in {elapsed_ms:.3f} ms")
        return result  # Mandatory: Always return original result!
        
    return wrapper

# 2. Applying Decorator
@execution_timer
def process_data_records(count: int) -> int:
    """Processes N simulated records."""
    return sum(x ** 2 for x in range(count))

total = process_data_records(500_000)
print(f"Total: {total}")
print("Function Name :", process_data_records.__name__) # "process_data_records" (Preserved!)
print("Docstring     :", process_data_records.__doc__)  # "Processes N simulated records."
```

---

## Detailed Explanation

### 1. Definition Time vs Execution Time

A critical concept in Python metaprogramming:

$$\textbf{Decorators execute at \underline{Definition Time} (Module Load Time), NOT at Call Time!}$$

When Python parses a module:
1. It defines the function.
2. It **immediately** executes the decorator function, replacing the original function name with the returned `wrapper`.
3. The code *inside* `wrapper()` executes only when the decorated function is later called.

```python
def debug_decorator(func):
    print(f"⚙️ [DEFINITION TIME] Decorating function: {func.__name__}")
    def wrapper(*args, **kwargs):
        print(f"🚀 [CALL TIME] Executing wrapper for: {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

# Notice what prints when defining the function:
@debug_decorator
def sample_task():
    print("  -> Inside sample_task body.")

# Output: ⚙️ [DEFINITION TIME] Decorating function: sample_task (Prints on import!)

print("\nCalling function now:")
sample_task()
```

---

### 2. The Introspection Disaster & `@functools.wraps`

When you wrap a function with a raw inner function, the new function is literally named `wrapper`:

```python
# 🚨 BROKEN DECORATOR (Missing functools.wraps):
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@bad_decorator
def calculate_salary():
    """Calculates employee salary."""
    pass

print(calculate_salary.__name__) # "wrapper" ❌ (LOST REAL NAME!)
print(calculate_salary.__doc__)  # None      ❌ (LOST DOCSTRING!)
```

This breaks:
- Automated documentation tools (Sphinx, MkDocs).
- Debuggers and log tracebacks.
- IDE signature hints and type checkers.
- Web framework routers (Flask, FastAPI).

#### The Solution: `@functools.wraps`
Adding **`@functools.wraps(func)`** on top of `wrapper` copies all metadata (`__name__`, `__doc__`, `__annotations__`, `__module__`) and attaches the original unwrapped function to **`wrapper.__wrapped__`**.

---

## Examples

### 1. Simple: Uppercase String Normalizer
Transforming the string output of any decorated function to uppercase.

```python
import functools

def uppercase_output(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        if isinstance(result, str):
            return result.upper()
        return result
    return wrapper

@uppercase_output
def get_welcome_banner(user: str) -> str:
    return f"welcome to the platform, {user}!"

print(get_welcome_banner("Hesam")) # "WELCOME TO THE PLATFORM, HESAM!"
```

### 2. Beginner: Function Call Auditing & Argument Logger
Logging every function invocation, its positional arguments, keyword arguments, and returned result.

```python
import functools

def audit_logger(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        args_repr = [repr(a) for a in args]
        kwargs_repr = [f"{k}={v!r}" for k, v in kwargs.items()]
        signature = ", ".join(args_repr + kwargs_repr)
        
        print(f"🔍 [AUDIT CALL] {func.__name__}({signature})")
        result = func(*args, **kwargs)
        print(f"📦 [AUDIT RETURN] {func.__name__} -> Result: {result!r}")
        return result
    return wrapper

@audit_logger
def calculate_discount(price: float, discount_pct: float = 10.0) -> float:
    return round(price * (1.0 - discount_pct / 100.0), 2)

final_price = calculate_discount(250.00, discount_pct=15.0)
```

### 3. Intermediate: Automatic Retry on Transient Failures
Retrying a decorated function up to 3 times with exponential delays if a specific exception occurs.

```python
import functools
import time
import random

def retry_transient_failures(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        max_attempts = 3
        delay_sec = 0.2
        
        for attempt in range(1, max_attempts + 1):
            try:
                return func(*args, **kwargs)
            except ConnectionError as err:
                print(f"  ⚠️ [RETRY {attempt}/{max_attempts}] Caught {err}. Waiting {delay_sec:.1f}s...")
                time.sleep(delay_sec)
                delay_sec *= 2.0
                if attempt == max_attempts:
                    raise  # Re-raise on final failure
    return wrapper

@retry_transient_failures
def query_unstable_service() -> dict:
    if random.random() < 0.6:
        raise ConnectionError("504 Gateway Timeout")
    return {"status": 200, "data": "LIVE_FEED_DATA"}

print("Querying Service with Auto-Retry Decorator:")
response = query_unstable_service()
print("Success:", response)
```

### 4. Real-World: Role-Based Access Control (RBAC) Security Guard
Enforcing security authentication and permission checks before executing endpoint functions.

```python
import functools

CURRENT_USER_SESSION = {"username": "hesamp", "roles": ["DEVELOPER", "ADMIN"]}

class UnauthorizedAccessError(Exception): pass

def require_admin(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        roles = CURRENT_USER_SESSION.get("roles", [])
        if "ADMIN" not in roles:
            user = CURRENT_USER_SESSION.get("username", "Anonymous")
            raise UnauthorizedAccessError(f"User '{user}' lacks required ADMIN role to invoke {func.__name__}()")
            
        print(f"🔒 [AUTH PASS] Admin clearance verified for '{CURRENT_USER_SESSION['username']}'.")
        return func(*args, **kwargs)
    return wrapper

@require_admin
def delete_database_table(table_name: str):
    print(f"💣 Table '{table_name}' dropped successfully.")

delete_database_table("obsolete_cache_logs")
```

### 5. Advanced: Precondition Validation & Return Type Invariant Enforcement
Inspecting function argument types at runtime dynamically and validating return values.

```python
import functools

def validate_positive_numbers(func):
    """Enforces that all numeric arguments and the return value are strictly positive."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Validate Positional Args
        for idx, arg in enumerate(args):
            if isinstance(arg, (int, float)) and arg < 0:
                raise ValueError(f"Argument at index {idx} ({arg}) must be positive in {func.__name__}()")

        # Validate Keyword Args
        for k, val in kwargs.items():
            if isinstance(val, (int, float)) and val < 0:
                raise ValueError(f"Keyword argument '{k}' ({val}) must be positive in {func.__name__}()")

        result = func(*args, **kwargs)

        if isinstance(result, (int, float)) and result < 0:
            raise ValueError(f"Return value ({result}) violated positive invariant in {func.__name__}()")

        return result
    return wrapper

@validate_positive_numbers
def compute_cuboid_volume(length: float, width: float, height: float) -> float:
    return length * width * height

print("Volume (2 x 3 x 4) :", compute_cuboid_volume(2, 3, 4)) # 24.0

try:
    compute_cuboid_volume(2, -3, 4) # Raises ValueError!
except ValueError as err:
    print(f"🛡️ [GUARD REJECTED] {err}")
```

---

## Code Explanation

In Example 5 (`validate_positive_numbers`):
1. The decorator intercepts all incoming arguments via `*args` and `**kwargs` before `func` executes.
2. It iterates through both positional and keyword argument collections, checking `if arg < 0`.
3. If an invariant is violated, it raises an informative `ValueError` before the business logic is reached.
4. It then calls `result = func(*args, **kwargs)` and inspects the return value to ensure output invariants hold.
5. This demonstrates how decorators provide **Contract-Based Programming (Design by Contract)** in Python.

---

## Common Mistakes

### Mistake 1: Forgetting to Return the Result of `func()`
If `wrapper` executes `func(*args, **kwargs)` but forgets `return`, the decorated function will **always return `None` silently**!

```python
# BROKEN:
def broken_timer(func):
    def wrapper(*args, **kwargs):
        func(*args, **kwargs)  # Missing 'return'! ❌
    return wrapper

@broken_timer
def get_user_id(): return 42

print(get_user_id()) # None (Value lost!)
```

### Mistake 2: Missing `@functools.wraps`
Omitting `@functools.wraps` destroys function identity, renaming every decorated function to `wrapper`.

---

## Best Practices

### Always Use `@functools.wraps(func)`
Never write a decorator without `@functools.wraps`. It preserves docstrings, names, annotations, and allows accessing the original unwrapped function via `func.__wrapped__`.

Good:
```python
def my_decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

---

## Performance Considerations

1. **Wrapper Call Overhead**: Adding a decorator introduces one additional Python function call frame (~50 nanoseconds overhead). In 99.9% of web, database, or business logic code, this overhead is negligible.
2. **Accessing Unwrapped Functions**: For unit testing, you can bypass all decorator wrappers and invoke the raw function directly using **`func.__wrapped__(*args, **kwargs)`**:

```python
raw_result = delete_database_table.__wrapped__("test_table")
```

---

## Security Considerations

1. **Preventing Security Bypass**: When using decorators for authorization (`@require_admin`), ensure that the wrapped function cannot be called through alternate unprotected internal references.
2. **Sanitizing Logged Arguments**: If building logging decorators (`@audit_logger`), redact passwords, credit card numbers, and authorization headers before printing to logs.

---

## Real-World Usage

- **Flask & FastAPI Route Registration**: `@app.get("/users")` and `@app.post("/checkout")`.
- **Django Authentication & Permissions**: `@login_required` and `@permission_required("admin")`.
- **Celery Distributed Task Queue**: `@app.task` turning functions into asynchronous distributed tasks.

---

## Comparison: Metaprogramming & Cross-Cutting Approaches

| Approach | Syntax | Invasiveness | Best Use Case |
|---|---|---|---|
| **Decorator** | `@decorator` | **Zero (Wraps externally)** | **Instrumentation, Auth, Caching, Logging** |
| **Manual Wrapper** | `func = wrap(func)` | High | Legacy codebases without `@` syntax |
| **Class Subclassing** | `class Child(Base)` | Moderate | Stateful domain taxonomies |
| **Middleware** | HTTP Middleware | High (Framework-wide) | Global request/response HTTP processing |

---

## Advanced Concepts: Inspecting Signatures Across Decorators

Using the standard library **`inspect`** module, Python inspects the true original parameter signature through any number of nested `@functools.wraps` layers:

```python
import inspect

sig = inspect.signature(compute_cuboid_volume)
print("Original Function Parameters:", sig.parameters)
# Output: OrderedDict([('length', <Parameter "length: float">), ...])
```

---

## Exercises

### Exercise 1 — Beginner
Write a decorator `@count_calls` that counts and prints how many times a decorated function has been invoked across the program lifetime.

### Exercise 2 — Intermediate
Build a `@validate_json_response` decorator that checks if a function's return value is a dictionary. If it is not a dictionary, raise a `TypeError`.

### Exercise 3 — Advanced
Build a `@rate_limited(max_calls_per_second=2)` decorator using timestamps that delays execution with `time.sleep()` if invocations exceed the rate threshold.

---

## Mini Project: Enterprise API Security Guard & Performance Monitoring Suite

### Requirements
Build an end-to-end decorator instrumentation suite named `api_instrumentation.py`. Implement modular, composable decorators for latency benchmarking, cryptographic audit logging, and role-based security validation with `@functools.wraps`.

### Implementation Blueprint
```python
import functools
import time
from datetime import datetime, timezone
from typing import Callable

# =====================================================================
# 1. DECORATOR SUITE
# =====================================================================

def performance_metric_logger(func: Callable) -> Callable:
    """Decorator that measures and logs execution latency."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_t = time.perf_counter()
        result = func(*args, **kwargs)
        duration_ms = (time.perf_counter() - start_t) * 1000.0
        
        status = "⚡ FAST" if duration_ms < 50.0 else "⚠️ SLOW"
        print(f"⏱️ [{func.__name__}] Latency: {duration_ms:>6.2f} ms │ {status}")
        return result
    return wrapper

def security_role_guard(required_role: str):
    """Parameterized decorator enforcing user role permissions."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract user context from keyword arguments
            user_context = kwargs.get("user_context", {"username": "Anonymous", "role": "GUEST"})
            user_role = user_context.get("role", "GUEST")
            
            if user_role.upper() != required_role.upper() and user_role.upper() != "SUPERADMIN":
                username = user_context.get("username", "Unknown")
                print(f"🚫 [SECURITY REJECT] User '{username}' ({user_role}) denied access to {func.__name__}()")
                raise PermissionError(f"Access Denied: Requires '{required_role}' permission.")
                
            return func(*args, **kwargs)
        return wrapper
    return decorator

# =====================================================================
# 2. DECORATED DOMAIN SERVICES
# =====================================================================

@performance_metric_logger
@security_role_guard(required_role="MANAGER")
def generate_quarterly_financial_report(year: int, quarter: int, user_context: dict = None) -> dict:
    """Generates financial metrics for executive leadership."""
    time.sleep(0.02)  # Simulate analytical processing
    return {
        "report_id": f"FIN-{year}-Q{quarter}",
        "gross_revenue": 1_450_000.00,
        "net_profit": 320_000.00
    }

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE API SECURITY & PERFORMANCE SUITE")
    print("=" * 65)
    
    manager_user = {"username": "sarah_finance", "role": "MANAGER"}
    developer_user = {"username": "alex_dev", "role": "DEVELOPER"}
    
    # 1. Authorized Invocation (Manager)
    print("\n--- Test 1: Authorized Request (Manager) ---")
    try:
        report = generate_quarterly_financial_report(2024, 2, user_context=manager_user)
        print(f"✅ Report Generated: {report['report_id']} | Profit: ${report['net_profit']:,.2f}")
    except PermissionError as err:
        print(f"Error: {err}")

    # 2. Unauthorized Invocation (Developer)
    print("\n--- Test 2: Unauthorized Request (Developer) ---")
    try:
        generate_quarterly_financial_report(2024, 2, user_context=developer_user)
    except PermissionError as err:
        print(f"Caught Expected Security Violation: {err}")
        
    print("\n" + "=" * 65)
```

---

## Summary

In this lesson, you mastered Python's function decorators:
- A **Decorator** is a callable that wraps another function to extend its behavior without altering its source code.
- **`@decorator`** is syntactic sugar for `func = decorator(func)` executed at **Definition Time**.
- Forward all arguments seamlessly using **`*args` and `**kwargs`** and always return the inner result.
- **Always use `@functools.wraps(func)`** to preserve function names, docstrings, and annotations.
- Access the raw unwrapped function using **`func.__wrapped__`**.
- Decorators cleanly decouple cross-cutting concerns (timing, logging, security, validation) from business logic.

---

## Best Practices Checklist

- [ ] Always apply `@functools.wraps(func)` to wrapper functions.
- [ ] Ensure wrappers accept `*args, **kwargs` and return the result of `func(*args, **kwargs)`.
- [ ] Keep decorators focused on single operational concerns.
- [ ] Use `func.__wrapped__` to test undecorated business logic in unit tests.
- [ ] Redact sensitive credentials in logging decorators.

---

## What's Next?

Now that you understand function decorators, continue to:
👉 **[Decorators with Arguments & `functools`](decorator-arguments-and-functools.md)** to master parameterizing decorators with 3-tier closures and caching with `@functools.lru_cache`!
