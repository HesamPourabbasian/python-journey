# Unittest & Standard Library Testing in Python

## Introduction

In professional software development, automated testing is the foundational safeguard of software reliability. Writing comprehensive automated tests ensures that new code does not introduce regressions, guarantees that edge cases and error states are handled gracefully, and empowers engineering teams to refactor systems fearlessly.

Python includes a complete, enterprise-grade testing framework directly in its standard library: the **`unittest`** module (historically known as *PyUnit*).

Built upon the universal **xUnit Architecture** (the same testing pattern found in JUnit for Java, NUnit for .NET, and SUnit for Smalltalk), `unittest` provides an object-oriented testing foundation:
- **Test Cases**: The smallest unit of testing, encapsulating individual tests inside `unittest.TestCase` subclasses.
- **Rich Assertions**: Over 30 specialized assertion methods that provide clear, informative failure diffs (`assertEqual`, `assertRaises`, `assertAlmostEqual`).
- **Test Fixtures**: Deterministic setup and teardown lifecycle hooks (`setUp`, `tearDown`, `setUpClass`).
- **Test Runners & Test Discovery**: Automated discovery and execution of test suites across multi-package projects.

This lesson explores `unittest.TestCase`, assertion mechanics, lifecycle fixtures, testing exceptions with context managers, table-driven subtests (`self.subTest`), and test discovery.

---

## Prerequisites

Before studying `unittest`, ensure you have:

- Completed [Classes & Objects](../oop/classes-and-objects.md) and [Inheritance](../oop/inheritance-and-polymorphism.md).
- Completed [Exception Handling](../../beginner/exceptions/README.md).
- Familiarity with the Python command line.

---

## Core Concept: The xUnit Test Architecture

```
                             THE xUnit TEST EXECUTION LIFECYCLE

                         [ TestCase Class Initialization ]
                                         │
                                         ▼
                            setUpClass() [Runs Once]
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
                 [ Test Method 1 ]                 [ Test Method 2 ]
                 1. setUp()                        1. setUp()
                 2. test_feature_a()               2. test_feature_b()
                 3. tearDown()                     3. tearDown()
                        └────────────────┬────────────────┘
                                         ▼
                           tearDownClass() [Runs Once]
```

---

## Syntax & Essential `unittest` Patterns

```python
import unittest

# 1. Subclassing unittest.TestCase
class TestCalculator(unittest.TestCase):

    # Lifecycle Setup: Runs BEFORE EVERY test method!
    def setUp(self):
        self.base_multiplier = 2

    # Lifecycle Teardown: Runs AFTER EVERY test method!
    def tearDown(self):
        pass

    # 2. Test Methods (MUST start with 'test_')
    def test_multiplication(self):
        result = 5 * self.base_multiplier
        self.assertEqual(result, 10, "5 * 2 should equal 10")

    # 3. Floating-Point Comparison (Overcomes IEEE 754 precision issues!)
    def test_float_addition(self):
        # self.assertEqual(0.1 + 0.2, 0.3) -> FAILS due to 0.30000000000000004!
        self.assertAlmostEqual(0.1 + 0.2, 0.3, places=7)

    # 4. Testing Exceptions with Context Managers
    def test_zero_division_raises_error(self):
        with self.assertRaises(ZeroDivisionError):
            _ = 10 / 0

    # 5. Table-Driven Parameterized Subtests (self.subTest)
    def test_even_numbers(self):
        test_cases = [2, 4, 6, 8, 10]
        for num in test_cases:
            with self.subTest(num=num):
                self.assertEqual(num % 2, 0)

if __name__ == "__main__":
    unittest.main()
```

---

## Detailed Explanation

### 1. Essential `unittest` Assertion Methods

Using specialized `unittest` assertions provides rich, human-readable failure messages when tests fail, unlike raw `assert` statements:

| Assertion Method | Condition Checked | Best Used For |
|---|---|---|
| **`self.assertEqual(a, b)`** | `a == b` | Comparing values, dicts, lists |
| **`self.assertNotEqual(a, b)`**| `a != b` | Ensuring inequality |
| **`self.assertTrue(x)`** | `bool(x) is True` | Checking boolean flags |
| **`self.assertFalse(x)`** | `bool(x) is False`| Checking boolean flags |
| **`self.assertIs(a, b)`** | `a is b` | Identity checks (`None`, singletons)|
| **`self.assertIsNone(x)`** | `x is None` | Checking optional return values |
| **`self.assertIn(a, b)`** | `a in b` | Membership in strings, collections |
| **`self.assertAlmostEqual(a,b)`**| `round(a-b, 7) == 0`| **Floating-point mathematical results**|
| **`self.assertRaises(Exc)`** | `raises Exception`| **Verifying error conditions** |
| **`self.assertGreater(a, b)`** | `a > b` | Numerical comparisons |

---

### 2. The Floating-Point Assertion Rule

In computing, binary floating-point numbers cannot represent decimal fractions like $0.1$ or $0.2$ with exact precision (IEEE 754):

```python
# 0.1 + 0.2 == 0.30000000000000004
```

Never use `assertEqual()` to test floating-point numbers! Always use **`self.assertAlmostEqual(a, b, places=7)`**, which checks that the difference $|a - b| < 10^{-7}$.

---

### 3. Test Isolation: `setUp()` vs `setUpClass()`

- **`setUp(self)`**: Executes afresh **before every single test method**. Use this to create new object instances, resetting state to guarantee that tests remain strictly independent and isolated.
- **`tearDown(self)`**: Executes **after every single test method**, even if the test failed. Use this to delete temporary files, close database sockets, or clear queues.
- **`setUpClass(cls)` (`@classmethod`)**: Executes **once per test case class** before any test runs. Use this for expensive shared operations (such as initializing an in-memory SQLite database or spinning up a mock server).
- **`tearDownClass(cls)` (`@classmethod`)**: Executes **once per test case class** after all tests finish.

---

### 4. Parameterized Testing with `self.subTest()`

When testing a function across 10 different inputs, running a plain `for` loop inside a test has a major flaw: **if the 2nd input fails, the loop halts, and inputs 3 through 10 are never tested!**

Wrapping each iteration in **`with self.subTest(param=val):`** ensures that:
1. Every input case executes independently.
2. If case #2 fails, `unittest` logs the failure with its specific parameters and continues running cases #3 through #10!

---

## Examples

### 1. Simple: Testing a String Utilities Module
Testing basic string capitalization, truncation, and validation.

```python
import unittest

def truncate_text(text: str, max_len: int) -> str:
    if max_len <= 0: raise ValueError("max_len must be positive.")
    if len(text) <= max_len: return text
    return text[:max_len - 3] + "..."

class TestStringUtilities(unittest.TestCase):
    def test_short_string_not_truncated(self):
        self.assertEqual(truncate_text("Hello", 10), "Hello")

    def test_long_string_truncated_with_ellipsis(self):
        self.assertEqual(truncate_text("Hello World", 8), "Hello...")

    def test_negative_length_raises_error(self):
        with self.assertRaises(ValueError):
            truncate_text("Hello", -5)
```

### 2. Beginner: Bank Account State & Mutation Tests
Testing deposit, withdrawal, and negative balance invariants using `setUp()`.

```python
import unittest

class BankAccount:
    def __init__(self, initial_balance: float = 0.0):
        if initial_balance < 0: raise ValueError("Initial balance cannot be negative.")
        self.balance = initial_balance

    def deposit(self, amount: float):
        if amount <= 0: raise ValueError("Deposit must be positive.")
        self.balance += amount

    def withdraw(self, amount: float):
        if amount <= 0: raise ValueError("Withdrawal must be positive.")
        if amount > self.balance: raise ValueError("Insufficient funds.")
        self.balance -= amount

class TestBankAccount(unittest.TestCase):
    def setUp(self):
        # Fresh account created before every test method!
        self.account = BankAccount(100.0)

    def test_initial_balance(self):
        self.assertEqual(self.account.balance, 100.0)

    def test_deposit_increases_balance(self):
        self.account.deposit(50.0)
        self.assertEqual(self.account.balance, 150.0)

    def test_withdraw_decreases_balance(self):
        self.account.withdraw(30.0)
        self.assertEqual(self.account.balance, 70.0)

    def test_overdraft_raises_insufficient_funds(self):
        with self.assertRaises(ValueError) as context:
            self.account.withdraw(500.0)
        self.assertIn("Insufficient funds", str(context.exception))
```

### 3. Intermediate: Testing Custom Collections with Rich Assertions
Testing custom sequence container behaviors and membership invariants.

```python
import unittest

class PriorityTaskList:
    def __init__(self): self.tasks = []
    def add(self, task: str): self.tasks.append(task)
    def __len__(self): return len(self.tasks)
    def __contains__(self, item): return item in self.tasks

class TestPriorityTaskList(unittest.TestCase):
    def setUp(self):
        self.todo = PriorityTaskList()
        self.todo.add("Deploy API")
        self.todo.add("Run Unit Tests")

    def test_length(self):
        self.assertEqual(len(self.todo), 2)

    def test_membership(self):
        self.assertIn("Deploy API", self.todo)
        self.assertNotIn("Delete DB", self.todo)

    def test_task_sequence(self):
        self.assertListEqual(self.todo.tasks, ["Deploy API", "Run Unit Tests"])
```

### 4. Real-World: Testing a Persistent File Store with `setUpClass` / `tearDownClass`
Testing a disk-backed JSON key-value store using class-level fixtures for isolated directory lifecycle management.

```python
import unittest
import json
import shutil
from pathlib import Path

class JSONDiskStore:
    def __init__(self, file_path: Path):
        self.path = file_path
        self._data = {}
        if self.path.exists():
            self._data = json.loads(self.path.read_text())

    def set(self, key: str, value: any):
        self._data[key] = value
        self.path.write_text(json.dumps(self._data))

    def get(self, key: str) -> any:
        return self._data.get(key)

class TestJSONDiskStore(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create isolated temporary test directory once for all tests in class!
        cls.test_dir = Path("/tmp/unittest_disk_store")
        cls.test_dir.mkdir(parents=True, exist_ok=True)
        cls.db_file = cls.test_dir / "test_db.json"

    @classmethod
    def tearDownClass(cls):
        # Clean up directory completely after all tests finish!
        if cls.test_dir.exists():
            shutil.rmtree(cls.test_dir)

    def setUp(self):
        # Reset database file before each test
        if self.db_file.exists():
            self.db_file.unlink()
        self.store = JSONDiskStore(self.db_file)

    def test_persistence_across_instances(self):
        self.store.set("session_token", "xyz_secret_990")
        
        # Load fresh store instance pointing to same file
        reloaded_store = JSONDiskStore(self.db_file)
        self.assertEqual(reloaded_store.get("session_token"), "xyz_secret_990")
```

### 5. Advanced: Table-Driven Testing with Subtests & Skip Conditions
Using `self.subTest()` and conditional skipping decorators (`@unittest.skipIf`).

```python
import unittest
import sys

def parse_port(port_str: str) -> int:
    try:
        val = int(port_str)
        if 1 <= val <= 65535:
            return val
    except ValueError:
        pass
    raise ValueError(f"Invalid network port: '{port_str}'")

class TestPortParser(unittest.TestCase):
    def test_valid_ports_table(self):
        valid_cases = [("80", 80), ("443", 443), ("8080", 8080), ("65535", 65535)]
        for port_str, expected in valid_cases:
            with self.subTest(port_input=port_str):
                self.assertEqual(parse_port(port_str), expected)

    def test_invalid_ports_table(self):
        invalid_cases = ["0", "70000", "-1", "http", "80.5", ""]
        for port_str in invalid_cases:
            with self.subTest(invalid_port=port_str):
                with self.assertRaises(ValueError):
                    parse_port(port_str)

    # Conditional Skip Decorator
    @unittest.skipIf(sys.platform == "win32", "POSIX-specific test skipped on Windows")
    def test_posix_socket_permissions(self):
        self.assertTrue(True)
```

---

## Code Explanation

In Example 5 (`TestPortParser`):
1. `test_valid_ports_table` iterates over multiple `(input, expected)` test pairs.
2. `with self.subTest(port_input=port_str):` registers each iteration as an independent subtest in the test runner.
3. If `"70000"` fails to raise a `ValueError`, `unittest` flags that specific subtest with its parameters while continuing to execute the remaining test cases.
4. `@unittest.skipIf(condition, reason)` allows skipping platform-specific tests conditionally without polluting test failure logs.

---

## Common Mistakes

### Mistake 1: Relying on Test Execution Order
Writing tests where `test_step_2()` assumes `test_step_1()` ran previously: `unittest` does **not guarantee execution order** (it orders tests lexicographically by method name). Every test must be **100% independent and self-contained**.

### Mistake 2: Missing Cleanup in `tearDown()`
If a test creates temporary files on disk or opens network sockets without closing them in `tearDown()`, subsequent tests or subsequent test suite runs will fail due to leftover dirty state.

---

## Best Practices

### Name Test Methods Descriptively
Follow the standard naming convention: `test_<unit_of_work>_<state_under_test>_<expected_behavior>`:

Good:
```python
def test_withdraw_with_insufficient_funds_raises_value_error(self): ...
```

Avoid:
```python
def test_withdraw(self): ... # Too vague!
```

---

## Performance Considerations

1. **Running Test Discovery**: Execute all tests across your repository in one command:
   ```bash
   python -m unittest discover -s tests -p "test_*.py"
   ```
2. **Isolating Fast vs Slow Tests**: Use `@unittest.skip` or custom test suites to separate fast in-memory unit tests (executing in <1 second) from slow end-to-end integration tests that hit disk or external databases.

---

## Security Considerations

1. **Never Use Production Secrets in Test Fixtures**: Hardcoded test credentials should be strictly dummy data (e.g. `mock_token_123`).
2. **Automated Resource Cleanup**: Ensure `tearDown` cleans up test databases and temporary keys to avoid leaking sensitive test data in shared CI environments.

---

## Real-World Usage

- **Python Standard Library Core Tests**: The entire Python language is tested using `unittest`.
- **Zero-Dependency SDKs**: Writing SDK clients that require zero external dependencies (`pip install`).
- **Base Integration Frameworks**: Foundation for Django's `django.test.TestCase`.

---

## Comparison: Python Testing Frameworks

| Feature | `unittest` | `pytest` | `doctest` |
|---|---|---|---|
| **Standard Library?** | **Yes (Built-in)** | No (`pip install`) | **Yes (Built-in)** |
| **Test Style** | Object-Oriented (`TestCase`)| Functional (Plain `def` & `assert`)| Docstring Examples |
| **Fixtures** | `setUp` / `tearDown` | **Composable Dependency Injection**| None |
| **Parametrization** | `self.subTest()` | **`@pytest.mark.parametrize`** | None |
| **Community Standard**| SDKs, Zero-dep packages| **Industry Standard Web / App Testing**| Documentation validation |

---

## Advanced Concepts: Custom TestSuites

You can group specific test cases into custom test suites programmatically:

```python
def suite():
    s = unittest.TestSuite()
    s.addTest(TestCalculator("test_multiplication"))
    s.addTest(TestStringUtilities("test_short_string_not_truncated"))
    return s

# runner = unittest.TextTestRunner(verbosity=2)
# runner.run(suite())
```

---

## Exercises

### Exercise 1 — Beginner
Write a function `is_palindrome(s: str) -> bool`. Create a `TestPalindrome(unittest.TestCase)` testing 3 valid palindromes, 3 invalid palindromes, and empty strings.

### Exercise 2 — Intermediate
Build a `TemperatureConverter` class with methods `celsius_to_fahrenheit()` and `fahrenheit_to_celsius()`. Write a test case using `self.assertAlmostEqual()` and `self.subTest()` across 5 temperature conversion points.

### Exercise 3 — Advanced
Build a `RateLimiter` class that allows $N$ actions per second. Write a test case using `time.sleep` and `unittest.TestCase` that tests that exceeding the quota raises a `RuntimeError` and waiting the requisite delay allows subsequent requests.

---

## Mini Project: Enterprise Financial Ledger & Transaction Processing Test Suite

### Requirements
Build an operational financial ledger engine and its comprehensive `unittest` test suite named `test_financial_ledger.py`. Implement balance tracking, atomic transfers, overdraft protection, and full test suite verification covering edge cases, exceptions, subtests, and floating-point assertions.

### Implementation Blueprint
```python
import unittest
from datetime import datetime, timezone
from dataclasses import dataclass

# =====================================================================
# 1. CORE DOMAIN LOGIC
# =====================================================================

@dataclass
class TransactionRecord:
    tx_id: str
    from_acc: str
    to_acc: str
    amount: float
    timestamp: str

class FinancialLedger:
    def __init__(self):
        self._accounts: dict[str, float] = {}
        self._ledger: list[TransactionRecord] = []

    def open_account(self, account_id: str, initial_deposit: float = 0.0):
        if account_id in self._accounts:
            raise KeyError(f"Account '{account_id}' already exists.")
        if initial_deposit < 0.0:
            raise ValueError("Initial deposit cannot be negative.")
        self._accounts[account_id] = round(float(initial_deposit), 2)

    def get_balance(self, account_id: str) -> float:
        if account_id not in self._accounts:
            raise KeyError(f"Account '{account_id}' not found.")
        return self._accounts[account_id]

    def transfer_funds(self, from_acc: str, to_acc: str, amount: float) -> str:
        if from_acc not in self._accounts or to_acc not in self._accounts:
            raise KeyError("One or both accounts do not exist.")
        if amount <= 0:
            raise ValueError("Transfer amount must be strictly positive.")
        if self._accounts[from_acc] < amount:
            raise ValueError(f"Insufficient funds in account '{from_acc}'.")

        # Atomic Execution
        self._accounts[from_acc] = round(self._accounts[from_acc] - amount, 2)
        self._accounts[to_acc] = round(self._accounts[to_acc] + amount, 2)

        tx_id = f"TX-{len(self._ledger) + 1:04d}"
        now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
        record = TransactionRecord(tx_id, from_acc, to_acc, amount, now_ts)
        self._ledger.append(record)
        return tx_id

# =====================================================================
# 2. ENTERPRISE UNITTEST TEST SUITE
# =====================================================================

class TestFinancialLedger(unittest.TestCase):
    def setUp(self):
        """Runs BEFORE every test method: Fresh isolated ledger."""
        self.ledger = FinancialLedger()
        self.ledger.open_account("ACC-101", initial_deposit=1000.00)
        self.ledger.open_account("ACC-202", initial_deposit=500.00)

    def test_account_creation(self):
        self.assertAlmostEqual(self.ledger.get_balance("ACC-101"), 1000.00, places=2)
        self.assertAlmostEqual(self.ledger.get_balance("ACC-202"), 500.00, places=2)

    def test_duplicate_account_creation_raises_key_error(self):
        with self.assertRaises(KeyError):
            self.ledger.open_account("ACC-101", 100.0)

    def test_negative_initial_deposit_raises_value_error(self):
        with self.assertRaises(ValueError):
            self.ledger.open_account("ACC-303", initial_deposit=-50.0)

    def test_successful_fund_transfer(self):
        tx_id = self.ledger.transfer_funds("ACC-101", "ACC-202", amount=250.50)
        self.assertTrue(tx_id.startswith("TX-"))
        self.assertAlmostEqual(self.ledger.get_balance("ACC-101"), 749.50, places=2)
        self.assertAlmostEqual(self.ledger.get_balance("ACC-202"), 750.50, places=2)

    def test_insufficient_funds_transfer_raises_value_error(self):
        with self.assertRaises(ValueError) as ctx:
            self.ledger.transfer_funds("ACC-202", "ACC-101", amount=9999.00)
        self.assertIn("Insufficient funds", str(ctx.exception))
        # Ensure balances were not mutated (Rollback integrity)
        self.assertAlmostEqual(self.ledger.get_balance("ACC-202"), 500.00, places=2)

    def test_invalid_transfer_amounts_table(self):
        invalid_amounts = [0.0, -10.0, -0.01]
        for amt in invalid_amounts:
            with self.subTest(amount=amt):
                with self.assertRaises(ValueError):
                    self.ledger.transfer_funds("ACC-101", "ACC-202", amount=amt)

if __name__ == "__main__":
    print("=" * 68)
    print("      RUNNING ENTERPRISE UNITTEST SUITE: FINANCIAL LEDGER")
    print("=" * 68)
    # Run test runner with high verbosity
    suite = unittest.TestLoader().loadTestsFromTestCase(TestFinancialLedger)
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)
```

---

## Summary

In this lesson, you mastered Python's standard library `unittest` framework:
- **`unittest.TestCase`** organizes tests in clean, isolated class structures following the **xUnit Architecture**.
- Use **`setUp()`** and **`tearDown()`** for per-test isolation; use **`setUpClass()`** for expensive class-wide fixtures.
- Test floating-point numbers with **`assertAlmostEqual()`** to avoid IEEE 754 precision failures.
- Verify expected error conditions using **`with self.assertRaises(Exception):`**.
- Execute table-driven parameterized testing with **`self.subTest()`**.
- Discover and execute entire test suites using **`python -m unittest discover`**.

---

## Best Practices Checklist

- [ ] Ensure test methods start with `test_` and have descriptive names.
- [ ] Use `setUp()` to guarantee fresh, isolated state before every test.
- [ ] Always clean up external disk/network resources in `tearDown()`.
- [ ] Use `assertAlmostEqual()` for floating-point comparisons.
- [ ] Use `self.subTest()` when looping over multiple test input cases.
- [ ] Ensure tests are completely independent and never rely on execution order.

---

## What's Next?

Now that you understand `unittest` and standard library testing, continue to:
👉 **[The Pytest Framework, Fixtures & Parametrization](pytest-framework-fixtures-parametrization.md)** to master modern Pythonic testing with plain `assert`, dependency injection fixtures, and `@pytest.mark.parametrize`!
