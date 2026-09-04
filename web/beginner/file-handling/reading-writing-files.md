# Reading & Writing Files in Python

## Introduction

In software systems, data held in runtime memory (RAM) is ephemeral; it disappears the moment a process terminates, a container restarts, or a server reboots. To preserve application state, ingest external datasets, export analytical reports, process system logs, and communicate across system boundaries, applications must interact with **Persistent Storage** via File Input/Output (I/O).

In Python, file handling is managed through the built-in **`open()`** function. Python's I/O library bridges high-level developer convenience with low-level operating system file descriptors and hardware disk buffers.

Mastering file operations requires an in-depth understanding of the **File Access Mode Matrix**, the fundamental differences between text and binary streams, the mechanics of buffer flushing, navigating file pointers using `.seek()` and `.tell()`, and avoiding cross-platform character encoding traps by **always explicitly specifying `encoding="utf-8"`**.

This lesson opens **Module 10: File Handling & Pathlib**, giving you the technical foundation to build robust, memory-safe data persistence pipelines.

---

## Prerequisites

Before studying file operations, ensure you have:

- Completed [Strings Fundamentals](../variables-data-types/strings.md) and [Unicode Architecture](../variables-data-types/strings.md).
- Completed [For Loops & The Iteration Protocol](../control-flow/for-loops.md).
- Completed [Exception Handling Fundamentals](../fundamentals/python-interpreter.md).

---

## Core Concept: The File Access Mode Matrix

The `open()` function takes a file path and an access mode string that dictates read/write capabilities, file creation behavior, and stream encoding:

$$\text{file\_object} = \textbf{open}(\text{file\_path}, \text{mode}=\text{"r"}, \text{encoding}=\text{"utf-8"}, \text{buffering}=-1)$$

```
                               THE PYTHON FILE MODE MATRIX

   ┌──────┬───────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
   │ Mode │ Purpose               │ If File Exists       │ If File Missing      │ Initial Pointer Pos  │
   ├──────┼───────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
   │ 'r'  │ Read (Text)           │ Opens for reading    │ Raises FileNotFoundError │ Beginning (Offset 0) │
   │ 'w'  │ Write (Text)          │ TRUNCATES (Erases!)  │ Creates new file     │ Beginning (Offset 0) │
   │ 'a'  │ Append (Text)         │ Preserves content    │ Creates new file     │ End of File          │
   │ 'x'  │ Exclusive Create      │ Raises FileExistsError│ Creates new file    │ Beginning (Offset 0) │
   ├──────┼───────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
   │ 'rb' │ Read (Raw Binary)     │ Reads bytes object   │ Raises FileNotFoundError │ Beginning (Offset 0) │
   │ 'wb' │ Write (Raw Binary)    │ TRUNCATES (Erases!)  │ Creates new file     │ Beginning (Offset 0) │
   │ 'r+' │ Read & Write (Update) │ Overwrites in-place  │ Raises FileNotFoundError │ Beginning (Offset 0) │
   │ 'w+' │ Read & Write (Update) │ TRUNCATES (Erases!)  │ Creates new file     │ Beginning (Offset 0) │
   │ 'a+' │ Read & Append         │ Preserves content    │ Creates new file     │ End of File          │
   └──────┴───────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## Syntax & Essential File I/O Patterns

```python
# 1. Writing Text to a File
with open("app_config.txt", mode="w", encoding="utf-8") as f:
    f.write("server_name=cloud-primary\n")
    f.write("port=8080\n")
    f.writelines(["max_conns=500\n", "ssl=true\n"])

# 2. Reading Text (Memory-Safe Line-by-Line Streaming)
with open("app_config.txt", mode="r", encoding="utf-8") as f:
    for line in f:  # Iterates line by line without loading entire file into RAM!
        clean_line = line.strip()
        print(f"Config Item: {clean_line}")

# 3. Appending to an Existing File
with open("app_config.txt", mode="a", encoding="utf-8") as f:
    f.write("environment=production\n")

# 4. Reading and Writing Binary Data (Images, Audio, Compressed files)
with open("raw_bytes.dat", mode="wb") as f:
    f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR")

with open("raw_bytes.dat", mode="rb") as f:
    binary_payload = f.read(8)  # Read first 8 bytes
    print("Magic Header Bytes:", binary_payload)
```

---

## Detailed Explanation

### 1. The Mandatory `encoding="utf-8"` Rule (PEP 597)

When `open(filename, "r")` is called without an `encoding` parameter, Python defaults to the **operating system's locale encoding**:
- On Linux and macOS: defaults to `UTF-8`.
- On Windows: frequently defaults to legacy **`cp1252` (Windows ANSI)**.

If a developer on macOS saves a file containing Unicode characters (such as emojis or accented names) in UTF-8, running the script on Windows without specifying `encoding="utf-8"` causes a crash:
`UnicodeDecodeError: 'charmap' codec can't decode byte 0x8f in position 42`.

**Golden Rule**: **Always explicitly declare `encoding="utf-8"`** whenever opening text files in Python.

---

### 2. Reading Strategies: `.read()` vs `.readlines()` vs Line Iteration

Choosing the wrong reading method can crash production servers with Out-Of-Memory (OOM) errors:

1. **`f.read()` (Read Entire File)**: Reads the entire file into a single string in RAM.
   - *Use Case*: Small configuration or template files (< 5 MB).
   - *Danger*: Calling `f.read()` on a 10 GB log file will instantly consume 10 GB of server RAM and crash the process.
2. **`f.readlines()` (List of Lines)**: Reads all lines and constructs a Python list of strings in RAM.
   - *Danger*: Suffers from the exact same memory exhaustion issue as `.read()`.
3. **`for line in f:` (Streaming Line Iterator - Recommended)**: Python reads the file in internal 8KB buffer chunks, yielding lines one at a time.
   - *Memory Footprint*: **Constant $O(1)$ memory**. Works seamlessly on 100 GB files without exceeding 8 KB of RAM.

---

### 3. File Pointer Navigation with `.seek()` and `.tell()`

Every open file maintains an internal **File Pointer** (cursor offset) tracking the current byte position in the stream:

- **`f.tell() -> int`**: Returns the current byte offset position of the cursor.
- **`f.seek(offset, whence=0)`**: Moves the file pointer to a new position.
  - `whence = 0` (Default): Offset relative to the **beginning** of the file.
  - `whence = 1`: Offset relative to the **current** pointer position (binary mode only).
  - `whence = 2`: Offset relative to the **end** of the file (binary mode only).

```python
with open("sample.txt", "w+", encoding="utf-8") as f:
    f.write("0123456789ABCDEF")
    print("Pointer after writing:", f.tell())  # Byte 16
    
    # Reposition pointer back to beginning (Offset 0)
    f.seek(0)
    print("First 4 characters   :", f.read(4)) # "0123"
    
    # Jump to offset 10
    f.seek(10)
    print("Characters from 10   :", f.read(4)) # "ABCD"
```

---

## Examples

### 1. Simple: Writing and Reading Key-Value Settings
Writing a structured text configuration file and reading it back.

```python
settings = {
    "DATABASE_HOST": "db-cluster.internal",
    "DATABASE_PORT": "5432",
    "MAX_POOL_SIZE": "20",
    "SSL_MODE": "require"
}

# Write settings
with open("db_settings.env", "w", encoding="utf-8") as f:
    for key, val in settings.items():
        f.write(f"{key}={val}\n")

# Read settings back into dictionary
loaded_settings = {}
with open("db_settings.env", "r", encoding="utf-8") as f:
    for line in f:
        if "=" in line:
            k, v = line.strip().split("=", 1)
            loaded_settings[k] = v

print("Loaded Settings Dictionary:", loaded_settings)
```

### 2. Beginner: Safe Streaming Log File Filter
Filtering a server access log to extract HTTP 500 error entries without loading the entire file into RAM.

```python
# Create a sample log file
sample_logs = [
    "192.168.1.10 - 200 - /index.html",
    "192.168.1.15 - 500 - /api/checkout",
    "192.168.1.20 - 404 - /missing.png",
    "192.168.1.25 - 500 - /api/payment",
]
with open("server_access.log", "w", encoding="utf-8") as f:
    f.write("\n".join(sample_logs) + "\n")

# Stream log and extract critical errors
error_count = 0
with open("server_access.log", "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, start=1):
        if " 500 " in line:
            error_count += 1
            print(f"🚨 [Line #{line_num}] Critical 500 Error: {line.strip()}")

print(f"Total Server Errors Detected: {error_count}")
```

### 3. Intermediate: Repositioning Pointers with `.seek()` and `.tell()`
Updating a header metadata block in-place within a fixed-format file.

```python
with open("records.dat", "w+", encoding="utf-8") as f:
    # Write initial header placeholder
    f.write("RECORD_COUNT: [0000]\n")
    f.write("--------------------\n")
    
    # Write dynamic data rows
    record_items = ["User_Alpha", "User_Beta", "User_Gamma"]
    for item in record_items:
        f.write(f"ROW: {item}\n")
        
    # Rewind file pointer to header placeholder offset
    f.seek(15)  # Position right after "RECORD_COUNT: ["
    f.write(f"{len(record_items):04d}") # Overwrite with "0003"
    
    # Read entire file from start
    f.seek(0)
    print("Final File Contents:\n" + f.read())
```

### 4. Real-World: Binary File Format Magic Number Header Validator
Inspecting binary headers to validate file types (PNG, JPEG, PDF) securely without relying on file extensions.

```python
def identify_file_format(filepath: str) -> str:
    """Inspect the magic binary header bytes to determine true file format."""
    MAGIC_SIGNATURES = {
        b"\x89PNG\r\n\x1a\n": "PNG Image",
        b"\xff\xd8\xff": "JPEG Image",
        b"%PDF-": "PDF Document",
        b"PK\x03\x04": "ZIP Archive / DOCX / XLSX",
    }
    
    # Read first 8 bytes in raw binary mode
    with open(filepath, "rb") as f:
        header = f.read(8)
        
    for signature, format_name in MAGIC_SIGNATURES.items():
        if header.startswith(signature):
            return format_name
            
    return "Unknown Binary Format"

# Create mock PNG binary file
with open("test_image.png", "wb") as f:
    f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...")

print("Validated Format:", identify_file_format("test_image.png"))
```

### 5. Advanced: High-Speed Chunked Binary File Copy Engine
Copying large multi-gigabyte binary files using explicit buffer chunk streaming.

```python
def copy_file_chunked(source_path: str, dest_path: str, chunk_size: int = 64 * 1024) -> int:
    """Copy a file in 64 KB memory chunks, returning total bytes copied."""
    total_bytes = 0
    
    with open(source_path, "rb") as src, open(dest_path, "wb") as dst:
        while True:
            chunk = src.read(chunk_size)
            if not chunk:
                break  # End of File (EOF)
            dst.write(chunk)
            total_bytes += len(chunk)
            
    return total_bytes

# Create sample source
with open("source.bin", "wb") as f:
    f.write(b"SAMPLE_RAW_BINARY_DATA_CHUNK_" * 1000)

bytes_copied = copy_file_chunked("source.bin", "destination.bin")
print(f"Successfully copied {bytes_copied:,} bytes in chunks.")
```

---

## Code Explanation

In Example 5 (Chunked Binary Copy):
1. Both source and destination files are opened in binary mode (`"rb"` and `"wb"`), avoiding character decoding overhead and newline translations.
2. `src.read(chunk_size)` reads fixed 64 KB blocks from the disk directly into a `bytes` buffer.
3. When `read()` reaches the end of the file, it returns an empty `b""` bytes object, breaking the loop cleanly.
4. This chunked architecture copies files of any size (even 500 GB) using a fixed 64 KB memory footprint.

---

## Common Mistakes

### Mistake 1: Forgetting `encoding="utf-8"`
Relying on system default encodings causes code to work on developer macOS machines but crash when deployed to Windows server environments.

### Mistake 2: Accidental File Truncation with Mode `"w"`
Opening a file in `"w"` mode immediately erases all existing content. If you want to add data to an existing file, use append mode `"a"`.

---

## Best Practices

### Always Stream Files with Iterators
Never use `.read()` or `.readlines()` when processing operational logs or data feeds. Iterate over the file object directly.

Good:
```python
with open("large_dataset.csv", "r", encoding="utf-8") as f:
    for line in f:
        process_line(line)
```

Avoid:
```python
with open("large_dataset.csv", "r", encoding="utf-8") as f:
    for line in f.readlines():  # Loads entire multi-GB file into RAM list!
        process_line(line)
```

---

## Performance Considerations

1. **OS Buffer Caching**: Python uses an internal 8 KB buffer by default. Modifying `buffering=64*1024` (64 KB) in `open()` aligns reads with modern SSD sector block sizes, maximizing throughput on large files.
2. **`.flush()` vs `.close()`**: Writing data with `f.write()` does not write to the physical disk immediately; it writes to Python's memory buffer. Calling `f.flush()` forces data to the OS buffer; exiting the `with` block closes the file and ensures everything is committed to disk.

---

## Security Considerations

1. **Path Traversal Vulnerabilities (Directory Traversal)**: If accepting filenames from user web requests, an attacker can supply `../../etc/passwd` to read sensitive system files. Always validate filenames using `os.path.basename()` or `pathlib.Path.resolve()`.
2. **Exclusive File Creation (`"x"` mode)**: When creating security tokens or lock files, use `"x"` (or `"xb"`) mode to guarantee that the operation fails if the file already exists, preventing race conditions.

---

## Real-World Usage

- **Web Server Access Logging**: Writing incoming HTTP requests to append-only `.log` files in real-time.
- **Database Backup Dumps**: Streaming SQL schema dumps and table data to disk in chunked binary buffers.
- **Machine Learning Dataset Loaders**: Streaming image and audio training samples from disk in batches.

---

## Comparison: File Access Modes

| Mode | Reads? | Writes? | Overwrites Existing? | Creates Missing? |
|---|---|---|---|---|
| **`'r'`** | **Yes** | No | No | **No (Raises Error)** |
| **`'w'`** | No | **Yes** | **Yes (Truncates)** | **Yes** |
| **`'a'`** | No | **Yes** | No (Appends to End) | **Yes** |
| **`'x'`** | No | **Yes** | **Raises Error if Exists** | **Yes** |
| **`'r+'`**| **Yes** | **Yes** | In-place overwrite | **No (Raises Error)** |
| **`'w+'`**| **Yes** | **Yes** | **Yes (Truncates)** | **Yes** |

---

## Advanced Concepts: The CPython `io` Module Hierarchy

When you call `open()`, Python instantiates a multi-layered object hierarchy from the standard `io` module:

```
                          CPYTHON io MODULE ABSTRACTION LAYERS

   Text Mode ("r", "w")             ──► [ io.TextIOWrapper ]   (Unicode Encoding / Decoding)
                                                │
   Buffered Binary ("rb", "wb")     ──► [ io.BufferedReader / BufferedWriter ] (Memory Buffer)
                                                │
   Raw OS File Descriptor           ──► [ io.FileIO ]          (Low-Level read() / write() Syscalls)
```

In binary mode, Python bypasses `TextIOWrapper`, streaming raw bytes directly through the high-speed `BufferedReader`.

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that creates a file named `todo.txt` containing 3 tasks. Re-open the file in append mode (`"a"`) to add a 4th task. Finally, open the file in read mode (`"r"`), iterate through the lines, and print them numbered with `enumerate()`.

### Exercise 2 — Intermediate
Write a function `count_file_metrics(filepath: str) -> dict` that streams a text file in constant memory and returns a dictionary with: (1) total line count, (2) total word count, and (3) total character count.

### Exercise 3 — Advanced
Build a `RotatingLogWriter` class. The writer accepts log strings and appends them to `app.log`. When `app.log` exceeds a maximum file size (e.g., 1 MB), automatically rename `app.log` to `app.log.1` and initialize a fresh `app.log`.

---

## Mini Project: Enterprise Transaction Auditor & Binary Checksum Engine

### Requirements
Build a secure financial file auditor named `transaction_auditor.py` that writes transaction ledgers with explicit UTF-8 encoding, computes cryptographic SHA-256 checksums of written files, validates file integrity, and searches records using streaming pointers.

### Implementation Blueprint
```python
import hashlib
import os

class TransactionAuditor:
    @staticmethod
    def create_ledger(filepath: str, transactions: list[dict]):
        """Write transactions to file with explicit UTF-8 encoding."""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("# LEDGER_VERSION=1.0\n")
            for tx in transactions:
                line = f"{tx['id']}|{tx['account']}|{tx['amount']:.2f}|{tx['type']}\n"
                f.write(line)
        print(f"💾 Ledger created successfully: {filepath}")

    @staticmethod
    def compute_file_checksum(filepath: str) -> str:
        """Compute SHA-256 hash of file in 64 KB binary chunks."""
        sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(64 * 1024):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def audit_ledger_stream(filepath: str) -> dict:
        """Stream ledger line-by-line and compute audit statistics."""
        total_credits = 0.0
        total_debits = 0.0
        record_count = 0
        
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                clean = line.strip()
                if not clean or clean.startswith("#"):
                    continue
                    
                parts = clean.split("|")
                if len(parts) == 4:
                    tx_id, acc, amount_str, tx_type = parts
                    amount = float(amount_str)
                    record_count += 1
                    
                    if tx_type == "CREDIT":
                        total_credits += amount
                    elif tx_type == "DEBIT":
                        total_debits += amount

        return {
            "records": record_count,
            "credits": round(total_credits, 2),
            "debits": round(total_debits, 2),
            "net": round(total_credits - total_debits, 2)
        }

if __name__ == "__main__":
    ledger_file = "q2_audit_ledger.txt"
    
    sample_txs = [
        {"id": "TX-01", "account": "ACC-9901", "amount": 1500.50, "type": "CREDIT"},
        {"id": "TX-02", "account": "ACC-3312", "amount": 420.00, "type": "DEBIT"},
        {"id": "TX-03", "account": "ACC-8821", "amount": 2500.00, "type": "CREDIT"},
        {"id": "TX-04", "account": "ACC-9901", "amount": 125.75, "type": "DEBIT"},
    ]
    
    print("=" * 65)
    print("           ENTERPRISE FINANCIAL TRANSACTION AUDITOR")
    print("=" * 65)
    
    # 1. Create and Write Ledger
    TransactionAuditor.create_ledger(ledger_file, sample_txs)
    
    # 2. Compute Checksum
    checksum = TransactionAuditor.compute_file_checksum(ledger_file)
    print(f"🔒 SHA-256 Checksum : {checksum}")
    
    # 3. Stream and Audit
    audit_report = TransactionAuditor.audit_ledger_stream(ledger_file)
    print("-" * 65)
    print(f"Total Records Audited : {audit_report['records']}")
    print(f"Total Credit Volume   : ${audit_report['credits']:>10,.2f}")
    print(f"Total Debit Volume    : ${audit_report['debits']:>10,.2f}")
    print(f"Net Position Balance  : ${audit_report['net']:>10,.2f}")
    print("=" * 65)
```

---

## Summary

In this lesson, you mastered Python's file I/O operations:
- Always use **`with open(...)`** and explicitly specify **`encoding="utf-8"`** for text files.
- Understand the **Mode Matrix**: `'r'` (read), `'w'` (truncate/write), `'a'` (append), `'x'` (exclusive create), `'b'` (binary).
- Always use line iterators (`for line in f:`) to stream large files with **constant $O(1)$ memory**.
- Use **`f.tell()`** to inspect the file pointer and **`f.seek()`** to reposition it.
- Use binary mode (`"rb"` / `"wb"`) and fixed chunk sizes (`f.read(64*1024)`) for high-speed binary data transfer.

---

## Best Practices Checklist

- [ ] Always explicitly specify `encoding="utf-8"` on all text `open()` calls.
- [ ] Iterate directly over file objects (`for line in f:`) instead of calling `.readlines()`.
- [ ] Use binary modes (`"rb"`, `"wb"`) for non-text files to avoid newline corruptions.
- [ ] Use exclusive mode (`"x"`) when creating lock or token files to prevent race condition overwrites.
- [ ] Copy large files in 64 KB chunks to preserve system memory.

---

## What's Next?

Now that you understand file operations, continue to:
👉 **[Context Managers & The `with` Statement](context-managers-with-statement.md)** to master deterministic resource cleanup, the `__enter__`/`__exit__` protocol, and `@contextlib.contextmanager`.
