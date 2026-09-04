# String Methods & Text Manipulation in Python

## Introduction

Textual manipulation is one of the most frequent tasks in software engineering. Application code continuously sanitizes user registration inputs, normalizes unstructured CSV data, parses HTTP request headers, transforms database query results, and formats terminal logging outputs. To support these operations without requiring external third-party dependencies, Python equips its built-in `str` class with an exhaustive, highly optimized suite of native methods.

Mastering Python's string methods requires more than memorizing function names. It demands an understanding of how string methods interact with Python's immutability model (every string method returns a **new string object**, leaving the original unaltered), how specialized methods like `casefold()` handle complex international Unicode alphabets, why `removeprefix()` was added in Python 3.9 to eliminate common bugs caused by `strip()`, and when to leverage low-level C translation tables via `str.translate()` for high-throughput data processing.

This lesson explores the full catalog of Python string methods, organizing them into logical operational categories and analyzing their internal mechanics, performance profiles, and security considerations.

---

## Prerequisites

Before studying string methods, ensure you have:

- Completed [Strings Fundamentals](../variables-data-types/strings.md) and [String Formatting](string-formatting.md).
- A solid understanding of string immutability and zero-based indexing.
- Familiarity with basic boolean predicates and tuple data structures.

---

## Core Concept: Taxonomy of String Methods

Python's built-in string methods can be classified into six core functional categories:

```
                            PYTHON STRING METHODS TAXONOMY
                                         │
        ┌──────────────┬──────────────┬──┴───────────┬──────────────┬──────────────┐
        ▼              ▼              ▼              ▼              ▼              ▼
   Case Changes   Search/Count   Stripping      Split/Join    Validation     Replacement
   • lower()      • find()       • strip()      • split()     • isalpha()    • replace()
   • upper()      • index()      • lstrip()     • rsplit()    • isdigit()    • translate()
   • title()      • count()      • rstrip()     • join()      • isalnum()    • maketrans()
   • capitalize() • startswith() • removeprefix()• partition()• isspace()
   • casefold()   • endswith()   • removesuffix()• splitlines()• isidentifier()
```

---

## Syntax & Common Method Categories

### 1. Case Transformation Methods
```python
text = "hello World! ß"

print(text.upper())       # "HELLO WORLD! SS"
print(text.lower())       # "hello world! ß"
print(text.capitalize())  # "Hello world! ß" (Capitalizes only first char)
print(text.title())       # "Hello World! Ss"
print(text.casefold())    # "hello world! ss" (Aggressive Unicode lowercase)
```

### 2. Searching and Counting
```python
sentence = "the quick brown fox jumps over the lazy dog"

print(sentence.count("the"))          # 2
print(sentence.find("fox"))           # 16 (Index of first occurrence, or -1 if missing)
print(sentence.index("fox"))          # 16 (Index of first occurrence, raises ValueError if missing)
print(sentence.startswith("the"))     # True
print(sentence.endswith("dog"))       # True
print(sentence.startswith(("a", "the"))) # True (Accepts tuple of prefixes!)
```

### 3. Stripping and Prefix/Suffix Removal
```python
raw_input = "   === User Profile ===   \n"

# Stripping whitespace and character sets
print(raw_input.strip())              # "=== User Profile ==="
print(raw_input.strip().strip("= "))  # "User Profile"

# Modern Python 3.9+ Exact Prefix and Suffix Removal
filename = "invoice_2024_may.pdf"
print(filename.removeprefix("invoice_")) # "2024_may.pdf"
print(filename.removesuffix(".pdf"))     # "invoice_2024_may"
```

### 4. Splitting, Partitioning, and Joining
```python
csv_row = "Hesam,30,Software Engineer,Tehran"

# Splitting into list
fields = csv_row.split(",")           # ['Hesam', '30', 'Software Engineer', 'Tehran']

# Joining list back into string
reconstructed = " | ".join(fields)     # "Hesam | 30 | Software Engineer | Tehran"

# Partitioning on FIRST delimiter into (head, sep, tail) 3-tuple
email = "hesam@example.com"
user, sep, domain = email.partition("@") # user="hesam", sep="@", domain="example.com"
```

---

## Detailed Explanation

### 1. `lower()` vs `casefold()`: International Unicode Matching

For standard English ASCII characters, `lower()` and `casefold()` produce identical results. However, `casefold()` implements the **Unicode Standard Annex #31 Case Folding Algorithm**, converting aggressive ligature and language-specific characters into standard lowercase forms.

For example, the German letter sharp S (`ß`) casefolds to `"ss"`:
```python
german_word = "Fluß"  # German for 'river'

print("Using lower()    :", german_word.lower() == "fluss")     # False (Fluß -> fluß) ❌
print("Using casefold() :", german_word.casefold() == "fluss")  # True  (Fluß -> fluss) ✅
```

**Best Practice**: Always use `.casefold()` when performing case-insensitive string comparisons in user authentication or search systems.

### 2. The Critical Pitfall: `strip()` is NOT `removeprefix()`

One of the most destructive beginner mistakes is using `str.strip()` to remove a prefix:

```python
url = "https://www.python.org"

# BROKEN ATTEMPT TO REMOVE 'https://':
broken_domain = url.strip("https://")
print(broken_domain)  # "www.python.org" (Seems right, BUT...)

# DISASTER STRIKES ON THIS URL:
bad_url = "https://site.com"
print(bad_url.strip("https://"))  # "ite.com" ❌ (Stripped the 's' in 'site'!)
```

**Why did this happen?** The `strip(chars)` method takes a **set of characters to remove from the edges**, not a leading substring! It continually strips any character matching `'h'`, `'t'`, `'p'`, `'s'`, `':'`, or `'/'`.

**The Solution**: Use Python 3.9+ `removeprefix()` and `removesuffix()`:
```python
clean_domain = url.removeprefix("https://")  # "www.python.org" ✅
clean_site = bad_url.removeprefix("https://") # "site.com" ✅
```

### 3. `find()` vs `index()`

- `s.find(sub)`: Returns the integer index if found; returns **`-1`** if missing. Use when checking for optional substrings.
- `s.index(sub)`: Returns the integer index if found; raises a **`ValueError`** if missing. Use when missing substrings represent an error condition.

### 4. `partition()` vs `split(..., 1)`

When extracting key-value configuration headers (e.g., `"Content-Type: application/json"`), `str.partition(sep)` is faster and safer than `split()`. It always returns a **3-tuple `(before, sep, after)`**. If the separator is not found, it returns `(original_str, "", "")` without raising an error.

---

## Examples

### 1. Simple: Normalizing Case and Stripping Dirty Input
Cleaning raw user inputs before database insertion.

```python
raw_username = "   HESAM_DEV_99 \t\n"
clean_username = raw_username.strip().lower()

print(f"Original : {raw_username!r}")
print(f"Cleaned  : {clean_username!r}")
```

### 2. Beginner: Validating String Characters
Using character predicate methods to validate phone numbers, alphanumeric IDs, and variable identifiers.

```python
def validate_registration_payload(username: str, pin: str) -> tuple[bool, list[str]]:
    errors = []
    
    if not username.isidentifier():
        errors.append("Username must be a valid alphanumeric identifier (no spaces or special chars).")
    if not (pin.isdigit() and len(pin) == 4):
        errors.append("PIN must be exactly 4 numeric digits.")
        
    return len(errors) == 0, errors

print(validate_registration_payload("valid_user_01", "4821"))
print(validate_registration_payload("invalid-user!", "abcd"))
```

### 3. Intermediate: Parsing HTTP Headers with `partition()`
Parsing raw HTTP request lines into method, path, and protocol components.

```python
raw_headers = [
    "Host: api.enterprise.domain.com",
    "Content-Type: application/json; charset=utf-8",
    "Authorization: Bearer tok_sec_99182",
    "X-Forwarded-For: 192.168.1.10"
]

header_map = {}
for line in raw_headers:
    key, sep, value = line.partition(":")
    if sep:  # Valid header line containing ':'
        header_map[key.strip().lower()] = value.strip()

print("Parsed HTTP Header Dictionary:")
for k, v in header_map.items():
    print(f" -> {k:<18}: {v}")
```

### 4. Real-World: Multi-Stage CSV Pipeline Data Sanitizer
Ingesting messy CSV rows with inconsistent whitespace, missing values, and formatting discrepancies.

```python
raw_csv_rows = [
    "  101 , Hesam Pourabbasain ,  hesam@dev.io , 1450.50 , active  ",
    "  102 , ALICE SMITH        ,  alice@test.org , 890.00  , ACTIVE  ",
    "  103 , Bob Jones Jr.      ,  bob@corp.com   , 2100.25 , PENDING ",
]

def sanitize_csv_record(row: str) -> dict:
    parts = [col.strip() for col in row.split(",")]
    return {
        "id": int(parts[0]),
        "full_name": parts[1].title(),
        "email": parts[2].lower(),
        "account_balance": float(parts[3]),
        "status": parts[4].lower()
    }

print(f"{'ID':<6} {'NAME':<24} {'EMAIL':<20} {'BALANCE':>10} {'STATUS':^10}")
print("-" * 75)
for raw in raw_csv_rows:
    record = sanitize_csv_record(raw)
    print(f"{record['id']:<6} {record['full_name']:<24} {record['email']:<20} ${record['account_balance']:>9.2f} {record['status']:^10}")
```

### 5. Advanced: High-Throughput Character Translation (`str.translate`)
Stripping punctuation, symbols, and non-alphanumeric characters at native C speed using a translation mapping table.

```python
import string
import time

# Create translation table that maps all punctuation characters to None (delete them)
# and maps digits to their full-width equivalents or spaces
PUNCTUATION_TABLE = str.maketrans("", "", string.punctuation)

dirty_corpus = "Hello, World! Here's a test: [Python 3.12] -- cost: $19.99 (50% off!)"

# Single-pass C-speed translation
cleaned_corpus = dirty_corpus.translate(PUNCTUATION_TABLE)

print("Original Text :", dirty_corpus)
print("Cleaned Text  :", cleaned_corpus)
```

---

## Code Explanation

In Example 5 (Character Translation):
1. `str.maketrans(from_chars, to_chars, delete_chars)` compiles a translation table dictionary mapping Unicode ordinal integers.
2. `string.punctuation` contains all standard ASCII symbols (`!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~`).
3. Calling `dirty_corpus.translate(PUNCTUATION_TABLE)` passes the string to CPython's internal C translation engine (`unicodeobject.c`).
4. This removes all punctuation marks in a single, high-speed C loop, executing up to **20x faster** than chaining thirty separate `.replace()` calls in Python.

---

## Common Mistakes

### Mistake 1: Relying on `str.title()` for Names with Apostrophes
The built-in `.title()` method treats any non-letter character as a word boundary, corrupting words with apostrophes:

```python
# BROKEN:
name = "o'connor"
print(name.title())  # Outputs "O'Connor" -> Capitalized 'C' after apostrophe!
phrase = "they're"
print(phrase.title()) # Outputs "They'Re" ❌
```

**How to avoid:** For advanced human name casing, use `capwords` from the `string` module or dedicated regex tokenizers.

### Mistake 2: Missing `ValueError` Handling when Using `.index()`
Calling `.index()` on a substring that is missing raises an unhandled `ValueError`.

```python
# RISKY:
pos = "logfile.txt".index(".csv")  # Raises ValueError: substring not found

# SAFE:
pos = "logfile.txt".find(".csv")   # Returns -1 safely
```

---

## Best Practices

### Use Tuple Arguments with `startswith()` and `endswith()`
`str.startswith()` and `str.endswith()` natively accept a tuple of candidate substrings, eliminating verbose chained `or` expressions.

Good:
```python
if url.startswith(("http://", "https://", "ftp://")):
    print("Valid network URL")
```

Avoid:
```python
if url.startswith("http://") or url.startswith("https://") or url.startswith("ftp://"):
    print("Valid network URL")
```

---

## Performance Considerations

1. **`str.join()` Memory Allocation**: Always use `''.join(list_of_strings)` for string assembly. Python calculates the total byte length of all substrings upfront and performs a single contiguous memory allocation.
2. **`str.replace()` vs `re.sub()`**: For simple literal substring replacements (e.g., `s.replace("-", "_")`), `str.replace()` is approximately **10x faster** than compiling and executing a regular expression with `re.sub()`. Reserve regular expressions for complex pattern matching.

---

## Security Considerations

1. **Path Traversal Bypass with Incomplete `.replace()`**:
   Naively sanitizing file paths using `path.replace("../", "")` can be easily bypassed by an attacker submitting `....//` (when `../` is removed, the remaining characters collapse into `../`!). Always use `os.path.abspath()` or `pathlib.Path.resolve()` for path validation.
2. **Denial of Service via Huge `split()`**:
   Calling `payload.split(",")` on an untrusted multi-gigabyte string can exhaust server RAM by allocating millions of tiny string objects. Pass `maxsplit` (e.g., `payload.split(",", maxsplit=100)`) when parsing unbounded input.

---

## Real-World Usage

- **Web Server Routing**: Frameworks like Flask and FastAPI parse incoming URL query parameters, sanitize route prefixes, and split path parameters.
- **Log Aggregators (Elasticsearch / Datadog)**: Parsing log lines with `.partition()`, `.splitlines()`, and `.startswith()` to extract timestamp markers, log levels, and error tracebacks.
- **Search Engine Tokenization**: Normalizing search query text using `.casefold()`, `.translate()`, and `.split()` before matching against inverted document indexes.

---

## Comparison: String Method Reference

| Method | Purpose | Return Type | Failure / Edge Case | Example |
|---|---|---|---|---|
| **`casefold()`** | Aggressive Unicode lowercase | `str` | Handles 'ß' $\rightarrow$ 'ss' | `"Fluß".casefold()` $\rightarrow$ `"fluss"` |
| **`removeprefix(p)`** | Remove exact prefix string | `str` | Returns original if missing | `"app.py".removeprefix("app.")` $\rightarrow$ `"py"` |
| **`strip(chars)`** | Remove matching char set from edges | `str` | Strips individual chars | `"  abc  ".strip()` $\rightarrow$ `"abc"` |
| **`find(sub)`** | Search for substring | `int` | Returns `-1` if not found | `"python".find("th")` $\rightarrow$ `2` |
| **`index(sub)`** | Search for substring | `int` | Raises `ValueError` | `"python".index("z")` $\rightarrow$ Error |
| **`partition(sep)`**| Split into 3-tuple on 1st separator | `tuple` | Returns `(s, "", "")` if missing | `"a=b".partition("=")` $\rightarrow$ `('a','=','b')` |
| **`join(iterable)`**| Join sequence with delimiter | `str` | Elements must all be `str` | `",".join(['a','b'])` $\rightarrow$ `"a,b"` |

---

## Advanced Concepts: Building Custom Translation Tables

You can create complex multi-character substitution and deletion tables using `str.maketrans()` with dictionary mappings:

```python
# Custom phonetic leetspeak encoder using maketrans
LEET_TABLE = str.maketrans({
    "a": "4", "A": "4",
    "e": "3", "E": "3",
    "i": "1", "I": "1",
    "o": "0", "O": "0",
    "s": "5", "S": "5",
    "t": "7", "T": "7"
})

secret_message = "Enterprise Python Security Architecture"
encoded = secret_message.translate(LEET_TABLE)
print("Encoded Leetspeak:", encoded)
# Output: "3n73rpr153 Py7h0n 53cur17y 4rch173c7ur3"
```

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that takes an email address string (e.g., `"  Developer.Hesam@Gmail.Com  "`), strips leading/trailing whitespace, converts it to lowercase, and checks whether it ends with `@gmail.com` using `.endswith()`.

### Exercise 2 — Intermediate
Write a function `parse_query_string(query: str) -> dict[str, str]` that accepts a raw URL query string (e.g., `"name=Hesam&role=admin&active=true&tier=pro"`), splits on `&`, partitions on `=`, and returns a dictionary of key-value pairs.

### Exercise 3 — Advanced
Build a `LogNormalizer` class that processes dirty server logs. The class must: (1) strip ANSI color escape codes, (2) remove timestamps with `removeprefix()`, (3) extract the log level using `partition()`, (4) clean punctuation using `translate()`, and (5) return a structured dictionary.

---

## Mini Project: Production Log Parsing & Metric Extractor CLI

### Requirements
Build an end-to-end log parsing utility named `log_analyzer.py` that processes a batch of raw web server access logs, extracts IP addresses, HTTP methods, status codes, and response times using native string methods, and computes summary statistics.

### Implementation Blueprint
```python
class LogAnalyzer:
    @staticmethod
    def parse_log_line(line: str) -> dict | None:
        """Parse format: IP - [TIMESTAMP] "METHOD PATH PROTOCOL" STATUS_CODE DURATION_MS"""
        clean_line = line.strip()
        if not clean_line or clean_line.startswith("#"):
            return None  # Skip comments and empty lines
            
        try:
            # 1. Extract IP
            ip, sep, rest = clean_line.partition(" - ")
            
            # 2. Extract Timestamp
            time_part, sep, rest = rest.partition("] ")
            timestamp = time_part.removeprefix("[")
            
            # 3. Extract Request Line
            req_part, sep, rest = rest.partition('" ')
            raw_request = req_part.removeprefix('"')
            method, path, proto = raw_request.split()
            
            # 4. Extract Status Code and Duration
            status_str, duration_str = rest.split()
            
            return {
                "ip": ip.strip(),
                "timestamp": timestamp.strip(),
                "method": method.upper(),
                "path": path,
                "status_code": int(status_str),
                "duration_ms": float(duration_str.removesuffix("ms"))
            }
        except Exception as err:
            print(f"[PARSE ERROR] Failed on line: '{line}' ({err})")
            return None

if __name__ == "__main__":
    sample_logs = [
        '192.168.1.10 - [2024-05-18T10:14:22] "GET /api/v1/users HTTP/1.1" 200 45.2ms',
        '10.0.0.50 - [2024-05-18T10:14:23] "POST /api/v1/auth HTTP/1.1" 201 120.8ms',
        '192.168.1.10 - [2024-05-18T10:14:25] "GET /api/v1/restricted HTTP/1.1" 403 12.0ms',
        '# This is a comment line',
        '172.16.0.4 - [2024-05-18T10:14:28] "DELETE /api/v1/items/99 HTTP/1.1" 500 240.5ms',
    ]
    
    print("=" * 65)
    print("           PARSED PRODUCTION SERVER ACCESS LOGS")
    print("=" * 65)
    print(f"{'METHOD':<8} {'STATUS':<8} {'DURATION':>10} {'PATH':<25} {'CLIENT IP'}")
    print("-" * 65)
    
    for log in sample_logs:
        parsed = LogAnalyzer.parse_log_line(log)
        if parsed:
            print(f"{parsed['method']:<8} {parsed['status_code']:<8} {parsed['duration_ms']:>8.1f}ms {parsed['path']:<25} {parsed['ip']}")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's string methods and text manipulation engine:
- All string methods return **new string objects**, preserving string immutability.
- Use `casefold()` for international Unicode case-insensitive matching.
- **Never use `strip()` to remove prefixes or suffixes**; always use Python 3.9+ `removeprefix()` and `removesuffix()`.
- Use `partition()` for safe, high-speed 3-tuple splitting on delimiters.
- `startswith()` and `endswith()` accept tuples for multi-prefix checking.
- Leverage `str.maketrans()` and `translate()` for high-throughput character deletion and substitution at native C speed.

---

## Best Practices Checklist

- [ ] Use `removeprefix()` and `removesuffix()` for removing exact prefix/suffix strings.
- [ ] Use `casefold()` when comparing case-insensitive user inputs or international text.
- [ ] Use `partition()` when splitting strings on the first occurrence of a delimiter.
- [ ] Pass tuples to `startswith()` / `endswith()` to check multiple candidate prefixes simultaneously.
- [ ] Use `str.translate()` with `str.maketrans()` for high-performance bulk character replacement and stripping.

---

## What's Next?

Now that you have mastered string methods, continue to the final article in this module:
👉 **[String Slicing & Indexing](string-slicing.md)** to master zero-based indexing, negative strides, and zero-copy string extraction.
