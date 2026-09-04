# Mutable vs Immutable Objects in Python

## Introduction

In Python, every entity is an object residing in heap memory. However, not all objects behave identically when subjected to operations. One of the most fundamental, architecturally significant distinctions in the Python language is the division between **Mutable** and **Immutable** objects.

Understanding mutability is arguably the single most critical mental model required to avoid subtle, elusive software defects. Misunderstanding object mutability is the root cause of countless classic bugs: functions inadvertently modifying data owned by their callers, unexpected state corruption across concurrent threads, dictionary lookup failures, and the infamous "mutable default argument" trap.

When an object is **mutable**, its internal state, attributes, or elements can be modified in place without altering its physical identity (memory address). When an object is **immutable**, its state is permanently frozen at the moment of instantiation; any operation that appears to alter an immutable object actually creates a brand-new object elsewhere in memory.

This lesson concludes **Module 2: Variables & Data Types**, synthesizing what you have learned about memory references, object identity, and types to provide a complete understanding of Python's memory architecture.

---

## Prerequisites

Before studying mutability, ensure you have:

- Completed [Variables & Memory Binding](variables.md), [Dynamic Typing](dynamic-typing.md), and [Strings Fundamentals](strings.md).
- A solid grasp of the `id()` function and the identity operator `is`.
- Familiarity with passing variables into functions.

---

## Core Concept

Python strictly partitions all built-in types into two categories:

```
                           PYTHON OBJECT MUTABILITY TAXONOMY

                 IMMUTABLE TYPES                             MUTABLE TYPES
      (State cannot change after creation)         (State can be modified in place)
    +------------------------------------+       +------------------------------------+
    • Numeric: int, float, complex       |       • Sequences: list, bytearray         |
    • Text & Binary: str, bytes          |       • Sets: set                          |
    • Sequences: tuple                   |       • Mappings: dict                     |
    • Sets: frozenset                    |       • Custom Classes (default instances) |
    • Singletons: bool, NoneType         |                                            |
    +------------------------------------+       +------------------------------------+
```

### In-Place Mutation vs Re-binding
- **Mutation (Mutable objects)**: Modifying elements modifies the existing object in place. The memory address (`id()`) remains completely unchanged.
- **Re-binding (Immutable objects)**: Performing an operation allocates a new object with a new memory address and re-binds the variable identifier to that new address.

---

## Syntax & Memory Address Inspection

```python
# 1. Demonstrating Immutability (Integer)
x = 100
initial_id = id(x)
x += 1  # Re-binds x to a NEW integer object (101)
print(f"Integer ID changed: {initial_id != id(x)}")  # True (New Object!)

# 2. Demonstrating Mutability (List)
items = [1, 2, 3]
initial_list_id = id(items)
items.append(4)  # Modifies existing list IN PLACE
print(f"List ID unchanged   : {initial_list_id == id(items)}")  # True (Same Object!)

# 3. Shallow Copying vs Deep Copying
import copy
shallow_clone = items.copy()
deep_clone = copy.deepcopy(items)
```

---

## Detailed Explanation

### 1. Variable Aliasing and In-Place Mutation

When you assign a mutable object to another variable (`list_b = list_a`), Python **does not create a copy**. Both variables reference the exact same underlying object in heap memory. Modifying the data through `list_b` immediately affects `list_a`:

```python
original = ["item-1", "item-2"]
alias = original  # Both point to the exact same list!

alias.append("item-3")

print("Original List:", original)  # ['item-1', 'item-2', 'item-3'] ❌ Mutated!
print("Original is Alias:", original is alias)  # True
```

### 2. Shallow Copy vs Deep Copy

To prevent unintended shared mutations, you must copy objects explicitly:

```
Shallow Copy: Duplicates top-level container, but inner nested objects are still SHARED.
Deep Copy:    Recursively duplicates top-level container AND all nested child objects.
```

```python
import copy

nested_original = [[1, 2], [3, 4]]

# 1. Shallow Copy (using .copy() or copy.copy())
shallow = nested_original.copy()
shallow[0].append(99)  # Mutates the shared inner list!
print("Original after shallow mutation:", nested_original)  # [[1, 2, 99], [3, 4]] ❌

# 2. Deep Copy (using copy.deepcopy())
deep = copy.deepcopy(nested_original)
deep[1].append(888)  # Isolated!
print("Original after deep mutation   :", nested_original)  # [[1, 2, 99], [3, 4]] ✅
```

### 3. The Paradox: Immutable Containers with Mutable Elements

A tuple is immutable, meaning you cannot add, remove, or replace its elements. However, if a tuple contains a reference to a mutable object (like a list), the *contents of that list can still be modified in place*:

```python
mixed_tuple = (1, 2, ["alpha", "beta"])
print("Initial Tuple:", mixed_tuple)

# mixed_tuple[2] = ["new"] -> Raises TypeError: 'tuple' object does not support item assignment
# BUT mutating the inner list is completely legal:
mixed_tuple[2].append("gamma")
print("Mutated Tuple:", mixed_tuple)  # (1, 2, ['alpha', 'beta', 'gamma'])
```

### 4. Hashability and Dictionary Keys

In Python, dictionary keys and set elements **must be hashable** (`hash(obj)` must return a constant integer throughout the object's lifetime). 
- All immutable types (`int`, `str`, `tuple` containing only immutables, `frozenset`) are hashable.
- All mutable types (`list`, `dict`, `set`) are **unhashable**. Attempting to use a list as a dictionary key raises `TypeError: unhashable type: 'list'`.

---

## Examples

### 1. Simple: Proving Mutability with `id()`
Tracking memory addresses before and after operations.

```python
# String (Immutable)
text = "hello"
id_before = id(text)
text = text.upper()
id_after = id(text)
print(f"String ID changed: {id_before} -> {id_after} (Different: {id_before != id_after})")

# List (Mutable)
nums = [1, 2, 3]
id_before = id(nums)
nums.extend([4, 5])
id_after = id(nums)
print(f"List ID changed  : {id_before} -> {id_after} (Identical: {id_before == id_after})")
```

### 2. Beginner: Function Argument Mutation Side-Effects
Demonstrating how functions can inadvertently mutate caller data when receiving mutable references.

```python
def process_user_tags(tags: list[str]):
    """Buggy function that normalizes tags by mutating caller's list."""
    for i in range(len(tags)):
        tags[i] = tags[i].strip().lower()
    tags.append("verified")  # Side-effect!

user_tags = ["  Python  ", " DEVELOPER "]
print("Tags Before Function:", user_tags)

process_user_tags(user_tags)
print("Tags After Function :", user_tags)  # Caller's data was modified!
```

### 3. Intermediate: Defensive Copying Pattern
Refactoring the above function to guarantee immutability and eliminate side-effects.

```python
def safe_process_user_tags(tags: list[str]) -> list[str]:
    """Safe pure function that returns a new transformed list without mutating input."""
    # Create a new list using a list comprehension
    clean_tags = [t.strip().lower() for t in tags]
    clean_tags.append("verified")
    return clean_tags

original_tags = ["  Python  ", " DEVELOPER "]
processed_tags = safe_process_user_tags(original_tags)

print("Original Tags (Untouched):", original_tags)
print("Processed Tags (New List):", processed_tags)
```

### 4. Real-World: Multi-Tenant State Isolation
Preventing security leaks between user sessions by deep-copying template configurations.

```python
import copy

DEFAULT_TENANT_CONFIG = {
    "tier": "Standard",
    "features": ["auth", "dashboard"],
    "rate_limits": {"requests_per_min": 100, "burst": 20},
    "metadata": {"custom_headers": []}
}

def create_tenant_session(tenant_id: str, custom_features: list[str] = None) -> dict:
    # CRITICAL: Deep copy template to prevent tenant cross-contamination!
    session_config = copy.deepcopy(DEFAULT_TENANT_CONFIG)
    session_config["tenant_id"] = tenant_id
    
    if custom_features:
        session_config["features"].extend(custom_features)
        
    return session_config

tenant_alpha = create_tenant_session("tenant_alpha", ["admin_api"])
tenant_beta = create_tenant_session("tenant_beta", ["analytics"])

print("Tenant Alpha Features:", tenant_alpha["features"])  # ['auth', 'dashboard', 'admin_api']
print("Tenant Beta Features :", tenant_beta["features"])   # ['auth', 'dashboard', 'analytics']
print("Default Template     :", DEFAULT_TENANT_CONFIG["features"]) # ['auth', 'dashboard'] (Clean!)
```

### 5. Advanced: Enforcing True Immutability with Frozen Dataclasses
Creating immutable domain models that reject any attempt at attribute mutation at runtime.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class SecurityToken:
    token_id: str
    user_id: int
    expires_in_seconds: int

auth_token = SecurityToken(token_id="tok_98124", user_id=402, expires_in_seconds=3600)
print("Security Token:", auth_token)

# Attempting mutation raises FrozenInstanceError
try:
    auth_token.expires_in_seconds = 7200  # Modifying attribute
except Exception as err:
    print(f"Caught Mutation Attempt: {type(err).__name__}: {err}")
```

---

## Code Explanation

In Example 5 (Frozen Dataclasses):
1. The `@dataclass(frozen=True)` decorator configures the class's `__setattr__()` and `__delattr__()` magic methods to raise a `FrozenInstanceError` whenever any attribute modification is attempted.
2. Because the instance is frozen and all its fields are immutable types, Python automatically implements `__hash__()`, allowing `SecurityToken` instances to be used as dictionary keys or stored in sets.
3. This pattern enables the creation of strict value objects and domain entities in Domain-Driven Design (DDD) and concurrent architectures.

---

## Common Mistakes

### Mistake 1: Modifying a List While Iterating Over It
Modifying a list (e.g., calling `.remove()` or `.pop()`) while iterating over it in a `for` loop causes the loop index to skip elements unpredictably.

```python
# BROKEN:
numbers = [1, 2, 3, 4, 5, 6]
for n in numbers:
    if n % 2 == 0:
        numbers.remove(n)  # Skips elements due to internal index shifting!
print("Broken Result:", numbers)  # [1, 3, 5] (Seems right here, but fails on [2, 4, 6] -> [4]!)

# CORRECT: Iterate over a shallow copy or use a list comprehension
numbers = [2, 4, 6, 8]
numbers = [n for n in numbers if n % 2 != 0]  # Clean filtering
```

### Mistake 2: Assuming `dict.copy()` or `list.copy()` Copies Nested Objects
As demonstrated in the Deep Copy section, `.copy()` only copies the outer container. Any nested lists or dictionaries inside remain shared references.

---

## Best Practices

### Prefer Immutability for Data Contracts and Shared State
Whenever passing data between modules, subsystems, or threads, prefer immutable structures (`tuple`, `frozenset`, `dataclass(frozen=True)`). Immutability makes code inherently thread-safe, self-documenting, and free from unexpected side effects.

Good:
```python
# Immutable coordinate point
from typing import NamedTuple

class GeoCoordinate(NamedTuple):
    latitude: float
    longitude: float

origin = GeoCoordinate(35.6892, 51.3890)
```

Avoid:
```python
# Mutable coordinate dictionary prone to accidental overwrite
origin = {"lat": 35.6892, "lng": 51.3890}
```

---

## Performance Considerations

1. **Tuple vs List Memory Overhead**: Because tuples are immutable, CPython allocates a fixed, exact block of memory for them without growth buffers. Lists allocate extra amortized capacity to support `.append()`. Tuples consume ~20% less RAM and instantiate slightly faster than lists.
2. **Deep Copy Overhead**: `copy.deepcopy()` traverses the entire object graph recursively and maintains a memo dictionary to track cyclic references. Deep copying massive data structures can be computationally expensive; design architectures with immutable data structures to avoid needing deep copies.

---

## Security Considerations

1. **Cross-Request State Leaks**: In web applications (Flask, Django, FastAPI), storing mutable global or module-level variables causes state to leak between distinct HTTP requests, potentially exposing private user data to other tenants.
2. **Dictionary Key Mutation Vulnerability**: If a custom class implements `__hash__` based on mutable fields and those fields are modified while stored inside a dictionary, the object's hash changes. The dictionary will no longer be able to find the key, causing memory leaks and state corruption.

---

## Real-World Usage

- **Functional Programming & Redux State**: Modern Python architectural patterns (like event sourcing and unidirectional data flow) mandate that application state transitions produce new immutable state snapshots rather than mutating existing state in place.
- **Multiprocessing and Concurrency**: Sharing immutable data between worker threads requires zero mutex locking, eliminating race conditions and deadlocks.
- **Database Transaction Rollbacks**: Transaction managers create isolated copies of domain models, applying changes in memory and committing or discarding them based on transaction success.

---

## Comparison: Mutability Across Core Types

| Type | Category | Mutable? | Hashable? (Can be Dict Key) | In-Place Modification Syntax |
|---|---|---|---|---|
| **`int` / `float`** | Scalar Number | No | Yes | None (`+=` re-binds) |
| **`str`** | Text Sequence | No | Yes | None (`s += ""` re-binds) |
| **`tuple`** | Sequence | No | Yes (if items are hashable) | None |
| **`list`** | Sequence | **Yes** | **No** | `.append()`, `.extend()`, `l[0] = x` |
| **`dict`** | Mapping | **Yes** | **No** | `d['key'] = val`, `.update()` |
| **`set`** | Set | **Yes** | **No** | `.add()`, `.remove()` |
| **`frozenset`** | Set | No | Yes | None |

---

## Advanced Concepts: The Hashability Protocol (`__hash__` & `__eq__`)

For an object to be hashable in Python:
1. It must implement `__hash__()` returning an integer.
2. It must implement `__eq__()` comparing equality.
3. If two objects compare equal (`a == b`), their hash values must be identical (`hash(a) == hash(b)`).

By default, user-defined classes inherit `__hash__` based on their memory address (`id()`). If you override `__eq__()` in a custom class, Python automatically sets `__hash__ = None`, marking the class unhashable to protect you from dictionary key corruption until you explicitly implement a safe `__hash__()` method.

---

## Exercises

### Exercise 1 — Beginner
Create an immutable tuple containing your top 3 favorite programming languages. Attempt to modify the first element and catch the resulting `TypeError` in a `try/except` block, printing an explanatory message.

### Exercise 2 — Intermediate
Write a function `sanitize_user_record(record: dict) -> dict` that accepts a nested dictionary representing a user profile (containing keys `"name"`, `"email"`, and `"roles"` which is a list of strings). Ensure the function returns a completely independent, deep copy of the profile with all role strings uppercase, without modifying the input dictionary.

### Exercise 3 — Advanced
Create a custom class named `ImmutableVector` representing a 3D coordinate $(x, y, z)$. Override `__setattr__` and `__delattr__` to prevent attribute reassignment, implement `__hash__` using `hash((self.x, self.y, self.z))`, and prove that instances of your class can be stored as keys in a dictionary.

---

## Mini Project: Transactional State Snapshot & Rollback Engine

### Requirements
Build a lightweight state manager named `state_store.py` that maintains application state in a dictionary, allows users to modify state, supports creating snapshot checkpoints via deep copying, and enables instantaneous rollbacks to previous states if an error occurs.

### Implementation Blueprint
```python
import copy
from typing import Any

class TransactionalStateStore:
    def __init__(self, initial_state: dict):
        self._state = copy.deepcopy(initial_state)
        self._checkpoints = []

    def get_state(self) -> dict:
        """Return a defensive copy of current state to prevent external mutation."""
        return copy.deepcopy(self._state)

    def set(self, key: str, value: Any):
        self._state[key] = value

    def checkpoint(self) -> int:
        """Save a deep snapshot of current state. Returns checkpoint ID."""
        snapshot = copy.deepcopy(self._state)
        self._checkpoints.append(snapshot)
        chk_id = len(self._checkpoints) - 1
        print(f"📌 Checkpoint #{chk_id} created.")
        return chk_id

    def rollback(self, checkpoint_id: int = -1):
        """Restore state to specified checkpoint."""
        if not self._checkpoints:
            raise RuntimeError("No checkpoints available for rollback.")
        if checkpoint_id >= len(self._checkpoints) or checkpoint_id < -len(self._checkpoints):
            raise IndexError("Invalid checkpoint ID.")
            
        self._state = copy.deepcopy(self._checkpoints[checkpoint_id])
        print(f"⏪ Rolled back state to Checkpoint #{checkpoint_id if checkpoint_id >= 0 else len(self._checkpoints) + checkpoint_id}.")

if __name__ == "__main__":
    store = TransactionalStateStore({
        "account_id": "ACC-99",
        "balance": 1000.0,
        "active_services": ["storage", "compute"]
    })
    
    # Create baseline snapshot
    chk_0 = store.checkpoint()
    
    # Apply modifications
    store.set("balance", 750.0)
    store.get_state()["active_services"].append("ai_agent")  # Modifying returned copy does nothing!
    store._state["active_services"].append("ai_agent")       # Modifying internal state directly
    
    print("\nState after modifications:", store.get_state())
    
    # Simulate a transaction failure -> Trigger Rollback
    print("\n⚠️ Transaction error simulated! Triggering rollback...")
    store.rollback(chk_0)
    
    print("State after rollback     :", store.get_state())
```

---

## Summary

In this lesson, you mastered Python's mutability and memory management model:
- **Immutable Types** (`int`, `float`, `str`, `tuple`, `frozenset`, `bool`, `NoneType`) cannot be altered after creation. Operations create new objects on the heap.
- **Mutable Types** (`list`, `dict`, `set`, custom classes) can be modified in place without altering their memory address (`id()`).
- Assigning variables (`b = a`) creates an alias to the same object, not a copy.
- Use `copy.deepcopy()` when duplicating nested data structures to ensure complete isolation.
- Only immutable, hashable objects can be used as dictionary keys and set elements.
- Prefer immutable data models (`dataclass(frozen=True)`, `NamedTuple`) to eliminate side effects and write thread-safe code.

---

## Best Practices Checklist

- [ ] Never mutate an object passed as a function parameter unless explicitly documented.
- [ ] Use `copy.deepcopy()` when isolating nested state structures.
- [ ] Avoid mutable default function arguments (`def func(items=[]):`); use `None`.
- [ ] Use tuples for fixed data records and lists for collections that grow or shrink.
- [ ] Never modify a list while iterating directly over it.

---

## What's Next?

Congratulations! You have completed **Module 2: Variables & Data Types**. 
Now continue to **Module 3: Operators & Expressions**:
👉 **[Arithmetic Operators](../operators/arithmetic-operators.md)** to master mathematical computations, division semantics, modulo operations, and operator precedence.
