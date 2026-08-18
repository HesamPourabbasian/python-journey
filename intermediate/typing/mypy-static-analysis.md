# Static Analysis & Mypy in CI/CD in Python

## Introduction

In enterprise software engineering, writing type hints is only half the battle. Because the standard Python interpreter ignores type annotations at runtime, type hints alone cannot prevent bugs unless they are actively verified by a **Static Type Checker**.

Created by Jukka Lehtosalo (and backed by Dropbox and the Python core team), **`mypy`** is the industry-standard static type analyzer for Python.

`mypy` parses your Python source code into Abstract Syntax Trees (ASTs), constructs a type dependency graph, and verifies all type signatures, invariants, null-checks, and generics **without executing a single line of code**.

Running `mypy` in **Strict Mode (`--strict`)** in Continuous Integration (CI/CD) pipelines eliminates entire categories of runtime bugs (such as `NoneType has no attribute 'x'`, missing return statements, or mismatched dictionary keys) before code ever merges into production branches.

This lesson concludes **Module 5: Type Hints & Static Analysis in Depth**, exploring `mypy` installation, strict configuration in `pyproject.toml`, error code management, handling untyped third-party libraries via Typeshed stubs, writing `.pyi` stub files, and building automated GitHub Actions quality gates.

---

## Prerequisites

Before studying Mypy and static analysis, ensure you have:

- Completed [Type Hints & Modern Syntax](type-hints-basics.md).
- Completed [Generics & TypeVar](generics-and-typevar.md) and [Protocols](typing-protocols-and-duck-typing.md).
- Familiarity with command-line tools and virtual environments.

---

## Core Concept: The Static Analysis Pipeline

```
                              THE STATIC TYPE ANALYSIS PIPELINE

        Developer Code                 Mypy Type Checker               CI/CD Quality Gate
    ┌────────────────────┐          ┌────────────────────┐          ┌────────────────────┐
    │ def get_user(id):  │ ───────► │ 1. Build AST       │ ───────► │ • Status: PASSED   │
    │   return db.find() │          │ 2. Type Inference  │          │ • Status: REJECTED │
    │                    │          │ 3. Check Contracts │          │   (Pull Request    │
    │ user = get_user(1) │          │ 4. Detect Bugs     │          │    Blocked!)       │
    │ user.send_email()  │          └────────────────────┘          └────────────────────┘
    └────────────────────┘
```

---

## Syntax & Essential Mypy Configuration Patterns

```toml
# 1. pyproject.toml - Production Strict Mypy Configuration
[tool.mypy]
python_version = "3.11"
strict = true                      # Enables ALL strict type checking flags!
warn_return_any = true             # Flags functions returning 'Any'
warn_unused_configs = true         # Flags invalid configuration keys
warn_unused_ignores = true         # Flags '# type: ignore' comments that are no longer needed!
disallow_untyped_defs = true       # Forbids defining un-annotated functions
disallow_incomplete_defs = true    # Forbids partially annotated functions
check_untyped_defs = true          # Type-checks inside bodies of un-annotated functions
no_implicit_optional = true        # Forbids treating 'val: str = None' without 'str | None'

# 2. Per-Module Overrides for Untyped Legacy Packages
[[tool.mypy.overrides]]
module = "legacy_untyped_library.*"
ignore_missing_imports = true      # Suppresses import errors for packages without stubs
```

```python
# 2. Targeted Inline Suppressions (Always specify error codes!)
# ✅ GOOD: Specifies exact error code
# result = third_party_call()  # type: ignore[no-any-return]

# 🚨 BAD: Bare suppression hides real bugs!
# result = third_party_call()  # type: ignore (AVOID!)
```

---

## Detailed Explanation

### 1. The Core Mypy Strictness Flags Explained

Enabling `strict = true` in `pyproject.toml` activates a comprehensive suite of security and type-safety guards:

1. **`disallow_untyped_defs`**: Prevents developers from writing unannotated functions (`def calculate(x):`). Every function must have explicit parameter and return types.
2. **`no_implicit_optional`**: In legacy Python, `def fn(x: str = None):` was implicitly interpreted as `Optional[str]`. This flag strictly requires writing `x: str | None = None`.
3. **`warn_unused_ignores`**: When you refactor code and fix a bug, any old `# type: ignore` comments become redundant. This flag fails the build, forcing developers to delete obsolete suppression comments and keep the codebase clean.
4. **`warn_return_any`**: Prevents a typed function (`-> User`) from accidentally returning an un-typed `Any` object returned from an untyped library.

---

### 2. Debugging Types with `reveal_type()` and `reveal_locals()`

When debugging complex generic types or union inferences, `mypy` provides built-in pseudofunctions:

```python
# reveal_type() is recognized ONLY by mypy (causes runtime error if executed!)
x = [1, "hello", 3.14]
# reveal_type(x)
```

Running `mypy` prints:
```text
note: Revealed type is "builtins.list[builtins.object]"
```

`reveal_locals()` prints the inferred types of all local variables active in the current stack frame.

---

### 3. Handling Untyped Third-Party Libraries & Typeshed

When you import an external package (`import yaml` or `import requests`), `mypy` requires type stubs to verify signatures:

1. **Install Official Typeshed Stubs**:
   ```bash
   pip install types-requests types-PyYAML types-redis
   ```
2. **Writing Custom Stub Files (`.pyi`)**:
   For private internal packages without types, create a parallel **Stub File (`my_module.pyi`)** containing only type declarations:

```python
# legacy_sdk.pyi (Type Stub File)
def initialize_client(api_key: str, timeout: int = ...) -> bool: ...
def fetch_raw_record(record_id: str) -> dict[str, str]: ...
```

---

## Examples

### 1. Simple: Catching a Subtle None-Dereference Bug
Demonstrating how `mypy` catches runtime null-pointer crashes before execution.

```python
from dataclasses import dataclass

@dataclass
class UserRecord:
    id: int
    name: str

def find_user_by_id(user_id: int) -> UserRecord | None:
    if user_id == 101:
        return UserRecord(101, "Hesam")
    return None  # User not found!

def send_welcome_email(user_id: int) -> str:
    user = find_user_by_id(user_id)
    
    # 🚨 STATIC TYPE ERROR DETECTED BY MYPY:
    # Item "None" of "UserRecord | None" has no attribute "name" [union-attr]
    # return f"Welcome, {user.name.upper()}!" # BROKEN!

    # ✅ CORRECT: Narrow type using None check first!
    if user is None:
        raise ValueError(f"User #{user_id} does not exist.")
    return f"Welcome, {user.name.upper()}!"

print(send_welcome_email(101))
```

### 2. Beginner: Complete `pyproject.toml` Configuration File
A modern configuration template for production Python repositories.

```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "enterprise-billing-service"
version = "2.0.0"
requires-python = ">=3.11"

[tool.mypy]
python_version = "3.11"
strict = true
show_error_codes = true
show_column_numbers = true
pretty = true
warn_unused_ignores = true
warn_return_any = true

# Suppress missing stubs for specific legacy dependencies
[[tool.mypy.overrides]]
module = [
    "xmltodict.*",
    "boto.*"
]
ignore_missing_imports = true
```

### 3. Intermediate: Understanding Common Mypy Error Codes

```python
from typing import TypedDict

class CustomerAccount(TypedDict):
    account_id: str
    balance: float

def process_deposit(account: CustomerAccount, deposit_amount: float) -> float:
    # 1. Error: [assignment] - Incompatible types in assignment (expression has type "str", variable has type "float")
    # new_balance: float = "100.0"

    # 2. Error: [arg-type] - Argument 1 has incompatible type "int"; expected "CustomerAccount"
    # process_deposit(12345, 50.0)

    # 3. Error: [typeddict-item] - Key 'balnce' does not exist in TypedDict "CustomerAccount"
    # return account["balnce"] + deposit_amount

    return account["balance"] + deposit_amount

acc: CustomerAccount = {"account_id": "ACC-901", "balance": 1500.00}
print("New Balance:", process_deposit(acc, 250.00))
```

### 4. Real-World: Custom `.pyi` Stub for an Untyped C-Extension / Legacy Module
Creating a type interface stub for an un-annotated legacy module.

```python
# legacy_crypto.pyi (Place alongside legacy_crypto.py)
from typing import Final

DEFAULT_ALGORITHM: Final[str]

class FastHasher:
    def __init__(self, key_bytes: bytes) -> None: ...
    def compute_sha(self, payload: bytes) -> str: ...
    def verify_mac(self, payload: bytes, signature: str) -> bool: ...
```

### 5. Advanced: Production GitHub Actions Automated Mypy CI Workflow
Automating strict static type checking on every Git Push and Pull Request.

```yaml
# .github/workflows/static-analysis.yml
name: "Type Safety & Static Analysis"

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]

jobs:
  mypy-typecheck:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository Code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install Dependencies and Type Stubs
        run: |
          python -m pip install --upgrade pip
          pip install mypy types-requests types-PyYAML
          pip install -e .

      - name: Run Mypy Static Type Analysis
        run: |
          mypy src/ tests/ --config-file pyproject.toml
```

---

## Code Explanation

In Example 5 (GitHub Actions Workflow):
1. The CI pipeline triggers automatically on every push or pull request to `main`.
2. It sets up Python 3.11 and restores cached pip dependencies.
3. It installs `mypy` and official community typeshed packages (`types-requests`, `types-PyYAML`).
4. It executes `mypy src/ tests/ --config-file pyproject.toml`.
5. If any engineer introduces an untyped function, a `None` dereference, or an invalid type assignment, the step **fails with non-zero exit status (1)**, blocking the GitHub Pull Request from merging.

---

## Common Mistakes

### Mistake 1: Using Bare `# type: ignore` Suppressions
Writing a bare `# type: ignore` suppresses **all** errors on that line, including syntax errors or unrelated bugs introduced during future refactorings. Always write `# type: ignore[specific-code]`.

### Mistake 2: Missing Typeshed Stub Packages
When Mypy reports `Cannot find implementation or library stub for module named 'requests'`, do not immediately set `ignore_missing_imports = true`. First check if official stubs exist (`pip install types-requests`).

---

## Best Practices

### Enable `strict = true` on All Green-Field Projects
Starting a project in `--strict` mode requires almost zero extra effort and guarantees 100% type coverage from day one.

Good:
```toml
[tool.mypy]
strict = true
```

---

## Performance Considerations

1. **Incremental Caching (`.mypy_cache`)**: Mypy caches parsed ASTs and type symbols in `.mypy_cache/`. Subsequent runs on large codebases (500,000 lines) take **less than 1 second**. Add `.mypy_cache/` to your `.gitignore`.
2. **Mypy Daemon (`dmypy`)**: For massive mono-repos (millions of lines), use the resident daemon: `dmypy run -- src/` for sub-second IDE feedback.

---

## Security Considerations

1. **Static Analysis is Not Input Sanitization**: Passing Mypy strict checks does not mean SQL injection or XSS vulnerabilities are prevented. Never replace runtime sanitization and parameter binding with static types.
2. **Ensuring Strict Crypto Return Types**: Use `Final` and strict typing on cryptographic functions to prevent returning un-encrypted plaintext by mistake.

---

## Real-World Usage

- **Stripe & Instagram**: Running Mypy over millions of lines of mission-critical financial Python code.
- **FastAPI / Pydantic**: 100% strictly typed codebases verified on every commit.
- **Open Source Libraries**: Enforcing `py.typed` marker files (PEP 561) to ship typed packages on PyPI.

---

## Comparison: Static Analysis Tools in Python

| Tool | Creator | Type Model | Performance | Primary Focus |
|---|---|---|---|---|
| **`mypy`** | Jukka Lehtosalo / Dropbox | **Standard PEP 484** | Fast (with cache) | **Official standard, CI/CD gates** |
| **`pyright` / Pylance** | Microsoft | Standard PEP 484 | Ultra-Fast (Node.js) | **VS Code real-time IDE typing** |
| **`ruff`** | Astral | Linter / Style | Instantaneous (Rust) | **Syntax linting & code formatting** |
| **`pyre`** | Meta / Facebook | Standard PEP 484 | Parallelized (OCaml) | Massive monorepos |

---

## Advanced Concepts: Shipping Typed Packages with `py.typed` (PEP 561)

If you build an open-source library or internal package, `mypy` will ignore your type hints unless you include an empty marker file named **`py.typed`** in your package directory:

```text
my_library/
├── __init__.py
├── client.py
├── py.typed        <--- PEP 561 Marker File!
└── pyproject.toml
```

This marker file informs static type checkers that your package ships first-class inline type annotations.

---

## Exercises

### Exercise 1 — Beginner
Create a small Python file with an intentional type mismatch (e.g. adding a string to an integer). Install `mypy` and run `mypy filename.py` from your terminal to inspect the error output.

### Exercise 2 — Intermediate
Write a `pyproject.toml` file configuring Mypy with `strict = true` and `warn_unused_ignores = true`. Write a function with a redundant `# type: ignore` and verify that Mypy flags the unused ignore.

### Exercise 3 — Advanced
Create a custom type stub file `legacy_auth.pyi` for an imaginary authentication SDK with functions `authenticate_user(token: str) -> dict[str, str]` and `validate_session(session_id: str) -> bool`. Write a script importing `legacy_auth` and verify that Mypy validates calls against your stub.

---

## Mini Project: Enterprise Static Analysis Quality Gate Engine & Stub Registry

### Requirements
Build an automated static analysis validation utility named `static_analysis_gate.py`. Define structured type verification rules, mock a multi-module repository audit, parse Mypy JSON diagnostics output, and generate an executive type-safety compliance report.

### Implementation Blueprint
```python
from __future__ import annotations
from typing import TypedDict, Literal, Final
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. DIAGNOSTIC DATA MODELS
# =====================================================================

Severity = Literal["error", "warning", "note"]

class MypyDiagnostic(TypedDict):
    file_path: str
    line_number: int
    column: int
    severity: Severity
    message: str
    error_code: str

@dataclass
class QualityGateSummary:
    total_files_audited: int
    total_errors: int
    total_warnings: int
    compliance_score_pct: float
    is_ci_passed: bool
    generated_at: str

# =====================================================================
# 2. STATIC ANALYSIS AUDIT ENGINE
# =====================================================================

class StaticAnalysisQualityGate:
    MAX_ALLOWED_ERRORS: Final[int] = 0  # Zero-tolerance strict mode

    def __init__(self, target_repository: str):
        self.repo_name = target_repository
        self._diagnostics: list[MypyDiagnostic] = []

    def ingest_diagnostic(self, diag: MypyDiagnostic) -> None:
        self._diagnostics.append(diag)

    def evaluate_gate_compliance(self, total_source_files: int) -> QualityGateSummary:
        errors = [d for d in self._diagnostics if d["severity"] == "error"]
        warnings = [d for d in self._diagnostics if d["severity"] == "warning"]

        # Calculate compliance score
        penalty = (len(errors) * 10) + (len(warnings) * 2)
        score = max(0.0, min(100.0, 100.0 - (penalty / max(1, total_source_files))))

        is_passed = len(errors) <= self.MAX_ALLOWED_ERRORS
        now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")

        return QualityGateSummary(
            total_files_audited=total_source_files,
            total_errors=len(errors),
            total_warnings=len(warnings),
            compliance_score_pct=round(score, 2),
            is_ci_passed=is_passed,
            generated_at=now_ts
        )

    def render_executive_report(self, summary: QualityGateSummary) -> str:
        status_banner = "✅ CI GATE PASSED - MERGE APPROVED" if summary.is_ci_passed else "❌ CI GATE FAILED - PULL REQUEST BLOCKED"
        border = "=" * 70
        
        lines = [
            border,
            f"          STATIC ANALYSIS COMPLIANCE: {self.repo_name.upper()}",
            border,
            f"  Status        : {status_banner}",
            f"  Compliance    : {summary.compliance_score_pct}% Type Safe",
            f"  Files Checked : {summary.total_files_audited} modules",
            f"  Type Errors   : {summary.total_errors} violations",
            f"  Warnings      : {summary.total_warnings} warnings",
            f"  Audited At    : {summary.generated_at}",
            "-" * 70
        ]
        
        if self._diagnostics:
            lines.append("  Active Type Violations Breakdown:")
            for d in self._diagnostics:
                lines.append(f"   • [{d['error_code']}] {d['file_path']}:{d['line_number']} -> {d['message']}")
        else:
            lines.append("  🎉 Zero Type Errors Detected! 100% Strict Typing Verified.")
            
        lines.append(border)
        return "\n".join(lines)

if __name__ == "__main__":
    gate = StaticAnalysisQualityGate(target_repository="enterprise-auth-service")
    
    # Simulate Ingesting Mypy Diagnostic Output
    gate.ingest_diagnostic({
        "file_path": "src/auth/jwt_handler.py",
        "line_number": 45,
        "column": 12,
        "severity": "error",
        "message": 'Item "None" of "str | None" has no attribute "encode" [union-attr]',
        "error_code": "union-attr"
    })
    
    gate.ingest_diagnostic({
        "file_path": "src/models/user.py",
        "line_number": 88,
        "column": 5,
        "severity": "error",
        "message": 'Function is missing a return type annotation [no-untyped-def]',
        "error_code": "no-untyped-def"
    })
    
    audit_summary = gate.evaluate_gate_compliance(total_source_files=42)
    print(gate.render_executive_report(audit_summary))
```

---

## Summary

In this lesson, you mastered Mypy static analysis and CI/CD quality gates:
- **`mypy`** analyzes AST type graphs at compile-time to catch runtime errors without executing code.
- Configure **`strict = true`** in **`pyproject.toml`** for enterprise-grade type safety.
- Suppress necessary false positives using **`# type: ignore[specific-code]`** (never bare ignore).
- Install official typeshed stubs (`types-*`) or create custom **`.pyi`** stub files for untyped third-party libraries.
- Use **`reveal_type()`** and **`reveal_locals()`** to debug complex type inference.
- Automate Mypy in **GitHub Actions CI/CD workflows** to enforce zero-error quality gates.
- Include **`py.typed`** marker files when distributing typed Python packages.

---

## Best Practices Checklist

- [ ] Configure `[tool.mypy]` with `strict = true` in `pyproject.toml`.
- [ ] Specify explicit error codes in all ignore comments (`# type: ignore[code]`).
- [ ] Enable `warn_unused_ignores = true` to clean up obsolete suppressions.
- [ ] Add `.mypy_cache/` to your `.gitignore`.
- [ ] Automate `mypy` static type checks in GitHub Actions CI/CD pipelines.

---

## 🏆 MODULE 5: TYPE HINTS & STATIC ANALYSIS COMPLETE!

Congratulations! You have completed all 5 comprehensive articles of **Module 5: Type Hints & Static Analysis in Depth**.

### What's Next?
Now advance to **Module 6: Advanced Data Structures**:
👉 **[Advanced Data Structures Module Overview](../advanced-data-structures/README.md)** to master `collections` (namedtuple, defaultdict, deque, Counter, OrderedDict), `heapq` priority queues, and binary search with `bisect`!
