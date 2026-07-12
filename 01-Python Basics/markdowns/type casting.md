# Python Typecasting (Type Conversion) – Complete Guide

Typecasting (also called **type conversion**) is one of the most important concepts in Python. As you write programs, you will constantly work with different data types such as integers, floating-point numbers, strings, and booleans. Sometimes these data types need to work together, and Python must convert one type into another.

Understanding when and how Python performs these conversions will help you avoid errors and write cleaner, more reliable code.

---

# What is Typecasting?

**Typecasting** is the process of converting a value from one data type to another.

For example:

* Integer → Float
* Float → Integer
* Integer → String
* String → Integer
* Boolean → Integer

### Example

```python
age = 22

print(age)
print(type(age))
```

Output

```python
22
<class 'int'>
```

Now convert it to a string.

```python
age = str(age)

print(age)
print(type(age))
```

Output

```python
22
<class 'str'>
```

The value still looks like `22`, but its data type has changed.

---

# Why Do We Need Typecasting?

Different operations require different data types.

Imagine this:

```python
age = "22"
```

This is a string, not a number.

Trying to add a number to it causes an error.

```python
age = "22"

print(age + 5)
```

Output

```python
TypeError
```

Python cannot add a string and an integer together.

Instead, convert the string into an integer.

```python
age = "22"

age = int(age)

print(age + 5)
```

Output

```python
27
```

---

# Two Types of Type Conversion

Python supports two kinds of type conversion:

1. **Implicit Type Conversion**
2. **Explicit Type Conversion**

---

# 1. Implicit Type Conversion

Implicit means **automatic**.

Python automatically converts one data type into another whenever it can do so safely.

You do not write any conversion function yourself.

---

## Example 1

```python
num1 = 10
num2 = 2.5

result = num1 + num2

print(result)
print(type(result))
```

Output

```python
12.5
<class 'float'>
```

Why?

Python converted the integer `10` into the float `10.0`.

```
10
↓

10.0
```

Then it performed:

```
10.0 + 2.5 = 12.5
```

---

## Another Example

```python
a = 4
b = 3.0

print(a * b)
```

Output

```python
12.0
```

Again,

```
4 → 4.0
```

Then

```
4.0 × 3.0
```

---

## Why Does Python Do This?

Python tries to prevent losing information.

Converting

```
5
```

to

```
5.0
```

doesn't lose anything.

But converting

```
5.8
```

to

```
5
```

would lose the decimal part.

Therefore Python only performs safe automatic conversions.

---

# Implicit Conversion Rules

Some common conversions Python performs automatically:

| Operation     | Result Type |
| ------------- | ----------- |
| int + int     | int         |
| int + float   | float       |
| float + float | float       |
| int * float   | float       |
| bool + int    | int         |

Example:

```python
print(True + 5)
```

Output

```python
6
```

Because

```
True = 1
False = 0
```

So

```
1 + 5 = 6
```

---

# 2. Explicit Type Conversion

Explicit means **manual conversion**.

You tell Python exactly which type you want.

Python provides several built-in functions for this purpose.

---

# Common Type Conversion Functions

| Function | Converts To                       |
| -------- | --------------------------------- |
| int()    | Integer                           |
| float()  | Float                             |
| str()    | String                            |
| bool()   | Boolean                           |
| list()   | List                              |
| tuple()  | Tuple                             |
| set()    | Set                               |
| dict()   | Dictionary (from key-value pairs) |

---

# int()

Converts a value into an integer.

Example 1

```python
x = "100"

y = int(x)

print(y)
print(type(y))
```

Output

```python
100
<class 'int'>
```

---

### From Float

```python
x = 8.9

print(int(x))
```

Output

```python
8
```

Notice:

```
8.9 → 8
```

The decimal part is simply removed.

This is called **truncation**, not rounding.

---

Example

```python
print(int(9.99))
print(int(5.1))
print(int(-4.8))
```

Output

```python
9
5
-4
```

---

# float()

Converts a value into a floating-point number.

Example

```python
x = 15

print(float(x))
```

Output

```python
15.0
```

---

From String

```python
price = "19.99"

print(float(price))
```

Output

```python
19.99
```

---

# str()

Converts almost anything into a string.

Example

```python
age = 22

text = str(age)

print(text)
print(type(text))
```

Output

```python
22
<class 'str'>
```

---

Convert a float

```python
print(str(4.5))
```

Output

```python
'4.5'
```

---

# bool()

Converts values into either

```
True
```

or

```
False
```

---

## Values That Become False

```python
False
0
0.0
''
""
[]
()
{}
set()
None
```

Everything else becomes `True`.

---

Examples

```python
print(bool(0))
print(bool(1))
print(bool(""))
print(bool("Hello"))
print(bool([]))
print(bool([1, 2]))
```

Output

```python
False
True
False
True
False
True
```

---

# list()

Converts iterable objects into a list.

Example

```python
text = "Python"

letters = list(text)

print(letters)
```

Output

```python
['P', 'y', 't', 'h', 'o', 'n']
```

---

# tuple()

```python
numbers = [1, 2, 3]

print(tuple(numbers))
```

Output

```python
(1, 2, 3)
```

---

# set()

```python
numbers = [1, 2, 2, 3, 3]

print(set(numbers))
```

Output

```python
{1, 2, 3}
```

Duplicate values disappear because sets only store unique elements.

---

# dict()

Creates a dictionary from key-value pairs.

```python
pairs = [
    ("name", "Alice"),
    ("age", 22)
]

person = dict(pairs)

print(person)
```

Output

```python
{'name': 'Alice', 'age': 22}
```

---

# User Input and Typecasting

One of the most common uses of typecasting is with `input()`.

Remember:

```python
name = input("Enter your name: ")
```

Everything entered through `input()` is a **string**.

Example

```python
age = input("Age: ")

print(type(age))
```

Output

```python
<class 'str'>
```

To perform math, convert it.

```python
age = int(input("Age: "))

print(age + 5)
```

Input

```
22
```

Output

```python
27
```

---

# Invalid Type Conversion

Not every conversion is possible.

Example

```python
x = "hello"

print(int(x))
```

Output

```python
ValueError
```

Because `"hello"` is not a valid number.

---

Another Example

```python
float("Python")
```

Output

```python
ValueError
```

---

# Type Conversion Examples

### String → Integer

```python
num = "15"

print(int(num))
```

Output

```python
15
```

---

### Integer → Float

```python
print(float(7))
```

Output

```python
7.0
```

---

### Float → Integer

```python
print(int(9.8))
```

Output

```python
9
```

---

### Integer → String

```python
print(str(200))
```

Output

```python
'200'
```

---

### Boolean → Integer

```python
print(int(True))
print(int(False))
```

Output

```python
1
0
```

---

### Integer → Boolean

```python
print(bool(10))
print(bool(0))
```

Output

```python
True
False
```

---

# Practical Example

Without conversion:

```python
num1 = input("First number: ")
num2 = input("Second number: ")

print(num1 + num2)
```

Input

```
10
20
```

Output

```python
1020
```

Because both are strings.

---

Correct version:

```python
num1 = int(input("First number: "))
num2 = int(input("Second number: "))

print(num1 + num2)
```

Output

```python
30
```

---

# Common Mistakes

### Mistake 1

```python
"5" + "6"
```

Output

```python
56
```

This is string concatenation, not addition.

Correct:

```python
int("5") + int("6")
```

Output

```python
11
```

---

### Mistake 2

```python
int("3.5")
```

Output

```python
ValueError
```

Correct:

```python
int(float("3.5"))
```

Output

```python
3
```

---

### Mistake 3

Expecting `int()` to round numbers

```python
int(9.9)
```

Output

```python
9
```

It **truncates** the decimal part; it does **not** round. Use `round()` if you want rounding:

```python
print(round(9.9))
```

Output

```python
10
```

---

# Best Practices

* Use **implicit conversion** when Python handles it automatically.
* Use **explicit conversion** whenever you need a specific data type.
* Always convert user input before performing arithmetic.
* Check a variable's type with `type()` if you're unsure.
* Be careful when converting strings to numbers—invalid numeric strings raise a `ValueError`.
* Remember that `int()` truncates decimal values instead of rounding them.

---

# Summary

* **Typecasting (type conversion)** changes a value from one data type to another.
* Python supports:

  * **Implicit conversion**: Automatic, safe conversions performed by Python (e.g., `int` → `float` during arithmetic).
  * **Explicit conversion**: Manual conversions using functions like `int()`, `float()`, `str()`, `bool()`, `list()`, `tuple()`, `set()`, and `dict()`.
* `input()` always returns a **string**, so convert it before doing calculations.
* `int()` removes the decimal part instead of rounding.
* Not every conversion is valid—converting non-numeric strings to numbers raises a `ValueError`.
* Mastering typecasting is essential because almost every Python program uses it when processing user input, performing calculations, reading files, or working with different kinds of data.
