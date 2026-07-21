# Python Variables — A Complete Guide

---

# Chapter 1: What is a Variable?

A **variable** is a name that stores a value in your program.

Think of a variable as a **labeled box**.

* The **label** is the variable's name.
* The **content inside the box** is the value.

For example:

```python
name = "Hesam"
```

Here,

```
+------------+
|   name     | -----> "Hesam"
+------------+
```

* `name` is the variable.
* `"Hesam"` is the value.

Instead of remembering `"Hesam"` everywhere in your code, you simply use `name`.

---

# Why Do We Need Variables?

Imagine writing a program without variables.

```python
print("Hesam")
print("Hesam")
print("Hesam")
print("Hesam")
```

Now suppose the person's name changes to `"Ali"`.

You would have to change every single occurrence.

Instead:

```python
name = "Hesam"

print(name)
print(name)
print(name)
print(name)
```

Now changing one line changes everything.

```python
name = "Ali"
```

Output

```
Ali
Ali
Ali
Ali
```

Variables make programs:

* Easier to read
* Easier to update
* Easier to understand
* Easier to maintain

---

# Variables Store Information

Variables can store almost anything.

Examples:

```python
age = 21

height = 188

weight = 110

city = "Tabriz"

is_student = True
```

Each variable stores a different type of information.

---

# Creating Variables

Python makes variable creation extremely easy.

Simply write:

```python
variable_name = value
```

Example:

```python
name = "John"
```

Python automatically creates the variable.

Unlike languages like Java or C++, you don't need to specify its type.

---

# Assignment Operator (=)

The equal sign (`=`) is called the **assignment operator**.

It does **NOT** mean "equals" like in mathematics.

It means:

> Put the value on the right into the variable on the left.

Example:

```python
score = 95
```

Read it as:

> Assign 95 to score.

NOT

> score equals 95

---

Example:

```python
x = 10
```

Memory

```
x -----> 10
```

---

# Accessing Variables

Once a variable exists, you can use it anywhere.

```python
name = "Alice"

print(name)
```

Output

```
Alice
```

---

Example

```python
age = 25

print(age)
```

Output

```
25
```

---

# Changing Variables

Variables can change.

Example

```python
score = 50

print(score)

score = 90

print(score)
```

Output

```
50
90
```

The old value is replaced by the new one.

---

Visual representation

Initially

```
score -----> 50
```

Later

```
score -----> 90
```

---

# Variables are Containers

Imagine boxes.

```
+----------+
|  age     |
+----------+
|   21     |
+----------+
```

Another box

```
+------------+
|  country   |
+------------+
|   Iran     |
+------------+
```

The labels help us know what each box contains.

---

# Descriptive Names

Good variable names explain what they store.

Good

```python
student_name = "John"

student_age = 20

student_score = 95
```

Bad

```python
x = "John"

a = 20

zzz = 95
```

Six months later:

```
student_score
```

is much easier to understand than

```
zzz
```

---

# Variable Naming Rules

Python has rules.

### Rule 1

Must start with:

* a letter
* underscore (_)

Correct

```python
age = 20

_name = "Ali"
```

Wrong

```python
2age = 20
```

---

### Rule 2

Cannot contain spaces.

Wrong

```python
student age = 20
```

Correct

```python
student_age = 20
```

---

### Rule 3

Can contain numbers.

Correct

```python
student1 = "Ali"

score2025 = 95
```

---

### Rule 4

Cannot use special characters.

Wrong

```python
name!
```

Wrong

```python
age@
```

Wrong

```python
my-score
```

Correct

```python
my_score
```

---

### Rule 5

Cannot use Python keywords.

Wrong

```python
class = 5
```

Wrong

```python
for = 10
```

Wrong

```python
if = 20
```

---

# Python Style Guide (PEP 8)

Python programmers use **snake_case**.

Example

```python
student_name

first_name

last_name

phone_number
```

Not

```python
StudentName

studentName

student-name
```

---

# Case Sensitivity

Python is case-sensitive.

These are all different variables.

```python
age = 20

Age = 30

AGE = 40
```

Output

```python
print(age)
print(Age)
print(AGE)
```

Result

```
20
30
40
```

---

# Multiple Variables

You can create many variables.

```python
name = "Sara"

age = 22

country = "Canada"
```

---

# Multiple Assignment

Python allows assigning multiple variables at once.

```python
x, y, z = 1, 2, 3
```

Output

```python
print(x)
print(y)
print(z)
```

```
1
2
3
```

---

# Assign Same Value

```python
a = b = c = 100
```

Output

```
100
100
100
```

---

# Using Variables Together

Variables become useful when combined.

```python
first_name = "John"

last_name = "Smith"

print(first_name, last_name)
```

Output

```
John Smith
```

---

Another example

```python
price = 25

quantity = 4

total = price * quantity

print(total)
```

Output

```
100
```

---

# Updating Variables

```python
counter = 1

counter = counter + 1

print(counter)
```

Output

```
2
```

Shorter version

```python
counter += 1
```

---

# Swapping Variables

Python makes swapping easy.

```python
a = 5
b = 10

a, b = b, a

print(a)
print(b)
```

Output

```
10
5
```

---

# Checking Variable Type

Use `type()`.

```python
name = "John"

print(type(name))
```

Output

```
<class 'str'>
```

---

Examples

```python
age = 20
```

```
<class 'int'>
```

```python
height = 1.82
```

```
<class 'float'>
```

```python
is_student = True
```

```
<class 'bool'>
```

---

# Memory Concept

When you write

```python
age = 21
```

Python roughly does this:

```
Memory

Address A
↓

21
```

The variable

```
age
```

points to that memory location.

```
age
 │
 ▼
21
```

Variables don't physically *contain* the value; they **refer to** an object in memory. For beginners, it's perfectly fine to think of them as labeled containers.

---

# Common Beginner Mistakes

### Mistake 1

Using a variable before creating it.

```python
print(age)
```

Error

```
NameError
```

Correct

```python
age = 20

print(age)
```

---

### Mistake 2

Misspelling variable names.

```python
student_name = "Ali"

print(studentname)
```

Error

```
NameError
```

---

### Mistake 3

Forgetting Python is case-sensitive.

```python
Age = 20

print(age)
```

Error

```
NameError
```

---

# Real-Life Example

```python
student_name = "Hesam"

age = 21

major = "Computer Science"

gpa = 3.8

print(student_name)
print(age)
print(major)
print(gpa)
```

Output

```
Hesam
21
Computer Science
3.8
```

---

# Mini Project: Student Profile

```python
name = "Hesam"
age = 21
height = 188
weight = 110
country = "Iran"
major = "Computer Science"

print("Name:", name)
print("Age:", age)
print("Height:", height)
print("Weight:", weight)
print("Country:", country)
print("Major:", major)
```

Output

```
Name: Hesam
Age: 21
Height: 188
Weight: 110
Country: Iran
Major: Computer Science
```

---

# Key Takeaways

* A **variable** is a named reference to a value.
* Use `=` to assign a value to a variable.
* Variables make code readable, reusable, and easy to update.
* Python creates variables automatically when you assign them.
* Choose descriptive names like `student_name` instead of `x`.
* Variable names are case-sensitive.
* Use `type()` to check the data type stored in a variable.
* Variables can be updated, reused, and combined to build more complex programs.

---
