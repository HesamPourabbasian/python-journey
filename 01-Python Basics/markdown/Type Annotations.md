# Python Type Annotations — Complete Guide

---

# 1. What Are Type Annotations?

**Type annotations** (also called **type hints**) let you specify the **expected data type** of:

* Variables
* Function parameters
* Function return values
* Class attributes

They **do not change how Python runs your code**.

Instead, they help:

* Humans understand code
* IDEs provide better autocomplete
* Static type checkers (like **mypy** and **pyright**) find bugs before execution

---

Without type annotations:

```python
def add(a, b):
    return a + b
```

What types should `a` and `b` be?

* Integers?
* Floats?
* Strings?
* Lists?

We don't know.

---

With type annotations:

```python
def add(a: int, b: int) -> int:
    return a + b
```

Now it's clear:

* `a` should be an integer
* `b` should be an integer
* The function returns an integer

---

# 2. Why Use Type Annotations?

Imagine a project with thousands of lines of code.

Without annotations:

```python
def calculate(data):
    ...
```

What is `data`?

* A list?
* A dictionary?
* A string?

Nobody knows without reading the function.

---

With annotations:

```python
def calculate(data: list[int]) -> float:
    ...
```

Now everyone immediately understands the expected input and output.

Benefits:

* ✅ Easier to read
* ✅ Better autocomplete
* ✅ Better editor support
* ✅ Earlier bug detection
* ✅ Easier teamwork
* ✅ Better documentation

---

# 3. Basic Syntax

General syntax:

```python
variable: type
```

Function parameters:

```python
parameter: type
```

Return type:

```python
-> type
```

Example:

```python
def greet(name: str) -> str:
    return f"Hello {name}"
```

---

# 4. Variable Annotations

Variables can also have type hints.

```python
age: int = 22
```

```python
price: float = 9.99
```

```python
name: str = "Alice"
```

```python
is_student: bool = True
```

---

Without annotations:

```python
age = 22
```

With annotations:

```python
age: int = 22
```

Both work exactly the same at runtime.

---

# 5. Function Parameter Annotations

Parameters can specify expected types.

Example:

```python
def greet(name: str):
    print(f"Hello {name}")
```

Calling:

```python
greet("John")
```

Output:

```text
Hello John
```

---

Multiple parameters:

```python
def subtract(a: int, b: int):
    return a - b
```

---

# 6. Return Type Annotations

Use `->` before the colon.

Example:

```python
def square(number: int) -> int:
    return number ** 2
```

Another example:

```python
def area(radius: float) -> float:
    return 3.14 * radius ** 2
```

---

# 7. Complete Example

```python
def multiply(a: int, b: int) -> int:
    return a * b
```

Explanation:

```
a: int
```

means

> `a` should be an integer.

```
b: int
```

means

> `b` should be an integer.

```
-> int
```

means

> this function returns an integer.

---

# 8. Python Does NOT Enforce Types

Many beginners think this:

```python
def add(a: int, b: int) -> int:
    return a + b
```

means Python refuses other types.

It does **not**.

Example:

```python
print(add("Hello ", "World"))
```

Output:

```text
Hello World
```

Python runs it because `+` also works for strings.

Type hints are **not runtime rules**.

---

# 9. Static Type Checkers

Tools like:

* mypy
* pyright
* PyCharm
* VS Code + Pylance

analyze your code.

Example:

```python
def add(a: int, b: int) -> int:
    return a + b

result = add("5", 3)
```

Python runs until the invalid operation occurs, but a static checker reports a type mismatch before execution.

This helps catch bugs early.

---

# 10. Common Built-in Types

| Type    | Example   |
| ------- | --------- |
| `int`   | `5`       |
| `float` | `3.14`    |
| `str`   | `"Hello"` |
| `bool`  | `True`    |
| `list`  | `[1,2,3]` |
| `tuple` | `(1,2)`   |
| `dict`  | `{"a":1}` |
| `set`   | `{1,2,3}` |
| `None`  | `None`    |

Example:

```python
name: str = "John"

age: int = 20

price: float = 15.5

active: bool = True
```

---

# 11. List Types

Specify what the list contains.

Python 3.9+:

```python
numbers: list[int] = [1, 2, 3]
```

Strings:

```python
names: list[str] = ["Alice", "Bob"]
```

Floats:

```python
grades: list[float] = [19.5, 18.0]
```

---

# 12. Dictionary Types

Specify both key and value types.

```python
student: dict[str, int] = {
    "math": 95,
    "physics": 90
}
```

Meaning:

* keys → strings
* values → integers

---

# 13. Tuple Types

```python
point: tuple[int, int] = (10, 20)
```

Another example:

```python
person: tuple[str, int] = ("Alice", 25)
```

---

# 14. Optional Values

Sometimes a variable may be `None`.

Use `Optional` from the `typing` module (or `T | None` in Python 3.10+).

```python
from typing import Optional

nickname: Optional[str] = None
```

Equivalent in Python 3.10+:

```python
nickname: str | None = None
```

---

# 15. Union Types

Sometimes multiple types are allowed.

Python 3.10+:

```python
value: int | float
```

Earlier versions:

```python
from typing import Union

value: Union[int, float]
```

Example:

```python
def print_value(value: int | str):
    print(value)
```

---

# 16. Any Type

Sometimes anything is acceptable.

```python
from typing import Any

value: Any
```

Example:

```python
value = 5
value = "Hello"
value = [1, 2, 3]
```

`Any` disables most type checking for that value, so use it only when necessary.

---

# 17. Functions Returning Nothing

Functions that don't return a value use `None`.

```python
def greet(name: str) -> None:
    print(f"Hello {name}")
```

---

# 18. Class Annotations

Classes can annotate attributes.

```python
class Student:

    name: str
    age: int

    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age
```

---

# 19. Type Aliases

Complex types can be given meaningful names.

```python
StudentGrades = dict[str, int]
```

Now use:

```python
grades: StudentGrades = {
    "Math": 95
}
```

This improves readability.

---

# 20. Practical Example

Without annotations:

```python
def calculate(data):
    return sum(data)
```

With annotations:

```python
def calculate(data: list[int]) -> int:
    return sum(data)
```

Anyone reading the function immediately knows:

* It expects a list of integers.
* It returns an integer.

---

# 21. IDE Benefits

Editors like VS Code use type annotations for:

* Autocomplete
* Error highlighting
* Better suggestions
* Safer refactoring
* Documentation pop-ups

Example:

```python
def greet(name: str):
    ...
```

When you type:

```python
greet(
```

The editor shows:

```
name: str
```

This makes development faster and reduces mistakes.

---

# 22. Best Practices

### ✅ Annotate public functions.

```python
def login(username: str, password: str) -> bool:
```

---

### ✅ Annotate return values.

```python
def average(numbers: list[int]) -> float:
```

---

### ✅ Use specific collection types.

Good:

```python
list[int]
```

Instead of:

```python
list
```

---

### ✅ Keep annotations accurate.

Avoid:

```python
age: int = "22"
```

Even though Python allows it at runtime, it defeats the purpose of type hints.

---

### ✅ Don't overuse `Any`.

Bad:

```python
from typing import Any

def process(data: Any) -> Any:
    ...
```

Prefer specific types whenever possible.

---

# 23. Summary Table

| Annotation           | Meaning                                        |                  |
| -------------------- | ---------------------------------------------- | ---------------- |
| `x: int`             | Integer                                        |                  |
| `x: float`           | Floating-point number                          |                  |
| `x: str`             | String                                         |                  |
| `x: bool`            | Boolean                                        |                  |
| `x: list[int]`       | List of integers                               |                  |
| `x: dict[str, int]`  | Dictionary with string keys and integer values |                  |
| `x: tuple[int, str]` | Tuple containing an integer and a string       |                  |
| `x: str              | None`                                          | String or `None` |
| `x: int              | float`                                         | Integer or float |
| `x: Any`             | Any type                                       |                  |
| `-> int`             | Function returns an integer                    |                  |
| `-> None`            | Function returns nothing                       |                  |

---

# 24. Mini Exercises

### Exercise 1

Write a function:

```python
def cube(number: int) -> int:
```

Return the cube of the number.

---

### Exercise 2

Create a function:

```python
def average(numbers: list[float]) -> float:
```

Return the average of the list.

---

### Exercise 3

Create a `Book` class.

Annotate:

* `title`
* `author`
* `pages`

Then write a constructor using type annotations.

---

### Exercise 4

Write a function that accepts either an `int` or a `float` and returns its square.

---

# 25. Key Takeaways

* Type annotations describe the **expected** types of variables, parameters, return values, and attributes.
* Python **does not enforce** these annotations at runtime—they are hints, not restrictions.
* Static analysis tools such as **mypy** and **pyright** use type hints to detect potential type errors before your code runs.
* Use annotations to make code easier to understand, improve editor support, and reduce bugs in larger projects.
* Prefer precise types like `list[int]` or `dict[str, float]` over generic types, and avoid `Any` unless flexibility is truly required.
* Type annotations are most valuable when combined with clear function names, docstrings, and good coding practices—they improve readability without changing program behavior.
