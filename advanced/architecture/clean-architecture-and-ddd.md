# Clean Architecture & Domain-Driven Design in Python

## Introduction

In typical junior-to-intermediate Python projects, applications are built tightly coupled to their web frameworks and databases:
- Business logic is scattered across Django view controllers, FastAPI route handlers, and SQLAlchemy model hooks.
- Testing a single business rule requires spinning up PostgreSQL databases, running migrations, and making mock HTTP requests.
- Switching a database from PostgreSQL to MongoDB or migrating from Flask to FastAPI requires rewriting the entire application.

To build software that survives for decades, enterprise systems adopt **Clean Architecture** (Robert C. Martin / Uncle Bob) and **Domain-Driven Design (DDD)** (Eric Evans).

The core philosophy of Clean Architecture is **The Dependency Rule**:
$$\textbf{Source code dependencies must ONLY point inward toward higher-level domain policies.}$$

The core business logic (Domain Entities & Use Cases) sits at the center of the architecture, knowing **absolutely nothing** about web frameworks, databases, SQL, or external APIs. Web servers (FastAPI/Django) and databases (SQLAlchemy/PostgreSQL) are treated as swappable external **plugins** on the outer layers.

This lesson explores Clean Architecture layers, Domain-Driven Design tactical patterns (Entities, Value Objects, Aggregates, Domain Events), the **Repository Pattern**, the **Unit of Work Pattern**, and writing lightning-fast database-free unit tests.

---

## Prerequisites

Before studying Clean Architecture, ensure you have:

- Completed [Object-Oriented Programming](../../intermediate/oop/README.md) and [Abstract Base Classes](../../intermediate/oop/abstract-base-classes.md).
- Completed [Modern Enterprise Web Frameworks](../fastapi-django/README.md).
- Understanding of the SOLID principles (especially the Dependency Inversion Principle).

---

## Core Concept: The Clean Architecture Concentric Circles

```
                           THE CLEAN ARCHITECTURE LAYERS

     ┌────────────────────────────────────────────────────────────────────────┐
     │ 4. Frameworks & Drivers (FastAPI, SQLAlchemy, PostgreSQL, CLI)         │
     │   ┌──────────────────────────────────────────────────────────────────┐ │
     │   │ 3. Interface Adapters (Repositories, Controllers, Presenters)    │ │
     │   │   ┌────────────────────────────────────────────────────────────┐ │ │
     │   │   │ 2. Application Use Cases (OrderPlacementService)           │ │ │
     │   │   │   ┌──────────────────────────────────────────────────────┐ │ │ │
     │   │   │   │ 1. Enterprise Domain Entities (Pure Python Classes)  │ │ │ │
     │   │   │   │    • Money, Order, Customer, Invariants              │ │ │ │
     │   │   │   │    • ZERO framework imports!                         │ │ │ │
     │   │   │   └──────────────────────────────────────────────────────┘ │ │ │
     │   │   └───────────────────────────────▲────────────────────────────┘ │ │
     │   └───────────────────────────────────┼──────────────────────────────┘ │
     └───────────────────────────────────────┴────────────────────────────────┘
                                  (Dependencies Point INWARD Only!)
```

---

## Syntax & Essential Domain-Driven Design Patterns

```python
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from typing import Optional
import uuid

# 1. Value Object (Immutable, identified strictly by its attributes)
@dataclass(frozen=True)
class Money:
    amount: float
    currency: str = "USD"

    def __add__(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(f"Cannot add {self.currency} to {other.currency}")
        return Money(round(self.amount + other.amount, 2), self.currency)

# 2. Domain Entity (Identified by a unique ID; contains pure business invariants)
@dataclass
class AccountEntity:
    account_id: str
    owner_name: str
    balance: Money

    def deposit(self, amount: Money):
        if amount.amount <= 0:
            raise ValueError("Deposit amount must be positive.")
        self.balance = self.balance + amount

    def withdraw(self, amount: Money):
        if amount.amount > self.balance.amount:
            raise ValueError(f"Insufficient funds! Balance is {self.balance.amount}")
        self.balance = Money(self.balance.amount - amount.amount, self.balance.currency)

# 3. Abstract Repository Interface (Port in Ports & Adapters)
class AbstractAccountRepository(ABC):
    @abstractmethod
    def get_by_id(self, account_id: str) -> Optional[AccountEntity]:
        pass

    @abstractmethod
    def save(self, account: AccountEntity):
        pass
```

---

## Detailed Explanation

### 1. The Tactical Patterns of Domain-Driven Design (DDD)

- **Value Objects**: Immutable objects with no conceptual identity. Two Value Objects with identical attributes are completely interchangeable (e.g. `Money(100, "USD") == Money(100, "USD")`).
- **Entities**: Objects defined by a continuous thread of identity (e.g. `User(id="USR-101")`), whose attributes may change over time.
- **Aggregates & Aggregate Roots**: A cluster of related domain objects treated as a single consistency boundary (e.g. an `Order` containing multiple `OrderLine` items). All external modifications must pass through the Aggregate Root (`Order`).
- **Repositories**: Encapsulate the logic required to access data sources. The domain code interacts with an abstract repository interface; the infrastructure layer provides concrete SQL or MongoDB implementations.
- **Unit of Work**: Maintains a list of database transactions and coordinates writing changes atomically.

---

### 2. The Dependency Inversion Principle (DIP)

In traditional layered architectures:
$$\text{UI / Controller} \longrightarrow \text{Business Logic} \longrightarrow \text{Database (SQLAlchemy)}$$
*Flaw*: The business logic imports and depends directly on the database engine.

In Clean Architecture with Dependency Inversion:
$$\text{Controller} \longrightarrow \text{Business Logic Use Case} \longleftarrow \text{SQLAlchemy Repository (Adapter)}$$
*Power*: Both the UI and Database depend on **interfaces defined by the core Business Logic**. The database becomes an interchangeable implementation detail.

---

### 3. Project Directory Layout for Clean Architecture

```text
my_enterprise_app/
├── domain/                    # Layer 1: Pure business logic (Zero dependencies!)
│   ├── models.py              # Entities & Value Objects
│   └── events.py              # Domain Events
├── application/               # Layer 2: Use Cases & Interactors
│   ├── use_cases.py           # Application Services (e.g. PlaceOrderUseCase)
│   └── interfaces.py          # Abstract Repositories & Ports
├── infrastructure/            # Layer 3 & 4: Databases & External Services
│   ├── repositories.py        # SQLAlchemy / Mongo concrete repositories
│   └── email_service.py       # SendGrid / AWS SES adapters
└── entrypoints/               # Layer 4: Web servers & CLIs
    ├── api_v1.py              # FastAPI router endpoints
    └── cli.py                 # Click / Argparse commands
```

---

## Examples

### 1. Simple: Value Object Immutability & Structural Equality
Demonstrating why Value Objects use `frozen=True` dataclasses.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class GeoCoordinate:
    latitude: float
    longitude: float

# Structural equality
loc1 = GeoCoordinate(40.7128, -74.0060)
loc2 = GeoCoordinate(40.7128, -74.0060)

print("Are identical Value Objects equal?", loc1 == loc2) # True!
print("Value Object Hash (Usable as dict keys):", hash(loc1))

# Immutability check:
try:
    loc1.latitude = 50.0  # Raises FrozenInstanceError!
except Exception as err:
    print("Caught Immutability Error:", type(err).__name__)
```

### 2. Beginner: Domain Entity Invariants
Enforcing business rules directly inside entity constructors and methods.

```python
from dataclasses import dataclass
import re

@dataclass
class UserEntity:
    user_id: str
    email: str
    is_verified: bool = False

    def __post_init__(self):
        # Business invariant: Email format validation
        if not re.match(r"[^@]+@[^@]+\.[^@]+", self.email):
            raise ValueError(f"Invalid email address invariant: '{self.email}'")

    def verify_email(self):
        if self.is_verified:
            raise ValueError("User email is already verified.")
        self.is_verified = True

user = UserEntity("USR-101", "hesam@domain.com")
print(f"Created Entity: {user.user_id} (Verified: {user.is_verified})")
user.verify_email()
print(f"After Verification: Verified={user.is_verified}")
```

### 3. Intermediate: Abstract Repository & In-Memory Fake Repository
Writing a fake in-memory repository to test business logic in microseconds without databases.

```python
from abc import ABC, abstractmethod
from typing import Optional

class AbstractCustomerRepository(ABC):
    @abstractmethod
    def get(self, customer_id: str) -> Optional[UserEntity]:
        pass

    @abstractmethod
    def save(self, customer: UserEntity):
        pass

class InMemoryCustomerRepository(AbstractCustomerRepository):
    """In-memory fake repository for high-speed unit testing."""
    def __init__(self):
        self._store: dict[str, UserEntity] = {}

    def get(self, customer_id: str) -> Optional[UserEntity]:
        return self._store.get(customer_id)

    def save(self, customer: UserEntity):
        self._store[customer.user_id] = customer

# Test In-Memory Repository
repo = InMemoryCustomerRepository()
repo.save(UserEntity("USR-99", "admin@domain.com"))
retrieved = repo.get("USR-99")
print("Retrieved from In-Memory Fake Repository:", retrieved.email)
```

### 4. Real-World: E-Commerce Checkout Use Case with Unit of Work
Building an application use case coordinating entities, repositories, and transaction commits.

```python
from dataclasses import dataclass
from typing import List

# Domain Entities
@dataclass
class OrderLine:
    product_sku: str
    quantity: int
    unit_price: float

@dataclass
class OrderAggregate:
    order_id: str
    customer_id: str
    lines: List[OrderLine]
    status: str = "PENDING"

    @property
    def total_amount(self) -> float:
        return sum(line.quantity * line.unit_price for line in self.lines)

    def mark_paid(self):
        if self.status != "PENDING":
            raise ValueError("Only PENDING orders can be marked paid.")
        self.status = "PAID"

# Abstract Unit of Work
class AbstractUnitOfWork(ABC):
    orders: AbstractCustomerRepository

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()

    @abstractmethod
    def commit(self): pass

    @abstractmethod
    def rollback(self): pass

# Application Use Case Service
class CheckoutUseCase:
    def __init__(self, uow: AbstractUnitOfWork):
        self.uow = uow

    def execute(self, order_id: str, customer_id: str, items: list[tuple[str, int, float]]) -> dict:
        order_lines = [OrderLine(sku, qty, price) for sku, qty, price in items]
        order = OrderAggregate(order_id, customer_id, order_lines)
        order.mark_paid()

        # Execute business transaction
        with self.uow:
            # self.uow.orders.save(order)
            self.uow.commit()

        return {
            "order_id": order.order_id,
            "total_usd": order.total_amount,
            "status": order.status
        }

print("Checkout Use Case Pipeline Blueprint Loaded.")
```

### 5. Advanced: Domain Event Dispatcher Pattern
Decoupling side-effects (like sending emails or pushing audit logs) using Domain Events.

```python
from dataclasses import dataclass
from typing import Callable, Type
import time

@dataclass(frozen=True)
class DomainEvent:
    occurred_on: float = field(default_factory=time.time)

@dataclass(frozen=True)
class OrderPlacedDomainEvent(DomainEvent):
    order_id: str
    customer_email: str
    total_usd: float

class DomainEventBus:
    _handlers: dict[Type[DomainEvent], list[Callable]] = {}

    @classmethod
    def subscribe(cls, event_type: Type[DomainEvent], handler: Callable):
        if event_type not in cls._handlers:
            cls._handlers[event_type] = []
        cls._handlers[event_type].append(handler)

    @classmethod
    def publish(cls, event: DomainEvent):
        handlers = cls._handlers.get(type(event), [])
        for handler in handlers:
            handler(event)

# Side-Effect Handlers
def send_order_confirmation_email(evt: OrderPlacedDomainEvent):
    print(f"📧 [NOTIFICATION] Sending confirmation email to {evt.customer_email} for ${evt.total_usd:.2f}")

def update_analytics_warehouse(evt: OrderPlacedDomainEvent):
    print(f"📊 [ANALYTICS] Recording revenue event for Order #{evt.order_id}")

# Wire Subscriptions
DomainEventBus.subscribe(OrderPlacedDomainEvent, send_order_confirmation_email)
DomainEventBus.subscribe(OrderPlacedDomainEvent, update_analytics_warehouse)

# Publish Event from Domain Layer
event = OrderPlacedDomainEvent("ORD-1001", "alice@enterprise.com", 450.00)
print("=" * 65)
print("PUBLISHING DOMAIN EVENT:")
print("=" * 65)
DomainEventBus.publish(event)
```

---

## Code Explanation

In Example 5 (`Domain Event Bus`):
1. **`OrderPlacedDomainEvent`** is an immutable record capturing that a business state change occurred in the past.
2. The core domain logic publishes the event without knowing *who* is listening.
3. External handlers (email notification services, analytics pipelines) subscribe to the event independently.
4. This completely decouples secondary side-effects from the core order placement logic, adhering to the **Single Responsibility Principle**.

---

## Common Mistakes

### Mistake 1: Importing ORM Models into Domain Entities
Writing `class UserEntity(Base):` (inheriting from SQLAlchemy or Django ORM base).
This pollutes your pure domain layer with database metadata, table schemas, and framework state. **Domain Entities must be pure Python classes (or `@dataclass`).**

### Mistake 2: Over-Engineering Simple CRUD Apps
Applying full Clean Architecture, Repositories, and DDD to basic CRUD scripts that only do simple database reads and writes. Use Clean Architecture for **complex business domains**; use simple MVC for basic CRUD tools.

---

## Best Practices

### Write Fast Unit Tests Against In-Memory Repositories
Because Clean Architecture Use Cases depend on abstract repository interfaces, you can run thousands of unit tests against in-memory dictionary fakes **in under 50 milliseconds without starting Docker or PostgreSQL**.

Good:
```python
def test_place_order():
    fake_uow = FakeUnitOfWork()
    use_case = CheckoutUseCase(uow=fake_uow)
    res = use_case.execute("ORD-1", "CUST-1", [("SKU-A", 1, 50.0)])
    assert res["status"] == "PAID"
```

---

## Performance Considerations

- **Abstraction Layer Overhead**: Function calls through repository interfaces and dataclass instantiations add **$< 1\mu\text{s}$** of CPU time. In real-world applications, this is 1,000x faster than the 10–50 millisecond database network latency.

---

## Security Considerations

1. **Enforcing Domain Invariants at the Core**: Business validation rules (e.g. `withdraw()` refusing overdrafts) must be enforced inside the Domain Entity itself, guaranteeing that no rogue API route or CLI tool can bypass business constraints.

---

## Real-World Usage

- **Fintech & Core Banking Systems**: Double-entry ledger systems with strictly isolated business rules.
- **Healthcare & EHR Platforms**: Managing medical record state transitions with audit event dispatching.
- **Enterprise SaaS**: Multi-tenant subscription and billing engines.

---

## Comparison: Architectural Paradigms

| Dimension | Monolithic Active Record (Django) | Clean Architecture / DDD |
|---|---|---|
| **Coupling** | High (Business logic inside ORM models) | **Zero (Domain is pure Python)** |
| **Test Speed** | Slow (Requires real database) | **Instantaneous (< 50ms in-memory)** |
| **Framework Lock-in**| Permanent | **None (Frameworks are plugins)** |
| **Complexity** | Low (Fast initial velocity) | Moderate / High |
| **Best For** | Standard CRUD Apps, Prototypes | Complex Enterprise Core Domains |

---

## Advanced Concepts: The Specification Pattern

The **Specification Pattern** encapsulates business filtering rules into reusable, composable objects:

```python
class Specification(ABC):
    @abstractmethod
    def is_satisfied_by(self, candidate) -> bool: pass

    def __and__(self, other): return AndSpecification(self, other)

class HighValueCustomerSpec(Specification):
    def is_satisfied_by(self, user): return user.lifetime_spend > 5000

class VerifiedCustomerSpec(Specification):
    def is_satisfied_by(self, user): return user.is_verified
```

---

## Exercises

### Exercise 1 — Beginner
Build an immutable `Currency` Value Object using `@dataclass(frozen=True)` and implement addition and subtraction methods that validate matching currency codes.

### Exercise 2 — Intermediate
Build a pure `BankAccount` Domain Entity with `deposit()` and `withdraw()` methods, and an `InMemoryAccountRepository` that passes unit tests without importing any database library.

### Exercise 3 — Advanced
Build a `TransferFundsUseCase` that coordinates transferring funds between two bank accounts inside an `AbstractUnitOfWork`, publishing a `FundsTransferredDomainEvent` upon completion.

---

## Mini Project: Enterprise Clean Architecture Banking Transfer & Ledger Service

### Requirements
Build an operational Clean Architecture banking engine named `clean_banking_service.py`. Implement pure domain Value Objects (`Money`) and Entities (`BankAccount`), an abstract repository interface with an in-memory implementation, an atomic Unit of Work, an application transfer Use Case, and a domain event notification bus.

### Implementation Blueprint
```python
from __future__ import annotations
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from typing import Optional, List, Callable, Type
import time
import json

# =====================================================================
# 1. DOMAIN LAYER (LAYER 1 - PURE PYTHON, ZERO DEPENDENCIES)
# =====================================================================

@dataclass(frozen=True)
class Money:
    amount: float
    currency: str = "USD"

    def __add__(self, other: Money) -> Money:
        if self.currency != other.currency:
            raise ValueError(f"Currency mismatch: {self.currency} vs {other.currency}")
        return Money(round(self.amount + other.amount, 2), self.currency)

    def __sub__(self, other: Money) -> Money:
        if self.currency != other.currency:
            raise ValueError(f"Currency mismatch: {self.currency} vs {other.currency}")
        return Money(round(self.amount - other.amount, 2), self.currency)

@dataclass(frozen=True)
class DomainEvent:
    occurred_at: float = field(default_factory=time.time)

@dataclass(frozen=True)
class FundsTransferredEvent(DomainEvent):
    sender_id: str
    recipient_id: str
    amount: float
    currency: str

@dataclass
class BankAccountEntity:
    account_id: str
    holder_name: str
    balance: Money

    def deposit(self, amount: Money):
        if amount.amount <= 0:
            raise ValueError("Deposit amount must be positive.")
        self.balance = self.balance + amount

    def withdraw(self, amount: Money):
        if amount.amount <= 0:
            raise ValueError("Withdrawal amount must be positive.")
        if amount.amount > self.balance.amount:
            raise ValueError(f"Insufficient funds! Account {self.account_id} has ${self.balance.amount:.2f}")
        self.balance = self.balance - amount

# =====================================================================
# 2. APPLICATION INTERFACES & PORTS (LAYER 2)
# =====================================================================

class AbstractAccountRepository(ABC):
    @abstractmethod
    def get(self, account_id: str) -> Optional[BankAccountEntity]: pass

    @abstractmethod
    def save(self, account: BankAccountEntity): pass

class AbstractUnitOfWork(ABC):
    accounts: AbstractAccountRepository

    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()

    @abstractmethod
    def commit(self): pass
    @abstractmethod
    def rollback(self): pass

# Event Bus Port
class DomainEventBus:
    _subscribers: dict[Type[DomainEvent], list[Callable]] = {}

    @classmethod
    def subscribe(cls, event_type: Type[DomainEvent], handler: Callable):
        if event_type not in cls._subscribers:
            cls._subscribers[event_type] = []
        cls._subscribers[event_type].append(handler)

    @classmethod
    def publish(cls, event: DomainEvent):
        for handler in cls._subscribers.get(type(event), []):
            handler(event)

# =====================================================================
# 3. USE CASE INTERACTOR (APPLICATION LAYER)
# =====================================================================

class TransferFundsUseCase:
    def __init__(self, uow: AbstractUnitOfWork):
        self.uow = uow

    def execute(self, from_acc_id: str, to_acc_id: str, amount_val: float, currency: str = "USD") -> dict:
        transfer_money = Money(amount_val, currency)

        with self.uow:
            sender = self.uow.accounts.get(from_acc_id)
            if not sender:
                raise KeyError(f"Sender account '{from_acc_id}' not found.")

            recipient = self.uow.accounts.get(to_acc_id)
            if not recipient:
                raise KeyError(f"Recipient account '{to_acc_id}' not found.")

            # Execute Domain Business Invariants
            sender.withdraw(transfer_money)
            recipient.deposit(transfer_money)

            self.uow.accounts.save(sender)
            self.uow.accounts.save(recipient)
            self.uow.commit()

        # Publish Domain Event for side effects
        DomainEventBus.publish(FundsTransferredEvent(from_acc_id, to_acc_id, amount_val, currency))

        return {
            "status": "SETTLED",
            "from": from_acc_id,
            "to": to_acc_id,
            "amount": amount_val,
            "sender_new_balance": sender.balance.amount,
            "recipient_new_balance": recipient.balance.amount
        }

# =====================================================================
# 4. INFRASTRUCTURE ADAPTERS (IN-MEMORY TEST REPOSITORIES)
# =====================================================================

class InMemoryAccountRepository(AbstractAccountRepository):
    def __init__(self):
        self._db: dict[str, BankAccountEntity] = {}

    def get(self, account_id: str) -> Optional[BankAccountEntity]:
        return self._db.get(account_id)

    def save(self, account: BankAccountEntity):
        self._db[account.account_id] = account

class InMemoryUnitOfWork(AbstractUnitOfWork):
    def __init__(self):
        self.accounts = InMemoryAccountRepository()
        self.committed = False

    def commit(self):
        self.committed = True

    def rollback(self):
        self.committed = False

# =====================================================================
# 5. VERIFICATION & RUNTIME EXECUTION
# =====================================================================

def audit_event_listener(event: FundsTransferredEvent):
    print(f"📝 [SECURITY AUDIT] Transferred ${event.amount:.2f} from {event.sender_id} -> {event.recipient_id}")

if __name__ == "__main__":
    border = "=" * 70
    print(border)
    print("      CLEAN ARCHITECTURE CORE BANKING LEDGER SERVICE")
    print(border)

    # 1. Wire Event Bus
    DomainEventBus.subscribe(FundsTransferredEvent, audit_event_listener)

    # 2. Setup In-Memory Unit of Work with initial seed data
    uow = InMemoryUnitOfWork()
    uow.accounts.save(BankAccountEntity("ACC-001", "Alice Corp", Money(1000.00)))
    uow.accounts.save(BankAccountEntity("ACC-002", "Bob Logistics", Money(250.00)))

    # 3. Instantiate Use Case
    transfer_service = TransferFundsUseCase(uow=uow)

    # 4. Execute Valid Transfer
    print("\n1. Executing Valid Transfer ($300.00):")
    res1 = transfer_service.execute("ACC-001", "ACC-002", 300.00)
    print("Use Case Output:", json.dumps(res1, indent=2))

    # 5. Test Business Invariant Violation (Overdraft Protection)
    print("\n2. Testing Overdraft Protection Invariant ($1,500.00):")
    try:
        transfer_service.execute("ACC-001", "ACC-002", 1500.00)
    except ValueError as err:
        print("  ✅ Business Invariant Guard Blocked Overdraft:", err)

    print("\n" + border)
    print("🎉 Clean Architecture Core Domain Verified in Under 10ms with Zero DB Dependencies!")
    print(border)
```

---

## Summary

In this lesson, you mastered Clean Architecture and Domain-Driven Design in Python:
- **Clean Architecture** enforces **The Dependency Rule**: source code dependencies must strictly point inward toward core business policies.
- **Domain Entities** contain enterprise business invariants, while **Value Objects** (`frozen=True`) are immutable and identified by their attributes.
- The **Repository Pattern** abstracts data persistence, allowing business logic to be tested with high-speed in-memory fakes.
- The **Unit of Work Pattern** coordinates atomic transaction commit and rollback boundaries.
- **Domain Events** decouple secondary side-effects (notifications, analytics) from core use cases.

---

## Best Practices Checklist

- [ ] Keep the Domain Layer 100% free of web framework and database imports.
- [ ] Use `@dataclass(frozen=True)` for Value Objects and standard `@dataclass` for Entities.
- [ ] Define abstract repository interfaces in the Application layer; implement them in Infrastructure.
- [ ] Wrap database transactions in a Unit of Work context manager.
- [ ] Decouple cross-cutting side-effects using Domain Events.

---

## What's Next?

Now that you understand Clean Architecture and DDD, continue to:
👉 **[Pythonic Design Patterns](design-patterns-in-python.md)** to master GoF design patterns reimagined in modern Python (Factory, Strategy, Observer, Adapter, and Builder)!
