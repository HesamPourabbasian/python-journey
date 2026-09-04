# Pythonic Design Patterns in Python

## Introduction

In 1994, the "Gang of Four" (GoF: Gamma, Helm, Johnson, Vlissides) published *Design Patterns: Elements of Reusable Object-Oriented Software*, formalizing 23 classic solutions to common object-oriented design problems.

However, the original GoF patterns were conceived for static, class-based languages like C++ and Java (which lacked first-class functions, closures, dynamic typing, and duck typing).

Blindly translating Java-style design patterns into Python—such as creating five abstract classes, factories, and interfaces just to pass a calculation strategy—is a major **Python Anti-Pattern**.

In Python, "Code is Data" and **Functions are First-Class Objects**:
- The **Strategy Pattern** is achieved by passing a simple Python function (`Callable`).
- The **Singleton Pattern** is naturally provided by Python's module import caching system (`sys.modules`).
- The **Observer Pattern** is made memory-safe using **Weak References (`weakref.WeakSet`)**.
- The **Adapter Pattern** is enabled natively by **Duck Typing** and **`typing.Protocol`**.
- The **Factory Pattern** is implemented elegantly via function registries or class decorators.

This lesson explores how to implement the classic Gang of Four design patterns the **Pythonic Way**, maximizing simplicity, decoupling, and high performance.

---

## Prerequisites

Before studying design patterns, ensure you have:

- Completed [Classes & Objects](../../intermediate/oop/classes-and-objects.md) and [Magic Methods](../../intermediate/oop/magic-methods-dunder.md).
- Completed [Closures & Decorators](../../intermediate/decorators/README.md).
- Completed [Type Hints & Protocols](../../intermediate/typing/protocols-and-duck-typing.md).

---

## Core Concept: Traditional GoF vs Modern Pythonic Equivalents

```
                      TRADITIONAL GoF vs PYTHONIC EQUIVALENT

      Classic GoF Pattern         Traditional Java/C++ Approach        Modern Pythonic Solution
     ┌──────────────────────────┬────────────────────────────────────┬──────────────────────────────────────┐
     │ 1. Strategy Pattern      │ Abstract Strategy Interface Class  │ First-Class Functions / Closures     │
     ├──────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
     │ 2. Factory Pattern       │ Abstract Factory Class Hierarchies │ Dict Registry / Dynamic type()       │
     ├──────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
     │ 3. Singleton Pattern     │ Private Constructor + Static Mutex │ Python Module / Metaclass            │
     ├──────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
     │ 4. Observer Pattern      │ Observer Interface + Listener List │ weakref.WeakSet / Event Callbacks    │
     ├──────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
     │ 5. Adapter Pattern       │ Multiple Class Inheritance Adapter │ typing.Protocol & Duck Typing        │
     ├──────────────────────────┼────────────────────────────────────┼──────────────────────────────────────┤
     │ 6. Decorator Pattern     │ Wrapping Wrapper Classes           │ Native Python @decorator functions   │
     └──────────────────────────┴────────────────────────────────────┴──────────────────────────────────────┘
```

---

## Syntax & Essential Pythonic Patterns

```python
from typing import Callable, Protocol
import weakref

# 1. Pythonic Strategy Pattern (First-Class Functions!)
DiscountStrategy = Callable[[float], float]

def regular_discount(price: float) -> float:
    return price * 0.05

def vip_discount(price: float) -> float:
    return price * 0.20

class OrderContext:
    def __init__(self, total_price: float, discount_strategy: DiscountStrategy):
        self.total_price = total_price
        self.discount_strategy = discount_strategy  # Injected callable!

    def calculate_final_price(self) -> float:
        discount = self.discount_strategy(self.total_price)
        return round(self.total_price - discount, 2)

# 2. Pythonic Observer Pattern with Memory-Safe weakref.WeakSet
class EventNotifier:
    def __init__(self):
        # WeakSet prevents memory leaks when listeners are deleted!
        self._subscribers = weakref.WeakSet()

    def subscribe(self, listener):
        self._subscribers.add(listener)

    def notify(self, message: str):
        for sub in list(self._subscribers):
            sub.handle_event(message)
```

---

## Detailed Explanation

### 1. The Strategy Pattern via First-Class Functions

In Java, implementing the Strategy Pattern requires defining an `interface DiscountStrategy`, creating `Class VipStrategy implements DiscountStrategy`, and instantiating strategy objects.

In Python, **functions are first-class objects**. You can pass functions directly as arguments, store them in dictionaries, or generate them dynamically with closures or lambdas:

$$\text{Strategy Pattern in Python} = \text{Passing a Function Pointer or Closure}$$

---

### 2. The Factory Pattern via Decorator Registries

Instead of writing complex abstract factory hierarchies, Pythonic factories use a **Registry Dictionary** populated dynamically with class decorators:

```python
class ExporterFactory:
    _REGISTRY: dict[str, type] = {}

    @classmethod
    def register(cls, format_name: str):
        def decorator(subclass: type):
            cls._REGISTRY[format_name.lower()] = subclass
            return subclass
        return decorator

    @classmethod
    def create(cls, format_name: str, *args, **kwargs):
        exporter_cls = cls._REGISTRY.get(format_name.lower())
        if not exporter_cls:
            raise ValueError(f"Unknown format: '{format_name}'")
        return exporter_cls(*args, **kwargs)
```

---

### 3. The Memory-Safe Observer Pattern with `weakref.WeakSet`

In standard Observer implementations, the Subject holds a strong list of listeners (`self.listeners.append(observer)`).

If an observer goes out of scope in the main application, **the Subject's list keeps the observer alive in memory indefinitely**, causing a catastrophic **Observer Memory Leak** in long-running services!

**The Pythonic Fix**:
Use **`weakref.WeakSet()`**. When no other active part of the program references the observer, Python's garbage collector automatically reclaims it and removes it from the Subject's subscriber set.

---

## Examples

### 1. Simple: Pythonic Strategy Pattern for Shipping Calculation
Using pure functions to calculate shipping rates based on location and weight.

```python
from typing import Callable

# Define Strategy Type Alias
ShippingCalculator = Callable[[float], float]

def standard_ground_shipping(weight_kg: float) -> float:
    return 5.00 + (weight_kg * 1.20)

def express_air_shipping(weight_kg: float) -> float:
    return 15.00 + (weight_kg * 3.50)

def international_sea_shipping(weight_kg: float) -> float:
    return 25.00 + (weight_kg * 0.80)

class ParcelShipment:
    def __init__(self, weight_kg: float, calculator: ShippingCalculator):
        self.weight_kg = weight_kg
        self.calculator = calculator

    def get_shipping_cost(self) -> float:
        return round(self.calculator(self.weight_kg), 2)

parcel = ParcelShipment(weight_kg=10.0, calculator=standard_ground_shipping)
print("Standard Shipping Cost : $", parcel.get_shipping_cost())

# Switch strategy dynamically at runtime!
parcel.calculator = express_air_shipping
print("Express Air Shipping Cost: $", parcel.get_shipping_cost())
```

### 2. Beginner: Factory Registry Pattern with Class Decorators
Registering media player codecs dynamically using a clean factory decorator.

```python
class MediaCodecFactory:
    REGISTRY: dict[str, type] = {}

    @classmethod
    def register(cls, codec_name: str):
        def decorator(subclass: type):
            cls.REGISTRY[codec_name.upper()] = subclass
            return subclass
        return decorator

    @classmethod
    def get_codec(cls, codec_name: str):
        target = cls.REGISTRY.get(codec_name.upper())
        if not target:
            raise KeyError(f"Unsupported codec format: '{codec_name}'")
        return target()

# Register Codecs via Decorator
@MediaCodecFactory.register("MP4")
class MP4Decoder:
    def decode(self, stream): return f"Decoding MP4 stream ({len(stream)} bytes)"

@MediaCodecFactory.register("WEBM")
class WebMDecoder:
    def decode(self, stream): return f"Decoding WebM stream ({len(stream)} bytes)"

# Instantiate via Factory
decoder = MediaCodecFactory.get_codec("MP4")
print("Factory Created Decoder:", decoder.decode(b"\x00\x00\x00\x18ftyp"))
print("Active Registered Codecs:", list(MediaCodecFactory.REGISTRY.keys()))
```

### 3. Intermediate: Memory-Safe Observer Pattern with `weakref`
Demonstrating automatic subscriber deregistration when listener objects are deleted.

```python
import weakref

class StockMarketFeed:
    """Subject that publishes price updates to observers."""
    def __init__(self, ticker: str):
        self.ticker = ticker
        self._subscribers = weakref.WeakSet()

    def attach(self, observer):
        self._subscribers.add(observer)
        print(f"➕ [SUBSCRIBED] {type(observer).__name__} listening to {self.ticker}")

    def update_price(self, new_price: float):
        print(f"\n📢 [MARKET BROADCAST] {self.ticker} Price: ${new_price:.2f}")
        for obs in list(self._subscribers):
            obs.on_price_change(self.ticker, new_price)

class AutomatedTradingBot:
    def __init__(self, bot_id: str):
        self.bot_id = bot_id

    def on_price_change(self, ticker: str, price: float):
        print(f"  🤖 [{self.bot_id}] Evaluating market buy/sell order for ${price:.2f}")

feed = StockMarketFeed("AAPL")
bot1 = AutomatedTradingBot("Bot-Alpha")
bot2 = AutomatedTradingBot("Bot-Beta")

feed.attach(bot1)
feed.attach(bot2)

feed.update_price(185.50)

# Delete Bot-Beta -> Automatically removed from WeakSet!
print("\n🗑️ Deleting Bot-Beta from program memory...")
del bot2

feed.update_price(186.20)  # Only Bot-Alpha is notified!
```

### 4. Real-World: Multi-Cloud Storage Adapter using `typing.Protocol`
Adapting Local Filesystem Storage and AWS S3 Storage under a single type-safe protocol with zero inheritance.

```python
from typing import Protocol
import pathlib

# Define Port Protocol
class CloudStorageAdapter(Protocol):
    def upload_file(self, file_path: str, data: bytes) -> str: ...
    def read_file(self, file_path: str) -> bytes: ...

# Adapter 1: Local Disk Storage
class LocalDiskAdapter:
    def __init__(self, root_dir: str = "/tmp/storage"):
        self.root_dir = pathlib.Path(root_dir)

    def upload_file(self, file_path: str, data: bytes) -> str:
        target = self.root_dir / file_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return f"file://{target}"

    def read_file(self, file_path: str) -> bytes:
        return (self.root_dir / file_path).read_bytes()

# Adapter 2: Simulated AWS S3 Storage
class AWSS3Adapter:
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self._s3_mock_cloud = {}

    def upload_file(self, file_path: str, data: bytes) -> str:
        s3_uri = f"s3://{self.bucket_name}/{file_path}"
        self._s3_mock_cloud[s3_uri] = data
        return s3_uri

    def read_file(self, file_path: str) -> bytes:
        s3_uri = f"s3://{self.bucket_name}/{file_path}"
        return self._s3_mock_cloud[s3_uri]

# Client Application consuming the Protocol
class DocumentManager:
    def __init__(self, storage: CloudStorageAdapter):
        self.storage = storage

    def save_invoice(self, invoice_id: str, content: str) -> str:
        return self.storage.upload_file(f"invoices/{invoice_id}.pdf", content.encode("utf-8"))

# Test interchangeable storage adapters
local_doc_mgr = DocumentManager(LocalDiskAdapter())
s3_doc_mgr = DocumentManager(AWSS3Adapter(bucket_name="enterprise-cloud-vault"))

print("Local File Saved :", local_doc_mgr.save_invoice("INV-001", "Invoice Content"))
print("AWS S3 File Saved:", s3_doc_mgr.save_invoice("INV-002", "Invoice Content"))
```

### 5. Advanced: Fluent Configuration Builder Pattern
Building a fluent builder with method chaining and validation.

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class DatabaseConfiguration:
    host: str
    port: int
    database_name: str
    username: str
    password: str
    max_connections: int
    ssl_enabled: bool
    timeout_sec: float

class DatabaseConfigBuilder:
    """Fluent Builder for constructing immutable DatabaseConfiguration instances."""
    def __init__(self):
        self._host: str = "localhost"
        self._port: int = 5432
        self._database_name: str = "default_db"
        self._username: str = "postgres"
        self._password: str = ""
        self._max_connections: int = 10
        self._ssl_enabled: bool = False
        self._timeout_sec: float = 30.0

    def with_host(self, host: str, port: int = 5432):
        self._host = host
        self._port = port
        return self

    def with_credentials(self, user: str, secret: str):
        self._username = user
        self._password = secret
        return self

    def with_database(self, name: str):
        self._database_name = name
        return self

    def with_pool_size(self, size: int):
        if size <= 0: raise ValueError("Pool size must be > 0.")
        self._max_connections = size
        return self

    def enable_ssl(self, enabled: bool = True):
        self._ssl_enabled = enabled
        return self

    def build(self) -> DatabaseConfiguration:
        if not self._password:
            raise ValueError("Cannot build DatabaseConfiguration without password credentials.")
        
        return DatabaseConfiguration(
            host=self._host,
            port=self._port,
            database_name=self._database_name,
            username=self._username,
            password=self._password,
            max_connections=self._max_connections,
            ssl_enabled=self._ssl_enabled,
            timeout_sec=self._timeout_sec
        )

# Construct config using fluent chaining
config = (
    DatabaseConfigBuilder()
    .with_host("db.production.internal", 5432)
    .with_database("ledger_db")
    .with_credentials("app_user", "SuperSecretPass99!")
    .with_pool_size(25)
    .enable_ssl(True)
    .build()
)

print("Constructed Database Configuration:")
print(f"  • Connect String: postgresql://{config.username}:***@{config.host}:{config.port}/{config.database_name}")
print(f"  • Pool Limits   : {config.max_connections} conns (SSL: {config.ssl_enabled})")
```

---

## Code Explanation

In Example 4 (`CloudStorageAdapter`):
1. **`typing.Protocol`** defines structural subtyping (Duck Typing with static type verification).
2. Neither `LocalDiskAdapter` nor `AWSS3Adapter` inherits from a common base class.
3. Because both implement `upload_file()` and `read_file()` with matching signatures, Python's runtime and Mypy accept both transparently.
4. This delivers clean, decoupled **Adapter Pattern** implementations with zero inheritance overhead.

---

## Common Mistakes

### Mistake 1: Creating Complex Class Hierarchies for Simple Strategies
Writing 4 classes just to compute a discount percentage. In Python, passing a lambda or function (`def discount(p): return p * 0.1`) is 10x cleaner and faster.

### Mistake 2: Leaking Observers with Strong Reference Collections
Storing event listeners in a standard `list` on a singleton subject. Observers are never garbage collected, causing memory leaks in web services. **Always use `weakref.WeakSet()`**.

---

## Best Practices

### Use Python Modules as Natural Singletons
In Python, a module is only imported and evaluated **once** (cached in `sys.modules`). If you need a global configuration or connection pool, define it at module level:

Good:
```python
# db.py - Natural Singleton!
database_connection = initialize_pool()
```

---

## Performance Considerations

- **Function Dispatch vs Method Lookup**: Calling a raw function strategy is faster than invoking a method on an instantiated strategy class, as it bypasses descriptor method binding.

---

## Security Considerations

1. **Factory Input Validation**: When instantiating classes via factory registries from user strings (e.g. `format="json"`), validate keys strictly against allowlist dictionaries to prevent arbitrary class instantiation attacks.

---

## Real-World Usage

- **SQLAlchemy Dialects**: Adapter pattern adapting SQLite, PostgreSQL, MySQL, and Oracle.
- **FastAPI / Flask Middleware**: Decorator & Chain of Responsibility patterns.
- **Pytest**: Strategy pattern via fixtures.

---

## Comparison: Traditional GoF vs Pythonic Patterns

| Pattern | Traditional GoF | Pythonic Pattern |
|---|---|---|
| **Strategy** | Interface + Strategy Classes | **First-Class Functions (`Callable`)**|
| **Factory** | AbstractFactory + ConcreteFactories| **Dictionary Registry + Decorator** |
| **Observer** | Strong Reference Listener List | **`weakref.WeakSet` Callbacks** |
| **Adapter** | Multiple Inheritance Adapters | **`typing.Protocol` & Duck Typing** |
| **Singleton**| Synchronized Double-Checked Lock | **Python Module Import Cache** |

---

## Advanced Concepts: Decorator-Based Strategy Stacking

You can compose multiple strategies sequentially using decorator pipelines:

```python
def tax_strategy(rate: float):
    def decorator(fn):
        def wrapper(price):
            base = fn(price)
            return base * (1.0 + rate)
        return wrapper
    return decorator
```

---

## Exercises

### Exercise 1 — Beginner
Build a `TextFormatter` class using the Strategy pattern where formatting strategies (uppercase, lowercase, titlecase) are passed as pure functions.

### Exercise 2 — Intermediate
Build a `PluginFactory` with a `@register(name)` decorator and a `.create(name)` factory method that instantiates registered plugin classes.

### Exercise 3 — Advanced
Build a `MemorySafeEventBus` using `weakref.WeakSet` that allows components to publish and subscribe to named event topics, verifying that deleted listeners stop receiving events automatically.

---

## Mini Project: Enterprise Payment Gateway & Notification Processing Engine

### Requirements
Build an operational payment gateway and multi-channel notification engine named `payment_pattern_suite.py`. Combine the Factory pattern (payment processors), Strategy pattern (fee calculation algorithms), Adapter pattern (SMS/Email delivery providers via Protocol), and Observer pattern (`weakref.WeakSet` audit listeners).

### Implementation Blueprint
```python
from __future__ import annotations
from typing import Callable, Protocol
import weakref
from dataclasses import dataclass
import json
import time

# =====================================================================
# 1. STRATEGY PATTERN (FEE CALCULATION ENGINES)
# =====================================================================

FeeCalculationStrategy = Callable[[float], float]

def standard_merchant_fee(amount: float) -> float:
    return round((amount * 0.029) + 0.30, 2)

def enterprise_volume_fee(amount: float) -> float:
    return round(amount * 0.015, 2)

# =====================================================================
# 2. ADAPTER PATTERN (NOTIFICATION PROTOCOL & ADAPTERS)
# =====================================================================

class NotificationChannelAdapter(Protocol):
    def dispatch_alert(self, recipient: str, message: str) -> bool: ...

class EmailNotificationAdapter:
    def dispatch_alert(self, recipient: str, message: str) -> bool:
        print(f"  📧 [EMAIL ADAPTER] Sending email to {recipient}: '{message}'")
        return True

class SMSNotificationAdapter:
    def dispatch_alert(self, recipient: str, message: str) -> bool:
        print(f"  📱 [SMS ADAPTER] Dispatching SMS to {recipient}: '{message}'")
        return True

# =====================================================================
# 3. OBSERVER PATTERN (MEMORY-SAFE AUDIT OBSERVERS)
# =====================================================================

class PaymentAuditEventNotifier:
    def __init__(self):
        self._observers = weakref.WeakSet()

    def subscribe(self, observer: PaymentAuditObserver):
        self._observers.add(observer)

    def publish_payment_event(self, transaction_id: str, amount: float, status: str):
        for obs in list(self._observers):
            obs.on_payment_event(transaction_id, amount, status)

class PaymentAuditObserver:
    def __init__(self, auditor_name: str):
        self.auditor_name = auditor_name

    def on_payment_event(self, tx_id: str, amount: float, status: str):
        print(f"  📝 [AUDIT OBSERVER: {self.auditor_name}] Logged #{tx_id} (${amount:,.2f}) -> {status}")

# =====================================================================
# 4. FACTORY PATTERN (PAYMENT PROCESSORS)
# =====================================================================

class PaymentProcessorFactory:
    REGISTRY: dict[str, type] = {}

    @classmethod
    def register(cls, payment_method: str):
        def decorator(processor_cls: type):
            cls.REGISTRY[payment_method.upper()] = processor_cls
            return processor_cls
        return decorator

    @classmethod
    def create_processor(cls, payment_method: str, fee_strategy: FeeCalculationStrategy) -> BasePaymentProcessor:
        target = cls.REGISTRY.get(payment_method.upper())
        if not target:
            raise ValueError(f"Unsupported payment method: '{payment_method}'")
        return target(fee_strategy)

class BasePaymentProcessor:
    def __init__(self, fee_strategy: FeeCalculationStrategy):
        self.fee_strategy = fee_strategy

    def process_charge(self, tx_id: str, amount: float) -> dict:
        raise NotImplementedError

@PaymentProcessorFactory.register("CREDIT_CARD")
class CreditCardProcessor(BasePaymentProcessor):
    def process_charge(self, tx_id: str, amount: float) -> dict:
        fee = self.fee_strategy(amount)
        return {"tx_id": tx_id, "method": "CREDIT_CARD", "net_settlement": amount - fee, "fee": fee}

@PaymentProcessorFactory.register("CRYPTO")
class CryptoProcessor(BasePaymentProcessor):
    def process_charge(self, tx_id: str, amount: float) -> dict:
        fee = self.fee_strategy(amount)
        return {"tx_id": tx_id, "method": "CRYPTO", "net_settlement": amount - fee, "fee": fee}

# =====================================================================
# 5. ORCHESTRATOR & RUNTIME VERIFICATION
# =====================================================================

def run_pattern_suite():
    border = "=" * 70
    print(border)
    print("      ENTERPRISE PYTHONIC DESIGN PATTERN PAYMENT SUITE")
    print(border)

    # 1. Initialize Observer Event Bus & Observers
    event_bus = PaymentAuditEventNotifier()
    auditor = PaymentAuditObserver("GlobalComplianceAudit")
    event_bus.subscribe(auditor)

    # 2. Select Notification Adapter (Protocol)
    notifier: NotificationChannelAdapter = EmailNotificationAdapter()

    # 3. Create Processor via Factory with Injected Strategy
    print("\n1. Instantiating CreditCard Processor with Enterprise Volume Fee Strategy:")
    processor = PaymentProcessorFactory.create_processor("CREDIT_CARD", fee_strategy=enterprise_volume_fee)

    # 4. Execute Payment Transaction
    tx_id = f"TX-{int(time.time())}"
    charge_amount = 5000.00
    receipt = processor.process_charge(tx_id, charge_amount)

    print("\n2. Payment Processed Result:")
    print(json.dumps(receipt, indent=2))

    # 5. Broadcast to Observers and Dispatch Notification Adapter
    print("\n3. Publishing Audit Events & Notifications:")
    event_bus.publish_payment_event(tx_id, charge_amount, "SETTLED")
    notifier.dispatch_alert("merchant_ops@enterprise.com", f"Payment #{tx_id} settled successfully.")

    print("\n" + border)
    print("🎉 All 4 Pythonic Design Patterns (Factory, Strategy, Observer, Adapter) Verified!")
    print(border)

if __name__ == "__main__":
    run_pattern_suite()
```

---

## Summary

In this lesson, you mastered Pythonic Design Patterns:
- **Strategy Pattern** is implemented elegantly via **First-Class Functions (`Callable`)** and closures.
- **Factory Pattern** uses **Dictionary Registries** and class decorators instead of deep class hierarchies.
- **Observer Pattern** uses **`weakref.WeakSet`** to prevent memory leaks.
- **Adapter Pattern** relies on **`typing.Protocol`** and **Duck Typing** for structural compatibility without multiple inheritance.
- Use **Python Modules** as natural, thread-safe singletons.

---

## Best Practices Checklist

- [ ] Prefer passing callable functions instead of single-method Strategy classes.
- [ ] Use `weakref.WeakSet` for all Observer and event listener collections.
- [ ] Use `typing.Protocol` to define structural adapter interfaces.
- [ ] Implement Factory Registries with clean class decorators.
- [ ] Avoid over-engineering Java-style GoF patterns in dynamic Python.

---

## What's Next?

Now that you understand Pythonic Design Patterns, continue to the final article in this module:
👉 **[Microservices & Event-Driven Architecture](microservices-event-driven-architecture.md)** to master Kafka/RabbitMQ message brokers, Event Sourcing, CQRS, and distributed Saga transactions!
