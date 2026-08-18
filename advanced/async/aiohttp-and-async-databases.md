# High-Throughput Async HTTP & Databases in Python

## Introduction

In high-concurrency microservices, an application spends over 90% of its execution time waiting for network sockets: calling downstream REST APIs, querying relational database clusters, and fetching cached data from Redis.

If an application uses synchronous networking libraries (like **`requests`** or **`psycopg2`**):
- Every HTTP request and database query **completely blocks the operating system thread**.
- Inside an AsyncIO event loop, a single blocking `requests.get()` call freezes all thousands of other concurrent user connections on the server!

To achieve production-grade, non-blocking throughput, modern Python services rely on asynchronous networking and database stacks:
- **Asynchronous HTTP Clients (`httpx.AsyncClient` & `aiohttp.ClientSession`)**: Non-blocking HTTP/1.1 and HTTP/2 clients with persistent TCP Keep-Alive connection pooling.
- **High-Speed Async Database Drivers (`asyncpg`)**: The fastest relational database driver in Python, written in Cython with direct binary PostgreSQL protocol encoding.
- **Modern Async ORM with SQLAlchemy 2.0**: Type-safe declarative database mapping with **`AsyncSession`**, **`selectinload()`**, and asynchronous transaction management.

This lesson concludes **Module 4: Asynchronous Programming (AsyncIO) in Depth**, exploring connection pooling architectures, high-speed database queries, preventing the async ORM N+1 query disaster, and streaming query results.

---

## Prerequisites

Before studying async networking and databases, ensure you have:

- Completed [AsyncIO Event Loop & Coroutines](asyncio-event-loop-coroutines.md) and [Async Iterators & Context Managers](async-iterators-and-context-managers.md).
- Completed [Relational Databases & ORM](../../intermediate/databases/README.md) (SQLAlchemy & PostgreSQL fundamentals).
- Completed [Networking & REST APIs](../../intermediate/apis-and-networking/README.md).

---

## Core Concept: The Non-Blocking Async Network & Database Stack

```
                        PRODUCTION ASYNC MICROSERVICE ARCHITECTURE

                                Incoming HTTP Requests (FastAPI / ASGI)
                                                  │
                                                  ▼
     Single Process Event Loop ┌─────────────────────────────────────────────────────┐
                               │             AsyncIO Event Loop (Thread 1)           │
                               │  ┌─────────────────────────┐ ┌────────────────────┐ │
                               │  │ httpx.AsyncClient       │ │ asyncpg.Pool       │ │
                               │  │ Persistent TCP Pool     │ │ Async DB Pool      │ │
                               │  └────────────┬────────────┘ └─────────┬──────────┘ │
                               └───────────────┼────────────────────────┼────────────┘
                                               │                        │
                                               ▼                        ▼
                                     Downstream Microservices    PostgreSQL Cluster
```

---

## Syntax & Essential Async Networking Patterns

```python
import asyncio
import httpx

# 1. Asynchronous HTTP Requests with httpx.AsyncClient
async def fetch_api_data():
    # Persistent connection pool across requests!
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get("https://httpbin.org/json")
        data = response.json()
        print("Async HTTP Response Title:", data.get("slideshow", {}).get("title"))

# 2. Asynchronous PostgreSQL Queries with asyncpg (Conceptual Pattern)
async def asyncpg_pattern_demo():
    # Conceptual code: in production, install via: pip install asyncpg
    code_sample = """
    import asyncpg

    async def run_db():
        # Create asynchronous connection pool
        pool = await asyncpg.create_pool("postgresql://user:pass@localhost:5432/proddb", min_size=5, max_size=20)
        
        async with pool.acquire() as conn:
            # Parameterized query with binary speed!
            rows = await conn.fetch("SELECT id, username, email FROM users WHERE is_active = $1", True)
            for r in rows:
                print(r['username'], r['email'])
        
        await pool.close()
    """
    print("--- AsyncPG High-Speed Driver Pattern Loaded ---")

if __name__ == "__main__":
    # asyncio.run(fetch_api_data())
    asyncio.run(asyncpg_pattern_demo())
```

---

## Detailed Explanation

### 1. Why `requests` and `psycopg2` Freeze AsyncIO

- **`requests` & `urllib3`**: Use synchronous Python sockets. When `requests.get()` runs, it invokes the blocking OS `recv()` system call. The CPython thread goes to sleep waiting for bytes, **freezing the event loop**.
- **`httpx.AsyncClient` & `aiohttp`**: Use asynchronous sockets registered with the event loop's OS multiplexer (`epoll`/`kqueue`). When waiting for bytes, they suspend the coroutine via `await`, allowing thousands of other coroutines to execute in the interim.

---

### 2. The High-Speed Cython Architecture of `asyncpg`

In database benchmarks, **`asyncpg` is up to 5x faster than standard `psycopg2` / `psycopg3`**:
1. **Written in Cython**: Compiles directly into native C-code.
2. **Direct Binary Wire Protocol**: `asyncpg` bypasses the standard PostgreSQL `libpq` C-library, implementing the PostgreSQL Frontend/Backend binary wire protocol directly in Cython.
3. **Automatic Statement Preparation**: Automatically prepares and caches SQL execution plans on the PostgreSQL server.

---

### 3. Modern Async ORM with SQLAlchemy 2.0

SQLAlchemy 2.0 features first-class native support for AsyncIO via `sqlalchemy.ext.asyncio`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select

class Base(DeclarativeBase):
    pass

class UserModel(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str]

# 1. Create Async Engine using asyncpg or aiosqlite
# engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db", echo=False)
engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

# 2. Async Session Factory
AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
```

#### Eliminating the N+1 Query Disaster in Async ORMs:
In synchronous SQLAlchemy, accessing `user.orders` lazily executes a database query behind the scenes. In AsyncIO, **lazy loading is impossible because attribute access (`user.orders`) cannot be awaited!** Attempting to lazy-load raises `sqlalchemy.exc.MissingGreenlet`.

$$\textbf{Rule: In Async SQLAlchemy, ALWAYS eagerly load relationships using \texttt{selectinload()}!}$$

```python
from sqlalchemy.orm import selectinload
# Eagerly loads orders in a single optimized secondary query:
stmt = select(UserModel).options(selectinload(UserModel.orders))
```

---

## Examples

### 1. Simple: Concurrent HTTP Fan-Out with `httpx.AsyncClient`
Querying multiple simulated external API endpoints concurrently with persistent connection pooling.

```python
import asyncio
import time
from dataclasses import dataclass

@dataclass
class APIResponse:
    endpoint: str
    status_code: int
    data: dict
    latency_ms: float

async def mock_async_http_fetch(client_session_name: str, endpoint: str, latency_sec: float) -> APIResponse:
    t0 = time.perf_counter()
    # Simulates httpx.AsyncClient.get() non-blocking socket I/O
    await asyncio.sleep(latency_sec)
    elapsed = (time.perf_counter() - t0) * 1000.0
    return APIResponse(endpoint, 200, {"status": "SUCCESS", "source": endpoint}, round(elapsed, 1))

async def main():
    endpoints = [
        ("https://api.stripe.com/v1/customers", 0.12),
        ("https://api.github.com/user/repos",   0.08),
        ("https://api.openai.com/v1/models",    0.15),
    ]

    print("Executing Concurrent HTTP Fan-Out via Async Client Session...")
    t0 = time.perf_counter()
    
    # Query all endpoints concurrently
    responses = await asyncio.gather(*(mock_async_http_fetch("AsyncPool", u, lat) for u, lat in endpoints))
    
    total_time = (time.perf_counter() - t0) * 1000.0
    print("-" * 65)
    for r in responses:
        print(f"🌐 [{r.status_code}] {r.endpoint:<38} in {r.latency_ms:>5.1f} ms")
    print("-" * 65)
    print(f"🎉 Total Wall-Clock Time: {total_time:.1f} ms (Concurrent execution speedup!)")

asyncio.run(main())
```

### 2. Beginner: High-Speed Async PostgreSQL Simulation with `asyncpg` Pools
Demonstrating connection pool acquisition and parameterized query execution.

```python
import asyncio
from dataclasses import dataclass

@dataclass
class UserRecord:
    id: int
    username: str
    tier: str

class MockAsyncPGPool:
    """Simulates asyncpg.Pool connection lifecycle."""
    def __init__(self, min_size: int = 2, max_size: int = 5):
        self.min_size = min_size
        self.max_size = max_size
        self.active_conns = 0

    async def acquire(self):
        self.active_conns += 1
        return self

    async def __aenter__(self):
        await asyncio.sleep(0.01) # Simulates connection acquisition
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.active_conns -= 1

    async def fetch(self, query: str, *args) -> list[dict]:
        # Parameterized async database query
        await asyncio.sleep(0.04) # Non-blocking database query latency
        return [
            {"id": 101, "username": "hesam_lead", "tier": args[0]},
            {"id": 102, "username": "alice_dev",  "tier": args[0]},
        ]

async def query_active_users():
    pool = MockAsyncPGPool(min_size=2, max_size=10)
    
    print("Acquiring connection from asyncpg connection pool...")
    async with pool.acquire() as conn:
        # Parameterized query with $1 parameter placeholder (Prevents SQL Injection!)
        rows = await conn.fetch("SELECT id, username, tier FROM users WHERE tier = $1", "ENTERPRISE")
        print("Query Results Retrieved from AsyncPG:")
        for r in rows:
            print(f"  • #{r['id']} {r['username']:<14} (Tier: {r['tier']})")

asyncio.run(query_active_users())
```

### 3. Intermediate: Complete SQLAlchemy 2.0 Declarative Async CRUD Operations
Building a complete asynchronous database model, session manager, and CRUD engine using Async SQLAlchemy 2.0 with `aiosqlite`.

```python
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select, String

# 1. Declarative Base
class Base(DeclarativeBase):
    pass

# 2. Async Model
class ServerNode(Base):
    __tablename__ = "nodes"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    hostname: Mapped[str] = mapped_column(String(50), unique=True)
    ip_address: Mapped[str] = mapped_column(String(45))
    is_active: Mapped[bool] = mapped_column(default=True)

async def async_orm_demo():
    print("=" * 65)
    print("      SQLALCHEMY 2.0 ASYNCHRONOUS ORM ENGINE")
    print("=" * 65)

    # 1. Create Async Engine with in-memory SQLite (aiosqlite driver)
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    # 2. Create Async Session Factory
    AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    # 3. Create Tables Asynchronously
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Async Database Schema Initialized.")

    # 4. Insert Records Asynchronously
    async with AsyncSessionFactory() as session:
        async with session.begin():
            n1 = ServerNode(hostname="node-us-east-01", ip_address="10.0.1.10", is_active=True)
            n2 = ServerNode(hostname="node-eu-west-01", ip_address="10.0.2.20", is_active=True)
            session.add_all([n1, n2])
        print("💾 Inserted 2 ServerNode records asynchronously.")

    # 5. Query Records with 2.0 select() Syntax
    async with AsyncSessionFactory() as session:
        stmt = select(ServerNode).where(ServerNode.is_active == True)
        result = await session.execute(stmt)
        nodes = result.scalars().all()

        print("\n📊 Query Results from Async SQLAlchemy:")
        for node in nodes:
            print(f"  • #{node.id:<2} Host: {node.hostname:<18} IP: {node.ip_address}")

    await engine.dispose()
    print("=" * 65)

asyncio.run(async_orm_demo())
```

### 4. Real-World: High-Throughput API Gateway with Async DB Caching
Combining `httpx` async client fetching with local async cache persistence.

```python
import asyncio
import time

class MicroserviceGateway:
    def __init__(self):
        self._cache = {}

    async def get_user_profile(self, user_id: int) -> dict:
        # 1. Check local cache
        if user_id in self._cache:
            return {"source": "CACHE", **self._cache[user_id]}

        # 2. Async Cache-Miss: Fetch from remote auth service
        print(f"🌐 [NETWORK FETCH] Requesting profile for #{user_id} from Auth Microservice...")
        await asyncio.sleep(0.08)  # Simulate httpx.AsyncClient.get()
        profile_data = {"user_id": user_id, "username": f"user_{user_id}", "role": "OPERATOR"}

        # 3. Persist to async cache
        self._cache[user_id] = profile_data
        return {"source": "REMOTE_SERVICE", **profile_data}

async def gateway_demo():
    gateway = MicroserviceGateway()
    
    # 1. First Access (Cache Miss)
    res1 = await gateway.get_user_profile(101)
    print("First Access Result :", res1)

    # 2. Second Access (Instant Cache Hit!)
    res2 = await gateway.get_user_profile(101)
    print("Second Access Result:", res2)

asyncio.run(gateway_demo())
```

### 5. Advanced: Streaming Millions of Rows with Async Server-Side Cursors
Streaming large database query results lazily with `async for` in constant memory.

```python
import asyncio

async def mock_asyncpg_streaming_cursor(batch_size: int = 3, total_rows: int = 9):
    """Simulates asyncpg.connection.cursor() streaming server-side rows."""
    print(f"🗄️ [CURSOR OPENED] Streaming {total_rows} records in batches of {batch_size}...")
    
    current_id = 1
    while current_id <= total_rows:
        await asyncio.sleep(0.05)  # Fetch next wire packet from PostgreSQL
        for _ in range(batch_size):
            if current_id > total_rows: break
            yield {"record_id": current_id, "payload": f"TELEMETRY_ROW_{current_id:04d}"}
            current_id += 1

async def stream_large_dataset():
    print("Consuming Large Database Result Stream:")
    print("-" * 55)
    async for row in mock_asyncpg_streaming_cursor(batch_size=3, total_rows=6):
        print(f"  📥 [STREAMED ROW] #{row['record_id']} -> {row['payload']}")
    print("-" * 55)
    print("✅ Stream completed with constant O(1) RAM consumption.")

asyncio.run(stream_large_dataset())
```

---

## Code Explanation

In Example 3 (`SQLAlchemy 2.0 Async ORM`):
1. **`create_async_engine("sqlite+aiosqlite:///:memory:")`**: Creates an asynchronous engine connected via the `aiosqlite` async driver.
2. **`async_sessionmaker(..., class_=AsyncSession)`**: Generates an async session factory.
3. **`async with session.begin():`**: Automatically manages an asynchronous database transaction, committing upon block exit and rolling back if an exception occurs.
4. **`await session.execute(select(ServerNode))`**: Executes the 2.0 type-safe query asynchronously without blocking the event loop.
5. **`result.scalars().all()`**: Extracts the typed Python `ServerNode` model instances.

---

## Common Mistakes

### Mistake 1: Instantiating `httpx.AsyncClient()` on Every Single Request
Writing `async with httpx.AsyncClient() as client: await client.get(...)` inside every API handler.
Creating an `AsyncClient` opens a new TCP connection, performs TLS negotiation, and tears it down on every request. **Always create a single, shared `AsyncClient` across the application lifecycle to reuse connection pools.**

### Mistake 2: Missing Greenlet Error in Async SQLAlchemy
Attempting to access an unloaded relationship (e.g. `user.addresses`) outside an async query.
In AsyncIO, lazy loading cannot run synchronously. Always load relationships explicitly using **`options(selectinload(UserModel.addresses))`**.

---

## Best Practices

### Configure Connection Pool Limits Carefully
In high-throughput services with `asyncpg` or Async SQLAlchemy, configure pool bounds:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,       # Persistent pool connections
    max_overflow=10,    # Temporary surge connections
    pool_timeout=30.0,  # Max wait seconds for a connection
    pool_recycle=1800   # Recycle connections every 30 mins
)
```

---

## Performance Considerations

| Driver / Client | Concurrency Paradigm | Throughput (Req/Sec) | Latency |
|---|---|---|---|
| **`requests`** | Synchronous (Blocks Thread)| ~800 req/sec | High (Thread bound) |
| **`httpx.AsyncClient`**| **AsyncIO Non-Blocking** | **~8,500 req/sec** | **Low** |
| **`psycopg2`** | Synchronous PostgreSQL | ~4,200 queries/sec | Moderate |
| **`asyncpg`** | **Cython Binary Protocol** | **~26,000 queries/sec**| **Lowest** |

---

## Security Considerations

1. **SQL Injection Defense**: Always use parameterized queries (`$1, $2` in `asyncpg`, `:param` in SQLAlchemy). Never format strings into SQL queries (`f"SELECT * FROM users WHERE id = {user_id}"`).
2. **TLS/SSL Encryption**: Enforce `ssl='require'` on async database connection strings in production.

---

## Real-World Usage

- **FastAPI Microservices**: Backends with Async SQLAlchemy 2.0 and `asyncpg`.
- **E-Commerce Checkout Engines**: Aggregating payment gateways with `httpx.AsyncClient`.
- **High-Frequency Market Streaming**: Ingesting exchange WebSocket feeds with `aiohttp`.

---

## Comparison: Async HTTP & Database Tools

| Tool | Category | Key Advantage | Best Used For |
|---|---|---|---|
| **`httpx`** | HTTP Client | Type-safe, HTTP/2, sync & async APIs | Microservice API consumption |
| **`aiohttp`** | HTTP Client/Server| Extreme raw throughput | High-scale WebSocket servers |
| **`asyncpg`** | PostgreSQL Driver | **Fastest DB driver in Python** | High-performance raw SQL |
| **SQLAlchemy 2.0**| Async ORM | Declarative mapping, Migrations | Domain modeling & Enterprise apps |

---

## Advanced Concepts: Async Unit of Work & Savepoints

In Async SQLAlchemy, you can nest transaction savepoints for granular rollback recovery:

```python
async with session.begin():
    session.add(order)
    async with session.begin_nested(): # Database SAVEPOINT!
        try:
            session.add(risky_item)
        except Exception:
            pass # Rolls back to SAVEPOINT, preserving 'order'!
```

---

## Exercises

### Exercise 1 — Beginner
Use `httpx.AsyncClient` and `asyncio.gather()` to fetch data from 3 public test endpoints concurrently and print their HTTP status codes.

### Exercise 2 — Intermediate
Write an Async SQLAlchemy 2.0 script with an `Account` model, create tables with `aiosqlite`, insert 3 accounts, and query all accounts with balance $> 500$ using `select()`.

### Exercise 3 — Advanced
Build a `ResilientAsyncDatabaseClient` with connection retry logic, executing queries with an asyncpg pool and automatically reconnecting if a database connection drop occurs.

---

## Mini Project: Enterprise Production-Ready Async Microservice Data Aggregator & Database Engine

### Requirements
Build an operational async service engine named `async_service_aggregator.py`. Combine `httpx.AsyncClient` connection pooling to fetch third-party user data, persist records to an asynchronous in-memory SQLite database using Async SQLAlchemy 2.0, execute concurrent queries with `asyncio.TaskGroup`, and render an executive microservice latency and throughput report.

### Implementation Blueprint
```python
import asyncio
import time
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select, String, Float

# =====================================================================
# 1. ASYNC ORM DATABASE SCHEMA (SQLAlchemy 2.0)
# =====================================================================

class Base(DeclarativeBase):
    pass

class CustomerEntity(Base):
    __tablename__ = "customers"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_code: Mapped[str] = mapped_column(String(50), unique=True)
    full_name: Mapped[str] = mapped_column(String(100))
    account_balance: Mapped[float] = mapped_column(Float)

# =====================================================================
# 2. ASYNC MICROSERVICE AGGREGATOR ENGINE
# =====================================================================

class AsyncMicroserviceAggregator:
    def __init__(self, db_url: str = "sqlite+aiosqlite:///:memory:"):
        self.engine = create_async_engine(db_url, echo=False)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)

    async def initialize_database(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("🗄️ [DB READY] Asynchronous Database Schema Initialized.")

    async def simulate_external_crm_fetch(self, code: str) -> dict:
        """Simulates non-blocking HTTP fetch via httpx.AsyncClient."""
        await asyncio.sleep(0.06)  # Simulated network latency
        return {
            "code": code,
            "name": f"Enterprise Client {code}",
            "balance": round(1500.00 + (hash(code) % 5000), 2)
        }

    async def ingest_customer_record(self, code: str):
        # 1. Fetch from external CRM via Async HTTP
        crm_data = await self.simulate_external_crm_fetch(code)

        # 2. Persist to Async Database
        async with self.session_factory() as session:
            async with session.begin():
                customer = CustomerEntity(
                    customer_code=crm_data["code"],
                    full_name=crm_data["name"],
                    account_balance=crm_data["balance"]
                )
                session.add(customer)
        print(f"  📥 [INGESTED] {customer.customer_code:<12} -> {customer.full_name} (${customer.account_balance:,.2f})")

    async def query_high_value_customers(self, min_balance: float) -> list[CustomerEntity]:
        async with self.session_factory() as session:
            stmt = select(CustomerEntity).where(CustomerEntity.account_balance >= min_balance)
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def shutdown(self):
        await self.engine.dispose()
        print("🧹 [DISPOSED] Database connection pool closed.")

# =====================================================================
# 3. CONCURRENT WORKLOAD ORCHESTRATION
# =====================================================================

async def main():
    border = "=" * 70
    print(border)
    print("      ENTERPRISE ASYNC HTTP & DATABASE AGGREGATOR ENGINE")
    print(border)

    service = AsyncMicroserviceAggregator()
    await service.initialize_database()

    target_customers = [f"CUST-{i:04d}" for i in range(1, 6)]

    print(f"\nIngesting {len(target_customers)} Customer Records Concurrently via TaskGroup...")
    start_time = time.perf_counter()

    # Structured Concurrency: Ingest all records concurrently!
    async with asyncio.TaskGroup() as tg:
        for c_code in target_customers:
            tg.create_task(service.ingest_customer_record(c_code))

    ingest_time = (time.perf_counter() - start_time) * 1000.0
    print(f"\n✅ All records ingested in {ingest_time:.1f} ms.")

    # Query High Value Customers
    print("\nQuerying High-Value Accounts (Balance >= $3,000.00)...")
    vip_customers = await service.query_high_value_customers(min_balance=3000.0)

    print("-" * 70)
    print(f"{'ID':<4} {'CODE':<14} {'CLIENT NAME':<28} {'BALANCE (USD)':>18}")
    print("-" * 70)
    for c in vip_customers:
        print(f"#{c.id:<3} {c.customer_code:<14} {c.full_name:<28} ${c.account_balance:>17,.2f}")

    print("-" * 70)
    await service.shutdown()
    print(border)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Summary

In this lesson, you mastered high-throughput Async HTTP and Database engineering:
- **`httpx.AsyncClient`** and **`aiohttp`** provide non-blocking HTTP communication with persistent TCP connection pooling.
- **`asyncpg`** implements PostgreSQL's binary wire protocol directly in Cython, delivering up to **5x higher throughput** than synchronous drivers.
- **SQLAlchemy 2.0 Async** features type-safe declarative modeling with **`AsyncSession`** and **`select()`**.
- Prevent async ORM `MissingGreenlet` exceptions by eagerly loading relationships with **`selectinload()`**.
- Stream massive datasets with **Server-Side Async Cursors** to maintain strictly constant $O(1)$ RAM consumption.

---

## Best Practices Checklist

- [ ] Reuse a single `httpx.AsyncClient` instance across the entire application lifecycle.
- [ ] Use `asyncpg` for raw SQL PostgreSQL performance in AsyncIO.
- [ ] Use SQLAlchemy 2.0 `AsyncSession` with `expire_on_commit=False`.
- [ ] Always eagerly load ORM relationships using `selectinload()`.
- [ ] Configure connection pool sizing (`min_size`, `max_size`) to match server capacity.

---

## 🏆 MODULE 4: ASYNCHRONOUS PROGRAMMING (ASYNCIO) COMPLETE!

Congratulations! You have completed all 5 comprehensive articles of **Module 4: Asynchronous Programming (AsyncIO) in Depth**.

### What's Next?
Now advance to **Module 5: Modern Enterprise Web Frameworks (FastAPI & Django)**:
👉 **[FastAPI & Django Module Overview](../fastapi-django/README.md)** to master ASGI architecture, Pydantic V2 schemas, Django MTV patterns, and enterprise ORM optimizations!
