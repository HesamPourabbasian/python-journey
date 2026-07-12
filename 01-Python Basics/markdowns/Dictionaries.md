# Python Dictionaries – The Complete Guide

## What is a Dictionary?

A **dictionary** is one of Python's most powerful and commonly used data structures.

A dictionary stores data as **key-value pairs**.

Think of it like a real dictionary:

| Word (Key) | Definition (Value)     |
| ---------- | ---------------------- |
| Apple      | A fruit                |
| Car        | A vehicle              |
| Python     | A programming language |

The **word** is the **key**, and its **definition** is the **value**.

In Python:

```python
student = {
    "name": "Hesam",
    "age": 22,
    "major": "Computer Science"
}
```

Here:

* `"name"` → Key

* `"Hesam"` → Value

* `"age"` → Key

* `22` → Value

* `"major"` → Key

* `"Computer Science"` → Value

---

# Why Use Dictionaries?

Dictionaries are useful when you want to store information that has labels.

Instead of remembering:

```python
student = ["Hesam", 22, "Computer Science"]
```

What does index `0` mean?

What does index `1` mean?

It's confusing.

A dictionary is much clearer:

```python
student = {
    "name": "Hesam",
    "age": 22,
    "major": "Computer Science"
}
```

Now you know exactly what every piece of data means.

---

# Dictionary Syntax

A dictionary uses:

* Curly braces `{ }`
* Colon `:` between key and value
* Commas `,` between pairs

General syntax:

```python
dictionary = {
    key1: value1,
    key2: value2,
    key3: value3
}
```

Example:

```python
car = {
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2022
}
```

---

# Creating Dictionaries

## Empty Dictionary

```python
student = {}
```

or

```python
student = dict()
```

---

## Dictionary with Data

```python
person = {
    "name": "Alice",
    "age": 25,
    "city": "London"
}
```

Output:

```python
{
    'name': 'Alice',
    'age': 25,
    'city': 'London'
}
```

---

# Accessing Values

Use the key inside square brackets.

```python
student = {
    "name": "Hesam",
    "age": 22
}

print(student["name"])
```

Output

```python
Hesam
```

Another example:

```python
print(student["age"])
```

Output

```python
22
```

---

# Using get()

Instead of brackets, you can use `get()`.

```python
student = {
    "name": "Hesam",
    "age": 22
}

print(student.get("name"))
```

Output

```python
Hesam
```

### Why use get()?

If the key doesn't exist:

Using brackets:

```python
print(student["height"])
```

Output

```python
KeyError
```

Using `get()`:

```python
print(student.get("height"))
```

Output

```python
None
```

Or provide a default value:

```python
print(student.get("height", "Not Found"))
```

Output

```python
Not Found
```

---

# Adding New Items

Simply assign a new key.

```python
student = {
    "name": "Hesam"
}

student["age"] = 22

print(student)
```

Output

```python
{
    'name': 'Hesam',
    'age': 22
}
```

---

# Updating Existing Values

```python
student = {
    "name": "Hesam",
    "age": 22
}

student["age"] = 23

print(student)
```

Output

```python
{
    'name': 'Hesam',
    'age': 23
}
```

---

# Removing Items

## pop()

Removes a key and returns its value.

```python
student = {
    "name": "Hesam",
    "age": 22
}

student.pop("age")

print(student)
```

Output

```python
{
    'name': 'Hesam'
}
```

---

## del

```python
student = {
    "name": "Hesam",
    "age": 22
}

del student["age"]

print(student)
```

Output

```python
{
    'name': 'Hesam'
}
```

---

## popitem()

Removes the last inserted item.

```python
student = {
    "name": "Hesam",
    "age": 22,
    "city": "Tabriz"
}

student.popitem()

print(student)
```

Output

```python
{
    'name': 'Hesam',
    'age': 22
}
```

---

## clear()

Removes everything.

```python
student.clear()

print(student)
```

Output

```python
{}
```

---

# Dictionary Keys Must Be Unique

A dictionary cannot have duplicate keys.

Wrong:

```python
student = {
    "name": "Hesam",
    "name": "Ali"
}

print(student)
```

Output

```python
{
    'name': 'Ali'
}
```

The second value replaces the first.

---

# Allowed Value Types

Values can be almost anything.

```python
person = {
    "name": "Hesam",
    "age": 22,
    "height": 186.5,
    "student": True
}
```

---

## Lists

```python
student = {
    "courses": ["Python", "Java", "C++"]
}
```

---

## Tuples

```python
student = {
    "grades": (18, 20, 19)
}
```

---

## Dictionaries

```python
student = {
    "name": "Hesam",
    "address": {
        "city": "Tabriz",
        "country": "Iran"
    }
}
```

---

# Valid Key Types

Keys must be **immutable** (unchangeable).

Good keys:

```python
1
```

```python
3.14
```

```python
True
```

```python
"Python"
```

```python
(1, 2)
```

Bad keys:

```python
[1,2]
```

```python
{"a":1}
```

Lists and dictionaries cannot be keys because they are mutable.

---

# Looping Through Dictionaries

## Loop Through Keys

```python
student = {
    "name": "Hesam",
    "age": 22,
    "city": "Tabriz"
}

for key in student:
    print(key)
```

Output

```python
name
age
city
```

---

## Loop Through Values

```python
for value in student.values():
    print(value)
```

Output

```python
Hesam
22
Tabriz
```

---

## Loop Through Both

```python
for key, value in student.items():
    print(key, value)
```

Output

```python
name Hesam
age 22
city Tabriz
```

---

# Checking if a Key Exists

```python
student = {
    "name": "Hesam",
    "age": 22
}

print("name" in student)
```

Output

```python
True
```

Another example:

```python
print("height" in student)
```

Output

```python
False
```

---

# Dictionary Length

```python
student = {
    "name": "Hesam",
    "age": 22,
    "city": "Tabriz"
}

print(len(student))
```

Output

```python
3
```

---

# Copying Dictionaries

Wrong:

```python
a = {"x": 1}

b = a
```

Both variables point to the same dictionary.

Correct:

```python
b = a.copy()
```

or

```python
b = dict(a)
```

---

# Nested Dictionaries

```python
students = {
    "student1": {
        "name": "Alice",
        "age": 20
    },
    "student2": {
        "name": "Bob",
        "age": 21
    }
}
```

Access:

```python
print(students["student2"]["name"])
```

Output

```python
Bob
```

---

# Dictionary Methods

| Method         | Description                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `get()`        | Returns value for a key safely                                                                             |
| `keys()`       | Returns all keys                                                                                           |
| `values()`     | Returns all values                                                                                         |
| `items()`      | Returns key-value pairs                                                                                    |
| `update()`     | Updates multiple items                                                                                     |
| `pop()`        | Removes a specific key                                                                                     |
| `popitem()`    | Removes the last inserted item                                                                             |
| `clear()`      | Removes everything                                                                                         |
| `copy()`       | Creates a copy                                                                                             |
| `setdefault()` | Returns a value if the key exists; otherwise inserts the key with a default value and returns that default |

Example of `update()`:

```python
student = {
    "name": "Hesam"
}

student.update({
    "age": 22,
    "city": "Tabriz"
})

print(student)
```

Output

```python
{
    'name': 'Hesam',
    'age': 22,
    'city': 'Tabriz'
}
```

---

# Dictionary Comprehension

Like list comprehensions, dictionaries can be created in one line.

Example:

```python
numbers = {x: x * x for x in range(1, 6)}

print(numbers)
```

Output

```python
{
    1: 1,
    2: 4,
    3: 9,
    4: 16,
    5: 25
}
```

---

# Ordered Dictionaries (Python 3.7+)

Starting with **Python 3.7**, normal dictionaries **preserve insertion order**.

Example:

```python
fruit = {
    "apple": 5,
    "banana": 3,
    "orange": 8
}

print(fruit)
```

Output

```python
{
    'apple': 5,
    'banana': 3,
    'orange': 8
}
```

The items appear in the same order they were added.

> **Note:** Before Python 3.7, dictionaries were considered unordered, and the order of items was not guaranteed.

---

# Common Mistakes

### Forgetting Quotes Around String Keys

❌ Wrong

```python
student = {
    name: "Hesam"
}
```

✅ Correct

```python
student = {
    "name": "Hesam"
}
```

---

### Accessing a Missing Key

❌

```python
print(student["height"])
```

Raises:

```python
KeyError
```

✅

```python
print(student.get("height"))
```

---

### Duplicate Keys

❌

```python
{
    "age": 20,
    "age": 25
}
```

Output

```python
{
    'age': 25
}
```

---

# Real-World Example

```python
student = {
    "id": 1001,
    "name": "Hesam",
    "age": 22,
    "major": "Computer Science",
    "courses": ["Python", "Algorithms", "Operating Systems"],
    "gpa": 3.8,
    "graduated": False
}

print(f"Student: {student['name']}")
print(f"Major: {student['major']}")
print(f"Courses: {student['courses']}")
print(f"GPA: {student['gpa']}")
```

Output

```python
Student: Hesam
Major: Computer Science
Courses: ['Python', 'Algorithms', 'Operating Systems']
GPA: 3.8
```

---

# Best Practices

* Use descriptive keys (e.g., `"first_name"` instead of `"fn"`).
* Prefer `get()` when a key may not exist.
* Keep key types consistent (commonly strings).
* Use dictionaries for structured, labeled data rather than relying on list indexes.
* Use dictionary comprehensions for concise dictionary creation when appropriate.

---

# Key Takeaways

* A **dictionary** stores data as **key-value pairs**.
* Dictionaries are created using **curly braces `{}`**.
* **Keys must be unique** and immutable.
* Values can be of **any data type**, including other dictionaries and lists.
* Access values using `dictionary[key]` or `dictionary.get(key)`.
* Add or update items by assigning to a key.
* Remove items with `pop()`, `del`, `popitem()`, or `clear()`.
* Iterate with `keys()`, `values()`, or `items()`.
* Use `copy()` to create an independent copy.
* Dictionaries support **nested structures** and **dictionary comprehensions**.
* Since **Python 3.7**, dictionaries preserve the order in which items are inserted, making them predictable for iteration and display.
