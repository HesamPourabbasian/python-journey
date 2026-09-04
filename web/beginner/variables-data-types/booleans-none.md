# Booleans & The NoneType in Python

## Introduction

In computational logic, decision-making rests upon two foundational concepts: binary truth evaluation (determining whether a condition is true or false) and the representation of emptiness or the absence of a value. In Python, these concepts are embodied by two core primitive types: the **Boolean type (`bool`)** and the **`NoneType`**.

Booleans provide the logical bedrock for all program branching, conditional execution (`if`/`elif`/`else`), loop termination (`while`), and filtering expressions. Unlike languages where booleans are loosely defined as non-zero numbers or arbitrary flags, Python implements `bool` as a formal built-in type with two immutable singleton instances: `True` and `False`.

Equally critical to robust software design is the representation of "nothingness." In database systems, null fields represent missing or unknown information; in API responses, optional fields may be omitted; and in algorithmic searches, a function must clearly signal when an item could not be found. Python represents this concept using a dedicated singleton object: **`None`**.

Furthermore, Python possesses a rich, intuitive, and language-wide concept known as **Truth Value Testing (Truthiness)**. Every single object in Python—from numbers and strings to empty lists and custom class instances—can be evaluated in a boolean context.

This lesson builds upon [Variables & Data Types](variables.md) and [Dynamic Typing](dynamic-typing.md), providing the logical mechanics needed to master control flow and operators in subsequent modules.

---

## Prerequisites

Before studying booleans and `None`, ensure you have:

- Completed [Variables & Memory Binding](variables.md) and [Dynamic Typing](dynamic-typing.md).
- A basic understanding of conditional statements (`if` statements).
- Familiarity with object identity (`is` vs `==`).

---

## Core Concept

### 1. Booleans and the Integer Lineage
In Python, `bool` is explicitly defined as a direct subclass of `int` (`issubclass(bool, int) == True`). The singleton `True` is equivalent to the integer `1`, and `False` is equivalent to the integer `0`. While `True` and `False` print as text strings, they can participate directly in arithmetic expressions.

### 2. The `None` Singleton
`None` is the sole instance of the `NoneType` class. In CPython, `None` is a pre-allocated singleton object residing at a fixed memory address. There is only ever **one** `None` object in the entire runtime. Because `None` is a singleton, you must **always compare variables to `None` using the identity operator `is`**, never the equality operator `==`.

### 3. Truth Value Testing (Truthiness)
Any Python object can be tested for truth value inside an `if` or `while` condition, or passed to the `bool()` constructor.

```
                           PYTHON TRUTH VALUE EVALUATION
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
          FALSEY OBJECTS                                  TRUTHY OBJECTS
  (Evaluates to False in conditions)              (Evaluates to True in conditions)
  • None                                          • Non-empty strings ("hello", " ")
  • False                                         • Non-zero numbers (1, -42, 3.14)
  • Numeric zeros: 0, 0.0, 0j, Decimal(0)         • Non-empty collections ([1], {"a": 1})
  • Empty sequences: "", (), [], range(0)         • Custom objects returning True from __bool__()
  • Empty mappings/sets: {}, set()                • Custom objects with __len__() > 0
  • Custom objects returning False from __bool__()
```

---

## Syntax & Essential Operations

```python
# 1. Direct Boolean Literals
is_authenticated = True
is_admin = False

# 2. The None Literal
user_profile = None

# 3. Proper Identity Check for None (PEP 8 standard)
if user_profile is None:
    print("No profile currently loaded.")

if user_profile is not None:
    print("Profile exists.")

# 4. Explicit Truth Value Testing
print(bool(0))        # False
print(bool(42))       # True
print(bool(""))       # False
print(bool("Admin"))  # True
print(bool([]))       # False
print(bool([0]))      # True (List is not empty!)
```

---

## Detailed Explanation

### 1. Why `is None` is Mandatory (PEP 8)

The equality operator `==` invokes an object's `__eq__()` method, which can be overridden by custom classes to return misleading results. The identity operator `is`, however, compares raw memory pointers directly at the C level (`Py_None` pointer check).

```python
class DeceptiveItem:
    def __eq__(self, other):
        return True  # Claims to equal EVERYTHING!

bad_item = DeceptiveItem()

# WRONG: Equality check fooled by custom __eq__
print("bad_item == None :", bad_item == None)  # True! ❌ Highly Dangerous!

# CORRECT: Identity check compares physical memory address
print("bad_item is None :", bad_item is None)  # False! ✅ Safe and accurate
```

### 2. The Default Return Value of Functions

In Python, every function returns a value. If a function reaches the end of its body without executing an explicit `return` statement, or if it executes a bare `return` with no arguments, Python **implicitly returns `None`**.

```python
def log_message(msg: str):
    print(f"[LOG] {msg}")
    # No return statement

result = log_message("System starting...")
print("Function returned:", result)         # None
print("Return is None   :", result is None)  # True
```

### 3. Boolean Arithmetic (Subclassing `int`)

Because `bool` inherits from `int`:

```python
print(True + True)     # 2
print(True * 50)       # 50
print(False - 10)      # -10
print(isinstance(True, int))  # True
```

While performing arithmetic with booleans is valid Python, it should be reserved for specific algorithmic tricks (such as summing booleans to count matching conditions: `sum(x > 0 for x in numbers)`).

---

## Examples

### 1. Simple: Testing Truthiness Across Types
Demonstrating how different scalar and collection types evaluate in boolean contexts.

```python
test_values = [
    None, False, True, 0, 1, -15, 0.0, 3.14,
    "", " ", "Python", [], [0], {}, {"key": "val"}, set()
]

print(f"{'Value':<20} {'Type':<15} {'Truthiness (bool)'}")
print("-" * 55)
for val in test_values:
    val_repr = repr(val)
    val_type = type(val).__name__
    is_truthy = bool(val)
    print(f"{val_repr:<20} {val_type:<15} {str(is_truthy)}")
```

### 2. Beginner: Safe Optional Parameter Pattern
Using `None` as a default sentinel value to handle optional arguments safely.

```python
def fetch_user_record(user_id: int, auth_token: str = None) -> dict:
    """Fetch user data, optionally including private metadata if auth_token is provided."""
    base_record = {"id": user_id, "name": "Hesam", "public_email": "hesam@example.com"}
    
    if auth_token is not None:
        # User provided an authentication token
        base_record["ssn_last_four"] = "8821"
        base_record["account_tier"] = "Enterprise"
        
    return base_record

print("Unauthenticated Request:", fetch_user_record(101))
print("Authenticated Request  :", fetch_user_record(101, auth_token="bearer_xyz_999"))
```

### 3. Intermediate: The Mutable Default Argument Trap
Demonstrating why using a mutable object as a default argument is dangerous, and how `None` solves it.

```python
# ANTI-PATTERN: The default list is created ONCE at function definition time!
def buggy_append(item, target_list=[]):
    target_list.append(item)
    return target_list

print("Call 1:", buggy_append("A"))  # ['A']
print("Call 2:", buggy_append("B"))  # ['A', 'B'] ❌ State leaked across calls!

# IDIOMATIC PATTERN: Use None as default sentinel
def safe_append(item, target_list=None):
    if target_list is None:
        target_list = []  # Fresh list allocated on each call
    target_list.append(item)
    return target_list

print("Safe Call 1:", safe_append("A"))  # ['A']
print("Safe Call 2:", safe_append("B"))  # ['B'] ✅ Fully isolated
```

### 4. Real-World: Hierarchical Configuration Fallback Pipeline
Building a configuration resolver that distinguishes between unset parameters (`None`), empty strings (`""`), and boolean flags.

```python
from typing import Any

class ConfigResolver:
    def __init__(self, cli_args: dict, env_vars: dict, file_config: dict):
        self.cli = cli_args
        self.env = env_vars
        self.file = file_config

    def get_setting(self, key: str, default_value: Any = None) -> Any:
        """Resolve settings with precedence: CLI > ENV > ConfigFile > Default."""
        # Check CLI args
        if self.cli.get(key) is not None:
            return self.cli[key]
        # Check Environment variables
        if self.env.get(key) is not None:
            return self.env[key]
        # Check Configuration file
        if self.file.get(key) is not None:
            return self.file[key]
        # Fall back to default
        return default_value

cli_inputs = {"debug": True, "timeout": None}
env_inputs = {"timeout": 30, "db_port": 5432}
file_inputs = {"timeout": 60, "db_port": 3306, "app_name": "CoreService"}

resolver = ConfigResolver(cli_inputs, env_inputs, file_inputs)

print("Resolved 'debug'    :", resolver.get_setting("debug"))     # True (from CLI)
print("Resolved 'timeout'  :", resolver.get_setting("timeout"))   # 30 (from ENV, CLI was None)
print("Resolved 'app_name' :", resolver.get_setting("app_name"))  # CoreService (from File)
print("Resolved 'max_conns':", resolver.get_setting("max_conns", default_value=100)) # 100
```

### 5. Advanced: Custom Truthiness via `__bool__()` and `__len__()`
Controlling how custom objects evaluate in boolean contexts.

```python
class InventoryBatch:
    def __init__(self, batch_id: str, items: list[str]):
        self.batch_id = batch_id
        self.items = items

    def __len__(self) -> int:
        """Called by bool() if __bool__ is not defined."""
        return len(self.items)

    def __bool__(self) -> bool:
        """Explicit boolean definition: truthy only if batch has items and valid ID."""
        return len(self.items) > 0 and bool(self.batch_id.strip())

empty_batch = InventoryBatch(batch_id="BATCH-001", items=[])
active_batch = InventoryBatch(batch_id="BATCH-002", items=["Widget A", "Widget B"])
invalid_batch = InventoryBatch(batch_id="", items=["Widget C"])

print(f"Empty Batch Truthiness   : {bool(empty_batch)}")    # False
print(f"Active Batch Truthiness  : {bool(active_batch)}")   # True
print(f"Invalid Batch Truthiness : {bool(invalid_batch)}")  # False (empty ID)
```

---

## Code Explanation

In Example 5 (Custom Truthiness):
1. When Python evaluates `bool(custom_object)` or tests `if custom_object:`, it first checks if the class defines a `__bool__()` magic method.
2. If `__bool__()` is defined, Python calls it and expects a boolean (`True` or `False`) return value.
3. If `__bool__()` is absent, Python looks for `__len__()`. If `__len__()` returns `0`, the object evaluates as falsey; if `> 0`, it evaluates as truthy.
4. If neither method is defined, all instances of the custom class evaluate as `True` by default.

---

## Common Mistakes

### Mistake 1: Conflating `None`, `0`, `False`, and `""`
Treating all falsey values as interchangeable causes severe bugs when `0` or `False` are valid user inputs.

```python
# BROKEN: Treats a legitimate retry count of 0 as missing!
def set_retries(count=None):
    if not count:  # Fails if count == 0!
        count = 3
    print("Active Retries:", count)

set_retries(0)  # Prints "Active Retries: 3" ❌ Overwrote user input of 0!

# CORRECT:
def set_retries(count=None):
    if count is None:
        count = 3
    print("Active Retries:", count)

set_retries(0)  # Prints "Active Retries: 0" ✅ Preserves valid zero
```

### Mistake 2: Writing `if condition == True:`
Testing boolean equality against `True` with `==` is redundant, un-idiomatic, and can lead to subtle bugs.

```python
# ANTI-PATTERN:
if is_authenticated == True:
    pass

# IDIOMATIC PYTHON:
if is_authenticated:
    pass
```

---

## Best Practices

### Use Dedicated Sentinel Objects When `None` is a Valid Value
If a function accepts `None` as a legitimate, meaningful input argument (e.g., explicitly setting a database field to `NULL`), use a unique sentinel instance created with `object()` to detect whether the argument was omitted.

Good:
```python
_MISSING_SENTINEL = object()

def update_user_email(user_id: int, email: str | None = _MISSING_SENTINEL):
    if email is _MISSING_SENTINEL:
        print("No email update requested. Leaving current email unchanged.")
    elif email is None:
        print("User requested email deletion (Setting database email to NULL).")
    else:
        print(f"Updating user email to: {email}")
```

Avoid:
```python
# Inability to distinguish between 'no argument passed' and 'pass None explicitly'
def update_user_email(user_id: int, email: str | None = None):
    pass
```

---

## Performance Considerations

1. **Identity Pointer Comparisons**: Evaluating `x is None` requires a single CPU pointer comparison instruction (`COMPARE_OP` / `IS_OP` in bytecode). It is virtually instantaneous ($O(1)$) and faster than value equality `x == None` which requires dynamic method dispatch.
2. **Short-Circuit Evaluation**: Python evaluates logical operators (`and`, `or`) from left to right and stops as soon as the outcome is determined. Placing lightweight boolean checks before heavy database queries or network calls maximizes execution throughput.

---

## Security Considerations

1. **Type Confusion in Authentication Flags**: Never perform loose truthiness checks on untrusted string input from HTTP request headers. For example, `bool("False")` evaluates to **`True`** because `"False"` is a non-empty string.
2. **Missing Access Control Checks**: Ensure that missing configuration keys in permission matrices do not default silently to `None` and inadvertently pass loose boolean checks.

---

## Real-World Usage

- **ORM & Database Models (SQLAlchemy / Django)**: Database `NULL` values are mapped directly to Python's `None` singleton across query result sets.
- **REST API Payload Handling**: Serialization libraries (Pydantic / Marshmallow) use `None` to represent optional or omitted JSON keys.
- **Sentinel Signaling**: Standard library data structures (like `queue.Queue` or generator pipelines) use `None` as a "Poison Pill" sentinel to signal background worker threads that processing is complete.

---

## Comparison: Truthiness Matrix

| Value | Type | `is None` | `bool(val)` | Equality with `0` (`val == 0`) |
|---|---|---|---|---|
| **`None`** | `NoneType` | **`True`** | `False` | `False` |
| **`False`** | `bool` | `False` | `False` | **`True`** |
| **`0`** | `int` | `False` | `False` | **`True`** |
| **`0.0`** | `float` | `False` | `False` | **`True`** |
| **`""`** | `str` | `False` | `False` | `False` |
| **`[]`** | `list` | `False` | `False` | `False` |
| **`{}`** | `dict` | `False` | `False` | `False` |

---

## Advanced Concepts: The Internals of `Py_None`

In CPython's C source code (`Objects/object.c`), `None` is defined as a static global struct:

```c
PyObject _Py_NoneStruct = {
    _PyObject_EXTRA_INIT
    1,                  // Reference count starts at 1
    &PyNone_Type        // Pointer to NoneType class
};
```

The macro `#define Py_None (&_Py_NoneStruct)` allows CPython's C runtime to pass pointer references to this single static memory block without allocating or freeing heap memory during the lifecycle of the interpreter.

---

## Exercises

### Exercise 1 — Beginner
Write a Python script containing a list of 8 diverse items. Iterate over the items and print each item, whether it evaluates to `True` or `False` using `bool()`, and whether it is identical to `None` using `is None`.

### Exercise 2 — Intermediate
Write a function named `calculate_discount(price: float, discount_percent: float = None, is_vip: bool = False) -> float`. If `discount_percent` is explicitly provided, use it. If `discount_percent` is `None` and `is_vip` is `True`, apply a default 15% discount. If `is_vip` is `False` and `discount_percent` is `None`, apply zero discount. Return the final price rounded to 2 decimal places.

### Exercise 3 — Advanced
Create a custom class named `SafeLookupDictionary` that wraps a standard dictionary. Implement `__bool__()` such that the object is truthy only if it contains at least one key whose value is not `None`. Include a method `get_or_sentinel(key, default)` that uses a custom `object()` sentinel to distinguish between a key holding `None` versus a missing key.

---

## Mini Project: Sentinel-Aware Data Pipeline Context Engine

### Requirements
Build a production-grade context resolver named `pipeline_context.py` that manages runtime execution flags, validates truthiness, handles missing parameters using unique sentinels, and outputs an execution readiness report.

### Implementation Blueprint
```python
from typing import Any

# Unique module-level private sentinel
_UNSET = object()

class PipelineContext:
    def __init__(self, job_name: str):
        self.job_name = job_name
        self._store = {}

    def set_param(self, key: str, value: Any):
        self._store[key] = value

    def get_param(self, key: str, default: Any = _UNSET) -> Any:
        if key in self._store:
            return self._store[key]
        if default is not _UNSET:
            return default
        raise KeyError(f"Required pipeline parameter '{key}' has not been set.")

    def is_ready_for_execution(self) -> tuple[bool, list[str]]:
        missing_reasons = []
        
        # Check critical parameters
        db_target = self._store.get("db_target")
        if db_target is None:
            missing_reasons.append("Missing database target configuration (is None).")
            
        dry_run = self._store.get("dry_run", False)
        batch_size = self._store.get("batch_size")
        
        if batch_size is None or (isinstance(batch_size, int) and batch_size <= 0):
            missing_reasons.append(f"Invalid batch size: {batch_size}")
            
        is_ready = len(missing_reasons) == 0
        return is_ready, missing_reasons

if __name__ == "__main__":
    context = PipelineContext("CustomerETL_Daily")
    context.set_param("batch_size", 500)
    context.set_param("dry_run", True)
    context.set_param("db_target", None)  # Explicitly unset/null
    
    ready, errors = context.is_ready_for_execution()
    print("=" * 55)
    print(f"Pipeline Job : {context.job_name}")
    print(f"Ready Status : {'✅ READY' if ready else '❌ BLOCKED'}")
    if errors:
        print("Blockers:")
        for err in errors:
            print(f"  - {err}")
    print("=" * 55)
```

---

## Summary

In this lesson, you mastered Python's boolean logic and null-representation model:
- `bool` is a subclass of `int` with two singletons: `True` ($1$) and `False` ($0$).
- `None` is the sole singleton instance of `NoneType`, representing missing or uninitialized values.
- **Always compare to `None` using `is` and `is not`**; never use `== None`.
- Python evaluates the **truthiness** of every object: empty collections, numeric zeros, and `None` evaluate to `False`; all other objects evaluate to `True`.
- Use `None` as the default value for optional function parameters to prevent the mutable default argument trap.
- Use `object()` sentinels when `None` represents a valid, distinct input value.

---

## Best Practices Checklist

- [ ] Compare `None` using `if val is None:` or `if val is not None:`.
- [ ] Never use mutable collections (`[]`, `{}`) as default arguments; use `None`.
- [ ] Write `if is_valid:` instead of `if is_valid == True:`.
- [ ] Avoid loose truthiness checks (`if not count:`) when `0` or `False` are valid inputs.
- [ ] Implement `__bool__()` or `__len__()` on custom classes to define intentional truthiness semantics.

---

## What's Next?

Now that you understand booleans and `None`, continue to:
👉 **[Type Casting & Conversion](type-casting.md)** to learn how to safely convert between data types, parse strings, and handle conversion exceptions.
