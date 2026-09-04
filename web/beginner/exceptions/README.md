# 🛡️ Module 11: Exception Handling

Welcome to the **Exception Handling** module. Software operates in an imperfect world of network dropouts, invalid user inputs, missing files, database deadlocks, and unexpected system errors. Writing resilient, production-ready software requires understanding how to anticipate, intercept, handle, and recover from runtime failures.

---

## 🎯 Module Overview

In Python, errors are handled through an elegant, hierarchical exception model following the principle of **EAFP (Easier to Ask for Forgiveness than Permission)**. Rather than defensive `if` checks on every possible failure point, Python code executes operations inside structured `try` blocks, catching specific exceptions and managing graceful degradation.

This module explores the complete `try-except-else-finally` lifecycle, Python's built-in Exception class inheritance hierarchy, explicit exception raising (`raise`), exception chaining (`raise from`), and defining strongly-typed custom domain exceptions.

---

## 📑 Articles in this Module

1. **[Try, Except, Else & Finally](try-except-finally.md)**
   - The 4-part exception handling lifecycle, catching multiple exceptions, the `else` clause (executes only when NO exception occurs), the `finally` clause (guaranteed execution), and the EAFP vs LBYL programming paradigms.
2. **[Raising Exceptions & Exception Chaining](raising-exceptions.md)**
   - The `raise` statement, re-raising active exceptions, explicit exception chaining with `raise NewException from original_exc`, implicit chaining, and suppressing context with `from None`.
3. **[Custom Exceptions & Domain Error Hierarchies](custom-exceptions.md)**
   - Defining custom exception classes inheriting from `Exception`, building structured domain error hierarchies (e.g., `PaymentError` $\rightarrow$ `CardExpiredError`), attaching rich diagnostic metadata, and integrating custom exceptions into API frameworks.

---

## 🗺️ Progression Path

```
try-except-finally.md ──► raising-exceptions.md ──► custom-exceptions.md
                                                            │
                                                            ▼
                                        [Next Module: Beginner Capstone Projects](../projects/README.md)
```
