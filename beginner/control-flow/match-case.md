# Structural Pattern Matching in Python (Match / Case)

## Introduction

In modern software systems, applications frequently ingest, validate, and route complex, heterogeneous data structures—such as nested JSON payloads from REST APIs, command tokens from terminal CLI tools, Abstract Syntax Tree (AST) nodes in compilers, or polymorphic events in distributed message brokers. Historically, unpacking and validating these nested structures in Python required verbose, error-prone chains of `if isinstance(...)`, `if "key" in ...`, and manual index slicing.

Introduced in **Python 3.10** via **PEP 634, PEP 635, and PEP 636**, **Structural Pattern Matching (`match` / `case`)** revolutionized how Python handles conditional data inspection.

Many programmers initially assume that `match`/`case` is merely Python's version of the traditional C or Java `switch` statement. While it can certainly perform simple scalar switching, `match`/`case` is vastly more powerful: it matches against the **structure, shape, types, and values** of objects simultaneously, destructuring collections and binding variables dynamically in a single declarative statement.

This lesson concludes **Module 5: Control Flow**, giving you mastery over modern pattern matching and preparing you for the in-depth exploration of built-in collections in the next module.

---

## Prerequisites

Before studying structural pattern matching, ensure you have:

- Python **3.10 or higher** installed on your workstation.
- Completed [Conditional Statements](conditional-statements.md), [For Loops](for-loops.md), and [Break, Continue & Pass](break-continue-pass.md).
- Familiarity with basic data structures (lists, tuples, dictionaries) and custom classes.

---

## Core Concept

Structural pattern matching evaluates a `subject` expression against a series of `case` patterns. When a pattern matches the shape and content of the subject, Python binds any variables defined in the pattern and executes the corresponding block.

```
                           STRUCTURAL PATTERN MATCHING FLOW

                                     [ match subject ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (Match Pattern 1 & Guard)                 ▼ (No Match)
             [ Bind Variables & Exec ]                    [ Test Pattern 2... ]
                       │                                           │
                       │                       ┌───────────────────┴───────────────────┐
                       │                       ▼ (Match Pattern 2)                     ▼ (No Match)
                       │             [ Bind Variables & Exec ]                    [ Test Wildcard case _ ]
                       │                       │                                           │
                       └───────────────────────┴───────────────────────────────────────────┘
                                                       │
                                                       ▼
                                            [ Continue Program ]
```

### Key Pattern Types:
1. **Literal Pattern**: Matches exact values (`case 200:`, `case "admin":`).
2. **Capture Pattern**: Matches any value and binds it to a variable name (`case [first, second]:`).
3. **Wildcard Pattern**: `case _:` acts as the default catch-all (does not bind a variable).
4. **OR Pattern**: Combines multiple alternatives with `|` (`case 401 | 403:`).
5. **Sequence Pattern**: Matches lists and tuples by shape, supporting `*rest` slicing.
6. **Mapping Pattern**: Matches dictionaries containing specific required keys.
7. **Class Pattern**: Matches instances of classes (`case Point(x=0, y=y):`).
8. **Guards**: Adds an extra boolean condition with `if` (`case [x, y] if x == y:`).

---

## Syntax & Essential Patterns

```python
# 1. Literal and OR Patterns
status_code = 404

match status_code:
    case 200:
        print("OK")
    case 401 | 403:
        print("Authentication / Authorization Error")
    case 404:
        print("Not Found")
    case 500 | 502 | 503:
        print("Server Internal Error")
    case _:
        print(f"Unhandled Status Code: {status_code}")

# 2. Sequence Destructuring with Capture
command = ["move", "player_1", 10, 20]

match command:
    case ["quit"]:
        print("Quitting game...")
    case ["move", player, x, y]:
        print(f"Moving {player} to coordinates ({x}, {y})")
    case ["attack", player, *weapons]:
        print(f"{player} attacking with weapons: {weapons}")
    case _:
        print("Invalid command format.")
```

---

## Detailed Explanation

### 1. Soft Keywords: `match` and `case`

In Python 3.10+, `match` and `case` are **Soft Keywords**. This means they are recognized as keywords only within pattern matching statements. You can still safely use `match` and `case` as standard variable names or function names elsewhere in your code without breaking backward compatibility:

```python
# Fully legal Python 3.10+ code:
match = "regex_match"
case = 42

match case:
    case 42:
        print("Matched case 42!")
```

### 2. The Capture Variable Trap vs Dotted Constants

A critical pitfall in pattern matching is attempting to compare against an existing variable name:

```python
EXPECTED_STATUS = 200
response = 404

# BROKEN:
match response:
    case EXPECTED_STATUS:  # WARNING: This does NOT compare against 200!
        # It treats EXPECTED_STATUS as a CAPTURE variable, binding 404 to it!
        print("Matched!", EXPECTED_STATUS)  # Prints "Matched! 404" ❌
```

**Rule**: Any simple, unadorned identifier in a `case` pattern is treated as a **Capture Pattern** (it assigns the value). To compare against a constant, you **must use a dotted name** (such as an Enum or class attribute) or a guard clause:

```python
from enum import IntEnum

class HTTPStatus(IntEnum):
    OK = 200
    NOT_FOUND = 404

match response:
    case HTTPStatus.OK:  # Dotted name -> Evaluates as equality check! ✅
        print("Success 200")
    case HTTPStatus.NOT_FOUND:
        print("Resource missing 404")
```

### 3. Mapping Patterns: Partial Key Matching

Unlike sequence patterns (which must match the exact length unless `*rest` is used), **Mapping Patterns match partially**. A dictionary matches if it contains the specified keys, even if it contains dozens of additional keys!

```python
event = {"type": "CLICK", "x": 100, "y": 250, "timestamp": 1716000000, "device": "mobile"}

match event:
    # Matches because 'type', 'x', and 'y' exist, ignoring timestamp and device!
    case {"type": "CLICK", "x": x_pos, "y": y_pos}:
        print(f"Click registered at ({x_pos}, {y_pos})")
```

---

## Examples

### 1. Simple: HTTP Status Code Switcher
Handling status codes with consolidated OR patterns and wildcard fallbacks.

```python
def describe_http_status(code: int) -> str:
    match code:
        case 200 | 201 | 204:
            return "2xx: Success"
        case 301 | 302:
            return "3xx: Redirection"
        case 400 | 401 | 403 | 404:
            return "4xx: Client Error"
        case 500 | 502 | 503 | 504:
            return "5xx: Server Error"
        case _:
            return f"Unknown status code: {code}"

print(describe_http_status(201))
print(describe_http_status(404))
print(describe_http_status(999))
```

### 2. Beginner: CLI Command Parser with Sequence Patterns
Parsing command-line input strings into structured command actions.

```python
def execute_cli_command(raw_input: str):
    tokens = raw_input.strip().split()
    
    match tokens:
        case ["exit" | "quit"]:
            print("Shutting down CLI session.")
        case ["help"]:
            print("Available commands: show, get <id>, set <key> <val>, delete <id>")
        case ["get", str(item_id)]:
            print(f"Fetching record ID: {item_id}")
        case ["set", key, value]:
            print(f"Setting configuration '{key}' = '{value}'")
        case ["delete", item_id, "--force"]:
            print(f"FORCE deleting item ID: {item_id} (Skipping confirmation)")
        case ["delete", item_id]:
            print(f"Safely deleting item ID: {item_id} (Prompting user confirmation)")
        case _:
            print(f"Unrecognized command syntax: '{raw_input}'")

execute_cli_command("get 8821")
execute_cli_command("set max_conns 100")
execute_cli_command("delete 404 --force")
execute_cli_command("invalid syntax here")
```

### 3. Intermediate: Polymorphic API Payload Dispatcher with Mapping Patterns
Validating and processing diverse JSON webhook payloads from an external service.

```python
def process_webhook_payload(payload: dict) -> str:
    match payload:
        # Match user registration event
        case {"event": "USER_SIGNUP", "data": {"user_id": uid, "email": email}}:
            return f"Enrolling new user #{uid} ({email})"
            
        # Match billing payment failure with nested amounts
        case {"event": "PAYMENT_FAILED", "data": {"invoice_id": inv, "amount": amt, "currency": curr}}:
            return f"Alerting billing team: Invoice {inv} failed for {amt} {curr}"
            
        # Match telemetry metric report
        case {"event": "METRIC_REPORT", "metrics": list(metrics_list)}:
            return f"Ingested {len(metrics_list)} system metrics"
            
        # Fallback for malformed payload
        case _:
            return f"Unhandled or malformed webhook payload: {payload.get('event', 'NO_EVENT')}"

print(process_webhook_payload({
    "event": "USER_SIGNUP",
    "data": {"user_id": 402, "email": "hesam@domain.com", "ip": "192.168.1.1"}
}))
print(process_webhook_payload({
    "event": "PAYMENT_FAILED",
    "data": {"invoice_id": "INV-99", "amount": 149.50, "currency": "USD"}
}))
```

### 4. Real-World: Mathematical Abstract Syntax Tree (AST) Evaluator
Evaluating recursive mathematical expression trees using structural pattern matching.

```python
def evaluate_ast(node: tuple | int | float) -> float:
    """Recursively evaluate an AST expression tree represented as nested tuples."""
    match node:
        # Base case: scalar numbers
        case int(val) | float(val):
            return float(val)
            
        # Binary arithmetic operations
        case ("+", left, right):
            return evaluate_ast(left) + evaluate_ast(right)
        case ("-", left, right):
            return evaluate_ast(left) - evaluate_ast(right)
        case ("*", left, right):
            return evaluate_ast(left) * evaluate_ast(right)
        case ("/", left, right):
            divisor = evaluate_ast(right)
            if divisor == 0:
                raise ZeroDivisionError("Division by zero in AST expression.")
            return evaluate_ast(left) / divisor
        case ("pow", base, exp):
            return evaluate_ast(base) ** evaluate_ast(exp)
            
        case _:
            raise ValueError(f"Invalid AST node structure: {node}")

# Expression: (10 + (4 * 5)) / 2  ->  (10 + 20) / 2 = 15.0
ast_tree = ("/", ("+", 10, ("*", 4, 5)), 2)

print("AST Expression Tree :", ast_tree)
print("Evaluated Result    :", evaluate_ast(ast_tree))
```

### 5. Advanced: Class Patterns and `__match_args__`
Matching instances of custom geometric classes using positional and keyword patterns.

```python
class Point2D:
    # __match_args__ allows positional matching in case patterns!
    __match_args__ = ("x", "y")
    
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

class Circle:
    __match_args__ = ("center", "radius")
    
    def __init__(self, center: Point2D, radius: float):
        self.center = center
        self.radius = radius

def classify_geometry(shape: object) -> str:
    match shape:
        # Match Origin Point
        case Point2D(0, 0):
            return "Point at Cartesian Origin (0, 0)"
            
        # Match Point with Pattern Guard (Diagonal line x == y)
        case Point2D(x, y) if x == y:
            return f"Point on 45-degree diagonal line: ({x}, {y})"
            
        # Match Point on X-axis (y == 0)
        case Point2D(x, 0):
            return f"Point on X-axis at x={x}"
            
        # Match Nested Class: Circle centered at Origin
        case Circle(center=Point2D(0, 0), radius=r):
            return f"Origin-centered Circle with radius {r}"
            
        # Match General Circle
        case Circle(center=Point2D(cx, cy), radius=r):
            return f"Circle centered at ({cx}, {cy}) with radius {r}"
            
        case _:
            return "Unknown geometric object."

print(classify_geometry(Point2D(0, 0)))
print(classify_geometry(Point2D(5, 5)))
print(classify_geometry(Point2D(12, 0)))
print(classify_geometry(Circle(Point2D(0, 0), radius=10)))
print(classify_geometry(Circle(Point2D(3, 4), radius=2.5)))
```

---

## Code Explanation

In Example 5 (Class Patterns and `__match_args__`):
1. The `__match_args__ = ("x", "y")` tuple defines which attributes map to positional arguments inside `case Point2D(x, y):`.
2. `case Point2D(0, 0):` verifies that the object is an instance of `Point2D` and that `self.x == 0` and `self.y == 0`.
3. `case Point2D(x, y) if x == y:` extracts the `x` and `y` attributes and applies a **pattern guard** to ensure they are equal.
4. `case Circle(center=Point2D(0, 0), radius=r):` performs **nested recursive class pattern matching**, validating both the outer circle and inner center point in a single line.
5. This showcases how structural pattern matching bridges object-oriented design and functional pattern matching.

---

## Common Mistakes

### Mistake 1: Accidental Variable Capture Instead of Value Equality
Attempting to match against a bare variable name overwrites the variable and matches unconditionally.

```python
# BROKEN:
ADMIN_ROLE = "admin"
user_role = "guest"

match user_role:
    case ADMIN_ROLE:  # Captures "guest" into variable ADMIN_ROLE!
        print("Welcome, Admin!")  # Executes for ANY user! ❌

# CORRECT: Use dotted names or guards
from enum import Enum
class Role(Enum):
    ADMIN = "admin"

match user_role:
    case Role.ADMIN.value:
        print("Welcome, Admin!")
```

### Mistake 2: Forgetting that Mapping Patterns Match Partially
Remember that `case {"id": uid}:` matches any dictionary containing key `"id"`, even if the dictionary contains 50 other keys.

---

## Best Practices

### Use Pattern Guards (`if`) for Complex Value Constraints
Combine structural shape matching with concise guard expressions to refine matching logic without deep nesting.

Good:
```python
match transaction:
    case {"amount": amt, "type": "DEBIT"} if amt > 10_000:
        flag_high_value_wire_transfer(transaction)
```

Avoid:
```python
match transaction:
    case {"amount": amt, "type": "DEBIT"}:
        if amt > 10_000:
            flag_high_value_wire_transfer(transaction)
```

---

## Performance Considerations

1. **Bytecode Jump Optimizations**: The CPython compiler compiles `match/case` into specialized bytecode instructions (`MATCH_MAPPING`, `MATCH_SEQUENCE`, `MATCH_CLASS`), evaluating type checks and length assertions at the C level.
2. **Comparison with `if-elif`**: For complex data destructuring, `match/case` is comparable in speed to manual `isinstance` checks, but drastically reduces lines of code and eliminates off-by-one indexing errors.

---

## Security Considerations

1. **Always Include a Default `case _` Handler**: Unmatched subjects in security routing can result in silent pass-throughs. Always include a `case _` that logs an audit warning or raises an exception.
2. **Guard Against Malformed Nested Payloads**: In web applications, avoid assuming extracted pattern variables conform to expected sub-types; validate types explicitly (e.g., `case {"id": int(item_id)}:`).

---

## Real-World Usage

- **Redux-Style State Reducers**: Dispatching state transitions based on action shape `{"type": "ADD_TODO", "payload": text}`.
- **Compiler / Parser Front-ends**: Evaluating Abstract Syntax Tree grammar nodes in interpreters and static analysis engines.
- **REST API Payload Routers**: Dispatching incoming JSON webhooks to domain service handlers.

---

## Comparison: `if-elif-else` vs `match-case`

| Feature | `if-elif-else` | `match-case` (Python 3.10+) | C/Java `switch` |
|---|---|---|---|
| **Primary Focus** | Boolean expressions | Structural shape & data destructuring | Primitive scalar values |
| **Type Verification**| Manual (`isinstance`) | Built-in (`case int(x):`) | Fixed type |
| **Nested Unpacking** | Manual indexing/slicing | Automatic (`case [x, *rest]:`) | Not supported |
| **Dictionary Matching**| Manual `in` & `.get()` | Declarative partial matching | Not supported |
| **Guard Clauses** | In condition | Built-in (`case ... if cond:`) | Limited / Absent |

---

## Advanced Concepts: The `__match_args__` Protocol

Dataclasses (`@dataclass`) automatically generate `__match_args__` matching their declared field order:

```python
from dataclasses import dataclass

@dataclass
class NetworkPacket:
    source_ip: str
    dest_ip: str
    payload_bytes: int

packet = NetworkPacket("192.168.1.1", "10.0.0.50", 1024)

match packet:
    case NetworkPacket("192.168.1.1", dest, size) if size > 500:
        print(f"Large internal packet to {dest} ({size} bytes)")
```

---

## Exercises

### Exercise 1 — Beginner
Write a function `parse_direction(command: str) -> tuple[int, int]` that matches direction strings (`"north"`, `"south"`, `"east"`, `"west"`, `"up"`, `"down"`) and returns a delta `(dx, dy)` coordinate tuple. Include a `case _` returning `(0, 0)`.

### Exercise 2 — Intermediate
Write a function `process_api_event(event: dict) -> str` using mapping patterns that matches: (1) user login events, (2) purchase events with price and item count, and (3) error events with an error code. Return formatted summary strings.

### Exercise 3 — Advanced
Build an arithmetic calculator that parses and evaluates a Lisp-style S-expression token list (e.g., `["+", 5, ["*", 2, 3]]`) recursively using structural pattern matching.

---

## Mini Project: Interactive CLI Command Interpreter & Shell Router

### Requirements
Build an interactive terminal command parser named `shell_router.py` that ingests user input strings, destructures command arguments using sequence patterns, enforces parameter guards, and dispatches actions to file management routines.

### Implementation Blueprint
```python
import os

class ShellRouter:
    @staticmethod
    def execute(command_str: str):
        tokens = command_str.strip().split()
        if not tokens:
            return

        match tokens:
            case ["exit" | "quit"]:
                print("Exiting interactive shell.")
                return False
                
            case ["help"]:
                print("Commands: ls, cd <dir>, touch <file>, cp <src> <dst>, echo <text...>")
                
            case ["ls"]:
                files = os.listdir(".")
                print(f"Current Directory Contents ({len(files)} items):")
                print("  " + ", ".join(files[:8]) + ("..." if len(files) > 8 else ""))
                
            case ["cd", path]:
                print(f"Navigating to directory: '{path}'")
                
            case ["touch", *filenames] if len(filenames) > 0:
                print(f"Creating empty file(s): {', '.join(filenames)}")
                
            case ["cp", src, dst]:
                print(f"Copying '{src}' -> '{dst}'")
                
            case ["echo", *words]:
                print("Echo:", " ".join(words))
                
            case ["rm", "-rf", "/"]:
                print("🚨 DANGEROUS COMMAND BLOCKED BY SECURITY SHIELD!")
                
            case ["rm", target]:
                print(f"Removing file: '{target}'")
                
            case _:
                print(f"Syntax Error: Unrecognized command pattern '{command_str}'")

        return True

if __name__ == "__main__":
    test_commands = [
        "echo Hello Structural Pattern Matching in Python!",
        "touch app.py utils.py config.json",
        "cp source.txt backup.txt",
        "rm -rf /",
        "cd /var/log/nginx",
        "invalid_command_with extra tokens",
        "exit"
    ]
    
    print("=" * 60)
    print("          INTERACTIVE SHELL PATTERN ROUTER")
    print("=" * 60)
    for cmd in test_commands:
        print(f"\n$ {cmd}")
        should_continue = ShellRouter.execute(cmd)
        if not should_continue:
            break
    print("=" * 60)
```

---

## Summary

In this lesson, you mastered Python's structural pattern matching architecture:
- Introduced in Python 3.10 (PEP 634/635/636), `match`/`case` evaluates both the **structure and values** of data.
- `match` and `case` are soft keywords, preserving backward compatibility.
- Sequence patterns destructure lists and tuples with optional `*rest` capture.
- Mapping patterns match dictionary keys partially, ignoring unspecified keys.
- Dotted names (`Enum.MEMBER`) perform equality comparisons, while bare identifiers act as capture variables.
- Pattern guards (`case ... if condition:`) allow fine-grained boolean filtering.
- Class patterns match object instances using `__match_args__`.

---

## Best Practices Checklist

- [ ] Use structural pattern matching when destructuring nested collections and objects.
- [ ] Always use dotted names or Enums when matching against constants.
- [ ] Use `case _:` as the default catch-all in every pattern match block.
- [ ] Leverage pattern guards (`if`) to keep pattern shapes clean.
- [ ] Define `__match_args__` on custom classes to enable positional pattern matching.

---

## What's Next?

Congratulations! You have completed **Module 5: Control Flow**.
Now continue to **Module 6: Built-in Collections**:
👉 **[Lists in Depth](../collections/lists.md)** to master dynamic arrays, memory growth amortizations, slicing, and list operations.
