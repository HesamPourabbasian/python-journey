# Modern API Consumption with HTTPX & Async HTTP in Python

## Introduction

For over a decade, `requests` has been the gold standard HTTP client in Python. However, modern cloud applications, microservice architectures, and web frameworks (such as **FastAPI**) are fundamentally built on asynchronous concurrency (**AsyncIO**).

The classic `requests` library suffers from two major limitations in modern systems:
1. **Strictly Synchronous / Blocking**: When `requests.get()` runs, it completely blocks the Python thread until the remote server responds. Querying 10 external microservices sequentially will take $10 \times \text{network latency}$ (e.g. 5 seconds total).
2. **No HTTP/2 Support**: `requests` is limited to HTTP/1.1 and cannot leverage modern **HTTP/2 Multiplexing** (sending multiple requests concurrently over a single TCP socket).

To provide a modern, next-generation HTTP client, the Python community created **`httpx`**.

`httpx` provides:
- **Dual Synchronous & Asynchronous APIs**: Near 100% compatibility with `requests` (`httpx.Client`), plus first-class AsyncIO support (`httpx.AsyncClient`).
- **HTTP/2 Support**: Native multiplexing over single TCP connections (`http2=True`).
- **Concurrent API Aggregation**: Querying dozens of microservices concurrently in milliseconds using `asyncio.gather()`.
- **In-Memory ASGI/WSGI Direct Testing**: Testing FastAPI and Flask applications directly in memory with **`ASGITransport`** with zero network socket overhead.

This lesson explores `httpx`, synchronous vs asynchronous clients, HTTP/2 wire protocol benefits, fine-grained timeouts, event hooks, and concurrent microservice aggregation.

---

## Prerequisites

Before studying HTTPX, ensure you have:

- Completed [HTTP Fundamentals & The Requests Library](http-fundamentals-and-requests.md).
- Completed [Defining Functions](../../beginner/functions/defining-functions.md).
- Basic familiarity with Python `async` / `await` syntax.

---

## Core Concept: Synchronous Blocking vs Asynchronous HTTP

```
                    SYNCHRONOUS (requests) vs ASYNCHRONOUS CONCURRENT (httpx)

       SYNCHRONOUS (Sequential Blocking): Total Time = 200ms + 300ms + 250ms = 750ms!
       Thread: ──[ API 1 (200ms) ]──►──[ API 2 (300ms) ]──►──[ API 3 (250ms) ]──► (Slow)

       ASYNCHRONOUS CONCURRENT (httpx.AsyncClient): Total Time = 300ms! (Slowest Single Call)
       Task 1: ──[ API 1 (200ms) ]──►
       Task 2: ──[ API 2 (300ms) ]──────────► ═══ (Concurrent Event Loop) ═══► (3x FASTER!)
       Task 3: ──[ API 3 (250ms) ]─────►
```

---

## Syntax & Essential HTTPX Patterns

```python
import httpx
import asyncio

# 1. Modern Synchronous Client (Drop-in replacement for requests)
with httpx.Client(timeout=5.0) as client:
    resp = client.get("https://httpbin.org/json")
    print("Sync Status:", resp.status_code)

# 2. Modern Asynchronous Client (AsyncIO)
async def fetch_user_data():
    # Configure granular timeouts and connection limits
    timeout_cfg = httpx.Timeout(connect=3.0, read=10.0, write=5.0, pool=5.0)
    limits_cfg = httpx.Limits(max_connections=100, max_keepalive_connections=20)

    async with httpx.AsyncClient(timeout=timeout_cfg, limits=limits_cfg, http2=True) as async_client:
        response = await async_client.get("https://httpbin.org/get", params={"role": "admin"})
        response.raise_for_status()
        data = response.json()
        print("Async Fetched Params:", data["args"])

# Run async routine
# asyncio.run(fetch_user_data())
```

---

## Detailed Explanation

### 1. HTTP/2 Multiplexing: Eliminating Head-of-Line Blocking

In HTTP/1.1 (used by `requests`), every concurrent request requires an independent TCP socket. Browsers and servers limit concurrent sockets (typically 6 per domain), causing requests to queue up (**Head-of-Line Blocking**).

In **HTTP/2** (supported natively by `httpx` via `http2=True`):
- Multiple bidirectional request and response streams are multiplexed simultaneously over a **single persistent TCP connection**.
- HTTP header compression (**HPACK**) significantly reduces network bandwidth.
- Latency is dramatically reduced when sending bursts of API calls to the same host.

```python
# Enabling HTTP/2 in HTTPX:
async with httpx.AsyncClient(http2=True) as client:
    resp = await client.get("https://api.github.com")
    print("HTTP Version:", resp.http_version) # "HTTP/2"
```

---

### 2. Concurrent Multi-Service Aggregation with `asyncio.gather`

In microservice architectures, an API Gateway endpoint frequently needs to aggregate data from multiple independent backends (User Profile, Billing, Notifications, Order History).

Using `httpx.AsyncClient` with `asyncio.gather()`, all backend calls execute **concurrently**, reducing total latency to the duration of the single slowest service:

```python
import asyncio
import httpx

async def fetch_endpoint(client: httpx.AsyncClient, name: str, url: str) -> dict:
    resp = await client.get(url)
    resp.raise_for_status()
    return {"service": name, "data": resp.json()}

async def aggregate_microservices():
    async with httpx.AsyncClient(timeout=5.0) as client:
        # Launch 3 requests concurrently!
        tasks = [
            fetch_endpoint(client, "ProfileService", "https://httpbin.org/delay/1"),
            fetch_endpoint(client, "BillingService", "https://httpbin.org/delay/1"),
            fetch_endpoint(client, "InventoryService", "https://httpbin.org/delay/1"),
        ]
        # Total time is ~1 second, NOT 3 seconds!
        results = await asyncio.gather(*tasks)
        return results

# asyncio.run(aggregate_microservices())
```

---

### 3. Event Hooks for Centralized Telemetry & Metrics

HTTPX supports **Event Hooks**, allowing you to register callback functions that execute automatically before every request is sent and after every response is received:

```python
import httpx

def log_request_event(request: httpx.Request):
    print(f"📡 [OUTGOING HTTP] {request.method} -> {request.url}")

def log_response_event(response: httpx.Response):
    print(f"📥 [INCOMING HTTP] Status {response.status_code} from {response.url}")

with httpx.Client(event_hooks={"request": [log_request_event], "response": [log_response_event]}) as client:
    client.get("https://httpbin.org/status/200")
```

---

## Examples

### 1. Simple: Synchronous JSON API Consumption with HTTPX
Querying endpoints, setting custom headers, and extracting JSON responses cleanly.

```python
import httpx

def get_crypto_ticker(symbol: str) -> dict:
    url = f"https://httpbin.org/get"
    headers = {"User-Agent": "CryptoTracker/1.0"}
    
    with httpx.Client(headers=headers, timeout=3.0) as client:
        response = client.get(url, params={"symbol": symbol, "currency": "USD"})
        response.raise_for_status()
        return response.json()

data = get_crypto_ticker("BTC")
print("Queried Symbol Parameters:", data.get("args"))
```

### 2. Beginner: Basic Asynchronous API Request with `async/await`
Writing a clean asynchronous API query routine using `httpx.AsyncClient`.

```python
import asyncio
import httpx

async def fetch_github_release_tag(repo: str) -> str:
    url = f"https://httpbin.org/get"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url, params={"repo": repo})
        resp.raise_for_status()
        return f"Repo: {repo} (Status: {resp.status_code})"

async def main():
    result = await fetch_github_release_tag("encode/httpx")
    print(result)

# asyncio.run(main())
```

### 3. Intermediate: High-Throughput Concurrent Webhook Dispatcher
Dispatching 10 webhooks concurrently to multiple endpoints using `asyncio.as_completed`.

```python
import asyncio
import httpx
import time

WEBHOOK_URLS = [
    f"https://httpbin.org/status/{code}" for code in [200, 201, 200, 204, 200]
]

async def send_webhook(client: httpx.AsyncClient, url: str) -> dict:
    start_t = time.perf_counter()
    try:
        resp = await client.post(url, json={"event": "USER_SIGNUP"}, timeout=4.0)
        ms = (time.perf_counter() - start_t) * 1000.0
        return {"url": url, "status": resp.status_code, "latency_ms": round(ms, 2)}
    except httpx.HTTPError as err:
        return {"url": url, "status": "FAILED", "error": str(err)}

async def dispatch_all_webhooks():
    limits = httpx.Limits(max_connections=20, max_keepalive_connections=10)
    
    async with httpx.AsyncClient(limits=limits) as client:
        tasks = [send_webhook(client, url) for url in WEBHOOK_URLS]
        
        print("Dispatching Webhooks Concurrently:")
        print("-" * 55)
        # Process results as they complete!
        for coro in asyncio.as_completed(tasks):
            result = await coro
            print(f"  Webhook: {result['url']:<32} │ Status: {result['status']} ({result.get('latency_ms', 0)} ms)")

# asyncio.run(dispatch_all_webhooks())
```

### 4. Real-World: Resilient Async API Gateway Client with Rate-Limit Handling
Building a production-grade asynchronous API client that inspects headers for rate limiting (`Retry-After`) and handles automatic backoff.

```python
import asyncio
import httpx
import time

class ResilientAsyncGatewayClient:
    def __init__(self, base_url: str, bearer_token: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {bearer_token}",
            "Accept": "application/json",
            "User-Agent": "EnterpriseAsyncGateway/2.0"
        }
        self.timeout = httpx.Timeout(connect=3.0, read=8.0, write=3.0, pool=5.0)

    async def get_resource(self, endpoint: str, max_retries: int = 3) -> dict:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with httpx.AsyncClient(headers=self.headers, timeout=self.timeout, http2=True) as client:
            for attempt in range(1, max_retries + 1):
                try:
                    resp = await client.get(url)
                    
                    # Handle Rate Limiting (429)
                    if resp.status_code == 429:
                        retry_after = float(resp.headers.get("Retry-After", 1.0))
                        print(f"⚠️ [429 RATE LIMITED] Sleeping for {retry_after}s...")
                        await asyncio.sleep(retry_after)
                        continue

                    resp.raise_for_status()
                    return resp.json()
                except httpx.HTTPStatusError as http_err:
                    if attempt == max_retries: raise
                    print(f"  [RETRY {attempt}] HTTP Error {http_err.response.status_code}. Retrying...")
                    await asyncio.sleep(0.5 * attempt)
                except httpx.RequestError as net_err:
                    if attempt == max_retries: raise
                    print(f"  [RETRY {attempt}] Network Error: {net_err}. Retrying...")
                    await asyncio.sleep(0.5 * attempt)

        raise RuntimeError("Max retries exceeded.")
```

### 5. Advanced: In-Memory Testing of ASGI Applications (FastAPI / Starlette)
Testing a FastAPI application in memory without starting a live Uvicorn web server or opening physical network sockets!

```python
import httpx
import asyncio

# Simulated ASGI Application (FastAPI / Starlette)
async def mock_asgi_app(scope, receive, send):
    assert scope["type"] == "http"
    response_body = b'{"status": "ONLINE", "version": "2.4.0"}'
    
    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": [[b"content-type", b"application/json"]],
    })
    await send({
        "type": "http.response.body",
        "body": response_body,
    })

async def test_in_memory_asgi_app():
    # ASGITransport bypasses the network completely and calls the Python ASGI callable directly!
    transport = httpx.ASGITransport(app=mock_asgi_app)
    
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/health")
        print("In-Memory ASGI Test Response:", response.status_code, "->", response.json())
        assert response.status_code == 200
        assert response.json()["status"] == "ONLINE"
        print("✅ In-Memory ASGI Test Passed in 0.001 seconds!")

# asyncio.run(test_in_memory_asgi_app())
```

---

## Code Explanation

In Example 5 (`ASGITransport`):
1. In traditional testing, running integration tests against web APIs requires starting an external server process (Uvicorn), binding to a port (`localhost:8000`), executing tests over TCP, and tearing down the server.
2. **`httpx.ASGITransport(app=app)`** executes the ASGI specification directly in-memory within the test runner process.
3. Network sockets, OS port conflicts, and TCP handshakes are completely eliminated.
4. This is the exact mechanism used by **FastAPI's `TestClient`** (which is built directly on top of HTTPX).

---

## Common Mistakes

### Mistake 1: Forgetting `await` on Async Client Calls
Writing `resp = client.get(url)` instead of `resp = await client.get(url)` inside an `async def` function creates an un-executed coroutine object and triggers `RuntimeWarning: coroutine 'AsyncClient.get' was never awaited`.

### Mistake 2: Re-Instantiating `AsyncClient` Inside Concurrent Loops
Writing `async with httpx.AsyncClient() as client:` inside a loop creates a new connection pool for every single request, destroying concurrency gains. Always instantiate a single `AsyncClient` outside the loop and share it across tasks.

---

## Best Practices

### Configure Granular `httpx.Timeout`
Always configure explicit connection, read, write, and pool timeouts rather than relying on defaults.

Good:
```python
timeout = httpx.Timeout(connect=3.0, read=10.0, write=5.0, pool=5.0)
client = httpx.Client(timeout=timeout)
```

---

## Performance Considerations

| Metric | Synchronous `requests` (Sequential) | `httpx.AsyncClient` (Concurrent) |
|---|---|---|
| **Querying 10 Microservices**| **~2,500 ms** | **~250 ms (10x Faster!)** |
| **HTTP Protocol** | HTTP/1.1 (Multi-socket) | **HTTP/2 (Multiplexed single-socket)**|
| **Memory Testing** | Requires live port & server | **Instant in-memory `ASGITransport`** |

---

## Security Considerations

1. **Strict Connection Pool Limits**: Set `httpx.Limits(max_connections=100)` to prevent unbounded concurrent tasks from exhausting available operating system file descriptors (`ulimit -n`).
2. **Never Disable TLS Verification**: Keep `verify=True` in all production client instances.

---

## Real-World Usage

- **FastAPI Microservices**: Dispatching downstream async API requests to payment and authentication backends.
- **AsyncIO Web Crawlers**: Scraping hundreds of pages per second with non-blocking concurrency.
- **FastAPI / Starlette Integration Tests**: Executing test suites with `httpx.AsyncClient(transport=ASGITransport(app=app))`.

---

## Comparison: Python HTTP Client Capabilities

| Feature | `requests` | `httpx` | `aiohttp` |
|---|---|---|---|
| **Synchronous API** | **Standard** | **Standard** | ❌ No |
| **Asynchronous API**| ❌ No | **Standard (`AsyncClient`)**| **Standard** |
| **HTTP/2 Support** | ❌ No | **✅ Yes (`http2=True`)** | ❌ No |
| **Type Hints** | Partial | **100% Typed** | Partial |
| **ASGI/WSGI Mocking**| ❌ No | **✅ Yes (`ASGITransport`)** | ❌ No |

---

## Advanced Concepts: Custom Transports with `httpx.BaseTransport`

You can implement custom transport layers to build custom offline caching proxies or mock response generators:

```python
import httpx

class MockOfflineTransport(httpx.BaseTransport):
    def handle_request(self, request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code=200, json={"mock": "data", "url": str(request.url)})

client = httpx.Client(transport=MockOfflineTransport())
resp = client.get("https://any-external-api.com/v1/test")
print("Mock Transport Result:", resp.json())
```

---

## Exercises

### Exercise 1 — Beginner
Write an asynchronous function `fetch_weather(city: str) -> dict` using `httpx.AsyncClient` that queries `https://httpbin.org/get` with `params={"city": city}` and prints the result.

### Exercise 2 — Intermediate
Using `httpx.AsyncClient` and `asyncio.gather()`, write a function `benchmark_concurrent_pings(urls: list[str])` that queries 5 URLs concurrently, measures total execution latency, and prints the fastest responding URL.

### Exercise 3 — Advanced
Build a `RateLimitedAsyncSession` class that uses an `asyncio.Semaphore(5)` to limit maximum concurrent in-flight HTTP requests to 5, preventing client-side network saturation.

---

## Mini Project: Enterprise Asynchronous Multi-Provider Market Data Aggregator

### Requirements
Build an operational financial telemetry aggregator named `async_market_aggregator.py`. Concurrently query multiple mock cryptocurrency exchange endpoints using `httpx.AsyncClient`, `asyncio.gather()`, HTTP/2 multiplexing, custom telemetry logging event hooks, and compute median market asset prices.

### Implementation Blueprint
```python
import asyncio
import httpx
import statistics
import time
from dataclasses import dataclass
from datetime import datetime, timezone

# =====================================================================
# 1. TELEMETRY EVENT HOOKS
# =====================================================================

def request_logger_hook(request: httpx.Request):
    print(f"📡 [OUTGOING REQUEST] {request.method} -> {request.url}")

def response_logger_hook(response: httpx.Response):
    print(f"📥 [RESPONSE RECEIVED] HTTP {response.status_code} from {response.url.host}")

# =====================================================================
# 2. CONCURRENT MARKET DATA AGGREGATOR
# =====================================================================

@dataclass
class MarketQuote:
    provider: str
    symbol: str
    price_usd: float
    latency_ms: float

class AsyncMarketAggregator:
    # Simulated Multi-Exchange Endpoints
    EXCHANGE_ENDPOINTS = {
        "BinanceMock": "https://httpbin.org/get?exchange=binance&price=65420.50",
        "CoinbaseMock": "https://httpbin.org/get?exchange=coinbase&price=65435.00",
        "KrakenMock": "https://httpbin.org/get?exchange=kraken&price=65415.25",
        "BitstampMock": "https://httpbin.org/get?exchange=bitstamp&price=65428.00"
    }

    def __init__(self):
        self.timeout = httpx.Timeout(connect=3.0, read=6.0, write=3.0, pool=5.0)
        self.limits = httpx.Limits(max_connections=20, max_keepalive_connections=10)

    async def fetch_provider_quote(self, client: httpx.AsyncClient, provider: str, url: str) -> MarketQuote:
        start_t = time.perf_counter()
        resp = await client.get(url)
        resp.raise_for_status()
        ms = (time.perf_counter() - start_t) * 1000.0
        
        data = resp.json()
        raw_price = float(data["args"]["price"])
        
        return MarketQuote(
            provider=provider,
            symbol="BTC/USD",
            price_usd=raw_price,
            latency_ms=round(ms, 2)
        )

    async def aggregate_live_market(self) -> dict:
        print("=" * 68)
        print("      ENTERPRISE CONCURRENT ASYNC MARKET DATA AGGREGATOR")
        print("=" * 68)
        
        start_all = time.perf_counter()
        
        # Configure AsyncClient with Event Hooks and HTTP/2!
        async with httpx.AsyncClient(
            timeout=self.timeout,
            limits=self.limits,
            http2=True,
            event_hooks={"request": [request_logger_hook], "response": [response_logger_hook]}
        ) as client:
            
            # Launch all provider queries concurrently!
            tasks = [
                self.fetch_provider_quote(client, provider, url)
                for provider, url in self.EXCHANGE_ENDPOINTS.items()
            ]
            
            quotes: list[MarketQuote] = await asyncio.gather(*tasks)

        total_elapsed_ms = (time.perf_counter() - start_all) * 1000.0
        prices = [q.price_usd for q in quotes]
        median_price = statistics.median(prices)
        
        # Render Market Summary
        print("\n" + "-" * 68)
        print("📊 CONCURRENT EXCHANGE QUOTES (HTTP/2):")
        print("-" * 68)
        for q in quotes:
            print(f"  • {q.provider:<14} : ${q.price_usd:>10,.2f} │ Latency: {q.latency_ms:>6.2f} ms")
            
        print("-" * 68)
        print(f"  Consolidated Median Price : ${median_price:>10,.2f} USD")
        print(f"  Total Aggregation Latency : {total_elapsed_ms:>6.2f} ms (Concurrent execution!)")
        print("=" * 68)
        
        return {"median_price": median_price, "quotes": quotes}

if __name__ == "__main__":
    aggregator = AsyncMarketAggregator()
    asyncio.run(aggregator.aggregate_live_market())
```

---

## Summary

In this lesson, you mastered modern API consumption with HTTPX:
- **`httpx`** provides both **Synchronous (`httpx.Client`)** and **Asynchronous (`httpx.AsyncClient`)** HTTP clients with a unified, modern interface.
- Enable **HTTP/2 Multiplexing (`http2=True`)** to send concurrent streams over a single TCP socket.
- Aggregate multiple microservice calls concurrently using **`asyncio.gather()`**, reducing latency by up to **10x**.
- Configure granular timeouts with **`httpx.Timeout`** and connection pool boundaries with **`httpx.Limits`**.
- Register **Event Hooks** for centralized request/response logging, metrics, and security audits.
- Use **`httpx.ASGITransport`** to execute in-memory integration tests against FastAPI and Starlette apps in milliseconds without network sockets.

---

## Best Practices Checklist

- [ ] Use `httpx.AsyncClient` in all AsyncIO and FastAPI applications.
- [ ] Always wrap client lifecycles in `async with httpx.AsyncClient() as client:`.
- [ ] Configure `http2=True` on high-throughput microservice clients.
- [ ] Configure explicit `httpx.Timeout` and `httpx.Limits`.
- [ ] Use `httpx.ASGITransport` for ultra-fast in-memory web API unit tests.

---

## What's Next?

Now that you understand modern HTTP consumption, continue to the final article in this module:
👉 **[Building Production REST APIs with Flask](building-rest-apis-flask.md)** to master routing, JSON response serialization, error middleware, and modular Blueprints!
