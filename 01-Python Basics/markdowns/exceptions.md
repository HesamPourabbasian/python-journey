# Python Exceptions — Complete Guide

---

# 1. What are Exceptions?

An **exception** is an error that occurs **while a program is running** (runtime).

Normally, when Python encounters an error, it immediately stops the program and displays an error message called a **Traceback**.

Example:

```python
print(10 / 0)
```

Output:

```
ZeroDivisionError: division by zero
```

The program stops immediately.

---

Without exceptions:

```
Program
   │
   ▼
Error Occurs
   │
   ▼
Program Stops ❌
```

With exception handling:

```
Program
   │
   ▼
Error Occurs
   │
   ▼
Exception Handler
   │
   ▼
Program Continues ✅
```

---

# 2. Why Use Exception Handling?

Programs often deal with things that are outside your control:

* User input
* Files
* Internet connections
* Databases
* APIs
* Hardware

Users make mistakes.

Files may not exist.

Networks may fail.

Instead of crashing, your program should handle these situations.

Example:

```python
age = int(input("Enter your age: "))
```

If the user enters:

```
abc
```

Python crashes:

```
ValueError
```

Using exceptions prevents this crash.

---

# 3. Common Runtime Errors

## ZeroDivisionError

```python
10 / 0
```

Output

```
ZeroDivisionError
```

---

## ValueError

```python
int("hello")
```

Output

```
ValueError
```

---

## TypeError

```python
"5" + 5
```

Output

```
TypeError
```

---

## IndexError

```python
numbers = [1, 2, 3]

print(numbers[5])
```

Output

```
IndexError
```

---

## KeyError

```python
student = {
    "name": "John"
}

print(student["age"])
```

Output

```
KeyError
```

---

## FileNotFoundError

```python
open("abc.txt")
```

Output

```
FileNotFoundError
```

---

## NameError

```python
print(x)
```

Output

```
NameError
```

---

# 4. The try Block

The `try` block contains code that **might produce an exception**.

Syntax:

```python
try:
    risky_code
```

Example:

```python
try:
    print(10 / 0)
```

If an exception happens, Python immediately leaves the `try` block.

---

# 5. The except Block

The `except` block runs **only if an exception occurs**.

Syntax

```python
try:
    risky_code
except:
    handle_error
```

Example

```python
try:
    print(10 / 0)
except:
    print("Something went wrong.")
```

Output

```
Something went wrong.
```

The program continues instead of crashing.

---

# 6. Program Flow

Example

```python
print("Start")

try:
    print(10 / 0)
except:
    print("Error occurred")

print("End")
```

Output

```
Start
Error occurred
End
```

Notice the program did not stop.

---

# 7. Catching Specific Exceptions

Avoid using a plain `except` whenever possible.

Instead, catch the specific error.

Example

```python
try:
    number = int(input("Enter number: "))
except ValueError:
    print("Invalid number.")
```

Now only `ValueError` is handled.

---

Another example

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero.")
```

Output

```
Cannot divide by zero.
```

---

# 8. Multiple except Blocks

One `try` can have several `except` blocks.

Example

```python
try:
    number = int(input("Enter number: "))
    print(10 / number)

except ValueError:
    print("Please enter a valid number.")

except ZeroDivisionError:
    print("Cannot divide by zero.")
```

Possible outputs

Input:

```
abc
```

Output

```
Please enter a valid number.
```

Input:

```
0
```

Output

```
Cannot divide by zero.
```

Input:

```
5
```

Output

```
2.0
```

---

# 9. Catching Multiple Exceptions Together

Sometimes different exceptions require the same response.

Syntax

```python
except (Error1, Error2):
```

Example

```python
try:
    number = int(input("Enter number: "))
    print(10 / number)

except (ValueError, ZeroDivisionError):
    print("Invalid input.")
```

---

# 10. The Exception Object

Python can store the exception inside a variable.

Syntax

```python
except Exception as e:
```

Example

```python
try:
    print(10 / 0)

except Exception as e:
    print(e)
```

Output

```
division by zero
```

Another example

```python
try:
    int("hello")

except Exception as e:
    print(type(e))
    print(e)
```

Output

```
<class 'ValueError'>
invalid literal for int()
```

---

# 11. The else Block

The `else` block runs **only if no exception occurs**.

Syntax

```python
try:
    risky_code
except:
    handle_error
else:
    success_code
```

Example

```python
try:
    number = int(input("Enter number: "))

except ValueError:
    print("Invalid input.")

else:
    print("You entered:", number)
```

Input

```
25
```

Output

```
You entered: 25
```

---

If the user enters

```
abc
```

Output

```
Invalid input.
```

The `else` block is skipped.

---

# 12. The finally Block

The `finally` block **always executes**, whether an exception occurred or not.

Syntax

```python
try:
    risky_code
except:
    handle_error
finally:
    always_run
```

Example

```python
try:
    print(10 / 0)

except ZeroDivisionError:
    print("Division error.")

finally:
    print("Program finished.")
```

Output

```
Division error.
Program finished.
```

---

Even without an exception:

```python
try:
    print("Hello")

finally:
    print("Done")
```

Output

```
Hello
Done
```

---

# 13. Why finally is Useful

Imagine opening a file.

You must close it whether an error occurs or not.

```python
file = open("data.txt")

try:
    content = file.read()

finally:
    file.close()
```

The file always closes.

---

Another example:

```python
connection = connect_database()

try:
    # database work
    pass

finally:
    connection.close()
```

Resources are always cleaned up.

---

# 14. Complete Example

```python
try:
    number = int(input("Enter a number: "))
    result = 100 / number

except ValueError:
    print("Please enter a valid integer.")

except ZeroDivisionError:
    print("Number cannot be zero.")

else:
    print("Result:", result)

finally:
    print("Execution completed.")
```

Example 1

Input

```
5
```

Output

```
Result: 20.0
Execution completed.
```

---

Example 2

Input

```
0
```

Output

```
Number cannot be zero.
Execution completed.
```

---

Example 3

Input

```
abc
```

Output

```
Please enter a valid integer.
Execution completed.
```

---

# 15. Raising Exceptions Yourself

Sometimes you want to create an exception manually.

Use `raise`.

Example

```python
age = -5

if age < 0:
    raise ValueError("Age cannot be negative.")
```

Output

```
ValueError: Age cannot be negative.
```

---

Another example

```python
password = "123"

if len(password) < 8:
    raise Exception("Password is too short.")
```

---

# 16. Creating Custom Exceptions

You can create your own exception classes by inheriting from `Exception`.

Example

```python
class NegativeNumberError(Exception):
    pass
```

Using it

```python
number = -3

if number < 0:
    raise NegativeNumberError("Negative numbers are not allowed.")
```

Output

```
NegativeNumberError:
Negative numbers are not allowed.
```

---

# 17. Best Practices

✅ Catch specific exceptions.

```python
except ValueError:
```

Better than

```python
except:
```

---

✅ Keep `try` blocks small.

Good

```python
try:
    number = int(input())
```

Avoid

```python
try:
    # 50 lines of code
```

---

✅ Use `finally` for cleanup.

```python
file.close()
```

---

✅ Don't hide errors.

Avoid

```python
except:
    pass
```

This silently ignores problems.

---

✅ Provide helpful error messages.

Good

```python
except FileNotFoundError:
    print("The requested file does not exist.")
```

Instead of

```
Error
```

---

# 18. Summary Table

| Keyword     | Purpose                                       |
| ----------- | --------------------------------------------- |
| `try`       | Contains code that may raise an exception     |
| `except`    | Handles an exception if one occurs            |
| `else`      | Runs only if no exception occurs              |
| `finally`   | Always runs, regardless of success or failure |
| `raise`     | Manually raises an exception                  |
| `Exception` | Base class for most built-in exceptions       |

---

# 19. Mini Exercises

### Exercise 1

Ask the user for two numbers and divide them.

Handle:

* `ValueError`
* `ZeroDivisionError`

---

### Exercise 2

Ask the user for a filename.

Open it.

If the file doesn't exist, print a friendly message instead of crashing.

---

### Exercise 3

Ask the user for their age.

If the age is negative, raise a `ValueError`.

Otherwise print:

```
Welcome!
```

---

# 20. Key Takeaways

* Exceptions are **runtime errors** that occur while a program is executing.
* Without exception handling, most exceptions terminate the program.
* `try` contains code that might fail.
* `except` handles specific errors so the program can continue.
* `else` runs only when the `try` block succeeds without errors.
* `finally` always executes, making it ideal for cleanup tasks like closing files or database connections.
* Use `raise` to signal errors intentionally, and create custom exception classes when your application needs specialized error handling.
* Catch specific exceptions whenever possible and avoid suppressing errors with a bare `except` or `except: pass` unless you have a clear reason.
