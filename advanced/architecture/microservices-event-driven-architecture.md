# Microservices & Event-Driven Architecture in Python

## Introduction

As software systems grow in scale, monolithic applications face organizational and technical limits: deployment bottlenecks, single points of failure, and tight coupling.

To scale across hundreds of engineers and millions of users, enterprises adopt **Microservices** and **Event-Driven Architecture (EDA)**.

In an event-driven system, microservices do not communicate through tight, synchronous HTTP request chains (which cause cascading failures and high latency). Instead, services communicate asynchronously through immutable **Events** published to distributed message brokers like **Apache Kafka**, **RabbitMQ**, and **Redis Streams**.

However, distributed systems introduce fundamental challenges known as the **Fallacies of Distributed Computing** (the network is not reliable, latency is not zero, and bandwidth is not infinite).

To maintain data integrity and consistency across distributed databases without slow, fragile two-phase commit (2PC) locks, senior architects rely on three foundational design patterns:
1. **Event Sourcing**: Storing entity state as an immutable sequence of historical events rather than a single mutable database row.
2. **Command Query Responsibility Segregation (CQRS)**: Separating the write model (optimizing business invariants) from the read model (optimizing high-speed query projections).
3. **The Saga Pattern**: Managing distributed business transactions across multiple microservices using **Compensating Actions**.

This lesson concludes **Module 7: Software Architecture & Design Patterns**, exploring message broker paradigms, event sourcing mechanics, CQRS read projections, and distributed Saga orchestrators.

---

## Prerequisites

Before studying event-driven microservices, ensure you have:

- Completed [Clean Architecture & Domain-Driven Design](clean-architecture-and-ddd.md).
- Completed [Asynchronous Programming (AsyncIO)](../async/README.md).
- Understanding of distributed systems, message queues, and JSON serialization.

---

## Core Concept: The Event-Driven Microservice Ecosystem

```
                       EVENT-DRIVEN MICROSERVICE ARCHITECTURE

    Order Microservice                     Payment Microservice                Inventory Microservice
   ┌───────────────────────┐              ┌────────────────────────┐          ┌───────────────────────┐
   │ 1. Publishes:         │              │ 2. Listens to:         │          │ 3. Listens to:        │
   │    'OrderCreated'     │ ═══════════► │    'OrderCreated'      │ ═══════► │    'PaymentReceived'  │
   │ 4. Receives:          │              │    Publishes:          │          │    Reserves inventory │
   │    'InventoryReserved'│ ◄═══════════ │    'PaymentReceived'   │ ◄═══════ │    Publishes Event    │
   └───────────┬───────────┘              └───────────┬────────────┘          └───────────┬───────────┘
               │                                      │                                   │
               ▼                                      ▼                                   ▼
   ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
   │              DISTRIBUTED EVENT BROKER (Apache Kafka / RabbitMQ / Redis Streams)                  │
   └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Event-Driven Patterns

```python
from dataclasses import dataclass, field
from typing import List
import time
import json
import uuid

# 1. Immutable Domain Event Specification
@dataclass(frozen=True)
class Event:
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = field(default_factory=time.time)

@dataclass(frozen=True)
class OrderCreatedEvent(Event):
    order_id: str = ""
    customer_id: str = ""
    total_amount: float = 0.0

# 2. Event-Sourced Aggregate State Reconstruction
class BankAccountAggregate:
    def __init__(self, account_id: str):
        self.account_id = account_id
        self.balance = 0.0
        self.version = 0

    def apply_event(self, event: Event):
        """State is strictly reconstructed by applying past immutable events!"""
        if isinstance(event, AccountCreatedEvent):
            self.balance = event.initial_deposit
        elif isinstance(event, MoneyDepositedEvent):
            self.balance += event.amount
        elif isinstance(event, MoneyWithdrawnEvent):
            self.balance -= event.amount
        self.version += 1
```

---

## Detailed Explanation

### 1. Synchronous REST vs Asynchronous Event-Driven Architecture

- **Synchronous REST Chains (Anti-Pattern)**:
  $$\text{Client} \longrightarrow \text{Order Service} \xrightarrow{\text{HTTP}} \text{Payment Service} \xrightarrow{\text{HTTP}} \text{Inventory Service}$$
  - *Failure Cascade*: If the Inventory Service is slow or down, the Payment Service hangs, the Order Service times out, and the entire checkout crashes.
- **Asynchronous Event-Driven**:
  $$\text{Order Service} \xrightarrow{\text{Publish Event}} \text{Message Broker (Kafka)} \longrightarrow \text{Independent Consumer Services}$$
  - *Temporal Decoupling*: The Order Service publishes `OrderPlaced` in 2 milliseconds and returns success to the user. Downstream services consume the event at their own pace.

---

### 2. Event Sourcing Mechanics

In a traditional database, if a user deposits \$100 and withdraws \$40, the database row shows `balance = 60`. The history of *how* the balance became 60 is lost.

In **Event Sourcing**:
1. You **never mutate or delete records**.
2. All state changes are appended to an **Event Store** as an immutable event stream:
   - `Event 1: AccountCreated(initial=0)`
   - `Event 2: MoneyDeposited(amount=100)`
   - `Event 3: MoneyWithdrawn(amount=40)`
3. Current state is reconstructed by replaying the events:
   $$\text{Current State} = \sum_{i=1}^{N} \text{apply\_event}(\text{Event}_i)$$

---

### 3. The Distributed Saga Pattern (Managing Multi-Service Transactions)

Because microservices have isolated databases, a distributed transaction cannot use standard ACID database locks.

A **Saga** is a sequence of local transactions:
- **Step 1 (Order Service)**: Creates Order (`status=PENDING`). Publishes `OrderCreated`.
- **Step 2 (Payment Service)**: Charges credit card. Publishes `PaymentSuccessful`.
- **Step 3 (Inventory Service)**: Fails to reserve stock (Out of stock!). Publishes `InventoryFailed`.
- **Compensating Action**: The Saga triggers **Compensating Transactions** backwards:
  - Payment Service refunds credit card.
  - Order Service marks order as `CANCELLED`.

---

## Examples

### 1. Simple: Immutable Domain Events with JSON Serialization
Modeling enterprise domain events with timestamping and serialization.

```python
from dataclasses import dataclass, asdict, field
import json
import time
import uuid

@dataclass(frozen=True)
class BaseDomainEvent:
    event_type: str
    event_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    occurred_at: float = field(default_factory=time.time)

@dataclass(frozen=True)
class CustomerRegisteredEvent(BaseDomainEvent):
    customer_id: str = ""
    email: str = ""

event = CustomerRegisteredEvent(
    event_type="CustomerRegistered",
    customer_id="CUST-9901",
    email="lead_architect@enterprise.com"
)

event_json = json.dumps(asdict(event), indent=2)
print("Serialized Domain Event JSON:")
print(event_json)
```

### 2. Beginner: Event Sourcing State Reconstruction
Rebuilding an in-memory shopping cart aggregate purely by replaying an immutable event log.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class CartItemAdded:
    sku: str
    qty: int
    price: float

@dataclass(frozen=True)
class CartItemRemoved:
    sku: str

class ShoppingCartAggregate:
    def __init__(self, cart_id: str):
        self.cart_id = cart_id
        self.items: dict[str, int] = {}
        self.total_price = 0.0

    def apply(self, event):
        """Deterministic state transition function."""
        if isinstance(event, CartItemAdded):
            self.items[event.sku] = self.items.get(event.sku, 0) + event.qty
            self.total_price += (event.qty * event.price)
        elif isinstance(event, CartItemRemoved):
            if event.sku in self.items:
                del self.items[event.sku]

# Historical Event Stream (The Single Source of Truth)
event_history = [
    CartItemAdded("SKU-LAPTOP", 1, 1200.00),
    CartItemAdded("SKU-MOUSE", 2, 25.00),
    CartItemAdded("SKU-CABLE", 1, 15.00),
    CartItemRemoved("SKU-CABLE"), # User removed cable before checkout!
]

# Replay Events to reconstruct state
cart = ShoppingCartAggregate("CART-101")
for evt in event_history:
    cart.apply(evt)

print("Reconstructed Shopping Cart State:")
print(f"  • Items in Cart : {cart.items}")
print(f"  • Total Amount  : ${cart.total_price:,.2f}")
```

### 3. Intermediate: CQRS Read/Write Model Separation
Separating the Command Write Model from the Read Projection View.

```python
from dataclasses import dataclass
from typing import Optional

# Write Model (Command Handler)
class UserCommandService:
    def __init__(self, read_projection_store: dict):
        self._db = {}
        self._projection = read_projection_store

    def create_user(self, user_id: str, name: str, email: str):
        # 1. Enforce business validation
        if user_id in self._db: raise ValueError("User already exists.")
        
        # 2. Write to primary transactional write database
        self._db[user_id] = {"id": user_id, "name": name, "email": email, "version": 1}
        
        # 3. Synchronize Read Projection (e.g. Elasticsearch / Redis index)
        self._projection[user_id] = f"{name} ({email})"

# Read Model (Optimized High-Speed Query Projection)
class UserQueryService:
    def __init__(self, read_projection_store: dict):
        self._projection = read_projection_store

    def search_user_summary(self, user_id: str) -> Optional[str]:
        # Instant O(1) query read with zero table joins!
        return self._projection.get(user_id)

# Test CQRS Separation
shared_read_index = {}
command_svc = UserCommandService(shared_read_index)
query_svc = UserQueryService(shared_read_index)

command_svc.create_user("USR-101", "Hesam Pourabbasain", "hesam@domain.com")
print("Query Service Retrieved Projection:", query_svc.search_user_summary("USR-101"))
```

### 4. Real-World: Distributed Saga Orchestrator with Compensating Actions
Building a multi-service order placement Saga with automatic rollback on failure.

```python
from dataclasses import dataclass
from enum import Enum
import time

class SagaStepStatus(Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    COMPENSATED = "COMPENSATED"

class OrderFulfillmentSagaOrchestrator:
    def __init__(self):
        self.saga_log = []

    def execute_saga(self, order_id: str, amount: float, should_inventory_fail: bool = False) -> bool:
        print(f"🚀 [SAGA START] Initiating Saga for Order #{order_id} (${amount:,.2f})")

        # Step 1: Authorize Payment
        print("  1. [PaymentService] Authorizing credit card charge...")
        payment_success = True
        self.saga_log.append(("PAYMENT", payment_success))

        # Step 2: Reserve Warehouse Inventory
        print("  2. [InventoryService] Reserving stock in fulfillment center...")
        inventory_success = not should_inventory_fail
        self.saga_log.append(("INVENTORY", inventory_success))

        if not inventory_success:
            print("  🚨 [SAGA FAILED] Inventory out of stock! Initiating COMPENSATING TRANSACTIONS...")
            self._compensate()
            return False

        # Step 3: Dispatch Shipping Carrier
        print("  3. [ShippingService] Booking courier delivery...")
        print("✅ [SAGA SUCCESS] Order fulfilled successfully!")
        return True

    def _compensate(self):
        """Executes compensating actions in reverse order."""
        for step, success in reversed(self.saga_log):
            if step == "PAYMENT" and success:
                print("  🔄 [COMPENSATION] Refunding credit card charge on PaymentService...")
            elif step == "INVENTORY" and success:
                print("  🔄 [COMPENSATION] Releasing reserved warehouse inventory...")

# Test 1: Successful Saga
orchestrator = OrderFulfillmentSagaOrchestrator()
orchestrator.execute_saga("ORD-9901", 450.00, should_inventory_fail=False)

# Test 2: Failed Saga (Triggers Compensation Rollback)
print("\n" + "-" * 60)
orchestrator = OrderFulfillmentSagaOrchestrator()
orchestrator.execute_saga("ORD-9902", 1200.00, should_inventory_fail=True)
```

### 5. Advanced: Idempotent Event Consumer
Ensuring that re-delivered duplicate messages do not cause duplicate executions.

```python
import hashlib

class IdempotentEventConsumer:
    """Ensures at-least-once message delivery does not trigger duplicate mutations."""
    def __init__(self):
        self._processed_message_ids = set()
        self.account_balance = 1000.0

    def handle_payment_event(self, message_id: str, amount: float) -> bool:
        # Idempotency Guard Check
        if message_id in self._processed_message_ids:
            print(f"⚠️ [DUPLICATE IGNORED] Message '{message_id}' already processed. Skipping.")
            return False

        # Execute Business Mutation
        self.account_balance += amount
        self._processed_message_ids.add(message_id)
        print(f"✅ [PROCESSED] Handled message '{message_id}'. New Balance: ${self.account_balance:,.2f}")
        return True

consumer = IdempotentEventConsumer()

# Simulate Network Retries (Message delivered twice by Kafka)
msg_id = "MSG-UUID-889900"
consumer.handle_payment_event(msg_id, 250.00) # Processed
consumer.handle_payment_event(msg_id, 250.00) # Safely ignored!
```

---

## Code Explanation

In Example 4 (`Saga Orchestrator`):
1. In distributed microservices, a single business transaction spans multiple independent databases (Payment DB, Warehouse DB, Shipping DB).
2. The **Saga Orchestrator** manages the workflow state machine.
3. If Step 2 (Inventory) fails, standard database `ROLLBACK` cannot undo the credit card charge in Step 1.
4. The Saga triggers a **Compensating Action** (`RefundCharge`), semantically reversing the effects of the committed Step 1 transaction and restoring distributed consistency.

---

## Common Mistakes

### Mistake 1: Treating Microservices as a "Distributed Monolith"
Building microservices that make cascading synchronous REST HTTP calls to one another. If one service experiences high latency, all upstream services fail (**Cascading Outage**). Always prefer **Asynchronous Event Publishing**.

### Mistake 2: Missing Idempotency in Event Consumers
Assuming that message brokers deliver messages "exactly once". In real-world networks, brokers guarantee **At-Least-Once Delivery**. Consumers that do not track processed message IDs will double-charge customers on network retries!

---

## Best Practices

### The Transactional Outbox Pattern
Never save data to your local database and publish a message to Kafka in two separate uncoordinated steps. If the database commit succeeds but the network drops before Kafka publishing, data is permanently lost (**Dual-Write Bug**).
- **The Fix**: Save the event directly into an `outbox` table in the *same local database transaction*, and use a background relay (like Debezium) to publish it to Kafka reliably.

---

## Performance Considerations

- **Asynchronous Throughput**: Event-driven services respond to incoming requests in **$< 5\text{ ms}$**, offloading heavy downstream processing to asynchronous worker queues that scale independently.

---

## Security Considerations

1. **Mutual TLS (mTLS)**: Enforce mutual cryptographic certificate verification for all service-to-service communication within the Kubernetes service mesh.
2. **Payload Encryption**: Encrypt sensitive event payloads in Kafka topics to prevent eavesdropping across shared broker infrastructure.

---

## Real-World Usage

- **Uber**: Distributed trip state machine tracking driver dispatching and rider billing.
- **Netflix**: Processing trillions of telemetry and playback events daily with Apache Kafka.
- **Amazon**: Asynchronous order fulfillment and inventory reservation Sagas.

---

## Comparison: Architecture Styles

| Dimension | Monolith | REST Microservices | Event-Driven Microservices |
|---|---|---|---|
| **Coupling** | Monolithic (In-Process) | Temporal Coupling (Sync HTTP) | **Loose (Asynchronous Events)** |
| **Failure Mode** | Whole app crashes | Cascading timeouts | **Isolated (Queues buffer work)** |
| **Consistency** | Immediate ACID | Difficult | **Eventual Consistency (Sagas)** |
| **Scalability** | Scale whole app | Scale individual services | **Infinite horizontal scaling** |

---

## Advanced Concepts: Change Data Capture (CDC) with Debezium

**Change Data Capture (CDC)** connects directly to PostgreSQL's Write-Ahead Log (WAL), automatically streaming database row mutations (`INSERT`, `UPDATE`, `DELETE`) into Apache Kafka topics in real time with zero application-level dual-write bugs.

---

## Exercises

### Exercise 1 — Beginner
Build a simple `EventStore` class that appends immutable `UserRegisteredEvent` and `UserEmailUpdatedEvent` instances and provides a `.get_events_for_user(uid)` method.

### Exercise 2 — Intermediate
Build an Event-Sourced `InventoryItemAggregate` with `StockReceivedEvent` and `StockDispatchedEvent` that reconstructs current warehouse inventory on demand.

### Exercise 3 — Advanced
Build a `ChoreographedSagaSimulation` where 3 microservices listen to a shared `EventBus` and publish events in a chain reaction, demonstrating automatic compensation if the final service rejects the transaction.

---

## Mini Project: Enterprise Distributed Event-Sourced Order Processing & Saga Orchestrator Engine

### Requirements
Build an operational distributed architecture suite named `event_driven_saga_engine.py`. Implement an immutable Event Sourcing event store, CQRS read projection builders, an automated Saga Orchestrator coordinating order payment and inventory reservations with compensating rollback actions, and render an audit trace log.

### Implementation Blueprint
```python
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional
import time
import json
import uuid

# =====================================================================
# 1. IMMUTABLE DOMAIN EVENTS (EVENT SOURCING)
# =====================================================================

@dataclass(frozen=True)
class DomainEvent:
    event_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    occurred_at: float = field(default_factory=time.time)

@dataclass(frozen=True)
class OrderPlacedEvent(DomainEvent):
    order_id: str = ""
    customer_id: str = ""
    amount: float = 0.0

@dataclass(frozen=True)
class PaymentAuthorizedEvent(DomainEvent):
    order_id: str = ""
    payment_id: str = ""

@dataclass(frozen=True)
class InventoryAllocationFailedEvent(DomainEvent):
    order_id: str = ""
    reason: str = ""

@dataclass(frozen=True)
class PaymentRefundedEvent(DomainEvent):
    order_id: str = ""
    refund_id: str = ""

# =====================================================================
# 2. EVENT STORE & CQRS READ PROJECTION
# =====================================================================

class EventStore:
    def __init__(self):
        self._history: list[DomainEvent] = []

    def append(self, event: DomainEvent):
        self._history.append(event)
        print(f"  📜 [EVENT STORE APPEND] {type(event).__name__} (ID: {event.event_id})")

    def get_events_for_order(self, order_id: str) -> list[DomainEvent]:
        return [e for e in self._history if getattr(e, "order_id", None) == order_id]

# CQRS Materialized Read View
class OrderSummaryReadProjection:
    def __init__(self):
        self._summaries: dict[str, dict] = {}

    def project_event(self, event: DomainEvent):
        order_id = getattr(event, "order_id", None)
        if not order_id: return

        if isinstance(event, OrderPlacedEvent):
            self._summaries[order_id] = {
                "order_id": order_id,
                "customer": event.customer_id,
                "amount": event.amount,
                "status": "PLACED"
            }
        elif isinstance(event, PaymentAuthorizedEvent):
            self._summaries[order_id]["status"] = "PAID"
        elif isinstance(event, InventoryAllocationFailedEvent):
            self._summaries[order_id]["status"] = "INVENTORY_OUT_OF_STOCK"
        elif isinstance(event, PaymentRefundedEvent):
            self._summaries[order_id]["status"] = "CANCELLED_AND_REFUNDED"

    def get_summary(self, order_id: str) -> Optional[dict]:
        return self._summaries.get(order_id)

# =====================================================================
# 3. DISTRIBUTED SAGA ORCHESTRATOR
# =====================================================================

class DistributedOrderSagaOrchestrator:
    def __init__(self, event_store: EventStore, read_projection: OrderSummaryReadProjection):
        self.event_store = event_store
        self.read_projection = read_projection

    def _record_and_project(self, event: DomainEvent):
        self.event_store.append(event)
        self.read_projection.project_event(event)

    def process_order_checkout(self, order_id: str, customer_id: str, amount: float, stock_available: bool) -> dict:
        print(f"\n🚀 [SAGA INITIATED] Order #{order_id} for {customer_id} (${amount:,.2f})")

        # Step 1: Place Order
        self._record_and_project(OrderPlacedEvent(order_id=order_id, customer_id=customer_id, amount=amount))

        # Step 2: Authorize Payment
        payment_id = f"PAY-{uuid.uuid4().hex[:6]}"
        self._record_and_project(PaymentAuthorizedEvent(order_id=order_id, payment_id=payment_id))

        # Step 3: Allocate Inventory
        if not stock_available:
            # Inventory Failure!
            self._record_and_project(InventoryAllocationFailedEvent(order_id=order_id, reason="SKU Exhausted"))
            
            # Trigger Compensating Action (Refund Payment)
            refund_id = f"REF-{uuid.uuid4().hex[:6]}"
            print("  🔄 [COMPENSATING ACTION] Executing PaymentService Refund...")
            self._record_and_project(PaymentRefundedEvent(order_id=order_id, refund_id=refund_id))
            print("🛑 [SAGA TERMINATED] Order cancelled cleanly with zero data corruption.")
        else:
            print("🎉 [SAGA COMPLETED] All distributed transactions committed successfully!")

        return self.read_projection.get_summary(order_id)

# =====================================================================
# 4. VERIFICATION & RUNTIME AUDIT
# =====================================================================

def run_distributed_saga_suite():
    border = "=" * 70
    print(border)
    print("      ENTERPRISE EVENT-SOURCED SAGA ORCHESTRATION ENGINE")
    print(border)

    event_store = EventStore()
    read_view = OrderSummaryReadProjection()
    saga_engine = DistributedOrderSagaOrchestrator(event_store, read_view)

    # 1. Test Successful Saga
    res1 = saga_engine.process_order_checkout("ORD-101", "CUST-ALICE", 250.00, stock_available=True)
    print("\nCQRS Read Model Output:", json.dumps(res1, indent=2))

    # 2. Test Failed Saga with Compensating Rollback
    print("-" * 70)
    res2 = saga_engine.process_order_checkout("ORD-102", "CUST-BOB", 1450.00, stock_available=False)
    print("\nCQRS Read Model Output:", json.dumps(res2, indent=2))

    # 3. Inspect Complete Event Sourcing Audit History for Failed Order
    print("\n" + "-" * 70)
    print(f"📜 COMPLETE EVENT SOURCING AUDIT TRAIL FOR ORD-102:")
    print("-" * 70)
    for evt in event_store.get_events_for_order("ORD-102"):
        print(f"  • {evt.occurred_at:.4f} │ {type(evt).__name__:<30} │ ID: {evt.event_id}")

    print("\n" + border)
    print("🎉 Distributed Saga Orchestration & Event Sourcing Architecture Verified!")
    print(border)

if __name__ == "__main__":
    run_distributed_saga_suite()
```

---

## Summary

In this lesson, you mastered Microservices and Event-Driven Architecture in Python:
- **Event-Driven Architecture** decouples services asynchronously via message brokers (Kafka/RabbitMQ), eliminating cascading HTTP failures.
- **Event Sourcing** stores all business mutations as an immutable stream of historical events, enabling deterministic state reconstruction and complete auditability.
- **CQRS** separates the transactional Write Model from denormalized, high-speed Read Projections.
- The **Saga Pattern** manages distributed transactions across microservices using **Compensating Actions** to maintain eventual consistency without slow two-phase commit locks.
- Design all consumers to be **Idempotent** to safely handle at-least-once message delivery.

---

## Best Practices Checklist

- [ ] Prefer asynchronous event-driven messaging over deep synchronous HTTP chains.
- [ ] Implement Idempotency Keys on all message consumers.
- [ ] Use the Transactional Outbox Pattern to eliminate dual-write bugs.
- [ ] Use Saga Orchestration for complex multi-step distributed workflows.
- [ ] Store domain events as immutable dataclasses.

---

## 🏆 MODULE 7: SOFTWARE ARCHITECTURE COMPLETE!

Congratulations! You have completed all 3 comprehensive articles of **Module 7: Software Architecture & Design Patterns**.

### What's Next?
Now advance to **Module 8: DevOps, Containerization & Observability**:
👉 **[DevOps & Observability Module Overview](../devops/README.md)** to master Multi-Stage Docker builds, GitHub Actions CI/CD, and OpenTelemetry Distributed Tracing!
