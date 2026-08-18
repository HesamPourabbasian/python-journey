# Arithmetic Operators & Math Expressions in Python

## Introduction

At the core of virtually every algorithm, simulation, data pipeline, and software system lies arithmetic computation. Whether an engineer is computing geometric coordinates for computer graphics, calculating compound financial interest, determining pagination offsets in a web API, or normalising matrix weights in a machine learning model, mathematical operations are indispensable.

Python provides a clean, highly expressive suite of arithmetic operators that closely mirrors standard mathematical notation. However, unlike lower-level languages where arithmetic is directly bound to hardware register word sizes (which can silently overflow or behave unpredictably with integer division), Python implements well-defined mathematical semantics: arbitrary-precision integer calculations, true floating-point division by default, consistent floor division, and mathematical modulo operations.

Understanding how Python evaluates arithmetic expressions requires a thorough knowledge of operator precedence, operator associativity, unary operations, and the underlying object protocol methods (dunders) that power these operators.

This lesson builds directly upon [Integers & Floats](../variables-data-types/integers-floats.md) and provides the computational tools necessary to build complex logical conditions and data transformations in subsequent modules.

---

## Prerequisites

Before studying arithmetic operators, ensure you have:

- Completed all articles in [Module 2: Variables & Data Types](../variables-data-types/README.md).
- A solid understanding of Python's numeric types (`int`, `float`, `Decimal`).
- Familiarity with basic high-school algebra and order of operations (PEMDAS/BODMAS).

---

## Core Concept

Python supports seven fundamental binary arithmetic operators, along with two unary operators:

```
                            PYTHON ARITHMETIC OPERATORS
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  Basic Operations              Division & Remainder             Power & Signs
  • Addition (+)                • True Division (/)              • Exponentiation (**)
  • Subtraction (-)             • Floor Division (//)            • Unary Positive (+x)
  • Multiplication (*)          • Modulo Remainder (%)           • Unary Negative (-x)
```

Every operator in Python corresponds to a special "magic" method (dunder method) defined on the object's class. For example, evaluating `a + b` internally invokes `a.__add__(b)` or `b.__radd__(a)`.

---

## Syntax & Operator Summary

```python
# 1. Addition (+) and Subtraction (-)
sum_val = 20 + 5          # 25
diff_val = 20 - 5         # 15

# 2. Multiplication (*)
product_val = 20 * 5      # 100

# 3. True Division (/) - ALWAYS returns a float in Python 3
div_val = 20 / 5          # 4.0 (float)
div_odd = 7 / 2           # 3.5 (float)

# 4. Floor Division (//) - Truncates down towards negative infinity
floor_val = 7 // 2        # 3 (int)
floor_neg = -7 // 2       # -4 (int)

# 5. Modulo / Remainder (%)
remainder = 17 % 5        # 2 (17 = 5 * 3 + 2)

# 6. Exponentiation (**) - Power operation
power_val = 2 ** 8        # 256 (2 to the power of 8)

# 7. Unary Signs (+, -)
positive = +42            # 42
negated = -42             # -42
```

---

## Detailed Explanation

### 1. Operator Precedence and Associativity

When an expression contains multiple operators, Python determines the execution order using **Operator Precedence** (highest to lowest priority). When operators have the same precedence, Python resolves them using **Associativity** (typically left-to-right, with the notable exception of exponentiation, which is right-to-left).

| Precedence (High $\rightarrow$ Low) | Operator | Description | Associativity |
|---|---|---|---|
| **1 (Highest)** | `()` | Parentheses (Grouping) | Left-to-Right |
| **2** | `**` | Exponentiation | **Right-to-Left** |
| **3** | `+x`, `-x`, `~x` | Unary Plus, Minus, Bitwise NOT | Right-to-Left |
| **4** | `*`, `/`, `//`, `%` | Multiplication, Division, Floor, Modulo | Left-to-Right |
| **5 (Lowest)** | `+`, `-` | Addition, Subtraction | Left-to-Right |

#### Right-to-Left Exponentiation Example:
```python
# Evaluates as 2 ** (3 ** 2) == 2 ** 9 == 512 (NOT (2 ** 3) ** 2 == 8 ** 2 == 64)
result = 2 ** 3 ** 2
print(result)  # 512
```

### 2. True Division (`/`) vs Floor Division (`//`)

In Python 3:
- `/` always performs **true division** and always returns a `float`, even when dividing evenly (`10 / 2` yields `5.0`).
- `//` performs **floor division**, returning the largest integer less than or equal to the algebraic quotient:

$$\lfloor a / b \rfloor$$

When dividing negative numbers, floor division rounds down toward negative infinity:
```python
print(7 // 2)   # 3.5 floored -> 3
print(-7 // 2)  # -3.5 floored -> -4 (NOT -3!)
```

### 3. The Modulo Operator (`%`) Mechanics

In Python, the modulo operator strictly satisfies the fundamental mathematical identity:

$$a = b \times (a // b) + (a \% b)$$

From this identity, the remainder $r = a \% b$ always inherits the sign of the divisor $b$. This differs from C, C++, and Java (where remainder inherits the sign of the dividend $a$):

```python
# In Python:
print(7 % 3)    # 1   (7 = 3 * 2 + 1)
print(-7 % 3)   # 2   (-7 = 3 * (-3) + 2) -> Divisor 3 is positive, remainder is positive!
print(7 % -3)   # -2  (7 = -3 * (-3) + (-2)) -> Divisor -3 is negative, remainder is negative!
```

Python's modulo behavior is mathematically superior for cyclical wrapping (such as clock arithmetic and array indexing).

### 4. The Built-in `divmod(a, b)` Function

When you need both the floor quotient and the modulo remainder simultaneously, calling `divmod(a, b)` calculates both in a single, optimized C-level operation, returning a 2-tuple `(quotient, remainder)`:

```python
quotient, remainder = divmod(125, 60)
print(f"125 seconds = {quotient} minutes and {remainder} seconds")
```

---

## Examples

### 1. Simple: Order of Operations Demonstration
Illustrating how parentheses override default operator precedence.

```python
# Without parentheses: 10 + (5 * 2) - (8 / 4) -> 10 + 10 - 2.0 -> 18.0
raw_math = 10 + 5 * 2 - 8 / 4
print("Default Precedence :", raw_math)

# With explicit grouping: ((10 + 5) * 2 - 8) / 4 -> (30 - 8) / 4 -> 22 / 4 -> 5.5
grouped_math = ((10 + 5) * 2 - 8) / 4
print("Grouped Precedence :", grouped_math)
```

### 2. Beginner: Cyclical Wrapping and Clock Arithmetic
Using the modulo operator `%` to wrap values within bounded ranges.

```python
def get_future_hour(current_hour: int, hours_to_add: int) -> int:
    """Calculate the 12-hour clock time after adding hours."""
    # (current_hour + hours_to_add) % 12, mapping 0 to 12
    future_time = (current_hour + hours_to_add) % 12
    return 12 if future_time == 0 else future_time

print("3 PM + 4 hours  =", get_future_hour(3, 4), "PM")
print("9 AM + 5 hours  =", get_future_hour(9, 5), "PM")
print("11 PM + 14 hours =", get_future_hour(11, 14), "PM")
```

### 3. Intermediate: Geometric Calculations
Computing the surface area, volume, and diagonal of a 3D rectangular box using exponentiation and square roots.

```python
import math

def calculate_box_metrics(width: float, height: float, depth: float) -> dict:
    volume = width * height * depth
    surface_area = 2 * (width * height + height * depth + width * depth)
    
    # 3D Space Diagonal: sqrt(w^2 + h^2 + d^2)
    space_diagonal = math.sqrt(width**2 + height**2 + depth**2)
    
    return {
        "volume": volume,
        "surface_area": surface_area,
        "space_diagonal": space_diagonal
    }

metrics = calculate_box_metrics(12.0, 5.0, 9.0)
for k, v in metrics.items():
    print(f"{k.replace('_', ' ').title():<18}: {v:.2f}")
```

### 4. Real-World: Time Duration Decomposition
Decomposing a large total number of seconds into human-readable Days, Hours, Minutes, and Seconds using `divmod()` and `//`.

```python
def format_duration(total_seconds: int) -> str:
    """Decompose raw seconds into Days, Hours, Minutes, and Seconds."""
    days, remainder = divmod(total_seconds, 86400)      # 86400 seconds in a day
    hours, remainder = divmod(remainder, 3600)          # 3600 seconds in an hour
    minutes, seconds = divmod(remainder, 60)            # 60 seconds in a minute
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0 or days > 0:
        parts.append(f"{hours}h")
    if minutes > 0 or hours > 0 or days > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{seconds}s")
    
    return " ".join(parts)

print("Uptime (90 sec)     :", format_duration(90))
print("Uptime (3665 sec)   :", format_duration(3665))
print("Uptime (184920 sec) :", format_duration(184920))
```

### 5. Advanced: Implementing Vector Arithmetic via Dunder Methods
Creating a 2D mathematical vector class supporting `+`, `-`, `*` (scalar product), and `==` through the arithmetic dunder protocol.

```python
import math

class Vector2D:
    def __init__(self, x: float, y: float):
        self.x = float(x)
        self.y = float(y)

    def __repr__(self) -> str:
        return f"Vector2D({self.x}, {self.y})"

    def __add__(self, other: "Vector2D") -> "Vector2D":
        if not isinstance(other, Vector2D):
            return NotImplemented
        return Vector2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Vector2D") -> "Vector2D":
        if not isinstance(other, Vector2D):
            return NotImplemented
        return Vector2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float | int) -> "Vector2D":
        """Scalar multiplication: v * scalar"""
        if not isinstance(scalar, (int, float)):
            return NotImplemented
        return Vector2D(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar: float | int) -> "Vector2D":
        """Reflected scalar multiplication: scalar * v"""
        return self.__mul__(scalar)

    def magnitude(self) -> float:
        return math.sqrt(self.x**2 + self.y**2)

v1 = Vector2D(3, 4)
v2 = Vector2D(1, 2)

v_sum = v1 + v2
v_diff = v1 - v2
v_scaled = v1 * 2.5
v_scaled_reflected = 3 * v2

print(f"v1             : {v1} (Magnitude: {v1.magnitude()})")
print(f"v1 + v2        : {v_sum}")
print(f"v1 - v2        : {v_diff}")
print(f"v1 * 2.5       : {v_scaled}")
print(f"3 * v2         : {v_scaled_reflected}")
```

---

## Code Explanation

In Example 5 (Vector Arithmetic):
1. Implementing `__add__` defines the behavior of the `+` operator when a `Vector2D` appears on the left-hand side.
2. Implementing `__mul__` defines scalar multiplication (`v1 * 2.5`).
3. Implementing `__rmul__` (Reflected Multiplication) allows the scalar to appear on the left-hand side (`3 * v2`). When Python encounters `3 * v2`, the integer `3` does not know how to multiply a `Vector2D`, so Python reflects the call to `v2.__rmul__(3)`.
4. Returning `NotImplemented` instead of raising an exception allows Python to attempt fallback reflected operations or type coercions cleanly.

---

## Common Mistakes

### Mistake 1: Confusing Bitwise XOR (`^`) with Exponentiation (`**`)
In mathematics and languages like LaTeX/Excel, `^` denotes exponentiation ($2^3 = 8$). In Python, `^` is the **Bitwise XOR** operator.

```python
# BROKEN:
val = 2 ^ 3  # Performs 0b0010 XOR 0b0011 -> Evaluates to 1! ❌

# CORRECT:
val = 2 ** 3 # Evaluates to 8 ✅
```

### Mistake 2: Forgetting that `/` Always Returns a Float
In Python 2, `5 / 2` returned `2`. In Python 3, `5 / 2` returns `2.5`. If an integer index is required (e.g., finding the midpoint of a list), use `//`.

```python
# BROKEN:
items = [10, 20, 30, 40, 50]
midpoint = len(items) / 2
# middle_item = items[midpoint] -> Raises TypeError: list indices must be integers or slices, not float

# CORRECT:
midpoint = len(items) // 2
middle_item = items[midpoint]  # Works perfectly!
```

---

## Best Practices

### Use Parentheses Explicitly for Clarity
Even when you know the exact operator precedence rules, write parentheses to make the grouping obvious to team members reviewing your code.

Good:
```python
total_price = (base_cost * (1 + tax_rate)) - discount_amount
```

Avoid:
```python
total_price = base_cost * 1 + tax_rate - discount_amount  # Ambiguous and confusing
```

---

## Performance Considerations

1. **Exponentiation Efficiency**: `x ** 2` is compiled into optimized bytecode opcode `BINARY_OP` (or `BINARY_POWER`), which is faster than calling `math.pow(x, 2)`. Moreover, `x ** 2` preserves exact integer types, whereas `math.pow()` converts arguments to 64-bit floats.
2. **Compiler Constant Folding**: In CPython's bytecode compiler, constant arithmetic expressions (such as `SECONDS_IN_DAY = 24 * 60 * 60`) are computed once at compile time into `86400`, incurring zero runtime CPU calculation cost.

---

## Security Considerations

1. **Zero Division Vulnerabilities**: Division by zero raises `ZeroDivisionError`. In web APIs and financial ledgers, untrusted divisor inputs (e.g., quantity, items per page) must be validated before division:
   ```python
   if items_per_page <= 0:
       raise ValueError("Items per page must be greater than zero.")
   ```
2. **Denial of Service via Massive Powers**: Evaluating `10 ** 10_000_000` causes Python to allocate hundreds of megabytes of memory and consume 100% CPU for several seconds. Validate exponent upper bounds when handling user-provided exponents.

---

## Real-World Usage

- **Pagination in REST APIs**: Calculating the total number of pages and query offsets using `(total_records + page_size - 1) // page_size`.
- **Game Physics & Graphics**: Calculating delta time increments, projectile trajectories, collision distances, and velocity vectors.
- **Financial Amortization Engines**: Calculating monthly loan installments and interest compounding schedules using power expressions.

---

## Comparison: Python Arithmetic Operators

| Operator | Syntax | Dunder Method | Precedence | Example | Result |
|---|---|---|---|---|---|
| **Addition** | `a + b` | `__add__` | Low (5) | `10 + 4` | `14` |
| **Subtraction** | `a - b` | `__sub__` | Low (5) | `10 - 4` | `6` |
| **Multiplication** | `a * b` | `__mul__` | Medium (4) | `10 * 4` | `40` |
| **True Division** | `a / b` | `__truediv__` | Medium (4) | `10 / 4` | `2.5` |
| **Floor Division** | `a // b` | `__floordiv__` | Medium (4) | `10 // 4` | `2` |
| **Modulo** | `a % b` | `__mod__` | Medium (4) | `10 % 4` | `2` |
| **Exponentiation** | `a ** b` | `__pow__` | High (2) | `2 ** 4` | `16` |

---

## Advanced Concepts: In-Place Augmented Arithmetic (`+=`, `-=`, `*=`)

When you write `a += b`, Python attempts to invoke the in-place dunder method `a.__iadd__(b)`.
- For **mutable objects** (like `list`), `__iadd__` modifies the object in place and returns the same object reference (`id()` remains identical).
- For **immutable objects** (like `int`, `str`), `__iadd__` does not exist; Python automatically falls back to `a = a + b`, creating a new object and re-binding the name.

```python
# Lists use in-place __iadd__
list1 = [1, 2]
original_id = id(list1)
list1 += [3]
print(f"List += in-place: {id(list1) == original_id}")  # True!

# Integers fall back to re-binding
n = 10
original_id = id(n)
n += 1
print(f"Int += in-place : {id(n) == original_id}")  # False!
```

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that asks the user for the radius $r$ of a circle. Calculate the circumference ($2\pi r$) and area ($\pi r^2$) using the `math` module and arithmetic operators. Print both results rounded to 3 decimal places.

### Exercise 2 — Intermediate
Write a function `calculate_pagination(total_items: int, per_page: int) -> dict` that computes: (1) `total_pages` using floor division arithmetic, (2) `is_last_page_full` (boolean), and (3) `items_on_last_page` using the modulo operator `%`. Return the results in a dictionary.

### Exercise 3 — Advanced
Create a `Polynomial2D` class that represents a quadratic equation $f(x) = ax^2 + bx + c$. Implement `__call__(x)` to evaluate the polynomial at value $x$, `__add__` to add two polynomials together, and a method `discriminant()` that calculates $b^2 - 4ac$.

---

## Mini Project: Scientific & Geometric Calculator CLI

### Requirements
Build a standalone terminal tool named `math_toolkit.py` that presents a menu allowing users to compute:
1. Hypotenuse and angles of a right-angled triangle.
2. Volume and surface area of a sphere ($V = \frac{4}{3}\pi r^3$, $A = 4\pi r^2$).
3. Compound interest with variable compounding periods.
4. Total duration decomposition from raw seconds.

### Implementation Blueprint
```python
import math

class MathToolkit:
    @staticmethod
    def right_triangle(a: float, b: float) -> dict:
        c = math.hypot(a, b)  # sqrt(a^2 + b^2)
        angle_a_deg = math.degrees(math.atan(a / b))
        angle_b_deg = 90.0 - angle_a_deg
        return {"hypotenuse": c, "angle_A_deg": angle_a_deg, "angle_B_deg": angle_b_deg}

    @staticmethod
    def sphere_geometry(radius: float) -> dict:
        volume = (4 / 3) * math.pi * (radius ** 3)
        surface_area = 4 * math.pi * (radius ** 2)
        return {"volume": volume, "surface_area": surface_area}

    @staticmethod
    def compound_interest(principal: float, rate_pct: float, years: int, compounds_per_year: int) -> float:
        r = rate_pct / 100.0
        n = compounds_per_year
        amount = principal * ((1 + (r / n)) ** (n * years))
        return amount

if __name__ == "__main__":
    print("=" * 55)
    print("            SCIENTIFIC GEOMETRY & MATH TOOLKIT")
    print("=" * 55)
    
    # 1. Triangle
    tri = MathToolkit.right_triangle(3.0, 4.0)
    print(f"Triangle (3, 4) -> Hypotenuse: {tri['hypotenuse']:.2f}, Angles: {tri['angle_A_deg']:.1f}°, {tri['angle_B_deg']:.1f}°")
    
    # 2. Sphere
    sph = MathToolkit.sphere_geometry(5.0)
    print(f"Sphere (r=5.0)  -> Volume: {sph['volume']:.2f} m³, Surface Area: {sph['surface_area']:.2f} m²")
    
    # 3. Compound Interest
    growth = MathToolkit.compound_interest(principal=10_000, rate_pct=6.5, years=10, compounds_per_year=12)
    print(f"Investment ($10k @ 6.5% for 10y compounded monthly) -> ${growth:,.2f}")
    print("=" * 55)
```

---

## Summary

In this lesson, you mastered arithmetic operators and math expressions in Python:
- Python supports seven core arithmetic operators: `+`, `-`, `*`, `/`, `//`, `%`, and `**`.
- True division (`/`) always returns a `float`. Floor division (`//`) truncates downward toward negative infinity.
- Modulo (`%`) satisfies $a = b \times (a // b) + (a \% b)$ and takes the sign of the divisor $b$.
- Exponentiation (`**`) associates from right to left (`2 ** 3 ** 2 == 512`).
- Use `divmod()` to compute quotient and remainder in a single operation.
- Custom classes implement arithmetic operators via dunder methods (`__add__`, `__sub__`, `__mul__`, `__rmul__`).

---

## Best Practices Checklist

- [ ] Use explicit parentheses `()` to eliminate operator precedence ambiguities.
- [ ] Use `//` when an integer index or discrete count is required.
- [ ] Remember that `^` is bitwise XOR; use `**` for exponentiation.
- [ ] Use `divmod(a, b)` when both quotient and remainder are needed.
- [ ] Validate that divisors are non-zero before executing division operations.

---

## What's Next?

Now that you have mastered arithmetic operators, continue to:
👉 **[Comparison & Logical Operators](comparison-logical-operators.md)** to master relational logic, chained comparisons, boolean operators, and short-circuit evaluation.
