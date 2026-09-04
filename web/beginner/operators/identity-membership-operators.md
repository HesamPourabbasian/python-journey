# Identity & Membership Operators in Python

## Introduction

In daily software engineering, two questions arise constantly during data processing: *"Are these two variables pointing to the exact same object in memory?"* and *"Does this specific item exist inside this collection or text sequence?"*

Python addresses these fundamental computational questions with two dedicated, highly readable operator pairs: **Identity Operators (`is`, `is not`)** and **Membership Operators (`in`, `not in`)**.

While both operator families appear simple on the surface, understanding their internal mechanics and computational complexity is crucial for writing bug-free, high-performance applications. Confusing object identity (`is`) with value equality (`==`) is one of the most widespread causes of intermittent bugs in Python codebases. Similarly, performing membership checks (`in`) without understanding the underlying algorithmic time complexity—such as searching a linear list ($O(N)$) versus a hashed set ($O(1)$)—can degrade the performance of an application by orders of magnitude when datasets scale to millions of records.

This lesson concludes **Module 3: Operators & Expressions**, synthesizing object referencing, hashing, and sequence traversal into a comprehensive practical reference.

---

## Prerequisites

Before studying identity and membership operators, ensure you have:

- Completed [Variables & Memory Binding](../variables-data-types/variables.md) and [Mutable vs Immutable](../variables-data-types/mutable-vs-immutable.md).
- An understanding of the difference between memory addresses (`id()`) and object values.
- Basic familiarity with Python collections (lists, tuples, sets, dictionaries, strings).

---

## Core Concept

### 1. Identity Operators (`is`, `is not`)
Identity operators determine whether two variables reference the **exact same physical object in heap memory**.
- `a is b` evaluates to `True` if and only if `id(a) == id(b)`.
- Identity operators do not inspect or compare the internal values of objects; they execute a single, instantaneous pointer comparison at the C level.

### 2. Membership Operators (`in`, `not in`)
Membership operators test whether a target value or substring exists within a container (sequence, set, mapping, or string).
- In sequences (`list`, `tuple`): Iterates sequentially from index 0 to $N-1$ until a match is found ($O(N)$ linear search).
- In mappings (`dict`): Checks whether the item exists as a **key** using an internal hash table ($O(1)$ constant time).
- In sets (`set`, `frozenset`): Checks existence via hash table bucket lookup ($O(1)$ constant time).
- In strings (`str`): Searches for a substring using an optimized variation of the Boyer-Moore-Horspool algorithm.

```
+-----------------------------------------------------------------------------------+
|                        MEMBERSHIP SEARCH COMPLEXITY COMPARISON                    |
+-----------------------------------------------------------------------------------+
| Collection Type       | Underlying Structure  | Average Time Complexity           |
+-----------------------+-----------------------+-----------------------------------+
| list / tuple          | Contiguous Array      | O(N) - Linear Scan (Slow on large)|
| dict (Keys)           | Hash Table            | O(1) - Constant Time (Instant)    |
| set / frozenset       | Hash Table            | O(1) - Constant Time (Instant)    |
| str (Substring)       | Unicode Byte Buffer   | O(N + M) - Boyer-Moore-Horspool   |
+-----------------------------------------------------------------------------------+
```

---

## Syntax & Common Usage

```python
# 1. Identity Operators (is, is not)
user_session = None
if user_session is None:
    print("No active user session.")

# 2. Membership in Sequences
allowed_roles = ["admin", "editor", "moderator"]
current_role = "editor"
print("Has Role Access:", current_role in allowed_roles)  # True

# 3. Membership in Dictionaries (Checks KEYS by default!)
user_data = {"id": 101, "username": "Hesam", "status": "active"}
print("Has 'username' Key :", "username" in user_data)   # True
print("Has 'Hesam' as Key :", "Hesam" in user_data)      # False! (Hesam is a VALUE)
print("Has 'Hesam' as Val :", "Hesam" in user_data.values()) # True (Linear scan!)

# 4. Membership in Strings (Substring Search)
log_entry = "ERROR: Database connection timeout on port 5432"
if "timeout" in log_entry:
    print("Alert: Timeout detected!")

# 5. Inverted Membership (not in)
if "guest" not in allowed_roles:
    print("Guest access rejected.")
```

---

## Detailed Explanation

### 1. The Definitive Distinction: `is` vs `==`

- **`==` (Equality)**: Compares the **values** of two objects by invoking the `__eq__()` method. Two distinct objects in memory with identical values evaluate as `True`.
- **`is` (Identity)**: Compares the **memory addresses** (`id()`) of two objects. Evaluates as `True` only if both variables point to the exact same block of RAM.

```python
list_a = [1, 2, 3]
list_b = [1, 2, 3]
list_c = list_a

print("list_a == list_b :", list_a == list_b)  # True  (Identical contents)
print("list_a is list_b :", list_a is list_b)  # False (Distinct heap allocations!)
print("list_a is list_c :", list_a is list_c)  # True  (Exact same memory reference)
```

**Rule of Thumb**: Reserve `is` strictly for checking singletons (`is None`, `is True`, `is False`, or private `object()` sentinels). Use `==` for all numeric, string, and collection comparisons.

### 2. The `__contains__()` Protocol

When you evaluate `item in container`, Python follows a strict protocol:
1. It checks if `container` defines a `__contains__()` method. If so, it calls `container.__contains__(item)`.
2. If `__contains__()` is not implemented, Python falls back to the iteration protocol (`__iter__()`), iterating through items sequentially until a match is found.
3. If neither is implemented, it attempts integer index lookup (`__getitem__()`) from index $0$ onward until `IndexError` is raised.

### 3. Idiomatic Inversion: `x not in container`

Always write `x not in container` rather than `not x in container`. While both produce identical boolean results, `x not in container` is idiomatic Python that reads like natural English and eliminates operator precedence ambiguities.

---

## Examples

### 1. Simple: Identity vs Equality Demonstration
Comparing integers, strings, and lists across identity and equality operators.

```python
x = 1000
y = int("1000")

print(f"Values equal (x == y)      : {x == y}")
print(f"Memory identical (x is y)  : {x is y} (id(x)={id(x)}, id(y)={id(y)})")

# Re-assigning reference
z = x
print(f"Aliased reference (x is z) : {x is z}")
```

### 2. Beginner: Dictionary Key vs Value Membership
Clarifying how membership behaves across dictionary keys, values, and item pairs.

```python
service_ports = {"http": 80, "https": 443, "ssh": 22, "smtp": 25}

# Checking Keys (Fast O(1) Hash Lookup)
print("Is 'https' a configured service? :", "https" in service_ports)
print("Is 'ftp' a configured service?   :", "ftp" in service_ports)

# Checking Values (O(N) Linear Scan across values)
print("Is Port 22 in use?               :", 22 in service_ports.values())

# Checking Key-Value Tuples (O(1) average)
print("Is ('ssh', 22) valid pair?       :", ("ssh", 22) in service_ports.items())
```

### 3. Intermediate: Benchmarking $O(1)$ Set Lookup vs $O(N)$ List Lookup
Measuring the performance difference when searching for items in a large list versus a set.

```python
import time

# Create a collection of 1,000,000 items
TOTAL_ITEMS = 1_000_000
data_list = list(range(TOTAL_ITEMS))
data_set = set(data_list)

target_item = 999_999  # Worst-case search target (at the very end)

# 1. Benchmark List Membership (Linear O(N) scan)
start = time.perf_counter()
for _ in range(100):
    _ = target_item in data_list
list_time = time.perf_counter() - start

# 2. Benchmark Set Membership (Constant O(1) hash lookup)
start = time.perf_counter()
for _ in range(100):
    _ = target_item in data_set
set_time = time.perf_counter() - start

print(f"100 List Lookups (O(N)) : {list_time:.6f} seconds")
print(f"100 Set Lookups  (O(1)) : {set_time:.6f} seconds")
print(f"Speedup Factor          : {list_time / set_time:,.1f}x FASTER!")
```

### 4. Real-World: IP Blacklist and Authentication Firewall
Implementing a high-performance network security firewall using fast set membership testing.

```python
class NetworkFirewall:
    def __init__(self, blocked_ips: set[str], blocked_subnets: list[str]):
        # Store individual IPs in a set for O(1) instant lookup
        self.blocked_ips = blocked_ips
        self.blocked_subnets = blocked_subnets

    def is_request_allowed(self, client_ip: str, path: str) -> tuple[bool, str]:
        # 1. Instant O(1) IP Check
        if client_ip in self.blocked_ips:
            return False, f"Client IP '{client_ip}' is in the active blocklist."

        # 2. Subnet Prefix Matching (Linear string scan)
        for subnet in self.blocked_subnets:
            if client_ip.startswith(subnet):
                return False, f"Client IP '{client_ip}' belongs to blocked subnet '{subnet}'."

        # 3. Path Security Check
        restricted_paths = {"/admin/debug", "/etc/passwd", "/api/v1/dump"}
        if path in restricted_paths:
            return False, f"Access to restricted endpoint '{path}' is forbidden."

        return True, "Request allowed."

firewall = NetworkFirewall(
    blocked_ips={"192.168.1.50", "10.0.0.99", "172.16.4.12"},
    blocked_subnets=["198.51.100."]
)

print(firewall.is_request_allowed("192.168.1.50", "/dashboard"))
print(firewall.is_request_allowed("198.51.100.44", "/home"))
print(firewall.is_request_allowed("10.0.0.1", "/admin/debug"))
print(firewall.is_request_allowed("10.0.0.1", "/profile"))
```

### 5. Advanced: Implementing the `__contains__()` Protocol in Custom Classes
Creating a geometric `BoundingBox2D` class that supports the `in` operator to test whether a coordinate point falls within its boundaries.

```python
class BoundingBox2D:
    def __init__(self, min_x: float, min_y: float, max_x: float, max_y: float):
        self.min_x = min_x
        self.min_y = min_y
        self.max_x = max_x
        self.max_y = max_y

    def __contains__(self, point: tuple[float, float]) -> bool:
        """Called automatically when evaluating 'point in bounding_box'."""
        if not isinstance(point, tuple) or len(point) != 2:
            return False
        x, y = point
        # Test if point coordinates fall within bounds
        return (self.min_x <= x <= self.max_x) and (self.min_y <= y <= self.max_y)

    def __repr__(self) -> str:
        return f"BoundingBox2D(x:[{self.min_x}, {self.max_x}], y:[{self.min_y}, {self.max_y}])"

viewport = BoundingBox2D(min_x=0.0, min_y=0.0, max_x=1920.0, max_y=1080.0)

player_pos = (500.0, 320.0)
out_of_bounds_pos = (2048.0, 500.0)

print(f"Is player inside viewport?      : {player_pos in viewport}")          # True
print(f"Is enemy outside viewport?       : {out_of_bounds_pos not in viewport}")# True
```

---

## Code Explanation

In Example 5 (Custom `__contains__` Protocol):
1. The `BoundingBox2D` class implements the `__contains__(self, item)` magic method.
2. When Python encounters `player_pos in viewport`, it translates the expression directly into `viewport.__contains__(player_pos)`.
3. The method extracts the $(x, y)$ coordinates and executes a chained comparison against the bounding box limits, returning a strict boolean.
4. When Python evaluates `out_of_bounds_pos not in viewport`, it evaluates `not viewport.__contains__(out_of_bounds_pos)`.
5. This illustrates how Python's operator model allows custom domain entities to participate seamlessly in standard language syntax.

---

## Common Mistakes

### Mistake 1: Using `is` to Compare Literal Numbers or Strings
In CPython, small integers (`[-5, 256]`) and small string constants are cached (interned), causing `x is 10` to return `True` by coincidence in simple scripts, but fail unexpectedly in production when values exceed the cache threshold.

```python
# DANGEROUS AND WRONG:
user_code = int("500")
if user_code is 500:  # Emits SyntaxWarning and fails on numbers > 256! ❌
    pass

# CORRECT:
if user_code == 500:  # Compares values reliably ✅
    pass
```

### Mistake 2: Checking Values with `in dict`
Writing `"admin" in user_roles_dict` checks the dictionary's **keys**, not its values. To check values, you must explicitly call `in user_roles_dict.values()`.

---

## Best Practices

### Use Sets for Frequent Membership Searches
If your code performs repeated `item in collection` checks inside loops or high-throughput API endpoints, convert the collection from a `list` to a `set` beforehand.

Good:
```python
# Convert to set ONCE outside the loop: O(1) lookups
valid_ids_set = set(fetch_all_valid_user_ids())

for record in incoming_records:
    if record["user_id"] in valid_ids_set:  # O(1) instant check!
        process(record)
```

Avoid:
```python
# Scanning a list inside a loop: O(M * N) quadratic slowdown!
valid_ids_list = fetch_all_valid_user_ids()

for record in incoming_records:
    if record["user_id"] in valid_ids_list:  # O(N) slow scan on every iteration!
        process(record)
```

---

## Performance Considerations

1. **Hash Table Lookup Mechanics ($O(1)$)**: Sets and dictionary keys compute the item's integer hash (`hash(item)`) and jump directly to the computed memory bucket. The lookup time is constant whether the set contains 10 items or 10,000,000 items.
2. **String Substring Search**: Python's string `in` operator uses an internal C-level search algorithm (a hybrid of Boyer-Moore and Horspool). It pre-computes character skips, allowing the search to skip over large swaths of text when scanning megabytes of logs.

---

## Security Considerations

1. **Denial of Service via Unbounded Linear Membership Checks**: Exposing an API endpoint that executes `target in large_list` on every request allows attackers to trigger CPU exhaustion by submitting targets that do not exist (forcing full $O(N)$ traversal every time).
2. **Timing Attacks on Membership Checking**: When checking whether a username exists in an authentication database, ensure that the time taken to check membership does not leak information to attackers attempting user enumeration.

---

## Real-World Usage

- **API Token Revocation (Blocklists)**: Microservices maintain Redis or in-memory sets of revoked JWT tokens, verifying `token_id not in revoked_set` on every incoming HTTP request.
- **Search Engines & NLP Stopwords**: Natural Language Processing pipelines strip filler words by testing `if token.lower() not in STOPWORDS_SET`.
- **RBAC Feature Flags**: Checking user roles against permitted capability sets (`"can_export_csv" in user_permissions`).

---

## Comparison: Membership Lookup Performance

| Data Structure | Lookup Syntax | Underlying Algorithm | Time Complexity | Best Practice Recommendation |
|---|---|---|---|---|
| **`set` / `frozenset`** | `x in my_set` | Hash Table Bucket Lookup | **$O(1)$ Average** | Primary choice for membership checking |
| **`dict` (Keys)** | `k in my_dict` | Hash Table Bucket Lookup | **$O(1)$ Average** | Primary choice for key existence |
| **`dict` (Values)** | `v in my_dict.values()` | Linear Array Traversal | **$O(N)$ Linear** | Convert to set if checking values repeatedly |
| **`list`** | `x in my_list` | Linear Array Scan | **$O(N)$ Linear** | Fine for $< 20$ items; convert to set for large |
| **`tuple`** | `x in my_tuple` | Linear Array Scan | **$O(N)$ Linear** | Use for small fixed literal checks (`in (1, 2)`) |
| **`str`** | `sub in text` | Boyer-Moore-Horspool | **$O(N + M)$** | Highly optimized C-level substring search |

---

## Advanced Concepts: The `PySequence_Contains` C Implementation

In CPython (`Objects/abstract.c`), membership evaluation routes through `PySequence_Contains`:

```c
int
PySequence_Contains(PyObject *seq, PyObject *ob)
{
    PySequenceMethods *sq = Py_TYPE(seq)->tp_as_sequence;
    if (sq != NULL && sq->sq_contains != NULL)
        return (*sq->sq_contains)(seq, ob);  // Direct __contains__ hook
    
    // Fallback: iterate over sequence sequentially
    return _PySequence_IterSearch(seq, ob, PY_ITERSEARCH_CONTAINS);
}
```

If the object's C type defines `sq_contains` (as `set`, `dict`, and `list` do), CPython invokes the specialized C function directly without creating intermediary Python frame objects, maximizing execution throughput.

---

## Exercises

### Exercise 1 — Beginner
Create a list of 5 prohibited usernames (e.g., `"admin"`, `"root"`, `"support"`). Prompt a user to enter a desired username, and print whether the username is available or prohibited using `not in`.

### Exercise 2 — Intermediate
Write a function `filter_duplicate_words(text: str) -> list[str]` that splits a text paragraph into words, iterates through them, and builds a list of unique words in their original order of appearance using a secondary `seen` set and the `in` operator.

### Exercise 3 — Advanced
Build a `DateRange` class that represents a start and end `datetime.date`. Implement `__contains__()` so that you can evaluate `target_date in date_range` to determine whether a given date falls within the range (inclusive of start, exclusive of end).

---

## Mini Project: High-Speed URL Routing & Security Firewall Filter

### Requirements
Create a production-grade URL filtering engine named `url_filter.py` that validates incoming HTTP requests by checking domains, paths, and query tokens against fast hashed blocklists and allowed route patterns.

### Implementation Blueprint
```python
class URLRoutingFilter:
    def __init__(self, allowed_domains: set[str], blocked_paths: set[str], required_roles: dict[str, set[str]]):
        self.allowed_domains = allowed_domains
        self.blocked_paths = blocked_paths
        self.required_roles = required_roles

    def evaluate_request(self, domain: str, path: str, user_role: str = None) -> tuple[bool, str]:
        # 1. Fast O(1) Domain Whitelist Check
        if domain not in self.allowed_domains:
            return False, f"Domain '{domain}' is not in the allowed domains whitelist."

        # 2. Fast O(1) Path Blacklist Check
        if path in self.blocked_paths:
            return False, f"Access to restricted path '{path}' is blocked."

        # 3. Role-Based Route Protection
        if path in self.required_roles:
            permitted_roles = self.required_roles[path]
            if user_role is None or user_role not in permitted_roles:
                return False, f"Role '{user_role}' is not authorized for endpoint '{path}'."

        return True, "Request permitted."

if __name__ == "__main__":
    router = URLRoutingFilter(
        allowed_domains={"api.company.com", "auth.company.com"},
        blocked_paths={"/.env", "/wp-admin", "/server-status"},
        required_roles={
            "/api/v1/admin/users": {"superadmin", "secops"},
            "/api/v1/billing": {"finance", "superadmin"}
        }
    )
    
    print("=" * 60)
    print("           HIGH-SPEED ROUTING SECURITY FILTER")
    print("=" * 60)
    
    test_cases = [
        ("malicious.com", "/api/v1/data", "developer"),
        ("api.company.com", "/.env", None),
        ("api.company.com", "/api/v1/admin/users", "developer"),
        ("api.company.com", "/api/v1/admin/users", "superadmin"),
        ("api.company.com", "/api/v1/public/health", None)
    ]
    
    for domain, path, role in test_cases:
        allowed, reason = router.evaluate_request(domain, path, role)
        status = "✅ ALLOWED" if allowed else "❌ BLOCKED"
        print(f"Request: {domain}{path:<20} Role: {str(role):<12} -> {status} ({reason})")
    print("=" * 60)
```

---

## Summary

In this lesson, you mastered Python's identity and membership operators:
- **Identity (`is`, `is not`)** compares physical heap memory addresses (`id()`). Use strictly for singletons like `None`.
- **Value Equality (`==`, `!=`)** compares data contents via `__eq__()`.
- **Membership (`in`, `not in`)** tests whether an element exists inside a container via `__contains__()`.
- Set and dictionary key membership lookups operate in **$O(1)$ constant time**, while list and tuple searches require **$O(N)$ linear scans**.
- Substring searches in strings leverage CPython's Boyer-Moore-Horspool algorithm.
- Always write `x not in container` for readable, idiomatic code.

---

## Best Practices Checklist

- [ ] Use `is None` and `is not None` for checking null singletons.
- [ ] Use `==` for comparing numbers, strings, lists, and data models.
- [ ] Convert lists to `set` when performing repeated membership lookups on large collections.
- [ ] Write `item not in collection` instead of `not item in collection`.
- [ ] Implement `__contains__()` on custom spatial or container classes to support the `in` operator.

---

## What's Next?

Congratulations! You have completed **Module 3: Operators & Expressions**.
Now continue to **Module 4: Strings in Depth**:
👉 **[String Formatting](string-formatting.md)** to master f-strings, format specifiers, `%`-formatting, and `str.format()`.
