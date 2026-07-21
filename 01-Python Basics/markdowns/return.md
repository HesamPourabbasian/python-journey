# Python `return` Statement — Complete Guide

The `return` statement is one of the **most important concepts** in Python. If you truly understand `return`, writing functions becomes much easier.

---

# Table of Contents

1. What is `return`?
2. Why do we use `return`?
3. `return` vs `print()`
4. How `return` works
5. Returning different data types
6. Returning multiple values
7. Returning nothing (`None`)
8. Early return
9. Multiple return statements
10. Returning functions
11. Returning objects
12. Common beginner mistakes
13. Best practices
14. Real-world examples
15. Exercises
16. Summary

---

# 1. What is `return`?

A **function** is like a machine.

* You give it some input.
* It processes the input.
* It gives you an output.

The `return` keyword is how a function **sends the output back**.

Example:

```python
def add(a, b):
    return a + b
```

Calling it:

```python
result = add(3, 5)

print(result)
```

Output

```
8
```

The function **returns** `8` to whoever called it.

---

# 2. Why do we use `return`?

Without `return`, a function can't give its result back.

Imagine a calculator.

You type

```
2 + 3
```

The calculator doesn't just display the answer.

It actually **calculates it and gives it back**.

That's what `return` does.

---

# 3. `return` vs `print()`

This is probably the biggest confusion beginners have.

## print()

Displays something.

```python
def greet():
    print("Hello")
```

```
Hello
```

That's it.

Nothing is sent back.

---

## return

Returns something.

```python
def greet():
    return "Hello"
```

Nothing happens until you use it.

```python
message = greet()

print(message)
```

Output

```
Hello
```

---

Think of it like this:

```
print()
↓
Shows information

return
↓
Gives information back
```

---

## Example

Using print:

```python
def square(x):
    print(x * x)

result = square(4)

print(result)
```

Output

```
16
None
```

Why?

Because `print()` only displayed 16.

The function returned nothing.

---

Using return:

```python
def square(x):
    return x * x

result = square(4)

print(result)
```

Output

```
16
```

---

# 4. How `return` works

Step by step.

```python
def multiply(a, b):
    return a * b

answer = multiply(4, 6)
```

Execution:

```
multiply(4, 6)

↓

a = 4
b = 6

↓

4 * 6 = 24

↓

return 24

↓

answer = 24
```

---

# 5. Returning Different Data Types

You can return **anything**.

---

## Integer

```python
def age():
    return 22
```

---

## Float

```python
def pi():
    return 3.14159
```

---

## String

```python
def name():
    return "Hesam"
```

---

## Boolean

```python
def is_even(x):
    return x % 2 == 0
```

```
True
False
```

---

## List

```python
def numbers():
    return [1, 2, 3]
```

---

## Dictionary

```python
def person():
    return {
        "name": "Alice",
        "age": 20
    }
```

---

## Tuple

```python
def coordinates():
    return (5, 10)
```

---

# 6. Returning Multiple Values

Python actually returns **one tuple**.

Example

```python
def get_user():
    return "Hesam", 22
```

Using it:

```python
user = get_user()

print(user)
```

Output

```
('Hesam', 22)
```

---

Or unpack it.

```python
name, age = get_user()

print(name)
print(age)
```

Output

```
Hesam
22
```

---

# 7. Returning Nothing

If you don't write a return statement...

Python automatically returns

```python
None
```

Example

```python
def hello():
    print("Hello")
```

```python
result = hello()

print(result)
```

Output

```
Hello
None
```

Same as writing

```python
def hello():
    print("Hello")
    return None
```

---

# 8. Early Return

`return` immediately stops the function.

Example

```python
def check_age(age):

    if age < 18:
        return "Too young"

    return "Welcome"
```

If

```
age = 15
```

Python does

```
return "Too young"
```

and **stops**.

The rest of the function never runs.

---

Another example

```python
def divide(a, b):

    if b == 0:
        return "Cannot divide"

    return a / b
```

---

# 9. Multiple Return Statements

A function can have many returns.

Only one executes.

```python
def grade(score):

    if score >= 90:
        return "A"

    elif score >= 80:
        return "B"

    elif score >= 70:
        return "C"

    return "F"
```

---

# 10. Returning Functions

Functions are objects.

You can return them.

```python
def outer():

    def inner():
        return "Hello"

    return inner
```

Now

```python
f = outer()

print(f())
```

Output

```
Hello
```

This is used in decorators and functional programming.

---

# 11. Returning Objects

You can return class objects too.

```python
class Dog:

    def __init__(self, name):
        self.name = name

def create_dog():
    return Dog("Buddy")
```

```python
dog = create_dog()

print(dog.name)
```

Output

```
Buddy
```

---

# 12. Common Beginner Mistakes

## Mistake 1

Using print instead of return.

Wrong

```python
def add(a, b):
    print(a + b)
```

Right

```python
def add(a, b):
    return a + b
```

---

## Mistake 2

Code after return.

```python
def test():

    return 5

    print("Hello")
```

`print()` never runs.

---

## Mistake 3

Forgetting to save the returned value.

```python
def add(a, b):
    return a + b

add(2, 3)
```

Nothing is printed.

Need

```python
print(add(2, 3))
```

or

```python
result = add(2, 3)
```

---

## Mistake 4

Expecting return to print.

```python
def hello():
    return "Hello"

hello()
```

Nothing appears.

Need

```python
print(hello())
```

---

# 13. Best Practices

✔ Return data instead of printing.

✔ Keep functions focused.

✔ Use early returns to reduce nesting.

✔ Return meaningful values.

✔ Avoid unreachable code after `return`.

---

# 14. Real-World Examples

## Password Checker

```python
def check_password(password):

    if len(password) < 8:
        return False

    return True


password = input("Password: ")

if check_password(password):
    print("Valid")
else:
    print("Too short")
```

---

## Shopping Cart

```python
def total_price(prices):
    return sum(prices)


cart = [15, 30, 40]

print(total_price(cart))
```

Output

```
85
```

---

## Calculator

```python
def calculate(a, b, operator):

    if operator == "+":
        return a + b

    if operator == "-":
        return a - b

    if operator == "*":
        return a * b

    if operator == "/":
        if b == 0:
            return "Cannot divide by zero"
        return a / b

    return "Invalid operator"


print(calculate(10, 5, "*"))
```

Output

```
50
```

---

# 15. Exercises

### Exercise 1

Write a function that returns the cube of a number.

Expected

```python
cube(3)
```

↓

```
27
```

---

### Exercise 2

Return the largest number.

```python
largest(10, 20)
```

↓

```
20
```

---

### Exercise 3

Return whether a number is positive.

```python
is_positive(-5)
```

↓

```
False
```

---

### Exercise 4

Return the reverse of a string.

```python
reverse("Python")
```

↓

```
"nohtyP"
```

---

### Exercise 5

Return the average of a list.

```python
average([10, 20, 30])
```

↓

```
20
```

---

# 16. Summary

| Concept          | Description                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `return`         | Sends a value back from a function.                                                                    |
| `print()`        | Displays output on the screen but doesn't return it.                                                   |
| Function stops   | Execution ends immediately when `return` is reached.                                                   |
| Multiple returns | A function can have many `return` statements, but only one is executed per call.                       |
| No `return`      | Python automatically returns `None`.                                                                   |
| Any type         | Functions can return integers, strings, lists, dictionaries, tuples, objects, or even other functions. |
| Multiple values  | Python packs multiple returned values into a tuple.                                                    |

---

## Mental Model

Whenever you write a function, ask yourself:

* **Does this function need to give a result back?** → Use `return`.
* **Do I just want to display something to the user?** → Use `print()`.

A good rule of thumb is: **functions should usually `return` values, while the main part of your program decides whether to `print` them.** This makes your code easier to test, reuse, and combine with other functions.
