# HTTP Fundamentals & The Requests Library in Python

## Introduction

In modern distributed computing, the **Hypertext Transfer Protocol (HTTP)** is the universal foundation of data exchange across the World Wide Web and microservice architectures. Whether your Python application is fetching machine learning datasets from cloud buckets, querying third-party REST APIs (like Stripe, GitHub, or OpenAI), or communicating across internal microservices, mastering HTTP mechanics is mandatory.

While Python provides a built-in networking module (`urllib.request`), its low-level, verbose API requires dozens of lines of boilerplate for basic tasks like sending JSON payloads, handling cookies, or managing authentication.

To provide an intuitive, elegant interface, the Python community universally relies on **`requests` ("HTTP for Humans")**.

With hundreds of millions of downloads monthly, `requests` simplifies HTTP client communication while supporting production-grade enterprise features: connection pooling via **`requests.Session`**, automatic JSON serialization/deserialization, granular connection timeouts, streaming chunked file downloads, and automated exponential-backoff retries.

This lesson explores the anatomy of the HTTP request/response cycle, the `requests` library, session socket reuse, error handling with `raise_for_status()`, and building secure, resilient API clients.

---

## Prerequisites

Before studying HTTP and `requests`, ensure you have:

- Completed [Exception Handling](../../beginner/exceptions/README.md).
- Completed [Working with JSON Files](../../beginner/file-handling/working-with-csv-json.md).
- Basic understanding of web client-server concepts.

---

## Core Concept: The HTTP Request / Response Cycle

```
                             THE HTTP PROTOCOL ANATOMY

          HTTP REQUEST                                        HTTP RESPONSE
    ┌───────────────────────────────────┐               ┌───────────────────────────────────┐
    │ POST /api/v1/checkout HTTP/1.1    │               │ HTTP/1.1 201 Created              │
    │ Host: api.stripe.com              │ ════════════► │ Content-Type: application/json    │
    │ Authorization: Bearer sk_live_... │               │ Content-Length: 142               │
    │ Content-Type: application/json    │               │ Date: Mon, 18 May 2024 ...        │
    │                                   │ ◄════════════ │                                   │
    │ { "amount": 1450.00, "curr": "USD"│               │ { "status": "APPROVED",           │
    │ }                                 │               │   "charge_id": "ch_9901" }        │
    └───────────────────────────────────┘               └───────────────────────────────────┘
      Method + Path + Headers + Body                      Status Code + Headers + Body
```

---

## Syntax & Essential `requests` Patterns

```python
import requests

# 1. Basic GET Request with Query Parameters and Timeout
response = requests.get(
    "https://api.github.com/users/octocat",
    params={"tab": "repositories"},
    headers={"Accept": "application/vnd.github.v3+json"},
    timeout=(3.0, 5.0)  # (Connect Timeout: 3s, Read Timeout: 5s) - MANDATORY!
)

# 2. Status Code Verification & JSON Deserialization
response.raise_for_status()  # Raises HTTPError if status code is 4xx or 5xx!
user_data = response.json()
print("GitHub User Name:", user_data.get("name"))

# 3. Authenticated POST Request with JSON Body
payload = {"title": "Critical Bug", "body": "Found issue in pipeline"}
auth_headers = {"Authorization": "Bearer token_secret_123"}

# 'json=' automatically serializes dict to JSON string AND sets 'Content-Type: application/json'!
post_resp = requests.post(
    "https://api.github.com/repos/owner/repo/issues",
    json=payload,
    headers=auth_headers,
    timeout=5.0
)

# 4. Connection Pooling with requests.Session (Keeps TCP Socket Alive!)
with requests.Session() as session:
    session.headers.update({"User-Agent": "EnterpriseApiClient/2.0"})
    r1 = session.get("https://api.github.com/rate_limit", timeout=3.0)
    r2 = session.get("https://api.github.com/emojis", timeout=3.0)
```

---

## Detailed Explanation

### 1. HTTP Status Code Taxonomy

HTTP status codes are standardized 3-digit integers categorized into 5 families:

- **`2xx` Success**: `200 OK` (Standard success), `201 Created` (Resource created), `204 No Content` (Success with empty body).
- **`3xx` Redirection**: `301 Moved Permanently`, `304 Not Modified` (Cache hit).
- **`4xx` Client Errors**: `400 Bad Request` (Malformed payload), `401 Unauthorized` (Missing/invalid auth token), `403 Forbidden` (Insufficient permissions), `404 Not Found`, `429 Too Many Requests` (Rate limited).
- **`5xx` Server Errors**: `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` (Server overloaded/down), `504 Gateway Timeout`.

---

### 2. The Golden Rule: ALWAYS Set Explicit Timeouts!

By default, **`requests` has NO timeout**. If a remote server hangs, stalls, or drops a socket connection without responding, **your Python process will hang forever**, freezing threads and consuming server resources indefinitely until the process is forcefully killed.

**Golden Rule**: **Always supply an explicit `timeout` argument on every single request**:

```python
# timeout=(connect_timeout, read_timeout) in seconds
response = requests.get("https://api.example.com", timeout=(3.0, 10.0))
```

---

### 3. Connection Pooling & HTTP Keep-Alive with `requests.Session`

When you make individual `requests.get()` calls, Python opens a new TCP connection, performs a TLS/SSL handshake, downloads the response, and **closes the socket immediately**.

Using **`requests.Session()`** activates **HTTP Keep-Alive**:
- The TCP and TLS connections are kept open in an internal pool managed by `urllib3`.
- Subsequent HTTP requests to the same domain reuse the open socket, eliminating handshake latency and speeding up API calls by **up to 10x**.
- Cookies and session-level headers persist automatically across requests.

---

## Examples

### 1. Simple: Fetching & Parsing JSON REST API Data
Executing a `GET` request and safely handling HTTP status errors with `raise_for_status()`.

```python
import requests

def get_public_ip_info() -> dict:
    url = "https://httpbin.org/json"
    try:
        response = requests.get(url, timeout=5.0)
        response.raise_for_status()  # Check for 4xx/5xx errors
        return response.json()
    except requests.exceptions.Timeout:
        print("🚨 Request timed out after 5.0 seconds.")
    except requests.exceptions.HTTPError as http_err:
        print(f"🚨 HTTP Error: {http_err} (Status: {response.status_code})")
    except requests.exceptions.RequestException as req_err:
        print(f"🚨 Network Connection Error: {req_err}")
    return {}

data = get_public_ip_info()
print("Retrieved Title:", data.get("slideshow", {}).get("title"))
```

### 2. Beginner: Sending Form Data vs JSON Payloads
Understanding the crucial difference between `data=` (Form-encoded) and `json=` (JSON-encoded).

```python
import requests

# 1. Sending JSON Payload (Content-Type: application/json)
json_payload = {"username": "hesamp", "score": 98}
r_json = requests.post("https://httpbin.org/post", json=json_payload, timeout=5.0)
print("Sent JSON Content-Type:", r_json.json()["headers"]["Content-Type"]) # "application/json"

# 2. Sending Form Data (Content-Type: application/x-www-form-urlencoded)
form_payload = {"grant_type": "password", "scope": "read:all"}
r_form = requests.post("https://httpbin.org/post", data=form_payload, timeout=5.0)
print("Sent Form Content-Type:", r_form.json()["headers"]["Content-Type"]) # "application/x-www-form-urlencoded"
```

### 3. Intermediate: Automated Exponential Backoff Retries on HTTP 5xx / 429
Configuring a resilient HTTP adapter with automatic retries for transient server failures.

```python
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

def create_resilient_session(retries: int = 3, backoff_factor: float = 0.5) -> requests.Session:
    """Creates a requests.Session with automated retry policies for transient errors."""
    session = requests.Session()
    
    retry_policy = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,  # Delays: 0.5s, 1.0s, 2.0s...
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False
    )
    
    adapter = HTTPAdapter(max_retries=retry_policy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

resilient_client = create_resilient_session(retries=3, backoff_factor=0.3)
resp = resilient_client.get("https://httpbin.org/status/200", timeout=5.0)
print("Resilient Session Request Status:", resp.status_code)
```

### 4. Real-World: Streaming Large File Downloads with Progress Tracking
Downloading multi-megabyte files in fixed 64 KB memory chunks using `stream=True`.

```python
import requests
from pathlib import Path

def download_large_file(url: str, output_path: Path, chunk_size: int = 64 * 1024):
    """Downloads large file in streaming chunks without loading entire file into RAM."""
    with requests.get(url, stream=True, timeout=(3.0, 30.0)) as response:
        response.raise_for_status()
        
        total_size = int(response.headers.get("content-length", 0))
        downloaded = 0
        
        print(f"📥 Starting download ({total_size / (1024*1024):.2f} MB)...")
        
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:  # Filter out keep-alive chunks
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        pct = (downloaded / total_size) * 100.0
                        print(f"  Downloaded: {pct:>5.1f}% ({downloaded / 1024:.0f} KB)", end="\r")

        print(f"\n✅ Download complete: Saved to {output_path}")

target_file = Path("/tmp/sample_download.png")
download_large_file("https://httpbin.org/image/png", target_file)
if target_file.exists(): target_file.unlink()  # Cleanup
```

### 5. Advanced: Custom HMAC SHA-256 Authentication Handler
Building a custom `requests.auth.AuthBase` class that automatically computes cryptographic request signatures for every API call.

```python
import requests
import hmac
import hashlib
import time
from requests.auth import AuthBase

class HMACAuth(AuthBase):
    """Custom authentication handler that signs requests with HMAC SHA-256."""
    
    def __init__(self, api_key: str, secret_key: str):
        self.api_key = api_key
        self.secret_key = secret_key.encode("utf-8")

    def __call__(self, request: requests.PreparedRequest) -> requests.PreparedRequest:
        # Generate timestamp
        timestamp = str(int(time.time()))
        
        # Construct message signature: METHOD + PATH + TIMESTAMP
        message = f"{request.method}{request.path_url}{timestamp}".encode("utf-8")
        signature = hmac.new(self.secret_key, message, hashlib.sha256).hexdigest()

        # Attach custom security headers
        request.headers["X-API-KEY"] = self.api_key
        request.headers["X-TIMESTAMP"] = timestamp
        request.headers["X-SIGNATURE"] = signature
        return request

# Test Custom Authenticator
auth_handler = HMACAuth(api_key="KEY_ALPHA_99", secret_key="SUPER_SECRET_HMAC_KEY")
resp = requests.get("https://httpbin.org/headers", auth=auth_handler, timeout=5.0)

received_headers = resp.json()["headers"]
print("Server Received HMAC Headers:")
print("  X-Api-Key   :", received_headers.get("X-Api-Key"))
print("  X-Signature :", received_headers.get("X-Signature"))
```

---

## Code Explanation

In Example 5 (`HMACAuth`):
1. Inheriting from **`requests.auth.AuthBase`** and implementing **`__call__(self, request)`** creates a reusable authentication plugin.
2. When `requests.get(url, auth=auth_handler)` executes, `requests` passes the `PreparedRequest` object to `auth_handler` immediately before transmission.
3. The authenticator computes a cryptographic HMAC SHA-256 signature using the HTTP method, URL path, and timestamp, attaching `X-API-KEY` and `X-SIGNATURE` headers.
4. This is the exact authentication standard used by **Amazon Web Services (AWS Signature V4)**, Stripe webhooks, and cryptocurrency exchanges.

---

## Common Mistakes

### Mistake 1: Omitting Timeouts (The Hanging Process Trap)
Calling `requests.get(url)` with no `timeout` argument will hang your server process indefinitely if the remote server drops the connection. Always specify `timeout=(connect_t, read_t)`.

### Mistake 2: Not Checking HTTP Status Codes
Assuming a request succeeded just because `requests.get()` didn't raise a network exception: if the server returns a `500 Internal Server Error`, `requests.get()` succeeds without error. Always call **`response.raise_for_status()`** to raise an `HTTPError` on 4xx/5xx responses.

---

## Best Practices

### Use `requests.Session` for All Repeated Host Communications
Never call `requests.get()` repeatedly in a loop. Use a `requests.Session` to maintain TCP connection pools and avoid SSL handshake overhead.

Good:
```python
with requests.Session() as session:
    for user_id in user_ids:
        session.get(f"https://api.domain.com/users/{user_id}", timeout=3.0)
```

---

## Performance Considerations

| Approach | Latency for 100 Requests | Network Overhead |
|---|---|---|
| **Isolated `requests.get()`** | **~6,500 ms** | 100 TCP & TLS Handshakes |
| **`requests.Session()` (Keep-Alive)**| **~650 ms (10x Faster!)** | **1 TCP & TLS Handshake!** |

Using a persistent `Session` eliminates 90% of networking latency in microservice-to-microservice communication.

---

## Security Considerations

1. **Never Disable SSL Verification (`verify=False`)**: Passing `verify=False` disables TLS certificate verification, leaving your application vulnerable to **Man-In-The-Middle (MITM) attacks**. Always keep `verify=True` (default).
2. **Credential Redaction**: Ensure authentication headers (`Authorization: Bearer ...`) are redacted before printing request details to logs or monitoring dashboards.

---

## Real-World Usage

- **Third-Party Payment Gateways**: Transacting with Stripe, PayPal, and Square APIs.
- **Cloud Infrastructure SDKs**: Interacting with AWS, Google Cloud, and Azure REST endpoints.
- **Web Scrapers (BeautifulSoup / Scrapy)**: Fetching HTML documents and XML feeds.

---

## Comparison: Python HTTP Clients

| Library | Paradigm | HTTP/2 Support? | AsyncIO Support? | Best Use Case |
|---|---|---|---|---|
| **`urllib.request`**| Standard Library | No | No | Built-in zero-dependency scripts |
| **`requests`** | **Synchronous** | No (HTTP/1.1) | No | **Synchronous scripts, Standard APIs** |
| **`httpx`** | **Sync & Async** | **Yes** | **Yes** | **Modern FastAPI, AsyncIO apps** |
| **`aiohttp`** | Asynchronous | No | **Yes** | High-throughput AsyncIO daemons |

---

## Advanced Concepts: Custom Transport Adapters with `HTTPAdapter`

You can customize the underlying connection pool sizing by configuring `urllib3` pool parameters in `HTTPAdapter`:

```python
from requests.adapters import HTTPAdapter

adapter = HTTPAdapter(
    pool_connections=20,  # Number of connection pools to cache
    pool_maxsize=50       # Maximum concurrent sockets per pool
)
session = requests.Session()
session.mount("https://", adapter)
```

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that queries `https://httpbin.org/get` with query parameters `{"search": "python", "limit": 10}`, checks that the status code is 200 using `raise_for_status()`, and prints the echoed URL parameters.

### Exercise 2 — Intermediate
Build a `GitHubRepositoryClient` class using `requests.Session` that fetches repository star counts, uses `raise_for_status()`, and sets a custom `User-Agent` header and 5-second timeout.

### Exercise 3 — Advanced
Build a robust webhook dispatcher that sends JSON event payloads to an external endpoint, automatically retrying up to 4 times with exponential backoff on HTTP 429 / 5xx errors and logging each attempt.

---

## Mini Project: Enterprise Resilient API Client with Exponential Backoff & HMAC Auth

### Requirements
Build a production-grade API client named `resilient_api_client.py`. Implement custom HMAC-SHA256 request authentication, automatic connection pooling with `requests.Session`, exponential backoff retry policies, and structured exception handling.

### Implementation Blueprint
```python
import hashlib
import hmac
import time
from typing import Final, Any
import requests
from requests.adapters import HTTPAdapter
from requests.auth import AuthBase
from urllib3.util.retry import Retry

# =====================================================================
# 1. CRYPTOGRAPHIC HMAC AUTHENTICATION PLUGIN
# =====================================================================

class SecureHMACAuth(AuthBase):
    def __init__(self, client_id: str, api_secret: str):
        self.client_id = client_id
        self.api_secret = api_secret.encode("utf-8")

    def __call__(self, r: requests.PreparedRequest) -> requests.PreparedRequest:
        now_ts = str(int(time.time()))
        
        # Signature Payload: METHOD + PATH + TIMESTAMP
        path_url = r.path_url or "/"
        payload_to_sign = f"{r.method}{path_url}{now_ts}".encode("utf-8")
        
        computed_sig = hmac.new(self.api_secret, payload_to_sign, hashlib.sha256).hexdigest()
        
        r.headers["X-Client-ID"] = self.client_id
        r.headers["X-Timestamp"] = now_ts
        r.headers["X-HMAC-Signature"] = computed_sig
        return r

# =====================================================================
# 2. RESILIENT ENTERPRISE API CLIENT
# =====================================================================

class ResilientAPIClient:
    DEFAULT_TIMEOUT: Final[tuple[float, float]] = (3.0, 10.0)

    def __init__(self, base_url: str, client_id: str, secret_key: str, max_retries: int = 3):
        self.base_url = base_url.rstrip("/")
        self.auth = SecureHMACAuth(client_id, secret_key)
        self.session = self._build_session(max_retries)

    def _build_session(self, max_retries: int) -> requests.Session:
        session = requests.Session()
        session.auth = self.auth
        session.headers.update({
            "User-Agent": "EnterpriseResilientClient/2.0",
            "Accept": "application/json"
        })

        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=0.5,  # 0.5s, 1.0s, 2.0s...
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False
        )

        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=20)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def get(self, endpoint: str, params: dict = None) -> dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        print(f"🌐 [GET REQUEST] -> {url}")
        
        try:
            resp = self.session.get(url, params=params, timeout=self.DEFAULT_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.Timeout:
            raise TimeoutError(f"Request to {url} timed out.")
        except requests.exceptions.HTTPError as http_err:
            raise RuntimeError(f"HTTP Error {resp.status_code} on {url}: {http_err}")

    def post(self, endpoint: str, payload: dict) -> dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        print(f"🚀 [POST REQUEST] -> {url}")
        
        try:
            resp = self.session.post(url, json=payload, timeout=self.DEFAULT_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as err:
            raise ConnectionError(f"Failed POST to {url}: {err}")

    def close(self):
        self.session.close()

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE RESILIENT API CLIENT & HMAC AUTH ENGINE")
    print("=" * 68)
    
    client = ResilientAPIClient(
        base_url="https://httpbin.org",
        client_id="CLIENT_CORP_001",
        secret_key="SECRET_HMAC_PASSPHRASE_990",
        max_retries=3
    )
    
    # 1. Execute Authenticated GET Query
    get_res = client.get("/get", params={"category": "financial_reports"})
    print("Server Echoed Headers:")
    print("  Client ID :", get_res["headers"].get("X-Client-Id"))
    print("  Signature :", get_res["headers"].get("X-Hmac-Signature"))
    print("-" * 68)
    
    # 2. Execute Authenticated POST Mutation
    post_res = client.post("/post", payload={"order_id": "ORD-9901", "total": 1250.00})
    print("Server Confirmed JSON Payload:", post_res["json"])
    
    client.close()
    print("\n" + "=" * 68)
```

---

## Summary

In this lesson, you mastered HTTP fundamentals and the `requests` library:
- **HTTP** operates on a stateless Request/Response model with standardized methods and status codes.
- **Always provide explicit timeouts (`timeout=(connect_t, read_t)`)** to prevent hanging processes.
- **`requests.Session`** provides automatic **HTTP Keep-Alive and TCP connection pooling**, delivering **10x speedups**.
- Use **`response.raise_for_status()`** to catch 4xx and 5xx errors reliably.
- Use **`stream=True` and `iter_content()`** to download massive files in constant memory.
- Subclass **`requests.auth.AuthBase`** to build custom cryptographic authenticators (like HMAC-SHA256).

---

## Best Practices Checklist

- [ ] Always specify explicit `timeout=` values on every request.
- [ ] Use `requests.Session()` for all multiple-request workflows.
- [ ] Call `response.raise_for_status()` to handle HTTP errors explicitly.
- [ ] Use `stream=True` when downloading large files.
- [ ] Use `HTTPAdapter` and `Retry` for automated transient error recovery.
- [ ] Never disable SSL certificate verification (`verify=False`).

---

## What's Next?

Now that you understand HTTP fundamentals and `requests`, continue to:
👉 **[Modern API Consumption with HTTPX & Async HTTP](httpx-and-api-consumption.md)** to master HTTP/2 support, asynchronous HTTP clients (`AsyncClient`), and concurrent API aggregation!
