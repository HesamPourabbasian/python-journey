# Constructors & Instance Attributes in Python

## Introduction

In Object-Oriented Programming, creating an object is not a single monolithic step. In Python, object creation is a coordinated **Dual-Stage Lifecycle** divided between memory allocation and attribute initialization.

While most beginner tutorials loosely refer to `__init__` as the "constructor," Python's true constructor is **`__new__`**, which allocates the raw memory block for the object before handing it to **`__init__`** for state initialization.

Furthermore, mastering Python's object model requires distinguishing between **Class Attributes** (shared across all instances of a class) and **Instance Attributes** (isolated to a specific object). Misunderstanding this distinction leads to the notorious **Mutable Class Attribute Bug**, where modifying a list on one object unexpectedly mutates data across all other instances in the entire application.

Finally, in performance-critical and memory-constrained applications (such as data streaming, gaming engines, and high-frequency trading), Python provides **`__slots__`**—a mechanism that eliminates the default `__dict__` hash table, reducing memory consumption by over **60%** while accelerating attribute lookup speeds.

This lesson explores the object creation lifecycle, attribute namespaces, shadowing mechanics, and high-performance memory tuning with `__slots__`.

---

## Prerequisites

Before studying constructors and attributes, ensure you have:

- Completed [Classes & Objects](classes-and-objects.md).
- Completed [Mutable vs Immutable Objects](../../beginner/variables-data-types/mutable-vs-immutable.md).
- A solid understanding of Python dictionaries and memory addresses (`id()`).

---

## Core Concept: The Dual-Stage Object Creation Lifecycle

When you instantiate a class by calling `obj = User("Hesam")`, Python executes two distinct dunder methods in sequence:

```
                            THE DUAL-STAGE INSTANTIATION PIPELINE

                  Call: user = User("Hesam", role="Admin")
                                     │
                                     ▼
        1. ALLOCATION STAGE: __new__(cls, *args, **kwargs)
           • Allocates raw memory block for the new instance in heap RAM.
           • Must return the newly created instance object (instance of cls).
                                     │
                                     ▼ (Passes instance as 'self')
        2. INITIALIZATION STAGE: __init__(self, *args, **kwargs)
           • Attaches instance attributes to 'self' (e.g., self.name = "Hesam").
           • MUST return None. (Returning anything else raises TypeError!)
                                     │
                                     ▼
                  Result: 'user' bound to initialized instance
```

---

## Syntax & Essential Attribute Patterns

```python
# 1. Standard Initializer (__init__)
class UserProfile:
    # CLASS ATTRIBUTE: Shared across ALL instances!
    default_role = "MEMBER"

    def __init__(self, username: str, email: str):
        # INSTANCE ATTRIBUTES: Unique to THIS specific instance
        self.username = username
        self.email = email

# 2. Overriding __new__ (e.g. Singleton Pattern or Custom Allocation)
class SingletonDatabase:
    _instance = None  # Class attribute holding the single shared instance

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            # Allocate memory via object base class
            cls._instance = super().__new__(cls)
            print("📦 [ALLOCATED] Creating new Singleton instance in memory.")
        return cls._instance

    def __init__(self, db_name: str = "production_db"):
        self.db_name = db_name

# 3. High-Performance Memory Optimization with __slots__
class Point2D:
    # Eliminates __dict__ hash table; allocates fixed C-level struct pointers
    __slots__ = ("x", "y")

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
```

---

## Detailed Explanation

### 1. `__new__` (The Allocator) vs `__init__` (The Initializer)

| Method | Role | First Parameter | Return Requirement |
|---|---|---|---|
| **`__new__(cls, ...)`** | **Allocates** raw object in RAM | `cls` (The Class) | **Must return new instance object** |
| **`__init__(self, ...)`** | **Initializes** attributes on instance | `self` (The Instance) | **Must return `None`** |

`__new__` is rarely overridden in everyday code, but it is indispensable for:
1. **Subclassing Immutable Types**: Modifying arguments before immutable objects (`int`, `str`, `tuple`) are allocated in memory.
2. **Creational Design Patterns**: Implementing Singletons, Object Pools, or Metaclass factories.

---

### 2. Class Attributes vs Instance Attributes & Shadowing

- **Class Attributes**: Defined directly inside the `class` block. They reside in `Class.__dict__` and are shared by all instances.
- **Instance Attributes**: Assigned via `self.attribute` (typically inside `__init__`). They reside in `instance.__dict__`.

#### The Shadowing Rule:
When reading `obj.attr`, Python first checks `obj.__dict__`. If not found, it falls back to `Class.__dict__`.

```python
class Configuration:
    timeout_seconds = 30  # Class Attribute

cfg1 = Configuration()
cfg2 = Configuration()

print(cfg1.timeout_seconds)  # 30 (Reads from Class.__dict__)
print(cfg2.timeout_seconds)  # 30 (Reads from Class.__dict__)

# SHADOWING OCCURS ON RE-BINDING:
cfg1.timeout_seconds = 60    # Creates an INSTANCE attribute on cfg1!

print(cfg1.timeout_seconds)  # 60 (Reads from cfg1.__dict__ - Shadowed!)
print(cfg2.timeout_seconds)  # 30 (Still reads from Class.__dict__!)
```

---

### 3. The Dangerous Mutable Class Attribute Bug

Placing a **mutable data structure** (like a `list`, `dict`, or `set`) as a class attribute is one of the most common critical bugs in Python:

```python
# 🚨 CRITICAL ANTI-PATTERN:
class BadAccount:
    transaction_history = []  # CLASS ATTRIBUTE (Shared list across all accounts!)

    def add_tx(self, tx: str):
        self.transaction_history.append(tx)  # MUTATES THE SHARED CLASS LIST!

acc_a = BadAccount()
acc_b = BadAccount()

acc_a.add_tx("Deposit $500 for Hesam")
print(acc_b.transaction_history)  # ["Deposit $500 for Hesam"] 💥 LEAKED TO ACC_B!

# ✅ CORRECT PATTERN (Instance Attribute):
class GoodAccount:
    def __init__(self):
        self.transaction_history = []  # Unique list per instance!
```

---

### 4. Memory Optimization with `__slots__`

By default, every Python object stores its instance attributes in a dynamic dictionary (`self.__dict__`). While flexible (allowing you to add arbitrary attributes at runtime), hash tables consume significant memory (~150 bytes minimum per instance).

By defining **`__slots__ = ("attr1", "attr2")`**:
1. Python **omits the `__dict__` hash table entirely**, allocating a compact C-level struct with fixed pointer offsets.
2. Memory consumption drops by **60% to 75%**.
3. Attribute read/write access speed increases by **~20%**.
4. Python **prevents accidental dynamic attribute typos** (assigning `obj.invalid_attr` raises `AttributeError`).

---

## Examples

### 1. Simple: Global Active Connection Counter
Using a class attribute to track the number of active live objects.

```python
class ClientSession:
    # Class attribute tracking total live sessions
    active_session_count = 0

    def __init__(self, user_id: str):
        self.user_id = user_id
        ClientSession.active_session_count += 1
        print(f"✅ Session opened for {user_id} (Active: {ClientSession.active_session_count})")

    def close(self):
        ClientSession.active_session_count -= 1
        print(f"🔒 Session closed for {self.user_id} (Active: {ClientSession.active_session_count})")

s1 = ClientSession("User-101")
s2 = ClientSession("User-102")
print("Total Active:", ClientSession.active_session_count)  # 2

s1.close()
print("Total Active:", ClientSession.active_session_count)  # 1
```

### 2. Beginner: Custom Initializer with Validation Guards
Validating arguments and initializing derived computed attributes in `__init__`.

```python
class EmployeeRecord:
    def __init__(self, emp_id: int, name: str, base_salary: float, bonus_pct: float = 0.0):
        if base_salary <= 0:
            raise ValueError(f"Base salary must be positive, got ${base_salary}")
        if not (0.0 <= bonus_pct <= 1.0):
            raise ValueError(f"Bonus percentage must be between 0.0 and 1.0, got {bonus_pct}")

        self.emp_id = emp_id
        self.name = name.strip().title()
        self.base_salary = round(base_salary, 2)
        self.bonus_pct = bonus_pct
        
        # Computed Instance Attribute
        self.total_compensation = round(self.base_salary * (1.0 + self.bonus_pct), 2)

emp = EmployeeRecord(101, "hesam pourabbasain", 120_000.0, bonus_pct=0.15)
print(f"Employee: {emp.name} | Total Comp: ${emp.total_compensation:,.2f}")
```

### 3. Intermediate: Thread-Safe Singleton Pattern using `__new__`
Ensuring exactly one instance of a configuration manager exists across the entire runtime.

```python
import threading

class AppConfigurationManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        # Double-Checked Locking Pattern for Thread-Safety
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, env: str = "production"):
        # Prevent re-initializing if already instantiated
        if self._initialized:
            return
        self.env = env
        self.api_keys = {"STRIPE": "sk_live_12345", "AWS": "AKIA_PROD_99"}
        self._initialized = True

cfg_a = AppConfigurationManager("production")
cfg_b = AppConfigurationManager("staging")

print("Are cfg_a and cfg_b the same object in RAM?", cfg_a is cfg_b) # True!
print("Environment of cfg_b:", cfg_b.env)                           # "production" (Preserved!)
```

### 4. Real-World: High-Throughput Telemetry Coordinate Benchmarking with `__slots__`
Comparing memory consumption between a standard dictionary-backed class and a `__slots__` class.

```python
import sys

# 1. Standard Class (Allocates __dict__)
class StandardTelemetryPoint:
    def __init__(self, lat: float, lon: float, alt: float, speed: float):
        self.lat = lat
        self.lon = lon
        self.alt = alt
        self.speed = speed

# 2. Slotted Class (No __dict__)
class SlottedTelemetryPoint:
    __slots__ = ("lat", "lon", "alt", "speed")

    def __init__(self, lat: float, lon: float, alt: float, speed: float):
        self.lat = lat
        self.lon = lon
        self.alt = alt
        self.speed = speed

p_std = StandardTelemetryPoint(37.7749, -122.4194, 15.0, 65.2)
p_slot = SlottedTelemetryPoint(37.7749, -122.4194, 15.0, 65.2)

# Size of instance object + internal __dict__ size
std_size = sys.getsizeof(p_std) + sys.getsizeof(p_std.__dict__)
slot_size = sys.getsizeof(p_slot)

print(f"Standard Class Instance Size : {std_size} bytes")
print(f"Slotted Class Instance Size  : {slot_size} bytes")
print(f"🚀 Memory Reduction Ratio    : {(1 - slot_size / std_size) * 100:.1f}% Savings!")
```

### 5. Advanced: Modifying Immutable Classes via `__new__`
Subclassing Python's immutable `str` to force all strings to uppercase upon allocation.

```python
class UpperCaseString(str):
    """Subclass of immutable 'str' that forces uppercase transformation in __new__."""

    def __new__(cls, content: str):
        # Because 'str' is immutable, we MUST transform data BEFORE allocation in __new__!
        transformed_content = content.upper()
        return super().__new__(cls, transformed_content)

name = UpperCaseString("hesam pourabbasain")
print("Instance Content :", name)                  # "HESAM POURABBASAIN"
print("Is Instance str? :", isinstance(name, str)) # True
```

---

## Code Explanation

In Example 5 (`UpperCaseString`):
1. The built-in `str` class is **immutable**. Once allocated, its character contents can never be altered.
2. If you attempted to override `__init__(self, content)` and modify `self`, Python would ignore it because `self` is already frozen.
3. By overriding `__new__(cls, content)`, we intercept the input *before* allocation, transforming it with `.upper()` and passing the modified text to `super().__new__(cls, transformed)`.
4. This demonstrates the critical architectural role of `__new__` when subclassing immutable built-in types (`str`, `int`, `tuple`, `frozenset`).

---

## Common Mistakes

### Mistake 1: Returning a Value from `__init__`
`__init__` is an initializer, not a constructor. It **must return `None`**. Returning any non-None value raises a `TypeError: __init__() should return None`.

```python
# BROKEN:
class User:
    def __init__(self, name):
        self.name = name
        return self  # TypeError: __init__() should return None, not 'User' ❌
```

### Mistake 2: Accidentally Mutating Class Attributes via `self`
Using `self.list.append(x)` when `list = []` is declared at the class level mutates the shared class list, contaminating all instances.

---

## Best Practices

### Declare All Instance Attributes Inside `__init__`
Avoid adding new attributes dynamically outside `__init__`. Declaring all instance attributes in `__init__` provides a clean schema contract for your class and enables IDE autocompletion and static type analysis.

Good:
```python
class Device:
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.is_connected = False  # Explicitly declared upfront
```

Avoid:
```python
class Device:
    def __init__(self, device_id: str):
        self.device_id = device_id

    def connect(self):
        self.is_connected = True  # Dynamically created later (Hard to track!) ❌
```

---

## Performance Considerations

1. **`__slots__` Memory Footprint**: When instantiating 1,000,000 objects in memory (e.g. coordinates in GIS mapping or financial ticker bars), a standard class consumes ~180 MB of RAM, whereas a `__slots__` class consumes only ~55 MB.
2. **Preventing `__slots__` Inheritance Leaks**: If a subclass inherits from a slotted class without defining its own `__slots__ = ()`, Python automatically adds a `__dict__` back to the subclass, nullifying the memory optimization!

---

## Security Considerations

1. **Attribute Injection Prevention with `__slots__`**: In public web frameworks, malicious payloads might attempt to inject arbitrary attributes into domain models. Classes with `__slots__` strictly forbid dynamic attribute assignment, preventing unauthorized attribute tampering.
2. **Namespace Pollution**: Keep internal private attributes protected with leading underscores (`_internal_state`) to prevent accidental external mutation.

---

## Real-World Usage

- **SQLAlchemy ORM (`Column` Declarations)**: Using class attributes to define database table schemas.
- **AsyncIO Event Loop (`asyncio.get_event_loop()`)**: Managing a single singleton loop instance via `__new__`.
- **High-Performance Pandas / Polars Data Structures**: Utilizing slotted C-structures for tabular data arrays.

---

## Comparison: Creation Mechanisms

| Feature | Standard `__init__` | `__new__` Override | Slotted Class (`__slots__`) |
|---|---|---|---|
| **Role** | Attribute Initialization | Object Memory Allocation | Memory-Optimized Layout |
| **`__dict__` Present?** | **Yes** | Yes | **No (Eliminated)** |
| **Dynamic Attributes?** | **Yes** | Yes | **No (Restricted to slots)** |
| **Memory per Instance** | ~150 – 200 bytes | ~150 – 200 bytes | **~48 – 64 bytes (65% less!)** |
| **Primary Use Case** | Standard business logic | Singletons, Immutable subclasses | High-volume data streaming |

---

## Advanced Concepts: Dynamic Class Modification via `__class__`

In Python, an instance's underlying class is stored in the **`__class__`** attribute and can be modified at runtime (a technique known as **Class Re-binding** or the State Pattern):

```python
class NormalUser:
    def get_permissions(self): return ["READ"]

class AdminUser:
    def get_permissions(self): return ["READ", "WRITE", "DELETE"]

user = NormalUser()
print("Initial Permissions :", user.get_permissions())  # ["READ"]

# Promote user dynamically to AdminUser:
user.__class__ = AdminUser
print("Promoted Permissions:", user.get_permissions())  # ["READ", "WRITE", "DELETE"]
```

---

## Exercises

### Exercise 1 — Beginner
Create a class `Car` with a class attribute `wheels = 4` and instance attributes `make`, `model`, and `color`. Create three instances. Demonstrate how changing `Car.wheels = 6` updates all instances, while setting `car1.wheels = 3` shadows the attribute only on `car1`.

### Exercise 2 — Intermediate
Build an immutable `CaseInsensitiveDictKey(str)` class by subclassing `str` and overriding `__new__` to convert all input strings to lowercase before instantiation.

### Exercise 3 — Advanced
Build a `HighFrequencyTicker` class with `__slots__ = ("symbol", "bid", "ask", "timestamp")`. Instantiate 500,000 ticker objects in a list, benchmark the total memory consumption using `sys.getsizeof()`, and verify that attempting to set `ticker.volume = 1000` raises an `AttributeError`.

---

## Mini Project: In-Memory Time-Series Telemetry Engine with Memory Profiling

### Requirements
Build a high-performance in-memory IoT telemetry engine named `telemetry_engine.py`. Implement a `SensorReading` class with `__slots__`, a `TelemetryStream` buffer, automatic statistics calculations, and a memory comparison auditor against standard dictionary-backed classes.

### Implementation Blueprint
```python
import sys
import time
import random
from datetime import datetime, timezone

# 1. High-Performance Slotted Model
class SensorReading:
    __slots__ = ("sensor_id", "temperature", "humidity", "timestamp")

    def __init__(self, sensor_id: str, temperature: float, humidity: float, timestamp: float):
        self.sensor_id = sensor_id
        self.temperature = round(temperature, 2)
        self.humidity = round(humidity, 2)
        self.timestamp = timestamp

# 2. Standard Dictionary-Backed Model for Comparison
class StandardSensorReading:
    def __init__(self, sensor_id: str, temperature: float, humidity: float, timestamp: float):
        self.sensor_id = sensor_id
        self.temperature = round(temperature, 2)
        self.humidity = round(humidity, 2)
        self.timestamp = timestamp

# 3. Stream Aggregator Engine
class TelemetryStream:
    def __init__(self, sensor_name: str):
        self.sensor_name = sensor_name
        self.readings: list[SensorReading] = []

    def ingest_reading(self, temp: float, hum: float):
        record = SensorReading(
            sensor_id=self.sensor_name,
            temperature=temp,
            humidity=hum,
            timestamp=time.time()
        )
        self.readings.append(record)

    def calculate_metrics(self) -> dict:
        if not self.readings:
            return {"count": 0, "avg_temp": 0.0, "avg_hum": 0.0}
            
        temps = [r.temperature for r in self.readings]
        hums = [r.humidity for r in self.readings]
        
        return {
            "count": len(self.readings),
            "min_temp": min(temps),
            "max_temp": max(temps),
            "avg_temp": round(sum(temps) / len(temps), 2),
            "avg_hum": round(sum(hums) / len(hums), 2),
        }

if __name__ == "__main__":
    print("=" * 65)
    print("      HIGH-PERFORMANCE IOT TELEMETRY & MEMORY ENGINE")
    print("=" * 65)
    
    stream = TelemetryStream("IOT-HVAC-ZONE-04")
    
    # Ingest 10,000 Telemetry Packets
    print("📥 Streaming 10,000 live telemetry sensor readings...")
    for _ in range(10_000):
        t = random.uniform(18.0, 26.5)
        h = random.uniform(40.0, 65.0)
        stream.ingest_reading(t, h)
        
    metrics = stream.calculate_metrics()
    print("\n📊 TELEMETRY STREAM SUMMARY:")
    print(f"  Total Packets Ingested : {metrics['count']:,d}")
    print(f"  Temperature Range      : {metrics['min_temp']}°C to {metrics['max_temp']}°C")
    print(f"  Average Temperature    : {metrics['avg_temp']}°C")
    print(f"  Average Humidity       : {metrics['avg_hum']}%")
    
    # Memory Benchmark Comparison
    print("\n" + "-" * 65)
    print("🔬 MEMORY AUDIT: Standard Class vs Slotted Class (10,000 Objects)")
    print("-" * 65)
    
    slotted_sample = [SensorReading("S1", 22.0, 50.0, time.time()) for _ in range(10_000)]
    standard_sample = [StandardSensorReading("S1", 22.0, 50.0, time.time()) for _ in range(10_000)]
    
    # Calculate bytes
    slot_bytes = sum(sys.getsizeof(r) for r in slotted_sample)
    std_bytes = sum(sys.getsizeof(r) + sys.getsizeof(r.__dict__) for r in standard_sample)
    
    print(f"  Standard Instances Total RAM : {std_bytes / 1024:>8,.1f} KB")
    print(f"  Slotted Instances Total RAM  : {slot_bytes / 1024:>8,.1f} KB")
    print(f"  🚀 Net RAM Saved             : {(1 - slot_bytes / std_bytes) * 100:.1f}%")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's constructor mechanics and attribute model:
- **`__new__(cls)`** is the true allocator responsible for creating the object in memory.
- **`__init__(self)`** is the initializer responsible for setting instance attributes and must return `None`.
- **Class Attributes** are shared across all instances; **Instance Attributes** belong solely to individual instances.
- Re-binding an attribute on an instance creates a local shadow copy in `instance.__dict__`.
- Never put **mutable collections** (`list`, `dict`) as class attributes unless you explicitly intend to share state across all instances.
- Use **`__slots__`** to eliminate `__dict__`, reducing RAM consumption by **~65%** and speeding up attribute lookups.

---

## Best Practices Checklist

- [ ] Initialize all instance attributes explicitly inside `__init__`.
- [ ] Ensure `__init__` returns `None`.
- [ ] Never declare mutable data structures (`[]`, `{}`) as class attributes.
- [ ] Use `__slots__` for data models instantiated in large volumes (millions of objects).
- [ ] Use `__new__` when implementing Singletons or subclassing immutable types (`str`, `tuple`).

---

## What's Next?

Now that you understand constructor lifecycles and attributes, continue to:
👉 **[Encapsulation & Properties](encapsulation-and-properties.md)** to master data hiding, access modifiers, name mangling, and `@property` getters and setters.
