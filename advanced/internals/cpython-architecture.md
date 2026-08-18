# CPython Execution Pipeline & Architecture in Python

## Introduction

To the novice programmer, Python appears to be a simple "interpreted" scripting language: you write text in a `.py` file, execute `python app.py`, and the output appears immediately.

However, behind this simple user experience lies one of the most sophisticated, highly optimized runtime systems in computer science: **CPython** (the reference implementation of Python written in C).

Python is **not** a raw plaintext interpreter that evaluates string tokens line-by-line during execution. Nor is it a static compiler (like C or Rust) that generates native machine assembly code directly.

Instead, CPython is a **Bytecode-Compiled Virtual Machine System**:
1. It takes your UTF-8 source code and compiles it through a **5-Stage Compilation Pipeline** into an intermediate representation called **Python Bytecode**.
2. It packages the bytecode instructions and constants into an immutable **`PyCodeObject`**.
3. It evaluates the code object inside a stack-based virtual machine evaluation loop (**`_PyEval_EvalFrameDefault`** in `Python/ceval.c`).

Understanding CPython's internal pipeline, the fundamental **`PyObject`** C-structure, stack frame allocation, and symbol table resolution is the foundation for mastering Python systems engineering, writing high-speed code, and understanding low-level debugging.

---

## Prerequisites

Before studying CPython internals, ensure you have:

- Completed all of [Level 1 (Beginner)](../../beginner/README.md) and [Level 2 (Intermediate)](../../intermediate/README.md).
- Solid understanding of computer memory (heap vs stack, pointers, memory addresses).
- Basic familiarity with C-style data structures (`struct`, pointer referencing).

---

## Core Concept: The 5-Stage CPython Execution Pipeline

```
                            THE 5-STAGE CPYTHON EXECUTION PIPELINE

      Source Code (.py)
             │
             ▼  [Stage 1: Tokenizer / Lexical Analysis] (Python/lexer/lexer.c)
        Token Stream (NAME, OP, NUMBER, INDENT, NEWLINE)
             │
             ▼  [Stage 2: PEG Parser / Syntactic Analysis] (Parser/peg_api.c)
     Abstract Syntax Tree (AST Nodes: ast.Module, ast.FunctionDef, ast.BinOp)
             │
             ▼  [Stage 3: Symbol Table Resolution] (Python/symtable.c)
       Symbol Tables (Local, Global, Cell, Free Variables resolved)
             │
             ▼  [Stage 4: Bytecode Compiler & Assembler] (Python/compile.c)
       PyCodeObject (Marshaled into .pyc files: co_code, co_consts, co_varnames)
             │
             ▼  [Stage 5: Virtual Machine Execution Loop] (Python/ceval.c)
     _PyEval_EvalFrameDefault (Stack evaluation machine -> Native OS / Hardware Execution)
```

---

## Syntax & Essential Introspection Patterns

```python
import ast
import symtable
import tokenize
import io
import sys
import ctypes

# 1. Inspecting Token Streams (Stage 1)
code_sample = "total = 10 + 20"
tokens = tokenize.tokenize(io.BytesIO(code_sample.encode("utf-8")).readline)
print("--- STAGE 1: TOKENS ---")
for tok in tokens:
    if tok.type not in (tokenize.ENCODING, tokenize.ENDMARKER):
        print(f"  {tokenize.tok_name[tok.type]:<12} : {tok.string}")

# 2. Inspecting Abstract Syntax Tree (Stage 2)
tree = ast.parse(code_sample)
print("\n--- STAGE 2: ABSTRACT SYNTAX TREE (AST) ---")
print(ast.dump(tree, indent=2))

# 3. Inspecting Symbol Table (Stage 3)
st = symtable.symtable("def calc(x): y = x * 2; return y", filename="<demo>", compile_type="exec")
calc_symbol_table = st.get_children()[0]
print("\n--- STAGE 3: SYMBOL TABLE LOCALS ---")
print("Local Variables in 'calc':", calc_symbol_table.get_locals()) # ['x', 'y']

# 4. Inspecting PyCodeObject (Stage 4)
def multiply(a: int, b: int) -> int:
    return a * b

code_obj = multiply.__code__
print("\n--- STAGE 4: PyCodeObject ATTRIBUTES ---")
print(f"  co_name      : {code_obj.co_name}")
print(f"  co_argcount  : {code_obj.co_argcount}")
print(f"  co_varnames  : {code_obj.co_varnames}")
print(f"  co_consts    : {code_obj.co_consts}")
print(f"  co_stacksize : {code_obj.co_stacksize}")
```

---

## Detailed Explanation

### 1. The Fundamental `PyObject` C-Structure

In CPython, **every single entity in Python is a heap-allocated C struct**.

At the base of every Python object lies the **`PyObject`** header defined in `Include/object.h`:

```c
/* CPython C-Definition of PyObject */
struct _object {
    _PyObject_HEAD_EXTRA // Doubly-linked list pointers for tracing (debug builds)
    Py_ssize_t ob_refcnt; // Reference count (64-bit integer)
    struct _typeobject *ob_type; // Pointer to the type descriptor object (e.g. &PyLong_Type)
};
typedef struct _object PyObject;
```

#### Why Python Variables Are Pointers:
When you write `x = 1000` in Python:
1. CPython allocates a `PyLongObject` struct on the C heap (28+ bytes on a 64-bit machine).
2. It sets `ob_refcnt = 1`.
3. It sets `ob_type = &PyLong_Type`.
4. It sets the numerical value digits.
5. In Python, the variable name `x` is simply an 8-byte C pointer pointing to the memory address of that `PyLongObject` struct!

For variable-length objects (like `list`, `str`, `tuple`, `dict`), CPython uses **`PyVarObject`**, which adds an `ob_size` field:

```c
struct _varobject {
    PyObject ob_base;
    Py_ssize_t ob_size; // Number of items in sequence
};
typedef struct _varobject PyVarObject;
```

---

### 2. Stage 1 & 2: The PEG Parser & AST

Historically (before Python 3.9), Python used an LL(1) parser that struggled with complex expressions without verbose workarounds.

In Python 3.9+, CPython adopted a **Parsing Expression Grammar (PEG) Parser** (`Parser/peg_api.c`):
- The **Tokenizer** scans the UTF-8 source stream, emitting tokens (`NAME`, `NUMBER`, `STRING`, `INDENT`, `DEDENT`, `NEWLINE`).
- The **PEG Parser** parses tokens with infinite lookahead, constructing an **Abstract Syntax Tree (AST)** directly without intermediate parse trees.

---

### 3. Stage 3: The Symbol Table & Scope Resolution

Before generating bytecode, CPython creates a **Symbol Table** (`Python/symtable.c`). It traverses the AST to determine the exact scope of every identifier:
- **Local (`LOAD_FAST`)**: Stored in a fixed-size C array within the stack frame ($O(1)$ pointer offset).
- **Global / Built-in (`LOAD_GLOBAL`)**: Looked up in module dictionary / builtins dictionary ($O(1)$ hash lookup).
- **Free / Cell Variables (`LOAD_DEREF`)**: Variables enclosed in closures, stored in heap-allocated `PyCellObject` structs.

This static pass is why Python knows at compile time whether a variable is local or global, raising `UnboundLocalError` if you mutate a global variable without the `global` keyword.

---

### 4. Stage 4 & 5: Code Objects and the CEval Virtual Machine Loop

The compiler converts the AST into an immutable **`PyCodeObject`** containing:
- `co_code`: Raw binary bytecode instructions.
- `co_consts`: Tuple of literal constants (numbers, strings, `None`).
- `co_varnames`: Tuple of local variable names.
- `co_names`: Tuple of global/attribute names.
- `co_stacksize`: Pre-calculated maximum depth of the execution value stack.

#### The CEval Execution Loop:
When a function is called, CPython allocates a **`PyFrameObject`** and invokes **`_PyEval_EvalFrameDefault()`** in `Python/ceval.c`:
- It runs a massive C `switch` statement (or computed gotos).
- It reads opcodes one by one from `co_code`, pushing and popping operands on the thread's value stack.
- It executes the opcodes using CPU registers and C function calls.

---

## Examples

### 1. Simple: Tokenizing Source Code with the `tokenize` Module
Inspecting how CPython lexical analysis slices source text into semantic tokens.

```python
import tokenize
import io

source_code = """
def compute_bonus(salary: float) -> float:
    return salary * 0.15
"""

token_stream = tokenize.tokenize(io.BytesIO(source_code.strip().encode("utf-8")).readline)

print("Lexical Token Analysis:")
print(f"{'LINE:COL':<12} {'TOKEN TYPE':<18} {'STRING VALUE'}")
print("-" * 55)
for tok in token_stream:
    if tok.type not in (tokenize.ENCODING, tokenize.ENDMARKER):
        pos = f"{tok.start[0]}:{tok.start[1]}"
        print(f"{pos:<12} {tokenize.tok_name[tok.type]:<18} {repr(tok.string)}")
```

### 2. Beginner: Inspecting Abstract Syntax Trees with `ast.NodeVisitor`
Writing an AST visitor that inspects and reports all function definitions in a source file.

```python
import ast

class FunctionAnalyzer(ast.NodeVisitor):
    def visit_FunctionDef(self, node: ast.FunctionDef):
        arg_names = [a.arg for a in node.args.args]
        has_docstring = ast.get_docstring(node) is not None
        print(f"🔍 Found Function: '{node.name}' (Line {node.lineno})")
        print(f"   • Arguments   : {arg_names}")
        print(f"   • Has Docstring: {has_docstring}")
        self.generic_visit(node)

sample_script = """
def authenticate_user(username, password):
    '''Authenticates user credentials.'''
    return True

def delete_account(user_id):
    pass
"""

tree = ast.parse(sample_script)
analyzer = FunctionAnalyzer()
analyzer.visit(tree)
```

### 3. Intermediate: Scrutinizing Symbol Tables for Scope Resolution
Using the `symtable` module to analyze local, global, and cell variable classifications.

```python
import symtable

code_block = """
global_multiplier = 1.25

def make_multiplier(factor):
    base_offset = 10
    def inner_calc(val):
        return (val * factor) + base_offset + global_multiplier
    return inner_calc
"""

st = symtable.symtable(code_block, filename="<string>", compile_type="exec")
outer_func_st = st.get_children()[0] # make_multiplier
inner_func_st = outer_func_st.get_children()[0] # inner_calc

print("Symbol Table Analysis:")
print("• make_multiplier Locals       :", outer_func_st.get_locals()) # ['factor', 'base_offset', 'inner_calc']
print("• make_multiplier Cells (Enclosed):", outer_func_st.get_symbols()) 
print("• inner_calc Free Variables   :", inner_func_st.get_frees())   # ('base_offset', 'factor')
print("• inner_calc Global Variables :", inner_func_st.get_globals()) # ('global_multiplier',)
```

### 4. Real-World: Low-Level Introspection of `PyCodeObject` Attributes
Examining the compiled bytecode attributes of a production function.

```python
def process_transaction(account_id: str, amount: float, tax_rate: float = 0.05) -> float:
    fee = 1.50
    total = (amount * (1.0 + tax_rate)) + fee
    return total

code = process_transaction.__code__

print("=" * 60)
print(f"PyCodeObject Details for: {code.co_name}()")
print("=" * 60)
print(f"  • Source File         : {code.co_filename}")
print(f"  • First Line Number   : {code.co_firstlineno}")
print(f"  • Argument Count      : {code.co_argcount} (Positional/Keyword)")
print(f"  • Local Variables     : {code.co_varnames}")
print(f"  • Constants (co_consts): {code.co_consts}")
print(f"  • Stack Size Needed   : {code.co_stacksize} values on value stack")
print(f"  • Raw Bytecode Length : {len(code.co_code)} bytes")
```

### 5. Advanced: Low-Level `PyObject` Memory Introspection with `ctypes`
Reading the raw C-level `ob_refcnt` and `ob_type` struct headers directly from memory addresses using `ctypes`.

```python
import ctypes
import sys

# Define CPyObject structure in Python ctypes
class CPyObject(ctypes.Structure):
    pass

CPyObject._fields_ = [
    ("ob_refcnt", ctypes.c_ssize_t),
    ("ob_type", ctypes.c_void_p),
]

target_number = 999_888_777 # Distinct integer object
target_address = id(target_number) # Memory address is pointer address!

# Cast memory address to C struct pointer
c_pyobj = CPyObject.from_address(target_address)

print("=" * 60)
print("RAW C-LEVEL PyObject STRUCT INTROSPECTION:")
print("=" * 60)
print(f"  Object Value         : {target_number}")
print(f"  Memory Address (Hex) : {hex(target_address)}")
print(f"  C ob_refcnt (Raw)    : {c_pyobj.ob_refcnt}")
print(f"  sys.getrefcount()    : {sys.getrefcount(target_number)} (Includes temp ref)")
print(f"  C ob_type Pointer    : {hex(c_pyobj.ob_type)}")
print(f"  id(int Type Object)  : {hex(id(int))}")
assert c_pyobj.ob_type == id(int), "ob_type pointer MUST match the id of the type object!"
print("  ✅ Pointer verification successful: ob_type points directly to PyLong_Type!")
```

---

## Code Explanation

In Example 5 (`ctypes PyObject Introspection`):
1. In CPython, `id(obj)` returns the **exact 64-bit virtual memory address of the C `PyObject` struct** in RAM.
2. We defined `class CPyObject(ctypes.Structure)` with the exact memory layout of the `PyObject` header (`ob_refcnt` at offset 0, `ob_type` pointer at offset 8).
3. `CPyObject.from_address(target_address)` casts the raw memory address to a C struct, reading the reference count and type pointer directly from CPU memory.
4. Comparing `c_pyobj.ob_type` to `id(int)` proves that every integer object holds a physical C pointer directly pointing to the singleton `PyLong_Type` type descriptor in the CPython data segment.

---

## Common Mistakes

### Mistake 1: Assuming Python is Purely Interpreted from Source
Believing Python parses strings line-by-line during runtime: Python compiles all source code into bytecode objects before the first line executes. Dynamic calls like `eval()` and `exec()` force recompilation at runtime, which is why they are slow and insecure.

### Mistake 2: Confusing Python Variables with Value Storage
In languages like C, `int x = 10` allocates 4 bytes on the stack holding the binary number `10`. In Python, `x = 10` creates an 8-byte pointer on the stack pointing to a 28-byte `PyLongObject` struct on the heap.

---

## Best Practices

### Use `ast` for Static Analysis, Not Dynamic Inspection
When building code linters, security checkers, or refactoring tools, parse source code using `ast.parse()` rather than importing modules dynamically. Importing modules executes top-level code, which can trigger dangerous side effects.

Good:
```python
import ast
tree = ast.parse(untrusted_code_string) # 100% Safe! Does not execute code!
```

---

## Performance Considerations

| Component | Operation | Time Cost | Notes |
|---|---|---|---|
| **Tokenizer & PEG Parser**| UTF-8 $\rightarrow$ AST | ~10–50 ms / MB | Executed once during `.pyc` compilation |
| **Compiler** | AST $\rightarrow$ Bytecode | ~5–20 ms / MB | Marshaled into `__pycache__/*.pyc` |
| **`.pyc` Bytecode Loading**| Binary unmarshalling | **< 1 ms** | Bypasses parsing stages completely! |
| **`_PyEval_EvalFrameDefault`**| Bytecode execution loop| High-speed C switch| CPython 3.11+ Specialized Adaptive |

---

## Security Considerations

1. **Never Execute Untrusted AST with `eval()` / `exec()`**: Compiling and evaluating untrusted code strings allows attackers to escape sandboxes via built-in introspection (`__builtins__.__import__('os').system(...)`).
2. **Safe Expression Evaluation**: Use `ast.literal_eval()` when parsing strings representing basic Python literals (lists, dicts, numbers) to guarantee no arbitrary code execution.

---

## Real-World Usage

- **Code Formatters (Black / Ruff)**: Parsing AST and CST nodes to format Python code deterministically.
- **Static Analysis Tools (Flake8 / Mypy)**: Traversing AST trees to detect unused imports and syntax errors.
- **Python Security Scanners (Bandit)**: Inspecting AST nodes for insecure function calls (`eval`, `pickle.loads`, hardcoded passwords).

---

## Comparison: Python Runtime Implementations

| Implementation | Written In | JIT Compiler? | GIL? | Primary Advantage |
|---|---|---|---|---|
| **CPython** | **C** | ❌ (Specializing in 3.11+) | **Yes (Free in 3.13)**| **Reference standard, 100% C-Extension support**|
| **PyPy** | RPython | **✅ Trace-Based JIT** | Yes | 4x–8x faster for long-running pure-Python loops |
| **MicroPython** | C | ❌ No | No | Ultra-lightweight for microcontrollers & IoT |
| **RustPython** | Rust | ❌ In Development | No | Safe embedding inside Rust applications |

---

## Advanced Concepts: Python 3.11+ Specialized Adaptive Interpreter (PEP 659)

In Python 3.11+, CPython introduced **PEP 659 (Specializing Adaptive Interpreter)**:
1. When a bytecode instruction (e.g. `BINARY_OP` or `LOAD_ATTR`) executes repeatedly, CPython monitors the types of the operands.
2. If the operands are consistently of the same type (e.g. both `float` or both `int`), CPython dynamically rewrites the opcode in-place in memory to a specialized version (e.g. `BINARY_OP_ADD_FLOAT`).
3. The specialized opcode bypasses generic dynamic type checks and method lookups, executing directly at near-C speeds.

---

## Exercises

### Exercise 1 — Beginner
Using the `ast` module, write a Python script that parses the code string `"a = 10; b = 20; c = a + b"` and prints the names of all target variables in `ast.Assign` nodes.

### Exercise 2 — Intermediate
Write a function `inspect_bytecode_names(func)` that inspects any passed Python function's `__code__` object and returns a dictionary of its local variables, constants, and argument count.

### Exercise 3 — Advanced
Build a `SecurityASTScanner` using `ast.NodeVisitor` that scans a Python file and flags warnings if any AST node uses the `eval()` or `exec()` built-in functions.

---

## Mini Project: Enterprise Custom AST Static Code Analyzer & Linter Engine

### Requirements
Build an operational static code analysis and linting engine named `ast_static_linter.py`. Parse target Python files without executing them, traverse AST trees, detect violations of enterprise standards (functions without docstrings, global keyword usage, dangerous `eval`/`exec` calls, overly complex functions with $>5$ arguments), and output formatted linting reports.

### Implementation Blueprint
```python
import ast
import sys
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. LINTING ISSUE MODEL
# =====================================================================

@dataclass
class LintViolation:
    line_number: int
    rule_code: str
    severity: str
    message: str

# =====================================================================
# 2. AST STATIC CODE VISITOR
# =====================================================================

class EnterpriseCodeLinter(ast.NodeVisitor):
    def __init__(self, filename: str = "<source>"):
        self.filename = filename
        self.violations: list[LintViolation] = []

    def visit_FunctionDef(self, node: ast.FunctionDef):
        # Rule E101: Function must have a docstring
        if ast.get_docstring(node) is None:
            self.violations.append(LintViolation(
                line_number=node.lineno,
                rule_code="E101",
                severity="WARNING",
                message=f"Function '{node.name}' is missing a PEP 257 docstring."
            ))

        # Rule E102: Function must not have more than 5 arguments
        num_args = len(node.args.args)
        if num_args > 5:
            self.violations.append(LintViolation(
                line_number=node.lineno,
                rule_code="E102",
                severity="ERROR",
                message=f"Function '{node.name}' has {num_args} arguments (Maximum allowed: 5)."
            ))

        self.generic_visit(node)

    def visit_Global(self, node: ast.Global):
        # Rule E201: Global variable mutation is prohibited
        self.violations.append(LintViolation(
            line_number=node.lineno,
            rule_code="E201",
            severity="CRITICAL",
            message=f"Use of 'global' keyword on variables {node.names} violates encapsulation."
        ))
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Rule E301: Dangerous dynamic evaluation
        if isinstance(node.func, ast.Name) and node.func.id in ("eval", "exec"):
            self.violations.append(LintViolation(
                line_number=node.lineno,
                rule_code="E301",
                severity="CRITICAL",
                message=f"Dangerous dynamic code execution call to '{node.func.id}()' detected."
            ))
        self.generic_visit(node)

# =====================================================================
# 3. STATIC LINTER CONTROLLER
# =====================================================================

SAMPLE_CODE_TO_LINT = """
# Enterprise Service Code
global_flag = True

def bad_function_without_docstring(a, b, c, d, e, f):
    global global_flag
    global_flag = False
    return a + b

def secure_function(x: int, y: int) -> int:
    '''Calculates sum of two integers securely.'''
    return x + y

def dangerous_evaluator(user_input: str):
    '''Evaluates expression dynamically.'''
    return eval(user_input)
"""

def run_linter_suite():
    print("=" * 68)
    print("      ENTERPRISE AST STATIC CODE ANALYZER & LINTER SUITE")
    print("=" * 68)

    # 1. Parse AST
    tree = ast.parse(SAMPLE_CODE_TO_LINT, filename="service_module.py")
    
    # 2. Run AST Visitor Analysis
    linter = EnterpriseCodeLinter(filename="service_module.py")
    linter.visit(tree)

    # 3. Render Formatted Report
    border = "-" * 68
    print(f"\n📊 LINT ANALYSIS RESULTS ({len(linter.violations)} Violations Found):")
    print(border)
    print(f"{'LINE':<6} {'CODE':<8} {'SEVERITY':<12} {'MESSAGE'}")
    print(border)

    for v in linter.violations:
        sev_icon = "🚨" if v.severity == "CRITICAL" else ("❌" if v.severity == "ERROR" else "⚠️")
        print(f"L{v.line_number:<5} {v.rule_code:<8} {sev_icon + ' ' + v.severity:<12} {v.message}")

    print(border)
    print("🛡️ AST Static Analysis Completed with Zero Runtime Code Execution.")
    print("=" * 68)

if __name__ == "__main__":
    run_linter_suite()
```

---

## Summary

In this lesson, you mastered the CPython execution pipeline and internal architecture:
- **CPython** is a Bytecode-Compiled Virtual Machine system executing a **5-Stage Pipeline**: Tokenizer $\rightarrow$ PEG Parser $\rightarrow$ AST $\rightarrow$ Symbol Table $\rightarrow$ Bytecode Compiler $\rightarrow$ CEval Execution Loop.
- Every entity in Python is a heap-allocated **`PyObject` C-struct** containing `ob_refcnt` and a pointer to its `ob_type`.
- Python variables are **8-byte C pointers** referencing heap-allocated objects.
- The **Symbol Table** pass resolves local, global, cell, and free variable scopes at compile time.
- The **`_PyEval_EvalFrameDefault()`** evaluation loop executes stack-based bytecode instructions using thread value stacks and `PyFrameObject` instances.

---

## Best Practices Checklist

- [ ] Use `ast.parse()` for static analysis, linting, and security audits without code execution.
- [ ] Understand that `id(obj)` exposes the actual C-memory address of `PyObject`.
- [ ] Avoid dynamic `eval()`/`exec()` calls that invoke the entire compiler pipeline at runtime.
- [ ] Inspect `func.__code__` attributes to understand function frame memory requirements (`co_stacksize`).

---

## What's Next?

Now that you understand the CPython execution pipeline, continue to:
👉 **[Python Bytecode & The `dis` Module](bytecode-and-dis-module.md)** to master stack evaluation machine opcodes, instruction disassembly, and bytecode optimization!
