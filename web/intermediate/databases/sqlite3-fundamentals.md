# SQLite3 & Embedded Relational Databases in Python

## Introduction

In modern application engineering, persistent data storage requires a relational database management system (RDBMS). While client-server databases (such as PostgreSQL or MySQL) are standard for high-concurrency cloud deployments, many applications require an **Embedded, Serverless Database Engine**:
- Desktop and CLI tools (e.g. tracking local settings or file indexes).
- Mobile and IoT applications.
- Ultra-fast, isolated unit testing environments that execute entirely in RAM.

For these needs, the worldwide standard is **SQLite**, and Python includes full, first-class native support via the built-in standard library **`sqlite3`** module.

The `sqlite3` module adheres strictly to **PEP 249 (Python Database API Specification v2.0)**, the universal standard governing database drivers across the Python ecosystem.

Mastering `sqlite3` teaches you the universal mechanics of relational database programming: connection management, cursors, transaction control (commit and rollback), ACID guarantees, and defending against the single most catastrophic database vulnerability: **SQL Injection**.

This lesson opens **Module 7: Relational Databases & ORM in Depth**, exploring embedded database mechanics, parameterized security, custom row factories, and in-memory test databases (`:memory:`).

---

## Prerequisites

Before studying SQLite3, ensure you have:

- Completed [File Handling & Pathlib](../../beginner/file-handling/reading-writing-files.md).
- Completed [Exception Handling](../../beginner/exceptions/try-except-finally.md).
- Basic familiarity with SQL syntax (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE`).

---

## Core Concept: The DB-API 2.0 (PEP 249) Architecture

```
                          PYTHON DB-API 2.0 (PEP 249) ARCHITECTURE

    Python Code                  sqlite3 Connection                  SQLite Database
   ┌─────────────┐             ┌─────────────────────┐             ┌─────────────────┐
   │ Application │ ──────────► │ conn.cursor()       │ ──────────► │ SQLite Engine   │
   │ Logic       │             │ • cursor.execute()  │             │ (File or Memory)│
   │             │             │ • cursor.fetchall() │             │                 │
   │             │             │ conn.commit()       │             │ Tables, Indexes,│
   │             │             │ conn.rollback()     │             │ ACID WAL Logs   │
   └─────────────┘             └─────────────────────┘             └─────────────────┘
```

---

## Syntax & Essential SQLite3 Patterns

```python
import sqlite3
from pathlib import Path

# 1. Connecting to an In-Memory Database (or local file: Path("app.db"))
conn = sqlite3.connect(":memory:")

# 2. Enabling Row Factory for Dictionary-Like Column Access by Name!
conn.row_factory = sqlite3.Row

# 3. Executing DDL Statements
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        balance REAL DEFAULT 0.0
    )
""")

# 4. SECURE Parameterized Query (Positional '?') - PREVENTS SQL INJECTION!
cursor.execute(
    "INSERT INTO users (username, email, balance) VALUES (?, ?, ?)",
    ("hesamp", "hesam@domain.com", 1500.00)
)
conn.commit()  # Save changes to database!

# 5. Querying Data with sqlite3.Row
cursor.execute("SELECT * FROM users WHERE username = ?", ("hesamp",))
row = cursor.fetchone()
if row:
    print(f"User #{row['id']}: {row['username']} | Balance: ${row['balance']:,.2f}")

conn.close()
```

---

## Detailed Explanation

### 1. The Catastrophe of SQL Injection & Parameterized Queries

The most dangerous vulnerability in database engineering is **SQL Injection**, which occurs when untrusted user input is concatenated or formatted directly into a SQL query string using f-strings or `.format()`:

```python
# 🚨 CATASTROPHIC SECURITY VULNERABILITY (SQL INJECTION!):
user_input = "' OR '1'='1' --"
query = f"SELECT * FROM users WHERE username = '{user_input}'"
# Generates: SELECT * FROM users WHERE username = '' OR '1'='1' --'
# Bypasses authentication completely and dumps all customer data! 💥
```

#### The Solution: Parameterized Queries
Never concatenate strings into SQL! Always pass query parameters as a separate tuple to `cursor.execute()`:

```python
# ✅ 100% SECURE: Uses Database Engine Parameter Binding
# Positional binding using '?':
cursor.execute("SELECT * FROM users WHERE username = ?", (user_input,))

# Named binding using ':param_name':
cursor.execute("SELECT * FROM users WHERE username = :name", {"name": user_input})
```

The database engine treats the parameters strictly as literal data values, making SQL injection impossible.

---

### 2. Transaction Management & ACID Invariants

Relational databases guarantee **ACID Properties**:
- **Atomicity**: All operations in a transaction succeed, or all are rolled back.
- **Consistency**: Database invariants and constraints are always enforced.
- **Isolation**: Concurrent transactions do not see uncommitted intermediate states.
- **Durability**: Committed data is safely written to disk.

#### Context Manager Transaction Pattern:
When using `with conn:`, Python starts a transaction automatically, **commits on block exit**, and **automatically rolls back if an exception occurs**:

```python
try:
    with conn:  # Automatically wraps in a transaction!
        conn.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
        conn.execute("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
    print("✅ Transaction committed atomically!")
except sqlite3.Error as err:
    print(f"❌ Transaction rolled back due to error: {err}")
```

---

### 3. Column Access with `sqlite3.Row`

By default, `cursor.fetchall()` returns raw tuples `(1, "hesamp", "hesam@domain.com")`, requiring fragile integer indices (`row[0]`).

Setting `conn.row_factory = sqlite3.Row` transforms rows into mapping objects that support:
- Access by column name: `row["username"]`
- Access by index: `row[1]`
- Case-insensitive column matching
- Keys extraction: `row.keys()`

---

## Examples

### 1. Simple: Basic CRUD Operations
Creating a table, inserting a record, updating, and querying.

```python
import sqlite3

conn = sqlite3.connect(":memory:")
cursor = conn.cursor()

# Create
cursor.execute("CREATE TABLE products (sku TEXT PRIMARY KEY, price REAL, stock INTEGER)")

# Insert
cursor.execute("INSERT INTO products VALUES (?, ?, ?)", ("SKU-101", 49.99, 100))
conn.commit()

# Update
cursor.execute("UPDATE products SET stock = stock - 5 WHERE sku = ?", ("SKU-101",))
conn.commit()

# Read
cursor.execute("SELECT sku, price, stock FROM products WHERE sku = ?", ("SKU-101",))
sku, price, stock = cursor.fetchone()
print(f"Product: {sku} | Price: ${price} | Stock: {stock} units")

conn.close()
```

### 2. Beginner: High-Speed Batch Insertion with `executemany()`
Inserting 1,000 records in a single batch operation rather than 1,000 individual `execute()` calls.

```python
import sqlite3
import time

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE metrics (id INTEGER PRIMARY KEY, metric TEXT, val REAL)")

# Prepare batch data
batch_records = [(f"metric_{i}", i * 1.5) for i in range(1, 1001)]

start = time.perf_counter()
with conn:
    # Executes all inserts in a single transaction in C-speed!
    conn.executemany("INSERT INTO metrics (metric, val) VALUES (?, ?)", batch_records)

elapsed_ms = (time.perf_counter() - start) * 1000.0
print(f"✅ Batch inserted 1,000 records in {elapsed_ms:.2f} ms")

cursor = conn.execute("SELECT COUNT(*) FROM metrics")
print("Total Rows in Table:", cursor.fetchone()[0])
conn.close()
```

### 3. Intermediate: Transactional Financial Balance Transfer
Simulating an atomic fund transfer between bank accounts with automated rollback on failure.

```python
import sqlite3

def transfer_funds(conn: sqlite3.Connection, from_acc: int, to_acc: int, amount: float):
    """Executes atomic fund transfer between accounts."""
    try:
        with conn:  # Atomicity Guard: Commits on success, rolls back on exception
            # 1. Verify Sender Balance
            cursor = conn.execute("SELECT balance FROM accounts WHERE id = ?", (from_acc,))
            row = cursor.fetchone()
            if not row or row[0] < amount:
                raise ValueError(f"Insufficient funds in Account #{from_acc}")

            # 2. Deduct from Sender
            conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (amount, from_acc))
            
            # 3. Credit Receiver
            conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (amount, to_acc))
            
            print(f"💸 [TRANSFER SUCCESS] Transferred ${amount:,.2f} from #{from_acc} to #{to_acc}")
    except Exception as err:
        print(f"🛡️ [TRANSACTION ABORTED] Rollback executed: {err}")

# Setup Test Bank
conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance REAL)")
conn.executemany("INSERT INTO accounts VALUES (?, ?)", [(1, 500.00), (2, 100.00)])
conn.commit()

# Test Valid Transfer ($200)
transfer_funds(conn, from_acc=1, to_acc=2, amount=200.00)

# Test Invalid Transfer ($1,000 - Exceeds balance!) -> Triggers Rollback
transfer_funds(conn, from_acc=1, to_acc=2, amount=1000.00)

conn.close()
```

### 4. Real-World: Object-Oriented SQLite User Repository
Encapsulating database operations in a clean Repository pattern with `sqlite3.Row`.

```python
import sqlite3
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: int
    username: str
    email: str
    role: str

class SQLiteUserRepository:
    def __init__(self, db_path: str = ":memory:"):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._initialize_schema()

    def _initialize_schema(self):
        with self.conn:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL,
                    role TEXT DEFAULT 'USER'
                )
            """)

    def create_user(self, username: str, email: str, role: str = "USER") -> User:
        with self.conn:
            cursor = self.conn.execute(
                "INSERT INTO users (username, email, role) VALUES (?, ?, ?)",
                (username, email, role)
            )
            return User(id=cursor.lastrowid, username=username, email=email, role=role)

    def find_by_username(self, username: str) -> Optional[User]:
        cursor = self.conn.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if row:
            return User(id=row["id"], username=row["username"], email=row["email"], role=row["role"])
        return None

repo = SQLiteUserRepository()
new_user = repo.create_user("hesam_admin", "hesam@domain.com", role="ADMIN")
print(f"Created User: #{new_user.id} ({new_user.username})")

found = repo.find_by_username("hesam_admin")
if found:
    print(f"Found User in DB: Role = {found.role}")
```

### 5. Advanced: Performance Optimization with SQLite WAL Mode
Configuring SQLite Pragmas for enterprise high-concurrency reading and writing.

```python
import sqlite3

conn = sqlite3.connect(":memory:")

# 1. Enable Foreign Key Constraint Enforcement (Disabled by default in SQLite!)
conn.execute("PRAGMA foreign_keys = ON")

# 2. Enable Write-Ahead Logging (WAL) for High-Concurrency Multi-Threaded Disk Databases
# (WAL allows readers to read without blocking writers!)
# conn.execute("PRAGMA journal_mode = WAL")

# 3. Set synchronous mode to NORMAL for 3x write speedup
# conn.execute("PRAGMA synchronous = NORMAL")

print("SQLite Foreign Keys Status:", conn.execute("PRAGMA foreign_keys").fetchone()[0])
conn.close()
```

---

## Code Explanation

In Example 4 (`SQLiteUserRepository`):
1. The repository encapsulates the `sqlite3.Connection` instance and isolates SQL queries from the rest of the application.
2. `self.conn.row_factory = sqlite3.Row` allows mapping database result columns (`row["username"]`) directly into typed Python `User` dataclass instances.
3. Every write operation is wrapped in a `with self.conn:` context manager, guaranteeing atomic transaction commits.
4. `cursor.lastrowid` retrieves the auto-generated primary key integer from the `AUTOINCREMENT` sequence in $O(1)$ time.

---

## Common Mistakes

### Mistake 1: String Formatting in SQL Queries (SQL Injection!)
Never write `cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")`. Always use parameterized placeholders `?` or `:name`.

### Mistake 2: Forgetting `conn.commit()`
SQLite connections do not auto-commit by default. If you execute `INSERT` statements without calling `conn.commit()` or wrapping them in `with conn:`, your data will be **completely discarded** when the connection closes!

---

## Best Practices

### Enable `PRAGMA foreign_keys = ON`
By default, SQLite does not enforce `FOREIGN KEY` constraints for backward compatibility with 2000s legacy systems. Always execute `conn.execute("PRAGMA foreign_keys = ON")` upon opening a connection.

Good:
```python
conn = sqlite3.connect("app.db")
conn.execute("PRAGMA foreign_keys = ON")
```

---

## Performance Considerations

1. **Batching Transactions with `executemany()`**: Executing 10,000 individual `INSERT` statements with individual commits takes **~15 seconds** (due to 10,000 disk syncs). Wrapping all 10,000 inserts inside a single `with conn:` transaction with `executemany()` takes **~0.05 seconds (300x faster!)**.
2. **In-Memory Testing**: `sqlite3.connect(":memory:")` creates a database entirely in RAM with zero disk I/O, allowing test suites with 5,000 database queries to complete in under 1 second.

---

## Security Considerations

1. **Defending Against SQL Injection**: Always enforce parameterized queries. Never trust input from web forms, query parameters, or third-party APIs.
2. **Database File Permissions**: On production servers, ensure SQLite database files have strict OS file permissions (`chmod 600 app.db`) so unauthorized system users cannot read sensitive data directly.

---

## Real-World Usage

- **Automated Test Suites**: Running isolated in-memory unit tests for Django and FastAPI apps.
- **Client Applications**: Local caching in desktop software (Slack, VS Code, Spotify).
- **Embedded Edge Devices (Raspberry Pi / IoT)**: Logging local sensor telemetry.

---

## Comparison: SQLite vs Client-Server Databases

| Feature | SQLite (`sqlite3`) | PostgreSQL | MySQL |
|---|---|---|---|
| **Architecture** | **Embedded (In-Process Library)** | Client-Server RDBMS | Client-Server RDBMS |
| **Setup Required** | **Zero (Built into Python)** | Dedicated Server / Port | Dedicated Server / Port |
| **Concurrency** | Single Writer, Multi-Reader (WAL)| High Concurrent Writers | High Concurrent Writers |
| **Data Storage** | Single file / RAM (`:memory:`) | Server Disk Cluster | Server Disk Cluster |
| **Best Used For** | CLI tools, Local cache, Testing | Enterprise Web APIs, Microservices | Web Applications |

---

## Advanced Concepts: User-Defined Functions with `create_function()`

SQLite allows registering custom Python functions that can be invoked directly inside SQL queries:

```python
import sqlite3
import hashlib

conn = sqlite3.connect(":memory:")

# Register custom Python hashing function in SQLite SQL engine!
conn.create_function("sha256_hash", 1, lambda s: hashlib.sha256(s.encode()).hexdigest()[:8])

cursor = conn.execute("SELECT sha256_hash('my_secure_password')")
print("Custom SQL Function Result:", cursor.fetchone()[0])
conn.close()
```

---

## Exercises

### Exercise 1 — Beginner
Create an in-memory SQLite database, create a `books` table (`id`, `title`, `author`, `year`), insert 3 books using parameterized queries, and query all books published after 2020.

### Exercise 2 — Intermediate
Build a `CustomerOrderRepository` that manages a 1-to-many relationship (`customers` and `orders` tables) with foreign key constraints enabled. Implement a method to fetch a customer and all their associated orders using a `JOIN` query.

### Exercise 3 — Advanced
Build an automated transaction ledger `LedgerService` with methods `deposit(acc_id, amt)`, `withdraw(acc_id, amt)`, and `transfer(from_id, to_id, amt)`. Ensure all balance updates are strictly atomic and verify that an intentional mid-transaction error rolls back changes completely.

---

## Mini Project: Enterprise Relational Banking & Account Transaction Engine

### Requirements
Build an operational core banking engine named `sqlite_banking_engine.py`. Implement relational schemas for accounts and audit log ledgers, atomic fund transfers with transactional rollback safety, parameterized SQL queries, and formatted statement reporting with `sqlite3.Row`.

### Implementation Blueprint
```python
import sqlite3
from datetime import datetime, timezone

# =====================================================================
# 1. CORE BANKING ENGINE
# =====================================================================

class EnterpriseBankingEngine:
    def __init__(self, db_path: str = ":memory:"):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._setup_schema()

    def _setup_schema(self):
        with self.conn:
            self.conn.execute("PRAGMA foreign_keys = ON")
            # Accounts Table
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    account_number TEXT PRIMARY KEY,
                    holder_name TEXT NOT NULL,
                    balance REAL NOT NULL CHECK(balance >= 0.0)
                )
            """)
            # Audit Ledger Table
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_ledger (
                    tx_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_account TEXT,
                    to_account TEXT,
                    amount REAL NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY(from_account) REFERENCES accounts(account_number),
                    FOREIGN KEY(to_account) REFERENCES accounts(account_number)
                )
            """)

    def create_account(self, account_number: str, holder_name: str, initial_deposit: float):
        with self.conn:
            self.conn.execute(
                "INSERT INTO accounts (account_number, holder_name, balance) VALUES (?, ?, ?)",
                (account_number, holder_name, initial_deposit)
            )
            print(f"🏦 Account Created: {account_number} ({holder_name}) - Seed: ${initial_deposit:,.2f}")

    def execute_transfer(self, from_acc: str, to_acc: str, amount: float) -> bool:
        """Executes atomic fund transfer with ledger recording."""
        now_ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
        
        try:
            with self.conn:  # Atomic Transaction Boundary
                # 1. Check sender balance
                sender = self.conn.execute(
                    "SELECT balance FROM accounts WHERE account_number = ?",
                    (from_acc,)
                ).fetchone()
                
                if not sender:
                    raise ValueError(f"Sender account '{from_acc}' not found.")
                if sender["balance"] < amount:
                    raise ValueError(f"Insufficient funds in '{from_acc}' (Available: ${sender['balance']:,.2f})")

                # 2. Update Balances
                self.conn.execute(
                    "UPDATE accounts SET balance = balance - ? WHERE account_number = ?",
                    (amount, from_acc)
                )
                self.conn.execute(
                    "UPDATE accounts SET balance = balance + ? WHERE account_number = ?",
                    (amount, to_acc)
                )

                # 3. Record Audit Ledger Entry
                self.conn.execute("""
                    INSERT INTO audit_ledger (from_account, to_account, amount, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (from_acc, to_acc, amount, now_ts))

                print(f"💸 [TRANSFER OK] ${amount:,.2f} from {from_acc} -> {to_acc}")
                return True
        except Exception as err:
            print(f"🚫 [TRANSACTION FAILED & ROLLED BACK] {err}")
            return False

    def render_account_statement(self, account_number: str):
        acc = self.conn.execute(
            "SELECT * FROM accounts WHERE account_number = ?",
            (account_number,)
        ).fetchone()
        
        if not acc:
            print(f"Account {account_number} not found.")
            return

        txs = self.conn.execute("""
            SELECT * FROM audit_ledger 
            WHERE from_account = ? OR to_account = ?
            ORDER BY tx_id DESC
        """, (account_number, account_number)).fetchall()

        border = "=" * 65
        print("\n" + border)
        print(f"       OFFICIAL ACCOUNT STATEMENT: {acc['account_number']}")
        print(border)
        print(f"  Account Holder : {acc['holder_name']}")
        print(f"  Current Balance: ${acc['balance']:>12,.2f}")
        print("-" * 65)
        print("  Recent Transaction History:")
        for t in txs:
            direction = "DEBIT  (-)" if t["from_account"] == account_number else "CREDIT (+)"
            other = t["to_account"] if t["from_account"] == account_number else t["from_account"]
            print(f"   • [{t['timestamp']}] {direction} ${t['amount']:>8,.2f} | Counterparty: {other}")
        print(border)

if __name__ == "__main__":
    bank = EnterpriseBankingEngine()
    
    # 1. Create Accounts
    bank.create_account("ACC-1001", "Hesam Pourabbasain", initial_deposit=5_000.00)
    bank.create_account("ACC-2002", "Sarah Jenkins", initial_deposit=1_200.00)
    
    # 2. Successful Transfer
    bank.execute_transfer("ACC-1001", "ACC-2002", amount=850.00)
    
    # 3. Failed Transfer (Exceeds Balance -> Rolls back cleanly!)
    bank.execute_transfer("ACC-2002", "ACC-1001", amount=10_000.00)
    
    # 4. Render Statement
    bank.render_account_statement("ACC-1001")
    bank.render_account_statement("ACC-2002")
```

---

## Summary

In this lesson, you mastered Python's `sqlite3` module:
- **`sqlite3`** provides an embedded, zero-configuration relational database engine adhering to **PEP 249 (DB-API 2.0)**.
- **Never format strings into SQL queries**; always use **Parameterized Queries (`?` or `:name`)** to prevent catastrophic **SQL Injection** vulnerabilities.
- Use **`with conn:`** context managers for automatic **Atomicity, Commit, and Rollback**.
- Set **`conn.row_factory = sqlite3.Row`** for clean dictionary-like column access.
- Use **`executemany()`** to batch insert thousands of records in milliseconds.
- Use **`sqlite3.connect(":memory:")`** for blazing-fast isolated unit testing in RAM.

---

## Best Practices Checklist

- [ ] Always use parameterized queries (`?` or `:name`) on every SQL statement.
- [ ] Set `conn.row_factory = sqlite3.Row` on all connections.
- [ ] Enable `PRAGMA foreign_keys = ON` on SQLite startup.
- [ ] Wrap transactional multi-step queries in `with conn:` blocks.
- [ ] Use `executemany()` for batch insertions.
- [ ] Use in-memory SQLite (`:memory:`) for automated test fixtures.

---

## What's Next?

Now that you understand embedded databases and DB-API 2.0, continue to:
👉 **[PostgreSQL & Psycopg 3](postgresql-and-psycopg.md)** to master production client-server databases, connection pooling, and JSONB handling!
