# String Slicing & Indexing in Python

## Introduction

In computer science, sequences are ordered collections of items indexed by position. Because strings in Python are ordered, immutable sequences of Unicode characters, extracting specific characters, sub-sequences, prefixes, suffixes, and patterns is a fundamental operation.

Python provides an exceptionally clean, expressive indexing and slicing syntax that sets it apart from other languages. Rather than relying on verbose substring methods like `substring(startIndex, endIndex)` or manual loop copying, Python uses **Extended Slice Notation (`[start:stop:step]`)** natively integrated into the indexing operator `[]`.

Mastering string slicing and indexing requires understanding zero-based positive indexing, backward negative indexing (from the end of the sequence), half-open intervals $[start, stop)$, step strides, string reversal techniques, the built-in `slice()` constructor, and how Python gracefully handles out-of-bounds slice boundaries without raising runtime errors.

This lesson concludes **Module 4: Strings in Depth**, establishing the structural sequence extraction patterns that apply not only to strings, but to all Python sequences (including lists, tuples, and bytearrays).

---

## Prerequisites

Before studying slicing and indexing, ensure you have:

- Completed [Strings Fundamentals](../variables-data-types/strings.md) and [String Methods](string-methods.md).
- A solid grasp of sequence ordering and character offsets.
- Familiarity with zero-based counting.

---

## Core Concept

Python sequences support two fundamental lookup mechanisms:

### 1. Direct Indexing (`s[index]`)
- Accesses a single character at a specific position.
- **Positive Indexing**: Starts from `0` at the beginning of the string and increases to `len(s) - 1`.
- **Negative Indexing**: Starts from `-1` at the very last character and decreases to `-len(s)` at the first character.
- **Strict Bounds**: Attempting to index a position outside `[-len(s), len(s) - 1]` raises an `IndexError`.

```
 Positive Indices:    0    1    2    3    4    5
 Character:           P    y    t    h    o    n
 Negative Indices:   -6   -5   -4   -3   -2   -1
```

### 2. Slice Notation (`s[start:stop:step]`)
- Extracts a substring defined by a **Half-Open Interval**: includes `start`, excludes `stop` ($[start, stop)$).
- **`start`**: The starting index (defaults to `0` if omitted, or `-1` if step is negative).
- **`stop`**: The ending index, **exclusive** (defaults to `len(s)` if omitted, or before the beginning if step is negative).
- **`step`**: The stride / interval between characters (defaults to `1`).
- **Boundary Safety**: Slicing **never raises `IndexError`**. Out-of-bounds indices are automatically clipped to the string's actual boundaries.

---

## Syntax & Common Slicing Idioms

```python
text = "Python-3.12-Pro"

# 1. Single Character Indexing
first_char = text[0]        # 'P'
last_char = text[-1]        # 'o'

# 2. Basic Slicing [start:stop]
prefix = text[0:6]          # 'Python' (indices 0, 1, 2, 3, 4, 5)
omitted_start = text[:6]    # 'Python' (equivalent to 0:6)
omitted_stop = text[7:]     # '3.12-Pro' (from index 7 to the end)

# 3. Negative Index Slicing
file_extension = text[-3:]  # 'Pro' (last 3 characters)
without_last_char = text[:-1] # 'Python-3.12-Pr'

# 4. Striding with Step [start:stop:step]
every_second_char = text[::2] # 'Pto-.-r'

# 5. Idiomatic String Reversal (Negative Step)
reversed_text = text[::-1]  # 'orP-21.3-nohtyP'

# 6. Named Slice Objects
HEADER_SLICE = slice(0, 6)
print(text[HEADER_SLICE])   # 'Python'
```

---

## Detailed Explanation

### 1. Why Half-Open Intervals $[start, stop)$?

Python's half-open interval design choice (championed by computer scientist Edsger W. Dijkstra) provides three critical mathematical advantages:
1. **Length is Always $stop - start$**: The length of the slice `s[2:7]` is exactly $7 - 2 = 5$ characters.
2. **Consecutive Slices Split Cleanly**: Slicing at index $k$ splits a string into two adjacent parts `s[:k]` and `s[k:]` with zero overlapping and zero gaps (`s[:k] + s[k:] == s`).
3. **Empty Slices When $start == stop$**: `s[3:3]` cleanly evaluates to the empty string `""`.

### 2. Negative Strides (Stepping Backwards)

When `step` is negative, Python traverses the string in reverse (from right to left):
- Default `start` becomes `-1` (end of string).
- Default `stop` becomes the index before the beginning of the string.
- `start` must be greater than `stop` when moving backwards, otherwise an empty string is returned.

```python
alphabet = "ABCDEFG"

print(alphabet[5:1:-1])  # 'FEDC' (indices 5, 4, 3, 2)
print(alphabet[1:5:-1])  # '' (Empty string because start < stop with negative step!)
print(alphabet[::-1])    # 'GFEDCBA' (Complete reversal)
```

### 3. Graceful Boundary Clamping

Unlike single indexing (which raises `IndexError` if the index does not exist), slice indices that exceed the boundaries of the string are automatically clipped without errors:

```python
word = "Code"

# Single indexing out of bounds:
# char = word[100] -> Raises IndexError: string index out of range

# Slicing out of bounds:
safe_slice = word[1:100]
print(f"Safe slice: {safe_slice!r}")  # 'ode' (Clamped to len(word))

empty_slice = word[50:100]
print(f"Empty slice: {empty_slice!r}") # '' (Clamped to empty string)
```

### 4. Named Slice Objects with `slice()`

Instead of hardcoding slice indices like `record[15:25]`, Python provides the built-in `slice(start, stop, step)` constructor. Named slice objects make code self-documenting and reusable across datasets.

```python
# Create named slice objects for a fixed-width employee record
RECORD_ID = slice(0, 5)
FIRST_NAME = slice(5, 20)
SALARY = slice(20, 30)

raw_record = "10042Hesam Pourabba 0012500000"
print("ID     :", raw_record[RECORD_ID].strip())
print("Name   :", raw_record[FIRST_NAME].strip())
print("Salary :", f"${int(raw_record[SALARY]) / 100:,.2f}")
```

---

## Examples

### 1. Simple: Slicing Prefixes, Suffixes, and Substrings
Extracting components from structured text identifiers.

```python
product_sku = "PROD-2024-ELECTRONICS-9982"

category_prefix = product_sku[:4]       # 'PROD'
year = product_sku[5:9]                 # '2024'
serial_num = product_sku[-4:]           # '9982'

print(f"Prefix : {category_prefix}")
print(f"Year   : {year}")
print(f"Serial : {serial_num}")
```

### 2. Beginner: Palindrome Testing with Negative Slices
Checking whether words and sentences read identically forward and backward.

```python
def is_palindrome(text: str) -> bool:
    # Normalize: lowercase and keep only alphanumeric characters
    cleaned = "".join(ch.lower() for ch in text if ch.isalnum())
    # Compare string directly with its reversed slice
    return cleaned == cleaned[::-1]

test_phrases = [
    "Racecar",
    "A man, a plan, a canal, Panama!",
    "Python Programming",
    "Was it a car or a cat I saw?"
]

for phrase in test_phrases:
    print(f"'{phrase}' -> Palindrome: {is_palindrome(phrase)}")
```

### 3. Intermediate: Parsing Fixed-Width Legacy Data Records
Extracting structured fields from fixed-width mainframe records using named slice objects.

```python
# Fixed-width schema:
# Bytes 0-8: Timestamp (YYYYMMDD)
# Bytes 8-12: Branch Code
# Bytes 12-24: Account Number
# Bytes 24-34: Transaction Amount in Cents (padded zeros)
# Bytes 34-35: Transaction Type (D=Debit, C=Credit)

TX_DATE = slice(0, 8)
TX_BRANCH = slice(8, 12)
TX_ACCOUNT = slice(12, 24)
TX_AMOUNT = slice(24, 34)
TX_TYPE = slice(34, 35)

raw_records = [
    "202405180401ACC-882109400000150000C",
    "202405180401ACC-339100100000045050D",
    "202405180402ACC-774001900001200000C",
]

print(f"{'DATE':<10} {'BRANCH':<8} {'ACCOUNT':<14} {'TYPE':<8} {'AMOUNT':>10}")
print("-" * 55)
for record in raw_records:
    dt = f"{record[TX_DATE][:4]}-{record[TX_DATE][4:6]}-{record[TX_DATE][6:8]}"
    branch = record[TX_BRANCH]
    account = record[TX_ACCOUNT]
    tx_type = "Credit" if record[TX_TYPE] == "C" else "Debit"
    amount = float(record[TX_AMOUNT]) / 100.0
    
    print(f"{dt:<10} {branch:<8} {account:<14} {tx_type:<8} ${amount:>9.2f}")
```

### 4. Real-World: Bioinformatic DNA Codon Extraction
Extracting 3-letter genetic codons from a DNA sequence using step slicing.

```python
dna_sequence = "ATGCGATCGATCGATCGATCGATCGATCGTAG"

# Extract start codon (first 3) and stop codon (last 3)
start_codon = dna_sequence[:3]
stop_codon = dna_sequence[-3:]

# Extract all 3-letter codons in reading frame
codons = [dna_sequence[i:i+3] for i in range(0, len(dna_sequence) - 2, 3)]

print(f"DNA Sequence Length: {len(dna_sequence)} bp")
print(f"Start Codon        : {start_codon}")
print(f"Stop Codon         : {stop_codon}")
print(f"Extracted Codons   : {codons}")
```

### 5. Advanced: Implementing Slice Support in Custom Collections (`__getitem__`)
Building a custom `PagedBuffer` class that handles both single integer indices and slice objects using `slice.indices()`.

```python
class PagedBuffer:
    def __init__(self, data: str):
        self._data = data

    def __len__(self) -> int:
        return len(self._data)

    def __getitem__(self, item: int | slice) -> str:
        """Handle both integer index lookups and slice objects."""
        if isinstance(item, int):
            # Let Python handle positive/negative indexing and IndexError
            return self._data[item]
        elif isinstance(item, slice):
            # Normalize slice start, stop, step using the collection length
            start, stop, step = item.indices(len(self._data))
            # Extract and return sub-buffer
            extracted = "".join(self._data[i] for i in range(start, stop, step))
            return f"[BUFFER SLICE {start}:{stop}:{step}] -> '{extracted}'"
        else:
            raise TypeError(f"Invalid index type: {type(item).__name__}")

buffer = PagedBuffer("EnterpriseSecurityArchitecturePayload")

print("Single Index [0]  :", buffer[0])
print("Single Index [-1] :", buffer[-1])
print("Slice [0:10]      :", buffer[0:10])
print("Slice [::3]       :", buffer[::3])
print("Slice [::-1]      :", buffer[::-1])
```

---

## Code Explanation

In Example 5 (Custom Slice Support):
1. When you index a custom object with `obj[0:10:2]`, Python invokes `__getitem__(self, item)` passing a `slice` object (`slice(0, 10, 2)`).
2. The `item.indices(length)` method calculates normalized integer values `(start, stop, step)` that fit within the collection's bounds, resolving negative indices and clipping out-of-bounds numbers automatically.
3. This allows user-defined data structures, matrices, and database query cursors to support standard Python slice syntax seamlessly.

---

## Common Mistakes

### Mistake 1: Off-by-One Errors with the Stop Index
Because the `stop` index is **exclusive**, slicing `s[0:5]` extracts indices `0, 1, 2, 3, 4` (5 characters), not index 5.

```python
word = "Python"
# If you want the first 5 characters:
first_five = word[0:5]  # 'Pytho' (indices 0..4)
# If you want the complete word:
full_word = word[0:6]   # 'Python' (indices 0..5)
```

### Mistake 2: Confusing Single Indexing with Slicing on Missing Elements
Single indexing raises an exception on out-of-bounds access, while slicing does not.

```python
text = "abc"

# Single indexing out of range:
# val = text[10]  # CRASHES: IndexError: string index out of range

# Slicing out of range:
val = text[10:20] # Returns empty string "" safely
```

---

## Best Practices

### Use Negative Indexing for File Extensions and Suffixes
Instead of searching for dots or hardcoding lengths, use negative slices or string methods.

Good:
```python
# Extract last 4 characters
suffix = filename[-4:]
```

Avoid:
```python
# Fragile calculation of length
suffix = filename[len(filename)-4 : len(filename)]
```

---

## Performance Considerations

1. **Slicing Memory Allocation**: In CPython, slicing a string (`sub = large_string[0:1000]`) creates a **new string object** on the heap and copies the characters. For multi-gigabyte text files, slicing repeatedly in a loop allocates substantial memory.
2. **Binary Zero-Copy Slicing with `memoryview`**: When working with massive binary files or network buffers (`bytes`), wrapping data in a `memoryview` allows zero-copy slicing without duplicating memory buffers in RAM.

---

## Security Considerations

1. **Fixed-Width Parsing Buffer Overflows**: In legacy financial data feeds, always check `len(record)` before applying fixed-width slice schemas. Truncated network lines can lead to empty slices being passed into numeric converters (`float(record[24:34])` fails if line is truncated).
2. **Denial of Service via Unchecked Memory Allocation**: Avoid accepting user-controlled slice parameters directly if they trigger massive string slicing loops that consume server memory.

---

## Real-World Usage

- **Fixed-Width Mainframe Records**: Banking and insurance systems process millions of daily transactions formatted in fixed-column ASCII records parsed via named slices.
- **Bioinformatics & Genomics**: Extracting DNA codons, gene reading frames, and nucleotide sequences using step strides.
- **Network Packet Decoding**: Extracting MAC addresses, IP headers, and payload checksums from raw hex-encoded text.

---

## Comparison: Indexing vs Slicing

| Feature | Indexing (`s[i]`) | Slicing (`s[start:stop:step]`) |
|---|---|---|
| **Return Type** | Single character (`str` of length 1) | Substring (`str` of length 0 to $N$) |
| **Out-of-Bounds Behavior** | **Raises `IndexError`** | **Clips gracefully** (Returns clamped or `""`) |
| **Step Parameter** | Not supported | Supported (Positive or Negative stride) |
| **Dunder Invocation** | `s.__getitem__(int)` | `s.__getitem__(slice)` |
| **Use Case** | Inspect single character at offset | Extract substring, prefix, suffix, reverse |

---

## Advanced Concepts: The `slice.indices()` Protocol

The built-in `slice.indices(length)` method calculates effective indices for a sequence of given length:

```python
# Signature: slice.indices(length) -> (start, stop, step)
s = slice(-5, 100, 2)
effective_indices = s.indices(10)

print(f"Raw Slice       : {s}")
print(f"For length=10   : start={effective_indices[0]}, stop={effective_indices[1]}, step={effective_indices[2]}")
# Output: start=5, stop=10, step=2
```

This guarantees consistent, standardized slice resolution across third-party libraries (like NumPy and Pandas).

---

## Exercises

### Exercise 1 — Beginner
Create a string containing the alphabet `"abcdefghijklmnopqrstuvwxyz"`. Use slicing to: (1) extract the first 5 letters, (2) extract the last 5 letters, (3) extract every 3rd letter starting from index 0, and (4) reverse the entire alphabet.

### Exercise 2 — Intermediate
Write a function `mask_credit_card(card_number: str) -> str` that accepts a 16-digit credit card string (e.g., `"4532890123456789"`), validates its length, and returns a masked string showing only the first digit and the last 4 digits, replacing all intermediate digits with `*` (e.g., `"4***********6789"`).

### Exercise 3 — Advanced
Build a `Rot13Cipher` class that uses slicing and `str.maketrans()` to implement the ROT13 Caesar substitution cipher (rotating the alphabet by 13 positions). Implement `encrypt(text: str)` and `decrypt(text: str)` verifying that `decrypt(encrypt(text)) == text`.

---

## Mini Project: Fixed-Width Banking Ledger Record Parser

### Requirements
Build a production-grade parser named `fixed_width_parser.py` that processes fixed-column banking data files using named slice objects, validates record lengths, computes running balances, and outputs a formatted audit ledger.

### Implementation Blueprint
```python
class BankingRecordParser:
    # Define Named Slice Schema
    SLICE_TX_ID   = slice(0, 8)     # 8 chars
    SLICE_DATE    = slice(8, 18)    # 10 chars (YYYY-MM-DD)
    SLICE_ACCOUNT = slice(18, 30)   # 12 chars
    SLICE_TYPE    = slice(30, 32)   # 2 chars (CR / DR)
    SLICE_AMOUNT  = slice(32, 44)   # 12 chars (padded cents)
    
    EXPECTED_RECORD_LENGTH = 44

    @classmethod
    def parse_line(cls, line: str) -> dict:
        clean_line = line.rstrip("\r\n")
        if len(clean_line) != cls.EXPECTED_RECORD_LENGTH:
            raise ValueError(f"Record length {len(clean_line)} does not match expected schema ({cls.EXPECTED_RECORD_LENGTH})")
            
        tx_id = clean_line[cls.SLICE_TX_ID].strip()
        tx_date = clean_line[cls.SLICE_DATE].strip()
        account = clean_line[cls.SLICE_ACCOUNT].strip()
        tx_type = clean_line[cls.SLICE_TYPE].strip()
        amount_cents = int(clean_line[cls.SLICE_AMOUNT].strip())
        amount = amount_cents / 100.0
        
        return {
            "tx_id": tx_id,
            "date": tx_date,
            "account": account,
            "type": "Credit" if tx_type == "CR" else "Debit",
            "amount": amount
        }

if __name__ == "__main__":
    sample_batch = [
        "TX9900012024-05-18ACC-88210940CR000001500050",
        "TX9900022024-05-18ACC-33910010DR000000450000",
        "TX9900032024-05-18ACC-77400190CR000012000025",
    ]
    
    print("=" * 65)
    print("           FIXED-WIDTH LEDGER TRANSACTION AUDIT")
    print("=" * 65)
    print(f"{'TX ID':<10} {'DATE':<12} {'ACCOUNT':<15} {'TYPE':<8} {'AMOUNT':>12}")
    print("-" * 65)
    
    total_credits = 0.0
    total_debits = 0.0
    
    for row in sample_batch:
        parsed = BankingRecordParser.parse_line(row)
        if parsed["type"] == "Credit":
            total_credits += parsed["amount"]
        else:
            total_debits += parsed["amount"]
            
        print(f"{parsed['tx_id']:<10} {parsed['date']:<12} {parsed['account']:<15} {parsed['type']:<8} ${parsed['amount']:>11,.2f}")
        
    print("-" * 65)
    print(f"Total Credits : ${total_credits:>10,.2f}")
    print(f"Total Debits  : ${total_debits:>10,.2f}")
    print(f"Net Position  : ${total_credits - total_debits:>10,.2f}")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered string slicing and indexing in Python:
- Direct indexing (`s[i]`) accesses single characters ($0$ to $N-1$ forward, $-1$ to $-N$ backward) and raises `IndexError` on out-of-bounds access.
- Slicing (`s[start:stop:step]`) extracts sub-sequences on half-open intervals $[start, stop)$ and clips out-of-bounds boundaries gracefully.
- Negative step strides (e.g., `s[::-1]`) traverse sequences backwards, providing idiomatic string reversal.
- Use named `slice()` objects for reusable, self-documenting fixed-width data parsing schemas.
- Custom sequence classes implement slice handling by overriding `__getitem__()` and using `slice.indices()`.

---

## Best Practices Checklist

- [ ] Use `s[::-1]` for concise, idiomatic string reversal.
- [ ] Use negative indices (e.g., `s[-4:]`) to extract suffixes and extensions.
- [ ] Use named `slice(start, stop)` objects when parsing fixed-width data schemas.
- [ ] Remember that `stop` is exclusive ($[start, stop)$).
- [ ] Check string length before indexing single characters to avoid `IndexError`.

---

## What's Next?

Congratulations! You have completed **Module 4: Strings in Depth**. 
Now continue to **Module 5: Control Flow**:
👉 **[Conditional Statements](../control-flow/conditional-statements.md)** to master algorithmic branching (`if`, `elif`, `else`), ternary operators, and nested conditions.
