# Modern Metaprogramming with `__init_subclass__` in Python

## Introduction

For decades, if a Python library author wanted to customize class creation—such as automatically registering plugins, validating that subclasses implement specific methods, or configuring database table names—the only solution was writing a **Metaclass** (`class Meta(type):`).

While metaclasses are extremely powerful, they carry significant architectural baggage:
- They require complex boilerplate (`__new__`, `__init__`, `type` inheritance).
- They introduce the infamous **Metaclass Conflict** in multiple inheritance (`TypeError: metaclass conflict`).
- They make code difficult for team members to read and maintain.

To solve this, Python 3.6 introduced **PEP 487 (Simpler Customization of Class Creation)**, adding the **`__init_subclass__()`** class hook.

`__init_subclass__` provides an elegant, lightweight, and modern metaprogramming mechanism. Whenever a class inherits from a base class, CPython automatically invokes the base class's `__init_subclass__` method, passing the newly created child class along with any custom keyword arguments supplied in the class definition header.

Today, modern frameworks (like **SQLAlchemy 2.0**, **Pydantic**, and **FastAPI**) use `__init_subclass__` as their primary class customization pattern, reserving metaclasses only for deep low-level internals.

This lesson concludes **Module 2: Advanced Metaprogramming in Depth**, exploring `__init_subclass__`, keyword arguments forwarding, automated plugin registries, subclass contract validation, and comparing the three metaprogramming paradigms.

---

## Prerequisites

Before studying `__init_subclass__`, ensure you have:

- Completed [Inheritance & Polymorphism](../oop/inheritance-and-polymorphism.md).
- Completed [Descriptors](descriptors.md) and [Metaclasses](metaclasses.md).
- Solid understanding of `*args` and `**kwargs` parameter unpacking.

---

## Core Concept: The `__init_subclass__` Hook Lifecycle

```
                             THE PEP 487 __init_subclass__ HOOK

       1. Base Class Definition
      ┌────────────────────────────────────────────────────────┐
      │ class BaseService:                                     │
      │     def __init_subclass__(cls, service_code, **kwargs):│ <--- Class hook receives child class!
      │         super().__init_subclass__(**kwargs)            │
      │         cls.REGISTRY[service_code] = cls               │
      └──────────────────────────┬─────────────────────────────┘
                                 │ Subclassed
                                 ▼
       2. Child Class Definition with Keyword Arguments
      ┌────────────────────────────────────────────────────────┐
      │ class BillingService(BaseService, service_code="BILL"):│ <--- Automatically triggers hook!
      │     pass                                               │
      └────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential `__init_subclass__` Patterns

```python
# 1. Automatic Subclass Registration & Validation
class BasePlugin:
    # Central Registry mapping plugin keys to classes
    PLUGIN_REGISTRY: dict[str, type] = {}

    def __init_subclass__(cls, plugin_key: str = None, **kwargs):
        # Always forward leftover kwargs to super() to support multiple inheritance!
        super().__init_subclass__(**kwargs)

        if plugin_key is None:
            raise TypeError(f"Subclass '{cls.__name__}' must specify a 'plugin_key' parameter.")

        # Validation Guard: Subclass must implement run()
        if not hasattr(cls, "run") or not callable(getattr(cls, "run")):
            raise TypeError(f"Subclass '{cls.__name__}' must implement a callable 'run()' method.")

        # Register plugin
        cls.PLUGIN_REGISTRY[plugin_key] = cls
        cls.plugin_key = plugin_key
        print(f"🔌 [PLUGIN REGISTERED] '{plugin_key}' -> {cls.__name__}")

# 2. Defining Subclasses with Class Keyword Arguments
class PDFExportPlugin(BasePlugin, plugin_key="export.pdf"):
    def run(self, data):
        return f"Rendering PDF: {data}"

class CSVExportPlugin(BasePlugin, plugin_key="export.csv"):
    def run(self, data):
        return f"Rendering CSV: {data}"

print("\nRegistered Plugins in Registry:", list(BasePlugin.PLUGIN_REGISTRY.keys()))
```

---

## Detailed Explanation

### 1. The Architectural Philosophy of PEP 487

Before PEP 487, customizing class creation required a metaclass:
```python
# The Old Metaclass Approach (Python 2 / early 3):
class PluginMeta(type):
    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)
        # Registration logic...

class BasePlugin(metaclass=PluginMeta): pass
```

#### Why `__init_subclass__` is Superior for Most Use Cases:
1. **No Metaclass Boilerplate**: Defined directly on a normal base class using standard `def __init_subclass__(cls, **kwargs):`.
2. **Implicit Classmethod**: `__init_subclass__` is **implicitly a class method** (`@classmethod`), receiving the child class as its first parameter (`cls`).
3. **No Metaclass Conflicts**: Multiple inheritance with classes using `__init_subclass__` composes cleanly through standard `super().__init_subclass__(**kwargs)` cooperative MRO chains!
4. **Class Definition Parameters**: Clean syntax for passing class metadata (`class MyChild(Base, table="users", version="1.0"):`).

---

### 2. Forwarding `**kwargs` in Cooperative Multiple Inheritance

When accepting custom keyword arguments in `__init_subclass__`, **always extract/pop your specific arguments and forward the remaining `**kwargs` via `super().__init_subclass__(**kwargs)`**:

```python
class MixinA:
    def __init_subclass__(cls, option_a="default", **kwargs):
        cls.option_a = option_a
        super().__init_subclass__(**kwargs)  # Forwards remaining kwargs to MixinB!

class MixinB:
    def __init_subclass__(cls, option_b="default", **kwargs):
        cls.option_b = option_b
        super().__init_subclass__(**kwargs)  # Forwards to object!

# Multiple Inheritance with custom parameters for both mixins!
class CombinedService(MixinA, MixinB, option_a="alpha", option_b="beta"):
    pass

print(f"Combined Options: {CombinedService.option_a}, {CombinedService.option_b}")
```

---

## Examples

### 1. Simple: Enforcing Mandatory Method Signatures
Validating that all subclasses implement required interface methods without `abc.ABCMeta`.

```python
class BaseWorker:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if "process_batch" not in cls.__dict__:
            raise TypeError(f"Class '{cls.__name__}' must explicitly define a 'process_batch' method.")

# Valid Subclass
class ImageProcessingWorker(BaseWorker):
    def process_batch(self, batch):
        return [f"Processed {img}" for img in batch]

print("ImageProcessingWorker verified successfully.")

# Invalid Subclass (Uncommenting raises TypeError!)
# class BrokenWorker(BaseWorker):
#     pass
# 💥 TypeError: Class 'BrokenWorker' must explicitly define a 'process_batch' method.
```

### 2. Beginner: Automatic SQL Table Mapping
Mapping model classes to database tables with automatic naming and primary key detection.

```python
class DeclarativeEntity:
    def __init_subclass__(cls, table_name: str = None, **kwargs):
        super().__init_subclass__(**kwargs)
        # If table_name is omitted, default to plural lowercase class name
        cls._table_name = table_name or f"{cls.__name__.lower()}s"
        print(f"🗄️ [SCHEMA MAPPED] Class '{cls.__name__}' -> Table: '{cls._table_name}'")

class UserAccount(DeclarativeEntity):
    pass # Maps to 'useraccounts'

class InvoiceRecord(DeclarativeEntity, table_name="tbl_commercial_invoices"):
    pass # Maps to custom 'tbl_commercial_invoices'

print("User Table    :", UserAccount._table_name)
print("Invoice Table :", InvoiceRecord._table_name)
```

### 3. Intermediate: Microservice Message Event Router
Building an event handler registry where event listeners declare their topic subscriptions.

```python
from typing import Callable

class BaseEventHandler:
    EVENT_TOPIC_ROUTING: dict[str, list[type]] = {}

    def __init_subclass__(cls, listen_topics: list[str] = None, **kwargs):
        super().__init_subclass__(**kwargs)
        topics = listen_topics or []
        
        for topic in topics:
            if topic not in cls.EVENT_TOPIC_ROUTING:
                cls.EVENT_TOPIC_ROUTING[topic] = []
            cls.EVENT_TOPIC_ROUTING[topic].append(cls)
            print(f"📡 [TOPIC SUBSCRIBED] Topic '{topic}' -> Handler: {cls.__name__}")

class UserSignupHandler(BaseEventHandler, listen_topics=["user.created", "auth.register"]):
    def handle(self, event_data: dict):
        return f"Sending welcome email to {event_data['email']}"

class AuditLoggingHandler(BaseEventHandler, listen_topics=["user.created", "order.placed"]):
    def handle(self, event_data: dict):
        return f"Logging security audit for {event_data}"

print("\nActive Topic Subscriptions:")
for topic, handlers in BaseEventHandler.EVENT_TOPIC_ROUTING.items():
    print(f"  • {topic:<16} : {[h.__name__ for h in handlers]}")
```

### 4. Real-World: Combining `__init_subclass__` with `__set_name__` for Pure ORM Models
Building a complete ORM validation engine using only PEP 487 features (`__init_subclass__` and `__set_name__`) with zero metaclasses.

```python
class Column:
    def __init__(self, data_type: type):
        self.data_type = data_type

    def __set_name__(self, owner, name):
        self.name = name
        self.storage = f"_{name}"

    def __get__(self, instance, owner=None):
        if instance is None: return self
        return getattr(instance, self.storage, None)

    def __set__(self, instance, value):
        if not isinstance(value, self.data_type):
            raise TypeError(f"Field '{self.name}' must be of type {self.data_type.__name__}")
        setattr(instance, self.storage, value)

class CleanORMModel:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        # Extract all Column descriptors defined on subclass
        cls._columns = {
            k: v for k, v in cls.__dict__.items() if isinstance(v, Column)
        }
        cls._table = cls.__name__.lower() + "_table"

    def __init__(self, **kwargs):
        for col_name, col in self._columns.items():
            val = kwargs.get(col_name)
            setattr(self, col_name, val)

class Customer(CleanORMModel):
    id = Column(int)
    name = Column(str)

c = Customer(id=101, name="Hesam Pourabbasain")
print(f"Customer: #{c.id} ({c.name}) │ Table: {Customer._table}")
```

### 5. Advanced: Runtime Type Hint Schema Validation via `get_type_hints`
Using `__init_subclass__` to inspect subclass type annotations at compile time and inject validation rules.

```python
import typing

class StrictDataSchema:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        # Inspect type annotations defined on the subclass!
        cls._resolved_type_hints = typing.get_type_hints(cls)
        print(f"🔍 [SCHEMA INSPECTED] '{cls.__name__}' Fields: {cls._resolved_type_hints}")

    def __init__(self, **kwargs):
        for field, expected_type in self._resolved_type_hints.items():
            if field not in kwargs:
                raise ValueError(f"Missing required field '{field}'")
            val = kwargs[field]
            if not isinstance(val, expected_type):
                raise TypeError(f"Field '{field}' expects {expected_type.__name__}, got {type(val).__name__}")
            setattr(self, field, val)

class PaymentPayload(StrictDataSchema):
    order_id: str
    amount: float
    is_settled: bool

payload = PaymentPayload(order_id="ORD-9901", amount=1450.00, is_settled=True)
print("Valid Strict Schema Instantiated:", payload.__dict__)
```

---

## Code Explanation

In Example 5 (`StrictDataSchema`):
1. When `class PaymentPayload(StrictDataSchema):` is declared, `StrictDataSchema.__init_subclass__()` executes immediately.
2. `typing.get_type_hints(cls)` extracts the type annotations (`order_id: str`, `amount: float`, `is_settled: bool`).
3. The base model stores these resolved annotations in `cls._resolved_type_hints`.
4. When `PaymentPayload(...)` is instantiated, `__init__` iterates through the pre-compiled type map, verifying data invariants in microseconds.
5. This delivers the core functionality of **Pydantic / Dataclasses** in under 20 lines of clean Python code without a single metaclass.

---

## Common Mistakes

### Mistake 1: Swallowing `**kwargs` Without `super().__init_subclass__(**kwargs)`
If you define `def __init_subclass__(cls, my_arg=None):` without calling `super().__init_subclass__()`, you **break the cooperative MRO chain**, preventing other mixin classes from receiving their configuration options.

### Mistake 2: Expecting `__init_subclass__` on the Base Class Itself
`__init_subclass__` executes **only when a class is subclassed**. It does **not** run on the base class where it is defined.

---

## Best Practices

### Use `__init_subclass__` as the Default Choice for Subclass Customization
Whenever you need to validate subclasses, register plugins, or inject attributes, always choose **`__init_subclass__`** first. Only escalate to a custom `type` metaclass if you explicitly need **`__prepare__`** or need to alter class memory allocation in **`__new__`**.

Good:
```python
class BaseService:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
```

---

## Performance Considerations

- **Zero Runtime Method Overhead**: Like metaclasses, `__init_subclass__` executes **once at class definition compile time**. Instance method invocations and attribute reads incur **zero performance penalty**.

---

## Security Considerations

1. **Subclass Validation as a Security Quality Gate**: Use `__init_subclass__` to enforce security invariants on plugin architectures (e.g. verifying that plugins declare authorized permission scopes before being registered in the system).

---

## Real-World Usage

- **SQLAlchemy 2.0 (`DeclarativeBase`)**: Managing model table metadata and relationship mapping.
- **FastAPI / Starlette Middleware**: Subclassing base middleware components.
- **Pytest**: Base test classes with automated setup hooks.

---

## Comparison: The 3 Metaprogramming Paradigms

| Feature | `__init_subclass__` (PEP 487) | Metaclasses (`type`) | Class Decorators (`@decorator`) |
|---|---|---|---|
| **Syntax Complexity** | **Low (Standard class method)**| High (`type` subclassing) | **Low (Function wrapper)** |
| **Inherited by Subclasses?**| **✅ Yes (Automatic)** | **✅ Yes (Automatic)** | ❌ No (Must re-apply `@`) |
| **Multiple Inheritance**| **Cooperative & Clean** | Metaclass Conflicts | Clean |
| **Class Parameters** | `class Foo(Base, key=val):` | `class Foo(metaclass=M, k=v):`| `@dec(k=v) class Foo:` |
| **Namespace Control** | ❌ No | **✅ Yes (`__prepare__`)** | ❌ No |

---

## Advanced Concepts: Dynamic Method Synthesis in `__init_subclass__`

You can dynamically synthesize and inject new methods directly into child classes at creation time:

```python
class AutoReprBase:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        
        # Synthesize custom __repr__ dynamically!
        def custom_repr(self):
            attrs = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items() if not k.startswith("_"))
            return f"{cls.__name__}({attrs})"
        
        cls.__repr__ = custom_repr

class ServerConfig(AutoReprBase):
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port

cfg = ServerConfig("10.0.1.1", 8080)
print("Auto-Generated Repr:", cfg) # ServerConfig(host='10.0.1.1', port=8080)
```

---

## Exercises

### Exercise 1 — Beginner
Create a `BaseAnimal` class with `__init_subclass__` that validates that every subclass defines a `speak(self) -> str` method. Test with a valid `Dog` class and an invalid `Cat` class.

### Exercise 2 — Intermediate
Build a `RestApiResource` base class with `__init_subclass__(cls, endpoint: str, auth_required: bool = True, **kwargs)` that automatically registers all subclasses in a dictionary mapping `endpoint` $\rightarrow$ `cls`.

### Exercise 3 — Advanced
Build a `StrictValidationBase` class using `__init_subclass__` and `typing.get_type_hints` that generates an automatic `__init__` constructor that validates parameter types against type annotations.

---

## Mini Project: Enterprise Event-Driven CQRS Command & Query Handler Registry Engine

### Requirements
Build an operational Command Query Responsibility Segregation (CQRS) message routing engine named `cqrs_handler_registry.py`. Use `__init_subclass__` to register command and query handlers, validate execution contracts, manage middleware logging, and dispatch business commands dynamically.

### Implementation Blueprint
```python
from __future__ import annotations
import json
from dataclasses import dataclass
from typing import Any

# =====================================================================
# 1. CQRS MESSAGES & BASE HANDLERS
# =====================================================================

@dataclass(frozen=True)
class Command:
    pass

@dataclass(frozen=True)
class Query:
    pass

class BaseCQRSHandler:
    COMMAND_REGISTRY: dict[type[Command], type[BaseCQRSHandler]] = {}
    QUERY_REGISTRY: dict[type[Query], type[BaseCQRSHandler]] = {}

    def __init_subclass__(
        cls,
        handles_command: type[Command] = None,
        handles_query: type[Query] = None,
        **kwargs
    ):
        super().__init_subclass__(**kwargs)

        if not hasattr(cls, "execute") or not callable(getattr(cls, "execute")):
            raise TypeError(f"Handler '{cls.__name__}' must implement an 'execute(self, message)' method.")

        if handles_command:
            cls.COMMAND_REGISTRY[handles_command] = cls
            cls.handled_message_type = handles_command
            print(f"⚡ [COMMAND ROUTED] {handles_command.__name__} -> {cls.__name__}")

        if handles_query:
            cls.QUERY_REGISTRY[handles_query] = cls
            cls.handled_message_type = handles_query
            print(f"🔍 [QUERY ROUTED]   {handles_query.__name__} -> {cls.__name__}")

# =====================================================================
# 2. DOMAIN MESSAGES & CONCRETE HANDLERS
# =====================================================================

# Commands (State Mutations)
@dataclass(frozen=True)
class CreateUserCommand(Command):
    user_id: str
    username: str
    email: str

@dataclass(frozen=True)
class DeductAccountFundsCommand(Command):
    account_id: str
    amount: float

# Queries (Read-Only Projections)
@dataclass(frozen=True)
class GetUserByIdQuery(Query):
    user_id: str

# Handlers using __init_subclass__ Registration Hooks
class CreateUserHandler(BaseCQRSHandler, handles_command=CreateUserCommand):
    def execute(self, cmd: CreateUserCommand) -> dict:
        return {"status": "USER_CREATED", "id": cmd.user_id, "username": cmd.username}

class DeductFundsHandler(BaseCQRSHandler, handles_command=DeductAccountFundsCommand):
    def execute(self, cmd: DeductAccountFundsCommand) -> dict:
        return {"status": "FUNDS_DEDUCTED", "account": cmd.account_id, "amount": cmd.amount}

class GetUserByIdHandler(BaseCQRSHandler, handles_query=GetUserByIdQuery):
    def execute(self, query: GetUserByIdQuery) -> dict:
        return {"id": query.user_id, "name": "Hesam Pourabbasain", "role": "Principal Architect"}

# =====================================================================
# 3. CQRS MESSAGE BUS DISPATCHER
# =====================================================================

class CQRSMessageBus:
    @classmethod
    def dispatch_command(cls, command: Command) -> dict:
        handler_cls = BaseCQRSHandler.COMMAND_REGISTRY.get(type(command))
        if not handler_cls:
            raise KeyError(f"No command handler registered for: {type(command).__name__}")
        
        handler = handler_cls()
        return handler.execute(command)

    @classmethod
    def dispatch_query(cls, query: Query) -> dict:
        handler_cls = BaseCQRSHandler.QUERY_REGISTRY.get(type(query))
        if not handler_cls:
            raise KeyError(f"No query handler registered for: {type(query).__name__}")

        handler = handler_cls()
        return handler.execute(query)

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE CQRS HANDLER ENGINE (__init_subclass__)")
    print("=" * 68)

    # 1. Dispatch CreateUserCommand
    print("\n1. Dispatching Command: CreateUserCommand")
    cmd1 = CreateUserCommand("USR-101", "hesam_lead", "hesam@domain.com")
    res1 = CQRSMessageBus.dispatch_command(cmd1)
    print("Result:", json.dumps(res1, indent=2))

    # 2. Dispatch DeductFundsCommand
    print("\n2. Dispatching Command: DeductAccountFundsCommand")
    cmd2 = DeductAccountFundsCommand("ACC-9901", 250.00)
    res2 = CQRSMessageBus.dispatch_command(cmd2)
    print("Result:", json.dumps(res2, indent=2))

    # 3. Dispatch GetUserByIdQuery
    print("\n3. Dispatching Query: GetUserByIdQuery")
    q1 = GetUserByIdQuery("USR-101")
    res3 = CQRSMessageBus.dispatch_query(q1)
    print("Result:", json.dumps(res3, indent=2))

    print("\n" + "=" * 68)
    print("🎉 CQRS REGISTRY & METAPROGRAMMING PIPELINE VERIFIED!")
```

---

## Summary

In this lesson, you mastered modern Python metaprogramming with `__init_subclass__`:
- **`__init_subclass__` (PEP 487)** is a modern, lightweight class method hook invoked automatically whenever a class is subclassed.
- It eliminates the boilerplate, complexity, and **metaclass conflicts** of traditional `type` metaclasses.
- Pass custom metadata using **Class Definition Keyword Arguments** (`class Child(Base, key=val):`).
- Always forward unhandled keyword arguments using **`super().__init_subclass__(**kwargs)`** to preserve cooperative multiple inheritance MRO chains.
- Combine **`__init_subclass__`** with **`__set_name__`** to build enterprise-grade ORMs, schema validators, and event routers with zero metaclasses.

---

## Best Practices Checklist

- [ ] Use `__init_subclass__` as your default choice for subclass validation and plugin registration.
- [ ] Always call `super().__init_subclass__(**kwargs)`.
- [ ] Pop specific keyword arguments before forwarding to `super()`.
- [ ] Use `typing.get_type_hints(cls)` inside `__init_subclass__` for compile-time annotation extraction.
- [ ] Avoid custom metaclasses unless you explicitly need `__prepare__` or `__new__` memory manipulation.

---

## 🏆 MODULE 2: ADVANCED METAPROGRAMMING COMPLETE!

Congratulations! You have completed all 3 comprehensive articles of **Module 2: Advanced Metaprogramming in Depth**.

### What's Next?
Now advance to **Module 3: Concurrency & Parallelism**:
👉 **[Concurrency & Parallelism Module Overview](../concurrency/README.md)** to master OS Threading, Thread Synchronization Locks, Multiprocessing with Shared Memory, and Concurrent Futures!
