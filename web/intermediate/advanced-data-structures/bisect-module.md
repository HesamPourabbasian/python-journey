# The `bisect` Module & Binary Search in Python

## Introduction

In software systems, you frequently need to search through sorted data, find where a new value should be inserted, or map continuous numeric values into discrete categories (such as grading scales, progressive tax brackets, SLA latency buckets, or IP geolocation ranges).

If you search a sorted collection using a standard linear scan (`for item in data:` or `if val in data:`), Python examines every element from beginning to end, taking **$O(N)$ linear time**. In an array of 1,000,000 items, a linear search requires up to 1,000,000 comparisons.

Python solves this with the standard library **`bisect`** module.

Implemented in high-speed C (`Modules/_bisectmodule.c`), the `bisect` module implements the **Bisection (Binary Search) Algorithm**. By repeatedly dividing the search space in half, `bisect` finds elements, determines insertion points, and executes range lookups in **$O(\log_2 N)$ logarithmic time**.

In a dataset of 1,000,000 items, `bisect` finds the exact target index in **at most 20 comparisons**!

This lesson concludes **Module 6: Advanced Data Structures in Depth**, exploring `bisect_left`, `bisect_right`, in-place insertion with `insort`, progressive tier lookups, and Python 3.10+ `key=` parameter extraction.

---

## Prerequisites

Before studying `bisect`, ensure you have:

- Completed [The `collections` Module](collections-module.md) and [Heapq & Priority Queues](heapq-and-priority-queues.md).
- Completed [Control Flow & Conditional Statements](../../beginner/control-flow/conditional-statements.md).
- A solid understanding of logarithmic time complexity ($O(\log N)$).

---

## Core Concept: The Bisection Algorithm & `bisect_left` vs `bisect_right`

The primary functions in `bisect` calculate the index where a value $x$ should be inserted into a sorted list $a$ to **maintain sorted order**:

```
                         bisect_left vs bisect_right ON DUPLICATES

        Sorted Array: [ 10,  20,  20,  20,  30 ]
        Indices     :    0    1    2    3    4

        Target Search: x = 20

        bisect_left (a, 20)  ──► Index: 1  (Inserts BEFORE all existing 20s!)
        bisect_right(a, 20)  ──► Index: 4  (Inserts AFTER all existing 20s!)
```

$$\text{Search Space Reductions: } N \longrightarrow \frac{N}{2} \longrightarrow \frac{N}{4} \longrightarrow \dots \longrightarrow 1 \implies \log_2(1,000,000) \approx 19.93 \text{ steps!}$$

---

## Syntax & Essential `bisect` Patterns

```python
import bisect

# 1. Finding Insertion Points in a Sorted List
sorted_scores = [60, 70, 80, 90]

# Where would 75 be inserted to keep list sorted?
idx = bisect.bisect_right(sorted_scores, 75)
print("Insertion Index for 75:", idx) # Index 2 (Between 70 and 80)

# 2. Inserting In-Place with insort_right()
bisect.insort_right(sorted_scores, 75)
print("List After insort_right:", sorted_scores) # [60, 70, 75, 80, 90]

# 3. Range / Tier Table Lookups (Eliminating long if-elif chains!)
def grade_classifier(score: int) -> str:
    # Breakpoints must be strictly sorted!
    # Scores:  <60 -> 'F', 60-69 -> 'D', 70-79 -> 'C', 80-89 -> 'B', 90+ -> 'A'
    breakpoints = [60, 70, 80, 90]
    grades = ["F", "D", "C", "B", "A"]
    idx = bisect.bisect_right(breakpoints, score)
    return grades[idx]

print("Grade for 85:", grade_classifier(85)) # "B"
print("Grade for 99:", grade_classifier(99)) # "A"
print("Grade for 45:", grade_classifier(45)) # "F"
```

---

## Detailed Explanation

### 1. `bisect_left` vs `bisect_right`: Exact Boundary Mechanics

When searching for a value that **does not exist** in the list, `bisect_left` and `bisect_right` return the **exact same index**.

When searching for a value that **already exists** in the list:
- **`bisect_left(a, x)`**: Returns the index of the **first occurrence** of $x$. Any partition of the array with `a[:idx]` contains strictly elements $< x$.
- **`bisect_right(a, x)`** (alias `bisect(a, x)`): Returns the index **immediately after the last occurrence** of $x$. Any partition with `a[:idx]` contains elements $\le x$.

```python
import bisect

data = [10, 20, 20, 20, 30]

idx_l = bisect.bisect_left(data, 20)   # 1
idx_r = bisect.bisect_right(data, 20)  # 4

print(f"Items strictly < 20 : {data[:idx_l]}") # [10]
print(f"Items <= 20        : {data[:idx_r]}") # [10, 20, 20, 20]
```

---

### 2. Python 3.10+ `key=` Parameter in `bisect`

In Python 3.10+, `bisect` functions accept a **`key=` function**, allowing you to binary-search lists of complex objects without extracting temporary key lists:

```python
import bisect
from dataclasses import dataclass

@dataclass
class UserAccount:
    id: int
    username: str

# List sorted by user ID:
users = [
    UserAccount(101, "Hesam"),
    UserAccount(205, "Sarah"),
    UserAccount(310, "Alex")
]

# Search by ID using key=lambda u: u.id
target_idx = bisect.bisect_left(users, 205, key=lambda u: u.id)
print("Found User at Index:", target_idx, "->", users[target_idx].username) # "Sarah"
```

---

### 3. Limitations of `insort`: Time Complexity Nuance

While `bisect.bisect()` locates the insertion index in **$O(\log N)$ time**, calling **`bisect.insort(a, x)`** must call `list.insert(idx, x)` to insert the element into the list.

Because inserting into a standard Python list requires shifting subsequent elements in memory:

$$\textbf{insort Time Complexity: } O(\log N) \text{ (Binary Search)} + O(N) \text{ (Array Shift)} = \mathbf{O(N)}$$

If you need to insert 1,000,000 items continuously, it is faster to append all items to a list and call `list.sort()` once at the end ($O(N \log N)$) rather than calling `insort()` 1,000,000 times ($O(N^2)$).

---

## Examples

### 1. Simple: Verifying Element Existence in $O(\log N)$ Time
Writing a fast binary-search lookup function that checks if a sorted list contains an item.

```python
import bisect

def binary_search_contains(sorted_list: list[int], target: int) -> bool:
    """Returns True if target exists in sorted_list in O(log N) time."""
    idx = bisect.bisect_left(sorted_list, target)
    return idx < len(sorted_list) and sorted_list[idx] == target

large_sorted_data = [10, 25, 40, 55, 70, 85, 100, 115, 130]
print("Contains 70? :", binary_search_contains(large_sorted_data, 70)) # True
print("Contains 99? :", binary_search_contains(large_sorted_data, 99)) # False
```

### 2. Beginner: Progressive Commission / Bonus Rate Classifier
Mapping employee sales revenue into bonus percentages using `bisect_right`.

```python
import bisect

def calculate_sales_bonus_rate(sales_volume: float) -> float:
    # Thresholds:  <$50k -> 2%, $50k-$99k -> 5%, $100k-$249k -> 8%, $250k+ -> 12%
    revenue_thresholds = [50_000.0, 100_000.0, 250_000.0]
    bonus_rates = [0.02, 0.05, 0.08, 0.12]
    
    idx = bisect.bisect_right(revenue_thresholds, sales_volume)
    return bonus_rates[idx]

print("Bonus Rate for $35,000  :", f"{calculate_sales_bonus_rate(35_000) * 100}%")  # 2.0%
print("Bonus Rate for $150,000 :", f"{calculate_sales_bonus_rate(150_000) * 100}%") # 8.0%
print("Bonus Rate for $500,000 :", f"{calculate_sales_bonus_rate(500_000) * 100}%") # 12.0%
```

### 3. Intermediate: Progressive Income Tax Bracket Calculator
Computing tiered progressive income taxes using bisection and interval arithmetic.

```python
import bisect

# IRS-Style Progressive Tax Brackets:
# Income Interval           | Marginal Tax Rate
# $0 to $11,000            | 10%
# $11,000 to $44,725       | 12%
# $44,725 to $95,375       | 22%
# $95,375 to $182,100      | 24%
# $182,100+                | 32%

TAX_BRACKET_CUTOFFS = [11_000.0, 44_725.0, 95_375.0, 182_100.0]
MARGINAL_RATES = [0.10, 0.12, 0.22, 0.24, 0.32]

def compute_progressive_tax(taxable_income: float) -> float:
    if taxable_income <= 0:
        return 0.0

    total_tax = 0.0
    prev_cutoff = 0.0

    for cutoff, rate in zip(TAX_BRACKET_CUTOFFS, MARGINAL_RATES):
        if taxable_income > cutoff:
            taxable_in_tier = cutoff - prev_cutoff
            total_tax += taxable_in_tier * rate
            prev_cutoff = cutoff
        else:
            taxable_in_tier = taxable_income - prev_cutoff
            total_tax += taxable_in_tier * rate
            return round(total_tax, 2)

    # Top bracket (surpassing last cutoff)
    taxable_in_tier = taxable_income - prev_cutoff
    total_tax += taxable_in_tier * MARGINAL_RATES[-1]
    return round(total_tax, 2)

income = 75_000.00
tax = compute_progressive_tax(income)
print(f"Taxable Income: ${income:,.2f} | Progressive Tax: ${tax:,.2f} (Effective: {tax/income*100:.2f}%)")
```

### 4. Real-World: IP Geolocation Range Resolver
Resolving numerical IP addresses to geographic regional data centers in $O(\log N)$ time.

```python
import bisect
import ipaddress

# Pre-sorted database of IP range upper bounds: (Upper_Bound_Int, Region_Name)
IP_REGIONAL_ROUTING_TABLE = [
    (int(ipaddress.IPv4Address("10.0.255.255")),  "US-EAST-DATA-CENTER"),
    (int(ipaddress.IPv4Address("10.1.255.255")),  "US-WEST-DATA-CENTER"),
    (int(ipaddress.IPv4Address("10.2.255.255")),  "EU-CENTRAL-DATA-CENTER"),
    (int(ipaddress.IPv4Address("10.3.255.255")),  "AP-SOUTH-DATA-CENTER"),
]

def resolve_ip_region(ip_str: str) -> str:
    ip_int = int(ipaddress.IPv4Address(ip_str))
    
    # Binary search using Python 3.10+ key= lambda
    idx = bisect.bisect_left(IP_REGIONAL_ROUTING_TABLE, ip_int, key=lambda entry: entry[0])
    
    if idx < len(IP_REGIONAL_ROUTING_TABLE):
        return IP_REGIONAL_ROUTING_TABLE[idx][1]
    return "UNKNOWN_EXTERNAL_INTERNET"

print("IP 10.0.50.1   ->", resolve_ip_region("10.0.50.1"))   # "US-EAST-DATA-CENTER"
print("IP 10.2.100.44 ->", resolve_ip_region("10.2.100.44")) # "EU-CENTRAL-DATA-CENTER"
print("IP 192.168.1.1 ->", resolve_ip_region("192.168.1.1")) # "UNKNOWN_EXTERNAL_INTERNET"
```

### 5. Advanced: Chronological Timeline Indexer with `insort` & `key=`
Maintaining a sorted stream of time-series event records dynamically.

```python
import bisect
import operator
from dataclasses import dataclass
from datetime import datetime, timezone

@dataclass
class TimelineEvent:
    timestamp: float
    description: str

class ChronologicalTimeline:
    def __init__(self):
        self._events: list[TimelineEvent] = []

    def add_event(self, event: TimelineEvent):
        # Insert in-place while keeping timeline strictly sorted by timestamp!
        bisect.insort(self._events, event, key=operator.attrgetter("timestamp"))

    def get_events_after(self, cutoff_time: float) -> list[TimelineEvent]:
        # Find start index in O(log N)
        idx = bisect.bisect_right(self._events, cutoff_time, key=operator.attrgetter("timestamp"))
        return self._events[idx:]

timeline = ChronologicalTimeline()
timeline.add_event(TimelineEvent(100.0, "System Boot"))
timeline.add_event(TimelineEvent(300.0, "Database Connected"))
timeline.add_event(TimelineEvent(200.0, "Security Audit Completed")) # Out-of-order insertion!

print("Chronologically Ordered Timeline:")
for ev in timeline._events:
    print(f"  [{ev.timestamp:.1f}s] -> {ev.description}")
```

---

## Code Explanation

In Example 4 (`IP Geolocation Range Resolver`):
1. `IP_REGIONAL_ROUTING_TABLE` holds thousands of pre-sorted IP range upper bounds.
2. When an incoming request IP arrives, `resolve_ip_region()` converts it into an integer.
3. `bisect.bisect_left(..., ip_int, key=lambda entry: entry[0])` bisects the table in **$O(\log N)$ time** (less than 15 CPU instructions).
4. This delivers microsecond lookup latency, matching the performance of high-throughput network firewalls and CDN routers.

---

## Common Mistakes

### Mistake 1: Calling `bisect` on an Unsorted List
`bisect` **strictly assumes the list is sorted**. Calling `bisect` on an unsorted list will not raise an error; instead, it will silently return completely wrong indices! Always verify data is sorted beforehand.

### Mistake 2: Confusing `bisect_left` and `bisect_right` on Boundary Match Values
In tier lookups, using `bisect_left` when `score == 80` would categorize an 80 into the lower bracket (`[70, 80]`). Ensure you choose `bisect_right` or `bisect_left` based on whether boundaries are inclusive or exclusive.

---

## Best Practices

### Use `bisect` Table Lookups Instead of Massive `if-elif` Trees
Replace 20-branch `if-elif` statements with a clean 2-line `bisect` breakpoint table lookup.

Good:
```python
cutoffs = [10, 20, 50, 100]
tiers = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]
tier = tiers[bisect.bisect_right(cutoffs, points)]
```

Avoid:
```python
if points < 10: tier = "Bronze"
elif points < 20: tier = "Silver"
# ... 10 more elif branches ❌
```

---

## Performance Considerations

| Search Method | Time Complexity | Comparisons for $N=1,000,000$ |
|---|---|---|
| **Linear Search (`for x in lst:`)** | **$O(N)$** | Up to **1,000,000 operations** |
| **Binary Search (`bisect.bisect`)** | **$O(\log_2 N)$** | At most **20 operations!** |
| **Dictionary Hash Lookup (`dict[x]`)**| **$O(1)$** | **1 operation** (Requires exact key, no ranges) |

`bisect` is the optimal choice for **range-based queries and ordered threshold lookups**.

---

## Security Considerations

1. **Off-by-One Privilege Escalation**: When using `bisect` for role-based security clearance levels (e.g. `clearance_level >= 5`), thoroughly test boundary conditions (`4`, `5`, `6`) to ensure users are not assigned higher privileges due to a `bisect_left` vs `bisect_right` off-by-one bug.

---

## Real-World Usage

- **B-Tree Database Index Lookups**: B-tree internal nodes use bisection to locate child pointers.
- **Histogram Binning in NumPy / Pandas**: Assigning continuous data points into statistical bins.
- **Audio / Video Media Scrubbing**: Seeking to keyframe timestamps in video players.

---

## Comparison: Search Algorithms & Lookups

| Algorithm | Data Requirement | Time Complexity | Supports Range Lookups? |
|---|---|---|---|
| **Linear Scan** | Unsorted or Sorted | $O(N)$ | Yes (Slow) |
| **Binary Search (`bisect`)**| **Sorted Array** | **$O(\log N)$** | **Yes (Fastest)** |
| **Hash Map (`dict`)** | Any (Hashable keys)| **$O(1)$** | ❌ No (Exact match only) |
| **Binary Search Tree** | Tree Structure | $O(\log N)$ | Yes |

---

## Advanced Concepts: The CPython C-Implementation

Python delegates `bisect` to `Modules/_bisectmodule.c`. The internal C-loop uses bitwise shifts (`mid = (lo + hi) >> 1`) to eliminate division operations, executing binary searches in under **$40\text{ nanoseconds}$**.

---

## Exercises

### Exercise 1 — Beginner
Create a list of numbers `[10, 20, 30, 40, 50]`. Use `bisect.bisect_left()` to find where `25` should be placed, and use `bisect.insort_left()` to insert it.

### Exercise 2 — Intermediate
Build a latency SLA classifier `classify_latency(latency_ms: float) -> str` using `bisect` that maps response times: `<50ms` $\rightarrow$ `"EXCELLENT"`, `50-199ms` $\rightarrow$ `"GOOD"`, `200-499ms` $\rightarrow$ `"ACCEPTABLE"`, `500ms+` $\rightarrow$ `"SLA_VIOLATION"`.

### Exercise 3 — Advanced
Build a `DynamicSortedSet` class that maintains a unique sorted list of integers using `bisect_left` for $O(\log N)$ lookups and duplicate prevention.

---

## Mini Project: Enterprise Progressive Tax & Dynamic Billing Tier Calculator

### Requirements
Build an operational billing tier and taxation calculator named `billing_tier_calculator.py`. Implement multi-tiered usage discounting, progressive taxation using `bisect`, invoice generation, and $O(\log N)$ tier resolution.

### Implementation Blueprint
```python
import bisect
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. TIER LOOKUP STRUCTURES
# =====================================================================

# SaaS API Request Usage Discount Tiers
# Tier 1: 0 - 10,000 calls      -> $0.050 / call
# Tier 2: 10,001 - 50,000 calls  -> $0.035 / call
# Tier 3: 50,001 - 250,000 calls -> $0.020 / call
# Tier 4: 250,001+ calls         -> $0.010 / call

USAGE_BREAKPOINTS = [10_000, 50_000, 250_000]
TIER_UNIT_RATES   = [0.050,  0.035,  0.020,   0.010]
TIER_NAMES        = ["STARTER", "GROWTH", "ENTERPRISE", "HYPERSCALE"]

class DynamicBillingEngine:
    @staticmethod
    def get_tier_name(total_api_calls: int) -> str:
        """Resolves billing tier name in O(log N) time using bisect."""
        idx = bisect.bisect_right(USAGE_BREAKPOINTS, total_api_calls)
        return TIER_NAMES[idx]

    @staticmethod
    def calculate_tiered_cost(total_api_calls: int) -> float:
        """Calculates progressive tiered volume billing."""
        if total_api_calls <= 0:
            return 0.0

        total_cost = 0.0
        prev_cutoff = 0

        for cutoff, rate in zip(USAGE_BREAKPOINTS, TIER_UNIT_RATES):
            if total_api_calls > cutoff:
                units_in_tier = cutoff - prev_cutoff
                total_cost += units_in_tier * rate
                prev_cutoff = cutoff
            else:
                units_in_tier = total_api_calls - prev_cutoff
                total_cost += units_in_tier * rate
                return round(total_cost, 2)

        # Remaining calls in top tier
        units_in_tier = total_api_calls - prev_cutoff
        total_cost += units_in_tier * TIER_UNIT_RATES[-1]
        return round(total_cost, 2)

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE DYNAMIC BILLING & BISECT TIER ENGINE")
    print("=" * 68)
    
    engine = DynamicBillingEngine()
    
    test_volumes = [5_000, 25_000, 120_000, 750_000]
    
    print(f"{'API CALLS':<14} {'BILLING TIER':<16} {'TOTAL BILLED':>14} {'AVG COST/CALL':>16}")
    print("-" * 68)
    for vol in test_volumes:
        tier = engine.get_tier_name(vol)
        cost = engine.calculate_tiered_cost(vol)
        avg_rate = cost / vol
        print(f"{vol:>9,d} calls │ {tier:<14} │ ${cost:>12,.2f} │ ${avg_rate:>13.4f}")
        
    print("=" * 68)
```

---

## Summary

In this lesson, you mastered Python's `bisect` module:
- **`bisect` implements Binary Search in $O(\log N)$ logarithmic time**, searching 1,000,000 sorted items in $\le 20$ comparisons.
- **`bisect_left`** returns the insertion point before duplicates; **`bisect_right`** returns the insertion point after duplicates.
- **`bisect.insort()`** locates the insertion point and inserts in-place.
- Use `bisect` to replace complex `if-elif` chains with clean, fast **Range & Tier Lookups**.
- In Python 3.10+, use the **`key=` parameter** to binary-search lists of complex objects.
- `bisect` strictly requires that target collections are **pre-sorted**.

---

## Best Practices Checklist

- [ ] Always ensure lists are sorted before passing to `bisect`.
- [ ] Use `bisect_right` for range/tier lookup tables.
- [ ] Use Python 3.10+ `key=` to binary search lists of dataclasses or dictionaries.
- [ ] Use `bisect_left` when verifying exact element presence.
- [ ] Be mindful that `insort()` incurs an $O(N)$ list shift operation.

---

## 🏆 MODULE 6: ADVANCED DATA STRUCTURES COMPLETE!

Congratulations! You have completed all 3 comprehensive articles of **Module 6: Advanced Data Structures in Depth**.

### What's Next?
Now advance to **Module 7: Relational Databases & ORM**:
👉 **[Relational Databases & ORM Module Overview](../databases/README.md)** to master SQLite3, PostgreSQL with Psycopg, and SQLAlchemy 2.0 ORM!
