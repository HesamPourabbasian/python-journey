# Dictionaries & Hash Tables in Python

## Introduction

In computer science, associative mappings that connect unique keys to specific values are among the most essential and powerful data structures ever conceived. In Python, this data structure is the **Dictionary (`dict`)**.

It is impossible to overstate the importance of dictionaries in the Python ecosystem. In Python, dictionaries are not merely a convenient collection type; they are the literal bedrock upon which the entire language runtime is constructed. Module namespaces (`globals()`), local function scopes (`locals()`), class attributes (`__dict__`), object property lookups, and keyword arguments (`**kwargs`) are all implemented internally as Python dictionaries. As the famous Python proverb states: *"Namespaces are one honking great idea—let's do more of those!"*

Python dictionaries are implemented under the hood as highly optimized **Hash Tables**. They provide blistering **$O(1)$ constant-time average performance** for insertions, lookups, and deletions. Furthermore, since Python 3.7, dictionaries are formally guaranteed by the language specification to **preserve insertion order**, while utilizing a modern compact memory layout that reduces RAM consumption by 20% to 25%.

This lesson explores the inner workings of Python dictionaries, hash functions, collision resolution mechanisms, dictionary views, and modern dictionary merging operators.

---

## Prerequisites

Before studying dictionaries in depth, ensure you have:

- Completed [Mutable vs Immutable Objects](../variables-data-types/mutable-vs-immutable.md).
- Completed [Lists & Dynamic Arrays](lists.md) and [Tuples](tuples.md).
- An understanding of object hashing (`hash()`) and value equality (`==`).

---

## Core Concept

A dictionary is a **mutable, unordered-by-nature (but insertion-ordered in Python), key-value mapping**.

```
                               CPYTHON COMPACT DICT ARCHITECTURE

   Hash Table Indices Array (Sparse):      Entries Array (Dense & Insertion Ordered):
   ┌─────┬─────┬─────┬─────┬─────┐        ┌───────┬────────────┬─────────────┬─────────────┐
   │  0  │ -1  │  2  │ -1  │  1  │        │ Index │ Hash       │ Key         │ Value       │
   └─────┴─────┴─────┴─────┴─────┘        ├───────┼────────────┼─────────────┼─────────────┤
      │           │           │           │   0   │ 0x48a1b2   │ "user_id"   │ 1042        │
      ▼           │           ▼           │   1   │ 0x99201f   │ "role"      │ "Admin"     │
   Entry 0        │        Entry 1        │   2   │ 0x1104e8   │ "active"    │ True        │
                  ▼                       └───────┴────────────┴─────────────┴─────────────┘
               Entry 2                    • Keys stored sequentially in dense array (Preserves Order!)
                                          • Sparse indices table maps hash buckets to dense indices
```

### The Three Rules of Dictionary Keys:
1. **Keys Must Be Hashable**: The key's class must implement `__hash__()` returning a constant integer, and `__eq__()` for equality comparison.
2. **Keys Must Be Unique**: Assigning to an existing key overwrites the previous value.
3. **Values Can Be Anything**: Values can be of any type (mutable, immutable, nested dictionaries, functions, or lists) and can contain duplicates.

---

## Syntax & Essential Dictionary Operations

```python
# 1. Dictionary Creation
empty_dict = {}
user = {"id": 101, "username": "Hesam", "is_admin": True}
config = dict(host="localhost", port=5432, timeout=30)  # Constructor syntax

# 2. Accessing Values
uid = user["id"]                      # Direct key access (raises KeyError if missing)
email = user.get("email", "N/A")      # Safe access with default fallback ("N/A")

# 3. Insertion and Mutation
user["email"] = "hesam@domain.com"    # Inserts new key-value pair
user["is_admin"] = False              # Overwrites existing value
user.update({"tier": "Pro", "ip": "192.168.1.1"}) # Bulk update

# 4. Deletion
deleted_val = user.pop("ip")          # Removes "ip" and returns its value
del user["tier"]                      # Deletes "tier" key directly
user.clear()                          # Empties the dictionary

# 5. Modern Python 3.9+ Dictionary Merge (|) and Update (|=)
defaults = {"theme": "dark", "notifications": True}
custom = {"notifications": False, "font_size": 14}
merged = defaults | custom            # {'theme': 'dark', 'notifications': False, 'font_size': 14}
```

---

## Detailed Explanation

### 1. The Compact Dictionary Architecture (PEP 468)

Prior to Python 3.6, dictionaries stored keys, hashes, and values inside a single sparse hash table where two-thirds of the rows were empty `NULL` slots to prevent hash collisions. This wasted substantial memory.

In modern Python, CPython uses the **Compact Dictionary Layout** (originally designed by PyPy developer Armin Rigo and implemented by Raymond Hettinger):
1. **Dense Entries Array**: All keys, values, and hashes are appended sequentially into a dense array in the exact order they were inserted.
2. **Sparse Indices Array**: A small array of integer indices (1 byte each for small dicts) maps the computed hash bucket directly to the row number in the dense entries array.

This architecture reduces dictionary memory footprint by **20% to 25%** and naturally guarantees that iterating over a dictionary preserves its **exact insertion order**.

### 2. Hash Collisions & Open Addressing

When two distinct keys compute to the exact same hash bucket index, a **Hash Collision** occurs.

CPython resolves collisions using **Open Addressing with Perturbation**:
- When a collision occurs at bucket $i$, Python executes a pseudo-random probe sequence:

$$i = (5 \times i + 1 + \text{perturb}) \pmod{\text{table\_size}}$$

- Python checks the next bucket in the probe sequence. If it is empty, it stores the key; if it is occupied, it compares value equality using `key == existing_key`.
- If the keys compare equal, it overwrites the value; if not equal, it continues probing until an empty bucket is located.

### 3. Dynamic Dictionary Views (`keys()`, `values()`, `items()`)

In Python 3, `.keys()`, `.values()`, and `.items()` do not allocate static lists; they return **dynamic view objects**:
- **Live Reflection**: If the dictionary is modified, the view automatically updates in real time without being re-created.
- **Set-like Operations**: `dict.keys()` and `dict.items()` behave like mathematical sets, supporting union (`|`), intersection (`&`), and difference (`-`).

```python
d1 = {"a": 1, "b": 2, "c": 3}
d2 = {"b": 20, "c": 3, "d": 4}

# Find common keys between two dictionaries using set intersection!
common_keys = d1.keys() & d2.keys()
print("Common Keys:", common_keys)  # {'b', 'c'}
```

---

## Examples

### 1. Simple: Basic Key-Value Manipulations
Building and querying an e-commerce shopping cart.

```python
cart = {
    "laptop": {"price": 1200.0, "qty": 1},
    "mouse": {"price": 25.0, "qty": 2},
    "keyboard": {"price": 85.0, "qty": 1},
}

# Calculate total invoice amount
total_amount = sum(item["price"] * item["qty"] for item in cart.values())
print(f"Total Cart Items  : {len(cart)}")
print(f"Total Amount Due  : ${total_amount:,.2f}")
```

### 2. Beginner: Safe Key Retrieval with `.get()` and `.setdefault()`
Categorizing items into grouped lists within a dictionary.

```python
employees = [
    ("Engineering", "Hesam"),
    ("Marketing", "Elena"),
    ("Engineering", "Sarah"),
    ("Design", "Alex"),
    ("Marketing", "David"),
]

# Using .setdefault() to initialize empty list if key is missing
department_roster = {}
for dept, name in employees:
    department_roster.setdefault(dept, []).append(name)

print("Department Rosters:")
for dept, roster in department_roster.items():
    print(f" -> {dept:<15}: {', '.join(roster)}")
```

### 3. Intermediate: Word Frequency Counter Pipeline
Counting occurrences of words in a document using `.get()`.

```python
text_corpus = """
Python is an interpreted high-level general-purpose programming language.
Python design philosophy emphasizes code readability with the use of significant indentation.
Python is dynamically-typed and garbage-collected.
"""

word_counts = {}
for raw_word in text_corpus.lower().split():
    # Strip punctuation marks
    clean_word = raw_word.strip(".,-")
    if clean_word:
        word_counts[clean_word] = word_counts.get(clean_word, 0) + 1

# Sort words by frequency descending
sorted_freq = sorted(word_counts.items(), key=lambda pair: pair[1], reverse=True)

print("Top 5 Most Frequent Words:")
for word, count in sorted_freq[:5]:
    print(f" -> {word:<15}: {count} times")
```

### 4. Real-World: Multi-Layered Configuration Resolver (Python 3.9+ `|`)
Merging default configurations, environment variables, and user overrides.

```python
DEFAULT_APP_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "debug": False,
    "log_level": "INFO",
    "workers": 4,
    "plugins": ["auth", "cors"]
}

DEV_OVERRIDES = {
    "port": 9000,
    "debug": True,
    "log_level": "DEBUG"
}

CLI_FLAGS = {
    "workers": 8
}

# Merge all three dictionaries in order of increasing precedence
active_configuration = DEFAULT_APP_CONFIG | DEV_OVERRIDES | CLI_FLAGS

print("Active Application Configuration:")
for k, v in active_configuration.items():
    print(f" -> {k:<15}: {v}")
```

### 5. Advanced: Implementing a Custom Hashable Domain Key Class
Creating a custom `APIEndpointKey` class that implements `__hash__` and `__eq__` to serve as a high-performance dictionary lookup key.

```python
class APIEndpointKey:
    def __init__(self, method: str, path: str):
        self.method = method.upper()
        self.path = path.rstrip("/").lower()

    def __hash__(self) -> int:
        """Hash combined method and normalized path."""
        return hash((self.method, self.path))

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, APIEndpointKey):
            return NotImplemented
        return (self.method, self.path) == (other.method, other.path)

    def __repr__(self) -> str:
        return f"Endpoint({self.method} {self.path})"

# Use custom objects directly as dictionary keys
routing_table = {
    APIEndpointKey("GET", "/api/v1/users"): "handle_get_users",
    APIEndpointKey("POST", "/api/v1/users"): "handle_create_user",
    APIEndpointKey("GET", "/api/v1/users/404"): "handle_get_single_user",
}

# Lookup works seamlessly even with newly instantiated matching objects!
lookup_query = APIEndpointKey("get", "/api/v1/users/")
resolved_handler = routing_table.get(lookup_query)

print(f"Query {lookup_query} -> Resolved Handler: '{resolved_handler}'")
```

---

## Code Explanation

In Example 5 (Custom Hashable Key):
1. For an object to be used as a dictionary key, it must implement `__hash__()` and `__eq__()`.
2. The `APIEndpointKey` normalizes the HTTP method to uppercase and strips trailing slashes from the path.
3. `__hash__()` returns the combined hash of the tuple `(self.method, self.path)`.
4. When `routing_table.get(lookup_query)` is called, Python hashes `lookup_query`, jumps to the computed bucket index, and validates equality using `__eq__()`.
5. Even though `lookup_query` is a separate object instance in memory, it matches the dictionary key perfectly because its hash and equality compare identically.

---

## Common Mistakes

### Mistake 1: Accessing Missing Keys Directly Without `.get()` or `in`
Directly indexing a missing key raises an unhandled `KeyError` that crashes the program.

```python
# BROKEN:
user = {"name": "Hesam"}
# email = user["email"]  # CRASHES: KeyError: 'email'

# CORRECT:
email = user.get("email", "default@example.com")  # Returns default safely
```

### Mistake 2: Modifying a Dictionary While Iterating Over It
Adding or deleting keys while iterating directly over a dictionary raises `RuntimeError: dictionary changed size during iteration`.

```python
# BROKEN:
data = {"a": 1, "b": 2, "c": 3}
# for k in data:
#     if data[k] == 2:
#         del data[k]  # CRASHES!

# CORRECT: Iterate over a static tuple/list copy of the keys
for k in list(data.keys()):
    if data[k] == 2:
        del data[k]  # Safe!
```

---

## Best Practices

### Use Dictionary Unpacking and `.get()` for Defensive Access
When extracting configuration parameters or API responses, use `.get()` with explicit defaults to prevent crashes on missing fields.

Good:
```python
timeout = config.get("timeout_seconds", 30)
```

Avoid:
```python
if "timeout_seconds" in config:
    timeout = config["timeout_seconds"]
else:
    timeout = 30
```

---

## Performance Considerations

1. **Hash Table Lookup Speed ($O(1)$)**: Dictionary key lookup is almost instantaneous. Python's C hash function compiles directly into CPU instructions, making dictionary lookups nearly as fast as raw array indexing.
2. **Memory Growth Re-hashing**: When a dictionary exceeds its capacity threshold (typically when $\sim 66\%$ full), Python allocates a larger table and re-indexes all entries. In high-performance loops, avoid repeatedly growing dictionaries from scratch; pre-populate or batch where possible.

---

## Security Considerations: HashDoS Attacks & `PYTHONHASHSEED`

If an attacker knows Python's exact hashing algorithm, they can craft thousands of string inputs that produce identical hash values (forcing hash collisions). In an unmitigated hash table, processing thousands of collisions degrades lookup performance from $O(1)$ to **$O(N)$ quadratic time**, freezing the server (a **Hash Denial of Service** attack).

To permanently neutralize this vulnerability, Python randomizes a secret cryptographic salt (`PYTHONHASHSEED`) upon every interpreter startup. String hashes vary between Python runs, preventing attackers from predicting collision buckets.

---

## Real-World Usage

- **REST API Serialization**: JSON data formats map 1-to-1 with Python dictionaries.
- **In-Memory Caches & Memoization**: Caching database query outputs and mathematical results.
- **Dependency Injection & Service Locators**: Mapping interface strings to concrete service class instances.

---

## Comparison: Python Mapping Data Structures

| Data Structure | Module | Key Characteristic | Time Complexity |
|---|---|---|---|
| **`dict`** | Built-in | Insertion-ordered, fast hash table | **$O(1)$ Average** |
| **`collections.defaultdict`**| `collections` | Automatic default value on missing keys | **$O(1)$ Average** |
| **`collections.OrderedDict`**| `collections` | Specialized ordering methods (`move_to_end`)| **$O(1)$ Average** |
| **`collections.ChainMap`** | `collections` | Searches multiple dictionaries as a single unit| $O(K)$ layers |

---

## Advanced Concepts: The CPython `PyDictObject` Struct

In `Include/cpython/dictobject.h`, dictionaries are represented by `PyDictObject`:

```c
typedef struct {
    PyObject_HEAD
    Py_ssize_t ma_used;        // Number of active key-value pairs
    uint64_t ma_version_tag;   // Global version counter for cache invalidation
    PyDictKeysObject *ma_keys; // Sparse index table + compact keys
    PyObject **ma_values;      // Values array (or NULL if split-table)
} PyDictObject;
```

The `ma_version_tag` counter is updated whenever a key is inserted or deleted. Python 3.11+ uses this version tag to enable inline bytecode caching for dictionary lookups, executing repeated lookups at native C speeds.

---

## Exercises

### Exercise 1 — Beginner
Create a dictionary representing a contact card with fields for `name`, `phone`, and `city`. Perform operations to: (1) add an `email` field, (2) update the `city`, (3) safely retrieve a `country` field with a default of `"Unknown"`, and (4) print all key-value pairs using a `for` loop over `.items()`.

### Exercise 2 — Intermediate
Write a function `invert_dictionary(d: dict[str, int]) -> dict[int, list[str]]` that inverts a dictionary mapping keys to values into a new dictionary mapping values to lists of keys (handling duplicate values cleanly).

### Exercise 3 — Advanced
Build an `LRUCache` (Least Recently Used Cache) class using a standard Python dictionary. Implement `get(key)` and `put(key, value, max_capacity)`. When `max_capacity` is exceeded, the least recently accessed key must be evicted using dictionary iteration order manipulation.

---

## Mini Project: In-Memory Key-Value Cache Engine with Expiration (TTL)

### Requirements
Build an in-memory caching engine named `kv_cache.py` that stores key-value pairs, supports Time-To-Live (TTL) expiration timestamps, automatically evicts expired keys during access, tracks cache hit/miss statistics, and provides bulk dump reports.

### Implementation Blueprint
```python
import time
from typing import Any

class TimedKeyValueCache:
    def __init__(self):
        self._store = {}  # key -> {"value": val, "expires_at": timestamp | None}
        self.hits = 0
        self.misses = 0

    def set(self, key: str, value: Any, ttl_seconds: float = None):
        expires_at = (time.time() + ttl_seconds) if ttl_seconds is not None else None
        self._store[key] = {"value": value, "expires_at": expires_at}
        ttl_str = f"TTL: {ttl_seconds}s" if ttl_seconds else "Permanent"
        print(f"💾 [STORE] Key '{key}' saved ({ttl_str})")

    def get(self, key: str, default: Any = None) -> Any:
        if key not in self._store:
            self.misses += 1
            return default
            
        record = self._store[key]
        expires_at = record["expires_at"]
        
        # Check TTL expiration
        if expires_at is not None and time.time() > expires_at:
            print(f"⌛ [EXPIRED] Key '{key}' has expired! Purging from cache.")
            del self._store[key]
            self.misses += 1
            return default
            
        self.hits += 1
        return record["value"]

    def purge_all_expired(self) -> int:
        now = time.time()
        expired_keys = [k for k, v in self._store.items() if v["expires_at"] and now > v["expires_at"]]
        for k in expired_keys:
            del self._store[k]
        return len(expired_keys)

    def stats(self) -> dict:
        total = self.hits + self.misses
        hit_ratio = (self.hits / total) if total > 0 else 0.0
        return {
            "active_keys": len(self._store),
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio": f"{hit_ratio:.1%}"
        }

if __name__ == "__main__":
    cache = TimedKeyValueCache()
    
    # Store permanent and ephemeral keys
    cache.set("session_usr_101", {"name": "Hesam", "role": "Admin"}, ttl_seconds=1.0)
    cache.set("app_version", "2.4.0", ttl_seconds=None)
    
    print("\n--- Immediate Query ---")
    print("Version :", cache.get("app_version"))
    print("Session :", cache.get("session_usr_101"))
    
    print("\nSleeping 1.5 seconds for TTL to elapse...")
    time.sleep(1.5)
    
    print("\n--- Post-Expiration Query ---")
    print("Session :", cache.get("session_usr_101", default="EXPIRED_OR_NOT_FOUND"))
    print("Cache Stats:", cache.stats())
```

---

## Summary

In this lesson, you mastered Python's dictionary and hash table architecture:
- Dictionaries are **mutable key-value mappings** implemented as compact hash tables.
- Dictionary operations (`insert`, `lookup`, `delete`) execute in **$O(1)$ average constant time**.
- Keys must be **hashable and immutable**; values can be of any data type.
- Since Python 3.7, dictionaries **preserve insertion order** by language specification.
- Use `.get(key, default)` for safe key retrieval without risking `KeyError`.
- Use the modern union operator `d1 | d2` (Python 3.9+) for clean dictionary merging.
- Python randomizes `PYTHONHASHSEED` at startup to neutralize HashDoS security vulnerabilities.

---

## Best Practices Checklist

- [ ] Use `dict.get(key, default)` when accessing optional keys.
- [ ] Use `dict.items()` with tuple unpacking (`for k, v in d.items():`) to iterate over key-value pairs.
- [ ] Use the `|` operator to merge dictionaries cleanly without mutating the originals.
- [ ] Never modify a dictionary while iterating directly over it; iterate over `list(d.keys())`.
- [ ] Use `dict.setdefault()` or `collections.defaultdict` for grouping items into lists.

---

## What's Next?

Now that you have mastered dictionaries, continue to:
👉 **[Sets & Frozensets](sets.md)** to master mathematical set theory operations, deduplication, and $O(1)$ membership testing.
