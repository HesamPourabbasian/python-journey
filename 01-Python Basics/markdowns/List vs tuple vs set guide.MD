# Python Lists vs Tuples vs Sets — Complete Comparison Guide

## 1. The Core Idea in One Sentence Each

| Type | One-line definition |
|------|---------------------|
| **List** | An ordered, mutable collection — your general-purpose, changeable sequence. |
| **Tuple** | An ordered, immutable collection — a fixed, locked-in sequence. |
| **Set** | An unordered, mutable collection of unique elements — built for fast lookups and eliminating duplicates. |

```python
my_list  = [1, 2, 3]     # square brackets
my_tuple = (1, 2, 3)     # round brackets
my_set   = {1, 2, 3}     # curly brackets
```

---

## 2. Side-by-Side Comparison Table

| Feature | List | Tuple | Set |
|---|---|---|---|
| **Syntax** | `[1, 2, 3]` | `(1, 2, 3)` | `{1, 2, 3}` |
| **Ordered** | Yes | Yes | No |
| **Mutable** (can change after creation) | Yes | No | Yes |
| **Allows duplicates** | Yes | Yes | No |
| **Indexing / slicing** (`x[0]`) | Yes | Yes | No |
| **Hashable** (usable as dict key) | No | Yes (if contents are) | No |
| **Membership test speed** (`in`) | Slow — O(n) | Slow — O(n) | Fast — O(1) avg |
| **Typical use** | Data that changes / grows | Fixed, structured records | Uniqueness & fast lookups |
| **Memory / performance** | Moderate | Most lightweight | Extra overhead (hash table) |

---

## 3. Ordering — Does Position Matter?

**List and Tuple** remember insertion order and let you access elements by index.

```python
colors = ["red", "green", "blue"]
print(colors[0])   # 'red' -- position is meaningful

point = (10, 20)
print(point[0])    # 10 -- x-coordinate, position has meaning
```

**Set** has no concept of position — you cannot say "give me the first element."

```python
s = {"red", "green", "blue"}
s[0]   # TypeError: 'set' object is not subscriptable
```

Use **list or tuple** whenever the *order* or *position* of items carries meaning (e.g. steps in a recipe, x/y coordinates, a leaderboard). Use a **set** when order is irrelevant and you only care *whether* something is present.

---

## 4. Mutability — Can It Change After Creation?

```python
# List -- mutable
nums = [1, 2, 3]
nums.append(4)
nums[0] = 100
print(nums)   # [100, 2, 3, 4]

# Tuple -- immutable
point = (1, 2)
point[0] = 100   # TypeError

# Set -- mutable
s = {1, 2, 3}
s.add(4)
s.remove(1)
print(s)   # {2, 3, 4}
```

**Rule of thumb:**
- Data will change over time → **list** or **set**.
- Data must stay constant/protected from accidental edits → **tuple**.

---

## 5. Duplicates

```python
list_dupes  = [1, 1, 2, 2, 3]        # allowed -> [1, 1, 2, 2, 3]
tuple_dupes = (1, 1, 2, 2, 3)        # allowed -> (1, 1, 2, 2, 3)
set_dupes   = {1, 1, 2, 2, 3}        # auto-removed -> {1, 2, 3}
```

If you need to **guarantee uniqueness** (e.g. a list of user IDs with no repeats), a set enforces that automatically. Lists and tuples do not.

---

## 6. Speed — Membership Testing (`in`)

This is the single biggest practical reason to choose a set.

```python
import time

big_list = list(range(1_000_000))
big_set  = set(big_list)

# List: has to scan every element until found -> O(n)
999_999 in big_list

# Set: hash lookup goes straight to the answer -> O(1) on average
999_999 in big_set
```

If your code frequently does `if item in collection`, and the collection is large, switching from a list to a set can turn a slow, scanning operation into an instant lookup.

---

## 7. Hashability — Can It Be a Dictionary Key?

```python
# Tuple -- hashable, works as a dict key
locations = {(35.68, 139.69): "Tokyo"}

# List -- unhashable, fails
locations = {[35.68, 139.69]: "Tokyo"}   # TypeError: unhashable type: 'list'

# Set -- also unhashable, fails
locations = {{"a", "b"}: "letters"}      # TypeError: unhashable type: 'set'
```

Only **tuples** (among these three) can be used as dictionary keys or stored inside another set — because they're immutable. If you need a "set that can be a dict key," use `frozenset` instead of `set`.

---

## 8. When to Use Each — Decision Guide

**Use a List when:**
- You need an ordered sequence that will be modified (add, remove, sort, reorder).
- Duplicates are expected or acceptable.
- You need to access elements by index frequently.
- Example: a to-do list, a queue of tasks, rows of data being processed one at a time.

```python
tasks = ["email client", "write report", "team meeting"]
tasks.append("review PR")
```

**Use a Tuple when:**
- The data represents a fixed structure that shouldn't change (coordinates, RGB values, a database record).
- You want to protect data from accidental modification.
- You need a hashable, ordered group (e.g. as a dictionary key or set element).
- A function needs to return multiple values.

```python
def get_rgb():
    return (255, 0, 0)   # fixed, structured, safe to return

CONFIG = ("localhost", 8080)   # shouldn't be changed accidentally
```

**Use a Set when:**
- You need to guarantee **no duplicates**.
- You need **fast membership testing** (`in`) on a large collection.
- You care about mathematical operations: union, intersection, difference.
- Order genuinely does not matter.

```python
seen_emails = set()

def is_new_subscriber(email):
    if email in seen_emails:
        return False
    seen_emails.add(email)
    return True
```

---

## 9. Quick Decision Flowchart (in words)

1. **Does order/position matter?**
   - No → use a **set**.
   - Yes → go to step 2.
2. **Will the data need to change after creation?**
   - No → use a **tuple**.
   - Yes → use a **list**.
3. **Do you need it as a dictionary key or inside another set?**
   - Yes → use a **tuple** (or `frozenset` if it started as a set).

---

## 10. Converting Between Them

```python
lst = [1, 2, 2, 3]

t = tuple(lst)     # (1, 2, 2, 3)  -- freeze a list
s = set(lst)       # {1, 2, 3}     -- dedupe a list

back_to_list = list(s)   # [1, 2, 3] -- order not guaranteed
```

A common real-world pattern: collect data in a **list** while it's being built, convert to a **set** to dedupe or speed up lookups, then convert to a **tuple** if you need to freeze the final result.

```python
raw_data = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3]
unique_sorted = tuple(sorted(set(raw_data)))
print(unique_sorted)   # (1, 2, 3, 4, 5, 6, 9)
```

---

## 11. Summary Cheat Sheet

| Question | Answer |
|---|---|
| Need order + can change later? | **List** |
| Need order + must stay fixed? | **Tuple** |
| Need uniqueness + fast lookups, don't care about order? | **Set** |
| Need it as a dict key? | **Tuple** (or `frozenset`) |
| Storing coordinates, RGB, records? | **Tuple** |
| Storing a growing to-do list, queue, log? | **List** |
| Removing duplicates or checking "have I seen this before"? | **Set** |
| Comparing two groups (common items, differences)? | **Set** |

**In short:** reach for a **list** by default when things change, a **tuple** when data must be locked and structured, and a **set** the moment "uniqueness" or "is this in here?" becomes the actual problem you're solving.