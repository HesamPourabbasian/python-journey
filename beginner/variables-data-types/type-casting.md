# Type Casting & Conversion in Python

## Introduction

In software development, data rarely arrives in the exact data type required for computation. User input gathered from terminal prompts (`input()`), HTTP query parameters extracted from web requests, environment variables read from the operating system (`os.getenv`), and records ingested from CSV files or relational databases are almost universally presented as raw text strings. Before your application can perform mathematical calculations, evaluate boolean logic, or store records in specialized data structures, that raw text must be converted into appropriate Python data types.

The process of converting an object from one data type to another is known as **Type Casting** (or **Type Conversion**). In Python, type conversion falls into two distinct categories: **Implicit Type Conversion (Type Coercion)**, where the Python interpreter automatically elevates types during operations without data loss, and **Explicit Type Conversion (Type Casting)**, where the developer explicitly invokes built-in constructor functions to transform objects.

Because Python is a strongly typed language, it will not automatically convert text strings to numbers or collections to booleans during arithmetic. Mastering explicit type casting, understanding radix base conversions, and designing defensive error-handling routines for malformed data are essential skills for building resilient, production-ready software.

This lesson builds directly upon [Dynamic Typing](dynamic-typing.md), [Integers & Floats](integers-floats.md), [Strings](strings.md), and [Booleans & None](booleans-none.md), equipping you with the tools to safely transform data across Python's type system.

---

## Prerequisites

Before studying type casting, ensure you have:

- Completed [Variables & Memory Binding](variables.md), [Dynamic Typing](dynamic-typing.md), and [Strings Fundamentals](strings.md).
- An understanding of basic exception handling concepts (`try`/`except` blocks).
- Familiarity with standard scalar types (`int`, `float`, `str`, `bool`).

---

## Core Concept

Python handles type conversion through two distinct mechanisms:

### 1. Implicit Type Conversion (Coercion)
When an arithmetic expression involves mixed numeric types, Python automatically converts the narrower numeric type into the wider, more expressive type to prevent precision loss. For example, adding an integer to a float automatically elevates the integer to a float:

```python
integer_val = 10     # int
float_val = 2.5      # float
result = integer_val + float_val  # Result is 12.5 (float)
```

### 2. Explicit Type Conversion (Casting)
Explicit casting is performed by passing an object into a type constructor function. Python provides constructor functions for all built-in types: `int()`, `float()`, `str()`, `bool()`, `list()`, `tuple()`, `set()`, `dict()`.

```
Raw Input ("100") ───────► int("100") ────────► 100 (Integer)
Integer (100)     ───────► str(100)   ────────► "100" (String)
Integer (100)     ───────► float(100) ────────► 100.0 (Float)
Integer (100)     ───────► bool(100)  ────────► True (Boolean)
```

---

## Syntax & Common Casting Constructors

```python
# 1. Numeric Conversions
count = int("42")               # String to int -> 42
price = float("19.99")          # String to float -> 19.99
truncated = int(19.99)          # Float to int (truncates towards zero) -> 19

# 2. String Conversions
status_code_str = str(200)      # Int to string -> "200"
list_str = str([1, 2, 3])       # List to string -> "[1, 2, 3]"

# 3. Base/Radix Conversions with int()
binary_int = int("101010", base=2)    # Binary string to int -> 42
hex_int = int("2A", base=16)          # Hex string to int -> 42
octal_int = int("52", base=8)         # Octal string to int -> 42

# 4. Collection Conversions
tuple_data = tuple([1, 2, 3])         # List to tuple
unique_items = list(set([1, 2, 2, 3])) # Deduplicate list via set
kv_pairs = dict([("a", 1), ("b", 2)])  # List of 2-tuples to dictionary
```

---

## Detailed Explanation

### 1. The Mechanics of Integer and Float Casting

- `int(x)`:
  - When given a `float`, `int()` truncates the decimal part toward zero (`int(3.9) == 3`, `int(-3.9) == -3`).
  - When given a `str`, the string must represent a valid integer literal. If the string contains a decimal point (`int("3.14")`) or invalid characters (`int("100px")`), Python raises a `ValueError`.
- `float(x)`:
  - Parses integer values, decimal strings (`float("3.14")`), scientific notation (`float("1e-4")`), and special IEEE 754 strings (`float("inf")`, `float("-inf")`, `float("nan")`).

### 2. The Great Boolean Parsing Trap (`bool("False")`)

A critical pitfall in Python is attempting to parse boolean strings using the built-in `bool()` constructor:

```python
user_input = "False"
parsed_flag = bool(user_input)

print(parsed_flag)  # True! ❌ Highly Dangerous!
```

Why does `bool("False")` evaluate to `True`? Because `bool()` evaluates the **truthiness** of its argument. Any non-empty string in Python is truthy! Only the empty string `""` evaluates to `False`. To safely parse boolean strings, you must explicitly match against known truth values (e.g., `"true"`, `"1"`, `"yes"`).

### 3. The Dunder Casting Protocol

When you invoke a casting function on a custom object, Python delegates the operation to the corresponding magic (dunder) method implemented on the object's class:
- `int(obj)` $\rightarrow$ calls `obj.__int__()` or `obj.__index__()`
- `float(obj)` $\rightarrow$ calls `obj.__float__()`
- `str(obj)` $\rightarrow$ calls `obj.__str__()` (falling back to `obj.__repr__()`)
- `bool(obj)` $\rightarrow$ calls `obj.__bool__()` (falling back to `len(obj) > 0`)

---

## Examples

### 1. Simple: Basic User Input Parsing
Prompting the user for numeric input and safely calculating an age in months.

```python
raw_age_input = "25"  # Simulating input from terminal

# Convert string to integer
age_years = int(raw_age_input)
age_months = age_years * 12

print(f"Age: {age_years} years ({age_months} months)")
```

### 2. Beginner: Multi-Base Radix Parsing
Converting string representations of binary, octal, and hexadecimal values into standard base-10 integers.

```python
raw_data = [
    ("11110000", 2, "Binary"),
    ("755", 8, "Unix Octal Permission"),
    ("DEADBEEF", 16, "Hexadecimal Memory Offset"),
    ("z", 36, "Base-36 Max Alphanumeric")
]

print(f"{'Raw String':<15} {'Base':<6} {'Context':<30} {'Decimal Value'}")
print("-" * 65)
for raw_str, base, context in raw_data:
    decimal_val = int(raw_str, base=base)
    print(f"{raw_str:<15} {base:<6} {context:<30} {decimal_val:,}")
```

### 3. Intermediate: Defensive String-to-Boolean Parser
Implementing a production-grade boolean parser that handles varied string formats safely.

```python
def parse_bool_strict(val: str | bool | int) -> bool:
    """Safely convert strings, integers, and booleans into a strict boolean value."""
    if isinstance(val, bool):
        return val
    if isinstance(val, int):
        if val in (0, 1):
            return bool(val)
        raise ValueError(f"Cannot cast integer {val} to boolean (must be 0 or 1).")
    if isinstance(val, str):
        normalized = val.strip().lower()
        if normalized in ("true", "1", "t", "yes", "y", "on", "enable"):
            return True
        elif normalized in ("false", "0", "f", "no", "n", "off", "disable"):
            return False
        else:
            raise ValueError(f"Unrecognized boolean string representation: '{val}'")
    raise TypeError(f"Unsupported type for boolean parsing: {type(val).__name__}")

# Test Cases
test_inputs = ["True", "false", "  1  ", "NO", "ENABLE", "off", True, 0]
for item in test_inputs:
    print(f"Input: {repr(item):<12} -> Parsed Boolean: {parse_bool_strict(item)}")
```

### 4. Real-World: Environment Variable Ingestion with Safe Type Coercion
Loading and validating application configuration parameters from raw string dictionaries.

```python
import os

def get_env_var(name: str, default: any, cast_type: type):
    """Retrieve environment variable and safely cast to specified type."""
    raw_val = os.environ.get(name)
    if raw_val is None:
        return default
        
    try:
        if cast_type is bool:
            return parse_bool_strict(raw_val)
        elif cast_type is int:
            return int(raw_val)
        elif cast_type is float:
            return float(raw_val)
        elif cast_type is list:
            # Parse comma-separated string into list of stripped strings
            return [item.strip() for item in raw_val.split(",") if item.strip()]
        else:
            return cast_type(raw_val)
    except (ValueError, TypeError) as err:
        print(f"[CONFIG WARNING] Failed to cast ENV '{name}={raw_val}' to {cast_type.__name__}: {err}")
        print(f"[CONFIG WARNING] Falling back to default value: {default}")
        return default

# Simulate OS environment variables
os.environ["MAX_WORKERS"] = "16"
os.environ["SERVER_PORT"] = "8080"
os.environ["DEBUG_MODE"] = "yes"
os.environ["ALLOWED_HOSTS"] = "localhost, api.internal.domain, 127.0.0.1"
os.environ["TIMEOUT_SECONDS"] = "invalid_number_here"

workers = get_env_var("MAX_WORKERS", 4, int)
port = get_env_var("SERVER_PORT", 5000, int)
debug = get_env_var("DEBUG_MODE", False, bool)
hosts = get_env_var("ALLOWED_HOSTS", [], list)
timeout = get_env_var("TIMEOUT_SECONDS", 30.0, float)

print("\n--- Parsed Application Settings ---")
print(f"Workers       : {workers} (Type: {type(workers).__name__})")
print(f"Port          : {port} (Type: {type(port).__name__})")
print(f"Debug Mode    : {debug} (Type: {type(debug).__name__})")
print(f"Allowed Hosts : {hosts} (Type: {type(hosts).__name__})")
print(f"Timeout       : {timeout} (Type: {type(timeout).__name__})")
```

### 5. Advanced: Implementing the Dunder Casting Protocol
Creating a custom financial `Money` class that defines explicit casting behavior for `int()`, `float()`, `str()`, and `bool()`.

```python
from decimal import Decimal

class Money:
    def __init__(self, amount_str: str, currency: str = "USD"):
        self.amount = Decimal(amount_str)
        self.currency = currency

    def __str__(self) -> str:
        """Called by str(money_instance)."""
        return f"{self.amount:.2f} {self.currency}"

    def __repr__(self) -> str:
        """Called by repr() and interactive REPL."""
        return f"Money('{self.amount}', '{self.currency}')"

    def __int__(self) -> int:
        """Called by int(money_instance) - truncates to whole currency units."""
        return int(self.amount)

    def __float__(self) -> float:
        """Called by float(money_instance)."""
        return float(self.amount)

    def __bool__(self) -> bool:
        """Called by bool(money_instance) - False if zero amount."""
        return not self.amount.is_zero()

cash = Money("1250.75", "USD")
zero_funds = Money("0.00", "USD")

print(f"String representation : {str(cash)}")
print(f"Integer casting       : {int(cash)} (Whole dollars)")
print(f"Float casting         : {float(cash)}")
print(f"Boolean casting       : {bool(cash)} (Non-zero funds)")
print(f"Zero funds boolean    : {bool(zero_funds)} (Zero funds)")
```

---

## Code Explanation

In Example 5 (The Dunder Casting Protocol):
1. Implementing `__str__()` dictates the human-readable string produced when `str(cash)` or `print(cash)` is invoked.
2. Implementing `__int__()` and `__float__()` allows instances of `Money` to be passed directly to `int()` and `float()` constructors, converting internal `Decimal` amounts cleanly.
3. Implementing `__bool__()` defines domain-specific truthiness: a monetary holding is truthy only if its balance is non-zero.
4. This demonstrates how Python's casting system is fully extensible and integrates with user-defined classes through protocol methods.

---

## Common Mistakes

### Mistake 1: Casting Decimal Strings Directly to `int()`
Passing a string containing a decimal point (e.g., `"19.99"`) directly into `int()` causes an immediate `ValueError`.

```python
# BROKEN:
price_str = "19.99"
total_units = int(price_str)  # Raises ValueError: invalid literal for int() with base 10: '19.99'

# CORRECT:
total_units = int(float(price_str))  # Convert to float first, then truncate to int (19)
```

### Mistake 2: Assuming `bool(str)` Parses `"False"` Correctly
As detailed above, `bool("False")` returns `True`. Always use an explicit mapping or a dedicated parser function when interpreting user-provided boolean strings.

---

## Best Practices

### Always Guard Type Conversions with Exception Handlers
When parsing untrusted input (user terminal input, API query parameters, file records), always wrap conversion constructors in `try/except (ValueError, TypeError)` blocks to prevent uncaught runtime crashes.

Good:
```python
def safe_int_conversion(value: str, default: int = 0) -> int:
    try:
        return int(value)
    except (ValueError, TypeError):
        return default
```

Avoid:
```python
# Crashing the entire application on unexpected characters
def unsafe_int_conversion(value: str) -> int:
    return int(value)
```

---

## Performance Considerations

1. **Constructor Allocation Overhead**: Every call to `str()`, `int()`, or `list()` constructs a new object in heap memory. In hot algorithmic loops processing millions of iterations, avoid unnecessary redundant type conversions.
2. **Container Casting ($O(N)$ Cost)**: Converting a large list of 1,000,000 items to a set (`set(my_list)`) requires hashing every element, allocating hash table buckets, and takes $O(N)$ time and memory.

---

## Security Considerations

1. **Denial of Service (DoS) via Exception Flooding**: If an unauthenticated API endpoint attempts to cast large batches of invalid strings without error limits, massive exception generation and stack trace serialization can exhaust server CPU cycles.
2. **Unexpected Boolean Authorization**: In authentication systems, ensure that `"false"` or `"0"` strings submitted in role parameters are not loosely evaluated with `bool()`, which would inadvertently grant administrative privileges.

---

## Real-World Usage

- **FastAPI / Pydantic Request Parsing**: REST API frameworks inspect function type annotations, automatically casting incoming HTTP JSON strings to integers, dates, booleans, and nested model instances.
- **Data Engineering (ETL Pipelines)**: Pipelines reading raw CSV datasets cast string columns to categorical enums, timestamps, and floating-point metrics before loading into data warehouses.
- **12-Factor App Configuration**: Cloud-native applications read configuration flags from environment variables, casting strings into integer port numbers, log levels, and database URLs.

---

## Comparison: Built-in Type Constructors

| Constructor | Input Types | Output Type | Failure Condition | Notes |
|---|---|---|---|---|
| **`int()`** | `str`, `float`, `bool` | `int` | Non-numeric chars, decimal strings | Supports `base=2..36` for strings |
| **`float()`** | `str`, `int`, `bool` | `float` | Non-numeric chars | Accepts `"inf"`, `"-inf"`, `"nan"` |
| **`str()`** | Any Python Object | `str` | Never fails (falls back to `repr`) | Produces human-readable string |
| **`bool()`** | Any Python Object | `bool` | Never fails | Evaluates object truthiness |
| **`list()`** | Any Iterable | `list` | Non-iterable input (`int`, `float`) | Creates shallow copy of sequence |
| **`dict()`** | Iterable of 2-tuples | `dict` | Items not length 2 | Maps pairs to key-value dictionary |

---

## Advanced Concepts: The `__index__()` Protocol

For an object to be used as a sequence slice index (e.g., `my_list[custom_index]`), Python requires the object to implement the `__index__()` method (PEP 357). 

Unlike `__int__()`, which is used for arbitrary integer conversions, `__index__()` must return an exact integer and guarantees that the object can losslessly represent an index in memory:

```python
class ChunkIndex:
    def __init__(self, chunk_number: int, chunk_size: int = 64):
        self.offset = chunk_number * chunk_size

    def __index__(self) -> int:
        return self.offset

data = "A" * 512
idx = ChunkIndex(2)  # Offset: 128

# Using custom object directly inside slice syntax!
print("Sliced Data Length:", len(data[idx:]))  # 512 - 128 = 384
```

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that prompts the user for two numbers using `input()`. Convert both inputs to floats, compute their sum, difference, product, and quotient, and print the results rounded to 2 decimal places. Include error handling to catch invalid non-numeric inputs.

### Exercise 2 — Intermediate
Write a function `parse_hex_color(hex_code: str) -> tuple[int, int, int]` that accepts a 6-character hex color string (e.g., `"#FF5733"` or `"FF5733"`), strips the leading `#` if present, parses the Red, Green, and Blue pairs using `int(..., 16)`, and returns an `(r, g, b)` integer tuple.

### Exercise 3 — Advanced
Build a robust `AutoCoerce` class that takes a dictionary of string key-value pairs (simulating raw CSV or query parameters) and attempts to recursively coerce each value: (1) into an integer if it contains only digits, (2) into a float if it is a valid decimal, (3) into a boolean if it matches `"true"`/`"false"`, and (4) leaves it as a string if all casts fail.

---

## Mini Project: 12-Factor App Environment Configuration Manager

### Requirements
Build a production-ready configuration engine named `config_manager.py` that reads application settings from simulated environment variables, enforces mandatory fields, casts values to specified types, and provides default fallbacks.

### Implementation Blueprint
```python
from typing import Any

class ConfigField:
    def __init__(self, key: str, cast_type: type, default: Any = None, required: bool = False):
        self.key = key
        self.cast_type = cast_type
        self.default = default
        self.required = required

class AppConfig:
    def __init__(self, raw_env: dict[str, str], schema: list[ConfigField]):
        self._config = {}
        self._load_and_validate(raw_env, schema)

    def _load_and_validate(self, raw_env: dict[str, str], schema: list[ConfigField]):
        for field in schema:
            raw_val = raw_env.get(field.key)
            
            if raw_val is None:
                if field.required:
                    raise ValueError(f"Missing mandatory configuration variable: '{field.key}'")
                self._config[field.key] = field.default
                continue
                
            # Perform Type Casting
            try:
                if field.cast_type is bool:
                    normalized = raw_val.strip().lower()
                    if normalized in ("true", "1", "yes", "on"):
                        self._config[field.key] = True
                    elif normalized in ("false", "0", "no", "off"):
                        self._config[field.key] = False
                    else:
                        raise ValueError(f"Invalid boolean string '{raw_val}'")
                elif field.cast_type is list:
                    self._config[field.key] = [x.strip() for x in raw_val.split(",") if x.strip()]
                else:
                    self._config[field.key] = field.cast_type(raw_val)
            except Exception as err:
                raise TypeError(f"Failed to cast '{field.key}={raw_val}' to {field.cast_type.__name__}: {err}")

    def get(self, key: str) -> Any:
        return self._config[key]

    def display(self):
        print("=" * 55)
        print("          LOADED APPLICATION CONFIGURATION")
        print("=" * 55)
        for k, v in self._config.items():
            print(f"{k:<25} : {repr(v):<20} ({type(v).__name__})")
        print("=" * 55)

if __name__ == "__main__":
    schema = [
        ConfigField("APP_NAME", str, default="BackendAPI"),
        ConfigField("PORT", int, default=8000),
        ConfigField("DEBUG", bool, default=False),
        ConfigField("RATE_LIMIT", float, default=100.5),
        ConfigField("CORS_ORIGINS", list, default=["*"]),
        ConfigField("DATABASE_URL", str, required=True),
    ]
    
    mock_env = {
        "PORT": "9000",
        "DEBUG": "true",
        "RATE_LIMIT": "250.75",
        "CORS_ORIGINS": "https://myapp.com, https://admin.myapp.com",
        "DATABASE_URL": "postgresql://usr:pwd@localhost:5432/production_db"
    }
    
    config = AppConfig(mock_env, schema)
    config.display()
```

---

## Summary

In this lesson, you mastered the principles and techniques of type casting in Python:
- **Implicit Conversion**: Python automatically promotes numeric types (`int + float` $\rightarrow$ `float`) to preserve precision.
- **Explicit Casting**: Constructors (`int()`, `float()`, `str()`, `bool()`, `list()`, `dict()`) allow intentional object transformation.
- The `int(str, base)` constructor converts strings across arbitrary radix bases ($2$ through $36$).
- **The Boolean Parsing Trap**: `bool("False")` evaluates to `True`; always use explicit matching logic for boolean strings.
- Custom classes participate in casting by implementing dunder methods (`__int__`, `__float__`, `__str__`, `__bool__`, `__index__`).

---

## Best Practices Checklist

- [ ] Wrap user input and external data conversions in `try/except (ValueError, TypeError)` blocks.
- [ ] Never parse boolean strings with `bool(str)`; use a dedicated parser function.
- [ ] Convert decimal strings to `float` first before casting to `int` if truncation is intended (`int(float("3.14"))`).
- [ ] Implement `__str__()` and `__repr__()` on custom classes to provide clean string representations.
- [ ] Avoid unnecessary redundant casting inside performance-critical computational loops.

---

## What's Next?

Now that you understand type conversion and casting, continue to the final article in this module:
👉 **[Mutable vs Immutable Objects](mutable-vs-immutable.md)** to master memory identity, shallow vs deep copying, and mutability pitfalls.
