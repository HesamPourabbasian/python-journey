# Tuples & Named Tuples in Python

## Introduction

While Python lists provide dynamic, mutable arrays suitable for collections that grow, shrink, or change over time, many data structures in computer science represent fixed, immutable records. Consider a 2D geographic coordinate $(35.6892, 51.3890)$, an RGB color code $(255, 128, 0)$, a database row containing $(user\_id, email, created\_at)$, or a function that needs to return multiple discrete results simultaneously.

In Python, the primary data structure for immutable sequences is the **`tuple`**.

Tuples are often described simply as "immutable lists," but in professional software architecture, they serve a distinct semantic purpose. While lists are traditionally used for **homogeneous collections** of variable length (e.g., a list of integers, a list of user accounts), tuples are designed for **heterogeneous data records** of fixed length where an item's position defines its semantic meaning.

Furthermore, Python extends basic tuples with **Named Tuples (`collections.namedtuple` and `typing.NamedTuple`)**, allowing fields to be accessed by clean attribute names (e.g., `point.x`, `user.email`) while retaining the lightweight memory footprint and immutability of raw tuples.

This lesson explores the memory architecture, packing and unpacking mechanics, dictionary key hashability rules, and named tuple patterns in Python.

---

## Prerequisites

Before studying tuples, ensure you have:

- Completed [Mutable vs Immutable Objects](../variables-data-types/mutable-vs-immutable.md).
- Completed [Lists & Dynamic Arrays](lists.md).
- Familiarity with object hashing and dictionary keys.

---

## Core Concept

A tuple is an **ordered, immutable sequence of object references**:

```
                              TUPLE vs LIST MEMORY FOOTPRINT

      LIST (PyListObject)                              TUPLE (PyTupleObject)
   ┌───────────────────────────────┐                ┌───────────────────────────────┐
   │ Header + Size + Allocated     │                │ Header + Size (Exact Length)  │
   ├───────────────────────────────┤                ├───────────────────────────────┤
   │ Pointer Array (with Headroom) │                │ Pointer Array (Exact Length)  │
   │ [0] -> "Hesam"                │                │ [0] -> "Hesam"                │
   │ [1] -> 99.5                   │                │ [1] -> 99.5                   │
   │ [2] -> NULL (Over-allocated)  │                └───────────────────────────────┘
   │ [3] -> NULL (Over-allocated)  │                • Fixed memory block
   └───────────────────────────────┘                • Zero over-allocation overhead
   • Mutable, expandable                            • Immutable, hashable
```

### Key Tuple Characteristics:
1. **Immutability**: Once allocated, a tuple cannot have elements added, removed, or replaced in place.
2. **Fixed Allocation**: Because tuples cannot grow, CPython allocates the exact memory size needed without over-allocation headroom, saving RAM.
3. **Hashability**: If all elements within a tuple are themselves immutable and hashable, the tuple is hashable and can be used as a **dictionary key** or stored in a **set**.
4. **Tuple Packing & Unpacking**: Python natively packs comma-separated values into tuples and unpacks them into variable assignments.

---

## Syntax & Essential Patterns

```python
# 1. Tuple Creation (Parentheses are optional, but commas are MANDATORY!)
coordinates = (35.6892, 51.3890)
dimensions = 1920, 1080             # Tuple packing without parentheses

# 2. THE SINGLE-ELEMENT TUPLE TRAP (Must include trailing comma!)
single_tuple = (42,)                # Type: tuple (Length 1)
not_a_tuple = (42)                  # Type: int (Parentheses treated as math grouping!)

# 3. Tuple Sequence Unpacking
width, height = dimensions          # width=1920, height=1080

# 4. The Python Variable Swap Idiom
a, b = 10, 20
a, b = b, a                         # Swaps values simultaneously!

# 5. Extended Unpacking with the Star Operator (*)
first, *middle, last = [10, 20, 30, 40, 50]  # first=10, middle=[20, 30, 40], last=50

# 6. Modern typing.NamedTuple
from typing import NamedTuple

class UserRecord(NamedTuple):
    user_id: int
    username: str
    email: str

user = UserRecord(101, "hesam", "hesam@domain.com")
print(user.username)                # Access by name: "hesam"
print(user[0])                      # Access by index: 101
```

---

## Detailed Explanation

### 1. The Single-Element Tuple Trailing Comma Rule

In Python syntax, it is the **comma `,` that creates a tuple, not the parentheses `()`**.

Parentheses are used for mathematical expression grouping. Therefore, writing `(100)` evaluates simply to the integer `100`. To create a single-element tuple, you **must include a trailing comma**:

```python
x = ("python")
print(type(x))  # <class 'str'> ❌

y = ("python",)
print(type(y))  # <class 'tuple'> ✅
```

The only exception is the empty tuple `()`, which requires parentheses because there are no elements to separate with a comma.

### 2. Tuple Hashability and Composite Dictionary Keys

Because tuples are immutable, they are hashable as long as every element inside them is also hashable. This allows tuples to serve as **Composite Keys** in dictionaries (such as matrix grid coordinates or multi-field lookup tables):

```python
# Valid composite keys (tuples containing strings and integers):
grid_map = {
    (0, 0): "Cartesian Origin",
    (10, 20): "WayPoint Alpha",
    (50, 100): "Target Base",
}

print(grid_map[(10, 20)])  # "WayPoint Alpha"
```

If a tuple contains a mutable object (such as a list), attempting to hash the tuple raises a `TypeError: unhashable type: 'list'`.

### 3. NamedTuples: `collections.namedtuple` vs `typing.NamedTuple`

Python provides two mechanisms for creating named tuples:

#### Approach A: `collections.namedtuple` (Factory Function - Python 2.6+)
```python
from collections import namedtuple

# Factory function creating a namedtuple subclass
Point = namedtuple("Point", ["x", "y"])
p1 = Point(10.5, 20.0)
print(p1.x, p1.y)
```

#### Approach B: `typing.NamedTuple` (Class-based with Type Hints - Python 3.6+ Recommended)
```python
from typing import NamedTuple

class DatabaseConfig(NamedTuple):
    host: str
    port: int
    database: str
    ssl_enabled: bool = True  # Supports default values!

db_conf = DatabaseConfig("localhost", 5432, "production_db")
print(f"Connecting to {db_conf.host}:{db_conf.port}")
```

`typing.NamedTuple` provides full static type analysis support with Mypy, readable class-based syntax, and default field values while retaining 100% tuple performance.

---

## Examples

### 1. Simple: Returning Multiple Values from a Function
Using tuple packing to return multiple calculated metrics cleanly.

```python
def compute_dataset_stats(numbers: list[float]) -> tuple[float, float, float]:
    """Return (min_val, max_val, average) packed as a tuple."""
    if not numbers:
        raise ValueError("Cannot compute stats on empty sequence.")
        
    min_v = min(numbers)
    max_v = max(numbers)
    avg_v = sum(numbers) / len(numbers)
    
    return min_v, max_v, avg_v  # Implicit tuple packing

# Unpack results into three separate variables
minimum, maximum, average = compute_dataset_stats([12.5, 45.0, 8.2, 99.1, 23.4])

print(f"Min: {minimum:.1f}, Max: {maximum:.1f}, Avg: {average:.2f}")
```

### 2. Beginner: Star-Unpacking in Sequential Pipelines
Extracting head, tail, and body components from chronological logs or CSV rows.

```python
log_entry = "2024-05-18|AUTH|SUCCESS|user_101|192.168.1.50|session_token_xyz"
tokens = log_entry.split("|")

# Star unpacking: Capture timestamp, category, status, and dynamic trailing metadata
timestamp, category, status, *metadata = tokens

print(f"Timestamp : {timestamp}")
print(f"Category  : {category}")
print(f"Status    : {status}")
print(f"Metadata  : {metadata} (List of {len(metadata)} items)")
```

### 3. Intermediate: Composite Multi-Dimensional Caching
Using coordinate and parameter tuples as dictionary memoization cache keys.

```python
import time

# Memoization cache mapping (start_node, end_node, transport_mode) -> shortest_distance
route_cache = {}

def calculate_shortest_route(start: str, end: str, mode: str) -> float:
    cache_key = (start.lower(), end.lower(), mode.lower())
    
    if cache_key in route_cache:
        print(f"⚡ [CACHE HIT] Retrieved route for {cache_key}")
        return route_cache[cache_key]
        
    print(f"⏳ [COMPUTING] Calculating complex graph route for {cache_key}...")
    time.sleep(0.3)  # Simulate expensive Dijkstra graph calculation
    calculated_distance = 425.5
    
    # Store in composite tuple cache
    route_cache[cache_key] = calculated_distance
    return calculated_distance

print("Query 1:", calculate_shortest_route("Tehran", "Isfahan", "DRIVING"))
print("Query 2:", calculate_shortest_route("Tehran", "Isfahan", "DRIVING")) # Instant cache hit!
```

### 4. Real-World: Database Record Modeling with `typing.NamedTuple`
Modeling relational SQL database query rows as strongly typed, immutable value objects.

```python
from typing import NamedTuple
import datetime

class CustomerOrder(NamedTuple):
    order_id: int
    customer_name: str
    total_amount: float
    order_date: datetime.date
    is_shipped: bool = False

    def formatted_summary(self) -> str:
        status = "Shipped 🚚" if self.is_shipped else "Processing ⏳"
        return f"Order #{self.order_id:04d} for {self.customer_name} (${self.total_amount:,.2f}) - {status}"

# Instantiate records
order_1 = CustomerOrder(1042, "Hesam Pourabbasain", 349.99, datetime.date(2024, 5, 18), is_shipped=True)
order_2 = CustomerOrder(1043, "Sarah Jenkins", 1250.00, datetime.date(2024, 5, 18))

print(order_1.formatted_summary())
print(order_2.formatted_summary())

# NamedTuples retain standard tuple features (unpacking, slicing, indexing)
oid, name, amount, *rest = order_1
print(f"Unpacked: {name} paid ${amount}")
```

### 5. Advanced: Observing CPython Tuple Free List Caching
Inspecting how CPython caches deallocated tuples to optimize allocation latency.

```python
import sys

# In CPython, small tuples (length 1 to 20) are saved in an internal free list array
t1 = (1, 2, 3)
id1 = id(t1)
del t1  # Deallocated!

# Immediately allocating another 3-element tuple reuses the exact same freed struct!
t2 = (4, 5, 6)
id2 = id(t2)

print(f"Tuple 1 Memory Address : {id1}")
print(f"Tuple 2 Memory Address : {id2}")
print(f"Memory Reused (id1==id2): {id1 == id2} (CPython Free List Optimization)")
```

---

## Code Explanation

In Example 5 (CPython Free List):
1. Allocating heap memory repeatedly creates kernel syscall overhead and memory fragmentation.
2. CPython maintains an internal array of up to 20 free lists (`PyTuple_MAXSAVESIZE = 20`) for tuples of lengths 1 through 20.
3. When a small tuple is deleted (`del t1`), its underlying C `PyTupleObject` struct is not returned to the OS; it is placed onto the corresponding free list.
4. When a new tuple of identical length is allocated (`t2 = (4, 5, 6)`), CPython immediately reuses the cached C struct, resulting in identical memory addresses (`id1 == id2`) and instantaneous allocation speed.

---

## Common Mistakes

### Mistake 1: Creating a Single-Element Tuple Without a Comma
Writing `item = ("admin")` creates a string, not a tuple. Always include the trailing comma: `item = ("admin",)`.

### Mistake 2: Attempting to Mutate an Element in a Tuple
Tuples are strictly immutable. Modifying an element raises a `TypeError`.

```python
# BROKEN:
point = (10, 20)
# point[0] = 15  # Raises TypeError: 'tuple' object does not support item assignment

# CORRECT: Construct a new tuple or use a list if mutation is required
point = (15, point[1])
```

---

## Best Practices

### Use `typing.NamedTuple` for Readable Structured Records
Instead of referencing obscure index positions like `row[0]`, `row[1]`, `row[2]`, define a `NamedTuple` to give every field a descriptive name and type hint.

Good:
```python
from typing import NamedTuple

class GeoPoint(NamedTuple):
    latitude: float
    longitude: float

location = GeoPoint(35.6892, 51.3890)
print(f"Lat: {location.latitude}, Lng: {location.longitude}")
```

Avoid:
```python
location = (35.6892, 51.3890)
print(f"Lat: {location[0]}, Lng: {location[1]}")  # Cryptic index magic numbers
```

---

## Performance Considerations

1. **Memory Footprint**: A tuple with 3 elements consumes **~64 bytes** in 64-bit CPython, whereas an equivalent 3-element list consumes **~80 to 120 bytes** due to over-allocation capacity.
2. **Instantiation Speed**: Creating a literal tuple `(1, 2, 3)` is roughly **3x to 5x faster** than creating a list `[1, 2, 3]` because Python compiles constant tuples directly into bytecode constants (`LOAD_CONST`).

---

## Security Considerations

1. **Defensive Immutability in Function Signatures**: When passing sensitive data structures to untrusted third-party plugins or external modules, pass data as `tuple` rather than `list`. This guarantees that the external code cannot mutate your application state.
2. **Hash Collisions in Tuples**: When using composite tuples as dictionary keys, ensure all components contribute to distinct hash entropy to prevent HashDoS collision degradation.

---

## Real-World Usage

- **Database Connectors (Psycopg / SQLite)**: SQL drivers return query result rows as tuples of column values.
- **Geographic Information Systems (GIS)**: Storing latitude, longitude, and elevation coordinate triples `(lat, lon, alt)`.
- **Image Processing**: Representing pixel bounding boxes `(x_min, y_min, x_max, y_max)` and RGB/RGBA color vectors.

---

## Comparison: Tuple vs Alternative Structures

| Feature | `tuple` | `list` | `NamedTuple` | `@dataclass(frozen=True)` |
|---|---|---|---|---|
| **Mutability** | **Immutable** | Mutable | **Immutable** | **Immutable** |
| **Field Access** | Index only (`t[0]`)| Index only (`l[0]`)| Name & Index (`t.x`, `t[0]`)| Name (`d.x`) |
| **Memory Footprint**| **Minimal (Lowest)**| Moderate | **Minimal (Lowest)** | Slightly Higher |
| **Hashable (Dict Key)**| **Yes** (if items hashable)| No | **Yes** | **Yes** |
| **Type Annotations**| No | No | **Yes** | **Yes** |

---

## Advanced Concepts: Replacing NamedTuple Fields with `_replace()`

Because named tuples are immutable, you cannot alter an attribute directly (`user.email = "new@mail.com"` fails). However, named tuples provide an optimized helper method `._replace(**kwargs)` that constructs a new instance with specified fields updated:

```python
user_v1 = UserRecord(101, "hesam", "old_email@domain.com")

# Construct updated immutable record
user_v2 = user_v1._replace(email="new_email@domain.com")

print("Original User :", user_v1)
print("Updated User  :", user_v2)
print("Are different :", user_v1 is not user_v2)  # True
```

---

## Exercises

### Exercise 1 — Beginner
Create a tuple representing a book with three fields: `title`, `author`, and `publication_year`. Unpack the tuple into three separate variables and print an explanatory string. Try creating a single-element tuple containing only the publication year with proper comma syntax.

### Exercise 2 — Intermediate
Write a function `rgb_to_hex(color: tuple[int, int, int]) -> str` that accepts an RGB color tuple (e.g., `(255, 87, 51)`), validates that all three integers fall in the range $0 - 255$, and returns the formatted hex color code (e.g., `"#FF5733"`).

### Exercise 3 — Advanced
Build a `FlightRoute` system using `typing.NamedTuple`. Define an `Airport` namedtuple (`code`, `name`, `lat`, `lon`) and a `Flight` namedtuple (`flight_number`, `origin`, `destination`). Implement a method on `Flight` that calculates the Great-Circle distance in kilometers between origin and destination using the Haversine mathematical formula.

---

## Mini Project: Geospatial Route Distance Calculator with NamedTuples

### Requirements
Build an end-to-end flight navigation utility named `flight_navigator.py` that models airports and flight legs using `typing.NamedTuple`, computes Great-Circle distances using spherical trigonometry, and generates a formatted flight itinerary summary.

### Implementation Blueprint
```python
import math
from typing import NamedTuple

class GeoLocation(NamedTuple):
    name: str
    latitude: float
    longitude: float

class FlightSegment(NamedTuple):
    flight_id: str
    origin: GeoLocation
    destination: GeoLocation
    airline: str

    def calculate_distance_km(self) -> float:
        """Calculate Great-Circle distance using the Haversine formula."""
        R = 6371.0  # Earth mean radius in kilometers
        
        lat1, lon1 = math.radians(self.origin.latitude), math.radians(self.origin.longitude)
        lat2, lon2 = math.radians(self.destination.latitude), math.radians(self.destination.longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

if __name__ == "__main__":
    # Define Airport Locations
    tehran = GeoLocation("Tehran (IKA)", 35.4161, 51.1522)
    dubai = GeoLocation("Dubai (DXB)", 25.2532, 55.3657)
    frankfurt = GeoLocation("Frankfurt (FRA)", 50.0379, 8.5622)
    
    # Define Flight Segments
    itinerary = [
        FlightSegment("EK-972", tehran, dubai, "Emirates"),
        FlightSegment("LH-631", dubai, frankfurt, "Lufthansa")
    ]
    
    print("=" * 68)
    print("                INTERNATIONAL FLIGHT ITINERARY")
    print("=" * 68)
    print(f"{'FLIGHT':<10} {'AIRLINE':<14} {'ROUTING':<30} {'DISTANCE':>10}")
    print("-" * 68)
    
    total_km = 0.0
    for leg in itinerary:
        dist = leg.calculate_distance_km()
        total_km += dist
        route_str = f"{leg.origin.name} -> {leg.destination.name}"
        print(f"{leg.flight_id:<10} {leg.airline:<14} {route_str:<30} {dist:>9.1f} km")
        
    print("-" * 68)
    print(f"{'TOTAL JOURNEY DISTANCE:':<56} {total_km:>9.1f} km")
    print("=" * 68)
```

---

## Summary

In this lesson, you mastered Python's tuples and named tuples:
- Tuples are **immutable, ordered sequences of fixed length**, ideal for heterogeneous data records.
- In Python syntax, the **comma `,` creates a tuple**, making single-element tuples require a trailing comma `(item,)`.
- Tuples consume less memory than lists and instantiate significantly faster due to CPython's **small tuple free list**.
- Tuples are **hashable** (if their elements are hashable), allowing them to serve as composite dictionary keys.
- Use `typing.NamedTuple` to create clean, strongly typed, self-documenting data structures with attribute-name access.

---

## Best Practices Checklist

- [ ] Use tuples for fixed data records and lists for collections of variable size.
- [ ] Always include a trailing comma for single-element tuples: `single = (val,)`.
- [ ] Use `typing.NamedTuple` for domain value objects that require descriptive field names.
- [ ] Use tuple unpacking (`a, b = b, a`) for simultaneous variable assignments and swaps.
- [ ] Leverage tuple composite keys (`(x, y)`) for multi-dimensional dictionary lookups.

---

## What's Next?

Now that you have mastered tuples, continue to:
👉 **[Dictionaries & Hash Tables](dictionaries.md)** to master key-value hash mappings, lookup complexities, and dictionary views.
