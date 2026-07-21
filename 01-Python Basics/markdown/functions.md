# Python Functions — Complete Beginner's Guide

---

# Introduction

A **function** is one of the most important concepts in programming.

A function is a **reusable block of code** that performs a specific task. Instead of writing the same code multiple times, you write it once inside a function and call it whenever you need it.

Think of a function as a **machine**:

* You give it some input (optional).
* It performs a task.
* It may return an output.

This makes programs:

* Cleaner
* Easier to understand
* Easier to maintain
* Less repetitive

---

# Why Do We Need Functions?

Imagine you need to print a welcome message for 100 users.

Without functions:

```python
print("Welcome Hesam!")
print("Welcome Hesam!")
print("Welcome Hesam!")
print("Welcome Hesam!")
print("Welcome Hesam!")
```

This is repetitive.

Using a function:

```python
def welcome():
    print("Welcome Hesam!")

welcome()
welcome()
welcome()
welcome()
welcome()
```

The code is much shorter and easier to update.

---

# Benefits of Functions

Functions provide many advantages.

## 1. Code Reusability

Write once.

Use many times.

```python
def greet():
    print("Hello!")

greet()
greet()
greet()
```

Output

```
Hello!
Hello!
Hello!
```

---

## 2. Better Organization

Large programs become easier to manage.

Instead of writing one giant file, you separate tasks into functions.

Example:

```python
def login():
    pass

def register():
    pass

def logout():
    pass
```

Each function has one responsibility.

---

## 3. Easier Debugging

If something goes wrong, you know where to look.

Instead of checking 500 lines of code, you inspect one function.

---

## 4. Less Repetition (DRY Principle)

**DRY = Don't Repeat Yourself**

Functions eliminate duplicated code.

---

# Function Syntax

A function is created using the **def** keyword.

General syntax:

```python
def function_name():
    # code here
```

Example:

```python
def say_hello():
    print("Hello!")
```

Nothing happens yet.

A function only runs when it is called.

---

# Calling a Function

To execute a function, write its name followed by parentheses.

```python
def say_hello():
    print("Hello!")

say_hello()
```

Output

```
Hello!
```

---

# Anatomy of a Function

```python
def say_hello():
    print("Hello!")
```

Let's break it down.

### def

Tells Python that you're defining a function.

---

### say_hello

The function's name.

Choose descriptive names.

Good:

```python
calculate_total()
```

Bad:

```python
abc()
```

---

### Parentheses ()

Used for parameters (we'll learn these soon).

Even if there are none, parentheses are required.

---

### Colon :

Marks the beginning of the function body.

---

### Indentation

Everything inside the function must be indented.

Correct:

```python
def greet():
    print("Hello")
```

Wrong:

```python
def greet():
print("Hello")
```

Produces:

```
IndentationError
```

---

# Function Naming Rules

Same rules as variable names.

✅ Valid

```python
def greet():
```

```python
def calculate_sum():
```

```python
def get_user_name():
```

❌ Invalid

```python
def 123hello():
```

```python
def my-function():
```

```python
def class():
```

---

# Functions Can Have Multiple Lines

```python
def introduction():
    print("Hello!")
    print("My name is Hesam.")
    print("I'm learning Python.")
```

Calling it:

```python
introduction()
```

Output

```
Hello!
My name is Hesam.
I'm learning Python.
```

---

# Calling a Function Multiple Times

```python
def star():
    print("********")

star()
star()
star()
```

Output

```
********
********
********
```

---

# Functions with Parameters

Parameters allow us to send information into a function.

Without parameters:

```python
def greet():
    print("Hello!")
```

Always prints the same thing.

With parameters:

```python
def greet(name):
    print("Hello", name)
```

Calling:

```python
greet("Hesam")
greet("Alice")
greet("Bob")
```

Output

```
Hello Hesam
Hello Alice
Hello Bob
```

---

# Multiple Parameters

```python
def student(name, age):
    print(name)
    print(age)
```

Calling:

```python
student("Hesam", 22)
```

Output

```
Hesam
22
```

---

# Positional Arguments

Arguments are matched by their order.

```python
def person(name, age):
    print(name)
    print(age)

person("Hesam", 22)
```

Output

```
Hesam
22
```

If swapped:

```python
person(22, "Hesam")
```

Output

```
22
Hesam
```

---

# Keyword Arguments

Instead of relying on position:

```python
def person(name, age):
    print(name)
    print(age)

person(age=22, name="Hesam")
```

Output

```
Hesam
22
```

Order no longer matters.

---

# Default Parameters

Functions can provide default values.

```python
def greet(name="Guest"):
    print("Hello", name)
```

Calling:

```python
greet()
```

Output

```
Hello Guest
```

Calling:

```python
greet("Hesam")
```

Output

```
Hello Hesam
```

---

# Returning Values

Many beginners confuse **print()** with **return**.

They are completely different.

### print()

Displays something.

### return

Sends a value back to wherever the function was called.

Example:

```python
def add(a, b):
    return a + b
```

Using it:

```python
result = add(5, 3)

print(result)
```

Output

```
8
```

---

# print() vs return

Using print:

```python
def add(a, b):
    print(a + b)
```

```python
result = add(5, 3)

print(result)
```

Output

```
8
None
```

Why?

Because the function printed the value but returned nothing.

Python automatically returns:

```python
None
```

---

# Returning Multiple Values

Python allows multiple return values.

```python
def calculations(a, b):
    return a + b, a - b
```

```python
sum_result, difference = calculations(10, 3)

print(sum_result)
print(difference)
```

Output

```
13
7
```

---

# Local Variables

Variables inside functions only exist there.

```python
def test():
    x = 10
    print(x)

test()
```

Works.

But:

```python
print(x)
```

Produces

```
NameError
```

---

# Global Variables

Variables outside functions are global.

```python
name = "Hesam"

def greet():
    print(name)

greet()
```

Output

```
Hesam
```

---

# The global Keyword

Usually avoid this unless necessary.

```python
count = 0

def increase():
    global count
    count += 1

increase()

print(count)
```

Output

```
1
```

---

# Functions Calling Other Functions

```python
def hello():
    print("Hello")

def welcome():
    hello()
    print("Welcome!")

welcome()
```

Output

```
Hello
Welcome!
```

---

# Nested Functions

Functions can be defined inside other functions.

```python
def outer():

    def inner():
        print("Inside")

    inner()

outer()
```

Output

```
Inside
```

---

# Recursive Functions

A function can call itself.

```python
def countdown(n):

    if n == 0:
        print("Done")
    else:
        print(n)
        countdown(n - 1)

countdown(5)
```

Output

```
5
4
3
2
1
Done
```

---

# Built-in Functions

Python already includes many useful functions.

```python
print()
```

```python
len()
```

```python
max()
```

```python
min()
```

```python
sum()
```

```python
type()
```

```python
input()
```

Example:

```python
numbers = [3, 8, 2, 9]

print(max(numbers))
```

Output

```
9
```

---

# User-Defined Functions

Functions you create yourself.

```python
def area(length, width):
    return length * width
```

---

# Lambda Functions (Anonymous Functions)

A small one-line function.

Normal function:

```python
def square(x):
    return x * x
```

Lambda:

```python
square = lambda x: x * x

print(square(5))
```

Output

```
25
```

---

# Function Documentation (Docstrings)

You can describe what a function does.

```python
def greet(name):
    """
    Prints a greeting.
    """
    print("Hello", name)
```

Access it with:

```python
help(greet)
```

or

```python
print(greet.__doc__)
```

---

# Best Practices

✔ Give functions descriptive names.

```python
calculate_average()
```

Better than

```python
calc()
```

---

✔ Keep functions focused on one task.

Bad:

```python
def everything():
```

Better:

```python
def login():
```

```python
def save_file():
```

```python
def send_email():
```

---

✔ Avoid repeating code.

If you copy and paste the same block several times, turn it into a function.

---

✔ Use `return` when you need a value.

Use `print()` only for displaying information.

---

✔ Write docstrings for functions that are more than a few lines or will be reused.

---

# Common Beginner Mistakes

### Forgetting parentheses

Wrong:

```python
def hello:
    print("Hi")
```

Correct:

```python
def hello():
    print("Hi")
```

---

### Forgetting indentation

Wrong:

```python
def hello():
print("Hi")
```

Correct:

```python
def hello():
    print("Hi")
```

---

### Defining but not calling the function

```python
def greet():
    print("Hello")
```

Nothing happens until:

```python
greet()
```

---

### Confusing `print()` with `return`

Wrong expectation:

```python
def add(a, b):
    print(a + b)

result = add(2, 3)

print(result)
```

Output

```
5
None
```

Use `return` instead.

---

# Real-World Example

Imagine you're building a shopping application.

```python
def calculate_total(price, quantity):
    return price * quantity

def apply_discount(total, discount):
    return total - (total * discount / 100)

subtotal = calculate_total(40, 3)

final_price = apply_discount(subtotal, 10)

print("Subtotal:", subtotal)
print("Final Price:", final_price)
```

Output

```
Subtotal: 120
Final Price: 108.0
```

Notice how each function has a single responsibility:

* `calculate_total()` computes the subtotal.
* `apply_discount()` applies the discount.

This modular approach makes the code easier to test, reuse, and maintain.

---

# Summary

Functions are one of the core building blocks of Python programming. They let you organize your code into reusable, modular pieces that perform specific tasks. By using functions, you avoid repetition, improve readability, simplify debugging, and make your programs easier to maintain.

As you continue learning Python, you'll use functions in almost every project—from simple scripts to web applications and data analysis.

## Key Takeaways

* A **function** is a reusable block of code.
* Functions are defined with the `def` keyword.
* A function runs only when it is **called**.
* Functions can accept **parameters** (inputs).
* Functions can **return** values using the `return` keyword.
* Variables created inside a function are **local**.
* Variables defined outside are **global**.
* Python includes many **built-in functions** like `print()`, `len()`, and `sum()`.
* You can create your own **user-defined functions**.
* Keep functions short, descriptive, and focused on a single responsibility.

---

# Practice Exercises

1. Write a function that prints your name.
2. Write a function that accepts a name and prints `Hello, <name>!`.
3. Create a function that returns the square of a number.
4. Write a function that returns the larger of two numbers.
5. Create a function that calculates the area of a rectangle.
6. Write a function that checks whether a number is even or odd.
7. Create a function that returns the factorial of a number using recursion.
8. Write a function that accepts a list of numbers and returns their average.
9. Create a function with a default parameter that greets `"Guest"` if no name is provided.
10. Build a small calculator with four functions: `add()`, `subtract()`, `multiply()`, and `divide()`.

Mastering functions is a major milestone in Python. Once you're comfortable with them, you'll be ready to learn more advanced topics such as modules, object-oriented programming (OOP), decorators, and functional programming.
