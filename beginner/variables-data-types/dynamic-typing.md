# Dynamic Typing vs Static Typing in Python

## Introduction

In programming language theory, type systems define how programming languages classify, store, and manipulate data. The design of a language's type system profoundly influences how developers write code, how bugs are detected, how fast software can be prototyped, and how programs execute on physical hardware. Python is fundamentally designed as a **dynamically typed, strongly typed** language.

Many beginners confuse dynamic typing with weak typing, leading to significant misunderstandings about how Python enforces program correctness. Dynamic typing means that **types are associated with runtime values (objects), not with variable names**, and type checking occurs dynamically during program execution rather than during a separate compilation step. Strong typing means that Python strictly enforces type safety at runtime: the interpreter will never silently coerce incompatible data types into one another in undefined or dangerous ways.

The dynamic nature of Python gives rise to one of its most powerful and expressive programming paradigms: **Duck Typing**. Duck typing allows developers to write flexible, polymorphic code that focuses on what an object can *do* (its behavior and methods) rather than what class it explicitly inherits from. In recent years, Python has expanded its typing capabilities by introducing **gradual typing** via type hints (PEP 484), allowing developers to combine the flexibility of dynamic execution with the safety of static analysis tools like Mypy.

This lesson builds directly upon [Variables & Memory Binding](variables.md) and provides the conceptual clarity necessary to understand primitive scalar types, type casting, and object collections in subsequent chapters.

---

## Prerequisites

Before studying dynamic typing, ensure you have:

- Completed [Variables & Memory Binding](variables.md).
- A clear understanding of the Python object model (everything is an object on the heap).
- Familiarity with executing scripts and reading terminal traceback errors.

---

## Core Concept

To understand Python's type system, we must examine two orthogonal dimensions of language design:

```
                      TYPE SYSTEM CLASSIFICATION MATRIX

                  DYNAMIC TYPING                      STATIC TYPING
         (Types checked at runtime)           (Types checked at compile time)
       +------------------------------------+----------------------------------+
STRONG | Python, Ruby, Elixir               | Rust, Go, Java, Swift, Haskell   |
TYPING | • Types bound to objects           | • Types bound to variables       |
       | • Strict type boundaries           | • Strict type boundaries         |
       | • No implicit unsafe coercion      | • Compiler rejects type errors   |
       +------------------------------------+----------------------------------+
WEAK   | JavaScript, PHP, Perl              | C, C++                           |
TYPING | • Types bound to objects           | • Types bound to variables       |
       | • Implicit automatic coercion      | • Memory reinterpretation        |
       | • Example: "5" + 2 == "52"         | • Pointers castable arbitrarily  |
       +------------------------------------+----------------------------------+
```

### 1. Dynamic Typing Mechanics
In Python, variables do not possess types. A variable is merely a name bound to an object. When you re-bind a variable from an integer to a string, no memory re-allocation or type mutation occurs to the original integer; the variable name simply points to a different object on the heap.

### 2. Strong Typing Mechanics
Python strictly prevents operations between incompatible types. If you attempt to add an integer to a string (`10 + "5"`), Python raises a runtime `TypeError` rather than guessing whether to convert the integer to text or parse the string as a number.

### 3. Duck Typing Philosophy
Coined by poet James Whitcomb Riley, the phrase *"If it walks like a duck and quacks like a duck, it's a duck"* defines Python's polymorphism. If an object implements the required methods (e.g., `.read()` or `.write()`), Python code can use it regardless of its explicit class hierarchy.

---

## Syntax & Type Introspection Tools

Python provides powerful built-in functions to inspect, query, and validate object types at runtime:

```python
data_payload = "Python 3.12"

# 1. Inspect exact type class
print(type(data_payload))  # <class 'str'>

# 2. Recommended runtime validation using isinstance()
if isinstance(data_payload, str):
    print("Payload is verified as a string.")

# 3. Validating against multiple permitted types
value = 42.5
if isinstance(value, (int, float)):
    print("Value is numeric.")

# 4. Modern Python type annotations (Gradual Typing)
def calculate_velocity(distance_meters: float, time_seconds: float) -> float:
    return distance_meters / time_seconds
```

---

## Detailed Explanation

### 1. Why `isinstance()` is Superior to `type() ==`

When validating types at runtime, always use `isinstance(object, class_or_tuple)` rather than `type(object) == class_type`. The `isinstance()` function properly respects **object-oriented inheritance**:

```python
class CustomList(list):
    """A specialized subclass of Python's built-in list."""
    pass

my_list = CustomList([1, 2, 3])

# WRONG: Breaks inheritance! Returns False because type is CustomList, not list.
print("type() equality check      :", type(my_list) == list)       # False ❌

# CORRECT: Respects inheritance! Returns True because CustomList IS-A list.
print("isinstance() hierarchy check:", isinstance(my_list, list))  # True  ✅
```

### 2. Duck Typing in Practice (EAFP vs LBYL)

Python culture heavily favors the **EAFP** (*Easier to Ask for Forgiveness than Permission*) design pattern over **LBYL** (*Look Before You Leap*).

In LBYL, you rigorously check an object's type or attributes before performing an action:
```python
# LBYL Approach (Non-idiomatic in Python)
def log_length(item):
    if hasattr(item, "__len__"):
        print(f"Length: {len(item)}")
    else:
        print("Item has no length.")
```

In EAFP, you attempt the operation directly inside a `try/except` block, allowing duck typing to work cleanly:
```python
# EAFP Approach (Idiomatic Python)
def log_length(item):
    try:
        print(f"Length: {len(item)}")
    except TypeError:
        print("Item has no length.")
```

### 3. Gradual Typing and Type Hints (PEP 484)

Starting in Python 3.5 and fully modernized in Python 3.10+, Python supports **Type Hints**. It is vital to understand that:
- Type hints **do not enforce runtime type constraints**. Python will not raise an error if you pass an integer to a function annotated with `str`.
- Type hints are consumed by **static analysis tools** (Mypy, Pyright, Ruff) and IDEs to detect bugs before code is deployed.

```python
def format_greeting(name: str) -> str:
    # Python executes this happily even if name is an int at runtime!
    return f"Hello, {name}"
```

---

## Examples

### 1. Simple: Demonstrating Dynamic Re-binding
Showing how a single variable identifier seamlessly transitions between distinct object types.

```python
# Variable starts bound to an integer
resource_counter = 0
print(f"Value: {resource_counter:<10} Type: {type(resource_counter).__name__}")

# Re-bound to a floating-point number
resource_counter = 99.85
print(f"Value: {resource_counter:<10} Type: {type(resource_counter).__name__}")

# Re-bound to a list
resource_counter = ["node-1", "node-2"]
print(f"Value: {str(resource_counter):<10} Type: {type(resource_counter).__name__}")
```

### 2. Beginner: Strong Typing Enforcement
Proving that Python refuses implicit dangerous type conversions.

```python
price = 199
currency_symbol = "$"

try:
    # Attempting to concatenate integer and string
    formatted_price = currency_symbol + price
except TypeError as err:
    print("Caught expected TypeError:", err)
    # Explicit conversion required:
    formatted_price = currency_symbol + str(price)
    print("Corrected Formatted Price :", formatted_price)
```

### 3. Intermediate: Polymorphic Duck Typing
Building a data export pipeline that works with any object that provides a `.write()` interface.

```python
import io

class CloudStorageWriter:
    def __init__(self):
        self.buffer = []
        
    def write(self, data: str):
        self.buffer.append(data)
        print(f"[CloudStorage] Uploaded chunk: {data.strip()}")

def export_metrics(sink, metrics: dict):
    """Sink can be ANY object with a write() method (File, StringIO, CloudStorage)."""
    sink.write("--- METRIC REPORT ---\n")
    for key, value in metrics.items():
        sink.write(f"{key}: {value}\n")
    sink.write("----------------------\n")

# Use with an in-memory string buffer
string_stream = io.StringIO()
export_metrics(string_stream, {"cpu_load": "45%", "memory_used": "1.2GB"})
print("Result in memory:\n", string_stream.getvalue())

# Use with custom CloudStorageWriter duck-typed object
cloud_sink = CloudStorageWriter()
export_metrics(cloud_sink, {"database_status": "ONLINE", "active_threads": 16})
```

### 4. Real-World: Dynamic API Payload Normalizer
Processing heterogeneous incoming API data with dynamic type dispatching.

```python
from typing import Any

def normalize_telemetry_value(raw_val: Any) -> float:
    """Normalize mixed integer, string, float, or boolean values into a clean float."""
    if isinstance(raw_val, bool):
        # Python bool is a subclass of int, so handle bool first!
        return 1.0 if raw_val else 0.0
    elif isinstance(raw_val, (int, float)):
        return float(raw_val)
    elif isinstance(raw_val, str):
        cleaned = raw_val.strip().replace("%", "").replace("ms", "")
        try:
            return float(cleaned)
        except ValueError:
            raise ValueError(f"Cannot parse telemetry string: '{raw_val}'")
    else:
        raise TypeError(f"Unsupported payload type: {type(raw_val).__name__}")

# Process batch of dirty data
raw_inputs = [42, " 88.5% ", True, 105.2, "120ms", False]
clean_outputs = [normalize_telemetry_value(item) for item in raw_inputs]
print("Normalized Telemetry Floats:", clean_outputs)
```

### 5. Advanced: Structural Type Checking with `collections.abc`
Validating structural capabilities using standard library Abstract Base Classes.

```python
from collections.abc import Iterable, Mapping, Sequence

def inspect_data_structure(obj: Any):
    print(f"Analyzing object of type: {type(obj).__name__}")
    
    # Check if object behaves like a key-value mapping (dict)
    if isinstance(obj, Mapping):
        print("  -> Implements Mapping interface (Keys & Values)")
        print(f"  -> Total Keys: {len(obj)}")
    # Check if object is an ordered sequence (list, tuple, str)
    elif isinstance(obj, Sequence):
        print("  -> Implements Sequence interface (Indexable & Sized)")
        print(f"  -> First element: {obj[0] if len(obj) > 0 else 'Empty'}")
    # Check if object is a generic iterable
    elif isinstance(obj, Iterable):
        print("  -> Implements Iterable interface (Can be looped over)")
    else:
        print("  -> Scalar non-iterable value")

# Test diverse structures
inspect_data_structure({"user": "Hesam", "role": "Admin"})
inspect_data_structure(["alpha", "beta", "gamma"])
inspect_data_structure(range(1, 10))
inspect_data_structure(1048576)
```

---

## Code Explanation

In Example 5 (Structural Type Checking):
1. The `collections.abc` module provides formal Abstract Base Classes representing structural interfaces rather than concrete classes.
2. `Mapping` represents any dictionary-like object supporting `__getitem__`, `keys()`, and `values()`.
3. `Sequence` represents indexable collections like `list`, `tuple`, or `str` supporting `__len__` and integer indexing.
4. `Iterable` represents any object supporting `__iter__` that can be passed into a `for` loop.
5. Using `collections.abc` allows your code to validate capabilities rather than restricting arguments to concrete classes like `dict` or `list`, maximizing reusability.

---

## Common Mistakes

### Mistake 1: Relying on `type(x) is int` Instead of `isinstance()`
Direct type identity checks break subclassing and standard library polymorphism.

```python
# BROKEN:
def is_number(val):
    return type(val) is int or type(val) is float  # Fails for custom subclasses!

# CORRECT:
def is_number(val):
    return isinstance(val, (int, float)) and not isinstance(val, bool)
```

### Mistake 2: Assuming Type Hints Validate Data at Runtime
Novice developers often assume adding `: int` prevents a function from being called with a string.

```python
def process_id(identifier: int):
    # This runs without error even if identifier="abc"!
    print("ID:", identifier)

process_id("abc")  # Python runtime DOES NOT raise TypeError here!
```

**How to avoid:** Use runtime validation libraries (such as Pydantic) or explicit `isinstance()` assertions if runtime validation of untrusted input is required.

---

## Best Practices

### Embrace Duck Typing While Documenting with Type Hints
Combine the agility of Python's duck typing with the readability and static verification of PEP 484 type hints.

Good:
```python
from collections.abc import Sequence

def compute_median(data: Sequence[float]) -> float:
    """Accepts any indexable sequence (list, tuple, array) and returns median."""
    if not data:
        raise ValueError("Cannot compute median of empty sequence.")
    sorted_data = sorted(data)
    mid = len(sorted_data) // 2
    return sorted_data[mid]
```

Avoid:
```python
# Rigidly requiring a concrete 'list' when any sequence would work perfectly
def compute_median(data: list) -> float:
    pass
```

---

## Performance Considerations

1. **Dynamic Type Overhead**: Because Python must check types dynamically at runtime, simple operations (such as adding two numbers in a loop) involve function dispatch overhead to resolve the `__add__` dunder method.
2. **Specializing Adaptive Interpreter (Python 3.11+)**: Python 3.11 mitigates dynamic typing overhead by monitoring variables in bytecode. If a function consistently receives floats, the interpreter replaces the generic dynamic dispatch opcode with an optimized float-specific opcode.
3. **Mypyc and Cython**: For computational bottlenecks, tools like Cython or Mypyc compile type-annotated Python code directly into optimized C-extensions, executing at native compiled speeds.

---

## Security Considerations

1. **Denial of Service (DoS) via Unexpected Types**: If an API endpoint expects a string but receives a nested dictionary or recursive list from an attacker, unvalidated operations can trigger unhandled crashes or quadratic CPU consumption. Always validate input shapes.
2. **Type Confusion Vulnerabilities**: In security-sensitive operations (such as authentication or role authorization), never rely on truthiness or loose equality. Explicitly check types before verifying permissions.

---

## Real-World Usage

- **FastAPI & Pydantic**: Modern backend web frameworks use Python type annotations combined with runtime metaclasses to automatically validate JSON payloads, parse request parameters, and generate interactive OpenAPI documentation.
- **Data Science Pipelines**: Data processing engines (Pandas, Polars) use dynamic type inference to automatically determine column schemas when ingesting unstructured CSV and JSON data.
- **Plugin Architectures**: Enterprise systems define Protocol interfaces, allowing third-party developers to dynamically write plugins that conform to required system interfaces.

---

## Comparison: Type Systems Breakdown

| Feature | Python | JavaScript | Rust | C |
|---|---|---|---|---|
| **Type Checking** | Dynamic (Runtime) | Dynamic (Runtime) | Static (Compile-time) | Static (Compile-time) |
| **Type Strength** | Strong | Weak | Strong | Weak |
| **Variable Typing** | Untyped names | Untyped names | Strictly typed | Strictly typed |
| **Implicit Coercion** | No (`"1" + 2` $\rightarrow$ Error) | Yes (`"1" + 2` $\rightarrow$ `"12"`) | No | Yes (Integer truncation) |
| **Static Verification** | Optional (Mypy) | Optional (TypeScript)| Mandatory (Rustc) | Mandatory (GCC/Clang) |

---

## Advanced Concepts: Type Narrowing and `TypeGuard`

In Python 3.10+, static type checkers support **Type Narrowing** using `TypeGuard` (from `typing`):

```python
from typing import TypeGuard, Any

def is_string_list(val: list[Any]) -> TypeGuard[list[str]]:
    """Determine whether all elements in the list are strings."""
    return all(isinstance(x, str) for x in val)

def process_items(items: list[Any]):
    if is_string_list(items):
        # Static type checker (Mypy) now KNOWS items is list[str]!
        joined = ", ".join(items)
        print("Joined text:", joined)
    else:
        print("List contains non-string elements.")
```

`TypeGuard` bridges the gap between dynamic runtime assertions and static compile-time type inference.

---

## Exercises

### Exercise 1 — Beginner
Create a list containing values of 6 different types (`int`, `float`, `str`, `bool`, `list`, `None`). Iterate over the list and print each item's value alongside its exact type name using `type(item).__name__`.

### Exercise 2 — Intermediate
Write a function named `safe_multiply(a, b)` that accepts two arguments. If both are numbers (`int` or `float`, but not `bool`), return their product. If one is a string and the other is an integer, return the repeated string. In any other case, raise a descriptive `TypeError`.

### Exercise 3 — Advanced
Create a custom class named `InMemoryLogStream` that implements a `.write(msg: str)` method and a `.flush()` method. Pass an instance of your custom class to a function that expects a standard file-like object, proving duck typing compatibility without inheriting from any file class.

---

## Mini Project: Polymorphic Data Sanitizer Engine

### Requirements
Build a script named `data_sanitizer.py` that ingests unstructured raw dictionaries from external APIs, inspects types dynamically, strips dangerous characters from strings, rounds floats to two decimal places, converts integers, and flags unsupported types.

### Implementation Blueprint
```python
from typing import Any
from collections.abc import Mapping

def sanitize_value(val: Any) -> Any:
    # 1. Handle Booleans first (before int check!)
    if isinstance(val, bool):
        return val
    # 2. Handle Integers
    elif isinstance(val, int):
        return val
    # 3. Handle Floats
    elif isinstance(val, float):
        return round(val, 2)
    # 4. Handle Strings
    elif isinstance(val, str):
        # Strip whitespace and sanitize basic HTML/script brackets
        return val.strip().replace("<", "&lt;").replace(">", "&gt;")
    # 5. Handle Nested Dictionaries (Recursive Duck Typing)
    elif isinstance(val, Mapping):
        return {k: sanitize_value(v) for k, v in val.items()}
    # 6. Handle Lists/Tuples
    elif isinstance(val, (list, tuple)):
        return [sanitize_value(item) for item in val]
    elif val is None:
        return None
    else:
        return f"[UNSUPPORTED TYPE: {type(val).__name__}]"

def sanitize_payload(payload: dict) -> dict:
    print("Sanitizing Raw Data Payload...")
    return {k: sanitize_value(v) for k, v in payload.items()}

if __name__ == "__main__":
    raw_api_data = {
        "user_id": 9182,
        "username": "  <script>alert('hack')</script> Hesam  ",
        "account_balance": 149.85921,
        "is_vip": True,
        "metadata": {
            "last_login_ip": " 192.168.1.1 ",
            "score": 98.441
        },
        "tags": [" python ", " developer ", "<admin>"]
    }
    
    clean_data = sanitize_payload(raw_api_data)
    import pprint
    pprint.pprint(clean_data)
```

---

## Summary

In this lesson, you explored the principles of Python's dynamic and strong type system:
- Python is **dynamically typed**: types belong to runtime objects, not variable identifiers.
- Python is **strongly typed**: it never performs dangerous implicit type coercion between incompatible types.
- **Duck Typing** allows flexible polymorphism based on object behavior rather than explicit class inheritance.
- Always use `isinstance(obj, Class)` for runtime type validation; never use `type(x) == Class`.
- Type hints provide static documentation and compile-time validation via Mypy without affecting runtime execution.

---

## Best Practices Checklist

- [ ] Use `isinstance()` for runtime type checks to respect class inheritance.
- [ ] Remember that `bool` is a subclass of `int` in Python (`isinstance(True, int)` is `True`).
- [ ] Embrace the EAFP (*Easier to Ask for Forgiveness*) idiom over rigid type checking.
- [ ] Use `collections.abc` (such as `Iterable`, `Sequence`, `Mapping`) for structural type validation.
- [ ] Annotate function signatures with modern type hints to assist static analysis tools.

---

## What's Next?

Now that you understand Python's dynamic type system, continue to:
👉 **[Integers & Floats](integers-floats.md)** to master arbitrary-precision integer arithmetic, IEEE 754 floating-point precision, and the `decimal` module.
