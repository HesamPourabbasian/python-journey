# 🌐 Module 8: Networking & REST APIs in Depth

Welcome to the **Networking & REST APIs** module in Level 2.

In modern software engineering, applications rarely operate as isolated monoliths. They communicate continuously across distributed computer networks: web frontends consume REST APIs, backend microservices exchange JSON payloads, and automated workers pull data from third-party cloud services.

To build, consume, and secure networked applications, Python provides an exceptional ecosystem of networking libraries and web frameworks.

---

## 🎯 Module Overview

In this module, you will master:
- The **HTTP Protocol**: Request/Response cycles, status codes (2xx, 3xx, 4xx, 5xx), HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), headers, authentication schemes (Basic, Bearer JWT, API Keys), and query parameters.
- Consuming REST APIs synchronously with standard library `urllib` and **`requests`**: session pooling, streaming downloads, retry policies, and error handling.
- Modern HTTP consumption with **`httpx`**: HTTP/2 support, connection pooling, and asynchronous HTTP client requests (`AsyncClient`).
- Building production RESTful APIs with **Flask**: routing, request body validation, JSON serialization, middleware error handlers, and REST architectural constraints.

---

## 📑 Articles in this Module

1. **[HTTP Fundamentals & The `requests` Library](http-fundamentals-and-requests.md)**
   - HTTP protocol anatomy, headers, status codes, query strings, `requests.Session` connection reuse, timeouts, custom authentication, and streaming file downloads.
2. **[Modern API Consumption with HTTPX & Async HTTP](httpx-and-api-consumption.md)**
   - `httpx` synchronous vs asynchronous clients (`AsyncClient`), HTTP/2 wire protocol, event hooks, connection pooling, and concurrent API aggregation with `asyncio.gather()`.
3. **[Building Production REST APIs with Flask](building-rest-apis-flask.md)**
   - REST architectural constraints, Flask application factory pattern, URL routing, request parsing, JSON responses (`jsonify`), error handling, JWT auth middleware, and Blueprint modularization.

---

## 🗺️ Progression Path

```
http-fundamentals-and-requests.md ──► httpx-and-api-consumption.md ──► building-rest-apis-flask.md
                                                                                  │
                                                                                  ▼
                                                 [Next Module: Testing & QA](../testing/README.md)
```
