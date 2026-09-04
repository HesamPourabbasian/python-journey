# Creating Custom Packages & `__init__.py` in Python

## Introduction

As software projects grow beyond a handful of standalone `.py` scripts, organizing code into a clear, hierarchical directory structure becomes essential. In Python, this directory-level modularization is achieved through **Packages**.

A **Package** is simply a directory containing Python modules and, traditionally, a special initialization file named **`__init__.py`**. Packages allow you to structure multi-layered applications (such as web APIs, data pipelines, or machine learning frameworks) into logical sub-domains (e.g., `ecommerce.billing`, `ecommerce.inventory`, `ecommerce.notifications`).

Beyond basic file organization, packages provide a mechanism to define a clean, curated **Public API**. By utilizing `__init__.py` and the **`__all__`** export list, package authors can shield internal implementation details, flatten deeply nested import paths, and expose a streamlined developer interface.

This lesson concludes **Module 9: Modules & Packages**, giving you the architectural knowledge required to design, structure, and package enterprise-grade Python software.

---

## Prerequisites

Before studying custom packages, ensure you have:

- Completed [Importing Modules & The Python Import System](importing-modules.md).
- Completed [Python Standard Library Overview](standard-library-overview.md).
- Familiarity with directory structures and relative file paths.

---

## Core Concept: Package Architecture

A Python package is a folder on disk containing modules and an `__init__.py` file:

```
                            ANATOMY OF A PYTHON PACKAGE

   ecommerce/                              # Package Root Directory
   ├── __init__.py                         # Package Initialization & Public Exports
   ├── models/                             # Sub-package
   │   ├── __init__.py
   │   ├── customer.py                     # Module (ecommerce.models.customer)
   │   └── order.py                        # Module (ecommerce.models.order)
   ├── services/                           # Sub-package
   │   ├── __init__.py
   │   ├── payment.py                      # Module (ecommerce.services.payment)
   │   └── shipping.py                     # Module (ecommerce.services.shipping)
   └── utils/                              # Sub-package
       ├── __init__.py
       └── validation.py                   # Module (ecommerce.utils.validation)
```

---

## Syntax & Essential Package Patterns

### 1. The Role of `__init__.py`
When a package is imported (`import ecommerce`), Python automatically executes `ecommerce/__init__.py`. It defines the package-level namespace:

```python
# ecommerce/__init__.py
"""Enterprise E-Commerce SDK Package."""

__version__ = "2.4.0"
__author__ = "Hesam Pourabbasain"

# Flatten public API: expose classes directly from the root package!
from .models.order import Order
from .models.customer import Customer
from .services.payment import PaymentProcessor

# Define explicit public export interface
__all__ = ["Order", "Customer", "PaymentProcessor", "__version__"]
```

### 2. Caller Usage with Flattened Public API
Callers can now import directly from `ecommerce` without needing to know internal folder layouts:

```python
# Clean, professional public import:
from ecommerce import Order, Customer, PaymentProcessor, __version__

print(f"Loaded E-Commerce SDK v{__version__}")
```

### 3. Relative Imports within Package Modules
Inside package submodules, use leading dots `.` to import relative to the current package location:

```python
# ecommerce/services/payment.py

# Single dot (.) -> Current directory (ecommerce/services/)
from .shipping import calculate_shipping_cost

# Double dot (..) -> Parent package (ecommerce/)
from ..models.order import Order
from ..utils.validation import validate_currency
```

---

## Detailed Explanation

### 1. Controlling the Public API with `__all__`

By default, when a user executes `from my_package import *`, Python imports all top-level symbols that do not begin with an underscore `_`.

By explicitly defining `__all__ = ["SymbolA", "SymbolB"]` in a module or `__init__.py`, you establish a strict public API gate:
1. **Governs Wildcard Imports**: Only identifiers listed in `__all__` are exported on `from my_package import *`.
2. **Guides IDEs and Documentation Generators**: Type checkers (Mypy, Pyright) and documentation tools (Sphinx, MkDocs) use `__all__` to distinguish public classes from private helper functions.

```python
# auth_service.py

__all__ = ["authenticate_user", "revoke_session"]  # Only these two are public!

def _private_hash_helper(password: str) -> str:
    return "hash_123"

def authenticate_user(user: str, token: str) -> bool:
    return True

def revoke_session(session_id: str):
    pass
```

---

### 2. Relative Imports and the "No Known Parent Package" Trap

A classic mistake occurs when developers attempt to run a file containing relative imports directly from the terminal:

```bash
python ecommerce/services/payment.py
# CRASHES: ImportError: attempted relative import with no known parent package
```

#### Why Does This Happen?
When you run a file directly with `python filename.py`, Python sets `__name__ = "__main__"` and treats the file as a standalone top-level script with **no parent package context**. Relative imports (`..models`) fail because Python has no idea what `..` refers to!

#### The Professional Solution: The `-m` (Module) Execution Flag
Always execute package modules using the **`-m` flag** from the root workspace directory:

```bash
python -m ecommerce.services.payment
```

This tells Python to load `ecommerce` as the parent package context first, allowing all relative imports to resolve seamlessly.

---

### 3. Regular Packages vs PEP 420 Implicit Namespace Packages

- **Regular Packages (With `__init__.py`)**: Standard package structure. `__init__.py` is executed upon import, allowing package-level initialization, version definitions, and API flattening.
- **PEP 420 Namespace Packages (Without `__init__.py` - Python 3.3+)**: Directories without `__init__.py` are treated as **Namespace Packages**. They allow different submodules of the same package (e.g., `company.auth` and `company.billing`) to reside in completely separate repositories or file system directories while sharing a single logical import root (`import company.auth`).

---

## Examples

### 1. Simple: Two-File Package with Version Metadata
Structuring a minimal package.

```
mathlib/
├── __init__.py
└── geometry.py
```

```python
# mathlib/geometry.py
def circle_area(radius: float) -> float:
    return 3.1415926535 * (radius ** 2)

# mathlib/__init__.py
__version__ = "1.0.0"
from .geometry import circle_area
__all__ = ["circle_area", "__version__"]

# main.py
import mathlib
print(f"MathLib v{mathlib.__version__}: Area = {mathlib.circle_area(5.0):.2f}")
```

### 2. Beginner: API Flattening via `__init__.py`
Hiding deep internal folder complexity behind a simple top-level interface.

```
# Deep internal structure:
cloud_sdk/
├── __init__.py
└── clients/
    ├── __init__.py
    └── s3_client.py   # contains S3StorageClient
```

```python
# cloud_sdk/__init__.py
# Lift S3StorageClient directly to root package
from .clients.s3_client import S3StorageClient

__all__ = ["S3StorageClient"]

# User code:
from cloud_sdk import S3StorageClient  # Clean and concise!
```

### 3. Intermediate: Defensive Package Initialization
Executing environmental validation checks inside `__init__.py` before any submodule can run.

```python
# secure_vault/__init__.py
import os
import sys

# Ensure required environment variable is present upon package load
if "VAULT_MASTER_KEY" not in os.environ:
    # Set default for development or warn
    os.environ["VAULT_MASTER_KEY"] = "dev_insecure_key_123"
    print("⚠️ [WARNING] 'VAULT_MASTER_KEY' unset! Defaulting to development key.", file=sys.stderr)

from .vault_engine import VaultEngine
__all__ = ["VaultEngine"]
```

### 4. Real-World: Multi-Tiered Modular E-Commerce Architecture
A complete production package model with domain models, services, and validation.

```python
# File: ecommerce/utils/validation.py
def validate_positive_amount(amount: float) -> bool:
    return isinstance(amount, (int, float)) and amount > 0

# File: ecommerce/models/order.py
from dataclasses import dataclass
from ..utils.validation import validate_positive_amount

@dataclass
class Order:
    order_id: str
    amount: float
    status: str = "PENDING"

    def __post_init__(self):
        if not validate_positive_amount(self.amount):
            raise ValueError(f"Invalid order amount: {self.amount}")

# File: ecommerce/services/payment.py
from ..models.order import Order

class PaymentProcessor:
    @staticmethod
    def process_payment(order: Order, card_token: str) -> bool:
        print(f"Processing ${order.amount:.2f} for Order {order.order_id} via token {card_token[:6]}...")
        order.status = "PAID"
        return True

# File: ecommerce/__init__.py
from .models.order import Order
from .services.payment import PaymentProcessor

__all__ = ["Order", "PaymentProcessor"]
```

### 5. Advanced: Programmatic Submodule Traversal with `pkgutil`
Writing an automated test or plugin discovery loop that iterates through all submodules in a package dynamically.

```python
import pkgutil
import importlib

def list_all_submodules(package_name: str) -> list[str]:
    """Dynamically discover all submodule names within a package."""
    package = importlib.import_module(package_name)
    submodules = []
    
    if hasattr(package, "__path__"):
        for module_info in pkgutil.walk_packages(package.__path__, prefix=f"{package_name}."):
            submodules.append(module_info.name)
            
    return submodules

# Inspect standard library 'json' package submodules:
print("Discovered 'json' submodules:", list_all_submodules("json"))
```

---

## Code Explanation

In Example 4 (Modular E-Commerce Architecture):
1. `ecommerce/models/order.py` uses relative import `from ..utils.validation import ...` to access sibling packages.
2. `Order.__post_init__` verifies business invariants upon instantiation.
3. `ecommerce/__init__.py` re-exports `Order` and `PaymentProcessor`, presenting a unified facade to consumers.
4. Callers interact with `from ecommerce import Order, PaymentProcessor` without needing to know that validation, models, and services live in separate internal directories.
5. This pattern is known as the **Facade Pattern**, fundamental to clean architecture in Python.

---

## Common Mistakes

### Mistake 1: Placing Heavy, Blocking Code Inside `__init__.py`
`__init__.py` should execute instantaneously. Placing expensive network calls, heavy database connections, or large file reads inside `__init__.py` introduces severe latency whenever any part of your package is imported.

### Mistake 2: Forgetting `__init__.py` in Packages Intended for Distribution
While Python 3.3+ supports namespace packages without `__init__.py`, traditional packaging tools and Linters (like PyInstaller or Flake8) require `__init__.py` to correctly map regular package boundaries.

---

## Best Practices

### Keep `__init__.py` Lightweight and Focused on Facades
Use `__init__.py` primarily for:
1. Defining package version (`__version__`).
2. Re-exporting primary classes/functions to flatten import depth.
3. Defining `__all__` to declare the public interface.

Good:
```python
# __init__.py
__version__ = "1.0.0"
from .client import APIClient
from .exceptions import APIError

__all__ = ["APIClient", "APIError", "__version__"]
```

---

## Performance Considerations

1. **Lazy Submodule Loading**: If a package contains 50 submodules, importing all 50 in `__init__.py` forces Python to parse and execute all 50 files on startup. Only re-export the primary top-level facades in `__init__.py`, allowing auxiliary submodules to be imported on-demand (`import mypkg.specialized_tool`).
2. **Circular Import Mitigation**: Re-exporting in `__init__.py` can trigger circular imports if submodules also import from the root package. Ensure submodules import from sibling submodules directly (`from .models import ...`) rather than importing from the root package.

---

## Security Considerations

1. **Information Leakage via Unrestricted Exports**: Without `__all__`, internal utility functions containing database credentials or private logic are exposed on wildcard imports. Always use `__all__` to restrict public visibility.
2. **Namespace Squatting in PEP 420 Packages**: Because namespace packages have no `__init__.py`, any directory in `sys.path` with the same name will be merged into the package namespace, potentially allowing unauthorized code injection if `sys.path` contains writable shared directories.

---

## Real-World Usage

- **FastAPI / Starlette Core Architecture**: Organizing routing, middleware, responses, and dependency injection into modular sub-packages.
- **Requests Library**: Exposing `requests.get()`, `requests.post()`, and `requests.Response` at the root package level via `__init__.py`.
- **Microservice Monorepos**: Partitioning large domain-driven services into independent domain packages.

---

## Comparison: Package Types

| Feature | Single Module (`.py`) | Regular Package (with `__init__.py`) | Namespace Package (PEP 420) |
|---|---|---|---|
| **Structure** | Single File | Directory with `__init__.py` | Directory without `__init__.py` |
| **`__init__.py` Executed?**| N/A | **Yes (On Import)** | No |
| **Multi-Directory Span?** | No | No (Single folder) | **Yes (Spans multiple paths)** |
| **Public API Facade?** | In file | **Via `__init__.py` + `__all__`**| In submodules |
| **Best Use Case** | Small scripts (<300 lines)| Standard applications & libraries| Large multi-repo enterprise SDKs |

---

## Advanced Concepts: Modern `pyproject.toml` Packaging Standard

In modern Python (PEP 517 / PEP 621), packages are prepared for distribution (to PyPI or internal package registries) using a standard `pyproject.toml` configuration:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "enterprise_cloud_sdk"
version = "1.0.0"
description = "Enterprise Cloud Storage and Compute SDK"
readme = "README.md"
requires-python = ">=3.10"
authors = [{ name = "Hesam Pourabbasain", email = "hesam@domain.com" }]
dependencies = [
    "pydantic>=2.0",
    "httpx>=0.25.0",
]
```

Running `python -m build` compiles the package into a distributable wheel (`.whl`) installable via `pip install`.

---

## Exercises

### Exercise 1 — Beginner
Create a local package named `string_tools/` containing `__init__.py` and `casing.py`. In `casing.py`, write `to_snake_case(text)` and `to_kebab_case(text)`. In `__init__.py`, re-export both functions and set `__version__ = "0.1.0"`. Test importing and calling both functions from a `main.py` script.

### Exercise 2 — Intermediate
Build a package `math_engine/` containing two sub-packages: `algebra/` and `calculus/`. Use relative imports (`..`) to share an error class defined in `math_engine/exceptions.py`. Define `__all__` in all `__init__.py` files to expose only public mathematical functions.

### Exercise 3 — Advanced
Build a `PluginPackageScanner` utility that uses `pkgutil.walk_packages` to inspect any given package name, dynamically importing all submodules, finding all classes that inherit from a base `PluginInterface`, and returning a dictionary of registered plugin instances.

---

## Mini Project: Enterprise Analytics SDK Package Architecture

### Requirements
Build a production-grade analytics package named `analytics_sdk` containing a structured hierarchy of models, metric calculators, and export formatters, utilizing `__init__.py` to expose a clean public API facade and `__all__` to gate exports.

### Implementation Blueprint
```python
# Structure Simulation of analytics_sdk

# 1. Module: analytics_sdk.models
class MetricRecord:
    def __init__(self, metric_name: str, value: float, unit: str = "count"):
        self.name = metric_name
        self.value = value
        self.unit = unit

    def __repr__(self):
        return f"Metric({self.name}={self.value} {self.unit})"

# 2. Module: analytics_sdk.calculators
class AnalyticsEngine:
    @staticmethod
    def compute_summary(records: list[MetricRecord]) -> dict:
        if not records:
            return {"count": 0, "total": 0.0, "average": 0.0}
        total = sum(r.value for r in records)
        return {
            "count": len(records),
            "total": round(total, 2),
            "average": round(total / len(records), 2),
            "max": max(r.value for r in records),
            "min": min(r.value for r in records)
        }

# 3. Module: analytics_sdk.formatters
class ReportFormatter:
    @staticmethod
    def format_terminal_table(summary: dict) -> str:
        border = "=" * 45
        return (
            f"{border}\n"
            f"          ANALYTICS EXECUTIVE SUMMARY\n"
            f"{border}\n"
            f"  Total Metric Events : {summary['count']:>10,d}\n"
            f"  Aggregate Value Sum : {summary['total']:>10,.2f}\n"
            f"  Mean Event Average  : {summary['average']:>10,.2f}\n"
            f"  Peak Maximum Value  : {summary['max']:>10,.2f}\n"
            f"  Lowest Minimum Value: {summary['min']:>10,.2f}\n"
            f"{border}"
        )

# 4. Package Root: analytics_sdk.__init__ Simulation
class AnalyticsSDK:
    """Public Facade for the Analytics SDK Package."""
    __version__ = "3.1.0"
    
    Record = MetricRecord
    Engine = AnalyticsEngine
    Formatter = ReportFormatter

if __name__ == "__main__":
    # Test Consumer Code
    print(f"Loaded Analytics SDK v{AnalyticsSDK.__version__}\n")
    
    # Ingest metric stream
    telemetry = [
        AnalyticsSDK.Record("api_latency_ms", 45.2, "ms"),
        AnalyticsSDK.Record("api_latency_ms", 112.8, "ms"),
        AnalyticsSDK.Record("api_latency_ms", 38.0, "ms"),
        AnalyticsSDK.Record("api_latency_ms", 74.5, "ms"),
        AnalyticsSDK.Record("api_latency_ms", 52.1, "ms"),
    ]
    
    # Process through engine
    summary_data = AnalyticsSDK.Engine.compute_summary(telemetry)
    
    # Render report
    table_output = AnalyticsSDK.Formatter.format_terminal_table(summary_data)
    print(table_output)
```

---

## Summary

In this lesson, you mastered Python's package architecture:
- A **Package** is a directory containing modules and an `__init__.py` file.
- `__init__.py` executes automatically upon package import, serving as a **Facade** to expose clean, flattened public APIs.
- Define **`__all__`** to explicitly declare public exports and protect internal implementation details.
- Use **Relative Imports (`.`, `..`)** within package submodules, and execute packages using `python -m package.module`.
- Keep `__init__.py` lightweight to prevent startup latency.
- PEP 420 introduces namespace packages for multi-repository codebases.

---

## Best Practices Checklist

- [ ] Re-export primary classes in `__init__.py` to provide a clean, top-level public API.
- [ ] Explicitly define `__all__` in `__init__.py` and public modules.
- [ ] Use `python -m package.submodule` to execute modules containing relative imports.
- [ ] Keep `__init__.py` free of expensive network or database initialization code.
- [ ] Use standard relative imports (`from . import sibling`) inside submodules.

---

## What's Next?

Congratulations! You have completed **Module 9: Modules & Packages**.
Now continue to **Module 10: File Handling & Pathlib**:
👉 **[Reading & Writing Files](../file-handling/reading-writing-files.md)** to master file I/O streams, buffer modes, text vs binary modes, and encoding standards.
