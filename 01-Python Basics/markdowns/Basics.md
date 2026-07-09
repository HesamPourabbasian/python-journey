### 1. Setting Up Your Python Environment

#### Option A: Local Setup (Recommended for Long-term Learning)

**Step 1: Install Python**
- Go to the official website: [python.org/downloads](https://www.python.org/downloads/)
- Download the latest version (currently Python 3.12 or 3.13).
- **Important**: During installation on Windows, check the box **"Add python.exe to PATH"**.
- On macOS/Linux, it's usually already installed or installable via package manager.

**Verify Installation**
Open your terminal (Command Prompt on Windows, Terminal on macOS/Linux) and run:

```bash
python --version
# or
python3 --version
```

You should see something like `Python 3.12.x`.

**Step 2: Install a Code Editor**
Best choices for beginners:
- **VS Code** (free, most popular) → [code.visualstudio.com](https://code.visualstudio.com)
- Install the **Python extension** by Microsoft inside VS Code.

Alternative: PyCharm Community Edition (great for learning).

**Step 3: Create a Project Folder**
```bash
mkdir my-python-learning
cd my-python-learning
```

**Step 4: Use Virtual Environments (Best Practice)**
This keeps project dependencies isolated.

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

You’ll see `(venv)` in your terminal prompt.

**Step 5: Install Packages with pip**
```bash
pip install numpy pandas requests  # example packages
```

---

#### Option B: Quick Start (No Installation Needed)
- **Google Colab**: colab.research.google.com (cloud Jupyter notebooks)
- **Replit.com** or **GitHub Codespaces**

These are perfect for experimenting instantly.

---

### 2. Python Basics – Let's Start Coding!

Create a file called `hello.py` and run it.

#### Your First Program

```python
# hello.py
print("Hello, World! Welcome to Python!")
```

Run it:
```bash
python hello.py
```

---

#### 2.1 Variables and Data Types

```python
# Variables (no need to declare type)
name = "Alice"          # string
age = 25                # integer
height = 1.75           # float
is_student = True       # boolean

print(name, age, height, is_student)

# Type checking
print(type(name))       # <class 'str'>
print(type(age))        # <class 'int'>
```

**Dynamic Typing**: You can change variable type later.

```python
x = 10
x = "now I'm a string"
print(x)
```

---

#### 2.2 Basic Operations

```python
# Arithmetic
a = 10
b = 3
print(a + b)   # 13
print(a - b)   # 7
print(a * b)   # 30
print(a / b)   # 3.333...
print(a // b)  # 3 (floor division)
print(a % b)   # 1 (remainder)
print(a ** b)  # 1000 (exponent)
```

**String Operations**
```python
first = "Hello"
second = "Python"
print(first + " " + second)        # concatenation
print(f"Hello {name}! You are {age} years old.")  # f-string (best way)
```

---

#### 2.3 Input and Output

```python
name = input("What is your name? ")
age = int(input("How old are you? "))  # convert to integer

print(f"Nice to meet you, {name}!")
```

---

#### 2.4 Control Flow (if, elif, else)

```python
score = int(input("Enter your score: "))

if score >= 90:
    print("Excellent!")
elif score >= 70:
    print("Good job!")
elif score >= 50:
    print("You passed.")
else:
    print("Need to improve.")
```

---

#### 2.5 Loops

**For Loop**
```python
for i in range(5):           # 0 to 4
    print(i)

for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
```

**While Loop**
```python
count = 0
while count < 5:
    print(count)
    count += 1
```

---

#### 2.6 Lists (Most Important Data Structure)

```python
fruits = ["apple", "banana", "cherry", "mango"]

print(fruits[0])        # apple (0-based indexing)
print(fruits[-1])       # mango (last item)

fruits.append("orange")
fruits.remove("banana")
print(len(fruits))

# Slicing
print(fruits[1:3])      # from index 1 to 3 (not including 3)
```

---

#### 2.7 Dictionaries (Key-Value Pairs)

```python
person = {
    "name": "Bob",
    "age": 30,
    "city": "New York"
}

print(person["name"])
person["age"] = 31          # update
person["job"] = "Engineer"  # add new key

for key, value in person.items():
    print(key, ":", value)
```

---

#### 2.8 Functions

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))
print(greet("Bob", "Hi there"))
```

**Default parameters**, `return` values, etc.

---
