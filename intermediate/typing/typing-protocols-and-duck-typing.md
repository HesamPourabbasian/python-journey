# Structural Subtyping with `typing.Protocol` in Python

## Introduction

In object-oriented programming, there are two primary paradigms for establishing type compatibility:

1. **Nominal Subtyping (Inheritance-Based)**: A class `Dog` is considered a subtype of `Animal` **only if** it explicitly declares inheritance (`class Dog(Animal):`). This is the mechanism used by standard Python classes and **Abstract Base Classes (ABCs)**.
2. **Structural Subtyping (Shape-Based / Duck Typing)**: A class `Dog` is considered a subtype of `Quacker` if it implements all the methods and attributes defined by `Quacker`, **regardless of its explicit inheritance lineage**. ("If it walks like a duck and quacks like a duck, it's a duck.")

Python has always embraced dynamic duck typing at runtime. However, prior to Python 3.8, static type checkers (like `mypy`) could only verify nominal subtyping via ABCs. If you wrote a function expecting an ABC, you could not pass a third-party class unless that third-party library explicitly inherited from your ABC!

Introduced in **Python 3.8** via **PEP 544**, **`typing.Protocol`** brings **Static Duck Typing (Structural Subtyping)** to Python.

Protocols allow you to define compile-time interface contracts that any class can satisfy implicitly without direct subclassing, enabling loose coupling, clean architectural boundaries, and seamless third-party library integration.

This lesson explores `typing.Protocol`, method contracts, protocol properties, runtime verification with **`@runtime_checkable`**, and the **Interface Segregation Principle**.

---

## Prerequisites

Before studying Protocols, ensure you have:

- Completed [Abstract Base Classes (ABCs)](../oop/abstract-base-classes.md).
- Completed [Type Hints & Modern Syntax](type-hints-basics.md) and [Generics & TypeVar](generics-and-typevar.md).
- Familiarity with object-oriented interfaces.

---

## Core Concept: Nominal Subtyping vs Structural Subtyping

```
                      NOMINAL SUBTYPING (ABC) vs STRUCTURAL SUBTYPING (Protocol)

       NOMINAL (abc.ABC)                                  STRUCTURAL (typing.Protocol)
   ┌─────────────────────────────┐                    ┌─────────────────────────────┐
   │ class Renderable(ABC):      │                    │ class Renderable(Protocol): │
   │     @abstractmethod         │                    │     def render(self) -> str:│
   │     def render(self) -> str:│                    │         ...                 │
   └──────────────┬──────────────┘                    └─────────────────────────────┘
                  │ Explicit Inheritance Required!                   ▲
                  ▼                                                  │ Matches shape implicitly!
   ┌─────────────────────────────┐                    ┌──────────────┴──────────────┐
   │ class Button(Renderable):   │                    │ class ThirdPartyWidget:     │
   │     def render(self) -> str:│                    │     def render(self) -> str:│
   │         return "<btn>"      │                    │         return "<widget>"   │
   └─────────────────────────────┘                    └─────────────────────────────┘
   Requires modifying class definition!               NO inheritance needed! Completely decoupled!
```

---

## Syntax & Essential Protocol Patterns

```python
from __future__ import annotations
from typing import Protocol, runtime_checkable

# 1. Defining a Structural Protocol
class Serializable(Protocol):
    """Any class with a serialize() method returning str satisfies this protocol."""
    def serialize(self) -> str:
        ...  # Ellipsis indicates signature definition with no implementation

# 2. Standalone Classes (No shared inheritance!)
class UserEntity:
    def __init__(self, name: str): self.name = name
    def serialize(self) -> str: return f"USER:{self.name}"

class ProductEntity:
    def __init__(self, sku: str): self.sku = sku
    def serialize(self) -> str: return f"PRODUCT:{self.sku}"

# 3. Static Type Verification
def export_payload(item: Serializable) -> str:
    # Mypy statically guarantees item has .serialize() -> str!
    return item.serialize()

print(export_payload(UserEntity("Hesam")))    # "USER:Hesam"
print(export_payload(ProductEntity("SKU-99"))) # "PRODUCT:SKU-99"

# 4. Runtime Checking with @runtime_checkable
@runtime_checkable
class Closer(Protocol):
    def close(self) -> None: ...

class FileHandle:
    def close(self) -> None: print("Closed file.")

handle = FileHandle()
print("Is Closer instance?", isinstance(handle, Closer)) # True at runtime! ✅
```

---

## Detailed Explanation

### 1. Why Protocols Solve the Third-Party Decoupling Problem

Imagine you are building an analytics library that requires objects to have a `.to_dataframe()` method:

- **Using ABCs**: You must force your users and all third-party libraries to subclass `class MyEntity(YourAnalyticsABC):`. If a user is passing a PyTorch dataset or Pandas DataFrame, they cannot modify that third-party class's base hierarchy without monkey-patching!
- **Using Protocols**: You define `class DataFrameConvertible(Protocol): def to_dataframe(self): ...`. Any object from any library (Pandas, Polars, PyTorch) that implements `.to_dataframe()` is **instantly compatible** with zero coupling!

---

### 2. The Caveats of `@runtime_checkable`

When you decorate a Protocol with **`@runtime_checkable`**, Python enables `isinstance(obj, MyProtocol)` checks at runtime:

```python
@runtime_checkable
class Greeter(Protocol):
    def greet(self, name: str) -> str: ...
```

#### ⚠️ CRITICAL LIMITATION:
`@runtime_checkable` verifies **ONLY that attribute/method names exist (`hasattr`)**. It does **NOT** check method parameter types, argument counts, or return types at runtime!

```python
class BrokenGreeter:
    def greet(self):  # Missing 'name' argument and returns None!
        return None

broken = BrokenGreeter()
# Runtime check PASSES because attribute 'greet' exists!
print(isinstance(broken, Greeter)) # True! (Even though signature is wrong!)
```

Static type checkers (like `mypy`) **will** catch the signature mismatch during static analysis, but runtime `isinstance` will not.

---

### 3. Protocol Properties & Attributes

Protocols can declare required attributes and properties. By default, variable annotations in protocols denote **Read-Write attributes**. To denote **Read-Only attributes**, use `@property`:

```python
class Identifiable(Protocol):
    # Read-Only Property Contract:
    @property
    def identifier(self) -> str:
        ...

    # Read-Write Variable Contract:
    is_active: bool
```

---

## Examples

### 1. Simple: Geometric Renderable Protocol
Creating a graphics rendering contract satisfied by unrelated shape objects.

```python
from typing import Protocol

class Drawable(Protocol):
    def draw_ascii(self) -> str: ...

class AsciiCircle:
    def __init__(self, radius: int): self.radius = radius
    def draw_ascii(self) -> str: return f"( Circle r={self.radius} )"

class AsciiSquare:
    def __init__(self, side: int): self.side = side
    def draw_ascii(self) -> str: return f"[ Square s={self.side} ]"

def render_canvas(elements: list[Drawable]):
    print("🎨 Canvas Rendering:")
    for elem in elements:
        print("  ->", elem.draw_ascii())

render_canvas([AsciiCircle(5), AsciiSquare(10)])
```

### 2. Beginner: Standard Library Protocols (`SupportsInt`, `SupportsFloat`)
Leveraging built-in protocols in Python's standard library.

```python
from typing import SupportsFloat

def calculate_half(val: SupportsFloat) -> float:
    # Any object implementing __float__() is valid!
    return float(val) / 2.0

class CustomTemperature:
    def __init__(self, temp_c: float): self.temp_c = temp_c
    def __float__(self) -> float: return self.temp_c

print("Half of Int   :", calculate_half(10))
print("Half of Float :", calculate_half(25.5))
print("Half of Custom:", calculate_half(CustomTemperature(36.6)))
```

### 3. Intermediate: Decoupled SQL Connection Protocol
Building a database query layer that accepts any database driver implementing an `execute_query` protocol.

```python
from typing import Protocol, Any

class DatabaseConnection(Protocol):
    def execute(self, sql: str, params: tuple[Any, ...]) -> list[dict[str, Any]]: ...
    def commit(self) -> None: ...

# Mock Driver (e.g. for Unit Tests)
class MockDatabaseDriver:
    def execute(self, sql: str, params: tuple[Any, ...]) -> list[dict[str, Any]]:
        print(f"🧪 [MOCK DB] Executing: '{sql}' with params {params}")
        return [{"id": 1, "username": "mock_admin"}]

    def commit(self) -> None:
        print("🧪 [MOCK DB] Transaction committed.")

def fetch_admin_users(db: DatabaseConnection) -> list[dict[str, Any]]:
    rows = db.execute("SELECT * FROM users WHERE role = %s", ("ADMIN",))
    db.commit()
    return rows

test_db = MockDatabaseDriver()
admins = fetch_admin_users(test_db)
print("Fetched Admins:", admins)
```

### 4. Real-World: Multi-Cloud File Archiver Protocol
Decoupling document storage consumers from AWS S3, Azure Blob, and Local Disk adapters.

```python
from typing import Protocol
from pathlib import Path

class ObjectStorageBackend(Protocol):
    def save_bytes(self, destination_path: str, data: bytes) -> str: ...
    def file_exists(self, destination_path: str) -> bool: ...

# Adapter 1: Local Storage Adapter
class LocalFileStorage:
    def __init__(self, base_dir: Path): self.base_dir = base_dir

    def save_bytes(self, destination_path: str, data: bytes) -> str:
        full_path = self.base_dir / destination_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(data)
        return f"file://{full_path.resolve()}"

    def file_exists(self, destination_path: str) -> bool:
        return (self.base_dir / destination_path).exists()

# Adapter 2: Simulated S3 Cloud Storage Adapter
class S3CloudStorage:
    def __init__(self, bucket_name: str): self.bucket = bucket_name

    def save_bytes(self, destination_path: str, data: bytes) -> str:
        # Simulate S3 API upload
        return f"s3://{self.bucket}/{destination_path}"

    def file_exists(self, destination_path: str) -> bool:
        return True

# Consumer Service: Purely dependent on Protocol!
class InvoiceArchivalService:
    def __init__(self, storage: ObjectStorageBackend):
        self.storage = storage

    def archive_invoice(self, invoice_id: str, pdf_data: bytes) -> str:
        target = f"invoices/2024/{invoice_id}.pdf"
        uri = self.storage.save_bytes(target, pdf_data)
        print(f"📦 [ARCHIVED] Invoice #{invoice_id} persisted to -> {uri}")
        return uri

# Test Local Adapter
local_service = InvoiceArchivalService(LocalFileStorage(Path("/tmp/storage")))
local_service.archive_invoice("INV-1001", b"%PDF-1.4 Mock Invoice Data")

# Test Cloud S3 Adapter (Seamless swap with zero code changes!)
s3_service = InvoiceArchivalService(S3CloudStorage("enterprise-invoices-prod"))
s3_service.archive_invoice("INV-1002", b"%PDF-1.4 Mock Invoice Data")
```

### 5. Advanced: Generic Protocol with Type Parameters
Combining generic type parameters with structural subtyping to build generic repository contracts.

```python
from typing import Protocol, TypeVar

T = TypeVar("T")

class KeyValueStore(Protocol[T]):
    def set_item(self, key: str, value: T) -> None: ...
    def get_item(self, key: str) -> T | None: ...

class MemoryStringStore:
    def __init__(self): self._data = {}
    def set_item(self, key: str, value: str) -> None: self._data[key] = value
    def get_item(self, key: str) -> str | None: return self._data.get(key)

# Type-safe generic protocol validation
def write_cache_entry(store: KeyValueStore[str], key: str, val: str):
    store.set_item(key, val)

cache = MemoryStringStore()
write_cache_entry(cache, "auth_token", "secret_token_123")
print("Cache Read:", cache.get_item("auth_token"))
```

---

## Code Explanation

In Example 4 (`InvoiceArchivalService`):
1. `ObjectStorageBackend` defines the exact structural interface contract (`save_bytes`, `file_exists`).
2. `LocalFileStorage` and `S3CloudStorage` do **not** inherit from `ObjectStorageBackend` or each other.
3. `InvoiceArchivalService` type-hints its storage dependency as `ObjectStorageBackend`.
4. Static type checkers (`mypy`) verify that both storage adapters satisfy the method signatures perfectly.
5. This achieves the **Dependency Inversion Principle (DIP)**: High-level modules do not depend on low-level storage adapters; both depend on the abstract Protocol.

---

## Common Mistakes

### Mistake 1: Implementing Real Logic Inside Protocol Methods
Protocol methods are pure structural signatures. Always use an ellipsis `...` or `pass` in protocol method bodies; never write production code inside a Protocol class definition.

### Mistake 2: Relying on `@runtime_checkable` for Deep Signature Verification
Remember that `isinstance(obj, MyProtocol)` only checks that attributes exist, not that parameter counts or return types match. Use static analysis (`mypy`) for full type verification.

---

## Best Practices

### Design Small, Cohesive Protocols (Interface Segregation)
Follow the **Interface Segregation Principle**: Prefer multiple small protocols (`Readable`, `Writable`, `Closable`) over one monolithic 20-method protocol.

Good:
```python
class Reader(Protocol):
    def read(self, n: int) -> bytes: ...

class Writer(Protocol):
    def write(self, data: bytes) -> int: ...
```

---

## Performance Considerations

1. **Zero Runtime Overhead**: In static typing mode, Protocols exist only in type annotations and incur **0 nanoseconds of runtime overhead**.
2. **`isinstance` Reflection Cost**: If decorated with `@runtime_checkable`, calling `isinstance(obj, Protocol)` performs dynamic `hasattr()` reflection over the protocol's member list (~1 microsecond).

---

## Security Considerations

1. **Validating Duck-Typed Plugin Inputs**: When loading dynamic third-party plugins based on Protocols, verify method existence and callable status before executing untrusted routines.

---

## Real-World Usage

- **Standard Library `typing` Protocols**: `SupportsInt`, `SupportsFloat`, `SupportsBytes`, `SupportsAbs`.
- **FastAPI / Starlette Middleware**: Typing HTTP request/response stream handlers with `Protocol`.
- **Pytest Mocking**: Verifying that mock test doubles satisfy the structural protocol of production dependencies.

---

## Comparison: Interface Enforcements

| Dimension | Abstract Base Class (`abc.ABC`) | Structural Protocol (`typing.Protocol`) |
|---|---|---|
| **Subtyping Philosophy** | **Nominal (Inheritance)** | **Structural (Duck Typing)** |
| **Inheritance Required?**| **Yes (`class Sub(Base):`)** | **No (Implicit compatibility)** |
| **Instantiation Guard** | Prevents direct instantiation | Cannot instantiate Protocol directly |
| **Decoupling from 3rd-Party**| Low (Requires modification) | **Maximum (Completely decoupled)** |
| **Best Used For** | Framework base classes, plugin templates | **Library APIs, DI interfaces, Mocks** |

---

## Advanced Concepts: Composing Protocols

Protocols can inherit from multiple other protocols to construct composite structural interfaces:

```python
class Reader(Protocol):
    def read(self, size: int) -> bytes: ...

class Writer(Protocol):
    def write(self, data: bytes) -> int: ...

# Composite Protocol combining both capabilities!
class ReadWriteStream(Reader, Writer, Protocol):
    pass
```

Any class that implements both `.read()` and `.write()` automatically satisfies `ReadWriteStream`.

---

## Exercises

### Exercise 1 — Beginner
Create a Protocol `Summarizable(Protocol)` with a method `get_summary() -> str`. Write two unrelated classes `Book` and `Article` that implement this method. Write a typed function `print_summary(item: Summarizable)`.

### Exercise 2 — Intermediate
Build a `@runtime_checkable` protocol `Encryptable(Protocol)` with a property `cipher_key: str` and a method `encrypt(payload: str) -> str`. Implement an `AESCipher` class and test runtime `isinstance` checks.

### Exercise 3 — Advanced
Build a generic `AuditableRepository[T](Protocol[T])` with methods `save(item: T) -> str` and `audit_history(item_id: str) -> list[str]`. Implement an in-memory audit repository and verify static type compatibility.

---

## Mini Project: Enterprise Decoupled Multi-Cloud Archival & Notification Pipeline

### Requirements
Build a decoupled document processing architecture named `protocol_document_archiver.py`. Define `StorageBackend`, `NotificationProvider`, and `DocumentRenderer` Protocols. Implement concrete cloud adapters and mock test doubles, verifying complete structural decoupling.

### Implementation Blueprint
```python
from __future__ import annotations
from typing import Protocol, runtime_checkable
from datetime import datetime, timezone

# =====================================================================
# 1. DECOUPLED STRUCTURAL PROTOCOLS
# =====================================================================

@runtime_checkable
class StorageProvider(Protocol):
    def upload_blob(self, target_key: str, payload_bytes: bytes) -> str: ...
    def get_blob_url(self, target_key: str) -> str: ...

@runtime_checkable
class NotificationService(Protocol):
    def send_alert(self, recipient: str, title: str, message: str) -> bool: ...

class DocumentRenderer(Protocol):
    def render_content(self) -> bytes: ...
    @property
    def document_id(self) -> str: ...

# =====================================================================
# 2. CONCRETE IMPLEMENTATIONS (ZERO SHARED INHERITANCE!)
# =====================================================================

class S3CloudStorageBackend:
    def __init__(self, bucket: str): self.bucket = bucket
    def upload_blob(self, target_key: str, payload_bytes: bytes) -> str:
        return f"s3://{self.bucket}/{target_key}"
    def get_blob_url(self, target_key: str) -> str:
        return f"https://{self.bucket}.s3.amazonaws.com/{target_key}"

class SlackAlertNotifier:
    def __init__(self, webhook_channel: str): self.channel = webhook_channel
    def send_alert(self, recipient: str, title: str, message: str) -> bool:
        print(f"💬 [SLACK #{self.channel}] Alert to @{recipient}: *{title}* - {message}")
        return True

class CommercialInvoiceDoc:
    def __init__(self, invoice_id: str, amount: float):
        self._id = invoice_id
        self.amount = amount

    @property
    def document_id(self) -> str: return self._id

    def render_content(self) -> bytes:
        return f"TAX INVOICE #{self._id} - AMOUNT: ${self.amount:,.2f}".encode("utf-8")

# =====================================================================
# 3. HIGH-LEVEL ORCHESTRATOR (DEPENDS ONLY ON PROTOCOLS)
# =====================================================================

class DocumentPublishingPipeline:
    def __init__(self, storage: StorageProvider, notifier: NotificationService):
        self.storage = storage
        self.notifier = notifier

    def publish_document(self, doc: DocumentRenderer, notify_user: str) -> str:
        print(f"\n⚙️ Publishing Document #{doc.document_id}...")
        raw_bytes = doc.render_content()
        target_path = f"documents/2024/{doc.document_id}.txt"
        
        # 1. Upload via Storage Protocol
        storage_uri = self.storage.upload_blob(target_path, raw_bytes)
        print(f"  ✅ Uploaded to: {storage_uri}")
        
        # 2. Notify via Notifier Protocol
        public_url = self.storage.get_blob_url(target_path)
        self.notifier.send_alert(
            recipient=notify_user,
            title="New Document Published",
            message=f"Document #{doc.document_id} is available at {public_url}"
        )
        return storage_uri

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE PROTOCOL DOCUMENT PUBLISHING PIPELINE")
    print("=" * 65)
    
    # Instantiate completely decoupled adapters
    s3_storage = S3CloudStorageBackend("enterprise-corp-vault")
    slack_alerts = SlackAlertNotifier("finance-ops")
    invoice = CommercialInvoiceDoc("INV-2024-9981", amount=12_450.00)
    
    # Verify runtime protocol compatibility
    print(f"Is s3_storage a StorageProvider?   : {isinstance(s3_storage, StorageProvider)}")
    print(f"Is slack_alerts a NotificationService?: {isinstance(slack_alerts, NotificationService)}")
    
    # Execute publishing pipeline
    pipeline = DocumentPublishingPipeline(storage=s3_storage, notifier=slack_alerts)
    pipeline.publish_document(invoice, notify_user="hesamp")
    print("\n" + "=" * 65)
```

---

## Summary

In this lesson, you mastered Python's structural typing with `typing.Protocol`:
- **`typing.Protocol` enables Static Duck Typing (Structural Subtyping)** at compile time without requiring nominal inheritance.
- Protocols completely decouple your code from third-party classes and frameworks.
- Use **`...` (Ellipsis)** in protocol method bodies to define pure method signatures.
- Define read-only protocol properties using **`@property`**.
- Decorate with **`@runtime_checkable`** to support runtime `isinstance()` checks.
- Follow the **Interface Segregation Principle** by composing small, focused protocols.

---

## Best Practices Checklist

- [ ] Use `typing.Protocol` instead of `abc.ABC` when designing decoupled library interfaces.
- [ ] Keep protocol definitions small, modular, and cohesive.
- [ ] Use `@runtime_checkable` only when runtime `isinstance()` verification is strictly required.
- [ ] Use `@property` for read-only protocol attributes.
- [ ] Combine protocols with Generic type variables for type-safe generic interfaces.

---

## What's Next?

Now that you understand Protocols and Structural Subtyping, continue to:
👉 **[TypeGuard, ParamSpec & Advanced Typing](typeguard-and-paramspec.md)** to master type narrowing with `TypeGuard` (PEP 647) and decorator signature preservation with `ParamSpec` (PEP 612)!
