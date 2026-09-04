# For Loops & The Iteration Protocol in Python

## Introduction

In computer programming, iteration is the process of repeating a sequence of instructions over a collection of data items. Whether an application is processing millions of database records, aggregating daily financial transactions, rendering frames in a graphics engine, or transforming strings in a natural language pipeline, loops are the foundational engine of repetitive computation.

In many traditional programming languages (such as C, C++, or older versions of Java), the primary looping construct is an index-based counter loop: `for (int i = 0; i < N; i++)`. In Python, however, the `for` loop is designed around a fundamentally higher level of abstraction: **Definite Collection Iteration (the For-Each model)**. In Python, a `for` loop does not increment an arbitrary numeric index; instead, it iterates directly over the items of any **iterable** object (lists, tuples, dictionaries, sets, strings, files, or custom generators).

Understanding Python's `for` loop requires exploring the **Python Iteration Protocol**—the underlying contract of `__iter__()` and `__next__()` methods that powers all iteration in the language. By understanding how the lazy `range()` sequence works, how tuple unpacking operates within loop headers, and why anti-patterns like `for i in range(len(items)):` should be avoided, you will write cleaner, more Pythonic, and higher-performing algorithms.

This lesson builds directly upon [Control Flow Fundamentals](conditional-statements.md) and [Strings Slicing](../strings/string-slicing.md), preparing you to manipulate advanced collections and write elegant comprehensions in subsequent chapters.

---

## Prerequisites

Before studying `for` loops, ensure you have:

- Completed [Conditional Statements](conditional-statements.md).
- Familiarity with basic sequences (strings, lists, tuples) and dictionaries.
- A solid grasp of significant indentation and code block scoping.

---

## Core Concept

In Python, a `for` loop executes a block of code once for each element yielded by an **iterable**:

```
                       PYTHON FOR-EACH ITERATION CYCLE

          [ Target Iterable ] ──────► __iter__() ──────► [ Iterator Object ]
                                                               │
                                         ┌─────────────────────┘
                                         ▼
                                  [ Call __next__() ]
                                         │
                       ┌─────────────────┴─────────────────┐
                       ▼ (Yields Item)                     ▼ (Raises StopIteration)
              [ Bind Item to Variable ]              [ Terminate Loop ]
                       │                                   │
                       ▼                                   ▼
              [ Execute Loop Body ]               [ Continue Program ]
                       │
                       └────────► (Repeat Cycle)
```

### Key Iteration Tools:
1. **`range(start, stop, step)`**: A built-in sequence type that generates arithmetic progressions on demand with $O(1)$ memory consumption.
2. **`enumerate(iterable)`**: Yields pairs of `(index, item)` simultaneously.
3. **`zip(*iterables)`**: Iterates over multiple iterables in parallel, yielding tuples of corresponding elements.

---

## Syntax & Common Iteration Patterns

```python
# 1. Direct Sequence Iteration
languages = ["Python", "Rust", "Go", "TypeScript"]
for lang in languages:
    print(f"Language: {lang}")

# 2. Arithmetic Progressions with range()
# Generates numbers from 0 to 4 (5 items, stop is exclusive)
for i in range(5):
    print(i, end=" ")  # 0 1 2 3 4
print()

# range with start, stop, step
for n in range(10, 50, 10):
    print(n, end=" ")  # 10 20 30 40
print()

# 3. Iterating Over Dictionaries (Keys, Values, Items)
user_profile = {"id": 101, "name": "Hesam", "role": "Engineer"}

# Iterating over key-value pairs using tuple unpacking
for key, value in user_profile.items():
    print(f"{key:<6} -> {value}")

# 4. Simultaneous Index & Value with enumerate()
for idx, lang in enumerate(languages, start=1):
    print(f"{idx}. {lang}")
```

---

## Detailed Explanation

### 1. The `range()` Function: Lazy Memory-Efficient Sequences

In Python 3, `range()` is not a function that generates a giant list in memory; it is an **immutable sequence type**.

Evaluating `range(1_000_000_000)` does not allocate gigabytes of RAM. Instead, a `range` object stores only three integers in memory: `start`, `stop`, and `step`. It computes each subsequent integer lazily, on demand, when requested by a loop.

```python
import sys

small_range = range(10)
huge_range = range(1_000_000_000)

print(f"Memory for range(10)            : {sys.getsizeof(small_range)} bytes")  # 48 bytes
print(f"Memory for range(1,000,000,000) : {sys.getsizeof(huge_range)} bytes")   # 48 bytes!
```

### 2. The Python Iteration Protocol (`iter()` & `next()`)

Under the hood, when Python executes `for item in collection:`, it performs the following exact steps:
1. Calls `iter(collection)`, which invokes `collection.__iter__()` to obtain an **iterator** object.
2. Repeatedly calls `next(iterator)`, which invokes `iterator.__next__()` to retrieve the next value.
3. Catches the built-in `StopIteration` exception raised when no more items remain, cleanly terminating the loop without crashing.

```python
# Manual reproduction of what Python's 'for' loop does under the hood:
items = ["apple", "banana", "cherry"]
iterator = iter(items)

while True:
    try:
        fruit = next(iterator)
        print("Manual Next:", fruit)
    except StopIteration:
        print("End of iteration reached cleanly.")
        break
```

### 3. The Dangerous Anti-Pattern: `for i in range(len(items)):`

Programmers coming from C or Java often write index-based loops using `range(len(...))`. In Python, this is considered an un-idiomatic anti-pattern that impairs readability and performance.

```python
names = ["Alice", "Bob", "Charlie"]

# ANTI-PATTERN: Verbose, slow, un-Pythonic
for i in range(len(names)):
    print(f"Index {i}: {names[i]}")

# IDIOMATIC PATTERN: Clean, fast, uses enumerate()
for i, name in enumerate(names):
    print(f"Index {i}: {name}")
```

---

## Examples

### 1. Simple: Summing and Accumulating Values
Iterating through numerical metrics to calculate sum, maximum, and average.

```python
daily_temperatures = [21.5, 23.0, 19.8, 25.4, 22.1, 24.0, 20.2]

total_temp = 0.0
max_temp = daily_temperatures[0]

for temp in daily_temperatures:
    total_temp += temp
    if temp > max_temp:
        max_temp = temp

avg_temp = total_temp / len(daily_temperatures)

print(f"Readings Count : {len(daily_temperatures)}")
print(f"Average Temp   : {avg_temp:.2f}°C")
print(f"Peak Temp      : {max_temp:.2f}°C")
```

### 2. Beginner: Nested Loops & Mathematical Multiplication Grid
Using nested `for` loops to generate a formatted mathematical multiplication table.

```python
print("=" * 45)
print("           MULTIPLICATION TABLE (1 - 8)")
print("=" * 45)

# Outer loop: rows
for row in range(1, 9):
    # Inner loop: columns
    for col in range(1, 9):
        product = row * col
        print(f"{product:>4}", end=" ")
    print()  # Newline at end of each row
print("=" * 45)
```

### 3. Intermediate: Grouping and Aggregating Data
Processing a list of transaction records to group spending by category into a dictionary.

```python
transactions = [
    {"category": "Cloud Infrastructure", "amount": 250.00},
    {"category": "Office Supplies", "amount": 45.50},
    {"category": "Cloud Infrastructure", "amount": 180.00},
    {"category": "Software Licenses", "amount": 89.99},
    {"category": "Office Supplies", "amount": 12.00},
]

category_totals = {}

for tx in transactions:
    cat = tx["category"]
    amt = tx["amount"]
    
    # Initialize key if not present, then accumulate
    category_totals[cat] = category_totals.get(cat, 0.0) + amt

print("Departmental Expense Breakdown:")
for category, total in category_totals.items():
    print(f" -> {category:<22}: ${total:>8,.2f}")
```

### 4. Real-World: Multi-Sequence Parallel Processing with `zip()`
Synchronizing data across parallel lists (user IDs, usernames, and security statuses).

```python
user_ids = [1001, 1002, 1003, 1004]
usernames = ["hesam", "sarah_k", "alex_dev", "elena_m"]
statuses = ["ACTIVE", "ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]

print(f"{'ID':<6} {'USERNAME':<16} {'STATUS':<20}")
print("-" * 45)

# zip() pairs items from each sequence until the shortest sequence ends
for uid, name, status in zip(user_ids, usernames, statuses):
    print(f"{uid:<6} {name:<16} {status:<20}")
```

### 5. Advanced: Building a Custom Infinite Sequence & Fibonacci Iterator
Implementing a class that complies with the Python Iteration Protocol (`__iter__` and `__next__`).

```python
class FibonacciSequence:
    """An iterable that yields Fibonacci numbers up to a maximum limit."""
    def __init__(self, limit: int):
        self.limit = limit

    def __iter__(self):
        # Return an iterator instance (self, with reset state)
        self.a = 0
        self.b = 1
        self.count = 0
        return self

    def __next__(self) -> int:
        if self.count >= self.limit:
            raise StopIteration  # Signals loop termination!
            
        current = self.a
        self.a, self.b = self.b, self.a + self.b
        self.count += 1
        return current

print("First 10 Fibonacci Numbers using Custom Iterator:")
fib = FibonacciSequence(limit=10)
for num in fib:
    print(num, end=" -> ")
print("END")
```

---

## Code Explanation

In Example 5 (Custom Fibonacci Iterator):
1. The `FibonacciSequence` class implements `__iter__()`, marking it as an iterable object. When a `for` loop starts, it calls `__iter__()` which initializes the sequence state (`self.a = 0`, `self.b = 1`) and returns the iterator object.
2. The class implements `__next__()`, which computes the next Fibonacci number on demand using simultaneous assignment `self.a, self.b = self.b, self.a + self.b`.
3. When `self.count >= self.limit`, `__next__()` raises `StopIteration`.
4. Python's `for` loop catches `StopIteration` automatically and cleanly exits the loop.
5. This demonstrates that Python's `for` loop is completely agnostic to concrete types; it works with any class conforming to the Iteration Protocol.

---

## Common Mistakes

### Mistake 1: Modifying a Collection While Iterating Directly Over It
Modifying a list (adding or removing items) while looping over it alters the internal array indices, causing elements to be skipped or processed multiple times.

```python
# BROKEN:
items = [1, 2, 2, 3, 4]
for x in items:
    if x == 2:
        items.remove(x)  # Modifies list during iteration!
print(items)  # [1, 2, 3, 4] ❌ Missed the second '2'!

# CORRECT: Iterate over a copy or use a list comprehension
items = [x for x in [1, 2, 2, 3, 4] if x != 2]
print(items)  # [1, 3, 4] ✅
```

### Mistake 2: Confusing the `stop` Parameter in `range()`
Remember that `range(start, stop)` stops at `stop - 1`. To include the number 10, write `range(1, 11)`.

---

## Best Practices

### Use `enumerate()` for Index-Item Tracking
Whenever you need both the index offset and the item value, always use `enumerate()`.

Good:
```python
for index, task in enumerate(tasks, start=1):
    print(f"Task #{index}: {task.title}")
```

Avoid:
```python
index = 1
for task in tasks:
    print(f"Task #{index}: {task.title}")
    index += 1  # Manual counter bookkeeping prone to off-by-one errors
```

---

## Performance Considerations

1. **C-Level Iteration Speed**: Python's `for` loop runs at the C level inside `ceval.c` using the `FOR_ITER` opcode, making direct iteration over lists and tuples significantly faster than manual `while` loops with index lookups.
2. **`zip()` and Itertools Generators**: Using `zip()` or `itertools.islice()` processes streams element-by-element without building intermediate lists in memory, preserving minimal RAM footprints.

---

## Security Considerations

1. **Denial of Service via Unbounded Iteration**: When iterating over streams or user-submitted sequences in web requests, enforce maximum iteration thresholds to prevent malicious clients from triggering infinite loops.
2. **Circular Reference Hangs in Recursive Iteration**: When traversing graph structures or nested dictionaries with loops, maintain a `visited = set()` of object IDs to prevent infinite looping across cyclic references.

---

## Real-World Usage

- **ETL Data Pipelines**: Iterating over database cursors or CSV readers row-by-row, transforming data fields, and loading into data warehouses.
- **Batch Processing**: Splitting large datasets into batches of 100 items using `range(0, total, batch_size)` for efficient API calls.
- **Machine Learning Epochs**: Iterating through training batches and computing loss gradients across neural network parameters.

---

## Comparison: Loop Constructs

| Construct | Syntax | Iteration Model | Best Use Case |
|---|---|---|---|
| **`for` Loop** | `for x in iter:` | Definite (Known collection/range) | Traversing collections, fixed ranges |
| **`while` Loop** | `while condition:` | Indefinite (Condition driven) | Waiting for events, sentinel loops |
| **List Comp** | `[f(x) for x in iter]` | Declarative transformation | Creating transformed lists in memory |
| **Generator Exp**| `(f(x) for x in iter)` | Lazy transformation | Memory-efficient streaming pipelines |

---

## Advanced Concepts: The CPython `GET_ITER` & `FOR_ITER` Bytecodes

When disassembling a `for` loop with the `dis` module:

```python
import dis

def loop_demo():
    for x in range(3):
        pass

dis.dis(loop_demo)
```

The compiled bytecode reveals:
1. `GET_ITER`: Pops the iterable from the stack and pushes its iterator.
2. `FOR_ITER`: Calls the C-level `tp_iternext` function. If a value is returned, it pushes it to the stack; if `StopIteration` is raised, it jumps forward past the loop body.

This low-level C implementation makes Python's iterator loop one of the most optimized execution paths in the runtime.

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that iterates over the numbers from 1 to 30. For multiples of 3, print `"Fizz"`; for multiples of 5, print `"Buzz"`; for numbers divisible by both 3 and 5, print `"FizzBuzz"`; otherwise, print the number.

### Exercise 2 — Intermediate
Write a function `chunk_data(items: list, chunk_size: int) -> list[list]` that uses a `for` loop with `range(0, len(items), chunk_size)` and slicing to divide a list into smaller sub-lists of length `chunk_size`.

### Exercise 3 — Advanced
Build a `Matrix2D` class that stores a 2D grid of numbers. Implement `__iter__()` such that iterating directly over an instance of `Matrix2D` yields every individual cell value in row-major order (top-left to bottom-right).

---

## Mini Project: Batch Data Transformer & Matrix Calculation Engine

### Requirements
Build an analytical pipeline named `batch_processor.py` that processes a stream of customer sensor telemetry, partitions records into discrete batches, computes rolling statistical averages using nested loops, and outputs a formatted progress report.

### Implementation Blueprint
```python
class TelemetryBatchProcessor:
    def __init__(self, raw_readings: list[float], batch_size: int = 4):
        self.readings = raw_readings
        self.batch_size = batch_size

    def process_batches(self) -> list[dict]:
        results = []
        total_items = len(self.readings)
        
        # Partition data using range() stride
        for batch_idx, start_offset in enumerate(range(0, total_items, self.batch_size), start=1):
            batch_slice = self.readings[start_offset : start_offset + self.batch_size]
            
            # Aggregate metrics inside batch
            batch_sum = 0.0
            batch_min = batch_slice[0]
            batch_max = batch_slice[0]
            
            for val in batch_slice:
                batch_sum += val
                if val < batch_min:
                    batch_min = val
                if val > batch_max:
                    batch_max = val
                    
            batch_avg = batch_sum / len(batch_slice)
            
            results.append({
                "batch_num": batch_idx,
                "items_count": len(batch_slice),
                "avg": round(batch_avg, 2),
                "min": batch_min,
                "max": batch_max,
                "raw": batch_slice
            })
            
        return results

if __name__ == "__main__":
    sensor_stream = [22.1, 23.4, 21.8, 25.0, 24.2, 26.1, 23.9, 22.8, 27.5, 26.8]
    
    processor = TelemetryBatchProcessor(sensor_stream, batch_size=3)
    batch_reports = processor.process_batches()
    
    print("=" * 60)
    print("           TELEMETRY BATCH PROCESSING REPORT")
    print("=" * 60)
    print(f"{'BATCH':<8} {'COUNT':<8} {'AVG (°C)':>10} {'MIN':>8} {'MAX':>8} {'ITEMS'}")
    print("-" * 60)
    for b in batch_reports:
        print(f"#{b['batch_num']:<7} {b['items_count']:<8} {b['avg']:>10.2f} {b['min']:>8.1f} {b['max']:>8.1f} {str(b['raw']):<15}")
    print("=" * 60)
```

---

## Summary

In this lesson, you mastered Python's `for` loops and iteration protocol:
- Python's `for` loop is a **for-each iterator** that works directly over any iterable object.
- The `range(start, stop, step)` function is an immutable sequence that computes numbers lazily with $O(1)$ memory.
- The **Iteration Protocol** relies on `iter()` returning an iterator and `next()` raising `StopIteration`.
- Never use `for i in range(len(items)):`; use `enumerate()` or direct iteration.
- Use `zip()` to iterate through multiple collections in parallel.
- Never modify a collection while iterating directly over it.

---

## Best Practices Checklist

- [ ] Iterate directly over collections (`for item in items:`).
- [ ] Use `enumerate(items, start=1)` when you need element indices.
- [ ] Use `zip(list_a, list_b)` for multi-sequence parallel traversal.
- [ ] Use `dict.items()` with tuple unpacking (`for k, v in d.items():`) to iterate over key-value pairs.
- [ ] Avoid modifying lists during direct iteration; iterate over a slice copy or use comprehensions.

---

## What's Next?

Now that you have mastered `for` loops, continue to:
👉 **[While Loops](while-loops.md)** to master indefinite, condition-driven iteration and sentinel loops.
