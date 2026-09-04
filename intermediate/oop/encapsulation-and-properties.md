# Encapsulation & Properties in Python

## Introduction

In Object-Oriented Programming, **Encapsulation** is the principle of bundling internal data (state) with the methods that operate on that data, while restricting direct external access to the internal implementation details. Encapsulation prevents external code from corrupting an object's state, enforces business invariants, and allows developers to refactor internal data structures without breaking public API contracts.

In languages like Java or C++, encapsulation is enforced rigidly by the compiler using explicit access modifier keywords (`public`, `protected`, `private`).

Python approaches encapsulation with a distinct, pragmatic philosophy: **"We are all consenting adults here."** Rather than enforcing rigid compiler-level access locks, Python relies on clear naming conventions (`_single_underscore` for protected members) and an automatic lexical transformation known as **Name Mangling (`__double_underscore`)**.

Furthermore, Python provides the elegant **`@property`** decorator. In Java or C++, developers are forced to write boilerplate `get_name()` and `set_name()` methods for every field. In Python, you can start with clean, direct attribute access (`user.balance = 500`) and later seamlessly intercept reads, writes, and deletions using `@property` without breaking a single line of caller code!

This lesson explores access control conventions, name mangling mechanics, managed properties, data validation invariants, and caching with `@functools.cached_property`.

---

## Prerequisites

Before studying encapsulation, ensure you have:

- Completed [Classes & Objects](classes-and-objects.md) and [Constructors & Attributes](constructors-and-attributes.md).
- Completed [Defining Functions & Decorators Basics](../../beginner/functions/defining-functions.md).
- Familiarity with descriptor mechanics and `__dict__`.

---

## Core Concept: Access Levels in Python

```
                             ENCAPSULATION ACCESS LEVELS IN PYTHON

   ┌───────────────┬──────────────────────────┬───────────────────────────────────────────┐
   │ Access Level  │ Syntax Example           │ Meaning & Behavior                        │
   ├───────────────┼──────────────────────────┼───────────────────────────────────────────┤
   │ Public        │ self.name                │ Openly accessible by any caller.          │
   ├───────────────┼──────────────────────────┼───────────────────────────────────────────┤
   │ Protected     │ self._internal_cache     │ Convention: Internal to class & subclasses│
   │               │                          │ (Not enforced by interpreter).            │
   ├───────────────┼──────────────────────────┼───────────────────────────────────────────┤
   │ Private       │ self.__secret_key        │ Name Mangling: Renamed internally to      │
   │               │                          │ _ClassName__secret_key to prevent clashes.│
   ├───────────────┼──────────────────────────┼───────────────────────────────────────────┤
   │ Managed       │ @property                │ Read/Write intercepted via methods while  │
   │ Property      │ def balance(self): ...   │ presenting clean attribute syntax!        │
   └───────────────┴──────────────────────────┴───────────────────────────────────────────┘
```

---

## Syntax & Essential Encapsulation Patterns

```python
# 1. The @property Decorator: Getter, Setter, and Deleter
class BankAccount:
    def __init__(self, owner: str, initial_balance: float = 0.0):
        self.owner = owner
        self._balance = initial_balance  # Protected internal storage

    # GETTER: Invoked when reading 'account.balance'
    @property
    def balance(self) -> float:
        """Current account balance in USD."""
        return self._balance

    # SETTER: Invoked when writing 'account.balance = 500'
    @balance.setter
    def balance(self, new_balance: float):
        if not isinstance(new_balance, (int, float)):
            raise TypeError("Balance must be a numeric value.")
        if new_balance < 0:
            raise ValueError(f"Balance cannot be negative, got ${new_balance:.2f}")
        self._balance = round(float(new_balance), 2)

    # DELETER: Invoked when executing 'del account.balance'
    @balance.deleter
    def balance(self):
        raise PermissionError("Cannot delete account balance attribute.")

# 2. Read-Only Property (No setter defined)
class Circle:
    import math

    def __init__(self, radius: float):
        self.radius = radius

    @property
    def area(self) -> float:
        # Dynamically computed on-the-fly; cannot be overwritten directly!
        return self.math.pi * (self.radius ** 2)
```

---

## Detailed Explanation

### 1. The Name Mangling Algorithm (`__private`)

When an attribute name begins with **two leading underscores and at most one trailing underscore** (e.g. `__api_token`), Python's parser applies **Name Mangling**:

$$\textbf{Mangled Name} = \text{"\_"} + \text{ClassName} + \text{"\_\_attribute"}$$

```python
class SecurityToken:
    def __init__(self, secret: str):
        self.__secret = secret  # Mangled to _SecurityToken__secret

token = SecurityToken("TOP_SECRET_123")

# Direct access fails with AttributeError:
# print(token.__secret) # AttributeError: 'SecurityToken' object has no attribute '__secret'

# But it exists under its mangled name:
print("Mangled Access :", token._SecurityToken__secret) # "TOP_SECRET_123"
print("Instance Dict   :", token.__dict__)
# Output: {'_SecurityToken__secret': 'TOP_SECRET_123'}
```

#### Why Does Name Mangling Exist?
Name mangling is **NOT designed for cryptographic privacy or security**. Its primary purpose is to **prevent accidental attribute name collisions in class inheritance hierarchies** when a subclass defines an attribute with the same name.

---

### 2. The Property Descriptor Protocol Under the Hood

When you decorate a method with `@property`, Python instantiates a **`property` Descriptor Object** on the class:

```python
class TemperatureSensor:
    def __init__(self, celsius: float):
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float):
        if value < -273.15:
            raise ValueError("Temperature below absolute zero is physically impossible!")
        self._celsius = value
```

When you read `sensor.celsius`:
1. Python inspects `TemperatureSensor.__dict__["celsius"]` and finds the `property` object.
2. The property object's `__get__(sensor, TemperatureSensor)` method executes and calls your getter function.
3. When you write `sensor.celsius = 25.0`, Python invokes `property.__set__(sensor, 25.0)`, routing the value through your validator.

---

### 3. The Infinite Recursion Setter Trap

A classic mistake when writing property setters is assigning to the property name rather than the internal backing variable:

```python
# 🚨 DEADLY BUG: Infinite Recursion!
class BrokenUser:
    def __init__(self, name: str):
        self.name = name

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, val):
        self.name = val  # 💥 CALLS THE SETTER AGAIN! RecursionError!

# ✅ CORRECT:
class FixedUser:
    def __init__(self, name: str):
        self.name = name  # Calls setter, which assigns to self._name

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, val):
        self._name = val.strip().title()  # Assigns to internal backing storage!
```

---

## Examples

### 1. Simple: Bidirectional Temperature Converter
Exposing both Celsius and Fahrenheit interfaces synchronized to a single source of truth.

```python
class Temperature:
    def __init__(self, celsius: float = 0.0):
        self.celsius = celsius  # Uses setter for initial validation

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float):
        if value < -273.15:
            raise ValueError("Temperature cannot fall below absolute zero (-273.15°C).")
        self._celsius = float(value)

    # Computed Property for Fahrenheit
    @property
    def fahrenheit(self) -> float:
        return (self._celsius * 9 / 5) + 32

    @fahrenheit.setter
    def fahrenheit(self, value: float):
        # Automatically converts and stores in self._celsius
        self.celsius = (value - 32) * 5 / 9

temp = Temperature(25.0)
print(f"Celsius: {temp.celsius}°C | Fahrenheit: {temp.fahrenheit}°F") # 25.0°C | 77.0°F

temp.fahrenheit = 212.0
print(f"Updated Celsius: {temp.celsius}°C") # 100.0°C
```

### 2. Beginner: Read-Only Audit Logging
Allowing public inspection of log events while preventing external deletion or corruption.

```python
class SecurityAuditVault:
    def __init__(self):
        self._events = []

    def record_event(self, action: str, actor: str):
        self._events.append(f"[{actor}] -> {action}")

    # Read-Only Property returning an immutable tuple snapshot
    @property
    def event_history(self) -> tuple[str, ...]:
        return tuple(self._events)

vault = SecurityAuditVault()
vault.record_event("LOGIN_SUCCESS", "hesam_admin")
vault.record_event("MUTATE_SETTINGS", "hesam_admin")

print("Audited Events:", vault.event_history)

# Attempting to assign raises AttributeError
try:
    vault.event_history = []
except AttributeError as err:
    print(f"🔒 [BLOCKED] {err}")
```

### 3. Intermediate: Strict Invariant Email & Age Validator
Enforcing complex data schema invariants transparently on model attributes.

```python
import re

class UserAccount:
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

    def __init__(self, username: str, email: str, age: int):
        self.username = username
        self.email = email  # Triggers property setter
        self.age = age      # Triggers property setter

    @property
    def email(self) -> str:
        return self._email

    @email.setter
    def email(self, new_email: str):
        clean = new_email.strip().lower()
        if not self.EMAIL_REGEX.match(clean):
            raise ValueError(f"Invalid email address format: '{new_email}'")
        self._email = clean

    @property
    def age(self) -> int:
        return self._age

    @age.setter
    def age(self, new_age: int):
        if not isinstance(new_age, int) or new_age < 18 or new_age > 120:
            raise ValueError(f"Age must be an integer between 18 and 120, got {new_age}")
        self._age = new_age

user = UserAccount("hesamp", "hesam@domain.com", 28)
print(f"User Registered: {user.username} ({user.email}), Age: {user.age}")

# Invalid updates trigger immediate exceptions:
try:
    user.age = 15
except ValueError as err:
    print(f"❌ [VALIDATION FAILED] {err}")
```

### 4. Real-World: High-Performance Caching with `@functools.cached_property`
Caching expensive computational results (such as hashing large datasets or network queries) until invalidated.

```python
import hashlib
import time
from functools import cached_property

class LargeDocument:
    def __init__(self, title: str, raw_content: str):
        self.title = title
        self.content = raw_content

    @cached_property
    def sha256_checksum(self) -> str:
        """Expensive property: Computed ONCE, then cached in instance dictionary!"""
        print(f"⏳ [EXPENSIVE COMPUTATION] Calculating SHA-256 for '{self.title}'...")
        time.sleep(0.01)  # Simulate CPU work
        return hashlib.sha256(self.content.encode("utf-8")).hexdigest()

doc = LargeDocument("Whitepaper_2024", "Lorem ipsum dolor sit amet " * 50_000)

# First access computes and caches:
print("Hash 1:", doc.sha256_checksum)

# Second access returns cached value instantaneously!
print("Hash 2:", doc.sha256_checksum)
```

### 5. Advanced: Reusable Type-Enforcing Descriptor Class
Building a custom reusable descriptor that enforces types across multiple classes.

```python
class TypedProperty:
    """Reusable Data Descriptor enforcing strict types on attributes."""

    def __init__(self, expected_type: type):
        self.expected_type = expected_type

    def __set_name__(self, owner, name):
        self.storage_name = f"_{name}"

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return getattr(instance, self.storage_name, None)

    def __set__(self, instance, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(f"Attribute '{self.storage_name[1:]}' must be of type {self.expected_type.__name__}, got {type(value).__name__}")
        setattr(instance, self.storage_name, value)

class ProductCatalogItem:
    # Declarative typed fields using custom descriptor!
    title = TypedProperty(str)
    price = TypedProperty(float)
    stock = TypedProperty(int)

    def __init__(self, title: str, price: float, stock: int):
        self.title = title
        self.price = price
        self.stock = stock

item = ProductCatalogItem("4K Monitor", 450.00, 10)
print(f"Catalog Item: {item.title} - ${item.price} ({item.stock} in stock)")

try:
    item.price = "FOUR_HUNDRED"  # Raises TypeError!
except TypeError as err:
    print(f"🛡️ [TYPE GUARD] {err}")
```

---

## Code Explanation

In Example 5 (`TypedProperty`):
1. `TypedProperty` implements Python's **Data Descriptor Protocol** (`__get__`, `__set__`, `__set_name__`).
2. `__set_name__` automatically captures the attribute name (`"price"` $\rightarrow$ `"_price"`) when the class is defined.
3. Every time `item.price = ...` is called, `TypedProperty.__set__` intercepts the value, verifies `isinstance(value, expected_type)`, and assigns to the private backing variable `_price`.
4. This demonstrates the exact underlying mechanics that power frameworks like **Pydantic** and **SQLAlchemy**.

---

## Common Mistakes

### Mistake 1: Writing Java-Style `get_x()` / `set_x()` Boilerplate
Creating `def get_balance(self): return self.balance` is un-Pythonic. Use standard attributes, and refactor to `@property` if validation is needed later.

### Mistake 2: Missing Return in Property Getter
Forgetting `return` inside a `@property` method causes reads to return `None` silently.

---

## Best Practices

### The Uniform Access Principle
Design public interfaces so callers access data simply as `obj.attribute`. Whether `attribute` is a stored field, a computed value, or a validated property, the caller syntax remains identical.

Good:
```python
user.balance = 500  # Clean attribute syntax (backed by @property)
```

Avoid:
```python
user.set_balance(500)  # Verbose boilerplate ❌
```

---

## Performance Considerations

1. **Property Lookup Cost**: Accessing a property invokes a Python function call (~50 nanoseconds overhead compared to direct dictionary access). For operations in hot mathematical loops executed millions of times, direct attribute access is faster.
2. **`@functools.cached_property` Invalidation**: To clear the cache on a `@cached_property`, simply delete the attribute on the instance: `del doc.sha256_checksum`.

---

## Security Considerations

1. **Name Mangling is Not True Private Memory**: An attacker can still read `obj._ClassName__secret`. Do not rely on name mangling to protect plaintext credentials or cryptographic keys in memory.
2. **Side Effects in Getters**: Property getters should be **idempotent and free of side-effects**. Avoid writing to databases or mutating files inside a property read.

---

## Real-World Usage

- **Django ORM**: `@property` methods on models for computed attributes (e.g. `User.is_authenticated`).
- **Pydantic Models**: Validating field constraints during attribute mutation.
- **PyTorch Tensors**: Inspecting `.shape`, `.dtype`, and `.device` as managed read-only properties.

---

## Comparison: Access Modifiers

| Modifier | Syntax | Protection Level | Primary Use Case |
|---|---|---|---|
| **Public** | `self.attr` | None (Open) | Standard public API attributes |
| **Protected** | `self._attr` | **Advisory Convention** | Internal implementation details |
| **Private (Mangled)**| `self.__attr`| **Name Mangling** | Preventing subclass naming collisions |
| **Managed Property** | `@property` | **Full Runtime Validation** | Getters, setters, computed fields |

---

## Advanced Concepts: Dynamic Attribute Interception with `__getattr__` and `__setattr__`

Python provides lowest-level dunder hooks to intercept **all** attribute accesses:

```python
class DynamicSettingsVault:
    def __init__(self):
        self._store = {}

    def __getattr__(self, name: str) -> any:
        """Invoked ONLY when requested attribute is NOT found in __dict__!"""
        print(f"🔍 Dynamic lookup for missing attribute: '{name}'")
        return self._store.get(name, "DEFAULT_VAL")

    def __setattr__(self, name: str, value: any):
        """Intercepts ALL attribute assignments!"""
        if name.startswith("_"):
            super().__setattr__(name, value)
        else:
            self._store[name] = value

vault = DynamicSettingsVault()
vault.api_host = "cluster.internal"
print("Host :", vault.api_host)
print("Port :", vault.port)  # Falls back to __getattr__ -> "DEFAULT_VAL"
```

---

## Exercises

### Exercise 1 — Beginner
Create a `Rectangle` class with attributes `_width` and `_height`. Use `@property` getters and setters to ensure width and height are always strictly positive numbers ($> 0$). Add a read-only property `area`.

### Exercise 2 — Intermediate
Build a `PasswordManager` class with a write-only property `password`. The getter must raise `PermissionError("Password cannot be read in plaintext!")`. The setter must hash the incoming string with `hashlib.sha256()` and store only the hash. Add a method `verify(candidate: str) -> bool`.

### Exercise 3 — Advanced
Build a `ValidatedEntity` class using custom descriptors (`PositiveInt`, `NonEmptyString`) that automatically validates all fields declared on the class without writing manual property getters and setters.

---

## Mini Project: Enterprise Secure Employee Payroll & Tax Engine

### Requirements
Build a resilient payroll accounting engine named `payroll_engine.py`. Implement an `EmployeePayroll` class that manages hourly wages, hours worked, federal tax rates, and year-to-date payouts using strict `@property` validators and audit logs.

### Implementation Blueprint
```python
from datetime import datetime, timezone

class PayrollViolationError(Exception): pass

class EmployeePayroll:
    MAX_REGULAR_HOURS_PER_WEEK = 40.0
    OVERTIME_RATE_MULTIPLIER = 1.5

    def __init__(self, emp_id: str, name: str, hourly_rate: float, tax_rate_pct: float = 20.0):
        self.emp_id = emp_id
        self.name = name
        self.hourly_rate = hourly_rate      # Uses setter
        self.tax_rate_pct = tax_rate_pct    # Uses setter
        self._hours_logged = 0.0
        self._total_paid_ytd = 0.0
        self._audit_log = []

    # HOURLY RATE PROPERTY
    @property
    def hourly_rate(self) -> float:
        return self._hourly_rate

    @hourly_rate.setter
    def hourly_rate(self, value: float):
        if not isinstance(value, (int, float)) or value < 15.0:
            raise PayrollViolationError(f"Hourly wage (${value}) violates minimum wage requirements ($15.00/hr).")
        self._hourly_rate = round(float(value), 2)

    # TAX RATE PROPERTY
    @property
    def tax_rate_pct(self) -> float:
        return self._tax_rate_pct

    @tax_rate_pct.setter
    def tax_rate_pct(self, value: float):
        if not (0.0 <= value <= 50.0):
            raise PayrollViolationError(f"Tax rate must be between 0% and 50%, got {value}%")
        self._tax_rate_pct = float(value)

    # HOURS WORKED PROPERTY
    @property
    def hours_logged(self) -> float:
        return self._hours_logged

    @hours_logged.setter
    def hours_logged(self, hours: float):
        if hours < 0 or hours > 80:
            raise PayrollViolationError(f"Hours logged ({hours} hrs) exceeds legal limits (0 to 80 hrs/wk).")
        self._hours_logged = float(hours)

    # COMPUTED PROPERTIES
    @property
    def gross_weekly_pay(self) -> float:
        if self._hours_logged <= self.MAX_REGULAR_HOURS_PER_WEEK:
            return round(self._hours_logged * self._hourly_rate, 2)
        
        regular_pay = self.MAX_REGULAR_HOURS_PER_WEEK * self._hourly_rate
        overtime_hours = self._hours_logged - self.MAX_REGULAR_HOURS_PER_WEEK
        overtime_pay = overtime_hours * (self._hourly_rate * self.OVERTIME_RATE_MULTIPLIER)
        return round(regular_pay + overtime_pay, 2)

    @property
    def net_weekly_pay(self) -> float:
        gross = self.gross_weekly_pay
        tax_deduction = gross * (self._tax_rate_pct / 100.0)
        return round(gross - tax_deduction, 2)

    def process_payroll_payout(self) -> dict:
        gross = self.gross_weekly_pay
        net = self.net_weekly_pay
        tax = round(gross - net, 2)
        
        self._total_paid_ytd += net
        payout_record = {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "hours": self._hours_logged,
            "gross": gross,
            "tax": tax,
            "net": net,
            "ytd_total": self._total_paid_ytd
        }
        self._audit_log.append(payout_record)
        self._hours_logged = 0.0  # Reset for next cycle
        return payout_record

if __name__ == "__main__":
    print("=" * 65)
    print("           ENTERPRISE SECURE PAYROLL ENGINE")
    print("=" * 65)
    
    emp = EmployeePayroll("EMP-9901", "Hesam Pourabbasain", hourly_rate=45.00, tax_rate_pct=22.0)
    
    # 1. Log Standard Work Week (40 hrs)
    emp.hours_logged = 40.0
    print(f"Employee      : {emp.name} (${emp.hourly_rate:.2f}/hr)")
    print(f"Hours Logged  : {emp.hours_logged} hrs")
    print(f"Gross Pay     : ${emp.gross_weekly_pay:,.2f}")
    print(f"Net Take-Home : ${emp.net_weekly_pay:,.2f}")
    
    # 2. Process Payout
    receipt = emp.process_payroll_payout()
    print(f"✅ Payout Processed: Net Dispatched = ${receipt['net']:,.2f}")
    
    # 3. Log Overtime Work Week (50 hrs)
    print("\n--- Processing Overtime Cycle ---")
    emp.hours_logged = 50.0
    print(f"Hours (With Overtime): {emp.hours_logged} hrs")
    print(f"Gross (With 1.5x OT) : ${emp.gross_weekly_pay:,.2f}")
    print(f"Net Take-Home        : ${emp.net_weekly_pay:,.2f}")
    
    # 4. Invariant Validation Tests
    print("\n--- Testing Invariant Guards ---")
    try:
        emp.hourly_rate = 10.0  # Violates min wage!
    except PayrollViolationError as err:
        print(f"🛡️ [BLOCKED] {err}")

    try:
        emp.hours_logged = 120.0  # Exceeds max 80 hrs!
    except PayrollViolationError as err:
        print(f"🛡️ [BLOCKED] {err}")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's encapsulation and property architecture:
- Python uses **conventions (`_protected`)** and **Name Mangling (`__private`)** rather than rigid compiler access controls.
- Name mangling transforms `__attr` into `_ClassName__attr` to **prevent subclass naming collisions**.
- The **`@property`** decorator enables the **Uniform Access Principle**, providing transparent validation and computed fields without breaking caller API syntax.
- Property setters protect class invariants and prevent illegal state mutations.
- Use **`@functools.cached_property`** to cache computationally expensive read-only properties.

---

## Best Practices Checklist

- [ ] Default to clean public attributes until validation or derived calculation is required.
- [ ] Use `@property` getters, setters, and deleters to guard business invariants.
- [ ] Assign to internal backing variables (`self._name`) inside setters to avoid infinite recursion.
- [ ] Use `_` for internal protected variables and avoid excessive `__` name mangling.
- [ ] Keep property getters free of side effects (no disk or network writes).

---

## What's Next?

Now that you understand encapsulation and properties, continue to:
👉 **[Inheritance & Polymorphism](inheritance-and-polymorphism.md)** to master subclassing, cooperative `super()`, multiple inheritance, and the C3 Linearization (MRO) algorithm.
