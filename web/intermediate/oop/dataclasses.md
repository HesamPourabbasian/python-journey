# Modern Data Modeling with Dataclasses in Python

## Introduction

In software applications, a large proportion of classes exist primarily to act as **Data Containers** (also known as *Data Transfer Objects (DTOs)*, *Value Objects*, or *Records*). These classes store structured state (such as user profiles, database query results, coordinates, or API request payloads) and require standard boilerplate methods: `__init__`, `__repr__`, `__eq__`, and hashing support.

Before Python 3.7, writing a data container required dozens of lines of repetitive boilerplate:

```python
# The Tedious Pre-Python 3.7 Boilerplate:
class User:
    def __init__(self, user_id: int, name: str, email: str):
        self.user_id = user_id
        self.name = name
        self.email = email

    def __repr__(self):
        return f"User(user_id={self.user_id}, name={self.name}, email={self.email})"

    def __eq__(self, other):
        if not isinstance(other, User): return NotImplemented
        return (self.user_id, self.name, self.email) == (other.user_id, other.name, other.email)
```

Introduced in **Python 3.7** via **PEP 557**, the **`dataclasses`** module revolutionizes data modeling.

By attaching the **`@dataclass`** decorator to a class with type annotations, Python automatically synthesizes optimized `__init__`, `__repr__`, `__eq__`, and comparison methods under the hood at class definition time. Dataclasses preserve full object-oriented capabilities (methods, properties, inheritance) while eliminating manual boilerplate.

This lesson concludes **Module 1: Object-Oriented Programming (OOP) in Depth**, exploring field customization, mutable default factories, post-initialization validation (`__post_init__`), immutable value objects (`frozen=True`), and memory optimization with `slots=True`.

---

## Prerequisites

Before studying dataclasses, ensure you have:

- Completed [Classes & Objects](classes-and-objects.md) and [Magic & Dunder Methods](magic-methods-dunder.md).
- Completed [Constructors & Instance Attributes](constructors-and-attributes.md) (specifically `__slots__`).
- Familiarity with Python type annotations.

---

## Core Concept: Declarative Data Modeling

```
                             DATACLASS GENERATION PIPELINE

             Declarative Code Input                 Generated Under the Hood
         ┌─────────────────────────────┐        ┌─────────────────────────────┐
         │ @dataclass                  │        │ • def __init__(self, ...):  │
         │ class Server:               │ ─────► │ • def __repr__(self): ...   │
         │     hostname: str           │        │ • def __eq__(self, other):  │
         │     ip: str                 │        │ • def __hash__(self): ...   │
         │     port: int = 8080        │        │ • def __lt__(self, other):  │
         └─────────────────────────────┘        └─────────────────────────────┘
```

---

## Syntax & Essential Dataclass Patterns

```python
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone

# 1. Standard Dataclass with Field Customization
@dataclass
class CloudInstance:
    instance_id: str
    region: str
    cpu_cores: int = 4
    # Mutable Default Factory: Prevents shared mutable list bugs!
    tags: list[str] = field(default_factory=list)
    # Exclude sensitive secrets from logging (__repr__)
    api_secret: str = field(default="secret_token", repr=False)

# 2. Immutable Value Object (frozen=True) with Memory Optimization (slots=True)
@dataclass(frozen=True, slots=True)
class GeoCoordinate:
    latitude: float
    longitude: float
    altitude_m: float = 0.0

# 3. Post-Initialization Processing (__post_init__)
@dataclass
class OrderItem:
    sku: str
    unit_price: float
    quantity: int
    total_price: float = field(init=False)  # Computed in __post_init__

    def __post_init__(self):
        if self.unit_price <= 0 or self.quantity <= 0:
            raise ValueError("Price and quantity must be strictly positive.")
        self.total_price = round(self.unit_price * self.quantity, 2)

# Usage
item = OrderItem("SKU-9901", unit_price=45.50, quantity=3)
print(item)  # OrderItem(sku='SKU-9901', unit_price=45.5, quantity=3, total_price=136.5)
print("Dictionary Export:", asdict(item))
```

---

## Detailed Explanation

### 1. The Mutable Default Trap in Dataclasses

In standard Python functions and classes, assigning a mutable default (`tags: list = []`) causes all instances to share the exact same list in memory.

Python dataclasses actively protect you by raising a **`ValueError` at compile time** if you attempt to assign a mutable default:

```python
# 🚨 COMPILE-TIME ERROR:
# @dataclass
# class BrokenUser:
#     roles: list[str] = [] # ValueError: mutable default <class 'list'> for field roles is not allowed!

# ✅ CORRECT: Use default_factory
@dataclass
class SafeUser:
    roles: list[str] = field(default_factory=list)
    metadata: dict[str, str] = field(default_factory=dict)
```

`default_factory=list` instructs Python to call `list()` afresh for every new instance.

---

### 2. Post-Initialization with `__post_init__` and `InitVar`

When `@dataclass` generates `__init__`, it executes all attribute assignments and then automatically checks for and calls **`__post_init__(self)`**.

`__post_init__` is ideal for:
1. **Validating Data Invariants** (e.g. verifying email formats or age thresholds).
2. **Deriving Computed Fields** marked with `field(init=False)`.
3. **Receiving Initialization-Only Variables (`InitVar`)**:

```python
from dataclasses import dataclass, InitVar

@dataclass
class SecureDatabaseConnection:
    host: str
    port: int
    # InitVar: Passed to __init__ and __post_init__, but NOT saved as an instance attribute!
    raw_password: InitVar[str]
    connection_string: str = field(init=False)

    def __post_init__(self, raw_password: str):
        # Mask password in connection string
        masked = raw_password[:2] + "****"
        self.connection_string = f"postgres://user:{masked}@{self.host}:{self.port}/db"

conn = SecureDatabaseConnection("10.0.1.25", 5432, raw_password="SuperSecretPassword123")
print("Connection String :", conn.connection_string)
print("Has raw_password? :", hasattr(conn, "raw_password")) # False! (Not stored on instance)
```

---

### 3. Immutability & Hashability with `frozen=True`

Setting `@dataclass(frozen=True)` creates an **Immutable Value Object**:
- Any attempt to assign (`obj.x = 10`) or delete (`del obj.x`) raises a `FrozenInstanceError`.
- Python automatically synthesizes a deterministic `__hash__()` method, allowing instances to be **used as dictionary keys and set elements safely**.

---

### 4. Memory Optimization with `slots=True` (Python 3.10+)

In Python 3.10+, adding `slots=True` to `@dataclass` automatically generates `__slots__` matching all declared fields, eliminating `__dict__` and slashing memory usage by **~65%** while retaining all dataclass features.

```python
@dataclass(slots=True)
class HighSpeedTelemetry:
    sensor_id: str
    reading: float
    timestamp: float
```

---

## Examples

### 1. Simple: User Account Model
Creating a minimal typed user entity.

```python
from dataclasses import dataclass

@dataclass
class User:
    id: int
    username: str
    email: str
    is_active: bool = True

u1 = User(101, "hesamp", "hesam@domain.com")
u2 = User(101, "hesamp", "hesam@domain.com")

print("Generated Repr :", u1)                 # User(id=101, username='hesamp', email='hesam@domain.com', is_active=True)
print("Equality Check :", u1 == u2)           # True (Automatic __eq__ comparison!)
```

### 2. Beginner: Inventory Item with Custom Sorting (`order=True`)
Enabling automatic comparison operators (`<`, `<=`, `>`, `>=`) based on field order.

```python
from dataclasses import dataclass, field

@dataclass(order=True)
class PriorityTask:
    # Sort index controls comparison order!
    sort_index: int = field(init=False, repr=False)
    priority: int
    title: str = field(compare=False)

    def __post_init__(self):
        # Invert priority so higher numbers come first in sorted()
        self.sort_index = -self.priority

t1 = PriorityTask(priority=1, title="Fix Minor Typo")
t2 = PriorityTask(priority=5, title="Patch Critical Zero-Day Vulnerability")
t3 = PriorityTask(priority=3, title="Deploy Staging Build")

tasks = [t1, t2, t3]
tasks.sort()
print("Tasks Sorted by Priority Descending:")
for t in tasks:
    print(f"  [{t.priority}★] {t.title}")
```

### 3. Intermediate: Immutable Coordinates in Spatial Caching
Using `frozen=True` dataclasses as hashable dictionary cache keys.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Coordinate3D:
    x: float
    y: float
    z: float = 0.0

# Hashable in sets and dicts!
spatial_cache = {
    Coordinate3D(0.0, 0.0, 0.0): "Origin Node",
    Coordinate3D(10.5, 20.0, 5.0): "Waypoint Alpha"
}

target = Coordinate3D(10.5, 20.0, 5.0)
print("Cache Query Result:", spatial_cache[target])

# Attempting mutation raises FrozenInstanceError
try:
    target.x = 100.0
except Exception as err:
    print(f"🛡️ [IMMUTABILITY GUARD] {type(err).__name__}: Cannot modify frozen dataclass instance.")
```

### 4. Real-World: E-Commerce Order Aggregate with Nested Dataclasses & Serialization
Building a complete e-commerce domain aggregate with nested line items and JSON serialization.

```python
import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone

@dataclass
class LineItem:
    product_id: str
    title: str
    unit_price: float
    quantity: int

    @property
    def subtotal(self) -> float:
        return round(self.unit_price * self.quantity, 2)

@dataclass
class CustomerOrder:
    order_id: str
    customer_id: str
    items: list[LineItem] = field(default_factory=list)
    tax_rate: float = 0.08
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def gross_total(self) -> float:
        return sum(item.subtotal for item in self.items)

    @property
    def final_total(self) -> float:
        return round(self.gross_total * (1.0 + self.tax_rate), 2)

    def to_json(self) -> str:
        # Convert nested dataclasses to dictionary, then serialize to JSON
        data = asdict(self)
        data["gross_total"] = self.gross_total
        data["final_total"] = self.final_total
        return json.dumps(data, indent=2)

order = CustomerOrder(
    order_id="ORD-9901",
    customer_id="CUST-104",
    items=[
        LineItem("SKU-1", "Mechanical Keyboard", 140.00, 2),
        LineItem("SKU-2", "USB-C Hub", 45.00, 1),
    ]
)

print(f"Order #{order.order_id} | Gross: ${order.gross_total:,.2f} | Final with Tax: ${order.final_total:,.2f}")
print("\nExported Order JSON Document:\n", order.to_json())
```

### 5. Advanced: Keyword-Only Fields (`kw_only=True`) & Non-Default Inheritance
Using Python 3.10+ `kw_only=True` to solve the classic inheritance limitation where subclasses cannot declare required fields after base classes with default fields.

```python
from dataclasses import dataclass

@dataclass(kw_only=True)
class BaseEntity:
    id: str
    created_at: str = "2024-01-01"  # Default field

@dataclass(kw_only=True)
class DetailedProduct(BaseEntity):
    # With kw_only=True, required fields CAN follow base default fields!
    name: str                       # Non-default field
    price: float                    # Non-default field

# All arguments must be passed as keywords:
product = DetailedProduct(id="PRD-101", name="Wireless Headset", price=89.99)
print("Keyword-Only Product Instance:", product)
```

---

## Code Explanation

In Example 5 (`kw_only=True`):
1. In standard dataclasses, field ordering mirrors function arguments: non-default fields cannot follow default fields. If `BaseEntity` has a field with a default (`created_at`), a subclass declaring `name: str` would raise a `TypeError`.
2. Python 3.10's `kw_only=True` parameter converts all generated `__init__` parameters into keyword-only arguments (`def __init__(*, id, created_at=..., name, price)`).
3. This eliminates inheritance ordering conflicts completely, allowing flexible, multi-tiered domain entity modeling.

---

## Common Mistakes

### Mistake 1: Direct Mutable Default Assignments
Writing `items: list = []` causes a compile-time `ValueError`. Always use `field(default_factory=list)`.

### Mistake 2: Mutating a `frozen=True` Dataclass
Attempting to assign to a frozen instance raises `dataclasses.FrozenInstanceError`. To create a modified copy of an immutable dataclass, use `dataclasses.replace(obj, new_field=val)`.

```python
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    host: str
    port: int

cfg1 = Config("localhost", 8000)
# cfg1.port = 9000  # FrozenInstanceError! ❌

# CORRECT: Create updated copy using replace()
cfg2 = replace(cfg1, port=9000) # Valid! ✅
```

---

## Best Practices

### Use `slots=True` on Modern Dataclasses (Python 3.10+)
Unless dynamic attribute attachment is strictly required, always specify `slots=True` to optimize memory and accelerate attribute lookups.

Good:
```python
@dataclass(slots=True)
class MetricEvent:
    name: str
    value: float
```

---

## Performance Considerations

1. **Instantiation Speed**: Dataclass `__init__` functions are compiled into native C-bytecode functions at module load time. Instantiating a dataclass is **just as fast as a hand-written manual class**.
2. **`asdict()` Deep Copy Overhead**: `dataclasses.asdict()` recursively traverses and deep-copies nested objects. For high-throughput serialization pipelines (50,000 req/sec), custom serializers or Pydantic V2 are faster.

---

## Security Considerations

1. **Hiding Sensitive Credentials with `repr=False`**: Always mark passwords, bearer tokens, and API secret fields with `field(repr=False)` to prevent credentials from being logged into stdout or monitoring systems during unhandled traceback printouts.
2. **Immutable DTOs**: Use `frozen=True` for data transfer objects shared across concurrent threads to prevent data race conditions.

---

## Real-World Usage

- **FastAPI Endpoint Schemas**: Defining typed query parameters and response models.
- **Machine Learning Configurations**: Hyperparameter dictionaries structured as frozen dataclasses.
- **Database Transfer Objects**: Encapsulating SQL query result rows cleanly.

---

## Comparison: Data Container Options

| Feature | `tuple` | `namedtuple` | Standard `class` | `@dataclass` | `pydantic.BaseModel` |
|---|---|---|---|---|---|
| **Syntax Boilerplate** | None | Low | **High** | **Lowest** | Low |
| **Type Annotations** | No | Optional | Optional | **First-Class** | **Runtime Enforced** |
| **Methods & Properties**| No | Limited | **Yes** | **Yes** | **Yes** |
| **Mutable?** | No | No | Yes | **Configurable (`frozen`)**| Configurable |
| **Validation Layer** | No | No | Manual | Manual (`__post_init__`)| **Automatic Deep Validation**|
| **Standard Library?** | **Yes** | **Yes** | **Yes** | **Yes (Python 3.7+)**| No (`pip install`) |

---

## Advanced Concepts: Dynamic Dataclasses with `make_dataclass`

Python allows generating dataclasses programmatically at runtime using `dataclasses.make_dataclass`:

```python
from dataclasses import make_dataclass

# Dynamically construct a dataclass from database schema metadata!
DynamicRecord = make_dataclass(
    "DynamicRecord",
    [("transaction_id", str), ("amount", float), ("is_verified", bool, False)]
)

record = DynamicRecord("TX-9901", 450.00, True)
print("Dynamic Dataclass Instance:", record)
```

---

## Exercises

### Exercise 1 — Beginner
Create a dataclass `Book` with fields `title: str`, `author: str`, `pages: int`, and `isbn: str`. Create two identical book instances and verify that `b1 == b2` evaluates to `True`.

### Exercise 2 — Intermediate
Build a `frozen=True` dataclass `RGBColor` with fields `r: int`, `g: int`, `b: int`. In `__post_init__`, validate that all values fall between 0 and 255. Add a property `hex_code` that returns formatted hex strings (e.g. `"#FFFFFF"`).

### Exercise 3 — Advanced
Build an `Invoice` dataclass containing `invoice_id: str`, `client_name: str`, `items: list[dict] = field(default_factory=list)`, and `discount_code: InitVar[str] = None`. In `__post_init__`, calculate total amounts and apply a 10% discount if `discount_code == "SAVE10"`.

---

## Mini Project: Enterprise Order Processing & Invoicing Dataclass Architecture

### Requirements
Build a resilient order processing and invoice generation system named `order_invoicing_engine.py`. Model customers, line items, and invoices using `@dataclass` with `slots=True`, `field(default_factory=...)`, `__post_init__` schema validation, and JSON exports.

### Implementation Blueprint
```python
import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone

# =====================================================================
# 1. DOMAIN DATA MODELS
# =====================================================================

@dataclass(frozen=True, slots=True)
class Customer:
    customer_id: str
    company_name: str
    billing_email: str
    tax_exempt: bool = False

@dataclass(slots=True)
class InvoiceLineItem:
    description: str
    quantity: int
    unit_price: float
    total: float = field(init=False)

    def __post_init__(self):
        if self.quantity <= 0:
            raise ValueError(f"Quantity must be positive, got {self.quantity}")
        if self.unit_price < 0:
            raise ValueError(f"Unit price cannot be negative, got {self.unit_price}")
        self.total = round(self.quantity * self.unit_price, 2)

@dataclass(slots=True)
class CommercialInvoice:
    invoice_number: str
    customer: Customer
    line_items: list[InvoiceLineItem] = field(default_factory=list)
    tax_rate_percent: float = 8.5
    issued_at: str = field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ"))
    subtotal: float = field(init=False)
    tax_amount: float = field(init=False)
    grand_total: float = field(init=False)

    def __post_init__(self):
        self.recalculate()

    def add_item(self, description: str, qty: int, unit_price: float):
        self.line_items.append(InvoiceLineItem(description, qty, unit_price))
        self.recalculate()

    def recalculate(self):
        self.subtotal = round(sum(item.total for item in self.line_items), 2)
        if self.customer.tax_exempt:
            self.tax_amount = 0.0
        else:
            self.tax_amount = round(self.subtotal * (self.tax_rate_percent / 100.0), 2)
        self.grand_total = round(self.subtotal + self.tax_amount, 2)

    def generate_ascii_invoice(self) -> str:
        border = "=" * 68
        lines = [
            border,
            f"                     COMMERCIAL TAX INVOICE",
            border,
            f"  Invoice No : {self.invoice_number:<20} Issued: {self.issued_at}",
            f"  Customer   : {self.customer.company_name} ({self.customer.billing_email})",
            f"  Tax Status : {'TAX EXEMPT (0%)' if self.customer.tax_exempt else f'Standard Tax ({self.tax_rate_percent}%)'}",
            "-" * 68,
            f"{'QTY':<6} {'DESCRIPTION':<36} {'UNIT PRICE':>10} {'TOTAL':>11}",
            "-" * 68
        ]
        for item in self.line_items:
            lines.append(f"{item.quantity:<6} {item.description:<36} ${item.unit_price:>9.2f} ${item.total:>10.2f}")
            
        lines.extend([
            "-" * 68,
            f"  {'SUBTOTAL':<52}: ${self.subtotal:>10,.2f}",
            f"  {'TAX AMOUNT':<52}: ${self.tax_amount:>10,.2f}",
            f"  {'GRAND TOTAL':<52}: ${self.grand_total:>10,.2f}",
            border
        ])
        return "\n".join(lines)

if __name__ == "__main__":
    print("=" * 65)
    print("      ENTERPRISE COMMERCIAL INVOICE DATACLASS ENGINE")
    print("=" * 65)
    
    # 1. Create Immutable Customer
    client = Customer(
        customer_id="CUST-8801",
        company_name="Acme Quantum Dynamics Inc.",
        billing_email="accounts@acmequantum.com",
        tax_exempt=False
    )
    
    # 2. Build Invoice Aggregate
    invoice = CommercialInvoice(
        invoice_number="INV-2024-0891",
        customer=client,
        tax_rate_percent=8.25
    )
    
    # 3. Add Line Items
    invoice.add_item("Cloud Compute Cluster Node (Month)", qty=4, unit_price=250.00)
    invoice.add_item("Dedicated Fiber Uplink 10Gbps", qty=1, unit_price=1200.00)
    invoice.add_item("24/7 Priority Support SLA", qty=1, unit_price=500.00)
    
    # 4. Render Invoice Output
    print("\n" + invoice.generate_ascii_invoice())
    
    # 5. Export Clean Dictionary Representation
    print("\nExported Dataclass Structure (Top-Level Keys):")
    print(list(asdict(invoice).keys()))
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's dataclasses:
- **`@dataclass` eliminates boilerplate** by automatically generating `__init__`, `__repr__`, `__eq__`, and comparison methods.
- Use **`field(default_factory=list)`** to prevent the dangerous mutable default argument trap.
- Execute validation and derive computed fields in **`__post_init__`**.
- Create immutable, hashable value objects with **`frozen=True`**.
- Optimize memory and accelerate attribute lookups with **`slots=True` (Python 3.10+)**.
- Export structured data to dictionaries and JSON with **`asdict()`**.

---

## Best Practices Checklist

- [ ] Use `@dataclass` for all pure data container models.
- [ ] Always use `field(default_factory=...)` for mutable default collections (`list`, `dict`, `set`).
- [ ] Use `frozen=True` for value objects that must be hashable as set members or dict keys.
- [ ] Use `slots=True` on modern Python 3.10+ codebases to minimize RAM consumption.
- [ ] Hide sensitive fields (passwords, tokens) using `field(repr=False)`.

---

## 🏆 MODULE 1: OBJECT-ORIENTED PROGRAMMING (OOP) COMPLETE!

Congratulations! You have completed all 7 comprehensive articles of **Module 1: Object-Oriented Programming (OOP) in Depth**.

### What's Next?
Now advance to **Module 2: Iterators & Generators**:
👉 **[Iterators & Generators Module Overview](../iterators-generators/README.md)** to master memory-efficient streaming, the Iterator Protocol, generator pipelines, and the `itertools` library!
