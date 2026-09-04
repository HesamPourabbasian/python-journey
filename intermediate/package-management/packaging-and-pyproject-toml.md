# Packaging, `pyproject.toml` & PyPI Distribution in Python

## Introduction

Creating reusable software libraries and distributing them to the global Python community through the **Python Package Index (PyPI)** is one of the most rewarding milestones in a Python engineer's journey.

Historically, Python packaging relied on imperative `setup.py` scripts. However, executing arbitrary Python code during installation created severe security vulnerabilities, made static analysis impossible, and led to non-standard build environments.

To establish a unified, secure, and declarative standard, the Python Packaging Authority (PyPA) introduced:
- **PEP 518**: Declarative build system specification (`[build-system]`).
- **PEP 517**: Build backend interface protocol (`hatchling`, `flit`, `setuptools`, `poetry-core`).
- **PEP 621**: Standardized project metadata in **`pyproject.toml`**.

Today, `pyproject.toml` is the single source of truth for Python project configuration, metadata, dependencies, build backends, and command-line entry points.

This lesson concludes **Module 10: Package Management & Distribution in Depth**, exploring standard `src/` package layouts, building **Source Distributions (`sdist`)** and **Binary Wheels (`.whl`)**, CLI entry points, and publishing securely to PyPI using **`build`**, **`twine`**, and **GitHub Actions Trusted Publishing (OIDC)**.

---

## Prerequisites

Before studying packaging, ensure you have:

- Completed [Pip, Pipenv, Poetry & Modern Dependency Management](pip-pipenv-poetry.md).
- Completed [Object-Oriented Programming](../oop/README.md).
- Familiarity with Git and command-line build tools.

---

## Core Concept: Modern Packaging Architecture (PEP 621)

```
                            MODERN PYTHON PACKAGING PIPELINE

    Source Code (src/ Layout)            Build Frontend & Backend                Distribution Artifacts
   ┌───────────────────────────┐       ┌───────────────────────────┐       ┌──────────────────────────────┐
   │ pyproject.toml (PEP 621)  │ ────► │ python -m build           │ ────► │ dist/                        │
   │ src/                      │       │ • Frontend: build         │       │ ├── pkg-1.0.0.tar.gz (sdist) │
   │   └── my_pkg/             │       │ • Backend: hatchling /    │       │ └── pkg-1.0.0-py3-none-any   │
   │       ├── __init__.py     │       │   setuptools / flit       │       │     .whl (Binary Wheel)      │
   │       └── core.py         │       └───────────────────────────┘       └──────────────┬───────────────┘
   └───────────────────────────┘                                                          │
                                                                                          ▼
                                                                             PyPI / TestPyPI (via twine)
```

---

## Syntax & Essential Packaging Manifest (`pyproject.toml`)

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "cloud-pulse-telemetry"
version = "1.0.0"
description = "High-performance distributed telemetry and metrics emitter for Python."
readme = "README.md"
requires-python = ">=3.10"
license = { text = "MIT" }
authors = [
    { name = "Hesam Pourabbasain", email = "hesam@domain.com" }
]
keywords = ["telemetry", "metrics", "monitoring", "cloud"]
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Intended Audience :: Developers",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
]
dependencies = [
    "httpx>=0.27.0",
    "pydantic>=2.6.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-cov>=4.1.0",
    "mypy>=1.8.0"
]

# Command-Line Executable Entry Point (Creates 'cloud-pulse' terminal command!)
[project.scripts]
cloud-pulse = "cloud_pulse_telemetry.cli:main"

[project.urls]
Homepage = "https://github.com/hesamp/cloud-pulse-telemetry"
Documentation = "https://cloud-pulse.readthedocs.io"
Repository = "https://github.com/hesamp/cloud-pulse-telemetry.git"
"Bug Tracker" = "https://github.com/hesamp/cloud-pulse-telemetry/issues"
```

---

## Detailed Explanation

### 1. The `src/` Layout Architecture

When organizing a Python package, there are two common layouts: the *Flat Layout* (`my_pkg/` in project root) and the **`src/` Layout** (`src/my_pkg/`).

```text
enterprise_project/
├── pyproject.toml
├── README.md
├── LICENSE
├── tests/
│   └── test_telemetry.py
└── src/
    └── cloud_pulse_telemetry/
        ├── __init__.py
        ├── core.py
        └── cli.py
```

#### Why the `src/` Layout is Strongly Recommended by PyPA:
- In a flat layout, running `pytest` from the root directory imports the local uninstalled source files directly from the working directory, hiding packaging bugs (e.g. missing files in `sdist` or missing `package_data`).
- In a `src/` layout, Python cannot import `cloud_pulse_telemetry` unless the package is **actually built and installed** in your environment (`pip install -e .`), guaranteeing that your tests run against the true installed package structure.

---

### 2. Source Distributions (`sdist`) vs Binary Wheels (`.whl`)

When you build a package (`python -m build`), it generates two distinct files inside `dist/`:

1. **Source Distribution (`sdist` - `.tar.gz`)**: A raw archive containing the raw source code, `pyproject.toml`, and tests. If the package contains C extensions, the client's machine must compile them from scratch using a local C compiler.
2. **Binary Wheel (`.whl` - PEP 427)**: A pre-built, ready-to-install package format. For pure Python packages, it is a `.zip` archive renamed to `.whl` (e.g. `pkg-1.0.0-py3-none-any.whl`). Installing a wheel is simply unpacking files into `site-packages`, taking **less than 10 milliseconds with zero compilation**.

---

### 3. CLI Executable Entry Points (`[project.scripts]`)

Defining `[project.scripts]` allows users to run your Python function directly from their terminal as a shell command after `pip install`:

```toml
[project.scripts]
my-cli = "my_package.cli:run_cli_entrypoint"
```

When installed, `pip` automatically creates an OS-specific executable script (`my-cli` on Linux/macOS or `my-cli.exe` on Windows) that invokes `run_cli_entrypoint()`.

---

## Examples

### 1. Simple: Minimal `src/__init__.py` Package Exposure
Exposing a clean public API from your package.

```python
# src/cloud_pulse_telemetry/__init__.py
"""
Cloud Pulse Telemetry Library
High-performance distributed metric collector.
"""

from .core import TelemetryEmitter, MetricRecord

__version__ = "1.0.0"
__all__ = ["TelemetryEmitter", "MetricRecord", "__version__"]
```

### 2. Beginner: CLI Entry Point Module
Writing a command-line script module invoked via `[project.scripts]`.

```python
# src/cloud_pulse_telemetry/cli.py
import sys
import argparse
from .core import TelemetryEmitter

def main():
    parser = argparse.ArgumentParser(description="Cloud Pulse Telemetry CLI")
    parser.add_argument("--endpoint", type=str, default="https://telemetry.internal", help="Ingestion URL")
    parser.add_argument("--ping", action="store_true", help="Send test heartbeat ping")

    args = parser.parse_args()

    if args.ping:
        emitter = TelemetryEmitter(args.endpoint)
        print(f"📡 Sending heartbeat ping to {args.endpoint}...")
        emitter.emit("system.heartbeat", 1.0)
        print("✅ Heartbeat delivered.")
        sys.exit(0)

    parser.print_help()

if __name__ == "__main__":
    main()
```

### 3. Intermediate: Building and Validating Package Artifacts
Using `build` and `twine` to generate and check distribution packages.

```bash
# 1. Install standard PyPA build and publish tools
pip install build twine

# 2. Build sdist (.tar.gz) and wheel (.whl)
python -m build

# 3. Output in dist/ directory:
# dist/cloud_pulse_telemetry-1.0.0.tar.gz
# dist/cloud_pulse_telemetry-1.0.0-py3-none-any.whl

# 4. Strict Validation of Package Metadata (Ensures README renders on PyPI!)
twine check dist/*
```

Twine Check Output:
```text
Checking dist/cloud_pulse_telemetry-1.0.0-py3-none-any.whl: PASSED
Checking dist/cloud_pulse_telemetry-1.0.0.tar.gz: PASSED
```

### 4. Real-World: Testing Distribution on TestPyPI
Uploading to the official PyPI test sandbox before making a public release.

```bash
# 1. Upload to TestPyPI (Requires TestPyPI API token)
twine upload --repository testpypi dist/*

# 2. Test installation from TestPyPI in an isolated environment
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ cloud-pulse-telemetry

# 3. Verify installed CLI tool
cloud-pulse --help
```

### 5. Advanced: Automated GitHub Actions CI/CD Release Workflow with OIDC (Trusted Publishing)
Modern release automation using OpenID Connect (OIDC) with zero stored static API secrets.

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  pypi-publish:
    name: Build & Publish Release to PyPI
    runs-on: ubuntu-latest
    permissions:
      # MANDATORY permission for PyPI Trusted Publishing (OIDC)
      id-token: write

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Build Tools
        run: pip install build

      - name: Build Package Artifacts
        run: python -m build

      - name: Publish to PyPI via Trusted Publishing
        uses: pypa/gh-action-pypi-publish@release/v1
```

---

## Code Explanation

In Example 5 (`PyPI Trusted Publishing`):
1. In the past, publishing to PyPI required creating a long-lived API token and storing it in GitHub Secrets (`PYPI_API_TOKEN`). If that token leaked, attackers could publish malicious package versions.
2. **PyPI Trusted Publishing (PEP 740 / OIDC)**: PyPI connects directly to GitHub's OpenID Connect identity provider.
3. When a GitHub Release is published, GitHub issues a short-lived cryptographic identity token to the workflow.
4. PyPI verifies the token against the registered GitHub repository and allows publication with **zero static secret keys**, completely eliminating credential theft risks.

---

## Common Mistakes

### Mistake 1: Publishing Without `twine check`
Uploading packages with invalid README markdown or malformed metadata causes PyPI to render the project description as raw plaintext rather than rich formatted HTML. Always run `twine check dist/*`.

### Mistake 2: Hardcoding Machine-Specific Paths
Including absolute local paths (e.g. `/Users/hesam/projects/config.json`) inside package code. Always use `importlib.resources` or relative package paths to load internal assets.

---

## Best Practices

### Use Semantic Versioning (SemVer)
Follow the standard `MAJOR.MINOR.PATCH` versioning format:
- **`PATCH` (1.0.1)**: Backwards-compatible bug fixes.
- **`MINOR` (1.1.0)**: Backwards-compatible new features.
- **`MAJOR` (2.0.0)**: Breaking API changes.

---

## Performance Considerations

1. **Pure Python vs Binary Wheels**: Pure Python wheels (`py3-none-any.whl`) install instantly on any operating system (macOS, Linux, Windows, ARM, x86).
2. **Compiling C/Rust Extensions**: If your library requires native speed, use **`maturin`** (Rust) or **`Cython`** with `cibuildwheel` to pre-compile binary wheels for all target OS platforms so end-users do not need local C/Rust compilers.

---

## Security Considerations

1. **Enable Two-Factor Authentication (2FA)**: PyPI requires 2FA on all maintainer accounts.
2. **Package Name Squatting & Immutability**: PyPI releases are **immutable**. Once version `1.0.0` is published, you can never overwrite or re-upload `1.0.0`, even if you delete it. You must increment the version to `1.0.1`.

---

## Real-World Usage

- **Open-Source Distribution**: Publishing tools like `requests`, `fastapi`, `pydantic`.
- **Private Enterprise Package Registries**: Distributing internal proprietary libraries across corporate teams using AWS CodeArtifact, Google Artifact Registry, or JFrog Artifactory.

---

## Comparison: Python Build Backends

| Build Backend | Standard | Best Used For |
|---|---|---|
| **`hatchling`** | PEP 517 / 621 Standard | **General libraries, Fast, Modern Default** |
| **`flit_core`** | PEP 517 / 621 Standard | Simple pure-Python libraries |
| **`setuptools`** | Legacy + Modern PEP 621| Complex legacy projects, C-extensions |
| **`poetry-core`**| Poetry Ecosystem | Projects managed primarily with Poetry |
| **`maturin`** | PEP 517 (Rust) | High-performance Python + Rust modules |

---

## Advanced Concepts: Accessing Package Data with `importlib.resources`

If your package includes non-Python assets (e.g. `schema.json`, `templates/default.html`), load them using the modern standard library **`importlib.resources`** module:

```python
from importlib import resources

def load_default_schema() -> str:
    # Safely loads internal asset regardless of where package is installed!
    schema_file = resources.files("cloud_pulse_telemetry").joinpath("schema.json")
    return schema_file.read_text(encoding="utf-8")
```

---

## Exercises

### Exercise 1 — Beginner
Create a minimal `pyproject.toml` file following PEP 621 standards for a package named `math-wizard` version `0.1.0` with `hatchling` as the build backend.

### Exercise 2 — Intermediate
Organize a project using the `src/` layout containing a module and a CLI entry point script. Build the package using `python -m build` and verify that both `.tar.gz` and `.whl` are created.

### Exercise 3 — Advanced
Register an account on [TestPyPI](https://test.pypi.org), generate an API token, and upload your built package to TestPyPI using `twine upload --repository testpypi dist/*`. Verify that you can install it in a clean virtual environment.

---

## Mini Project: Complete Open-Source Python Package Architecture, Build Pipeline & CLI Tool

### Requirements
Build an operational, publishable Python package architecture named `cloud_pulse_telemetry`. Structure the repository using the `src/` layout, write a complete PEP 621 compliant `pyproject.toml`, implement the core telemetry engine and CLI entry point, and execute the automated build and verification pipeline.

### Implementation Blueprint
```python
import os
import shutil
import subprocess
from pathlib import Path

# =====================================================================
# 1. AUTOMATED REPOSITORY SCAFFOLDING & PACKAGING SUITE
# =====================================================================

ROOT_DIR = Path("/tmp/cloud_pulse_package_demo")

PYPROJECT_CONTENT = """[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "cloud-pulse-telemetry"
version = "1.0.0"
description = "Enterprise distributed cloud telemetry emitter."
readme = "README.md"
requires-python = ">=3.10"
license = { text = "MIT" }
authors = [{ name = "Hesam Pourabbasain", email = "hesam@domain.com" }]
dependencies = ["httpx>=0.27.0"]

[project.scripts]
cloud-pulse = "cloud_pulse_telemetry.cli:main"
"""

README_CONTENT = """# Cloud Pulse Telemetry
Enterprise distributed telemetry and health metric emitter.

## Installation
```bash
pip install cloud-pulse-telemetry
```
"""

CORE_PY_CONTENT = """from dataclasses import dataclass
from datetime import datetime, timezone

@dataclass
class MetricRecord:
    metric_name: str
    value: float
    timestamp: str

class TelemetryEmitter:
    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def emit(self, metric_name: str, value: float) -> MetricRecord:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
        record = MetricRecord(metric_name, value, ts)
        print(f"📡 [EMITTED TO {self.endpoint}] {record.metric_name} = {record.value} ({record.timestamp})")
        return record
"""

CLI_PY_CONTENT = """from .core import TelemetryEmitter

def main():
    print("🚀 [CLI EXECUTION] Cloud Pulse Telemetry v1.0.0")
    emitter = TelemetryEmitter("https://telemetry.internal.net")
    emitter.emit("system.cluster_load", 0.74)

if __name__ == "__main__":
    main()
"""

INIT_PY_CONTENT = """from .core import TelemetryEmitter, MetricRecord
__version__ = "1.0.0"
__all__ = ["TelemetryEmitter", "MetricRecord", "__version__"]
"""

def scaffold_and_verify_package():
    print("=" * 68)
    print("      ENTERPRISE PYTHON PACKAGE SCAFFOLDING & PEP 621 SUITE")
    print("=" * 68)

    # 1. Clean and scaffold directories
    if ROOT_DIR.exists(): shutil.rmtree(ROOT_DIR)
    pkg_src = ROOT_DIR / "src" / "cloud_pulse_telemetry"
    pkg_src.mkdir(parents=True, exist_ok=True)

    # 2. Write Manifest & Source Files
    (ROOT_DIR / "pyproject.toml").write_text(PYPROJECT_CONTENT)
    (ROOT_DIR / "README.md").write_text(README_CONTENT)
    (pkg_src / "__init__.py").write_text(INIT_PY_CONTENT)
    (pkg_src / "core.py").write_text(CORE_PY_CONTENT)
    (pkg_src / "cli.py").write_text(CLI_PY_CONTENT)

    print("📁 [SCAFFOLD SUCCESS] Created src/ layout repository at:", ROOT_DIR)
    print("  • pyproject.toml (PEP 621 Standard)")
    print("  • src/cloud_pulse_telemetry/__init__.py")
    print("  • src/cloud_pulse_telemetry/core.py")
    print("  • src/cloud_pulse_telemetry/cli.py")

    # 3. Simulate CLI execution
    print("\n--- Testing Internal Package Execution ---")
    import sys
    sys.path.insert(0, str(ROOT_DIR / "src"))
    import cloud_pulse_telemetry
    emitter = cloud_pulse_telemetry.TelemetryEmitter("https://cloud.local")
    emitter.emit("cpu.utilization", 42.8)

    print("\n" + "=" * 68)
    print("🎉 PACKAGE READY FOR 'python -m build' AND PyPI DISTRIBUTION!")
    print("=" * 68)

    # Cleanup demo directory
    if ROOT_DIR.exists(): shutil.rmtree(ROOT_DIR)

if __name__ == "__main__":
    scaffold_and_verify_package()
```

---

## Summary

In this lesson, you mastered packaging, `pyproject.toml`, and PyPI distribution:
- **`pyproject.toml` (PEP 517 / 518 / 621)** is the modern standard for declarative Python project configuration.
- Always use the **`src/` layout** to avoid importing local uninstalled modules during test suite runs.
- **Source Distributions (`sdist` - `.tar.gz`)** contain raw code; **Binary Wheels (`.whl` - PEP 427)** install in milliseconds with zero compilation.
- Configure command-line executables using **`[project.scripts]`**.
- Build distribution artifacts using **`python -m build`** and validate metadata using **`twine check dist/*`**.
- Test releases on **TestPyPI** before publishing to production PyPI.
- Use **GitHub Actions Trusted Publishing (OIDC)** for secure, token-less releases.

---

## Best Practices Checklist

- [ ] Use `pyproject.toml` for all new Python packaging projects.
- [ ] Adopt the `src/` layout for clean test isolation.
- [ ] Define command-line tools in `[project.scripts]`.
- [ ] Always run `twine check dist/*` before publishing.
- [ ] Test releases on TestPyPI first.
- [ ] Use PyPI Trusted Publishing with GitHub Actions OIDC in CI/CD.

---

## 🏆 MODULE 10: PACKAGE MANAGEMENT & DISTRIBUTION COMPLETE!

Congratulations! You have completed all 2 comprehensive articles of **Module 10: Package Management & Distribution in Depth**.

### What's Next?
Now advance to the final milestone of Level 2:
👉 **[Intermediate Capstone Projects](../projects/README.md)** to build 8 complete, production-grade real-world software applications integrating everything you have learned!
