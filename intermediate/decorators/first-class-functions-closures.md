# Closures & First-Class Functions in Python

## Introduction

In Python, functions are not merely static blocks of compiled instructions; they are **First-Class Citizens (First-Class Objects)**. This means a function possesses the exact same status as an integer, string, or list:
1. Functions can be **assigned to variables**.
2. Functions can be **passed as arguments** to other functions.
3. Functions can be **returned as values** from other functions.
4. Functions can be **nested inside other functions** and stored in data structures.

This first-class status unlocks one of the most powerful paradigms in computer science: **Lexical Closures**.

A **Closure** is a nested function that **retains access to variables in its enclosing scope (lexical environment)** even after the outer enclosing function has completed execution and returned. Closures allow developers to encapsulate lightweight, stateful behavior without the overhead of defining full object-oriented classes.

Furthermore, closures are the exact foundational mechanism that powers **Python Decorators**.

This lesson opens **Module 3: Closures & Decorators in Depth**, exploring first-class function mechanics, the CPython `PyCellObject` architecture, free variables, and the `nonlocal` keyword.

---

## Prerequisites

Before studying closures, ensure you have:

- Completed [Scope & Lifetime (LEGB Rule)](../../beginner/functions/scope-and-lifetime.md).
- Completed [Defining Functions & Parameters](../../beginner/functions/defining-functions.md).
- A solid understanding of call stacks and local namespaces.

---

## Core Concept: The Anatomy of a Closure

A closure occurs when three specific criteria are met:
1. There is an **Inner Function** defined inside an **Outer Function**.
2. The inner function references at least one variable defined in the outer function (known as a **Free Variable**).
3. The outer function **returns the inner function object** (not calling it!).

```
                               THE LIFECYCLE OF A CLOSURE

        1. Execute Outer Function: make_multiplier(factor=3)
           • Allocates local variable 'factor = 3'
           • Defines inner function 'multiply(x)' referencing 'factor'
           • Stores 'factor' in a heap-allocated Cell Object (PyCellObject)
           • Returns 'multiply' function reference
           • Outer function frame DESTROYED!
                               │
                               ▼
        2. Assign Returned Function: triple = make_multiplier(3)
           • 'triple' now holds the inner function + captured Cell Object
                               │
                               ▼
        3. Call Closure: triple(10)
           • Accesses captured 'factor = 3' from Cell Object!
           • Returns: 10 * 3 = 30
```

---

## Syntax & Essential Closure Patterns

```python
# 1. Classic Factory Function Closure
def make_multiplier(factor: float):
    # 'factor' is a Free Variable captured by the closure
    def multiply(x: float) -> float:
        return x * factor  # Accesses enclosing scope!
    return multiply  # Return function object (NOT multiply()!)

doubler = make_multiplier(2)
tripler = make_multiplier(3)

print("Doubler (10):", doubler(10)) # 20
print("Tripler (10):", tripler(10)) # 30

# 2. Stateful Counter Closure with 'nonlocal'
def make_counter(start: int = 0):
    count = start

    def increment(step: int = 1) -> int:
        nonlocal count  # Mandatory: Re-binds enclosing variable instead of creating local!
        count += step
        return count

    return increment

counter_a = make_counter(start=100)
print(counter_a())  # 101
print(counter_a(5)) # 106
```

---

## Detailed Explanation

### 1. CPython Under the Hood: `PyCellObject` and Free Variables

How does `multiply(x)` access `factor` after `make_multiplier` has returned and its stack frame has been destroyed?

When CPython compiles a function, it detects if an inner function references a variable from an enclosing scope. If it does:
1. Python marks the identifier as a **Free Variable** (`__code__.co_freevars`).
2. Python allocates a special container object on the heap called a **`PyCellObject` (Cell Object)** to store the variable's memory address.
3. The returned function stores a tuple of these cell objects in its **`__closure__`** attribute.

```python
def outer(msg: str):
    def inner():
        return f"Message: {msg}"
    return inner

closure_fn = outer("Hello World")

# Inspect Free Variables:
print("Free Variables Tuple :", closure_fn.__code__.co_freevars) # ('msg',)

# Inspect Cell Objects:
print("Closure Cells Tuple  :", closure_fn.__closure__)
# Output: (<cell at 0x103...: str object at 0x104...>,)

# Inspect Stored Content Inside Cell:
print("Value Inside Cell     :", closure_fn.__closure__[0].cell_contents) # "Hello World"
```

Because the cell object resides on the heap (not the stack), it lives as long as the closure function reference exists in memory!

---

### 2. The Late-Binding Closure Trap

A notorious trap in Python occurs when creating closures inside loops:

```python
# 🚨 DEADLY ANTI-PATTERN (Late Binding):
multipliers = []
for i in range(3):
    multipliers.append(lambda x: x * i)

# Calling them:
print([m(10) for m in multipliers])
# EXPECTED: [0, 10, 20]
# ACTUAL  : [20, 20, 20] 💥 ALL PRINT 20!
```

#### Why Does This Happen?
Python looks up free variables in closures **when the function is called, NOT when the function is defined**.

By the time `m(10)` is invoked, the loop has finished, and `i` has a final value of `2`. All three closures share the exact same cell object pointing to `i = 2`!

#### The Solution: Default Argument Binding
Use default parameter arguments (`lambda x, i=i: x * i`) to force early evaluation and bind the current loop value at definition time:

```python
# ✅ CORRECT PATTERN (Early Default Binding):
multipliers = [lambda x, i=i: x * i for i in range(3)]
print([m(10) for m in multipliers]) # [0, 10, 20] ✅
```

---

### 3. Mutating Free Variables with `nonlocal`

In Python, assigning to a variable (`count = count + 1`) inside a function creates a **Local Variable** by default. If you try to re-bind an enclosing variable without declaring it, Python raises an `UnboundLocalError`:

```python
def broken_counter():
    count = 0
    def inc():
        # count += 1  # UnboundLocalError: local variable 'count' referenced before assignment! ❌
        pass
```

Declaring **`nonlocal count`** explicitly informs Python that `count` belongs to the nearest enclosing scope, allowing in-place re-binding across function executions.

---

## Examples

### 1. Simple: Configurable Text Formatter Factory
Building custom string prefixers and tag wrappers using closures.

```python
def make_html_tag_wrapper(tag: str):
    """Factory returning a closure that wraps content in HTML tags."""
    def wrap(content: str) -> str:
        return f"<{tag}>{content}</{tag}>"
    return wrap

bold = make_html_tag_wrapper("b")
italic = make_html_tag_wrapper("i")
h1 = make_html_tag_wrapper("h1")

print(bold("Important Notice"))   # "<b>Important Notice</b>"
print(italic("Secondary Text"))   # "<i>Secondary Text</i>"
print(h1("System Dashboard"))     # "<h1>System Dashboard</h1>"
```

### 2. Beginner: Running Cumulative Statistics Tracker
Tracking running averages and variance with stateful closures.

```python
def make_running_averager():
    """Stateful closure that computes cumulative average on every call."""
    history = []

    def averager(new_value: float) -> float:
        history.append(float(new_value))
        return round(sum(history) / len(history), 2)

    return averager

sensor_avg = make_running_averager()
print("Reading 1 (10.0) -> Avg:", sensor_avg(10.0))  # 10.0
print("Reading 2 (20.0) -> Avg:", sensor_avg(20.0))  # 15.0
print("Reading 3 (30.0) -> Avg:", sensor_avg(30.0))  # 20.0
print("Reading 4 (40.0) -> Avg:", sensor_avg(40.0))  # 25.0
```

### 3. Intermediate: Prefix Logger Factory with Secret Masking
Generating specialized logging functions with preset metadata tags and redaction rules.

```python
import datetime

def make_prefix_logger(module_name: str, mask_secrets: bool = True):
    prefix = f"[{module_name.upper()}]"

    def log(message: str, is_secret: bool = False):
        ts = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S")
        if is_secret and mask_secrets:
            display_msg = message[:2] + "****" + message[-2:]
        else:
            display_msg = message
        print(f"{ts} {prefix:<12} │ {display_msg}")

    return log

auth_log = make_prefix_logger("AuthService", mask_secrets=True)
db_log = make_prefix_logger("DatabasePool")

auth_log("User logged in: hesamp")
auth_log("Session token: 9f8e7d6c5b4a3210", is_secret=True)
db_log("Connected to postgres://10.0.0.1:5432")
```

### 4. Real-World: Stateful Rate Limiter Token Bucket Closure
Creating a lightweight rate-limiting closure that enforces API call quotas without defining a class.

```python
import time

def make_rate_limiter(max_tokens: int, refill_interval_sec: float):
    tokens = max_tokens
    last_check = time.time()

    def allow_request(cost: int = 1) -> bool:
        nonlocal tokens, last_check
        now = time.time()
        elapsed = now - last_check
        
        # Refill tokens based on elapsed time
        refilled_tokens = elapsed / refill_interval_sec
        tokens = min(max_tokens, tokens + refilled_tokens)
        last_check = now

        if tokens >= cost:
            tokens -= cost
            return True
        return False

    return allow_request

is_allowed = make_rate_limiter(max_tokens=3, refill_interval_sec=0.5)

print("Call 1:", is_allowed())  # True
print("Call 2:", is_allowed())  # True
print("Call 3:", is_allowed())  # True
print("Call 4:", is_allowed())  # False (Rate limited!)
```

### 5. Advanced: Shared Cell Objects Between Sibling Closures
Demonstrating how two sibling closures defined inside the same parent scope share a single mutable `PyCellObject`.

```python
def make_shared_bank_account(initial_balance: float):
    balance = float(initial_balance)

    def deposit(amount: float) -> float:
        nonlocal balance
        balance += amount
        return balance

    def withdraw(amount: float) -> float:
        nonlocal balance
        if amount > balance:
            raise ValueError("Insufficient funds.")
        balance -= amount
        return balance

    def get_balance() -> float:
        return balance

    # Return dictionary of sibling closures sharing the same 'balance' Cell!
    return {"deposit": deposit, "withdraw": withdraw, "get_balance": get_balance}

acc = make_shared_bank_account(100.0)

# Verify they share the exact same cell object in RAM:
cell_dep = acc["deposit"].__closure__[0]
cell_wth = acc["withdraw"].__closure__[0]
print("Are deposit & withdraw sharing the exact same Cell?", cell_dep is cell_wth) # True!

acc["deposit"](50.0)
print("Balance after deposit  :", acc["get_balance"]()) # 150.0
acc["withdraw"](30.0)
print("Balance after withdraw :", acc["get_balance"]()) # 120.0
```

---

## Code Explanation

In Example 5 (`make_shared_bank_account`):
1. The outer function creates a single local variable `balance = 100.0`.
2. Python compiles `deposit`, `withdraw`, and `get_balance` to point to the **exact same `PyCellObject`**.
3. When `acc["deposit"](50.0)` updates `balance`, the cell object's content is modified in-place.
4. Calling `acc["get_balance"]()` immediately sees the new value because it reads from the exact same memory address.
5. This proves that closures provide full **Private Encapsulation** in pure functional programming without writing a single `class` definition.

---

## Common Mistakes

### Mistake 1: Late Binding in Loops
Creating lambda closures inside loops without default argument binding causes all closures to evaluate to the loop's final state.

### Mistake 2: Missing `nonlocal` on Re-binding
Assigning `count = count + 1` inside an inner function without `nonlocal` raises an `UnboundLocalError`.

---

## Best Practices

### Use Closures for Lightweight Stateful Handlers
When you need to maintain 1 or 2 state variables across function invocations (such as counters, prefix tags, or moving averages), prefer closures over heavyweight class definitions.

Good:
```python
def make_id_generator(prefix: str):
    count = 0
    def get_id():
        nonlocal count
        count += 1
        return f"{prefix}-{count:04d}"
    return get_id
```

---

## Performance Considerations

1. **Cell Object Lookup Overhead**: Accessing a free variable via a `PyCellObject` dereference takes ~$15\text{ nanoseconds}$, slightly faster than a standard object attribute dictionary lookup (`self.attr` at ~$50\text{ nanoseconds}$).
2. **Memory Retention**: Closures retain references to all captured variables until the closure function itself is garbage collected. Avoid closing over massive 500 MB data frames if you only need a single integer identifier.

---

## Security Considerations

1. **Leaking Sensitive Tokens in Long-Lived Closures**: If a closure captures a dictionary containing an API master key, that key remains in memory for the lifetime of the closure. Explicitly delete or zero out sensitive variables if they are no longer needed.
2. **Immutability of Closed State**: Closures provide true private state: external code cannot easily mutate `__closure__[0].cell_contents` directly in standard code without using low-level C-extension hacks.

---

## Real-World Usage

- **Python Decorators Framework**: Every decorator is structurally a closure that wraps a target function.
- **GUI Event Callbacks (Tkinter / PyQt)**: Passing parameter-bound callback handlers to button click events.
- **FastAPI / Flask Middleware Factories**: Generating configured request interceptors.

---

## Comparison: State Encapsulation Approaches

| Approach | Syntax | Memory Overhead | Complexity | Best Fit |
|---|---|---|---|---|
| **Closure** | `def outer(): def inner():` | **Very Low (`PyCellObject`)** | **Low** | **Lightweight state, Decorators, Factories** |
| **Class with `__call__`**| `class Callable: __call__` | Moderate (`__dict__`) | Moderate | Complex multi-method stateful engines |
| **Global Variable** | `global x` | Minimal | Fragile | **AVOID in production** |

---

## Advanced Concepts: Inspecting Shared Closures in Memory

You can programmatically verify cell object addresses using `id()`:

```python
def demo(x):
    def f(): return x
    def g(): return x
    return f, g

f, g = demo(42)
print("Address of f's cell:", hex(id(f.__closure__[0])))
print("Address of g's cell:", hex(id(g.__closure__[0])))
# Both addresses are 100% IDENTICAL!
```

---

## Exercises

### Exercise 1 — Beginner
Write a closure factory `make_power_calculator(exponent: int)` that returns a function calculating $x^{\text{exponent}}$. Test with squares (`exp=2`) and cubes (`exp=3`).

### Exercise 2 — Intermediate
Build a `make_memoized_multiplier(factor: int)` closure that caches previously computed results in an internal dictionary, returning the cached result if the input was already calculated.

### Exercise 3 — Advanced
Build a `make_event_dispatcher()` closure that maintains an internal registry mapping event names (`"LOGIN"`, `"LOGOUT"`) to lists of callback functions. Return a dictionary of closures: `{"subscribe": sub_fn, "emit": emit_fn}`.

---

## Mini Project: Enterprise Dynamic API Client Factory with Stateful Header Closures

### Requirements
Build an API request client factory named `api_client_factory.py`. Using closures and first-class functions, generate configured HTTP request dispatchers with pre-bound base URLs, authentication headers, retry policies, and session token renewal closures.

### Implementation Blueprint
```python
import time
import random
from typing import Callable

def make_api_client(base_url: str, default_auth_token: str, max_retries: int = 3) -> dict[str, Callable]:
    """Factory returning a suite of closure endpoints sharing a stateful authentication session."""
    active_token = default_auth_token
    request_counter = 0
    endpoint_base = base_url.rstrip("/")

    def _execute_request(method: str, path: str, payload: dict = None) -> dict:
        nonlocal request_counter
        request_counter += 1
        clean_path = path.lstrip("/")
        full_url = f"{endpoint_base}/{clean_path}"

        headers = {
            "Authorization": f"Bearer {active_token}",
            "X-Request-ID": f"REQ-{request_counter:06d}",
            "User-Agent": "EnterpriseClosureClient/2.0"
        }

        print(f"\n🌐 [{method}] {full_url}")
        print(f"   Headers: Auth=Bearer {active_token[:4]}**** | ReqID={headers['X-Request-ID']}")

        # Simulate transient network retry loop
        attempt = 1
        while attempt <= max_retries:
            # Simulate random network latency & success
            if random.random() < 0.1 and attempt < max_retries:
                print(f"   ⚠️ [RETRY {attempt}] Transient timeout. Retrying...")
                attempt += 1
                continue
            return {"status": 200, "url": full_url, "data": payload or {"msg": "SUCCESS"}}

        raise ConnectionError("Max retries exceeded.")

    # Closure Methods
    def get(path: str) -> dict:
        return _execute_request("GET", path)

    def post(path: str, payload: dict) -> dict:
        return _execute_request("POST", path, payload)

    def rotate_token(new_token: str):
        nonlocal active_token
        old = active_token[:4]
        active_token = new_token
        print(f"\n🔑 [SECURITY] Rotated auth token from '{old}****' -> '{active_token[:4]}****'")

    def get_telemetry() -> dict:
        return {"base_url": endpoint_base, "total_requests": request_counter}

    return {
        "get": get,
        "post": post,
        "rotate_token": rotate_token,
        "telemetry": get_telemetry
    }

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE STATEFUL API CLIENT CLOSURE FACTORY")
    print("=" * 65)
    
    # 1. Instantiate Closure Client
    stripe_client = make_api_client(
        base_url="https://api.stripe.com/v1",
        default_auth_token="sk_live_alpha9901",
        max_retries=2
    )
    
    # 2. Execute GET and POST Requests
    stripe_client["get"]("/customers/CUST-101")
    stripe_client["post"]("/charges", {"amount": 250.00, "currency": "usd"})
    
    # 3. Rotate Security Token in Enclosing Scope
    stripe_client["rotate_token"]("sk_live_beta4482")
    
    # 4. Subsequent Request Uses Rotated Token Automatically!
    stripe_client["get"]("/invoices/INV-990")
    
    # 5. Inspect Session Telemetry
    stats = stripe_client["telemetry"]()
    print("\n📊 Client Telemetry Summary:", stats)
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's first-class functions and closures:
- **First-Class Functions** can be passed as arguments, returned, assigned to variables, and stored in collections.
- A **Closure** is an inner function that retains access to **Free Variables** from its enclosing scope after the outer function has returned.
- CPython preserves closure state on the heap using **`PyCellObject`** tuples in **`fn.__closure__`**.
- Prevent the **Late-Binding Loop Trap** using default argument binding (`lambda x, i=i: x * i`).
- Use the **`nonlocal`** keyword to mutate and re-bind enclosing primitive variables across function calls.
- Closures provide private encapsulation and serve as the architectural foundation of **Decorators**.

---

## Best Practices Checklist

- [ ] Use closures for lightweight state encapsulation and factory functions.
- [ ] Bind loop variables early with default arguments (`i=i`) to avoid late-binding bugs.
- [ ] Declare `nonlocal` explicitly when re-binding enclosing variables.
- [ ] Inspect closure cell objects via `__closure__` and `__code__.co_freevars` when debugging.
- [ ] Clean up references to massive datasets in closures to prevent memory leaks.

---

## What's Next?

Now that you understand first-class functions and closures, continue to:
👉 **[Function Decorators & Wrapper Architecture](function-decorators.md)** to master the `@decorator` syntax, `*args`/`**kwargs` forwarding, and `@functools.wraps`!
