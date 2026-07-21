# Python Lists — Complete Beginner Guide

---

# What is a List?

A **list** is one of the most important data structures in Python.

A list is an **ordered**, **mutable** collection that can store **multiple values** inside a single variable.

Unlike variables that store only one value:

```python
name = "Alice"
```

A list can store many values:

```python
names = ["Alice", "Bob", "Charlie"]
```

Think of a list as a container that keeps items in a specific order.

```
Shopping List

[ Milk | Eggs | Bread | Apples ]
```

---

# Characteristics of Lists

Python lists have several important properties.

## 1. Ordered

Lists remember the order in which items were added.

```python
fruits = ["Apple", "Banana", "Orange"]

print(fruits)
```

Output

```python
['Apple', 'Banana', 'Orange']
```

The order matters.

```python
["Apple", "Banana"]
```

is different from

```python
["Banana", "Apple"]
```

---

## 2. Mutable

Lists are **mutable**, which means they can be changed after they are created.

You can:

* Add items
* Remove items
* Replace items
* Rearrange items

Example:

```python
numbers = [10, 20, 30]

numbers[1] = 50

print(numbers)
```

Output

```python
[10, 50, 30]
```

Notice that the second element changed from `20` to `50`.

---

## 3. Can Store Different Data Types

A list does not require every item to have the same type.

Example:

```python
data = [25, "Alice", 4.7, True]
```

This list contains:

* Integer
* String
* Float
* Boolean

Output

```python
[25, 'Alice', 4.7, True]
```

---

## 4. Can Contain Other Lists

Lists can even contain other lists.

```python
matrix = [
    [1, 2],
    [3, 4],
    [5, 6]
]

print(matrix)
```

Output

```python
[[1, 2], [3, 4], [5, 6]]
```

This is called a **nested list**.

---

# Creating Lists

## Empty List

```python
my_list = []

print(my_list)
```

Output

```python
[]
```

---

## List with Numbers

```python
numbers = [1, 2, 3, 4, 5]
```

---

## List with Strings

```python
colors = ["Red", "Green", "Blue"]
```

---

## Mixed List

```python
mixed = [10, "Python", True, 5.6]
```

---

## Nested List

```python
students = [
    ["Alice", 90],
    ["Bob", 85],
    ["Charlie", 95]
]
```

---

# Accessing List Elements

Every item has an **index**.

Indexes start at **0**.

```
fruits = ["Apple", "Banana", "Orange", "Mango"]

Index

0 → Apple
1 → Banana
2 → Orange
3 → Mango
```

Access items like this:

```python
fruits = ["Apple", "Banana", "Orange"]

print(fruits[0])
```

Output

```python
Apple
```

Another example:

```python
print(fruits[2])
```

Output

```python
Orange
```

---

# Negative Indexing

Python also supports negative indexes.

```
Index

-1 → Last item
-2 → Second last
-3 → Third last
```

Example:

```python
fruits = ["Apple", "Banana", "Orange"]

print(fruits[-1])
```

Output

```python
Orange
```

---

# Modifying List Elements

Because lists are mutable, changing values is easy.

Before:

```python
colors = ["Red", "Green", "Blue"]
```

Change Green to Yellow:

```python
colors[1] = "Yellow"

print(colors)
```

Output

```python
['Red', 'Yellow', 'Blue']
```

---

# Adding Items

## append()

Adds an item to the end.

```python
numbers = [1, 2, 3]

numbers.append(4)

print(numbers)
```

Output

```python
[1, 2, 3, 4]
```

---

## insert()

Adds an item at a specific position.

```python
numbers = [1, 2, 4]

numbers.insert(2, 3)

print(numbers)
```

Output

```python
[1, 2, 3, 4]
```

Syntax

```python
list.insert(index, value)
```

---

# Removing Items

## remove()

Removes a specific value.

```python
fruits = ["Apple", "Banana", "Orange"]

fruits.remove("Banana")

print(fruits)
```

Output

```python
['Apple', 'Orange']
```

---

## pop()

Removes by index.

```python
numbers = [10, 20, 30]

numbers.pop(1)

print(numbers)
```

Output

```python
[10, 30]
```

If no index is provided:

```python
numbers.pop()
```

It removes the last item.

---

## del

Deletes an item.

```python
numbers = [1, 2, 3]

del numbers[0]

print(numbers)
```

Output

```python
[2, 3]
```

---

## clear()

Removes everything.

```python
numbers = [1, 2, 3]

numbers.clear()

print(numbers)
```

Output

```python
[]
```

---

# List Length

Use `len()`.

```python
fruits = ["Apple", "Banana", "Orange"]

print(len(fruits))
```

Output

```python
3
```

---

# Checking if an Item Exists

Use `in`.

```python
fruits = ["Apple", "Banana", "Orange"]

print("Banana" in fruits)
```

Output

```python
True
```

Another example

```python
print("Mango" in fruits)
```

Output

```python
False
```

---

# Looping Through a List

Using a `for` loop:

```python
fruits = ["Apple", "Banana", "Orange"]

for fruit in fruits:
    print(fruit)
```

Output

```python
Apple
Banana
Orange
```

---

# List Slicing

Slicing lets you extract part of a list.

Syntax

```python
list[start:end]
```

Example

```python
numbers = [10, 20, 30, 40, 50]

print(numbers[1:4])
```

Output

```python
[20, 30, 40]
```

Remember:

* Start is included.
* End is excluded.

---

## First Three Items

```python
print(numbers[:3])
```

Output

```python
[10, 20, 30]
```

---

## Last Two Items

```python
print(numbers[-2:])
```

Output

```python
[40, 50]
```

---

# Common List Methods

| Method      | Description                      |
| ----------- | -------------------------------- |
| `append()`  | Add item to end                  |
| `insert()`  | Insert item at index             |
| `remove()`  | Remove first matching value      |
| `pop()`     | Remove item by index             |
| `clear()`   | Remove all items                 |
| `sort()`    | Sort list                        |
| `reverse()` | Reverse order                    |
| `copy()`    | Copy list                        |
| `count()`   | Count occurrences                |
| `index()`   | Find index of value              |
| `extend()`  | Add another iterable to the list |

---

# Sorting Lists

```python
numbers = [5, 2, 8, 1]

numbers.sort()

print(numbers)
```

Output

```python
[1, 2, 5, 8]
```

Descending order:

```python
numbers.sort(reverse=True)

print(numbers)
```

Output

```python
[8, 5, 2, 1]
```

---

# Reversing a List

```python
letters = ["A", "B", "C"]

letters.reverse()

print(letters)
```

Output

```python
['C', 'B', 'A']
```

---

# Copying Lists

Incorrect way:

```python
a = [1, 2, 3]
b = a
```

Now both variables point to the same list.

Correct way:

```python
a = [1, 2, 3]

b = a.copy()

print(b)
```

Output

```python
[1, 2, 3]
```

---

# Nested Lists

Example:

```python
matrix = [
    [1, 2],
    [3, 4]
]

print(matrix[0][1])
```

Output

```python
2
```

Explanation:

* `matrix[0]` → `[1, 2]`
* `matrix[0][1]` → `2`

---

# Common Errors

## IndexError

```python
numbers = [1, 2, 3]

print(numbers[5])
```

Output

```python
IndexError: list index out of range
```

Always ensure the index exists.

---

## ValueError

```python
fruits = ["Apple", "Banana"]

fruits.remove("Orange")
```

Output

```python
ValueError: list.remove(x): x not in list
```

The value must exist before removing it.

---
# Summary

Lists are one of Python's most versatile and frequently used data structures. They are:

* **Ordered** — items keep their insertion order.
* **Mutable** — you can add, remove, or modify elements after creation.
* **Flexible** — they can store any data type, including other lists.
* **Indexed** — access elements using zero-based or negative indexing.
* **Powerful** — they support slicing, iteration, sorting, searching, and many built-in methods.

Mastering lists is essential because they appear in nearly every Python program, from simple scripts to complex applications involving data processing, web development, automation, and machine learning.
