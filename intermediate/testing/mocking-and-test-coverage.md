# Mocking, Test Doubles & Coverage in Python

## Introduction

In modern software development, true **Unit Tests** must test business logic in strict isolation. If a unit test executes real HTTP network calls to Stripe, writes to production databases, or sends live customer emails, that test will be:
- **Slow**: Network calls introduce hundreds of milliseconds of latency.
- **Flaky**: Transient network drops or rate limits will cause tests to fail randomly.
- **Dangerous**: Tests might accidentally charge real credit cards or mutate production data.

To isolate external dependencies, software engineers use **Test Doubles**.

Python provides a world-class mocking toolkit directly in the standard library: **`unittest.mock`**.

Using **`Mock`**, **`MagicMock`**, **`AsyncMock`**, and the **`@patch`** decorator, you can intercept external API calls, simulate network timeouts or database crashes with **`side_effect`**, and verify that your application executed expected operations.

Furthermore, you will learn to measure **Statement and Branch Coverage** using **`coverage.py`** / **`pytest-cov`** to mathematically verify that all execution paths in your codebase are tested.

This lesson concludes **Module 9: Testing & Quality Assurance in Depth**, mastering test doubles, mocking boundaries, and CI/CD coverage enforcement.

---

## Prerequisites

Before studying mocking and coverage, ensure you have:

- Completed [Unittest](unittest-fundamentals.md) and [Pytest](pytest-framework-fixtures-parametrization.md).
- Completed [HTTP Fundamentals & The Requests Library](../apis-and-networking/http-fundamentals-and-requests.md).
- Familiarity with Python decorators and context managers.

---

## Core Concept: The Test Double Taxonomy

```
                              THE TEST DOUBLE TAXONOMY

     ┌──────────────┬─────────────────────────────────────────────────────────────┐
     │ Type         │ Definition & Typical Implementation                         │
     ├──────────────┼─────────────────────────────────────────────────────────────┤
     │ 1. Dummy     │ Passed to satisfy parameter signatures; never actually used.│
     ├──────────────┼─────────────────────────────────────────────────────────────┤
     │ 2. Stub      │ Provides pre-canned hardcoded answers: mock.return_value=...│
     ├──────────────┼─────────────────────────────────────────────────────────────┤
     │ 3. Spy       │ Records call counts, arguments: mock.assert_called_with(...)│
     ├──────────────┼─────────────────────────────────────────────────────────────┤
     │ 4. Mock      │ Pre-programmed with behavioral expectations and assertions. │
     ├──────────────┼─────────────────────────────────────────────────────────────┤
     │ 5. Fake      │ Working lightweight implementation (e.g. In-Memory Dict DB).│
     └──────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Syntax & Essential Mocking Patterns

```python
from unittest.mock import Mock, MagicMock, patch, AsyncMock
import pytest

# 1. Basic MagicMock with return_value
weather_api_mock = MagicMock()
weather_api_mock.get_temperature.return_value = 22.5

print("Mocked Temp:", weather_api_mock.get_temperature("San Francisco")) # 22.5
weather_api_mock.get_temperature.assert_called_once_with("San Francisco") # Spy verification!

# 2. Simulating Exceptions with side_effect
database_mock = MagicMock()
database_mock.query.side_effect = ConnectionError("504 Database Gateway Timeout")

try:
    database_mock.query("SELECT * FROM users")
except ConnectionError as err:
    print(f"Caught Simulated Failure: {err}")

# 3. Patching External Modules with @patch
# target_module.py: import requests -> requests.get()
# @patch("target_module.requests.get")
# def test_network_fetch(mock_get):
#     mock_get.return_value.status_code = 200
#     mock_get.return_value.json.return_value = {"status": "SUCCESS"}
#     ...

# 4. Asynchronous Mocks (AsyncMock)
async def test_async_service():
    async_mailer = AsyncMock()
    async_mailer.send_email.return_value = True
    
    result = await async_mailer.send_email("hesam@domain.com", "Welcome!")
    assert result is True
    async_mailer.send_email.assert_awaited_once()
```

---

## Detailed Explanation

### 1. The Golden Rule: "Where to Patch"

The single most common mistake in Python testing is patching an object where it is *defined* rather than where it is *looked up*.

Suppose `my_service.py` contains:
```python
# my_service.py
from datetime import datetime

def get_current_year():
    return datetime.now().year
```

- 🚨 **WRONG**: `@patch("datetime.datetime.now")` (Patches the standard library module, but `my_service` already imported its local reference!).
- ✅ **CORRECT**: `@patch("my_service.datetime")` (Patches the reference **where it is looked up in `my_service`**!).

$$\textbf{Golden Rule: Patch where an object is \underline{USED/IMPORTED}, not where it is defined!}$$

---

### 2. `return_value` vs `side_effect`

- **`return_value`**: Returns a static value whenever the mock is called.
- **`side_effect`**:
  1. **Raise Exceptions**: `mock.side_effect = TimeoutError("Connection dropped")`.
  2. **Dynamic Logic**: `mock.side_effect = lambda x: x * 2`.
  3. **Sequential Returns**: Pass a list `mock.side_effect = [10, 20, 30]`. Each subsequent call pops and returns the next value in the list!

---

### 3. Preventing Mock Typos with `autospec=True` / `spec`

By default, calling *any* non-existent attribute on a `MagicMock` succeeds and returns another mock:

```python
m = MagicMock()
m.typo_method_that_does_not_exist()  # Passes silently! ❌ (Dangerous!)
```

Adding **`spec=RealClass`** or **`autospec=True`** forces the mock to mirror the exact attributes and method signatures of the real class, raising `AttributeError` if a test calls a misspelled method:

```python
class RealPaymentGateway:
    def charge(self, amount: float): pass

# Strict Mock mirroring real interface:
safe_mock = MagicMock(spec=RealPaymentGateway)
# safe_mock.invalid_method() # Raises AttributeError immediately! ✅
```

---

## Examples

### 1. Simple: Basic Method Call Tracking & Spy Assertions
Recording call counts, arguments, and return values.

```python
from unittest.mock import MagicMock

def process_order(order_id: str, notifier: MagicMock):
    print(f"Processing order #{order_id}...")
    notifier.send_sms("+1-555-0199", f"Order {order_id} confirmed.")

# Create Spy Mock
mock_notifier = MagicMock()

process_order("ORD-1001", mock_notifier)

# Assertions
mock_notifier.send_sms.assert_called_once()
mock_notifier.send_sms.assert_called_with("+1-555-0199", "Order ORD-1001 confirmed.")
print("Spy Verifications Passed: Exactly 1 SMS sent with valid recipient.")
```

### 2. Beginner: Mocking External HTTP API Requests with `patch`
Testing an external weather client without making live network calls.

```python
from unittest.mock import patch, MagicMock
import requests

def fetch_city_temperature(city: str) -> float:
    response = requests.get(f"https://api.weather.com/v1/{city}", timeout=5.0)
    response.raise_for_status()
    return response.json()["temperature_c"]

# Patch 'requests.get' during test execution
def test_weather_fetch():
    with patch("requests.get") as mock_get:
        # Configure mock HTTP response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"temperature_c": 24.5}
        mock_get.return_value = mock_response

        # Execute test
        temp = fetch_city_temperature("London")
        
        assert temp == 24.5
        mock_get.assert_called_once_with("https://api.weather.com/v1/London", timeout=5.0)
        print("✅ Weather API mock test passed.")

test_weather_fetch()
```

### 3. Intermediate: Mocking Database Failures with `side_effect`
Testing that a banking service rolls back transactions when database exceptions occur.

```python
from unittest.mock import MagicMock
import pytest

class DatabaseClient:
    def execute_transaction(self, sql: str): pass

class FundTransferService:
    def __init__(self, db: DatabaseClient):
        self.db = db

    def transfer(self, from_id: str, to_id: str, amount: float) -> bool:
        try:
            self.db.execute_transaction(f"DEBIT {from_id} ${amount}")
            self.db.execute_transaction(f"CREDIT {to_id} ${amount}")
            return True
        except Exception:
            self.db.execute_transaction(f"ROLLBACK_TRANSFER")
            return False

def test_database_crash_triggers_rollback():
    mock_db = MagicMock(spec=DatabaseClient)
    # First call succeeds, second call crashes!
    mock_db.execute_transaction.side_effect = [None, RuntimeError("Disk Write Error"), None]

    service = FundTransferService(mock_db)
    success = service.transfer("ACC-1", "ACC-2", 100.0)

    assert success is False
    # Verify rollback command was executed
    assert mock_db.execute_transaction.call_count == 3
    mock_db.execute_transaction.assert_called_with("ROLLBACK_TRANSFER")
    print("✅ Rollback recovery test verified.")

test_database_crash_triggers_rollback()
```

### 4. Real-World: Testing Asynchronous Webhooks with `AsyncMock`
Testing an asynchronous payment webhook handler with non-blocking async mocks.

```python
import asyncio
from unittest.mock import AsyncMock

class AsyncPaymentGateway:
    async def capture_charge(self, charge_id: str) -> dict: pass

async def handle_stripe_webhook(event: dict, gateway: AsyncPaymentGateway) -> str:
    if event.get("type") == "payment_intent.succeeded":
        charge_id = event["data"]["id"]
        result = await gateway.capture_charge(charge_id)
        return f"CAPTURED_{result['status']}"
    return "IGNORED"

async def test_async_webhook_handler():
    mock_gateway = AsyncMock(spec=AsyncPaymentGateway)
    mock_gateway.capture_charge.return_value = {"status": "SUCCESS", "amount": 1450.00}

    test_event = {"type": "payment_intent.succeeded", "data": {"id": "ch_9901"}}
    outcome = await handle_stripe_webhook(test_event, mock_gateway)

    assert outcome == "CAPTURED_SUCCESS"
    mock_gateway.capture_charge.assert_awaited_once_with("ch_9901")
    print("✅ AsyncMock webhook test passed.")

# asyncio.run(test_async_webhook_handler())
```

### 5. Advanced: In-Memory Fake Repository (Stateful Test Double)
Building a high-fidelity **Fake** that maintains in-memory state without any mock assertions.

```python
class FakeUserRepository:
    """A Fake Test Double: Working in-memory user repository."""
    def __init__(self):
        self._users = {}

    def save(self, user_id: str, email: str):
        self._users[user_id] = {"id": user_id, "email": email}

    def get_by_id(self, user_id: str) -> dict | None:
        return self._users.get(user_id)

def test_user_registration_with_fake():
    fake_repo = FakeUserRepository()
    fake_repo.save("USR-101", "hesam@domain.com")

    user = fake_repo.get_by_id("USR-101")
    assert user is not None
    assert user["email"] == "hesam@domain.com"
    print("✅ Fake Test Double verified.")

test_user_registration_with_fake()
```

---

## Code Explanation

In Example 5 (`FakeUserRepository`):
1. **Mocks vs Fakes**: While Mocks verify *interactions* (`assert_called_with`), **Fakes** provide a working, simplified implementation (such as an in-memory dictionary acting as a database).
2. Fakes make tests more robust: tests do not break when internal implementation details change, as long as the public interface contract is maintained.
3. Use **Mocks** for external boundaries (Stripe, Twilio, AWS) and **Fakes** for local infrastructure (Repositories, Cache stores).

---

## Common Mistakes

### Mistake 1: Over-Mocking Domain Logic
Mocking every single internal class and helper function until your tests only test that "method A called method B". This creates brittle tests that pass even when the business logic is completely broken. **Mock only at system boundaries (I/O, Network, Hardware)**.

### Mistake 2: Missing `spec=RealClass`
Omitting `spec` allows typos in method names (`mock.sned_email()`) to pass tests silently without error.

---

## Best Practices

### Use `pytest-cov` to Measure Branch Coverage
Measure both statement and branch coverage across your codebase:

```bash
# Run pytest with branch coverage report:
pytest --cov=src --cov-report=term-missing --cov-report=html
```

Enforce minimum coverage thresholds in CI/CD pipelines:
```bash
pytest --cov=src --cov-fail-under=90
```

---

## Performance Considerations

1. **Zero I/O Speed**: Mocked unit tests execute purely in CPU registers and RAM, completing 1,000 tests in **under 0.5 seconds**.
2. **Coverage Tracking Overhead**: Running with `--cov` instruments every bytecode branch via Python trace hooks, adding ~20–30% execution time. Run coverage in CI/CD rather than during rapid local test-driven development (TDD) loops.

---

## Security Considerations

1. **Simulate Hostile Failures**: Always use `mock.side_effect` to test security-critical failure modes (e.g. database disconnect during password updates, corrupted JWT tokens, expired API keys).
2. **Never Check-In Real Credentials**: Ensure mocked configurations do not accidentally contain real production private keys.

---

## Real-World Usage

- **Payment Processing (Stripe / PayPal)**: Simulating payment success, declines, and fraud reviews.
- **Email & SMS Dispatchers (SendGrid / Twilio)**: Verifying message contents without sending real messages.
- **CI/CD Quality Gates**: Enforcing 90%+ branch test coverage on all pull requests.

---

## Comparison: Test Double Types

| Double Type | Implementation | Interaction Verification? | Best Used For |
|---|---|---|---|
| **Dummy** | `None` or empty `object()` | ❌ No | Satisfying mandatory parameters |
| **Stub** | `mock.return_value = ...` | ❌ No | Canned data providers |
| **Spy** | `mock.assert_called_with()`| **✅ Yes** | Verifying outgoing notifications |
| **Mock** | `MagicMock(spec=...)` | **✅ Yes** | Complex boundary testing |
| **Fake** | In-Memory Class (Dict/List)| ❌ No | In-memory DBs, Filesystems |

---

## Advanced Concepts: Mocking Context Managers with `mock_open`

Python's `unittest.mock` includes **`mock_open`** for mocking file I/O operations without touching the hard drive:

```python
from unittest.mock import mock_open, patch

def read_config_file(filepath: str) -> str:
    with open(filepath, "r") as f:
        return f.read()

def test_read_config():
    fake_file_content = "HOST=127.0.0.1\nPORT=8000"
    with patch("builtins.open", mock_open(read_data=fake_file_content)):
        content = read_config_file("config.env")
        assert "HOST=127.0.0.1" in content
        print("✅ mock_open verified.")

test_read_config()
```

---

## Exercises

### Exercise 1 — Beginner
Write a function `notify_admin(mailer, message)` that calls `mailer.send("admin@domain.com", message)`. Write a test using a `MagicMock` spy asserting that `mailer.send` was called once with the correct recipient.

### Exercise 2 — Intermediate
Write a function `charge_user(payment_gateway, amount)` that catches `PaymentDeclinedError` from the gateway and returns `False`. Use `@patch` and `side_effect` to test both the successful charge path and the exception path.

### Exercise 3 — Advanced
Build a `DataSyncManager` that fetches records from an external REST API and writes them to a database. Write a test suite using `@patch("requests.get")` and an in-memory `FakeDatabase` asserting that network timeouts retry 3 times before failing gracefully.

---

## Mini Project: Enterprise Payment Gateway & Multi-Channel Notification Test Suite

### Requirements
Build an operational payment processing engine and its comprehensive mock test suite named `test_payment_orchestrator.py`. Implement external payment capturing, SMS alerting, database ledger persistence, and write unit tests with `MagicMock`, `@patch`, `side_effect`, and `AsyncMock` verifying 100% branch coverage.

### Implementation Blueprint
```python
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from dataclasses import dataclass

# =====================================================================
# 1. CORE DOMAIN LOGIC
# =====================================================================

@dataclass
class PaymentReceipt:
    transaction_id: str
    status: str
    amount: float

class PaymentOrchestrator:
    def __init__(self, gateway_client, sms_client, ledger_db):
        self.gateway = gateway_client
        self.sms = sms_client
        self.db = ledger_db

    def process_customer_checkout(self, customer_id: str, phone: str, amount: float) -> PaymentReceipt:
        if amount <= 0.0:
            raise ValueError("Checkout amount must be strictly positive.")

        # 1. Execute External Payment
        try:
            charge_res = self.gateway.charge(customer_id, amount)
        except Exception as err:
            self.sms.send_alert(phone, f"Payment failed: {err}")
            raise RuntimeError("Payment gateway unavailable.") from err

        if charge_res.get("status") != "APPROVED":
            self.sms.send_alert(phone, "Payment declined by issuing bank.")
            return PaymentReceipt(transaction_id="N/A", status="DECLINED", amount=amount)

        tx_id = charge_res["tx_id"]
        
        # 2. Persist to Database Ledger
        self.db.record_transaction(tx_id, customer_id, amount)

        # 3. Dispatch SMS Notification
        self.sms.send_alert(phone, f"Payment of ${amount:,.2f} confirmed! Ref: {tx_id}")

        return PaymentReceipt(transaction_id=tx_id, status="APPROVED", amount=amount)

# =====================================================================
# 2. PYTEST MOCK TEST SUITE
# =====================================================================

@pytest.fixture
def mock_dependencies():
    return {
        "gateway": MagicMock(),
        "sms": MagicMock(),
        "db": MagicMock()
    }

def test_successful_checkout(mock_dependencies):
    deps = mock_dependencies
    deps["gateway"].charge.return_value = {"status": "APPROVED", "tx_id": "TX-9901"}

    orchestrator = PaymentOrchestrator(deps["gateway"], deps["sms"], deps["db"])
    receipt = orchestrator.process_customer_checkout("CUST-101", "+1-555-0199", 250.00)

    # 1. Verify Receipt
    assert receipt.status == "APPROVED"
    assert receipt.transaction_id == "TX-9901"

    # 2. Verify External Gateway Call
    deps["gateway"].charge.assert_called_once_with("CUST-101", 250.00)

    # 3. Verify Database Persistence
    deps["db"].record_transaction.assert_called_once_with("TX-9901", "CUST-101", 250.00)

    # 4. Verify SMS Notification
    deps["sms"].send_alert.assert_called_once_with("+1-555-0199", "Payment of $250.00 confirmed! Ref: TX-9901")

def test_declined_checkout(mock_dependencies):
    deps = mock_dependencies
    deps["gateway"].charge.return_value = {"status": "DECLINED"}

    orchestrator = PaymentOrchestrator(deps["gateway"], deps["sms"], deps["db"])
    receipt = orchestrator.process_customer_checkout("CUST-102", "+1-555-0199", 50.00)

    assert receipt.status == "DECLINED"
    # Verify DB was NOT called on decline
    deps["db"].record_transaction.assert_not_called()
    # Verify decline SMS was sent
    deps["sms"].send_alert.assert_called_once_with("+1-555-0199", "Payment declined by issuing bank.")

def test_gateway_timeout_triggers_error_and_alert(mock_dependencies):
    deps = mock_dependencies
    deps["gateway"].charge.side_effect = TimeoutError("Connection reset")

    orchestrator = PaymentOrchestrator(deps["gateway"], deps["sms"], deps["db"])

    with pytest.raises(RuntimeError) as exc_info:
        orchestrator.process_customer_checkout("CUST-103", "+1-555-0199", 100.00)

    assert "Payment gateway unavailable" in str(exc_info.value)
    deps["sms"].send_alert.assert_called_once()
    deps["db"].record_transaction.assert_not_called()

def test_invalid_amount_raises_value_error(mock_dependencies):
    deps = mock_dependencies
    orchestrator = PaymentOrchestrator(deps["gateway"], deps["sms"], deps["db"])

    with pytest.raises(ValueError):
        orchestrator.process_customer_checkout("CUST-104", "+1-555-0199", -10.00)

if __name__ == "__main__":
    print("=" * 68)
    print("      RUNNING ENTERPRISE MOCK & COVERAGE TEST SUITE")
    print("=" * 68)
    pytest.main(["-v", __file__])
```

---

## Summary

In this lesson, you mastered mocking, test doubles, and test coverage:
- **Test Doubles** (Dummies, Stubs, Spies, Mocks, Fakes) isolate unit tests from external dependencies.
- **`MagicMock`** provides automatic mock method synthesis and implements Python dunder protocols.
- **`@patch`** replaces imports with mock instances; **always patch where an object is looked up / imported**.
- Use **`return_value`** for canned returns and **`side_effect`** for exceptions or dynamic sequences.
- Use **`AsyncMock`** for non-blocking coroutines and async methods.
- Measure statement and branch coverage with **`pytest --cov`** and enforce CI/CD coverage thresholds (`--cov-fail-under=90`).

---

## Best Practices Checklist

- [ ] Always patch where an object is used/imported, not where it is defined.
- [ ] Use `spec=RealClass` on `MagicMock` to catch method name typos.
- [ ] Use `side_effect` to test exception handling and failure recovery paths.
- [ ] Prefer Fakes over complex Mocks for local infrastructure (repositories, caches).
- [ ] Track both statement and branch coverage with `pytest-cov`.
- [ ] Enforce a 90%+ coverage quality gate in CI/CD workflows.

---

## 🏆 MODULE 9: TESTING & QUALITY ASSURANCE COMPLETE!

Congratulations! You have completed all 3 comprehensive articles of **Module 9: Testing & Quality Assurance in Depth**.

### What's Next?
Now advance to **Module 10: Package Management & Distribution**:
👉 **[Package Management & Distribution Module Overview](../package-management/README.md)** to master `pip`, `pipenv`, `poetry`, modern `pyproject.toml` packaging (PEP 517/518/621), and publishing packages to PyPI!
