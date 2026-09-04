# 🌐 Module 5: Modern Enterprise Web Frameworks (FastAPI & Django)

Welcome to the **Modern Enterprise Web Frameworks** module in Level 3.

In Python enterprise backend engineering, two frameworks dominate production architectures:
1. **FastAPI**: The modern, high-performance ASGI framework built on **Starlette** and **Pydantic V2**. Designed for building microservices, real-time APIs, and AI inference gateways with automated OpenAPI documentation and dependency injection.
2. **Django**: The battle-tested, "batteries-included" web framework powering massive platforms like Instagram, Spotify, and Pinterest. Known for its Model-Template-View (MTV) architecture, robust ORM, admin dashboard, and enterprise security protections.

---

## 🎯 Module Overview

In this module, you will master:
- **FastAPI Deep Dive**: ASGI asynchronous server specification, Pydantic V2 Rust-core validation, the composable Dependency Injection (`Depends`) system, background tasks, and WebSocket streaming.
- **Django Architecture & ORM Optimization**: The MTV design pattern, Django ORM internals (query evaluation lifecycle), query optimization with `select_related` and `prefetch_related`, middleware pipelines, and transaction atomicity.

---

## 📑 Articles in this Module

1. **[FastAPI Deep Dive: ASGI, Pydantic & Dependency Injection](fastapi-deep-dive.md)**
   - ASGI vs WSGI, Pydantic V2 core validation, composable dependency injection with `Depends()`, middleware pipelines, background tasks, and testing with `httpx.ASGITransport`.
2. **[Django Architecture & Enterprise ORM Optimization](django-architecture-orm.md)**
   - MTV pattern, Django ORM query compilation, eliminating N+1 query bottlenecks with `select_related` & `prefetch_related`, database routers, atomic transactions (`transaction.atomic()`), and custom middleware.

---

## 🗺️ Progression Path

```
fastapi-deep-dive.md ──► django-architecture-orm.md
                                │
                                ▼
         [Next Module: Application Security](../security/README.md)
```
