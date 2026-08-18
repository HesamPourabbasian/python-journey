# Variable Scope & The LEGB Rule in Python

## Introduction

In computer programming, a **Namespace** is a mapping from symbolic names (identifiers) to concrete objects in heap memory. As software grows in size, different functions, modules, and third-party libraries inevitably define identical variable names (such as `user_id`, `count`, or `status`). Without structural isolation rules, these identically named variables would constantly collide, corrupting memory state and causing unpredictable behavior across the system.

In Python, namespace isolation and variable visibility are governed by **Variable Scope**. Scope defines the exact syntactic region of a program where a particular namespace is directly accessible.

Whenever Python resolves an identifier referenced in code, it executes a strict, deterministic search sequence known across the Python engineering world as the **LEGB Rule (Local $\rightarrow$ Enclosing $\rightarrow$ Global $\rightarrow$ Built-in)**.

Mastering variable scope requires understanding the lexical compilation of local variables, avoiding the infamous `UnboundLocalError`, understanding how stateful **Closures** retain enclosed variables in memory via cell references, and knowing how to properly use (and when to strictly avoid) the **`global`** and **`nonlocal`** keywords.

This lesson builds directly upon [Defining Functions](defining-functions.md) and [Variables & Memory Binding](../variables-data-types/variables.md), providing the mental model required to master closures, decorators, and object-oriented encapsulation.

---

## Prerequisites

Before studying scope and the LEGB rule, ensure you have:

- Completed [Variables & Memory Binding](../variables-data-types/variables.md).
- Completed [Defining Functions](defining-functions.md).
- A clear understanding of execution frames and the call stack.

---

## Core Concept: The LEGB Lookup Hierarchy

Whenever Python reads a variable name, it searches through four concentric scope layers in strict order. The search stops immediately at the **first scope layer where the name is found**. If the identifier is missing from all four layers, Python raises a `NameError`.

```
                              THE LEGB SCOPE LOOKUP SEQUENCE

   ┌────────────────────────────────────────────────────────────────────────┐
   │ 4. BUILT-IN SCOPE (B)                                                  │
   │    • Python standard built-ins: len, range, print, int, Exception      │
   │    ┌──────────────────────────────────────────────────────────────┐    │
   │    │ 3. GLOBAL SCOPE (G)                                          │    │
   │    │    • Module-level variables, functions, imported classes     │    │
   │    │    ┌────────────────────────────────────────────────────┐    │    │
   │    │    │ 2. ENCLOSING SCOPE (E)                             │    │    │
   │    │    │    • Outer enclosing function frames (Closures)    │    │    │
   │    │    │    ┌──────────────────────────────────────────┐    │    │    │
   │    │    │    │ 1. LOCAL SCOPE (L)                       │    │    │    │
   │    │    │    │    • Inside the currently executing func │    │    │    │
   │    │    │    │    • Arguments & local variable assigns  │    │    │    │
   │    │    │    └──────────────────────────────────────────┘    │    │    │
   │    │    └────────────────────────────────────────────────────┘    │    │
   │    └──────────────────────────────────────────────────────────────┘    │
   └────────────────────────────────────────────────────────────────────────┘
```

### The 4 Scope Layers Defined:
1. **Local (L)**: Names defined within the current function body or parameter list.
2. **Enclosing (E)**: Names defined in any outer enclosing functions (from inner to outer in nested functions).
3. **Global (G)**: Names defined at the top level of the current module file (`.py`), or declared explicitly with `global`.
4. **Built-in (B)**: Names pre-loaded into the Python runtime (`builtins` module), including all standard functions (`len`, `max`, `isinstance`) and exceptions (`ValueError`).

---

## Syntax & Scope Keywords

```python
# Global Scope
APP_NAME = "CloudService"
transaction_counter = 0

def outer_service_factory(service_id: str):
    # Enclosing Scope
    rate_limit = 100
    
    def inner_worker(request_id: str):
        # Local Scope
        local_timestamp = 1716000000
        
        # 1. Reading across LEGB layers:
        print(f"Local     : {request_id}")       # Local
        print(f"Enclosing : {rate_limit}")       # Enclosing
        print(f"Global    : {APP_NAME}")         # Global
        print(f"Built-in  : {len(service_id)}")  # Built-in (len)

    return inner_worker

# The 'global' Keyword (Modifying Global Scope from Function)
def increment_global_counter():
    global transaction_counter
    transaction_counter += 1

# The 'nonlocal' Keyword (Modifying Enclosing Scope from Nested Function)
def make_counter():
    count = 0
    def counter():
        nonlocal count  # Binds to 'count' in the enclosing frame!
        count += 1
        return count
    return counter
```

---

## Detailed Explanation

### 1. The `UnboundLocalError` Trap

One of the most confusing errors for beginners occurs when trying to read a global variable and then assign to a variable with the same name later in the function:

```python
rate = 0.05

def compute_total(subtotal):
    print("Applying rate:", rate)  # Raises UnboundLocalError! ❌
    rate = 0.08                     # Assignment anywhere marks 'rate' as LOCAL!
    return subtotal * (1 + rate)

# compute_total(100)
```

#### Why Does This Error Occur?
Python determines the scope of all variables **statically at compile time**, before the function runs!
When the compiler scans the `compute_total` function, it sees the assignment `rate = 0.08` and flags `rate` as a **Local Variable for the entire function**.

When the function executes, line 1 tries to read local variable `rate` *before* it has been assigned a value, raising:
`UnboundLocalError: cannot access local variable 'rate' where it is not associated with a value`.

---

### 2. The `global` Keyword: Mechanics and Architectural Risks

If a function needs to re-bind a top-level module variable, it must explicitly declare `global variable_name`.

```python
system_status = "INITIALIZING"

def set_system_online():
    global system_status
    system_status = "ONLINE"  # Re-binds global module variable
```

**Architectural Warning**: Overusing `global` is a major anti-pattern in professional Python engineering. Global mutable state creates hidden dependencies, makes code impossible to unit test in isolation, and introduces catastrophic race conditions in multi-threaded environments. Prefer passing parameters and returning new state values or encapsulating state in classes.

---

### 3. The `nonlocal` Keyword and Closures (PEP 3104)

Introduced in Python 3.0, `nonlocal` allows an inner function to re-bind a variable defined in an **enclosing outer function frame**.

When an outer function returns an inner function, Python creates a **Closure**. A closure is a function object that retains bindings to "free variables" in its enclosing scope, even after the outer function has finished executing and its frame has been popped from the call stack!

```python
def make_accumulator(initial_balance: float):
    balance = initial_balance  # Enclosing variable
    
    def deposit(amount: float) -> float:
        nonlocal balance      # Mutate the enclosing balance
        balance += amount
        return balance
        
    return deposit

account = make_accumulator(1000.0)
print("Deposit 1:", account(250.0))  # 1250.0
print("Deposit 2:", account(50.0))   # 1300.0 (Retains state between calls!)
```

---

## Examples

### 1. Simple: Demonstrating LEGB Scope Isolation
Observing how identically named variables remain completely isolated across local and global scopes.

```python
x = "GLOBAL_VALUE"

def test_scope_isolation():
    x = "LOCAL_VALUE"  # Completely isolated local variable
    print("Inside function :", x)

test_scope_isolation()
print("Outside function:", x)  # "GLOBAL_VALUE" remains untouched!
```

### 2. Beginner: Resolving `UnboundLocalError` Correctly
Refactoring code to avoid unintended local variable shadowing.

```python
DEFAULT_TIMEOUT = 30

# ANTI-PATTERN: Shadowing global and failing
# def connect(timeout=None):
#     if timeout is None:
#         timeout = DEFAULT_TIMEOUT  # If re-assigned elsewhere, can trigger UnboundLocalError

# IDIOMATIC PATTERN: Clean parameter default assignment
def connect_safe(timeout: int = DEFAULT_TIMEOUT):
    print(f"Connecting with timeout: {timeout}s")

connect_safe()
connect_safe(60)
```

### 3. Intermediate: Stateful Rate Limiter Closure with `nonlocal`
Building an in-memory API call rate limiter closure.

```python
import time

def create_rate_limiter(max_requests: int, window_seconds: float):
    """Create a closure that enforces rate limits."""
    request_timestamps = []  # Enclosed free variable
    
    def allow_request() -> bool:
        nonlocal request_timestamps
        current_time = time.time()
        
        # Purge timestamps older than the sliding window
        request_timestamps = [t for t in request_timestamps if current_time - t < window_seconds]
        
        if len(request_timestamps) < max_requests:
            request_timestamps.append(current_time)
            return True  # Request Allowed
            
        return False     # Rate limit exceeded
        
    return allow_request

# Allow 3 requests per 2 seconds
limiter = create_rate_limiter(max_requests=3, window_seconds=2.0)

for i in range(1, 6):
    allowed = limiter()
    print(f"Request #{i}: {'✅ ALLOWED' if allowed else '🚫 BLOCKED (Rate Limited)'}")
    time.sleep(0.4)
```

### 4. Real-World: Thread-Safe Global Configuration Registry Pattern
Managing application configuration without raw un-encapsulated `global` mutations.

```python
class GlobalConfigRegistry:
    """Thread-safe configuration singleton encapsulation."""
    _instance = None
    _settings = {}

    @classmethod
    def set(cls, key: str, value: any):
        cls._settings[key] = value

    @classmethod
    def get(cls, key: str, default: any = None) -> any:
        return cls._settings.get(key, default)

    @classmethod
    def dump(cls):
        return cls._settings.copy()

# Anywhere in the codebase:
GlobalConfigRegistry.set("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
GlobalConfigRegistry.set("MAX_RETRIES", 5)

print("Registry Settings:", GlobalConfigRegistry.dump())
```

### 5. Advanced: Inspecting Closure Cells and Free Variables
Inspecting the internal `__closure__` and `__code__.co_freevars` attributes of a Python closure.

```python
def outer_factory(host: str, port: int):
    connection_string = f"{host}:{port}"
    
    def inner_connector():
        # References 'connection_string' from enclosing frame
        return f"Connecting to {connection_string}..."
        
    return inner_connector

connector = outer_factory("192.168.1.10", 8080)

# Inspect closure metadata
print("Closure Free Variables :", connector.__code__.co_freevars)  # ('connection_string',)
print("Closure Cells Tuple    :", connector.__closure__)           # (<cell at 0x...: str object>,)
print("Captured Cell Value    :", connector.__closure__[0].cell_contents) # "192.168.1.10:8080"
```

---

## Code Explanation

In Example 5 (Inspecting Closure Cells):
1. When `outer_factory` finishes executing, its execution frame is destroyed.
2. However, because `inner_connector` references `connection_string`, Python automatically creates a special **Cell Object (`PyCellObject`)** on the heap to store the captured variable.
3. `connector.__closure__` contains a tuple of these cell objects, allowing the inner function to access and mutate `cell_contents` at any point in the future.
4. This proves that Python closures do not copy values; they preserve shared cell pointers to heap objects.

---

## Common Mistakes

### Mistake 1: Accidental Built-in Name Shadowing
Assigning variables to names like `list`, `dict`, `str`, `min`, `max`, or `id` shadows the Built-in (B) scope, breaking subsequent built-in calls in that module.

```python
# DANGEROUS:
list = [1, 2, 3]  # Shadows built-in list constructor!
# Later:
# new_items = list("abc")  # Raises TypeError: 'list' object is not callable
```

### Mistake 2: Confusing `global` with `nonlocal`
`global` binds a variable directly to the **top-level module scope**; `nonlocal` binds a variable to the **nearest enclosing function scope**. Using `global` inside a nested function bypasses the enclosing function entirely!

---

## Best Practices

### Prefer Explicit Parameter Passing Over Global Mutation
Write pure functions that receive dependencies explicitly via parameters rather than reading or modifying globals.

Good:
```python
def calculate_tax(amount: float, tax_rate: float) -> float:
    return amount * tax_rate
```

Avoid:
```python
TAX_RATE = 0.08
def calculate_tax(amount: float) -> float:
    return amount * TAX_RATE  # Coupled to global state
```

---

## Performance Considerations

1. **`LOAD_FAST` vs `LOAD_GLOBAL`**: In CPython bytecode:
   - Local variable lookup uses `LOAD_FAST` (direct C array offset lookup, **~5 nanoseconds**).
   - Global variable lookup uses `LOAD_GLOBAL` (dictionary hash lookup, **~15 nanoseconds**).
   - Local variable access is roughly **3x faster** than global variable access.
2. **Local Binding Optimization**: In tight performance loops, binding global functions (like `math.sin`) to local variables (`local_sin = math.sin`) inside the function avoids repeated global dictionary lookups.

---

## Security Considerations

1. **Global State Leaks in Web Applications**: In multi-tenant async web servers (FastAPI / ASGI), mutable global variables persist across requests, potentially leaking User A's private data to User B. Always store request state in request context or dependency injection containers.
2. **Namespace Injection via `exec()`**: Never execute dynamic code strings with `exec()` without passing an explicit restricted globals dictionary (`exec(code, {"__builtins__": {}}, {})`).

---

## Real-World Usage

- **Decorator Architectures**: Web frameworks (Flask, FastAPI) use closures with `nonlocal` state to implement authentication decorators and timing middleware.
- **Factory Patterns**: Generating customized mathematical or cryptographic functions configured with pre-set security parameters.
- **Encapsulated Private State**: Simulating private object attributes in functional programming without using classes.

---

## Comparison: The LEGB Scope Layers

| Scope | Defined Where? | Bytecode Opcode | Lifetime | Key Modifying Keyword |
|---|---|---|---|---|
| **Local (L)** | Inside current function | `LOAD_FAST` | Function call duration | N/A (Default) |
| **Enclosing (E)**| Outer nested functions | `LOAD_DEREF` | Maintained via Closure Cells | **`nonlocal`** |
| **Global (G)** | Module top-level | `LOAD_GLOBAL` | Process / Module lifetime | **`global`** |
| **Built-in (B)**| Python core runtime | `LOAD_GLOBAL` | Interpreter lifetime | N/A |

---

## Advanced Concepts: The Mechanics of `PyCellObject`

In CPython's C source code (`Objects/cellobject.c`), a cell is a wrapper struct containing an object pointer:

```c
typedef struct {
    PyObject_HEAD
    PyObject *ob_ref; /* Content of the cell */
} PyCellObject;
```

When an enclosing variable is referenced by an inner closure, CPython generates `LOAD_DEREF` and `STORE_DEREF` opcodes, reading and writing to the `ob_ref` pointer directly. This allows both the outer and inner functions to share the exact same physical memory cell across distinct call lifecycles.

---

## Exercises

### Exercise 1 — Beginner
Create a global variable `counter = 0`. Write a function `increment_counter()` that uses the `global` keyword to increment the global counter by 1. Call it three times and verify the global value.

### Exercise 2 — Intermediate
Write a closure factory function `make_discount_calculator(discount_rate: float)` that accepts a discount percentage (e.g., `0.15` for 15%) and returns an inner function that calculates the discounted price for any given subtotal.

### Exercise 3 — Advanced
Build a closure-based `StatefulMemoizer` decorator. The closure must maintain an internal cache dictionary in its enclosing scope. When the decorated function is invoked with arguments, return the cached result if available; otherwise, compute the result, store it in the cache, and return it.

---

## Mini Project: Enterprise Rate Limiter & Sliding Window Quota Engine

### Requirements
Build a production-ready API rate limiter named `sliding_window_limiter.py` using closures, `nonlocal` state tracking, and timestamp filtering to enforce multi-tiered request quotas per client API key.

### Implementation Blueprint
```python
import time

def create_client_rate_limiter(max_requests: int, window_seconds: float):
    """Factory creating a stateful closure that enforces sliding-window rate limits."""
    client_history = {}  # apiKey -> list of timestamps
    
    def check_rate_limit(client_id: str) -> tuple[bool, dict]:
        nonlocal client_history
        now = time.time()
        
        # Initialize client history if missing
        if client_id not in client_history:
            client_history[client_id] = []
            
        # Purge timestamps outside the sliding window
        valid_timestamps = [t for t in client_history[client_id] if now - t < window_seconds]
        client_history[client_id] = valid_timestamps
        
        current_usage = len(valid_timestamps)
        
        if current_usage < max_requests:
            client_history[client_id].append(now)
            remaining = max_requests - (current_usage + 1)
            return True, {
                "allowed": True,
                "client": client_id,
                "current_usage": current_usage + 1,
                "remaining_quota": remaining,
                "window_sec": window_seconds
            }
        else:
            oldest_ts = valid_timestamps[0]
            retry_after = round(window_seconds - (now - oldest_ts), 2)
            return False, {
                "allowed": False,
                "client": client_id,
                "current_usage": current_usage,
                "retry_after_sec": max(0.1, retry_after),
                "error": "HTTP 429: Too Many Requests"
            }
            
    return check_rate_limit

if __name__ == "__main__":
    # Create limiter allowing 3 requests per 1.5 second window
    limiter = create_client_rate_limiter(max_requests=3, window_seconds=1.5)
    
    print("=" * 60)
    print("           SLIDING WINDOW RATE LIMITER TEST")
    print("=" * 60)
    
    client_a = "client_enterprise_99"
    
    for i in range(1, 6):
        allowed, metadata = limiter(client_a)
        timestamp = time.strftime("%H:%M:%S")
        status = "🟢 200 OK" if allowed else "🔴 429 REJECTED"
        print(f"[{timestamp}] Call #{i}: {status} -> {metadata}")
        time.sleep(0.3)
        
    print("\nWaiting 1.6 seconds for quota window to reset...")
    time.sleep(1.6)
    
    allowed, metadata = limiter(client_a)
    print(f"Post-Reset Call: {'🟢 200 OK' if allowed else '🔴 429'} -> {metadata}")
    print("=" * 60)
```

---

## Summary

In this lesson, you mastered Python's variable scoping and namespace architecture:
- Python resolves variable names using the **LEGB Rule (Local $\rightarrow$ Enclosing $\rightarrow$ Global $\rightarrow$ Built-in)**.
- Variable scope is determined statically at compile time; assigning to a variable anywhere in a function makes it local to the entire function scope.
- The `global` keyword re-binds top-level module variables; avoid overusing `global` in production code.
- The `nonlocal` keyword re-binds variables in enclosing outer function frames.
- **Closures** retain access to enclosing free variables via heap-allocated `PyCellObject` cells even after the outer function frame returns.
- Local variable lookup (`LOAD_FAST`) is significantly faster than global variable lookup (`LOAD_GLOBAL`).

---

## Best Practices Checklist

- [ ] Avoid the `global` keyword; pass parameters and return values explicitly.
- [ ] Use `nonlocal` inside closures and decorators for stateful functional encapsulation.
- [ ] Never name variables after Python built-in functions (`list`, `str`, `dict`, `min`, `max`).
- [ ] Use closures for lightweight factory patterns and stateful middleware.
- [ ] Understand `UnboundLocalError`: check if an assignment in the function is accidentally shadowing a global.

---

## What's Next?

Now that you understand function scope and closures, continue to:
👉 **[Lambda Functions](lambda-functions.md)** to master anonymous single-expression functions and functional programming contexts.
