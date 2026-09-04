# 🗄️ Module 7: Relational Databases & ORM in Depth

Welcome to the **Relational Databases & ORM** module in Level 2.

Almost every production application—from e-commerce platforms to machine learning pipelines and web APIs—relies on persistent storage through relational databases. Understanding how Python communicates with database engines, prevents critical security vulnerabilities like **SQL Injection**, manages transactions and connection pools, and abstracts database tables using **Object-Relational Mapping (ORM)** is an essential skill for every professional Python engineer.

---

## 🎯 Module Overview

In this module, you will master:
- The standard library **`sqlite3`** module: embedded databases, parameter substitution, row factories, transaction management (commit/rollback), and ACID properties.
- Production PostgreSQL with **`psycopg` (Psycopg 3)**: connection pooling, client-side vs server-side cursors, binary data streaming, and asynchronous database execution.
- Modern **SQLAlchemy 2.0 ORM**: Declarative mapping with `Mapped` and `mapped_column`, relational models (1-to-Many, Many-to-Many), Session lifecycle, Unit-of-Work pattern, and building type-safe queries using `select()`.

---

## 📑 Articles in this Module

1. **[SQLite3 & Embedded Relational Databases](sqlite3-fundamentals.md)**
   - Embedded database engines, DB-API 2.0 protocol (PEP 249), parameterized queries, preventing SQL injection, transaction control, custom `sqlite3.Row` factories, and in-memory test databases (`:memory:`).
2. **[PostgreSQL & Psycopg 3](postgresql-and-psycopg.md)**
   - Client-server database architecture, Psycopg 3 modern features, connection pooling (`ConnectionPool`), server-side streaming cursors, JSONB data types, and transactions.
3. **[SQLAlchemy 2.0 & Declarative ORM](sqlalchemy-orm-basics.md)**
   - Modern SQLAlchemy 2.0 syntax, `DeclarativeBase`, `Mapped[]` type hints, relationships (`relationship()`, `ForeignKey`), Unit-of-Work `Session`, executing type-safe queries with `select()`, and schema migrations.

---

## 🗺️ Progression Path

```
sqlite3-fundamentals.md ──► postgresql-and-psycopg.md ──► sqlalchemy-orm-basics.md
                                                                  │
                                                                  ▼
                                 [Next Module: Networking & REST APIs](../apis-and-networking/README.md)
```
