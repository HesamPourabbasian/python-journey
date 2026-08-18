# Function Parameters & Arguments in Python

## Introduction

Functions achieve their power and flexibility through their interfaces. To design reusable, resilient, and expressive software components, an engineer must have complete command over how functions accept, validate, and unpack input data.

In software engineering discourse, the terms **Parameter** and **Argument** are often used interchangeably, but they represent two distinct concepts:
- **Parameter**: The variable name declared in the function definition header (e.g., `def greet(name):`).
- **Argument**: The concrete value passed to the function at the call-site (e.g., `greet("Hesam")`).

Python provides one of the richest and most versatile argument-binding systems of any modern programming language. In addition to standard positional and keyword arguments, Python supports default parameter values, variable-length positional tuples (`*args`), variable-length keyword dictionaries (`**kwargs`), **Positional-Only parameters (`/`, PEP 570)**, and **Keyword-Only parameters (`*`)**.

Mastering function parameters requires understanding the **Signature Ordering Hierarchy**, how CPython binds arguments to parameters at the bytecode level, and how to permanently avoid the notorious **"Mutable Default Argument Trap."**

This lesson builds directly upon [Defining Functions](defining-functions.md), equipping you with the architectural knowledge needed to build professional, self-documenting APIs.

---

## Prerequisites

Before studying parameters and arguments, ensure you have:

- Completed [Defining Functions](defining-functions.md).
- Completed [Tuples & Unpacking](../collections/tuples.md) and [Dictionaries](../collections/dictionaries.md).
- A solid understanding of Python's mutability model (`id()` and object referencing).

---

## Core Concept

Python's parameter-binding system allows callers to pass arguments positionally, by name, or via unpacked containers.

```
                         THE COMPLETE PARAMETER ORDERING HIERARCHY

   def function_signature(
       pos_only_1, pos_only_2,   / ,   # 1. Positional-Only (Before '/')
       standard_1, standard_2,         # 2. Standard Positional-or-Keyword
       *args,                          # 3. Var-Length Positional Tuple
       kw_only_1,  kw_only_2=default,  # 4. Keyword-Only (After '*' or '*args')
       **kwargs                        # 5. Var-Length Keyword Dictionary
   ):
       pass
```

### Parameter Types Breakdown:
1. **Positional-Only (`/`)**: Must be passed by position; cannot be called using keyword syntax (`name=val`).
2. **Standard (Positional or Keyword)**: Can be passed either positionally or by keyword name.
3. **`*args`**: Collects excess positional arguments into a `tuple`.
4. **Keyword-Only (`*` or after `*args`)**: Must be passed explicitly by keyword name.
5. **`**kwargs`**: Collects excess keyword arguments into a `dict`.

---

## Syntax & Essential Signatures

```python
# 1. Positional and Keyword Arguments at Call-Site
def create_profile(username: str, role: str = "Viewer", is_active: bool = True):
    print(f"User: {username}, Role: {role}, Active: {is_active}")

create_profile("hesam")                               # Uses defaults
create_profile("sarah", role="Admin")                 # Positional + Keyword
create_profile(role="Editor", username="alex")        # Pure Keyword (Order does not matter!)

# 2. Variable-Length Arguments (*args and **kwargs)
def log_event(event_type: str, *details, **metadata):
    print(f"Event: {event_type}")
    print(f"Details Tuple : {details}")
    print(f"Metadata Dict : {metadata}")

log_event("USER_LOGIN", "IP: 192.168.1.1", "Browser: Chrome", user_id=101, session="xyz")

# 3. Positional-Only (/) and Keyword-Only (*) Signatures (Python 3.8+)
def configure_service(service_name: str, /, timeout: int = 30, *, secure: bool = True):
    # 'service_name' MUST be positional
    # 'timeout' can be positional or keyword
    # 'secure' MUST be passed as keyword!
    pass

configure_service("AuthService", 60, secure=True)     # Valid ✅
# configure_service(service_name="AuthService")       # Raises TypeError! ❌
# configure_service("AuthService", 60, True)          # Raises TypeError! ❌
```

---

## Detailed Explanation

### 1. The Mutable Default Argument Trap Deep Dive

One of the most famous traps in Python programming occurs when a mutable object (such as a `list` or `dict`) is used as a default parameter value:

```python
# THE BUG: The default list is created ONCE when the def statement executes!
def append_to_cache(item: str, cache: list = []):
    cache.append(item)
    return cache

print(append_to_cache("first"))   # ['first']
print(append_to_cache("second"))  # ['first', 'second'] ❌ Shared state leaked!
```

#### Why Does This Happen?
In Python, default parameter values are **not evaluated at runtime when the function is called**; they are evaluated **once at compile/definition time** and stored in the function object's `__defaults__` tuple:

```python
print(append_to_cache.__defaults__)  # (['first', 'second'],) -> Stores the live mutable list!
```

#### The Professional Solution: Use `None` as the Default Sentinel
```python
def append_to_cache_safe(item: str, cache: list = None):
    if cache is None:
        cache = []  # Fresh list allocated on each invocation
    cache.append(item)
    return cache

print(append_to_cache_safe("first"))   # ['first'] ✅
print(append_to_cache_safe("second"))  # ['second'] ✅
```

---

### 2. Positional-Only Parameters (`/`) (PEP 570)

Introduced in Python 3.8, the slash `/` marks all preceding parameters as **Positional-Only**.

**Why is this needed?**
1. **API Refactoring Freedom**: If parameters are positional-only, library maintainers can rename internal parameter names without breaking callers who might have passed keyword arguments.
2. **Semantic Clarity**: Mathematical functions (such as `math.sin(x)` or `len(obj)`) have no semantic need for parameter names at the call-site (`len(obj="abc")` is unreadable).

```python
def calculate_hypot(x: float, y: float, /) -> float:
    return (x**2 + y**2) ** 0.5

print(calculate_hypot(3.0, 4.0))  # 5.0
# calculate_hypot(x=3.0, y=4.0)   # Raises TypeError: calculate_hypot() got some positional-only arguments passed as keyword arguments
```

---

### 3. Keyword-Only Parameters (`*`)

Placing a bare asterisk `*` in a function signature mandates that all subsequent parameters **must be passed as keyword arguments**:

**Why is this needed?**
It prevents "boolean flag confusion" at the call-site. Calling `set_user_status("alice", True, False, True)` is incomprehensible to a code reviewer. Forcing keyword arguments `set_user_status("alice", is_active=True, notify=False, is_admin=True)` makes code self-documenting and safe.

```python
def transfer_funds(from_acc: str, to_acc: str, amount: float, *, allow_overdraft: bool = False):
    print(f"Transferring ${amount} from {from_acc} to {to_acc} (Overdraft: {allow_overdraft})")

# transfer_funds("A101", "B202", 500.0, True)  # TypeError: transfer_funds() takes 3 positional arguments but 4 were given
transfer_funds("A101", "B202", 500.0, allow_overdraft=True)  # Clean & Self-Documenting! ✅
```

---

## Examples

### 1. Simple: Container Unpacking at Call-Site
Using `*` and `**` to unpack lists and dictionaries into function calls.

```python
def register_server(hostname: str, ip: str, port: int, ssl: bool = True):
    print(f"Server '{hostname}' -> {ip}:{port} (SSL: {ssl})")

# Unpacking a positional tuple/list with *
connection_info = ("db-primary", "192.168.1.10", 5432)
register_server(*connection_info)

# Unpacking a dictionary with **
server_kwargs = {"hostname": "web-edge", "ip": "10.0.0.1", "port": 443, "ssl": True}
register_server(**server_kwargs)
```

### 2. Beginner: Safe Formatting Utility with Variadic `*args`
Building a function that computes weighted averages over variable-length inputs.

```python
def compute_weighted_average(*values: float, weight: float = 1.0) -> float:
    """Accept an arbitrary number of float values and apply a global weight factor."""
    if not values:
        return 0.0
    raw_avg = sum(values) / len(values)
    return raw_avg * weight

print("Average (3 items) :", compute_weighted_average(10.0, 20.0, 30.0))
print("Weighted (4 items):", compute_weighted_average(85.0, 90.0, 95.0, 100.0, weight=1.1))
```

### 3. Intermediate: Generic Decorator / Proxy Wrapper with `*args, **kwargs`
Creating a higher-order wrapper function that logs execution time and passes arbitrary arguments transparently.

```python
import time
from typing import Callable, Any

def audit_logger(func: Callable) -> Callable:
    """Transparently proxy any function, logging inputs and execution time."""
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        func_name = func.__name__
        print(f"⏱️ [START] Executing '{func_name}' with args={args}, kwargs={kwargs}")
        start_time = time.perf_counter()
        
        # Pass all arguments through transparently
        result = func(*args, **kwargs)
        
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        print(f"🏁 [FINISH] '{func_name}' completed in {elapsed_ms:.3f}ms -> Result: {result}")
        return result
        
    return wrapper

@audit_logger
def compute_compound_growth(principal: float, rate: float, years: int) -> float:
    return round(principal * ((1.0 + rate) ** years), 2)

growth = compute_compound_growth(10_000.0, rate=0.07, years=5)
```

### 4. Real-World: Modern REST API Client Request Builder
Designing an enterprise HTTP client function using the full spectrum of parameter constraints (`/`, standard, `*args`, `*`, `**kwargs`).

```python
def send_http_request(
    method: str, url: str, /,              # Positional-Only (HTTP method and URL)
    payload: dict = None,                  # Standard positional-or-keyword
    *,
    timeout_sec: float = 30.0,             # Keyword-Only mandatory options
    retry_count: int = 3,
    headers: dict = None,
    **extra_options                        # Dynamic query params or cookies
) -> dict:
    headers_dict = headers if headers is not None else {}
    payload_dict = payload if payload is not None else {}
    
    print("=" * 55)
    print(f"HTTP Request: {method.upper()} {url}")
    print(f"  Timeout: {timeout_sec}s | Retries: {retry_count}")
    print(f"  Headers: {headers_dict}")
    print(f"  Payload: {payload_dict}")
    print(f"  Extras : {extra_options}")
    print("=" * 55)
    
    return {"status": 200, "url": url}

# Call with clean, self-documenting keyword parameters
send_http_request(
    "POST", "https://api.domain.com/v1/users",
    {"username": "hesam", "role": "admin"},
    timeout_sec=15.0,
    retry_count=5,
    headers={"Authorization": "Bearer tok_9981"},
    verify_ssl=True,
    tag="auth_service"
)
```

### 5. Advanced: Programmatic Signature Introspection with `inspect.signature`
Using Python's standard `inspect` module to dynamically validate arguments before executing a function.

```python
import inspect

def sample_service_endpoint(user_id: int, action: str, *, notify: bool = False, priority: int = 1):
    pass

sig = inspect.signature(sample_service_endpoint)
print("Function Signature Inspection:")
print(f" -> Full Signature : {sig}")
print(f" -> Parameters     :")
for name, param in sig.parameters.items():
    print(f"    - {name:<12} (Kind: {param.kind.name:<20}, Default: {param.default})")

# Bind arguments dynamically to test legality
bound = sig.bind(1042, "PURGE_CACHE", notify=True)
print("\nBound Arguments Successfully:", bound.arguments)
```

---

## Code Explanation

In Example 5 (Signature Introspection):
1. `inspect.signature(func)` parses the internal code object and extracts formal parameter metadata.
2. `param.kind` classifies parameters into standard enum constants:
   - `POSITIONAL_ONLY` (before `/`)
   - `POSITIONAL_OR_KEYWORD` (standard)
   - `VAR_POSITIONAL` (`*args`)
   - `KEYWORD_ONLY` (after `*`)
   - `VAR_KEYWORD` (`**kwargs`)
3. `sig.bind(*args, **kwargs)` tests whether a set of arguments legally satisfies the signature without actually executing the function body, raising `TypeError` on missing or illegal arguments.
4. This mechanism powers dependency injection frameworks (FastAPI, Pytest fixtures) and automated API schema generators.

---

## Common Mistakes

### Mistake 1: Placing Non-Default Parameters After Default Parameters
In function definitions, parameters without defaults must appear **before** parameters with defaults.

```python
# BROKEN:
# def create_user(role="Viewer", username):  # SyntaxError: non-default argument follows default argument
#     pass

# CORRECT:
def create_user(username, role="Viewer"):
    pass
```

### Mistake 2: Passing Duplicate Arguments Positionally and by Keyword
Passing a value for a parameter positionally and then providing a keyword argument for the same name raises a `TypeError`.

```python
def set_port(port: int = 8080):
    pass

# BROKEN:
# set_port(9000, port=9000)  # TypeError: set_port() got multiple values for argument 'port'
```

---

## Best Practices

### Use Keyword-Only Arguments for Boolean Configuration Flags
Never design APIs with multiple consecutive positional boolean flags. Always enforce keyword-only syntax for flags.

Good:
```python
def export_dataset(filename: str, *, compress: bool = True, include_headers: bool = True):
    pass

export_dataset("report.csv", compress=False, include_headers=True)
```

Avoid:
```python
def export_dataset(filename: str, compress: bool = True, include_headers: bool = True):
    pass

export_dataset("report.csv", False, True)  # Cryptic magic boolean values
```

---

## Performance Considerations

1. **Positional Argument Speed**: Passing arguments positionally (`func(a, b)`) is slightly faster than passing keyword arguments (`func(a=1, b=2)`) because positional parameters are indexed directly in CPython's local variable C array (`f_localsplus`) without hash dictionary parsing.
2. **`*args` Allocation**: When `*args` is used, CPython allocates a `tuple` to hold the values. In hot loops called millions of times per second, prefer explicit fixed positional parameters if the argument count is constant.

---

## Security Considerations

1. **`**kwargs` Injection Vulnerabilities**: When passing `**kwargs` into downstream database drivers, ORMs, or subprocess calls, unvalidated user dictionaries can inject arbitrary parameters (e.g., unintended SQL parameters or shell options). Always whitelist permitted keys.
2. **Parameter Tampering via Defaults**: Never assume default arguments cannot be mutated if mutable objects are mistakenly used in `def`. Always use `None` sentinels.

---

## Real-World Usage

- **FastAPI / Pydantic Dependency Injection**: Inspecting function parameters (`query: str = Depends(...)`) to automatically extract and validate HTTP query params.
- **Pytest Fixtures**: Resolving test dependencies by matching function parameter names to registered fixture names.
- **Decorator Design**: Standardizing on `def wrapper(*args, **kwargs): return func(*args, **kwargs)` for 100% transparent function wrapping.

---

## Comparison: Parameter Types Matrix

| Parameter Kind | Syntax Marker | Call-Site Requirement | Primary Purpose |
|---|---|---|---|
| **Positional-Only** | Before `/` | Position only (`f(10)`) | Mathematical functions, API refactoring safety |
| **Standard** | No marker | Position or Keyword (`f(10)` or `f(x=10)`) | Standard general parameters |
| **`*args`** | `*args` | Arbitrary positional stream | Variadic inputs (e.g., `sum`, `math.hypot`) |
| **Keyword-Only** | After `*` or `*args`| Name mandatory (`f(flag=True)`) | Configuration flags, options, booleans |
| **`**kwargs`** | `**kwargs` | Arbitrary named pairs | Extension metadata, proxy wrappers |

---

## Advanced Concepts: The `__kwdefaults__` Attribute

While positional and standard defaults are stored in `func.__defaults__`, keyword-only default values are stored separately in the function object's `__kwdefaults__` dictionary:

```python
def configure(host: str = "localhost", *, timeout: int = 30, debug: bool = False):
    pass

print("Standard Defaults   (__defaults__)   :", configure.__defaults__)    # ('localhost',)
print("KW-Only Defaults    (__kwdefaults__) :", configure.__kwdefaults__)  # {'timeout': 30, 'debug': False}
```

This structural separation guarantees that keyword-only arguments are evaluated independently of positional offset indexes.

---

## Exercises

### Exercise 1 — Beginner
Write a function `calculate_bmi(weight_kg: float, height_m: float, /, *, round_digits: int = 2) -> float` using positional-only syntax for weight and height, and keyword-only syntax for `round_digits`. Test valid and invalid calls.

### Exercise 2 — Intermediate
Write a function `format_query_url(base_url: str, *path_segments: str, https: bool = True, **query_params: str) -> str` that joins `base_url` with variable `path_segments` using `/`, prepends `"https://"` or `"http://"`, and appends formatted `?key=value&...` query parameters from `**kwargs`.

### Exercise 3 — Advanced
Build a `DynamicCommandDispatcher` class. Implement a decorator `@dispatcher.register(command_name)` that inspects registered handler function signatures using `inspect.signature()`. When `dispatcher.execute(command_name, **raw_params)` is invoked, it must match, filter, and pass only the parameters accepted by the registered handler, discarding irrelevant extras.

---

## Mini Project: Enterprise HTTP Request Builder & Generic API Client

### Requirements
Build a resilient HTTP request builder named `api_client_builder.py` that enforces strict parameter separation: positional-only for HTTP method and base endpoint, keyword-only for authentication tokens and timeouts, and `*args`/`**kwargs` for headers and payload formatting.

### Implementation Blueprint
```python
class APIRequestBuilder:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def request(
        self,
        method: str,
        endpoint: str,
        /,                                # Positional-Only: Method & Endpoint
        payload: dict = None,             # Standard: Optional body payload
        *,
        auth_token: str = None,           # Keyword-Only: Security credentials
        timeout_sec: float = 10.0,        # Keyword-Only: Timeout
        headers: dict = None,             # Keyword-Only: Custom headers
        **query_params: str               # Variadic: URL Query Parameters
    ) -> dict:
        # Build normalized URL
        clean_endpoint = endpoint.strip("/")
        full_url = f"{self.base_url}/{clean_endpoint}"
        
        # Assemble query string from **query_params
        if query_params:
            query_string = "&".join(f"{k}={v}" for k, v in query_params.items())
            full_url += f"?{query_string}"
            
        # Assemble headers
        active_headers = headers.copy() if headers is not None else {}
        if auth_token:
            active_headers["Authorization"] = f"Bearer {auth_token}"
        active_headers.setdefault("Content-Type", "application/json")
        
        return {
            "method": method.upper(),
            "url": full_url,
            "headers": active_headers,
            "payload": payload or {},
            "timeout": timeout_sec
        }

if __name__ == "__main__":
    client = APIRequestBuilder("https://api.enterprise.cloud/v2")
    
    # Generate GET Request with query parameters
    req1 = client.request(
        "GET", "/users",
        auth_token="sec_token_99182",
        timeout_sec=5.0,
        page="1",
        limit="50",
        sort="desc"
    )
    
    # Generate POST Request with payload
    req2 = client.request(
        "POST", "/users/register",
        payload={"username": "hesam", "role": "admin"},
        auth_token="sec_token_99182",
        headers={"X-Custom-Client": "PythonSDK-v3"}
    )
    
    import pprint
    print("=" * 60)
    print("           ENTERPRISE API REQUEST BUILDER OUTPUT")
    print("=" * 60)
    print("\n--- GET Request Configuration ---")
    pprint.pprint(req1)
    print("\n--- POST Request Configuration ---")
    pprint.pprint(req2)
    print("=" * 60)
```

---

## Summary

In this lesson, you mastered Python's function parameters and arguments architecture:
- Parameters are defined in the function header; arguments are passed at the call-site.
- Parameter signature order: `(pos_only, /, standard, *args, kw_only, **kwargs)`.
- **The Mutable Default Trap**: Default values are evaluated once at definition time; always use `None` as the default sentinel for mutable objects.
- **Positional-Only (`/`)** enforces positional calling and grants API refactoring freedom.
- **Keyword-Only (`*`)** enforces self-documenting call-sites and eliminates boolean flag ambiguities.
- Use `*args` for variadic tuples and `**kwargs` for dynamic dictionary options.

---

## Best Practices Checklist

- [ ] Always use `None` as the default value for mutable parameters (`list`, `dict`, `set`).
- [ ] Use keyword-only arguments (`*`) for boolean flags and optional configurations.
- [ ] Use positional-only syntax (`/`) for mathematical functions and API stability.
- [ ] Transparently forward arguments in decorators using `*args, **kwargs`.
- [ ] Inspect dynamic function signatures using `inspect.signature()`.

---

## What's Next?

Now that you understand function parameter mechanics, continue to:
👉 **[Variable Scope & The LEGB Rule](scope-and-lifetime.md)** to master namespaces, variable lifetimes, closures, and the `global` and `nonlocal` keywords.
