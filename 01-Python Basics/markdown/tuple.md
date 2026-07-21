# Python Tuples — Complete Guide

## 1. What Is a Tuple?

A **tuple** is an ordered, **immutable** collection of elements in Python. Once created, its contents cannot be changed — no adding, removing, or replacing items.

```python
coordinates = (10, 20)
person = ("Alice", 30, "Engineer")
empty_tuple = ()
single_item = (5,)   # note the trailing comma — required for a 1-element tuple
no_parens = 1, 2, 3  # parentheses are optional in many contexts
```

**Key traits:**
- **Ordered** — items keep the position you put them in.
- **Immutable** — cannot be modified after creation.
- **Allows duplicates** — `(1, 1, 2)` is valid.
- **Heterogeneous** — can mix types: `("Bob", 25, True)`.

### Why use tuples instead of lists?
- Represent **fixed data**: coordinates, RGB colors, dates.
- **Safer**: prevents accidental modification.
- **Hashable**: can be used as dictionary keys or set elements (lists cannot).
- Slightly **faster and more memory-efficient** than lists.

---

## 2. Creating Tuples

```python
t1 = (1, 2, 3)
t2 = tuple([4, 5, 6])        # from a list
t3 = tuple("abc")            # from a string -> ('a', 'b', 'c')
t4 = tuple(range(5))         # (0, 1, 2, 3, 4)
```

---

## 3. Indexing and Slicing

Tuples support the same indexing/slicing rules as lists.

```python
point = (10, 20, 30, 40)

print(point[0])     # 10  (first element)
print(point[-1])    # 40  (last element)
print(point[1:3])   # (20, 30)  (slice -> returns a tuple)
print(point[::-1])  # (40, 30, 20, 10)  (reversed)
```

---

## 4. Immutability in Practice

```python
point = (10, 20)
point[0] = 99   # TypeError: 'tuple' object does not support item assignment
```

**Important nuance:** if a tuple contains a *mutable* object (like a list), that inner object can still be changed — only the tuple's references are frozen.

```python
data = (1, 2, [3, 4])
data[2].append(5)
print(data)   # (1, 2, [3, 4, 5]) -- allowed! The list itself is mutable.
```

---

## 5. Iteration

```python
fruits = ("apple", "banana", "cherry")

for fruit in fruits:
    print(fruit)

# With index
for i, fruit in enumerate(fruits):
    print(i, fruit)
```

---

## 6. Tuple Unpacking

One of the most powerful tuple features — assigning elements to variables in one line.

```python
person = ("Alice", 30, "Engineer")
name, age, job = person
print(name, age, job)   # Alice 30 Engineer
```

### Extended unpacking with `*`

```python
numbers = (1, 2, 3, 4, 5)
first, *middle, last = numbers
print(first)    # 1
print(middle)   # [2, 3, 4]
print(last)     # 5
```

### Swapping variables (classic tuple trick)

```python
a, b = 1, 2
a, b = b, a
print(a, b)   # 2 1
```

### Ignoring values with `_`

```python
name, _, job = person   # ignore age
```

---

## 7. Tuples as Function Return Values

Functions can return multiple values — Python packs them into a tuple automatically.

```python
def min_max(numbers):
    return min(numbers), max(numbers)

low, high = min_max([4, 1, 9, 3])
print(low, high)   # 1 9
```

This is safe because the caller cannot accidentally mutate the returned values' structure.

---

## 8. Tuples as Dictionary Keys

Since tuples are immutable and hashable, they can be used where lists cannot — like dictionary keys or set members.

```python
locations = {
    (35.6895, 139.6917): "Tokyo",
    (48.8566, 2.3522): "Paris"
}

print(locations[(48.8566, 2.3522)])   # Paris
```

```python
visited = set()
visited.add((10, 20))
visited.add((10, 20))   # duplicate, ignored
print(visited)   # {(10, 20)}
```

> Note: A tuple is hashable **only if all its elements are hashable**. A tuple containing a list is NOT hashable.

---

## 9. Common Tuple Methods and Functions

Tuples have only two built-in methods (since they can't be modified):

```python
t = (1, 2, 2, 3, 4)

t.count(2)     # 2  -> number of occurrences
t.index(3)     # 3  -> first index of value

len(t)         # 5
sum(t)         # 12
max(t)         # 4
min(t)         # 1
sorted(t)      # [1, 2, 2, 3, 4]  -> returns a LIST, not a tuple
```

---

## 10. Nested Tuples

```python
matrix = ((1, 2, 3), (4, 5, 6), (7, 8, 9))
print(matrix[1][2])   # 6
```

---

## 11. Tuple vs List — Quick Comparison

| Feature            | Tuple            | List             |
|---------------------|-------------------|-------------------|
| Mutable              | No                | Yes               |
| Syntax                | `(1, 2, 3)`       | `[1, 2, 3]`       |
| Hashable              | Yes (if elements are) | No           |
| Performance           | Faster, less memory | Slightly slower |
| Use case               | Fixed/constant data | Data that changes |
| Methods available    | `count()`, `index()` | Many (append, remove, sort, etc.) |

---

## 12. Named Tuples (Bonus)

For readable, self-documenting tuples, use `collections.namedtuple`.

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(10, 20)

print(p.x, p.y)   # 10 20
print(p[0], p[1]) # 10 20 (still works like a normal tuple)
```

This combines tuple immutability with attribute-style access — great for structured, read-only records.

---

## 13. Practical Example

```python
def get_user_info():
    name = "Sara"
    age = 28
    country = "Iran"
    return name, age, country

name, age, country = get_user_info()
print(f"{name} is {age} years old and lives in {country}.")

# Store fixed config as tuple
DB_CONFIG = ("localhost", 5432, "mydb")
host, port, db_name = DB_CONFIG
```

---

## 14. Summary

- Tuples are **ordered, immutable** sequences.
- Use `()` to create them; a trailing comma is required for single-element tuples.
- Support **indexing, slicing, iteration, and unpacking**.
- Cannot be changed after creation — safer for fixed data.
- Are **hashable** (if contents are hashable) → usable as dict keys / set elements.
- Ideal for: coordinates, RGB values, function returns, config constants, records.
- Use **lists** instead when the collection needs to grow, shrink, or be modified.