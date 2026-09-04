# Descriptors & Attribute Lookup Protocol in Python

## Introduction

In Python, the dot operator (`obj.attribute`) appears deceivingly simple. Yet beneath this familiar syntax lies the single most powerful architectural mechanism in Python's object model: the **Descriptor Protocol**.

Descriptors are the hidden engine powering Python's most fundamental language features:
- How **`@property`** getters and setters intercept attribute reads and writes.
- How standard functions defined inside classes automatically transform into **Bound Methods** passing `self`.
- How **`@classmethod`** and **`@staticmethod`** alter method invocation contexts.
- How enterprise ORMs (like **SQLAlchemy** and **Django ORM**) validate column types, track dirty attributes, and map Python fields to relational database tables.

A **Descriptor** is any Python object that implements at least one of the protocol methods: **`__get__()`**, **`__set__()`**, **`__delete__()`**, or **`__set_name__()`**.

By mastering descriptors, you transition from writing standard classes to building sophisticated reusable domain validation engines, custom ORMs, and high-performance caching systems.

This lesson explores the descriptor protocol, the difference between **Data and Non-Data Descriptors**, the exact **5-step attribute lookup precedence hierarchy**, and building production-grade typed field validators.

---

## Prerequisites

Before studying descriptors, ensure you have:

- Completed [Classes & Objects](../oop/classes-and-objects.md) and [Encapsulation & Properties](../oop/encapsulation-and-properties.md).
- Completed [Magic & Dunder Methods](../oop/magic-methods-dunder.md).
- Solid understanding of instance dictionaries (`obj.__dict__`).

---

## Core Concept: The Descriptor Protocol & Attribute Lookup Order

```
                             THE DESCRIPTOR PROTOCOL (PEP 487)

      class ValidatedField:
          def __set_name__(self, owner, name): ...    <--- Captures attribute name ("price")
          def __get__(self, instance, owner=None): ... <--- Intercepts attribute read: obj.price
          def __set__(self, instance, value): ...      <--- Intercepts assignment: obj.price = 100
          def __delete__(self, instance): ...          <--- Intercepts deletion: del obj.price

                       THE 5-STEP ATTRIBUTE LOOKUP PRECEDENCE HIERARCHY

                                 Evaluating: obj.attribute
                                            │
               1. Data Descriptor? ─────────┼──► YES: Call DataDescriptor.__get__(obj)
                  (Has __set__ or __delete__)│
                                            ▼ NO
               2. Instance Dictionary? ─────┼──► YES: Return obj.__dict__["attribute"]
                                            │
                                            ▼ NO
               3. Non-Data Descriptor? ─────┼──► YES: Call NonDataDescriptor.__get__(obj)
                  (Has __get__ ONLY)        │
                                            ▼ NO
               4. Class / MRO Attribute? ───┼──► YES: Return Class.__dict__["attribute"]
                                            │
                                            ▼ NO
               5. __getattr__() defined? ───┴──► Call obj.__getattr__("attribute") / KeyError
```

---

## Syntax & Essential Descriptor Patterns

```python
# 1. Production Data Descriptor with __set_name__ (Python 3.6+ PEP 487)
class NonNegativeNumber:
    def __set_name__(self, owner, name):
        # Automatically called at class creation time!
        self.public_name = name
        self.private_name = f"_{name}"

    def __get__(self, instance, owner=None):
        if instance is None:
            return self  # Accessing via Class (e.g. Product.price) returns descriptor itself!
        return getattr(instance, self.private_name, 0.0)

    def __set__(self, instance, value):
        if not isinstance(value, (int, float)) or value < 0:
            raise ValueError(f"Attribute '{self.public_name}' must be a non-negative number. Got: {value}")
        setattr(instance, self.private_name, value)

    def __delete__(self, instance):
        raise AttributeError(f"Cannot delete attribute '{self.public_name}'")

# 2. Consuming Descriptors in Domain Classes
class Product:
    # Descriptors MUST be declared as CLASS attributes!
    price = NonNegativeNumber()
    stock = NonNegativeNumber()

    def __init__(self, name: str, price: float, stock: int):
        self.name = name
        self.price = price  # Invokes NonNegativeNumber.__set__()
        self.stock = stock  # Invokes NonNegativeNumber.__set__()

item = Product("Mechanical Keyboard", price=149.99, stock=20)
print(f"Product: {item.name} │ Price: ${item.price} │ Stock: {item.stock}")

# Validation failure test:
try:
    item.price = -50.0  # Raises ValueError!
except ValueError as err:
    print(f"Validation Guard Caught Error: {err}")
```

---

## Detailed Explanation

### 1. Data vs Non-Data Descriptors

The distinction between Data and Non-Data descriptors is crucial because it dictates attribute lookup precedence:

- **Data Descriptor**: Implements **`__set__()`** or **`__delete__()`** (and usually `__get__()`).
  - *Precedence Rule*: **Overrides instance dictionaries!** If `obj.__dict__["x"] = 99` and class `Foo` has a Data Descriptor `x`, accessing `obj.x` invokes the descriptor's `__get__()`, ignoring `obj.__dict__`.
- **Non-Data Descriptor**: Implements **`__get__()` ONLY** (no `__set__` or `__delete__`).
  - *Precedence Rule*: **Can be shadowed by instance dictionaries!** If an attribute with the same name is written to `obj.__dict__["x"]`, subsequent access returns the dictionary value directly, bypassing the descriptor.
  - *Example*: Standard Python methods and `@cached_property` are non-data descriptors.

---

### 2. How Functions Become Bound Methods via `__get__`

Ever wondered how writing `def my_method(self):` inside a class automatically passes the instance as `self`?

In Python, **all function objects are Non-Data Descriptors** implementing `__get__()`:

```c
/* CPython Function Type Object (__get__ method) */
static PyObject *
func_descr_get(PyObject *func, PyObject *obj, PyObject *type) {
    if (obj == NULL || obj == Py_None) {
        Py_INCREF(func);
        return func; // Unbound function! (Accessed via Class: MyClass.my_method)
    }
    return PyMethod_New(func, obj); // Bound Method! Binds (func, instance)
}
```

When you call `my_instance.my_method()`:
1. Python executes `MyClass.__dict__["my_method"].__get__(my_instance, MyClass)`.
2. The function's `__get__()` returns a **`MethodType`** bound method object.
3. When called, the bound method automatically inserts `my_instance` as the first argument (`self`).

---

### 3. The `__set_name__` Protocol (PEP 487)

Before Python 3.6, descriptors required passing their variable name explicitly to `__init__` (`price = Field("price")`), which was redundant and error-prone.

With **`__set_name__(self, owner, name)`**:
- When the class definition finishes compiling, CPython inspects all class attributes.
- If any attribute implements `__set_name__`, CPython invokes it automatically:
  ```python
  descriptor.__set_name__(owner_class, "price")
  ```
- The descriptor learns its exact public attribute name and can construct private storage keys (`_price`) automatically.

---

## Examples

### 1. Simple: Read-Only Constant Descriptor
A minimal non-data descriptor returning a computed constant.

```python
class EnvironmentDescriptor:
    def __get__(self, instance, owner=None):
        if instance is None: return self
        import platform
        return f"{platform.system()} {platform.machine()}"

class SystemDiagnostics:
    env_info = EnvironmentDescriptor()

diag = SystemDiagnostics()
print("System Diagnostics Environment:", diag.env_info)
```

### 2. Beginner: Typed String Validator Descriptor
Enforcing minimum and maximum string length invariants.

```python
class ValidatedString:
    def __init__(self, min_len: int = 1, max_len: int = 100):
        self.min_len = min_len
        self.max_len = max_len

    def __set_name__(self, owner, name):
        self.storage_name = f"_{name}"
        self.field_name = name

    def __get__(self, instance, owner=None):
        if instance is None: return self
        return getattr(instance, self.storage_name, "")

    def __set__(self, instance, value):
        if not isinstance(value, str):
            raise TypeError(f"Field '{self.field_name}' must be a string. Got {type(value).__name__}")
        if not (self.min_len <= len(value) <= self.max_len):
            raise ValueError(f"Field '{self.field_name}' length must be between {self.min_len} and {self.max_len} chars.")
        setattr(instance, self.storage_name, value)

class UserProfile:
    username = ValidatedString(min_len=3, max_len=20)
    bio = ValidatedString(min_len=0, max_len=150)

    def __init__(self, username: str, bio: str = ""):
        self.username = username
        self.bio = bio

user = UserProfile("hesamp", "Senior Python Systems Engineer")
print(f"Created User: {user.username} | Bio: {user.bio}")
```

### 3. Intermediate: Rebuilding Python's `@property` Decorator from Scratch
Implementing an exact clone of Python's built-in `property` class using the descriptor protocol.

```python
class CustomProperty:
    """A pure-Python re-implementation of the built-in property descriptor."""
    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        self.__doc__ = doc or (fget.__doc__ if fget else None)

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        if self.fget is None:
            raise AttributeError("Unreadable attribute")
        return self.fget(instance)

    def __set__(self, instance, value):
        if self.fset is None:
            raise AttributeError("Can't set attribute (Read-Only Property)")
        self.fset(instance, value)

    def setter(self, fset):
        return type(self)(self.fget, fset, self.fdel, self.__doc__)

# Test Custom Property
class BankAccount:
    def __init__(self, balance: float):
        self._balance = balance

    @CustomProperty
    def balance(self) -> float:
        return self._balance

    @balance.setter
    def balance(self, new_balance: float):
        if new_balance < 0: raise ValueError("Balance cannot be negative.")
        self._balance = new_balance

acc = BankAccount(500.0)
print("Account Balance via Custom Property:", acc.balance)
acc.balance = 750.0
print("Updated Balance:", acc.balance)
```

### 4. Real-World: Lazy Cached Property Descriptor (`@cached_property`)
Building a non-data descriptor that executes an expensive computation once, caches the result directly in `instance.__dict__`, and bypasses subsequent descriptor execution.

```python
import time

class LazyCachedProperty:
    """Non-Data Descriptor that caches result into instance.__dict__ on first access."""
    def __init__(self, func):
        self.func = func
        self.__doc__ = func.__doc__
        self.__name__ = func.__name__

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        
        # Execute expensive calculation
        print(f"⚙️ [COMPUTING] Running expensive calculation for '{self.__name__}'...")
        value = self.func(instance)
        
        # Store directly in instance dictionary!
        # Because this is a NON-DATA descriptor, subsequent accesses will find
        # the value in instance.__dict__ and bypass __get__() completely!
        instance.__dict__[self.__name__] = value
        return value

class DatasetAnalyzer:
    def __init__(self, records: list[int]):
        self.records = records

    @LazyCachedProperty
    def heavy_statistical_variance(self) -> float:
        time.sleep(0.05)  # Simulate expensive CPU computation
        avg = sum(self.records) / len(self.records)
        return sum((x - avg) ** 2 for x in self.records) / len(self.records)

analyzer = DatasetAnalyzer([10, 20, 30, 40, 50])

print("First Access (Computes) :", analyzer.heavy_statistical_variance)
print("Second Access (Cached)  :", analyzer.heavy_statistical_variance) # Instant O(1) dict lookup!
```

### 5. Advanced: Complete ORM Model & Typed Column Descriptor Engine
Building a declarative ORM field descriptor engine with type validation and dirty-tracking.

```python
class ColumnDescriptor:
    def __init__(self, data_type: type, primary_key: bool = False, nullable: bool = True):
        self.data_type = data_type
        self.primary_key = primary_key
        self.nullable = nullable

    def __set_name__(self, owner, name):
        self.name = name
        self.storage_key = f"_col_{name}"

    def __get__(self, instance, owner=None):
        if instance is None: return self
        return getattr(instance, self.storage_key, None)

    def __set__(self, instance, value):
        if value is None:
            if not self.nullable:
                raise ValueError(f"Column '{self.name}' cannot be null.")
        elif not isinstance(value, self.data_type):
            raise TypeError(f"Column '{self.name}' must be of type {self.data_type.__name__}. Got {type(value).__name__}")

        setattr(instance, self.storage_key, value)
        
        # Track dirty mutation state
        if hasattr(instance, "_dirty_fields"):
            instance._dirty_fields.add(self.name)

class DeclarativeModel:
    def __init__(self, **kwargs):
        self._dirty_fields = set()
        for k, v in kwargs.items():
            setattr(self, k, v)

class ServerNodeModel(DeclarativeModel):
    id = ColumnDescriptor(int, primary_key=True)
    hostname = ColumnDescriptor(str, nullable=False)
    ip_address = ColumnDescriptor(str, nullable=False)
    cpu_cores = ColumnDescriptor(int, nullable=False)

node = ServerNodeModel(id=1, hostname="edge-router-01", ip_address="10.0.1.1", cpu_cores=16)
print(f"Model Created: #{node.id} {node.hostname} (IP: {node.ip_address})")

node.hostname = "edge-router-01-renamed"
print(f"Dirty Fields Tracked: {node._dirty_fields}")
```

---

## Code Explanation

In Example 4 (`LazyCachedProperty`):
1. `LazyCachedProperty` implements **`__get__()` ONLY** (making it a **Non-Data Descriptor**).
2. On the first access (`analyzer.heavy_statistical_variance`), Python checks the 5-step hierarchy:
   - Step 1: No Data Descriptor exists.
   - Step 2: `heavy_statistical_variance` is not in `analyzer.__dict__`.
   - Step 3: It finds the Non-Data Descriptor and calls `__get__()`.
3. Inside `__get__()`, the result is computed and written to **`instance.__dict__["heavy_statistical_variance"] = value`**.
4. On the second access, Python's **Step 2 (Instance Dictionary)** matches immediately! The descriptor's `__get__()` is completely bypassed, delivering instant $O(1)$ cached access.

---

## Common Mistakes

### Mistake 1: Storing Instance State Directly on the Descriptor (`self.value = value`)
This is the single most catastrophic descriptor bug:
```python
# 🚨 DISASTROUS BUG:
class BrokenDescriptor:
    def __set__(self, instance, value):
        self.value = value # 💥 Stores value on DESCRIPTOR, not the instance!

class User:
    age = BrokenDescriptor()

u1 = User(); u1.age = 25
u2 = User(); u2.age = 40
print(u1.age) # Prints 40! u2 overwrote u1's state because descriptors are class singletons!
```
$$\textbf{Rule: Descriptors must store state inside \texttt{instance.\_\_dict\_\_}, NEVER on \texttt{self}!}$$

### Mistake 2: Defining Descriptors Inside `__init__`
Writing `self.field = ValidatedField()` inside `__init__` creates an instance attribute, **not a descriptor**. Descriptors must **always be defined at the Class level**.

---

## Best Practices

### Use `__set_name__` in All Custom Descriptors
Always implement `__set_name__(self, owner, name)` to automatically capture attribute names without requiring manual string parameters.

Good:
```python
class TypedField:
    def __set_name__(self, owner, name):
        self.name = name
        self.storage = f"_{name}"
```

---

## Performance Considerations

- **Direct Dict Access (`obj.attr`)**: ~25 nanoseconds.
- **Descriptor Access (`Descriptor.__get__`)**: ~60 nanoseconds.
- In performance-critical numerical loops executed billions of times, cache descriptor values in local variables (`val = obj.price`) to avoid repeating descriptor protocol invocations on every iteration.

---

## Security Considerations

1. **Defending Against Direct `__dict__` Manipulation**: Malicious code or accidental bugs can bypass descriptor validation by writing directly to `obj.__dict__["_price"] = -999`. In security-critical domains, freeze instances (`frozen=True` or `__setattr__` overrides).

---

## Real-World Usage

- **SQLAlchemy & Django ORM**: Defining model columns and foreign key relationships.
- **Pydantic**: Field validators and schema parsers.
- **Standard Library `@cached_property` (`functools`)**: Lazy-loading database attributes and parsed headers.

---

## Comparison: Attribute Access Customization

| Technique | Scope | Precedence | Best Used For |
|---|---|---|---|
| **Data Descriptor** | Class-level | **Highest (Overrides `__dict__`)**| **Reusable field validation, ORMs** |
| **Non-Data Descriptor**| Class-level | Moderate (Shadowed by `__dict__`)| Methods, `@cached_property` |
| **`@property`** | Single Class | Highest (Data Descriptor) | Single-class getters and setters |
| **`__getattr__`** | Instance | **Lowest (Fallback only)** | Dynamic proxies, catching missing keys |
| **`__getattribute__`** | Instance | **Absolute (Intercepts ALL)** | Low-level tracing, security sandboxes |

---

## Advanced Concepts: C-Level Descriptors (`tp_descr_get` & `tp_descr_set`)

In CPython's C-source (`Include/object.h`), the descriptor protocol maps directly to two C function pointer slots in the `PyTypeObject` struct:
- `descrgetfunc tp_descr_get`
- `descrsetfunc tp_descr_set`

When `_PyObject_GenericGetAttr()` runs, it checks these C function pointers directly, executing at raw native speed.

---

## Exercises

### Exercise 1 — Beginner
Create a `PositiveInteger` descriptor with `__set_name__` that validates that assigned values are integers $> 0$. Apply it to a `Rectangle` class with `width` and `height`.

### Exercise 2 — Intermediate
Build an `@auto_repr` descriptor or class decorator that dynamically inspects all descriptors defined on a class and prints an informative string representation (e.g. `User(name='Hesam', age=30)`).

### Exercise 3 — Advanced
Build a `TypeCheckedSchema` base class that uses descriptors to enforce strict PEP 484 type annotations at runtime during attribute assignment.

---

## Mini Project: Enterprise Schema Validation & ORM Field Descriptor Engine

### Requirements
Build an operational declarative schema validation and ORM model engine named `orm_descriptor_engine.py`. Implement typed field descriptors (`StringField`, `IntegerField`, `FloatField`), bounds validation, dirty tracking, model serialization to JSON, and comprehensive runtime validation error handling.

### Implementation Blueprint
```python
from __future__ import annotations
import json
from dataclasses import dataclass
from typing import Any

# =====================================================================
# 1. ORM DESCRIPTOR BASE & SPECIALIZED FIELDS
# =====================================================================

class BaseField:
    def __init__(self, data_type: type, required: bool = True, default: Any = None):
        self.data_type = data_type
        self.required = required
        self.default = default

    def __set_name__(self, owner: type, name: str):
        self.name = name
        self.storage_key = f"_val_{name}"

    def __get__(self, instance: Any, owner: type = None) -> Any:
        if instance is None:
            return self
        return getattr(instance, self.storage_key, self.default)

    def __set__(self, instance: Any, value: Any):
        if value is None:
            if self.required:
                raise ValueError(f"Field '{self.name}' is required and cannot be None.")
        elif not isinstance(value, self.data_type):
            raise TypeError(f"Field '{self.name}' expects {self.data_type.__name__}, got {type(value).__name__}.")

        self.validate(value)
        setattr(instance, self.storage_key, value)
        
        # Track mutation
        if hasattr(instance, "_dirty_attributes"):
            instance._dirty_attributes.add(self.name)

    def validate(self, value: Any):
        """Hook for subclass-specific validation logic."""
        pass

class StringField(BaseField):
    def __init__(self, min_len: int = 0, max_len: int = 255, **kwargs):
        super().__init__(data_type=str, **kwargs)
        self.min_len = min_len
        self.max_len = max_len

    def validate(self, value: str):
        if value is not None and not (self.min_len <= len(value) <= self.max_len):
            raise ValueError(f"Field '{self.name}' length must be between {self.min_len} and {self.max_len} characters.")

class NumberField(BaseField):
    def __init__(self, min_val: float = None, max_val: float = None, is_float: bool = False, **kwargs):
        dtype = float if is_float else int
        super().__init__(data_type=dtype, **kwargs)
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, value: float | int):
        if value is not None:
            if self.min_val is not None and value < self.min_val:
                raise ValueError(f"Field '{self.name}' value {value} is below minimum allowed {self.min_val}.")
            if self.max_val is not None and value > self.max_val:
                raise ValueError(f"Field '{self.name}' value {value} exceeds maximum allowed {self.max_val}.")

# =====================================================================
# 2. DECLARATIVE BASE MODEL
# =====================================================================

class SchemaModel:
    def __init__(self, **kwargs):
        self._dirty_attributes = set()
        
        # Extract all field descriptors defined on class
        cls = type(self)
        self._fields = {k: v for k, v in cls.__dict__.items() if isinstance(v, BaseField)}
        
        # Populate defaults and provided kwargs
        for field_name, descriptor in self._fields.items():
            if field_name in kwargs:
                setattr(self, field_name, kwargs[field_name])
            else:
                setattr(self, field_name, descriptor.default)

        # Clear dirty tracking after initial construction
        self._dirty_attributes.clear()

    def to_dict(self) -> dict[str, Any]:
        return {name: getattr(self, name) for name in self._fields}

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)

# =====================================================================
# 3. DOMAIN IMPLEMENTATION & VERIFICATION
# =====================================================================

class UserAccountSchema(SchemaModel):
    user_id = NumberField(min_val=1000, max_val=99999)
    username = StringField(min_len=3, max_len=20)
    email = StringField(min_len=5, max_len=100)
    balance = NumberField(min_val=0.0, is_float=True, default=0.0)

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE ORM & SCHEMA DESCRIPTOR ENGINE")
    print("=" * 68)

    # 1. Valid Instance Instantiation
    print("\n1. Instantiating Valid User Schema:")
    user = UserAccountSchema(
        user_id=1050,
        username="hesam_admin",
        email="hesam@domain.com",
        balance=1450.50
    )
    print(user.to_json())

    # 2. Track Dirty Mutations
    print("\n2. Mutating Attributes (Dirty Tracking):")
    user.balance = 2200.00
    print(f"Modified Fields: {user._dirty_attributes}")

    # 3. Testing Type Safety & Bounds Validation
    print("\n3. Testing Descriptor Validation Guards:")
    try:
        user.username = "ab"  # Too short (< 3 chars)
    except ValueError as err:
        print("  ❌ Caught Length Error :", err)

    try:
        user.balance = -100.0  # Negative balance (< 0.0)
    except ValueError as err:
        print("  ❌ Caught Bounds Error :", err)

    try:
        user.user_id = "NOT_AN_INT"  # Invalid Type
    except TypeError as err:
        print("  ❌ Caught Type Error   :", err)

    print("\n" + "=" * 68)
    print("🎉 DESCRIPTOR PROTOCOL & ORM FIELD ENGINE VERIFIED SUCCESSFULLY!")
```

---

## Summary

In this lesson, you mastered Python's Descriptor Protocol:
- **Descriptors** implement `__get__()`, `__set__()`, `__delete__()`, or `__set_name__()` to customize attribute access.
- **Data Descriptors** (implementing `__set__` or `__delete__`) override instance dictionaries; **Non-Data Descriptors** (implementing `__get__` only) can be shadowed by instance dictionaries.
- The **`__set_name__` (PEP 487)** hook automatically captures public attribute names at class creation time.
- Standard Python functions are Non-Data Descriptors whose `__get__()` returns **Bound Method** objects.
- Descriptors **must be stored as class attributes** and manage per-instance data inside `instance.__dict__`.

---

## Best Practices Checklist

- [ ] Always declare descriptors as class-level attributes, never inside `__init__`.
- [ ] Implement `__set_name__(self, owner, name)` for automatic attribute naming.
- [ ] Store instance values in `instance.__dict__` using private keys (e.g. `_val_price`).
- [ ] Never store instance state directly on the descriptor instance (`self.value`).
- [ ] Use Non-Data Descriptors for cached properties and lazy computation.

---

## What's Next?

Now that you understand the Descriptor Protocol, continue to:
👉 **[Metaclasses & Dynamic Class Factories](metaclasses.md)** to master `type`, `__new__` vs `__init__`, class namespaces, and constructing dynamic class generators!
