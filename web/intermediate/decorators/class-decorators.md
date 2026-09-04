# Class Decorators & Decorating Classes in Python

## Introduction

In Python metaprogramming, the decorator pattern extends beyond decorating individual standalone functions. There are two distinct, complementary object-oriented decorator paradigms:

1. **Classes as Decorators**: Using a class (instead of a nested closure function) to decorate functions, utilizing the **`__call__`** dunder method to manage stateful wrappers cleanly.
2. **Class Decorators (Decorating Class Definitions)**: Applying the `@` decorator syntax directly to a `class` statement to inspect, mutate, enhance, or register the class at definition time.

Class decorators (such as the standard library's **`@dataclass`** or `@functools.total_ordering`) provide a powerful, lightweight alternative to complex **Metaclasses**. They allow framework authors to dynamically inject methods, enforce interface invariants, validate attributes, and build automated **Plugin Registry Architectures** with minimal cognitive overhead.

This lesson concludes **Module 3: Closures & Decorators in Depth**, exploring both paradigms, solving the notorious **Method Descriptor Binding Trap**, and building enterprise-grade class mutation pipelines.

---

## Prerequisites

Before studying class decorators, ensure you have:

- Completed [Function Decorators & Wrapper Architecture](function-decorators.md).
- Completed [Magic & Dunder Methods](../oop/magic-methods-dunder.md) (specifically `__call__` and descriptors).
- Familiarity with class definitions and Python namespaces.

---

## Core Concept: The Two Class Decorator Paradigms

```
                           PARADIGM 1 vs PARADIGM 2

    PARADIGM 1: CLASS AS A DECORATOR            PARADIGM 2: DECORATING A CLASS
   ┌────────────────────────────────┐         ┌────────────────────────────────┐
   │ class CallCounter:             │         │ def add_json_export(cls):      │
   │     def __init__(self, func):  │         │     cls.to_json = ...          │
   │         self.func = func       │         │     return cls                 │
   │     def __call__(self, *args): │         └───────────────┬────────────────┘
   │         ...                    │                         │
   └───────────────┬────────────────┘                         ▼
                   │                          ┌────────────────────────────────┐
                   ▼                          │ @add_json_export               │
   ┌────────────────────────────────┐         │ class UserProfile:             │
   │ @CallCounter                   │         │     ...                        │
   │ def process_payment(): ...     │         └────────────────────────────────┘
   └────────────────────────────────┘         Mutates and enhances the class!
   Uses class instance as a wrapper!
```

---

## Syntax & Essential Class Decorator Patterns

```python
import functools
import types

# 1. Paradigm 1: Class as a Decorator (with Method Descriptor Support)
class ExecutionProfiler:
    def __init__(self, func):
        self.func = func
        self.calls = 0
        functools.update_wrapper(self, func)

    def __call__(self, *args, **kwargs):
        self.calls += 1
        print(f"📊 [{self.func.__name__}] Total invocations: {self.calls}")
        return self.func(*args, **kwargs)

    # CRUCIAL: Implement __get__ to support decorating class methods!
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return types.MethodType(self, instance)

# 2. Paradigm 2: Class Decorator (Mutating a Class Definition)
def add_id_repr(cls):
    """Class decorator that injects an automatic __repr__ method."""
    def custom_repr(self):
        fields = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items() if not k.startswith("_"))
        return f"{cls.__name__}({fields})"
        
    cls.__repr__ = custom_repr
    return cls  # Mandatory: Always return the mutated class!

@add_id_repr
class ProductItem:
    def __init__(self, sku: str, price: float):
        self.sku = sku
        self.price = price

prod = ProductItem("SKU-9901", 120.00)
print(prod)  # ProductItem(sku='SKU-9901', price=120.0)
```

---

## Detailed Explanation

### 1. The Method Binding Trap: Why Classes as Decorators Break Methods

When you decorate a standalone function with a class, it works seamlessly:

```python
@ExecutionProfiler
def calculate_tax(amount): return amount * 0.2
```

However, if you decorate a **method inside a class**:

```python
class AccountService:
    @ExecutionProfiler
    def get_balance(self):
        return 1000.0
```

Calling `AccountService().get_balance()` fails with:
`TypeError: get_balance() missing 1 required positional argument: 'self'`.

#### Why?
In Python, functions are descriptors that bind to instances automatically via their `__get__` method. When you replace a function with an instance of `ExecutionProfiler`, Python does not bind `self` unless `ExecutionProfiler` implements the **Descriptor Protocol (`__get__`)**:

```python
def __get__(self, instance, owner):
    if instance is None:
        return self
    # Binds 'self' (the decorator instance) to 'instance' (the host class instance)!
    return types.MethodType(self, instance)
```

---

### 2. Class Decorators as a Metaclass Alternative

Historically, inspecting, modifying, or registering class definitions required writing custom **Metaclasses** (`class Meta(type):`).

While metaclasses are necessary for altering class allocation (in `__new__`), **Class Decorators are much simpler, more readable, and compose cleanly without metaclass conflict errors**:

```python
# The Modern Class Decorator Pattern:
def validate_invariants(cls):
    orig_init = cls.__init__

    @functools.wraps(orig_init)
    def new_init(self, *args, **kwargs):
        orig_init(self, *args, **kwargs)
        if hasattr(self, "validate"):
            self.validate()  # Run validation hook automatically after init!
            
    cls.__init__ = new_init
    return cls
```

---

## Examples

### 1. Simple: Class-Based Rate Limiter Function Decorator
Using a class instance to maintain an internal sliding window timestamp state table.

```python
import time

class SimpleRateLimiter:
    def __init__(self, func):
        self.func = func
        self.last_called = 0.0
        self.min_interval = 0.5  # 500ms minimum interval

    def __call__(self, *args, **kwargs):
        now = time.time()
        elapsed = now - self.last_called
        if elapsed < self.min_interval:
            print(f"🚫 [THROTTLED] Call to {self.func.__name__} was rate-limited.")
            return None
        self.last_called = now
        return self.func(*args, **kwargs)

@SimpleRateLimiter
def trigger_alert(msg: str):
    print(f"🚨 [ALERT DISPATCHED]: {msg}")

trigger_alert("Node 01 CPU High")
trigger_alert("Node 02 CPU High")  # Throttled!
```

### 2. Beginner: Class Decorator Adding JSON Serialization (`to_dict`)
Injecting standard serialization capabilities across multiple disparate classes.

```python
def serializable(cls):
    """Class decorator that injects to_dict() and from_dict() capabilities."""
    
    def to_dict(self) -> dict:
        return {
            k: v for k, v in self.__dict__.items() 
            if not k.startswith("_") and not callable(v)
        }

    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)

    cls.to_dict = to_dict
    cls.from_dict = from_dict
    return cls

@serializable
class ServerConfig:
    def __init__(self, host: str, port: int, ssl: bool = True):
        self.host = host
        self.port = port
        self.ssl = ssl

cfg = ServerConfig("db.cluster.internal", 5432)
data_dict = cfg.to_dict()
print("Exported Dictionary:", data_dict)

# Reconstructed instance from dictionary
cloned_cfg = ServerConfig.from_dict(data_dict)
print("Reconstructed Host :", cloned_cfg.host)
```

### 3. Intermediate: Parameterized Class Decorator Enforcing Field Types
A parameterized class decorator that inspects annotated fields and wraps `__init__` with runtime type checks.

```python
def enforce_annotated_types(strict: bool = True):
    def class_decorator(cls):
        orig_init = cls.__init__
        annotations = getattr(cls, "__annotations__", {})

        def new_init(self, *args, **kwargs):
            orig_init(self, *args, **kwargs)
            for field_name, expected_type in annotations.items():
                if hasattr(self, field_name):
                    val = getattr(self, field_name)
                    if not isinstance(val, expected_type):
                        msg = f"Type mismatch on '{cls.__name__}.{field_name}': expected {expected_type.__name__}, got {type(val).__name__}"
                        if strict:
                            raise TypeError(msg)
                        else:
                            print(f"⚠️ [TYPE WARNING] {msg}")

        cls.__init__ = new_init
        return cls
    return class_decorator

@enforce_annotated_types(strict=True)
class CustomerProfile:
    user_id: int
    username: str

# Valid instantiation
user = CustomerProfile(user_id=101, username="hesamp")

# Invalid instantiation triggers TypeError
try:
    bad_user = CustomerProfile(user_id="NOT_AN_INT", username="hesamp")
except TypeError as err:
    print(f"🛡️ [GUARD REJECTED] {err}")
```

### 4. Real-World: Automated Plugin Registry System with Class Decorators
Building an extensible message processor engine where plugins auto-register via class decorators.

```python
class MessagePluginRegistry:
    _registered_plugins = {}

    @classmethod
    def register(cls, message_type: str):
        """Class decorator factory that registers plugins into central registry."""
        def decorator(plugin_class):
            cls._registered_plugins[message_type.upper()] = plugin_class
            print(f"🔌 [PLUGIN REGISTERED] '{message_type.upper()}' -> {plugin_class.__name__}")
            return plugin_class
        return decorator

    @classmethod
    def dispatch(cls, message_type: str, payload: dict):
        plugin_cls = cls._registered_plugins.get(message_type.upper())
        if not plugin_cls:
            raise ValueError(f"No registered plugin found for message type: '{message_type}'")
        instance = plugin_cls()
        return instance.process(payload)

# Plugins register themselves at definition time:
@MessagePluginRegistry.register("EMAIL")
class EmailProcessor:
    def process(self, payload: dict):
        return f"📧 Sending email to {payload['to']}: {payload['subject']}"

@MessagePluginRegistry.register("SMS")
class SMSProcessor:
    def process(self, payload: dict):
        return f"📱 Dispatching SMS to {payload['phone']}: {payload['body']}"

# Caller executes through registry facade:
print("\nDispatching messages through Plugin Registry:")
print(MessagePluginRegistry.dispatch("EMAIL", {"to": "hesam@domain.com", "subject": "System Online"}))
print(MessagePluginRegistry.dispatch("SMS", {"phone": "+1-555-0199", "body": "Auth Code: 8821"}))
```

### 5. Advanced: Automatic Method Profiling Class Decorator
Decorating a class definition to automatically wrap **all public instance methods** in performance timing wrappers.

```python
import functools
import time

def profile_all_methods(cls):
    """Class decorator that wraps all public methods in timing profilers."""
    for attr_name, attr_value in list(cls.__dict__.items()):
        # Check if attribute is a callable function and not a private dunder method
        if callable(attr_value) and not attr_name.startswith("__"):
            
            def make_timed_wrapper(original_func, name):
                @functools.wraps(original_func)
                def wrapper(self, *args, **kwargs):
                    start = time.perf_counter()
                    res = original_func(self, *args, **kwargs)
                    ms = (time.perf_counter() - start) * 1000.0
                    print(f"⏱️ [{cls.__name__}.{name}] Executed in {ms:.3f} ms")
                    return res
                return wrapper

            setattr(cls, attr_name, make_timed_wrapper(attr_value, attr_name))
            
    return cls

@profile_all_methods
class HeavyDataComputeEngine:
    def process_matrix(self, n: int) -> int:
        return sum(x ** 2 for x in range(n))

    def compute_aggregates(self, values: list[float]) -> float:
        return sum(values) / len(values)

engine = HeavyDataComputeEngine()
engine.process_matrix(300_000)
engine.compute_aggregates([10.5, 20.0, 30.5])
```

---

## Code Explanation

In Example 5 (`profile_all_methods`):
1. The class decorator iterates over `cls.__dict__.items()`.
2. It identifies all public callable methods (`callable(attr_value)` and not starting with `__`).
3. It dynamically wraps each method in a timing closure (`make_timed_wrapper`), preserving method signatures with `@functools.wraps`.
4. It re-attaches the wrapped method to the class via `setattr(cls, attr_name, wrapped)`.
5. This proves the immense power of Class Decorators: with a single `@profile_all_methods` line, an entire class containing 50 methods is fully instrumented with zero manual boilerplate!

---

## Common Mistakes

### Mistake 1: Forgetting to Return the Class from a Class Decorator
If a class decorator modifies `cls` but forgets `return cls`, the class identifier becomes `None`, breaking instantiation.

```python
# BROKEN:
def broken_decorator(cls):
    cls.version = 1.0
    # Missing return cls! ❌

@broken_decorator
class App: pass

# app = App() # TypeError: 'NoneType' object is not callable! 💥
```

### Mistake 2: Missing `__get__` on Class-Based Method Decorators
Using a class as a decorator on a class method without implementing `__get__` breaks `self` binding.

---

## Best Practices

### Prefer Class Decorators Over Metaclasses
Whenever you need to modify or register a class after it has been created, use a **Class Decorator**. Reserve metaclasses strictly for situations where you must alter class memory allocation before the class is constructed.

Good:
```python
@register_model
class UserModel: pass
```

Avoid:
```python
class UserModel(metaclass=ModelMetaRegistry): pass # Complex & unnecessary
```

---

## Performance Considerations

1. **Definition-Time Execution**: Class decorators execute once when the module is imported. There is **zero runtime overhead** on object instantiation or method execution beyond whatever wrapper code you explicitly injected.
2. **Descriptor Binding Speed**: Implementing `__get__` with `types.MethodType` creates standard bound methods matching CPython's native speed.

---

## Security Considerations

1. **Plugin Isolation & Registration Validation**: When registering dynamic third-party plugins via class decorators, validate that plugins implement required ABC interfaces before saving them in your dispatch table.
2. **Class Namespace Tampering**: Ensure class decorators do not inadvertently overwrite critical internal dunder methods (like `__hash__` or `__eq__`) without intention.

---

## Real-World Usage

- **Python `@dataclass` (PEP 557)**: A class decorator that inspects annotations and generates `__init__`, `__repr__`, and `__eq__`.
- **`@functools.total_ordering`**: A class decorator that completes rich comparison methods from `__eq__` and `__lt__`.
- **FastAPI / Pydantic `@pydantic.dataclasses.dataclass`**: Enhancing dataclasses with runtime schema validation.

---

## Comparison: Metaprogramming Mechanisms

| Mechanism | Syntax | Execution Timing | Complexity | Best Fit |
|---|---|---|---|---|
| **Function Decorator** | `@dec def fn():` | Definition Time | Low | Wrapping functions, API routes |
| **Class as Decorator** | `class Dec: __call__` | Definition Time | Moderate | Stateful function wrappers |
| **Class Decorator** | `@dec class Cls:` | **Definition Time** | **Moderate** | **Class enhancement, Registries** |
| **Metaclass** | `class Cls(metaclass=M):`| Class Creation Time | High | Custom class allocation logic |

---

## Advanced Concepts: Synthesizing Metaclass Behavior

Class decorators can replicate almost all traditional metaclass use-cases (like enforcing abstract method implementations or singleton enforcement):

```python
def singleton(cls):
    instances = {}
    @functools.wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class GlobalConfig:
    def __init__(self):
        self.env = "PRODUCTION"

a = GlobalConfig()
b = GlobalConfig()
print("Is Singleton Instance?", a is b) # True!
```

---

## Exercises

### Exercise 1 — Beginner
Create a class decorator `@add_timestamp` that automatically adds a class attribute `registered_at` set to the current ISO UTC timestamp when the class is defined.

### Exercise 2 — Intermediate
Build a class decorator `@enforce_docstrings` that inspects all public methods of a decorated class and raises a `TypeError` at import time if any public method is missing a docstring (`__doc__`).

### Exercise 3 — Advanced
Build a `StatefulCallBenchmark` class decorator (using `__call__` and `__get__`) that tracks the execution time of decorated methods, maintaining the min, max, and average execution latency in instance attributes accessible via `my_method.stats`.

---

## Mini Project: Enterprise Microservice Plugin Registry & Lifecycle Orchestrator

### Requirements
Build a resilient microservice plugin management framework named `plugin_orchestrator.py`. Implement class decorators for registering data ingestion plugins, injecting lifecycle hooks (`on_startup`, `on_shutdown`), enforcing health check methods, and orchestrating plugin execution.

### Implementation Blueprint
```python
import functools
import time
from typing import Type

# =====================================================================
# 1. PLUGIN REGISTRY & ORCHESTRATOR
# =====================================================================

class PluginOrchestrator:
    _registry: dict[str, Type] = {}

    @classmethod
    def register_service_plugin(cls, service_name: str, priority: int = 10):
        """Class decorator that registers and configures microservice plugins."""
        def decorator(plugin_class: Type):
            # 1. Validate Required Interface Contract
            if not hasattr(plugin_class, "execute_task") or not callable(getattr(plugin_class, "execute_task")):
                raise TypeError(f"Plugin '{plugin_class.__name__}' must implement a callable 'execute_task()' method.")

            # 2. Inject Metadata Attributes
            plugin_class.service_name = service_name
            plugin_class.priority = priority
            plugin_class.is_healthy = True

            # 3. Store in Central Registry
            cls._registry[service_name.lower()] = plugin_class
            print(f"🔌 [PLUGIN REGISTERED] '{service_name}' (Priority: {priority}) -> {plugin_class.__name__}")
            return plugin_class
        return decorator

    @classmethod
    def run_all_plugins(cls, context_payload: dict):
        print("\n" + "=" * 68)
        print("         ORCHESTRATING ACTIVE MICROSERVICE PLUGINS")
        print("=" * 68)
        
        # Sort registered plugins by priority ascending
        sorted_plugins = sorted(cls._registry.values(), key=lambda p: p.priority)

        for p_cls in sorted_plugins:
            instance = p_cls()
            print(f"\n🚀 [EXECUTING] {instance.service_name} (Priority: {instance.priority})...")
            start = time.perf_counter()
            
            try:
                result = instance.execute_task(context_payload)
                ms = (time.perf_counter() - start) * 1000.0
                print(f"  ✅ [SUCCESS] Result: {result} ({ms:.2f} ms)")
            except Exception as err:
                print(f"  ❌ [FAILED] Plugin execution error: {err}")

# =====================================================================
# 2. REGISTERED PLUGIN SERVICES
# =====================================================================

@PluginOrchestrator.register_service_plugin(service_name="AuthTokenValidator", priority=1)
class AuthValidatorPlugin:
    def execute_task(self, context: dict) -> str:
        if "auth_token" not in context:
            raise PermissionError("Missing auth token.")
        return "AUTH_TOKEN_VERIFIED_VALID"

@PluginOrchestrator.register_service_plugin(service_name="DatabaseIngestionService", priority=2)
class DatabaseIngestionPlugin:
    def execute_task(self, context: dict) -> str:
        records = context.get("records", [])
        return f"INGESTED_{len(records)}_RECORDS_INTO_POSTGRES"

@PluginOrchestrator.register_service_plugin(service_name="AuditMetricEmitter", priority=3)
class AuditMetricPlugin:
    def execute_task(self, context: dict) -> str:
        return "AUDIT_METRICS_EMITTED_TO_DATADOG"

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE CLASS DECORATOR PLUGIN ORCHESTRATOR")
    print("=" * 65)
    
    # Run Orchestrator Pipeline
    test_context = {
        "auth_token": "bearer_secure_token_9901",
        "records": ["User1", "User2", "User3"]
    }
    
    PluginOrchestrator.run_all_plugins(test_context)
    print("\n" + "=" * 65)
```

---

## Summary

In this lesson, you mastered Python's class decorators:
- **Classes as Decorators** use `__init__` and `__call__` to maintain stateful wrappers cleanly.
- To decorate **class methods with a class decorator**, you **must implement `__get__`** to support method descriptor binding.
- **Class Decorators (Decorating Class Definitions)** inspect and mutate class objects at definition time, returning the enhanced `cls`.
- Class decorators serve as a **lightweight, readable alternative to Metaclasses**.
- Use class decorators to build automated **Plugin Registries**, inject serialization methods, and enforce runtime type safety.

---

## Best Practices Checklist

- [ ] Always return the modified class `cls` from a class decorator.
- [ ] Implement `__get__` on class-based decorators intended to wrap instance methods.
- [ ] Prefer class decorators over metaclasses for class modification and registration.
- [ ] Use `setattr(cls, name, func)` when injecting new methods into class definitions.
- [ ] Validate required plugin interfaces at definition time inside registration decorators.

---

## 🏆 MODULE 3: CLOSURES & DECORATORS COMPLETE!

Congratulations! You have completed all 4 comprehensive articles of **Module 3: Closures & Decorators in Depth**.

### What's Next?
Now advance to **Module 4: Functional Programming**:
👉 **[Functional Programming Module Overview](../functional-programming/README.md)** to master `map`, `filter`, `reduce`, `partial`, and higher-order function pipelines!
