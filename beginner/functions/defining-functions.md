# Defining Functions & Execution Model in Python

## Introduction

In software engineering, complexity is the primary adversary of software reliability. As application codebases expand from simple scripts into enterprise systems containing tens of thousands of lines of code, managing complexity requires dividing large computational tasks into small, self-contained, and reusable modular units. In Python, this foundational unit of modularity is the **Function**.

Functions embody one of the most fundamental principles in computer science: **DRY (Don't Repeat Yourself)**. Instead of copying and pasting similar code logic across multiple files, developers encapsulate instructions inside a named function, exposing a clear interface of input parameters and output return values. Functions facilitate unit testing, simplify refactoring, reduce bug density, and make codebases self-documenting.

In Python, functions are not mere syntactic subroutines; they are **First-Class Citizens (First-Class Objects)**. A function in Python is a full-fledged object instantiated on the heap (`PyFunctionObject`). It can be assigned to variables, passed as arguments into other functions, returned from functions, stored inside lists and dictionaries, and inspected dynamically at runtime.

This lesson opens **Module 7: Functions & Scope**, exploring function definitions, the execution call stack, frame allocation mechanics, return value protocols, and the distinction between pure functions and side-effect mutations.

---

## Prerequisites

Before studying function definitions, ensure you have:

- Completed [Module 5: Control Flow](../control-flow/README.md).
- Completed [Module 6: Built-in Collections](../collections/README.md).
- A solid understanding of variable assignment and memory referencing.

---

## Core Concept

When you define a function with `def`, Python compiles the code block into a `PyCodeObject` and binds the function name to a new `PyFunctionObject` on the heap.

```
                           THE CPYTHON FUNCTION CALL STACK

       [ Global Frame ]
       ├── user_id = 101
       └── main() ──────────────► [ Pushes New Execution Frame ]
                                  │
                                  ▼
                          [ main() Frame ]
                          ├── subtotal = 150.0
                          └── calculate_tax(150.0) ──► [ Pushes New Frame ]
                                                       │
                                                       ▼
                                              [ calculate_tax() Frame ]
                                              ├── amount = 150.0
                                              ├── rate = 0.08
                                              └── return 12.0 ──┐
                                                                │ (Pops Frame &
                                  ┌─────────────────────────────┘  Returns Value)
                                  ▼
                          [ main() Frame ]
                          └── total = 162.0
```

### Key Execution Rules:
1. **Definition vs Execution**: Defining a function (`def my_func():`) compiles the code but **does not execute it**. The code executes only when the function is invoked with parentheses `my_func()`.
2. **Every Function Returns a Value**: If a function executes an explicit `return value`, it returns that object; if it reaches the end of the block without a `return` (or executes a bare `return`), Python **implicitly returns `None`**.
3. **Execution Frame Isolation**: Each function call creates an isolated local execution frame (`PyFrameObject`) containing its own private local variables. When the function returns, its frame is popped from the call stack and its local memory is reclaimed.

---

## Syntax & Essential Function Patterns

```python
# 1. Basic Function with Return Value
def calculate_cylinder_volume(radius: float, height: float) -> float:
    """Calculate the geometric volume of a cylinder."""
    pi = 3.141592653589793
    return pi * (radius ** 2) * height

vol = calculate_cylinder_volume(3.0, 10.0)
print(f"Cylinder Volume: {vol:.2f}")

# 2. Returning Multiple Values via Tuple Packing
def get_min_max(numbers: list[float]) -> tuple[float, float]:
    return min(numbers), max(numbers)

low, high = get_min_max([12.5, 4.0, 99.2, 55.0])

# 3. Early Return (Guard Clause Pattern)
def divide_safely(a: float, b: float) -> float | None:
    if b == 0.0:
        return None  # Early exit on invalid input
    return a / b

# 4. Functions as First-Class Objects
def square(x: int) -> int:
    return x * x

my_function_reference = square
print("Invoking via reference:", my_function_reference(5))  # 25
```

---

## Detailed Explanation

### 1. The `return` Statement and Implicit `None`

The `return` statement immediately halts execution of the function and transmits the evaluated expression back to the caller frame.

If a function performs actions (such as writing to a file or printing to the terminal) without returning data, it is known as a **Void / Side-Effect Function**. In Python, void functions always evaluate to `None`:

```python
def log_event(message: str):
    print(f"[AUDIT LOG] {message}")
    # No return statement

result = log_event("User login")
print("Return value of log_event:", result)  # None
```

### 2. First-Class Functions: Functions as Data

Because functions are first-class objects, you can treat functions exactly like integers, strings, or lists:

- **Storing in Collections**:
  ```python
  math_operations = [math.sin, math.cos, math.tan]
  ```
- **Passing to Higher-Order Functions**:
  ```python
  def execute_twice(func, value):
      return func(func(value))
      
  print(execute_twice(lambda x: x + 10, 5))  # (5 + 10) + 10 = 25
  ```
- **Returning Functions from Functions (Closures & Factories)**:
  ```python
  def make_multiplier(factor: int):
      def multiplier(x: int) -> int:
          return x * factor
      return multiplier

  double = make_multiplier(2)
  print(double(10))  # 20
  ```

### 3. Pure Functions vs Side-Effect Functions

In software architecture, distinguishing between pure functions and side effects is critical for writing testable code:

- **Pure Function**: Given the exact same inputs, it **always returns the exact same output**, and causes **zero observable side effects** (does not mutate global variables, modify caller arguments, or write to external files/networks).
- **Impure Function**: Modifies global state, mutates input lists in place, or interacts with external I/O (printers, databases, clocks).

```python
# PURE FUNCTION: Deterministic, thread-safe, trivial to unit test
def pure_add_tax(subtotal: float, tax_rate: float) -> float:
    return subtotal * (1.0 + tax_rate)

# IMPURE FUNCTION: Depends on hidden mutable global state
GLOBAL_TAX_RATE = 0.08
def impure_add_tax(subtotal: float) -> float:
    return subtotal * (1.0 + GLOBAL_TAX_RATE)
```

---

## Examples

### 1. Simple: Temperature Conversion Utilities
Writing pure mathematical functions with type hints.

```python
def celsius_to_fahrenheit(celsius: float) -> float:
    """Convert temperature in Celsius to Fahrenheit."""
    return (celsius * 9 / 5) + 32.0

def fahrenheit_to_celsius(fahrenheit: float) -> float:
    """Convert temperature in Fahrenheit to Celsius."""
    return (fahrenheit - 32.0) * 5 / 9

print(f"100°C in Fahrenheit : {celsius_to_fahrenheit(100):.1f}°F")
print(f"72°F in Celsius     : {fahrenheit_to_celsius(72):.1f}°C")
```

### 2. Beginner: Formatted Header Builder with Default Multipliers
Encapsulating text formatting logic inside a reusable function.

```python
def render_section_banner(title: str, width: int = 50, char: str = "=") -> str:
    """Render a centered banner with customizable width and border characters."""
    border = char * width
    centered_title = f" {title.strip()} "
    return f"{border}\n{centered_title:^{width}}\n{border}"

print(render_section_banner("DATABASE INITIALIZATION"))
print(render_section_banner("SECURITY AUDIT", width=35, char="-"))
```

### 3. Intermediate: Functional Dispatch Table
Dispatching commands dynamically by storing function references in a dictionary.

```python
def handle_ping(args: list[str]) -> str:
    return "PONG"

def handle_echo(args: list[str]) -> str:
    return " ".join(args)

def handle_status(args: list[str]) -> str:
    return "STATUS: OK | Active Workers: 4"

# Function Dispatch Registry
COMMAND_REGISTRY = {
    "ping": handle_ping,
    "echo": handle_echo,
    "status": handle_status,
}

def dispatch_command(raw_input: str) -> str:
    parts = raw_input.strip().split()
    if not parts:
        return "ERROR: Empty command"
        
    cmd_name = parts[0].lower()
    cmd_args = parts[1:]
    
    # Resolve function object from dictionary
    handler = COMMAND_REGISTRY.get(cmd_name)
    if handler is None:
        return f"ERROR: Command '{cmd_name}' not found."
        
    return handler(cmd_args)

print(dispatch_command("ping"))
print(dispatch_command("echo Hello Distributed System!"))
print(dispatch_command("status"))
print(dispatch_command("unknown_cmd"))
```

### 4. Real-World: Multi-Stage Composable Data Pipeline
Building a functional data pipeline where clean, pure functions transform user records sequentially.

```python
def clean_whitespace(record: dict) -> dict:
    """Strip extraneous whitespace from string fields."""
    return {k: (v.strip() if isinstance(v, str) else v) for k, v in record.items()}

def normalize_email(record: dict) -> dict:
    """Normalize email address to lowercase."""
    rec = record.copy()
    if "email" in rec:
        rec["email"] = rec["email"].lower()
    return rec

def validate_age_eligibility(record: dict) -> dict:
    """Add a boolean flag indicating if user is 18+."""
    rec = record.copy()
    rec["is_adult"] = rec.get("age", 0) >= 18
    return rec

def apply_pipeline(data: dict, pipeline_stages: list) -> dict:
    """Pass data through a series of transformation functions."""
    current_data = data
    for stage_func in pipeline_stages:
        current_data = stage_func(current_data)
    return current_data

# Assemble Pipeline
user_etl_pipeline = [clean_whitespace, normalize_email, validate_age_eligibility]

raw_user = {
    "name": "   Hesam Pourabbasain  ",
    "email": "  HESAM@Domain.COM  ",
    "age": 30
}

processed_user = apply_pipeline(raw_user, user_etl_pipeline)
print("Pipeline Output:\n", processed_user)
```

### 5. Advanced: Inspecting Stack Frames and Calling Metadata
Using `sys._getframe()` to inspect runtime call stack frames dynamically.

```python
import sys

def trace_caller_info():
    """Inspect the execution frame of the function that called this function."""
    caller_frame = sys._getframe(1)  # Frame 1 is the immediate caller
    code = caller_frame.f_code
    print(f"  [TRACE] Called by function : '{code.co_name}'")
    print(f"  [TRACE] In file            : '{code.co_filename.split('/')[-1]}'")
    print(f"  [TRACE] At line number     : {caller_frame.f_lineno}")
    print(f"  [TRACE] Caller local vars  : {caller_frame.f_locals}")

def process_secure_transaction(account_id: str, amount: float):
    print(f"Initiating transfer of ${amount} for {account_id}...")
    trace_caller_info()

def execute_batch():
    batch_tx_id = "TX-9901"
    process_secure_transaction("ACC-4482", 500.0)

execute_batch()
```

---

## Code Explanation

In Example 5 (Inspecting Stack Frames):
1. `sys._getframe(depth)` accesses the active `PyFrameObject` on CPython's execution stack.
2. Passing `depth=1` retrieves the frame of the caller function (`execute_batch`).
3. `caller_frame.f_code` provides access to the compiled `PyCodeObject`, revealing the caller's function name (`co_name`) and line number.
4. `caller_frame.f_locals` accesses the caller frame's private local variable dictionary (`batch_tx_id`).
5. This illustrates that function calls are physical execution frames managed deterministically on CPython's runtime stack.

---

## Common Mistakes

### Mistake 1: Confusing `print()` with `return`
Beginners often use `print()` inside a function and wonder why assigning the result to a variable yields `None`.

```python
# BROKEN:
def add(a, b):
    print(a + b)  # Prints, but does NOT return!

result = add(5, 10)  # Prints 15
print("Result is:", result)  # "Result is: None" ❌

# CORRECT:
def add(a, b):
    return a + b

result = add(5, 10)
print("Result is:", result)  # "Result is: 15" ✅
```

### Mistake 2: Missing Parentheses When Calling a Function
Writing `func` references the function object itself; writing `func()` actually executes the function.

```python
# BROKEN:
# current_time = time.time  # Binds function object reference!

# CORRECT:
# current_time = time.time() # Calls function and returns float!
```

---

## Best Practices

### Adhere to the Single Responsibility Principle (SRP)
Every function should do **one thing, do it well, and have a clear name describing that action**. If a function performs validation, database querying, data calculation, and file writing all in one giant block, refactor it into smaller, single-responsibility functions.

Good:
```python
def validate_invoice(invoice: dict) -> bool: ...
def calculate_tax(amount: float) -> float: ...
def persist_invoice(invoice: dict) -> None: ...
```

Avoid:
```python
def process_everything_for_invoice(invoice: dict) -> None: ...
```

---

## Performance Considerations

1. **Function Call Overhead**: Calling a function in Python involves pushing a new `PyFrameObject` onto the C stack, which takes ~50 nanoseconds. While negligible in 99% of applications, in extreme performance-critical loops processing 50,000,000 mathematical iterations, inlining simple arithmetic expressions can reduce overhead.
2. **Bytecode `CALL` Optimization (Python 3.11+)**: Python 3.11 specialized adaptive interpreter accelerates standard C-level function and method dispatching.

---

## Security Considerations

1. **Dynamic Function Invocation Risks**: When dispatching functions from user input (e.g., in RPC servers or CLI parsers), **never use `eval()` or `globals()[user_input]()`**. Always validate input against a strict, explicit whitelist dictionary dispatch table.
2. **Side-Effect State Pollution**: Functions that mutate global state can create subtle race conditions and security leaks across concurrent web requests. Strive for pure, side-effect-free functions.

---

## Real-World Usage

- **Web Framework Route Handlers (FastAPI / Flask / Django)**: Mapping HTTP URL routes directly to endpoint controller functions (`@app.get("/users") def get_users(): ...`).
- **Data Engineering Pipelines**: Chaining data cleaning, filtering, and aggregation functions over Apache Spark or Pandas dataframes.
- **Unit Testing**: Wrapping discrete units of business logic in testable functions verified by test runners (`pytest`).

---

## Comparison: Python Callable Types

| Type | Definition Syntax | First-Class? | Primary Purpose |
|---|---|---|---|
| **Standard Function** | `def name(args):` | **Yes** | General modular procedural logic |
| **Anonymous Lambda** | `lambda x: x * 2` | **Yes** | Inline single-expression callables |
| **Class Method** | `def method(self):` | **Yes** | Object-oriented stateful operations |
| **Generator Function**| `def gen(): yield x`| **Yes** | Lazy sequence streaming pipelines |

---

## Advanced Concepts: The `__code__` Object Attributes

Every Python function instance possesses a `__code__` attribute containing the compiled bytecode metadata:

```python
def calculate_metrics(subtotal: float, discount: float = 0.0) -> float:
    tax = subtotal * 0.08
    return subtotal + tax - discount

code = calculate_metrics.__code__
print("Function Name     :", code.co_name)
print("Arg Count         :", code.co_argcount)
print("Local Var Names   :", code.co_varnames)
print("Constants         :", code.co_consts)
print("Raw Opcodes (Hex) :", code.co_code.hex()[:20] + "...")
```

This introspection capability enables decorators, debuggers (`pdb`), profilers (`cProfile`), and serialization frameworks to analyze Python code dynamically.

---

## Exercises

### Exercise 1 — Beginner
Write a function `calculate_rectangle_area(length: float, width: float) -> float` that validates that both inputs are positive numbers (raising a `ValueError` if negative or zero) and returns the area.

### Exercise 2 — Intermediate
Write a function `sanitize_contact_record(name: str, phone: str, email: str) -> dict` that cleans whitespace, formats the name in Title Case, ensures the phone contains only digits, lowercases the email, and returns a dictionary of sanitized fields.

### Exercise 3 — Advanced
Build a functional pipeline runner `compose(*functions)` that accepts an arbitrary number of single-argument functions and returns a new function representing their mathematical composition:

$$(f \circ g \circ h)(x) = f(g(h(x)))$$

Test it with three mathematical functions.

---

## Mini Project: Modular Financial Tax & Discount Processing Pipeline

### Requirements
Build an end-to-end invoice pricing engine named `pricing_pipeline.py` that encapsulates discrete calculation rules into pure functions, composes them into an automated pricing workflow, and generates a detailed financial ledger.

### Implementation Blueprint
```python
class PricingEngine:
    @staticmethod
    def apply_bulk_discount(subtotal: float, item_count: int) -> tuple[float, float]:
        """Apply 10% discount if item count >= 5."""
        if item_count >= 5:
            discount = subtotal * 0.10
            return subtotal - discount, discount
        return subtotal, 0.0

    @staticmethod
    def apply_vip_coupon(subtotal: float, is_vip: bool) -> tuple[float, float]:
        """Apply flat $25 VIP discount on orders over $100."""
        if is_vip and subtotal >= 100.0:
            coupon = 25.0
            return subtotal - coupon, coupon
        return subtotal, 0.0

    @staticmethod
    def calculate_sales_tax(subtotal: float, state_code: str) -> float:
        """Calculate state sales tax."""
        TAX_RATES = {"CA": 0.0925, "NY": 0.08875, "TX": 0.0825, "FL": 0.060}
        rate = TAX_RATES.get(state_code.upper(), 0.05)  # Default 5%
        return subtotal * rate

    @classmethod
    def calculate_final_invoice(cls, items: list[dict], state: str, is_vip: bool) -> dict:
        raw_subtotal = sum(item["price"] * item["qty"] for item in items)
        total_items = sum(item["qty"] for item in items)
        
        # Step 1: Bulk Discount
        after_bulk, bulk_saved = cls.apply_bulk_discount(raw_subtotal, total_items)
        
        # Step 2: VIP Coupon
        after_coupon, coupon_saved = cls.apply_vip_coupon(after_bulk, is_vip)
        
        # Step 3: Sales Tax
        tax_amount = cls.calculate_sales_tax(after_coupon, state)
        
        grand_total = after_coupon + tax_amount
        
        return {
            "raw_subtotal": round(raw_subtotal, 2),
            "bulk_discount": round(bulk_saved, 2),
            "vip_coupon": round(coupon_saved, 2),
            "net_subtotal": round(after_coupon, 2),
            "tax_amount": round(tax_amount, 2),
            "grand_total": round(grand_total, 2)
        }

if __name__ == "__main__":
    order_items = [
        {"desc": "Developer Mechanical Keyboard", "price": 140.00, "qty": 2},
        {"desc": "4K Ultra-Wide Monitor", "price": 450.00, "qty": 1},
        {"desc": "Thunderbolt 4 Cable", "price": 25.00, "qty": 3},
    ]
    
    invoice = PricingEngine.calculate_final_invoice(order_items, state="CA", is_vip=True)
    
    print("=" * 55)
    print("             MODULAR INVOICE PRICING REPORT")
    print("=" * 55)
    print(f"Raw Items Subtotal  : ${invoice['raw_subtotal']:>9.2f}")
    print(f"Bulk Order Discount : -${invoice['bulk_discount']:>8.2f}")
    print(f"VIP Coupon Discount : -${invoice['vip_coupon']:>8.2f}")
    print(f"Net Subtotal        : ${invoice['net_subtotal']:>9.2f}")
    print(f"State Sales Tax     : +${invoice['tax_amount']:>8.2f}")
    print("-" * 55)
    print(f"FINAL AMOUNT DUE    : ${invoice['grand_total']:>9.2f}")
    print("=" * 55)
```

---

## Summary

In this lesson, you mastered Python's function architecture and execution model:
- Functions encapsulate logic, eliminate duplication (DRY), and create clean modular interfaces.
- Defining a function compiles a `PyCodeObject`; invoking it allocates a runtime `PyFrameObject` on the call stack.
- Every function returns a value: explicit `return value` or implicit `None`.
- Functions are **First-Class Objects** that can be assigned to variables, stored in collections, and passed as arguments.
- Prefer **pure functions** without side-effects for testable, predictable software architectures.

---

## Best Practices Checklist

- [ ] Design functions around the Single Responsibility Principle (SRP).
- [ ] End functions with explicit return statements when data output is expected.
- [ ] Use guard clauses and early returns to eliminate nested indentation.
- [ ] Strive for pure functions that do not mutate global variables.
- [ ] Give functions descriptive, verb-based snake_case names (`calculate_tax`, `validate_user`).

---

## What's Next?

Now that you understand function definitions and the execution model, continue to:
👉 **[Parameters & Arguments](parameters-and-arguments.md)** to master positional, keyword, default, `*args`, `**kwargs`, and positional-only arguments.
