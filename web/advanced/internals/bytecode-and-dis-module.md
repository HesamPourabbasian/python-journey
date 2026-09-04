# Python Bytecode & The `dis` Module in Python

## Introduction

When CPython executes your Python program, it does not evaluate your source code directly. Instead, it compiles the Abstract Syntax Tree into an intermediate low-level instruction set called **Python Bytecode**.

Python bytecode is executed by a **Stack Evaluation Virtual Machine**.

Understanding bytecode is the ultimate superpower for senior Python engineers:
- It demystifies why certain Python idioms (such as local variable lookups or list comprehensions) run significantly faster than equivalent iterative loops.
- It allows you to inspect compiler optimizations like **Constant Folding** and **Peephole Optimization**.
- It enables deep performance profiling and reverse engineering using the standard library **`dis` (Disassembler)** module.
- It explains modern Python 3.11+ optimizations, such as **Adaptive Bytecode Specialization** and **Inline Caching** (PEP 659).

This lesson explores the virtual stack machine model, the 2-byte wordcode format, core opcodes (`LOAD_FAST`, `BINARY_OP`, `CALL`), and disassembling runtime functions using `dis`.

---

## Prerequisites

Before studying bytecode, ensure you have:

- Completed [CPython Execution Pipeline & Architecture](cpython-architecture.md).
- A basic understanding of stack data structures (LIFO: Push and Pop operations).
- Familiarity with binary representation and integers.

---

## Core Concept: The Stack Evaluation Machine & Wordcode Format

```
                            THE STACK EVALUATION MACHINE MODEL

       Bytecode Instruction: BINARY_OP (Add)
       ─────────────────────────────────────
       1. Top of Stack (TOS)  : Pop operand B (e.g. 20)
       2. Next on Stack (TOS1): Pop operand A (e.g. 10)
       3. Perform Addition    : Result = A + B (30)
       4. Push Result to Stack: Push 30 back to TOS!

                            PYTHON 2-BYTE WORDCODE FORMAT

                        16-Bit Wordcode Instruction
                       ┌─────────────────┬─────────────────┐
                       │ 8-Bit Opcode    │ 8-Bit Oparg     │
                       │ (e.g. LOAD_FAST)│ (e.g. Index 0)  │
                       └─────────────────┴─────────────────┘
                             Byte 0            Byte 1
```

---

## Syntax & Essential `dis` Disassembly Patterns

```python
import dis

# 1. Disassembling a Standard Python Function
def calculate_vat(price: float) -> float:
    rate = 0.20
    return price * (1.0 + rate)

print("--- BYTECODE DISASSEMBLY OF calculate_vat ---")
dis.dis(calculate_vat)

# 2. Programmatic Instruction Inspection with dis.get_instructions()
instructions = list(dis.get_instructions(calculate_vat))
print(f"\nTotal Bytecode Instructions: {len(instructions)}")
for inst in instructions:
    print(f"  Offset: {inst.offset:>3} │ Opcode: {inst.opname:<18} │ Arg: {inst.argval}")
```

Disassembly Output Explained:
```text
  Line   Offset  Opcode Name            Oparg  Resolved Human Value
  ──────────────────────────────────────────────────────────────────
  2           0  LOAD_CONST                 1  (0.2)
              2  STORE_FAST                 1  (rate)

  3           4  LOAD_FAST                  0  (price)
              6  LOAD_CONST                 2  (1.2)   <-- Constant Folding! (1.0 + 0.2)
              8  BINARY_OP                  5  (*)
             10  RETURN_VALUE
```

---

## Detailed Explanation

### 1. The Anatomy of `dis.dis()` Output

When you inspect a function with `dis.dis()`, each row represents an instruction in the code object's `co_code` byte sequence:

1. **Line Number** (Leftmost column): The source code line in the `.py` file.
2. **Bytecode Offset** (Second column): The byte index in the binary `co_code` bytearray (increments by 2 for standard 16-bit wordcode).
3. **Opcode Name**: The mnemonic representation (e.g. `LOAD_FAST`, `STORE_FAST`, `BINARY_OP`).
4. **Oparg (Operand Argument)**: The raw 8-bit integer passed to the opcode (indexing into `co_consts`, `co_varnames`, or `co_names`).
5. **Human-Readable Resolution** (Rightmost in parentheses): The resolved variable name or literal constant.

---

### 2. Why `LOAD_FAST` Outperforms `LOAD_GLOBAL`

Understanding bytecode reveals one of the most famous Python performance optimizations: **Local Variable Speed vs Global Lookup Speed**.

- **`LOAD_FAST` (Locals)**: Local variables reside inside a fixed-size C array within the current `PyFrameObject`. Loading a local variable is a **direct $O(1)$ C pointer offset index**:
  $$\text{Target Pointer} = \text{frame->f_localsplus}[\text{oparg}]$$
- **`LOAD_GLOBAL` (Globals & Builtins)**: Global variables require:
  1. Hash lookup in the module `__dict__`.
  2. If missing, hash lookup in the `builtins.__dict__`.
  3. If missing, raise `NameError`.

```python
# Benchmark Demonstration:
import timeit

def global_loop():
    import math
    for _ in range(100_000):
        math.sin(0.5) # LOAD_GLOBAL ('math') + LOAD_ATTR ('sin') on every loop!

def local_loop():
    import math
    sin_func = math.sin # Localized!
    for _ in range(100_000):
        sin_func(0.5) # LOAD_FAST (sin_func) -> 30% FASTER!

print("Global Lookup Time :", timeit.timeit(global_loop, number=100))
print("Local Cached Time  :", timeit.timeit(local_loop, number=100))
```

---

### 3. Python 3.11+ Inline Caches & Adaptive Bytecode (PEP 659)

In Python 3.11+, CPython added **Inline Cache entries (`CACHE` opcodes)** directly into the bytecode stream.

When a generic opcode like `LOAD_ATTR` or `BINARY_OP` executes repeatedly, CPython replaces it in-place in memory with a **Specialized Opcode** (e.g. `LOAD_ATTR_MODULE` or `BINARY_OP_ADD_FLOAT`), caching the memory offset inside the following `CACHE` slots. Subsequent iterations bypass type checks entirely, executing at native speed.

---

## Examples

### 1. Simple: Disassembling Basic Arithmetic and Constant Folding
Observing how the CPython compiler optimizes literal expressions at compile time.

```python
import dis

def constant_math():
    # Compiler evaluates 60 * 60 * 24 at compile time (Constant Folding)!
    seconds_in_day = 60 * 60 * 24
    return seconds_in_day

print("Constant Folding Bytecode:")
dis.dis(constant_math)
# Notice: No multiplication opcodes exist! Only LOAD_CONST (86400)!
```

### 2. Beginner: Disassembling `if-else` Branching and Jump Targets
Inspecting conditional jump instructions (`POP_JUMP_IF_FALSE`, `JUMP_FORWARD`).

```python
import dis

def check_access(clearance_level: int) -> str:
    if clearance_level >= 5:
        return "GRANTED"
    else:
        return "DENIED"

print("Branching Jumps Bytecode:")
dis.dis(check_access)
```

### 3. Intermediate: Bytecode Comparison: `for` Loop vs List Comprehension
Comparing the opcode efficiency of a manual `for` loop versus a compiled list comprehension.

```python
import dis

def for_loop_approach():
    result = []
    for x in range(10):
        result.append(x * 2)
    return result

def list_comp_approach():
    return [x * 2 for x in range(10)]

print("1. FOR LOOP BYTECODE (Uses method attribute lookups and explicit appends):")
dis.dis(for_loop_approach)

print("\n2. LIST COMPREHENSION BYTECODE (Uses specialized LIST_APPEND opcode!):")
dis.dis(list_comp_approach)
```

### 4. Real-World: Localizing Built-in Functions in High-Throughput Pipelines
Using bytecode analysis to optimize a high-throughput data transformation function.

```python
import dis

# Unoptimized: LOAD_GLOBAL (len), LOAD_GLOBAL (str) in every iteration
def unoptimized_transform(data: list[int]) -> list[str]:
    return [str(x) for x in data]

# Optimized: Local reference binding
def optimized_transform(data: list[int]) -> list[str]:
    _str = str # Cache global str in local frame
    return [_str(x) for x in data]

print("Unoptimized Bytecode (LOAD_GLOBAL):")
dis.dis(unoptimized_transform)

print("\nOptimized Bytecode (LOAD_FAST):")
dis.dis(optimized_transform)
```

### 5. Advanced: Programmatic Opcode Profiling Engine
Building a bytecode analyzer that counts opcode frequencies across functions.

```python
import dis
from collections import Counter

def profile_function_opcodes(func) -> dict[str, int]:
    """Inspects raw instructions and aggregates opcode frequency statistics."""
    instructions = dis.get_instructions(func)
    counts = Counter(inst.opname for inst in instructions)
    
    print("=" * 60)
    print(f"BYTECODE OPCODE PROFILE: {func.__name__}()")
    print("=" * 60)
    for opcode, freq in counts.most_common():
        print(f"  • {opcode:<24} : {freq:>3} occurrences")
    return dict(counts)

def complex_sample(a, b, c):
    total = 0
    for i in range(a):
        if i % 2 == 0:
            total += (b * i) - c
        else:
            total -= i
    return total

profile_function_opcodes(complex_sample)
```

---

## Code Explanation

In Example 3 (`List Comprehension vs For Loop`):
1. The standard `for` loop executes `LOAD_FAST` (result), `LOAD_METHOD` (append), and `CALL_METHOD` for every single element—triggering method lookup overhead and stack frame setup.
2. The list comprehension compiles into a specialized **`LIST_APPEND`** opcode.
3. `LIST_APPEND` pops the top of the stack and appends directly to the internal C list buffer at $O(1)$ C-speed, completely bypassing the Python method resolution descriptor protocol.
4. This is why list comprehensions consistently outperform standard Python `for` loops by **30% to 50%**.

---

## Common Mistakes

### Mistake 1: Attempting to Mutate `__code__.co_code` Directly
In CPython, code objects are strictly immutable. Modifying the raw bytes of `co_code` using pointer hacks or ctypes can corrupt memory alignment and trigger **Segmentation Faults (SIGSEGV)** inside the C evaluation loop.

### Mistake 2: Assuming Bytecode is Stable Across Python Minor Versions
Opcodes change significantly between Python minor releases (e.g. Python 3.10 vs 3.11 vs 3.12). Never write hardcoded opcode numbers or rely on exact bytecode layouts across different Python versions.

---

## Best Practices

### Use `dis.dis()` to Validate Performance Hypotheses
When optimizing critical hot loops, disassemble both implementations with `dis.dis()` to verify that the compiler is emitting fewer instructions and utilizing `LOAD_FAST` instead of `LOAD_GLOBAL`.

Good:
```python
import dis
dis.dis(my_critical_algorithm)
```

---

## Performance Considerations

| Instruction Type | Mechanism | Latency |
|---|---|---|
| **`LOAD_FAST`** | C Array Index (`frame->f_localsplus[i]`) | **~1.5 nanoseconds** |
| **`LOAD_CONST`** | Constant Tuple Index (`co_consts[i]`) | **~1.5 nanoseconds** |
| **`LOAD_GLOBAL`** | 2x Dictionary Hash Lookups | ~12–25 nanoseconds |
| **`LOAD_ATTR`** | Descriptor Protocol (`__getattribute__`)| ~25–45 nanoseconds |

---

## Security Considerations

1. **Python Bytecode is NOT Compiled Machine Code**: Compiling `.py` to `.pyc` offers **zero intellectual property protection**. Tools like `pycdc` and `uncompyle6` can reconstruct 100% of the original Python source code from a `.pyc` file in seconds.
2. **Never Treat `.pyc` Files as Safe from Tampering**: Loading unverified `.pyc` files from untrusted sources can execute arbitrary bytecode exploits.

---

## Real-World Usage

- **Performance Profilers (Py-Spy, cProfile)**: Inspecting bytecode instruction pointers.
- **Machine Learning JIT Compilers (TorchDynamo / PyTorch 2.0)**: Intercepting Python bytecode frames and translating tensor operations into optimized CUDA kernels.
- **Dynamic Linters & Security Analyzers**: Detecting unsafe bytecode patterns.

---

## Comparison: Virtual Machine Architectures

| VM / Engine | Architecture | Instruction Format | Execution Mechanism |
|---|---|---|---|
| **CPython** | **Stack Machine** | **16-bit Wordcode** | **CEval loop / Specialized Interpreter**|
| **Java JVM** | Stack Machine | 8-bit Bytecode | JIT Compilation (HotSpot) |
| **LuaJIT / Dalvik** | Register Machine | 32-bit Registers | Register direct mapping |
| **x86-64 / ARM** | Hardware Registers| Variable Machine Code| Direct silicon execution |

---

## Advanced Concepts: Constant Folding & Peephole Optimization

During compilation, CPython's **AST Optimizer** (`Python/ast_opt.c`) performs **Constant Folding**:
- Operations on constant literals (e.g. `24 * 60 * 60`, `(1, 2) + (3, 4)`, `'hello ' * 3`) are evaluated at compile time.
- Immutables like tuples and frozensets containing only constants are pre-constructed and stored directly in `co_consts`.

---

## Exercises

### Exercise 1 — Beginner
Write a function `math_expression()` with the calculation `(10 + 5) * 2`. Use `dis.dis()` to verify that the compiler folded the entire expression into a single constant `30`.

### Exercise 2 — Intermediate
Disassemble a dictionary comprehension `{x: x**2 for x in range(5)}` and identify the specialized opcode used to insert key-value pairs into the dictionary (`MAP_ADD`).

### Exercise 3 — Advanced
Build a `BytecodeComplexityAnalyzer` that traverses `dis.get_instructions()` for a function and computes a Cyclomatic Complexity estimate based on the count of jump instructions (`POP_JUMP_IF_FALSE`, `JUMP_FORWARD`, `FOR_ITER`).

---

## Mini Project: Enterprise Automated Bytecode Profiler & Complexity Analyzer

### Requirements
Build an operational bytecode analysis engine named `bytecode_profiler.py`. Disassemble target functions, inspect opcodes, calculate stack depth metrics, identify global variable bottlenecks (`LOAD_GLOBAL`), compute cyclomatic branching complexity, and generate formatted optimization advisories.

### Implementation Blueprint
```python
import dis
from collections import Counter
from dataclasses import dataclass
from typing import Callable, Any

# =====================================================================
# 1. BYTECODE METRICS DATA MODEL
# =====================================================================

@dataclass
class FunctionBytecodeMetrics:
    function_name: str
    total_instructions: int
    stack_size: int
    global_lookups: int
    local_lookups: int
    jump_branches: int
    cyclomatic_complexity: int
    optimization_score: float

# =====================================================================
# 2. BYTECODE PROFILING ENGINE
# =====================================================================

class BytecodeProfiler:
    JUMP_OPCODES = {
        "POP_JUMP_IF_FALSE", "POP_JUMP_IF_TRUE", "POP_JUMP_IF_NONE",
        "POP_JUMP_IF_NOT_NONE", "JUMP_FORWARD", "JUMP_BACKWARD", "FOR_ITER"
    }

    @classmethod
    def analyze_function(cls, func: Callable[..., Any]) -> FunctionBytecodeMetrics:
        code = func.__code__
        instructions = list(dis.get_instructions(func))
        
        total_inst = len(instructions)
        stack_size = code.co_stacksize
        
        global_lookups = sum(1 for i in instructions if i.opname in ("LOAD_GLOBAL", "LOAD_NAME"))
        local_lookups = sum(1 for i in instructions if i.opname == "LOAD_FAST")
        jumps = sum(1 for i in instructions if i.opname in cls.JUMP_OPCODES)
        
        # Cyclomatic complexity approximation: Jumps + 1
        cyclomatic = jumps + 1

        # Calculate optimization score (Ratio of fast local loads to total variable loads)
        total_loads = global_lookups + local_lookups
        opt_score = (local_lookups / total_loads * 100.0) if total_loads > 0 else 100.0

        return FunctionBytecodeMetrics(
            function_name=func.__name__,
            total_instructions=total_inst,
            stack_size=stack_size,
            global_lookups=global_lookups,
            local_lookups=local_lookups,
            jump_branches=jumps,
            cyclomatic_complexity=cyclomatic,
            optimization_score=round(opt_score, 1)
        )

    @classmethod
    def render_report(cls, metrics: FunctionBytecodeMetrics):
        border = "=" * 68
        print("\n" + border)
        print(f"       BYTECODE ARCHITECTURAL AUDIT: {metrics.function_name}()")
        print(border)
        print(f"  • Total Bytecode Instructions : {metrics.total_instructions:>4} opcodes")
        print(f"  • Maximum Stack Depth Req     : {metrics.stack_size:>4} items")
        print(f"  • Fast Local Lookups (LOAD_FAST): {metrics.local_lookups:>4}")
        print(f"  • Slow Global Lookups (LOAD_GLOBAL): {metrics.global_lookups:>4}")
        print(f"  • Branching Jump Instructions : {metrics.jump_branches:>4}")
        print(f"  • Cyclomatic Complexity Index : {metrics.cyclomatic_complexity:>4}")
        print(f"  • Variable Optimization Score : {metrics.optimization_score:>5.1f}%")
        print("-" * 68)

        if metrics.global_lookups > 3:
            print("  ⚠️ ADVISORY: High LOAD_GLOBAL frequency detected. Consider local caching in hot loops.")
        else:
            print("  ✅ ADVISORY: Clean bytecode profile with optimal local frame caching.")
        print(border)

# =====================================================================
# 3. VERIFICATION & RUNTIME ANALYSIS
# =====================================================================

def candidate_algorithm(items: list[int], threshold: int) -> list[int]:
    filtered = []
    for x in items:
        if x > threshold and x % 2 == 0:
            filtered.append(x * 2)
    return filtered

if __name__ == "__main__":
    metrics = BytecodeProfiler.analyze_function(candidate_algorithm)
    BytecodeProfiler.render_report(metrics)
```

---

## Summary

In this lesson, you mastered Python bytecode and the `dis` module:
- CPython compiles source code into **16-bit Wordcode Instructions** (8-bit opcode + 8-bit operand argument).
- Bytecode executes on a **Stack Evaluation Virtual Machine** using thread-local value stacks.
- **`LOAD_FAST` ($O(1)$ C array offset)** runs significantly faster than **`LOAD_GLOBAL` ($O(1)$ dictionary hash lookups)**.
- List comprehensions utilize specialized **`LIST_APPEND`** opcodes to bypass Python method dispatch overhead.
- **Python 3.11+ Specialized Adaptive Interpreter (PEP 659)** dynamically specializes opcodes at runtime using **Inline Caches (`CACHE`)**.
- The standard library **`dis`** module provides deep structural disassembly and inspection of `PyCodeObject` instructions.

---

## Best Practices Checklist

- [ ] Use `dis.dis()` to verify compiler optimizations and stack behavior.
- [ ] Cache frequently accessed global functions into local variables in high-throughput hot loops.
- [ ] Prefer list/dict comprehensions over iterative `.append()` loops for opcode efficiency.
- [ ] Understand that `.pyc` bytecode files are not encrypted and can be reverse engineered.

---

## What's Next?

Now that you understand bytecode and execution mechanics, continue to:
👉 **[The Global Interpreter Lock (GIL) in Depth](gil-global-interpreter-lock.md)** to master mutual exclusion locks, CPU vs I/O boundaries, and Python 3.13 free-threaded no-GIL architecture!
