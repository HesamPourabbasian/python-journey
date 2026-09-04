# 🧪 Module 9: Testing & Quality Assurance in Depth

Welcome to the **Testing & Quality Assurance** module in Level 2.

In professional software engineering, untested code is broken code. Production software systems must be resilient against regressions, edge cases, and unexpected inputs. High-performing engineering teams rely on automated test suites to refactor fearlessly, ship features with confidence, and maintain stability across large codebases.

---

## 🎯 Module Overview

In this module, you will master:
- The standard library **`unittest`** framework: `TestCase`, assertions (`assertEqual`, `assertRaises`), lifecycle hooks (`setUp`, `tearDown`, `setUpClass`), and test suites.
- The industry-standard **`pytest`** ecosystem: plain `assert` statements, test discovery, composable and modular **Fixtures** (`@pytest.fixture`, `conftest.py`, scopes), and table-driven **Parametrization** (`@pytest.mark.parametrize`).
- Test Doubles & Mocking with **`unittest.mock`**: `Mock`, `MagicMock`, `@patch`, `side_effect`, verifying call counts, and mocking external network/database boundaries.
- **Test Coverage & Quality Metrics**: Measuring branch and statement coverage with `pytest-cov` and enforcing CI/CD coverage thresholds.

---

## 📑 Articles in this Module

1. **[Unittest & Standard Library Testing](unittest-fundamentals.md)**
   - The xUnit architecture, `unittest.TestCase`, assertion methods, test fixtures (`setUp`/`tearDown`), subtests (`self.subTest`), test runners, and skipping/failing tests.
2. **[The Pytest Framework, Fixtures & Parametrization](pytest-framework-fixtures-parametrization.md)**
   - Modern `pytest` mechanics, magic `assert` introspection, dependency injection with fixtures, fixture scopes (`function`, `module`, `session`), `conftest.py`, markers, and table-driven parametrization.
3. **[Mocking, Test Doubles & Coverage](mocking-and-test-coverage.md)**
   - The Test Double taxonomy (Dummies, Stubs, Spies, Mocks, Fakes), `unittest.mock.MagicMock`, `@patch` and `patch.object`, mocking context managers, asynchronous mocks (`AsyncMock`), and measuring test coverage with `coverage.py` / `pytest-cov`.

---

## 🗺️ Progression Path

```
unittest-fundamentals.md ──► pytest-framework-fixtures-parametrization.md ──► mocking-and-test-coverage.md
                                                                                               │
                                                                                               ▼
                                                       [Next Module: Package Management](../package-management/README.md)
```
