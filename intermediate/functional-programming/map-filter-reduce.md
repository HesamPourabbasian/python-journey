# Map, Filter & Reduce in Python

## Introduction

In computer science, **Functional Programming (FP)** is a programming paradigm that treats computation as the evaluation of mathematical functions, avoiding mutable state, side-effects, and imperative loops.

At the core of functional programming sits the classic higher-order functional trinity:
- **`map()`**: Transforms every element in an iterable using a mapping function.
- **`filter()`**: Extracts elements from an iterable that satisfy a boolean predicate function.
- **`reduce()`** (from standard library **`functools`**): Folds or aggregates an entire sequence down to a single cumulative summary value.

In Python 3, both `map()` and `filter()` return **Lazy Iterators** operating in **constant $O(1)$ memory**, computing each transformed or filtered value on-demand.

While Pythonic **List Comprehensions** and **Generator Expressions** have largely replaced simple lambda-based `map()` and `filter()` calls in modern codebases, `map()`, `filter()`, and `reduce()` remain essential tools—especially when applying existing named C-functions (like `map(int, strings)`), composing functional pipelines, or implementing the distributed **MapReduce Pattern** for big data engineering.

This lesson explores `map()`, `filter()`, `functools.reduce()`, multi-sequence mapping, lazy evaluation mechanics, and performance trade-offs against comprehensions.

---

## Prerequisites

Before studying functional primitives, ensure you have:

- Completed [The Iterator Protocol](../iterators-generators/iterator-protocol.md).
- Completed [Lambda Functions & Anonymous Callables](../../beginner/functions/lambda-functions.md).
- Completed [List & Generator Comprehensions](../../beginner/comprehensions/list-comprehensions.md).

---

## Core Concept: The Functional Trinity

```
                             THE FUNCTIONAL TRINITY AT A GLANCE

       INPUT STREAM: [ 10, 25, 30, 45, 50 ]
                             │
                             ▼
      1. FILTER: filter(lambda x: x > 20, data)
         Extracts elements where predicate is True:
         Result -> [ 25, 30, 45, 50 ]
                             │
                             ▼
      2. MAP: map(lambda x: x * 1.10, data)
         Applies transformation to every element:
         Result -> [ 27.5, 33.0, 49.5, 55.0 ]
                             │
                             ▼
      3. REDUCE: functools.reduce(lambda acc, x: acc + x, data, 0.0)
         Folds stream into a single cumulative summary:
         Result -> 165.0 (Cumulative Total)
```

---

## Syntax & Essential Functional Patterns

```python
import functools

# 1. map(function, *iterables) -> Lazy Iterator
raw_numbers = ["10", "25", "50", "100"]
int_stream = map(int, raw_numbers)  # Applying existing named function
print("Mapped Integers:", list(int_stream)) # [10, 25, 50, 100]

# Multi-Sequence Parallel Mapping (Maps across multiple iterables simultaneously!)
prices = [100.0, 200.0, 300.0]
discounts = [0.10, 0.15, 0.20]
final_prices = list(map(lambda p, d: round(p * (1.0 - d), 2), prices, discounts))
print("Final Prices   :", final_prices) # [90.0, 170.0, 240.0]

# 2. filter(predicate_function, iterable) -> Lazy Iterator
scores = [45, 88, 92, 59, 78, 99]
passing_scores = list(filter(lambda s: s >= 75, scores))
print("Passing Scores :", passing_scores) # [88, 92, 78, 99]

# Special: filter(None, iterable) removes all Falsy elements (0, "", None, False)
clean_data = list(filter(None, ["Active", "", None, "Pending", 0, "Online"]))
print("Falsy Filtered :", clean_data) # ['Active', 'Pending', 'Online']

# 3. functools.reduce(function, iterable, [initial]) -> Single Value
numbers = [1, 2, 3, 4, 5]
product = functools.reduce(lambda acc, x: acc * x, numbers, 1)
print("Cumulative Prod:", product) # 120 (5! factorial)
```

---

## Detailed Explanation

### 1. Multi-Iterable Parallel Mapping with `map()`

Unlike list comprehensions (which require `zip()` for parallel looping), `map()` natively accepts **multiple iterables**. It passes the corresponding element from each sequence into the mapping function:

```python
names = ["Hesam", "Sarah", "Alex"]
departments = ["Engineering", "Finance", "DevOps"]
ids = [101, 102, 103]

# map() draws from all 3 lists simultaneously!
roster = list(map(lambda n, d, i: f"#{i}: {n} ({d})", names, departments, ids))
print("Mapped Roster:\n", "\n".join(roster))
```

Execution stops as soon as the shortest iterable is exhausted.

---

### 2. The `functools.reduce()` Folding Algorithm

`reduce(func, iterable, initial)` implements the **Left Fold** algorithm:

$$\text{accumulator} = \text{initial}$$

$$\text{for item in iterable: } \text{accumulator} = \text{func}(\text{accumulator}, \text{item})$$

```python
import functools

items = [10, 20, 30]

# Tracing reduction steps:
# Step 1: func(0, 10)  -> 10
# Step 2: func(10, 20) -> 30
# Step 3: func(30, 30) -> 60
total = functools.reduce(lambda acc, x: acc + x, items, 0)
```

#### Why You Must ALWAYS Provide the `initial` Argument:
If `initial` is omitted and the iterable is empty, Python raises `TypeError: reduce() of empty iterable with no initial value`. Always provide an explicit `initial` fallback value.

---

### 3. Comprehensions vs `map()` & `filter()`: Pythonic Standards

In modern Python:

| Use Case | Preferred Construct | Rationale |
|---|---|---|
| **Applying an existing named function** | **`map(int, strings)`** | Clean, fast C-speed execution |
| **Arithmetic transforms with lambdas** | **`[x * 2 for x in data]`** | Much more readable than `map(lambda x: ...)` |
| **Filtering with expressions** | **`[x for x in data if x > 0]`** | Avoids lambda function overhead |
| **Complex Multi-Stage Reductions** | **`functools.reduce`** | Standard functional fold |

---

## Examples

### 1. Simple: Mathematical Stream Transformations
Mapping Celsius temperatures to Fahrenheit and filtering freezing thresholds.

```python
celsius_readings = [-5.0, 0.0, 12.5, 22.0, -15.0, 30.0]

# 1. Map to Fahrenheit: (C * 9/5) + 32
fahrenheit_stream = map(lambda c: round((c * 9 / 5) + 32, 1), celsius_readings)

# 2. Filter Sub-Zero Freezing Temperatures (< 32°F)
freezing_temps = list(filter(lambda f: f < 32.0, fahrenheit_stream))

print("Sub-Zero Freezing Temperatures (°F):", freezing_temps) # [23.0, 5.0]
```

### 2. Beginner: Safe Deep Dictionary Traversal with `reduce()`
Navigating deeply nested JSON configurations safely without chaining multiple `get()` calls.

```python
import functools

nested_config = {
    "database": {
        "cluster": {
            "primary": {
                "host": "db-prod-01.internal",
                "port": 5432
            }
        }
    }
}

def deep_get(dictionary: dict, path: str, default: any = None) -> any:
    """Traverse deep dictionary keys using functools.reduce."""
    keys = path.split(".")
    try:
        return functools.reduce(lambda acc, k: acc[k], keys, dictionary)
    except (KeyError, TypeError):
        return default

host = deep_get(nested_config, "database.cluster.primary.host")
port = deep_get(nested_config, "database.cluster.primary.port")
missing = deep_get(nested_config, "database.cluster.backup.host", default="NO_BACKUP")

print(f"Primary DB : {host}:{port}")
print(f"Backup DB  : {missing}")
```

### 3. Intermediate: Greatest Common Divisor (GCD) on an Arbitrary List
Using `functools.reduce` with `math.gcd` to compute the GCD across an entire array of numbers.

```python
import functools
import math

numbers = [48, 72, 120, 360]

# reduce applies math.gcd iteratively: gcd(gcd(gcd(48, 72), 120), 360)
overall_gcd = functools.reduce(math.gcd, numbers)
print(f"Greatest Common Divisor of {numbers} = {overall_gcd}") # 24
```

### 4. Real-World: Word Count MapReduce Engine on Text Streams
Implementing the classic Google MapReduce algorithm in pure functional Python.

```python
import functools
from collections import Counter

documents = [
    "cloud computing architecture microservices",
    "microservices distributed systems cloud",
    "python functional programming cloud architecture"
]

# STAGE 1: MAP (Tokenize each document into word frequency Counter)
def map_document_to_counter(doc: str) -> Counter:
    words = doc.lower().split()
    return Counter(words)

mapped_counters = map(map_document_to_counter, documents)

# STAGE 2: REDUCE (Merge individual Counters by summing frequencies)
def reduce_counters(acc: Counter, next_counter: Counter) -> Counter:
    acc.update(next_counter)
    return acc

total_word_frequencies = functools.reduce(reduce_counters, mapped_counters, Counter())

print("MapReduce Global Word Frequency Summary:")
print("-" * 45)
for word, count in total_word_frequencies.most_common():
    print(f"  • {word:<18} : {count} occurrences")
```

### 5. Advanced: Composable Functional Transformation Pipeline
Composing higher-order functions dynamically into a single reusable processing pipeline.

```python
import functools
from typing import Callable

def compose(*functions: Callable) -> Callable:
    """Compose multiple functions into a single pipeline: compose(f, g, h)(x) == f(g(h(x)))."""
    return functools.reduce(lambda f, g: lambda x: f(g(x)), functions)

# Define pure transformation functions
strip_text = lambda s: s.strip()
remove_special = lambda s: "".join(ch for ch in s if ch.isalnum() or ch.isspace())
to_title = lambda s: s.title()

# Compose into a single pipeline callable
clean_pipeline = compose(to_title, remove_special, strip_text)

raw_inputs = ["   hesam!! pourabbasain   ", "sarah@#$ jenkins   ", "  alex---rivera "]
cleaned_results = list(map(clean_pipeline, raw_inputs))

print("Cleaned Pipeline Results:")
for name in cleaned_results:
    print("  👉", name)
```

---

## Code Explanation

In Example 4 (MapReduce Word Count):
1. **Map Stage**: `map(map_document_to_counter, documents)` converts each string into an independent `collections.Counter({"cloud": 1, ...})`.
2. **Reduce Stage**: `functools.reduce(reduce_counters, mapped_counters, Counter())` folds all independent Counters into a single consolidated frequency map.
3. This is the exact mathematical foundation of **Apache Hadoop and Apache Spark** distributed computing frameworks.

---

## Common Mistakes

### Mistake 1: Expecting `map()` or `filter()` to be a List in Python 3
In Python 3, `map()` and `filter()` return **Lazy Iterators**. Printing them displays `<map object at 0x103...>` rather than `[1, 2, 3]`. You must iterate over them with a `for` loop or explicitly pass them to `list()`.

### Mistake 2: Calling `reduce()` on an Empty Sequence Without Initializer
Writing `functools.reduce(lambda a, b: a + b, [])` raises `TypeError: reduce() of empty iterable with no initial value`. Always supply the `initial` parameter (`functools.reduce(..., [], 0)`).

---

## Best Practices

### Use `map(NamedFunction, data)` When Applying Pre-Existing Callables
When calling built-in or pre-existing functions, `map()` is cleaner and faster than a comprehension.

Good:
```python
numbers = list(map(int, string_list))
```

Avoid:
```python
numbers = [int(s) for s in string_list] # Redundant lambda/comprehension syntax
```

---

## Performance Considerations

1. **C-Speed Execution**: Calling `map(float, data)` executes at full C-speed inside the Python interpreter without executing Python bytecode instructions per element.
2. **Comprehension Speed with Lambdas**: If a transformation requires a custom `lambda`, a **List Comprehension is faster** than `map(lambda ...)` because the comprehension avoids function call stack frame overhead for every element.

---

## Security Considerations

1. **Pure Reductions**: Ensure reduction functions are **pure and deterministic**. Side-effects inside `reduce()` (like logging to a network or mutating external variables) can lead to non-deterministic race conditions when scaling to multithreaded or distributed environments.
2. **Unbounded Map Streams**: `map()` on an infinite generator produces an infinite iterator. Ensure consumer loops are bounded.

---

## Real-World Usage

- **Apache Spark / PySpark**: `.map(func)`, `.filter(func)`, and `.reduceByKey(func)` transformations on RDD distributed datasets.
- **Data Ingestion Pipelines**: Type-casting incoming database or CSV string columns with `map()`.
- **Deep Dictionary Navigation**: Extracting nested API configuration parameters with `reduce()`.

---

## Comparison: Functional Primitives vs Comprehensions

| Operation | Functional Construct | Comprehension Equivalent | Best Pythonic Choice |
|---|---|---|---|
| **Transform with Named Func** | `map(int, data)` | `[int(x) for x in data]` | **`map(int, data)`** |
| **Transform with Expression** | `map(lambda x: x*2, data)` | `[x * 2 for x in data]` | **`[x * 2 for x in data]`** |
| **Filter with Expression** | `filter(lambda x: x>0, data)`| `[x for x in data if x>0]` | **`[x for x in data if x>0]`**|
| **Truthiness Filter** | `filter(None, data)` | `[x for x in data if x]` | **`filter(None, data)`** |
| **Cumulative Folding** | `functools.reduce(fn, data)` | Manual `for` loop | **`functools.reduce()`** |

---

## Advanced Concepts: Parallel Map with `multiprocessing.Pool`

The functional `map()` construct scales seamlessly to multi-core parallel computing using the standard library **`multiprocessing`** module:

```python
import multiprocessing

def compute_heavy_task(n: int) -> int:
    return sum(i ** 2 for i in range(n))

if __name__ == "__main__":
    tasks = [500_000, 600_000, 700_000, 800_000]
    
    # Parallel Map across all CPU cores!
    with multiprocessing.Pool() as pool:
        results = pool.map(compute_heavy_task, tasks)
        
    print("Multi-Core Parallel Map Results:", results)
```

---

## Exercises

### Exercise 1 — Beginner
Given a list of strings `names = ["  hesam ", " sarah", "ALEX  "]`, use `map()` to strip whitespace and title-case every string.

### Exercise 2 — Intermediate
Given a list of employee dictionaries `[{"name": "Hesam", "active": True, "salary": 120000}, ...]`, use `filter()` to select active employees and `map()` to extract their salaries, then use `sum()` to calculate the total active payroll.

### Exercise 3 — Advanced
Using `functools.reduce()`, write a function `flatten_nested_dictionary(nested_dict: dict) -> dict` that flattens a multi-level nested dictionary into dot-separated keys (e.g. `{"a": {"b": 1}}` $\rightarrow$ `{"a.b": 1}`).

---

## Mini Project: Enterprise Functional Log Stream MapReduce Analytics Engine

### Requirements
Build an operational log analytics engine named `mapreduce_log_engine.py`. Ingest continuous streams of server access logs, transform entries with `map()`, filter high-severity error incidents with `filter()`, and compute statistical aggregates using `functools.reduce()`.

### Implementation Blueprint
```python
import functools
from collections import Counter
from datetime import datetime, timezone

# =====================================================================
# 1. RAW LOG DATA STREAM
# =====================================================================

RAW_ACCESS_LOGS = [
    "2024-05-18T10:00:01Z | /api/v1/auth     | 200 | 45ms  | US-EAST",
    "2024-05-18T10:00:02Z | /api/v1/checkout | 500 | 850ms | US-WEST",
    "2024-05-18T10:00:03Z | /api/v1/products | 200 | 32ms  | EU-CENTRAL",
    "2024-05-18T10:00:04Z | /api/v1/checkout | 504 | 1200ms| US-EAST",
    "2024-05-18T10:00:05Z | /api/v1/auth     | 401 | 25ms  | US-WEST",
    "2024-05-18T10:00:06Z | /api/v1/payment  | 500 | 920ms | US-WEST",
    "2024-05-18T10:00:07Z | /api/v1/products | 200 | 38ms  | US-EAST",
]

# =====================================================================
# 2. PURE FUNCTIONAL TRANSFORMATION STAGES
# =====================================================================

def parse_log_line(line: str) -> dict:
    """Pure mapping transform: String -> Structured Dictionary."""
    parts = [p.strip() for p in line.split("|")]
    return {
        "timestamp": parts[0],
        "endpoint": parts[1],
        "status": int(parts[2]),
        "latency_ms": int(parts[3].replace("ms", "")),
        "region": parts[4]
    }

def is_server_error(record: dict) -> bool:
    """Pure predicate: Returns True for HTTP 5xx errors."""
    return record["status"] >= 500

def aggregate_telemetry(acc: dict, record: dict) -> dict:
    """Pure reducer folding stream into summary statistics."""
    acc["total_requests"] += 1
    acc["total_latency"] += record["latency_ms"]
    acc["endpoint_counts"][record["endpoint"]] += 1
    acc["region_counts"][record["region"]] += 1
    if record["status"] >= 500:
        acc["error_count"] += 1
    return acc

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE FUNCTIONAL MAPREDUCE ANALYTICS ENGINE")
    print("=" * 68)
    
    # 1. MAP STAGE: Parse strings to typed dictionaries
    parsed_stream = map(parse_log_line, RAW_ACCESS_LOGS)
    
    # 2. REDUCE STAGE: Aggregate telemetry across all requests
    initial_acc = {
        "total_requests": 0,
        "total_latency": 0,
        "error_count": 0,
        "endpoint_counts": Counter(),
        "region_counts": Counter()
    }
    
    summary = functools.reduce(aggregate_telemetry, parsed_stream, initial_acc)
    
    # 3. FILTER STAGE: Extract only critical 5xx errors for incident reporting
    parsed_again = map(parse_log_line, RAW_ACCESS_LOGS)
    error_incidents = list(filter(is_server_error, parsed_again))
    
    avg_latency = summary["total_latency"] / summary["total_requests"]
    
    # 4. Render Analytics Dashboard
    print(f"  Total Ingested Events : {summary['total_requests']}")
    print(f"  Critical 5xx Failures : {summary['error_count']} incidents")
    print(f"  Mean Request Latency  : {avg_latency:.1f} ms")
    print("-" * 68)
    print("  Regional Traffic Distribution:")
    for region, count in summary["region_counts"].items():
        print(f"   • {region:<14} : {count} requests")
    print("-" * 68)
    print("  Critical Incident Log Sample (filter):")
    for err in error_incidents:
        print(f"   🚨 [{err['status']}] {err['endpoint']} ({err['latency_ms']}ms) in {err['region']}")
    print("=" * 68)
```

---

## Summary

In this lesson, you mastered Python's functional programming triad:
- **`map(func, *iterables)`** applies a transformation function across one or more streams lazily in **constant $O(1)$ memory**.
- **`filter(predicate, iterable)`** extracts matching elements lazily; use `filter(None, data)` to strip all Falsy values.
- **`functools.reduce(func, iterable, [initial])`** folds a sequence into a single cumulative summary value.
- Always provide an **`initial`** argument to `reduce()` to prevent crashes on empty sequences.
- Prefer **List Comprehensions** for simple inline expressions with lambdas, and prefer **`map()`** when applying pre-existing named functions.
- Compose higher-order functions to build clean **MapReduce data engineering pipelines**.

---

## Best Practices Checklist

- [ ] Use `map(named_func, data)` when applying pre-existing functions like `int` or `str.strip`.
- [ ] Use list or generator comprehensions instead of `map(lambda x: ...)` for custom inline expressions.
- [ ] Always provide an explicit `initial` value when calling `functools.reduce()`.
- [ ] Use `filter(None, data)` for clean truthiness filtering.
- [ ] Ensure functions passed to `map`, `filter`, and `reduce` are pure and free of side-effects.

---

## What's Next?

Now that you understand `map`, `filter`, and `reduce`, continue to the final article in this module:
👉 **[Functools & Operator Modules](functools-itertools-operator.md)** to master C-speed item getters with `operator` and single-dispatch polymorphism with `@functools.singledispatch`.
