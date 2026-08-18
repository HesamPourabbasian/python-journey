# List Comprehensions in Python

## Introduction

In computer programming, transforming one collection of data into another is among the most frequent operations an engineer performs. Whether converting a list of raw string timestamps into parsed datetime objects, extracting specific columns from database query rows, or filtering out invalid sensor readings, traditional imperative languages require a verbose boilerplate pattern: allocating an empty array, declaring a loop, writing conditional branch checks, and repeatedly invoking an append method.

In Python, this entire pipeline is expressed cleanly and declaratively using a **List Comprehension**.

Derived from mathematical **Set-Builder Notation** ($\{f(x) \mid x \in S \land P(x)\}$), list comprehensions combine mapping (transformation) and filtering into a single, highly readable statement.

Crucially, list comprehensions are not merely syntactic sugar. Under the hood, CPython compiles list comprehensions into specialized, optimized bytecode instructions that execute at the C level using the **`LIST_APPEND`** opcode. Consequently, list comprehensions execute **30% to 40% faster** than equivalent manual `for` loops with `.append()`.

Mastering list comprehensions requires understanding the distinction between filter conditions and inline ternary transforms, knowing the execution order of nested multi-loop comprehensions, leveraging the **Walrus Operator (`:=`)** to avoid duplicate computations, and recognizing when a comprehension becomes too complex and should be refactored into a standard `for` loop.

This lesson opens **Module 8: Comprehensions**, establishing the foundations of Python's declarative data transformation paradigm.

---

## Prerequisites

Before studying list comprehensions, ensure you have:

- Completed [Lists & Dynamic Arrays](../collections/lists.md).
- Completed [For Loops & The Iteration Protocol](../control-flow/for-loops.md).
- Completed [Conditional Statements](../control-flow/conditional-statements.md).

---

## Core Concept

A list comprehension constructs a new list by applying an expression to each element of an iterable, optionally filtering elements based on a boolean condition:

$$\textbf{[} \quad \text{expression} \quad \textbf{for} \quad \text{item} \quad \textbf{in} \quad \text{iterable} \quad (\textbf{if} \quad \text{condition}) \quad \textbf{]}$$

```
                           ANATOMY OF A LIST COMPREHENSION

         [ transform(x)   for x in dataset   if is_valid(x) ]
           │              │                  │
           ▼              ▼                  ▼
     1. EXPRESSION    2. ITERATION       3. FILTER (Optional)
     What to put in   Loop over each     Only include item
     the new list     item in source     if this evaluates True
```

---

## Syntax & Essential Comprehension Patterns

```python
# 1. Basic Mapping (Transform every item)
numbers = [1, 2, 3, 4, 5]
squares = [x ** 2 for x in numbers]                # [1, 4, 9, 16, 25]

# 2. Filtering (Keep only items matching condition)
evens = [x for x in numbers if x % 2 == 0]         # [2, 4]

# 3. Mapping AND Filtering Combined
even_squares = [x ** 2 for x in numbers if x % 2 == 0]  # [4, 16]

# 4. Inline Ternary Transformation (If-Else at the FRONT)
labels = ["EVEN" if x % 2 == 0 else "ODD" for x in numbers]  # ['ODD', 'EVEN', 'ODD', 'EVEN', 'ODD']

# 5. Matrix Flattening (Nested Loops)
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [cell for row in matrix for cell in row]  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# 6. Walrus Operator (:=) in Filtering (Python 3.8+)
words = ["python", "go", "c", "typescript", "rust"]
# Compute len(w) once, filter by length >= 4, and store length:
long_lengths = [length for w in words if (length := len(w)) >= 4] # [6, 10, 4]
```

---

## Detailed Explanation

### 1. Filter Condition (`if` at the End) vs Ternary (`if-else` at the Front)

A frequent point of confusion is where to place `if` statements in a comprehension:

- **Filter Condition (At the End)**: `[expr for x in iter if condition]`
  - Used to **filter out items**. The resulting list will have fewer (or equal) elements than the original.
- **Ternary Value Expression (At the Front)**: `[val_if_true if cond else val_if_false for x in iter]`
  - Used to **transform every item**. The resulting list will have the **exact same length** as the original.

```python
data = [10, -5, 20, -8, 30]

# 1. FILTER: Discard negative numbers (Result is shorter: length 3)
positive_only = [x for x in data if x > 0]
print("Filtered:", positive_only)  # [10, 20, 30]

# 2. TERNARY TRANSFORM: Replace negatives with 0 (Result is same length: length 5)
clamped = [x if x > 0 else 0 for x in data]
print("Clamped :", clamped)        # [10, 0, 20, 0, 30]
```

---

### 2. Nested Comprehensions & Loop Ordering

When writing multi-loop comprehensions (such as flattening a 2D matrix or generating Cartesian products), the `for` clauses appear in the **exact same order as they would in traditional nested `for` loops**:

```python
matrix = [
    [1, 2],
    [3, 4]
]

# TRADITIONAL NESTED LOOP:
flat_list = []
for row in matrix:          # 1. Outer Loop
    for cell in row:        # 2. Inner Loop
        flat_list.append(cell)

# EQUIVALENT LIST COMPREHENSION:
# Outer loop appears first, inner loop appears second!
flat_comp = [cell for row in matrix for cell in row]
print("Flattened:", flat_comp)  # [1, 2, 3, 4]
```

---

### 3. Scope Isolation in Python 3

In Python 2, the loop variable in a list comprehension leaked into the surrounding local namespace, potentially overwriting existing variables.

In **Python 3**, list comprehensions are executed in their own private implicit function scope. Loop variables **never leak** into the enclosing scope:

```python
x = "GLOBAL_UNTOUCHED"

# The 'x' inside the comprehension is completely isolated!
squares = [x ** 2 for x in range(5)]

print("Loop result :", squares)  # [0, 1, 4, 9, 16]
print("Outer x      :", x)        # "GLOBAL_UNTOUCHED" ✅ Zero scope leakage!
```

---

## Examples

### 1. Simple: String Normalization and Whitespace Stripping
Cleaning a list of raw user inputs.

```python
raw_inputs = ["   Admin  ", "editor", "  GUEST ", "  ", "Subscriber "]

# Strip whitespace, lowercase, and discard empty strings
clean_roles = [r.strip().lower() for r in raw_inputs if r.strip()]

print("Clean Roles:", clean_roles)  # ['admin', 'editor', 'guest', 'subscriber']
```

### 2. Beginner: File Path and Extension Filtering
Extracting specific image asset names from a directory inventory.

```python
file_manifest = [
    "index.html", "app.py", "banner.png", "logo.PNG", 
    "styles.css", "profile_thumb.jpg", "README.md"
]

# Extract base names of all PNG and JPG image files in lowercase
IMAGE_EXTS = (".png", ".jpg", ".jpeg")
image_assets = [
    f.lower() for f in file_manifest 
    if f.lower().endswith(IMAGE_EXTS)
]

print("Image Assets:", image_assets)  # ['banner.png', 'logo.png', 'profile_thumb.jpg']
```

### 3. Intermediate: Transposing a 2D Matrix
Using nested list comprehensions to swap rows and columns of a matrix.

```python
matrix_3x4 = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12]
]

# Transpose matrix: Swap rows and columns -> 4x3 matrix
transposed = [[row[col_idx] for row in matrix_3x4] for col_idx in range(4)]

print("Original 3x4 Matrix:")
for r in matrix_3x4:
    print(" ", r)

print("\nTransposed 4x3 Matrix:")
for r in transposed:
    print(" ", r)
```

### 4. Real-World: URL Query String Parser with Walrus Operator (`:=`)
Extracting and parsing structured query parameters from HTTP URL logs without duplicate splitting.

```python
import urllib.parse

raw_urls = [
    "https://api.cloud.com/v1/search?q=python&page=2&limit=50",
    "https://api.cloud.com/v1/health",
    "https://api.cloud.com/v1/users?role=admin&active=true",
    "https://api.cloud.com/v1/status"
]

# Extract parsed query dictionaries only for URLs containing queries
# Uses Walrus operator (:=) to parse query string once!
parsed_queries = [
    urllib.parse.parse_qs(query)
    for url in raw_urls
    if (query := urllib.parse.urlparse(url).query)
]

print("Parsed HTTP Query Parameters:")
for q in parsed_queries:
    print(" ->", q)
```

### 5. Advanced: Performance Benchmarking (`for` loop vs `map()` vs List Comp)
Measuring execution speeds across transformation techniques using `timeit`.

```python
import timeit

setup_code = "data = list(range(1000))"

# Approach 1: Standard for loop with append
stmt_for_loop = """
res = []
for x in data:
    if x % 2 == 0:
        res.append(x * 2)
"""

# Approach 2: map() + filter() + lambda
stmt_map_filter = "res = list(map(lambda x: x * 2, filter(lambda x: x % 2 == 0, data)))"

# Approach 3: List Comprehension
stmt_list_comp = "res = [x * 2 for x in data if x % 2 == 0]"

t_loop = timeit.timeit(stmt_for_loop, setup=setup_code, number=5000)
t_map = timeit.timeit(stmt_map_filter, setup=setup_code, number=5000)
t_comp = timeit.timeit(stmt_list_comp, setup=setup_code, number=5000)

print(f"Manual For Loop with .append() : {t_loop:.4f}s")
print(f"map() + filter() + lambda     : {t_map:.4f}s")
print(f"List Comprehension (LIST_APPEND): {t_comp:.4f}s (🚀 Fast & Idiomatic!)")
```

---

## Code Explanation

In Example 5 (Performance Benchmarking):
1. The manual `for` loop repeatedly dispatches the `.append` attribute lookup and function frame call in Python bytecode for every single item.
2. The `map() + filter()` approach incurs Python interpreter function dispatch overhead for every invocation of the lambda expression.
3. The **List Comprehension** is compiled into a single C-level loop that uses the specialized CPython opcode **`LIST_APPEND`**, bypassing method lookups and avoiding Python frame stack allocation.
4. Consequently, list comprehensions are typically **30% to 50% faster** than manual loops in CPython.

---

## Common Mistakes

### Mistake 1: Using List Comprehensions Solely for Side Effects
Never use a list comprehension if you are not interested in the resulting list (e.g., printing to terminal or writing to a file). Constructing an unused list in memory wastes RAM.

```python
# AVOID (Anti-Pattern - Creates a wasted list of [None, None, ...]):
[print(x) for x in range(10)]

# GOOD (Idiomatic):
for x in range(10):
    print(x)
```

### Mistake 2: Writing Overly Nested Comprehensions
Nesting 3 or more `for` clauses inside a single comprehension destroys code readability. If a comprehension exceeds two lines or two loops, refactor it into standard `for` loops.

---

## Best Practices

### Multi-Line Formatting for Complex Comprehensions
When a list comprehension includes both a mapping expression and a filter condition, format it across multiple indented lines for maximum readability (PEP 8).

Good:
```python
active_verified_emails = [
    user.email.lower()
    for user in user_roster
    if user.is_active and user.is_email_verified
]
```

Avoid:
```python
active_verified_emails = [user.email.lower() for user in user_roster if user.is_active and user.is_email_verified] # Crammed on one line
```

---

## Performance Considerations

1. **Memory Allocation**: List comprehensions allocate the entire resulting list in RAM eagerly. If processing a stream of 100,000,000 items, a list comprehension will consume gigabytes of memory. Use a **Generator Expression `(x for x in ...)`** for memory-efficient streaming.
2. **Pre-allocation Optimization**: In CPython 3.12+, the internal list allocation buffer inside list comprehensions grows dynamically with minimal realloc overhead.

---

## Security Considerations

1. **Denial of Service via Unbounded Comprehensions**: In web endpoints, never construct a list comprehension directly over unvalidated user-supplied integer ranges (e.g., `[x for x in range(user_count)]`), as an attacker requesting $10^9$ items can trigger an Out-Of-Memory (OOM) crash.
2. **Preventing Code Injection**: Avoid using `eval()` or dynamic string compiling inside comprehension expressions.

---

## Real-World Usage

- **ETL Data Cleaning**: Stripping null characters, normalizing text casings, and parsing raw CSV columns.
- **Computer Vision & Graphics**: Flattening pixel color grids and applying brightness matrices.
- **REST API Response Serialization**: Transforming database ORM model instances into JSON-serializable dictionaries.

---

## Comparison: List Construction Techniques

| Technique | Syntax | Readability | CPython Speed | Memory Footprint |
|---|---|---|---|---|
| **List Comprehension** | `[f(x) for x in l if c]` | **Highest (Declarative)**| **Fastest (`LIST_APPEND`)**| Eager (Full List in RAM) |
| **Manual `for` Loop** | `for x in l: res.append()`| High (Explicit) | Slower (Repeated `.append`)| Eager (Full List in RAM) |
| **`map()` / `filter()`**| `list(map(f, filter(c, l)))`| Moderate | Slower (Lambda overhead) | Eager (when materialized) |
| **Generator Exp** | `(f(x) for x in l if c)` | High (Declarative) | Fast | **Minimal ($O(1)$ Memory)** |

---

## Advanced Concepts: The CPython `LIST_APPEND` Opcode

Inspecting the compiled bytecode of a list comprehension with `dis`:

```python
import dis

def comp_demo():
    return [x * 2 for x in range(5)]

dis.dis(comp_demo)
```

The bytecode demonstrates that Python initializes a pre-allocated list (`BUILD_LIST`) and uses the native C opcode `LIST_APPEND` to push items directly into the array buffer without executing Python-level method dispatches.

---

## Exercises

### Exercise 1 — Beginner
Given a list of words `["apple", "banana", "kiwi", "cherry", "fig", "strawberry"]`, write a list comprehension that creates a list containing the uppercase versions of only the words with 5 or more characters.

### Exercise 2 — Intermediate
Given a 2D matrix of numbers `grid = [[1, -2, 3], [-4, 5, -6], [7, 8, -9]]`, write a single nested list comprehension that flattens the matrix into a 1D list containing only the positive numbers.

### Exercise 3 — Advanced
Given a list of raw email strings with potential whitespace, duplicates, and missing `@` symbols, write a multi-line list comprehension that cleans the whitespace, lowercases the strings, uses the Walrus operator `:=` to extract domain names, and returns only valid email domains.

---

## Mini Project: Tabular Financial Ledger Matrix Transformer & Normalizer

### Requirements
Build a financial data transformation module named `matrix_transformer.py` that accepts raw multi-currency ledger rows, uses list comprehensions to sanitize data, converts foreign currencies to USD, transposes ledger tables for financial reporting, and computes column-wise balances.

### Implementation Blueprint
```python
class FinancialLedgerTransformer:
    # Exchange rates to USD
    EXCHANGE_RATES = {
        "USD": 1.0,
        "EUR": 1.08,
        "GBP": 1.27,
        "CAD": 0.73
    }

    @classmethod
    def process_raw_ledger(cls, raw_records: list[dict]) -> list[dict]:
        """Sanitize records, convert amounts to USD, and categorize transactions."""
        # List comprehension transforming raw transactions
        normalized_ledger = [
            {
                "tx_id": rec["id"].upper().strip(),
                "category": rec["category"].strip().title(),
                "original_currency": rec["currency"].upper(),
                "amount_usd": round(rec["amount"] * cls.EXCHANGE_RATES.get(rec["currency"].upper(), 1.0), 2),
                "is_high_value": (rec["amount"] * cls.EXCHANGE_RATES.get(rec["currency"].upper(), 1.0)) >= 1000.0
            }
            for rec in raw_records
            if rec.get("status", "").upper() == "COMPLETED" and rec.get("amount", 0) > 0
        ]
        return normalized_ledger

    @staticmethod
    def extract_category_matrix(ledger: list[dict]) -> list[list[any]]:
        """Extract a 2D tabular matrix: [[tx_id, category, amount_usd], ...]"""
        return [[row["tx_id"], row["category"], row["amount_usd"]] for row in ledger]

if __name__ == "__main__":
    sample_raw_feed = [
        {"id": "tx-101 ", "category": "cloud servers", "amount": 450.00, "currency": "EUR", "status": "COMPLETED"},
        {"id": "tx-102 ", "category": "software license", "amount": 1200.00, "currency": "USD", "status": "COMPLETED"},
        {"id": "tx-103 ", "category": "hardware", "amount": 800.00, "currency": "GBP", "status": "COMPLETED"},
        {"id": "tx-104 ", "category": "office supplies", "amount": 50.00, "currency": "USD", "status": "FAILED"}, # Filtered out!
        {"id": "tx-105 ", "category": "domain renewal", "amount": 15.00, "currency": "CAD", "status": "COMPLETED"},
    ]
    
    print("=" * 65)
    print("           FINANCIAL LEDGER COMPREHENSION PIPELINE")
    print("=" * 65)
    
    clean_ledger = FinancialLedgerTransformer.process_raw_ledger(sample_raw_feed)
    
    print(f"{'TX ID':<10} {'CATEGORY':<18} {'CURR':<6} {'USD AMOUNT':>12} {'PRIORITY':^12}")
    print("-" * 65)
    for r in clean_ledger:
        badge = "★ HIGH VALUE" if r["is_high_value"] else "STANDARD"
        print(f"{r['tx_id']:<10} {r['category']:<18} {r['original_currency']:<6} ${r['amount_usd']:>11,.2f} {badge:^12}")
        
    print("-" * 65)
    
    # 2D Matrix Extraction
    matrix = FinancialLedgerTransformer.extract_category_matrix(clean_ledger)
    total_usd = sum(row[2] for row in matrix)
    print(f"Total Normalized Ledger Balance: ${total_usd:>10,.2f}")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's list comprehensions:
- List comprehensions provide a **concise, declarative syntax** combining mapping and filtering: `[expr for x in iter if cond]`.
- List comprehensions run **30% to 40% faster** than manual loops due to the C-level `LIST_APPEND` bytecode opcode.
- Filter conditions appear at the **end** (`if cond`), while value transformations appear at the **front** (`a if c else b`).
- In multi-loop comprehensions, `for` clauses appear in the exact same order as standard nested loops.
- Use the **Walrus operator (`:=`)** to avoid computing expensive expressions twice.
- Avoid using list comprehensions solely for side effects (e.g., `[print(x) for x in l]`).

---

## Best Practices Checklist

- [ ] Use list comprehensions for concise, readable mapping and filtering.
- [ ] Format multi-part comprehensions across multiple indented lines.
- [ ] Avoid nesting more than 2 loops in a single comprehension.
- [ ] Use standard `for` loops when logic produces side effects (printing, writing files).
- [ ] Use generator expressions when processing massive datasets to prevent RAM exhaustion.

---

## What's Next?

Now that you understand list comprehensions, continue to the final article in this module:
👉 **[Dictionary, Set & Generator Comprehensions](dict-set-comprehensions.md)** to master set comprehensions, dictionary comprehensions, and lazy memory-efficient generator expressions.
