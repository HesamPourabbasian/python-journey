# Sets & Frozensets in Python

## Introduction

In discrete mathematics and computer science, a **Set** is an unordered collection of distinct, unique elements. Whether an application is deduplicating millions of web crawler URLs, computing the intersection of user interest tags for recommendation algorithms, testing access permissions across security roles, or finding differences between database schemas, set theory operations provide an exceptionally expressive and performant foundation.

Python natively implements mathematical set theory through two dedicated built-in types: the mutable **`set`** and the immutable **`frozenset`**.

Like dictionaries, Python sets are implemented internally using high-performance **Hash Tables**. Consequently, searching for an item in a set (`item in my_set`) executes in **$O(1)$ constant average time**, completely independent of whether the set contains five elements or five million elements.

Mastering Python sets requires understanding the uniqueness constraint, the hashability requirement for elements, the distinction between operator syntax (e.g., `|`, `&`) and method syntax (e.g., `.union()`, `.intersection()`), in-place mutation vs set returns, and when to leverage immutable `frozenset` instances as dictionary keys.

This lesson builds directly upon [Lists](lists.md) and [Dictionaries](dictionaries.md), giving you full command over Python's set theory capabilities.

---

## Prerequisites

Before studying sets, ensure you have:

- Completed [Mutable vs Immutable Objects](../variables-data-types/mutable-vs-immutable.md).
- Completed [Dictionaries & Hash Tables](dictionaries.md) and mastered the concept of object hashability.
- Basic familiarity with mathematical Venn diagrams (Union, Intersection, Difference).

---

## Core Concept

A Python `set` is a **mutable, unordered collection of unique, hashable elements**.

```
                               MATHEMATICAL SET THEORY IN PYTHON

           SET A: {1, 2, 3}                         SET B: {3, 4, 5}
      ┌─────────────────────────┐             ┌─────────────────────────┐
      │         SET A           │             │         SET B           │
      │        ┌───────┐        │             │        ┌───────┐        │
      │        │ 1   2 │   3    │             │   3    │ 4   5 │        │
      │        └───────┘        │             │        └───────┘        │
      └─────────────────────────┘             └─────────────────────────┘

      • UNION (A | B)                  -> {1, 2, 3, 4, 5} (All unique items)
      • INTERSECTION (A & B)           -> {3}             (Common items in both)
      • DIFFERENCE (A - B)             -> {1, 2}          (In A, but not in B)
      • SYMMETRIC DIFFERENCE (A ^ B)   -> {1, 2, 4, 5}    (In either A or B, but NOT both)
```

### The Three Rules of Sets:
1. **Uniqueness**: Duplicate elements are automatically discarded upon insertion.
2. **Unordered**: Elements have no index positions (`s[0]` raises `TypeError`).
3. **Hashable Elements Only**: Every element in a set must be immutable and hashable (`int`, `float`, `str`, `tuple`, `frozenset`). Mutable objects (`list`, `dict`, `set`) cannot be elements of a set.

---

## Syntax & Essential Set Operations

```python
# 1. Set Creation
# CAUTION: {} creates an empty DICTIONARY! Use set() for an empty set:
empty_set = set()
fruits = {"apple", "banana", "cherry", "apple"}  # Duplicate 'apple' automatically removed!

# 2. Immutable Frozenset
frozen_tags = frozenset(["security", "audit", "compliance"])

# 3. Element Mutation (set only)
fruits.add("orange")          # Adds single item
fruits.discard("banana")      # Removes 'banana' safely (No error if missing)
fruits.remove("apple")        # Removes 'apple' (Raises KeyError if missing!)
popped_item = fruits.pop()    # Removes and returns an arbitrary element

# 4. Mathematical Set Operators
set_a = {1, 2, 3, 4}
set_b = {3, 4, 5, 6}

print(set_a | set_b)          # Union: {1, 2, 3, 4, 5, 6}
print(set_a & set_b)          # Intersection: {3, 4}
print(set_a - set_b)          # Difference (in A, not B): {1, 2}
print(set_a ^ set_b)          # Symmetric Difference: {1, 2, 5, 6}
```

---

## Detailed Explanation

### 1. The Empty Set Trap: `{}` vs `set()`

Because dictionaries and sets both use curly braces `{}`, Python reserves the literal `{}` exclusively for creating an empty **dictionary**.

```python
# MISTAKE:
empty_thing = {}
print(type(empty_thing))  # <class 'dict'> ❌

# CORRECT:
empty_set = set()
print(type(empty_set))    # <class 'set'> ✅
```

### 2. Operators vs Methods: The Flexibility Rule

Python provides both binary operators (`|`, `&`, `-`, `^`) and equivalent named methods (`.union()`, `.intersection()`, `.difference()`, `.symmetric_difference()`):

- **Binary Operators (`a | b`)**: **Strictly require both operands to be sets**. Passing a list or tuple raises a `TypeError`.
- **Named Methods (`a.union(b)`)**: **Accept any iterable** (lists, tuples, dictionaries, generator expressions) as arguments, converting them automatically on the fly.

```python
s = {1, 2, 3}
items_list = [3, 4, 5]

# OPERATOR FAILS:
# result = s | items_list  # Raises TypeError: unsupported operand type(s) for |: 'set' and 'list'

# METHOD SUCCEEDS:
result = s.union(items_list)
print("Method Union:", result)  # {1, 2, 3, 4, 5} ✅
```

### 3. `.remove()` vs `.discard()`

When deleting elements from a set:
- `s.remove(x)`: Removes $x$. If $x$ is not present in the set, it raises a **`KeyError`**. Use when element absence represents an error condition.
- `s.discard(x)`: Removes $x$ if present. If $x$ is missing, it **fails silently without errors**. Use for safe idempotent cleanups.

### 4. Relational Subset & Superset Testing

Python provides methods and operators to test relational set containment:
- `a.issubset(b)` or `a <= b`: Checks if all elements of $A$ are in $B$.
- `a.issuperset(b)` or `a >= b`: Checks if $A$ contains all elements of $B$.
- `a.isdisjoint(b)`: Returns `True` if $A$ and $B$ have **zero elements in common** ($A \cap B = \emptyset$).

---

## Examples

### 1. Simple: Automatic Deduplication of Sequences
Stripping duplicates from a list of user IDs in a single line.

```python
raw_logins = ["user_101", "user_102", "user_101", "user_103", "user_102", "user_104"]

# Convert to set to deduplicate, then back to sorted list
unique_logins = sorted(set(raw_logins))

print(f"Raw Logins ({len(raw_logins)})     :", raw_logins)
print(f"Unique Logins ({len(unique_logins)})  :", unique_logins)
```

### 2. Beginner: Safe Element Deletion with `.discard()`
Demonstrating idempotent tag removal.

```python
active_tags = {"python", "fastapi", "backend", "docker"}

# Safe removals
active_tags.discard("docker")
active_tags.discard("non_existent_tag")  # Does not crash!

print("Active Tags after discard:", active_tags)
```

### 3. Intermediate: Marketing User Cohort Analysis
Computing marketing customer overlaps across email campaigns and mobile push notifications.

```python
email_subscribers = {"alice@test.com", "bob@test.com", "charlie@test.com", "david@test.com"}
mobile_app_users = {"charlie@test.com", "david@test.com", "elena@test.com", "frank@test.com"}
purchased_customers = {"david@test.com", "frank@test.com", "grace@test.com"}

# 1. Omnichannel Users (Active on BOTH email and mobile app)
omnichannel = email_subscribers & mobile_app_users

# 2. Email-Only Users (Subscribed to email, but NOT on mobile app)
email_only = email_subscribers - mobile_app_users

# 3. High-Value Audience (Active on mobile app OR email, AND has made a purchase)
high_value_engaged = (email_subscribers | mobile_app_users) & purchased_customers

print("Omnichannel Users      :", omnichannel)
print("Email-Only Users       :", email_only)
print("Engaged Paying Users   :", high_value_engaged)
```

### 4. Real-World: Role-Based Access Control (RBAC) Permission Verification
Validating whether a user's permission set satisfies the required capability set for an administrative operation.

```python
# Define master security permission flags
USER_PERMISSIONS = {
    "sarah_analyst": {"READ_REPORTS", "EXPORT_CSV", "VIEW_DASHBOARD"},
    "hesam_admin": {"READ_REPORTS", "EXPORT_CSV", "VIEW_DASHBOARD", "MANAGE_USERS", "DELETE_RECORDS"},
    "guest_user": {"VIEW_DASHBOARD"}
}

REQUIRED_ADMIN_PERMISSIONS = {"VIEW_DASHBOARD", "MANAGE_USERS", "DELETE_RECORDS"}

def check_administrative_access(username: str) -> tuple[bool, str]:
    user_perms = USER_PERMISSIONS.get(username, set())
    
    # Check if user permissions are a superset of required admin permissions
    if user_perms.issuperset(REQUIRED_ADMIN_PERMISSIONS):
        return True, "Access Granted: User holds all required permissions."
        
    missing_permissions = REQUIRED_ADMIN_PERMISSIONS - user_perms
    return False, f"Access Denied: Missing permissions: {missing_permissions}"

print(check_administrative_access("hesam_admin"))
print(check_administrative_access("sarah_analyst"))
print(check_administrative_access("guest_user"))
```

### 5. Advanced: Nested Sets Using `frozenset`
Storing groups of permissions as keys in a dictionary or elements inside another set.

```python
# A standard 'set' cannot be a dictionary key because it is mutable (unhashable)
# 'frozenset' is immutable and hashable:

ROLE_POLICIES = {
    frozenset(["READ", "WRITE"]): "Standard Editor Policy",
    frozenset(["READ", "WRITE", "DELETE", "ADMIN"]): "Superuser Policy",
    frozenset(["READ"]): "Read-Only Auditor Policy",
}

current_user_perms = frozenset(["WRITE", "READ"])

# Instant O(1) hash lookup using frozenset as dictionary key!
policy_name = ROLE_POLICIES.get(current_user_perms, "Custom Unknown Policy")
print(f"Policy for {set(current_user_perms)}: '{policy_name}'")
```

---

## Code Explanation

In Example 4 (RBAC Permission Verification):
1. User permissions and requirements are represented as sets of string tokens.
2. The `.issuperset()` method (`user_perms >= REQUIRED_ADMIN_PERMISSIONS`) checks whether every required permission exists inside the user's permission set in $O(K)$ time.
3. If permissions are insufficient, the set difference `REQUIRED_ADMIN_PERMISSIONS - user_perms` isolates the exact missing permission strings without requiring manual loop filtering.
4. This exemplifies how mathematical set theory cleanly eliminates nested conditional loops in enterprise authorization software.

---

## Common Mistakes

### Mistake 1: Attempting to Index or Slice a Set
Sets are unordered hash tables; they do not possess index offsets.

```python
# BROKEN:
s = {"alpha", "beta", "gamma"}
# first = s[0]  # Raises TypeError: 'set' object is not subscriptable

# CORRECT: Iterate or convert to list if indexing is necessary
first = next(iter(s))  # Gets an arbitrary element
ordered_list = sorted(s)
first_ordered = ordered_list[0]
```

### Mistake 2: Using Mutable Objects as Set Elements
Attempting to insert a list or dictionary into a set raises a `TypeError`.

```python
# BROKEN:
# my_set = {[1, 2], [3, 4]}  # Raises TypeError: unhashable type: 'list'

# CORRECT: Use immutable tuples or frozensets
my_set = {(1, 2), (3, 4)}
```

---

## Best Practices

### Use Set Comprehensions for Declarative Filtering
Cleanly transform and deduplicate datasets simultaneously using set comprehensions `{f(x) for x in iterable}`.

Good:
```python
clean_domains = {email.split("@")[1].lower() for email in user_emails if "@" in email}
```

Avoid:
```python
clean_domains = set()
for email in user_emails:
    if "@" in email:
        clean_domains.add(email.split("@")[1].lower())
```

---

## Performance Considerations

1. **$O(1)$ Constant-Time Membership Search**: Searching for an element in a set containing 10,000,000 items takes **~40 nanoseconds** (identical to a 10-item set). Searching the same element in a list requires scanning 10,000,000 items sequentially in $O(N)$ time.
2. **Set Construction Overhead**: Building a set from a large list incurs upfront $O(N)$ hashing cost. If you are checking membership only once or twice on a tiny list ($N < 10$), converting to a set is unnecessary overhead; for repeated lookups or large collections, the set conversion pays for itself immediately.

---

## Security Considerations

1. **Deterministic Ordering in Security Tests**: Never rely on the iteration order of a set when generating cryptographic hashes or security tokens. Set iteration order can vary between Python process restarts due to `PYTHONHASHSEED` randomization. Always sort sets before hashing (`sorted(my_set)`).
2. **Memory Bounds**: Constructing massive sets from unvalidated external API inputs can exhaust server memory. Impose maximum size constraints when ingesting external sequences.

---

## Real-World Usage

- **Search Engine Tokenizers**: Stripping stop words (`tokens = [t for t in words if t not in STOPWORDS_SET]`).
- **Graph Algorithms & Web Crawlers**: Tracking visited URLs or graph nodes (`visited = set()`) to prevent infinite circular loops.
- **Social Graph Analysis**: Calculating mutual followers and friend suggestions using set intersection (`friends_a & friends_b`).

---

## Comparison: Set vs Frozenset vs List

| Feature | `set` | `frozenset` | `list` |
|---|---|---|---|
| **Mutability** | **Mutable** (`.add()`, `.remove()`) | **Immutable** | **Mutable** |
| **Ordering** | Unordered | Unordered | **Ordered (Indexable)** |
| **Duplicates** | **Forbidden (Unique)** | **Forbidden (Unique)** | Allowed |
| **Membership (`in`)** | **$O(1)$ Constant** | **$O(1)$ Constant** | $O(N)$ Linear |
| **Hashable? (Dict Key)**| **No** | **Yes** | **No** |

---

## Advanced Concepts: The CPython `PySetObject` Implementation

In `Objects/setobject.c`, CPython implements sets using a dedicated `setentry` table:

```c
typedef struct {
    PyObject *key;
    Py_hash_t hash;  // Cached hash to accelerate lookups
} setentry;

typedef struct {
    PyObject_HEAD
    Py_ssize_t fill;      // Active + Dummy entries
    Py_ssize_t used;      // Active entries
    Py_ssize_t mask;      // Table size - 1
    setentry *table;      // Pointer to hash table array
    setentry smalltable[PySet_MINSIZE]; // Embedded initial buffer (8 slots)
} PySetObject;
```

When a set contains 8 or fewer elements, CPython uses the embedded `smalltable` array directly inside the object header, avoiding dynamic heap allocation syscalls entirely.

---

## Exercises

### Exercise 1 — Beginner
Create two sets representing the programming languages known by Alice (`{"Python", "Java", "C++"}`) and Bob (`{"Python", "JavaScript", "Rust"}`). Compute and print: (1) all languages known by both combined (Union), (2) languages they have in common (Intersection), and (3) languages Alice knows that Bob does not (Difference).

### Exercise 2 — Intermediate
Write a function `has_unique_characters(text: str) -> bool` that returns `True` if every character in the string is unique (ignoring whitespace and case), and `False` if any character repeats, by comparing lengths with a set.

### Exercise 3 — Advanced
Build a `SocialNetworkGraph` class that stores friendships as sets. Implement: (1) `add_friendship(user_a, user_b)`, (2) `get_mutual_friends(user_a, user_b)`, and (3) `recommend_friends(user)` which suggests new friends based on the intersection and difference of their friends' friend networks.

---

## Mini Project: Mutual Connection & Content Recommendation Engine

### Requirements
Build an analytical social graph engine named `recommendation_engine.py` that models users and interest tags using sets, calculates user similarity coefficients using the **Jaccard Similarity Index** ($J(A, B) = \frac{|A \cap B|}{|A \cup B|}$), and recommends content based on cohort tag differences.

### Implementation Blueprint
```python
class RecommendationEngine:
    def __init__(self):
        self.user_interests = {}

    def register_user(self, username: str, interest_tags: set[str]):
        self.user_interests[username] = set(tag.lower() for tag in interest_tags)

    def calculate_jaccard_similarity(self, user_a: str, user_b: str) -> float:
        """Calculate Jaccard Similarity: |A ∩ B| / |A ∪ B|"""
        tags_a = self.user_interests.get(user_a, set())
        tags_b = self.user_interests.get(user_b, set())
        
        union_set = tags_a | tags_b
        if not union_set:
            return 0.0
            
        intersection_set = tags_a & tags_b
        return len(intersection_set) / len(union_set)

    def recommend_tags(self, target_user: str, reference_user: str) -> set[str]:
        """Recommend tags present in reference user that target user has not explored."""
        tags_target = self.user_interests.get(target_user, set())
        tags_ref = self.user_interests.get(reference_user, set())
        
        # Set Difference: In reference, but not yet in target
        return tags_ref - tags_target

if __name__ == "__main__":
    engine = RecommendationEngine()
    
    engine.register_user("hesam", {"python", "fastapi", "docker", "machine-learning", "postgresql"})
    engine.register_user("sarah", {"python", "machine-learning", "pytorch", "deep-learning", "docker"})
    engine.register_user("alex",  {"react", "javascript", "css", "html", "ui-design"})
    
    print("=" * 60)
    print("          USER COHORT SIMILARITY & RECOMMENDATIONS")
    print("=" * 60)
    
    sim_hesam_sarah = engine.calculate_jaccard_similarity("hesam", "sarah")
    sim_hesam_alex = engine.calculate_jaccard_similarity("hesam", "alex")
    
    print(f"Similarity (Hesam <-> Sarah) : {sim_hesam_sarah:.1%} (High Overlap)")
    print(f"Similarity (Hesam <-> Alex)  : {sim_hesam_alex:.1%} (Low Overlap)")
    print("-" * 60)
    
    recommendations_for_hesam = engine.recommend_tags("hesam", "sarah")
    print(f"Recommended Topics for Hesam based on Sarah's profile:")
    for tag in recommendations_for_hesam:
        print(f"  -> 💡 {tag}")
    print("=" * 60)
```

---

## Summary

In this lesson, you mastered Python's sets and set theory architecture:
- Sets are **mutable, unordered collections of unique, hashable items**.
- `frozenset` is an **immutable, hashable variant** that can serve as a dictionary key or element of another set.
- Membership testing (`in`) executes in **$O(1)$ constant average time** using internal hash tables.
- Sets support mathematical operations: Union (`|`), Intersection (`&`), Difference (`-`), and Symmetric Difference (`^`).
- Use `.discard()` for safe, error-free element deletion.
- Set operators require both operands to be sets, while set methods accept any iterable.

---

## Best Practices Checklist

- [ ] Use `set()` to create an empty set (never `{}`).
- [ ] Use sets for deduplication and high-frequency membership searches.
- [ ] Use `.discard()` when element absence should not raise an error.
- [ ] Use `frozenset` when a set needs to be hashed or stored in a dictionary.
- [ ] Sort sets before serializing to ensure deterministic ordering.

---

## What's Next?

Now that you have mastered sets, continue to the final article in this module:
👉 **[Built-in Collection Helpers](built-in-collection-functions.md)** to master functional collection utilities: `enumerate()`, `zip()`, `sorted()`, `reversed()`, `min()`, `max()`, `any()`, and `all()`.
