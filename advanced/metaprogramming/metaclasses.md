# Metaclasses & Dynamic Class Factories in Python

## Introduction

In Python, one of the most profound design axioms is: **"Everything is an Object."**

Integers, strings, functions, and modules are all first-class objects. But what about classes themselves?

In Python, **a Class is also an Object**.
- When Python encounters a `class User:` block, it executes the code inside the block, creates an instance of a **Metaclass**, and binds it to the variable name `User`.
- Just as an *instance* is created from a *class*, a **Class is created from a Metaclass**.

By default, the metaclass for all classes in Python is **`type`**.

A **Metaclass** is a "class of a class" that defines how classes are constructed, validated, mutated, and instantiated. Metaclasses are the foundational architecture behind Python's most sophisticated libraries: **SQLAlchemy** (mapping class definitions to database tables), **Django ORM** (`models.Model`), **Pydantic** (`BaseModel`), and the standard library **`abc.ABCMeta`**.

This lesson explores dynamic class creation with 3-argument `type()`, custom metaclasses, the 4-stage metaclass lifecycle (`__prepare__`, `__new__`, `__init__`, `__call__`), building automated plugin registries, and resolving metaclass conflicts.

---

## Prerequisites

Before studying metaclasses, ensure you have:

- Completed [Classes & Objects](../oop/classes-and-objects.md) and [Inheritance & Polymorphism](../oop/inheritance-and-polymorphism.md).
- Completed [Descriptors & Attribute Lookup Protocol](descriptors.md).
- Solid understanding of `__new__` vs `__init__`.

---

## Core Concept: The Metaclass Hierarchy & Lifecycle

```
                             THE PYTHON METACLASS HIERARCHY

                      ┌─────────────────────────────────────────┐
                      │          type (The Root Metaclass)      │ ◄─── (type is an instance of type!)
                      └────────────────────┬────────────────────┘
                                           │ Subclasses or instantiates
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │     CustomMetaclass(type) / MyClass     │ ◄─── (A Class Object)
                      └────────────────────┬────────────────────┘
                                           │ Instantiates
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │      my_instance = MyClass()            │ ◄─── (A Standard Instance)
                      └─────────────────────────────────────────┘

                         THE 4-STAGE METACLASS CREATION LIFECYCLE

      1. Metaclass.__prepare__(metacls, name, bases, **kwargs)
         └── Returns a dict/OrderedDict for the class namespace.
      2. Class Body Execution
         └── Methods, fields, and expressions populate the namespace.
      3. Metaclass.__new__(metacls, name, bases, namespace, **kwargs)
         └── Allocates and creates the new 'class' object in memory!
      4. Metaclass.__init__(cls, name, bases, namespace, **kwargs)
         └── Initializes the newly created class object.
```

---

## Syntax & Essential Metaclass Patterns

```python
# 1. Dynamic Class Creation using 3-Argument type(name, bases, dict)
# Equivalent to: class DynamicGreeter(Base): def greet(self): ...
def dynamic_greet(self):
    return f"Hello from {self.name}!"

DynamicGreeter = type(
    "DynamicGreeter",        # Class Name (str)
    (object,),               # Base Classes (tuple)
    {"name": "Hesam", "greet": dynamic_greet} # Class Dictionary (dict)
)

greeter = DynamicGreeter()
print("Dynamic Class Instance:", greeter.greet()) # "Hello from Hesam!"

# 2. Custom Metaclass Definition
class EnforceMethodsMeta(type):
    def __new__(metacls, name, bases, namespace, **kwargs):
        # Validation Rule: Subclasses must implement an 'execute' method!
        if name != "BaseWorker" and "execute" not in namespace:
            raise TypeError(f"Class '{name}' must implement an 'execute()' method.")
        
        # Allocate and create class object
        cls = super().__new__(metacls, name, bases, namespace)
        return cls

class BaseWorker(metaclass=EnforceMethodsMeta):
    pass

class DataPipelineWorker(BaseWorker):
    def execute(self):
        return "Processing Data Pipeline..."

worker = DataPipelineWorker()
print("Worker Execution:", worker.execute())
```

---

## Detailed Explanation

### 1. Dynamic Class Generation with `type()`

In Python, `type` has two completely different uses:
1. **1-Argument Mode (`type(obj)`)**: Returns the type/class of an object (e.g. `type(10)` $\rightarrow$ `<class 'int'>`).
2. **3-Argument Mode (`type(name, bases, dict)`)**: **Constructs and returns a brand-new Class object dynamically at runtime!**

$$\text{Class Object} = \mathbf{type}(\text{name: str}, \text{bases: tuple}, \text{namespace: dict})$$

This proves that classes are not static compiler artifacts; they are live objects created dynamically by the `type` constructor.

---

### 2. The 4-Stage Metaclass Creation Lifecycle

When CPython executes a `class MyClass(Base, metaclass=CustomMeta):` block:

1. **`__prepare__(metacls, name, bases, **kwargs)`**:
   - Called *before* the class body is executed.
   - Must return a mapping object (usually a standard `dict` or custom tracking dictionary) used to collect class attributes.
2. **Class Body Execution**:
   - CPython executes the code inside the class body, placing all functions, variables, and descriptors into the namespace mapping returned by `__prepare__`.
3. **`__new__(metacls, name, bases, namespace, **kwargs)`**:
   - Intercepts class allocation. Receives the class name, tuple of base classes, and the fully populated namespace dictionary.
   - Can inspect, modify, add, or delete attributes *before the class is created in memory*.
   - Must return the newly created class object (usually via `super().__new__()`).
4. **`__init__(cls, name, bases, namespace, **kwargs)`**:
   - Initializes the class after creation.
5. **`__call__(cls, *args, **kwargs)`**:
   - Intercepts *instantiation* of the class (when someone runs `obj = MyClass()`).

---

### 3. Metaclass Keyword Arguments

In Python 3, you can pass custom keyword arguments directly to the metaclass inside the class header:

```python
class TableModelMeta(type):
    def __new__(metacls, name, bases, namespace, table_name=None):
        cls = super().__new__(metacls, name, bases, namespace)
        cls._table_name = table_name or name.lower()
        return cls

class UserAccount(metaclass=TableModelMeta, table_name="tbl_enterprise_users"):
    pass

print("Custom Table Name Configured by Metaclass:", UserAccount._table_name)
```

---

## Examples

### 1. Simple: Attribute Auto-Capitalization Metaclass
Transforming all lowercase class attributes into uppercase constants automatically.

```python
class UppercaseAttributesMeta(type):
    def __new__(metacls, name, bases, namespace):
        uppercase_ns = {}
        for k, v in namespace.items():
            # Convert non-dunder attributes to uppercase
            if not k.startswith("__"):
                uppercase_ns[k.upper()] = v
            else:
                uppercase_ns[k] = v
        return super().__new__(metacls, name, bases, uppercase_ns)

class SystemConfig(metaclass=UppercaseAttributesMeta):
    host = "127.0.0.1"
    port = 8080
    debug_mode = True

# Attributes were transformed into uppercase by the metaclass!
print("Host :", SystemConfig.HOST)
print("Port :", SystemConfig.PORT)
print("Debug:", SystemConfig.DEBUG_MODE)
```

### 2. Beginner: Automated Plugin Registration Metaclass
Automatically registering all subclasses into a central registry upon class definition (zero manual registration boilerplate!).

```python
class PluginRegistryMeta(type):
    # Global registry mapping plugin names to class objects
    REGISTRY: dict[str, type] = {}

    def __new__(metacls, name, bases, namespace):
        cls = super().__new__(metacls, name, bases, namespace)
        # Register every subclass that defines a 'plugin_name'
        if "plugin_name" in namespace:
            p_name = namespace["plugin_name"]
            metacls.REGISTRY[p_name] = cls
            print(f"🔌 [PLUGIN REGISTERED] '{p_name}' -> Class: {name}")
        return cls

class BasePlugin(metaclass=PluginRegistryMeta):
    pass

class JSONExportPlugin(BasePlugin):
    plugin_name = "exporter.json"
    def run(self): return "Exporting JSON..."

class CSVExportPlugin(BasePlugin):
    plugin_name = "exporter.csv"
    def run(self): return "Exporting CSV..."

print("\nActive Plugins in Registry:", list(PluginRegistryMeta.REGISTRY.keys()))
```

### 3. Intermediate: Thread-Safe Singleton Metaclass
Implementing the Singleton design pattern at the metaclass level using `__call__`.

```python
import threading

class SingletonMeta(type):
    _instances = {}
    _lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        # Intercepts instance instantiation: MyClass()
        with cls._lock:
            if cls not in cls._instances:
                # Allocate single instance
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]

class DatabaseConnectionPool(metaclass=SingletonMeta):
    def __init__(self, host: str = "localhost"):
        self.host = host

# Instantiating multiple times returns the exact same object in RAM!
pool_1 = DatabaseConnectionPool("db.primary")
pool_2 = DatabaseConnectionPool("db.secondary") # host ignored because already created

print("Are both connection pools identical?", pool_1 is pool_2) # True!
print("Pool 1 Memory Address:", hex(id(pool_1)))
print("Pool 2 Memory Address:", hex(id(pool_2)))
```

### 4. Real-World: Declarative ORM Model & Schema Metaclass
Building an ORM metaclass that inspects class attributes, extracts column descriptors, and binds them to table schema metadata.

```python
class Field:
    def __init__(self, data_type: str, is_primary_key: bool = False):
        self.data_type = data_type
        self.is_primary_key = is_primary_key

class ModelMeta(type):
    def __new__(metacls, name, bases, namespace):
        # 1. Extract all Field descriptors from class namespace
        fields = {}
        cleaned_namespace = {}

        for k, v in namespace.items():
            if isinstance(v, Field):
                fields[k] = v
            else:
                cleaned_namespace[k] = v

        cleaned_namespace["_fields"] = fields
        cleaned_namespace["_table_name"] = name.lower() + "s"

        cls = super().__new__(metacls, name, bases, cleaned_namespace)
        return cls

class ORMBaseModel(metaclass=ModelMeta):
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            if k in self._fields:
                setattr(self, k, v)

class CustomerRecord(ORMBaseModel):
    id = Field("INTEGER", is_primary_key=True)
    username = Field("VARCHAR(50)")
    email = Field("VARCHAR(100)")

print(f"Table Name Generated : {CustomerRecord._table_name}")
print(f"Schema Columns Mapped: {list(CustomerRecord._fields.keys())}")
```

### 5. Advanced: Namespace Preserving Metaclass with `__prepare__`
Using `__prepare__` to capture the exact order in which class attributes were declared in source code.

```python
import collections

class OrderedSchemaMeta(type):
    @classmethod
    def __prepare__(metacls, name, bases):
        # Return an OrderedDict to track attribute insertion order!
        return collections.OrderedDict()

    def __new__(metacls, name, bases, namespace):
        # Extract declared fields in exact order of declaration
        declared_order = [k for k in namespace if not k.startswith("__")]
        namespace["_declared_field_order"] = declared_order
        return super().__new__(metacls, name, bases, dict(namespace))

class CSVExportRow(metaclass=OrderedSchemaMeta):
    first_name = "Hesam"
    last_name = "Pourabbasain"
    role = "Lead Architect"
    salary = 160000

print("Exact Field Declaration Order:", CSVExportRow._declared_field_order)
```

---

## Code Explanation

In Example 4 (`ModelMeta`):
1. When `class CustomerRecord(ORMBaseModel):` is defined, `ModelMeta.__new__()` intercepts the creation before the class exists in RAM.
2. It iterates through the class `namespace`, extracting all `Field` instances (`id`, `username`, `email`) into an internal `_fields` dictionary.
3. It generates the SQL table name (`_table_name = "customerrecords"`).
4. When users instantiate `CustomerRecord(username="hesam")`, the base model knows the exact schema columns dynamically.
5. This is the exact mechanism used by **Django's `ModelBase`** and **SQLAlchemy's `DeclarativeMeta`**.

---

## Common Mistakes

### Mistake 1: Overusing Metaclasses
Using metaclasses for tasks that can be achieved with simple Class Decorators or modern **`__init_subclass__`**.

As Tim Peters (author of *The Zen of Python*) famously wrote:
> *"Metaclasses are deeper magic than 99% of users should ever worry about. If you wonder whether you need them, you don’t."*

### Mistake 2: Metaclass Conflicts in Multiple Inheritance
Inheriting from two parent classes that have different metaclasses produces a fatal `TypeError: metaclass conflict`. To resolve this, you must define a composite metaclass that inherits from both parent metaclasses.

---

## Best Practices

### Prefer `__init_subclass__` for Simple Subclass Hooks
If you only need to validate subclasses or register plugins, use Python 3.6+ **`__init_subclass__`** instead of writing a custom metaclass. Reserve metaclasses for when you need **`__prepare__`** or dynamic namespace interception in **`__new__`**.

Good:
```python
# Simple subclass validation (No metaclass required!):
class BaseWorker:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, "execute"):
            raise TypeError("Must implement execute()")
```

---

## Performance Considerations

- **Zero Runtime Method Overhead**: Metaclasses execute **exactly once at import time** when the module is compiled. They do not add any CPU overhead when calling instance methods or querying properties during normal runtime execution.
- **Fast Startup**: Keep logic inside `__new__` and `__init__` minimal to avoid slowing down application startup and import times.

---

## Security Considerations

1. **Dynamic Code Injection via `type()`**: When using 3-argument `type(name, bases, dict)` with untrusted external configurations, ensure dictionary keys do not override security-critical dunder methods (`__init__`, `__eq__`, `__getattribute__`).

---

## Real-World Usage

- **SQLAlchemy ORM (`DeclarativeMeta`)**: Constructing SQL tables from mapped Python class attributes.
- **Django ORM (`ModelBase`)**: Generating database query managers and field validators.
- **Pydantic (`ModelMetaclass`)**: Extracting type annotations and generating validation graphs.
- **Standard Library `abc.ABCMeta`**: Enforcing `@abstractmethod` implementations.

---

## Comparison: Metaprogramming Approaches

| Feature | Metaclasses | `__init_subclass__` | Class Decorators | Dynamic `type()` |
|---|---|---|---|---|
| **Execution Point** | **Before Class Exists** | After Class Creation | After Class Creation | Runtime Call |
| **Namespace Control (`__prepare__`)**| **✅ Yes** | ❌ No | ❌ No | ❌ No |
| **Inherited by Subclasses?**| **✅ Yes (Automatic)** | **✅ Yes (Automatic)**| ❌ No (Single class) | ❌ No |
| **Complexity** | High | Low | Low | Moderate |
| **Best Used For** | ORMs, Deep Frameworks | Subclass validation | Method decoration | Dynamic factories |

---

## Advanced Concepts: The CPython `PyType_Type` Structure

In CPython's C-core (`Objects/typeobject.c`), `type` is represented by the static C-structure **`PyType_Type`**.

When a class is created, CPython invokes the C function **`type_new()`**, which allocates the `PyTypeObject` memory buffer on the heap and initializes the type's Method Resolution Order (MRO) using the **C3 Linearization Algorithm**.

---

## Exercises

### Exercise 1 — Beginner
Use 3-argument `type()` to dynamically create a class `Car` with attributes `wheels = 4` and a method `drive(self) -> str`. Instantiate it and call `drive()`.

### Exercise 2 — Intermediate
Build a `DeprecatedMethodsMeta` metaclass that scans all methods in a class, and if any method name starts with `legacy_`, wraps it in a warning printer indicating the method is deprecated.

### Exercise 3 — Advanced
Build an `APIControllerMeta` metaclass that inspects methods with custom routing metadata (e.g. `_route_path = "/users"`) and populates a class-level routing table `_routes: dict[str, Callable]`.

---

## Mini Project: Enterprise Declarative Plugin Registry & API Schema Metaclass Factory

### Requirements
Build an operational metaclass-driven plugin and API schema factory named `metaclass_plugin_engine.py`. Implement automated subclass registration, field schema extraction, JSON serialization, and dynamic endpoint dispatching.

### Implementation Blueprint
```python
import json
from dataclasses import dataclass
from typing import Callable, Any

# =====================================================================
# 1. FIELD SCHEMA METACLASS & DESCRIPTORS
# =====================================================================

class APIField:
    def __init__(self, data_type: type, required: bool = True):
        self.data_type = data_type
        self.required = required

class APIServiceMeta(type):
    """Metaclass that extracts API fields and auto-registers service handlers."""
    SERVICES: dict[str, type] = {}

    def __new__(metacls, name, bases, namespace, service_path: str = None):
        fields = {}
        handlers = {}

        # 1. Inspect namespace for Fields and Handlers
        for k, v in namespace.items():
            if isinstance(v, APIField):
                fields[k] = v
            elif callable(v) and not k.startswith("__"):
                handlers[k] = v

        namespace["_schema_fields"] = fields
        namespace["_endpoint_handlers"] = handlers
        namespace["_service_path"] = service_path or f"/api/v1/{name.lower()}"

        cls = super().__new__(metacls, name, bases, namespace)

        # 2. Register non-base services in central registry
        if name != "BaseAPIService":
            metacls.SERVICES[namespace["_service_path"]] = cls
            print(f"🚀 [SERVICE REGISTERED] {namespace['_service_path']} -> {name}")

        return cls

# =====================================================================
# 2. BASE SERVICE & CONCRETE MICROSERVICES
# =====================================================================

class BaseAPIService(metaclass=APIServiceMeta):
    def __init__(self, **kwargs):
        self._data = {}
        for k, field in self._schema_fields.items():
            if k in kwargs:
                val = kwargs[k]
                if not isinstance(val, field.data_type):
                    raise TypeError(f"Field '{k}' expects {field.data_type.__name__}, got {type(val).__name__}")
                self._data[k] = val
            elif field.required:
                raise ValueError(f"Missing required field: '{k}'")

class UserMicroservice(BaseAPIService, service_path="/api/v1/users"):
    user_id = APIField(int, required=True)
    username = APIField(str, required=True)
    email = APIField(str, required=True)

    def get_profile(self) -> dict:
        return {"id": self._data["user_id"], "name": self._data["username"], "email": self._data["email"]}

class BillingMicroservice(BaseAPIService, service_path="/api/v1/billing"):
    account_id = APIField(str, required=True)
    balance_usd = APIField(float, required=True)

    def process_invoice(self) -> dict:
        return {"account": self._data["account_id"], "balance": self._data["balance_usd"], "status": "CURRENT"}

# =====================================================================
# 3. METACLASS API GATEWAY DISPATCHER
# =====================================================================

class GatewayRouter:
    @classmethod
    def dispatch(cls, path: str, payload: dict, action: str) -> dict:
        service_cls = APIServiceMeta.SERVICES.get(path)
        if not service_cls:
            raise KeyError(f"Service endpoint '{path}' not found in registry.")

        # Instantiate service (Triggers metaclass schema validation)
        service_instance = service_cls(**payload)
        
        # Invoke handler
        handler = getattr(service_instance, action, None)
        if not handler:
            raise AttributeError(f"Action '{action}' not found on service '{service_cls.__name__}'.")

        return handler()

if __name__ == "__main__":
    print("=" * 68)
    print("      METACLASS PLUGIN & API SCHEMA DISPATCHER SUITE")
    print("=" * 68)

    # 1. Dispatch User Profile Request
    print("\n1. Dispatching to /api/v1/users:")
    user_payload = {"user_id": 101, "username": "hesam_lead", "email": "hesam@domain.com"}
    res1 = GatewayRouter.dispatch("/api/v1/users", user_payload, "get_profile")
    print("Result:", json.dumps(res1, indent=2))

    # 2. Dispatch Billing Invoice Request
    print("\n2. Dispatching to /api/v1/billing:")
    billing_payload = {"account_id": "ACC-9901", "balance_usd": 14500.00}
    res2 = GatewayRouter.dispatch("/api/v1/billing", billing_payload, "process_invoice")
    print("Result:", json.dumps(res2, indent=2))

    # 3. Test Schema Validation Error
    print("\n3. Testing Schema Validation Guard:")
    try:
        GatewayRouter.dispatch("/api/v1/users", {"user_id": "NOT_AN_INT"}, "get_profile")
    except (TypeError, ValueError) as err:
        print("  ❌ Caught Expected Schema Error:", err)

    print("\n" + "=" * 68)
    print("🎉 METACLASS ARCHITECTURE & SCHEMA FACTORY VERIFIED!")
```

---

## Summary

In this lesson, you mastered Python Metaclasses:
- **Metaclasses are the "Classes of Classes"**, defining how class objects are constructed.
- **`type`** is the default root metaclass of Python; 3-argument **`type(name, bases, dict)`** creates classes dynamically at runtime.
- The **4-Stage Metaclass Lifecycle**: `__prepare__()` $\rightarrow$ Class Body Execution $\rightarrow$ `__new__()` $\rightarrow$ `__init__()`.
- Use **`__call__()`** on metaclasses to implement global design patterns like the **Thread-Safe Singleton**.
- Pass custom configuration options using **Metaclass Keyword Arguments** (`class Model(metaclass=Meta, table="users"):`).
- Metaclasses execute **once at import time**, imposing **zero runtime execution penalty**.

---

## Best Practices Checklist

- [ ] Use `type(name, bases, dict)` for programmatic class generation.
- [ ] Implement `__prepare__` when you need custom class namespace tracking (like `OrderedDict`).
- [ ] Use `super().__new__()` to allocate the new class cleanly.
- [ ] Prefer `__init_subclass__` over metaclasses for simple subclass validation.
- [ ] Avoid deeply nested metaclass inheritance to prevent metaclass conflicts.

---

## What's Next?

Now that you understand Metaclasses, continue to the final article in this module:
👉 **[Modern Metaprogramming with `__init_subclass__`](init-subclass-and-class-creation.md)** to master lightweight PEP 487 subclass hooks, class validation, and building composable frameworks!
