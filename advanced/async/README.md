# 🌀 Module 4: Asynchronous Programming (AsyncIO) in Depth

Welcome to the **Asynchronous Programming (AsyncIO)** module in Level 3.

In modern cloud computing, microservice ecosystems, and real-time backend architectures, applications frequently handle tens of thousands of concurrent I/O connections—such as incoming HTTP web requests, real-time WebSockets, streaming database queries, and distributed cache lookups.

Allocating a separate operating system thread for each connection consumes megabytes of memory and burns CPU cycles on kernel context switching. **AsyncIO** solves this by running a high-speed, cooperative **Event Loop** inside a single thread, multiplexing thousands of non-blocking I/O connections using operating system primitives like `epoll` (Linux) and `kqueue` (macOS).

---

## 🎯 Module Overview

In this module, you will master:
- **Event Loops & Coroutines**: Coroutine mechanics, generator roots, `async`/`await`, `asyncio.run()`, and how cooperative multitasking eliminates OS context switching overhead.
- **Task Management & Structured Concurrency**: `asyncio.create_task()`, `asyncio.gather()`, Python 3.11+ **`asyncio.TaskGroup`**, task cancellation semantics, and `asyncio.timeout()`.
- **Asynchronous Iterators & Context Managers**: `__aiter__`, `__anext__`, `__aenter__`, `__aexit__`, async generators, and `contextlib.asynccontextmanager`.
- **Async Synchronization & Queues**: `asyncio.Queue`, `asyncio.Lock`, `asyncio.Semaphore`, `asyncio.Event`, and building scalable async Producer-Consumer pipelines.
- **Production Async Networking & Databases**: High-throughput asynchronous HTTP servers with `aiohttp`/`httpx`, and async relational databases with `asyncpg` and Async SQLAlchemy 2.0.

---

## 📑 Articles in this Module

1. **[AsyncIO Event Loop & Coroutines](asyncio-event-loop-coroutines.md)**
   - Coroutine objects, `async`/`await` syntax, generator roots (`yield from`), event loop lifecycle, non-blocking I/O multiplexing (`selectors`), and why blocking code freezes the event loop.
2. **[Tasks, Gathering & Structured Concurrency](tasks-gathering-and-timeouts.md)**
   - `asyncio.create_task()`, `asyncio.gather()`, Python 3.11+ `asyncio.TaskGroup` structured concurrency, exception groups (`ExceptionGroup`), task cancellation (`CancelledError`), and `asyncio.timeout()`.
3. **[Async Iterators, Generators & Context Managers](async-iterators-and-context-managers.md)**
   - `__aiter__` and `__anext__`, `async for` loops, async generators (`yield` in `async def`), `__aenter__` and `__aexit__`, and resource cleanup pipelines.
4. **[Async Queues & Synchronization Primitives](async-queues-and-synchronization.md)**
   - `asyncio.Queue` bounded buffers, `asyncio.Lock`, `asyncio.Semaphore` rate-limiting, `asyncio.Event` signaling, and building high-throughput async data ingestion pipelines.
5. **[High-Throughput Async HTTP & Databases](aiohttp-and-async-databases.md)**
   - Asynchronous HTTP servers with `aiohttp`, `httpx.AsyncClient` connection pooling, async PostgreSQL drivers with `asyncpg`, and Async SQLAlchemy 2.0.

---

## 🗺️ Progression Path

```
asyncio-event-loop-coroutines.md ──► tasks-gathering-and-timeouts.md ──► async-iterators-and-context-managers.md
                                                                                       │
                                                                                       ▼
aiohttp-and-async-databases.md ◄── async-queues-and-synchronization.md ◄────────────────
       │
       ▼
[Next Module: Modern Web Frameworks (FastAPI & Django)](../fastapi-django/README.md)
```
