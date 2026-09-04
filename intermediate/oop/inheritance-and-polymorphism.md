# Inheritance, Polymorphism & Method Resolution Order (MRO) in Python

## Introduction

In Object-Oriented Programming, real-world domain models rarely exist in isolation. Software entities share common properties, behaviors, and relationships.

- **Inheritance** is a mechanism where a new class (the **Subclass** or **Derived Class**) acquires the attributes and methods of an existing class (the **Base Class** or **Superclass**). This establishes an **"is-a"** relationship (e.g., a `Manager` *is an* `Employee`, a `BitcoinPayment` *is a* `PaymentMethod`), enabling code reuse and structural specialization.
- **Polymorphism** (from Greek, meaning "many forms") is the ability of different classes to respond to the same method call in their own unique ways. In Python, polymorphism is fundamentally intertwined with **Duck Typing** ("If it walks like a duck and quacks like a duck, it's a duck"), allowing functions to operate on any object that satisfies a behavioral contract regardless of its explicit inheritance lineage.

However, as systems grow, combining behaviors across multiple classes introduces **Multiple Inheritance** and the infamous **Diamond Problem**. Python solves this definitively through the **C3 Superclass Linearization Algorithm**, which establishes a deterministic **Method Resolution Order (MRO)** utilized by cooperative **`super()`** calls.

This lesson explores single inheritance, method overriding, cooperative `super()`, multiple inheritance, Mixin design patterns, and the mathematics of C3 Linearization.

---

## Prerequisites

Before studying inheritance and polymorphism, ensure you have:

- Completed [Classes & Objects](classes-and-objects.md) and [Encapsulation & Properties](encapsulation-and-properties.md).
- Mastered Python's descriptor protocol and method binding mechanics.
- A solid understanding of call stacks and argument passing.

---

## Core Concept: The Inheritance & MRO Architecture

```
                            SINGLE vs MULTIPLE (DIAMOND) INHERITANCE

       SINGLE INHERITANCE                          DIAMOND MULTIPLE INHERITANCE
      ┌──────────────────┐                            ┌──────────────────┐
      │   PaymentBase    │                            │      Object      │
      └────────┬─────────┘                            └────────┬─────────┘
               │                                      ┌────────┴────────┐
               ▼                                      ▼                 ▼
      ┌──────────────────┐                   ┌────────────────┐ ┌────────────────┐
      │  CreditCardPay   │                   │  JSONMixin (A) │ │ AuditMixin (B) │
      └──────────────────┘                   └────────┬───────┘ └───────┬────────┘
                                                      └────────┬────────┘
                                                               ▼
                                                      ┌──────────────────┐
                                                      │  UserEntity (C)  │
                                                      └──────────────────┘
                                             C3 MRO: C -> A -> B -> Object
```

---

## Syntax & Essential Inheritance Patterns

```python
# 1. Single Inheritance and super() Initializer Chaining
class BaseEmployee:
    def __init__(self, emp_id: str, name: str, base_salary: float):
        self.emp_id = emp_id
        self.name = name
        self.base_salary = base_salary

    def calculate_annual_payout(self) -> float:
        return self.base_salary

class EngineeringManager(BaseEmployee):
    def __init__(self, emp_id: str, name: str, base_salary: float, team_budget: float, bonus_pct: float = 0.20):
        # Cooperative Superclass Initialization
        super().__init__(emp_id, name, base_salary)
        self.team_budget = team_budget
        self.bonus_pct = bonus_pct

    # Method Overriding & Polymorphism
    def calculate_annual_payout(self) -> float:
        standard_pay = super().calculate_annual_payout()
        return standard_pay * (1.0 + self.bonus_pct)

# 2. Polymorphic Processing
def print_payroll_statement(employees: list[BaseEmployee]):
    for e in employees:
        # Polymorphism: calculate_annual_payout() behaves dynamically per subclass!
        print(f"[{e.emp_id}] {e.name:<22}: ${e.calculate_annual_payout():>10,.2f}")

# 3. Inspecting Method Resolution Order (MRO)
print("EngineeringManager MRO:", EngineeringManager.mro())
```

---

## Detailed Explanation

### 1. How `super()` Actually Works Under the Hood

A pervasive misconception is that `super()` simply calls the "parent class." In Python, `super()` does something far more powerful:

$$\textbf{super()} \text{ delegates to the \textbf{next class in the instance's MRO}, not merely the immediate parent!}$$

When `super().method()` is called:
1. Python inspects the **`__mro__`** tuple of the instance (`self`).
2. It finds the class *immediately following* the current class in that MRO chain.
3. It binds the method to `self` and executes it.

This cooperative dispatch allows multiple inheritance and Mixin chains to execute predictably without hardcoding parent names.

---

### 2. The Diamond Problem & C3 Superclass Linearization

When class `D` inherits from `B` and `C`, and both `B` and `C` inherit from `A`, which version of an overridden method does `D` execute?

Python uses the **C3 Linearization Algorithm** (introduced in Python 2.3) to compute a flat, unambiguous Method Resolution Order guaranteeing three mathematical properties:
1. **Subclasses appear before their parents** (Child first).
2. **Base classes maintain local precedence order** (order listed in `class D(B, C):` is preserved).
3. **Monotonicity**: If class `X` precedes `Y` in the MRO of any parent, `X` must precede `Y` in all subclasses.

```python
class A:
    def execute(self): print("A.execute()")

class B(A):
    def execute(self):
        print("B.execute() -> before super")
        super().execute()

class C(A):
    def execute(self):
        print("C.execute() -> before super")
        super().execute()

class D(B, C):
    def execute(self):
        print("D.execute() -> before super")
        super().execute()

# Inspect C3 MRO for D:
print("D MRO:", [cls.__name__ for cls in D.__mro__])
# Output: ['D', 'B', 'C', 'A', 'object']

d = D()
d.execute()
# Execution Output:
# D.execute() -> before super
# B.execute() -> before super
# C.execute() -> before super
# A.execute()
```

Notice how `B`'s `super().execute()` calls `C.execute()`, not `A`! This is cooperative MRO traversal.

---

### 3. Composition vs Inheritance: "Favor Composition"

While inheritance models **"is-a"** relationships, **Composition** models **"has-a"** relationships by embedding helper objects as instance attributes.

#### When to Avoid Deep Inheritance:
- Inheritance creates **tight coupling**: changes to a base class can silently break subclasses 4 levels down (**Fragile Base Class Problem**).
- Deep inheritance trees ($> 3$ levels) become impossible to trace and reason about.

```python
# AVOID: Deep Fragile Inheritance (Is-a anti-pattern)
# class UserAuthSessionDatabaseLoggableEntity(DatabaseLoggableEntity): ...

# GOOD: Composition (Has-a architecture)
class UserService:
    def __init__(self, db_client, auth_provider, logger):
        self.db = db_client          # Has-a Database
        self.auth = auth_provider    # Has-a Auth Provider
        self.logger = logger        # Has-a Logger
```

---

## Examples

### 1. Simple: Geometric Shape Hierarchy
Demonstrating subclassing and polymorphic area calculations.

```python
import math

class Shape:
    def area(self) -> float:
        raise NotImplementedError("Subclasses must implement area().")

class Circle(Shape):
    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:
        return math.pi * (self.radius ** 2)

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

shapes: list[Shape] = [Circle(5.0), Rectangle(4.0, 6.0), Circle(2.5)]
for s in shapes:
    print(f"Shape: {s.__class__.__name__:<10} | Area: {s.area():>7.2f}")
```

### 2. Beginner: Cooperative Multi-Tiered Vehicle Initialization
Using `super()` to pass parameters cleanly up the hierarchy.

```python
class Vehicle:
    def __init__(self, vin: str, max_speed_kmh: float):
        self.vin = vin
        self.max_speed_kmh = max_speed_kmh
        print(f"  [Vehicle Init] VIN: {self.vin}, Max Speed: {self.max_speed_kmh} km/h")

class MotorizedVehicle(Vehicle):
    def __init__(self, vin: str, max_speed_kmh: float, fuel_type: str):
        super().__init__(vin, max_speed_kmh)
        self.fuel_type = fuel_type
        print(f"  [Motorized Init] Fuel Type: {self.fuel_type}")

class ElectricTruck(MotorizedVehicle):
    def __init__(self, vin: str, max_speed_kmh: float, battery_kwh: float, payload_tons: float):
        super().__init__(vin, max_speed_kmh, fuel_type="Electric Battery")
        self.battery_kwh = battery_kwh
        self.payload_tons = payload_tons
        print(f"  [ElectricTruck Init] Battery: {self.battery_kwh} kWh, Payload: {self.payload_tons} Tons")

truck = ElectricTruck("1HG-TRUCK-990", max_speed_kmh=140.0, battery_kwh=300.0, payload_tons=18.5)
```

### 3. Intermediate: Polymorphic Enterprise Payment Gateway Adapter
Processing heterogeneous payment providers through a single unified dispatcher.

```python
class PaymentGateway:
    def authorize_charge(self, amount: float) -> dict:
        raise NotImplementedError("Subclasses must implement authorize_charge().")

class StripePaymentGateway(PaymentGateway):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def authorize_charge(self, amount: float) -> dict:
        return {"provider": "Stripe", "status": "APPROVED", "fee": amount * 0.029 + 0.30}

class PayPalPaymentGateway(PaymentGateway):
    def __init__(self, client_id: str):
        self.client_id = client_id

    def authorize_charge(self, amount: float) -> dict:
        return {"provider": "PayPal", "status": "APPROVED", "fee": amount * 0.034}

class CryptoPaymentGateway(PaymentGateway):
    def __init__(self, wallet_address: str):
        self.wallet = wallet_address

    def authorize_charge(self, amount: float) -> dict:
        return {"provider": "Bitcoin/Lightning", "status": "APPROVED", "fee": 0.05}

def process_checkout(gateway: PaymentGateway, cart_total: float):
    # Polymorphic call: Works identically for any gateway subclass!
    receipt = gateway.authorize_charge(cart_total)
    net_payout = cart_total - receipt["fee"]
    print(f"💳 [{receipt['provider']:<18}] Gross: ${cart_total:>7.2f} | Fee: ${receipt['fee']:>5.2f} | Net: ${net_payout:>7.2f}")

gateways = [
    StripePaymentGateway("sk_live_123"),
    PayPalPaymentGateway("client_paypal_456"),
    CryptoPaymentGateway("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh")
]

for g in gateways:
    process_checkout(g, 150.00)
```

### 4. Real-World: Mixin Classes for Reusable Orthogonal Behaviors
Using multiple inheritance Mixins to add JSON serialization and audit logging to arbitrary domain models.

```python
import json
from datetime import datetime, timezone

class JSONSerializableMixin:
    """Mixin that adds to_json() serialization to any class."""
    def to_json(self) -> str:
        data = {k: v for k, v in self.__dict__.items() if not k.startswith("_")}
        return json.dumps(data, indent=2)

class AuditLogMixin:
    """Mixin that automatically logs instance mutations."""
    def log_audit(self, action: str):
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
        print(f"📝 [AUDIT {timestamp}] {self.__class__.__name__} ({getattr(self, 'id', 'N/A')}): {action}")

# Combining Mixins with Base Domain Entity
class CustomerAccount(JSONSerializableMixin, AuditLogMixin):
    def __init__(self, customer_id: str, name: str, email: str):
        self.id = customer_id
        self.name = name
        self.email = email
        self.log_audit("ACCOUNT_CREATED")

    def update_email(self, new_email: str):
        old = self.email
        self.email = new_email
        self.log_audit(f"EMAIL_CHANGED from '{old}' to '{new_email}'")

customer = CustomerAccount("CUST-901", "Hesam Pourabbasain", "hesam@domain.com")
customer.update_email("hesam_new@domain.com")

print("\nGenerated JSON Document:\n", customer.to_json())
```

### 5. Advanced: Dissecting C3 Linearization Inconsistent MRO Errors
Understanding how Python detects and rejects illegal, ambiguous inheritance graphs.

```python
# Consider this conflicting inheritance hierarchy:
class X: pass
class Y(X): pass

# Trying to create class Z(X, Y) causes a TypeError!
# Why? Because Y inherits from X, so Y MUST come before X in the MRO.
# But listing class Z(X, Y) demands X come before Y!
try:
    class Z(X, Y): pass
except TypeError as err:
    print("🚨 [C3 LINEARIZATION CONFLICT REJECTED]")
    print(err)
    # Output: Cannot create a consistent method resolution order (MRO) for bases X, Y
```

---

## Code Explanation

In Example 4 (Mixins):
1. **Mixins** are lightweight, focused classes designed to provide specific orthogonal behaviors (`to_json`, `log_audit`) rather than modeling standalone domain entities.
2. `CustomerAccount(JSONSerializableMixin, AuditLogMixin)` inherits methods from both mixins without deep inheritance coupling.
3. When `customer.to_json()` is called, Python traverses the MRO: `[CustomerAccount, JSONSerializableMixin, AuditLogMixin, object]`, finding and executing the serializer.
4. This pattern powers modern frameworks like **Django REST Framework** (`ListModelMixin`, `CreateModelMixin`).

---

## Common Mistakes

### Mistake 1: Hardcoding Parent Class Names Instead of Using `super()`
Calling `BaseClass.__init__(self, ...)` directly breaks cooperative multiple inheritance and causes base classes in diamond hierarchies to execute multiple times. Always use `super()`.

### Mistake 2: Missing `super().__init__()` in Subclasses
Omitting `super().__init__()` leaves parent attributes uninitialized, causing `AttributeError` when parent methods try to access them.

---

## Best Practices

### Use `isinstance()` and `issubclass()` for Type Checks
Never check types using exact equality (`type(obj) == BaseClass`), as this breaks polymorphism for all subclasses.

Good:
```python
if isinstance(payment, PaymentGateway):
    payment.authorize_charge(amount)
```

Avoid:
```python
if type(payment) == PaymentGateway:  # Fails for all subclasses! ❌
    payment.authorize_charge(amount)
```

---

## Performance Considerations

1. **MRO Caching**: CPython caches Method Resolution Order lookups in internal type structures. Method lookup takes ~$50\text{ nanoseconds}$, regardless of whether the method resides on the child or 3 levels up in the MRO.
2. **Deep Inheritance Overhead**: Very deep inheritance hierarchies ($> 5$ levels) slightly increase class creation time and make debugging memory references complex.

---

## Security Considerations: The Liskov Substitution Principle (LSP)

The **Liskov Substitution Principle (LSP)** states that **subclasses must be substitutable for their base classes without altering program correctness or security guarantees**.

If a base class `DataStore.read()` requires user authentication, a subclass must **not** override `read()` to bypass authentication. Violating LSP introduces security vulnerabilities where generic callers assume security checks are enforced.

---

## Real-World Usage

- **Django Generic Class-Based Views**: Combining `ListView` with `LoginRequiredMixin` and `JSONResponseMixin`.
- **FastAPI / Starlette Middleware**: Subclassing `BaseHTTPMiddleware` and overriding `dispatch()`.
- **PyTorch Modules**: Subclassing `torch.nn.Module` and implementing the polymorphic `forward(*inputs)` method.

---

## Comparison: Inheritance vs Composition

| Dimension | Inheritance (`class B(A)`) | Composition (`self.a = A()`) | Mixins (`class B(MixinA)`) |
|---|---|---|---|
| **Relationship** | **"Is-A"** (Specialization) | **"Has-A"** (Delegation) | **"Can-Do"** (Capability) |
| **Coupling** | **Tight** (Bound to parent)| **Loose** (Easily swapped/mocked)| Moderate |
| **Flexibility** | Static (Compile-time) | **Dynamic (Runtime re-binding)** | Static |
| **Best For** | True domain taxonomies | Services, Repositories, Helpers| Reusable orthogonal behaviors |

---

## Advanced Concepts: The C3 Merge Equation

Formally, the C3 Linearization of a class $C$ with parents $B_1, B_2, \dots, B_n$ is computed as:

$$L(C) = [C] + \text{merge}\Big(L(B_1), L(B_2), \dots, L(B_n), [B_1, B_2, \dots, B_n]\Big)$$

The `merge` operation inspects the heads of the lists. It selects the first head that does not appear in the tail of any other list, appends it to the result, removes it from the candidate lists, and repeats until all lists are exhausted. If no candidate can be chosen, Python raises a `TypeError` for inconsistent MRO.

---

## Exercises

### Exercise 1 — Beginner
Create a base class `Notification` with attribute `recipient` and method `send(message)`. Create subclasses `EmailNotification` and `SMSNotification` that override `send()` with formatted messages. Write a function `dispatch_all(notifications, msg)` that demonstrates polymorphism.

### Exercise 2 — Intermediate
Build a `TimestampMixin` that automatically sets `created_at` and `updated_at` timestamps on instances. Combine this mixin with a `BlogPost` entity class.

### Exercise 3 — Advanced
Construct a 4-class Diamond Inheritance tree (`CoreService`, `AuthService(CoreService)`, `CacheService(CoreService)`, `AppService(AuthService, CacheService)`). Use cooperative `super().initialize()` across all 4 classes to verify that every initialization stage executes exactly once in C3 MRO order.

---

## Mini Project: Enterprise Role-Based Access Control (RBAC) & Notification Engine

### Requirements
Build a production-grade user permissions and dispatching engine named `rbac_dispatch_engine.py`. Implement a base `UserAccount` class, specialized subclasses (`StandardUser`, `ManagerUser`, `SuperAdminUser`), polymorphic permission checks, and Mixin-based multi-channel alerting.

### Implementation Blueprint
```python
from datetime import datetime, timezone

# =====================================================================
# 1. ORTHOGONAL MIXIN CAPABILITIES
# =====================================================================

class EmailAlertMixin:
    def send_email_alert(self, subject: str, body: str):
        email = getattr(self, "email", "unknown@domain.com")
        print(f"📧 [EMAIL DISPATCHED] -> To: {email} | Subject: '{subject}' | Body: '{body}'")

class AuditTraceMixin:
    def log_security_event(self, action: str, resource: str):
        user_id = getattr(self, "user_id", "SYS")
        role = getattr(self, "role_name", "UNKNOWN")
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
        print(f"🔒 [SECURITY AUDIT {ts}] User: {user_id} ({role}) -> Action: {action} on '{resource}'")

# =====================================================================
# 2. BASE DOMAIN ENTITY
# =====================================================================

class BaseUser(EmailAlertMixin, AuditTraceMixin):
    role_name = "BASE_USER"

    def __init__(self, user_id: str, name: str, email: str):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.is_active = True

    def can_access_resource(self, resource_type: str) -> bool:
        # Base users can only read public content
        return resource_type.upper() == "PUBLIC_READ"

    def execute_action(self, action_name: str, resource_type: str) -> bool:
        if not self.can_access_resource(resource_type):
            self.log_security_event(f"DENIED_{action_name}", resource_type)
            self.send_email_alert("Security Warning: Unauthorized Access", f"Attempted '{action_name}' on '{resource_type}'")
            return False
            
        self.log_security_event(f"PERMITTED_{action_name}", resource_type)
        return True

# =====================================================================
# 3. SPECIALIZED DERIVED SUBCLASSES
# =====================================================================

class StandardUser(BaseUser):
    role_name = "STANDARD_USER"

    def can_access_resource(self, resource_type: str) -> bool:
        allowed = {"PUBLIC_READ", "USER_PROFILE", "TEAM_DOCS"}
        return resource_type.upper() in allowed

class ManagerUser(StandardUser):
    role_name = "MANAGER_USER"

    def __init__(self, user_id: str, name: str, email: str, department: str):
        super().__init__(user_id, name, email)
        self.department = department

    def can_access_resource(self, resource_type: str) -> bool:
        # Inherits standard permissions + manager financial resources
        if super().can_access_resource(resource_type):
            return True
        return resource_type.upper() in {"FINANCIAL_REPORTS", "PAYROLL_AUDIT"}

class SuperAdminUser(ManagerUser):
    role_name = "SUPER_ADMIN"

    def __init__(self, user_id: str, name: str, email: str):
        super().__init__(user_id, name, email, department="Executive IT")

    def can_access_resource(self, resource_type: str) -> bool:
        # Unrestricted root access
        return True

# =====================================================================
# 4. POLYMORPHIC DISPATCHER
# =====================================================================

def evaluate_access_request(user: BaseUser, action: str, resource: str):
    print("\n" + "-" * 60)
    print(f"Request: User '{user.name}' ({user.role_name}) requesting '{action}' on '{resource}'")
    success = user.execute_action(action, resource)
    status_label = "✅ ACCESS GRANTED" if success else "🚫 ACCESS DENIED"
    print(f"Outcome: {status_label}")

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE RBAC & POLYMORPHIC SECURITY ENGINE")
    print("=" * 65)
    
    users: list[BaseUser] = [
        StandardUser("USR-101", "Hesam Standard", "hesam@domain.com"),
        ManagerUser("MGR-201", "Sarah Manager", "sarah@domain.com", department="Finance"),
        SuperAdminUser("ADM-901", "Alex Root", "alex@domain.com")
    ]
    
    # 1. Test Public Resource Access (All Pass)
    for u in users:
        evaluate_access_request(u, "READ", "PUBLIC_READ")

    # 2. Test Financial Reports Access (Standard fails, Manager & Admin pass)
    for u in users:
        evaluate_access_request(u, "VIEW_BALANCE", "FINANCIAL_REPORTS")

    # 3. Test Root Infrastructure Mutation (Standard & Manager fail, Admin passes)
    for u in users:
        evaluate_access_request(u, "PURGE_DATABASE", "ROOT_INFRASTRUCTURE")
        
    print("\n" + "=" * 65)
```

---

## Summary

In this lesson, you mastered Python's inheritance and polymorphism architecture:
- **Inheritance** establishes "is-a" specialization hierarchies and enables code reuse.
- **Polymorphism** allows heterogeneous subclasses to respond uniquely to uniform method interfaces.
- **`super()`** cooperatively delegates execution along the instance's **Method Resolution Order (MRO)**.
- Python resolves multiple inheritance using the **C3 Superclass Linearization Algorithm**.
- **Mixins** provide composable, reusable capabilities across unrelated classes without deep coupling.
- **"Favor Composition over Inheritance"** to prevent brittle, hard-to-maintain class trees.

---

## Best Practices Checklist

- [ ] Use `super().__init__()` cooperatively in all subclass initializers.
- [ ] Keep inheritance hierarchies shallow ($\le 3$ levels deep).
- [ ] Use Mixins for orthogonal capabilities (`JSONSerializableMixin`, `AuditMixin`).
- [ ] Use `isinstance(obj, BaseClass)` for type checking rather than exact equality (`type(obj) == Class`).
- [ ] Ensure subclasses adhere strictly to the Liskov Substitution Principle (LSP).

---

## What's Next?

Now that you understand inheritance and polymorphism, continue to:
👉 **[Abstract Base Classes (ABCs)](abstract-base-classes.md)** to master interface enforcement, `@abstractmethod`, and architectural contracts via the `abc` module.
