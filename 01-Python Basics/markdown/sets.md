# Python Sets — Complete Guide

## 1. What Is a Set?

A **set** is an unordered collection of unique elements in Python. It is:

- **Iterable** — you can loop through it.
- **Mutable** — you can add or remove elements after creation.
- **Unordered** — items have no fixed position or index.
- **Duplicate-free** — every element appears only once.

```python
fruits = {"apple", "banana", "cherry"}
numbers = {1, 2, 3, 3, 2}   # duplicates are automatically removed
print(numbers)              # {1, 2, 3}
```

Because sets are unordered, you **cannot** access elements by index:

```python
fruits[0]   # TypeError: 'set' object is not subscriptable
```

### Why use a set instead of a list?
The biggest advantage is **membership testing speed**. Checking whether an element exists in a set is, on average, **O(1)** (constant time), because sets are implemented using a hash table internally. Checking membership in a list is **O(n)** — it has to scan through elements one by one.

```python
big_list = list(range(1_000_000))
big_set = set(big_list)

999999 in big_list   # slow -- scans the whole list
999999 in big_set    # fast -- direct hash lookup
```

---

## 2. Creating Sets

```python
s1 = {1, 2, 3}
s2 = set([1, 2, 2, 3])      # from a list -> {1, 2, 3}
s3 = set("hello")           # from a string -> {'h', 'e', 'l', 'o'}
s4 = set()                  # empty set -- NOT {} (that creates an empty dict!)
s5 = {x for x in range(6) if x % 2 == 0}   # set comprehension -> {0, 2, 4}
```

> **Careful:** `{}` creates an empty **dictionary**, not an empty set. Use `set()` for an empty set.

---

## 3. Sets Only Store Hashable Elements

Since sets rely on hashing, every element must be **hashable** (immutable). Lists, dicts, and other sets cannot be stored inside a set.

```python
s = {1, "text", (1, 2)}   # OK -- tuple is immutable/hashable
s = {1, [2, 3]}           # TypeError: unhashable type: 'list'
```

---

## 4. Adding and Removing Elements

```python
fruits = {"apple", "banana"}

fruits.add("cherry")          # add a single element
fruits.update(["mango", "kiwi"])  # add multiple elements (list, set, tuple, etc.)

fruits.remove("banana")       # removes item; raises KeyError if not found
fruits.discard("banana")      # removes item; does NOT raise error if missing
fruits.pop()                  # removes and returns a random element
fruits.clear()                # empties the set
```

**`remove()` vs `discard()`:**

```python
s = {1, 2, 3}
s.discard(10)   # no error, nothing happens
s.remove(10)    # KeyError: 10
```

---

## 5. Iteration

```python
colors = {"red", "green", "blue"}

for color in colors:
    print(color)
```

> Order is not guaranteed — running this twice may print items in different sequences (though CPython's ordering has become fairly stable for a given run, it should not be relied upon).

---

## 6. Membership Testing

```python
nums = {1, 2, 3, 4, 5}

print(3 in nums)      # True
print(10 in nums)     # False
print(10 not in nums) # True
```

This is the core reason sets exist: fast, reliable "is this in here?" checks.

---

## 7. Set Operations (Math-Style)

Sets support classic mathematical set operations.

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

# Union -- all elements from both sets
a | b                 # {1, 2, 3, 4, 5, 6}
a.union(b)

# Intersection -- elements common to both
a & b                 # {3, 4}
a.intersection(b)

# Difference -- elements in a but not in b
a - b                  # {1, 2}
a.difference(b)

# Symmetric difference -- elements in exactly one set (not both)
a ^ b                  # {1, 2, 5, 6}
a.symmetric_difference(b)
```

### In-place versions

```python
a |= b   # same as a.update(b)
a &= b   # same as a.intersection_update(b)
a -= b   # same as a.difference_update(b)
a ^= b   # same as a.symmetric_difference_update(b)
```

---

## 8. Subset, Superset, and Disjoint Checks

```python
a = {1, 2}
b = {1, 2, 3, 4}

a.issubset(b)      # True  -> is 'a' fully inside 'b'?
b.issuperset(a)     # True  -> does 'b' contain all of 'a'?

a <= b               # True (subset)
b >= a               # True (superset)

c = {10, 20}
a.isdisjoint(c)      # True -- no elements in common
```

---

## 9. Removing Duplicates from a List (Common Use Case)

```python
numbers = [1, 2, 2, 3, 4, 4, 4, 5]
unique_numbers = list(set(numbers))
print(unique_numbers)   # [1, 2, 3, 4, 5]  (order not guaranteed)
```

> If you need to preserve original order while removing duplicates, use `dict.fromkeys()` instead:
```python
ordered_unique = list(dict.fromkeys(numbers))
```

---

## 10. Frozenset — The Immutable Sibling

A **frozenset** is an immutable version of a set. Once created, it cannot be changed — which also makes it hashable, so it can be used inside another set or as a dictionary key (a regular set cannot).

```python
fs = frozenset([1, 2, 3])
fs.add(4)   # AttributeError: no add() method -- frozensets are immutable

nested = {frozenset({1, 2}), frozenset({3, 4})}   # valid
```

---

## 11. Set vs List vs Tuple — Quick Comparison

| Feature              | Set                | List              | Tuple             |
|------------------------|---------------------|---------------------|---------------------|
| Ordered                 | No                  | Yes                 | Yes                 |
| Mutable                 | Yes                 | Yes                 | No                  |
| Duplicates allowed  | No                  | Yes                 | Yes                 |
| Indexing                | No                  | Yes                 | Yes                 |
| Membership test speed | Fast (O(1) avg) | Slow (O(n))       | Slow (O(n))       |
| Hashable                | No                  | No                  | Yes (if contents are) |

---

## 12. Practical Examples

### Finding common elements between two groups
```python
class_a = {"Alice", "Bob", "Charlie"}
class_b = {"Bob", "Diana", "Alice"}

both_classes = class_a & class_b
print(both_classes)   # {'Alice', 'Bob'}
```

### Fast duplicate detection
```python
def has_duplicates(items):
    return len(items) != len(set(items))

print(has_duplicates([1, 2, 3]))     # False
print(has_duplicates([1, 2, 2]))     # True
```

### Tracking visited items efficiently
```python
visited = set()
path = ["A", "B", "A", "C", "B"]

for step in path:
    if step in visited:
        print(f"{step} already visited")
    else:
        visited.add(step)
        print(f"Visiting {step} for the first time")
```

---

## 13. Summary

- A set is an **unordered, mutable, duplicate-free** collection.
- Elements must be **hashable** (immutable) — lists and dicts can't be stored inside a set.
- Main strength: **very fast membership testing** (`in` operator), thanks to hash-table implementation.
- Supports mathematical operations: **union, intersection, difference, symmetric difference**.
- Use `frozenset` when you need an **immutable, hashable** set (e.g. as a dict key).
- Great for: removing duplicates, fast lookups, comparing groups of items.
- Use a **list** instead when order matters or duplicates are needed; use a **tuple** when the data is fixed and structured.