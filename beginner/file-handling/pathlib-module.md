# Modern Filesystem Operations with `pathlib` in Python

## Introduction

Historically in Python, interacting with the local filesystem was handled using the legacy **`os.path`** module. Developers manipulated file paths as raw text strings, manually concatenating directory segments with `os.path.join()`, splitting extensions with `os.path.splitext()`, checking file existence with `os.path.exists()`, and creating folders with `os.makedirs()`. This string-based approach was clunky, verbose, and prone to subtle cross-platform formatting bugs when moving between POSIX systems (Linux/macOS using forward slashes `/`) and Windows (using backslashes `\`).

Introduced in **Python 3.4** via **PEP 428**, the **`pathlib`** standard library module revolutionized filesystem interaction by treating paths not as raw strings, but as **Rich, Object-Oriented `Path` Objects**.

With `pathlib`, Python overloads the division operator `/` to perform intuitive, cross-platform path arithmetic (`base_dir / "subdir" / "file.txt"`). A `Path` object encapsulates all path manipulation, directory searching (`.glob()` and `.rglob()`), metadata inspection (`.stat()`), and direct file I/O (`.read_text()` and `.write_text()`) within a unified, expressive interface.

This lesson concludes **Module 10: File Handling & Pathlib**, giving you the modern, professional toolkit for all filesystem operations.

---

## Prerequisites

Before studying `pathlib`, ensure you have:

- Completed [Reading & Writing Files](reading-writing-files.md) and [Context Managers](context-managers-with-statement.md).
- Completed all built-in collections and list comprehension modules.
- Familiarity with file system concepts (absolute paths, relative paths, working directories).

---

## Core Concept: Object-Oriented Path Architecture

In `pathlib`, paths are represented as concrete, platform-aware objects instantiated via the **`Path`** factory class:

```
                            THE pathlib CLASS HIERARCHY

                               ┌─────────────────┐
                               │    PurePath     │ (Pure computational path logic)
                               └────────┬────────┘
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
          ┌───────────────────┐                   ┌───────────────────┐
          │   PurePosixPath   │                   │  PureWindowsPath  │
          └─────────┬─────────┘                   └─────────┬─────────┘
                    │ (Concrete OS Binding)                 │ (Concrete OS Binding)
                    ▼                                       ▼
          ┌───────────────────┐                   ┌───────────────────┐
          │     PosixPath     │                   │    WindowsPath    │
          └───────────────────┘                   └───────────────────┘
                    ▲                                       ▲
                    └───────────────────┬───────────────────┘
                                        │ (Auto-Instantiated)
                               ┌────────┴────────┐
                               │   Path (Base)   │
                               └─────────────────┘
```

When you call `Path("data/file.txt")`:
- On **Linux / macOS**: Instantiates a concrete `PosixPath` object.
- On **Windows**: Instantiates a concrete `WindowsPath` object.

---

## Syntax & Essential `pathlib` Operations

```python
from pathlib import Path

# 1. Path Construction & Division Operator (/)
base_dir = Path.home() / "projects" / "analytics_app"
config_file = base_dir / "config" / "settings.json"

# 2. Path Component Inspection
print("Full Path   :", config_file)                      # ~/projects/analytics_app/config/settings.json
print("Filename    :", config_file.name)                 # "settings.json"
print("File Stem   :", config_file.stem)                 # "settings"
print("Extension   :", config_file.suffix)               # ".json"
print("Parent Dir  :", config_file.parent)               # ~/projects/analytics_app/config

# 3. Directory Creation (with parents and exist_ok)
config_file.parent.mkdir(parents=True, exist_ok=True)

# 4. Direct Convenience File I/O
config_file.write_text('{"env": "production"}', encoding="utf-8")
loaded_text = config_file.read_text(encoding="utf-8")

# 5. Existence and Type Checks
print("Exists?     :", config_file.exists())             # True
print("Is File?    :", config_file.is_file())            # True
print("Is Directory:", base_dir.is_dir())                # True

# 6. Pattern Matching & Recursive Searching
python_files = list(base_dir.rglob("*.py"))              # Find all .py files recursively!
```

---

## Detailed Explanation

### 1. Legacy `os.path` vs Modern `pathlib.Path`

| Operation | Legacy `os.path` Approach | Modern `pathlib.Path` Approach |
|---|---|---|
| **Join Paths** | `os.path.join(a, b, c)` | `a / b / c` |
| **Get Filename** | `os.path.basename(path)` | `path.name` |
| **Get Extension** | `os.path.splitext(path)[1]`| `path.suffix` |
| **Get Parent** | `os.path.dirname(path)` | `path.parent` |
| **Make Directory** | `os.makedirs(path, exist_ok=True)` | `path.mkdir(parents=True, exist_ok=True)` |
| **Check Exists** | `os.path.exists(path)` | `path.exists()` |
| **Resolve Absolute** | `os.path.abspath(path)` | `path.resolve()` |
| **Read Entire File**| `with open(p) as f: text = f.read()` | `path.read_text(encoding="utf-8")` |

---

### 2. Path Navigation: `.stem`, `.suffix`, and `.parent`

Understanding the anatomy of a `Path` object:

```
            /var/log/nginx/access.2024.log.gz
            │             │       │      └─── .suffix ('.gz')
            │             │       └────────── .suffixes (['.2024', '.log', '.gz'])
            │             └────────────────── .stem ('access.2024.log')
            │             └────────────────── .name ('access.2024.log.gz')
            └──────────────────────────────── .parent ('/var/log/nginx')
```

```python
archive = Path("/var/log/nginx/access.2024.log.gz")

print("Name     :", archive.name)       # access.2024.log.gz
print("Stem     :", archive.stem)       # access.2024.log
print("Suffix   :", archive.suffix)     # .gz
print("Suffixes :", archive.suffixes)   # ['.2024', '.log', '.gz']
print("Parent   :", archive.parent)     # /var/log/nginx
```

---

### 3. Recursive Searching with `.glob()` and `.rglob()`

`pathlib` provides Unix shell-style wildcard pattern matching:
- **`path.glob(pattern)`**: Matches files matching `pattern` in the **immediate directory**.
- **`path.rglob(pattern)`**: Recursively searches the directory and **all nested subdirectories** (equivalent to `path.glob("**/" + pattern)`).

```python
current_dir = Path(".")

# Find all JSON files in current folder
top_level_jsons = list(current_dir.glob("*.json"))

# Find all Markdown files in all nested subdirectories
all_markdown_docs = list(current_dir.rglob("*.md"))
```

---

### 4. Path Sandboxing with `.is_relative_to()` (Python 3.9+)

To prevent **Path Traversal Security Attacks** (e.g., preventing a user from supplying `../../etc/passwd`), Python 3.9 introduced `path.is_relative_to(base)`:

```python
ALLOWED_ROOT = Path("/var/app/uploads").resolve()

def is_safe_user_path(untrusted_filename: str) -> bool:
    # Resolve canonical absolute path (resolves symlinks and '..')
    target_path = (ALLOWED_ROOT / untrusted_filename).resolve()
    
    # Verify that target_path is strictly inside ALLOWED_ROOT!
    return target_path.is_relative_to(ALLOWED_ROOT)

print("Safe Path Check 1:", is_safe_user_path("avatar.png"))          # True ✅
print("Safe Path Check 2:", is_safe_user_path("../../etc/passwd"))    # False (Blocked!) 🚫
```

---

## Examples

### 1. Simple: Inspecting Current Project Structure
Inspecting the current working directory, home folder, and project roots.

```python
from pathlib import Path

cwd = Path.cwd()
home = Path.home()

print(f"Current Working Directory : {cwd}")
print(f"User Home Directory       : {home}")
print(f"Is CWD inside Home?       : {cwd.is_relative_to(home) if hasattr(cwd, 'is_relative_to') else 'N/A'}")
```

### 2. Beginner: Automated Directory Scaffolding
Safely creating project directory structures and placeholder files.

```python
from pathlib import Path

project_root = Path("sample_microservice")
directories = [
    project_root / "src" / "api",
    project_root / "src" / "models",
    project_root / "tests",
    project_root / "docs",
]

# Scaffold directories safely
for d in directories:
    d.mkdir(parents=True, exist_ok=True)
    print(f"📁 Created Directory: {d}")

# Create placeholder __init__.py files
for d in directories[:2]:
    init_file = d / "__init__.py"
    init_file.touch(exist_ok=True)
    print(f"  📄 Created File: {init_file}")
```

### 3. Intermediate: Recursive File Extension Renamer & Cleaner
Renaming legacy `.txt` log files to `.log` and deleting empty temporary folders.

```python
from pathlib import Path

workspace = Path("test_workspace")
workspace.mkdir(exist_ok=True)

# Create mock log files
(workspace / "service_a.txt").write_text("Log Data A", encoding="utf-8")
(workspace / "service_b.txt").write_text("Log Data B", encoding="utf-8")

# Rename all .txt files to .log using .with_suffix()
for text_file in workspace.glob("*.txt"):
    new_target = text_file.with_suffix(".log")
    text_file.rename(new_target)
    print(f"Renamed: {text_file.name} -> {new_target.name}")
```

### 4. Real-World: Recursive Project Asset Inventory & Size Aggregator
Scanning a project directory to count file types and compute total byte consumption.

```python
from pathlib import Path
from collections import defaultdict

def scan_directory_inventory(target_dir: Path) -> dict:
    inventory = defaultdict(lambda: {"count": 0, "bytes": 0})
    
    for item in target_dir.rglob("*"):
        if item.is_file():
            ext = item.suffix.lower() or "[no_extension]"
            file_size = item.stat().st_size
            inventory[ext]["count"] += 1
            inventory[ext]["bytes"] += file_size
            
    return dict(inventory)

# Scan current workspace
stats = scan_directory_inventory(Path("."))

print(f"{'EXTENSION':<15} {'FILES':>8} {'SIZE (KB)':>12}")
print("=" * 38)
for ext, data in sorted(stats.items(), key=lambda pair: pair[1]["bytes"], reverse=True)[:6]:
    print(f"{ext:<15} {data['count']:>8,d} {data['bytes'] / 1024:>11,.1f} KB")
```

### 5. Advanced: Automated Rolling File Backup Engine
Building an automated backup utility that archives files, appends ISO timestamps, and purges backups older than $N$ versions.

```python
import shutil
from datetime import datetime, timezone
from pathlib import Path

class RollingFileBackup:
    def __init__(self, target_filepath: Path, max_backups: int = 3):
        self.target = Path(target_filepath)
        self.backup_dir = self.target.parent / ".backups"
        self.max_backups = max_backups
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(self) -> Path | None:
        if not self.target.exists():
            print(f"Target file '{self.target}' does not exist. Skipping backup.")
            return None

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        backup_filename = f"{self.target.stem}_{timestamp}{self.target.suffix}"
        dest_path = self.backup_dir / backup_filename

        shutil.copy2(self.target, dest_path)
        print(f"💾 [BACKUP CREATED] Saved snapshot -> {dest_path.name}")

        self._rotate_old_backups()
        return dest_path

    def _rotate_old_backups(self):
        """Purge oldest backups exceeding max_backups limit."""
        pattern = f"{self.target.stem}_*{self.target.suffix}"
        existing_backups = sorted(
            self.backup_dir.glob(pattern),
            key=lambda p: p.stat().st_mtime
        )

        while len(existing_backups) > self.max_backups:
            oldest = existing_backups.pop(0)
            oldest.unlink()  # Delete file
            print(f"🗑️ [ROTATED] Purged obsolete backup -> {oldest.name}")

# Test Backup Utility
live_config = Path("app_live_config.ini")
live_config.write_text("[DATABASE]\nhost=localhost\n", encoding="utf-8")

backup_mgr = RollingFileBackup(live_config, max_backups=2)
backup_mgr.create_backup()
backup_mgr.create_backup()
backup_mgr.create_backup()  # Triggers rotation of 1st backup!
```

---

## Code Explanation

In Example 5 (Rolling File Backup):
1. `RollingFileBackup` constructs backup paths using pure `pathlib.Path` operators: `self.target.parent / ".backups"`.
2. `self.target.stem` extracts the filename without extension (`"app_live_config"`), allowing clean timestamp interpolation.
3. `p.stat().st_mtime` inspects the filesystem modification timestamp to sort backups chronologically.
4. `oldest.unlink()` cleanly deletes expired backup files.
5. This highlights how `pathlib` eliminates messy string slicing and cross-platform path concatenation bugs.

---

## Common Mistakes

### Mistake 1: Using String Concatenation (`+`) Instead of the Slash Operator (`/`)
Treating a `Path` object as a string and using `+` raises a `TypeError`. Always use `/` to join paths.

```python
# BROKEN:
# full_path = Path("/var/app") + "/data.txt"  # TypeError! ❌

# CORRECT:
full_path = Path("/var/app") / "data.txt"      # Clean Path Arithmetic! ✅
```

### Mistake 2: Forgetting `parents=True` and `exist_ok=True` in `mkdir()`
Calling `Path("a/b/c").mkdir()` fails with `FileNotFoundError` if parent folder `a/b` does not exist, and fails with `FileExistsError` if folder `c` already exists. Always pass `parents=True, exist_ok=True`.

---

## Best Practices

### Adopt `pathlib.Path` Uniformly Across All Codebases
Avoid mixing legacy `os.path` calls with `pathlib.Path`. Use `Path` objects as the standard interface throughout your application.

Good:
```python
def process_data_directory(dir_path: Path):
    for f in dir_path.glob("*.csv"):
        data = f.read_text(encoding="utf-8")
```

Avoid:
```python
import os
def process_data_directory(dir_path: str):
    for filename in os.listdir(dir_path):
        if filename.endswith(".csv"):
            with open(os.path.join(dir_path, filename), "r") as f:
                data = f.read()
```

---

## Performance Considerations

1. **`Path` Object Instantiation Overhead**: Instantiating a `Path` object takes ~1 microsecond. While negligible for standard applications, if you are scanning 10,000,000 file strings in a tight C-speed loop, raw `os.scandir()` strings are marginally faster.
2. **Lazy Glob Iteration**: Both `.glob()` and `.rglob()` return **lazy generators**. They yield `Path` objects one by one without buffering millions of directory entries in memory.

---

## Security Considerations

1. **Path Traversal Sandboxing**: Always use `.resolve()` and `.is_relative_to(base_dir)` to guarantee that user-provided file paths do not escape the application's root directory.
2. **File Permissions Management**: Use `path.chmod(0o600)` to restrict file read/write permissions to the owning process user for sensitive configuration files.

---

## Real-World Usage

- **Static Site Generators (MkDocs, Pelican)**: Scanning Markdown documentation trees recursively with `.rglob("*.md")`.
- **FastAPI File Upload Endpoints**: Storing uploaded file chunks in sandboxed user directories.
- **Continuous Integration (CI/CD) Scripts**: Cleaning build artifacts (`dist/`, `build/`, `.pytest_cache/`) before publishing wheels.

---

## Comparison: `os.path` vs `pathlib.Path`

| Capability | Legacy `os.path` | Modern `pathlib.Path` (Python 3.4+) |
|---|---|---|
| **Data Representation** | Raw `str` / `bytes` | **Rich `Path` Object** |
| **Path Joining** | `os.path.join(a, b)` | **Division Operator (`a / b`)** |
| **Direct File I/O** | Not supported | **`.read_text()` / `.write_text()`** |
| **Recursive Search**| `os.walk()` (Complex loop) | **`.rglob("*.ext")` (One-liner)** |
| **Path Sandboxing** | Manual prefix checks | **`.is_relative_to(root)`** |

---

## Advanced Concepts: Symlink Resolution and Strict Checking

`Path.resolve(strict=True)` resolves all symbolic links, relative `..` parent references, and validates that the file physically exists:

```python
symlink_path = Path("link_to_source.txt")

# If strict=True, raises FileNotFoundError if link is broken!
try:
    canonical_real_path = symlink_path.resolve(strict=True)
    print("Resolved Target Path:", canonical_real_path)
except FileNotFoundError:
    print("Broken symbolic link detected!")
```

---

## Exercises

### Exercise 1 — Beginner
Write a Python script that creates a folder `temp_docs/` in the current directory, writes `"Hello Pathlib!"` to a file named `note.txt` using `.write_text(encoding="utf-8")`, reads it back with `.read_text()`, and finally deletes the file with `.unlink()` and folder with `.rmdir()`.

### Exercise 2 — Intermediate
Write a function `find_large_files(directory: Path, size_mb_threshold: float) -> list[Path]` that recursively scans a directory using `.rglob()` and returns a list of all files whose size exceeds `size_mb_threshold`.

### Exercise 3 — Advanced
Build a `ProjectTreeVisualizer` class that recursively inspects a directory and prints a formatted terminal directory tree (similar to the Unix `tree` command), formatting folder names with `📁` and file sizes in KB.

---

## Mini Project: Enterprise Asset Organizer & Deep Directory Scanner CLI

### Requirements
Build a production-grade asset management tool named `asset_organizer.py` using `pathlib` that scans an unorganized messy inbox directory, categorizes files by extension into organized subfolders (`images/`, `documents/`, `code/`, `archives/`), handles filename collisions safely, and outputs a formatted migration summary.

### Implementation Blueprint
```python
import shutil
from pathlib import Path

class AssetOrganizer:
    CATEGORY_MAPPING = {
        "images": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"],
        "documents": [".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".csv", ".json"],
        "code": [".py", ".js", ".ts", ".html", ".css", ".sql", ".sh"],
        "archives": [".zip", ".tar", ".gz", ".7z", ".rar"],
    }

    def __init__(self, target_directory: Path):
        self.target_dir = Path(target_directory).resolve()
        if not self.target_dir.exists():
            raise FileNotFoundError(f"Directory '{self.target_dir}' does not exist.")

    def organize_assets(self) -> dict:
        print("=" * 65)
        print(f"       ORGANIZING ASSETS IN: {self.target_dir}")
        print("=" * 65)
        
        migration_stats = {cat: 0 for cat in self.CATEGORY_MAPPING}
        migration_stats["misc"] = 0
        
        # Scan only top-level files in target directory
        for item in list(self.target_dir.iterdir()):
            if item.is_file() and not item.name.startswith("."):
                ext = item.suffix.lower()
                category = "misc"
                
                # Determine category
                for cat_name, extensions in self.CATEGORY_MAPPING.items():
                    if ext in extensions:
                        category = cat_name
                        break
                        
                dest_dir = self.target_dir / category
                dest_dir.mkdir(exist_ok=True)
                
                # Resolve destination collision
                dest_file = dest_dir / item.name
                if dest_file.exists():
                    dest_file = dest_dir / f"{item.stem}_copy{item.suffix}"
                    
                # Move file
                shutil.move(str(item), str(dest_file))
                migration_stats[category] += 1
                print(f"  📦 [{category.upper():<10}] {item.name} -> {dest_file.name}")
                
        print("-" * 65)
        print("Migration Complete! Category Summary:")
        for cat, count in migration_stats.items():
            if count > 0:
                print(f"  -> {cat.title():<15}: {count:>4,d} files organized")
        print("=" * 65)
        
        return migration_stats

if __name__ == "__main__":
    inbox = Path("messy_inbox")
    inbox.mkdir(exist_ok=True)
    
    # Create sample messy files
    (inbox / "invoice_q2.pdf").touch()
    (inbox / "banner_logo.png").touch()
    (inbox / "app_worker.py").touch()
    (inbox / "database_dump.tar.gz").touch()
    (inbox / "notes.txt").touch()
    (inbox / "unknown_binary.dat").touch()
    
    organizer = AssetOrganizer(inbox)
    organizer.organize_assets()
```

---

## Summary

In this lesson, you mastered Python's modern `pathlib` filesystem architecture:
- `pathlib.Path` replaces legacy string-based `os.path` with **Rich Object-Oriented Path instances**.
- Use the **Division Operator `/`** for clean, cross-platform path concatenation: `base / "sub" / "file.txt"`.
- Inspect path attributes: **`.name`**, **`.stem`**, **`.suffix`**, **`.suffixes`**, and **`.parent`**.
- Safely create directories using **`.mkdir(parents=True, exist_ok=True)`**.
- Perform recursive file searches using **`.rglob("*.ext")`**.
- Use **`.is_relative_to()`** and **`.resolve()`** to permanently neutralize Path Traversal security vulnerabilities.

---

## Best Practices Checklist

- [ ] Use `pathlib.Path` as the default standard for all file and directory operations.
- [ ] Use `/` for path joining instead of string concatenation or `os.path.join()`.
- [ ] Always pass `parents=True, exist_ok=True` to `mkdir()`.
- [ ] Use `.read_text(encoding="utf-8")` and `.write_text(..., encoding="utf-8")` for direct file I/O.
- [ ] Validate user-supplied paths with `path.resolve().is_relative_to(root)` to prevent security escapes.

---

## What's Next?

Congratulations! You have completed **Module 10: File Handling & Pathlib**.
Now continue to **Module 11: Exception Handling**:
👉 **[Try, Except, Else & Finally](../exceptions/try-except-finally.md)** to master robust error handling, exception hierarchies, and clean recovery architectures.
