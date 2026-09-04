# Generics & TypeVar in Python

## Introduction

In software engineering, you frequently write algorithms, data structures, and repositories that operate identically across multiple different data types. For example:
- A `Stack` data structure can store integers, strings, or complex user models.
- A `Repository` can query and persist `UserEntity`, `ProductEntity`, or `InvoiceEntity`.
- A caching utility can store any key-value pair `(K, V)`.

If you write these components using **`Any`**, you destroy static type safety:

```python
# The Flawed Approach Using 'Any':
def get_first_item(items: list[Any]) -> Any:
    return items[0]

# Mypy loses all type tracking:
val = get_first_item(["Apple", "Banana"]) # Type of 'val' is Any, NOT str!
```

To solve this, Python provides **Generics** and **`TypeVar`** (PEP 484, expanded in PEP 695).

A **Type Variable (`TypeVar`)** acts as a type-level placeholder that preserves relationships between function inputs and outputs. When you pass a `list[str]` into a generic function, static type checkers track that `T = str` and guarantee that the return value is strictly `str`.

This lesson explores generic functions, generic classes (`Generic[T]`), bounded type constraints, covariance, contravariance, and modern **Python 3.12+ PEP 695 syntax**.

---

## Prerequisites

Before studying generics, ensure you have:

- Completed [Type Hints & Modern Syntax](type-hints-basics.md).
- Completed [Classes & Objects](../oop/classes-and-objects.md) and [Inheritance](../oop/inheritance-and-polymorphism.md).
- Familiarity with static type analysis concepts.

---

## Core Concept: TypeVar Preservation vs Any

```
                           TYPE PRESERVATION: TypeVar vs Any

       USING Any (Type Information Lost!)            USING TypeVar (Type Preserved!)
     ┌────────────────────────────────────┐        ┌────────────────────────────────────┐
     │ def pop(items: list[Any]) -> Any:  │        │ T = TypeVar('T')                   │
     │     return items.pop()             │        │ def pop(items: list[T]) -> T:      │
     │                                    │        │     return items.pop()             │
     │ # items: list[str]                 │        │                                    │
     │ item = pop(items)                  │        │ # items: list[str]                 │
     │ # Type of item: Any (Blind!) ❌    │        │ item = pop(items)                  │
     └────────────────────────────────────┘        │ # Type of item: str (Tracked!) ✅  │
                                                   └────────────────────────────────────┘
```

---

## Syntax & Essential Generic Patterns

```python
from __future__ import annotations
from typing import TypeVar, Generic

# 1. Defining Type Variables
T = TypeVar("T")            # Unconstrained TypeVar
K = TypeVar("K")            # Key TypeVar
V = TypeVar("V")            # Value TypeVar

# 2. Generic Function with Type Preservation
def get_first_element(items: list[T]) -> T:
    if not items:
        raise IndexError("Cannot fetch from empty list.")
    return items[0]

first_name = get_first_element(["Hesam", "Sarah"])  # Mypy knows: str!
first_num  = get_first_element([10, 20, 30])         # Mypy knows: int!

# 3. Generic Data Structure Class
class GenericStack(Generic[T]):
    def __init__(self):
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> T | None:
        return self._items[-1] if self._items else None

# Instantiate typed generic stacks
str_stack: GenericStack[str] = GenericStack()
str_stack.push("Alpha")
# str_stack.push(99)  # Mypy Static Type Error! ❌ (Expected str, got int)

# 4. Modern Python 3.12+ PEP 695 Native Generic Syntax
# (No TypeVar import required!)
# class ModernStack[T]:
#     def push(self, item: T) -> None: ...
```

---

## Detailed Explanation

### 1. Bounded vs Constrained Type Variables

You can constrain what types a `TypeVar` is allowed to represent:

#### A. Bounded Generics (`bound=BaseClass`):
Allows any class that is a subclass of `BaseClass`. Crucially, it allows accessing methods defined on `BaseClass` with full static type safety:

```python
class BaseEntity:
    def __init__(self, entity_id: str):
        self.entity_id = entity_id

# T must be BaseEntity or any subclass of BaseEntity!
EntityType = TypeVar("EntityType", bound=BaseEntity)

def get_entity_id(entity: EntityType) -> str:
    # Mypy allows accessing .entity_id safely!
    return entity.entity_id
```

#### B. Constrained Generics (`TypeVar('T', int, float, str)`):
Restricts `T` to strictly match one of the exact specified types (no other subtypes allowed):

```python
# T can ONLY be int or float (Strict numeric constraint)
Number = TypeVar("Number", int, float)

def double_val(val: Number) -> Number:
    return val * 2
```

---

### 2. Variance: Invariance, Covariance, and Contravariance

Variance describes how subtyping between complex types relates to subtyping between their component types:

#### 1. Invariant (Default: `list[T]`):
If `Dog` is a subtype of `Animal`, **`list[Dog]` is NOT a subtype of `list[Animal]`**.
- *Why?* Because if a function accepts `list[Animal]`, it could insert a `Cat` into your `list[Dog]`, corrupting your dog list at runtime! Mutable containers must be invariant.

#### 2. Covariant (`TypeVar('T', covariant=True)`):
If `Dog` is a subtype of `Animal`, **`Sequence[Dog]` IS a subtype of `Sequence[Animal]`**.
- *Why?* Because `Sequence` is read-only (immutable)! Reading an item from a `Sequence[Dog]` always produces an `Animal`.

#### 3. Contravariant (`TypeVar('T', contravariant=True)`):
Reverses the subtyping direction. Used for consumers and callback handlers (`Callable[[T], None]`).

```python
from typing import TypeVar, Generic

T_co = TypeVar("T_co", covariant=True)     # For Read-Only Producers
T_contra = TypeVar("T_contra", contravariant=True) # For Write-Only Consumers

class ReadOnlyStream(Generic[T_co]):
    def read_next(self) -> T_co: ...
```

---

## Examples

### 1. Simple: Generic Pair / 2-Tuple Container
Building a generic two-element container preserving distinct types for each element.

```python
from typing import TypeVar, Generic

T1 = TypeVar("T1")
T2 = TypeVar("T2")

class Pair(Generic[T1, T2]):
    def __init__(self, first: T1, second: T2):
        self.first: T1 = first
        self.second: T2 = second

    def __repr__(self) -> str:
        return f"Pair({self.first!r}, {self.second!r})"

pair = Pair("User_101", 99.5)
print("Pair Representation:", pair)
print(f"First (str) : {pair.first.upper()}")
print(f"Second (num): {pair.second * 2}")
```

### 2. Beginner: Generic Queue Data Structure with Bounded Sizes
Building a thread-safe generic queue preserving element types.

```python
from typing import TypeVar, Generic
from collections import deque

T = TypeVar("T")

class TypedQueue(Generic[T]):
    def __init__(self, max_capacity: int = 100):
        self._queue: deque[T] = deque(maxlen=max_capacity)

    def push(self, item: T) -> None:
        self._queue.append(item)

    def pop(self) -> T:
        if not self._queue:
            raise IndexError("Queue is empty.")
        return self._queue.popleft()

    def __len__(self) -> int:
        return len(self._queue)

q: TypedQueue[int] = TypedQueue()
q.push(10)
q.push(20)
print(f"Popped item: {q.pop()} (Remaining length: {len(q)})")
```

### 3. Intermediate: Generic Database Repository with `bound=BaseEntity`
Building a data access repository that works across any domain entity inheriting from `BaseEntity`.

```python
from typing import TypeVar, Generic

class BaseEntity:
    def __init__(self, id: str):
        self.id = id

class UserEntity(BaseEntity):
    def __init__(self, id: str, email: str):
        super().__init__(id)
        self.email = email

class ProductEntity(BaseEntity):
    def __init__(self, id: str, price: float):
        super().__init__(id)
        self.price = price

# Generic bounded repository
E = TypeVar("E", bound=BaseEntity)

class InMemoryRepository(Generic[E]):
    def __init__(self):
        self._store: dict[str, E] = {}

    def save(self, entity: E) -> None:
        self._store[entity.id] = entity
        print(f"💾 Saved {entity.__class__.__name__} with ID: {entity.id}")

    def find_by_id(self, entity_id: str) -> E | None:
        return self._store.get(entity_id)

user_repo: InMemoryRepository[UserEntity] = InMemoryRepository()
user_repo.save(UserEntity("USR-101", "hesam@domain.com"))

retrieved_user = user_repo.find_by_id("USR-101")
if retrieved_user:
    print(f"Retrieved User Email: {retrieved_user.email}")
```

### 4. Real-World: Generic Multi-Tiered Cache Store (`K, V`)
Building a generic cache mapping arbitrary key types to value types with TTL expiration.

```python
from typing import TypeVar, Generic
import time

K = TypeVar("K")
V = TypeVar("V")

class TTLCache(Generic[K, V]):
    def __init__(self, default_ttl_sec: float = 60.0):
        self._cache: dict[K, tuple[float, V]] = {}
        self._ttl = default_ttl_sec

    def set(self, key: K, value: V) -> None:
        self._cache[key] = (time.time(), value)

    def get(self, key: K) -> V | None:
        if key not in self._cache:
            return None
        created_at, val = self._cache[key]
        if time.time() - created_at > self._ttl:
            del self._cache[key]
            return None
        return val

# Typed session cache: string session_id -> dictionary profile
session_cache: TTLCache[str, dict[str, str]] = TTLCache(default_ttl_sec=2.0)
session_cache.set("sess_abc123", {"user": "hesamp", "role": "admin"})

print("Active Session:", session_cache.get("sess_abc123"))
```

### 5. Advanced: Covariant Read-Only Event Stream Producer
Demonstrating covariance where a stream of `ManagerEvent` is safely substitutable as a stream of `BaseEvent`.

```python
from typing import TypeVar, Generic

class BaseEvent:
    def __init__(self, topic: str): self.topic = topic

class SecurityAlertEvent(BaseEvent):
    def __init__(self, topic: str, threat: str):
        super().__init__(topic)
        self.threat = threat

# Covariant TypeVar (Read-Only Producer)
Event_co = TypeVar("Event_co", bound=BaseEvent, covariant=True)

class EventStream(Generic[Event_co]):
    def __init__(self, events: list[Event_co]):
        self._events = list(events)

    def next_event(self) -> Event_co:
        return self._events.pop(0)

def consume_event_stream(stream: EventStream[BaseEvent]):
    event = stream.next_event()
    print(f"Consumed Base Event on Topic: '{event.topic}'")

# Because EventStream is COVARIANT, EventStream[SecurityAlertEvent]
# is accepted where EventStream[BaseEvent] is expected!
sec_stream: EventStream[SecurityAlertEvent] = EventStream([
    SecurityAlertEvent("auth.failed", "BRUTE_FORCE_ATTACK")
])

consume_event_stream(sec_stream)  # Valid type-safe substitution! ✅
```

---

## Code Explanation

In Example 5 (Covariance):
1. `Event_co = TypeVar("Event_co", bound=BaseEvent, covariant=True)` informs static type checkers that `EventStream` is a **pure producer** (it only outputs `Event_co`, never takes `Event_co` as a mutating input argument).
2. Because `SecurityAlertEvent` is a subclass of `BaseEvent`, covariance guarantees that `EventStream[SecurityAlertEvent]` is a valid subtype of `EventStream[BaseEvent]`.
3. If `EventStream` were mutable (e.g. had an `.append(event: Event_co)` method), static type checkers would reject covariance to prevent mutating the stream with invalid subtypes.

---

## Common Mistakes

### Mistake 1: Re-Declaring `TypeVar` Inside Function Bodies
Always declare `TypeVar` at the **module level** (top of file). Re-instantiating `T = TypeVar("T")` inside a function body prevents `mypy` from correlating type parameters correctly.

### Mistake 2: Confusing `bound=X` with Union Constraints
- `TypeVar('T', bound=Animal)`: Allows `Animal`, `Dog`, `Cat`, or any custom subclass created anywhere.
- `TypeVar('T', Dog, Cat)`: Restricts `T` strictly to `Dog` or `Cat` only.

---

## Best Practices

### Use Generics Whenever a Function Returns the Same Type it Receives
If a function returns an element extracted or transformed from its input, use `TypeVar` rather than `Any` or a broad base class.

Good:
```python
T = TypeVar("T")
def clone_entity(entity: T) -> T: ...
```

Avoid:
```python
def clone_entity(entity: object) -> object: ... # Return type loses specificity!
```

---

## Performance Considerations

1. **Zero Runtime Overhead**: `Generic[T]` and `TypeVar` are purely compile-time constructs. Python's runtime ignores type arguments during execution (`GenericStack[int]()` instantiates a standard Python class in ~$100\text{ nanoseconds}$).

---

## Security Considerations

1. **Type Safety at System Boundaries**: Remember that static generics do not prevent an untyped external script from pushing an invalid type into a generic container at runtime. Combine generic interfaces with runtime validation at external API entry points.

---

## Real-World Usage

- **FastAPI Dependency Injection**: `Depends()` utilizing generic return types.
- **SQLAlchemy 2.0 Repositories**: Generic CRUD repositories `CRUDRepository[UserModel]`.
- **Standard Library `collections.abc`**: `Sequence[T]`, `Mapping[K, V]`, `Iterable[T]`.

---

## Comparison: Generics vs Other Typing Primitives

| Feature | `Any` | `Union[A, B]` | `TypeVar` (`Generic`) |
|---|---|---|---|
| **Type Safety** | ❌ None (Blind) | High | **Maximum (Correlated)** |
| **Input/Output Linking**| No | No | **Yes (Input type dictates output type)**|
| **Subclass Flexibility**| Infinite | Rigid (Only listed types) | **Flexible (`bound=Base`)** |
| **Best Used For** | Dynamic interop | Fixed alternative types | **Reusable containers, Algorithms, Repositories**|

---

## Advanced Concepts: Python 3.12+ PEP 695 Generics Syntax

In Python 3.12+, you can define generic classes and functions directly without importing `TypeVar` or `Generic`:

```python
# Python 3.12+ Native Generics (PEP 695):
# def get_first[T](items: list[T]) -> T:
#     return items[0]

# class Box[T]:
#     def __init__(self, value: T):
#         self.value: T = value
```

---

## Exercises

### Exercise 1 — Beginner
Write a generic function `reverse_list(items: list[T]) -> list[T]` that returns a new list with elements in reverse order, preserving the generic element type.

### Exercise 2 — Intermediate
Create a generic `Result[T, E]` class (representing either success with value of type `T` or failure with error of type `E`). Implement `.is_success() -> bool`, `.unwrap() -> T`, and `.unwrap_err() -> E`.

### Exercise 3 — Advanced
Build a generic `Pipeline[InType, OutType]` class with a method `.then(step: Callable[[OutType], NextType]) -> Pipeline[InType, NextType]` that allows chaining type-safe data transformations with full static type propagation.

---

## Mini Project: Enterprise Generic Repository & Unit-of-Work Engine

### Requirements
Build an extensible data access layer named `generic_unit_of_work.py`. Define a base `Entity` class, a generic `GenericRepository[T]` interface with CRUD operations, specialized entities (`User`, `Invoice`), and an orchestrating `UnitOfWork` manager preserving type signatures.

### Implementation Blueprint
```python
from __future__ import annotations
from typing import TypeVar, Generic
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. BASE & DOMAIN ENTITIES
# =====================================================================

@dataclass
class BaseEntity:
    id: str
    created_at: str

@dataclass
class UserAccount(BaseEntity):
    username: str
    email: str
    is_active: bool = True

@dataclass
class CommercialOrder(BaseEntity):
    customer_id: str
    total_amount: float
    status: str = "PENDING"

# =====================================================================
# 2. GENERIC BOUNDED REPOSITORY
# =====================================================================

T_Entity = TypeVar("T_Entity", bound=BaseEntity)

class GenericRepository(Generic[T_Entity]):
    """Type-safe in-memory CRUD repository for arbitrary BaseEntity models."""

    def __init__(self, entity_name: str):
        self.entity_name = entity_name
        self._table: dict[str, T_Entity] = {}

    def insert(self, entity: T_Entity) -> T_Entity:
        if entity.id in self._table:
            raise KeyError(f"Entity with ID '{entity.id}' already exists in {self.entity_name}.")
        self._table[entity.id] = entity
        print(f"💾 [{self.entity_name}] Inserted #{entity.id}")
        return entity

    def get_by_id(self, entity_id: str) -> T_Entity | None:
        return self._table.get(entity_id)

    def list_all(self) -> list[T_Entity]:
        return list(self._table.values())

    def delete(self, entity_id: str) -> bool:
        return self._table.pop(entity_id, None) is not None

# =====================================================================
# 3. TYPED UNIT-OF-WORK ORCHESTRATOR
# =====================================================================

class UnitOfWork:
    def __init__(self):
        # Strongly typed repository instances!
        self.users: GenericRepository[UserAccount] = GenericRepository("Users")
        self.orders: GenericRepository[CommercialOrder] = GenericRepository("Orders")

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE GENERIC REPOSITORY & UNIT-OF-WORK")
    print("=" * 65)
    
    uow = UnitOfWork()
    now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    
    # 1. Insert Strongly Typed Entities
    user = uow.users.insert(UserAccount(id="USR-001", created_at=now_ts, username="hesamp", email="hesam@domain.com"))
    order1 = uow.orders.insert(CommercialOrder(id="ORD-101", created_at=now_ts, customer_id="USR-001", total_amount=1450.00))
    order2 = uow.orders.insert(CommercialOrder(id="ORD-102", created_at=now_ts, customer_id="USR-001", total_amount=250.00))
    
    # 2. Type-Safe Queries
    fetched_user = uow.users.get_by_id("USR-001")
    if fetched_user:
        # Mypy knows fetched_user has .email and .username!
        print(f"\n👤 Queried User: {fetched_user.username} <{fetched_user.email}>")
        
    print("\n📦 Active Orders in Repository:")
    for o in uow.orders.list_all():
        print(f"  • Order #{o.id} | Customer: {o.customer_id} | Amount: ${o.total_amount:,.2f}")
        
    print("\n" + "=" * 65)
```

---

## Summary

In this lesson, you mastered Generics and `TypeVar`:
- **`TypeVar`** preserves type relationships between function parameters and return values.
- Generic classes inherit from **`Generic[T]`** or **`Generic[K, V]`**.
- Use **`bound=BaseClass`** to constrain type variables to a class hierarchy while accessing base attributes safely.
- **Invariance** protects mutable collections (`list[T]`); **Covariance (`covariant=True`)** enables subtype substitution on immutable read-only producers (`Sequence[T]`).
- Python 3.12+ introduces native type parameter syntax (`def func[T](x: T) -> T:`).
- Generics eliminate `Any`, catching subtle type bugs at compile time without runtime overhead.

---

## Best Practices Checklist

- [ ] Declare `TypeVar` at the module level.
- [ ] Use `bound=BaseClass` when generic methods need to access base class attributes.
- [ ] Use `covariant=True` for read-only producer containers.
- [ ] Replace `Any` with `TypeVar` whenever input types dictate return types.
- [ ] Type-annotate generic class instantiations (`stack: GenericStack[str] = GenericStack()`).

---

## What's Next?

Now that you understand Generics and `TypeVar`, continue to:
👉 **[Structural Subtyping with `typing.Protocol`](typing-protocols-and-duck-typing.md)** to master static duck typing, compile-time interfaces without inheritance, and `@runtime_checkable`!
