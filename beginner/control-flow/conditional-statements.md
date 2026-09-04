# Conditional Statements in Python

## Introduction

At the heart of all computer software lies the ability to make decisions based on changing conditions. A software application cannot be a fixed, static script; it must adapt its execution path based on user inputs, external API responses, sensor readings, system errors, and business rules. In Python, this foundational decision-making capability is implemented via **Conditional Statements (`if`, `elif`, `else`)** and **Conditional (Ternary) Expressions**.

Unlike many traditional programming languages that rely on curly braces `{}` or explicit keywords like `then`/`endif` to enclose blocks of code, Python uniquely utilizes **significant whitespace (indentation)** to define lexical execution blocks. This architectural design choice enforces clean, visually uniform code hierarchies across all Python projects.

Writing clean conditional logic requires more than simply knowing the syntax of `if` and `else`. In professional software engineering, poorly structured conditionals quickly degenerate into deeply nested "Pyramids of Doom" (high cyclomatic complexity), creating fragile code that is difficult to test, maintain, and reason about. Mastering Python conditionals involves learning idiomatic design patterns such as **Guard Clauses**, understanding how truthiness drives branching, and knowing when to use inline ternary expressions or dictionary dispatch tables.

This lesson builds directly upon [Booleans & The NoneType](../variables-data-types/booleans-none.md) and [Comparison & Logical Operators](../operators/comparison-logical-operators.md), establishing the algorithmic routing foundations of Python programming.

---

## Prerequisites

Before studying conditional statements, ensure you have:

- Completed [Booleans & The NoneType](../variables-data-types/booleans-none.md) and mastered Python's truthiness rules.
- Completed [Comparison & Logical Operators](../operators/comparison-logical-operators.md).
- A clear understanding of operator precedence and short-circuit evaluation.

---

## Core Concept

A conditional statement evaluates one or more boolean expressions. If an expression evaluates to `True` (or a truthy object), the indented block beneath it executes. If `False`, the interpreter bypasses that block and tests subsequent branches.

```
                               CONDITIONAL EXECUTION FLOW

                                   [ Evaluate Condition ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (True)                                    ▼ (False)
              [ Execute if Block ]                        [ Has 'elif' branch? ]
                       │                                           │
                       │                       ┌───────────────────┴───────────────────┐
                       │                       ▼ (Yes)                                 ▼ (No)
                       │             [ Evaluate elif Cond ]                   [ Has 'else' branch? ]
                       │                       │                                       │
                       │             ┌─────────┴─────────┐                   ┌─────────┴─────────┐
                       │             ▼ (True)            ▼ (False)           ▼ (Yes)             ▼ (No)
                       │       [ Exec elif ]      [ Check next... ]     [ Exec else ]       [ Continue ]
                       │             │                   │                   │                   │
                       └─────────────┴───────────────────┴───────────────────┴───────────────────┘
                                                       │
                                                       ▼
                                            [ Continue Program ]
```

---

## Syntax & Essential Forms

### 1. The Basic `if` Statement
```python
temperature = 32.0

if temperature > 30.0:
    print("Warning: High temperature detected!")
```

### 2. The `if-else` Branch
```python
is_authenticated = True

if is_authenticated:
    print("Welcome to your dashboard.")
else:
    print("Access Denied: Please log in.")
```

### 3. The Multi-Branch `if-elif-else` Ladder
```python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Final Grade: {grade}")
```

### 4. The Conditional (Ternary) Expression
Python provides an inline ternary operator for concise value assignments:

$$\text{value} = \text{true\_expression} \textbf{ if } \text{condition} \textbf{ else } \text{false\_expression}$$

```python
status_code = 200
status_message = "Success" if status_code == 200 else "Error"
```

---

## Detailed Explanation

### 1. Significant Indentation and Lexical Blocks

In Python, indentation is not cosmetic; it is syntactically mandatory. Standard Python (PEP 8) mandates **4 spaces per indentation level**. Never use literal tab characters.

```python
x = 10
if x > 5:
    print("Indented line 1 (Inside block)")
    print("Indented line 2 (Inside block)")
print("Unindented line (Outside block - Executes unconditionally)")
```

### 2. Sequential Top-to-Bottom Evaluation

In an `if-elif-else` ladder, Python evaluates branches **strictly from top to bottom** and halts immediately upon the first branch that evaluates to `True`. Subsequent `elif` and `else` blocks are completely ignored, even if their conditions would also evaluate to `True`.

```python
# The order of branches MATTERS!
num = 15

# CORRECT: Most specific conditions first
if num % 15 == 0:
    print("FizzBuzz")  # Executes!
elif num % 3 == 0:
    print("Fizz")
elif num % 5 == 0:
    print("Buzz")

# BROKEN ORDER:
if num % 3 == 0:
    print("Fizz")      # Executes and halts! 'FizzBuzz' is NEVER reached!
elif num % 15 == 0:
    print("FizzBuzz")
```

### 3. Eliminating the "Arrow Anti-Pattern" with Guard Clauses

When validating prerequisites, beginners often nest `if` statements inside `if` statements, creating deeply indented, unreadable code known as the **Arrow Anti-Pattern** (or Pyramid of Doom).

```python
# ANTI-PATTERN: Deeply nested indentation (Hard to read and maintain)
def process_payment_nested(user, amount):
    if user is not None:
        if user.get("is_active"):
            if amount > 0:
                if user.get("balance") >= amount:
                    user["balance"] -= amount
                    return "Payment Successful"
                else:
                    return "Insufficient Funds"
            else:
                return "Invalid Amount"
        else:
            return "User Inactive"
    else:
        return "User Not Found"
```

**The Idiomatic Solution: Guard Clauses (Early Returns)**:
Test for failure conditions at the top of the function and return immediately, keeping the "happy path" flat and un-indented.

```python
# IDIOMATIC: Flat structure with Guard Clauses
def process_payment_guarded(user, amount):
    if user is None:
        return "User Not Found"
    if not user.get("is_active"):
        return "User Inactive"
    if amount <= 0:
        return "Invalid Amount"
    if user.get("balance") < amount:
        return "Insufficient Funds"
        
    # Happy Path (Zero nested indentation!)
    user["balance"] -= amount
    return "Payment Successful"
```

---

## Examples

### 1. Simple: Basic Threshold Validation
Checking storage capacity and printing alerts.

```python
disk_usage_pct = 92.4

if disk_usage_pct >= 95.0:
    print("🚨 CRITICAL: Disk space nearly full! Immediate action required.")
elif disk_usage_pct >= 85.0:
    print("⚠️ WARNING: Disk usage high. Consider purging logs.")
else:
    print("✅ OK: Disk usage within normal operating parameters.")
```

### 2. Beginner: Tiered Taxation Calculator
Computing progressive income tax using an `if-elif-else` hierarchy.

```python
def calculate_income_tax(annual_income: float) -> float:
    """Calculate progressive income tax based on income brackets."""
    if annual_income <= 10_000:
        tax = 0.0
    elif annual_income <= 40_000:
        tax = (annual_income - 10_000) * 0.10
    elif annual_income <= 100_000:
        tax = (30_000 * 0.10) + ((annual_income - 40_000) * 0.20)
    else:
        tax = (30_000 * 0.10) + (60_000 * 0.20) + ((annual_income - 100_000) * 0.30)
        
    return tax

incomes = [8_000, 35_000, 75_000, 150_000]
for inc in incomes:
    tax_due = calculate_income_tax(inc)
    effective_rate = (tax_due / inc) if inc > 0 else 0.0
    print(f"Income: ${inc:>7,f} -> Tax Due: ${tax_due:>9,.2f} (Effective Rate: {effective_rate:.1%})")
```

### 3. Intermediate: Inline Ternary Formatting
Using ternary expressions for concise string and status rendering.

```python
users = [
    {"name": "Alice", "role": "admin", "is_active": True},
    {"name": "Bob", "role": "guest", "is_active": False},
    {"name": "Charlie", "role": "editor", "is_active": True},
]

for u in users:
    # Inline ternary expressions
    status_icon = "🟢" if u["is_active"] else "🔴"
    role_badge = "[SUPERUSER]" if u["role"] == "admin" else "[STANDARD]"
    
    print(f"{status_icon} {u['name']:<10} {role_badge:<12}")
```

### 4. Real-World: Multi-Factor Authentication (MFA) Verification Pipeline
Evaluating security state using guard clauses and chained relational logic.

```python
def verify_login_attempt(user_db: dict, username: str, password_hash: str, otp_code: str, ip_address: str) -> tuple[bool, str]:
    # 1. Guard: Check user existence
    user = user_db.get(username)
    if user is None:
        return False, "Invalid username or credentials."

    # 2. Guard: Check account lock status
    if user.get("failed_attempts", 0) >= 5 or user.get("is_locked", False):
        return False, "Account locked due to excessive failed attempts."

    # 3. Guard: Verify password hash
    if user.get("password_hash") != password_hash:
        user["failed_attempts"] = user.get("failed_attempts", 0) + 1
        return False, "Invalid username or credentials."

    # 4. Guard: MFA OTP Code
    if user.get("mfa_enabled", False) and user.get("current_otp") != otp_code:
        return False, "Invalid MFA One-Time Password."

    # Happy path: Login successful
    user["failed_attempts"] = 0
    user["last_login_ip"] = ip_address
    return True, "Authentication successful."

# Test Database
mock_db = {
    "hesam": {
        "password_hash": "hash_sec_9918",
        "mfa_enabled": True,
        "current_otp": "491029",
        "failed_attempts": 0,
        "is_locked": False
    }
}

success, msg = verify_login_attempt(mock_db, "hesam", "hash_sec_9918", "491029", "192.168.1.100")
print(f"Login Result: {'SUCCESS' if success else 'FAILED'} -> {msg}")
```

### 5. Advanced: Dictionary Dispatch Table as an Alternative to Large `if-elif`
Replacing massive 20-branch `if-elif-else` ladders with high-speed $O(1)$ dictionary dispatch tables.

```python
def handle_create(payload: dict) -> str:
    return f"Created resource: {payload.get('id')}"

def handle_update(payload: dict) -> str:
    return f"Updated resource: {payload.get('id')}"

def handle_delete(payload: dict) -> str:
    return f"Deleted resource: {payload.get('id')}"

def handle_unknown(payload: dict) -> str:
    return f"Unknown action requested."

# Dictionary Dispatch Table: Maps action strings directly to callable functions
ACTION_DISPATCH = {
    "CREATE": handle_create,
    "UPDATE": handle_update,
    "DELETE": handle_delete,
}

def execute_action(action: str, payload: dict) -> str:
    # O(1) instantaneous function resolution, falling back to handle_unknown
    handler = ACTION_DISPATCH.get(action.upper(), handle_unknown)
    return handler(payload)

print(execute_action("CREATE", {"id": "res_101"}))
print(execute_action("DELETE", {"id": "res_101"}))
print(execute_action("PURGE", {"id": "res_101"}))  # Falls back cleanly
```

---

## Code Explanation

In Example 5 (Dictionary Dispatch Table):
1. Instead of executing 10–20 sequential `elif` checks ($O(N)$ linear scan), actions are mapped to first-class function objects in a Python dictionary.
2. `ACTION_DISPATCH.get(action, handle_unknown)` looks up the corresponding function in $O(1)$ constant time.
3. If the action is unrecognized, `.get()` returns the `handle_unknown` fallback handler.
4. Invoking `handler(payload)` executes the resolved function dynamically.
5. This pattern is widely used in command routers, API controllers, and state machine transitions.

---

## Common Mistakes

### Mistake 1: Missing Colons `:` at the End of `if`/`elif`/`else`
Every conditional header line must terminate with a colon `:`. Omitting the colon raises a `SyntaxError`.

```python
# BROKEN:
# if score > 50
#     print("Pass")

# CORRECT:
if score > 50:
    print("Pass")
```

### Mistake 2: Writing `elif` Branches After an Unconditional `else`
The `else` branch must always be the final, catch-all branch. Writing `elif` after `else` raises a `SyntaxError`.

---

## Best Practices

### Prefer Guard Clauses Over Nested Conditionals
Flatten nested code structures by returning or continuing early on invalid preconditions. This keeps the primary business logic at the base indentation level.

Good:
```python
def publish_article(article):
    if not article.is_draft:
        return False
    if not article.has_author:
        return False
        
    article.publish()
    return True
```

Avoid:
```python
def publish_article(article):
    if article.is_draft:
        if article.has_author:
            article.publish()
            return True
    return False
```

---

## Performance Considerations

1. **Branch Order Optimization**: In performance-critical loops processing millions of records with `if-elif-else`, order branches by **statistical probability**: place the branch that occurs 90% of the time first. This minimizes the average number of condition checks per iteration.
2. **Short-Circuiting within Conditions**: In compound conditions (`if cond1 and cond2:`), place the cheapest, fastest check first (`if obj is not None and obj.is_valid():`).

---

## Security Considerations

1. **Default-Deny Security Posture**: Always design authorization conditions using a **"Default Deny"** architecture. Ensure the final `else` branch explicitly rejects access or raises an error, rather than defaulting to permissive behavior.
2. **Truthiness Injection**: Never assume that presence of a string implies validity. For example, `role = ""` is falsey, but `role = "False"` is truthy! Explicitly validate values against permitted whitelists.

---

## Real-World Usage

- **API Rate Limiting**: Inspecting client IP request counters and rejecting requests with HTTP 429 when thresholds are exceeded.
- **E-Commerce Checkout Engines**: Applying tiered promotional discounts, verifying inventory availability, and selecting payment gateways.
- **DevOps Health Checks**: Evaluating Kubernetes container memory, CPU thresholds, and liveness endpoints.

---

## Comparison: Branching Techniques

| Technique | Syntax | Best Use Case | Performance |
|---|---|---|---|
| **`if-else`** | `if c: ... else: ...` | Binary decision branching | Very Fast |
| **`if-elif-else`** | Multi-branch ladder | 3–5 ordered range/threshold checks | $O(K)$ branches |
| **Ternary Expression** | `x if c else y` | Inline variable assignment / formatting | Very Fast |
| **Dict Dispatch** | `ACTIONS.get(k, default)()`| 5+ distinct discrete command actions | **$O(1)$ Instant** |
| **Pattern Match** | `match/case` (3.10+) | Structural shape and payload matching | Very Fast / Clean |

---

## Advanced Concepts: The Bytecode Jumps of Conditionals

When CPython compiles an `if-else` statement, it generates jump opcodes (`POP_JUMP_IF_FALSE`, `JUMP_FORWARD`):

```python
import dis

def check_even(n):
    if n % 2 == 0:
        return "Even"
    else:
        return "Odd"

dis.dis(check_even)
```

The virtual machine evaluates `n % 2 == 0`. If the top of the stack is false, `POP_JUMP_IF_FALSE` advances the instruction pointer directly to the `else` bytecode offset, bypassing intermediate instructions with zero runtime interpretation overhead.

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that asks the user for their age. If age is under 13, print `"Child"`; if between 13 and 17 (inclusive), print `"Teenager"`; if between 18 and 64, print `"Adult"`; if 65 or older, print `"Senior"`. Include input validation for negative numbers.

### Exercise 2 — Intermediate
Write a function `calculate_shipping_cost(weight_kg: float, destination_zone: str, is_express: bool) -> float` using guard clauses. Reject negative weights or invalid zones with a `ValueError`. Compute base rates ($Zone A: \$5/kg$, $Zone B: \$8/kg$, $Zone C: \$12/kg$), apply a 50% surcharge if `is_express` is True, and return the total cost rounded to 2 decimal places.

### Exercise 3 — Advanced
Refactor a legacy calculator script that uses a 10-branch `if-elif-else` statement into an extensible `MathEngine` class that uses a dictionary dispatch table mapping operator strings (`"+"`, `"-"`, `"*"`, `"/"`, `"**"`, `"%"`) to corresponding mathematical functions.

---

## Mini Project: Automated Financial Loan Risk Classifier

### Requirements
Build a production-grade loan risk assessment engine named `loan_evaluator.py` that evaluates loan applicants based on credit score, annual income, debt-to-income (DTI) ratio, employment duration, and requested loan amount, classifying applications into: `APPROVED`, `CONDITIONAL_REVIEW`, or `REJECTED`.

### Implementation Blueprint
```python
class LoanRiskEvaluator:
    @staticmethod
    def evaluate_application(applicant: dict) -> dict:
        # 1. Guard: Validate mandatory fields
        required_fields = ["name", "credit_score", "annual_income", "total_monthly_debt", "loan_amount", "years_employed"]
        for field in required_fields:
            if field not in applicant:
                return {"decision": "ERROR", "reason": f"Missing field: '{field}'"}

        score = applicant["credit_score"]
        income = applicant["annual_income"]
        monthly_debt = applicant["total_monthly_debt"]
        loan = applicant["loan_amount"]
        years = applicant["years_employed"]

        # Calculate Debt-to-Income (DTI) ratio: (Monthly Debt * 12) / Annual Income
        dti_ratio = (monthly_debt * 12) / income if income > 0 else 1.0
        loan_to_income_ratio = loan / income if income > 0 else 10.0

        # Branching Evaluation Hierarchy
        if score < 580 or dti_ratio > 0.50 or income < 25_000:
            decision = "REJECTED"
            reason = "High risk profile (Low credit score, excessive DTI, or insufficient income)."
        elif score >= 740 and dti_ratio <= 0.35 and loan_to_income_ratio <= 3.0:
            decision = "APPROVED (TIER 1 - PRIME)"
            reason = "Excellent credit score and healthy debt ratio. Lowest interest tier."
        elif score >= 670 and dti_ratio <= 0.43 and years >= 2:
            decision = "APPROVED (TIER 2 - STANDARD)"
            reason = "Satisfactory credit score and stable employment history."
        else:
            decision = "CONDITIONAL_REVIEW"
            reason = "Borderline application. Requires manual underwriting verification."

        return {
            "applicant": applicant["name"],
            "decision": decision,
            "dti_ratio": round(dti_ratio, 3),
            "loan_to_income": round(loan_to_income_ratio, 2),
            "reason": reason
        }

if __name__ == "__main__":
    applicants = [
        {"name": "Hesam P.", "credit_score": 780, "annual_income": 120_000, "total_monthly_debt": 1500, "loan_amount": 250_000, "years_employed": 6},
        {"name": "John Doe", "credit_score": 550, "annual_income": 30_000, "total_monthly_debt": 1800, "loan_amount": 50_000, "years_employed": 1},
        {"name": "Jane Smith", "credit_score": 690, "annual_income": 65_000, "total_monthly_debt": 1200, "loan_amount": 180_000, "years_employed": 3},
    ]

    print("=" * 65)
    print("             FINANCIAL LOAN DECISION SYSTEM")
    print("=" * 65)
    for app in applicants:
        res = LoanRiskEvaluator.evaluate_application(app)
        print(f"Applicant: {res['applicant']:<12} -> {res['decision']}")
        print(f"  DTI: {res['dti_ratio']:.1%} | LTI: {res['loan_to_income']}x | {res['reason']}")
        print("-" * 65)
```

---

## Summary

In this lesson, you mastered conditional execution and decision branching in Python:
- Python uses significant whitespace (4 spaces) to define conditional code blocks.
- `if-elif-else` ladders evaluate sequentially from top to bottom and stop at the first matching branch.
- Use **Guard Clauses** (early returns) to eliminate deeply nested indentation and maintain flat, readable code.
- Use ternary expressions (`x if cond else y`) for concise variable assignments.
- Replace massive `if-elif` statements with **Dictionary Dispatch Tables** for $O(1)$ performance.
- Order branches by statistical probability to optimize runtime execution.

---

## Best Practices Checklist

- [ ] Structure functions with guard clauses to avoid the Arrow Anti-Pattern.
- [ ] End all `if`, `elif`, and `else` headers with a colon `:`.
- [ ] Order `elif` branches from most specific to least specific.
- [ ] Implement a default-deny security posture in authorization logic.
- [ ] Use ternary expressions only for simple, readable single-line assignments.

---

## What's Next?

Now that you understand conditional branching, continue to:
👉 **[For Loops & The Iteration Protocol](for-loops.md)** to master definite iteration, `range()`, nested loops, and collection traversal.
