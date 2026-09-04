# String Formatting & F-Strings in Python

## Introduction

In software development, raw computational outputs must almost always be formatted into clean, structured, human-readable representations. Whether an engineer is generating financial invoices, rendering command-line dashboard tables, assembling localized user interface messages, constructing HTTP URLs, or emitting structured diagnostic log streams, text formatting is a constant requirement.

Python's string formatting architecture has undergone a remarkable evolution over the language's lifespan. Python has advanced through three distinct formatting eras: the legacy C-style **`%`-formatting (printf style)**, the more flexible **`str.format()` method (PEP 3101)**, and modern **Formatted String Literals (f-strings, PEP 498)**.

Introduced in Python 3.6 and further formalized in Python 3.12 (PEP 701), **f-strings** have become the gold standard for text interpolation in Python. F-strings combine maximum readability, concise syntax, rich format specifiers (such as currency alignment, padding, and date formatting), and unmatched runtime performance because they are compiled directly into optimized virtual machine opcodes rather than parsed at runtime.

This lesson explores the full depth of string formatting in Python, mastering the **Format Specification Mini-Language**, self-documenting debugging expressions (`f"{expr=}"`), and the `__format__()` object protocol.

---

## Prerequisites

Before studying string formatting, ensure you have:

- Completed [Strings Fundamentals](../variables-data-types/strings.md) and [Integers & Floats](../variables-data-types/integers-floats.md).
- Familiarity with variables, expressions, and string concatenation.
- Access to the Python REPL to test format specifiers.

---

## Core Concept

String formatting allows dynamic expressions to be evaluated and embedded within a template string.

```
                           THE EVOLUTION OF PYTHON STRING FORMATTING

   ERA 1: %-Formatting (Legacy)       ERA 2: str.format() (Python 2.6+)     ERA 3: F-Strings (Python 3.6+)
   "User: %s, Score: %d" % (name, score)  "User: {}, Score: {}".format(name, score)  f"User: {name}, Score: {score}"
   • Verbose, rigid type codes        • Flexible positional/named args       • Cleanest syntax
   • Error-prone argument tuples      • Method call overhead at runtime      • Compiled directly to bytecode
   • Outdated                         • Good for reusable templates          • Blazing fast performance
```

### The Format Specification Mini-Language
Behind both `str.format()` and f-strings lies the **Format Specification Mini-Language**, accessed via a colon `:` after the expression:

```
{expression : [fill][align][sign][#][0][width][grouping][.precision][type]}
```
- **Fill / Align**: `<` (Left), `>` (Right), `^` (Center) with an optional fill character (e.g., `*^20`).
- **Sign**: `+` (Show sign for positive and negative), `-` (Show only for negative, default), ` ` (Leading space for positive).
- **Width**: Minimum number of characters allocated.
- **Grouping**: `,` (Comma thousands separator) or `_` (Underscore separator).
- **Precision**: `.N` (Decimal places for floats, max length for strings).
- **Type**: `f` (Fixed-point float), `d` (Decimal integer), `e` (Scientific), `%` (Percentage), `b` (Binary), `x` (Hex).

---

## Syntax & Common Formatting Patterns

```python
name = "Hesam"
balance = 12450.789
ratio = 0.854

# 1. Basic Variable Interpolation
print(f"Developer: {name}")

# 2. Number Precision and Commas
print(f"Account Balance : ${balance:,.2f}")  # $12,450.79

# 3. Percentage Formatting
print(f"Completion Rate : {ratio:.1%}")      # 85.4%

# 4. Text Alignment and Padding
print(f"{name:*^20}")                       # *******Hesam*******

# 5. Radix Base Conversions
number = 255
print(f"Hex: {number:02X}, Binary: {number:08b}")  # Hex: FF, Binary: 11111111

# 6. Self-Documenting Debug Expressions (Python 3.8+)
width = 1920
height = 1080
print(f"{width=}, {height=}")               # width=1920, height=1080
```

---

## Detailed Explanation

### 1. The Format Specification Mini-Language Breakdown

Let us dissect the anatomy of complex format specifiers:

```python
value = 42.5

# Pattern: ${value:+10.2f}
# Explanation:
#   '+'  -> Explicitly show plus sign for positive numbers
#   '10' -> Allocate minimum width of 10 characters
#   '.2' -> Round to 2 decimal places
#   'f'  -> Format as standard floating-point
print(f"Formatted: |{value:+10.2f}|")  # Output: |    +42.50|
```

#### Alignment Options:
```python
title = "SYSTEM"
print(f"|{title:<12}|")  # Left-aligned:   |SYSTEM      |
print(f"|{title:>12}|")  # Right-aligned:  |      SYSTEM|
print(f"|{title:^12}|")  # Center-aligned: |   SYSTEM   |
print(f"|{title:-^12}|") # Filled center:  |---SYSTEM---|
```

### 2. Date and Time Formatting in F-Strings

F-strings natively accept standard `strftime` format codes when formatting `datetime` objects:

```python
import datetime

now = datetime.datetime.now()
print(f"Current Date: {now:%Y-%m-%d %H:%M:%S}")
print(f"Readable    : {now:%A, %B %d, %Y}")
```

### 3. Python 3.12 Formalized F-Strings (PEP 701)

Before Python 3.12, f-strings had parser restrictions: you could not reuse quotes, backslashes were forbidden inside expressions, and nesting was limited. 

In Python 3.12+, f-strings use a generalized grammar:
- **Quote Reuse**: You can reuse the exact same quotes inside expressions: `f"User: {data['name']}"` works without escaping!
- **Multi-line Expressions and Comments**: You can include multi-line expressions and comments inside `{...}` blocks.
- **Arbitrary Nesting**: You can nest f-strings within f-strings without syntax errors.

```python
# Python 3.12+ Feature Demonstration:
scores = {"Alice": 95, "Bob": 82, "Charlie": 88}
print(f"Top Student: {
    # Inline comment inside expression
    max(scores, key=lambda k: scores[k])
} with Score: {scores[max(scores, key=lambda k: scores[k])]}")
```

### 4. Reusable Templates with `str.format()` and `string.Template`

While f-strings evaluate immediately at runtime, sometimes you need to store an un-evaluated string template in a database or configuration file to be populated later.

- **`str.format()`**: Use when the template is author-controlled:
  ```python
  EMAIL_TEMPLATE = "Hello {name}, your order #{order_id} is confirmed."
  message = EMAIL_TEMPLATE.format(name="Hesam", order_id="9821")
  ```
- **`string.Template`**: Use when templates are **provided by untrusted end-users**, preventing code execution vulnerabilities:
  ```python
  from string import Template
  user_template = Template("Hello $name, welcome to $site!")
  safe_message = user_template.safe_substitute(name="Alice", site="Portal")
  ```

---

## Examples

### 1. Simple: Basic Numerical Metrics Display
Formatting integer counters and percentage ratios.

```python
processed_tasks = 45
total_tasks = 50
progress_ratio = processed_tasks / total_tasks

print(f"Tasks Completed : {processed_tasks} / {total_tasks}")
print(f"Progress Bar    : {progress_ratio:.1%}")
```

### 2. Beginner: Currency and Financial Metric Formatting
Formatting monetary quantities with exact alignment and positive/negative indicators.

```python
transactions = [
    ("Client Invoice Payment", 14500.50),
    ("Cloud Server Hosting", -240.00),
    ("Software License", -89.99),
    ("Consulting Retainer", 5000.00),
]

print(f"{'Description':<25} {'Amount':>15}")
print("-" * 42)
for desc, amount in transactions:
    # Sign '+', width 14, comma separator, 2 decimals
    print(f"{desc:<25} ${amount:>+14,.2f}")
```

### 3. Intermediate: Formatted ASCII Terminal Table
Building a dynamically aligned terminal table with customized header borders.

```python
servers = [
    {"host": "web-prod-01", "ip": "192.168.1.10", "cpu_pct": 24.5, "mem_gb": 3.2, "status": "OK"},
    {"host": "db-primary", "ip": "192.168.1.20", "cpu_pct": 89.2, "mem_gb": 28.4, "status": "WARN"},
    {"host": "cache-redis", "ip": "192.168.1.30", "cpu_pct": 8.1, "mem_gb": 1.1, "status": "OK"},
]

header = f"{'HOSTNAME':<15} {'IP ADDRESS':<16} {'CPU USAGE':>10} {'MEMORY':>10} {'STATUS':^10}"
border = "=" * len(header)

print(border)
print(header)
print(border)
for s in servers:
    cpu_str = f"{s['cpu_pct']:.1f}%"
    mem_str = f"{s['mem_gb']:.1f} GB"
    print(f"{s['host']:<15} {s['ip']:<16} {cpu_str:>10} {mem_str:>10} {s['status']:^10}")
print(border)
```

### 4. Real-World: Structured Log Event Formatter
Formatting production application logs with ISO timestamps, process IDs, and aligned severity tags.

```python
import datetime
import os

def format_log_entry(level: str, module: str, message: str) -> str:
    timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]
    pid = os.getpid()
    # Format level in fixed 7-char width, uppercase
    return f"[{timestamp}] [PID:{pid:05d}] [{level.upper():^7}] [{module:<15}] : {message}"

print(format_log_entry("info", "auth_service", "User 'hesam' logged in successfully."))
print(format_log_entry("warn", "rate_limiter", "IP 192.168.1.50 exceeded 80% quota."))
print(format_log_entry("error", "database_pool", "Connection pool exhausted (max 50)."))
```

### 5. Advanced: Implementing the `__format__()` Protocol
Creating a custom `Coordinate` class that responds intelligently to different format specifiers (`:dms` for Degrees/Minutes/Seconds vs `:dec` for Decimal Degrees).

```python
class GeoCoordinate:
    def __init__(self, degrees: float):
        self.degrees = degrees

    def __format__(self, format_spec: str) -> str:
        if format_spec == "dms":
            # Convert decimal degrees to Degrees, Minutes, Seconds
            d = int(self.degrees)
            remainder = abs(self.degrees - d) * 60
            m = int(remainder)
            s = (remainder - m) * 60
            return f"{d}° {m}' {s:.1f}\""
        elif format_spec == "dec" or not format_spec:
            return f"{self.degrees:.6f}°"
        else:
            raise ValueError(f"Unknown format specifier '{format_spec}' for GeoCoordinate.")

latitude = GeoCoordinate(35.689197)

print(f"Decimal Format (Default) : {latitude}")
print(f"Explicit Decimal         : {latitude:dec}")
print(f"DMS Geographic Format    : {latitude:dms}")
```

---

## Code Explanation

In Example 5 (Custom `__format__` Protocol):
1. When Python encounters an f-string with a format specifier on a custom object (e.g., `{latitude:dms}`), it calls `latitude.__format__("dms")`.
2. The method receives the string `"dms"` as the `format_spec` parameter.
3. The method evaluates the specifier: if `"dms"`, it executes mathematical degree-minute-second conversions; if `"dec"`, it formats to 6 decimal places.
4. This demonstrates how Python's formatting language is completely extensible to domain-specific types (e.g., physical units, currency symbols, chemical formulas).

---

## Common Mistakes

### Mistake 1: Forgetting the `f` Prefix on F-Strings
Omitting the leading `f` leaves curly braces as raw literal characters without evaluating internal variables.

```python
# BROKEN:
name = "Hesam"
greeting = "Hello, {name}!"  # Missing 'f'! Evaluates to literal "Hello, {name}!"

# CORRECT:
greeting = f"Hello, {name}!" # Evaluates to "Hello, Hesam!"
```

### Mistake 2: Escaping Literal Braces Incorrectly
To display literal curly braces `{}` inside an f-string, you must double them: `{{` and `}}`.

```python
total = 100
# Prints: "The JSON payload is: {"count": 100}"
json_snippet = f'{{"count": {total}}}'
print(json_snippet)
```

---

## Best Practices

### Use `f"{expr=}"` for Clean, Rapid Debugging
Instead of writing `print(f"user_id = {user_id}, status = {status}")`, use the self-documenting `=` syntax.

Good:
```python
# Clean, modern Python 3.8+ debugging syntax
print(f"{user_id=}, {status=}, {len(items)=}")
```

Avoid:
```python
# Verbose manual labeling prone to copy-paste typos
print("user_id=" + str(user_id) + ", status=" + str(status) + ", len(items)=" + str(len(items)))
```

---

## Performance Considerations

1. **Bytecode Compilation**: The CPython compiler parses f-strings at compile time, generating specialized `FORMAT_VALUE` and `BUILD_STRING` opcodes.
2. **Speed Comparison Benchmark**:
   - `f"Hello {name}"` $\rightarrow$ ~ **15 nanoseconds** (Compiled opcode concatenation)
   - `"Hello %s" % name` $\rightarrow$ ~ **30 nanoseconds** (Tuple parsing)
   - `"Hello {}".format(name)` $\rightarrow$ ~ **65 nanoseconds** (Runtime function call overhead)
3. Standardizing on f-strings provides both maximum readability and maximum execution speed.

---

## Security Considerations

1. **Server-Side Template Injection (SSTI)**: Never evaluate f-strings or run `eval(f"...")` on untrusted user input. An attacker submitting `{__import__('os').system('rm -rf /')}` could achieve remote code execution.
2. **Use `string.Template` for User Input**: When building notification systems or email template editors where end-users define placeholders, always use `string.Template` or dedicated sandboxed template engines like Jinja2.

---

## Real-World Usage

- **Financial Ledgers**: Aligning credits, debits, and balance summaries with strict two-decimal currency formatting (`$1,250.00`).
- **Cloud Microservice Logging**: Emitting formatted JSON log lines and structured console traces with microsecond timestamps.
- **Command-Line Tools (CLI)**: Generating aligned summary tables and status bars in DevOps automation utilities.

---

## Comparison: String Formatting Paradigms

| Feature | F-Strings (`f"..."`) | `str.format()` | `%`-Formatting | `string.Template` |
|---|---|---|---|---|
| **Syntax Style** | Inline expressions `{var}` | Positional/Named `{0}` | C-style `%s`, `%d` | Placeholder `$var` |
| **Performance** | **Blazing Fast** (Bytecode) | Moderate (Method call)| Fast | Slower (Regex based) |
| **Readability** | Exceptional | High | Low / Cryptic | High |
| **Security for User Input**| Unsafe if `eval`'d | Moderate | Moderate | **Safe** (No code execution) |
| **Python Version** | Python 3.6+ (PEP 498) | Python 2.6+ (PEP 3101)| Python 1.0+ (Legacy) | Python 2.4+ |

---

## Advanced Concepts: The CPython `FORMAT_VALUE` Opcode

When CPython compiles an f-string like `f"Val: {x:04d}"`, it generates the following bytecode:

```
0 LOAD_CONST     'Val: '
2 LOAD_NAME      x
4 FORMAT_VALUE   (flags for specifier '04d')
6 BUILD_STRING   2
8 RETURN_VALUE
```

The `FORMAT_VALUE` opcode bypasses general Python function call overhead and executes specialized C routines directly within `Python/ceval.c`, resulting in the fastest possible string formatting implementation in the CPython runtime.

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that defines variables for your `first_name`, `last_name`, `age`, and `account_balance`. Print a formatted profile card using an f-string, displaying the full name, age, and balance formatted as currency with a dollar sign, thousands commas, and two decimal places.

### Exercise 2 — Intermediate
Write a function `generate_receipt(items: list[tuple[str, int, float]]) -> str` that accepts a list of `(item_name, quantity, unit_price)`. Format and return an aligned receipt string containing columns for Item Name (left-aligned 20 chars), Qty (center-aligned 6 chars), Unit Price (right-aligned 10 chars), and Total (right-aligned 12 chars), complete with a bottom grand total row.

### Exercise 3 — Advanced
Create a custom class named `FileSize` that stores an integer number of bytes. Implement `__format__()` such that:
- `{size:B}` returns raw bytes (e.g., `"1048576 B"`).
- `{size:KB}` returns kilobytes (e.g., `"1024.00 KB"`).
- `{size:MB}` returns megabytes (e.g., `"1.00 MB"`).
- `{size:GB}` returns gigabytes (e.g., `"0.001 GB"`).
- `{size:auto}` automatically formats to the most readable unit.

---

## Mini Project: Enterprise Financial Summary & Invoice Report Generator

### Requirements
Build an automated financial invoice generator named `invoice_formatter.py` that ingests invoice metadata, computes line totals, taxes, and discounts, and renders a production-quality ASCII invoice card using advanced format specifiers.

### Implementation Blueprint
```python
import datetime

class InvoiceFormatter:
    def __init__(self, company_name: str, invoice_num: str, client_name: str):
        self.company = company_name
        self.invoice_num = invoice_num
        self.client = client_name
        self.items = []
        self.date = datetime.datetime.now()

    def add_line_item(self, desc: str, hours: float, hourly_rate: float):
        total = hours * hourly_rate
        self.items.append((desc, hours, hourly_rate, total))

    def render_invoice(self, tax_rate: float = 0.085) -> str:
        width = 62
        border_heavy = "=" * width
        border_light = "-" * width
        
        lines = [
            border_heavy,
            f"{self.company:^62}",
            f"{'INVOICE / BILL OF SERVICES':^62}",
            border_heavy,
            f"Invoice #: {self.invoice_num:<20} Date: {self.date:%Y-%m-%d %H:%M}",
            f"Client   : {self.client:<45}",
            border_light,
            f"{'DESCRIPTION':<28} {'HOURS':>8} {'RATE':>10} {'AMOUNT':>12}",
            border_light
        ]
        
        subtotal = 0.0
        for desc, hrs, rate, total in self.items:
            subtotal += total
            lines.append(f"{desc:<28} {hrs:>8.1f} {f'${rate:.2f}':>10} {f'${total:,.2f}':>12}")
            
        tax_amount = subtotal * tax_rate
        grand_total = subtotal + tax_amount
        
        lines.extend([
            border_light,
            f"{'Subtotal:':<48} {f'${subtotal:>10,.2f}'}",
            f"{f'Tax ({tax_rate:.1%}):':<48} {f'${tax_amount:>10,.2f}'}",
            border_heavy,
            f"{'TOTAL AMOUNT DUE:':<48} {f'${grand_total:>10,.2f}'}",
            border_heavy,
            f"{'Thank you for your business!':^62}",
            border_heavy
        ])
        
        return "\n".join(lines)

if __name__ == "__main__":
    invoice = InvoiceFormatter(
        company_name="Apex Cloud Architecture LLC",
        invoice_num="INV-2024-884",
        client_name="Starlight Media Enterprise Inc."
    )
    invoice.add_line_item("Backend API Microservice Dev", 35.5, 120.00)
    invoice.add_line_item("PostgreSQL Database Migration", 12.0, 140.00)
    invoice.add_line_item("CI/CD Pipeline Configuration", 8.0, 110.00)
    
    print(invoice.render_invoice(tax_rate=0.0825))
```

---

## Summary

In this lesson, you mastered Python's string formatting architecture:
- Modern Python standardizes on **F-Strings (PEP 498 / PEP 701)** for concise, readable, and high-speed string formatting.
- The **Format Specification Mini-Language** controls width, alignment (`<`, `>`, `^`), numeric precision (`:.2f`), grouping (`:,`), and base conversions (`:08b`, `:02X`).
- Use self-documenting expressions `f"{variable=}"` for clean debugging.
- Use `string.Template` when handling untrusted user-provided templates to prevent code injection.
- Implement `__format__()` on custom classes to support custom domain format specifiers.

---

## Best Practices Checklist

- [ ] Use f-strings (`f"..."`) as the default formatting mechanism in all modern Python code.
- [ ] Format monetary values with commas and two decimals (`f"${amount:,.2f}"`).
- [ ] Use `f"{variable=}"` for debugging output instead of manual string labeling.
- [ ] Escape literal curly braces in f-strings by doubling them (`{{` and `}}`).
- [ ] Never use `eval()` on untrusted f-strings; use `string.Template` for user templates.

---

## What's Next?

Now that you have mastered string formatting, continue to:
👉 **[String Methods](string-methods.md)** to master Python's exhaustive library of string transformation, search, stripping, and validation methods.
