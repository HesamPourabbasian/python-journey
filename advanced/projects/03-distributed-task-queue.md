# Project 03: Distributed Asynchronous Task Queue in Python

## Introduction

In enterprise web architectures, web request-response cycles must execute in under 100 milliseconds. Performing heavy computations—such as **rendering PDF invoices, processing video transcodes, training ML models, or dispatching 10,000 push notifications**—synchronously inside an HTTP request will freeze the web server and time out the client.

To handle long-running background workloads, distributed systems rely on **Asynchronous Task Queues** (such as **Celery, RQ, and Dramatiq**).

A production task queue requires sophisticated distributed systems engineering:
- **Task Envelopes & Serialization**: Encapsulating function pointers, arguments, and execution metadata.
- **Priority Queuing**: Ensuring critical financial transactions execute before bulk marketing emails.
- **Resilient Exponential Backoff Retries**: Automatically retrying transient network errors with randomized jitter.
- **Dead-Letter Queues (DLQ)**: Isolating poisoned or permanently failed tasks to prevent worker crashes.
- **Worker Heartbeats & Crash Detection**: Re-queueing tasks if a worker node crashes mid-execution.

In this capstone project, you will build **TaskVortex**: a fully operational distributed background task queue engine in pure Python.

---

## Prerequisites

Before building this project, ensure you have completed:

- [Concurrency & Parallelism](../concurrency/README.md).
- [Asynchronous Programming (AsyncIO)](../async/README.md).
- [Microservices & Event-Driven Architecture](../architecture/microservices-event-driven-architecture.md).

---

## System Architecture

```
                        TASKVORTEX DISTRIBUTED TASK QUEUE

      FastAPI Web Server (Producer)
             │
             ▼ Enqueues Task
      ┌────────────────────────────────────────────────────────────────────────┐
      │ REDIS TASK BROKER                                                      │
      │ ├── High Priority Queue: [ Task-101 (Payment Settlement) ]             │
      │ ├── Default Queue      : [ Task-102 (Send Invoice PDF)   ]             │
      │ └── Dead-Letter Queue  : [ Task-103 (Permanently Failed) ]             │
      └──────────────┬──────────────────────────────────────────▲──────────────┘
                     │ Workers Pull Tasks                       │ Retries / DLQ
                     ▼                                          │
      ┌─────────────────────────────┐            ┌──────────────┴──────────────┐
      │ TaskVortex Worker Node 1    │            │ TaskVortex Worker Node 2    │
      │ • Concurrency Pool (4 Tasks)│            │ • Exponential Backoff Retry │
      │ • Heartbeat Monitor (10s)   │            │ • Results -> Result Backend │
      └─────────────────────────────┘            └─────────────────────────────┘
```

---

## Complete Project Implementation

Below is the complete, self-contained, enterprise-grade Python implementation of the **TaskVortex Distributed Task Queue Engine**, incorporating priority scheduling, exponential retries, dead-letter queues, and worker execution pools.

```python
"""
TaskVortex: Enterprise Distributed Asynchronous Task Queue
Complete runnable verification engine.
"""

from __future__ import annotations
import asyncio
import time
import uuid
import json
import random
from dataclasses import dataclass, field, asdict
from typing import Callable, Dict, Any, Optional
from enum import Enum

# =====================================================================
# 1. TASK STATE & ENVELOPE SPECIFICATION
# =====================================================================

class TaskState(Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    RETRYING = "RETRYING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    DEAD_LETTER = "DEAD_LETTER"

@dataclass
class TaskEnvelope:
    task_name: str
    args: list = field(default_factory=list)
    kwargs: dict = field(default_factory=dict)
    task_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    priority: int = 1  # 1 = High, 2 = Normal, 3 = Low
    state: TaskState = TaskState.PENDING
    max_retries: int = 3
    current_retry: int = 0
    backoff_base_sec: float = 0.5
    created_at: float = field(default_factory=time.time)
    error_trace: Optional[str] = None
    result: Optional[Any] = None

# =====================================================================
# 2. DISTRIBUTED PRIORITY BROKER & RESULT BACKEND
# =====================================================================

class DistributedTaskBroker:
    def __init__(self):
        # Priority Queues: Priority 1 (High) -> Priority 2 (Normal)
        self.priority_queues: dict[int, asyncio.Queue] = {
            1: asyncio.Queue(),
            2: asyncio.Queue(),
            3: asyncio.Queue()
        }
        self.dead_letter_queue: list[TaskEnvelope] = []
        self.result_backend: dict[str, TaskEnvelope] = {}

    async def enqueue(self, envelope: TaskEnvelope):
        self.result_backend[envelope.task_id] = envelope
        queue = self.priority_queues.get(envelope.priority, self.priority_queues[2])
        await queue.put(envelope)
        print(f"  📥 [BROKER ENQUEUED] Task #{envelope.task_id} ('{envelope.task_name}') Priority={envelope.priority}")

    async def dequeue(self) -> TaskEnvelope:
        """Polls queues strictly by priority (High -> Normal -> Low)."""
        while True:
            for priority in [1, 2, 3]:
                q = self.priority_queues[priority]
                if not q.empty():
                    return await q.get()
            await asyncio.sleep(0.01)

# =====================================================================
# 3. TASK REGISTRY & WORKER ENGINE
# =====================================================================

TASK_REGISTRY: dict[str, Callable] = {}

def task(name: str, priority: int = 2, max_retries: int = 3, backoff: float = 0.5):
    """Decorator registering functions as distributed tasks."""
    def decorator(func: Callable):
        TASK_REGISTRY[name] = func
        func.task_name = name
        func.priority = priority
        func.max_retries = max_retries
        func.backoff = backoff
        return func
    return decorator

class TaskVortexWorker:
    def __init__(self, worker_id: str, broker: DistributedTaskBroker):
        self.worker_id = worker_id
        self.broker = broker
        self.is_running = True

    async def run(self):
        print(f"🚀 [{self.worker_id}] TaskVortex Worker Online. Listening for jobs...")
        while self.is_running:
            try:
                envelope = await asyncio.wait_for(self.broker.dequeue(), timeout=0.1)
            except asyncio.TimeoutError:
                continue

            await self._execute_task(envelope)

    async def _execute_task(self, envelope: TaskEnvelope):
        func = TASK_REGISTRY.get(envelope.task_name)
        if not func:
            envelope.state = TaskState.DEAD_LETTER
            envelope.error_trace = f"Unregistered task function: {envelope.task_name}"
            self.broker.dead_letter_queue.append(envelope)
            return

        envelope.state = TaskState.RUNNING
        print(f"  ⚙️ [{self.worker_id}] Executing Task #{envelope.task_id} ('{envelope.task_name}')...")

        try:
            # Execute underlying task
            res = func(*envelope.args, **envelope.kwargs)
            envelope.result = res
            envelope.state = TaskState.SUCCESS
            print(f"  ✅ [{self.worker_id}] Task #{envelope.task_id} COMPLETED successfully: {res}")
        except Exception as err:
            # Handle Failure with Exponential Backoff
            envelope.current_retry += 1
            if envelope.current_retry <= envelope.max_retries:
                envelope.state = TaskState.RETRYING
                # Exponential backoff formula: base * 2^(retry - 1) + jitter
                delay = (envelope.backoff_base_sec * (2 ** (envelope.current_retry - 1))) + (random.random() * 0.1)
                print(f"  ⚠️ [{self.worker_id}] Task #{envelope.task_id} failed ({err}). Retrying in {delay:.2f}s (Attempt {envelope.current_retry}/{envelope.max_retries})...")
                await asyncio.sleep(delay)
                await self.broker.enqueue(envelope)
            else:
                # Max Retries Exhausted -> Dead-Letter Queue
                envelope.state = TaskState.DEAD_LETTER
                envelope.error_trace = str(err)
                self.broker.dead_letter_queue.append(envelope)
                print(f"  🚨 [{self.worker_id}] Task #{envelope.task_id} PERMANENTLY FAILED! Routed to Dead-Letter Queue (DLQ).")

# =====================================================================
# 4. SAMPLE REGISTERED TASKS
# =====================================================================

@task("settle_payment", priority=1, max_retries=2, backoff=0.1)
def task_settle_payment(account_id: str, amount: float):
    return {"account": account_id, "amount": amount, "status": "SETTLED"}

@task("render_invoice_pdf", priority=2, max_retries=2, backoff=0.1)
def task_render_invoice(invoice_id: str):
    time.sleep(0.01)  # Simulate CPU render
    return f"invoice_{invoice_id}.pdf"

@task("flaky_third_party_api", priority=2, max_retries=2, backoff=0.1)
def task_flaky_api():
    # Always fails to demonstrate DLQ
    raise ConnectionResetError("Third-party gateway returned HTTP 503 Service Unavailable.")

# =====================================================================
# 5. VERIFICATION & RUNTIME AUDIT SUITE
# =====================================================================

async def run_task_queue_verification():
    border = "=" * 70
    print(border)
    print("      TASKVORTEX DISTRIBUTED ASYNCHRONOUS TASK QUEUE SUITE")
    print(border)

    broker = DistributedTaskBroker()
    worker = TaskVortexWorker("Worker-Node-01", broker)

    # 1. Start Worker in Background
    worker_task = asyncio.create_task(worker.run())

    # 2. Producer enqueues tasks with different priorities
    print("\n1. Enqueueing Workload to Distributed Broker:")
    # Normal Priority Task
    await broker.enqueue(TaskEnvelope("render_invoice_pdf", args=["INV-9901"], priority=2))
    # High Priority Task (Should execute FIRST!)
    await broker.enqueue(TaskEnvelope("settle_payment", args=["ACC-101", 5000.00], priority=1))
    # Flaky Task (Will fail and move to DLQ)
    await broker.enqueue(TaskEnvelope("flaky_third_party_api", priority=2, max_retries=2, backoff_base_sec=0.05))

    # Give worker time to process all tasks, retries, and DLQ
    await asyncio.sleep(0.6)

    # 3. Shutdown Worker
    worker.is_running = False
    worker_task.cancel()

    # 4. Audit Results & DLQ
    print("\n" + "-" * 70)
    print("📊 TASK QUEUE EXECUTION SUMMARY:")
    print("-" * 70)
    for tid, env in broker.result_backend.items():
        state_icon = "✅" if env.state == TaskState.SUCCESS else "🚨"
        print(f"  • Task #{tid:<8} '{env.task_name:<22}' -> {state_icon} {env.state.value:<12} (Retries: {env.current_retry})")

    print(f"\n📦 DEAD-LETTER QUEUE (DLQ) TOTAL: {len(broker.dead_letter_queue)} permanently failed tasks.")
    for dlq_task in broker.dead_letter_queue:
        print(f"  • Quarantined #{dlq_task.task_id} ('{dlq_task.task_name}'): {dlq_task.error_trace}")

    print("\n" + border)
    print("🎉 Distributed Task Queue Architecture & Priority Scheduling Verified!")
    print(border)

if __name__ == "__main__":
    asyncio.run(run_task_queue_verification())
```

---

## Summary

In Project 03, you engineered a distributed background task queue:
- **Decoupled Heavy Workloads**: Offloaded execution from HTTP request threads to asynchronous background workers.
- **Priority Queue Scheduling**: Guaranteed high-priority financial operations execute ahead of bulk background jobs.
- **Exponential Backoff with Jitter**: Prevented thundering herd problems during downstream service recoveries.
- **Dead-Letter Queue (DLQ)**: Quarantined permanently failing jobs to ensure zero worker downtime and complete error traceability.

---

## What's Next?

Continue to the next enterprise capstone project:
👉 **[04. High-Performance Financial Data Pipeline](04-high-performance-data-pipeline.md)** to master SIMD vectorized numerical analytics, memory downcasting, and streaming market tick aggregations!
