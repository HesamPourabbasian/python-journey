# The Pytest Framework, Fixtures & Parametrization in Python

## Introduction

While Python's standard library `unittest` module is functional, modern Python engineering teams overwhelmingly prefer **`pytest`** as their primary testing framework.

Why has `pytest` become the undisputed industry standard?
1. **Zero Boilerplate**: In `pytest`, you do not need to subclass `unittest.TestCase` or remember 30 different assertion methods. You write simple, standard Python functions (`def test_feature():`) and use standard Python **`assert`** statements.
2. **Magic Assertion Rewriting**: When an assertion fails, `pytest` intercepts the Abstract Syntax Tree (AST) to produce rich, detailed failure introspection—printing the exact runtime values of every intermediate sub-expression in the failing line.
3. **Composable Dependency-Injection Fixtures**: Pytest completely replaces rigid `setUp`/`tearDown` class hierarchies with **Fixtures (`@pytest.fixture`)**, allowing modular, reusable, and scoped dependencies to be injected directly into test functions as arguments.
4. **Table-Driven Parametrization**: The **`@pytest.mark.parametrize`** decorator allows running a single test function across hundreds of input/output test vectors with clean, independent reporting.

This lesson explores `pytest` fundamentals, assertion rewriting, fixture scopes (`function`, `module`, `session`), the **`conftest.py`** discovery architecture, built-in fixtures (`tmp_path`, `monkeypatch`), and matrix parametrization.

---

## Prerequisites

Before studying Pytest, ensure you have:

- Completed [Unittest & Standard Library Testing](unittest-fundamentals.md).
- Completed [Function Decorators & Wrapper Architecture](../decorators/function-decorators.md).
- Completed [Generator Functions & The Yield Statement](../iterators-generators/generator-functions-and-yield.md).

---

## Core Concept: The Pytest Fixture & Parametrization Architecture

```
                          THE PYTEST COMPOSABLE FIXTURE PIPELINE

       conftest.py (Global Test Root)
      ┌────────────────────────────────────────────────────────┐
      │ @pytest.fixture(scope="session")                       │  <--- Setup Runs Once per Test Run!
      │ def db_engine(): ... yield engine; engine.dispose()    │  <--- Teardown Runs at Session End!
      └──────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼ Injected automatically into test module fixtures!
       test_services.py
      ┌────────────────────────────────────────────────────────┐
      │ @pytest.fixture(scope="function")                      │  <--- Setup Runs Before Every Test!
      │ def db_session(db_engine):                             │
      │     session = Session(db_engine)                       │
      │     yield session                                      │
      │     session.rollback()                                 │  <--- Teardown Runs After Every Test!
      └──────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼ Injected directly into test function parameters!
      ┌────────────────────────────────────────────────────────┐
      │ @pytest.mark.parametrize("role, allowed", [...])       │  <--- Table-Driven Inputs!
      │ def test_auth(db_session, role, allowed):              │
      │     assert check_permission(db_session, role) == allowed
      └────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Pytest Patterns

```python
import pytest
from pathlib import Path

# 1. Plain Assertions & pytest.raises
def test_calculation():
    result = 10 * 5
    assert result == 50  # Plain Python assert!

def test_exception_handling():
    with pytest.raises(ZeroDivisionError) as exc_info:
        _ = 10 / 0
    assert "division by zero" in str(exc_info.value)

# 2. Yield Fixture with Automated Teardown
@pytest.fixture
def temporary_database():
    # Setup Phase (Runs before test)
    print("\n[FIXTURE SETUP] Initializing in-memory DB...")
    db_store = {"users": []}
    
    yield db_store  # Injects db_store into the requesting test function!
    
    # Teardown Phase (Runs after test finishes)
    print("\n[FIXTURE TEARDOWN] Purging DB store...")
    db_store.clear()

def test_user_creation(temporary_database):
    temporary_database["users"].append("hesamp")
    assert len(temporary_database["users"]) == 1

# 3. Table-Driven Parametrization (@pytest.mark.parametrize)
@pytest.mark.parametrize("price, discount_pct, expected", [
    (100.0, 10.0, 90.0),
    (250.0, 20.0, 200.0),
    (50.0,  0.0,  50.0),
    (80.0,  50.0, 40.0),
])
def test_discount_calculation(price, discount_pct, expected):
    final_price = price * (1.0 - discount_pct / 100.0)
    assert final_price == expected
```

---

## Detailed Explanation

### 1. Magic Assertion Rewriting

In traditional Python, a failed `assert a == b` simply raises `AssertionError` with no details.

In `pytest`, an internal AST import hook intercepts test modules, rewriting `assert` statements. When an assertion fails, `pytest` inspects the entire expression tree and prints an informative visual diff:

```python
def test_comparison_failure():
    actual = {"id": 101, "role": "STANDARD_USER", "tags": ["alpha"]}
    expected = {"id": 101, "role": "ADMIN_USER", "tags": ["alpha"]}
    assert actual == expected
```

Pytest Failure Output:
```text
>       assert actual == expected
E       AssertionError: assert {'id': 101, 'role': 'STANDARD_USER', ...} == {'id': 101, 'role': 'ADMIN_USER', ...}
E         Differing items:
E         {'role': 'STANDARD_USER'} != {'role': 'ADMIN_USER'}
E         Full diff:
E         - {'id': 101, 'role': 'ADMIN_USER', 'tags': ['alpha']}
E         ?                      ^^^^^
E         + {'id': 101, 'role': 'STANDARD_USER', 'tags': ['alpha']}
E         ?                      ^^^^^^^^^
```

---

### 2. Fixture Scopes & `conftest.py`

Pytest fixtures support 5 hierarchical lifecycle **Scopes**:

1. **`function` (Default)**: Setup and teardown run **before and after every test function**.
2. **`class`**: Runs once per test class.
3. **`module`**: Runs once per Python test file (`test_*.py`).
4. **`package`**: Runs once per test package directory.
5. **`session`**: Runs **exactly once across the entire test suite run**. Ideal for spinning up Docker containers or compiling assets.

#### The Role of `conftest.py`:
Fixtures defined inside a file named **`conftest.py`** are **automatically available to all test files** in that directory and its subdirectories. You **never import `conftest`**; Pytest discovers it automatically through directory traversal.

---

### 3. Built-in Pytest Fixtures

Pytest provides essential pre-configured fixtures out of the box:
- **`tmp_path`**: Provides a unique, isolated `pathlib.Path` temporary directory created afresh for the test and automatically deleted after test runs.
- **`monkeypatch`**: Safely mocks environment variables, system attributes, or dictionary items during the test, automatically restoring original values on teardown.
- **`capsys`**: Captures stdout and stderr output for testing CLI printouts.

```python
def test_file_writing(tmp_path: Path):
    test_file = tmp_path / "output.txt"
    test_file.write_text("Hello Pytest")
    assert test_file.read_text() == "Hello Pytest"

def test_env_variable(monkeypatch):
    monkeypatch.setenv("APP_ENV", "TESTING")
    import os
    assert os.getenv("APP_ENV") == "TESTING"
```

---

## Examples

### 1. Simple: Floating-Point Testing with `pytest.approx`
Testing mathematical operations with floating-point tolerance.

```python
import pytest

def calculate_circle_area(radius: float) -> float:
    import math
    return math.pi * (radius ** 2)

def test_circle_area():
    # pytest.approx handles floating point precision tolerances automatically!
    assert calculate_circle_area(1.0) == pytest.approx(3.14159, rel=1e-3)
    assert (0.1 + 0.2) == pytest.approx(0.3)
```

### 2. Beginner: Testing Exceptions with `pytest.raises` and Error Attributes
Verifying specific exception types, messages, and custom error attributes.

```python
import pytest

class InsufficientBalanceError(Exception):
    def __init__(self, current: float, requested: float):
        self.current = current
        self.requested = requested
        super().__init__(f"Cannot withdraw ${requested}: current balance is ${current}")

def withdraw_funds(balance: float, amount: float) -> float:
    if amount > balance:
        raise InsufficientBalanceError(current=balance, requested=amount)
    return balance - amount

def test_withdraw_insufficient_funds():
    with pytest.raises(InsufficientBalanceError) as exc_info:
        withdraw_funds(balance=50.0, amount=100.0)

    # Verify exception message
    assert "Cannot withdraw $100.0" in str(exc_info.value)
    # Verify custom exception attributes
    assert exc_info.value.current == 50.0
    assert exc_info.value.requested == 100.0
```

### 3. Intermediate: Composable Database Fixtures with `yield`
Chaining session and connection fixtures for isolated database testing.

```python
import pytest
import sqlite3

@pytest.fixture(scope="module")
def shared_db_connection():
    """Module-scoped connection: opened once for the test file."""
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)")
    yield conn
    conn.close()

@pytest.fixture(scope="function")
def clean_db(shared_db_connection):
    """Function-scoped fixture: clears tables before each test."""
    shared_db_connection.execute("DELETE FROM users")
    shared_db_connection.commit()
    yield shared_db_connection

def test_insert_user(clean_db):
    clean_db.execute("INSERT INTO users (username) VALUES ('hesamp')")
    clean_db.commit()
    cursor = clean_db.execute("SELECT COUNT(*) FROM users")
    assert cursor.fetchone()[0] == 1

def test_db_is_clean(clean_db):
    # Proves clean_db fixture wiped the previous test's user!
    cursor = clean_db.execute("SELECT COUNT(*) FROM users")
    assert cursor.fetchone()[0] == 0
```

### 4. Real-World: Multi-Parameter Matrix Validation with `@pytest.mark.parametrize`
Testing a password security strength validator across positive, negative, and edge-case vectors.

```python
import pytest

def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not any(ch.isupper() for ch in password):
        return False, "Password must contain at least one uppercase letter."
    if not any(ch.isdigit() for ch in password):
        return False, "Password must contain at least one number."
    return True, "PASSWORD_STRONG"

@pytest.mark.parametrize("candidate, is_valid, expected_msg", [
    ("Password123", True,  "PASSWORD_STRONG"),
    ("short1A",     False, "Password must be at least 8 characters long."),
    ("nouppercase1",False, "Password must contain at least one uppercase letter."),
    ("NoDigitsHere",False, "Password must contain at least one number."),
    ("ValidPass99!",True,  "PASSWORD_STRONG"),
])
def test_password_policy_matrix(candidate, is_valid, expected_msg):
    valid, msg = validate_password_strength(candidate)
    assert valid is is_valid
    assert msg == expected_msg
```

### 5. Advanced: Custom Markers & Command-Line Filters
Defining custom test markers (`@pytest.mark.slow`, `@pytest.mark.integration`) and skipping conditionally.

```python
import pytest
import time

# Registering custom markers in pytest:
@pytest.mark.slow
def test_heavy_monte_carlo_simulation():
    time.sleep(0.05)  # Simulate expensive computation
    assert sum(range(100_000)) == 4_999_950_000

@pytest.mark.skip(reason="Legacy payment gateway is deprecated.")
def test_legacy_payment():
    assert False

@pytest.mark.xfail(reason="Known upstream bug under active patch in v2.1")
def test_known_bug():
    # Expected to fail! Does not fail the test suite run!
    assert 1 == 2
```

---

## Code Explanation

In Example 4 (`@pytest.mark.parametrize`):
1. The `@pytest.mark.parametrize("candidate, is_valid, expected_msg", [...])` decorator generates **5 completely independent test cases**.
2. When executed with `pytest -v`, Pytest prints a distinct green checkmark for every individual test vector (`test_password_policy_matrix[Password123-True-PASSWORD_STRONG]`, etc.).
3. If one vector fails, Pytest isolates that specific failure while continuing to execute the remaining test vectors.
4. This eliminates repetitive boilerplate and guarantees maximum test coverage.

---

## Common Mistakes

### Mistake 1: Explicitly Importing `conftest.py`
Never write `from conftest import my_fixture`! Pytest discovers fixtures in `conftest.py` automatically. Importing `conftest` manually causes circular import errors and duplicate fixture registrations.

### Mistake 2: Placing Cleanup Code Outside `try...finally` in Yield Fixtures
If a test raises an unexpected exception and the fixture code after `yield` is not protected by `try...finally`, the teardown code will **never execute**, leaking resources.

```python
# BROKEN:
@pytest.fixture
def risky_resource():
    resource = allocate()
    yield resource
    resource.close() # Skipped if allocate() or test crashes! ❌

# CORRECT:
@pytest.fixture
def safe_resource():
    resource = allocate()
    try:
        yield resource
    finally:
        resource.close() # ALWAYS runs! ✅
```

---

## Best Practices

### Name Fixtures as Nouns and Tests as Actions
Name fixtures after the resource they provide (`db_session`, `auth_headers`, `temp_directory`) and test functions after the action and expected outcome (`test_user_registration_with_valid_email_creates_record`).

Good:
```python
def test_invoice_creation(db_session, valid_customer): ...
```

---

## Performance Considerations

1. **Parallel Test Execution with `pytest-xdist`**: Run test suites across all CPU cores in parallel:
   ```bash
   pytest -n auto
   ```
   For large test suites (5,000 tests), `pytest-xdist` reduces execution time from **2 minutes to 15 seconds**.
2. **Session Scoping for Expensive Resources**: Use `@pytest.fixture(scope="session")` to share expensive Docker containers or database connection pools across all tests.

---

## Security Considerations

1. **Deterministic Mocking of External APIs**: Never allow test suites to make real live HTTP calls to external production APIs or payment gateways during CI runs. Use mocking or `vcrpy` to record and replay responses.

---

## Real-World Usage

- **FastAPI / Django REST Framework**: Testing REST endpoints with `pytest` and `httpx.AsyncClient`.
- **Data Engineering (Pandas / PySpark)**: Testing data transformation pipelines using `@pytest.mark.parametrize`.
- **Machine Learning (PyTorch)**: Validating neural network tensor shape invariants across batches.

---

## Comparison: Pytest vs Unittest

| Feature | `unittest` | `pytest` |
|---|---|---|
| **Test Style** | Object-Oriented (`TestCase`)| **Functional (`def test_*`)** |
| **Assertions** | `self.assertEqual`, `assertRaises`| **Plain Python `assert`** |
| **Failure Diffs** | Basic string messages | **Detailed AST sub-expression diffs**|
| **Fixtures** | `setUp()` / `tearDown()` | **Dependency-injected `@pytest.fixture`**|
| **Parametrization**| `self.subTest()` (manual) | **Declarative `@pytest.mark.parametrize`**|
| **Plugin Ecosystem**| Minimal | **Thousands (`pytest-xdist`, `pytest-cov`, `pytest-asyncio`)**|

---

## Advanced Concepts: Useful Pytest CLI Commands

Mastering the Pytest Command-Line Interface:

```bash
# Run tests with detailed verbose output:
pytest -v

# Run only tests matching a name pattern:
pytest -k "test_discount or test_auth"

# Run only tests matching a specific marker:
pytest -m "slow"

# Stop execution immediately on the first failure:
pytest -x

# Re-run ONLY the tests that failed in the last run:
pytest --lf
```

---

## Exercises

### Exercise 1 — Beginner
Write a function `sanitize_username(username: str) -> str` that strips whitespace, lowercases the string, and replaces spaces with underscores. Write 4 tests using plain `assert`.

### Exercise 2 — Intermediate
Create a `@pytest.fixture` that yields a temporary JSON file using `tmp_path` populated with sample user data. Write two test functions that consume this fixture, verify data reads, and verify mutations.

### Exercise 3 — Advanced
Using `@pytest.mark.parametrize`, write a table-driven test suite for an e-commerce shipping cost calculator `calculate_shipping(weight_kg: float, distance_km: float, is_express: bool) -> float` covering 8 distinct parameter combinations.

---

## Mini Project: Enterprise E-Commerce Discount Engine & Automated Pytest Suite

### Requirements
Build an operational e-commerce discounting engine and its automated `pytest` test suite named `test_discount_engine.py`. Implement tiered volume discounting, VIP customer multipliers, coupon code applications, and table-driven parametrization tests covering all boundary conditions and error states.

### Implementation Blueprint
```python
import pytest
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. CORE BUSINESS LOGIC
# =====================================================================

@dataclass
class CartItem:
    sku: str
    unit_price: float
    quantity: int

    @property
    def subtotal(self) -> float:
        return round(self.unit_price * self.quantity, 2)

class DiscountCalculator:
    VALID_COUPONS = {
        "WELCOME10": 0.10,
        "VIP20": 0.20,
        "HALFOFF": 0.50
    }

    @staticmethod
    def calculate_cart_total(
        items: list[CartItem],
        is_vip: bool = False,
        coupon_code: Optional[str] = None
    ) -> float:
        if not items:
            return 0.0

        gross = sum(item.subtotal for item in items)
        discount_rate = 0.0

        # 1. Volume Discount
        if gross >= 500.0:
            discount_rate += 0.10
        elif gross >= 200.0:
            discount_rate += 0.05

        # 2. VIP Member Discount
        if is_vip:
            discount_rate += 0.05

        # 3. Coupon Application
        if coupon_code:
            code_upper = coupon_code.upper().strip()
            if code_upper not in DiscountCalculator.VALID_COUPONS:
                raise ValueError(f"Invalid coupon code: '{coupon_code}'")
            discount_rate += DiscountCalculator.VALID_COUPONS[code_upper]

        # Maximum discount cap: 60%
        discount_rate = min(0.60, discount_rate)
        
        final_total = gross * (1.0 - discount_rate)
        return round(final_total, 2)

# =====================================================================
# 2. PYTEST TEST SUITE
# =====================================================================

@pytest.fixture
def sample_cart():
    """Provides a standard shopping cart of $250.00 gross total."""
    return [
        CartItem("KEYBOARD", unit_price=150.00, quantity=1),
        CartItem("MOUSE", unit_price=50.00, quantity=2),
    ]

def test_empty_cart():
    assert DiscountCalculator.calculate_cart_total([]) == 0.0

def test_standard_volume_discount(sample_cart):
    # $250 gross -> 5% volume discount -> $237.50
    total = DiscountCalculator.calculate_cart_total(sample_cart, is_vip=False)
    assert total == 237.50

def test_vip_with_volume_discount(sample_cart):
    # $250 gross -> 5% volume + 5% VIP = 10% discount -> $225.00
    total = DiscountCalculator.calculate_cart_total(sample_cart, is_vip=True)
    assert total == 225.00

def test_invalid_coupon_raises_value_error(sample_cart):
    with pytest.raises(ValueError) as exc_info:
        DiscountCalculator.calculate_cart_total(sample_cart, coupon_code="FAKE_COUPON")
    assert "Invalid coupon code" in str(exc_info.value)

# Table-Driven Parametrized Matrix
@pytest.mark.parametrize("items, is_vip, coupon, expected_total", [
    ([CartItem("ITEM1", 100.0, 1)], False, None,        100.00), # No discount
    ([CartItem("ITEM1", 100.0, 1)], True,  None,        95.00),  # 5% VIP
    ([CartItem("ITEM1", 100.0, 1)], False, "WELCOME10", 90.00),  # 10% Coupon
    ([CartItem("ITEM1", 600.0, 1)], True,  "VIP20",     390.00), # 10% Vol + 5% VIP + 20% Coupon = 35% off ($600 * 0.65 = $390)
    ([CartItem("ITEM1", 1000.0,1)], True,  "HALFOFF",   400.00), # 10% Vol + 5% VIP + 50% Coupon = 65% -> CAPPED AT 60% ($400)
])
def test_discount_matrix(items, is_vip, coupon, expected_total):
    total = DiscountCalculator.calculate_cart_total(items, is_vip=is_vip, coupon_code=coupon)
    assert total == expected_total

if __name__ == "__main__":
    # Programmatic invocation of pytest
    print("=" * 68)
    print("      RUNNING ENTERPRISE PYTEST SUITE: DISCOUNT ENGINE")
    print("=" * 68)
    pytest.main(["-v", __file__])
```

---

## Summary

In this lesson, you mastered the `pytest` testing framework:
- **`pytest` eliminates boilerplate** using standard Python functions and plain **`assert`** statements.
- **Magic Assertion Rewriting** provides detailed sub-expression failure introspection.
- **Fixtures (`@pytest.fixture`)** provide modular dependency injection with clean **`yield`** setup and teardown phases.
- Manage fixture lifecycles with **Scopes** (`function`, `class`, `module`, `session`).
- Share global fixtures automatically across test modules using **`conftest.py`**.
- Execute table-driven test vectors with **`@pytest.mark.parametrize`**.
- Leverage built-in fixtures like **`tmp_path`** and **`monkeypatch`** for isolated filesystem and environment testing.

---

## Best Practices Checklist

- [ ] Use plain `assert` statements for all assertions in Pytest.
- [ ] Use `conftest.py` for shared repository-wide fixtures.
- [ ] Wrap teardown code in `try...finally` blocks inside yield fixtures.
- [ ] Use `tmp_path` for temporary file operations in tests.
- [ ] Use `@pytest.mark.parametrize` for table-driven testing.
- [ ] Execute tests in parallel with `pytest -n auto`.

---

## What's Next?

Now that you understand Pytest and fixtures, continue to the final article in this module:
👉 **[Mocking, Test Doubles & Coverage](mocking-and-test-coverage.md)** to master `unittest.mock`, `MagicMock`, `@patch`, `AsyncMock`, and measuring statement/branch coverage with `pytest-cov`!
