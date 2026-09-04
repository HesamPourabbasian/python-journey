# Integers & Floating-Point Numbers in Python

## Introduction

Numerical computation lies at the core of all digital computing. Whether you are developing financial billing engines, rendering computer graphics, processing scientific telemetry, or training machine learning models, your applications fundamentally rely on numbers. Python provides an exceptionally elegant, powerful, and mathematically sound numerical system out of the box.

One of Python's most remarkable features is its implementation of **arbitrary-precision integers**. In most traditional programming languages (such as C, C++, Java, or Go), integers are constrained to fixed hardware word sizes—typically 32-bit (spanning $-2^{31}$ to $2^{31}-1$) or 64-bit (spanning $-2^{63}$ to $2^{63}-1$). Exceeding these boundaries causes catastrophic integer overflow errors. In Python, integers have no theoretical upper or lower limits beyond the physical memory available on your machine. You can effortlessly compute $2^{1000}$ or $1000!$ with exact mathematical precision.

Conversely, floating-point numbers in Python adhere to the international **IEEE 754 standard for 64-bit double-precision floating-point arithmetic**. While floats are hardware-accelerated and exceptionally fast, their binary representation introduces subtle precision quirks that every professional software engineer must understand. For domains where rounding errors cannot be tolerated (such as banking, currency transactions, and taxation), Python provides dedicated standard library modules: `decimal` and `fractions`.

This lesson builds directly upon [Dynamic Typing vs Static Typing](dynamic-typing.md) and equips you with the numerical fluency required to execute accurate, performant, and secure mathematical computations in Python.

---

## Prerequisites

Before studying numbers in depth, ensure you have:

- Completed [Variables & Memory Binding](variables.md) and [Dynamic Typing](dynamic-typing.md).
- A basic understanding of arithmetic operations (addition, subtraction, multiplication, division, exponentiation).
- Access to the Python REPL to test floating-point precision directly.

---

## Core Concept

Python categorizes numbers into four distinct built-in and standard-library types:

1. **`int` (Integer)**: Whole numbers of arbitrary precision (e.g., `-42`, `0`, `10_000_000`).
2. **`float` (Floating-Point)**: 64-bit IEEE 754 double-precision numbers with a decimal point (e.g., `3.14159`, `-0.001`, `1.5e-4`).
3. **`decimal.Decimal` (Fixed/Floating Decimal)**: Exact base-10 decimal arithmetic for financial systems where binary rounding errors are unacceptable.
4. **`fractions.Fraction` (Rational Numbers)**: Exact rational numbers represented as integer numerator/denominator pairs (e.g., $1/3$, $22/7$).
5. **`complex` (Complex Numbers)**: Numbers with real and imaginary components (e.g., `3 + 4j`).

```
                              PYTHON NUMERICAL HIERARCHY
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
             Exact Types                                   Inexact Types
         (No precision loss)                         (Binary approximation)
      ┌───────────┴───────────┐                                   │
      ▼                       ▼                                   ▼
   int (Arbitrary)     Decimal / Fraction                 float (IEEE 754 64-bit)
 (e.g., 2**1000)       (e.g., Decimal("0.1"))             (e.g., 0.1 + 0.2 != 0.3)
```

---

## Syntax & Literal Representations

### 1. Integer Literals and Radix Bases
Python supports writing integer literals in decimal, binary, octal, and hexadecimal bases, as well as using visual underscores `_` for digit grouping (PEP 515):

```python
# Decimal integer with visual grouping underscores
national_debt = 34_500_000_000_000

# Binary literal (prefix: 0b or 0B)
binary_val = 0b101010  # Evaluates to 42

# Octal literal (prefix: 0o or 0O)
octal_val = 0o52       # Evaluates to 42

# Hexadecimal literal (prefix: 0x or 0X)
hex_val = 0x2A         # Evaluates to 42
```

### 2. Floating-Point Literals
```python
standard_float = 3.141592653589793
scientific_notation = 6.022e23   # 6.022 * 10^23 (Avogadro's number)
micro_fraction = 1.25e-6         # 0.00000125
```

---

## Detailed Explanation

### 1. Arbitrary-Precision Integers (`PyLongObject`)

Under the hood in CPython, integers are represented by the C structure `PyLongObject`. Instead of storing numbers in a raw 64-bit CPU register, CPython decomposes large numbers into an internal dynamic array of "digits" (each digit using 30 bits on 64-bit platforms). When an arithmetic operation exceeds 30 bits, Python automatically allocates additional digits in heap memory.

```python
# Calculating 100 factorial effortlessly:
import math
factorial_100 = math.factorial(100)
print(f"100! has {len(str(factorial_100))} digits:\n{factorial_100}")
```

### 2. The IEEE 754 Binary Floating-Point Dilemma

Why does `0.1 + 0.2` equal `0.30000000000000004` in Python (and in C, Java, and JavaScript)?

In base-10 mathematics, fractions like $1/3$ cannot be represented with a finite number of decimal digits ($0.33333\dots$). Similarly, in base-2 (binary) computer hardware, numbers like $1/10$ ($0.1$) and $2/10$ ($0.2$) cannot be represented as finite binary fractions:

$$0.1_{10} = 0.00011001100110011\dots_2$$

Because computers have a finite 64-bit buffer (53 bits of mantissa precision), the binary fraction is truncated at the 53rd bit. When you add the binary approximations of $0.1$ and $0.2$, the tiny truncation errors sum together:

```python
>>> 0.1 + 0.2
0.30000000000000004
>>> 0.1 + 0.2 == 0.3
False
```

### 3. Safe Float Comparisons with `math.isclose()`

Because of binary floating-point representation limits, **never use `==` to compare two floating-point numbers**. Instead, use the standard library function `math.isclose()` to check whether two numbers are equal within a specified tolerance:

```python
import math

a = 0.1 + 0.2
b = 0.3

print("Direct equality (==)    :", a == b)                 # False ❌
print("math.isclose() equality :", math.isclose(a, b))     # True  ✅
```

### 4. Exact Financial Arithmetic with `decimal.Decimal`

For financial software, tax computation, and banking systems, Python provides the `decimal` module. `Decimal` numbers store numbers in exact base-10 decimal format with user-configurable precision (default 28 decimal places).

```python
from decimal import Decimal, getcontext

# Set precision to 40 decimal places if needed
getcontext().prec = 40

# ALWAYS initialize Decimal using string literals, NEVER raw floats!
price = Decimal("19.99")
tax_rate = Decimal("0.0825")
total = price * (Decimal("1") + tax_rate)

print(f"Exact Total Invoice: {total}")
```

---

## Examples

### 1. Simple: Numeric Formatting and String Interpolation
Formatting numeric outputs with decimal precision and thousands separators.

```python
gross_revenue = 1489250.7865

# Format with thousands comma separator and 2 decimal places
print(f"Formatted Revenue: ${gross_revenue:,.2f}")
# Format in scientific exponential notation
print(f"Scientific Notation: {gross_revenue:.4e}")
# Format as a percentage
tax_rate = 0.075
print(f"Tax Rate: {tax_rate:.1%}")
```

### 2. Beginner: Built-in Mathematical Functions
Exploring Python's built-in numeric utilities: `abs()`, `round()`, `min()`, `max()`, `pow()`, and `divmod()`.

```python
# divmod returns (quotient, remainder) in a single operation
quotient, remainder = divmod(17, 5)
print(f"17 // 5 = {quotient}, 17 % 5 = {remainder}")

# round() uses 'banker's rounding' (round half to even)
print("round(2.5) ->", round(2.5))  # 2 (rounds to nearest even)
print("round(3.5) ->", round(3.5))  # 4 (rounds to nearest even)
```

### 3. Intermediate: Exact Rational Fractions
Using `fractions.Fraction` to perform exact fraction arithmetic without precision degradation.

```python
from fractions import Fraction

f1 = Fraction(1, 3)
f2 = Fraction(1, 6)

result = f1 + f2  # 1/3 + 1/6 = 3/6 = 1/2
print(f"{f1} + {f2} = {result} (Exact float: {float(result)})")

# Automatic simplification
f3 = Fraction(18, 24)
print(f"Fraction(18, 24) simplifies to: {f3}")
```

### 4. Real-World: Financial Compound Interest Calculation
Comparing standard `float` vs `Decimal` in a compound interest simulation over 30 years.

```python
from decimal import Decimal

def compute_investment_growth(principal_str: str, annual_rate_str: str, years: int):
    # Using Decimal for zero precision loss
    principal_dec = Decimal(principal_str)
    rate_dec = Decimal(annual_rate_str)
    
    # Using Float for high-speed approximation
    principal_flt = float(principal_str)
    rate_flt = float(annual_rate_str)
    
    growth_dec = principal_dec * ((Decimal("1") + rate_dec) ** years)
    growth_flt = principal_flt * ((1.0 + rate_flt) ** years)
    
    print(f"Initial Principal : ${principal_str}")
    print(f"Annual Return     : {float(annual_rate_str):.1%}")
    print(f"Years of Growth   : {years}")
    print("-" * 50)
    print(f"Exact Decimal Total : ${growth_dec:,.2f}")
    print(f"Float Approx Total  : ${growth_flt:,.2f}")
    print(f"Precision Discrepancy: ${abs(growth_dec - Decimal(str(growth_flt))):,.6f}")

compute_investment_growth("100000.00", "0.0725", 30)
```

### 5. Advanced: Complex Numbers and Phasor Geometry
Working with Python's built-in `complex` numbers in electrical engineering and signal processing.

```python
import cmath

# Complex number: real + imag*j
impedance_1 = 4.0 + 3.0j
impedance_2 = 2.0 - 5.0j

# Total series impedance
total_z = impedance_1 + impedance_2
print(f"Total Series Impedance : {total_z}")
print(f"Real Resistance        : {total_z.real} Ohms")
print(f"Imaginary Reactance    : {total_z.imag} Ohms")

# Magnitude and Phase Angle
magnitude, phase_radians = cmath.polar(total_z)
print(f"Magnitude (Absolute)   : {magnitude:.4f}")
print(f"Phase Angle (Degrees)  : {math.degrees(phase_radians):.2f}°")
```

---

## Code Explanation

In Example 4 (Financial Compound Interest):
1. `Decimal("100000.00")` constructs a precise base-10 numerical object from a string literal.
2. The compound interest formula $A = P(1 + r)^t$ is evaluated across 30 iterations.
3. The `float` calculation accumulates minor binary truncation errors at every power step.
4. The `Decimal` calculation executes exact base-10 multiplication without rounding drift, ensuring that every cent is accounted for according to banking GAAP accounting regulations.

---

## Common Mistakes

### Mistake 1: Initializing `Decimal` from a `float`
Passing a raw float to `Decimal()` inherits the float's binary representation error immediately upon creation.

```python
# BROKEN:
d = Decimal(0.1)  # Evaluates to Decimal('0.1000000000000000055511151231257827021181583404541015625') ❌

# CORRECT:
d = Decimal("0.1")  # Evaluates to exact Decimal('0.1') ✅
```

**How to avoid:** Always pass strings or integers into the `Decimal` constructor.

### Mistake 2: Confusing True Division (`/`) and Floor Division (`//`)
In Python 3, `/` always produces a `float`, even when dividing evenly. `//` performs floor division (rounding down toward negative infinity).

```python
print(10 / 2)    # 5.0 (float)
print(10 // 2)   # 5 (int)
print(-7 // 2)   # -4 (Floors down toward negative infinity, NOT -3!)
```

---

## Best Practices

### Use `math.isclose()` for Floating-Point Equality Checks
Never compare floating-point variables using `==` or `!=`.

Good:
```python
import math

def is_balance_zero(balance: float) -> bool:
    return math.isclose(balance, 0.0, abs_tol=1e-9)
```

Avoid:
```python
def is_balance_zero(balance: float) -> bool:
    return balance == 0.0  # Dangerous: 0.00000000000000001 evaluates to False!
```

---

## Performance Considerations

1. **Hardware Speed**: Python's `int` (for small numbers) and `float` are fast and mapped directly to underlying CPU registers.
2. **`Decimal` Overhead**: The `decimal.Decimal` module is written in C (`_decimal`), but base-10 software arithmetic is approximately 10x to 30x slower than hardware-accelerated IEEE 754 `float` operations. Use `float` for graphics, machine learning, physics engines, and gaming; use `Decimal` for financial ledgers and billing.
3. **Integer Memory Scaling**: As integers grow larger, memory scales dynamically:
   - Small integer (0–256): 28 bytes
   - $2^{1000}$ (302 digits): 160 bytes
   - $2^{100000}$ (30,103 digits): 13.3 KB

---

## Security Considerations

1. **Denial of Service via Massive Integers (CVE-2020-10735 / PEP 686)**: Parsing a string with millions of digits into an integer (`int("9" * 1_000_000)`) has quadratic $O(n^2)$ time complexity and can hang a server. Python 3.11+ enforces a default limit of 4,300 digits on integer string conversions (`sys.set_int_max_str_digits`).
2. **Integer Overflow in C-Extensions**: When passing Python integers to C libraries via `ctypes` or Cython, values exceeding C's `int32_t` or `int64_t` boundaries will raise an `OverflowError` or suffer undefined C truncation if unchecked.

---

## Real-World Usage

- **E-Commerce & Stripe/PayPal Integrations**: Payment gateways process currency amounts either in integer cents (e.g., `$19.99` $\rightarrow$ `1999`) or as exact `Decimal` strings to eliminate rounding disputes.
- **Scientific Computing (NumPy/SciPy)**: Data scientists leverage 64-bit floats for fast matrix factorizations, statistical distributions, and linear algebra.
- **Cryptography (RSA/ECC)**: Cryptographic algorithms generate 2048-bit and 4096-bit prime numbers, relying directly on Python's arbitrary-precision integer arithmetic.

---

## Comparison: Python Numeric Types

| Type | Precision Model | Performance | Mutable? | Best Use Case |
|---|---|---|---|---|
| **`int`** | Arbitrary Precision (Unlimited) | Very Fast | No | Counters, indices, exact discrete math |
| **`float`** | IEEE 754 64-bit (53-bit mantissa) | Blazing Fast (Hardware) | No | Scientific simulations, ML, games |
| **`Decimal`** | Exact Base-10 (Configurable) | Slower (Software math) | No | Financial transactions, tax, invoices |
| **`Fraction`** | Exact Rational ($P/Q$) | Moderate | No | Symbolic algebra, music theory, ratios |
| **`complex`** | 2x IEEE 754 64-bit floats | Fast (Hardware) | No | Electrical engineering, Fourier transforms |

---

## Advanced Concepts: Under the Hood of `PyLongObject`

CPython represents integers in `Include/cpython/longintrepr.h` as:

```c
struct _longobject {
    PyObject_VAR_HEAD
    digit ob_digit[1];  // Array of 30-bit or 15-bit integer chunks
};
```

The sign of the integer is stored within the variable-size header field `ob_size`. Addition and multiplication between massive integers are implemented using Karatsuba multiplication ($O(n^{1.58})$) for numbers exceeding standard word sizes, ensuring that Python scales gracefully for astronomical calculations.

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that prompts the user for a temperature in Fahrenheit, converts it to Celsius using the formula $C = (F - 32) \times 5/9$, and prints the result rounded to two decimal places.

### Exercise 2 — Intermediate
Write a function `calculate_mortgage_payment(principal: str, annual_interest_rate: str, years: int) -> str` using the `decimal` module. Calculate the exact monthly mortgage payment using the standard amortization formula:

$$M = P \frac{r(1+r)^n}{(1+r)^n - 1}$$

Return the formatted monthly payment as a string with two decimal places.

### Exercise 3 — Advanced
Write a benchmark script using `time.perf_counter_ns()` that computes the sum of $1,000,000$ numbers using: (1) Python `float`, and (2) `decimal.Decimal`. Output the total time elapsed for both and compute the relative performance ratio.

---

## Mini Project: Currency Conversion & Invoice Ledger Engine

### Requirements
Create a standalone module named `invoice_ledger.py` that processes customer invoice line items, applies sales tax and discounts using `decimal.Decimal`, converts currencies using a fixed exchange rate table, and prints a formatted receipt.

### Implementation Blueprint
```python
from decimal import Decimal, ROUND_HALF_UP

class InvoiceLedger:
    def __init__(self, currency: str = "USD", tax_rate_str: str = "0.0825"):
        self.currency = currency
        self.tax_rate = Decimal(tax_rate_str)
        self.items = []

    def add_item(self, description: str, unit_price_str: str, quantity: int):
        unit_price = Decimal(unit_price_str)
        subtotal = unit_price * quantity
        self.items.append({
            "desc": description,
            "unit_price": unit_price,
            "qty": quantity,
            "subtotal": subtotal
        })

    def generate_invoice(self) -> dict:
        net_subtotal = sum(item["subtotal"] for item in self.items)
        tax_amount = (net_subtotal * self.tax_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_due = net_subtotal + tax_amount
        
        return {
            "items": self.items,
            "net_subtotal": net_subtotal,
            "tax_amount": tax_amount,
            "total_due": total_due
        }

    def print_receipt(self):
        invoice = self.generate_invoice()
        print("=" * 50)
        print(f"                INVOICE RECEIPT ({self.currency})")
        print("=" * 50)
        for item in invoice["items"]:
            print(f"{item['desc']:<25} {item['qty']}x @ ${item['unit_price']:>6.2f} = ${item['subtotal']:>7.2f}")
        print("-" * 50)
        print(f"{'Subtotal:':<35} ${invoice['net_subtotal']:>10.2f}")
        print(f"{f'Tax ({self.tax_rate:.2%}):':<35} ${invoice['tax_amount']:>10.2f}")
        print(f"{'TOTAL DUE:':<35} ${invoice['total_due']:>10.2f}")
        print("=" * 50)

if __name__ == "__main__":
    ledger = InvoiceLedger(currency="USD", tax_rate_str="0.08875")
    ledger.add_item("Mechanical Keyboard", "149.99", 1)
    ledger.add_item("USB-C Thunderbolt Cable", "24.50", 2)
    ledger.add_item("4K Monitor Stand", "79.00", 1)
    ledger.print_receipt()
```

---

## Summary

In this lesson, you mastered Python's numerical architecture:
- Python integers (`int`) possess arbitrary precision, scaling dynamically in heap memory without overflow limits.
- Floating-point numbers (`float`) use 64-bit IEEE 754 binary representation, which introduces minor binary representation artifacts (e.g., $0.1 + 0.2 \ne 0.3$).
- Never compare floats using `==`; always use `math.isclose()`.
- Use the `decimal.Decimal` module for financial, banking, and tax computations where exact base-10 arithmetic is legally mandatory.
- Use `fractions.Fraction` for exact rational arithmetic and `complex` for imaginary mathematical domains.

---

## Best Practices Checklist

- [ ] Use visual underscores (`1_000_000`) to improve numeric readability.
- [ ] Compare floating-point values using `math.isclose()` rather than `==`.
- [ ] Initialize `Decimal` instances strictly from string literals (e.g., `Decimal("19.99")`), never floats.
- [ ] Use `/` for floating-point division and `//` for integer floor division.
- [ ] Use `Decimal.quantize()` with `ROUND_HALF_UP` for standardized financial currency rounding.

---

## What's Next?

Now that you have mastered numerical data types, continue to:
👉 **[Strings Fundamentals](strings.md)** to explore Unicode text representations, string immutability, escape sequences, and byte arrays.
