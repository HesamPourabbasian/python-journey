# Python Docstrings and Comments — Complete Guide

---

# 1. What Are Comments?

A **comment** is text written in your code that is **ignored by the Python interpreter**.

Comments are written for **humans**, not for Python.

They help explain:

* What the code does
* Why it exists
* Difficult logic
* Future improvements
* Important notes

Syntax:

```python
# This is a comment
```

Example:

```python
# Store the user's age
age = 22
```

Python ignores the comment and only executes:

```python
age = 22
```

---

# 2. Why Use Comments?

Imagine seeing this code months later:

```python
price = 100
discount = 0.2
print(price * (1 - discount))
```

You might understand it now.

But after six months?

Comments make code easier to understand.

Example:

```python
# Calculate the final price after applying a 20% discount
price = 100
discount = 0.2

print(price * (1 - discount))
```

Now the purpose is immediately clear.

---

# 3. Single-Line Comments

Most comments are one line.

```python
# Get user input
name = input("Enter your name: ")
```

Another example:

```python
# Convert input to an integer
age = int(input("Age: "))
```

---

# 4. Inline Comments

Comments can also appear after code.

```python
age = 22  # User's age
```

Example:

```python
radius = 10  # Circle radius in centimeters
```

Use inline comments sparingly. They should add information, not repeat the obvious.

Bad:

```python
x = 5  # Assign 5 to x
```

Good:

```python
timeout = 30  # Seconds before the request is canceled
```

---

# 5. Multi-Line Comments

Python has no special syntax for multi-line comments.

Instead, use multiple `#` lines.

```python
# Read the input file.
# Remove duplicate entries.
# Save the cleaned data.
```

Avoid using triple quotes (`""" ... """`) as fake comments. Triple-quoted strings create string objects, even if they are not assigned to a variable.

---

# 6. When Should You Write Comments?

Good reasons:

* Explain **why** something is done.
* Describe complex algorithms.
* Warn about unusual behavior.
* Mark TODO items.
* Explain workarounds or limitations.

Example:

```python
# We sort before searching because binary search
# only works on sorted lists.
numbers.sort()
```

---

Avoid comments that describe the obvious.

Bad:

```python
# Add one
x += 1
```

The code already makes that clear.

---

# 7. What Is a Docstring?

A **docstring** (documentation string) is a special string placed **immediately after** the definition of a:

* Module
* Function
* Class
* Method

Python stores this string so it can be accessed later.

Syntax:

```python
def function():
    """Docstring goes here."""
```

Notice:

* It uses triple quotes.
* It is the **first statement** inside the function.

---

# 8. Difference Between Comments and Docstrings

| Comments                    | Docstrings                                  |
| --------------------------- | ------------------------------------------- |
| Begin with `#`              | Use triple quotes (`""" """`)               |
| Ignored by Python           | Stored by Python                            |
| Explain code for developers | Document functions, classes, and modules    |
| Cannot be accessed later    | Can be accessed with `.__doc__` or `help()` |

---

# 9. Simple Function Docstring

```python
def greet():
    """Print a greeting message."""
    print("Hello!")
```

Calling the function:

```python
greet()
```

Output:

```text
Hello!
```

The docstring is not printed automatically.

---

# 10. Accessing a Docstring

Every documented object has a `__doc__` attribute.

Example:

```python
def greet():
    """Print a greeting."""
    print("Hello!")
```

```python
print(greet.__doc__)
```

Output:

```text
Print a greeting.
```

---

# 11. Using help()

Python's `help()` function displays documentation.

```python
def square(number):
    """Return the square of a number."""
    return number ** 2
```

```python
help(square)
```

Output (simplified):

```text
Help on function square:

square(number)
    Return the square of a number.
```

This is why good docstrings are important—they power Python's built-in help system and many documentation tools.

---

# 12. Writing Good Function Docstrings

A good docstring should answer:

* What does this function do?
* What parameters does it take?
* What does it return?
* Does it raise any exceptions?
* Are there important notes?

---

Example:

```python
def add(a, b):
    """
    Add two numbers.

    Parameters:
        a (int or float): First number.
        b (int or float): Second number.

    Returns:
        int or float: The sum of the two numbers.
    """
    return a + b
```

This is much more useful than:

```python
"""Add."""
```

---

# 13. Documenting Parameters

Example:

```python
def calculate_area(length, width):
    """
    Calculate the area of a rectangle.

    Parameters:
        length (float): Rectangle length.
        width (float): Rectangle width.

    Returns:
        float: Rectangle area.
    """
    return length * width
```

---

# 14. Documenting Return Values

Example:

```python
def is_even(number):
    """
    Check whether a number is even.

    Returns:
        bool: True if the number is even,
        otherwise False.
    """
    return number % 2 == 0
```

---

# 15. Documenting Exceptions

If a function intentionally raises exceptions, document them.

```python
def divide(a, b):
    """
    Divide two numbers.

    Raises:
        ZeroDivisionError:
            If b is zero.

    Returns:
        float: The result of the division.
    """
    return a / b
```

---

# 16. Module Docstrings

A module is simply a Python file.

A module docstring appears at the very top of the file.

```python
"""
Utility functions for basic mathematics.

This module contains helper functions for
addition, subtraction, multiplication,
and division.
"""
```

This explains the purpose of the entire file.

---

# 17. Class Docstrings

Classes should also have docstrings.

```python
class Student:
    """
    Represent a student.

    Stores the student's name and age.
    """

    def __init__(self, name, age):
        self.name = name
        self.age = age
```

---

# 18. Method Docstrings

Methods inside classes should also be documented.

```python
class Calculator:

    def multiply(self, a, b):
        """
        Multiply two numbers.

        Returns:
            int or float:
            Product of the numbers.
        """
        return a * b
```

---

# 19. Google-Style Docstrings

Many companies use the Google docstring format because it is concise and widely supported.

```python
def multiply(a, b):
    """
    Multiply two numbers.

    Args:
        a (int): First number.
        b (int): Second number.

    Returns:
        int: Product of the numbers.
    """
    return a * b
```

---

# 20. NumPy-Style Docstrings

Scientific Python libraries often use the NumPy style.

```python
def multiply(a, b):
    """
    Multiply two numbers.

    Parameters
    ----------
    a : int
        First number.
    b : int
        Second number.

    Returns
    -------
    int
        Product of the numbers.
    """
    return a * b
```

---

# 21. Writing Helpful Comments

Comments should explain **why**, not **what**.

Poor:

```python
# Increment i
i += 1
```

Better:

```python
# Skip the header row because it contains column names.
i += 1
```

---

Another example:

Poor:

```python
numbers.sort()
```

Comment:

```python
# Sort numbers.
```

The code already says that.

Better:

```python
# Binary search requires the list to be sorted first.
numbers.sort()
```

---

# 22. TODO Comments

Developers often leave reminders.

```python
# TODO: Add input validation.
```

Another example:

```python
# FIXME: Handle negative numbers correctly.
```

Common markers:

* `TODO` – Something still needs to be done.
* `FIXME` – There is a known bug to fix.
* `NOTE` – Additional important information.

---

# 23. Complete Example

```python
"""
Simple calculator module.

Provides basic arithmetic functions.
"""

def divide(a, b):
    """
    Divide two numbers.

    Parameters:
        a (float): Dividend.
        b (float): Divisor.

    Returns:
        float: Division result.

    Raises:
        ZeroDivisionError:
            If b is zero.
    """

    # Division by zero is automatically checked by Python.
    return a / b


result = divide(10, 2)

print(result)
```

Output:

```text
5.0
```

---

# 24. Best Practices

### ✅ Write docstrings for:

* Modules
* Classes
* Public functions
* Methods

---

### ✅ Keep comments up to date.

Outdated comments are worse than no comments.

---

### ✅ Explain why.

Instead of:

```python
# Divide by two.
```

Write:

```python
# Average the values collected from both sensors.
```

---

### ✅ Don't over-comment.

Avoid:

```python
# Create a list
numbers = []

# Add one
numbers.append(1)

# Print list
print(numbers)
```

The code is already clear.

---

### ✅ Keep docstrings concise but complete.

Include:

* Purpose
* Parameters
* Return value
* Exceptions (if applicable)

---

# 25. Summary Table

| Feature                    | Comment         | Docstring                                   |
| -------------------------- | --------------- | ------------------------------------------- |
| Syntax                     | `#`             | `"""..."""`                                 |
| Used for                   | Explaining code | Documenting modules, classes, and functions |
| Read by Python             | No              | Yes                                         |
| Accessible with `.__doc__` | No              | Yes                                         |
| Shown by `help()`          | No              | Yes                                         |
| Can generate documentation | No              | Yes                                         |

---

# 26. Mini Exercises

### Exercise 1

Write a function called `cube(number)`.

* Add a proper docstring.
* Return the cube of the number.

---

### Exercise 2

Create a `Student` class.

* Add a class docstring.
* Add a documented `display()` method.

---

### Exercise 3

Write a program that:

* Uses at least **three comments** explaining important decisions.
* Defines **two functions**, each with a clear docstring.
* Prints each function's documentation using `print(function_name.__doc__)`.

---

# 27. Key Takeaways

* **Comments** (`#`) explain specific lines or implementation decisions and are ignored by the Python interpreter.
* **Docstrings** (`"""..."""`) document modules, classes, functions, and methods, and become part of the object's `__doc__` attribute.
* Use comments to explain **why** something is done, especially for complex or non-obvious logic.
* Use docstrings to describe **what** an object does, its parameters, return values, raised exceptions, and any important usage notes.
* You can access docstrings with `object.__doc__` or view them through `help(object)`, and many documentation tools use them automatically.
* Well-written comments and docstrings make code easier to maintain, understand, and use—both for others and for your future self.
