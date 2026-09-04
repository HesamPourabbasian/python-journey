# Pip, Pipenv, Poetry & Modern Dependency Management in Python

## Introduction

In modern software development, applications are rarely written from scratch. A production Python service typically depends on dozens of third-party libraries (such as `requests`, `sqlalchemy`, `pydantic`, `cryptography`), and each of those libraries depends on dozens more. These secondary dependencies are known as **Transitive Dependencies**.

If your project specifies its dependencies loosely:
- Running `pip install -r requirements.txt` today might install version `1.2.0` of a library.
- Running the exact same command on a production server three months later might install version `1.3.0` (with a breaking change or subtle bug), causing a production outage.

This classic problem is known as **Dependency Hell**.

To guarantee **100% Deterministic and Reproducible Builds**, Python's package management ecosystem has evolved significantly:
- From legacy `pip` and unpinned `requirements.txt`
- To `pip-tools` (`pip-compile`)
- To modern dependency managers like **`Poetry`** and **`Pipenv`**
- To modern ultra-fast Rust-based package managers like **`uv`**.

This lesson explores direct vs transitive dependencies, semantic version constraints (PEP 440), cryptographic **Lockfiles**, separating production from development dependencies, and automated supply-chain security audits.

---

## Prerequisites

Before studying package management, ensure you have:

- Completed [Virtual Environments & Pip](../../beginner/fundamentals/virtual-environments.md).
- Completed [Testing & Quality Assurance](../testing/README.md).
- Familiarity with the terminal / command-line interface.

---

## Core Concept: Direct vs Transitive Dependencies & Lockfiles

```
                        THE DEPENDENCY RESOLUTION TREE & LOCKFILE

      Your Application (Direct)          Transitive Dependencies           poetry.lock / Lockfile
     ┌────────────────────────────┐    ┌──────────────────────────────┐    ┌────────────────────────────┐
     │ • fastapi == 0.110.0       │ ──►│ • starlette == 0.36.3        │ ══►│ Exact Pinned Versions:     │
     │ • sqlalchemy >= 2.0.0      │    │ • pydantic == 2.6.4          │    │ • fastapi @ 0.110.0        │
     │                            │    │   └── pydantic-core == 2.16.3│    │ • pydantic @ 2.6.4         │
     │                            │    │ • typing-extensions >= 4.8.0 │    │ • pydantic-core @ 2.16.3   │
     │                            │    │                              │    │ SHA256 Hashes for EVERY    │
     │                            │    │                              │    │ wheel artifact! (Security) │
     └────────────────────────────┘    └──────────────────────────────┘    └────────────────────────────┘
```

---

## Syntax & Essential Package Management Commands

### 1. Poetry Command Suite
```bash
# 1. Initialize a new Poetry project (Creates pyproject.toml)
poetry init

# 2. Add dependencies (Resolves and updates pyproject.toml + poetry.lock)
poetry add requests sqlalchemy "fastapi>=0.110"

# 3. Add development/testing dependencies into a separate group
poetry add --group dev pytest pytest-cov black mypy

# 4. Install EXACT dependencies from lockfile (Guarantees reproducible build!)
poetry install --no-root

# 5. Run commands inside Poetry's managed virtual environment
poetry run pytest
poetry run python main.py

# 6. Update all dependencies according to semantic version rules
poetry update
```

### 2. High-Speed Dependency Resolution with `uv`
```bash
# Install uv (100x faster than pip/poetry written in Rust)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Compile requirements.in -> requirements.txt in 0.05 seconds
uv pip compile requirements.in -o requirements.txt

# Install locked dependencies at wire speed
uv pip sync requirements.txt
```

---

## Detailed Explanation

### 1. Semantic Versioning & PEP 440 Operators

When declaring dependencies, you use comparison operators to balance stability with security updates:

| Operator | Syntax Example | Meaning & Range Allowed |
|---|---|---|
| **Exact Match** | `requests == 2.31.0` | Strictly version `2.31.0` only. |
| **Minimum Bound** | `fastapi >= 0.100.0` | Any version $\ge 0.100.0$ (Risk of breaking changes).|
| **Compatible Release**| `sqlalchemy ~= 2.0.4` | $\ge 2.0.4$ and $< 2.1.0$ (Allows patch releases only).|
| **Poetry Caret (`^`)**| `pydantic = "^2.6.0"`| $\ge 2.6.0$ and $< 3.0.0$ (Allows non-breaking updates).|
| **Poetry Tilde (`~`)**| `flask = "~3.0.0"` | $\ge 3.0.0$ and $< 3.1.0$ (Allows patch updates).|

---

### 2. The Lockfile Golden Rule: Applications vs Libraries

A crucial architectural principle governs whether to commit lockfiles to version control:

- **For Deployable Applications & Services (Web APIs, Microservices, CLI Apps)**:
  $$\textbf{ALWAYS commit \texttt{poetry.lock} / \texttt{Pipfile.lock} / \texttt{requirements.txt} to Git!}$$
  *Reason*: Guarantees that the exact same byte-for-byte dependencies run in Local Development, CI/CD, Staging, and Production.
- **For Open-Source Reusable Libraries (Published to PyPI)**:
  $$\textbf{DO NOT enforce lockfiles on consumers; declare version ranges in \texttt{pyproject.toml}.}$$
  *Reason*: Locking exact sub-dependencies in a library creates version conflicts when downstream users install multiple libraries together.

---

### 3. Dependency Groups in `pyproject.toml`

Modern `pyproject.toml` configurations cleanly separate runtime production requirements from testing and linting tools:

```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.110.0"
sqlalchemy = "^2.0.0"
psycopg = {extras = ["binary", "pool"], version = "^3.1.18"}

[tool.poetry.group.dev.dependencies]
black = "^24.2.0"
mypy = "^1.8.0"

[tool.poetry.group.test.dependencies]
pytest = "^8.0.0"
pytest-cov = "^4.1.0"
httpx = "^0.27.0"
```

In production Docker containers, you install *only* production dependencies:
```bash
poetry install --only main --no-root
```

---

## Examples

### 1. Simple: Compiling Dependencies with `pip-tools`
Creating clean input requirements and compiling a locked `requirements.txt`.

```text
# requirements.in (High-level direct dependencies)
fastapi>=0.110.0
sqlalchemy~=2.0.25
requests==2.31.0
```

Compile with:
```bash
pip-compile requirements.in
```

Generated `requirements.txt`:
```text
#
# This file is autogenerated by pip-compile with Python 3.11
# by the following command:
#
#    pip-compile requirements.in
#
certifi==2024.2.2
    # via requests
charset-normalizer==3.3.2
    # via requests
fastapi==0.110.0
    # via -r requirements.in
idna==3.6
    # via requests
pydantic==2.6.4
    # via fastapi
pydantic-core==2.16.3
    # via pydantic
requests==2.31.0
    # via -r requirements.in
sqlalchemy==2.0.28
    # via -r requirements.in
starlette==0.36.3
    # via fastapi
typing-extensions==4.10.0
    # via
    #   fastapi
    #   pydantic
    #   pydantic-core
    #   sqlalchemy
urllib3==2.2.1
    # via requests
```

### 2. Beginner: Initializing a Poetry Project
Configuring a modern project with Poetry CLI.

```bash
# Interactive project initialization:
poetry init \
  --name="enterprise-api" \
  --description="Enterprise FastAPI Banking Microservice" \
  --author="Hesam Pourabbasain <hesam@domain.com>" \
  --python="^3.11" \
  --dependency="fastapi:^0.110.0" \
  --dependency="sqlalchemy:^2.0.0" \
  --dev-dependency="pytest:^8.0.0" \
  --dev-dependency="black:^24.0.0"
```

### 3. Intermediate: Inspecting the Dependency Tree with `poetry show --tree`
Diagnosing transitive dependency chains and finding who requested a specific sub-package.

```bash
poetry show --tree
```

Output:
```text
fastapi 0.110.0 High-performance web framework
├── pydantic >=1.7.4,<3.0.0
│   ├── annotated-types >=0.4.0
│   ├── pydantic-core 2.16.3
│   │   └── typing-extensions >=4.6.0,<4.7.0 || >4.7.0
│   └── typing-extensions >=4.6.1
├── starlette >=0.36.3,<0.37.0
│   └── anyio >=3.4.0,<5
│       ├── idna >=2.8
│       └── sniffio >=1.1
└── typing-extensions >=4.8.0
```

### 4. Real-World: Production Dockerfile with Multi-Stage Poetry Build
Optimizing Docker images using Poetry with minimal final image size.

```dockerfile
# =====================================================================
# STAGE 1: BUILDER
# =====================================================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.2

# Configure Poetry: Do not create virtualenvs inside Docker container
RUN poetry config virtualenvs.create false

# Copy dependency manifests
COPY pyproject.toml poetry.lock ./

# Install ONLY production dependencies into system Python
RUN poetry install --only main --no-root --no-interaction --no-ansi

# =====================================================================
# STAGE 2: RUNTIME
# =====================================================================
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY . .

# Run as non-root security user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 5. Advanced: Automated Supply-Chain Security Auditing with `pip-audit`
Scanning installed dependencies against the Python Packaging Advisory Database (PyPA) for known Common Vulnerabilities and Exposures (CVEs).

```bash
# Install security auditing tool:
pip install pip-audit

# Audit installed environment:
pip-audit

# Audit specific locked requirements file:
pip-audit -r requirements.txt --desc
```

Sample Audit Output:
```text
No known vulnerabilities found in 42 packages scanned.
```

---

## Code Explanation

In Example 4 (`Production Dockerfile`):
1. **Multi-Stage Build Pattern**: Separates the build environment (which requires `poetry`, compilers, and git) from the final lightweight runtime image.
2. `poetry install --only main --no-root` guarantees that test frameworks (`pytest`, `black`, `mypy`) are **excluded from production images**, reducing Docker image size from ~800 MB to under 150 MB.
3. Cryptographic lockfiles (`poetry.lock`) ensure that the Docker container builds identically in local CI and production clusters.

---

## Common Mistakes

### Mistake 1: Unpinned Application Requirements
Writing bare package names (`requests`, `flask`, `sqlalchemy`) in application requirements without version bounds. A future major release of a dependency can instantly break production deployments.

### Mistake 2: Modifying `poetry.lock` Manually
Never edit `poetry.lock` or `Pipfile.lock` by hand! Always use CLI commands (`poetry add`, `poetry remove`, `poetry update`) to let the dependency resolver recalculate cryptographic hashes and transitive trees.

---

## Best Practices

### Use `poetry run` or Activate the Virtualenv
Always execute scripts inside the managed virtual environment to avoid pulling packages from the global system Python:

Good:
```bash
poetry run python main.py
```

---

## Performance Considerations

| Package Manager | Language | Resolution Speed (100 pkgs) | Cold Install Speed |
|---|---|---|---|
| **`pip`** | Python | ~18.5 seconds | ~14.0 seconds |
| **`pip-tools`** | Python | ~12.0 seconds | ~10.0 seconds |
| **`Poetry`** | Python | ~8.5 seconds | ~6.0 seconds |
| **`uv`** | **Rust** | **~0.12 seconds (70x faster!)**| **~0.45 seconds (30x faster!)**|

Modern teams use **Poetry** for project authoring and metadata management, and **`uv`** inside CI/CD pipelines for sub-second dependency installation.

---

## Security Considerations

1. **Typosquatting Defense**: Malicious actors upload packages with names mimicking popular libraries (e.g. `reqeusts` or `colorama-v2`). Verify package names carefully before `pip install` or `poetry add`.
2. **Hash-Checking Mode**: Lockfiles include SHA-256 hashes of every wheel file. If an attacker tampers with a package on PyPI, the hash check will fail and abort the build.

---

## Real-World Usage

- **Microservice CI/CD Pipelines**: Locking dependencies for immutable Docker container releases.
- **Data Science Teams**: Sharing reproducible Jupyter notebook environments.
- **Enterprise Software**: Auditing open-source dependencies for license compliance and security vulnerabilities.

---

## Comparison: Package Managers

| Feature | `pip` + `pip-tools` | `Pipenv` | `Poetry` | `uv` |
|---|---|---|---|---|
| **Lockfile Format** | `requirements.txt` | `Pipfile.lock` | `poetry.lock` | `requirements.txt` / standard |
| **PEP 621 Support** | No | No | **Yes (`pyproject.toml`)**| **Yes** |
| **Packaging / Build**| No | No | **Yes (`poetry build`)** | Integrated |
| **Speed** | Moderate | Slow | Fast | **Instant (Rust)** |

---

## Advanced Concepts: The PubGrub Dependency Resolution Algorithm

Both `Poetry` and `uv` use the **PubGrub Algorithm** (developed for Dart's package manager). Unlike naive backtracking solvers that can hang indefinitely on cyclic version conflicts, PubGrub uses **Conflict-Driven Clause Learning (CDCL)** to resolve complex multi-variable dependency graphs in polynomial time and produce clear, human-readable explanations when version incompatibilities occur.

---

## Exercises

### Exercise 1 — Beginner
Create a new directory, initialize a Poetry project using `poetry init`, add `requests` as a dependency, and verify that `pyproject.toml` and `poetry.lock` are generated.

### Exercise 2 — Intermediate
Using Poetry, create a `dev` group containing `pytest` and `black`. Write a command that installs only production dependencies, and verify that `pytest` is not available in the production environment.

### Exercise 3 — Advanced
Create a `requirements.in` file with 3 dependencies having compatible release bounds. Use `pip-compile` or `uv pip compile` to generate a locked `requirements.txt`, and run `pip-audit` to verify zero known vulnerabilities.

---

## Mini Project: Enterprise Multi-Tier Dependency Manifest & Automated Security Auditor

### Requirements
Build an operational dependency verification and security auditing tool named `dependency_security_auditor.py`. Parse `pyproject.toml` manifests, validate semantic versioning constraints, detect outdated packages, simulate hash verification, and generate formatted security audit reports.

### Implementation Blueprint
```python
import tomllib
import re
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. DEPENDENCY MANIFEST PARSER & AUDITOR
# =====================================================================

SAMPLE_PYPROJECT_TOML = """
[project]
name = "enterprise-fintech-core"
version = "2.4.0"
dependencies = [
    "fastapi>=0.110.0",
    "sqlalchemy~=2.0.25",
    "cryptography==42.0.5",
    "pydantic^2.6.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "mypy>=1.8.0"
]
"""

# Mock Vulnerability Database (PyPA Advisory Database Mock)
KNOWN_VULNERABILITIES = {
    "cryptography": [
        {"vulnerable_version": "41.0.0", "cve": "CVE-2023-49083", "severity": "HIGH"}
    ],
    "requests": [
        {"vulnerable_version": "2.30.0", "cve": "CVE-2023-32681", "severity": "MEDIUM"}
    ]
}

@dataclass
class DependencySpec:
    name: str
    operator: str
    version: str
    is_pinned: bool

class DependencySecurityAuditor:
    def __init__(self, toml_content: str):
        self.config = tomllib.loads(toml_content)
        self.dependencies: list[DependencySpec] = []
        self._parse_manifest()

    def _parse_manifest(self):
        raw_deps = self.config.get("project", {}).get("dependencies", [])
        pattern = re.compile(r"^([a-zA-Z0-9_-]+)\s*([=><~^!]+)\s*([0-9a-zA-Z.]+)$")

        for dep_str in raw_deps:
            match = pattern.match(dep_str.strip())
            if match:
                name, op, ver = match.groups()
                is_pinned = op in ("==", "^", "~=")
                self.dependencies.append(DependencySpec(name, op, ver, is_pinned))

    def run_security_audit(self):
        border = "=" * 68
        print("\n" + border)
        print(f"      ENTERPRISE DEPENDENCY SECURITY AUDIT: {self.config['project']['name']}")
        print(border)
        print(f"  Target Version       : v{self.config['project']['version']}")
        print(f"  Total Dependencies   : {len(self.dependencies)} packages")
        print("-" * 68)
        
        print(f"{'PACKAGE':<18} {'CONSTRAINT':<16} {'PINNED?':<12} {'SECURITY STATUS':<16}")
        print("-" * 68)

        vulnerabilities_found = 0
        for dep in self.dependencies:
            pinned_str = "✅ YES" if dep.is_pinned else "⚠️ LOOSE"
            
            # Check CVE Database
            vuln_status = "✅ SECURE"
            if dep.name in KNOWN_VULNERABILITIES:
                for v in KNOWN_VULNERABILITIES[dep.name]:
                    if v["vulnerable_version"] == dep.version:
                        vuln_status = f"🚨 {v['cve']} ({v['severity']})"
                        vulnerabilities_found += 1

            print(f"{dep.name:<18} {dep.operator + dep.version:<16} {pinned_str:<12} {vuln_status}")

        print("-" * 68)
        if vulnerabilities_found == 0:
            print("🛡️ AUDIT RESULT: PASSED! Zero vulnerabilities detected in lockfile.")
        else:
            print(f"🚨 AUDIT RESULT: FAILED! Found {vulnerabilities_found} security advisories.")
        print(border)

if __name__ == "__main__":
    auditor = DependencySecurityAuditor(SAMPLE_PYPROJECT_TOML)
    auditor.run_security_audit()
```

---

## Summary

In this lesson, you mastered modern Python dependency management:
- **Direct vs Transitive Dependencies**: Applications manage high-level packages; dependency resolvers resolve the complete transitive graph.
- **Lockfiles (`poetry.lock`, `Pipfile.lock`)** guarantee 100% reproducible environments by pinning exact versions and cryptographic SHA-256 hashes.
- **Semantic Version Constraints (PEP 440)**: Use `^`, `~=`, or exact `==` to balance bug fixes with stability.
- **Always commit lockfiles for deployable applications**; omit lockfiles for open-source reusable libraries.
- Separate production from development dependencies using **Dependency Groups** in `pyproject.toml`.
- Audit dependencies against known CVE databases using **`pip-audit`**.

---

## Best Practices Checklist

- [ ] Always maintain a cryptographic lockfile for applications.
- [ ] Commit `poetry.lock` / `requirements.txt` to Git for all deployable services.
- [ ] Separate testing, linting, and docs dependencies into dev groups.
- [ ] Use `poetry install --only main` in production Docker containers.
- [ ] Run `pip-audit` in CI/CD pipelines to catch vulnerable packages.
- [ ] Use `uv` in CI/CD for lightning-fast sub-second installs.

---

## What's Next?

Now that you understand modern dependency management, continue to the final article in this module:
👉 **[Packaging, `pyproject.toml` & PyPI Distribution](packaging-and-pyproject-toml.md)** to master creating standard Python packages (Wheels & sdist) and publishing to PyPI!
