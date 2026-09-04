# Abstract Base Classes (ABCs) in Python

## Introduction

In enterprise software engineering, robust system architecture depends on establishing strict **Interface Contracts**. When designing plugin systems, data access layers, or third-party SDK adapters, a software architect must guarantee that any concrete implementation provides a specific set of methods, signatures, and properties.

In dynamically typed languages like Python, developers historically attempted to enforce interfaces by raising `NotImplementedError` inside base class methods:

```python
# The Fragile Informal Interface Pattern:
class DatabaseAdapter:
    def connect(self):
        raise NotImplementedError("Subclasses must implement connect().")
```

The critical flaw of this approach is that it **fails late at runtime**. If a developer forgets to implement `connect()`, the application instantiates the object without issue and only crashes hours later when a production user executes the specific code path that calls `connect()`.

Python solves this definitively through **Abstract Base Classes (ABCs)** via the standard library **`abc`** module (PEP 3119).

By subclassing **`abc.ABC`** and decorating required methods with **`@abstractmethod`**, Python enforces interface contracts **at instantiation time**. If a subclass fails to implement even a single abstract method or property, Python immediately prevents instantiation with a `TypeError`, guaranteeing architectural integrity before code ever executes.

This lesson explores the `abc` module, `@abstractmethod`, abstract properties, virtual subclass registration via `.register()`, and dynamic structural subtyping with `__subclasshook__`.

---

## Prerequisites

Before studying ABCs, ensure you have:

- Completed [Inheritance, Polymorphism & MRO](inheritance-and-polymorphism.md).
- Completed [Encapsulation & Properties](encapsulation-and-properties.md).
- Familiarity with Python decorators and metaclasses.

---

## Core Concept: Instantiation-Time Interface Enforcement

```
                              ABSTRACT BASE CLASS (ABC) ENFORCEMENT

         ┌──────────────────────────────────────┐
         │          class BaseRepository        │  <--- ABSTRACT BASE CLASS (inherits from ABC)
         │  @abstractmethod: get_by_id(id)      │
         │  @abstractmethod: save(entity)       │
         └──────────────────┬───────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   ┌──────────────────────────┐    ┌──────────────────────────┐
   │    PostgresRepository    │    │     BrokenRepository     │
   │  • Implements get_by_id  │    │  • Implements get_by_id  │
   │  • Implements save       │    │  • MISSING save()!       │
   └────────────┬─────────────┘    └────────────┬─────────────┘
                │                               │
                ▼                               ▼
       [ Instantiation OK ]            [ INSTANTIATION BLOCKED! ]
       repo = PostgresRepository()     TypeError: Can't instantiate abstract class
                                       BrokenRepository with abstract method 'save'
```

---

## Syntax & Essential ABC Patterns

```python
from abc import ABC, abstractmethod

# 1. Defining an Abstract Base Class
class CloudStorageProvider(ABC):
    """Abstract Interface Contract for all Cloud Storage Adapters."""

    # Abstract Property
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the cloud provider."""
        pass

    # Abstract Methods
    @abstractmethod
    def upload_file(self, local_path: str, remote_destination: str) -> bool:
        """Upload a file to remote bucket storage."""
        pass

    @abstractmethod
    def delete_file(self, remote_destination: str) -> bool:
        """Delete a file from remote storage."""
        pass

    # Concrete Method (Shared implementation across all subclasses!)
    def ping(self) -> bool:
        print(f"🏓 Pinging {self.provider_name} gateway...")
        return True

# 2. Concrete Implementation (Must implement ALL abstract members)
class S3StorageProvider(CloudStorageProvider):
    @property
    def provider_name(self) -> str:
        return "Amazon Web Services S3"

    def upload_file(self, local_path: str, remote_destination: str) -> bool:
        print(f"☁️ [S3 UPLOAD] {local_path} -> s3://bucket/{remote_destination}")
        return True

    def delete_file(self, remote_destination: str) -> bool:
        print(f"🗑️ [S3 DELETE] Deleted s3://bucket/{remote_destination}")
        return True

# Instantiate concrete provider
storage = S3StorageProvider()
storage.ping()
storage.upload_file("data.csv", "reports/data.csv")
```

---

## Detailed Explanation

### 1. The Decorator Stacking Rule for Properties & Class Methods

When combining `@abstractmethod` with other built-in decorators (like `@property`, `@classmethod`, or `@staticmethod`), **`@abstractmethod` must always be placed at the innermost layer** (closest to the `def` statement):

```python
# ✅ CORRECT DECORATOR ORDER:
class BaseService(ABC):
    @property
    @abstractmethod
    def service_id(self) -> str:
        """Abstract Property: @property on top, @abstractmethod on bottom."""
        pass

    @classmethod
    @abstractmethod
    def create_default(cls):
        """Abstract Class Method: @classmethod on top, @abstractmethod on bottom."""
        pass

# 🚨 WRONG ORDER (Causes Syntax/Runtime Errors):
# @abstractmethod
# @property
# def broken_property(self): pass  # WRONG! ❌
```

---

### 2. Abstract Methods Can Provide Default Implementations!

A common misconception is that abstract methods cannot contain code. In Python, an `@abstractmethod` can provide a **reusable baseline implementation** that concrete subclasses invoke via `super()`:

```python
class BaseDataExporter(ABC):
    @abstractmethod
    def export(self, records: list[dict]) -> str:
        # Common pre-processing logic for all exporters!
        if not records:
            raise ValueError("Cannot export empty record dataset.")
        print(f"📦 [BASE EXPORTER] Validated {len(records)} records for export.")
        return ""

class JSONDataExporter(BaseDataExporter):
    import json

    def export(self, records: list[dict]) -> str:
        super().export(records)  # Invoke baseline validation logic!
        return self.json.dumps(records, indent=2)
```

---

### 3. Virtual Subclasses via `.register()`

Python allows a class to be recognized as a subclass of an ABC **without explicitly inheriting from it** using **Virtual Subclass Registration (`ABC.register(Class)`)**:

```python
from abc import ABC, abstractmethod

class Serializer(ABC):
    @abstractmethod
    def serialize(self) -> str: pass

# Standalone Third-Party Class (No direct inheritance from Serializer)
class ThirdPartyXMLParser:
    def serialize(self) -> str:
        return "<xml>payload</xml>"

# Register as Virtual Subclass:
Serializer.register(ThirdPartyXMLParser)

parser = ThirdPartyXMLParser()
print("Isinstance of Serializer? :", isinstance(parser, Serializer)) # True! ✅
print("Issubclass of Serializer? :", issubclass(ThirdPartyXMLParser, Serializer)) # True! ✅
```

---

## Examples

### 1. Simple: Abstract Shape Interface
Creating a formal mathematical contract for geometric shapes.

```python
from abc import ABC, abstractmethod
import math

class Shape2D(ABC):
    @abstractmethod
    def compute_area(self) -> float:
        """Calculate surface area."""
        pass

    @abstractmethod
    def compute_perimeter(self) -> float:
        """Calculate perimeter boundary."""
        pass

class Circle(Shape2D):
    def __init__(self, radius: float):
        self.radius = radius

    def compute_area(self) -> float:
        return math.pi * (self.radius ** 2)

    def compute_perimeter(self) -> float:
        return 2 * math.pi * self.radius

c = Circle(4.0)
print(f"Circle Area: {c.compute_area():.2f} | Perimeter: {c.compute_perimeter():.2f}")
```

### 2. Beginner: Abstract Database Repository Layer
Standardizing data access operations across different database engines.

```python
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    def find_by_id(self, user_id: int) -> dict | None: pass

    @abstractmethod
    def save_user(self, user_id: int, username: str) -> bool: pass

    @abstractmethod
    def delete_user(self, user_id: int) -> bool: pass

class InMemoryUserRepository(UserRepository):
    def __init__(self):
        self._db = {}

    def find_by_id(self, user_id: int) -> dict | None:
        return self._db.get(user_id)

    def save_user(self, user_id: int, username: str) -> bool:
        self._db[user_id] = {"id": user_id, "username": username}
        return True

    def delete_user(self, user_id: int) -> bool:
        return self._db.pop(user_id, None) is not None

repo = InMemoryUserRepository()
repo.save_user(101, "Hesam")
print("Retrieved User:", repo.find_by_id(101))
```

### 3. Intermediate: Abstract Payment Gateway with Abstract Properties
Enforcing required attributes and validation methods on payment adapters.

```python
from abc import ABC, abstractmethod

class PaymentGateway(ABC):
    @property
    @abstractmethod
    def gateway_code(self) -> str:
        """Unique uppercase gateway identifier."""
        pass

    @property
    @abstractmethod
    def base_fee_percent(self) -> float:
        """Standard processing fee percentage."""
        pass

    @abstractmethod
    def charge(self, amount: float, customer_token: str) -> dict:
        """Execute payment transaction."""
        pass

class StripeGateway(PaymentGateway):
    @property
    def gateway_code(self) -> str:
        return "STRIPE_US"

    @property
    def base_fee_percent(self) -> float:
        return 2.9

    def charge(self, amount: float, customer_token: str) -> dict:
        fee = round(amount * (self.base_fee_percent / 100.0), 2)
        return {"status": "SUCCESS", "gateway": self.gateway_code, "amount": amount, "fee": fee}

stripe = StripeGateway()
print("Stripe Charge Result:", stripe.charge(200.0, "tok_12345"))
```

### 4. Real-World: Multi-Cloud Object Storage Adapter Engine
Building a robust cloud infrastructure framework with S3 and Azure Blob adapters.

```python
from abc import ABC, abstractmethod
from pathlib import Path

class ObjectStorageClient(ABC):
    def __init__(self, bucket_name: str):
        self.bucket = bucket_name

    @abstractmethod
    def write_blob(self, key: str, payload_bytes: bytes) -> str:
        """Write raw bytes to object storage and return unique URI."""
        pass

    @abstractmethod
    def read_blob(self, key: str) -> bytes:
        """Retrieve raw bytes from object storage."""
        pass

class LocalDiskStorageClient(ObjectStorageClient):
    def __init__(self, bucket_name: str, root_dir: Path = Path("local_cloud_storage")):
        super().__init__(bucket_name)
        self.root = root_dir / bucket_name
        self.root.mkdir(parents=True, exist_ok=True)

    def write_blob(self, key: str, payload_bytes: bytes) -> str:
        target_path = self.root / key
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(payload_bytes)
        return f"file://{target_path.resolve()}"

    def read_blob(self, key: str) -> bytes:
        target_path = self.root / key
        if not target_path.exists():
            raise FileNotFoundError(f"Blob '{key}' not found in bucket '{self.bucket}'.")
        return target_path.read_bytes()

client = LocalDiskStorageClient("customer-invoices")
uri = client.write_blob("2024/Q2/inv_01.txt", b"INVOICE DATA: $1500.00")
print(f"✅ Blob Written: {uri}")
print("📖 Read Back  :", client.read_blob("2024/Q2/inv_01.txt").decode("utf-8"))
```

### 5. Advanced: Dynamic Structural Subtyping with `__subclasshook__`
Enforcing automatic duck-typing verification so that any class implementing a `.stream_data()` method is dynamically recognized as a `StreamableSource` without explicit inheritance.

```python
from abc import ABC, abstractmethod

class StreamableSource(ABC):
    @abstractmethod
    def stream_data(self) -> list[str]: pass

    @classmethod
    def __subclasshook__(cls, subclass):
        """Dynamic structural subtyping check."""
        if cls is StreamableSource:
            # Check if 'stream_data' exists and is callable on the candidate subclass
            if any("stream_data" in B.__dict__ for B in subclass.__mro__):
                return True
        return NotImplemented

# Class defined with NO inheritance from StreamableSource:
class KafkaEventFeed:
    def stream_data(self) -> list[str]:
        return ["event_1", "event_2", "event_3"]

# Verified dynamically by __subclasshook__!
feed = KafkaEventFeed()
print("Is KafkaEventFeed a StreamableSource? :", isinstance(feed, StreamableSource)) # True! 🚀
print("Is KafkaEventFeed subclass of ABC?    :", issubclass(KafkaEventFeed, StreamableSource)) # True! 🚀
```

---

## Code Explanation

In Example 5 (`__subclasshook__`):
1. `StreamableSource` defines `__subclasshook__`, a special class method invoked during `isinstance()` and `issubclass()` checks.
2. It inspects the MRO of the candidate class (`KafkaEventFeed`) to verify whether `"stream_data"` is defined.
3. Because `KafkaEventFeed` implements `stream_data()`, Python dynamically recognizes it as an instance of `StreamableSource` **without requiring explicit subclassing**.
4. This is the exact mechanism standard library ABCs like `collections.abc.Iterable` use to check for `__iter__`.

---

## Common Mistakes

### Mistake 1: Attempting to Instantiate an ABC Directly
Instantiating a class containing unimplemented abstract methods raises an immediate `TypeError`.

### Mistake 2: Wrong Decorator Stacking Order
Placing `@abstractmethod` above `@property` instead of below it breaks property resolution. Always place `@abstractmethod` innermost.

---

## Best Practices

### Use ABCs to Define Architectural Boundaries
Use ABCs for interfaces shared across multiple implementations (e.g. database adapters, message queues, notification services).

Good:
```python
class MessageQueue(ABC):
    @abstractmethod
    def publish(self, topic: str, message: dict): pass
```

---

## Performance Considerations

1. **Instantiation Verification Overhead**: Checking that all abstract methods are implemented occurs once during `__new__` when an instance is instantiated (~1 microsecond).
2. **Zero Overhead on Method Calls**: Once instantiated, method invocations on concrete subclasses execute at full native C speed with zero ABC overhead.

---

## Security Considerations

1. **Plugin Interface Integrity**: When loading dynamic plugins at runtime, verify that plugins subclass the required ABC (`isinstance(plugin, PluginABC)`) before executing untrusted routines.
2. **Preventing Partial State Invariants**: ABCs prevent developers from instantiating partially implemented objects that lack required security or encryption hooks.

---

## Real-World Usage

- **PyTorch Dataset ABC (`torch.utils.data.Dataset`)**: Enforcing `__len__()` and `__getitem__()`.
- **Standard Library `collections.abc`**: `Sequence`, `Mapping`, `MutableSet`, `Iterator`.
- **FastAPI / Starlette Base Authentication**: Subclassing `AuthenticationBackend` and implementing `authenticate(conn)`.

---

## Comparison: Interface Enforcement Mechanisms

| Feature | Informal Interface (`raise NotImplementedError`) | Abstract Base Class (`abc.ABC`) | Protocol (`typing.Protocol`) |
|---|---|---|---|
| **Enforcement Timing** | **Late (At method call time)** | **Early (At instantiation time)** | **Compile-Time (Static Type Check)** |
| **Inheritance Required?**| Yes | Yes (or via `.register()`) | **No (Pure Structural Duck Typing)** |
| **Instantiation Guard** | ❌ No | **✅ Yes (`TypeError`)** | ❌ No |
| **Runtime `isinstance`** | Yes | **Yes** | Yes (with `@runtime_checkable`) |
| **Primary Use Case** | Legacy scripts (<200 lines) | **Frameworks, Enterprise Adapters** | **Modern Static Typing & Libraries** |

---

## Advanced Concepts: Built-in `collections.abc` Hierarchy

Python's standard library provides a rich taxonomy of built-in ABCs in `collections.abc`:

```
                             STANDARD LIBRARY collections.abc HIERARCHY

                                        Iterable (__iter__)
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                       Iterator (__next__)          Collection (__len__, __contains__)
                                                             │
                              ┌──────────────────────────────┼──────────────────────────────┐
                              ▼                              ▼                              ▼
                     Sequence (__getitem__)           Mapping (__getitem__)          Set (__contains__)
                              │                              │                              │
                     MutableSequence               MutableMapping                 MutableSet
                     (list, bytearray)             (dict)                         (set)
```

Checking `isinstance(obj, collections.abc.Mapping)` verifies that `obj` behaves like a dictionary without requiring it to be an exact `dict`.

---

## Exercises

### Exercise 1 — Beginner
Create an ABC `DocumentConverter(ABC)` with an abstract method `convert(text: str) -> str`. Implement concrete subclasses `HTMLConverter` (wraps text in `<p>...</p>`) and `MarkdownConverter` (wraps text in `**...**`). Test instantiation.

### Exercise 2 — Intermediate
Build an ABC `CacheBackend(ABC)` with abstract methods `get(key: str) -> any`, `set(key: str, val: any, ttl_sec: int)`, and `delete(key: str) -> bool`. Implement an `InMemoryLRUCache` concrete subclass.

### Exercise 3 — Advanced
Build a `PluginInterface(ABC)` with an abstract property `version: str` and abstract method `execute_payload(data: dict) -> dict`. Implement a dynamic `PluginLoader` that scans a list of classes, filtering and instantiating only those that validly implement `PluginInterface`.

---

## Mini Project: Enterprise Distributed Message Queue & Worker Engine

### Requirements
Build a resilient message broker architecture named `message_queue_engine.py`. Define an abstract `MessageBroker(ABC)` interface and an abstract `QueueWorker(ABC)` interface. Implement concrete `InMemoryMessageBroker` and `EmailNotificationWorker` classes, enforcing strict contractual compliance at instantiation time.

### Implementation Blueprint
```python
from abc import ABC, abstractmethod
from datetime import datetime, timezone
import collections

# =====================================================================
# 1. ABSTRACT BROKER & WORKER INTERFACES
# =====================================================================

class MessageBroker(ABC):
    """Abstract Interface Contract for Distributed Message Queues."""

    @property
    @abstractmethod
    def broker_name(self) -> str:
        """Name of the messaging broker."""
        pass

    @abstractmethod
    def publish_message(self, topic: str, payload: dict) -> bool:
        """Publish a message payload to a designated topic queue."""
        pass

    @abstractmethod
    def consume_message(self, topic: str) -> dict | None:
        """Consume and dequeue the next available message on topic."""
        pass

class QueueWorker(ABC):
    """Abstract Interface for Topic Queue Consumer Daemons."""

    def __init__(self, broker: MessageBroker, topic: str):
        self.broker = broker
        self.topic = topic

    @abstractmethod
    def process_message(self, message: dict) -> bool:
        """Execute domain business processing on incoming message payload."""
        pass

    def run_worker_cycle(self) -> bool:
        """Concrete orchestration loop (Template Method Pattern)."""
        msg = self.broker.consume_message(self.topic)
        if msg is None:
            print(f"😴 [{self.__class__.__name__}] Queue '{self.topic}' is empty. Waiting...")
            return False
            
        print(f"⚙️ [{self.__class__.__name__}] Processing message #{msg.get('msg_id', 'N/A')} on '{self.topic}'...")
        success = self.process_message(msg)
        if success:
            print(f"✅ [{self.__class__.__name__}] Message processed successfully.")
        else:
            print(f"❌ [{self.__class__.__name__}] Message processing failed.")
        return success

# =====================================================================
# 2. CONCRETE BROKER IMPLEMENTATION
# =====================================================================

class InMemoryMessageBroker(MessageBroker):
    def __init__(self):
        self._queues = collections.defaultdict(collections.deque)
        self._msg_counter = 0

    @property
    def broker_name(self) -> str:
        return "InMemory_Cluster_Broker"

    def publish_message(self, topic: str, payload: dict) -> bool:
        self._msg_counter += 1
        wrapped_msg = {
            "msg_id": f"MSG-{self._msg_counter:04d}",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ"),
            "data": payload
        }
        self._queues[topic].append(wrapped_msg)
        print(f"📬 [BROKER] Published {wrapped_msg['msg_id']} to topic '{topic}'")
        return True

    def consume_message(self, topic: str) -> dict | None:
        if topic in self._queues and self._queues[topic]:
            return self._queues[topic].popleft()
        return None

# =====================================================================
# 3. CONCRETE WORKER IMPLEMENTATIONS
# =====================================================================

class EmailNotificationWorker(QueueWorker):
    def process_message(self, message: dict) -> bool:
        data = message.get("data", {})
        recipient = data.get("recipient", "unknown")
        subject = data.get("subject", "No Subject")
        print(f"  📧 Sending email to '{recipient}' | Subject: '{subject}'")
        return True

class FraudAuditWorker(QueueWorker):
    def process_message(self, message: dict) -> bool:
        data = message.get("data", {})
        amount = data.get("amount", 0.0)
        if amount > 5000.0:
            print(f"  🚨 [FRAUD ALERT] High-value transaction (${amount:,.2f}) flagged for review!")
        else:
            print(f"  🟢 [AUDIT PASS] Transaction (${amount:,.2f}) approved.")
        return True

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE MESSAGE BROKER & ABC WORKER ENGINE")
    print("=" * 65)
    
    broker = InMemoryMessageBroker()
    
    # Instantiate Concrete Workers
    email_worker = EmailNotificationWorker(broker, topic="notifications.email")
    fraud_worker = FraudAuditWorker(broker, topic="transactions.audit")
    
    # Publish Test Messages
    print("\n--- Publishing Messages ---")
    broker.publish_message("notifications.email", {"recipient": "hesam@domain.com", "subject": "Welcome to Python Mastery!"})
    broker.publish_message("transactions.audit", {"account": "ACC-991", "amount": 12500.00})
    broker.publish_message("transactions.audit", {"account": "ACC-442", "amount": 150.00})
    
    # Process Queues with Workers
    print("\n--- Running Worker Cycles ---")
    email_worker.run_worker_cycle()
    fraud_worker.run_worker_cycle()
    fraud_worker.run_worker_cycle()
    
    # Attempting to run on empty queue
    email_worker.run_worker_cycle()
    print("\n" + "=" * 65)
```

---

## Summary

In this lesson, you mastered Python's Abstract Base Classes:
- **ABCs enforce interface contracts at instantiation time** rather than call time, preventing incomplete subclasses from running in production.
- Subclass **`abc.ABC`** and mark required members with **`@abstractmethod`**.
- When creating abstract properties, place **`@abstractmethod` innermost** (`@property` on top).
- Abstract methods can contain reusable baseline logic accessible via `super()`.
- Use **`.register()`** to register third-party virtual subclasses without modifying their inheritance.
- Use **`__subclasshook__`** to enable runtime structural duck-typing for custom ABCs.

---

## Best Practices Checklist

- [ ] Inherit from `abc.ABC` and decorate all required contract methods with `@abstractmethod`.
- [ ] Place `@abstractmethod` as the innermost decorator on properties and class methods.
- [ ] Implement concrete shared logic in the ABC and invoke via `super()` in subclasses.
- [ ] Use `collections.abc` for type checking general collection behaviors (`Mapping`, `Sequence`).
- [ ] Check interfaces early at system startup rather than waiting for runtime invocation failures.

---

## What's Next?

Now that you understand Abstract Base Classes and interfaces, continue to:
👉 **[Magic & Dunder Methods](magic-methods-dunder.md)** to master Python's rich Data Model dunder protocol (`__repr__`, `__eq__`, `__len__`, `__getitem__`, `__call__`).
