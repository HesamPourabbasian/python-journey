# Python Loops — A Complete Guide

---

# Chapter 1: What Are Loops?

A **loop** is a programming structure that repeatedly executes a block of code.

Instead of writing the same code many times, you write it **once**, and the loop repeats it automatically.

Think of a loop as telling Python:

> "Keep doing this until I tell you to stop."

---

# Why Do We Need Loops?

Imagine printing numbers from 1 to 5.

Without a loop:

```python
print(1)
print(2)
print(3)
print(4)
print(5)
```

This works.

But what about printing **1 to 1,000**?

```python
print(1)
print(2)
print(3)
...
print(1000)
```

That would be impossible to write manually.

Instead:

```python
for number in range(1, 1001):
    print(number)
```

Only **2 lines of code**.

Loops save:

* Time
* Code
* Effort
* Errors

---

# Types of Loops in Python

Python has two main loop types.

| Loop    | Purpose                            |
| ------- | ---------------------------------- |
| `for`   | Repeat for each item in a sequence |
| `while` | Repeat while a condition is true   |

---

# Chapter 2: The `for` Loop

The `for` loop is the most commonly used loop in Python.

Syntax

```python
for variable in sequence:
    code
```

Python takes one item from the sequence at a time and assigns it to the variable.

---

Example

```python
fruits = ["Apple", "Banana", "Orange"]

for fruit in fruits:
    print(fruit)
```

Output

```text
Apple
Banana
Orange
```

Python does this internally:

Iteration 1

```text
fruit = "Apple"
```

Iteration 2

```text
fruit = "Banana"
```

Iteration 3

```text
fruit = "Orange"
```

---

# Iterating Over a String

Strings are sequences too.

```python
word = "Python"

for letter in word:
    print(letter)
```

Output

```text
P
y
t
h
o
n
```

Each character is visited one at a time.

---

# Iterating Over a Tuple

```python
numbers = (10, 20, 30)

for number in numbers:
    print(number)
```

Output

```text
10
20
30
```

---

# Iterating Over a Set

```python
colors = {"Red", "Blue", "Green"}

for color in colors:
    print(color)
```

The order may vary because sets are unordered.

---

# Chapter 3: The `range()` Function

Most `for` loops use `range()`.

`range()` generates a sequence of numbers.

---

## range(stop)

```python
for i in range(5):
    print(i)
```

Output

```text
0
1
2
3
4
```

Notice:

It starts at **0**.

The stop value is **not included**.

---

## range(start, stop)

```python
for i in range(1, 6):
    print(i)
```

Output

```text
1
2
3
4
5
```

---

## range(start, stop, step)

```python
for i in range(0, 11, 2):
    print(i)
```

Output

```text
0
2
4
6
8
10
```

Step determines how much the number increases each iteration.

---

Negative step

```python
for i in range(10, 0, -2):
    print(i)
```

Output

```text
10
8
6
4
2
```

---

# Chapter 4: Using `len()` with `range()`

Sometimes you need indexes.

```python
names = ["Alice", "Bob", "Charlie"]

for i in range(len(names)):
    print(i, names[i])
```

Output

```text
0 Alice
1 Bob
2 Charlie
```

---

# The `enumerate()` Function

A better way to get both indexes and values.

```python
names = ["Alice", "Bob", "Charlie"]

for index, name in enumerate(names):
    print(index, name)
```

Output

```text
0 Alice
1 Bob
2 Charlie
```

You can choose the starting index.

```python
for index, name in enumerate(names, start=1):
    print(index, name)
```

Output

```text
1 Alice
2 Bob
3 Charlie
```

---

# Chapter 5: The `while` Loop

A `while` loop continues running while a condition remains true.

Syntax

```python
while condition:
    code
```

Example

```python
count = 1

while count <= 5:
    print(count)
    count += 1
```

Output

```text
1
2
3
4
5
```

---

How it works

Iteration 1

```text
count = 1
```

Prints 1.

Then

```python
count += 1
```

becomes

```text
2
```

The condition is checked again.

This repeats until

```text
count = 6
```

Now

```python
count <= 5
```

is false.

The loop stops.

---

# Infinite Loops

Be careful.

```python
while True:
    print("Hello")
```

This never stops.

Another example

```python
count = 1

while count <= 5:
    print(count)
```

The value of `count` never changes.

The condition is always true.

The loop runs forever.

Correct

```python
count += 1
```

inside the loop.

---

# Chapter 6: Loop Control Statements

Python provides three important control statements.

| Statement  | Purpose                    |
| ---------- | -------------------------- |
| `break`    | Stop the loop completely   |
| `continue` | Skip the current iteration |
| `pass`     | Do nothing (placeholder)   |

---

# `break`

Stops the loop immediately.

```python
for i in range(10):

    if i == 5:
        break

    print(i)
```

Output

```text
0
1
2
3
4
```

The loop ends when `i` becomes 5.

---

# `continue`

Skips the current iteration.

```python
for i in range(6):

    if i == 3:
        continue

    print(i)
```

Output

```text
0
1
2
4
5
```

Only the value `3` is skipped.

---

# `pass`

Does nothing.

Useful when writing code that you'll complete later.

```python
for i in range(5):

    pass
```

The loop runs, but nothing happens.

---

# Chapter 7: Nested Loops

A loop inside another loop.

Example

```python
for i in range(3):

    for j in range(2):
        print(i, j)
```

Output

```text
0 0
0 1
1 0
1 1
2 0
2 1
```

The inner loop completes fully for each iteration of the outer loop.

---

# Multiplication Table

```python
for i in range(1, 4):

    for j in range(1, 4):

        print(i, "*", j, "=", i * j)
```

Output

```text
1 * 1 = 1
1 * 2 = 2
1 * 3 = 3
2 * 1 = 2
...
```

---

# Chapter 8: Looping Through Dictionaries

```python
student = {
    "name": "Alice",
    "age": 20,
    "major": "Computer Science"
}
```

Loop through keys

```python
for key in student:
    print(key)
```

Output

```text
name
age
major
```

---

Loop through values

```python
for value in student.values():
    print(value)
```

---

Loop through both

```python
for key, value in student.items():
    print(key, value)
```

Output

```text
name Alice
age 20
major Computer Science
```

---

# Chapter 9: The `else` Clause in Loops

Few beginners know this feature.

`else` runs only if the loop finishes normally (without a `break`).

Example

```python
for i in range(3):
    print(i)

else:
    print("Loop Finished")
```

Output

```text
0
1
2
Loop Finished
```

---

With `break`

```python
for i in range(5):

    if i == 2:
        break

else:
    print("Finished")
```

Nothing is printed from `else` because `break` interrupted the loop.

---

# Chapter 10: Common Loop Patterns

## Counting

```python
for i in range(1, 11):
    print(i)
```

---

## Summing Numbers

```python
total = 0

for i in range(1, 6):
    total += i

print(total)
```

Output

```text
15
```

---

## Finding the Largest Number

```python
numbers = [5, 8, 2, 15, 4]

largest = numbers[0]

for number in numbers:

    if number > largest:
        largest = number

print(largest)
```

Output

```text
15
```

---

## Counting Characters

```python
text = "Python"

count = 0

for letter in text:
    count += 1

print(count)
```

Output

```text
6
```

Normally you'd use `len(text)`, but this shows how loops work.

---

# Chapter 11: List Comprehensions

A concise way to create lists using loops.

Traditional

```python
squares = []

for i in range(5):
    squares.append(i ** 2)
```

List comprehension

```python
squares = [i ** 2 for i in range(5)]

print(squares)
```

Output

```text
[0, 1, 4, 9, 16]
```

With a condition

```python
evens = [i for i in range(10) if i % 2 == 0]

print(evens)
```

Output

```text
[0, 2, 4, 6, 8]
```

List comprehensions are powerful and commonly used in Python.

---

# Chapter 12: Common Beginner Mistakes

## Mistake 1: Forgetting to Update the Variable in a `while` Loop

Wrong

```python
count = 1

while count <= 5:
    print(count)
```

Result

Infinite loop.

Correct

```python
count += 1
```

inside the loop.

---

## Mistake 2: Incorrect Indentation

Wrong

```python
for i in range(5):
print(i)
```

Produces

```text
IndentationError
```

---

## Mistake 3: Off-by-One Errors

```python
range(5)
```

Produces

```text
0
1
2
3
4
```

Not

```text
5
```

Remember:

The stop value is **excluded**.

---

## Mistake 4: Modifying a List While Iterating Over It

Avoid this pattern:

```python
numbers = [1, 2, 3, 4]

for number in numbers:
    if number % 2 == 0:
        numbers.remove(number)
```

Modifying a collection while iterating over it can lead to unexpected behavior.

---

# Mini Project 1: Guessing Countdown

```python
for i in range(5, 0, -1):
    print(i)

print("Go!")
```

Output

```text
5
4
3
2
1
Go!
```

---

# Mini Project 2: Multiplication Table

```python
number = 7

for i in range(1, 11):
    print(f"{number} x {i} = {number * i}")
```

---

# Mini Project 3: Password Attempts

```python
correct_password = "python123"

attempts = 3

while attempts > 0:

    password = input("Password: ")

    if password == correct_password:
        print("Access Granted")
        break

    attempts -= 1

    print("Incorrect Password")

else:
    print("Account Locked")
```

---

# Key Takeaways

* A **loop** repeatedly executes a block of code.
* Python has two main loops: **`for`** and **`while`**.
* Use a **`for` loop** to iterate over sequences such as lists, tuples, strings, dictionaries, sets, or values generated by `range()`.
* Use a **`while` loop** when repetition depends on a condition remaining true.
* The `range()` function generates sequences of integers and is commonly used with `for` loops.
* Use `enumerate()` when you need both the index and the value while iterating.
* Loop control statements include:

  * `break` to exit the loop immediately.
  * `continue` to skip the current iteration.
  * `pass` as a placeholder that performs no action.
* Nested loops allow one loop to run inside another.
* Loops can have an optional **`else`** block that executes only if the loop finishes without encountering a `break`.
* List comprehensions provide a compact and Pythonic way to create lists from loops.

---

# Practice Exercises

1. Print the numbers from **1 to 100** using a `for` loop.
2. Print all even numbers between **1 and 50**.
3. Calculate the sum of the numbers from **1 to 100**.
4. Ask the user for a number and print its multiplication table from **1 to 10**.
5. Count how many vowels appear in a sentence entered by the user.
6. Find the largest and smallest numbers in a list without using `max()` or `min()`.
7. Write a `while` loop that repeatedly asks the user for a password until they enter the correct one.
8. Use nested loops to print the following pattern:

```text
*
**
***
****
*****
```

9. Create a program that asks the user for numbers until they enter `0`, then displays the total sum and the average of the entered numbers.
10. Using a list comprehension, create:

    * A list of squares from 1 to 20.
    * A list containing only the odd numbers from 1 to 50.
    * A list of the lengths of each word in `["Python", "Java", "C++", "Rust"]`.

---
