# 🟡 Level 2: Intermediate Python Mastery Curriculum

Welcome to **Level 2: Intermediate Python Curriculum**!

Having established solid foundations across basic syntax, collections, functions, file handling, and exceptions in Level 1, Level 2 elevates your engineering capabilities to **Professional-Grade Python Software Development**.

---

## 🎯 Level 2 Curriculum Objectives

In Level 2, you will transition from writing functional scripts to architecting **scalable, maintainable, high-performance systems**:
- **Object-Oriented Architecture**: Class models, polymorphism, Abstract Base Classes (ABCs), dunder methods, and `@dataclass`.
- **Memory-Efficient Streaming**: Iterators, generator pipelines, and the `itertools` library.
- **Metaprogramming & Functional Tools**: Closures, function and class decorators, `@functools.wraps`, `partial`, and higher-order functions.
- **Static Type Systems**: Advanced type annotations, `Generic[T]`, `Protocol` structural subtyping, and Mypy static analysis.
- **Advanced Algorithmic Structures**: Min/max binary heaps (`heapq`), binary search with `bisect`, and advanced collections (`deque`, `Counter`, `defaultdict`).
- **Database Engineering**: Embedded SQLite, client-server PostgreSQL with `psycopg`, and declarative ORM modeling with SQLAlchemy.
- **Networking & Web APIs**: HTTP protocols, modern sync/async API consumption with `httpx`, and REST API development with Flask.
- **Automated Testing & QA**: Unit testing with `unittest`, test suites with `pytest`, fixtures, parametrization, and mocking with `unittest.mock`.
- **Modern Packaging**: Virtual environments, Poetry dependency management, and publishing wheels to PyPI with `pyproject.toml`.

---

## 🗺️ Intermediate Module Roadmap

```
                    LEVEL 2: INTERMEDIATE LEARNING PATHWAY

    ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
    │  1. Object-Oriented Programming   │ ───► │    2. Iterators & Generators      │
    │  (Classes, ABCs, Dunder Methods)  │      │  (Iterators, Yield, Itertools)    │
    └─────────────────┬─────────────────┘      └─────────────────┬─────────────────┘
                      │                                          │
                      ▼                                          ▼
    ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
    │     3. Closures & Decorators      │ ───► │     4. Functional Programming     │
    │  (Function/Class Decorators, Wraps│      │  (Map, Filter, Reduce, Functools) │
    └─────────────────┬─────────────────┘      └─────────────────┬─────────────────┘
                      │                                          │
                      ▼                                          ▼
    ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
    │  5. Type Hints & Static Analysis  │ ───► │   6. Advanced Data Structures     │
    │  (Generics, Protocols, Mypy)      │      │  (Heapq, Bisect, Collections)     │
    └─────────────────┬─────────────────┘      └─────────────────┬─────────────────┘
                      │                                          │
                      ▼                                          ▼
    ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
    │   7. Relational Databases & ORM   │ ───► │     8. Networking & REST APIs     │
    │  (SQLite, PostgreSQL, SQLAlchemy) │      │  (HTTP, HTTPX, Flask REST APIs)   │
    └─────────────────┬─────────────────┘      └─────────────────┬─────────────────┘
                      │                                          │
                      ▼                                          ▼
    ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
    │   9. Testing & Quality Assurance  │ ───► │ 10. Packaging & Distribution      │
    │  (Pytest, Fixtures, Mocking)      │      │  (Poetry, PyPI, pyproject.toml)   │
    └─────────────────┬─────────────────┘      └─────────────────┬─────────────────┘
                      │
                      ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                     11. Intermediate Capstone Projects                       │
    │  (Flask REST API, JWT Auth, Scrapers, Typer CLI, SQLAlchemy Microservices)   │
    └──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📑 Module Directory & Detailed Contents

### 1. [Object-Oriented Programming (OOP)](oop/README.md)
Master encapsulation, inheritance, polymorphism, abstract base classes, dunder protocols, and dataclasses.
- [Classes & Objects](oop/classes-and-objects.md)
- [Constructors & Instance Attributes](oop/constructors-and-attributes.md)
- [Encapsulation & Properties](oop/encapsulation-and-properties.md)
- [Inheritance & Polymorphism](oop/inheritance-and-polymorphism.md)
- [Abstract Base Classes (ABCs)](oop/abstract-base-classes.md)
- [Magic & Dunder Methods](oop/magic-methods-dunder.md)
- [Dataclasses](oop/dataclasses.md)

### 2. [Iterators & Generators](iterators-generators/README.md)
Stream massive datasets with constant memory using lazy evaluation and combinatorial iterators.
- [The Iterator Protocol](iterators-generators/iterator-protocol.md)
- [Generators & Yield](iterators-generators/generator-functions-and-yield.md)
- [Generator Expressions](iterators-generators/generator-expressions.md)
- [Itertools Module](iterators-generators/itertools-module.md)

### 3. [Closures & Decorators](decorators/README.md)
Write expressive metaprogramming wrappers, caching middleware, and class decorators.
- [Closures & First-Class Functions](decorators/first-class-functions-closures.md)
- [Function Decorators](decorators/function-decorators.md)
- [Decorators with Arguments & `functools.wraps`](decorators/decorator-arguments-and-functools.md)
- [Class Decorators & Decorating Classes](decorators/class-decorators.md)

### 4. [Functional Programming](functional-programming/README.md)
Pure functions, higher-order functions, partial evaluation, and dispatch tables.
- [Map, Filter & Reduce](functional-programming/map-filter-reduce.md)
- [Functools & Operator Modules](functional-programming/functools-itertools-operator.md)

### 5. [Type Hints & Static Analysis](typing/README.md)
Enforce strict compile-time guarantees, generic containers, and structural subtyping.
- [Type Hints Basics](typing/type-hints-basics.md)
- [Generics & TypeVar](typing/generics-and-typevar.md)
- [Protocols & Structural Subtyping](typing/typing-protocols-and-duck-typing.md)
- [Advanced Typing (TypeGuard, ParamSpec, Concatenate, Self)](typing/typeguard-and-paramspec.md)
- [Static Analysis with Mypy](typing/mypy-static-analysis.md)

### 6. [Advanced Data Structures](advanced-data-structures/README.md)
High-performance algorithms, binary heaps, and sorted array bisecting.
- [The Collections Module](advanced-data-structures/collections-module.md)
- [Priority Queues & Heapq](advanced-data-structures/heapq-and-priority-queues.md)
- [Binary Search with Bisect](advanced-data-structures/bisect-module.md)

### 7. [Relational Databases & ORM](databases/README.md)
Persistent relational data modeling, migrations, raw SQL queries, and SQLAlchemy ORM.
- [SQLite Fundamentals](databases/sqlite3-fundamentals.md)
- [PostgreSQL & Psycopg](databases/postgresql-and-psycopg.md)
- [SQLAlchemy Core & ORM](databases/sqlalchemy-orm-basics.md)

### 8. [Networking & REST APIs](apis-and-networking/README.md)
HTTP protocol fundamentals, consuming third-party APIs with HTTPX, and building web backends with Flask.
- [HTTP & Requests](apis-and-networking/http-fundamentals-and-requests.md)
- [Modern API Client with HTTPX](apis-and-networking/httpx-and-api-consumption.md)
- [Building REST APIs with Flask](apis-and-networking/building-rest-apis-flask.md)

### 9. [Testing & Quality Assurance](testing/README.md)
Automated testing pipelines, test suites, parameterization, and mocking.
- [Unittest Fundamentals](testing/unittest-fundamentals.md)
- [Pytest Framework, Fixtures & Parametrization](testing/pytest-framework-fixtures-parametrization.md)
- [Mocking & Test Coverage](testing/mocking-and-test-coverage.md)

### 10. [Package Management & Distribution](package-management/README.md)
Professional dependency isolation, lockfiles, and publishing packages to PyPI.
- [Dependency Management (Pip, Pipenv, Poetry)](package-management/pip-pipenv-poetry.md)
- [Packaging & PyPI Distribution with `pyproject.toml`](package-management/packaging-and-pyproject-toml.md)

### 11. [Intermediate Projects Guide](projects/README.md)
Synthesize Level 2 skills into 8 complete production applications.
- [01. RESTful API with Flask](projects/01-rest-api-flask.md)
- [02. Full-Featured Blog Backend](projects/02-blog-backend.md)
- [03. JWT Authentication Microservice](projects/03-jwt-auth-api.md)
- [04. E-Commerce Inventory & Catalog](projects/04-ecommerce-catalog.md)
- [05. Asynchronous Web Scraper](projects/05-web-scraper.md)
- [06. Production CLI with Typer & Rich](projects/06-advanced-cli-typer.md)
- [07. PostgreSQL Database Manager](projects/07-postgres-inventory-manager.md)
- [08. High-Performance FastAPI Service](projects/08-fastapi-service.md)

---

## 🚀 Let's Begin

Start with **Module 1: Object-Oriented Programming (OOP)**:
👉 **[OOP Module Overview](oop/README.md)** or dive straight into **[Classes & Objects](oop/classes-and-objects.md)**!
