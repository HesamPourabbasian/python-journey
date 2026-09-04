# The `collections` Module in Depth in Python

## Introduction

Python's built-in container types—`list`, `dict`, `set`, and `tuple`—are exceptionally versatile for general programming. However, when building high-throughput systems, low-latency queues, sliding-window analytics, or layered configuration engines, standard containers exhibit severe performance and usability bottlenecks:

- Removing the first element from a standard Python list (`list.pop(0)`) requires shifting every remaining element in memory to the left, taking **$O(N)$ linear time**. In a queue of 100,000 items, popping items one-by-one results in disastrous $O(N^2)$ quadratic slowdowns.
- Standard dictionaries raise a `KeyError` whenever an uninitialized key is accessed, requiring verbose boilerplate (`if k not in d: d[k] = []`).
- Counting element frequencies manually requires repetitive loop increments.

To solve these architectural challenges, Python provides the standard library **`collections`** module.

Implemented in high-speed, memory-optimized C, `collections` provides specialized container datatypes:
- **`deque`**: Double-ended queues with true **$O(1)$ constant-time appends and pops at both ends**, and fixed-capacity circular ring buffers.
- **`defaultdict`**: Dictionaries with automatic default value factories, eliminating `KeyError`.
- **`Counter`**: Multiset dictionary for high-speed frequency tracking and multiset arithmetic (`+`, `-`, `&`, `|`).
- **`OrderedDict`**: Dictionaries with specialized reordering methods (`move_to_end()`, `popitem()`).
- **`namedtuple`**: Lightweight, memory-efficient immutable records with named attribute access.
- **`ChainMap`**: Groups multiple independent dictionaries into a single logical search namespace.

This lesson explores these advanced containers, their algorithmic time complexities, C implementation internals, and real-world system patterns.

---

## Prerequisites

Before studying `collections`, ensure you have:

- Completed [Built-in Collections](../../beginner/collections/README.md) (`lists`, `dicts`, `tuples`, `sets`).
- A solid understanding of algorithmic time complexity ($O(1)$ vs $O(N)$).
- Familiarity with object-oriented programming concepts.

---

## Core Concept: The `collections` Module Ecosystem

```
                              THE collections MODULE ECOSYSTEM

   ┌───────────────────┬──────────────────────────────────────────────────────────────┐
   │ Container         │ Primary Purpose & Key Algorithmic Feature                    │
   ├───────────────────┼──────────────────────────────────────────────────────────────┤
   │ 1. deque          │ FIFO Queues, LIFO Stacks, Sliding Windows. O(1) Pop/Push!    │
   ├───────────────────┼──────────────────────────────────────────────────────────────┤
   │ 2. defaultdict    │ 1-to-Many Mappings, Automated Tree Structures. No KeyError.  │
   ├───────────────────┼──────────────────────────────────────────────────────────────┤
   │ 3. Counter        │ Frequency Histograms, Top-K, Multiset Math (+, -, &, |).     │
   ├───────────────────┼──────────────────────────────────────────────────────────────┤
   │ 4. OrderedDict    │ LRU Caches, FIFO Dictionaries, Reordering via move_to_end(). │
   ├───────────────────┼──────────────────────────────────────────────────────────────┤
   │ 5. namedtuple     │ Memory-Optimized Lightweight Immutable Records (Named fields)│
   ├───────────────────┼──────────────────────────────────────────────────────────────┤
   │ 6. ChainMap       │ Multi-Tiered Scopes (CLI Args > Env Vars > Config Defaults). │
   └───────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential `collections` Patterns

```python
import collections

# 1. deque (Double-Ended Queue & Circular Ring Buffer)
ring_buffer = collections.deque(maxlen=3)  # Bounded capacity!
ring_buffer.append("A")
ring_buffer.append("B")
ring_buffer.append("C")
ring_buffer.append("D")  # Automatically evicts "A" from the left!
print("Deque Buffer:", list(ring_buffer)) # ['B', 'C', 'D']

# 2. defaultdict (Automated Default Factories)
grouped_data = collections.defaultdict(list)
grouped_data["engineering"].append("Hesam")  # No KeyError! Initializes list automatically.
print("DefaultDict :", dict(grouped_data))

# 3. Counter (Multiset Frequency Tracker)
word_counts = collections.Counter(["apple", "banana", "apple", "orange", "apple"])
print("Most Common :", word_counts.most_common(1)) # [('apple', 3)]

# 4. ChainMap (Layered Configuration Resolver)
cli_flags = {"port": 9000}
env_vars  = {"port": 8080, "db_host": "db.internal"}
defaults  = {"port": 3000, "db_host": "localhost", "debug": True}

config = collections.ChainMap(cli_flags, env_vars, defaults)
print("Resolved Port   :", config["port"])    # 9000 (Resolved from cli_flags!)
print("Resolved DB Host:", config["db_host"]) # "db.internal" (Resolved from env_vars!)
```

---

## Detailed Explanation

### 1. `deque` Internals: Block Allocation vs Contiguous Arrays

Why is `deque.popleft()` so much faster than `list.pop(0)`?

- **Python `list`**: Stored as a **contiguous dynamic array** in memory. Calling `list.pop(0)` removes the 0th pointer, forcing CPython to execute a `memmove()` operation to shift the remaining $N-1$ pointers one slot to the left: **$O(N)$ Time Complexity**.
- **`collections.deque`**: Stored as a **doubly-linked list of fixed-size 64-element C arrays (Blocks)**. Calling `deque.popleft()` simply advances a pointer inside the leftmost block or frees the block: **$O(1)$ Constant Time**.

```python
import collections
import time

# Benchmark: Popping 100,000 items from left
N = 100_000

# Test List (O(N^2) total runtime!)
# lst = list(range(N))
# start = time.perf_counter()
# while lst: lst.pop(0) # Takes ~1.5 SECONDS!

# Test Deque (O(N) total runtime!)
deq = collections.deque(range(N))
start = time.perf_counter()
while deq: deq.popleft() # Takes ~0.005 SECONDS! (300x FASTER!)
print(f"Deque 100,000 popleft completed in: {time.perf_counter() - start:.4f}s")
```

---

### 2. The `__missing__` Protocol in `defaultdict`

How does `defaultdict` work under the hood?

When you query a non-existent key (`dict[key]`), standard Python dictionaries call their internal **`__missing__(key)`** dunder method.
- Standard `dict`: `__missing__` raises `KeyError`.
- `defaultdict(factory)`: `__missing__` invokes `factory()`, inserts the resulting default value into the dictionary under `key`, and returns it.

```python
# Building an Auto-Expanding Infinite Nested Tree (JSON Builder):
def infinite_tree():
    return collections.defaultdict(infinite_tree)

tree = infinite_tree()
tree["users"]["admins"]["hesam"]["permissions"] = ["READ", "WRITE", "EXECUTE"]
print("Nested Tree:", tree["users"]["admins"]["hesam"]["permissions"])
```

---

### 3. `Counter` Multiset Arithmetic

`Counter` instances are mathematical **Multisets (Bags)** supporting set-like arithmetic operators:

```python
c1 = collections.Counter(a=3, b=1, c=0)
c2 = collections.Counter(a=1, b=2, d=4)

# 1. Addition (+): Adds counts
print("c1 + c2:", c1 + c2) # Counter({'d': 4, 'a': 4, 'b': 3})

# 2. Subtraction (-): Subtracts counts (keeps positive counts only!)
print("c1 - c2:", c1 - c2) # Counter({'a': 2})

# 3. Intersection (&): Minimum count of common elements
print("c1 & c2:", c1 & c2) # Counter({'a': 1, 'b': 1})

# 4. Union (|): Maximum count of elements
print("c1 | c2:", c1 | c2) # Counter({'d': 4, 'a': 3, 'b': 2})
```

---

## Examples

### 1. Simple: Grouping Transactions with `defaultdict`
Categorizing financial records into a 1-to-many mapping without key initialization checks.

```python
import collections

transactions = [
    ("GROCERIES", 45.50),
    ("UTILITIES", 120.00),
    ("GROCERIES", 85.20),
    ("ENTERTAINMENT", 30.00),
    ("UTILITIES", 65.00),
]

spending_by_category = collections.defaultdict(list)
for category, amount in transactions:
    spending_by_category[category].append(amount)

print("Spending Groupings:")
for cat, amounts in spending_by_category.items():
    print(f"  • {cat:<14} -> Total: ${sum(amounts):>6.2f} (Orders: {len(amounts)})")
```

### 2. Beginner: Fixed-Length Sliding Window Telemetry with `deque`
Maintaining a moving telemetry buffer that automatically evicts old sensor data.

```python
import collections

class RollingTelemetryBuffer:
    def __init__(self, window_size: int = 4):
        # maxlen automatically discards oldest items when full!
        self.buffer = collections.deque(maxlen=window_size)

    def record_reading(self, val: float):
        self.buffer.append(val)

    def get_moving_average(self) -> float:
        if not self.buffer: return 0.0
        return round(sum(self.buffer) / len(self.buffer), 2)

sensor = RollingTelemetryBuffer(window_size=3)
sensor.record_reading(10.0)
sensor.record_reading(20.0)
sensor.record_reading(30.0)
print("Buffer (10, 20, 30) -> Avg:", sensor.get_moving_average()) # 20.0

sensor.record_reading(40.0)  # Evicts 10.0 automatically! Buffer is now: [20.0, 30.0, 40.0]
print("Buffer (20, 30, 40) -> Avg:", sensor.get_moving_average()) # 30.0
```

### 3. Intermediate: Text Frequency Analysis & N-Gram Tokenizer with `Counter`
Extracting the most frequent bi-grams (two-word pairs) from text.

```python
import collections

text_corpus = """
cloud architecture requires scalable systems. scalable systems demand resilient 
microservices. resilient microservices empower cloud architecture and scalable systems.
"""

words = text_corpus.lower().replace(".", "").split()
# Generate bigrams: (word[i], word[i+1])
bigrams = zip(words[:-1], words[1:])

bigram_counter = collections.Counter(bigrams)
print("Top 3 Most Frequent Bigrams:")
for (w1, w2), freq in bigram_counter.most_common(3):
    print(f"  • '{w1} {w2}' -> {freq} occurrences")
```

### 4. Real-World: Multi-Tiered System Configuration Resolver with `ChainMap`
Resolving runtime application settings across command-line flags, environment variables, configuration files, and default fallbacks.

```python
import collections

# 1. System Defaults (Lowest Priority)
CONFIG_DEFAULTS = {
    "host": "127.0.0.1",
    "port": 8000,
    "workers": 4,
    "debug": False
}

# 2. Config File (Medium Priority)
FILE_CONFIG = {
    "host": "0.0.0.0",
    "workers": 8
}

# 3. Environment Variables (High Priority)
ENV_VARS = {
    "port": 8443
}

# 4. CLI Arguments (Highest Priority)
CLI_ARGS = {
    "debug": True
}

# Resolve settings with ChainMap (Evaluated Left-to-Right!)
app_config = collections.ChainMap(CLI_ARGS, ENV_VARS, FILE_CONFIG, CONFIG_DEFAULTS)

print("Resolved Production Configuration:")
print(f"  Host   : {app_config['host']}    (from FILE_CONFIG)")
print(f"  Port   : {app_config['port']}    (from ENV_VARS)")
print(f"  Debug  : {app_config['debug']}   (from CLI_ARGS)")
print(f"  Workers: {app_config['workers']} (from FILE_CONFIG)")
```

### 5. Advanced: High-Performance LRU Cache with `OrderedDict`
Building a custom Least-Recently-Used (LRU) Cache using `OrderedDict`'s `move_to_end()` and `popitem()` methods.

```python
import collections

class CustomLRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self._cache = collections.OrderedDict()

    def get(self, key: str) -> any:
        if key not in self._cache:
            return None
        # Move accessed item to the end (Mark as most recently used!)
        self._cache.move_to_end(key)
        return self._cache[key]

    def put(self, key: str, value: any) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = value
        
        # If capacity exceeded, evict the least recently used item (first item!)
        if len(self._cache) > self.capacity:
            evicted_k, evicted_v = self._cache.popitem(last=False)
            print(f"🗑️ [LRU EVICTION] Evicted: {evicted_k}")

cache = CustomLRUCache(capacity=2)
cache.put("user:101", {"name": "Hesam"})
cache.put("user:102", {"name": "Sarah"})

# Access user:101 (making user:102 the least recently used)
cache.get("user:101")

# Insert user:103 -> Triggers eviction of user:102!
cache.put("user:103", {"name": "Alex"})
```

---

## Code Explanation

In Example 5 (`CustomLRUCache`):
1. `collections.OrderedDict` preserves key insertion order and provides two specialized methods: `move_to_end(key)` and `popitem(last=False)`.
2. When an item is accessed via `get()`, `self._cache.move_to_end(key)` moves that key to the rightmost position in $O(1)$ time.
3. When new items exceed `capacity`, `self._cache.popitem(last=False)` pops and deletes the leftmost item (the Least Recently Used item) in **$O(1)$ constant time**.
4. This implements an enterprise-grade LRU cache in under 20 lines of clean Python code.

---

## Common Mistakes

### Mistake 1: Unintended Key Insertion in `defaultdict`
Querying a non-existent key in a `defaultdict` (`val = my_defaultdict["missing_key"]`) **automatically creates that key in the dictionary**! To check for membership without mutating the dictionary, use `"key" in my_defaultdict`.

### Mistake 2: Mutating Non-First Dictionaries in `ChainMap`
Mutations to a `ChainMap` (`chain_map["key"] = val` or `del chain_map["key"]`) **always affect ONLY the first mapping in the chain**, never subsequent fallback dictionaries.

---

## Best Practices

### Use `deque` for FIFO Queues and Sliding Buffers
Never use `list.pop(0)` or `list.insert(0, x)` in performance-critical code. Always use `collections.deque` with `.popleft()` and `.appendleft()`.

Good:
```python
queue = collections.deque()
queue.append(task)
task = queue.popleft()  # O(1) Constant Time!
```

Avoid:
```python
queue = []
queue.append(task)
task = queue.pop(0)  # O(N) Linear Time! ❌
```

---

## Performance Considerations

| Operation | Standard `list` | `collections.deque` |
|---|---|---|
| **Append to Right** | $O(1)$ amortized | **$O(1)$ guaranteed** |
| **Append to Left** | $O(N)$ (Shifts all elements) | **$O(1)$ guaranteed** |
| **Pop from Right** | $O(1)$ | **$O(1)$ guaranteed** |
| **Pop from Left** | **$O(N)$ (Shifts all elements)**| **$O(1)$ guaranteed** |
| **Random Index Access (`x[500]`)**| **$O(1)$ Fast Array Offset** | $O(N)$ (Block traversal) |

Use `list` when random indexing (`lst[i]`) is primary. Use `deque` when adding/removing from both ends is primary.

---

## Security Considerations

1. **Unbounded Memory Exhaustion in `defaultdict`**: If untrusted web clients query random keys against a `defaultdict` (e.g. `user_lookup[request.param]`), the dictionary will grow indefinitely in memory, triggering a DoS crash. Always validate keys before querying.
2. **Fixed Memory Guarantees**: Use `deque(maxlen=N)` on incoming network stream buffers to guarantee fixed memory boundaries regardless of network traffic spikes.

---

## Real-World Usage

- **Web Frameworks (Flask / Django)**: `ChainMap` resolving request query parameters, form data, and cookie contexts.
- **AsyncIO & Task Queues**: `deque` powering event loop execution scheduling.
- **Natural Language Processing (spaCy / NLTK)**: `Counter` computing term frequency-inverse document frequency (TF-IDF) matrices.

---

## Comparison: Advanced Collections

| Container | Base Type | Key Advantage | Typical Use Case |
|---|---|---|---|
| **`deque`** | Sequence | $O(1)$ double-ended push/pop | Queues, Rolling Windows, Stacks |
| **`defaultdict`**| Mapping | Automated default factory | 1-to-Many groupings, Nested trees |
| **`Counter`** | Mapping | Frequency counts, Multiset math | Histograms, Top-K, Bag analysis |
| **`OrderedDict`**| Mapping | `move_to_end()`, `popitem()` | LRU Caches, Reordered mappings |
| **`namedtuple`** | Tuple | Lightweight named attributes | Immutable DTOs, Memory-efficient rows|
| **`ChainMap`** | Mapping | Layered search fallback | Configurations, Scopes, Namespaces |

---

## Advanced Concepts: Custom `__missing__` Subclasses

You can subclass standard `dict` and implement `__missing__(self, key)` to create custom lookup behaviors:

```python
class CaseInsensitiveDict(dict):
    """Dictionary that normalizes uppercase/lowercase keys dynamically."""
    def __missing__(self, key):
        if isinstance(key, str):
            for k in self:
                if k.lower() == key.lower():
                    return self[k]
        raise KeyError(key)

d = CaseInsensitiveDict({"Authorization": "Bearer token_123"})
print(d["authorization"]) # "Bearer token_123"
```

---

## Exercises

### Exercise 1 — Beginner
Create a `collections.Counter` of letters in a string and write a function `is_anagram(str1: str, str2: str) -> bool` using Counter equality.

### Exercise 2 — Intermediate
Build a `UserSessionTracker` using `collections.defaultdict(set)` that maps user IDs to sets of active IP addresses. Implement methods to add an IP and check for suspicious logins (more than 3 distinct IPs).

### Exercise 3 — Advanced
Build a `MultiLevelRingBuffer` using `collections.deque` that manages 3 priority queues (`HIGH`, `MEDIUM`, `LOW`) with bounded capacities, popping high-priority tasks first before lower-priority tasks.

---

## Mini Project: Enterprise Real-Time Telemetry Stream Buffer & Layered Config Resolver

### Requirements
Build an operational telemetry ingestion system named `telemetry_stream_buffer.py`. Implement a `ChainMap` configuration resolver for cluster settings, a bounded `deque` ring buffer for real-time sensor metrics, and a `Counter` anomaly aggregator for error tracking.

### Implementation Blueprint
```python
import collections
import time
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. LAYERED CONFIGURATION ENGINE (ChainMap)
# =====================================================================

SYSTEM_DEFAULTS = {
    "buffer_capacity": 5,
    "anomaly_threshold_celsius": 85.0,
    "log_level": "INFO",
    "cluster_region": "us-east-1"
}

def resolve_runtime_configuration(cli_overrides: dict, env_overrides: dict) -> collections.ChainMap:
    """Resolves configuration hierarchy: CLI > ENV > DEFAULTS."""
    return collections.ChainMap(cli_overrides, env_overrides, SYSTEM_DEFAULTS)

# =====================================================================
# 2. TELEMETRY STREAM BUFFER (deque + Counter)
# =====================================================================

@dataclass(frozen=True)
class SensorMetric:
    sensor_id: str
    temperature_c: float
    timestamp: str

class TelemetryIngestionNode:
    def __init__(self, config: collections.ChainMap):
        self.config = config
        capacity = int(config["buffer_capacity"])
        self.ring_buffer = collections.deque(maxlen=capacity)
        self.incident_counter = collections.Counter()

    def ingest_metric(self, sensor_id: str, temp_c: float):
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        metric = SensorMetric(sensor_id, temp_c, ts)
        
        # Append to bounded ring buffer (O(1) insertion, auto-eviction)
        self.ring_buffer.append(metric)

        # Check for temperature anomaly
        threshold = float(self.config["anomaly_threshold_celsius"])
        if temp_c >= threshold:
            self.incident_counter[sensor_id] += 1
            print(f"🚨 [HEAT ALERT] {sensor_id} hit {temp_c}°C (Threshold: {threshold}°C)")

    def render_node_dashboard(self):
        print("\n" + "=" * 68)
        print(f"      TELEMETRY NODE DASHBOARD ({self.config['cluster_region']})")
        print("=" * 68)
        print(f"  Active Buffer Capacity : {self.ring_buffer.maxlen} slots")
        print(f"  Current Buffer Depth   : {len(self.ring_buffer)} metrics")
        print("-" * 68)
        print("  Recent In-Memory Stream Buffer (deque):")
        for m in self.ring_buffer:
            print(f"   • [{m.timestamp}] {m.sensor_id:<12} : {m.temperature_c:>5.1f}°C")
            
        print("-" * 68)
        print("  Heat Incident Frequencies (Counter):")
        for sensor_id, count in self.incident_counter.most_common():
            print(f"   🔥 {sensor_id:<12} : {count} critical spikes")
        print("=" * 68)

if __name__ == "__main__":
    # 1. Resolve Config
    cli_flags = {"buffer_capacity": 4, "anomaly_threshold_celsius": 80.0}
    env_vars = {"cluster_region": "eu-central-1"}
    active_config = resolve_runtime_configuration(cli_flags, env_vars)

    # 2. Initialize Node
    node = TelemetryIngestionNode(active_config)

    # 3. Simulate Stream Ingestion
    test_readings = [
        ("NODE-01", 72.5),
        ("NODE-02", 82.0), # Alert!
        ("NODE-01", 74.0),
        ("NODE-03", 68.5),
        ("NODE-02", 88.5), # Alert! (Evicts NODE-01 72.5)
        ("NODE-01", 91.0), # Alert! (Evicts NODE-02 82.0)
    ]

    for sensor, temp in test_readings:
        node.ingest_metric(sensor, temp)

    # 4. Render Dashboard
    node.render_node_dashboard()
```

---

## Summary

In this lesson, you mastered Python's `collections` module:
- **`deque`** provides **$O(1)$ constant-time push and pop operations at both ends**, outperforming lists for queues and ring buffers.
- **`defaultdict`** eliminates `KeyError` by providing automatic default value factories.
- **`Counter`** provides high-speed multiset frequency counting and supports multiset arithmetic (`+`, `-`, `&`, `|`).
- **`OrderedDict`** provides specialized reordering methods (`move_to_end()`, `popitem()`) for building custom LRU caches.
- **`ChainMap`** resolves layered configuration namespaces efficiently across multiple dictionaries.

---

## Best Practices Checklist

- [ ] Use `deque` instead of `list` for FIFO queues and rolling sliding windows.
- [ ] Use `deque(maxlen=N)` to guarantee bounded memory buffers for streaming data.
- [ ] Use `defaultdict(list)` or `defaultdict(set)` for 1-to-many grouping algorithms.
- [ ] Use `Counter.most_common(K)` for top-$K$ frequency queries.
- [ ] Use `ChainMap` to structure layered configuration resolution.

---

## What's Next?

Now that you understand the `collections` module, continue to:
👉 **[Heapq & Priority Queues](heapq-and-priority-queues.md)** to master binary min-heaps, $O(\log N)$ priority scheduling, and top-$K$ element filtering with `heapq`!
