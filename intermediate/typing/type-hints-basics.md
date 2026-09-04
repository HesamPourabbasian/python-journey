# Type Hints & Modern Syntax in Python

## Introduction

Python is historically renowned for its dynamic type system: variables can hold any data type at runtime, and types are verified only when operations execute. While dynamic typing enables lightning-fast prototyping, large enterprise codebases (spanning hundreds of thousands of lines and dozens of microservices) suffer without static contracts.

Without explicit types:
- Function signatures are ambiguous (`def process(data):`—is `data` a list, a dictionary, or a database model?).
- Refactoring variable or method names becomes dangerous.
- Type errors (such as passing `None` into an arithmetic operation) only manifest as production runtime crashes.

Beginning with **PEP 484** in Python 3.5 and evolving through modern **PEP 585 (Python 3.9) and PEP 604 (Python 3.10)**, Python introduced a state-of-the-art **Gradual Typing System**.

In Python, type hints are **strictly non-enforcing annotations at runtime**: they do not alter execution speed or cause runtime crashes. Instead, they serve as living machine-readable documentation and enable **Static Type Checkers (like `mypy` and Pyright)** to catch bugs, null-pointer dereferences, and schema mismatches before code is ever deployed.

This lesson explores modern Python 3.10+ typing syntax (`|` unions, native collection generics `list[str]`), `Optional`, `Literal`, `Final`, `Callable`, and `TypedDict` schemas.

---

## Prerequisites

Before studying type hints, ensure you have:

- Completed [Docstrings & Annotations](../../beginner/functions/docstrings-and-annotations.md).
- Completed [Built-in Collections](../../beginner/collections/README.md).
- Familiarity with modern Python function definitions.

---

## Core Concept: Modern vs Legacy Typing Syntax

```
                            THE EVOLUTION OF PYTHON TYPE SYNTAX

      LEGACY SYNTAX (Python 3.5 - 3.8)               MODERN SYNTAX (Python 3.10+)
   ┌─────────────────────────────────────────┐    ┌─────────────────────────────────────────┐
   │ from typing import List, Dict, Union,   │    │ # NO IMPORTS NEEDED FOR BASIC GENERICS! │
   │                    Optional, Tuple      │    │                                         │
   │                                         │    │ def process_users(                      │
   │ def process_users(                      │    │     user_ids: list[int],                │
   │     user_ids: List[int],                │ ═► │     metadata: dict[str, float],         │
   │     metadata: Dict[str, float],         │    │     fallback: str | None = None         │
   │     fallback: Optional[str] = None      │    │ ) -> list[str] | None:                  │
   │ ) -> Optional[List[str]]:               │    │     ...                                 │
   └─────────────────────────────────────────┘    └─────────────────────────────────────────┘
```

---

## Syntax & Essential Modern Typing Primitives

```python
from __future__ import annotations  # Enables modern stringified annotations in all Python 3.7+ versions!
from typing import Callable, Literal, Final, TypedDict, Any, Never

# 1. Modern Primitives & PEP 604 Union Syntax (|)
def calculate_tax(amount: float, tax_rate: float | None = None) -> float:
    rate = tax_rate if tax_rate is not None else 0.08
    return round(amount * rate, 2)

# 2. Modern Built-in Generic Collections (PEP 585)
names: list[str] = ["Hesam", "Sarah"]
scores: dict[str, int] = {"Hesam": 98, "Sarah": 100}
coordinates: tuple[float, float] = (37.7749, -122.4194)  # Fixed-length 2-tuple
variable_ints: tuple[int, ...] = (1, 2, 3, 4, 5)         # Variable-length homogeneous tuple

# 3. Literal Types (Restricting values to exact constants)
HTTPMethod = Literal["GET", "POST", "PUT", "DELETE"]

def dispatch_http_request(method: HTTPMethod, url: str) -> dict[str, Any]:
    print(f"Executing {method} request to {url}")
    return {"status": 200}

# 4. Final Constants (Cannot be re-assigned or overridden)
DATABASE_PORT: Final[int] = 5432
# DATABASE_PORT = 8000  # Mypy Static Type Error! ❌

# 5. TypedDict (Defining typed dictionary schemas for JSON/APIs)
class UserPayload(TypedDict):
    user_id: int
    username: str
    is_active: bool
    email: str | None  # Optional field value

user_data: UserPayload = {
    "user_id": 101,
    "username": "hesamp",
    "is_active": True,
    "email": "hesam@domain.com"
}
```

---

## Detailed Explanation

### 1. The Difference Between `Any`, `object`, and `Never`

Understanding Python's top and bottom types:

- **`Any` (The Escape Hatch)**: Disables static type checking entirely for that variable. Any method can be called on it, and it can be passed anywhere. **Avoid overusing `Any`**, as it defeats static type safety.
- **`object` (The Type-Safe Top Type)**: Every Python type is an instance of `object`. Unlike `Any`, static type checkers **forbid** calling arbitrary methods on an `object` without first narrowing its type using `isinstance()`.
- **`Never` / `NoReturn` (The Bottom Type)**: Represents a state that **can never occur**. Used for functions that never return (e.g. `sys.exit()` or infinite loops) and for exhaustiveness checking.

```python
from typing import Never, assert_never

def infinite_service_daemon() -> Never:
    while True:
        poll_queue()
```

---

### 2. `Callable` Signatures

To type-annotate higher-order functions, callback handlers, or middleware wrappers, use **`Callable[[Arg1Type, Arg2Type], ReturnType]`**:

```python
from typing import Callable

# Function that takes a string transform function: (str) -> str
def format_greeting(name: str, formatter: Callable[[str], str]) -> str:
    return f"Hello, {formatter(name)}!"

# Callable taking no arguments and returning an int: Callable[[], int]
# Callable taking arbitrary arguments: Callable[..., Any]
```

---

### 3. `from __future__ import annotations` (PEP 563)

By default, Python evaluates type annotations at module load time. This causes two problems:
1. **Forward References**: A method on class `Node` cannot annotate its return type as `-> Node:` because `Node` is still being defined!
2. **Import-Time Performance**: Resolving complex nested types adds import latency.

Adding **`from __future__ import annotations`** at the very top of your file turns all type annotations into unevaluated string literals at runtime, solving forward references completely:

```python
from __future__ import annotations

class TreeNode:
    def __init__(self, value: int):
        self.value = value
        # Forward reference works seamlessly with __future__ annotations!
        self.left: TreeNode | None = None
        self.right: TreeNode | None = None
```

---

## Examples

### 1. Simple: Typed Mathematical Utilities
Building a fully annotated arithmetic library with union types and optional defaults.

```python
from __future__ import annotations

def calculate_compound_interest(
    principal: float,
    rate_percent: float,
    years: int,
    compounds_per_year: int = 12
) -> float:
    """Calculates final accrued balance with compound interest."""
    r = rate_percent / 100.0
    n = compounds_per_year
    total = principal * ((1.0 + (r / n)) ** (n * years))
    return round(total, 2)

balance = calculate_compound_interest(10_000.0, rate_percent=7.5, years=5)
print(f"Accrued Investment Balance: ${balance:,.2f}")
```

### 2. Beginner: Typed HTTP Client with `Literal` and `TypedDict`
Enforcing strict method verb constraints and typed response dictionaries.

```python
from typing import TypedDict, Literal

class APIResponse(TypedDict):
    status_code: int
    data: dict[str, str]
    cached: bool

def execute_rest_call(
    endpoint: str,
    method: Literal["GET", "POST", "DELETE"] = "GET"
) -> APIResponse:
    print(f"🌐 [{method}] Fetching -> {endpoint}")
    return {
        "status_code": 200,
        "data": {"message": "Success", "resource": endpoint},
        "cached": True
    }

resp: APIResponse = execute_rest_call("/v1/users", method="GET")
print("Response Data:", resp["data"])
```

### 3. Intermediate: Typed Higher-Order Pipeline with `Callable`
Constructing a type-safe functional middleware chain.

```python
from typing import Callable

# Define Type Aliases for readability
StringFilter = Callable[[str], str]
Predicate = Callable[[str], bool]

def process_stream_tokens(
    tokens: list[str],
    transform: StringFilter,
    condition: Predicate
) -> list[str]:
    """Applies transformation to tokens that satisfy the boolean predicate."""
    return [transform(t) for t in tokens if condition(t)]

raw_words = ["python", "java", "c", "rust", "go", "javascript"]

# Pass type-safe lambdas
results = process_stream_tokens(
    tokens=raw_words,
    transform=lambda s: s.upper(),
    condition=lambda s: len(s) >= 4
)
print("Processed Tokens:", results) # ['PYTHON', 'JAVA', 'RUST', 'JAVASCRIPT']
```

### 4. Real-World: Total vs Non-Total `TypedDict` for Partial Updates
Modeling complete creation schemas vs partial update (PATCH) schemas in web APIs.

```python
from typing import TypedDict

# 1. Total Schema (All fields are strictly mandatory by default)
class FullUserSchema(TypedDict):
    id: int
    username: str
    email: str
    is_verified: bool

# 2. Non-Total Schema (total=False allows partial subsets of fields!)
class UserPatchSchema(TypedDict, total=False):
    username: str
    email: str
    is_verified: bool

def update_user_profile(user_id: int, updates: UserPatchSchema) -> dict:
    print(f"Updating User #{user_id} with partial fields: {list(updates.keys())}")
    return {"updated": True, "fields": updates}

# Valid partial update (only updating email):
update_user_profile(101, {"email": "new_email@domain.com"})
```

### 5. Advanced: Exhaustiveness Checking with `match-case` and `assert_never`
Using `typing.Never` and `assert_never` to guarantee at compile time that every branch of a union is handled.

```python
from typing import Literal, assert_never

PaymentStatus = Literal["PENDING", "APPROVED", "FAILED", "REFUNDED"]

def handle_payment_lifecycle(status: PaymentStatus) -> str:
    match status:
        case "PENDING":
            return "Payment is awaiting bank authorization."
        case "APPROVED":
            return "Payment settled successfully."
        case "FAILED":
            return "Payment was declined by issuing bank."
        case "REFUNDED":
            return "Payment funds returned to customer."
        case _ as unreachable:
            # If a new status is added to PaymentStatus and not handled here,
            # Mypy static analysis will report a COMPILE ERROR!
            assert_never(unreachable)

print(handle_payment_lifecycle("APPROVED"))
```

---

## Code Explanation

In Example 5 (`assert_never`):
1. `PaymentStatus` is defined as a 4-value `Literal` union.
2. The `match-case` statement provides explicit handling for all four possible states.
3. If an engineer later expands `PaymentStatus` to include `"CANCELLED"` but forgets to update `handle_payment_lifecycle()`, the wildcard case `_ as unreachable` will receive a string of type `"CANCELLED"`.
4. Passing `"CANCELLED"` to `assert_never()` causes `mypy` to raise a **Static Type Error**: `Argument 1 to "assert_never" has incompatible type "Literal['CANCELLED']"; expected "Never"`.
5. This gives Python the exact same **Compile-Time Exhaustive Pattern Matching** safety found in Rust and Haskell!

---

## Common Mistakes

### Mistake 1: Importing Deprecated Uppercase Generics
In Python 3.9+, writing `from typing import List, Dict, Tuple` is obsolete. Always use native lower-case built-ins: `list[str]`, `dict[str, int]`, `tuple[int, ...]`.

### Mistake 2: Confusing `Optional[T]` with Default Values
`name: str | None` denotes that `name` can be a string or `None`. It does **not** make the argument optional in function calls unless you also assign a default: `name: str | None = None`.

---

## Best Practices

### Put `from __future__ import annotations` at the Top of Every Module
This enables modern Python 3.10+ type syntax (`|`) across all Python 3.7+ environments and eliminates forward reference bugs.

Good:
```python
from __future__ import annotations

def link_nodes(current: Node, next_node: Node | None) -> None: ...
```

---

## Performance Considerations

1. **Zero Runtime Impact**: Type annotations are stripped during bytecode compilation into `__annotations__` dictionaries. A fully typed Python program runs at the **exact same speed** as an untyped Python program.
2. **Avoid Heavy Runtime Type Checking**: Do not write custom `assert isinstance(...)` checks inside tight numerical loops (10,000,000 iterations); rely on static analysis via `mypy` instead.

---

## Security Considerations

1. **Type Hints are NOT Security Gates**: Type hints do not validate incoming user input from HTTP requests. Passing `"malicious_payload"` to a function annotated as `def check(id: int):` will not be rejected by Python at runtime. Always use validation libraries like **Pydantic** or `marshmallow` at system boundaries.

---

## Real-World Usage

- **FastAPI / Pydantic**: Generating automatic OpenAPI documentation from type annotations.
- **SQLAlchemy 2.0 (`Mapped[int]`)**: Declarative database schema definitions mapped directly to static types.
- **CI/CD Quality Gates**: Running `mypy --strict` to block pull requests containing type errors.

---

## Comparison: Python Typing Approaches

| Feature | Dynamic (No Types) | Gradual (`typing`) | Pydantic Models |
|---|---|---|---|
| **Enforcement Time** | Runtime (When code fails) | **Static (Compile / Lint Time)** | **Runtime (At instantiation)** |
| **Performance Overhead** | None | **Zero (0 ns)** | Low (~1–5 µs validation) |
| **IDE Autocomplete** | Partial | **Full & Accurate** | **Full & Accurate** |
| **Best Used For** | Quick scratch scripts | **Internal domain logic & libraries**| **External API boundaries, JSON I/O** |

---

## Advanced Concepts: Inspecting Annotations with `inspect.get_annotations()`

In Python 3.10+, always use `inspect.get_annotations()` to inspect type hints programmatically rather than reading `__annotations__` directly:

```python
import inspect

def demo_fn(x: int, tags: list[str]) -> bool: return True

# Resolves stringified forward references safely:
hints = inspect.get_annotations(demo_fn)
print("Resolved Function Type Hints:", hints)
```

---

## Exercises

### Exercise 1 — Beginner
Type-annotate a function `format_user_summary(user_id: int, username: str, roles: list[str], is_active: bool = True) -> str` and test it with valid arguments.

### Exercise 2 — Intermediate
Create a `TypedDict` named `DatabaseConfig` with required fields `host: str`, `port: int`, and optional field `ssl_cert: str | None`. Write a typed function `connect_database(cfg: DatabaseConfig) -> bool`.

### Exercise 3 — Advanced
Using `Literal` and `assert_never`, write an exhaustive traffic light controller `transition_light(current: Literal["RED", "YELLOW", "GREEN"]) -> Literal["RED", "YELLOW", "GREEN"]`.

---

## Mini Project: Enterprise Typed Microservice Validator & Config Engine

### Requirements
Build a resilient configuration validation engine named `service_config_validator.py`. Implement `TypedDict` schemas for microservice cluster settings, `Literal` log levels, `Final` constants, union types, and an exhaustive configuration auditing report.

### Implementation Blueprint
```python
from __future__ import annotations
from typing import TypedDict, Literal, Final, assert_never

# =====================================================================
# 1. TYPED DATA SCHEMAS & CONSTANTS
# =====================================================================

DEFAULT_TIMEOUT_SEC: Final[int] = 30
MAX_CLUSTER_NODES: Final[int] = 128

Environment = Literal["DEVELOPMENT", "STAGING", "PRODUCTION"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]

class DatabaseConfig(TypedDict):
    host: str
    port: int
    database_name: str
    pool_size: int

class MicroserviceConfig(TypedDict):
    service_name: str
    environment: Environment
    log_level: LogLevel
    db: DatabaseConfig
    allowed_cors_origins: list[str]
    maintenance_mode: bool

# =====================================================================
# 2. TYPED VALIDATION & DISPATCH ENGINE
# =====================================================================

def evaluate_environment_policy(env: Environment) -> dict[str, bool]:
    """Exhaustive environment policy evaluator."""
    match env:
        case "DEVELOPMENT":
            return {"debug_toolbar": True, "strict_ssl": False, "mock_payments": True}
        case "STAGING":
            return {"debug_toolbar": False, "strict_ssl": True, "mock_payments": True}
        case "PRODUCTION":
            return {"debug_toolbar": False, "strict_ssl": True, "mock_payments": False}
        case _ as unreachable:
            assert_never(unreachable)

def validate_and_render_config(config: MicroserviceConfig) -> str:
    policy = evaluate_environment_policy(config["environment"])
    
    border = "=" * 65
    lines = [
        border,
        f"        MICROSERVICE CONFIGURATION: {config['service_name'].upper()}",
        border,
        f"  Environment  : {config['environment']} (Log Level: {config['log_level']})",
        f"  Database URI : postgres://{config['db']['host']}:{config['db']['port']}/{config['db']['database_name']}",
        f"  Pool Size    : {config['db']['pool_size']} connections",
        f"  CORS Origins : {', '.join(config['allowed_cors_origins'])}",
        f"  Strict SSL   : {'ENABLED' if policy['strict_ssl'] else 'DISABLED'}",
        f"  Mock Payments: {'ENABLED' if policy['mock_payments'] else 'DISABLED'}",
        border
    ]
    return "\n".join(lines)

if __name__ == "__main__":
    prod_config: MicroserviceConfig = {
        "service_name": "billing-gateway-service",
        "environment": "PRODUCTION",
        "log_level": "INFO",
        "db": {
            "host": "aurora-pg-prod.internal",
            "port": 5432,
            "database_name": "billing_db",
            "pool_size": 25
        },
        "allowed_cors_origins": ["https://app.company.com", "https://checkout.company.com"],
        "maintenance_mode": False
    }
    
    print(validate_and_render_config(prod_config))
```

---

## Summary

In this lesson, you mastered Python's modern type system:
- Type hints provide **Gradual Static Type Safety** with **zero runtime performance overhead**.
- In Python 3.10+, use **`|`** for unions (`int | str | None`) and native collection generics (`list[str]`, `dict[str, int]`).
- Use **`from __future__ import annotations`** to enable modern syntax and eliminate forward reference bugs.
- Use **`Literal`** to constrain values to exact string or numeric constants.
- Use **`Final`** to declare immutable constants and un-overridable methods.
- Use **`TypedDict`** to define strict static schemas for JSON APIs and dictionary payloads.
- Combine **`match-case`** with **`assert_never`** for compile-time exhaustive pattern matching.

---

## Best Practices Checklist

- [ ] Place `from __future__ import annotations` at the top of all Python files.
- [ ] Use `T | None` instead of legacy `Optional[T]` and `A | B` instead of `Union[A, B]`.
- [ ] Use lowercase built-in generics (`list[int]`, `dict[str, Any]`).
- [ ] Model structured JSON payloads with `TypedDict`.
- [ ] Use `assert_never` in default `match-case` branches for compile-time exhaustiveness.

---

## What's Next?

Now that you understand type hints and modern syntax, continue to:
👉 **[Generics & TypeVar](generics-and-typevar.md)** to master type-safe generic classes, bounded type constraints, covariance, and contravariance!
