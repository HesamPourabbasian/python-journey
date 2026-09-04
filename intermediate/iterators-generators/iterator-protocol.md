# The Iterator Protocol in Python

## Introduction

In programming, looping through collections of data is one of the most common operations. In legacy languages like C or early Java, iteration required manual index management: initializing a counter `int i = 0`, checking boundary conditions `i < len`, and fetching elements by offset `array[i]`. This approach is rigid, error-prone (off-by-one errors), and impossible to apply to data structures without integer indices (such as sets, hash maps, binary trees, network streams, or infinite sequences).

Python solves this with a unified, elegant abstraction: **The Python Iteration Protocol**.

In Python, you iterate over lists, dictionaries, database cursors, and 50 GB log files using the exact same clean syntax: `for item in data:`.

Under the hood, Python does not rely on index counters. Instead, it delegates to two special dunder methods: **`__iter__()`** and **`__next__()`**.

Mastering the Iterator Protocol requires understanding the crucial distinction between **Iterables** and **Iterators**, how `StopIteration` acts as a control-flow signal rather than a crash, why iterators are stateful and single-pass, and how to use the two-argument **Sentinel Iterator (`iter(callable, sentinel)`)** for high-speed streaming I/O.

This lesson opens **Module 2: Iterators & Generators in Depth**, providing the foundational mechanics for all lazy data processing in Python.

---

## Prerequisites

Before studying the Iterator Protocol, ensure you have:

- Completed [For Loops & The Iteration Protocol](../../beginner/control-flow/for-loops.md).
- Completed [Classes & Objects](../oop/classes-and-objects.md) and [Magic & Dunder Methods](../oop/magic-methods-dunder.md).
- A solid understanding of Python exception handling.

---

## Core Concept: Iterable vs Iterator

```
                           ITERABLE vs ITERATOR ARCHITECTURE

        ┌────────────────────────────────────────────────────────┐
        │                  ITERABLE (The Container)              │
        │  • Any object implementing __iter__()                  │
        │  • Examples: list, dict, set, str, range, CustomClass  │
        │  • CAN be iterated over multiple times!                │
        └──────────────────────────┬─────────────────────────────┘
                                   │
                     Calling iter(iterable) or iterable.__iter__()
                                   │
                                   ▼
        ┌────────────────────────────────────────────────────────┐
        │                  ITERATOR (The Stream Cursor)          │
        │  • Any object implementing __next__() and __iter__()   │
        │  • Produces values one-by-one on demand via next()     │
        │  • Maintains internal cursor state!                    │
        │  • EXHAUSTIBLE (Single-pass only!)                     │
        │  • Raises StopIteration when exhausted.                │
        └────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Iterator Patterns

```python
# 1. How a 'for' loop actually executes under the hood:
numbers = [10, 20, 30]

# Low-level equivalent of: for x in numbers:
iterator = iter(numbers)  # 1. Obtain an iterator (numbers.__iter__())
while True:
    try:
        x = next(iterator) # 2. Fetch next item (iterator.__next__())
        print("Item:", x)
    except StopIteration: # 3. Stop cleanly when stream ends
        break

# 2. Safely fetching with a default fallback (No exception raised)
it = iter(["Apple", "Banana"])
print(next(it, "END"))  # "Apple"
print(next(it, "END"))  # "Banana"
print(next(it, "END"))  # "END" (Exhausted fallback)

# 3. Two-Argument Sentinel Iterator for Streaming I/O
# Calls func() repeatedly until it returns sentinel value (b"" for EOF)
# with open("large_file.bin", "rb") as f:
#     for chunk in iter(lambda: f.read(4096), b""):
#         process(chunk)
```

---

## Detailed Explanation

### 1. The Iterator Protocol Dunder Methods

An object is an **Iterator** if and only if it implements:
1. **`__next__(self)`**: Returns the next item from the stream. If no items remain, it **must raise `StopIteration`**.
2. **`__iter__(self)`**: **Must return `self`**. This allows iterators themselves to be passed to `for` loops, `zip()`, and `enumerate()`.

```python
class SimpleCountdownIterator:
    """A custom iterator that counts down from N to 1."""

    def __init__(self, start: int):
        self.current = start

    def __iter__(self):
        # Mandatory: Iterators must return self!
        return self

    def __next__(self) -> int:
        if self.current <= 0:
            raise StopIteration  # Signal stream termination
        val = self.current
        self.current -= 1
        return val

for count in SimpleCountdownIterator(3):
    print("Countdown:", count)
# Output:
# Countdown: 3
# Countdown: 2
# Countdown: 1
```

---

### 2. Separating the Iterable from the Iterator State

A common architectural mistake is making a container class its own iterator (`self.index = 0` in the collection class).

#### Why is that a bug?
If a container is its own iterator, **you can only iterate over it once!** Running two nested loops on the same container (`for a in c: for b in c:`) will fail because both loops share and mutate the same `self.index` cursor!

**The Proper Pattern**: Separate the **Iterable Collection** from a dedicated **Iterator Cursor Class**:

```python
# 1. The Dedicated Iterator (Maintains state cursor)
class InventoryIterator:
    def __init__(self, items: list[str]):
        self._items = items
        self._cursor = 0

    def __iter__(self):
        return self

    def __next__(self) -> str:
        if self._cursor >= len(self._items):
            raise StopIteration
        item = self._items[self._cursor]
        self._cursor += 1
        return item

# 2. The Reusable Iterable (Spawns a fresh iterator on every call to iter())
class InventoryCollection:
    def __init__(self, items: list[str]):
        self._items = list(items)

    def __iter__(self):
        # Spawns a fresh, independent iterator cursor every time!
        return InventoryIterator(self._items)

inventory = InventoryCollection(["Server-A", "Server-B"])

# Nested loops work perfectly because each loop gets an independent cursor!
for x in inventory:
    for y in inventory:
        print(f"Pair: ({x}, {y})")
```

---

### 3. The Double-Argument Sentinel Iterator: `iter(callable, sentinel)`

Python's built-in `iter()` function has a powerful, often-overlooked secondary form:

$$\textbf{iter}(\text{callable}, \text{sentinel})$$

This creates an iterator that invokes `callable()` with zero arguments on every `__next__()` call, yielding the return value until the return value equals `sentinel`, at which point it raises `StopIteration`.

```python
import random

# Roll a 6-sided die repeatedly until a '6' (sentinel) is rolled:
roll_die = lambda: random.randint(1, 6)

for roll in iter(roll_die, 6):
    print(f"Rolled: {roll}")

print("🎉 Rolled a 6! Loop terminated automatically.")
```

---

## Examples

### 1. Simple: Fibonacci Stream Iterator
Generating the mathematical Fibonacci sequence on-demand with constant $O(1)$ memory.

```python
class FibonacciIterator:
    """Infinite or bounded Fibonacci stream iterator."""

    def __init__(self, max_terms: int = 10):
        self.max_terms = max_terms
        self.count = 0
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self) -> int:
        if self.count >= self.max_terms:
            raise StopIteration
        val = self.a
        self.a, self.b = self.b, self.a + self.b
        self.count += 1
        return val

fib = FibonacciIterator(max_terms=8)
print("Fibonacci Stream:", list(fib))  # [0, 1, 1, 2, 3, 5, 8, 13]
```

### 2. Beginner: Reverse Sequence Traversal Iterator
Building a custom iterator that traverses any sequence in reverse order.

```python
class ReverseSequenceIterator:
    def __init__(self, sequence):
        self._seq = sequence
        self._index = len(sequence) - 1

    def __iter__(self):
        return self

    def __next__(self):
        if self._index < 0:
            raise StopIteration
        item = self._seq[self._index]
        self._index -= 1
        return item

letters = ["A", "B", "C", "D"]
rev = ReverseSequenceIterator(letters)
for ch in rev:
    print(f"Reverse Char: {ch}")
```

### 3. Intermediate: Infinite Circular Round-Robin Dispatcher
Cycling through a list of cluster nodes indefinitely using stateful modulo wrapping.

```python
class RoundRobinDispatcher:
    def __init__(self, servers: list[str]):
        if not servers:
            raise ValueError("Server list cannot be empty.")
        self.servers = list(servers)
        self.index = 0

    def __iter__(self):
        return self

    def __next__(self) -> str:
        server = self.servers[self.index]
        self.index = (self.index + 1) % len(self.servers)
        return server

cluster = RoundRobinDispatcher(["srv-node-01", "srv-node-02", "srv-node-03"])

# Dispatch 7 consecutive incoming requests across cluster
print("Dispatching incoming requests:")
for req_id in range(1, 8):
    target_node = next(cluster)
    print(f"  Request #{req_id} -> Dispatched to [{target_node}]")
```

### 4. Real-World: High-Speed Chunked Binary File Reader via Sentinel `iter()`
Streaming multi-gigabyte binary files in fixed 64 KB memory chunks using sentinel iterators.

```python
from pathlib import Path

def read_binary_chunks(filepath: Path, chunk_size: int = 64 * 1024):
    """Stream file chunks lazily in constant O(1) memory."""
    with open(filepath, "rb") as f:
        # Calls f.read(chunk_size) until it returns b"" (EOF sentinel)
        for chunk in iter(lambda: f.read(chunk_size), b""):
            yield chunk

# Generate test binary payload
test_file = Path("sample_stream.bin")
test_file.write_bytes(b"DATA_BLOCK_HEADER_" * 5000)

total_chunks = 0
for chunk in read_binary_chunks(test_file, chunk_size=1024):
    total_chunks += 1

print(f"✅ Processed {total_chunks} binary chunks in constant memory.")
test_file.unlink()  # Cleanup
```

### 5. Advanced: Stateful Windowing / Chunk Batching Iterator
Building an iterator that groups incoming stream elements into fixed-size batches `[item1, item2, item3]`.

```python
class ChunkBatchIterator:
    """Takes an arbitrary iterable and yields elements in batches of size N."""

    def __init__(self, iterable, batch_size: int):
        self.iterator = iter(iterable)
        self.batch_size = batch_size

    def __iter__(self):
        return self

    def __next__(self) -> list:
        batch = []
        for _ in range(self.batch_size):
            try:
                batch.append(next(self.iterator))
            except StopIteration:
                break

        if not batch:
            raise StopIteration
        return batch

stream_data = range(1, 11)  # 1 to 10
batcher = ChunkBatchIterator(stream_data, batch_size=3)

for batch in batcher:
    print("Batch Chunk:", batch)
# Output:
# Batch Chunk: [1, 2, 3]
# Batch Chunk: [4, 5, 6]
# Batch Chunk: [7, 8, 9]
# Batch Chunk: [10]
```

---

## Code Explanation

In Example 5 (`ChunkBatchIterator`):
1. `ChunkBatchIterator` takes any iterable (a list, a range, a network socket stream) and obtains its underlying iterator using `self.iterator = iter(iterable)`.
2. Inside `__next__()`, it runs a loop `range(self.batch_size)`, fetching elements via `next(self.iterator)`.
3. If `next()` raises `StopIteration` before the batch is full, the `try-except` cleanly breaks the inner loop.
4. If `batch` contains items, it returns the partial or full chunk. If `batch` is completely empty, it raises `StopIteration` to signal stream termination.
5. This is the exact architectural pattern used by machine learning batch loaders (like PyTorch `DataLoader`).

---

## Common Mistakes

### Mistake 1: Expecting an Exhausted Iterator to Restart
Iterators are **single-pass, expendable streams**. Once an iterator raises `StopIteration`, calling `next()` on it will continue raising `StopIteration`. It will never restart from the beginning!

```python
it = iter([1, 2, 3])
print(list(it))  # [1, 2, 3]
print(list(it))  # [] (EMPTY! Iterator is exhausted!)
```

### Mistake 2: Forgetting `return self` in `__iter__()`
If an iterator class does not return `self` from `__iter__()`, passing the iterator to a `for` loop or `list()` will raise `TypeError: iter() returned non-iterator of type 'NoneType'`.

---

## Best Practices

### Use `next(it, default)` for Safe Lookups
Instead of wrapping every manual `next()` call in a verbose `try-except StopIteration` block, pass a default fallback value.

Good:
```python
first_item = next(iterator, None)
```

Avoid:
```python
try:
    first_item = next(iterator)
except StopIteration:
    first_item = None
```

---

## Performance Considerations

1. **Constant $O(1)$ Memory**: Iterators produce elements lazily on demand. Iterating over `range(1_000_000_000)` consumes **48 bytes of RAM**, whereas a list of 1 billion numbers would require over **8 GB of RAM**.
2. **CPython `FOR_ITER` Opcode**: Python compiles `for` loops into the specialized C-level bytecode instruction `FOR_ITER`. It fetches the next item directly from the C-struct iterator slot, bypassing standard Python function call frame overhead.

---

## Security Considerations

1. **Infinite Stream Memory Denial of Service**: Never call `list()`, `set()`, or `tuple()` on an unbounded or untrusted iterator (e.g. `list(itertools.count())`), as this will consume 100% of host RAM and trigger an out-of-memory crash. Always bound unbounded iterators using `itertools.islice()`.
2. **Resource Cleanup**: Ensure custom file or network iterators close underlying OS file descriptors when `StopIteration` is raised.

---

## Real-World Usage

- **SQLAlchemy Server-Side Cursors**: Streaming millions of database rows from PostgreSQL in chunks of 500 without memory bloat.
- **Python Standard Library `csv.reader`**: Yielding parsed spreadsheet rows line-by-line.
- **AsyncIO Event Loops**: Managing coroutine scheduling via step-by-step iterator unwinding.

---

## Comparison: Iteration Abstractions

| Concept | Implements | Memory Footprint | Reusable? | Primary Purpose |
|---|---|---|---|---|
| **Iterable** | `__iter__()` | Variable (Holds data) | **Yes** | Data storage container |
| **Iterator** | `__iter__()` + `__next__()` | **Constant $O(1)$** | **No (Single-pass)** | Lazy on-demand stream cursor |
| **Generator** | Yield-based coroutine | **Constant $O(1)$** | **No (Single-pass)** | Stream functions |
| **Sequence** | `__len__()` + `__getitem__()`| $O(N)$ (In-memory) | **Yes** | Indexable arrays |

---

## Advanced Concepts: The CPython `FOR_ITER` Bytecode

Disassembling a standard `for` loop reveals how CPython optimizes the Iterator Protocol:

```python
import dis

def loop_demo():
    for x in [1, 2]:
        pass

dis.dis(loop_demo)
```

Bytecode Output:
1. `GET_ITER`: Invokes `iter(list)` to obtain the iterator.
2. `FOR_ITER`: Fast C-level slot invocation to retrieve the next item. If exhausted, branches forward to exit.
3. `STORE_FAST`: Assigns item to `x`.
4. `JUMP_BACKWARD`: Loops back to `FOR_ITER`.

---

## Exercises

### Exercise 1 — Beginner
Write a custom iterator `StepRange(start, stop, step)` that yields numbers from `start` up to `stop` by increments of `step`. Test with positive and negative steps.

### Exercise 2 — Intermediate
Write an iterable class `LineStripper` that wraps an open text file or string list and yields each line with leading and trailing whitespace stripped, automatically skipping blank lines.

### Exercise 3 — Advanced
Build a `LookaheadIterator` class that wraps any standard iterator and provides a `.peek() -> any` method that previews the next upcoming element without advancing the iterator cursor.

---

## Mini Project: Enterprise Chunked Data Ingestion & Transformation Pipeline

### Requirements
Build a high-performance data processing engine named `stream_pipeline.py`. Implement custom iterators for reading CSV records in fixed memory batches, filtering corrupted records, applying mathematical transforms, and writing output aggregates in constant $O(1)$ RAM.

### Implementation Blueprint
```python
import csv
from pathlib import Path
from typing import Iterator

# =====================================================================
# 1. STREAMING TRANSFORM ITERATORS
# =====================================================================

class CSVIterator:
    """Streams CSV rows lazily without loading the file into RAM."""

    def __init__(self, filepath: Path):
        self.filepath = filepath
        self._file_handle = None
        self._csv_reader = None

    def __iter__(self):
        self._file_handle = open(self.filepath, "r", newline="", encoding="utf-8")
        self._csv_reader = csv.DictReader(self._file_handle)
        return self

    def __next__(self) -> dict:
        try:
            return next(self._csv_reader)
        except StopIteration:
            if self._file_handle:
                self._file_handle.close()
            raise

class RecordFilterIterator:
    """Filters stream elements based on a boolean predicate."""

    def __init__(self, source_iterator: Iterator[dict], key: str, min_value: float):
        self.source = source_iterator
        self.key = key
        self.min_val = min_value

    def __iter__(self):
        return self

    def __next__(self) -> dict:
        while True:
            row = next(self.source)  # May raise StopIteration
            try:
                if float(row[self.key]) >= self.min_val:
                    return row
            except (ValueError, KeyError):
                continue  # Skip malformed rows

class BatchAggregatorIterator:
    """Collects stream records into fixed-size processing batches."""

    def __init__(self, source_iterator: Iterator[dict], batch_size: int = 3):
        self.source = source_iterator
        self.batch_size = batch_size

    def __iter__(self):
        return self

    def __next__(self) -> list[dict]:
        batch = []
        for _ in range(self.batch_size):
            try:
                batch.append(next(self.source))
            except StopIteration:
                break
        if not batch:
            raise StopIteration
        return batch

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE STREAMING DATA ITERATOR PIPELINE")
    print("=" * 65)
    
    # 1. Generate Sample CSV
    data_path = Path("raw_telemetry_stream.csv")
    with open(data_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["device_id", "temperature", "status"])
        for i in range(1, 11):
            writer.writerow([f"DEV-{i:03d}", f"{20.0 + i * 1.5:.1f}", "ONLINE"])
            
    # 2. Construct Composable Iterator Pipeline
    raw_stream = iter(CSVIterator(data_path))
    filtered_stream = RecordFilterIterator(raw_stream, key="temperature", min_value=26.0)
    batched_pipeline = BatchAggregatorIterator(filtered_stream, batch_size=2)
    
    # 3. Stream & Process in Constant Memory
    batch_index = 1
    for batch in batched_pipeline:
        print(f"\n📦 [BATCH #{batch_index}] ({len(batch)} Records):")
        for rec in batch:
            print(f"  -> Device: {rec['device_id']} | Temp: {rec['temperature']}°C | Status: {rec['status']}")
        batch_index += 1
        
    print("\n" + "=" * 65)
    data_path.unlink()  # Cleanup
```

---

## Summary

In this lesson, you mastered Python's Iterator Protocol:
- **Iterables** implement `__iter__()` returning a new iterator; **Iterators** implement `__next__()` and `__iter__()` returning `self`.
- **`StopIteration`** is the standard signal indicating stream exhaustion.
- Iterators are **stateful and single-pass**; once exhausted, they cannot be rewound.
- Use **`iter(callable, sentinel)`** for streaming I/O chunks until an EOF sentinel is reached.
- Custom iterators stream massive datasets in **constant $O(1)$ memory**.
- Separate the **Iterable Container** from the **Iterator Cursor** to support nested loops.

---

## Best Practices Checklist

- [ ] Always return `self` from an iterator's `__iter__()` method.
- [ ] Separate container data structures from iterator state cursors.
- [ ] Use `next(it, default)` for safe lookups without `try-except`.
- [ ] Use `iter(func, sentinel)` for chunked file reading.
- [ ] Never convert unbounded infinite iterators to lists without `itertools.islice()`.

---

## What's Next?

Now that you understand the Iterator Protocol, continue to:
👉 **[Generator Functions & The `yield` Statement](generator-functions-and-yield.md)** to master stack frame suspension, coroutine messaging with `.send()`, and sub-generator delegation with `yield from`!
