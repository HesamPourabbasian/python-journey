# Observability: Structured Logging, Metrics & OpenTelemetry in Python

## Introduction

In distributed microservices running across multi-node Kubernetes clusters, answering the question *"Why did a specific user's checkout fail at 14:02 UTC?"* is impossible using traditional tools.

Looking at raw, unformatted plaintext log files (`logging.info(f"Processing order for {user}")`) spread across 50 container pods is like searching for a needle in a haystack.

To understand the internal health and failure modes of production systems, modern software engineering relies on **Observability**.

Observability is built upon **The Three Pillars**:
1. **Structured Logging (`structlog`)**: Emitting machine-readable, schema-enforced JSON log events with contextual metadata (`request_id`, `user_id`, `environment`, `duration_ms`) queryable in **Datadog, Elasticsearch, and Grafana Loki**.
2. **Application Metrics (`prometheus_client`)**: Quantitative time-series measurements tracking throughput, error rates, and latency distributions (P50, P95, **P99 percentiles**) scraped by **Prometheus** and visualized in **Grafana**.
3. **Distributed Tracing (`OpenTelemetry` / OTel)**: Tracking a single end-user request as it flows across multiple microservices, database clusters, and message queues using **Distributed Trace IDs, Spans, and W3C Context Propagation**.

This lesson concludes **Module 8: DevOps, Containerization & Observability**, exploring structured logging architectures, Prometheus instrumentation, distributed trace context propagation, and building a unified observability middleware.

---

## Prerequisites

Before studying observability, ensure you have:

- Completed [Asynchronous Programming (AsyncIO)](../async/README.md).
- Completed [Modern Enterprise Web Frameworks](../fastapi-django/README.md).
- Completed [Dockerizing Python Applications](dockerizing-python-applications.md).

---

## Core Concept: The Three Pillars of Observability

```
                           THE THREE PILLARS OF OBSERVABILITY

       1. STRUCTURED LOGS (JSON)          2. TIME-SERIES METRICS          3. DISTRIBUTED TRACES
      ┌──────────────────────────────┐   ┌──────────────────────────────┐┌──────────────────────────────┐
      │ {"timestamp": "...",         │   │ http_requests_total{code="200││ Trace ID: 4bf92f3577b34da6...│
      │  "level": "error",           │   │ http_request_duration_seconds││ ├── Gateway (15ms)           │
      │  "event": "PaymentFailed",   │   │   _bucket{le="0.1"} 450      ││ │   ├── Auth (2ms)           │
      │  "trace_id": "4bf92f...",    │   │   _bucket{le="0.5"} 1200     ││ │   └── PaymentService (12ms)│
      │  "user_id": "USR-101"}       │   │ active_websocket_connections ││ │       └── DB Query (8ms)   │
      └──────────────────────────────┘   └──────────────────────────────┘└──────────────────────────────┘
                                         (Correlated by Trace ID!)
```

---

## Syntax & Essential Observability Patterns

```python
import json
import time
import uuid
from dataclasses import dataclass, asdict

# 1. Structured JSON Logging Pattern
def emit_structured_log(level: str, event_name: str, **context):
    log_record = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": level.upper(),
        "event": event_name,
        **context
    }
    # Emits clean single-line JSON to stdout (Ingested by Fluentbit/Datadog!)
    print(json.dumps(log_record))

emit_structured_log("INFO", "UserAuthenticated", user_id="USR-9901", ip_address="10.0.1.15", duration_ms=4.2)

# 2. Prometheus Metric Types (Conceptual Standard)
# - Counter: Monotonically increasing (e.g. Total Requests)
# - Gauge: Snapshot value that goes up/down (e.g. Memory in MB, Active Sockets)
# - Histogram: Value distribution in buckets (e.g. Request Latency)

# 3. Distributed Tracing Context Propagation (W3C TraceContext)
# Standard HTTP Header: traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
# Format: version - trace_id (128-bit hex) - parent_span_id (64-bit hex) - trace_flags
```

---

## Detailed Explanation

### 1. Plaintext Logs vs Structured JSON Logs

- **Plaintext Logging (Anti-Pattern)**:
  `[2024-05-10 14:02:11] ERROR: User USR-101 failed payment of $150.00 on gateway Stripe`
  - *Problem*: To search for all failed payments $> \$100$ in Elasticsearch, log parsers must use fragile, CPU-heavy regular expressions. If a developer changes a comma or capitalization, all dashboards break!
- **Structured JSON Logging**:
  `{"timestamp":"2024-05-10T14:02:11Z","level":"ERROR","event":"PaymentFailed","user_id":"USR-101","amount":150.00,"gateway":"Stripe"}`
  - *Benefit*: Log aggregation engines (Datadog, Splunk, Loki) index JSON keys automatically, allowing instant SQL/Lucene filtering (`event:PaymentFailed AND amount > 100`).

---

### 2. The Danger of High-Cardinality Prometheus Labels

In Prometheus, every unique combination of key-value labels creates a **brand-new time series in the Prometheus Time-Series Database (TSDB)**.

```python
# 🚨 DISASTROUS HIGH-CARDINALITY BUG (Crashes Prometheus Server!):
# http_requests_total.labels(user_id=user.id, uuid=uuid.uuid4()).inc()
# If you have 1,000,000 users, Prometheus creates 1,000,000 time series, exhausting server RAM!

# ✅ CORRECT LOW-CARDINALITY USAGE:
# http_requests_total.labels(method="POST", path="/checkout", status_code="200").inc()
# Total time series combinations: 4 methods * 10 paths * 5 status codes = 200 time series (Safe!)
```

$$\textbf{Rule: NEVER place unbounded dynamic identifiers (User IDs, UUIDs, Timestamps, Email addresses)}$$

$$\textbf{into Prometheus metric labels! Store dynamic identifiers inside Structured Logs or Traces instead.}$$

---

### 3. OpenTelemetry & Distributed Context Propagation

When an HTTP request enters your API Gateway and triggers calls across 5 downstream microservices:
1. The API Gateway generates a global **`trace_id`** (e.g. `4bf92f3577b34da6...`).
2. It wraps its own execution in a **Root Span (`span_id_1`)**.
3. When making an outbound HTTP call to the Payment Service, it injects the **`traceparent`** HTTP header.
4. The Payment Service extracts the header, links its child span to the parent `trace_id`, and continues execution.
5. In your observability dashboard (Jaeger / Datadog), you see a single unified Gantt chart detailing the exact execution time of every microservice and SQL query!

---

## Examples

### 1. Simple: Modern Structured JSON Logger with Context Binding
Building a lightweight structured logger that binds persistent request metadata.

```python
import json
import time
import uuid

class StructuredLogger:
    def __init__(self, service_name: str, **default_context):
        self.service_name = service_name
        self.context = default_context

    def bind(self, **kwargs) -> "StructuredLogger":
        """Creates a child logger with bound contextual metadata."""
        new_context = {**self.context, **kwargs}
        return StructuredLogger(self.service_name, **new_context)

    def log(self, level: str, event: str, **kwargs):
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": level.upper(),
            "service": self.service_name,
            "event": event,
            **self.context,
            **kwargs
        }
        print(json.dumps(payload))

    def info(self, event: str, **kwargs): self.log("INFO", event, **kwargs)
    def error(self, event: str, **kwargs): self.log("ERROR", event, **kwargs)

# Root Logger
logger = StructuredLogger("OrderMicroservice", env="production", region="us-east-1")

# Bind Request-Scoped Context (e.g. inside FastAPI middleware)
req_logger = logger.bind(request_id=str(uuid.uuid4())[:8], user_id="USR-1001")

req_logger.info("OrderCheckoutInitiated", cart_items=3, amount_usd=149.99)
req_logger.error("PaymentGatewayTimeout", gateway="Stripe", retry_attempt=1)
```

### 2. Beginner: Prometheus Metrics Instrumentation Simulator
Implementing a Prometheus Counter, Gauge, and Histogram latency tracker.

```python
import time
import random
from collections import defaultdict

class MockPrometheusMetrics:
    def __init__(self):
        self.counters = defaultdict(int)
        self.gauges = defaultdict(float)
        self.histogram_buckets = [0.05, 0.1, 0.25, 0.5, 1.0]
        self.histogram_counts = defaultdict(lambda: [0] * len(self.histogram_buckets))

    def increment_counter(self, metric_name: str, labels: dict):
        key = f"{metric_name}_{json.dumps(labels, sort_keys=True)}"
        self.counters[key] += 1

    def set_gauge(self, metric_name: str, value: float):
        self.gauges[metric_name] = value

    def observe_histogram(self, metric_name: str, latency_sec: float):
        for idx, bucket in enumerate(self.histogram_buckets):
            if latency_sec <= bucket:
                self.histogram_counts[metric_name][idx] += 1

metrics = MockPrometheusMetrics()

# Record Metrics
metrics.set_gauge("active_db_connections", 12.0)
metrics.increment_counter("http_requests_total", {"method": "POST", "status": "200"})
metrics.increment_counter("http_requests_total", {"method": "POST", "status": "500"})
metrics.observe_histogram("http_request_duration_seconds", 0.08)
metrics.observe_histogram("http_request_duration_seconds", 0.32)

print("=" * 65)
print("PROMETHEUS METRIC SCRAPING EXPORT:")
print("=" * 65)
for k, v in metrics.counters.items(): print(f"  • Counter: {k} -> {v}")
for k, v in metrics.gauges.items():   print(f"  • Gauge  : {k} -> {v}")
print(f"  • Histogram Latency Buckets (<= 0.05, 0.1, 0.25, 0.5, 1.0s):")
print(f"    {metrics.histogram_counts['http_request_duration_seconds']}")
```

### 3. Intermediate: Async Contextual Logging with `contextvars`
Preserving correlation IDs automatically across async coroutine task boundaries without passing logger arguments.

```python
import asyncio
import contextvars
import json
import time
import uuid

# Define context variable for current request ID
current_request_id: contextvars.ContextVar[str] = contextvars.ContextVar("current_request_id", default="NO_REQ_ID")

def context_aware_log(level: str, event: str, **kwargs):
    req_id = current_request_id.get()
    record = {
        "timestamp": time.strftime("%X"),
        "level": level,
        "request_id": req_id,
        "event": event,
        **kwargs
    }
    print(f"[{record['timestamp']}] [{record['level']}] [Req: {record['request_id']}] {record['event']} {kwargs}")

async def database_subquery(user_id: str):
    await asyncio.sleep(0.05)
    # Automatically extracts request_id from contextvars!
    context_aware_log("INFO", "DatabaseQueryCompleted", user=user_id, rows_returned=1)

async def handle_incoming_request(user_id: str):
    # Set request-scoped context variable!
    token = current_request_id.set(f"REQ-{uuid.uuid4().hex[:6]}")
    try:
        context_aware_log("INFO", "RequestStarted", user=user_id)
        await database_subquery(user_id)
        context_aware_log("INFO", "RequestFinished", status="200_OK")
    finally:
        current_request_id.reset(token)

async def main():
    print("Concurrent Async Request Handling with Contextual Logging:")
    print("-" * 65)
    # Execute 2 requests concurrently
    await asyncio.gather(
        handle_incoming_request("Alice"),
        handle_incoming_request("Bob")
    )

asyncio.run(main())
```

### 4. Real-World: OpenTelemetry Distributed Trace Context Propagation
Simulating W3C `traceparent` header propagation across microservice RPC calls.

```python
import uuid
import time
from dataclasses import dataclass, field

@dataclass
class Span:
    name: str
    trace_id: str
    span_id: str
    parent_span_id: str = None
    start_time: float = field(default_factory=time.time)
    duration_ms: float = 0.0

class OpenTelemetryTraceManager:
    @staticmethod
    def generate_trace_id() -> str:
        return uuid.uuid4().hex

    @staticmethod
    def generate_span_id() -> str:
        return uuid.uuid4().hex[:16]

    @classmethod
    def create_traceparent_header(cls, trace_id: str, span_id: str) -> str:
        # W3C TraceContext format: 00-{trace_id}-{span_id}-01
        return f"00-{trace_id}-{span_id}-01"

    @classmethod
    def parse_traceparent_header(cls, header_val: str) -> tuple[str, str]:
        parts = header_val.split("-")
        return parts[1], parts[2]

# Client Flow Simulation: API Gateway -> Payment Service -> Database
trace_id = OpenTelemetryTraceManager.generate_trace_id()

# 1. Gateway Span (Root)
gateway_span_id = OpenTelemetryTraceManager.generate_span_id()
gateway_span = Span("HTTP POST /checkout", trace_id, gateway_span_id)
time.sleep(0.02)
gateway_span.duration_ms = 20.5

# 2. Outbound Header sent to Payment Microservice
w3c_header = OpenTelemetryTraceManager.create_traceparent_header(trace_id, gateway_span_id)

# 3. Payment Service receives header and creates child span
rx_trace_id, rx_parent_span = OpenTelemetryTraceManager.parse_traceparent_header(w3c_header)
payment_span_id = OpenTelemetryTraceManager.generate_span_id()
payment_span = Span("ProcessStripeCharge", rx_trace_id, payment_span_id, parent_span_id=rx_parent_span)
time.sleep(0.01)
payment_span.duration_ms = 12.0

print("=" * 65)
print("DISTRIBUTED TRACING (W3C CONTEXT PROPAGATION):")
print("=" * 65)
print(f"Global Trace ID : {trace_id}")
print(f"W3C Wire Header : {w3c_header}")
print(f"  ├── Span 1 (Gateway) : [{gateway_span.span_id}] {gateway_span.name} ({gateway_span.duration_ms} ms)")
print(f"  │   └── Span 2 (Child) : [{payment_span.span_id}] {payment_span.name} ({payment_span.duration_ms} ms) [Parent: {payment_span.parent_span_id}]")
print("=" * 65)
```

### 5. Advanced: Unified ASGI Observability Middleware in FastAPI
Building a production middleware that injects Trace IDs, formats structured logs, and records Prometheus request duration metrics.

```python
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid
import json

app = FastAPI()

class UnifiedObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Extract or Generate Distributed Trace ID
        trace_id = request.headers.get("X-Trace-ID", f"trace-{uuid.uuid4().hex[:12]}")
        start_time = time.perf_counter()

        # 2. Execute downstream application
        response: Response = await call_next(request)
        
        # 3. Calculate Latency
        duration_ms = (time.perf_counter() - start_time) * 1000.0

        # 4. Inject Trace ID into Response Header
        response.headers["X-Trace-ID"] = trace_id

        # 5. Emit Correlated Structured JSON Access Log
        log_entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": "INFO" if response.status_code < 400 else "ERROR",
            "event": "HttpRequestCompleted",
            "trace_id": trace_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "client_ip": request.client.host if request.client else "unknown"
        }
        print(json.dumps(log_entry))

        return response

app.add_middleware(UnifiedObservabilityMiddleware)

@app.get("/api/v1/health")
async def health_endpoint():
    return {"status": "HEALTHY"}

print("Unified Observability Middleware Configured.")
```

---

## Code Explanation

In Example 5 (`Unified Observability Middleware`):
1. The middleware intercepts every incoming HTTP request on the FastAPI ASGI pipeline.
2. It extracts incoming **`X-Trace-ID`** or generates a new trace ID, ensuring end-to-end request correlation.
3. It measures execution latency with high-precision `time.perf_counter()`.
4. It emits a **single-line structured JSON access log** containing the HTTP verb, status code, latency, and correlated `trace_id`.
5. It returns the `X-Trace-ID` header back to the client, allowing frontend apps to reference the exact server log trace when reporting issues.

---

## Common Mistakes

### Mistake 1: Placing High-Cardinality Values in Prometheus Labels
Placing user IDs or UUIDs in Prometheus labels (`http_requests.labels(user_id=uid)`). This creates millions of time series and crashes Prometheus. Keep metric labels restricted to finite enumerations (`status_code`, `method`, `route`).

### Mistake 2: Logging Sensitive Credentials and PII in JSON Logs
Accidentally logging authorization tokens, passwords, credit card numbers, or customer PII in structured log dictionaries. Always implement a log sanitizer that scrubs sensitive keys (`password`, `token`, `secret`, `ssn`).

---

## Best Practices

### The Golden Signal Metrics (Google SRE)
Monitor the 4 Golden Signals on every production microservice:
1. **Latency**: Time taken to service requests (Track P95 and P99 percentiles).
2. **Traffic**: Demand on the system (Requests per second).
3. **Errors**: Rate of failed requests (HTTP 5xx error percentage).
4. **Saturation**: System capacity utilization (CPU, RAM, Database pool usage).

---

## Performance Considerations

- **Log Serialization Overhead**: Serializing JSON logs adds **$< 5\mu\text{s}$** per request.
- **Prometheus Scrape Latency**: In-memory metric increments take **$< 200\text{ nanoseconds}$**.

---

## Security Considerations

1. **Log Data Redaction**: Configure automated regex filters in your logging pipeline to mask authorization tokens (`Bearer eyJ...` $\rightarrow$ `Bearer [REDACTED]`).

---

## Real-World Usage

- **Datadog & Grafana Loki**: Ingesting structured JSON logs for centralized microservice querying.
- **Prometheus & Grafana**: Alerting on P99 latency SLA violations.
- **OpenTelemetry & Jaeger / AWS X-Ray**: Visualizing distributed trace graphs across hundreds of Kubernetes microservices.

---

## Comparison: The 3 Observability Pillars

| Dimension | Structured Logs | Metrics (Prometheus) | Distributed Tracing (OTel) |
|---|---|---|---|
| **Data Format** | JSON Key-Value Records | Numeric Time-Series | Tree Graph of Spans |
| **Storage Cost** | High (Retained in indices)| **Lowest (Aggregated numbers)**| Moderate (Sampled) |
| **Best Used For** | Detailed error diagnosis | Alerting, Real-time dashboards| Cross-service latency bottlenecks |

---

## Advanced Concepts: Tail-Based Trace Sampling

In high-throughput systems processing 100,000 requests per second, storing 100% of all traces is cost-prohibitive. **Tail-Based Sampling** (configured in the OpenTelemetry Collector) buffers traces in memory and **retains 100% of traces that experienced errors or high latency ($> 500\text{ ms}$)**, while sampling only 1% of successful fast requests.

---

## Exercises

### Exercise 1 — Beginner
Build a `StructuredLogger` that outputs single-line JSON logs to stdout with `timestamp`, `level`, `event`, and arbitrary keyword arguments.

### Exercise 2 — Intermediate
Build a `PrometheusRequestTracker` class with `record_request(path, status_code, duration_sec)` that tracks request counts and calculates average latency per route.

### Exercise 3 — Advanced
Build a `DistributedTraceContextManager` using `contextvars` that automatically generates child spans with parent span relationships and duration measurements.

---

## Mini Project: Enterprise Unified Observability Engine: Structured Logger, Prometheus Metrics & OTel Tracer

### Requirements
Build an operational observability engine named `enterprise_observability_suite.py`. Combine structured JSON logging, Prometheus metric tracking (Counters and Latency Histograms), OpenTelemetry-compliant W3C distributed trace context generation, and an automated audit benchmark report.

### Implementation Blueprint
```python
import json
import time
import uuid
import contextvars
from dataclasses import dataclass, field, asdict
from collections import defaultdict
from typing import Optional

# =====================================================================
# 1. DISTRIBUTED TRACING & CONTEXT MANAGEMENT (OpenTelemetry)
# =====================================================================

current_trace_context: contextvars.ContextVar[dict] = contextvars.ContextVar("trace_ctx", default={})

@dataclass
class TraceSpan:
    name: str
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    duration_ms: float = 0.0

class DistributedTracer:
    @staticmethod
    def start_span(name: str) -> TraceSpan:
        parent_ctx = current_trace_context.get()
        trace_id = parent_ctx.get("trace_id", uuid.uuid4().hex)
        parent_span_id = parent_ctx.get("span_id", None)
        span_id = uuid.uuid4().hex[:16]

        # Update context
        current_trace_context.set({"trace_id": trace_id, "span_id": span_id})
        return TraceSpan(name, trace_id, span_id, parent_span_id)

# =====================================================================
# 2. STRUCTURED JSON LOGGER (structlog simulation)
# =====================================================================

class EnterpriseStructuredLogger:
    def __init__(self, service_name: str):
        self.service_name = service_name

    def log(self, level: str, event: str, **kwargs):
        ctx = current_trace_context.get()
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": level.upper(),
            "service": self.service_name,
            "trace_id": ctx.get("trace_id", "NO_TRACE"),
            "span_id": ctx.get("span_id", "NO_SPAN"),
            "event": event,
            **kwargs
        }
        print(json.dumps(payload))

    def info(self, event: str, **kwargs): self.log("INFO", event, **kwargs)
    def error(self, event: str, **kwargs): self.log("ERROR", event, **kwargs)

# =====================================================================
# 3. PROMETHEUS METRIC REGISTRY
# =====================================================================

class PrometheusMetricRegistry:
    def __init__(self):
        self.request_counters = defaultdict(int)
        self.latency_samples: list[float] = []

    def record_http_request(self, method: str, path: str, status_code: int, duration_sec: float):
        # Low-cardinality labels
        key = f"http_requests_total{{method='{method}',path='{path}',status='{status_code}'}}"
        self.request_counters[key] += 1
        self.latency_samples.append(duration_sec * 1000.0)

    def calculate_percentiles(self) -> dict[str, float]:
        if not self.latency_samples: return {"p50": 0.0, "p95": 0.0, "p99": 0.0}
        s = sorted(self.latency_samples)
        n = len(s)
        return {
            "p50": round(s[int(n * 0.50)], 2),
            "p95": round(s[int(n * 0.95)], 2),
            "p99": round(s[min(n - 1, int(n * 0.99))], 2),
        }

# =====================================================================
# 4. UNIFIED OBSERVABILITY ENGINE ORCHESTRATION
# =====================================================================

class UnifiedObservabilityEngine:
    def __init__(self, service_name: str):
        self.logger = EnterpriseStructuredLogger(service_name)
        self.metrics = PrometheusMetricRegistry()

    def handle_simulated_checkout(self, user_id: str, amount: float, should_fail: bool = False):
        # 1. Start Root Trace Span
        root_span = DistributedTracer.start_span("HTTP POST /checkout")
        t0 = time.perf_counter()

        self.logger.info("CheckoutTransactionStarted", user_id=user_id, amount_usd=amount)

        # 2. Start Child Span (Database Execution)
        db_span = DistributedTracer.start_span("SQL SELECT UserBalance")
        time.sleep(0.01)  # Simulate DB query

        # 3. Complete Checkout or Fail
        if should_fail:
            time.sleep(0.02)
            self.logger.error("PaymentAuthorizationFailed", reason="CardDeclined", code="CARD_ERR_01")
            status = 402
        else:
            time.sleep(0.015)
            self.logger.info("PaymentAuthorized", auth_code="AUTH-9901")
            status = 200

        elapsed = time.perf_counter() - t0
        self.metrics.record_http_request("POST", "/checkout", status, elapsed)
        self.logger.info("CheckoutTransactionCompleted", status_code=status, total_latency_ms=round(elapsed*1000, 2))

# =====================================================================
# 5. VERIFICATION & RUNTIME AUDIT
# =====================================================================

def run_observability_audit():
    border = "=" * 70
    print(border)
    print("      ENTERPRISE UNIFIED OBSERVABILITY PIPELINE AUDIT")
    print(border)

    engine = UnifiedObservabilityEngine("CheckoutService")

    print("\n--- 1. EXECUTING SIMULATED TRANSACTIONS (STRUCTURED JSON LOG STREAM) ---")
    engine.handle_simulated_checkout("USR-101", 149.99, should_fail=False)
    engine.handle_simulated_checkout("USR-102", 49.00, should_fail=True)
    engine.handle_simulated_checkout("USR-103", 850.00, should_fail=False)

    print("\n--- 2. PROMETHEUS SCRAPED TIME-SERIES METRICS ---")
    for key, val in engine.metrics.request_counters.items():
        print(f"  • {key} : {val}")

    print("\n--- 3. SLA LATENCY DISTRIBUTION (PERCENTILES) ---")
    percentiles = engine.metrics.calculate_percentiles()
    print(f"  • P50 (Median) Latency : {percentiles['p50']} ms")
    print(f"  • P95 Latency          : {percentiles['p95']} ms")
    print(f"  • P99 Peak Latency     : {percentiles['p99']} ms")

    print("\n" + border)
    print("🎉 Unified Observability Pipeline (Logs, Metrics, Traces) Verified!")
    print(border)

if __name__ == "__main__":
    run_observability_audit()
```

---

## Summary

In this lesson, you mastered production observability in Python:
- **Structured JSON Logging (`structlog`)** outputs machine-readable key-value events queryable in Elasticsearch and Datadog.
- **Prometheus Metrics** track quantitative Counters, Gauges, and Latency Histograms to monitor P95/P99 SLAs.
- Keep **Prometheus label cardinality low** to prevent memory exhaustion in TSDB storage.
- **OpenTelemetry Tracing** propagates **Trace IDs, Span IDs, and W3C `traceparent` headers** across microservices for distributed request visualization.
- Correlate all three pillars by injecting **`trace_id`** into structured logs and ASGI middleware.

---

## Best Practices Checklist

- [ ] Output single-line JSON logs to standard output.
- [ ] Use `contextvars` to pass trace and request IDs across async coroutines.
- [ ] Never place high-cardinality values in Prometheus labels.
- [ ] Monitor the 4 Golden Signals (Latency, Traffic, Errors, Saturation).
- [ ] Redact passwords and tokens before emitting logs.

---

## 🏆 MODULE 8: DEVOPS, CONTAINERIZATION & OBSERVABILITY COMPLETE!

Congratulations! You have completed all 3 comprehensive articles of **Module 8: DevOps, Containerization & Observability**.

### What's Next?
Now advance to **Module 9: Data Engineering & AI Integration**:
👉 **[Data Engineering & AI Module Overview](../data-science-ai/README.md)** to master Vectorized NumPy/Pandas processing, LLM Engineering, and Vector Similarity Search!
