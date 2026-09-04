# SQLAlchemy 2.0 & Declarative ORM in Python

## Introduction

In software architecture, connecting Python's rich object-oriented domain models to relational database tables introduces the classic **Object-Relational Impedance Mismatch**:
- Python models represent state as objects with properties, inheritance hierarchies, and in-memory references (`user.orders`).
- Relational databases represent state as flat tables, foreign key constraints, and normalized tabular rows.

Writing raw SQL queries for every database operation is tedious, error-prone during refactoring, and pollutes domain logic.

To solve this, Python relies on **Object-Relational Mapping (ORM)**, and the undisputed enterprise standard is **SQLAlchemy**.

Released in 2023, **SQLAlchemy 2.0** represents a major architectural milestone. It completely modernizes Python database engineering by uniting SQLAlchemy Core and ORM into a single, cohesive, fully type-annotated system. SQLAlchemy 2.0 leverages modern Python type hints (`Mapped[T]` and `mapped_column()`), adopts declarative 2.0 query syntax (`select(Model)`), and enforces the **Unit-of-Work Pattern** through transactional `Session` lifecycles.

This lesson concludes **Module 7: Relational Databases & ORM in Depth**, exploring declarative mapping, 1-to-Many and Many-to-Many relationships, type-safe queries with `select()`, and solving the catastrophic **N+1 Query Problem**.

---

## Prerequisites

Before studying SQLAlchemy 2.0, ensure you have:

- Completed [SQLite3](sqlite3-fundamentals.md) and [PostgreSQL & Psycopg 3](postgresql-and-psycopg.md).
- Completed [Type Hints & Modern Syntax](../typing/type-hints-basics.md).
- A solid understanding of relational database keys and joins.

---

## Core Concept: Modern Declarative 2.0 Architecture

```
                          SQLAlchemy 2.0 DECLARATIVE ARCHITECTURE

       Python Domain Model (Mapped)                       Relational Database Table
   ┌───────────────────────────────────┐               ┌─────────────────────────────┐
   │ class User(DeclarativeBase):      │               │ Table: users                │
   │     id: Mapped[int] = pk          │ ════════════► │ • id       INTEGER PRIMARY  │
   │     username: Mapped[str]         │   SQLAlchemy  │ • username VARCHAR NOT NULL │
   │     orders: Mapped[list[Order]]   │   Engine &    │ • email    VARCHAR NOT NULL │
   │         = relationship(...)       │   Session     │                             │
   └───────────────────────────────────┘               └─────────────────────────────┘
```

---

## Syntax & Essential SQLAlchemy 2.0 Patterns

```python
from __future__ import annotations
from typing import Optional
from sqlalchemy import create_engine, select, String, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session

# 1. Base Class for Modern Declarative Mapping
class Base(DeclarativeBase):
    pass

# 2. Modern 2.0 Model Definitions with Mapped and mapped_column
class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    # 1-to-Many Relationship to Orders
    orders: Mapped[list[Order]] = relationship(back_populates="customer", cascade="all, delete-orphan")

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    total_amount: Mapped[float] = mapped_column()
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))

    # Relationship Back-Reference
    customer: Mapped[Customer] = relationship(back_populates="orders")

# 3. Create Engine & Initialize Schema
engine = create_engine("sqlite:///:memory:", echo=False)
Base.metadata.create_all(engine)

# 4. Unit of Work: Session Transaction Management
with Session(engine) as session:
    # Create
    cust = Customer(name="Hesam Pourabbasain", email="hesam@domain.com")
    cust.orders.append(Order(total_amount=1450.00))
    cust.orders.append(Order(total_amount=250.00))
    session.add(cust)
    session.commit()

    # 5. Type-Safe 2.0 Select Query (Replaces legacy session.query!)
    stmt = select(Customer).where(Customer.email == "hesam@domain.com")
    found_customer = session.scalars(stmt).first()
    if found_customer:
        print(f"Customer: {found_customer.name} | Active Orders: {len(found_customer.orders)}")
```

---

## Detailed Explanation

### 1. Legacy 1.x vs Modern 2.0 Syntax

A frequent source of confusion is mixing legacy SQLAlchemy 1.x syntax with modern 2.0 syntax:

| Feature | Legacy 1.x (OBSOLETE) | Modern SQLAlchemy 2.0 (STANDARD) |
|---|---|---|
| **Base Class** | `Base = declarative_base()` | `class Base(DeclarativeBase): pass` |
| **Field Definitions**| `name = Column(String(50))` | **`name: Mapped[str] = mapped_column(String(50))`** |
| **Query Syntax** | `session.query(User).filter(...)` | **`session.scalars(select(User).where(...))`** |
| **Type Safety** | Untyped dynamic properties | **100% Type-Safe with Mypy / IDEs** |

---

### 2. The Unit-of-Work Pattern & The `Session` Lifecycle

In SQLAlchemy, the **`Session`** acts as a **Unit of Work** and an **Identity Map**:
- **Identity Map**: Guarantees that querying `Customer` ID #1 multiple times within the same session returns the exact same Python object instance in memory.
- **Change Tracking**: Tracks all mutations to object attributes and generates minimal, optimized SQL `UPDATE` statements automatically upon `session.commit()`.

```python
with Session(engine) as session:
    user = session.get(Customer, 1)
    user.name = "Updated Name"  # Mutation tracked automatically!
    session.commit()  # Automatically issues UPDATE SQL!
```

---

### 3. The Fatal N+1 Query Problem & Eager Loading

A critical performance disaster in ORMs is the **N+1 Query Problem**:
If you query 100 customers and iterate through their orders (`for c in customers: print(c.orders)`), SQLAlchemy executes:
- 1 Query to fetch all 100 customers.
- **100 Individual SQL Queries** (one per customer) to fetch their orders lazily on access!
- **Total: 101 Database Network Roundtrips!**

#### The Solution: Eager Loading with `selectinload()`
Instruct SQLAlchemy to fetch all related records upfront using **`selectinload()`** (executes exactly **2 queries total**):

```python
from sqlalchemy.orm import selectinload

# Executes EXACTLY 2 optimized queries regardless of customer count!
stmt = select(Customer).options(selectinload(Customer.orders))
customers = session.scalars(stmt).all()

for c in customers:
    # Instant in-memory access! ZERO additional database queries!
    print(f"{c.name}: {len(c.orders)} orders")
```

---

## Examples

### 1. Simple: Basic CRUD Operations with SQLAlchemy 2.0
Demonstrating creation, querying, updating, and deletion in 2.0 style.

```python
from sqlalchemy import create_engine, select, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session

class Base(DeclarativeBase): pass

class ServerNode(Base):
    __tablename__ = "server_nodes"
    id: Mapped[int] = mapped_column(primary_key=True)
    hostname: Mapped[str] = mapped_column(String(50), unique=True)
    ip_address: Mapped[str] = mapped_column(String(15))
    is_active: Mapped[bool] = mapped_column(default=True)

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)

with Session(engine) as session:
    # 1. CREATE
    node = ServerNode(hostname="node-us-east-01", ip_address="10.0.1.25")
    session.add(node)
    session.commit()

    # 2. READ (2.0 Select)
    stmt = select(ServerNode).where(ServerNode.hostname == "node-us-east-01")
    target = session.scalars(stmt).one()
    print("Queried Node IP:", target.ip_address)

    # 3. UPDATE
    target.ip_address = "10.0.1.99"
    session.commit()

    # 4. DELETE
    session.delete(target)
    session.commit()
    print("Node successfully deleted.")
```

### 2. Beginner: 1-to-Many Relational Schema with Foreign Keys
Modeling a Department to Employee one-to-many relationship with cascading deletes.

```python
from sqlalchemy import create_engine, select, String, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session

class Base(DeclarativeBase): pass

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    employees: Mapped[list[Employee]] = relationship(back_populates="department", cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    salary: Mapped[float] = mapped_column()
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    department: Mapped[Department] = relationship(back_populates="employees")

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)

with Session(engine) as session:
    dept = Department(name="Engineering")
    dept.employees.append(Employee(name="Hesam", salary=140000))
    dept.employees.append(Employee(name="Sarah", salary=155000))
    session.add(dept)
    session.commit()

    # Query Department and display employees
    saved_dept = session.scalars(select(Department).where(Department.name == "Engineering")).one()
    print(f"Department '{saved_dept.name}' Staff Count: {len(saved_dept.employees)}")
```

### 3. Intermediate: Complex Filtering, Sorting & Joins with `select()`
Executing SQL joins, aggregate calculations, and multi-condition filters.

```python
from sqlalchemy import func

with Session(engine) as session:
    # 1. Multi-condition filtering
    stmt = (
        select(Employee)
        .join(Employee.department)
        .where(Department.name == "Engineering")
        .where(Employee.salary >= 150000)
        .order_by(Employee.salary.desc())
    )
    high_earners = session.scalars(stmt).all()
    for e in high_earners:
        print(f"High Earner: {e.name} (${e.salary:,.2f})")

    # 2. Aggregations (Average salary per department)
    agg_stmt = (
        select(Department.name, func.avg(Employee.salary), func.count(Employee.id))
        .join(Department.employees)
        .group_by(Department.name)
    )
    for dept_name, avg_sal, count in session.execute(agg_stmt):
        print(f"Dept: {dept_name:<14} | Count: {count} | Avg Salary: ${avg_sal:>10,.2f}")
```

### 4. Real-World: Many-to-Many Association Table Schema (User & Security Roles)
Modeling a Many-to-Many relationship using a declarative secondary Association Table.

```python
from sqlalchemy import Table, Column, Integer

class Base(DeclarativeBase): pass

# Secondary Association Table
user_roles_association = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True)
)

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(primary_key=True)
    role_name: Mapped[str] = mapped_column(String(30), unique=True)
    users: Mapped[list[UserAccount]] = relationship(
        secondary=user_roles_association,
        back_populates="roles"
    )

class UserAccount(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    roles: Mapped[list[Role]] = relationship(
        secondary=user_roles_association,
        back_populates="users"
    )

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)

with Session(engine) as session:
    admin_role = Role(role_name="ADMIN")
    dev_role = Role(role_name="DEVELOPER")
    
    user = UserAccount(username="hesam_lead")
    user.roles.append(admin_role)
    user.roles.append(dev_role)
    
    session.add(user)
    session.commit()

    saved_user = session.scalars(select(UserAccount).where(UserAccount.username == "hesam_lead")).one()
    print(f"User '{saved_user.username}' assigned roles:", [r.role_name for r in saved_user.roles])
```

### 5. Advanced: Eager Loading Strategy Comparison (`selectinload` vs `joinedload`)
Optimizing query performance for 1-to-Many and Many-to-1 relationships.

```python
from sqlalchemy.orm import selectinload, joinedload

with Session(engine) as session:
    # 1. selectinload: Best for 1-to-Many collections (Executes 2 targeted SELECT queries using IN operator)
    stmt_collections = select(UserAccount).options(selectinload(UserAccount.roles))
    users = session.scalars(stmt_collections).all()

    # 2. joinedload: Best for Many-to-1 and 1-to-1 relationships (Executes 1 SQL LEFT OUTER JOIN)
    # stmt_single = select(Employee).options(joinedload(Employee.department))
    print("Eager Loading Verified: Loaded roles for all users in 2 queries.")
```

---

## Code Explanation

In Example 4 (`Many-to-Many Schema`):
1. `user_roles_association` defines the pure relational join table holding foreign keys `user_id` and `role_id`.
2. `UserAccount.roles` and `Role.users` declare `relationship(secondary=user_roles_association, back_populates=...)`.
3. Appending a role (`user.roles.append(admin_role)`) automatically inserts the corresponding relational row into `user_roles` upon `session.commit()`.
4. SQLAlchemy handles bidirectional foreign key updates, cascades, and join queries with zero manual SQL code.

---

## Common Mistakes

### Mistake 1: Using Legacy 1.x Query Syntax
Writing `session.query(User).filter_by(...)` is obsolete. In SQLAlchemy 2.0, always use **`session.scalars(select(User).where(...))`**.

### Mistake 2: Missing `selectinload()` (The N+1 Query Disaster)
Accessing related collections (`user.orders`) outside of an eager-loaded query triggers separate SQL queries for every row. Always specify `.options(selectinload(Model.relation))`.

---

## Best Practices

### Always Manage Sessions with Context Managers
Wrap all database operations inside `with Session(engine) as session:` to guarantee that connections are closed and returned to the pool even if unhandled exceptions occur.

Good:
```python
with Session(engine) as session:
    session.add(model)
    session.commit()
```

---

## Performance Considerations

1. **Connection Pooling Sizing**: Configure connection pools in `create_engine`:
   ```python
   engine = create_engine("postgresql+psycopg://...", pool_size=10, max_overflow=20)
   ```
2. **`session.scalars()` vs `session.execute()`**: Use `session.scalars(stmt)` when querying entire ORM entities (`select(User)`). Use `session.execute(stmt)` when selecting specific columns (`select(User.id, User.name)`).

---

## Security Considerations

1. **Automatic Parameter Substitution**: SQLAlchemy 2.0 compiles all `where()` clauses into parameterized queries, guaranteeing 100% protection against SQL Injection out of the box.
2. **Password & Secret Storage**: Never store plaintext passwords in ORM models. Hash passwords with bcrypt/argon2 before setting them on the entity.

---

## Real-World Usage

- **FastAPI Applications**: Injected database sessions via `Depends(get_db_session)`.
- **Alembic Database Migrations**: Auto-generating relational schema migrations from declarative `Base.metadata`.
- **Microservice Repositories**: Encapsulating data access layers in type-safe repositories.

---

## Comparison: Database Interaction Paradigms

| Feature | Raw SQL (`sqlite3` / `psycopg`) | SQLAlchemy Core | SQLAlchemy 2.0 ORM | Django ORM |
|---|---|---|---|---|
| **Mapping Model** | None (Tuples/Dicts) | Python Expression Language | **Declarative Type-Safe Objects**| Active Record Models |
| **Type Safety** | ❌ None | Moderate | **100% Typed (`Mapped[]`)**| Moderate |
| **Portability** | Low (Dialect locked) | High | **Maximum across databases** | High |
| **Framework Agnostic?**| Yes | Yes | **Yes (FastAPI, Flask, CLI)** | No (Django only) |

---

## Advanced Concepts: Schema Migrations with Alembic

In production, you never call `Base.metadata.create_all()` directly on live databases. Instead, you manage incremental schema changes using **Alembic**:

```bash
# Initialize Alembic in project directory:
alembic init alembic

# Auto-generate migration script from SQLAlchemy models:
alembic revision --autogenerate -m "add_is_active_to_users"

# Apply migration to database:
alembic upgrade head
```

---

## Exercises

### Exercise 1 — Beginner
Create an in-memory SQLite database with a `Book` model (`id`, `title`, `author`, `published_year`). Insert 3 books using modern 2.0 `Session` and query all books published after 2021.

### Exercise 2 — Intermediate
Build a 1-to-Many `Author` to `Book` relationship. Write a query that eager-loads authors and their books using `selectinload()`, printing each author with their full book catalog.

### Exercise 3 — Advanced
Build an E-Commerce `Order` and `Product` Many-to-Many relationship with an association table containing extra attributes (`quantity`, `unit_price_at_purchase`). Write a query calculating the total gross revenue across all completed orders.

---

## Mini Project: Enterprise Relational E-Commerce & Order Management ORM Engine

### Requirements
Build an operational e-commerce ORM system named `ecommerce_orm_engine.py`. Model customers, products, and orders using SQLAlchemy 2.0 declarative mapping, eager-load relational graphs with `selectinload()`, implement transaction management, and generate formatted sales reports.

### Implementation Blueprint
```python
from __future__ import annotations
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import create_engine, select, String, Float, Integer, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload, Session

# =====================================================================
# 1. DECLARATIVE DATA MODELS
# =====================================================================

class Base(DeclarativeBase):
    pass

class CustomerAccount(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(100))
    tier: Mapped[str] = mapped_column(String(20), default="STANDARD")

    # 1-to-Many Relationship with Orders
    orders: Mapped[list[CustomerOrder]] = relationship(
        back_populates="customer",
        cascade="all, delete-orphan"
    )

class CustomerOrder(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(String(30), unique=True)
    total_amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="COMPLETED")
    created_at: Mapped[str] = mapped_column(default=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ"))

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    customer: Mapped[CustomerAccount] = relationship(back_populates="orders")

# =====================================================================
# 2. ENGINE & REPOSITORY FACADE
# =====================================================================

class ECommerceDataManager:
    def __init__(self, db_uri: str = "sqlite:///:memory:"):
        self.engine = create_engine(db_uri, echo=False)
        Base.metadata.create_all(self.engine)

    def seed_initial_data(self):
        with Session(self.engine) as session:
            # Create Customer with nested Orders
            c1 = CustomerAccount(username="hesam_dev", email="hesam@domain.com", tier="VIP")
            c1.orders.append(CustomerOrder(order_number="ORD-9901", total_amount=1200.00))
            c1.orders.append(CustomerOrder(order_number="ORD-9902", total_amount=450.00))

            c2 = CustomerAccount(username="sarah_ops", email="sarah@domain.com", tier="STANDARD")
            c2.orders.append(CustomerOrder(order_number="ORD-9903", total_amount=89.00))

            session.add_all([c1, c2])
            session.commit()
            print("🌱 Initial E-Commerce database seeded successfully.")

    def render_executive_sales_report(self):
        with Session(self.engine) as session:
            # EAGER LOADING: selectinload eliminates N+1 query problem!
            stmt = select(CustomerAccount).options(selectinload(CustomerAccount.orders))
            customers = session.scalars(stmt).all()

            border = "=" * 68
            print("\n" + border)
            print("         ENTERPRISE E-COMMERCE SALES & ORM REPORT")
            print(border)
            
            for c in customers:
                total_spend = sum(o.total_amount for o in c.orders)
                print(f"👤 Customer: {c.username:<16} ({c.tier}) │ Total Lifetime: ${total_spend:>9,.2f}")
                for o in c.orders:
                    print(f"   • [{o.order_number}] Issued: {o.created_at} │ Amount: ${o.total_amount:>8,.2f} ({o.status})")
                print("-" * 68)
                
            print(border)

if __name__ == "__main__":
    manager = ECommerceDataManager()
    manager.seed_initial_data()
    manager.render_executive_sales_report()
```

---

## Summary

In this lesson, you mastered SQLAlchemy 2.0 and Declarative ORM:
- **SQLAlchemy 2.0** provides a modern, type-safe Object-Relational Mapping system using **`Mapped[T]`** and **`mapped_column()`**.
- Query entities using modern **`session.scalars(select(Model).where(...))`** syntax.
- The **`Session`** acts as a transactional Unit of Work and Identity Map.
- Model 1-to-Many and Many-to-Many relationships with **`relationship()`** and **`ForeignKey`**.
- Eliminate the catastrophic **N+1 Query Problem** using **`selectinload()`** for eager loading.
- SQLAlchemy 2.0 automatically parameterizes queries, guaranteeing full SQL Injection defense.

---

## Best Practices Checklist

- [ ] Subclass `DeclarativeBase` for all declarative models.
- [ ] Use `Mapped[T]` and `mapped_column()` for type-safe field definitions.
- [ ] Always manage database sessions with `with Session(engine) as session:`.
- [ ] Use `selectinload()` when querying models with related collections.
- [ ] Use `session.scalars(select(Model))` for 2.0 queries instead of legacy `session.query()`.
- [ ] Use Alembic for production relational database migrations.

---

## 🏆 MODULE 7: RELATIONAL DATABASES & ORM COMPLETE!

Congratulations! You have completed all 3 comprehensive articles of **Module 7: Relational Databases & ORM in Depth**.

### What's Next?
Now advance to **Module 8: Networking & REST APIs**:
👉 **[Networking & REST APIs Module Overview](../apis-and-networking/README.md)** to master HTTP fundamentals, modern API consumption with HTTPX, and building production REST APIs with Flask & FastAPI!
