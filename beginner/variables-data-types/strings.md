# Strings Fundamentals in Python

## Introduction

Text is the primary medium through which human beings communicate with software applications. Usernames, email messages, database records, HTTP network packets, configuration files, and log outputs are all fundamentally composed of textual information. In Python, textual data is managed by the built-in `str` class, which provides an exceptionally robust, full-featured, and modern text-processing engine.

Historically, programming languages struggled with text manipulation because early computing standards (such as 7-bit ASCII) were designed exclusively for the English alphabet, allocating only 128 characters. Modern global software, however, must seamlessly support international languages, accented scripts, mathematical symbols, emojis, and right-to-left alphabets (such as Arabic and Hebrew). In Python 3, all strings are **native Unicode sequences** by default, eliminating the character corruption bugs (known internationally as *Mojibake*) that plagued earlier programming environments.

Furthermore, strings in Python are **immutable sequences**. Once a string object is created in memory, its characters cannot be altered, appended, or deleted in place. While this immutability enforces data integrity, thread safety, and predictable hashing for dictionary keys, it also dictates specific architectural patterns for performant text manipulation.

This lesson builds upon [Variables & Data Types](variables.md) and [Integers & Floats](integers-floats.md), establishing the core concepts of string representations, Unicode encoding, escape sequences, and memory layout before exploring advanced slicing and formatting methods in subsequent chapters.

---

## Prerequisites

Before studying strings in depth, ensure you have:

- Completed [Variables & Memory Binding](variables.md) and [Dynamic Typing](dynamic-typing.md).
- A basic understanding of character encodings (ASCII vs Unicode).
- Access to a terminal or Python REPL to test string functions and character code conversions.

---

## Core Concept

In Python's memory model:
1. **Strings are Immutable**: Any operation that appears to "modify" a string (such as `.upper()`, `.replace()`, or concatenation `+`) actually allocates a brand new `str` object on the heap, leaving the original string untouched.
2. **Strings are Sequences**: A string is an ordered container of individual Unicode code points. You can measure its length using `len()`, iterate over its characters in a `for` loop, and access individual characters using zero-based indices (`s[0]`).
3. **Strict Separation of Text and Bytes**: Python draws a strict distinction between textual human-readable strings (`str`) and raw binary machine bytes (`bytes`). You cannot concatenate a `str` with a `bytes` object without explicit encoding or decoding.

```
Unicode Text (str)       --- .encode('utf-8') --->      Raw Binary Data (bytes)
"Hesam 👋" (Human text)                                b"Hesam \xf0\x9f\x91\x8b"
"Hesam 👋" (Human text)  <--- .decode('utf-8') ---     b"Hesam \xf0\x9f\x91\x8b"
```

---

## Syntax & Literal Representations

Python offers several distinct string literal syntaxes to suit different developer needs:

```python
# 1. Single and Double Quotes (functionally identical)
first_name = 'Hesam'
last_name = "Pourabbasain"

# 2. Multi-line Strings (Triple Quotes: ''' or """)
documentation = """
This is a multi-line string.
It preserves literal line breaks,
indentations, and whitespace cleanly.
"""

# 3. Raw Strings (prefix: r or R) - Escapes are treated as literal characters
windows_path = r"C:\Users\hesam\documents\new_project"
regex_pattern = r"\d{3}-\d{2}-\d{4}"

# 4. Byte Literals (prefix: b or B) - Raw ASCII/binary bytes
binary_header = b"\x89PNG\r\n\x1a\n"

# 5. Escape Sequences
escaped_text = "Line 1\nLine 2\tTabbed\nSpecial: \"Quotes\" & Backslash: \\"
```

### Standard Escape Sequences Reference

| Escape | Meaning | Hex / ASCII |
|---|---|---|
| `\n` | Newline (Line Feed) | `0x0A` |
| `\t` | Horizontal Tab | `0x09` |
| `\\` | Literal Backslash `\` | `0x5C` |
| `\'` | Literal Single Quote `'` | `0x27` |
| `\"` | Literal Double Quote `"` | `0x22` |
| `\uXXXX` | 16-bit Unicode character | e.g. `\u03A9` ($\Omega$) |
| `\UXXXXXXXX`| 32-bit Unicode character | e.g. `\U0001F680` (🚀) |
| `\N{name}` | Unicode character by database name | e.g. `\N{GRINNING FACE}` (😀) |

---

## Detailed Explanation

### 1. The Immutability Principle in Action

When you attempt to modify a character in a Python string, Python immediately raises a `TypeError`:

```python
name = "Python"
try:
    name[0] = "J"  # Attempting in-place modification
except TypeError as err:
    print("Immutability Violation:", err)
    # Output: TypeError: 'str' object does not support item assignment
```

To create `"Jython"`, you must construct a new string from slices of the original: `name = "J" + name[1:]`.

### 2. Unicode Code Points, `ord()`, and `chr()`

Every character in the Unicode standard is mapped to a unique integer called a **Code Point** (written conventionally as `U+XXXX` in hexadecimal).
- `ord(char)`: Returns the integer Unicode code point for a given single-character string.
- `chr(code_point)`: Converts an integer code point back into its corresponding Unicode character.

```python
char = "🚀"
code_point = ord(char)
print(f"Character: {char} -> Code Point: {code_point} (Hex: {hex(code_point)})")

restored_char = chr(128640)
print(f"Restored Character: {restored_char}")
```

### 3. Memory Optimization: PEP 393 (Flexible String Representation)

In early Python versions, storing a simple ASCII string in memory required 2 or 4 bytes per character (using UCS-2 or UCS-4 encoding), wasting vast amounts of RAM.

In modern Python (PEP 393), CPython uses **Flexible String Representation**:
- If all characters in the string fit within ASCII/Latin-1 (code points $0 - 255$), Python allocates **1 byte per character** (`PyASCIIObject`).
- If the string contains characters up to code point $65535$ (BMP), Python allocates **2 bytes per character** (`PyCompactUnicodeObject`).
- If the string contains emojis or complex astral characters (code points up to $1,114,111$), Python allocates **4 bytes per character**.

This optimization ensures that Python strings remain as memory-efficient as raw C strings for standard text, while seamlessly scaling to support full global Unicode.

---

## Examples

### 1. Simple: Basic Escape Sequences and Raw Strings
Comparing how regular strings and raw strings interpret backslash characters.

```python
# Regular string interprets \n as newline and \t as tab
regular_str = "Path: C:\new_folder\table.txt"
print("Regular String:")
print(regular_str)

# Raw string suppresses escape sequence evaluation
raw_str = r"Path: C:\new_folder\table.txt"
print("\nRaw String:")
print(raw_str)
```

### 2. Beginner: Inspecting Character Code Points
Iterating over a multi-lingual greeting to inspect the individual character code points.

```python
multilingual_text = "Hello! سلام 🌍"

print(f"{'Char':<6} {'Code Point (Dec)':<18} {'Code Point (Hex)':<18}")
print("-" * 45)
for char in multilingual_text:
    print(f"{char:<6} {ord(char):<18} {hex(ord(char)):<18}")
```

### 3. Intermediate: Efficient String Accumulation with `.join()`
Comparing the efficiency of joining strings versus repeated concatenation in a loop.

```python
import time

# List of 100,000 words to assemble
words = ["python"] * 100_000

# ANTI-PATTERN: Repeated += concatenation (Quadratic memory re-allocations)
start_time = time.perf_counter()
slow_result = ""
for word in words:
    slow_result += word + " "
slow_duration = time.perf_counter() - start_time

# IDIOMATIC PATTERN: str.join() (Single pre-calculated memory allocation)
start_time = time.perf_counter()
fast_result = " ".join(words)
fast_duration = time.perf_counter() - start_time

print(f"Repeated '+=' duration : {slow_duration:.4f} seconds")
print(f"'str.join()' duration   : {fast_duration:.4f} seconds")
print(f"Performance speedup     : {slow_duration / fast_duration:.1f}x faster!")
```

### 4. Real-World: Encoding & Decoding Network Payloads
Simulating network serialization where Unicode text is converted to UTF-8 bytes for transmission over a socket, and decoded upon arrival.

```python
def serialize_network_payload(message: str) -> bytes:
    """Encode text to UTF-8 bytes with error validation."""
    print(f"[Sender] Original text ({len(message)} chars): '{message}'")
    encoded_bytes = message.encode("utf-8")
    print(f"[Sender] Serialized to UTF-8 ({len(encoded_bytes)} bytes): {encoded_bytes}")
    return encoded_bytes

def deserialize_network_payload(raw_bytes: bytes) -> str:
    """Decode incoming UTF-8 bytes back into a Python Unicode string."""
    decoded_text = raw_bytes.decode("utf-8")
    print(f"[Receiver] Deserialized back to text: '{decoded_text}'")
    return decoded_text

payload = "Order Confirmed: 250.00€ ✨"
byte_stream = serialize_network_payload(payload)
received_message = deserialize_network_payload(byte_stream)
```

### 5. Advanced: Unicode Normalization (`unicodedata`)
Handling Unicode equivalence issues where identical-looking characters have different binary representations.

```python
import unicodedata

# Form 1: Single composed character 'é' (U+00E9)
char_composed = "café"

# Form 2: Decomposed 'e' (U+0065) followed by combining acute accent '´' (U+0301)
char_decomposed = "cafe\u0301"

print(f"Composed   : '{char_composed}' (Length: {len(char_composed)})")
print(f"Decomposed : '{char_decomposed}' (Length: {len(char_decomposed)})")
print(f"Direct Equality (==): {char_composed == char_decomposed}")  # False! ❌

# Normalize both strings to Canonical Composition (NFC)
normalized_1 = unicodedata.normalize("NFC", char_composed)
normalized_2 = unicodedata.normalize("NFC", char_decomposed)

print(f"Normalized Equality (NFC): {normalized_1 == normalized_2}")  # True! ✅
```

---

## Code Explanation

In Example 5 (Unicode Normalization):
1. In Unicode, accented letters can be represented either as a single pre-composed character (`é` - code point `233`) or as two separate code points: a base character (`e` - code point `101`) followed by a non-spacing combining accent (`´` - code point `769`).
2. Both render identically on human computer screens, but their underlying memory bytes and character lengths differ (`len("café") == 4`, but `len("cafe\u0301") == 5`).
3. Direct equality comparison `==` returns `False`, which can introduce severe authentication bugs (such as user password or username validation mismatches).
4. Calling `unicodedata.normalize("NFC", string)` converts all decomposed combining sequences into standard composed code points, guaranteeing 100% reliable comparisons.

---

## Common Mistakes

### Mistake 1: Quadratic String Concatenation in Loops (`+=`)
Because strings are immutable, writing `s += item` inside a loop forces Python to allocate a new memory buffer, copy all existing characters, append the new item, and discard the old buffer on every single iteration. For $N$ items, this results in $O(N^2)$ algorithmic time complexity.

**How to avoid:** Collect substrings in a standard Python list, and call `''.join(list_of_strings)` once at the end ($O(N)$ linear time complexity).

### Mistake 2: Mixing `str` and `bytes` without Explicit Encodings
Attempting to concatenate or compare raw byte sequences directly with Unicode strings raises a `TypeError` in Python 3.

```python
# BROKEN:
token = b"secret_token_123"
header = "Bearer " + token  # Raises TypeError: can only concatenate str (not "bytes") to str

# CORRECT:
header = "Bearer " + token.decode("utf-8")
```

---

## Best Practices

### Explicitly Specify Encodings in File and Network I/O
Never rely on the operating system's default character encoding (which might be `cp1252` on older Windows machines, `Shift-JIS` in Japan, or `utf-8` on Linux). Always pass `encoding="utf-8"` explicitly.

Good:
```python
with open("dataset.txt", "w", encoding="utf-8") as file:
    file.write("Unicode text: 🚀")
```

Avoid:
```python
# Relying on implicit platform-dependent default encoding
with open("dataset.txt", "w") as file:
    file.write("Unicode text: 🚀")
```

---

## Performance Considerations

1. **Length Lookup Cost ($O(1)$)**: In Python, string length (`len(s)`) is stored as an integer attribute in the C header (`ob_size`). Calling `len()` does not scan or count characters; it is an instantaneous $O(1)$ memory lookup.
2. **String Interning**: CPython automatically interns compile-time string constants that look like Python identifiers (e.g., `"user_id"`, `"status"`), storing only a single copy in an internal global hash table. This makes dictionary lookups and equality checks between identical string constants instantaneous pointer comparisons.

---

## Security Considerations

1. **Unicode Homoglyph Attacks**: Malicious actors register domain names or usernames using look-alike characters from different alphabets (e.g., Cyrillic 'а' `U+0430` looks visually identical to Latin 'a' `U+0061`). Always normalize user input using `unicodedata.normalize("NFKC", ...)` and check for mixed scripts.
2. **SQL and Shell Command Injections**: Never construct SQL queries or shell commands by concatenating raw strings with untrusted user input. Always use parameterized queries or subprocess argument lists.

---

## Real-World Usage

- **Web Microservices**: REST APIs parse incoming JSON request bodies, validate UTF-8 headers, and sanitize query strings before routing to business logic.
- **Natural Language Processing (NLP)**: Machine learning pipelines normalize text corpora, strip accents, remove stopwords, and convert raw text into token IDs.
- **Log Aggregation**: Cloud monitoring agents parse multi-gigabyte log streams, extracting timestamps, severity levels, and stack traces using regular expression string parsing.

---

## Comparison: Python Text and Binary Types

| Type | Nature | Elements | Mutable? | Best Use Case |
|---|---|---|---|---|
| **`str`** | Unicode Text | Characters / Code Points | No (Immutable) | Human-readable text, UI, files, APIs |
| **`bytes`** | Raw Binary | Integers ($0 - 255$) | No (Immutable) | Network sockets, encrypted data, images |
| **`bytearray`**| Raw Binary | Integers ($0 - 255$) | Yes (Mutable) | Low-level buffers, packet manipulation |
| **`memoryview`**| Memory View | Raw memory slices | Dependent | Zero-copy high-performance I/O slicing |

---

## Advanced Concepts: Deep Dive into PEP 393 Memory Headers

CPython defines strings in `Include/cpython/unicodeobject.h` across three specialized C structures:
1. `PyASCIIObject`: Used for pure 7-bit ASCII strings. Contains only the object header and a contiguous char buffer.
2. `PyCompactUnicodeObject`: Used for Latin-1, UCS-2, and UCS-4 strings without complex pointers.
3. Legacy representation: Maintained for backward compatibility with C-extensions.

When you call `sys.getsizeof(string)`, you can observe this memory efficiency in real time:
```python
import sys

ascii_str = "a" * 100
unicode_str = "🚀" * 100

print(f"100 ASCII chars   : {sys.getsizeof(ascii_str)} bytes")    # ~149 bytes (1 byte/char)
print(f"100 Emoji chars   : {sys.getsizeof(unicode_str)} bytes")  # ~480 bytes (4 bytes/char)
```

---

## Exercises

### Exercise 1 — Beginner
Create a script that takes a user's full name, prints its length in characters, prints the first and last character, and outputs the integer Unicode code point for every character in the name.

### Exercise 2 — Intermediate
Write a function `clean_multiline_text(raw_text: str) -> str` that accepts a multi-line string containing messy whitespace, strips leading/trailing whitespace from each line, removes blank lines, and joins the remaining lines with a single newline character `\n`.

### Exercise 3 — Advanced
Create a function `detect_homoglyph_collision(str1: str, str2: str) -> dict` that takes two strings, normalizes them using both `"NFC"` and `"NFKC"`, and returns a dictionary detailing: (1) whether the strings are directly equal, (2) whether they are equal under NFKC normalization, and (3) a list of character-by-character code point comparisons.

---

## Mini Project: Multi-Lingual Text Sanitizer & Unicode Security Guard

### Requirements
Build a production-grade utility script named `text_sanitizer.py` that ingests raw user strings, strips non-printable control characters, normalizes Unicode representations to NFC, sanitizes HTML script tags, and reports potential homoglyph security warnings.

### Implementation Blueprint
```python
import unicodedata
import re

class TextSanitizer:
    @staticmethod
    def sanitize(raw_input: str) -> dict:
        # 1. Normalize Unicode to NFC
        normalized = unicodedata.normalize("NFC", raw_input)
        
        # 2. Strip non-printable control characters (excluding standard whitespace)
        cleaned_chars = []
        for ch in normalized:
            category = unicodedata.category(ch)
            # Cc: Other, Control (e.g. null bytes, unprintable escapes)
            if not category.startswith("C") or ch in ("\n", "\t", "\r"):
                cleaned_chars.append(ch)
        clean_text = "".join(cleaned_chars)
        
        # 3. Strip dangerous HTML/Script tags
        sanitized_text = re.sub(r"<script.*?>.*?</script>", "", clean_text, flags=re.IGNORECASE | re.DOTALL)
        sanitized_text = sanitized_text.replace("<", "&lt;").replace(">", "&gt;").strip()
        
        # 4. Check for mixed script / potential homoglyph flags
        scripts_present = set()
        for ch in clean_text:
            if ch.isalpha():
                name = unicodedata.name(ch, "")
                first_word = name.split()[0] if name else "UNKNOWN"
                scripts_present.add(first_word)

        is_suspicious_mixed_script = len(scripts_present) > 1 and "LATIN" in scripts_present
        
        return {
            "original": raw_input,
            "sanitized": sanitized_text,
            "char_count": len(sanitized_text),
            "byte_count_utf8": len(sanitized_text.encode("utf-8")),
            "detected_scripts": list(scripts_present),
            "security_warning": "Potential Homoglyph Risk" if is_suspicious_mixed_script else "OK"
        }

if __name__ == "__main__":
    test_cases = [
        "   Hello World! <script>stealCookies()</script>  ",
        "Pаypal (Note: First 'а' is Cyrillic U+0430)",
        "Order: 150.00€ \x00\x07✨\nNext Line"
    ]
    
    sanitizer = TextSanitizer()
    for test in test_cases:
        report = sanitizer.sanitize(test)
        print("=" * 60)
        print(f"Original  : {report['original']!r}")
        print(f"Sanitized : {report['sanitized']}")
        print(f"Scripts   : {report['detected_scripts']}")
        print(f"Security  : {report['security_warning']}")
    print("=" * 60)
```

---

## Summary

In this lesson, you mastered the fundamental architecture of strings in Python:
- Python 3 strings (`str`) are immutable sequences of Unicode code points.
- Immutability guarantees thread safety, predictable hashing, and data integrity.
- Python distinguishes strictly between human-readable text (`str`) and binary byte streams (`bytes`).
- Use `str.join()` rather than repeated `+=` concatenation in loops to avoid quadratic $O(N^2)$ memory copying.
- Use `unicodedata.normalize()` to handle equivalent Unicode compositions reliably.
- Use raw strings (`r""`) when defining regular expressions and Windows file paths.

---

## Best Practices Checklist

- [ ] Use `str.join()` instead of `+=` for string accumulation in loops.
- [ ] Explicitly specify `encoding="utf-8"` when reading or writing files.
- [ ] Use raw string literals (`r"..."`) for regular expressions and Windows file paths.
- [ ] Normalize external user input with `unicodedata.normalize("NFC", ...)` before validation.
- [ ] Decode bytes to strings explicitly using `.decode("utf-8")`.

---

## What's Next?

Now that you understand strings and text representation, continue to:
👉 **[Booleans & The NoneType](booleans-none.md)** to master truth value testing, truthiness, the `None` singleton, and boolean logic.
