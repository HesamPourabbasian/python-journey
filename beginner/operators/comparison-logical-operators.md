# Comparison & Logical Operators in Python

## Introduction

Programs create intelligent behavior through conditional decision-making. Whether determining if a customer qualifies for a loan, filtering sensor telemetry for anomalous spikes, authenticating user credentials against security rules, or validating form inputs, software continually compares values and evaluates compound logical statements.

In Python, this decision-making infrastructure is powered by two closely intertwined operator families: **Comparison (Relational) Operators** and **Logical (Boolean) Operators**.

Python's comparison syntax is uniquely expressive compared to languages like C, Java, or JavaScript. It natively supports **Chained Comparisons** (such as `18 <= age < 65`), which match mathematical interval notation directly. Furthermore, Python's logical operators (`and`, `or`, `not`) do not simply return raw `True` or `False` flags; they implement **Short-Circuit Evaluation** and return the actual operands themselves, enabling powerful idiom patterns like fallback values and guarded function execution.

This lesson builds upon [Booleans & The NoneType](../variables-data-types/booleans-none.md) and [Arithmetic Operators](arithmetic-operators.md), establishing the logical foundations required for control flow branching (`if`/`elif`/`else`) and loops.

---

## Prerequisites

Before studying comparison and logical operators, ensure you have:

- Completed [Booleans & The NoneType](../variables-data-types/booleans-none.md) and mastered Python's truthiness rules.
- Familiarity with object identity (`is`) vs value equality (`==`).
- An understanding of basic propositional logic (AND, OR, NOT).

---

## Core Concept

### 1. Comparison (Relational) Operators
Comparison operators evaluate the relational order or equality between two values, returning a boolean (`True` or `False`):
- Equality: `==`
- Inequality: `!=`
- Less than / Less than or equal to: `<`, `<=`
- Greater than / Greater than or equal to: `>`, `>=`

### 2. Chained Comparisons
In Python, multiple comparison operators can be chained together without intermediate boolean operators:
`a < b <= c` is evaluated identically to `(a < b) and (b <= c)`, with the crucial efficiency guarantee that the intermediate sub-expression `b` is **evaluated only once**.

### 3. Logical Operators and Short-Circuit Evaluation
Python provides three logical operators written in plain English words: `and`, `or`, and `not`.

```
                         SHORT-CIRCUIT LOGICAL OPERATOR RULES

      OPERATOR          EVALUATION LOGIC                       RETURN VALUE
   +-------------+------------------------------------+-----------------------------+
   • a and b     | If 'a' is falsey, stop immediately | Returns 'a' (if falsey)     |
                 | Otherwise, evaluate and return 'b' | or 'b' (if 'a' is truthy)   |
   +-------------+------------------------------------+-----------------------------+
   • a or b      | If 'a' is truthy, stop immediately | Returns 'a' (if truthy)     |
                 | Otherwise, evaluate and return 'b' | or 'b' (if 'a' is falsey)   |
   +-------------+------------------------------------+-----------------------------+
   • not a       | Inverts truth value of 'a'         | Always returns strict bool  |
                 |                                    | (True or False)             |
   +-------------+------------------------------------+-----------------------------+
```

---

## Syntax & Common Operator Usage

```python
# 1. Comparison Operators
score = 85
is_passing = score >= 70       # True
is_perfect = score == 100      # False
is_nonzero = score != 0        # True

# 2. Chained Comparisons
temperature = 22.5
is_comfortable = 20.0 <= temperature <= 25.0  # True

# 3. Logical Operators
has_ticket = True
has_vip_pass = False
is_banned = False

# Evaluates to True
can_enter = (has_ticket or has_vip_pass) and not is_banned

# 4. Operand Return Rules (Default Fallback Pattern)
raw_name = ""
display_name = raw_name or "Anonymous Guest"  # Evaluates to "Anonymous Guest"
```

---

## Detailed Explanation

### 1. The Dunder Comparison Protocol (Rich Comparisons)

Every comparison operator maps to a corresponding dunder method on the left operand's class:
- `a == b` $\rightarrow$ `a.__eq__(b)`
- `a != b` $\rightarrow$ `a.__ne__(b)`
- `a < b`  $\rightarrow$ `a.__lt__(b)`
- `a <= b` $\rightarrow$ `a.__le__(b)`
- `a > b`  $\rightarrow$ `a.__gt__(b)`
- `a >= b` $\rightarrow$ `a.__ge__(b)`

If the left operand's class returns `NotImplemented`, Python automatically attempts the reflected comparison on the right operand (e.g., `b.__gt__(a)` for `a < b`).

### 2. Logical Operator Precedence

When mixing logical and comparison operators in a single expression, the evaluation order is strictly defined:
1. **Comparisons** (`==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `is`) have higher precedence than logical operators.
2. **`not`** has the next highest precedence.
3. **`and`** has the second lowest precedence.
4. **`or`** has the lowest precedence.

```python
# Expression:
result = not 5 > 10 and 20 == 20 or 100 < 50
# Step 1 (Comparisons): not False and True or False
# Step 2 (not):         True and True or False
# Step 3 (and):         True or False
# Step 4 (or):          True
```

### 3. Short-Circuiting for Defensive Execution

Because `and` and `or` halt evaluation as soon as the result is determined, you can place lightweight guard conditions before operations that would otherwise crash if executed recklessly:

```python
user_record = None

# SAFE: user_record is not None evaluates to False -> 'and' immediately short-circuits!
# user_record["email"] is never evaluated, avoiding a TypeError or AttributeError crash.
if user_record is not None and user_record.get("is_active"):
    print("User is active.")
```

---

## Examples

### 1. Simple: Basic Relational Testing
Evaluating student exam scores against grading boundaries.

```python
grade = 92

print("Is A Grade (>= 90) :", grade >= 90)
print("Is Failing (< 60)   :", grade < 60)
print("Exact Match (== 92) :", grade == 92)
print("Not Match (!= 100)  :", grade != 100)
```

### 2. Beginner: Chained Comparison Range Verification
Validating whether a network port number falls within the legal, unprivileged user port range ($1024$ to $65535$).

```python
def is_valid_user_port(port: int) -> bool:
    """Validate port number using chained comparison."""
    # Mathematically: 1024 <= port <= 65535
    return 1024 <= port <= 65535

print("Port 80 (HTTP)        :", is_valid_user_port(80))       # False
print("Port 8080 (Dev Server):", is_valid_user_port(8080))     # True
print("Port 70000 (Invalid)  :", is_valid_user_port(70000))    # False
```

### 3. Intermediate: Short-Circuiting Expensive Database Queries
Proving that Python skips expensive function calls when the outcome is predetermined by an earlier boolean condition.

```python
def check_local_cache() -> bool:
    print("⚡ [Fast] Checking In-Memory Cache... (FOUND)")
    return True

def query_remote_database() -> bool:
    print("⏳ [SLOW] Executing Remote Database Query across Network...")
    return True

print("--- Test 1: Cache Hits (OR Short-Circuit) ---")
# Because check_local_cache() is True, query_remote_database() is NEVER CALLED!
has_data = check_local_cache() or query_remote_database()

print("\n--- Test 2: Mandatory Validation (AND Short-Circuit) ---")
is_authenticated = False
# Because is_authenticated is False, query_remote_database() is NEVER CALLED!
access_granted = is_authenticated and query_remote_database()
```

### 4. Real-World: Multi-Tier Authorization Access Control
Evaluating complex user permission matrices using logical combinations.

```python
def evaluate_document_access(user: dict, document: dict) -> bool:
    """Determine whether a user can read/edit a protected enterprise document."""
    is_admin = user.get("role") == "admin"
    is_owner = user.get("id") == document.get("owner_id")
    is_public = document.get("visibility") == "public"
    is_collaborator = user.get("id") in document.get("collaborator_ids", [])
    is_account_suspended = user.get("is_suspended", False)
    
    # Access rule: User must NOT be suspended AND (must be Admin OR Owner OR Collaborator OR Document is Public)
    has_permission = (is_admin or is_owner or is_collaborator or is_public) and not is_account_suspended
    return has_permission

# Test Case
active_user = {"id": 101, "role": "editor", "is_suspended": False}
restricted_doc = {"id": "doc_99", "owner_id": 505, "visibility": "private", "collaborator_ids": [101, 102]}

print("Access Granted:", evaluate_document_access(active_user, restricted_doc))
```

### 5. Advanced: Implementing Rich Comparisons with `@functools.total_ordering`
Building a domain model that supports full comparison sorting (`<`, `<=`, `>`, `>=`, `==`) by defining only `__eq__` and `__lt__`.

```python
from functools import total_ordering

@total_ordering
class TaskPriority:
    def __init__(self, name: str, severity: int, deadline_days: int):
        self.name = name
        self.severity = severity          # 1 (Low) to 5 (Critical)
        self.deadline_days = deadline_days

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TaskPriority):
            return NotImplemented
        return (self.severity, -self.deadline_days) == (other.severity, -other.deadline_days)

    def __lt__(self, other: object) -> bool:
        if not isinstance(other, TaskPriority):
            return NotImplemented
        # Higher severity has higher priority; shorter deadline breaks ties
        return (self.severity, -self.deadline_days) < (other.severity, -other.deadline_days)

    def __repr__(self) -> str:
        return f"Task('{self.name}', Sev={self.severity}, Days={self.deadline_days})"

task_a = TaskPriority("Fix CSS Bug", severity=1, deadline_days=5)
task_b = TaskPriority("Database Outage", severity=5, deadline_days=1)
task_c = TaskPriority("Security Audit", severity=5, deadline_days=3)

tasks = [task_a, task_b, task_c]
print("Tasks Sorted by Priority (Lowest to Highest):")
for t in sorted(tasks):
    print(" ->", t)

print(f"\nIs Database Outage > Security Audit? {task_b > task_c}")  # True (shorter deadline)
```

---

## Code Explanation

In Example 5 (Rich Comparisons with `total_ordering`):
1. The `@total_ordering` class decorator from `functools` automatically generates `__le__`, `__gt__`, and `__ge__` as long as your class provides `__eq__` and one ordering method (`__lt__`, `__le__`, `__gt__`, or `__ge__`).
2. Priority ordering uses a tuple comparison `(self.severity, -self.deadline_days)`: Python compares tuple elements sequentially from index 0. If `severity` is equal, it evaluates the negated `deadline_days` to break ties.
3. This allows custom domain objects to integrate seamlessly with Python's built-in `sorted()` algorithm, `min()`, `max()`, and heap priority queues.

---

## Common Mistakes

### Mistake 1: Writing `if x == 1 or 2:`
This classic beginner mistake occurs because natural English grammar ("if x equals 1 or 2") does not match formal Boolean algebra.

```python
# BROKEN:
x = 5
if x == 1 or 2:  # Evaluates as: (x == 1) or (2) -> False or 2 -> Truthy! ALWAYS EXECUTES!
    print("Matched!")  # Erroneously prints for ANY value of x!

# CORRECT APPROACH 1:
if x == 1 or x == 2:
    pass

# CORRECT APPROACH 2 (Idiomatic):
if x in (1, 2):
    pass
```

### Mistake 2: Assuming `or` Returns a Strict Boolean
`a or b` returns the operand itself, not `True`/`False`.

```python
result = "" or "Default Value"
print(result)  # "Default Value" (string), NOT True!
```

---

## Best Practices

### Use Chained Comparisons for Interval Checks
Whenever checking whether a value falls within a numeric range, use Python's chained comparison syntax rather than separate `and` clauses.

Good:
```python
if 0 <= status_code < 400:
    print("Success status code")
```

Avoid:
```python
if status_code >= 0 and status_code < 400:
    print("Success status code")
```

Chained comparisons are more concise, readable, and guarantee that `status_code` is only evaluated once.

---

## Performance Considerations

1. **Short-Circuit Optimization Hierarchy**: When constructing compound `and` / `or` conditions, always order operands by computational cost:
   - Place fast, in-memory scalar checks first (`user is not None`).
   - Place expensive CPU algorithms, disk reads, or network HTTP calls last (`and user.has_active_subscription()`).
2. **Single Evaluation in Chained Comparisons**: In `f(x) < g(y) < h(z)`, the middle function `g(y)` is guaranteed to execute only once, saving CPU cycles compared to `f(x) < g(y) and g(y) < h(z)`.

---

## Security Considerations: Constant-Time Comparison

In cryptography, authentication, and web security, comparing secret strings (such as API keys, CSRF tokens, or password hashes) with standard `==` creates a severe vulnerability called a **Timing Attack**.

Standard string `==` compares characters sequentially and returns `False` immediately upon the first mismatched character. An attacker measuring request response latency in nanoseconds can deduce the secret string character by character.

**How to avoid:** Always use `secrets.compare_digest()` for secret string validation:

```python
import secrets

def authenticate_api_key(provided_key: str, real_key: str) -> bool:
    # Constant-time comparison: takes identical CPU time regardless of mismatch location
    return secrets.compare_digest(provided_key, real_key)
```

---

## Real-World Usage

- **Role-Based Access Control (RBAC)**: Web applications (FastAPI, Django) evaluate compound permissions before dispatching database mutations.
- **Data Filtering with Pandas**: Analytics engines leverage vectorized comparison operators (`df['age'] >= 21`) to filter millions of rows in memory.
- **Feature Toggles / Release Flags**: Cloud platforms evaluate user cohort rules, location boundaries, and rollout percentages before enabling experimental features.

---

## Comparison: Operators Summary

| Operator | Type | Behavior | Example | Evaluates To |
|---|---|---|---|---|
| `==` | Comparison | Value Equality | `10 == 10.0` | `True` |
| `!=` | Comparison | Value Inequality | `10 != 20` | `True` |
| `<` / `<=` | Comparison | Less than / Less or equal | `15 <= 20` | `True` |
| `>` / `>=` | Comparison | Greater than / Greater or equal | `30 > 50` | `False` |
| `and` | Logical | Returns 1st falsey or last operand | `10 and "OK"` | `"OK"` |
| `or` | Logical | Returns 1st truthy or last operand | `"" or "Default"`| `"Default"` |
| `not` | Logical | Inverts boolean truthiness | `not []` | `True` |

---

## Exercises

### Exercise 1 — Beginner
Write a script that takes an integer `age` and a boolean `has_parental_consent`. Print `"Access Granted"` if the user is 18 or older, or if they are at least 13 and have parental consent. Otherwise, print `"Access Denied"`.

### Exercise 2 — Intermediate
Write a function `validate_password_complexity(password: str) -> tuple[bool, list[str]]` that checks whether a password: (1) is between 8 and 32 characters long using chained comparison, (2) contains at least one uppercase character, (3) contains at least one digit, and (4) does not contain spaces. Return `(True, [])` if valid, or `(False, reasons)` listing missing requirements.

### Exercise 3 — Advanced
Build a `Version` class (e.g., `Version("3.12.3")`) that implements `__eq__` and `__lt__` using `@total_ordering`. Support comparison with other `Version` instances as well as raw strings (`Version("3.10") < "3.11.2"`), handling variable length semver components cleanly.

---

## Mini Project: Enterprise Policy Authorization Engine

### Requirements
Create a production-grade policy evaluator named `auth_policy.py` that evaluates incoming user requests against defined access control rules, utilizing short-circuiting, chained comparisons, and constant-time secret validation.

### Implementation Blueprint
```python
import secrets
from typing import Any

class AuthPolicyEngine:
    @staticmethod
    def is_authorized(user: dict[str, Any], action: str, resource: dict[str, Any]) -> tuple[bool, str]:
        # 1. Guard check: User must be active
        if not user.get("is_active", False):
            return False, "User account is inactive or disabled."

        # 2. Admin Override
        if user.get("role") == "superadmin":
            return True, "Authorized via Superadmin privileges."

        # 3. Department and Clearance Range Check (Chained Comparison)
        user_clearance = user.get("clearance_level", 0)
        req_clearance = resource.get("required_clearance", 1)
        
        if not (1 <= req_clearance <= user_clearance <= 5):
            return False, f"Insufficient security clearance (User: {user_clearance}, Required: {req_clearance})."

        # 4. Action-specific rules
        if action in ("read", "view"):
            # Permitted if resource is public or user is in owner department
            if resource.get("is_public") or user.get("department") == resource.get("department"):
                return True, "Read access permitted."
        elif action in ("write", "update", "delete"):
            # Permitted only if user is the direct owner or designated editor
            if user.get("id") == resource.get("owner_id") or user.get("id") in resource.get("editor_ids", []):
                return True, "Write access permitted."
            return False, "Write access requires direct ownership or editor assignment."

        return False, f"Action '{action}' is unrecognized or prohibited."

if __name__ == "__main__":
    engine = AuthPolicyEngine()
    
    current_user = {
        "id": "usr_404",
        "role": "analyst",
        "department": "Finance",
        "clearance_level": 4,
        "is_active": True
    }
    
    secure_doc = {
        "id": "doc_fin_2024",
        "department": "Finance",
        "required_clearance": 3,
        "is_public": False,
        "owner_id": "usr_100",
        "editor_ids": ["usr_404"]
    }
    
    allowed, reason = engine.is_authorized(current_user, "update", secure_doc)
    print("=" * 55)
    print("          AUTHORIZATION DECISION REPORT")
    print("=" * 55)
    print(f"Decision : {'✅ APPROVED' if allowed else '❌ REJECTED'}")
    print(f"Reason   : {reason}")
    print("=" * 55)
```

---

## Summary

In this lesson, you mastered comparison and logical operators in Python:
- Comparison operators (`==`, `!=`, `<`, `<=`, `>`, `>=`) evaluate relationships and map to rich comparison dunders (`__eq__`, `__lt__`, etc.).
- Chained comparisons (`min <= x <= max`) evaluate intermediate terms only once.
- Logical operators (`and`, `or`, `not`) execute using **short-circuit evaluation**, returning the actual determining operand.
- Avoid `if x == 1 or 2:`; use `if x in (1, 2):`.
- Use `@functools.total_ordering` to implement full ordering comparisons on custom classes.
- Use `secrets.compare_digest()` for constant-time cryptographic string comparisons.

---

## Best Practices Checklist

- [ ] Use chained comparisons (`a <= x < b`) for range checks.
- [ ] Place lightweight, inexpensive conditions before heavy database/network calls in `and` / `or` chains.
- [ ] Use `secrets.compare_digest()` when validating API tokens, hashes, and passwords.
- [ ] Never compare boolean variables to `True` using `== True`; write `if is_valid:`.
- [ ] Decorate custom classes with `@functools.total_ordering` to simplify rich comparison implementations.

---

## What's Next?

Now that you understand comparison and logical operators, continue to:
👉 **[Assignment & Bitwise Operators](assignment-bitwise-operators.md)** to master augmented assignments, the Walrus operator (`:=`), and bitwise manipulation.
