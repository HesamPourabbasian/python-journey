# Custom Exceptions & Domain Error Hierarchies in Python

## Introduction

As software applications evolve into complex, domain-driven enterprise systems, relying solely on Python's built-in exceptions (such as `ValueError`, `KeyError`, or `RuntimeError`) quickly becomes inadequate. Built-in exceptions describe generic programming errors (e.g., passing a string where an integer was expected), but they cannot convey **Domain-Specific Business Logic Failures** (e.g., an account having insufficient credit, an API rate quota being exhausted, or a patient's insurance policy expiring).

Furthermore, when a library or microservice raises generic exceptions like `ValueError`, consumers cannot easily distinguish between a bug in their own code and a domain error raised by the library.

In Python, the professional solution is to design **Custom Exception Hierarchies**.

By subclassing Python's built-in **`Exception`** class, you create strongly typed, domain-specific error classes that can carry rich diagnostic metadata (such as error codes, affected resource IDs, HTTP status codes, and suggested remediation steps). By organizing custom exceptions into an inheritance tree rooted at a single base domain exception, you allow consumers to catch all errors from your package with a single `except MyPackageError:` handler while retaining the ability to intercept granular child errors.

This lesson concludes **Module 11: Exception Handling**, completing the theoretical and practical foundations of Python error management.

---

## Prerequisites

Before studying custom exceptions, ensure you have:

- Completed [Try, Except, Else & Finally](try-except-finally.md) and [Raising Exceptions](raising-exceptions.md).
- Completed [Python Classes & Inheritance Fundamentals](../fundamentals/what-is-python.md).
- A solid understanding of object-oriented dunder methods (`__init__`, `__str__`, `super()`).

---

## Core Concept: Designing a Domain Error Hierarchy

A professional custom exception system is structured as an **Inheritance Tree** rooted at a single base domain exception class:

```
                            ENTERPRISE DOMAIN EXCEPTION TREE

                                       Exception (Built-in)
                                             │
                                    ┌────────┴────────┐
                                    │    BankError    │  <--- Base Package Exception
                                    └────────┬────────┘
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
        ┌───────────────────────┐┌───────────────────────┐┌───────────────────────┐
        │  AccountSecurityError ││   TransactionError    ││    ComplianceError    │
        └───────────┬───────────┘└───────────┬───────────┘└───────────────────────┘
                    │                        │
         ┌──────────┴──────────┐   ┌─────────┴─────────┐
         ▼                     ▼   ▼                   ▼
    ┌──────────┐ ┌───────────┐ ┌───────────────┐ ┌───────────────┐
    │ AuthLock │ │ InvalidPIN│ │ Insufficient  │ │ DailyLimit    │
    │  Error   │ │   Error   │ │  FundsError   │ │ ExceededError │
    └──────────┘ └───────────┘ └───────────────┘ └───────────────┘
```

### Architectural Benefits:
1. **Catch-All Domain Handler**: Callers can catch `except BankError:` to intercept **any** banking error originating from your module.
2. **Granular Handling**: Callers can catch `except InsufficientFundsError:` to trigger specific recovery logic (such as prompting the user for an overdraft transfer).
3. **Structured Diagnostic Metadata**: Custom attributes (`error.account_id`, `error.required_amount`) eliminate the brittle practice of parsing error strings.

---

## Syntax & Essential Custom Exception Patterns

```python
# 1. Minimal Custom Exception (Inheriting from Exception)
class BaseApplicationError(Exception):
    """Base exception for all errors in this application."""
    pass

# 2. Granular Child Exception with Custom Metadata
class InsufficientFundsError(BaseApplicationError):
    """Raised when an account balance is insufficient for a transaction."""
    def __init__(self, account_id: str, current_balance: float, requested_amount: float):
        self.account_id = account_id
        self.balance = current_balance
        self.requested = requested_amount
        self.shortfall = requested_amount - current_balance
        
        # Construct helpful descriptive error message for super()
        message = (
            f"Account '{account_id}' has insufficient funds. "
            f"Available: ${current_balance:,.2f}, Requested: ${requested_amount:,.2f} "
            f"(Shortfall: ${self.shortfall:,.2f})"
        )
        super().__init__(message)

# 3. Usage and Structured Metadata Access
try:
    raise InsufficientFundsError("ACC-9901", current_balance=150.0, requested_amount=500.0)
except InsufficientFundsError as err:
    print("Caught Exception :", err)
    print("Account ID       :", err.account_id)  # "ACC-9901"
    print("Shortfall Amount :", f"${err.shortfall:.2f}") # "$350.00"
```

---

## Detailed Explanation

### 1. The Rule: Subclass `Exception`, Never `BaseException`

When defining custom exception classes, you **must always inherit from `Exception`** (or one of its standard subclasses like `ValueError` or `RuntimeError`).

**Never inherit directly from `BaseException`!**
Subclassing `BaseException` causes your custom exception to bypass standard `except Exception:` catch blocks, behaving like system-level termination signals (`KeyboardInterrupt` and `SystemExit`).

```python
# FORBIDDEN:
# class MyBrokenError(BaseException): pass  # Bypasses 'except Exception:'! ❌

# CORRECT:
class MyDomainError(Exception): pass        # Caught cleanly by 'except Exception:' ✅
```

---

### 2. PEP 8 Naming Conventions for Exceptions

PEP 8 mandates that all exception classes must follow **PascalCase (CapWords)** and must **always end with the suffix `Error`** (unless the exception represents a non-error control flow signal, like `StopIteration` or `GeneratorExit`):

- **Good**: `PaymentGatewayError`, `InvalidTokenError`, `DatabaseTimeoutError`.
- **Avoid**: `PaymentGatewayException` (violates convention), `InvalidToken` (missing suffix), `database_error` (wrong casing).

---

### 3. Attaching HTTP and Machine-Readable Error Codes

In modern web microservices (FastAPI, Flask, Django), custom exceptions should carry structured metadata—such as **HTTP Status Codes** and **Machine-Readable Error Codes**—allowing global error middleware to serialize exceptions into standardized JSON responses:

```python
class APIError(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_SERVER_ERROR"

    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def to_dict(self) -> dict:
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "status": self.status_code,
                "details": self.details
            }
        }

class ResourceNotFoundError(APIError):
    status_code = 404
    error_code = "RESOURCE_NOT_FOUND"

class RateLimitExceededError(APIError):
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"
```

---

## Examples

### 1. Simple: Minimal Validation Error
Creating a basic custom validation error.

```python
class EmailValidationError(Exception):
    """Raised when an email address fails structural validation."""
    pass

def validate_user_email(email: str):
    if "@" not in email or "." not in email:
        raise EmailValidationError(f"Invalid email address format: '{email}'")

try:
    validate_user_email("hesam_invalid_email")
except EmailValidationError as err:
    print("Caught Validation Failure:", err)
```

### 2. Beginner: Rich Error Metadata for Retry Scheduling
Building a network retry exception that communicates when the client may retry.

```python
class ServiceUnavailableError(Exception):
    def __init__(self, service_name: str, retry_after_sec: int):
        self.service = service_name
        self.retry_after = retry_after_sec
        super().__init__(f"Service '{service_name}' is currently unavailable. Retry after {retry_after_sec}s.")

try:
    raise ServiceUnavailableError("BillingService", retry_after_sec=30)
except ServiceUnavailableError as err:
    print("Error Message:", err)
    print(f"Scheduling automatic retry in {err.retry_after} seconds for {err.service}...")
```

### 3. Intermediate: Authentication Domain Error Hierarchy
Building a multi-tiered security exception tree for a user authentication system.

```python
# Tier 1: Base Authentication Exception
class AuthenticationError(Exception):
    """Base class for all authentication failures."""
    pass

# Tier 2: Specialized Exceptions
class UserNotFoundError(AuthenticationError):
    def __init__(self, username: str):
        self.username = username
        super().__init__(f"User '{username}' does not exist in identity directory.")

class InvalidCredentialsError(AuthenticationError):
    def __init__(self, username: str, attempts_remaining: int):
        self.username = username
        self.attempts = attempts_remaining
        super().__init__(f"Invalid password for '{username}'. Attempts remaining: {attempts_remaining}")

class AccountLockedError(AuthenticationError):
    def __init__(self, username: str, unlock_time: str):
        self.username = username
        self.unlock_time = unlock_time
        super().__init__(f"Account '{username}' is locked due to excessive failed logins. Unlocks at: {unlock_time}")

def simulate_login(username: str, password_attempt: str):
    if username == "unknown_user":
        raise UserNotFoundError(username)
    elif password_attempt != "secret123":
        raise InvalidCredentialsError(username, attempts_remaining=2)

# Caller handling using polymorphic base class:
for user, pwd in [("unknown_user", "123"), ("hesam", "wrong_pwd")]:
    try:
        simulate_login(user, pwd)
    except AuthenticationError as auth_err:  # Catches ANY auth failure!
        print(f"🚨 [AUTH REJECTED] {auth_err}")
```

### 4. Real-World: Web API Global Error Handler & JSON Serializer
Translating domain exceptions directly into standard RFC 7807 problem details JSON responses.

```python
import json

class WebAPIException(Exception):
    status_code: int = 500
    title: str = "Internal Server Error"

    def __init__(self, detail: str, **kwargs):
        super().__init__(detail)
        self.detail = detail
        self.extra = kwargs

    def to_rfc7807_json(self) -> str:
        payload = {
            "type": f"https://api.domain.com/errors/{self.__class__.__name__}",
            "title": self.title,
            "status": self.status_code,
            "detail": self.detail,
            "metadata": self.extra
        }
        return json.dumps(payload, indent=2)

class OrderProcessingError(WebAPIException):
    status_code = 422
    title = "Unprocessable Order Entity"

# Test API serialization
err = OrderProcessingError("Item SKU-991 out of stock", item_sku="SKU-991", warehouse="US-EAST")
print("RFC 7807 JSON Error Payload:\n", err.to_rfc7807_json())
```

### 5. Advanced: Python 3.11 `add_note()` Contextual Metadata
Using Python 3.11's built-in `add_note()` to enrich active exception instances with runtime diagnostic notes without modifying the class structure.

```python
class DatabaseSyncError(Exception): pass

def synchronize_node(node_ip: str):
    try:
        raise DatabaseSyncError("Replication synchronization handshake timed out.")
    except DatabaseSyncError as exc:
        # Python 3.11+ feature: Attach arbitrary diagnostic notes to exceptions!
        exc.add_note(f"Target Node IP: {node_ip}")
        exc.add_note("Region: us-west-2 (Cluster: prod-db-replica-04)")
        raise

try:
    synchronize_node("10.0.15.88")
except DatabaseSyncError as err:
    print("Caught Database Error with Python 3.11 Notes:")
    print("Message:", err)
    print("Notes  :", getattr(err, "__notes__", []))
```

---

## Code Explanation

In Example 4 (RFC 7807 JSON Serializer):
1. `WebAPIException` serves as the base class for all web-tier exceptions, defining default HTTP status codes (`500`) and standard schema formatters.
2. `OrderProcessingError` overrides `status_code = 422` and `title = "Unprocessable Order Entity"`.
3. When `err.to_rfc7807_json()` is called, it extracts class-level attributes, instance-level error messages, and dynamic `**kwargs` metadata into a standardized RFC 7807 JSON response.
4. This architecture allows FastAPI/Flask global error middlewares to convert unhandled domain exceptions into clean JSON responses automatically.

---

## Common Mistakes

### Mistake 1: Forgetting to Call `super().__init__(message)`
If you override `__init__` in a custom exception without calling `super().__init__(message)`, the exception will display an empty string when converted to text (`str(err)` will be blank!).

```python
# BROKEN:
class BrokenError(Exception):
    def __init__(self, code):
        self.code = code
        # Missing super().__init__(...)! ❌

# CORRECT:
class FixedError(Exception):
    def __init__(self, code, message):
        self.code = code
        super().__init__(message) # Passes message to BaseException ✅
```

### Mistake 2: Naming Exceptions Without the `Error` Suffix
Creating classes named `class InvalidUser(Exception)` violates PEP 8 and makes it difficult for other developers to distinguish between models and exceptions.

---

## Best Practices

### Create a Single Base Exception for Every Package
Always declare a base exception class for your library, and have all specific errors inherit from it.

Good:
```python
# my_library/exceptions.py
class MyLibraryError(Exception): """Base exception for my_library."""
class ConfigError(MyLibraryError): pass
class ConnectionError(MyLibraryError): pass
```

---

## Performance Considerations

1. **Lightweight Instantiation**: Custom exception classes inherit from CPython's optimized `PyBaseExceptionObject` and take less than 1 microsecond to instantiate.
2. **Avoid Heavy Computations in `__init__`**: Keep exception initialization lightweight (storing passed arguments and formatting simple strings). Avoid executing network calls or heavy disk I/O inside `__init__`.

---

## Security Considerations

1. **Do Not Store Raw Secrets in Exception Attributes**: Avoid saving plaintext passwords, unmasked credit cards, or internal secret keys in custom exception attributes, as exceptions are frequently serialized into log files and error monitoring tools (Sentry, Datadog).
2. **Sanitize User Inputs in Error Messages**: Ensure user inputs interpolated into exception messages are sanitized to prevent log injection vulnerabilities.

---

## Real-World Usage

- **Stripe Python SDK**: Defining `StripeError` $\rightarrow$ `CardError`, `RateLimitError`, `InvalidRequestError`.
- **AWS Boto3 SDK**: Raising `ClientError` containing structured error codes (`"NoSuchBucket"`, `"AccessDenied"`).
- **Django Framework**: Raising `django.core.exceptions.ValidationError` containing field-specific error dictionaries.

---

## Comparison: Exception Design Approaches

| Feature | Generic Built-in (`ValueError`) | Flat Custom Exception | Hierarchical Domain Tree |
|---|---|---|---|
| **Semantic Clarity** | Low (Generic) | High | **Highest** |
| **Catch-All Capability**| No (Too broad) | No | **Yes (`except BaseDomainError`)**|
| **Structured Metadata** | String only (`exc.args`) | Custom Attributes | **Custom Attributes + Polymorphism**|
| **Best For** | Internal scalar checks | Small scripts (<200 lines)| **Production Libraries, APIs, SDKs**|

---

## Advanced Concepts: Python 3.11 Exception Groups (`ExceptionGroup`)

Introduced in **Python 3.11** (PEP 654), Python supports raising and handling multiple concurrent exceptions simultaneously using **Exception Groups** and the **`except*`** syntax:

```python
# Python 3.11+ Exception Groups:
eg = ExceptionGroup("Multiple Task Failures", [
    ValueError("Invalid parameter A"),
    TypeError("Invalid parameter B"),
    FileNotFoundError("Missing config.json")
])

# Handling specific exception types within the group using except*:
try:
    raise eg
except* ValueError as val_group:
    print("Handled ValueErrors:", val_group.exceptions)
except* FileNotFoundError as file_group:
    print("Handled FileErrors :", file_group.exceptions)
```

This feature is fundamental to concurrent AsyncIO task gathering and parallel computing pipelines.

---

## Exercises

### Exercise 1 — Beginner
Create a custom exception class named `NegativeBalanceError` that accepts an `account_id` and a `balance`, formats a descriptive message in `__init__`, and passes it to `super()`. Test raising and catching it.

### Exercise 2 — Intermediate
Design a domain error hierarchy for a file cloud storage service: (1) `CloudStorageError` (base), (2) `QuotaExceededError` (with `used_bytes` and `max_bytes`), and (3) `FileNotFoundInCloudError` (with `filename`). Write a function that raises these errors and verify that both child exceptions are caught by `except CloudStorageError:`.

### Exercise 3 — Advanced
Build a `FormValidator` class that validates user registration dictionaries. If validation fails, raise a custom `FormValidationError` containing a dictionary mapping field names to specific error messages (e.g., `{"email": "Missing @ symbol", "age": "Must be 18+"}`). Implement a `.to_json()` method on the exception that outputs formatted JSON.

---

## Mini Project: Enterprise Banking Transaction Engine with Domain Error Hierarchy

### Requirements
Build a resilient banking core transaction engine named `banking_core.py` featuring a comprehensive custom exception hierarchy, structured metadata tracking, polymorphic error handling, and audit logging.

### Implementation Blueprint
```python
import datetime

# 1. Base Domain Exception
class BankingCoreError(Exception):
    """Base exception for all banking transaction failures."""
    def __init__(self, message: str, account_id: str):
        super().__init__(message)
        self.account_id = account_id
        self.timestamp = datetime.datetime.now(datetime.timezone.utc)

# 2. Granular Child Exceptions
class AccountNotFoundError(BankingCoreError):
    def __init__(self, account_id: str):
        super().__init__(f"Account '{account_id}' does not exist in ledger.", account_id)

class AccountLockedError(BankingCoreError):
    def __init__(self, account_id: str, reason: str):
        self.reason = reason
        super().__init__(f"Account '{account_id}' is locked: {reason}", account_id)

class InsufficientFundsError(BankingCoreError):
    def __init__(self, account_id: str, balance: float, requested: float):
        self.balance = balance
        self.requested = requested
        self.shortfall = requested - balance
        super().__init__(
            f"Insufficient funds in '{account_id}'. Available: ${balance:,.2f}, Requested: ${requested:,.2f}",
            account_id
        )

# 3. Core Banking Engine
class BankingLedger:
    def __init__(self):
        self._accounts = {
            "ACC-101": {"owner": "Hesam", "balance": 1200.00, "is_locked": False},
            "ACC-102": {"owner": "Sarah", "balance": 50.00,   "is_locked": True},
        }

    def transfer(self, from_acc: str, to_acc: str, amount: float):
        # Validate Account Existence
        if from_acc not in self._accounts:
            raise AccountNotFoundError(from_acc)
        if to_acc not in self._accounts:
            raise AccountNotFoundError(to_acc)

        source = self._accounts[from_acc]
        target = self._accounts[to_acc]

        # Validate Lock Status
        if source["is_locked"]:
            raise AccountLockedError(from_acc, "Flagged for security audit review")

        # Validate Balance
        if source["balance"] < amount:
            raise InsufficientFundsError(from_acc, source["balance"], amount)

        # Execute Transaction
        source["balance"] -= amount
        target["balance"] += amount
        print(f"✅ Transfer Successful: ${amount:,.2f} from {from_acc} -> {to_acc}")

if __name__ == "__main__":
    ledger = BankingLedger()
    
    print("=" * 65)
    print("           BANKING DOMAIN EXCEPTION ENGINE TEST")
    print("=" * 65)
    
    test_cases = [
        ("ACC-999", "ACC-101", 100.0),  # Missing Account
        ("ACC-102", "ACC-101", 20.0),   # Locked Account
        ("ACC-101", "ACC-102", 5000.0), # Insufficient Funds
        ("ACC-101", "ACC-102", 300.0),  # Valid Transfer
    ]
    
    for src, dst, amt in test_cases:
        print(f"\nAttempting Transfer: ${amt} from {src} to {dst}")
        try:
            ledger.transfer(src, dst, amt)
        except InsufficientFundsError as err:
            print(f"  🚫 [INSUFFICIENT FUNDS] {err} (Shortfall: ${err.shortfall:,.2f})")
        except AccountLockedError as err:
            print(f"  🔒 [ACCOUNT LOCKED] {err} (Reason: {err.reason})")
        except AccountNotFoundError as err:
            print(f"  🔍 [NOT FOUND] {err}")
        except BankingCoreError as err:  # Polymorphic Catch-All for other banking errors
            print(f"  🚨 [GENERAL BANKING ERROR] {err}")
            
    print("\n" + "=" * 65)
```

---

## Summary

In this lesson, you mastered Python's custom exceptions and domain error hierarchies:
- Custom exceptions allow applications to model **domain-specific failure modes** clearly.
- Always **subclass `Exception`** (never `BaseException`) and suffix names with **`Error`** (PEP 8).
- Structure exceptions into a **Hierarchical Tree** rooted at a single base package exception.
- Attach **structured metadata** (`account_id`, `error_code`, `shortfall`, `status_code`) to avoid brittle string parsing.
- Always call **`super().__init__(message)`** to ensure proper string formatting and traceback display.
- Python 3.11 introduces **`add_note()`** and **`ExceptionGroup`** for modern multi-exception handling.

---

## Best Practices Checklist

- [ ] Subclass `Exception` or its standard subclasses for all custom exceptions.
- [ ] End all exception class names with the `Error` suffix (`PaymentError`).
- [ ] Define a base domain exception class for your package or service.
- [ ] Call `super().__init__(message)` when overriding `__init__`.
- [ ] Attach structured metadata attributes to exceptions for machine readability.

---

## What's Next?

Congratulations! You have completed **Module 11: Exception Handling**.
Now continue to **Module 12: Beginner Capstone Projects**:
👉 **[Beginner Capstone Projects Overview](../projects/README.md)** to put all Level 1 concepts into practice with 8 production-grade projects!
