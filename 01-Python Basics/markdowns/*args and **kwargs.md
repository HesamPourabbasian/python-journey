# `*args` and `**kwargs` in Python (Complete Guide)

`*args` and `**kwargs` allow a function to accept a variable number of arguments.

* `*args` → collects **extra positional arguments** into a tuple.
* `**kwargs` → collects **extra keyword arguments** into a dictionary.

Think of them like this:

```text
*args    → many values
**kwargs → many key=value pairs
```

---

# 1. What is `*args`?

Normally, a function expects a fixed number of arguments.

Example:

```python
def add(a, b):
    return a + b

print(add(5, 10))
```

Output

```
15
```

But what if you want to add **2 numbers**, **5 numbers**, or **100 numbers**?

That's where `*args` comes in.

---

# Basic Syntax

```python
def function_name(*args):
    pass
```

Notice the `*`.

Python packs all extra positional arguments into a tuple.

Example:

```python
def numbers(*args):
    print(args)

numbers(1, 2, 3, 4)
```

Output

```
(1, 2, 3, 4)
```

`args` is actually:

```python
args = (1, 2, 3, 4)
```

Its type:

```python
print(type(args))
```

Output

```
<class 'tuple'>
```

---

# Accessing Values

Since it's a tuple:

```python
def show(*args):
    print(args[0])
    print(args[1])

show("apple", "banana", "orange")
```

Output

```
apple
banana
```

---

# Loop Through `*args`

```python
def show(*args):
    for item in args:
        print(item)

show(10, 20, 30, 40)
```

Output

```
10
20
30
40
```

---

# Example: Sum Numbers

```python
def add(*numbers):
    total = 0

    for num in numbers:
        total += num

    return total

print(add(5, 10))
print(add(5, 10, 20))
print(add(1,2,3,4,5))
```

Output

```
15
35
15
```

Notice:

We didn't know how many numbers would be passed.

---

# You Don't Have to Call It `args`

These are identical:

```python
def hello(*args):
    pass
```

```python
def hello(*numbers):
    pass
```

```python
def hello(*students):
    pass
```

The `*` is what matters.

---

# 2. What is `**kwargs`?

`kwargs` stands for

> Keyword Arguments

It collects named arguments into a dictionary.

Example:

```python
def person(**kwargs):
    print(kwargs)

person(name="Hesam", age=22, country="Iran")
```

Output

```
{'name': 'Hesam', 'age': 22, 'country': 'Iran'}
```

Type:

```python
print(type(kwargs))
```

Output

```
<class 'dict'>
```

---

# Access Values

```python
def person(**kwargs):
    print(kwargs["name"])
    print(kwargs["age"])

person(name="Alice", age=25)
```

Output

```
Alice
25
```

---

# Loop Through `**kwargs`

```python
def person(**kwargs):
    for key, value in kwargs.items():
        print(key, value)

person(name="Bob", age=30, job="Developer")
```

Output

```
name Bob
age 30
job Developer
```

---

# Example

```python
def profile(**info):
    print(f"Name: {info['name']}")
    print(f"Age: {info['age']}")

profile(name="John", age=28)
```

Output

```
Name: John
Age: 28
```

---

# 3. Using Both Together

You can use both in one function.

```python
def example(*args, **kwargs):
    print(args)
    print(kwargs)

example(
    10,
    20,
    30,
    name="Alice",
    age=25
)
```

Output

```
(10, 20, 30)
{'name': 'Alice', 'age': 25}
```

---

# 4. Mixing Normal Parameters

You can combine normal parameters with `*args`.

```python
def greet(name, *messages):
    print(name)

    for msg in messages:
        print(msg)

greet(
    "Hesam",
    "Hello!",
    "How are you?",
    "Good luck!"
)
```

Output

```
Hesam
Hello!
How are you?
Good luck!
```

---

# Another Example

```python
def multiply(multiplier, *numbers):
    for n in numbers:
        print(multiplier * n)

multiply(10, 1, 2, 3, 4)
```

Output

```
10
20
30
40
```

---

# Mixing with `**kwargs`

```python
def student(name, **details):
    print(name)

    for key, value in details.items():
        print(key, value)

student(
    "Hesam",
    age=22,
    major="Computer Science"
)
```

Output

```
Hesam
age 22
major Computer Science
```

---

# 5. Parameter Order

When combining everything, the order matters:

```python
def function(
    normal,
    *args,
    **kwargs
):
    pass
```

Example:

```python
def demo(a, b, *args, **kwargs):
    print(a)
    print(b)
    print(args)
    print(kwargs)

demo(
    1,
    2,
    3,
    4,
    5,
    x=10,
    y=20
)
```

Output

```
1
2
(3, 4, 5)
{'x': 10, 'y': 20}
```

---

# 6. Unpacking with `*`

The `*` operator can unpack a sequence when calling a function.

Without unpacking:

```python
def add(a, b):
    print(a + b)

numbers = [5, 10]

add(numbers)
```

Error:

```
TypeError
```

With unpacking:

```python
numbers = [5, 10]

add(*numbers)
```

Output

```
15
```

Python does this:

```python
add(5, 10)
```

Works with tuples too:

```python
nums = (3, 7)

add(*nums)
```

Output

```
10
```

---

# 7. Unpacking Dictionaries with `**`

```python
def person(name, age):
    print(name)
    print(age)

data = {
    "name": "Alice",
    "age": 25
}

person(**data)
```

Output

```
Alice
25
```

Python does:

```python
person(name="Alice", age=25)
```

---

# 8. Real-World Example

Imagine you're writing a shopping cart.

```python
def checkout(customer, *items, **details):
    print(f"Customer: {customer}")

    print("\nItems:")
    for item in items:
        print("-", item)

    print("\nDetails:")
    for key, value in details.items():
        print(f"{key}: {value}")

checkout(
    "Hesam",
    "Keyboard",
    "Mouse",
    "Monitor",
    payment="Visa",
    delivery="Express"
)
```

Output

```
Customer: Hesam

Items:
- Keyboard
- Mouse
- Monitor

Details:
payment: Visa
delivery: Express
```

---

# 9. Common Mistakes

### ❌ Forgetting the `*`

```python
def test(args):
    print(args)

test(1,2,3)
```

Error:

```
TypeError
```

Because `args` is just one normal parameter.

Correct:

```python
def test(*args):
    print(args)
```

---

### ❌ Passing positional arguments after keyword arguments

```python
demo(name="John", 25)
```

Error:

```
SyntaxError
```

Correct:

```python
demo("John", age=25)
```

---

### ❌ Accessing a missing key

```python
def person(**kwargs):
    print(kwargs["age"])

person(name="Alice")
```

Error:

```
KeyError
```

Safer:

```python
def person(**kwargs):
    print(kwargs.get("age"))
```

Output

```
None
```

Or provide a default:

```python
print(kwargs.get("age", "Unknown"))
```

---

# Cheat Sheet

| Syntax     | Meaning                                          | Stored As | Example Call               |
| ---------- | ------------------------------------------------ | --------- | -------------------------- |
| `*args`    | Variable positional arguments                    | `tuple`   | `func(1, 2, 3)`            |
| `**kwargs` | Variable keyword arguments                       | `dict`    | `func(name="Ali", age=22)` |
| `*list`    | Unpack a list or tuple into positional arguments | N/A       | `func(*[1, 2])`            |
| `**dict`   | Unpack a dictionary into keyword arguments       | N/A       | `func(**{"name": "Ali"})`  |

---

# When should you use them?

Use `*args` when:

* The number of positional arguments is unknown.
* You're writing flexible utility functions.
* You want to forward positional arguments to another function.

Use `**kwargs` when:

* You want optional named settings or configuration.
* You're building reusable APIs or libraries.
* You want to forward keyword arguments to another function.

---

# Practice Exercises

1. Write a function `average(*numbers)` that returns the average of any number of numeric arguments.

2. Write a function `largest(*numbers)` that returns the largest number passed in.

3. Write a function `student(**info)` that prints each key and value on a separate line.

4. Write a function `invoice(customer, *items, **details)` that prints the customer name, all purchased items, and any extra details such as `payment`, `discount`, or `delivery`.

5. Given:

   ```python
   values = [10, 20]
   options = {"sep": " - ", "end": "!\n"}
   ```

   Call `print()` using `*` and `**` so the output is:

   ```
   10 - 20!
   ```

If you understand these exercises, you've mastered the core concepts of `*args` and `**kwargs`.
