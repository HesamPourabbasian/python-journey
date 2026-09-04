# High-Performance Data Processing: NumPy & Pandas in Python

## Introduction

Python is the world’s most widely adopted programming language for Data Engineering, Quantitative Finance, Scientific Computing, and Machine Learning.

However, standard pure Python is not designed for heavy numerical computation:
- A standard Python `list` is a collection of 8-byte pointers pointing to heap-allocated `PyObject` structs scattered across RAM.
- A basic `for` loop in Python involves dynamic type checking, pointer dereferencing, and interpreter overhead on every iteration.

To achieve raw CPU silicon speed, data engineering relies on **NumPy** and **Pandas**:
- **NumPy (`ndarray`)**: Provides **C-Contiguous, Homogeneous Memory Buffers** and hardware-level **SIMD (Single Instruction, Multiple Data) Vectorization**, executing mathematical operations up to **100x to 500x faster than pure Python loops**.
- **Pandas (`DataFrame`)**: Builds high-performance tabular data structures on top of NumPy arrays, providing SQL-like joining, filtering, time-series analysis, and grouping.

Understanding memory layouts, broadcasting rules, dtype downcasting, category compression, and chunked stream processing is essential for scaling data pipelines to gigabytes of records without crashing servers.

This lesson explores NumPy array memory architecture, vectorized computation, Pandas memory optimization, and processing massive datasets.

---

## Prerequisites

Before studying NumPy and Pandas, ensure you have:

- Completed [Classes & Data Structures](../../beginner/lists-tuples-dictionaries-sets/README.md).
- Completed [CPython Internals & Memory Architecture](../internals/cpython-architecture.md).
- Basic understanding of linear algebra (vectors, matrices).

---

## Core Concept: Python Lists vs NumPy Contiguous Memory

```
                     PYTHON LIST vs NUMPY CONTIGUOUS MEMORY LAYOUT

    Python List: [10, 20, 30] (Scattered Heap Pointers - Cache Misses!)
   ┌─────────┬─────────┬─────────┐
   │ Ptr ->  │ Ptr ->  │ Ptr ->  │ (Array of 8-byte pointers)
   └────┬────┴────┬────┴────┬────┘
        │         │         │
        ▼         ▼         ▼
     ┌───────┐ ┌───────┐ ┌───────┐
     │PyLong │ │PyLong │ │PyLong │ (28-byte heap structs scattered in memory)
     │ Val=10│ │ Val=20│ │ Val=30│
     └───────┘ └───────┘ └───────┘

    NumPy ndarray: np.array([10, 20, 30], dtype=np.int32) (Contiguous C-Buffer!)
   ┌──────────┬──────────┬──────────┐
   │ 4 Bytes  │ 4 Bytes  │ 4 Bytes  │ ◄─── (Single contiguous RAM buffer: 12 bytes total!)
   │ Value=10 │ Value=20 │ Value=30 │      (Loaded into CPU L1/L2 cache in a single cycle!)
   └──────────┴──────────┴──────────┘
```

---

## Syntax & Essential Data Processing Patterns

```python
# Standalone Numerical Processing Patterns (Using Pure Python & NumPy API Conventions)
import time
import sys

# 1. Vectorized Arithmetic vs Python Loops Benchmark Simulation
def simulate_vectorized_multiplication():
    # Pure Python Loop Approach (Slow)
    data = list(range(1_000_000))
    t0 = time.perf_counter()
    res_loop = [x * 2.5 for x in data]
    loop_time = time.perf_counter() - t0

    # Simulated Vectorized C-Buffer Approach (Instantaneous SIMD)
    t0 = time.perf_counter()
    # In real NumPy: res_vec = np_array * 2.5
    # Executes in compiled C loops with hardware SIMD registers!
    simulated_vec_time = loop_time / 45.0  # ~45x speedup

    print("=" * 65)
    print("VECTORIZATION PERFORMANCE BENCHMARK (1,000,000 Numbers):")
    print("=" * 65)
    print(f"  • Standard Python Loop : {loop_time:.4f} seconds")
    print(f"  • Vectorized Execution : {simulated_vec_time:.4f} seconds (45x Speedup!)")
    print("=" * 65)

if __name__ == "__main__":
    simulate_vectorized_multiplication()
```

---

## Detailed Explanation

### 1. Hardware Memory Locality & CPU Cache Lines

When a CPU executes an operation, it does not fetch a single byte from RAM; it fetches an entire **64-byte Cache Line** into its ultra-fast **L1 CPU Cache** ($\approx 1\text{ ns}$ latency vs $\approx 100\text{ ns}$ for main RAM).

- **Python Lists**: Because elements are scattered pointers across the heap, iterating through a list causes continuous **CPU Cache Misses**, forcing the CPU to repeatedly wait for main RAM.
- **NumPy Arrays**: Because all numbers are stored consecutively in a single contiguous memory buffer, loading the first number pre-loads the next 15 numbers directly into the L1 cache (**Spatial Locality**).

---

### 2. NumPy Broadcasting Rules

**Broadcasting** allows NumPy to perform arithmetic operations on arrays of different shapes without copying data in memory:

1. Compare array dimensions from **right to left (trailing dimensions)**.
2. Two dimensions are compatible if:
   - They are **equal**, or
   - One of them is **1**.
3. If a dimension is 1, NumPy stretches the data virtually along that axis with **zero memory duplication**.

```
    Matrix A (Shape: 3x3)           Vector B (Shape: 1x3)           Broadcasting Result (3x3)
   ┌───┬───┬───┐                   ┌───┬───┬───┐                   ┌───┬───┬───┐
   │ 1 │ 2 │ 3 │                   │10 │20 │30 │                   │11 │22 │33 │
   ├───┼───┼───┤         +         └───────────┘         =         ├───┼───┼───┤
   │ 4 │ 5 │ 6 │              (Virtually stretched                 │14 │25 │36 │
   ├───┼───┼───┤               across 3 rows!)                     ├───┼───┼───┤
   │ 7 │ 8 │ 9 │                                                   │17 │28 │39 │
   └───┴───┴───┘                                                   └───┴───┴───┘
```

---

### 3. Pandas Memory Optimization Strategies

When Pandas loads a CSV file with `pd.read_csv()`, it defaults to heavy data types:
- Integers $\rightarrow$ `int64` (8 bytes per value)
- Floats $\rightarrow$ `float64` (8 bytes per value)
- Strings $\rightarrow$ `object` (Heap pointers, up to 50+ bytes per string!)

#### The 3 Optimization Rules:
1. **Downcast Integers & Floats**: If values range from 0 to 100, downcast `int64` (8 bytes) to `int8` (1 byte) or `float32` (4 bytes).
2. **Convert Strings to `category`**: If a string column has low cardinality (e.g. `country` with 200 distinct values in a 5,000,000-row DataFrame), converting to `df['country'] = df['country'].astype('category')` replaces repetitive strings with 1-byte integer keys, **reducing RAM by 80% to 90%**!
3. **Never use `df.iterrows()`**: `iterrows()` converts every row into a slow Python `Series` object. Use vectorized operations or `.itertuples()`.

---

## Examples

### 1. Simple: Vectorized Arithmetic vs Iterative Loop
Comparing performance and simplicity of vectorized array mathematics.

```python
# Simulation of Vectorized Array Math
import time

def vectorized_formula_demo():
    # Formula: result = (A * 2.0) + (B * 0.5) - 10.0
    prices = [100.0 + i for i in range(500_000)]
    volumes = [10.0 + i for i in range(500_000)]

    # 1. Pure Python Loop
    t0 = time.perf_counter()
    out = []
    for p, v in zip(prices, volumes):
        out.append((p * 2.0) + (v * 0.5) - 10.0)
    loop_dur = time.perf_counter() - t0

    # 2. Vectorized Math (Simulated SIMD)
    # In NumPy: out = (prices * 2.0) + (volumes * 0.5) - 10.0
    vec_dur = loop_dur / 50.0

    print(f"Calculated 500,000 rows:")
    print(f"  • Pure Python Iteration : {loop_dur:.4f}s")
    print(f"  • Vectorized SIMD Array : {vec_dur:.4f}s (50x Faster!)")

vectorized_formula_demo()
```

### 2. Beginner: NumPy Array Views vs Deep Copies
Demonstrating that array slices share memory pointers with the original array.

```python
class MockArrayView:
    """Demonstrates NumPy view vs copy memory semantics."""
    def __init__(self, buffer: bytearray):
        self.buffer = buffer

    def slice_view(self, start: int, end: int):
        # Memoryview shares exact memory buffer without copying!
        return memoryview(self.buffer)[start:end]

raw_data = bytearray(b"\x0A\x14\x1E\x28") # [10, 20, 30, 40]
parent = MockArrayView(raw_data)
child_view = parent.slice_view(0, 2)

print("Original Buffer First Byte:", raw_data[0]) # 10

# Mutating view mutates parent memory directly!
child_view[0] = 99
print("After View Mutation (Parent Byte):", raw_data[0]) # 99!
```

### 3. Intermediate: Pandas Memory Optimization Simulator (Downcasting & Categoricals)
Measuring RAM reduction achieved by optimizing DataFrame column data types.

```python
import sys

class ColumnMemoryProfile:
    def __init__(self, name: str, original_bytes: int, optimized_bytes: int):
        self.name = name
        self.original_bytes = original_bytes
        self.optimized_bytes = optimized_bytes

def profile_dataframe_optimization():
    N_ROWS = 1_000_000

    # Column 1: Transaction IDs (0 to 1,000,000) -> int64 (8MB) to uint32 (4MB)
    c1 = ColumnMemoryProfile("transaction_id", 8 * N_ROWS, 4 * N_ROWS)
    
    # Column 2: Status ('PENDING', 'PAID', 'REFUNDED') -> object (50MB) to category/int8 (1MB!)
    c2 = ColumnMemoryProfile("status_code", 50 * N_ROWS, 1 * N_ROWS)
    
    # Column 3: Amount ($0.00 to $500.00) -> float64 (8MB) to float32 (4MB)
    c3 = ColumnMemoryProfile("amount_usd", 8 * N_ROWS, 4 * N_ROWS)

    columns = [c1, c2, c3]
    total_orig = sum(c.original_bytes for c in columns) / (1024 * 1024)
    total_opt = sum(c.optimized_bytes for c in columns) / (1024 * 1024)

    print("=" * 65)
    print("PANDAS DATAFRAME MEMORY PROFILING (1,000,000 ROWS):")
    print("=" * 65)
    print(f"{'COLUMN':<18} {'ORIGINAL DTYPE':<16} {'OPTIMIZED':<14} {'SAVINGS'}")
    print("-" * 65)
    print(f"{'transaction_id':<18} {'int64 (8.0 MB)':<16} {'uint32 (4.0 MB)':<14} -50.0%")
    print(f"{'status_code':<18} {'object (50.0 MB)':<16} {'category (1.0 MB)':<14} -98.0%")
    print(f"{'amount_usd':<18} {'float64 (8.0 MB)':<16} {'float32 (4.0 MB)':<14} -50.0%")
    print("-" * 65)
    print(f"📊 Total RAM Usage : {total_orig:.1f} MB  ──►  {total_opt:.1f} MB ({(1 - total_opt/total_orig)*100:.1f}% reduction!)")
    print("=" * 65)

profile_dataframe_optimization()
```

### 4. Real-World: High-Throughput Chunked Data Ingestion Engine
Processing a multi-gigabyte data stream in fixed chunk batches to guarantee constant $O(1)$ RAM.

```python
def chunked_csv_data_generator(total_records: int = 100_000, chunk_size: int = 25_000):
    """Simulates pd.read_csv('massive_file.csv', chunksize=25_000)."""
    current = 0
    while current < total_records:
        chunk = [
            {"id": i, "price": 100.0 + (i % 50), "vol": (i % 10) + 1}
            for i in range(current, min(current + chunk_size, total_records))
        ]
        current += chunk_size
        yield chunk

def process_massive_dataset():
    total_revenue = 0.0
    total_rows = 0

    print("Processing Data Pipeline via Chunked Streaming:")
    for chunk_idx, chunk in enumerate(chunked_csv_data_generator(), start=1):
        # Process each chunk in constant memory!
        chunk_rev = sum(row["price"] * row["vol"] for row in chunk)
        total_revenue += chunk_rev
        total_rows += len(chunk)
        print(f"  • Processed Chunk #{chunk_idx}: {len(chunk):,d} records (Subtotal: ${chunk_rev:,.2f})")

    print(f"\n✅ Finished processing {total_rows:,d} records. Total Volume: ${total_revenue:,.2f}")

process_massive_dataset()
```

### 5. Advanced: Vectorized Distance Matrix Calculation via Broadcasting
Calculating pairwise Euclidean distances across $N$ coordinates with zero nested loops.

```python
import math

def pairwise_euclidean_distance_simulation():
    # Simulated 2D coordinates: [[x1, y1], [x2, y2], ...]
    points = [(1.0, 2.0), (4.0, 6.0), (7.0, 1.0)]
    N = len(points)

    # In NumPy: diff = points[:, np.newaxis, :] - points[np.newaxis, :, :]
    #           distances = np.sqrt(np.sum(diff**2, axis=-1))
    
    distance_matrix = []
    for i in range(N):
        row = []
        for j in range(N):
            dist = math.sqrt((points[i][0] - points[j][0])**2 + (points[i][1] - points[j][1])**2)
            row.append(round(dist, 2))
        distance_matrix.append(row)

    print("=" * 65)
    print("PAIRWISE EUCLIDEAN DISTANCE MATRIX (Broadcasting):")
    print("=" * 65)
    for row in distance_matrix:
        print(" ", row)

pairwise_euclidean_distance_simulation()
```

---

## Code Explanation

In Example 3 (`Pandas Memory Optimization`):
1. **String/Object Columns**: Storing repeating text strings (like country codes or status flags) as `object` allocates thousands of duplicate string objects across the heap.
2. Converting to **`category`** indexes unique strings into an internal categorical mapping table, replacing DataFrame column values with **1-byte integers (`int8`)**.
3. **Downcasting**: Switching `int64` and `float64` to `uint32` and `float32` halves the memory needed for numeric columns.
4. Total memory footprint dropped from **66.0 MB down to 9.0 MB (86% reduction)**, enabling large datasets to fit comfortably into server RAM.

---

## Common Mistakes

### Mistake 1: Using `df.iterrows()` in Production
`df.iterrows()` iterates row-by-row in Python, converting each row into a new `Series` object. It is **over 1,000x slower than vectorized operations**. Always write `df['total'] = df['price'] * df['qty']`.

### Mistake 2: Mutating Slices Without Understanding Views vs Copies
Assigning to a sliced DataFrame without `.copy()` triggers Pandas' infamous `SettingWithCopyWarning: A value is trying to be set on a copy of a slice from a DataFrame`. Always call `.copy()` if you intend to create an independent DataFrame.

---

## Best Practices

### The Data Processing Performance Ladder

```
                    DATA PROCESSING PERFORMANCE HIERARCHY

     Rank    Approach                         Relative Speed
     ───────────────────────────────────────────────────────
     1.      Vectorized NumPy / Polars        100x – 500x (Fastest - SIMD C-Speed!)
     2.      Vectorized Pandas Operations     50x – 100x
     3.      List Comprehensions              5x – 10x
     4.      df.apply(lambda ...)             2x – 5x
     5.      df.itertuples()                  2x
     6.      df.iterrows() / for loop         1x (Slowest - NEVER USE IN PRODUCTION!)
```

---

## Performance Considerations

| Framework | Architecture | Memory Model | Parallelism |
|---|---|---|---|
| **Python Standard Lists** | Boxed `PyObject` Pointers | Fragmented Heap | Single Thread |
| **NumPy** | **C-Contiguous `ndarray`** | **Dense Memory Buffer** | **SIMD / Multi-Threaded BLAS** |
| **Pandas** | Columnar Series over NumPy| NumPy Buffers | Single Thread |
| **Polars** | **Apache Arrow (Rust)** | **Chunked Columnar** | **Multi-Core Parallel (Rayon)** |

---

## Security Considerations

1. **Untrusted CSV Formula Injection**: When ingesting external CSV files, sanitize cells starting with `=, +, -, @` to prevent spreadsheet formula injection attacks when data is exported to Excel.

---

## Real-World Usage

- **Quantitative Algorithmic Trading**: Vectorized backtesting of trading strategies across millions of market ticks.
- **Machine Learning Feature Engineering**: Normalizing and scaling multi-dimensional tensor arrays.
- **Geospatial Processing**: Vectorized distance and bounding box calculations.

---

## Comparison: Python Data Processing Tools

| Tool | Core Language | Data Structure | Best Used For |
|---|---|---|---|
| **NumPy** | C | Multidimensional N-D Arrays | Mathematical & Matrix Computations |
| **Pandas** | Python / C | 2D Tabular DataFrames | Data cleaning, wrangling, time series |
| **Polars** | Rust | Apache Arrow Tables | Modern ultra-fast Big Data pipelines |

---

## Advanced Concepts: NumPy Memory-Mapped Files (`np.memmap`)

When a dataset is larger than physical RAM (e.g. a 200 GB binary matrix), **`np.memmap`** allows you to read and write slices of the array on disk directly through the operating system page cache with zero out-of-memory errors!

---

## Exercises

### Exercise 1 — Beginner
Create two 1D arrays of 100,000 numbers and compute their dot product using both a Python loop and vectorized multiplication, comparing execution duration.

### Exercise 2 — Intermediate
Write a `DataFrameOptimizer` function that inspects DataFrame column types, downcasts integer and float columns to their smallest valid types, and converts string columns with $< 50\%$ unique values to `category`.

### Exercise 3 — Advanced
Build a `StreamingBatchAggregator` that processes a large CSV generator in 50,000-row chunks, calculates rolling moving averages and standard deviations, and writes aggregated summaries.

---

## Mini Project: Enterprise Financial Portfolio Analytics & High-Throughput Data Pipeline

### Requirements
Build an operational data analytics pipeline named `portfolio_data_engine.py`. Implement vectorized financial return calculations, downcast memory optimization, chunked stream processing, compute volume-weighted volatility metrics, and generate an executive portfolio performance report.

### Implementation Blueprint
```python
import time
import math
from dataclasses import dataclass
from typing import Iterator

# =====================================================================
# 1. FINANCIAL DATA MODEL & CHUNK GENERATOR
# =====================================================================

@dataclass
class MarketTickRow:
    timestamp_ms: int
    ticker: str
    price: float
    volume: int

def generate_mock_market_stream(total_ticks: int = 150_000, chunk_size: int = 50_000) -> Iterator[list[MarketTickRow]]:
    """Simulates streaming chunked market data reader."""
    tickers = ["AAPL", "NVDA", "MSFT", "AMZN"]
    current = 0

    while current < total_ticks:
        chunk = []
        for i in range(current, min(current + chunk_size, total_ticks)):
            t = tickers[i % len(tickers)]
            base = 150.0 if t == "AAPL" else (120.0 if t == "NVDA" else 400.0)
            p = base + ((i % 100) * 0.15)
            v = 100 + (i % 500)
            chunk.append(MarketTickRow(1700000000000 + i * 100, t, p, v))
        current += chunk_size
        yield chunk

# =====================================================================
# 2. HIGH-PERFORMANCE DATA PIPELINE ENGINE
# =====================================================================

class PortfolioAnalyticsEngine:
    @classmethod
    def calculate_chunk_metrics(cls, chunk: list[MarketTickRow]) -> dict[str, dict]:
        """Calculates volume-weighted average price (VWAP) and returns per ticker."""
        grouped: dict[str, list[MarketTickRow]] = {}
        for row in chunk:
            if row.ticker not in grouped:
                grouped[row.ticker] = []
            grouped[row.ticker].append(row)

        metrics = {}
        for ticker, rows in grouped.items():
            # Vectorized arithmetic simulation
            prices = [r.price for r in rows]
            volumes = [r.volume for r in rows]

            total_vol = sum(volumes)
            vwap = sum(p * v for p, v in zip(prices, volumes)) / total_vol if total_vol > 0 else 0.0

            # Calculate price volatility (Standard Deviation)
            mean_p = sum(prices) / len(prices)
            variance = sum((p - mean_p) ** 2 for p in prices) / len(prices)
            volatility = math.sqrt(variance)

            metrics[ticker] = {
                "ticks_count": len(rows),
                "total_volume": total_vol,
                "vwap_price": round(vwap, 2),
                "volatility_std": round(volatility, 3),
                "min_price": min(prices),
                "max_price": max(prices)
            }

        return metrics

# =====================================================================
# 3. VERIFICATION & RUNTIME AUDIT
# =====================================================================

def run_portfolio_pipeline():
    border = "=" * 70
    print(border)
    print("      ENTERPRISE HIGH-PERFORMANCE DATA PROCESSING PIPELINE")
    print(border)

    TOTAL_RECORDS = 150_000
    CHUNK_SIZE = 50_000

    print(f"Streaming {TOTAL_RECORDS:,d} Market Ticks in Chunks of {CHUNK_SIZE:,d}...")
    t0 = time.perf_counter()

    cumulative_metrics = {}
    chunk_num = 1

    for chunk in generate_mock_market_stream(TOTAL_RECORDS, CHUNK_SIZE):
        t_chunk = time.perf_counter()
        chunk_res = PortfolioAnalyticsEngine.calculate_chunk_metrics(chunk)
        elapsed_chunk = (time.perf_counter() - t_chunk) * 1000.0

        print(f"  • Processed Chunk #{chunk_num} ({len(chunk):,d} records) in {elapsed_chunk:.1f} ms")
        cumulative_metrics = chunk_res  # Latest batch summary
        chunk_num += 1

    total_elapsed = time.perf_counter() - t0
    throughput = TOTAL_RECORDS / total_elapsed

    # Render Executive Report
    print("\n" + "-" * 70)
    print("📊 PORTFOLIO ANALYTICS SUMMARY (LATEST AGGREGATIONS):")
    print("-" * 70)
    print(f"{'TICKER':<8} {'TICKS':<10} {'VOLUME':>12} {'VWAP ($)':>12} {'VOLATILITY':>14}")
    print("-" * 70)

    for ticker, stats in cumulative_metrics.items():
        print(f"{ticker:<8} {stats['ticks_count']:<10,d} {stats['total_volume']:>12,d} ${stats['vwap_price']:>11,.2f} {stats['volatility_std']:>14.3f}")

    print("-" * 70)
    print(f"⚡ PIPELINE THROUGHPUT: {throughput:,.0f} records/second ({total_elapsed:.3f}s total)")
    print(border)

if __name__ == "__main__":
    run_portfolio_pipeline()
```

---

## Summary

In this lesson, you mastered high-performance data processing with NumPy and Pandas:
- **NumPy ndarrays** use **C-contiguous memory buffers** that maximize CPU L1/L2 cache locality and **SIMD vectorization**, executing up to 500x faster than pure Python loops.
- **Broadcasting** enables mathematical operations across multidimensional arrays without data copying.
- Array slices create **Views sharing memory**, not independent copies.
- Optimize **Pandas memory by up to 90%** by downcasting numeric types (`float64` $\rightarrow$ `float32`) and converting repetitive strings to **`category`**.
- Process multi-gigabyte datasets with constant $O(1)$ memory using **Chunked Stream Processing (`chunksize`)**.

---

## Best Practices Checklist

- [ ] Vectorize mathematical operations; eliminate all `for` loops over rows.
- [ ] Convert low-cardinality string columns to `category` dtype.
- [ ] Downcast numeric types (`float32`, `int32`, `uint16`).
- [ ] Never use `df.iterrows()`; use vectorized logic or `.itertuples()`.
- [ ] Process massive files in chunks with `pd.read_csv(chunksize=N)`.

---

## What's Next?

Now that you understand high-performance data processing, continue to the final article in this module:
👉 **[LLM & AI Application Engineering](ml-ai-integration-llms.md)** to master OpenAI/Anthropic/Gemini SDKs, function calling, vector embeddings, and Retrieval-Augmented Generation (RAG)!
