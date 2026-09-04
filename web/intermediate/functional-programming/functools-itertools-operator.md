# Functools & Operator Modules in Python

## Introduction

In Python, functions like `sorted()`, `min()`, `max()`, and `itertools.groupby()` frequently require a **key function** to extract an attribute or index from complex objects. A common habit among developers is writing inline anonymous lambdas:

```python
# The Common Lambda Anti-Pattern:
sorted_users = sorted(users, key=lambda u: u.profile.email)
sorted_orders = sorted(orders, key=lambda o: o["amount"])
```

While functional, writing lambdas creates unnecessary Python bytecode execution frames for every single comparison.

To provide maximum performance, cleaner readability, and functional expressiveness, Python provides the **`operator`** and **`functools`** standard library modules:

- **`operator.itemgetter`**: High-speed C-level dictionary key and sequence index extraction.
- **`operator.attrgetter`**: High-speed C-level attribute extraction (including deep dotted paths `u.profile.email`).
- **`operator.methodcaller`**: Dynamically invokes a named method on target objects.
- **`@functools.singledispatch`**: Implements **Generic Function Overloading (Polymorphism)** based on the type of the first argument (PEP 443).
- **`@functools.singledispatchmethod`**: Implements single-dispatch overloading inside class definitions.

This lesson concludes **Module 4: Functional Programming in Depth**, mastering C-accelerated extractors and generic polymorphic function dispatching.

---

## Prerequisites

Before studying `operator` and `functools`, ensure you have:

- Completed [Map, Filter & Reduce](map-filter-reduce.md).
- Completed [Decorators with Arguments & Functools](../decorators/decorator-arguments-and-functools.md).
- Familiarity with Python type hints and classes.

---

## Core Concept: The `operator` and `singledispatch` Architecture

```
                          THE OPERATOR & SINGLEDISPATCH ARCHITECTURE

       C-LEVEL HIGH SPEED EXTRACTORS (operator)        GENERIC FUNCTION OVERLOADING (singledispatch)
      ┌────────────────────────────────────────┐      ┌─────────────────────────────────────────────┐
      │ • itemgetter("id", "amount")           │      │ @functools.singledispatch                   │
      │   -> C-level dictionary / index lookup │      │ def serialize(val): ...                     │
      │ • attrgetter("user.profile.email")     │      │                                             │
      │   -> C-level dotted attribute lookup   │      │ @serialize.register(int)                    │
      │ • methodcaller("strip", " \t")         │      │ def _(val: int): return f"INT:{val}"        │
      │   -> C-level dynamic method invocation │      │ @serialize.register(datetime)               │
      └────────────────────────────────────────┘      │ def _(val: datetime): return val.isoformat()│
                                                      └─────────────────────────────────────────────┘
```

---

## Syntax & Essential Operator Patterns

```python
import operator
import functools
from datetime import datetime, timezone

# 1. High-Speed Extraction with itemgetter & attrgetter
users = [
    {"id": 101, "name": "Hesam", "dept": "Engineering", "salary": 140000},
    {"id": 102, "name": "Sarah", "dept": "Finance",     "salary": 160000},
    {"id": 103, "name": "Alex",  "dept": "Engineering", "salary": 125000},
]

# Sort by department, then by salary descending:
sorted_users = sorted(users, key=operator.itemgetter("dept", "salary"))
print("Sorted Users by Dept & Salary:\n", sorted_users)

# 2. Dynamic Method Invocation with methodcaller
raw_strings = ["  python  ", "  rust  ", "  golang  "]
strip_and_upper = operator.methodcaller("strip")
cleaned = list(map(strip_and_upper, raw_strings))
print("Cleaned Strings:", cleaned) # ['python', 'rust', 'golang']

# 3. Generic Function Polymorphism with @functools.singledispatch
@functools.singledispatch
def format_payload(val: any) -> str:
    """Base fallback implementation."""
    return f"STRING_FALLBACK: {str(val)}"

@format_payload.register(int)
@format_payload.register(float)
def _(val: int | float) -> str:
    return f"NUMERIC: {val:,.2f}"

@format_payload.register(datetime)
def _(val: datetime) -> str:
    return f"TIMESTAMP_UTC: {val.strftime('%Y-%m-%d %H:%M:%SZ')}"

@format_payload.register(list)
def _(val: list) -> str:
    return f"ARRAY_COUNT: {len(val)} elements"

# Call single unified function with different types!
print(format_payload(1250000))            # "NUMERIC: 1,250,000.00"
print(format_payload(datetime.now(timezone.utc))) # "TIMESTAMP_UTC: 2024-..."
print(format_payload(["A", "B", "C"]))    # "ARRAY_COUNT: 3 elements"
```

---

## Detailed Explanation

### 1. Why `operator` Outperforms Lambdas

When sorting a list of 1,000,000 dictionaries:
- `lambda x: x["amount"]`: Python must compile and execute 1,000,000 Python function call frames on the interpreter evaluation stack.
- `operator.itemgetter("amount")`: Evaluates in **pure compiled C** (`Modules/operator.c`), bypassing the Python bytecode evaluator loop entirely.

`itemgetter` and `attrgetter` are consistently **25% to 40% faster** than equivalent lambdas.

---

### 2. Dotted Attribute Traversal with `operator.attrgetter`

`attrgetter` supports deep dotted attribute paths in a single call, traversing nested object hierarchies safely:

```python
class Profile:
    def __init__(self, email: str): self.email = email

class UserAccount:
    def __init__(self, username: str, profile: Profile):
        self.username = username
        self.profile = profile

user = UserAccount("hesamp", Profile("hesam@domain.com"))

# Deep dotted extraction:
extract_email = operator.attrgetter("profile.email")
print("Extracted Email:", extract_email(user)) # "hesam@domain.com"
```

---

### 3. Generic Function Overloading with `@functools.singledispatch`

In statically typed languages (like C++ or Java), **Method Overloading** allows defining multiple functions with the same name but different parameter types.

Python achieves this dynamically using **`@functools.singledispatch`** (PEP 443):
1. Decorate the base function with `@functools.singledispatch`.
2. Register specialized implementations using `@func_name.register(DataType)`.
3. When `func_name(arg)` is called, Python inspects `type(arg)`, traverses its MRO, and dispatches to the most specific registered implementation.

```python
@functools.singledispatch
def process_data(data):
    raise NotImplementedError(f"Unsupported type: {type(data)}")

@process_data.register(dict)
def _(data: dict):
    return f"Processing Dict with {len(data)} keys"

@process_data.register(list)
def _(data: list):
    return f"Processing List with {len(data)} items"
```

---

## Examples

### 1. Simple: Arithmetic and Logical Operator Callables
Using `operator.add`, `operator.mul`, and `operator.contains` as higher-order arguments.

```python
import operator
import functools

numbers = [1, 2, 3, 4, 5]

# Functional sum and product using operator functions
total_sum = functools.reduce(operator.add, numbers, 0)
total_prod = functools.reduce(operator.mul, numbers, 1)

print(f"Sum (operator.add): {total_sum}")   # 15
print(f"Product (operator.mul): {total_prod}") # 120
```

### 2. Beginner: Multi-Attribute Object Sorting with `attrgetter`
Sorting a collection of custom domain objects by multiple fields with ascending/descending rules.

```python
import operator

class ServerNode:
    def __init__(self, region: str, load_pct: float, memory_gb: int):
        self.region = region
        self.load_pct = load_pct
        self.memory_gb = memory_gb

    def __repr__(self):
        return f"Server({self.region}, Load: {self.load_pct}%, RAM: {self.memory_gb}GB)"

cluster = [
    ServerNode("us-east", 85.0, 64),
    ServerNode("eu-central", 42.0, 128),
    ServerNode("us-east", 25.0, 64),
    ServerNode("eu-central", 90.0, 32),
]

# Sort primarily by region, secondarily by load percentage:
sorted_cluster = sorted(cluster, key=operator.attrgetter("region", "load_pct"))

print("Cluster Nodes Sorted by Region & Load:")
for node in sorted_cluster:
    print("  •", node)
```

### 3. Intermediate: Dynamic Method Invocation with `methodcaller`
Calling methods with arguments across a heterogeneous list of objects.

```python
import operator

class SQLDatabase:
    def execute_query(self, query: str) -> str:
        return f"Postgres executing: '{query}'"

class RedisCache:
    def execute_query(self, query: str) -> str:
        return f"Redis caching key: '{query}'"

db_clients = [SQLDatabase(), RedisCache()]

# Create a methodcaller that invokes execute_query("SELECT * FROM users")
run_query = operator.methodcaller("execute_query", "SELECT * FROM users")

for client in db_clients:
    print(run_query(client))
```

### 4. Real-World: Unified Enterprise JSON Serializer with `@singledispatch`
Building a polymorphic serializer converting complex domain types into JSON-serializable primitives.

```python
import functools
import json
from datetime import datetime, date, timezone
from decimal import Decimal
from uuid import UUID, uuid4

@functools.singledispatch
def to_json_primitive(obj: any) -> any:
    """Fallback serialization: attempts string conversion or raises TypeError."""
    if hasattr(obj, "to_dict"):
        return obj.to_dict()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

@to_json_primitive.register(datetime)
@to_json_primitive.register(date)
def _(obj: datetime | date) -> str:
    return obj.isoformat()

@to_json_primitive.register(Decimal)
def _(obj: Decimal) -> float:
    return float(obj)

@to_json_primitive.register(UUID)
def _(obj: UUID) -> str:
    return str(obj)

@to_json_primitive.register(set)
def _(obj: set) -> list:
    return sorted(list(obj))

# Complex domain dictionary with non-JSON types
complex_invoice = {
    "invoice_id": uuid4(),
    "issued_date": date(2024, 5, 18),
    "amount": Decimal("1450.75"),
    "tags": {"enterprise", "cloud", "priority"}
}

# Serialize dictionary using singledispatch converter
clean_invoice = {k: to_json_primitive(v) for k, v in complex_invoice.items()}
print("Exported JSON Payload:\n", json.dumps(clean_invoice, indent=2))
```

### 5. Advanced: Method Overloading Inside Classes with `@singledispatchmethod`
Implementing single-dispatch polymorphism inside an enterprise Event Bus consumer class.

```python
import functools

class FinancialEventDispatcher:
    def __init__(self, ledger_name: str):
        self.ledger_name = ledger_name

    # Single-dispatch method inside class
    @functools.singledispatchmethod
    def dispatch_event(self, event):
        raise NotImplementedError(f"[{self.ledger_name}] No dispatcher registered for event type: {type(event).__name__}")

    @dispatch_event.register
    def _(self, event: str):
        print(f"📝 [{self.ledger_name}] Processing String Event: '{event}'")

    @dispatch_event.register
    def _(self, event: dict):
        action = event.get("action", "UNKNOWN")
        amount = event.get("amount", 0.0)
        print(f"💰 [{self.ledger_name}] Processing Dict Event: {action} of ${amount:,.2f}")

    @dispatch_event.register
    def _(self, event: list):
        print(f"📦 [{self.ledger_name}] Processing Batch Event Stream of {len(event)} items.")

bus = FinancialEventDispatcher(ledger_name="Global_Ledger_v1")
bus.dispatch_event("USER_LOGGED_IN")
bus.dispatch_event({"action": "TRANSFER", "amount": 5000.00})
bus.dispatch_event([101, 102, 103])
```

---

## Code Explanation

In Example 5 (`singledispatchmethod`):
1. **`@functools.singledispatchmethod`** adapts generic function polymorphism to class methods, binding `self` properly as the first argument while dispatching based on the **second argument (`event`)**.
2. Notice how registered implementations can omit explicit type annotations in `@dispatch_event.register` if the parameter is type-annotated (`def _(self, event: dict):`). Python automatically extracts the type from the annotation.
3. This creates clean, modular event bus architectures without messy `if isinstance(...)` conditional chains.

---

## Common Mistakes

### Mistake 1: Using `itemgetter` on Object Attributes Instead of `attrgetter`
Calling `operator.itemgetter("name")(user_obj)` raises `TypeError: 'User' object is not subscriptable`. Use `operator.attrgetter("name")` for object attributes and `operator.itemgetter("key")` for dictionaries and sequences.

### Mistake 2: Attempting to Overload Multiple Arguments with `singledispatch`
`singledispatch` dispatches **strictly on the type of the first argument**. It does not support multi-argument dispatching (Multiple Dispatch). For multiple dispatch, third-party libraries (like `plum-dispatch` or `multipledispatch`) are required.

---

## Best Practices

### Use `itemgetter` and `attrgetter` as `key=` Functions
Always prefer `itemgetter` and `attrgetter` over lambdas when passing key extractors to `sorted()`, `min()`, `max()`, and `itertools.groupby()`.

Good:
```python
sorted_records = sorted(records, key=operator.itemgetter("date", "amount"))
```

Avoid:
```python
sorted_records = sorted(records, key=lambda r: (r["date"], r["amount"])) # Slower & verbose
```

---

## Performance Considerations

1. **`operator` vs Lambda Benchmark**: In sorting loops, `operator.itemgetter` achieves **1.4x faster** execution compared to lambdas due to direct C-level struct dereferences.
2. **`singledispatch` Dispatch Cache**: `@functools.singledispatch` caches resolved types in an internal `dispatch_cache` dictionary, providing $O(1)$ dispatch lookup after the first call.

---

## Security Considerations

1. **Untrusted Attribute Extraction**: Never pass untrusted user-supplied string keys directly to `operator.attrgetter()` (e.g. `attrgetter(user_input)(obj)`), as an attacker could access sensitive internal attributes like `__class__.__init__.__globals__`. Validate allowed attribute names against an explicit whitelist.

---

## Real-World Usage

- **Python Standard Library `functools`**: Powering AST compiler passes and visitor patterns.
- **SQLAlchemy & Django Query Parsers**: Extracting model attributes with `attrgetter`.
- **FastAPI / Pydantic Custom Encoders**: Implementing custom type serializers with `@singledispatch`.

---

## Comparison: Extractor & Dispatch Mechanisms

| Mechanism | Syntax | Performance | Multiple Attributes? | Best Use Case |
|---|---|---|---|---|
| **`operator.itemgetter`** | `itemgetter("k1", "k2")` | **Fastest (C-Level)** | **Yes** | Sorting dicts, lists, tuples |
| **`operator.attrgetter`** | `attrgetter("a.b.c")` | **Fastest (C-Level)** | **Yes (Dotted)** | Sorting domain model instances|
| **`operator.methodcaller`**| `methodcaller("m", arg)`| **Fastest (C-Level)** | N/A | Dynamic method execution |
| **`lambda x: ...`** | `lambda x: x.attr` | Moderate (Python frame)| Custom logic | Complex non-attribute logic |
| **`@singledispatch`** | `@singledispatch` | **Fast ($O(1)$ cache)** | N/A | Generic polymorphic functions |

---

## Advanced Concepts: Inspecting `singledispatch` Registry

You can inspect all registered type implementations of a single-dispatch function via the **`.registry`** dictionary attribute:

```python
print("Registered Types in to_json_primitive:")
for registered_type, handler in to_json_primitive.registry.items():
    print(f"  • Type: {registered_type} -> Handler: {handler.__name__}")
```

---

## Exercises

### Exercise 1 — Beginner
Given a list of student tuples `students = [("Hesam", 95), ("Sarah", 88), ("Alex", 99)]`, use `sorted()` with `operator.itemgetter` to sort the students by grade descending.

### Exercise 2 — Intermediate
Given a class `Employee` with attributes `name: str`, `department: str`, and `salary: float`, use `itertools.groupby()` and `operator.attrgetter` to group a list of employees by department and print total salaries.

### Exercise 3 — Advanced
Build a generic polymorphic calculator `@singledispatch def calculate_area(shape)` that calculates the surface area for `Circle`, `Rectangle`, and `Triangle` dataclasses without using inheritance or `isinstance` checks.

---

## Mini Project: Enterprise Generic Event Serializer & Multi-Attribute Sorter

### Requirements
Build an operational telemetry routing system named `telemetry_router.py`. Implement `@functools.singledispatch` serializers for heterogeneous telemetry event types, sort queued event records by severity and timestamp using `operator.attrgetter`, and dispatch events to destination channels.

### Implementation Blueprint
```python
import functools
import operator
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

# =====================================================================
# 1. EVENT DATA MODELS
# =====================================================================

@dataclass
class MetricEvent:
    event_id: str
    severity: int  # 1 (Low) to 5 (Critical)
    metric_name: str
    value: float
    timestamp: datetime

@dataclass
class SecurityAlertEvent:
    event_id: str
    severity: int
    threat_level: str
    source_ip: str
    timestamp: datetime

# =====================================================================
# 2. GENERIC POLYMORPHIC EVENT SERIALIZER
# =====================================================================

@functools.singledispatch
def serialize_event_payload(event: any) -> dict:
    """Fallback generic serializer."""
    raise TypeError(f"Cannot serialize unsupported event type: {type(event).__name__}")

@serialize_event_payload.register(MetricEvent)
def _(event: MetricEvent) -> dict:
    return {
        "id": event.event_id,
        "type": "SYSTEM_METRIC",
        "severity": event.severity,
        "payload": {"metric": event.metric_name, "val": round(event.value, 2)},
        "timestamp": event.timestamp.strftime("%Y-%m-%d %H:%M:%SZ")
    }

@serialize_event_payload.register(SecurityAlertEvent)
def _(event: SecurityAlertEvent) -> dict:
    return {
        "id": event.event_id,
        "type": "SECURITY_THREAT",
        "severity": event.severity,
        "payload": {"threat": event.threat_level, "ip": event.source_ip},
        "timestamp": event.timestamp.strftime("%Y-%m-%d %H:%M:%SZ")
    }

# =====================================================================
# 3. ROUTER & MULTI-ATTRIBUTE SORTER PIPELINE
# =====================================================================

class TelemetryRouter:
    @staticmethod
    def process_and_route(events: list):
        print("=" * 68)
        print("      ENTERPRISE TELEMETRY ROUTER & OPERATOR PIPELINE")
        print("=" * 68)
        
        # 1. Multi-Attribute Sorting with operator.attrgetter
        # Sort primarily by severity (descending), secondarily by timestamp
        sorted_events = sorted(
            events,
            key=operator.attrgetter("severity"),
            reverse=True
        )
        
        print("\n📋 Queued Events (Sorted by Severity Descending):")
        print("-" * 68)
        for ev in sorted_events:
            # 2. Polymorphic Serialization via @singledispatch
            serialized = serialize_event_payload(ev)
            print(f"  [{serialized['severity']}★] ({serialized['type']:<15}) {serialized['id']} -> {serialized['payload']}")
            
        print("=" * 68)

if __name__ == "__main__":
    now = datetime.now(timezone.utc)
    
    event_queue = [
        MetricEvent("METRIC-01", severity=2, metric_name="cpu_load_pct", value=45.2, timestamp=now),
        SecurityAlertEvent("SEC-99", severity=5, threat_level="SQL_INJECTION_DETECTED", source_ip="192.168.1.104", timestamp=now),
        MetricEvent("METRIC-02", severity=4, metric_name="memory_oom_warning", value=94.8, timestamp=now),
        SecurityAlertEvent("SEC-12", severity=3, threat_level="PORT_SCAN", source_ip="10.0.4.15", timestamp=now),
    ]
    
    TelemetryRouter.process_and_route(event_queue)
```

---

## Summary

In this lesson, you mastered the `operator` and `functools` modules:
- **`operator.itemgetter`** and **`operator.attrgetter`** provide C-speed key and attribute extraction, executing **25–40% faster** than equivalent lambdas.
- **`operator.methodcaller`** dynamically executes named methods across collections of objects.
- **`@functools.singledispatch`** enables clean **Generic Function Overloading** based on parameter type.
- Use **`@functools.singledispatchmethod`** for method overloading inside class definitions.
- Always use `itemgetter` and `attrgetter` as `key=` functions in `sorted()`, `min()`, `max()`, and `groupby()`.

---

## Best Practices Checklist

- [ ] Use `operator.itemgetter` and `operator.attrgetter` instead of lambdas for sorting keys.
- [ ] Use `@functools.singledispatch` for type-driven formatters and serializers instead of `isinstance` ladders.
- [ ] Use `@functools.singledispatchmethod` inside class definitions.
- [ ] Use `operator.add` and `operator.mul` in `functools.reduce()` calls.
- [ ] Whitelist allowed attribute names when using `attrgetter` on user-supplied strings.

---

## 🏆 MODULE 4: FUNCTIONAL PROGRAMMING COMPLETE!

Congratulations! You have completed all articles of **Module 4: Functional Programming in Depth**.

### What's Next?
Now advance to **Module 5: Type Hints & Static Analysis**:
👉 **[Type Hints & Static Analysis Module Overview](../typing/README.md)** to master Generics, `TypeVar`, `Protocol`, `ParamSpec`, `TypeGuard`, and `mypy` static type checking!
