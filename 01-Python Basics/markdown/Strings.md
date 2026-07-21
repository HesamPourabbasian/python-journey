# Python Strings — A Complete Guide

---

# Chapter 1: What is a String?

A **string** is a sequence of characters used to represent text in Python.

A string can contain:

* Letters
* Numbers
* Spaces
* Symbols
* Emojis
* Almost any Unicode character

Examples:

```python
"Hello"
```

```python
"Python"
```

```python
"12345"
```

```python
"Hello, World!"
```

```python
"😊"
```

Everything inside the quotation marks becomes part of the string.

---

# Why Do We Need Strings?

Programs often need to work with text.

Examples include:

* User names
* Passwords
* Email addresses
* Messages
* File names
* Book titles
* Website URLs

Example:

```python
name = "Hesam"

print(name)
```

Output

```text
Hesam
```

---

# Creating Strings

Python allows three ways to create strings.

## Single Quotes

```python
name = 'Alice'
```

---

## Double Quotes

```python
name = "Alice"
```

Both are exactly the same.

---

## Which One Should You Use?

Use whichever makes your text easier to write.

For example:

```python
message = "I'm learning Python."
```

Output

```text
I'm learning Python.
```

If you used single quotes here:

```python
message = 'I'm learning Python.'
```

Python would think the string ends after `I`, causing a syntax error.

Alternatively, you could escape the apostrophe:

```python
message = 'I\'m learning Python.'
```

---

# Triple Quotes

Triple quotes allow multi-line strings.

```python
text = """
Python is fun.
It is powerful.
It is beginner friendly.
"""

print(text)
```

Output

```text
Python is fun.
It is powerful.
It is beginner friendly.
```

Triple quotes also preserve line breaks.

---

# Strings are Immutable

One of the most important concepts in Python.

**Strings cannot be changed after they are created.**

Example:

```python
word = "Python"
```

Trying this:

```python
word[0] = "J"
```

Produces:

```text
TypeError:
'str' object does not support item assignment
```

Instead, create a new string.

```python
word = "Jython"
```

---

# Chapter 2: String Indexing

Every character has a position called its **index**.

Example:

```text
Python
```

Positive indexes

```text
P  y  t  h  o  n
0  1  2  3  4  5
```

Negative indexes

```text
P  y  t  h  o  n
-6 -5 -4 -3 -2 -1
```

---

## Accessing Characters

Use square brackets.

```python
word = "Python"

print(word[0])
```

Output

```text
P
```

---

```python
print(word[3])
```

Output

```text
h
```

---

Negative indexing

```python
print(word[-1])
```

Output

```text
n
```

---

```python
print(word[-2])
```

Output

```text
o
```

---

# Index Out of Range

```python
word = "Python"

print(word[20])
```

Output

```text
IndexError
```

Always make sure the index exists.

---

# Chapter 3: String Slicing

Slicing extracts part of a string.

Syntax

```python
string[start:stop]
```

The `start` index is included.

The `stop` index is **not** included.

---

Example

```python
word = "Python"

print(word[0:2])
```

Output

```text
Py
```

---

```python
print(word[2:5])
```

Output

```text
tho
```

---

If you omit the start:

```python
print(word[:4])
```

Output

```text
Pyth
```

---

If you omit the stop:

```python
print(word[2:])
```

Output

```text
thon
```

---

Copy the whole string

```python
print(word[:])
```

Output

```text
Python
```

---

# Step Value

Syntax

```python
string[start:stop:step]
```

Example

```python
word = "Python"

print(word[::2])
```

Output

```text
Pto
```

Every second character is selected.

---

Reverse a string

```python
print(word[::-1])
```

Output

```text
nohtyP
```

---

# Chapter 4: String Concatenation

Concatenation means joining strings together.

Use the `+` operator.

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

Multiple strings

```python
a = "Python"
b = "is"
c = "awesome"

print(a + " " + b + " " + c)
```

Output

```text
Python is awesome
```

---

# String Repetition

Use the `*` operator.

```python
print("Hi! " * 3)
```

Output

```text
Hi! Hi! Hi!
```

---

# Chapter 5: Length of a String

Use `len()`.

```python
word = "Python"

print(len(word))
```

Output

```text
6
```

Spaces count too.

```python
print(len("Hello World"))
```

Output

```text
11
```

---

# Chapter 6: Common String Methods

Methods are built-in functions that belong to strings.

Syntax

```python
string.method()
```

---

## upper()

Converts to uppercase.

```python
name = "hesam"

print(name.upper())
```

Output

```text
HESAM
```

---

## lower()

```python
print("PYTHON".lower())
```

Output

```text
python
```

---

## title()

Capitalizes each word.

```python
print("learning python".title())
```

Output

```text
Learning Python
```

---

## capitalize()

Only the first letter becomes uppercase.

```python
print("python".capitalize())
```

Output

```text
Python
```

---

## strip()

Removes spaces from both ends.

```python
text = "   Python   "

print(text.strip())
```

Output

```text
Python
```

---

## lstrip()

Removes spaces from the left.

```python
print("   Python".lstrip())
```

---

## rstrip()

Removes spaces from the right.

```python
print("Python   ".rstrip())
```

---

## replace()

Replaces part of a string.

```python
text = "I like Java"

print(text.replace("Java", "Python"))
```

Output

```text
I like Python
```

---

## find()

Returns the index of the first occurrence.

```python
text = "Python"

print(text.find("t"))
```

Output

```text
2
```

If not found:

```python
print(text.find("z"))
```

Output

```text
-1
```

---

## count()

Counts occurrences.

```python
text = "banana"

print(text.count("a"))
```

Output

```text
3
```

---

## startswith()

```python
print("Python".startswith("Py"))
```

Output

```text
True
```

---

## endswith()

```python
print("Python".endswith("on"))
```

Output

```text
True
```

---

## split()

Splits a string into a list.

```python
sentence = "Python is fun"

print(sentence.split())
```

Output

```text
['Python', 'is', 'fun']
```

---

## join()

Joins multiple strings.

```python
words = ["Python", "is", "fun"]

print(" ".join(words))
```

Output

```text
Python is fun
```

---

# Chapter 7: Membership Operators

```python
text = "Python Programming"

print("Python" in text)
```

Output

```text
True
```

---

```python
print("Java" not in text)
```

Output

```text
True
```

---

# Chapter 8: Comparing Strings

Python compares strings alphabetically (lexicographically), based on Unicode values.

```python
print("apple" == "apple")
```

Output

```text
True
```

---

```python
print("apple" != "banana")
```

Output

```text
True
```

---

```python
print("apple" < "banana")
```

Output

```text
True
```

Because `"a"` comes before `"b"`.

---

# Chapter 9: String Formatting

## f-Strings (Recommended)

```python
name = "Hesam"
age = 21

print(f"My name is {name} and I am {age} years old.")
```

Output

```text
My name is Hesam and I am 21 years old.
```

---

## format()

```python
name = "Alice"

print("Hello, {}!".format(name))
```

Output

```text
Hello, Alice!
```

---

## Old `%` Formatting

```python
name = "Bob"

print("Hello %s" % name)
```

Still works, but f-strings are the preferred modern approach.

---

# Escape Characters

Escape characters begin with a backslash (`\`).

| Escape | Meaning      |
| ------ | ------------ |
| `\n`   | New line     |
| `\t`   | Tab          |
| `\\`   | Backslash    |
| `\"`   | Double quote |
| `\'`   | Single quote |

Example:

```python
print("Hello\nWorld")
```

Output

```text
Hello
World
```

---

```python
print("Name:\tHesam")
```

Output

```text
Name:	Hesam
```

---

# Raw Strings

Raw strings ignore escape characters.

```python
path = r"C:\Users\Hesam\Documents"

print(path)
```

Output

```text
C:\Users\Hesam\Documents
```

Very useful for Windows file paths and regular expressions.

---

# Chapter 10: Common Beginner Mistakes

## Mistake 1: Forgetting Strings are Immutable

Wrong

```python
word = "Python"

word[0] = "J"
```

Error:

```text
TypeError
```

Correct:

```python
word = "Jython"
```

---

## Mistake 2: Forgetting Quotes

Wrong

```python
name = Hesam
```

Python thinks `Hesam` is a variable.

Correct

```python
name = "Hesam"
```

---

## Mistake 3: Going Beyond the String Length

```python
word = "Python"

print(word[100])
```

Error

```text
IndexError
```

---

## Mistake 4: Using `+` with Different Types

Wrong

```python
age = 21

print("Age: " + age)
```

Error

```text
TypeError
```

Correct

```python
print("Age: " + str(age))
```

Or, even better:

```python
print(f"Age: {age}")
```

---

# Mini Project: User Profile

```python
first_name = "Hesam"
last_name = "Ahmadi"
country = "Iran"
major = "Computer Science"

full_name = first_name + " " + last_name

print(f"Name: {full_name}")
print(f"Country: {country}")
print(f"Major: {major}")
print(f"Uppercase Name: {full_name.upper()}")
print(f"Initials: {first_name[0]}{last_name[0]}")
```

Output

```text
Name: Hesam Ahmadi
Country: Iran
Major: Computer Science
Uppercase Name: HESAM AHMADI
Initials: HA
```

---

# Key Takeaways

* A **string** is a sequence of Unicode characters used to represent text.
* Strings can be created using **single quotes (`'`)**, **double quotes (`"`),** or **triple quotes (`'''` or `"""`)** for multi-line text.
* Strings are **immutable**, meaning individual characters cannot be changed after creation.
* Characters are accessed using **indexing**, and portions of strings are extracted using **slicing**.
* Use the `+` operator to **concatenate** strings and the `*` operator to **repeat** them.
* The `len()` function returns the number of characters in a string.
* String methods such as `upper()`, `lower()`, `strip()`, `replace()`, `split()`, and `join()` make text processing easy.
* **f-strings** are the recommended way to format strings in modern Python.
* Escape characters (like `\n` and `\t`) and raw strings (`r"..."`) help you work with special characters and file paths.
* Strings are one of the most frequently used data types in Python, making them essential for everything from user input to file handling and web development.

---
