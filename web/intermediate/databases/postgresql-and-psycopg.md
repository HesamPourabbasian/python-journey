# PostgreSQL & Psycopg 3 in Python

## Introduction

While embedded databases like SQLite excel at local storage and testing, production web applications, SaaS platforms, and distributed microservices require a high-concurrency, enterprise-grade **Client-Server Relational Database**.

**PostgreSQL (Postgres)** is widely recognized as the world's most advanced open-source relational database, offering unmatched reliability, rich data types (JSONB, UUID, Arrays), spatial indexing (PostGIS), and robust ACID transaction isolation.

To interact with PostgreSQL from Python, the premier driver is **`psycopg` (Psycopg 3)**.

Rewritten from the ground up as the modern successor to `psycopg2`, Psycopg 3 features:
- Complete support for Python 3.8+ type hints.
- **Native Connection Pooling** via `psycopg_pool`.
- **First-class AsyncIO Support** (`AsyncConnection`).
- **Binary Wire Protocol & High-Speed Bulk Copy** (`cursor.copy()`).
- Automatic serialization of native Python types to PostgreSQL JSONB, UUIDs, and Datetimes.

This lesson explores connecting to PostgreSQL, preventing connection churn with connection pools, server-side streaming cursors, JSONB manipulation, and asynchronous database execution.

---

## Prerequisites

Before studying Psycopg 3, ensure you have:

- Completed [SQLite3 & Embedded Relational Databases](sqlite3-fundamentals.md).
- Completed [Context Managers & The `with` Statement](../../beginner/file-handling/context-managers-with-statement.md).
- Familiarity with client-server networking (TCP/IP ports, connection strings).

---

## Core Concept: Client-Server Architecture & Connection Pooling

```
                        CLIENT-SERVER ARCHITECTURE & CONNECTION POOLING

    Application Threads / Tasks              psycopg_pool (ConnectionPool)            PostgreSQL Server
   ┌────────────────────────────┐          ┌──────────────────────────────┐          ┌─────────────────┐
   │ Thread 1 (Web Request)     │ ───────► │ Active Pool (e.g. 10 Conns)  │ ═══════► │ Postgres Engine │
   │ Thread 2 (API Endpoint)    │          │ • Borrows pre-warmed socket  │   TCP    │ • JSONB Engine  │
   │ Thread 3 (Background Task) │          │ • Returns socket when done!  │  Socket  │ • Transactions  │
   └────────────────────────────┘          │ • Zero TCP handshake latency!│          │ • WAL Logs      │
                                           └──────────────────────────────┘          └─────────────────┘
```

---

## Syntax & Essential Psycopg 3 Patterns

```python
import psycopg
from psycopg.rows import dict_row

# 1. Direct Connection with Dictionary Row Mapping
CONN_STRING = "postgresql://postgres:secret@localhost:5432/production_db"

# Psycopg 3 connection context manager (Auto-closes on exit)
with psycopg.connect(CONN_STRING, row_factory=dict_row) as conn:
    with conn.cursor() as cur:
        # 2. Parameterized Query (Uses %s placeholders - 100% SQL Injection Safe!)
        cur.execute(
            "SELECT id, username, email, created_at FROM users WHERE is_active = %s",
            (True,)
        )
        for user in cur.fetchall():
            print(f"User: {user['username']} <{user['email']}>")

# 3. Connection Pooling Pattern with psycopg_pool
# from psycopg_pool import ConnectionPool
# pool = ConnectionPool(CONN_STRING, min_size=4, max_size=20)
# with pool.connection() as conn:
#     conn.execute("UPDATE accounts SET active = %s WHERE id = %s", (True, 101))
```

---

## Detailed Explanation

### 1. Why Connection Pooling is Mandatory in Production

In client-server databases, establishing a new connection requires:
1. TCP 3-way handshake (~10–50 ms latency).
2. TLS / SSL cryptographic negotiation.
3. PostgreSQL authentication and backend process spawning (`fork()`).

If a web server processing 500 requests per second opens and closes a new connection for every request, the database will quickly run out of memory and crash.

**The Solution: Connection Pooling (`psycopg_pool.ConnectionPool`)**:
A connection pool maintains a pool of pre-warmed, active database connections in memory. When a web request arrives:
1. It borrows an idle connection from the pool in **$0.01\text{ ms}$**.
2. It executes queries and commits transactions.
3. It returns the connection to the pool for reuse by other requests.

---

### 2. Client-Side vs Server-Side Cursors

- **Client-Side Cursors (Default)**: When you execute `cur.execute("SELECT * FROM big_table")`, PostgreSQL transmits **the entire result set across the network into client RAM**. For 5,000,000 rows, this will immediately consume gigabytes of Python memory and trigger an Out-Of-Memory (OOM) crash.
- **Server-Side Streaming Cursors**: In Psycopg 3, giving a cursor a `name` creates a server-side cursor (`conn.cursor(name="stream_cursor")`). PostgreSQL holds the query state on the server, streaming rows to Python in fixed memory chunks (e.g. 1,000 rows at a time) in **constant $O(1)$ memory**!

---

### 3. Native PostgreSQL JSONB Storage

PostgreSQL's **JSONB** format stores structured JSON data in a decomposed binary format, allowing indexing and querying of nested fields directly inside SQL:

```python
import psycopg
from psycopg.types.json import Jsonb

# Psycopg 3 automatically serializes Python dictionaries into PostgreSQL JSONB!
user_metadata = {
    "preferences": {"theme": "dark", "notifications": True},
    "tags": ["vip", "enterprise"]
}

with psycopg.connect(CONN_STRING) as conn:
    conn.execute(
        "INSERT INTO user_profiles (user_id, metadata) VALUES (%s, %s)",
        (101, Jsonb(user_metadata))
    )
    conn.commit()

    # Query nested JSONB field inside PostgreSQL:
    cur = conn.execute("SELECT user_id FROM user_profiles WHERE metadata->'preferences'->>'theme' = %s", ("dark",))
    print("Dark Theme Users:", cur.fetchall())
```

---

## Examples

### 1. Simple: Basic PostgreSQL Connection & Transactions
Connecting to PostgreSQL and executing transactional queries with `psycopg.connect`.

```python
import psycopg
from psycopg.rows import dict_row

DB_URI = "postgresql://postgres:postgres@localhost:5432/app_db"

try:
    with psycopg.connect(DB_URI, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS server_nodes (
                    id SERIAL PRIMARY KEY,
                    hostname TEXT NOT NULL UNIQUE,
                    ip_address INET NOT NULL,
                    load_pct REAL DEFAULT 0.0
                )
            """)
            
            cur.execute(
                "INSERT INTO server_nodes (hostname, ip_address, load_pct) VALUES (%s, %s, %s) ON CONFLICT (hostname) DO NOTHING",
                ("node-us-east-01", "10.0.1.25", 42.5)
            )
            
        conn.commit()  # Explicit commit in Psycopg 3!
        print("✅ Database transaction committed.")
except Exception as err:
    print(f"⚠️ [DATABASE ERROR] {err}")
```

### 2. Beginner: Native UUID and Datetime Serialization
Leveraging native Python UUIDs and timezone-aware datetimes with automatic type mapping.

```python
import psycopg
import uuid
from datetime import datetime, timezone
from psycopg.rows import dict_row

DB_URI = "postgresql://postgres:postgres@localhost:5432/app_db"

def insert_audit_event(event_type: str, details: str):
    event_id = uuid.uuid4()
    now_utc = datetime.now(timezone.utc)

    with psycopg.connect(DB_URI, row_factory=dict_row) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_events (
                id UUID PRIMARY KEY,
                event_type TEXT NOT NULL,
                details TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL
            )
        """)

        # Psycopg 3 maps Python uuid.UUID and datetime directly to Postgres types!
        conn.execute(
            "INSERT INTO audit_events (id, event_type, details, created_at) VALUES (%s, %s, %s, %s)",
            (event_id, event_type, details, now_utc)
        )
        conn.commit()
        print(f"📝 [AUDIT LOGGED] ID: {event_id} at {now_utc.isoformat()}")

insert_audit_event("AUTH_LOGIN_SUCCESS", "User 'hesamp' authenticated from 192.168.1.1")
```

### 3. Intermediate: Production Connection Pooling with `psycopg_pool`
Configuring a resilient connection pool with minimum and maximum capacity boundaries.

```python
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

DB_URI = "postgresql://postgres:postgres@localhost:5432/app_db"

# Initialize Connection Pool
db_pool = ConnectionPool(
    conninfo=DB_URI,
    min_size=2,            # Minimum active sockets in pool
    max_size=10,           # Maximum active sockets under peak load
    max_idle=300.0,        # Close idle connections after 5 minutes
    kwargs={"row_factory": dict_row}
)

def get_active_user_count() -> int:
    # Borrow a connection from the pool
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as total FROM users WHERE is_active = %s", (True,))
            row = cur.fetchone()
            return row["total"] if row else 0

print("Active Users Count:", get_active_user_count())
db_pool.close()  # Cleanly close pool on application shutdown
```

### 4. Real-World: High-Speed Bulk Loading with `cursor.copy()`
Streaming hundreds of thousands of rows directly into PostgreSQL using binary COPY protocol (10x faster than batch inserts!).

```python
import psycopg
import io

DB_URI = "postgresql://postgres:postgres@localhost:5432/app_db"

def bulk_ingest_telemetry_records(records: list[tuple[str, float]]):
    """Streams data into PostgreSQL using native binary COPY protocol."""
    
    # Format data as in-memory CSV stream
    csv_buffer = io.StringIO()
    for sensor, val in records:
        csv_buffer.write(f"{sensor},{val}\n")
    csv_buffer.seek(0)

    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE TABLE IF NOT EXISTS sensor_feed (sensor TEXT, value REAL)")
            
            # High-speed COPY stream directly into table!
            with cur.copy("COPY sensor_feed (sensor, value) FROM STDIN WITH (FORMAT csv)") as copy:
                copy.write(csv_buffer.read())

        conn.commit()
        print(f"🚀 [BULK COPY SUCCESS] Ingested {len(records):,d} records at wire speed.")

sample_batch = [(f"SENSOR_{i:04d}", 20.0 + (i % 50)) for i in range(50_000)]
bulk_ingest_telemetry_records(sample_batch)
```

### 5. Advanced: Streaming Millions of Rows with Server-Side Cursors
Consuming large result sets in fixed 2,000-row streaming chunks without memory bloat.

```python
import psycopg
from psycopg.rows import dict_row

DB_URI = "postgresql://postgres:postgres@localhost:5432/app_db"

def stream_massive_dataset(batch_chunk_size: int = 2000):
    with psycopg.connect(DB_URI, row_factory=dict_row) as conn:
        # NAMED CURSOR: Creates a Server-Side Cursor!
        with conn.cursor(name="large_analytics_stream_cursor") as stream_cur:
            stream_cur.itersize = batch_chunk_size
            stream_cur.execute("SELECT id, sensor, value FROM sensor_feed")

            total_processed = 0
            # Iterates in fixed memory chunks without loading all rows into RAM!
            for row in stream_cur:
                total_processed += 1
                if total_processed % 10_000 == 0:
                    print(f"  Processed {total_processed:,d} rows in constant memory...")

            print(f"✅ Stream completed: Processed {total_processed:,d} total records.")

stream_massive_dataset()
```

---

## Code Explanation

In Example 4 (`cursor.copy()`):
1. PostgreSQL provides the **`COPY` command**, which bypasses the SQL parser and query planner, streaming raw data directly into the database engine's table heap storage.
2. In Psycopg 3, `with cur.copy(...) as copy: copy.write(data)` streams data across the network socket.
3. Loading 100,000 rows via standard `INSERT` takes **~8.0 seconds**; using `cur.copy()` loads all 100,000 rows in **under 0.25 seconds (30x speedup!)**.

---

## Common Mistakes

### Mistake 1: Opening New Connections Inside Web Handlers
Creating a new `psycopg.connect()` inside every web route (FastAPI / Flask) destroys server performance and exhausts PostgreSQL's `max_connections` limit. Always use `psycopg_pool.ConnectionPool`.

### Mistake 2: Forgetting `conn.commit()`
In Psycopg 3, connections operate inside an **explicit transaction block by default**. Executing `INSERT` or `UPDATE` statements without calling `conn.commit()` will silently roll back all changes when the connection closes!

---

## Best Practices

### Store Database Credentials in Environment Variables
Never hardcode passwords or connection strings in source code. Use standard environment variables (`DATABASE_URL`, `PGPASSWORD`, `PGHOST`).

Good:
```python
import os
DB_URI = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
```

---

## Performance Considerations

1. **Connection Pool Sizing**: As a general rule for web servers, set connection pool `max_size` to:
   $$\text{Max Pool Size} = (\text{CPU Cores} \times 2) + \text{Disk Spindle Count}$$
   For a 4-core server, a pool size of **10 to 12 connections** provides maximum throughput without CPU context-switch thrashing.
2. **Server-Side Cursor Iteration**: Set `cursor.itersize = 2000` to balance network packet roundtrips with client memory buffers.

---

## Security Considerations

1. **Enforce SSL/TLS Encryption**: In production cloud environments (AWS RDS, Google Cloud SQL), always append `?sslmode=require` or `?sslmode=verify-full` to your connection string to encrypt database traffic over the network.
2. **Role-Based Database Privileges**: Application microservices should connect using dedicated PostgreSQL users with minimal required privileges (`GRANT SELECT, INSERT ON ...`), never the `postgres` superuser.

---

## Real-World Usage

- **FastAPI / Starlette Web Backends**: Managing database connection pools across asynchronous worker processes.
- **Data Engineering ETL**: Using `cursor.copy()` to ingest gigabytes of data into PostgreSQL data warehouses.
- **Multi-Tenant SaaS**: Querying tenant-specific configurations stored in indexed `JSONB` columns.

---

## Comparison: Python PostgreSQL Drivers

| Feature | `psycopg` (Psycopg 3) | `psycopg2` | `asyncpg` |
|---|---|---|---|
| **Python Version** | **Python 3.8+** | Python 2.7–3.10 | Python 3.8+ |
| **AsyncIO Support** | **Native (`AsyncConnection`)**| Limited / None | **Native (Fastest Async)** |
| **Connection Pooling** | **Built-in (`psycopg_pool`)**| Third-party | Built-in |
| **Type Hints** | **100% Typed** | ❌ Untyped | ❌ Untyped |
| **Binary Protocol** | **Yes** | Partial | **Yes** |

---

## Advanced Concepts: Asynchronous Queries with `AsyncConnection`

Psycopg 3 provides native asynchronous database execution for high-concurrency AsyncIO web frameworks:

```python
import asyncio
import psycopg
from psycopg.rows import dict_row

async def main():
    async with await psycopg.AsyncConnection.connect(DB_URI, row_factory=dict_row) as aconn:
        async with aconn.cursor() as acur:
            await acur.execute("SELECT username, email FROM users WHERE is_active = %s", (True,))
            rows = await acur.fetchall()
            print("Async Fetched Users:", rows)

# asyncio.run(main())
```

---

## Exercises

### Exercise 1 — Beginner
Write a Python script using Psycopg 3 that connects to a local PostgreSQL instance, creates an `inventory` table (`sku`, `quantity`, `price`), inserts 3 items, and queries items with `quantity < 10`.

### Exercise 2 — Intermediate
Create a `UserPreferencesManager` using `psycopg_pool.ConnectionPool` that stores and updates user settings inside a PostgreSQL `JSONB` column. Write queries that filter users based on a nested JSON property.

### Exercise 3 — Advanced
Build a high-speed data migration pipeline using `cursor.copy()` and a server-side cursor that streams 100,000 rows from an existing table, transforms values, and bulk-inserts them into an archive table in constant memory.

---

## Mini Project: Enterprise PostgreSQL Audit Logging & High-Speed Bulk Ingestion Engine

### Requirements
Build an operational audit logging and analytics pipeline named `postgres_audit_pipeline.py`. Implement connection pooling with `psycopg_pool`, native UUID and JSONB serialization, high-speed bulk ingestion with `cursor.copy()`, and server-side cursor streaming.

### Implementation Blueprint
```python
import io
import json
import uuid
from datetime import datetime, timezone
from typing import Final

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

# =====================================================================
# 1. DATABASE CONFIGURATION & CONNECTION POOL
# =====================================================================

DB_URI: Final[str] = "postgresql://postgres:postgres@localhost:5432/enterprise_db"

class PostgresAuditPipeline:
    def __init__(self, conn_uri: str = DB_URI):
        self.pool = ConnectionPool(
            conninfo=conn_uri,
            min_size=2,
            max_size=8,
            kwargs={"row_factory": dict_row}
        )
        self._init_schema()

    def _init_schema(self):
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                # 1. Audit Log Table with UUID and JSONB
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS security_audit_logs (
                        event_id UUID PRIMARY KEY,
                        severity TEXT NOT NULL,
                        service_name TEXT NOT NULL,
                        metadata JSONB NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL
                    )
                """)
            conn.commit()

    def record_security_event(self, severity: str, service: str, metadata: dict):
        """Inserts structured security event using UUID and JSONB."""
        event_id = uuid.uuid4()
        now_utc = datetime.now(timezone.utc)

        with self.pool.connection() as conn:
            conn.execute("""
                INSERT INTO security_audit_logs (event_id, severity, service_name, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (event_id, severity, service, Jsonb(metadata), now_utc))
            conn.commit()
            print(f"🔒 [EVENT PERSISTED] #{event_id} ({severity}) from {service}")

    def bulk_ingest_historical_events(self, events: list[tuple[str, str, str, str, str]]):
        """High-speed binary CSV COPY ingestion."""
        csv_buffer = io.StringIO()
        for ev_id, sev, srv, meta_json, ts in events:
            csv_buffer.write(f"{ev_id}\t{sev}\t{srv}\t{meta_json}\t{ts}\n")
        csv_buffer.seek(0)

        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                with cur.copy(
                    "COPY security_audit_logs (event_id, severity, service_name, metadata, created_at) FROM STDIN"
                ) as copy:
                    copy.write(csv_buffer.read())
            conn.commit()
            print(f"🚀 [BULK INGEST] Successfully streamed {len(events):,d} historical events via COPY.")

    def stream_high_severity_events(self):
        """Streams events in constant memory using Server-Side Cursors."""
        print("\n" + "=" * 68)
        print("         STREAMING HIGH SEVERITY SECURITY EVENTS")
        print("=" * 68)
        
        with self.pool.connection() as conn:
            # Named cursor = Server-Side Streaming Cursor!
            with conn.cursor(name="security_stream_cursor") as stream_cur:
                stream_cur.itersize = 1000
                stream_cur.execute("""
                    SELECT event_id, severity, service_name, metadata, created_at
                    FROM security_audit_logs
                    WHERE severity IN ('CRITICAL', 'WARNING')
                    ORDER BY created_at DESC
                """)

                for row in stream_cur:
                    meta = row["metadata"]
                    print(f"  🚨 [{row['severity']}] {row['service_name']} │ IP: {meta.get('ip', 'N/A')} │ Details: {meta.get('action', 'N/A')}")
        print("=" * 68)

    def close(self):
        self.pool.close()

if __name__ == "__main__":
    pipeline = PostgresAuditPipeline()
    
    # 1. Single JSONB Event Record
    pipeline.record_security_event(
        severity="CRITICAL",
        service="AuthGateway",
        metadata={"ip": "192.168.1.104", "action": "BRUTE_FORCE_LOCKOUT", "attempts": 5}
    )
    
    # 2. Bulk Ingestion Batch Simulation
    now_str = datetime.now(timezone.utc).isoformat()
    mock_batch = [
        (str(uuid.uuid4()), "WARNING", "PaymentWorker", json.dumps({"ip": "10.0.1.5", "action": "STRIPE_TIMEOUT"}), now_str),
        (str(uuid.uuid4()), "INFO", "MetricsEmitter", json.dumps({"ip": "10.0.1.20", "action": "HEARTBEAT"}), now_str),
    ]
    pipeline.bulk_ingest_historical_events(mock_batch)
    
    # 3. Stream Filtered Events
    pipeline.stream_high_severity_events()
    pipeline.close()
```

---

## Summary

In this lesson, you mastered PostgreSQL and Psycopg 3:
- **`psycopg` (Psycopg 3)** provides modern type hints, connection pooling, and binary protocol support for PostgreSQL.
- Always use **`psycopg_pool.ConnectionPool`** to eliminate connection latency and manage database socket lifecycles.
- Use **`%s` parameter substitution** to guarantee 100% protection against SQL Injection.
- Use **Server-Side Cursors (`conn.cursor(name="...")`)** to stream millions of rows in **constant $O(1)$ memory**.
- Leverage PostgreSQL's native **JSONB** format for structured schemaless document storage.
- Use **`cursor.copy()`** for ultra-fast bulk data ingestion at native wire speed.

---

## Best Practices Checklist

- [ ] Use `psycopg_pool.ConnectionPool` in all web and multi-threaded applications.
- [ ] Explicitly commit transactions using `conn.commit()`.
- [ ] Use `cursor.copy()` instead of batch `INSERT` statements for large data ingestion.
- [ ] Use server-side named cursors when querying large datasets.
- [ ] Set `row_factory=dict_row` for clean dictionary column access.

---

## What's Next?

Now that you understand client-server database architecture and Psycopg 3, continue to the final article in this module:
👉 **[SQLAlchemy 2.0 & Declarative ORM](sqlalchemy-orm-basics.md)** to master type-safe declarative data modeling, relationships, and the Unit-of-Work Session pattern!
