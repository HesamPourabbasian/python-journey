# Python Operators — A Complete Guide

---

# Chapter 1: What Are Operators?

An **operator** is a symbol or keyword that tells Python to perform an action on one or more values.

Think of operators as **tools**.

Just like a calculator uses `+` to add numbers, Python uses operators to perform calculations, compare values, combine conditions, store data, and much more.

Example:

```python
5 + 3
```

Python reads this as:

> Add 5 and 3.

Result:

```text
8
```

---

# What is an Operand?

The values that operators work with are called **operands**.

Example:

```python
5 + 3
```

Here:

* `5` → operand
* `+` → operator
* `3` → operand

Another example:

```python
age = 21
```

* `=` is the operator.
* `21` is the value (operand).
* `age` is the variable receiving the value.

---

# Types of Operators in Python

Python has several categories of operators:

| Operator Type | Purpose                                         |
| ------------- | ----------------------------------------------- |
| Arithmetic    | Mathematical calculations                       |
| Assignment    | Store or update values                          |
| Comparison    | Compare values                                  |
| Logical       | Combine conditions                              |
| Membership    | Check if a value exists in a sequence           |
| Identity      | Check if two variables refer to the same object |
| Bitwise       | Work directly with binary numbers               |

We'll cover each one in detail.

---

# Chapter 2: Arithmetic Operators

Arithmetic operators perform mathematical calculations.

| Operator | Meaning             |
| -------- | ------------------- |
| +        | Addition            |
| -        | Subtraction         |
| *        | Multiplication      |
| /        | Division            |
| //       | Floor Division      |
| %        | Modulus (Remainder) |
| **       | Exponent (Power)    |

---

## Addition (+)

Adds two numbers.

```python
a = 10
b = 5

print(a + b)
```

Output

```text
15
```

---

It also joins strings.

```python
first = "Hello"
second = "World"

print(first + " " + second)
```

Output

```text
Hello World
```

---

## Subtraction (-)

Subtracts one number from another.

```python
print(20 - 8)
```

Output

```text
12
```

---

## Multiplication (*)

```python
print(6 * 7)
```

Output

```text
42
```

---

Strings can also be multiplied.

```python
print("Python " * 3)
```

Output

```text
Python Python Python
```

---

## Division (/)

Always returns a float.

```python
print(10 / 2)
```

Output

```text
5.0
```

Even when the answer is a whole number, Python returns a float.

---

## Floor Division (//)

Removes the decimal part.

```python
print(10 // 3)
```

Output

```text
3
```

Because

```text
10 / 3 = 3.333...
```

Floor division keeps only:

```text
3
```

---

## Modulus (%)

Returns the remainder after division.

```python
print(10 % 3)
```

Output

```text
1
```

Because

```text
10 ÷ 3

3 × 3 = 9

10 - 9 = 1
```

The remainder is **1**.

---

Common use:

Check whether a number is even.

```python
number = 8

print(number % 2)
```

Output

```text
0
```

A remainder of `0` means the number is even.

---

## Exponent (**)

Raises a number to a power.

```python
print(2 ** 3)
```

Output

```text
8
```

Because

```text
2 × 2 × 2 = 8
```

---

Square:

```python
print(5 ** 2)
```

Output

```text
25
```

---

# Operator Precedence

Python follows mathematical order.

```python
print(2 + 3 * 4)
```

Output

```text
14
```

Multiplication happens first.

Equivalent to:

```python
2 + (3 * 4)
```

---

Use parentheses to control the order.

```python
print((2 + 3) * 4)
```

Output

```text
20
```

---

# Chapter 3: Assignment Operators

Assignment operators store and update values.

---

## Basic Assignment (=)

```python
score = 90
```

Meaning:

Store `90` inside `score`.

---

## Addition Assignment (+=)

Instead of writing:

```python
score = score + 5
```

You can write:

```python
score += 5
```

Example

```python
score = 90

score += 5

print(score)
```

Output

```text
95
```

---

## Subtraction Assignment (-=)

```python
money = 100

money -= 20

print(money)
```

Output

```text
80
```

---

## Multiplication Assignment (*=)

```python
x = 4

x *= 3

print(x)
```

Output

```text
12
```

---

## Division Assignment (/=)

```python
x = 20

x /= 5

print(x)
```

Output

```text
4.0
```

---

Other assignment operators include:

```python
//=
%=
**=
&=
|=
^=
<<=
>>=
```

You'll mainly use the first five when starting.

---

# Chapter 4: Comparison Operators

Comparison operators compare two values.

The result is always:

* `True`
* `False`

---

## Equal To (==)

```python
print(5 == 5)
```

Output

```text
True
```

---

```python
print(5 == 8)
```

Output

```text
False
```

---

## Not Equal (!=)

```python
print(5 != 8)
```

Output

```text
True
```

---

## Greater Than (>)

```python
print(10 > 7)
```

Output

```text
True
```

---

## Less Than (<)

```python
print(4 < 2)
```

Output

```text
False
```

---

## Greater Than or Equal (>=)

```python
print(10 >= 10)
```

Output

```text
True
```

---

## Less Than or Equal (<=)

```python
print(6 <= 3)
```

Output

```text
False
```

---

# Comparison Example

```python
age = 21

print(age >= 18)
```

Output

```text
True
```

---

# Chapter 5: Logical Operators

Logical operators combine multiple conditions.

| Operator | Meaning                             |
| -------- | ----------------------------------- |
| and      | Both conditions must be True        |
| or       | At least one condition must be True |
| not      | Reverses True and False             |

---

## AND

```python
age = 20
student = True

print(age >= 18 and student)
```

Output

```text
True
```

Both conditions are true.

---

If one becomes false:

```python
print(age < 18 and student)
```

Output

```text
False
```

---

## OR

```python
print(True or False)
```

Output

```text
True
```

Only one condition must be true.

---

## NOT

```python
print(not True)
```

Output

```text
False
```

---

```python
print(not False)
```

Output

```text
True
```

---

# Truth Table

| A     | B     | A and B | A or B |
| ----- | ----- | ------- | ------ |
| True  | True  | True    | True   |
| True  | False | False   | True   |
| False | True  | False   | True   |
| False | False | False   | False  |

---

# Chapter 6: Membership Operators

Membership operators check whether a value exists inside a sequence.

| Operator | Meaning        |
| -------- | -------------- |
| in       | Exists         |
| not in   | Does not exist |

---

## Using `in`

```python
fruits = ["apple", "banana", "orange"]

print("banana" in fruits)
```

Output

```text
True
```

---

Strings also work.

```python
word = "Python"

print("Py" in word)
```

Output

```text
True
```

---

## Using `not in`

```python
print("grape" not in fruits)
```

Output

```text
True
```

---

# Chapter 7: Identity Operators

Identity operators compare whether two variables refer to the **same object in memory**, not just whether they have equal values.

| Operator | Meaning           |
| -------- | ----------------- |
| is       | Same object       |
| is not   | Different objects |

---

```python
a = [1, 2]
b = a

print(a is b)
```

Output

```text
True
```

Both variables refer to the same list.

---

```python
a = [1, 2]
b = [1, 2]

print(a == b)
print(a is b)
```

Output

```text
True
False
```

The lists have equal contents (`==`), but they are different objects (`is`).

---

# Chapter 8: Bitwise Operators

Bitwise operators work on the binary (base-2) representation of integers.

| Operator | Meaning     |
| -------- | ----------- |
| &        | AND         |
| |        | OR          |
| ^        | XOR         |
| ~        | NOT         |
| <<       | Left Shift  |
| >>       | Right Shift |

Example:

```python
print(5 & 3)
```

Output

```text
1
```

Binary explanation:

```text
5 = 101
3 = 011
---------
& = 001
```

Which equals `1`.

Bitwise operators are commonly used in low-level programming, networking, graphics, embedded systems, and performance-sensitive code. Most beginners won't need them immediately.

---

# Chapter 9: Common Beginner Mistakes

## Mistake 1: Using `=` instead of `==`

Wrong:

```python
if age = 18:
    print("Adult")
```

This causes a `SyntaxError`.

Correct:

```python
if age == 18:
    print("Adult")
```

---

## Mistake 2: Dividing by Zero

```python
print(10 / 0)
```

Error:

```text
ZeroDivisionError
```

---

## Mistake 3: Confusing `is` and `==`

```python
a = [1]
b = [1]

print(a == b)
```

```text
True
```

```python
print(a is b)
```

```text
False
```

Use:

* `==` to compare **values**.
* `is` to compare **object identity**.

---

# Mini Project: Shopping Cart

```python
price = 25
quantity = 4

subtotal = price * quantity

tax = subtotal * 0.08

total = subtotal + tax

print("Subtotal:", subtotal)
print("Tax:", tax)
print("Total:", total)
```

Output

```text
Subtotal: 100
Tax: 8.0
Total: 108.0
```

---

# Key Takeaways

* **Arithmetic operators** perform mathematical calculations.
* **Assignment operators** store and update values.
* **Comparison operators** return `True` or `False`.
* **Logical operators** combine or negate conditions.
* **Membership operators** check whether a value exists in a sequence.
* **Identity operators** determine whether two variables reference the same object.
* **Bitwise operators** manipulate numbers at the binary level.
* Python follows **operator precedence**, so use parentheses when you need to control the order of evaluation.

---
