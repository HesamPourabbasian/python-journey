# Assignment & Bitwise Operators in Python

## Introduction

In computer architecture, computation operates at two complementary levels of abstraction: the high-level semantic manipulation of application state (variables, objects, and expressions) and the low-level binary manipulation of discrete bits ($0$s and $1$s) within memory words. Python provides dedicated operator sets for both domains: **Assignment Operators** (including modern Assignment Expressions via the Walrus operator) and **Bitwise Operators**.

Assignment operators are the primary mechanism for binding identifiers to values and performing in-place arithmetic updates. With the introduction of **PEP 572** in Python 3.8, Python gained the **Walrus Operator (`:=`)**, allowing developers to assign variables *within* expressions, eliminating redundant function calls, simplifying complex loops, and streamlining comprehension filters.

Simultaneously, bitwise operators allow developers to manipulate individual binary bits directly. While modern software engineering often operates at high levels of abstraction, bitwise operations remain vital for low-level systems programming, networking packet serialization, file permission bitmasks, cryptographic hashing, game development, and high-performance data compression algorithms.

This lesson builds upon [Variables & Data Types](../variables-data-types/README.md) and [Arithmetic Operators](arithmetic-operators.md), giving you complete control over state updates and bit-level computations.

---

## Prerequisites

Before studying assignment and bitwise operators, ensure you have:

- Completed [Variables & Memory Binding](../variables-data-types/variables.md) and [Mutable vs Immutable](../variables-data-types/mutable-vs-immutable.md).
- A basic understanding of binary positional numbering systems (base-2: bits, bytes, place values).
- Familiarity with executing loops and conditional statements.

---

## Core Concept

### 1. Assignment Operators
- **Simple Assignment (`=`)**: Binds an identifier to an object in heap memory.
- **Augmented Assignment (`+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `**=`, `&=`, `|=`, `^=`, `<<=`, `>>=`)**: Combines an arithmetic or bitwise operation with an assignment. For mutable objects, it modifies the object in place (`__iadd__`); for immutable objects, it re-binds the variable.
- **Assignment Expression / Walrus Operator (`:=`)**: Assigns a value to a variable as part of a larger surrounding expression, returning the assigned value.

### 2. Bitwise Operators
Bitwise operators operate on integers by evaluating their underlying binary bit patterns position by position:

```
                            PYTHON BITWISE OPERATORS

   OPERATOR       SYMBOL    BIT LOGIC (For each bit position)
   +-------------+---------+----------------------------------------------------+
   • Bitwise AND |   &     | 1 only if BOTH bits are 1 (1 & 1 = 1, else 0)      |
   • Bitwise OR  |   |     | 1 if EITHER bit is 1 (0 | 0 = 0, else 1)           |
   • Bitwise XOR |   ^     | 1 if bits are DIFFERENT (1 ^ 0 = 1, 1 ^ 1 = 0)     |
   • Bitwise NOT |   ~     | Inverts all bits (~x = -(x + 1) in two's comp)     |
   • Left Shift  |   <<    | Shifts bits left by N (Multiplies by 2^N)          |
   • Right Shift |   >>    | Shifts bits right by N (Floor divides by 2^N)      |
   +-------------+---------+----------------------------------------------------+
```

---

## Syntax & Common Usage

```python
# 1. Augmented Assignment
counter = 10
counter += 5      # 15 (equivalent to counter = counter + 5)
counter *= 2      # 30

# 2. The Walrus Operator (:=)
# Assigns 'line' AND checks truthiness in a single statement
if (match_len := len("Python")) > 3:
    print(f"String length {match_len} exceeds threshold.")

# 3. Bitwise Operators
a = 0b1100  # 12 in decimal
b = 0b1010  # 10 in decimal

print(f"a & b  : {bin(a & b)} ({a & b})")   # 0b1000 (8)
print(f"a | b  : {bin(a | b)} ({a | b})")   # 0b1110 (14)
print(f"a ^ b  : {bin(a ^ b)} ({a ^ b})")   # 0b0110 (6)
print(f"~a     : {~a}")                     # -13
print(f"a << 2 : {bin(a << 2)} ({a << 2})") # 0b110000 (48 -> 12 * 4)
print(f"a >> 1 : {bin(a >> 1)} ({a >> 1})") # 0b0110 (6 -> 12 // 2)
```

---

## Detailed Explanation

### 1. The Walrus Operator (`:=`) Deep Dive (PEP 572)

Before Python 3.8, assigning a variable and testing it required two separate lines or caused redundant evaluations:

```python
# Without Walrus: Redundant computation or verbose assignment
value = compute_expensive_metric()
if value > 100:
    process(value)

# With Walrus Operator: Single, expressive line
if (value := compute_expensive_metric()) > 100:
    process(value)
```

**Key Walrus Syntax Rules:**
- The walrus operator has very low precedence; always wrap the assignment in parentheses `(...)` when used inside comparisons or conditions.
- Cannot be used for top-level direct assignments (e.g., `x := 10` alone on a line is a `SyntaxError`; use `x = 10`).

### 2. Bitwise NOT (`~`) and Two's Complement

Python represents negative integers using the **Two's Complement** binary system. For any integer $x$:

$$\sim x = -(x + 1)$$

```python
print(~0)   # -(0 + 1) = -1
print(~1)   # -(1 + 1) = -2
print(~42)  # -(42 + 1) = -43
print(~-10) # -(-10 + 1) = 9
```

Because Python integers have arbitrary precision (unlimited bits), there is no fixed sign-bit overflow; Python conceptually treats positive numbers as having an infinite string of leading binary $0$s, and negative numbers as having an infinite string of leading binary $1$s.

### 3. Bit Shifts for High-Performance Arithmetic

Left shifting (`<<`) and right shifting (`>>`) are hardware-level primitives that multiply or divide numbers by powers of $2$:
- `x << n` is mathematically identical to $x \times 2^n$
- `x >> n` is mathematically identical to $x // 2^n$

```python
# Multiply 15 by 8 (2^3)
print(15 << 3)  # 120

# Divide 128 by 16 (2^4)
print(128 >> 4) # 8
```

---

## Examples

### 1. Simple: Augmented Assignment on Collections vs Immutables
Proving the difference between in-place mutation and re-binding during augmented assignment.

```python
# Immutable integer: Re-binds memory reference
num = 50
print("Initial int ID :", id(num))
num += 10
print("Updated int ID :", id(num))  # Different memory address!

# Mutable list: Mutates object in-place via __iadd__
items = ["a", "b"]
print("\nInitial list ID:", id(items))
items += ["c"]
print("Updated list ID:", id(items))  # IDENTICAL memory address!
```

### 2. Beginner: Using the Walrus Operator in a `while` Stream Loop
Reading and processing stream chunks continuously until an empty chunk (EOF) is encountered.

```python
import io

# Simulating a data stream from a file or socket
data_stream = io.StringIO("Alpha\nBeta\nGamma\nDelta\n")

print("Processing Stream Lines with Walrus Operator:")
# Read line and terminate immediately when line is empty ("")
while (line := data_stream.readline().strip()):
    print(f" -> Processed Chunk: {line.upper()}")
```

### 3. Intermediate: Streamlining List Comprehensions with `:=`
Filtering and transforming data simultaneously in a single comprehension without re-running expensive functions.

```python
import math

raw_coordinates = [(3, 4), (1, 1), (5, 12), (0, 2), (8, 15)]

# Filter coordinates where hypotenuse > 5, capturing the calculated distance
# WITHOUT Walrus, math.hypot() would be evaluated TWICE per item!
filtered_distances = [
    {"coord": (x, y), "dist": round(dist, 2)}
    for x, y in raw_coordinates
    if (dist := math.hypot(x, y)) > 5.0
]

print("Coordinates with Distance > 5.0:")
for record in filtered_distances:
    print(" ->", record)
```

### 4. Real-World: POSIX File Permission Bitmask Engine
Implementing a Linux-style file permission manager using bitwise flags.

```python
# Standard POSIX permission bit flags
PERMISSION_EXEC  = 0b001  # 1 (Execute)
PERMISSION_WRITE = 0b010  # 2 (Write)
PERMISSION_READ  = 0b100  # 4 (Read)

class FilePermission:
    def __init__(self, mask: int = 0):
        self.mask = mask

    def grant(self, permission: int):
        """Add permission using Bitwise OR (|)."""
        self.mask |= permission

    def revoke(self, permission: int):
        """Remove permission using Bitwise AND with inverted mask (& ~)."""
        self.mask &= ~permission

    def has_permission(self, permission: int) -> bool:
        """Check permission using Bitwise AND (&)."""
        return (self.mask & permission) == permission

    def __str__(self) -> str:
        r = "r" if self.has_permission(PERMISSION_READ) else "-"
        w = "w" if self.has_permission(PERMISSION_WRITE) else "-"
        x = "x" if self.has_permission(PERMISSION_EXEC) else "-"
        return f"{r}{w}{x} (Octal: {oct(self.mask)}, Dec: {self.mask})"

user_perm = FilePermission()
print("Initial Permissions :", user_perm)

# Grant Read and Execute (4 | 1 = 5)
user_perm.grant(PERMISSION_READ | PERMISSION_EXEC)
print("After Granting R+X  :", user_perm)
print("Can Write?          :", user_perm.has_permission(PERMISSION_WRITE))  # False
print("Can Read?           :", user_perm.has_permission(PERMISSION_READ))   # True

# Revoke Execute
user_perm.revoke(PERMISSION_EXEC)
print("After Revoking Exec :", user_perm)
```

### 5. Advanced: Packing and Unpacking 32-bit RGB Color Integers
Packing separate Red, Green, Blue, and Alpha ($8$-bit each) color channels into a single $32$-bit integer using bitwise shifts and masks.

```python
def pack_rgba(r: int, g: int, b: int, a: int) -> int:
    """Pack four 8-bit color channels into a single 32-bit integer (RGBA)."""
    # Clamp values to 0..255
    r = (r & 0xFF) << 24
    g = (g & 0xFF) << 16
    b = (b & 0xFF) << 8
    a = (a & 0xFF)
    return r | g | b | a

def unpack_rgba(packed: int) -> tuple[int, int, int, int]:
    """Extract individual 8-bit color channels from a packed 32-bit integer."""
    r = (packed >> 24) & 0xFF
    g = (packed >> 16) & 0xFF
    b = (packed >> 8) & 0xFF
    a = packed & 0xFF
    return r, g, b, a

# Test Color: Coral Red with Alpha (R=255, G=127, B=80, A=200)
color_int = pack_rgba(255, 127, 80, 200)
print(f"Packed 32-bit Color: {color_int} (Hex: {hex(color_int).upper()})")

extracted_r, extracted_g, extracted_b, extracted_a = unpack_rgba(color_int)
print(f"Unpacked Channels  : R={extracted_r}, G={extracted_g}, B={extracted_b}, A={extracted_a}")
```

---

## Code Explanation

In Example 5 (Packing and Unpacking RGBA):
1. Each color channel requires 8 bits ($0 - 255$).
2. In `pack_rgba`, the Red channel is shifted left by 24 bits (`<< 24`), Green by 16 bits (`<< 16`), Blue by 8 bits (`<< 8`), and Alpha stays at the lowest 8 bits.
3. Combining them with Bitwise OR (`|`) merges all channels into a contiguous 32-bit binary integer.
4. In `unpack_rgba`, right shifting (`>>`) moves the desired channel down to the lowest 8 bits, and Bitwise AND with `0xFF` (`& 0b11111111`) masks out all higher bits, isolating the exact 8-bit byte.
5. This technique is identical to how graphics engines (OpenGL, Vulkan), network protocol buffers, and audio decoders pack telemetry over high-speed binary streams.

---

## Common Mistakes

### Mistake 1: Misunderstanding the Walrus Operator Precedence
Because `:=` has extremely low precedence, omitting parentheses in comparisons binds the boolean result rather than the computation.

```python
# BROKEN:
# Evaluates len("data") > 2 (True) and assigns TRUE to 'n'!
if n := len("data") > 2:
    print(f"Length is {n}")  # Prints "Length is True" ❌

# CORRECT:
if (n := len("data")) > 2:
    print(f"Length is {n}")  # Prints "Length is 4" ✅
```

### Mistake 2: Overusing the Walrus Operator to Create "Clever" Unreadable Code
Using the walrus operator to pack multiple mutations, assignments, and calculations into a single incomprehensible line violates the Zen of Python ("Readability counts").

---

## Best Practices

### Use `enum.IntFlag` for Modern Bitwise Flags
While raw bit shifts work, Python's standard library provides `enum.IntFlag` for type-safe, human-readable bitmask management.

Good:
```python
from enum import IntFlag, auto

class SecurityFeature(IntFlag):
    MFA_ENABLED = auto()      # 1
    IP_RESTRICTED = auto()    # 2
    ENCRYPTED_STORAGE = auto()# 4

user_policy = SecurityFeature.MFA_ENABLED | SecurityFeature.ENCRYPTED_STORAGE
```

Avoid:
```python
# Magic raw integer bit values without documentation
user_policy = 1 | 4
```

---

## Performance Considerations

1. **Eliminating Redundant Calculations**: The walrus operator prevents evaluating expensive regex parsing, database lookups, or mathematical transformations twice in comprehension filters and conditions.
2. **Bitwise Arithmetic Speed**: Bit shifting (`<< 1`, `>> 1`) executes faster at the CPU instruction level than standard division (`/`) or multiplication (`*`), though modern Python bytecode optimizers handle simple constant multiplications efficiently.

---

## Security Considerations

1. **Bitmask Privilege Escalation**: When managing permission bitmasks, always validate that user-provided integer masks do not contain unverified high bits that map to administrative privileges.
2. **Cryptographic Bitwise Operations**: When implementing cryptographic primitives (such as SHA-256 or AES blocks), ensure that bitwise rotations and XOR operations simulate fixed word sizes (e.g., `& 0xFFFFFFFF` for 32-bit words) to prevent Python's arbitrary-precision integers from growing unbounded.

---

## Real-World Usage

- **Network Packet Parsing (TCP/IP / DNS)**: Network protocols pack flags (SYN, ACK, FIN, RST) and header lengths into single 8-bit and 16-bit bitfields parsed using bitwise shifts and masks.
- **Embedded Systems & MicroPython**: Microcontroller GPIO pins, I2C register configurations, and sensor telemetry registers are toggled using bitwise `&`, `|`, and `^`.
- **Database Index Optimization**: High-scale databases use Bloom Filters (probabilistic data structures built on bitwise arrays) to rapidly check whether a record exists on disk.

---

## Comparison: Bitwise Operators Summary

| Operator | Symbol | Purpose | Example | Binary Computation | Decimal |
|---|---|---|---|---|---|
| **AND** | `&` | Set bit only if both are 1 | `12 & 10` | `1100 & 1010` $\rightarrow$ `1000` | `8` |
| **OR** | `\|` | Set bit if either is 1 | `12 \| 10` | `1100 \| 1010` $\rightarrow$ `1110` | `14` |
| **XOR** | `^` | Set bit if bits differ | `12 ^ 10` | `1100 ^ 1010` $\rightarrow$ `0110` | `6` |
| **NOT** | `~` | Inverts all bits ($-\text{x} - 1$) | `~12` | `~1100` $\rightarrow$ `-(12 + 1)` | `-13` |
| **Left Shift** | `<<` | Shift left (Multiply by $2^N$) | `5 << 2` | `0101 << 2` $\rightarrow$ `010100` | `20` |
| **Right Shift**| `>>` | Shift right (Floor divide by $2^N$) | `20 >> 2`| `010100 >> 2` $\rightarrow$ `0101` | `5` |

---

## Advanced Concepts: The `enum.IntFlag` Module

`IntFlag` from the `enum` module allows bitwise operators (`|`, `&`, `^`, `~`) to produce instances of the enumeration:

```python
from enum import IntFlag

class NetworkCapability(IntFlag):
    NONE = 0
    IPV4 = 1 << 0  # 1
    IPV6 = 1 << 1  # 2
    SSL  = 1 << 2  # 4
    QUIC = 1 << 3  # 8

config = NetworkCapability.IPV4 | NetworkCapability.SSL | NetworkCapability.QUIC

print("Active Capabilities :", config)
print("Is SSL Enabled?     :", bool(config & NetworkCapability.SSL))
print("Is IPV6 Enabled?    :", bool(config & NetworkCapability.IPV6))
```

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that takes an integer and uses bitwise AND (`& 1`) to determine whether the number is **even or odd** without using the modulo operator `%`. Explain why this works in binary.

### Exercise 2 — Intermediate
Write a function `extract_regex_matches(pattern: str, text_lines: list[str]) -> list[dict]` that iterates through `text_lines`, searches for `pattern` using `re.search()`, and uses the walrus operator `:=` in a list comprehension to capture and return a list of dictionaries containing `{"line": line, "match": match.group(0)}` only for lines where a match was found.

### Exercise 3 — Advanced
Build a 16-bit status register class named `DeviceStatusRegister`. The register tracks 4 distinct hardware flags: `POWER_ON` (bit 0), `SENSOR_ACTIVE` (bit 1), `ERROR_FLAG` (bit 2), and `CALIBRATED` (bit 3), and stores a 4-bit integer battery level ($0 - 15$) in bits 4–7. Implement methods to set/get the battery level and toggle flags using bitwise operations.

---

## Mini Project: Binary Telemetry Frame Serializer & Parser

### Requirements
Build a lightweight binary packet encoding engine named `telemetry_frame.py` that packs satellite sensor metrics into a single 32-bit integer:
- `device_id`: 8 bits ($0 - 255$)
- `temperature_celsius`: 8 bits (offset by +50, supporting $-50^\circ\text{C}$ to $205^\circ\text{C}$)
- `battery_pct`: 7 bits ($0 - 100$)
- `error_code`: 4 bits ($0 - 15$)
- `solar_charging`: 1 bit ($0$ or $1$)
- `is_active`: 1 bit ($0$ or $1$)

Provide both `serialize_frame()` and `deserialize_frame()` functions.

### Implementation Blueprint
```python
class TelemetryEncoder:
    @staticmethod
    def pack(device_id: int, temp_c: int, battery_pct: int, error_code: int, solar: bool, active: bool) -> int:
        # Validate and clamp inputs
        dev = (device_id & 0xFF) << 24
        temp = ((temp_c + 50) & 0xFF) << 16
        bat = (battery_pct & 0x7F) << 9
        err = (error_code & 0x0F) << 5
        sol = (1 if solar else 0) << 4
        act = (1 if active else 0) << 3
        
        return dev | temp | bat | err | sol | act

    @staticmethod
    def unpack(frame: int) -> dict:
        device_id = (frame >> 24) & 0xFF
        temp_c = ((frame >> 16) & 0xFF) - 50
        battery_pct = (frame >> 9) & 0x7F
        error_code = (frame >> 5) & 0x0F
        solar = bool((frame >> 4) & 0x01)
        active = bool((frame >> 3) & 0x01)
        
        return {
            "device_id": device_id,
            "temp_celsius": temp_c,
            "battery_pct": battery_pct,
            "error_code": error_code,
            "solar_charging": solar,
            "is_active": active
        }

if __name__ == "__main__":
    # Simulate Satellite Sensor
    packed_frame = TelemetryEncoder.pack(
        device_id=42,
        temp_c=24,
        battery_pct=88,
        error_code=0,
        solar=True,
        active=True
    )
    
    print("=" * 55)
    print("        SATELLITE TELEMETRY PACKET ENCODER")
    print("=" * 55)
    print(f"Serialized 32-bit Integer : {packed_frame}")
    print(f"Binary Representation    : {bin(packed_frame)}")
    print(f"Hex Representation       : {hex(packed_frame).upper()}")
    print("-" * 55)
    
    decoded = TelemetryEncoder.unpack(packed_frame)
    print("Decoded Telemetry Frame:")
    for k, v in decoded.items():
        print(f" -> {k:<18}: {v}")
    print("=" * 55)
```

---

## Summary

In this lesson, you mastered assignment expressions and bitwise manipulation in Python:
- Augmented assignment (`+=`, `-=`, etc.) modifies mutable objects in place via `__iadd__` and re-binds immutable objects.
- The Walrus Operator (`:=`) assigns variables inside surrounding expressions, eliminating redundant computations and simplifying stream processing.
- Bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`) manipulate binary bit patterns directly.
- Left shift `<<` multiplies by powers of 2; Right shift `>>` floor divides by powers of 2.
- Bitmasks manage compact boolean flags, permissions, and network packet headers efficiently.
- Use `enum.IntFlag` for modern, self-documenting bitmask configurations.

---

## Best Practices Checklist

- [ ] Wrap walrus assignments in parentheses `(...)` when used inside comparisons or conditions.
- [ ] Use the walrus operator only when it improves clarity and avoids redundant computation.
- [ ] Use `enum.IntFlag` for defining and manipulating permission masks.
- [ ] Use `& 1` for high-speed parity (even/odd) testing in performance-critical loops.
- [ ] Mask bitwise results with `& 0xFFFFFFFF` when emulating fixed-width 32-bit hardware arithmetic.

---

## What's Next?

Now that you understand assignment and bitwise operators, continue to the final article in this module:
👉 **[Identity & Membership Operators](identity-membership-operators.md)** to master object identity checks (`is`) and container search complexity (`in`).
