# Classes & Objects in Python

## Introduction

In computer science, software architecture paradigms dictate how developers organize logic and data. In procedural programming, programs are structured around linear functions operating on passive data structures (like dictionaries and tuples). While effective for small utilities, procedural systems often suffer from state fragmentation, naming collisions, and tight coupling as codebases scale to hundreds of thousands of lines.

**Object-Oriented Programming (OOP)** solves this by modeling software around cohesive **Entities** known as **Objects**. An object encapsulates both **State (Attributes)** and **Behavior (Methods)** into a unified, self-contained unit.

In Python, the fundamental motto is: **"Everything is an Object."** Integers, strings, lists, functions, and even modules are first-class runtime objects instantiated from their respective classes.

A **Class** serves as a blueprint or template that defines the structure, attributes, and behaviors of a domain entity, while an **Object (or Instance)** is a concrete realization of that blueprint residing in runtime memory.

This lesson opens **Module 1: Object-Oriented Programming (OOP) in Depth**, establishing the mechanics of class definition, instantiation, method binding, and the indispensable **`self`** parameter.

---

## Prerequisites

Before studying classes and objects, ensure you have:

- Completed all Level 1 modules, specifically [Functions & Scope](../../beginner/functions/defining-functions.md).
- Mastered [Dictionaries & Hash Tables](../../beginner/collections/dictionaries.md).
- A solid understanding of variable references and memory mutability.

---

## Core Concept: Blueprint vs Instance

```
                               CLASS BLUEPRINT vs CONCRETE INSTANCES

       ┌──────────────────────────────────────┐
       │             class Server             │  <--- CLASS BLUEPRINT (Type Object in Memory)
       │  Attributes: hostname, ip, status    │
       │  Methods   : start(), stop(), ping() │
       └──────────────────┬───────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │ Instantiation: s = Server()   │
          ▼                               ▼
   ┌──────────────────────────┐    ┌──────────────────────────┐
   │    Instance: server_a    │    │    Instance: server_b    │  <--- CONCRETE OBJECTS (In Heap RAM)
   │  hostname: "srv-prod-01" │    │  hostname: "srv-prod-02" │
   │  ip      : "10.0.1.10"   │    │  ip      : "10.0.1.11"   │
   │  status  : "ONLINE"      │    │  status  : "OFFLINE"     │
   └──────────────────────────┘    └──────────────────────────┘
```

---

## Syntax & Essential Class Patterns

```python
# 1. Defining a Class with Attributes and Methods
class ServerNode:
    """Represents a physical or virtual compute server in a cluster."""

    def __init__(self, hostname: str, ip_address: str):
        # Instance Attributes (Unique to each instance)
        self.hostname = hostname
        self.ip_address = ip_address
        self.is_active = False

    def start(self):
        """Instance Method modifying instance state."""
        self.is_active = True
        print(f"🚀 Server '{self.hostname}' ({self.ip_address}) is now ONLINE.")

    def stop(self):
        self.is_active = False
        print(f"🛑 Server '{self.hostname}' is now OFFLINE.")

    def get_status(self) -> str:
        return "ONLINE" if self.is_active else "OFFLINE"

# 2. Instantiation (Creating concrete objects)
node1 = ServerNode("srv-us-east-1", "192.168.1.10")
node2 = ServerNode("srv-eu-west-1", "192.168.2.20")

# 3. Invoking Methods
node1.start()
print(f"Node 1 Status: {node1.get_status()}") # ONLINE
print(f"Node 2 Status: {node2.get_status()}") # OFFLINE
```

---

## Detailed Explanation

### 1. The Mandatory `self` Parameter: Explicit Receiver

Unlike languages such as C++, Java, or JavaScript where the active instance is referenced via an implicit keyword (`this`), Python mandates that every instance method declare **`self`** explicitly as its first positional parameter.

#### What is `self`?
`self` is simply a reference to the **specific instance object** upon which the method is being called.

#### How Method Invocation Actually Works Under the Hood:
When you invoke a method using dot notation on an instance:

```python
node1.start()
```

Python’s bytecode compiler automatically translates that call into an unbound class function invocation, passing the instance as the first argument:

```python
ServerNode.start(node1)  # EXACTLY EQUIVALENT to node1.start()!
```

If you omit `self` in the method signature (`def start():`), Python will pass `node1` anyway upon invocation, causing a crash:
`TypeError: ServerNode.start() takes 0 positional arguments but 1 was given`.

---

### 2. The Descriptor Protocol & Method Binding

Why does `node1.start()` work without manually passing `node1`?

In Python, functions defined inside a class body are standard functions. When accessed through an instance (`node1.start`), Python invokes the function's internal **Descriptor Protocol (`__get__`)**, which dynamically constructs a **`MethodType` (Bound Method)** object pairing the function with the instance:

```python
# Unbound Function on Class:
print(ServerNode.start)
# Output: <function ServerNode.start at 0x102...>

# Bound Method on Instance:
print(node1.start)
# Output: <bound method ServerNode.start of <__main__.ServerNode object at 0x103...>>
```

A Bound Method is a lightweight wrapper that stores `(instance, function)` and automatically feeds `instance` as `self` when invoked with parentheses `()`.

---

### 3. Namespaces: Class `__dict__` vs Instance `__dict__`

Every Python object and class maintains an internal namespace dictionary accessible via **`__dict__`**:

- **`Class.__dict__`**: Contains all method functions, class attributes, docstrings, and class metadata.
- **`instance.__dict__`**: Contains only the specific instance's attributes.

```python
node = ServerNode("web-01", "10.0.0.1")

print("Instance Dict :", node.__dict__)
# Output: {'hostname': 'web-01', 'ip_address': '10.0.0.1', 'is_active': False}

print("Class Methods :", [k for k in ServerNode.__dict__ if not k.startswith("__")])
# Output: ['start', 'stop', 'get_status']
```

When you request `node.start`, Python first searches `node.__dict__`. If not found, it traverses upward to `ServerNode.__dict__`, finding the `start` method.

---

## Examples

### 1. Simple: Book Catalog Entity
Defining a basic class representing a physical library book with checkout state.

```python
class Book:
    def __init__(self, title: str, author: str, isbn: str):
        self.title = title
        self.author = author
        self.isbn = isbn
        self.is_checked_out = False

    def borrow(self, borrower_name: str) -> bool:
        if self.is_checked_out:
            print(f"❌ '{self.title}' is already checked out.")
            return False
        self.is_checked_out = True
        print(f"📖 '{self.title}' successfully borrowed by {borrower_name}.")
        return True

    def return_book(self):
        self.is_checked_out = False
        print(f"📥 '{self.title}' has been returned to the catalog.")

book = Book("Fluent Python", "Luciano Ramalho", "978-1491946008")
book.borrow("Hesam")
book.borrow("Sarah")  # Rejected! Already checked out.
book.return_book()
```

### 2. Beginner: Bank Account with Transaction Auditing
Managing internal state and keeping an append-only audit trail of financial mutations.

```python
class BankAccount:
    def __init__(self, account_id: str, initial_deposit: float = 0.0):
        if initial_deposit < 0:
            raise ValueError("Initial deposit cannot be negative.")
        self.account_id = account_id
        self.balance = initial_deposit
        self.statement_log = [f"Account opened with initial balance: ${initial_deposit:.2f}"]

    def deposit(self, amount: float):
        if amount <= 0:
            raise ValueError("Deposit amount must be strictly positive.")
        self.balance += amount
        self.statement_log.append(f"DEPOSIT: +${amount:.2f} | New Balance: ${self.balance:.2f}")
        print(f"💵 Deposited ${amount:.2f}. Balance: ${self.balance:.2f}")

    def withdraw(self, amount: float):
        if amount <= 0:
            raise ValueError("Withdrawal amount must be strictly positive.")
        if amount > self.balance:
            raise ValueError(f"Insufficient funds. Requested ${amount:.2f}, available ${self.balance:.2f}")
        self.balance -= amount
        self.statement_log.append(f"WITHDRAWAL: -${amount:.2f} | New Balance: ${self.balance:.2f}")
        print(f"🏧 Withdrew ${amount:.2f}. Balance: ${self.balance:.2f}")

account = BankAccount("ACC-9001", initial_deposit=500.00)
account.deposit(250.00)
account.withdraw(100.00)
```

### 3. Intermediate: Polymorphic Notification Dispatcher
Designing a clean object-oriented messaging pipeline.

```python
class EmailNotifier:
    def __init__(self, sender_email: str):
        self.sender = sender_email

    def send(self, recipient: str, message: str):
        print(f"📧 [EMAIL via {self.sender}] -> To: {recipient} | Body: '{message}'")

class SMSNotifier:
    def __init__(self, provider_gateway: str):
        self.gateway = provider_gateway

    def send(self, recipient: str, message: str):
        print(f"📱 [SMS via {self.gateway}] -> To: {recipient} | Body: '{message}'")

def broadcast_emergency_alert(notifiers: list, recipient: str, alert_msg: str):
    """Polymorphic dispatcher: Treats all notifier instances uniformly!"""
    for n in notifiers:
        n.send(recipient, alert_msg)

channels = [
    EmailNotifier("alerts@domain.com"),
    SMSNotifier("Twilio-East-01")
]
broadcast_emergency_alert(channels, "hesam@domain.com", "Server cluster load at 98%!")
```

### 4. Real-World: Database Connection Pool Management Class
Simulating an enterprise connection pool that manages active client leases.

```python
class DatabaseConnectionPool:
    def __init__(self, database_url: str, max_connections: int = 3):
        self.db_url = database_url
        self.max_connections = max_connections
        self.active_leases = set()
        self._connection_counter = 0

    def acquire_connection(self, client_id: str) -> str:
        if len(self.active_leases) >= self.max_connections:
            raise RuntimeError(f"Connection pool exhausted (Max: {self.max_connections}). Please wait.")
            
        self._connection_counter += 1
        conn_token = f"CONN_{self._connection_counter}_{client_id}"
        self.active_leases.add(conn_token)
        print(f"🔌 [LEASE ACQUIRED] Client '{client_id}' acquired {conn_token} (Active: {len(self.active_leases)}/{self.max_connections})")
        return conn_token

    def release_connection(self, conn_token: str):
        if conn_token in self.active_leases:
            self.active_leases.remove(conn_token)
            print(f"⚡ [LEASE RELEASED] {conn_token} returned to pool (Active: {len(self.active_leases)}/{self.max_connections})")
        else:
            print(f"⚠️ Warning: Token {conn_token} was not found in active leases.")

pool = DatabaseConnectionPool("postgres://cluster.internal:5432/prod_db", max_connections=2)
token1 = pool.acquire_connection("Worker-01")
token2 = pool.acquire_connection("Worker-02")

# Next acquire will raise error (pool exhausted)
try:
    pool.acquire_connection("Worker-03")
except RuntimeError as err:
    print(f"❌ {err}")

pool.release_connection(token1)
token3 = pool.acquire_connection("Worker-03") # Now succeeds!
```

### 5. Advanced: Dynamic Method Extraction & Binding via `types.MethodType`
Inspecting how functions can be dynamically attached and bound to specific instances at runtime.

```python
import types

class GenericDevice:
    def __init__(self, device_id: str):
        self.id = device_id

# Standalone function outside any class
def reboot_routine(self):
    print(f"🔄 Rebooting hardware controller for device: '{self.id}'")

dev1 = GenericDevice("IOT-SENSOR-99")

# Dynamically bind function to dev1 instance using MethodType
dev1.reboot = types.MethodType(reboot_routine, dev1)

# Now dev1 can invoke reboot() as a native bound method!
dev1.reboot()
print("Method Type:", type(dev1.reboot)) # <class 'method'>
```

---

## Code Explanation

In Example 4 (Database Connection Pool):
1. `DatabaseConnectionPool` encapsulates configuration parameters (`max_connections`, `db_url`) alongside mutable runtime state (`self.active_leases`).
2. `self.active_leases = set()` enforces uniqueness and provides instantaneous $O(1)$ lease lookups and removals.
3. Method calls `acquire_connection` and `release_connection` guard class invariants, ensuring active leases never exceed `max_connections`.
4. Callers interact through clean, intuitive method invocations without needing to manually manage token indices.

---

## Common Mistakes

### Mistake 1: Forgetting `self` in Method Definitions
Defining `def my_method():` instead of `def my_method(self):` causes a `TypeError` when called on an instance.

### Mistake 2: Invoking Methods Without Parentheses
Writing `result = obj.get_status` instead of `result = obj.get_status()` binds the method object itself rather than calling it, leaving `result` as a `<bound method>` reference.

---

## Best Practices

### Follow PEP 8 Casing Conventions
Always name classes using **PascalCase (CapWords)** and methods/attributes using **snake_case**.

Good:
```python
class PaymentProcessor:
    def process_transaction(self, card_token: str):
        pass
```

Avoid:
```python
class payment_processor: # Non-standard class name ❌
    def ProcessTransaction(self, CardToken): # Non-standard method name ❌
        pass
```

---

## Performance Considerations

1. **Instance Dictionary Memory Overhead**: By default, each Python object allocates an internal `__dict__` hash table consuming ~150 to 200 bytes. For systems instantiating millions of small objects, using `__slots__` (covered in the next lesson) eliminates `__dict__` and reduces memory consumption by **60% to 70%**.
2. **Method Resolution Overhead**: Method lookups traverse from instance `__dict__` to class `__dict__` in ~$50\text{ nanoseconds}$. CPython caches method lookups in internal type caches (MRO cache).

---

## Security Considerations

1. **Dynamically Mutating Class Attributes**: Because Python classes are mutable objects, assigning `ServerNode.start = malicious_func` alters behavior for **all existing and future instances**. Avoid modifying class dictionaries dynamically in untrusted runtime environments.
2. **Attribute Inspection**: Use `getattr(obj, name, default)` safely when reading dynamic attributes based on user input.

---

## Real-World Usage

- **Django Models (`models.Model`)**: Encapsulating database rows as Python class instances.
- **PyTorch Neural Networks (`torch.nn.Module`)**: Modeling deep learning layers and forward execution passes.
- **FastAPI Applications (`FastAPI()`)**: Representing web applications, route routers, and dependency containers.

---

## Comparison: Programming Paradigms

| Paradigm | Primary Abstraction | State Management | Code Organization | Best Fit |
|---|---|---|---|---|
| **Procedural** | Functions (`def`) | Global / Passed Dictionaries | Linear sequence of steps | Small scripts, batch pipelines |
| **Object-Oriented (OOP)** | **Classes & Objects** | **Encapsulated in Instances** | **Domain Entities & Methods**| **Complex systems, APIs, GUI, Games** |
| **Functional (FP)** | Pure Functions | Immutable Values | Function composition & pipelines | Data transformations, stream analytics |

---

## Advanced Concepts: Metaclass Foundations (`type` of `type`)

In Python, classes are themselves first-class objects instantiated by the default metaclass **`type`**:

```python
class Microservice: pass

print(type(Microservice))         # <class 'type'>
print(isinstance(Microservice, object)) # True (Classes are objects!)
```

You can even dynamically create a class at runtime by invoking `type(name, bases, dict)`:

```python
DynamicUser = type("DynamicUser", (), {"role": "ADMIN", "say_hi": lambda self: "Hello!"})
u = DynamicUser()
print(u.role)      # "ADMIN"
print(u.say_hi())  # "Hello!"
```

---

## Exercises

### Exercise 1 — Beginner
Create a class `Rectangle` with attributes `width` and `height`. Implement methods `area() -> float` and `perimeter() -> float`. Instantiate two rectangles and compare their calculated areas.

### Exercise 2 — Intermediate
Build a `ShoppingCart` class. Support methods `add_item(name, price, qty=1)`, `remove_item(name)`, `get_subtotal() -> float`, and `apply_discount(pct: float)`. Ensure quantities and prices cannot be negative.

### Exercise 3 — Advanced
Build a `StateMachine` class modeling an Order lifecycle (`PENDING` $\rightarrow$ `PAID` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`). Define transition methods (`mark_paid()`, `mark_shipped()`) that raise `InvalidStateTransitionError` if an illegal transition is attempted (e.g. trying to ship an unpaid order).

---

## Mini Project: Enterprise Vehicle Fleet Telemetry & Maintenance System

### Requirements
Build an object-oriented vehicle telemetry tracker named `fleet_manager.py`. Define a `FleetVehicle` class that tracks odometer mileage, fuel efficiency, service interval thresholds, and logs maintenance records.

### Implementation Blueprint
```python
from datetime import datetime, timezone

class MaintenanceDueError(Exception): pass

class FleetVehicle:
    SERVICE_INTERVAL_KM = 10_000.0  # Service required every 10,000 km

    def __init__(self, vin: str, make: str, model: str, year: int, current_odometer: float = 0.0):
        self.vin = vin
        self.make = make
        self.model = model
        self.year = year
        self.odometer_km = current_odometer
        self.last_service_odometer_km = current_odometer
        self.maintenance_logs = []
        self.is_grounded = False

    def record_trip(self, distance_km: float):
        if self.is_grounded:
            raise MaintenanceDueError(f"Vehicle '{self.vin}' is GROUNDED! Maintenance required before next dispatch.")
        if distance_km <= 0:
            raise ValueError("Trip distance must be positive.")

        self.odometer_km += distance_km
        print(f"🛣️ Trip logged for {self.make} {self.model}: +{distance_km:,.1f} km (Odometer: {self.odometer_km:,.1f} km)")

        # Check Service Invariant
        km_since_last_service = self.odometer_km - self.last_service_odometer_km
        if km_since_last_service >= self.SERVICE_INTERVAL_KM:
            self.is_grounded = True
            print(f"🚨 [ALERT] Vehicle '{self.vin}' has exceeded 10,000 km service threshold! GROUNDED.")

    def perform_maintenance(self, service_description: str, technician: str):
        self.last_service_odometer_km = self.odometer_km
        self.is_grounded = False
        
        log_entry = {
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "odometer": self.odometer_km,
            "description": service_description,
            "technician": technician
        }
        self.maintenance_logs.append(log_entry)
        print(f"🔧 Maintenance certified for {self.vin} by Tech {technician}. Vehicle returned to active service.")

    def print_telemetry_card(self):
        km_since_service = self.odometer_km - self.last_service_odometer_km
        status = "🛑 GROUNDED" if self.is_grounded else "🟢 ACTIVE"
        print("\n" + "=" * 55)
        print(f"       FLEET TELEMETRY: {self.year} {self.make} {self.model}")
        print("=" * 55)
        print(f"  VIN               : {self.vin}")
        print(f"  Total Odometer    : {self.odometer_km:>10, .1f} km")
        print(f"  Since Last Service: {km_since_service:>10, .1f} km / 10,000 km")
        print(f"  Fleet Status      : {status}")
        print(f"  Total Services    : {len(self.maintenance_logs)}")
        print("=" * 55)

if __name__ == "__main__":
    truck = FleetVehicle("1HGCR2F83HA001", "Volvo", "VNL 860", 2023, current_odometer=45_000.0)
    
    # 1. Inspect Initial State
    truck.print_telemetry_card()
    
    # 2. Log Regular Trips
    truck.record_trip(4_500.0)
    truck.record_trip(5_600.0)  # Total 10,100 km -> Triggers Grounding!
    
    # 3. Attempting another trip raises MaintenanceDueError
    try:
        truck.record_trip(100.0)
    except MaintenanceDueError as err:
        print(f"\n❌ [DISPATCH BLOCKED] {err}")
        
    # 4. Perform Certified Maintenance
    print("\n--- Sending Vehicle to Maintenance Bay ---")
    truck.perform_maintenance("10k km Full Engine & Brake Inspection", technician="Hesam P.")
    
    # 5. Verify Vehicle is Unblocked
    truck.record_trip(250.0)
    truck.print_telemetry_card()
```

---

## Summary

In this lesson, you mastered Python's object-oriented foundations:
- A **Class** is a blueprint defining structure and behavior; an **Object (Instance)** is a concrete instance in memory.
- The **`self`** parameter is the explicit instance receiver passed automatically by Python's descriptor protocol.
- Method calls `node.start()` translate to `ServerNode.start(node)`.
- Namespaces are stored in **`__dict__`** (Instance attributes live on the instance; methods live on the class).
- Classes provide encapsulation, state guarding, and domain entity modeling.

---

## Best Practices Checklist

- [ ] Use PascalCase for Class names and snake_case for methods and attributes.
- [ ] Always declare `self` as the first parameter in instance methods.
- [ ] Initialize all instance attributes inside `__init__`.
- [ ] Guard class invariants with explicit domain validation checks.
- [ ] Use `isinstance(obj, Class)` rather than `type(obj) == Class` for type checking.

---

## What's Next?

Now that you understand classes and method binding, continue to:
👉 **[Constructors & Instance Attributes](constructors-and-attributes.md)** to master the dual-stage lifecycle (`__new__` vs `__init__`), class vs instance attributes, and memory optimization with `__slots__`.
