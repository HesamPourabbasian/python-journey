# While Loops & Indefinite Iteration in Python

## Introduction

In computer programming, not all tasks have a predetermined number of iterations. When you iterate over a list of 100 items or generate a sequence of 50 numbers, you are performing **Definite Iteration** (typically implemented with a `for` loop). However, in countless real-world scenarios, an application does not know in advance how many times an operation must repeat.

Consider a web server waiting for incoming network connections, a user interactive prompt continuously prompting for input until a valid format is entered, a mathematical algorithm iteratively refining an approximation until it converges within a specified tolerance, or a database client repeatedly attempting reconnection after a network outage. These scenarios require **Indefinite Iteration**, powered in Python by the **`while` loop**.

A `while` loop continues executing its code block as long as a specified boolean condition remains `True` (truthy). Mastering `while` loops requires understanding loop condition evaluation timing, state progression mechanisms to prevent runaway infinite loops, sentinel control patterns, polling strategies with exponential backoff, and the proper design of interactive event loops.

This lesson builds upon [Conditional Statements](conditional-statements.md) and [For Loops](for-loops.md), establishing the tools necessary to handle dynamic, event-driven, and condition-governed execution.

---

## Prerequisites

Before studying `while` loops, ensure you have:

- Completed [Conditional Statements](conditional-statements.md) and [Comparison & Logical Operators](../operators/comparison-logical-operators.md).
- A solid understanding of Python's truthiness rules (`bool()` evaluation).
- Familiarity with modifying variable values in place (`+=`, `-=`).

---

## Core Concept

A `while` loop evaluates a boolean expression **before each iteration**. If the condition evaluates to `True`, the loop body executes. If the condition evaluates to `False`, the loop terminates immediately.

```
                           WHILE LOOP EXECUTION CYCLE

                              [ Evaluate Condition ]
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  ▼ (True)                                    ▼ (False)
        [ Execute Loop Body ]                        [ Terminate Loop ]
                  │                                           │
        [ State Progression ]                                 ▼
                  │                                  [ Continue Program ]
                  └─────────────────────► (Repeat)
```

### The Three Imperatives of a While Loop:
1. **Initialization**: Variables governing the condition must be initialized before the loop begins.
2. **Evaluation**: The condition is tested at the beginning of each iteration.
3. **State Progression**: The loop body **must** modify at least one variable affecting the condition, ensuring the loop eventually terminates.

---

## Syntax & Common Loop Patterns

```python
# 1. Standard Counter-Driven While Loop
count = 5
while count > 0:
    print(f"Countdown: {count}")
    count -= 1  # State progression!
print("Blastoff! 🚀")

# 2. The Idiomatic Infinite Loop (while True) with Early Break
while True:
    user_input = input("Enter command ('exit' to quit): ").strip()
    if user_input.lower() == "exit":
        print("Terminating session.")
        break  # Clean exit
    print(f"Executing: {user_input}")

# 3. Sentinel-Controlled Loop
SENTINEL = "QUIT"
command = ""
while command.upper() != SENTINEL:
    command = input(f"Enter payload (type {SENTINEL} to stop): ")
```

---

## Detailed Explanation

### 1. Condition Evaluation Timing

In a `while` loop, the condition is evaluated **only at the start of each iteration**, not continuously throughout the loop body. If a condition becomes temporarily false halfway through the loop body, execution will still complete the remaining statements in the block before testing the condition again.

```python
x = 0
while x < 3:
    x += 1
    print(f"Inside loop: x = {x}")
    # Even if x == 3 here, following lines still execute for this iteration!
    print("  -> Finishing iteration block...")
```

### 2. The Danger of "Spinlocking" / Busy-Waiting

An infinite loop that runs without pausing or yielding CPU control is known as a **Busy-Wait** (or Spinlock). Executing `while not condition: pass` without a sleep interval pins the CPU core to 100% utilization, causing excessive power consumption and freezing other system processes.

When polling external resources (databases, files, network sockets), always introduce a non-blocking pause using `time.sleep()`:

```python
import time

def poll_job_status(job_id: str):
    # POLLING WITH BACKOFF: Prevents 100% CPU spinlock
    while not check_if_job_complete(job_id):
        print("Job still running... Waiting 2 seconds.")
        time.sleep(2.0)  # Yields CPU execution to OS
    print("Job completed successfully!")
```

### 3. Avoiding the "Loop-and-a-Half" Anti-Pattern

When prompting users for input, beginners often duplicate the `input()` call once before the loop and again inside the loop:

```python
# ANTI-PATTERN: Duplicated code (Loop-and-a-half)
response = input("Enter 'yes' or 'no': ")
while response not in ("yes", "no"):
    print("Invalid choice. Try again.")
    response = input("Enter 'yes' or 'no': ")  # Duplicated prompt!

# IDIOMATIC PATTERN: 'while True' with inline validation
while True:
    response = input("Enter 'yes' or 'no': ").strip().lower()
    if response in ("yes", "no"):
        break
    print("Invalid choice. Try again.")
```

---

## Examples

### 1. Simple: Numeric Accumulation and Threshold Crossing
Simulating a compounding savings balance until a target financial milestone is reached.

```python
balance = 1000.0
target_goal = 2500.0
annual_rate = 0.08
years = 0

while balance < target_goal:
    balance *= (1.0 + annual_rate)
    years += 1
    print(f"Year {years:02d}: Balance = ${balance:,.2f}")

print(f"\nTarget achieved! It took {years} years to exceed ${target_goal:,.2f}.")
```

### 2. Beginner: Robust User Input Validator
Repeatedly prompting a user for an integer until valid numeric data within a specific range is entered.

```python
def prompt_for_age() -> int:
    while True:
        raw_val = input("Please enter your age (1 - 120): ").strip()
        
        # Validate that input contains only digits
        if not raw_val.isdigit():
            print("Error: Input must be a positive whole number. Please try again.")
            continue
            
        age = int(raw_val)
        if 1 <= age <= 120:
            return age
            
        print(f"Error: Age {age} is outside the valid range of 1 to 120.")

# age = prompt_for_age()
```

### 3. Intermediate: Newton-Raphson Numerical Root Convergence
Approximating the square root of a number using the iterative Newton-Raphson algorithm until successive estimates differ by less than $10^{-10}$.

```python
def compute_square_root_newton(target: float, tolerance: float = 1e-10) -> float:
    if target < 0:
        raise ValueError("Cannot compute square root of negative number.")
    if target == 0:
        return 0.0

    # Initial guess
    guess = target / 2.0
    iteration = 0
    
    # Iterate until approximation error is below tolerance
    while abs(guess * guess - target) > tolerance:
        guess = (guess + target / guess) / 2.0
        iteration += 1
        
    print(f"Converged in {iteration} iterations.")
    return guess

calc_root = compute_square_root_newton(612.0)
import math
print(f"Newton's Approximation : {calc_root:.10f}")
print(f"math.sqrt() Reference  : {math.sqrt(612.0):.10f}")
```

### 4. Real-World: Exponential Backoff Network Retry Loop
Simulating an enterprise API client that retries failed network calls with progressive delays ($1\text{s}, 2\text{s}, 4\text{s}, 8\text{s}$) up to a maximum attempt threshold.

```python
import time
import random

def simulate_network_request() -> bool:
    """Simulates a flaky network call (70% failure rate)."""
    return random.random() > 0.70

def execute_with_exponential_backoff(max_retries: int = 4, base_delay_sec: float = 1.0) -> bool:
    attempt = 1
    current_delay = base_delay_sec

    while attempt <= max_retries:
        print(f"[Attempt #{attempt}] Sending HTTP request...")
        
        if simulate_network_request():
            print("✅ HTTP 200 OK: Request succeeded!")
            return True
            
        print(f"⚠️ HTTP 503 Service Unavailable. Retrying in {current_delay:.1f}s...")
        time.sleep(current_delay)
        
        # Exponential backoff progression: 1s -> 2s -> 4s -> 8s
        current_delay *= 2.0
        attempt += 1

    print("🚨 FATAL: Maximum retry attempts exhausted. Operation failed.")
    return False

# Test run
execute_with_exponential_backoff(max_retries=3, base_delay_sec=0.5)
```

### 5. Advanced: Producer-Consumer Queue Processor with Poison Pill Sentinel
Building an event loop that dequeues and processes background tasks until a termination sentinel (`None`) is received.

```python
from collections import deque
import time

class TaskQueueWorker:
    def __init__(self):
        self.queue = deque()
        self.processed_count = 0

    def enqueue(self, task_name: str | None):
        self.queue.append(task_name)

    def run_worker_loop(self):
        print("🚀 Worker thread started. Listening for tasks...")
        
        while True:
            # Check if queue has tasks
            if not self.queue:
                print("Queue empty. Worker idling...")
                time.sleep(0.5)
                continue
                
            task = self.queue.popleft()
            
            # Check for Poison Pill termination sentinel
            if task is None:
                print("🛑 Poison Pill received! Worker shutting down cleanly.")
                break
                
            # Process standard task
            print(f"  -> Processing task: '{task}'")
            self.processed_count += 1
            
        print(f"Worker stopped. Total tasks processed: {self.processed_count}")

worker = TaskQueueWorker()
worker.enqueue("GenerateDailyInvoice")
worker.enqueue("SendWelcomeEmail")
worker.enqueue("SyncInventoryData")
worker.enqueue(None)  # Poison pill to stop worker

worker.run_worker_loop()
```

---

## Code Explanation

In Example 5 (Task Queue Worker):
1. A `deque` (double-ended queue) stores incoming task names.
2. The `while True:` loop executes indefinitely, waiting for events.
3. If tasks are present, `queue.popleft()` extracts tasks in First-In, First-Out (FIFO) order.
4. When `task is None` (the Poison Pill sentinel) is encountered, the loop executes `break`, terminating the worker loop cleanly.
5. This architecture is the foundational pattern behind asynchronous message workers (such as Celery, RabbitMQ, and Redis background task runners).

---

## Common Mistakes

### Mistake 1: Forgetting State Progression (Accidental Infinite Loop)
Omitting the statement that modifies the loop condition causes the loop to run indefinitely, freezing the program.

```python
# BROKEN:
counter = 0
while counter < 5:
    print(counter)
    # Missing: counter += 1 -> INFINITE LOOP! ❌
```

### Mistake 2: Off-By-One Boundary Errors
Using `<` instead of `<=` (or vice versa) results in running one iteration too few or too many.

```python
# If you want numbers 1 through 5:
i = 1
while i < 5:   # Stops at 4! ❌
    i += 1

while i <= 5:  # Correctly includes 5 ✅
    i += 1
```

---

## Best Practices

### Always Enforce Hard Maximum Iteration Safeguards
When writing indefinite convergence algorithms or retry loops, always include a maximum iteration guard to prevent runaway execution in edge-case failures.

Good:
```python
MAX_ITERATIONS = 1000
iteration = 0

while abs(delta) > tolerance and iteration < MAX_ITERATIONS:
    delta = refine_estimate()
    iteration += 1

if iteration >= MAX_ITERATIONS:
    raise TimeoutError("Algorithm failed to converge within maximum permitted iterations.")
```

Avoid:
```python
# If floating point precision never reaches tolerance, loops forever!
while abs(delta) > tolerance:
    delta = refine_estimate()
```

---

## Performance Considerations

1. **`for` vs `while` Overhead**: A `for` loop over `range(N)` is compiled into C-level `FOR_ITER` opcodes and runs **~30% faster** than a `while` loop that manually increments a Python integer `i += 1` on every iteration. Use `for` loops whenever the number of iterations is known.
2. **CPU Yielding**: Always insert `time.sleep()` in polling `while` loops to release the CPU to the operating system scheduler.

---

## Security Considerations

1. **Denial of Service (DoS) via Endless Processing**: If a user can control the data that governs a `while` loop condition (such as traversing a linked list or pagination cursor), an attacker submitting circular data can lock the server thread indefinitely. Always enforce hard timeouts.
2. **Memory Leak Accumulation**: When appending data inside an infinite `while True` daemon, ensure data structures are regularly pruned or garbage collected to prevent slow memory exhaustion crashes.

---

## Real-World Usage

- **Web Server Sockets**: Network daemons listening on TCP ports (`while True: client_sock, addr = server_sock.accept()`).
- **Database Connection Pools**: Continuously monitoring pool health and recycling stale connections.
- **Game Loops (Pygame / Godot)**: Executing game logic, updating entity physics, and rendering frames at 60 FPS.

---

## Comparison: Iteration Strategies

| Strategy | When to Use | Termination Mechanism | Risk of Infinite Loop |
|---|---|---|---|
| **`for` Loop** | Known collection or fixed range | Sequence exhaustion (`StopIteration`) | Zero (Guaranteed finish) |
| **`while` Loop** | Indefinite condition / Dynamic state | Boolean condition evaluates `False` | **High** (If state fails to progress) |
| **`while True:`**| Event loops, daemons, user prompts | Explicit `break` or `return` | **High** (If break unreachable) |

---

## Advanced Concepts: Bytecode Compilation of `while` Loops

When Python compiles a `while` loop, it generates conditional jump opcodes:

```python
import dis

def countdown(n):
    while n > 0:
        n -= 1

dis.dis(countdown)
```

1. Evaluates condition `n > 0`.
2. `POP_JUMP_IF_FALSE`: If false, jumps forward past the loop body.
3. If true, executes `n -= 1`.
4. `JUMP_BACKWARD`: Jumps back to the condition evaluation at step 1.

---

## Exercises

### Exercise 1 — Beginner
Write a Python script using a `while` loop that calculates the sum of all odd integers between 1 and 50. Print each number as it is added and output the final total.

### Exercise 2 — Intermediate
Write a number guessing game using a `while True` loop. The computer picks a random integer between 1 and 100. Prompt the user for guesses, print `"Higher"` or `"Lower"`, track the number of attempts, and terminate with a victory message when the correct number is guessed.

### Exercise 3 — Advanced
Build a `CircuitBreaker` class that wraps an unstable operation. Use a `while` loop with exponential backoff and jitter. If the operation fails 5 consecutive times, transition the circuit breaker state to `"OPEN"` (rejecting further attempts for 30 seconds) before attempting a `"HALF-OPEN"` recovery probe.

---

## Mini Project: Network Health Monitor & Auto-Recovery Daemon

### Requirements
Build a resilient background monitoring engine named `health_monitor.py` that continuously checks server endpoints using an indefinite `while` loop, logs uptime metrics, detects connectivity outages, and triggers an automated recovery workflow when consecutive failures occur.

### Implementation Blueprint
```python
import time
import random

class ServerHealthDaemon:
    def __init__(self, target_server: str, check_interval_sec: float = 1.0, max_cycles: int = 8):
        self.server = target_server
        self.interval = check_interval_sec
        self.max_cycles = max_cycles
        self.consecutive_failures = 0
        self.total_checks = 0

    def ping_server(self) -> bool:
        """Simulate pinging a remote server (80% online probability)."""
        return random.random() > 0.25

    def trigger_auto_recovery(self):
        print("  🚨 [AUTO-RECOVERY] Consecutive failures exceeded threshold! Restarting service daemon...")
        time.sleep(0.5)
        self.consecutive_failures = 0
        print("  ✅ [AUTO-RECOVERY] Service daemon restarted successfully.")

    def run_monitor(self):
        print("=" * 60)
        print(f"   STARTING HEALTH MONITOR DAEMON FOR: {self.server}")
        print("=" * 60)
        
        while self.total_checks < self.max_cycles:
            self.total_checks += 1
            is_healthy = self.ping_server()
            timestamp = time.strftime("%H:%M:%S")
            
            if is_healthy:
                self.consecutive_failures = 0
                print(f"[{timestamp}] Check #{self.total_checks:02d}: {self.server} -> 🟢 ONLINE (200 OK)")
            else:
                self.consecutive_failures += 1
                print(f"[{timestamp}] Check #{self.total_checks:02d}: {self.server} -> 🔴 DOWN (Failures: {self.consecutive_failures})")
                
                if self.consecutive_failures >= 2:
                    self.trigger_auto_recovery()
                    
            time.sleep(self.interval)
            
        print("=" * 60)
        print(f"Monitoring cycle finished. Total checks: {self.total_checks}")

if __name__ == "__main__":
    daemon = ServerHealthDaemon("api.cloud.internal", check_interval_sec=0.5, max_cycles=6)
    daemon.run_monitor()
```

---

## Summary

In this lesson, you mastered Python's `while` loops and indefinite iteration architecture:
- `while` loops perform **indefinite iteration**, executing as long as a condition evaluates to `True`.
- The loop condition is evaluated only at the start of each iteration.
- Every `while` loop requires **state progression** inside the loop body to prevent runaway infinite loops.
- Use `while True:` combined with `break` to eliminate code duplication in user input prompts and event loops.
- Always include `time.sleep()` in polling loops to prevent 100% CPU spinlocking.
- Enforce hard maximum iteration counters on numerical convergence and network retry loops.

---

## Best Practices Checklist

- [ ] Ensure all code paths inside a `while` loop make progress toward the termination condition.
- [ ] Enforce a `MAX_RETRIES` or `timeout` limit on all indefinite loops.
- [ ] Add non-blocking `time.sleep()` inside polling and listener loops.
- [ ] Use `while True:` with early `break` for interactive user prompts.
- [ ] Prefer `for` loops when iterating over known collections or fixed ranges.

---

## What's Next?

Now that you understand both `for` and `while` loops, continue to:
👉 **[Break, Continue & Pass](break-continue-pass.md)** to master loop jump control statements and Python's unique Loop `else` clause.
