# 📦 Module 10: Package Management & Distribution in Depth

Welcome to the **Package Management & Distribution** module in Level 2.

In modern software development, writing clean Python code is only half the battle. Professional engineers must package, manage dependencies, resolve transitive version conflicts, build reproducible environments, and distribute software to the **Python Package Index (PyPI)** and private enterprise registries.

The Python packaging ecosystem has undergone a massive modernization over recent years—moving away from legacy `setup.py` scripts towards standardized, declarative configuration via **`pyproject.toml`** (PEP 517, PEP 518, and PEP 621).

---

## 🎯 Module Overview

In this module, you will master:
- Dependency Management Tools: `pip`, `pip-tools`, `Pipenv`, and modern deterministic dependency management with **Poetry** and **uv**.
- Dependency Locking & Reproducibility: `requirements.txt`, `Pipfile.lock`, and `poetry.lock`.
- Modern Packaging Standards: **PEP 517 / 518 / 621**, declarative `pyproject.toml` configuration, build backends (`hatchling`, `flit`, `poetry-core`, `setuptools`).
- Building & Publishing Packages: Source Distributions (`sdist`), Binary Wheels (`.whl`), and publishing to PyPI / TestPyPI using **`twine`** and **`build`**.

---

## 📑 Articles in this Module

1. **[Pip, Pipenv, Poetry & Dependency Management](pip-pipenv-poetry.md)**
   - Evolution of Python package managers, transitive dependencies, lockfiles, deterministic builds, virtualenv orchestration, and comparing `pip` vs `pip-tools` vs `Poetry` vs `uv`.
2. **[Packaging, `pyproject.toml` & PyPI Distribution](packaging-and-pyproject-toml.md)**
   - Modern PEP 621 standards, `pyproject.toml` metadata, entry points and CLI scripts, building Source Distributions (`.tar.gz`) and Wheels (`.whl`), and publishing to PyPI with `twine`.

---

## 🗺️ Progression Path

```
pip-pipenv-poetry.md ──► packaging-and-pyproject-toml.md ──► [Next Module: Capstone Projects](../projects/README.md)
```
