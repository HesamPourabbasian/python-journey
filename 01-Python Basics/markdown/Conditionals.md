# Python Conditional Statements — A Complete Guide

---

# Chapter 1: What Are Conditional Statements?

A **conditional statement** allows your program to make decisions.

Instead of executing every line of code, Python checks whether a condition is **True** or **False** and decides which code to run.

Think of it like making decisions in real life.

Examples:

* If it is raining, take an umbrella.
* If your battery is below 20%, charge your phone.
* If you are over 18, you can vote.
* If your exam score is at least 50, you pass.

Programming follows the same idea.

---

# Why Do We Need Conditional Statements?

Without conditions, programs would always do the same thing.

Imagine a login system.

Without conditions:

```python
print("Welcome!")
```

Everyone would be allowed in.

Instead:

```python
password = "python123"

if password == "python123":
    print("Access Granted")
```

Only the correct password gets access.

Conditional statements make programs:

* Intelligent
* Interactive
* Dynamic
* Responsive to user input

---

# Boolean Values

Conditions always evaluate to one of two values:

```python
True
False
```

Examples:

```python
5 > 3
```

Result

```text
True
```

---

```python
10 == 20
```

Result

```text
False
```

Conditional statements depend entirely on these Boolean values.

---

# Comparison Operators Review

Most conditions use comparison operators.

| Operator | Meaning               |
| -------- | --------------------- |
| ==       | Equal to              |
| !=       | Not equal             |
| >        | Greater than          |
| <        | Less than             |
| >=       | Greater than or equal |
| <=       | Less than or equal    |

Example

```python
age = 21

print(age >= 18)
```

Output

```text
True
```

---

# Chapter 2: The `if` Statement

The simplest conditional statement.

Syntax

```python
if condition:
    code
```

Notice the colon (`:`).

Also notice the indentation.

Example

```python
age = 20

if age >= 18:
    print("You are an adult.")
```

Output

```text
You are an adult.
```

---

If the condition is false:

```python
age = 15

if age >= 18:
    print("Adult")
```

Output

Nothing happens.

---

# Indentation

Python uses indentation instead of braces `{}`.

Correct

```python
if True:
    print("Hello")
```

Wrong

```python
if True:
print("Hello")
```

Produces

```text
IndentationError
```

By convention, use **4 spaces** for each indentation level.

---

# Multiple Statements Inside an `if`

```python
age = 20

if age >= 18:
    print("Adult")
    print("You may vote.")
    print("Welcome!")
```

All three lines execute because the condition is true.

---

# Chapter 3: The `else` Statement

`else` runs when the `if` condition is false.

Syntax

```python
if condition:
    code
else:
    code
```

Example

```python
age = 16

if age >= 18:
    print("Adult")
else:
    print("Minor")
```

Output

```text
Minor
```

---

Another example

```python
temperature = 10

if temperature > 20:
    print("Warm")
else:
    print("Cold")
```

Output

```text
Cold
```

---

# Chapter 4: The `elif` Statement

Sometimes there are more than two possibilities.

Use `elif` (short for "else if").

Syntax

```python
if condition1:
    code

elif condition2:
    code

else:
    code
```

Example

```python
score = 85

if score >= 90:
    print("A")

elif score >= 80:
    print("B")

elif score >= 70:
    print("C")

else:
    print("F")
```

Output

```text
B
```

Python checks conditions from top to bottom and stops at the **first** one that is `True`.

---

# Order Matters

Wrong

```python
score = 95

if score >= 70:
    print("C")

elif score >= 90:
    print("A")
```

Output

```text
C
```

The second condition is never checked.

Correct

```python
if score >= 90:
    print("A")

elif score >= 70:
    print("C")
```

Output

```text
A
```

Always put the most specific or highest-priority conditions first.

---

# Chapter 5: Nested `if` Statements

An `if` can be inside another `if`.

Example

```python
age = 20
has_license = True

if age >= 18:

    if has_license:
        print("You can drive.")
```

Output

```text
You can drive.
```

---

Another example

```python
username = "admin"
password = "python"

if username == "admin":

    if password == "python":
        print("Login Successful")

    else:
        print("Wrong Password")

else:
    print("Unknown User")
```

---

# Chapter 6: Logical Operators in Conditions

Logical operators combine multiple conditions.

## AND

Both conditions must be true.

```python
age = 20
student = True

if age >= 18 and student:
    print("Eligible")
```

---

## OR

Only one condition must be true.

```python
if age >= 18 or student:
    print("Allowed")
```

---

## NOT

Reverses a Boolean value.

```python
logged_in = False

if not logged_in:
    print("Please log in.")
```

Output

```text
Please log in.
```

---

# Chapter 7: Truthy and Falsy Values

Not everything in Python is literally `True` or `False`.

Many values behave like them.

Falsy values include:

```python
False
None
0
0.0
""
[]
{}
set()
```

Everything else is generally considered truthy.

Example

```python
name = ""

if name:
    print("Name entered")

else:
    print("No name")
```

Output

```text
No name
```

---

# Chapter 8: The Ternary Conditional Expression

For simple conditions, Python offers a one-line form.

Syntax

```python
value_if_true if condition else value_if_false
```

Example

```python
age = 20

status = "Adult" if age >= 18 else "Minor"

print(status)
```

Output

```text
Adult
```

Use this only for simple decisions.

---

# Chapter 9: The `match-case` Statement (Python 3.10+)

`match-case` is Python's version of a switch statement.

It compares one value against several possible patterns.

Syntax

```python
match variable:
    case value1:
        code

    case value2:
        code

    case _:
        default_code
```

The underscore (`_`) acts like the default case.

---

Example

```python
day = 3

match day:

    case 1:
        print("Monday")

    case 2:
        print("Tuesday")

    case 3:
        print("Wednesday")

    case _:
        print("Unknown Day")
```

Output

```text
Wednesday
```

---

Another example

```python
command = "start"

match command:

    case "start":
        print("Program Started")

    case "stop":
        print("Program Stopped")

    case "restart":
        print("Restarting")

    case _:
        print("Unknown Command")
```

---

# Matching Multiple Values

```python
day = "Saturday"

match day:

    case "Saturday" | "Sunday":
        print("Weekend")

    case _:
        print("Weekday")
```

Output

```text
Weekend
```

The `|` symbol means **or** within a `case`.

---

# When to Use `match-case`

Use `match-case` when:

* Comparing one variable to many fixed values.
* Writing menu systems.
* Processing commands.
* Working with enums or constants.

Use `if-elif-else` when:

* Conditions involve ranges (`score >= 90`).
* Conditions use logical operators (`and`, `or`, `not`).
* Conditions are more complex than matching exact values.

---

# Chapter 10: Common Beginner Mistakes

## Mistake 1: Using `=` Instead of `==`

Wrong

```python
if age = 18:
    print("Adult")
```

Produces

```text
SyntaxError
```

Correct

```python
if age == 18:
    print("Adult")
```

---

## Mistake 2: Forgetting the Colon

Wrong

```python
if age > 18
    print("Adult")
```

Correct

```python
if age > 18:
    print("Adult")
```

---

## Mistake 3: Bad Indentation

Wrong

```python
if True:
print("Hello")
```

Produces

```text
IndentationError
```

Correct

```python
if True:
    print("Hello")
```

---

## Mistake 4: Incorrect Condition Order

Wrong

```python
score = 95

if score >= 70:
    print("Passed")

elif score >= 90:
    print("Excellent")
```

Output

```text
Passed
```

Correct

```python
if score >= 90:
    print("Excellent")

elif score >= 70:
    print("Passed")
```

---

# Mini Project 1: Pass or Fail

```python
score = 72

if score >= 50:
    print("You Passed!")

else:
    print("You Failed.")
```

---

# Mini Project 2: Login System

```python
username = input("Username: ")
password = input("Password: ")

if username == "admin" and password == "python123":
    print("Login Successful!")

else:
    print("Invalid Username or Password.")
```

---

# Mini Project 3: Simple Calculator Menu

```python
operation = input("Choose (+, -, *, /): ")

match operation:

    case "+":
        print("Addition Selected")

    case "-":
        print("Subtraction Selected")

    case "*":
        print("Multiplication Selected")

    case "/":
        print("Division Selected")

    case _:
        print("Invalid Operation")
```

---

# Key Takeaways

* Conditional statements allow programs to make decisions based on **True** or **False** conditions.
* The `if` statement executes code only when its condition is true.
* The `else` statement provides an alternative path when the `if` condition is false.
* The `elif` statement lets you test multiple conditions in sequence.
* Python uses **indentation** (typically four spaces) to define code blocks.
* Logical operators (`and`, `or`, `not`) combine or modify conditions.
* Many objects have an inherent truth value, known as **truthy** and **falsy** behavior.
* The **ternary conditional expression** provides a concise way to choose between two values.
* The `match-case` statement (Python 3.10+) is ideal for matching one value against multiple exact patterns.
* Always order `if`/`elif` conditions carefully because Python stops checking after the first condition that evaluates to `True`.

---

