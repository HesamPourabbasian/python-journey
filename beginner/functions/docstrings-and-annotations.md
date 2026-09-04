# Docstrings & Type Annotations in Python

## Introduction

As software engineering projects expand across multiple teams, repositories, and release cycles, the longevity and reliability of a codebase depend on two vital factors: **Clear Documentation** and **Type Safety**. Code is read far more often than it is written; a function whose purpose, arguments, edge cases, and return types are ambiguous creates cognitive friction, slows development velocity, and invites critical bugs.

Python addresses these challenges through two native language mechanisms: **Docstrings (PEP 257)** and **Type Annotations (PEP 484 & PEP 585)**.

Unlike ordinary comments (`#`), which are ignored by the Python compiler and discarded during bytecode generation, **Docstrings** are first-class language constructs preserved at runtime in the object's `__doc__` attribute. They power interactive `help()` queries, automated documentation generators (such as Sphinx, MkDocs, and pdoc), and IDE hover tooltips.

Simultaneously, modern **Type Annotations** allow developers to declare the expected types of function parameters and return values. Stored dynamically in `__annotations__`, these type hints empower static analysis tools (like **Mypy** and **Pyright**), IDE autocomplete engines, and runtime frameworks (such as **FastAPI** and **Pydantic**).

This lesson concludes **Module 7: Functions & Scope**, establishing the professional documentation and typing standards required for enterprise-grade Python software.

---

## Prerequisites

Before studying docstrings and type annotations, ensure you have:

- Completed [Defining Functions](defining-functions.md) and [Function Parameters & Arguments](parameters-and-arguments.md).
- Completed all built-in collection modules (Lists, Tuples, Dictionaries, Sets).
- A basic understanding of static analysis and developer tooling.

---

## Core Concept

Docstrings document **what** a function does and **how** to use it; Type Annotations declare **what types of data** it accepts and returns.

```
                        ANATOMY OF A PROFESSIONAL PYTHON FUNCTION

   def process_invoice(
       invoice_id: str,
       amount: float,                          # <--- Type Annotations (PEP 484)
       *,
       tax_rate: float = 0.08
   ) -> dict[str, float | str]:                # <--- Return Type Hint (PEP 585/604)
       """Calculate tax and finalize invoice record.   # <--- One-Line Summary

       Detailed explanation of calculation logic,     # <--- Detailed Description
       rounding rules, and ledger integration.

       Args:                                          # <--- Google-Style Docstring
           invoice_id: Unique 8-character ID string.
           amount: Pre-tax subtotal amount.
           tax_rate: Decimal tax rate (default: 0.08).

       Returns:
           A dictionary containing total amounts and status.

       Raises:
           ValueError: If amount is negative.
       """
       if amount < 0:
           raise ValueError("Invoice amount cannot be negative.")
       tax = amount * tax_rate
       return {"id": invoice_id, "total": amount + tax, "status": "FINALIZED"}
```

---

## Syntax & Docstring Styles

### 1. The Three Industry Standard Docstring Formats

#### Style A: Google Style (Recommended for Readability)
```python
def calculate_velocity(distance: float, time: float) -> float:
    """Calculate average linear velocity.

    Args:
        distance: Total displacement in meters.
        time: Elapsed time in seconds.

    Returns:
        Calculated velocity in meters per second (m/s).

    Raises:
        ZeroDivisionError: If time is zero.
    """
    return distance / time
```

#### Style B: Sphinx / reStructuredText (reST) Style
```python
def calculate_velocity(distance: float, time: float) -> float:
    """Calculate average linear velocity.

    :param distance: Total displacement in meters.
    :type distance: float
    :param time: Elapsed time in seconds.
    :type time: float
    :return: Calculated velocity in meters per second.
    :rtype: float
    :raises ZeroDivisionError: If time is zero.
    """
    return distance / time
```

#### Style C: NumPy / SciPy Style (Standard in Data Science)
```python
def calculate_velocity(distance, time):
    """
    Calculate average linear velocity.

    Parameters
    ----------
    distance : float
        Total displacement in meters.
    time : float
        Elapsed time in seconds.

    Returns
    -------
    float
        Calculated velocity in meters per second.
    """
    return distance / time
```

---

## Detailed Explanation

### 1. PEP 257 Docstring Conventions

PEP 257 establishes standardized rules for Python docstrings:
1. **Always Use Triple Double Quotes**: Always write `"""docstring"""`, never `'''` or single quotes.
2. **One-Line Docstrings**: For short, simple functions, keep the docstring on a single line with closing quotes on the same line:
   ```python
   def add(a: int, b: int) -> int:
       """Return the sum of two integers."""
       return a + b
   ```
3. **Imperative Mood**: The summary line should always be written as a command ("Return the...", "Calculate the...", "Validate..."), not a description ("Returns the...").
4. **Multi-Line Formatting**: Leave a blank line between the summary line and the detailed description. The closing quotes `"""` should be on their own line.

---

### 2. Modern Python Type Hinting (Python 3.9+ & 3.10+)

Historically (Python 3.5), typing required importing generic types from the `typing` module (`from typing import List, Dict, Union, Optional`).

In **Modern Python (3.9+ and 3.10+)**, standard built-in collections support generic typing natively, and the pipe operator `|` replaces `Union` and `Optional`:

```python
# MODERN PYTHON (3.10+) - Clean and Expressive:
def fetch_user(user_id: int) -> dict[str, str | int] | None:
    # 'dict[str, str | int]' -> Built-in generic (Python 3.9+)
    # '... | None'           -> Replaces Optional[T] / Union[T, None] (Python 3.10+)
    pass

# LEGACY PYTHON (3.5 - 3.8) - Avoid in new code:
# from typing import Dict, Union, Optional
# def fetch_user(user_id: int) -> Optional[Dict[str, Union[str, int]]]:
#     pass
```

---

### 3. The Critical Truth: Type Hints Are NOT Enforced at Runtime!

A fundamental concept in Python architecture is that **type annotations are purely advisory to CPython**.

CPython executes type-annotated code without validating types at runtime. Passing an integer to a function expecting a string will **not raise a runtime TypeError** unless your code explicitly checks it or an external validation library (like Pydantic) intercepts the call:

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

# CPython executes this without error, despite type violation!
result = greet(12345)
print(result)  # "Hello, 12345!"
```

**Type safety is verified before runtime** by running static type checkers in your terminal or CI/CD pipeline:
```bash
mypy my_script.py
```

---

## Examples

### 1. Simple: Built-in Generic Types and Nullable Types
Writing modern, expressive type signatures for data extraction.

```python
def parse_tags(raw_csv: str) -> list[str]:
    """Parse comma-separated tag string into a clean list of lowercase tags."""
    return [tag.strip().lower() for tag in raw_csv.split(",") if tag.strip()]

def get_config_setting(key: str, settings: dict[str, str]) -> str | None:
    """Retrieve setting value or return None if key is missing."""
    return settings.get(key)

print(parse_tags(" Python , FastAPI,  Docker, , AI "))
print(get_config_setting("HOST", {"HOST": "127.0.0.1"}))
```

### 2. Beginner: Comprehensive Google-Style Function Docstring
Documenting a financial currency exchange calculator.

```python
def convert_currency(
    amount: float,
    exchange_rate: float,
    *,
    fee_percentage: float = 0.01
) -> float:
    """Convert a monetary amount using a specific exchange rate and transaction fee.

    Calculates the converted currency amount after deducting a percentage-based
    administrative transaction fee.

    Args:
        amount: The original monetary amount to convert. Must be non-negative.
        exchange_rate: The multiplier conversion rate between currencies.
        fee_percentage: The decimal transaction fee deducted from principal (default: 0.01).

    Returns:
        The net converted amount rounded to 2 decimal places.

    Raises:
        ValueError: If amount is negative or exchange_rate is less than or equal to zero.
    """
    if amount < 0:
        raise ValueError(f"Conversion amount must be non-negative, got {amount}")
    if exchange_rate <= 0:
        raise ValueError(f"Exchange rate must be positive, got {exchange_rate}")
        
    net_amount = amount * (1.0 - fee_percentage)
    return round(net_amount * exchange_rate, 2)

print(f"Converted USD to EUR: €{convert_currency(1000.0, 0.92, fee_percentage=0.015):,.2f}")
```

### 3. Intermediate: Higher-Order Function Annotations with `Callable`
Typing functions that accept callbacks or transformation functions.

```python
from collections.abc import Callable

def transform_records(
    records: list[dict[str, any]],
    predicate: Callable[[dict[str, any]], bool],
    transformer: Callable[[dict[str, any]], dict[str, any]]
) -> list[dict[str, any]]:
    """Filter and transform a list of dictionary records.

    Args:
        records: Raw input record collection.
        predicate: Callable returning True for records to keep.
        transformer: Callable transforming matching records.

    Returns:
        A new list of processed records.
    """
    return [transformer(rec) for rec in records if predicate(rec)]

sample_data = [
    {"user": "hesam", "score": 95, "role": "admin"},
    {"user": "guest_1", "score": 40, "role": "viewer"},
    {"user": "sarah", "score": 88, "role": "editor"},
]

# Process data with strongly typed callbacks
active_editors = transform_records(
    sample_data,
    predicate=lambda r: r["score"] >= 80,
    transformer=lambda r: {"username": r["user"].upper(), "tier": "HONOR_ROLL"}
)

print("Transformed Output:", active_editors)
```

### 4. Real-World: Embedding Executable Doctests inside Docstrings
Using Python's built-in `doctest` module to verify that code examples in docstrings stay 100% synchronized with actual code.

```python
def is_valid_hex_color(hex_code: str) -> bool:
    """Validate whether a string is a valid 6-character hex color code.

    Examples:
        >>> is_valid_hex_color("#FFFFFF")
        True
        >>> is_valid_hex_color("#1a2b3c")
        True
        >>> is_valid_hex_color("123456")
        False
        >>> is_valid_hex_color("#GGG")
        False
    """
    if not (isinstance(hex_code, str) and len(hex_code) == 7 and hex_code.startswith("#")):
        return False
    hex_digits = hex_code[1:]
    return all(ch in "0123456789abcdefABCDEF" for ch in hex_digits)

# Run doctests programmatically
import doctest
doctest_results = doctest.testmod()
print(f"Doctest Verification: {doctest_results.attempted} tests run, {doctest_results.failed} failures.")
```

### 5. Advanced: Runtime Type-Enforcing Decorator Reading `__annotations__`
Building a custom decorator that dynamically reads `__annotations__` to enforce runtime type safety.

```python
from functools import wraps
import inspect

def enforce_types(func: Callable) -> Callable:
    """Decorator that validates argument types at runtime against function annotations."""
    sig = inspect.signature(func)
    annotations = func.__annotations__

    @wraps(func)
    def wrapper(*args, **kwargs):
        # Bind incoming arguments to parameter names
        bound_args = sig.bind(*args, **kwargs)
        bound_args.apply_defaults()
        
        for param_name, param_val in bound_args.arguments.items():
            if param_name in annotations:
                expected_type = annotations[param_name]
                # Check simple type instances
                if isinstance(expected_type, type) and not isinstance(param_val, expected_type):
                    raise TypeError(
                        f"Type mismatch on '{param_name}': Expected {expected_type.__name__}, got {type(param_val).__name__} ({param_val!r})"
                    )
                    
        return func(*args, **kwargs)
        
    return wrapper

@enforce_types
def calculate_server_capacity(node_count: int, memory_per_node_gb: float) -> float:
    return node_count * memory_per_node_gb

print("Valid Execution  :", calculate_server_capacity(8, 16.0))

# Test Runtime Type Violation:
try:
    calculate_server_capacity("eight", 16.0)  # Invalid string passed for int!
except TypeError as err:
    print("Caught Type Error:", err)
```

---

## Code Explanation

In Example 5 (Runtime Type-Enforcing Decorator):
1. `func.__annotations__` stores the dictionary of declared type hints: `{'node_count': <class 'int'>, 'memory_per_node_gb': <class 'float'>, 'return': <class 'float'>}`.
2. `inspect.signature(func).bind(*args, **kwargs)` maps runtime arguments to parameter names.
3. The wrapper iterates through the parameters and uses `isinstance(param_val, expected_type)` to validate types at runtime.
4. If a caller passes `"eight"` for `node_count`, the decorator intercepts the call and raises a clear `TypeError` before the function executes.
5. This demonstrates how metadata stored in `__annotations__` can be leveraged for dynamic runtime validation engines (such as Pydantic, FastAPI, and Typer).

---

## Common Mistakes

### Mistake 1: Using Ordinary `#` Comments Instead of Docstrings
Comments are stripped during compilation and cannot be accessed by `help()`, Sphinx, or `func.__doc__`.

```python
# BROKEN (Not a docstring):
def my_func():
    # This is just a comment, NOT a docstring!
    pass

print(my_func.__doc__)  # None ❌

# CORRECT:
def my_func():
    """This is a valid docstring."""
    pass

print(my_func.__doc__)  # "This is a valid docstring." ✅
```

### Mistake 2: Placing Code Statements Before the Docstring
The docstring **must be the very first statement** inside the function body. Placing an assignment or print statement above the docstring invalidates it.

---

## Best Practices

### Write Imperative One-Line Summaries
Start every docstring with a concise summary in the imperative mood, ending with a period.

Good:
```python
def validate_token(token: str) -> bool:
    """Validate user JWT authentication token."""
```

Avoid:
```python
def validate_token(token: str) -> bool:
    """This function is used to validate the JWT token of the user."""
```

---

## Performance Considerations

1. **Zero Runtime Overhead for Type Hints**: Type annotations are evaluated once at module load time into `__annotations__`. During function execution, CPython incurs **0.0 nanoseconds** of runtime overhead.
2. **Bytecode Docstring Optimization (`python -OO`)**: When running Python in optimized production mode (`python -OO`), the compiler strips all docstrings from bytecode (`.pyc`), reducing memory footprints in embedded or microservice containers.

---

## Security Considerations

1. **Documenting Security Contracts & Invariants**: Always explicitly document authentication prerequisites, permission requirements, and encryption standards in function docstrings.
2. **Do Not Store Hardcoded Secrets in Docstrings**: Docstrings are compiled into publicly inspectable bytecode and exposed via API schema endpoints. Never include real API keys, passwords, or internal IP addresses in docstring examples.

---

## Real-World Usage

- **FastAPI / OpenAPI Swagger Generation**: FastAPI reads type hints (`user_id: int`) and docstrings to automatically generate interactive OpenAPI documentation at `/docs`.
- **Sphinx & MkDocs Documentation Portals**: Automated CI/CD documentation builds that extract docstrings directly into HTML reference portals.
- **Mypy Static Analysis in CI/CD**: Enforcing strict type safety before code can be merged into production repositories.

---

## Comparison: Major Docstring Formats

| Format | Origin | Visual Readability | IDE & Tooling Support | Best Use Case |
|---|---|---|---|---|
| **Google Style** | Google Python Style Guide | **Highest (Clean & Minimal)** | Excellent (Sphinx, VS Code, PyCharm)| Modern Web, Microservices, SDKs |
| **Sphinx / reST**| Python Core Standard | Moderate (Markup heavy) | Universal Native Support | Core Python Libraries |
| **NumPy Style** | NumPy / SciPy Community | High (Structured headers) | Excellent in Data Science | Machine Learning, Math, Analytics |

---

## Advanced Concepts: The `__annotations__` Mapping

In modern Python, functions, classes, and modules maintain an `__annotations__` attribute:

```python
def calculate_loan(principal: float, rate: float = 0.05) -> float:
    pass

print("Function Annotations Mapping:")
print(calculate_loan.__annotations__)
# Output: {'principal': <class 'float'>, 'rate': <class 'float'>, 'return': <class 'float'>}
```

Python 3.10+ also introduced `inspect.get_annotations(obj)`, which safely evaluates stringified forward references (`from __future__ import annotations`).

---

## Exercises

### Exercise 1 — Beginner
Write a function `calculate_bmi(weight_kg: float, height_m: float) -> float` with full type annotations, a PEP 257 compliant Google-style docstring (documenting Args, Returns, and Raises for non-positive inputs), and verify that `calculate_bmi.__doc__` prints correctly.

### Exercise 2 — Intermediate
Write a function `filter_active_users(users: list[dict[str, str | bool]]) -> list[str]` that accepts a list of user dictionaries and returns a list of active usernames. Include executable `doctest` examples in the docstring and verify them with `doctest.testmod()`.

### Exercise 3 — Advanced
Build a `TypeValidatedAPIClient` class that uses `typing.get_type_hints()` to inspect method annotations before sending requests, raising descriptive `TypeError` exceptions if parameters fail type checks.

---

## Mini Project: Self-Documenting REST API SDK Client with Doctests & Typing

### Requirements
Build a production-grade API client SDK module named `api_sdk_client.py` that implements Google-style docstrings, modern Python 3.10+ type annotations, executable doctest suites, and automated introspection utilities.

### Implementation Blueprint
```python
import doctest
from typing import Any

class CloudStorageSDK:
    """Enterprise Cloud Object Storage SDK Client.

    Provides a typed, resilient client interface for interacting with
    distributed cloud object storage buckets.
    """

    def __init__(self, endpoint_url: str, api_key: str, *, timeout_sec: float = 30.0):
        """Initialize the Cloud Storage SDK Client.

        Args:
            endpoint_url: Base HTTPS URL of the cloud storage API.
            api_key: Secret authentication API credential token.
            timeout_sec: Maximum request timeout in seconds (default: 30.0).

        Raises:
            ValueError: If endpoint_url does not start with 'https://'.
        """
        if not endpoint_url.startswith("https://"):
            raise ValueError(f"Insecure endpoint URL rejected: {endpoint_url}. Must use HTTPS.")
            
        self.endpoint = endpoint_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout_sec
        self._mock_bucket: dict[str, bytes] = {}

    def upload_object(self, bucket_name: str, object_key: str, data_payload: bytes) -> dict[str, str | int]:
        """Upload a binary payload object to a specified storage bucket.

        Args:
            bucket_name: Target bucket identifier.
            object_key: Unique file path key within the bucket.
            data_payload: Raw binary data bytes to store.

        Returns:
            A dictionary containing upload status, object path, and byte size.

        Raises:
            ValueError: If object_key is empty or data_payload is empty.

        Examples:
            >>> client = CloudStorageSDK("https://s3.cloud.internal", "sec_token_123")
            >>> res = client.upload_object("assets", "logo.png", b"PNG_RAW_BYTES_123")
            >>> res["status"]
            'UPLOADED'
            >>> res["bytes_stored"]
            17
        """
        if not object_key.strip():
            raise ValueError("Object key cannot be empty.")
        if len(data_payload) == 0:
            raise ValueError("Cannot upload empty data payload.")

        storage_path = f"{bucket_name}/{object_key}"
        self._mock_bucket[storage_path] = data_payload

        return {
            "status": "UPLOADED",
            "bucket": bucket_name,
            "path": storage_path,
            "bytes_stored": len(data_payload)
        }

    def inspect_sdk_metadata(self) -> dict[str, Any]:
        """Extract SDK runtime docstrings and type annotations dynamically."""
        return {
            "class_doc": self.__doc__.strip(),
            "upload_method_annotations": self.upload_object.__annotations__,
            "upload_method_doc": self.upload_object.__doc__.strip()
        }

if __name__ == "__main__":
    print("=" * 65)
    print("             CLOUD STORAGE SDK VALIDATION SUITE")
    print("=" * 65)
    
    # 1. Run Embedded Doctests
    print("🔍 Executing Embedded Doctest Suite...")
    test_results = doctest.testmod()
    print(f"✅ Doctests: {test_results.attempted} attempted, {test_results.failed} failed.")
    print("-" * 65)
    
    # 2. Inspect Runtime Annotations and Docstrings
    sdk = CloudStorageSDK("https://storage.cloud.internal", "sec_key_xyz")
    meta = sdk.inspect_sdk_metadata()
    
    print("📋 SDK Class Documentation:\n", meta["class_doc"])
    print("\n🏷️ Upload Method Type Annotations:\n", meta["upload_method_annotations"])
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's docstrings and type annotations architecture:
- Docstrings are **first-class documentation objects** preserved in `__doc__` at runtime.
- **PEP 257** establishes standard docstring formatting rules; **Google Style** is the modern industry standard.
- Type annotations (PEP 484 / PEP 585) provide static type hints without runtime performance overhead.
- In modern Python (3.10+), use native collections (`list[str]`, `dict[str, Any]`) and the pipe operator (`int | None`).
- Use the **`doctest`** module to ensure code examples in docstrings stay tested and accurate.
- Type hints enable static analysis tools like **Mypy** and runtime frameworks like **FastAPI**.

---

## Best Practices Checklist

- [ ] Write Google-style docstrings for all public modules, classes, and functions.
- [ ] Use imperative summary lines ending with a period (`"""Calculate compound tax."""`).
- [ ] Annotate all function parameters and return types using modern Python 3.10+ syntax (`T | None`).
- [ ] Embed executable doctests in docstrings to prevent documentation rot.
- [ ] Integrate **Mypy** into your CI/CD pipeline to verify type annotations statically.

---

## What's Next?

Congratulations! You have completed **Module 7: Functions & Scope**.
Now continue to **Module 8: Comprehensions**:
👉 **[List Comprehensions](../comprehensions/list-comprehensions.md)** to master elegant, declarative data transformations and filtering expressions.
