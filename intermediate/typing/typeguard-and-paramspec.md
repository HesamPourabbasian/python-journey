# TypeGuard, ParamSpec & Advanced Typing in Python

## Introduction

As Python's static typing ecosystem matured, developers encountered two fundamental limitations in basic type hints:

1. **The Decorator Signature Problem**: Standard type variables (`TypeVar`) can represent single types, but they cannot capture the variable-length positional and keyword argument signatures of arbitrary functions (`*args`, `**kwargs`). Consequently, wrapping a function in a decorator previously forced developers to annotate it as `Callable[..., Any]`, destroying IDE parameter autocompletion and static type safety.
2. **The Type Narrowing Limitation**: Built-in type narrowing only works for simple `isinstance(x, Class)` checks. If you write a custom helper function to verify that a dictionary contains a valid user payload or that a list contains only strings, static type checkers could not propagate that validation into subsequent `if` branches.

To solve these advanced metaprogramming challenges, Python introduced a suite of advanced typing primitives:
- **`ParamSpec` and `Concatenate` (PEP 612, Python 3.10)**: Captures and forwards full parameter signatures across decorator wrappers and parameter injection pipelines.
- **`TypeGuard` (PEP 647, Python 3.10)**: Enables user-defined type-narrowing functions.
- **`Self` (PEP 673, Python 3.11)**: Annotates methods in fluent builder hierarchies returning instances of their current class.
- **`Annotated` (PEP 593, Python 3.9)**: Attaches runtime metadata and constraints to static types (heavily used in **FastAPI** and **Pydantic**).

This lesson explores these advanced typing constructs to master production-grade metaprogramming.

---

## Prerequisites

Before studying advanced typing, ensure you have:

- Completed [Function Decorators & Wrapper Architecture](../decorators/function-decorators.md).
- Completed [Generics & TypeVar](generics-and-typevar.md).
- Completed [Structural Subtyping with Protocol](typing-protocols-and-duck-typing.md).

---

## Core Concept: ParamSpec & TypeGuard in Action

```
                      ParamSpec & TypeGuard ARCHITECTURAL ROLES

       1. ParamSpec (PEP 612): DECORATOR SIGNATURE PRESERVATION
     ┌─────────────────────────────────────────────────────────────┐
     │ P = ParamSpec("P"), R = TypeVar("R")                        │
     │ def timer(fn: Callable[P, R]) -> Callable[P, R]: ...        │
     │ # Target: def greet(name: str, repeat: int = 1) -> str: ... │
     │ # @timer greet(name="Hesam", repeat=3)                      │
     │ Preserves EXACT keyword names, defaults, and return types!  │
     └─────────────────────────────────────────────────────────────┘

       2. TypeGuard (PEP 647): USER-DEFINED TYPE NARROWING
     ┌─────────────────────────────────────────────────────────────┐
     │ def is_str_list(val: list[object]) -> TypeGuard[list[str]]: │
     │     return all(isinstance(x, str) for x in val)             │
     │                                                             │
     │ if is_str_list(data):                                       │
     │     # Mypy KNOWS data is list[str] inside this block! ✅     │
     │     print(data[0].upper())                                  │
     └─────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Advanced Typing Patterns

```python
from __future__ import annotations
from typing import TypeVar, Callable, ParamSpec, Concatenate, TypeGuard, Self, Annotated

# 1. TypeGuard (PEP 647): Custom Type Narrowing
def is_string_list(items: list[object]) -> TypeGuard[list[str]]:
    """Type guard function that narrows list[object] to list[str]."""
    return all(isinstance(i, str) for i in items)

# 2. ParamSpec (PEP 612): Full Decorator Signature Preservation
P = ParamSpec("P")
R = TypeVar("R")

def logging_decorator(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Executing: {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@logging_decorator
def calculate_payout(base: float, bonus_pct: float = 0.15) -> float:
    return base * (1.0 + bonus_pct)

# IDE knows exact parameter names (base, bonus_pct) and return type (float)!
payout = calculate_payout(10000.0, bonus_pct=0.20)

# 3. Self (PEP 673): Fluent Method Chaining
class QueryBuilder:
    def __init__(self): self._query = ""
    def filter_by(self, field: str, value: str) -> Self:
        self._query += f" WHERE {field} = '{value}'"
        return self

# 4. Annotated (PEP 593): Runtime Metadata Decoration
# Attaching metadata (e.g. max length constraint = 50) to a string type
ValidatedUsername = Annotated[str, "Max length: 50", "Must be alphanumeric"]
```

---

## Detailed Explanation

### 1. The Power of `ParamSpec` and `Concatenate`

Before `ParamSpec`, decorators had to choose between two bad options:
- Use `Callable[..., R]`: Lost all parameter types, IDE hints, and default values.
- Use fixed generic arguments `Callable[[A, B], R]`: Could only decorate functions with that exact 2-argument signature.

`ParamSpec` captures the entire parameter signature (positional args, keyword args, optional defaults, variadic `*args`, and `**kwargs`) as a single type bundle `P`.

#### Injecting Parameters with `Concatenate`:
When a decorator **adds or removes a parameter** (e.g. injecting an authenticated `user: User` as the first argument), use **`Concatenate`**:

$$\textbf{Callable}[\textbf{Concatenate}[\text{InjectedType}, P], R]$$

```python
from typing import ParamSpec, TypeVar, Callable, Concatenate

P = ParamSpec("P")
R = TypeVar("R")

class DatabaseSession:
    def execute(self, q: str): print(f"Executing: {q}")

# Decorator that automatically creates and injects a DatabaseSession into the wrapped function!
def with_db_session(func: Callable[Concatenate[DatabaseSession, P], R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        session = DatabaseSession()
        # Injects session as the first argument, followed by caller's arguments!
        return func(session, *args, **kwargs)
    return wrapper

# Notice: The decorated function requires 'db' as its first parameter:
@with_db_session
def query_user_records(db: DatabaseSession, user_id: int) -> dict:
    db.execute(f"SELECT * FROM users WHERE id = {user_id}")
    return {"id": user_id, "status": "ACTIVE"}

# Caller does NOT pass 'db'! The decorator provides it:
user = query_user_records(user_id=101)  # Fully type-safe! Mypy verified! ✅
```

---

### 2. Fluent Method Chaining with `typing.Self` (PEP 673)

When building the **Builder Pattern** with inheritance, a method returning `self` must return the type of the **derived subclass**, not the base class:

```python
from typing import Self

class BaseQuery:
    def select(self, fields: list[str]) -> Self:
        print(f"Selecting: {fields}")
        return self

class PostgresQuery(BaseQuery):
    def pg_specific_index_hint(self, index_name: str) -> Self:
        print(f"Using PG Index: {index_name}")
        return self

# Method chaining retains the derived type (PostgresQuery) throughout!
query = PostgresQuery().select(["id", "name"]).pg_specific_index_hint("idx_users_email")
```

Without `Self`, calling `.select()` would return `BaseQuery`, causing `mypy` to reject the subsequent `.pg_specific_index_hint()` call.

---

## Examples

### 1. Simple: TypeGuard for Dictionary Validation
Narrowing a raw untrusted dictionary into a typed user profile.

```python
from typing import TypeGuard, TypedDict

class UserProfile(TypedDict):
    id: int
    email: str

def is_user_profile(data: dict[str, object]) -> TypeGuard[UserProfile]:
    """TypeGuard verifying presence and types of required fields."""
    return (
        isinstance(data.get("id"), int) and
        isinstance(data.get("email"), str)
    )

raw_data: dict[str, object] = {"id": 101, "email": "hesam@domain.com"}

if is_user_profile(raw_data):
    # Inside this block, Mypy statically narrows raw_data to UserProfile!
    print(f"Verified User #{raw_data['id']}: {raw_data['email'].upper()}")
else:
    print("Invalid user profile dictionary.")
```

### 2. Beginner: Fluent Database Model Builder with `Self`
Constructing a fluent SQL statement builder using `Self`.

```python
from typing import Self

class SQLQueryBuilder:
    def __init__(self, table_name: str):
        self.table = table_name
        self.conditions = []
        self.limit_val = None

    def where(self, column: str, value: str) -> Self:
        self.conditions.append(f"{column} = '{value}'")
        return self

    def limit(self, count: int) -> Self:
        self.limit_val = count
        return self

    def build_sql(self) -> str:
        sql = f"SELECT * FROM {self.table}"
        if self.conditions:
            sql += " WHERE " + " AND ".join(self.conditions)
        if self.limit_val:
            sql += f" LIMIT {self.limit_val}"
        return sql

query = (
    SQLQueryBuilder("customers")
    .where("country", "US")
    .where("status", "ACTIVE")
    .limit(10)
    .build_sql()
)
print("Built SQL Statement:\n ", query)
```

### 3. Intermediate: Signature-Preserving Retry Decorator with `ParamSpec`
Building a robust retry decorator that preserves function signatures, docstrings, and parameter types perfectly.

```python
from typing import ParamSpec, TypeVar, Callable
import functools
import time
import random

P = ParamSpec("P")
R = TypeVar("R")

def retry_operation(max_attempts: int = 3) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as err:
                    if attempt == max_attempts:
                        raise
                    print(f"⚠️ [RETRY {attempt}] Caught {err}. Retrying...")
            raise RuntimeError("Unreachable")
        return wrapper
    return decorator

@retry_operation(max_attempts=3)
def send_remote_command(host: str, port: int, command: str, timeout_sec: float = 5.0) -> dict[str, str]:
    """Dispatches command to remote server."""
    if random.random() < 0.5:
        raise ConnectionResetError("Connection dropped.")
    return {"host": host, "status": "EXECUTED", "cmd": command}

# Full IDE autocompletion for host, port, command, and timeout_sec!
resp = send_remote_command("10.0.1.25", port=8080, command="RESTART_CLUSTER")
print("Response:", resp)
```

### 4. Real-World: Parameter-Injecting Authentication Decorator (`Concatenate`)
Building an enterprise web framework decorator that extracts and injects the authenticated `UserContext` automatically.

```python
from typing import ParamSpec, TypeVar, Callable, Concatenate
from dataclasses import dataclass

@dataclass
class UserContext:
    user_id: str
    role: str

P = ParamSpec("P")
R = TypeVar("R")

# Decorator that automatically resolves authentication and injects UserContext
def require_authentication(
    func: Callable[Concatenate[UserContext, P], R]
) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        # Simulate auth token verification from header
        current_user = UserContext(user_id="USR-9901", role="ADMIN")
        print(f"🔒 [AUTHENTICATED] Verified session for {current_user.user_id} ({current_user.role})")
        return func(current_user, *args, **kwargs)
    return wrapper

# Endpoint expects 'user' as first argument:
@require_authentication
def delete_customer_account(user: UserContext, customer_id: str, reason: str = "Standard Closure") -> str:
    return f"Admin '{user.user_id}' deleted customer '{customer_id}' (Reason: {reason})"

# Caller does not pass 'user'!
result = delete_customer_account(customer_id="CUST-404", reason="Fraudulent Activity")
print(result)
```

### 5. Advanced: Runtime Metadata Extraction with `typing.Annotated`
Building a custom validation engine that inspects `Annotated` constraints at runtime.

```python
from typing import Annotated, get_type_hints, get_origin, get_args
from dataclasses import dataclass, fields

@dataclass(frozen=True)
class MinValue:
    min_val: float

@dataclass(frozen=True)
class MaxLength:
    max_len: int

@dataclass
class FinancialTransaction:
    account_id: Annotated[str, MaxLength(10)]
    amount: Annotated[float, MinValue(0.01)]

def validate_annotated_dataclass(instance: object):
    """Reflectively validates Annotated constraints on dataclass instances."""
    type_hints = get_type_hints(instance.__class__, include_extras=True)

    for field_name, field_type in type_hints.items():
        val = getattr(instance, field_name)
        
        # Check if type is Annotated
        if get_origin(field_type) is Annotated:
            base_type, *metadata = get_args(field_type)
            for meta in metadata:
                if isinstance(meta, MinValue) and val < meta.min_val:
                    raise ValueError(f"Field '{field_name}' ({val}) violates MinValue constraint ({meta.min_val})")
                if isinstance(meta, MaxLength) and len(val) > meta.max_len:
                    raise ValueError(f"Field '{field_name}' ('{val}') exceeds MaxLength ({meta.max_len})")

# Valid Transaction
tx1 = FinancialTransaction(account_id="ACC-001", amount=150.00)
validate_annotated_dataclass(tx1)
print("✅ Transaction 1 Validated Successfully.")

# Invalid Transaction (Amount < 0.01)
try:
    tx2 = FinancialTransaction(account_id="ACC-002", amount=-50.00)
    validate_annotated_dataclass(tx2)
except ValueError as err:
    print(f"🛡️ [VALIDATION REJECTED] {err}")
```

---

## Code Explanation

In Example 5 (`Annotated`):
1. `account_id: Annotated[str, MaxLength(10)]` associates metadata objects (`MaxLength(10)`) directly with the static type (`str`) without altering its runtime type.
2. `get_type_hints(..., include_extras=True)` retrieves the `Annotated` wrapper objects.
3. `get_origin(field_type)` and `get_args(field_type)` extract the underlying base type and metadata constraints.
4. This is the exact architectural pattern used by **FastAPI** (`Annotated[int, Depends(get_db)]`) and **Pydantic V2**.

---

## Common Mistakes

### Mistake 1: Returning Plain `bool` from Type Guards
Declaring `def is_admin(user) -> bool:` does **not** narrow the type in static type checkers. You must annotate the return type explicitly as **`TypeGuard[AdminUser]`**.

### Mistake 2: Misordering Parameters in `Concatenate`
In `Concatenate[FirstArg, P]`, the explicitly specified arguments **must come first**, with `P` as the final argument.

---

## Best Practices

### Always Use `ParamSpec` for Decorators
Never use `Callable[..., Any]` when writing decorators. Use `ParamSpec("P")` and `TypeVar("R")` to preserve complete parameter signatures and IDE autocompletion for users of your library.

Good:
```python
P = ParamSpec("P")
R = TypeVar("R")
def my_decorator(func: Callable[P, R]) -> Callable[P, R]: ...
```

---

## Performance Considerations

1. **Zero Runtime Overhead**: `ParamSpec`, `TypeGuard`, and `Self` are compile-time constructs stripped at bytecode compilation.
2. **`Annotated` Metadata Inspection**: Unpacking `Annotated` metadata via `get_args()` takes ~$1 microsecond per field. Cache metadata lookups in production validation engines.

---

## Security Considerations

1. **TypeGuard Invariant Rigor**: Ensure `TypeGuard` functions check all critical security fields. If a `TypeGuard[SecureAdminSession]` returns `True` when only the username matches (without checking the cryptographic signature), static type analysis will assume security invariants hold even when an attacker bypassed authentication.

---

## Real-World Usage

- **FastAPI / Starlette**: `Annotated[Session, Depends(get_db)]` for dependency injection.
- **Pydantic V2**: `Annotated[str, StringConstraints(min_length=3)]` for schema validation.
- **Pyright / Mypy Strict Mode**: Enforcing full `ParamSpec` typing across middleware pipelines.

---

## Comparison: Advanced Typing Tools

| Tool | PEP | Primary Purpose | Best Used For |
|---|---|---|---|
| **`ParamSpec`** | PEP 612 | Preserves complete parameter signatures | Decorators, Wrappers |
| **`Concatenate`**| PEP 612 | Prepends/appends arguments to signatures | Dependency Injection, Middleware |
| **`TypeGuard`** | PEP 647 | User-defined type narrowing in `if` | Complex JSON / Data validation |
| **`Self`** | PEP 673 | Returns current class type dynamically | Fluent Method Chaining, Builders |
| **`Annotated`** | PEP 593 | Attaches runtime metadata to types | FastAPI, Pydantic, Validators |

---

## Advanced Concepts: `TypeIs` (PEP 742, Python 3.13)

Introduced in **Python 3.13**, **`TypeIs[T]`** improves upon `TypeGuard[T]` by enabling **bidirectional narrowing**:
- If `TypeGuard` returns `False`, static analysis does not narrow the `else` branch.
- If `TypeIs` returns `False`, static analysis **automatically eliminates `T`** from the union in the `else` branch!

---

## Exercises

### Exercise 1 — Beginner
Write a `TypeGuard` function `is_float_tuple(val: tuple[object, ...]) -> TypeGuard[tuple[float, ...]]` and test it with valid and invalid tuples.

### Exercise 2 — Intermediate
Build a `FluentEmailBuilder` class using `Self` with methods `.to(address: str) -> Self`, `.subject(title: str) -> Self`, and `.body(text: str) -> Self`. Test method chaining.

### Exercise 3 — Advanced
Build a parameterized caching decorator `@memoize_with_ttl(seconds=60)` that uses `ParamSpec` and `TypeVar` to preserve the exact signatures of decorated asynchronous and synchronous functions.

---

## Mini Project: Enterprise Typed Micro-Framework: Parameter Injector & Schema Validator

### Requirements
Build an extensible micro-framework named `typed_framework_engine.py`. Implement a parameter-injecting `@inject_request_context` decorator using `Concatenate` and `ParamSpec`, a fluent `ResponseBuilder` using `Self`, and `Annotated` metadata validation for incoming payloads.

### Implementation Blueprint
```python
from __future__ import annotations
from typing import ParamSpec, TypeVar, Callable, Concatenate, Self, Annotated, get_type_hints, get_origin, get_args
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. ANNOTATED CONSTRAINT METADATA
# =====================================================================

@dataclass(frozen=True)
class RegexPattern:
    pattern: str

@dataclass
class UserRegistrationPayload:
    username: Annotated[str, RegexPattern("^[a-zA-Z0-9_]{3,16}$")]
    email: str
    age: int

# =====================================================================
# 2. PARAMETER INJECTION DECORATOR (ParamSpec + Concatenate)
# =====================================================================

@dataclass
class RequestContext:
    request_id: str
    client_ip: str
    timestamp: str

P = ParamSpec("P")
R = TypeVar("R")

def inject_request_context(
    func: Callable[Concatenate[RequestContext, P], R]
) -> Callable[P, R]:
    """Decorator that generates and injects RequestContext into target endpoints."""
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        ctx = RequestContext(
            request_id=f"REQ-{datetime.now(timezone.utc).strftime('%H%M%S%f')[:10]}",
            client_ip="192.168.1.100",
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
        )
        print(f"🌐 [REQUEST CONTEXT INJECTED] ID: {ctx.request_id} from {ctx.client_ip}")
        return func(ctx, *args, **kwargs)
    return wrapper

# =====================================================================
# 3. FLUENT HTTP RESPONSE BUILDER (Self)
# =====================================================================

class HTTPResponseBuilder:
    def __init__(self):
        self.status_code = 200
        self.headers: dict[str, str] = {}
        self.payload: dict = {}

    def status(self, code: int) -> Self:
        self.status_code = code
        return self

    def header(self, key: str, value: str) -> Self:
        self.headers[key] = value
        return self

    def json_body(self, data: dict) -> Self:
        self.payload = data
        return self

    def build(self) -> dict:
        return {
            "status": self.status_code,
            "headers": self.headers,
            "body": self.payload
        }

# =====================================================================
# 4. DECORATED ENDPOINT
# =====================================================================

@inject_request_context
def handle_user_registration(
    ctx: RequestContext,
    payload: UserRegistrationPayload,
    send_welcome_email: bool = True
) -> dict:
    print(f"⚙️ Processing registration for '{payload.username}' ({payload.email})")
    
    return (
        HTTPResponseBuilder()
        .status(201)
        .header("X-Request-ID", ctx.request_id)
        .header("Content-Type", "application/json")
        .json_body({
            "status": "CREATED",
            "username": payload.username,
            "registered_at": ctx.timestamp
        })
        .build()
    )

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE TYPED METAPROGRAMMING FRAMEWORK")
    print("=" * 65)
    
    user_payload = UserRegistrationPayload(
        username="hesam_dev",
        email="hesam@domain.com",
        age=30
    )
    
    # Notice: Caller does NOT supply 'ctx'! Mypy verifies parameters perfectly!
    response = handle_user_registration(user_payload, send_welcome_email=True)
    
    print("\n📦 Generated Response Object:")
    print("  Status Code :", response["status"])
    print("  Headers     :", response["headers"])
    print("  JSON Body   :", response["body"])
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's advanced typing system:
- **`ParamSpec` (PEP 612)** captures and forwards full positional, keyword, and default parameter signatures across decorator wrappers.
- Use **`Concatenate`** to prepend or append injected dependencies (like database sessions or request contexts).
- **`TypeGuard[T]` (PEP 647)** instructs static type checkers to narrow types inside conditional branches based on custom boolean functions.
- Use **`typing.Self` (PEP 673)** to type-annotate fluent builder methods in inheritance hierarchies.
- **`typing.Annotated[T, Metadata]` (PEP 593)** associates runtime validation metadata with static types for modern frameworks.

---

## Best Practices Checklist

- [ ] Use `ParamSpec("P")` on all general-purpose decorators to preserve IDE signature hints.
- [ ] Use `Concatenate` when decorators inject new arguments into wrapped functions.
- [ ] Use `TypeGuard[T]` for custom dictionary and collection type-narrowing functions.
- [ ] Use `Self` on all builder methods that return `self`.
- [ ] Inspect `Annotated` metadata using `get_type_hints(..., include_extras=True)`.

---

## What's Next?

Now that you understand advanced typing, continue to the final article in this module:
👉 **[Static Analysis & Mypy in CI/CD](mypy-static-analysis.md)** to master installing, configuring, running `mypy --strict`, handling third-party stubs, and automating static typing in CI/CD pipelines!
