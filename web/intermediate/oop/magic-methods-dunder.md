# Magic & Dunder Methods in Python

## Introduction

In Python, the phrase **"Magic Methods"** (or more formally, **Dunder Methods**, short for *Double Underscore Methods*) refers to special built-in methods whose names begin and end with two underscores (such as `__init__`, `__str__`, `__len__`, `__getitem__`, and `__add__`).

Dunder methods are the foundational building blocks of the **Python Data Model**. They allow user-defined classes to integrate seamlessly with Python's core language syntax and operators. When you call `len(my_object)`, Python does not inspect the object for a `.length` property; instead, it invokes `my_object.__len__()`. When you write `a + b`, Python executes `a.__add__(b)`. When you index `my_collection[0]`, Python executes `my_collection.__getitem__(0)`.

By implementing dunder protocols, your custom classes can behave just like native built-in types (`list`, `dict`, `int`, `float`), unlocking Python's rich expressiveness, intuitive mathematical operators, and seamless container manipulation.

This lesson explores the complete dunder method ecosystem: string representations, rich comparisons, container emulation, arithmetic operator overloading, hashability contracts, and callable instances.

---

## Prerequisites

Before studying dunder methods, ensure you have:

- Completed [Classes & Objects](classes-and-objects.md) and [Constructors & Attributes](constructors-and-attributes.md).
- Completed [Operators & Expressions](../../beginner/operators/arithmetic-operators.md).
- A solid understanding of Python collections and hashing concepts.

---

## Core Concept: The Python Data Model Protocols

```
                            THE PYTHON DATA MODEL DUNDER PROTOCOLS

   ┌───────────────────────────┬───────────────────────────────────────────────────────────┐
   │ Protocol Category         │ Primary Dunder Methods & Syntax Triggers                  │
   ├───────────────────────────┼───────────────────────────────────────────────────────────┤
   │ 1. String Representation  │ __repr__() (Developer debug), __str__() (User readable)   │
   ├───────────────────────────┼───────────────────────────────────────────────────────────┤
   │ 2. Equality & Comparison  │ __eq__ (==), __ne__ (!=), __lt__ (<), __le__ (<=),        │
   │                           │ __gt__ (>), __ge__ (>=), __hash__()                       │
   ├───────────────────────────┼───────────────────────────────────────────────────────────┤
   │ 3. Container & Sequences  │ __len__() [len(x)], __getitem__() [x[i]],                 │
   │                           │ __setitem__() [x[i]=v], __contains__() [val in x]         │
   ├───────────────────────────┼───────────────────────────────────────────────────────────┤
   │ 4. Operator Overloading   │ __add__ (+), __sub__ (-), __mul__ (*), __matmul__ (@),    │
   │                           │ __truediv__ (/), __radd__ (Reflected), __iadd__ (+=)      │
   ├───────────────────────────┼───────────────────────────────────────────────────────────┤
   │ 5. Callable Objects       │ __call__() [obj(arg1, arg2)]                              │
   ├───────────────────────────┼───────────────────────────────────────────────────────────┤
   │ 6. Context Managers       │ __enter__(), __exit__() [with obj:]                       │
   └───────────────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Dunder Patterns

```python
from functools import total_ordering

# 1. Complete String Representation & Equality
@total_ordering  # Automatically generates __gt__, __le__, __ge__ from __eq__ and __lt__!
class Currency:
    def __init__(self, amount: float, currency_code: str = "USD"):
        self.amount = round(float(amount), 2)
        self.code = currency_code.upper()

    # Developer Representation: Unambiguous, ideally valid executable Python code
    def __repr__(self) -> str:
        return f"Currency(amount={self.amount!r}, currency_code={self.code!r})"

    # User Representation: Human-readable formatted string
    def __str__(self) -> str:
        return f"{self.amount:,.2f} {self.code}"

    # Equality Protocol
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Currency):
            return NotImplemented
        return (self.amount, self.code) == (other.amount, other.code)

    # Ordering Protocol
    def __lt__(self, other: object) -> bool:
        if not isinstance(other, Currency):
            return NotImplemented
        if self.code != other.code:
            raise ValueError(f"Cannot compare different currencies: {self.code} vs {other.code}")
        return self.amount < other.amount

    # Hashability Contract (Required if __eq__ is implemented and object is immutable)
    def __hash__(self) -> int:
        return hash((self.amount, self.code))

    # Operator Overloading: __add__ (+)
    def __add__(self, other: "Currency") -> "Currency":
        if not isinstance(other, Currency) or self.code != other.code:
            return NotImplemented
        return Currency(self.amount + other.amount, self.code)

c1 = Currency(150.50, "USD")
c2 = Currency(50.25, "USD")

print("str()  :", str(c1))         # "150.50 USD"
print("repr() :", repr(c1))        # "Currency(amount=150.5, currency_code='USD')"
print("Sum (+) :", c1 + c2)         # "200.75 USD"
print("c1 > c2:", c1 > c2)         # True (Generated by @total_ordering)
```

---

## Detailed Explanation

### 1. `__repr__` vs `__str__`: The Golden Rule

- **`__repr__(self) -> str`**: Intended for **developers, debuggers, and logs**. It should be unambiguous, precise, and if possible, should resemble valid Python code that could recreate the object: `eval(repr(obj)) == obj`.
- **`__str__(self) -> str`**: Intended for **end-users and UI output**. It should be clean and readable.

#### Fallback Mechanism:
If `__str__` is not implemented on a class, Python automatically falls back to `__repr__`. However, if `__repr__` is omitted, Python falls back to the ugly default `<__main__.MyClass object at 0x104...>`.

**Golden Rule**: **Always implement `__repr__` first**.

---

### 2. Operator Overloading: Binary, Reflected (`__radd__`), and `NotImplemented`

When Python evaluates `a + b`:
1. It first calls `a.__add__(b)`.
2. If `a.__add__(b)` returns the special singleton **`NotImplemented`** (indicating `a` doesn't know how to add `b`), Python reverses the operation and calls `b.__radd__(a)` (Reflected Addition).
3. If both return `NotImplemented`, Python raises a `TypeError: unsupported operand type(s)`.

```python
class Vector2D:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __add__(self, other):
        # Handle Vector + Vector
        if isinstance(other, Vector2D):
            return Vector2D(self.x + other.x, self.y + other.y)
        # Handle Vector + Scalar Number
        elif isinstance(other, (int, float)):
            return Vector2D(self.x + other, self.y + other)
        return NotImplemented

    def __radd__(self, other):
        # Handle Scalar Number + Vector (e.g. 5 + Vector2D(1, 2))
        return self.__add__(other)

    def __repr__(self):
        return f"Vector2D({self.x}, {self.y})"

v = Vector2D(10, 20)
print(v + 5)   # Vector2D(15, 25) (Invokes __add__)
print(5 + v)   # Vector2D(15, 25) (Invokes __radd__)
```

---

### 3. Emulating Containers: `__len__`, `__getitem__`, and Slicing

By implementing `__len__` and `__getitem__`, your custom class gains full support for:
- `len(obj)`
- Indexing (`obj[0]`, `obj[-1]`)
- Slicing (`obj[1:4]`)
- `for item in obj:` (Iteration automatically synthesized from `__getitem__`!)
- `item in obj` (Membership check automatically synthesized!)

```python
class TaskQueue:
    def __init__(self, tasks: list[str]):
        self._tasks = list(tasks)

    def __len__(self) -> int:
        return len(self._tasks)

    def __getitem__(self, index_or_slice):
        # Handles both integer indices (queue[0]) and slices (queue[1:3])
        return self._tasks[index_or_slice]

    def __setitem__(self, index: int, value: str):
        self._tasks[index] = value

    def __contains__(self, task_name: str) -> bool:
        return task_name in self._tasks

queue = TaskQueue(["Deploy API", "Run Tests", "Backup DB"])
print("Length      :", len(queue))         # 3
print("First Item  :", queue[0])           # "Deploy API"
print("Slice [1:]  :", queue[1:])          # ['Run Tests', 'Backup DB']
print("In Check    :", "Run Tests" in queue) # True
```

---

### 4. Callable Objects via `__call__`

Implementing **`__call__(self, *args, **kwargs)`** allows an object instance to be invoked using standard function parentheses `obj()`:

```python
class ExponentialMovingAverage:
    """Stateful moving average calculator."""
    def __init__(self, alpha: float = 0.2):
        self.alpha = alpha
        self.current_ema = None

    def __call__(self, new_value: float) -> float:
        if self.current_ema is None:
            self.current_ema = new_value
        else:
            self.current_ema = (self.alpha * new_value) + ((1.0 - self.alpha) * self.current_ema)
        return round(self.current_ema, 2)

# Instantiate callable filter instance
ema_filter = ExponentialMovingAverage(alpha=0.3)

# Invoke instance like a function!
print(ema_filter(100.0))  # 100.0
print(ema_filter(110.0))  # 103.0
print(ema_filter(120.0))  # 108.1
print("Is Callable?", callable(ema_filter)) # True!
```

---

## Examples

### 1. Simple: Mathematical 2D Vector with Operator Overloading
Implementing a fully overloaded vector object supporting addition, subtraction, scalar multiplication, and dot products.

```python
class Vector:
    def __init__(self, x: float, y: float):
        self.x = float(x)
        self.y = float(y)

    def __repr__(self) -> str:
        return f"Vector({self.x}, {self.y})"

    def __add__(self, other: "Vector") -> "Vector":
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        return NotImplemented

    def __sub__(self, other: "Vector") -> "Vector":
        if isinstance(other, Vector):
            return Vector(self.x - other.x, self.y - other.y)
        return NotImplemented

    def __mul__(self, scalar: float) -> "Vector":
        if isinstance(scalar, (int, float)):
            return Vector(self.x * scalar, self.y * scalar)
        return NotImplemented

    def __rmul__(self, scalar: float) -> "Vector":
        return self.__mul__(scalar)

    # Matrix / Dot Product Operator (@)
    def __matmul__(self, other: "Vector") -> float:
        if isinstance(other, Vector):
            return (self.x * other.x) + (self.y * other.y)
        return NotImplemented

v1 = Vector(2, 3)
v2 = Vector(4, 1)

print("v1 + v2     :", v1 + v2)     # Vector(6.0, 4.0)
print("v1 - v2     :", v1 - v2)     # Vector(-2.0, 2.0)
print("v1 * 3      :", v1 * 3)      # Vector(6.0, 9.0)
print("3 * v1      :", 3 * v1)      # Vector(6.0, 9.0)
print("Dot (v1 @ v2):", v1 @ v2)    # 11.0 (2*4 + 3*1)
```

### 2. Beginner: Custom Hashable Coordinate Object for Dictionary Keys
Implementing `__eq__` and `__hash__` to use custom instances as dictionary keys or set members.

```python
class GeoPoint:
    def __init__(self, latitude: float, longitude: float):
        self._lat = round(float(latitude), 4)
        self._lon = round(float(longitude), 4)

    @property
    def lat(self): return self._lat
    @property
    def lon(self): return self._lon

    def __repr__(self):
        return f"GeoPoint({self._lat}, {self._lon})"

    def __eq__(self, other):
        if not isinstance(other, GeoPoint):
            return NotImplemented
        return (self._lat, self._lon) == (other._lat, other._lon)

    def __hash__(self):
        # Hash must be computed from the EXACT same immutable fields as __eq__!
        return hash((self._lat, self._lon))

# Storing GeoPoints in Sets and as Dict Keys
landmarks = {
    GeoPoint(37.7749, -122.4194): "San Francisco",
    GeoPoint(40.7128, -74.0060): "New York City",
}

lookup = GeoPoint(37.7749, -122.4194)
print("Dictionary Key Lookup:", landmarks[lookup]) # "San Francisco"
```

### 3. Intermediate: Media Playlist Container with Custom Slicing
Building a sequence container supporting indexing, length, and membership tests.

```python
class AudioPlaylist:
    def __init__(self, name: str, tracks: list[str] = None):
        self.name = name
        self._tracks = list(tracks or [])

    def __len__(self) -> int:
        return len(self._tracks)

    def __getitem__(self, item):
        if isinstance(item, slice):
            # Return new AudioPlaylist on slicing!
            return AudioPlaylist(f"{self.name} (Sub-Mix)", self._tracks[item])
        return self._tracks[item]

    def __contains__(self, track_title: str) -> bool:
        return track_title.lower() in (t.lower() for t in self._tracks)

    def __repr__(self) -> str:
        return f"AudioPlaylist(name='{self.name}', track_count={len(self._tracks)})"

playlist = AudioPlaylist("Chillwave Mix", ["Track 01 - Sunset", "Track 02 - Neon", "Track 03 - Dreams", "Track 04 - Orbit"])
print("Playlist Representation :", playlist)
print("First Track             :", playlist[0])
print("Is 'Neon' in playlist?  :", "Track 02 - Neon" in playlist)

# Slicing creates a new sub-playlist:
sub_mix = playlist[1:3]
print("Sub-Mix Sliced Playlist :", sub_mix, "->", list(sub_mix))
```

### 4. Real-World: Stateful Token Bucket Rate Limiter with `__call__`
Using `__call__` to create reusable middleware rate limiters.

```python
import time

class TokenBucketRateLimiter:
    def __init__(self, max_tokens: int, refill_rate_per_sec: float):
        self.capacity = max_tokens
        self.refill_rate = refill_rate_per_sec
        self.tokens = float(max_tokens)
        self.last_refill = time.time()

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + (elapsed * self.refill_rate))
        self.last_refill = now

    def __call__(self, tokens_requested: int = 1) -> bool:
        """Call instance to attempt acquiring rate limiter tokens."""
        self._refill()
        if self.tokens >= tokens_requested:
            self.tokens -= tokens_requested
            return True
        return False

limiter = TokenBucketRateLimiter(max_tokens=3, refill_rate_per_sec=1.0)

# Simulate requests
print("Req 1 (1 token):", limiter(1)) # True
print("Req 2 (1 token):", limiter(1)) # True
print("Req 3 (1 token):", limiter(1)) # True
print("Req 4 (1 token):", limiter(1)) # False (Rate limited!)
```

### 5. Advanced: Matrix Class with 2D Indexing & `@` Matrix Multiplication
Building a full numerical matrix class supporting `matrix[row, col]` indexing and `matrix_a @ matrix_b`.

```python
class Matrix2D:
    def __init__(self, data: list[list[float]]):
        self.rows = len(data)
        self.cols = len(data[0]) if data else 0
        self._grid = [[float(val) for val in row] for row in data]

    def __repr__(self) -> str:
        return f"Matrix2D({self._grid})"

    def __getitem__(self, key: tuple[int, int]) -> float:
        row, col = key
        return self._grid[row][col]

    def __setitem__(self, key: tuple[int, int], value: float):
        row, col = key
        self._grid[row][col] = float(value)

    # Matrix Multiplication Overload (@ operator)
    def __matmul__(self, other: "Matrix2D") -> "Matrix2D":
        if not isinstance(other, Matrix2D) or self.cols != other.rows:
            raise ValueError(f"Matrix dimension mismatch for multiplication: ({self.rows}x{self.cols}) @ ({other.rows}x{other.cols})")

        result = [[0.0 for _ in range(other.cols)] for _ in range(self.rows)]
        for i in range(self.rows):
            for j in range(other.cols):
                result[i][j] = sum(self._grid[i][k] * other._grid[k][j] for k in range(self.cols))
                
        return Matrix2D(result)

# Test 2x2 Matrix Multiplication
m1 = Matrix2D([[1, 2], [3, 4]])
m2 = Matrix2D([[5, 6], [7, 8]])

m_prod = m1 @ m2
print("2D Element [0, 1] :", m1[0, 1]) # 2.0
print("Matrix Product (@):", m_prod)   # Matrix2D([[19.0, 22.0], [43.0, 50.0]])
```

---

## Code Explanation

In Example 5 (`Matrix2D`):
1. `__getitem__(self, key)` accepts a 2-element tuple `(row, col)` when indexed like `m1[0, 1]`, enabling clean multidimensional syntax.
2. `__matmul__(self, other)` overloads the Python 3.5+ matrix multiplication operator (`@` - PEP 465), executing linear algebraic dot-product accumulations.
3. This showcases how Python dunder methods enable custom scientific and mathematical domains to read like mathematical equations.

---

## Common Mistakes

### Mistake 1: Raising TypeError Instead of Returning `NotImplemented`
In arithmetic operators (`__add__`, `__eq__`), raising `TypeError` immediately halts execution and **prevents the reflected operator (`__radd__`) from executing**. Always return `NotImplemented`.

```python
# BROKEN:
def __add__(self, other):
    if not isinstance(other, Vector):
        raise TypeError("Incompatible type")  # Prevents __radd__! ❌

# CORRECT:
def __add__(self, other):
    if not isinstance(other, Vector):
        return NotImplemented  # Allows other.__radd__(self) to execute! ✅
```

### Mistake 2: Implementing `__eq__` Without `__hash__`
In Python 3, if a class defines `__eq__` but does not define `__hash__`, Python automatically sets `__hash__ = None`, making instances **unusable as dictionary keys or set elements**. If your object is immutable, implement `__hash__` returning the hash of the same fields used in `__eq__`.

---

## Best Practices

### Use `@functools.total_ordering` for Rich Comparisons
Avoid writing boilerplate for all 6 comparison operators (`__eq__`, `__ne__`, `__lt__`, `__le__`, `__gt__`, `__ge__`). Implement `__eq__` and `__lt__`, and decorate the class with `@total_ordering`.

Good:
```python
from functools import total_ordering

@total_ordering
class PriorityItem:
    def __init__(self, priority: int): self.priority = priority
    def __eq__(self, o): return self.priority == o.priority
    def __lt__(self, o): return self.priority < o.priority
```

---

## Performance Considerations

1. **CPython C-Slot Optimization**: Built-in dunder operations are mapped directly to low-level C function pointers (`tp_as_number`, `tp_as_sequence`, `tp_as_mapping`) in the CPython `PyTypeObject` struct. Invoking `len(obj)` or `a + b` executes in under **$30\text{ nanoseconds}$**.
2. **`__hash__` Invariance**: Ensure `__hash__()` is fast ($O(1)$) and strictly deterministic. Never perform database queries or disk reads inside `__hash__`.

---

## Security Considerations

1. **Hash Flooding Protection**: Python randomizes the hash seed per interpreter process (SipHash-2-4) to prevent algorithmic complexity attacks on dictionaries and sets. Custom `__hash__` methods should delegate to `hash(tuple_of_fields)` to inherit this protection.
2. **In-Place Mutation Invariants**: Be cautious with `__iadd__` (`+=`) on shared references, as in-place mutations affect all aliased references to the same object.

---

## Real-World Usage

- **NumPy & PyTorch**: Overloading `+`, `-`, `*`, `@` for tensor operations.
- **Pathlib (`Path`)**: Overloading the division operator `/` (`__truediv__`) for path concatenation.
- **SQLAlchemy (`Column`)**: Overloading `==` and `>` to build SQL WHERE clause expressions dynamically.

---

## Comparison: Dunder Protocol Categories

| Category | Typical Dunders | Syntax Triggers | Best Use Case |
|---|---|---|---|
| **Representation** | `__repr__`, `__str__`, `__format__` | `repr(x)`, `str(x)`, `f"{x}"` | Every custom class |
| **Comparisons** | `__eq__`, `__lt__`, `__hash__` | `==`, `<`, `in set`, `dict[x]` | Value objects, models |
| **Container** | `__len__`, `__getitem__`, `__contains__`| `len(x)`, `x[i]`, `val in x` | Custom collections, buffers |
| **Arithmetic** | `__add__`, `__sub__`, `__matmul__` | `+`, `-`, `@`, `+=` | Vectors, units, currencies |
| **Callable** | `__call__` | `x(arg1, arg2)` | Closures, middlewares, filters|

---

## Advanced Concepts: `__getattr__` vs `__getattribute__`

- **`__getattr__(self, name)`**: Invoked **only as a fallback** when the requested attribute is NOT found in `self.__dict__` or the class hierarchy.
- **`__getattribute__(self, name)`**: Invoked **unconditionally on EVERY attribute read**. Overriding `__getattribute__` requires extreme care to avoid infinite recursion (must delegate via `super().__getattribute__(name)`).

---

## Exercises

### Exercise 1 — Beginner
Create a class `Fraction` with integer attributes `numerator` and `denominator`. Implement `__repr__`, `__str__`, and `__eq__`. Implement `__add__` to support adding two fractions (`a/b + c/d = (ad + bc) / bd`).

### Exercise 2 — Intermediate
Build a `Sentence` class that takes a string of words. Implement container dunders so `len(sentence)` returns word count, `sentence[0]` returns the first word, and `'python' in sentence` performs case-insensitive word membership.

### Exercise 3 — Advanced
Build a `PipelineStep` callable class using `__call__`. Overload the bitwise OR operator `|` (`__or__`) such that chaining steps (`step1 | step2 | step3`) returns a composite `SequentialPipeline` callable that executes data transformations sequentially.

---

## Mini Project: Multi-Currency Portfolio Valuation & Ledger Engine

### Requirements
Build an immutable multi-currency financial ledger engine named `portfolio_ledger.py`. Implement a `Money` value object with full arithmetic overloading, rich comparisons, currency exchange dispatching, and a `Portfolio` container class supporting sum aggregations and slicing.

### Implementation Blueprint
```python
from functools import total_ordering

# =====================================================================
# 1. IMMUTABLE MONEY VALUE OBJECT
# =====================================================================

@total_ordering
class Money:
    # Fixed Reference Exchange Rates to USD
    EXCHANGE_RATES_TO_USD = {
        "USD": 1.0,
        "EUR": 1.08,
        "GBP": 1.26,
        "JPY": 0.0064
    }

    def __init__(self, amount: float, currency: str = "USD"):
        curr_upper = currency.upper()
        if curr_upper not in self.EXCHANGE_RATES_TO_USD:
            raise ValueError(f"Unsupported currency: '{currency}'")
        self._amount = round(float(amount), 2)
        self._currency = curr_upper

    @property
    def amount(self) -> float: return self._amount

    @property
    def currency(self) -> str: return self._currency

    # Representations
    def __repr__(self) -> str:
        return f"Money(amount={self._amount!r}, currency={self._currency!r})"

    def __str__(self) -> str:
        symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
        sym = symbols.get(self._currency, self._currency + " ")
        return f"{sym}{self._amount:,.2f}"

    def to_usd(self) -> float:
        return self._amount * self.EXCHANGE_RATES_TO_USD[self._currency]

    # Comparisons
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Money):
            return NotImplemented
        return abs(self.to_usd() - other.to_usd()) < 1e-4

    def __lt__(self, other: object) -> bool:
        if not isinstance(other, Money):
            return NotImplemented
        return self.to_usd() < other.to_usd()

    def __hash__(self) -> int:
        return hash((self._amount, self._currency))

    # Arithmetic Overloading
    def __add__(self, other: "Money") -> "Money":
        if isinstance(other, Money):
            if self._currency == other._currency:
                return Money(self._amount + other._amount, self._currency)
            # Cross-currency conversion to self._currency
            other_in_self = other.to_usd() / self.EXCHANGE_RATES_TO_USD[self._currency]
            return Money(self._amount + other_in_self, self._currency)
        return NotImplemented

    def __mul__(self, scalar: float) -> "Money":
        if isinstance(scalar, (int, float)):
            return Money(self._amount * scalar, self._currency)
        return NotImplemented

    def __rmul__(self, scalar: float) -> "Money":
        return self.__mul__(scalar)

# =====================================================================
# 2. PORTFOLIO CONTAINER OBJECT
# =====================================================================

class InvestmentPortfolio:
    def __init__(self, name: str, positions: list[Money] = None):
        self.name = name
        self._positions = list(positions or [])

    def add_position(self, money: Money):
        self._positions.append(money)

    def __len__(self) -> int:
        return len(self._positions)

    def __getitem__(self, item):
        return self._positions[item]

    def __repr__(self) -> str:
        return f"InvestmentPortfolio(name='{self.name}', positions={len(self._positions)})"

    def total_value(self, target_currency: str = "USD") -> Money:
        total_usd = sum(p.to_usd() for p in self._positions)
        target_upper = target_currency.upper()
        rate = Money.EXCHANGE_RATES_TO_USD[target_upper]
        return Money(total_usd / rate, target_upper)

if __name__ == "__main__":
    print("=" * 65)
    print("      MULTI-CURRENCY LEDGER & DUNDER OPERATOR ENGINE")
    print("=" * 65)
    
    usd = Money(100.0, "USD")
    eur = Money(50.0, "EUR")
    gbp = Money(25.0, "GBP")
    
    print("Position 1 :", usd) # $100.00
    print("Position 2 :", eur) # €50.00
    print("Position 3 :", gbp) # £25.00
    
    # 1. Test Cross-Currency Addition (+)
    total_in_usd = usd + eur + gbp
    print("\nCross-Currency Sum (USD Base) :", total_in_usd)
    
    # 2. Test Multiplier (*)
    doubled = usd * 2.5
    print("Scalar Multiplication ($100 * 2.5):", doubled)
    
    # 3. Test Total Ordering (<, ==, >)
    print("\nComparison Tests:")
    print("Is €50.00 > $50.00? :", eur > Money(50.0, "USD")) # True (€50 is ~$54)
    print("Is $100 == $100?    :", usd == Money(100.0, "USD")) # True
    
    # 4. Container Portfolio Tests
    print("\n--- Portfolio Container Tests ---")
    portfolio = InvestmentPortfolio("Global Growth Fund", [usd, eur, gbp])
    print(f"Portfolio Summary : {portfolio}")
    print(f"Total Asset Count : {len(portfolio)} assets")
    print(f"Asset #1 via [0]  : {portfolio[0]}")
    print(f"Total Valuation   : {portfolio.total_value('USD')} (USD)")
    print(f"Total Valuation   : {portfolio.total_value('EUR')} (EUR)")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's dunder method ecosystem:
- Dunder methods define the **Python Data Model**, enabling custom classes to integrate seamlessly with native language operators.
- Always implement **`__repr__`** for debugging and **`__str__`** for readable output.
- Overload binary operators (`__add__`, `__sub__`, `__mul__`, `__matmul__`) and return **`NotImplemented`** to trigger reflected operators (`__radd__`).
- Implement **`__len__`**, **`__getitem__`**, and **`__contains__`** to build expressive custom sequence containers.
- Use **`__call__`** to transform stateful class instances into callable objects.
- Decorate comparison classes with **`@functools.total_ordering`** to generate relational operators automatically.

---

## Best Practices Checklist

- [ ] Implement `__repr__` for every class to facilitate debugging.
- [ ] Return `NotImplemented` instead of raising `TypeError` in arithmetic operators.
- [ ] Implement both `__eq__` and `__hash__` consistently on immutable value objects.
- [ ] Use `@functools.total_ordering` when defining ordering relations (`__lt__`).
- [ ] Handle slices properly inside `__getitem__`.

---

## What's Next?

Now that you understand dunder protocols, continue to the final article in this module:
👉 **[Modern Data Modeling with Dataclasses](dataclasses.md)** to master `@dataclass`, `field()`, default factories, and immutable structures (PEP 557).
