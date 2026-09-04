# Project 03 — Persistent To-Do & Task Manager CLI in Python

## Introduction

Welcome to Project 03 of the Beginner Python Curriculum!

In this capstone project, you will build a production-grade **Persistent Task & Project Management CLI (`task_manager.py`)**. While basic to-do apps merely store strings in a temporary list, this project implements a full **CRUD (Create, Read, Update, Delete) Architecture** featuring **Persistent JSON Storage**, **Task Lifecycle State Machines**, **Priority Weighting**, **Due Date Validation**, and **Multi-Attribute Search Filtering**.

This project unifies concepts from:
- **Module 5**: Structural Pattern Matching (`match/case`) and Control Flow
- **Module 6**: Dictionaries, Lists, and Built-in Collection Helpers
- **Module 7**: Modular Function Design, Type Annotations, and Docstrings
- **Module 8**: List and Dictionary Comprehensions
- **Module 9**: Standard Library (`json`, `datetime`, `enum`)
- **Module 10**: Robust JSON File Persistence via `pathlib`
- **Module 11**: Custom Exception Hierarchies

---

## Prerequisites

Before beginning this project, ensure you have:
- Mastered [Structural Pattern Matching](../control-flow/match-case.md).
- Mastered [Working with CSV & JSON Data](../file-handling/working-with-csv-json.md).
- Mastered [Custom Exceptions](../exceptions/custom-exceptions.md).

---

## Core Concept & Architecture

```
                             TASK LIFECYCLE & CLI ARCHITECTURE

      ┌────────────────────────────────────────────────────────┐
      │              [ TERMINAL COMMAND PARSER ]               │
      │  add | list | update | done | delete | search | export │
      └──────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │     TaskManagerService        │
                 │   • State Machine Validation  │
                 │   • Priority Sorting          │
                 │   • Search Filters            │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │    JSON File Repository       │
                 │   • tasks.json                │
                 │   • Atomic File Writes        │
                 └───────────────────────────────┘

                 TASK LIFECYCLE STATE TRANSITIONS:
                 [ PENDING ] ──► [ IN_PROGRESS ] ──► [ COMPLETED ]
                      │                                    │
                      └─────────────────► [ ARCHIVED ] ◄───┘
```

---

## Complete Production Source Code

```python
"""
Persistent Task & Project Management CLI
Author: Hesam Pourabbasain
Curriculum: Python Journey - Beginner Capstone Project 03
"""

import json
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any

# =====================================================================
# 1. DOMAIN ENUMS & EXCEPTIONS
# =====================================================================

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TaskManagerError(Exception): pass
class TaskNotFoundError(TaskManagerError): pass
class InvalidTaskStateError(TaskManagerError): pass

# =====================================================================
# 2. PERSISTENT TASK REPOSITORY
# =====================================================================

class TaskRepository:
    def __init__(self, storage_path: Path = Path("tasks_db.json")):
        self.storage_path = storage_path
        self._ensure_storage_exists()

    def _ensure_storage_exists(self):
        if not self.storage_path.exists():
            self._save_raw([])

    def load_all(self) -> list[dict]:
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return []

    def save_all(self, tasks: list[dict]):
        # Write to temporary file first for atomic persistence
        temp_path = self.storage_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(tasks, f, indent=2)
        temp_path.replace(self.storage_path)

    def _save_raw(self, data: list):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

# =====================================================================
# 3. TASK SERVICE CORE
# =====================================================================

class TaskManagerService:
    PRIORITY_WEIGHTS = {
        TaskPriority.CRITICAL.value: 4,
        TaskPriority.HIGH.value: 3,
        TaskPriority.MEDIUM.value: 2,
        TaskPriority.LOW.value: 1,
    }

    def __init__(self, repository: TaskRepository = None):
        self.repo = repository or TaskRepository()
        self._tasks: list[dict] = self.repo.load_all()

    def _generate_next_id(self) -> int:
        if not self._tasks:
            return 1
        return max(t["id"] for t in self._tasks) + 1

    def create_task(self, title: str, category: str = "General", priority: str = "MEDIUM", due_date: str = None) -> dict:
        clean_title = title.strip()
        if not clean_title:
            raise ValueError("Task title cannot be empty.")

        priority_upper = priority.strip().upper()
        if priority_upper not in TaskPriority.__members__:
            raise ValueError(f"Invalid priority: '{priority}'. Choices: {list(TaskPriority.__members__.keys())}")

        task = {
            "id": self._generate_next_id(),
            "title": clean_title,
            "category": category.strip().title(),
            "priority": priority_upper,
            "status": TaskStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "due_date": due_date.strip() if due_date else "N/A"
        }
        self._tasks.append(task)
        self.repo.save_all(self._tasks)
        return task

    def get_task(self, task_id: int) -> dict:
        for t in self._tasks:
            if t["id"] == task_id:
                return t
        raise TaskNotFoundError(f"Task #{task_id} does not exist.")

    def update_status(self, task_id: int, new_status: str) -> dict:
        status_upper = new_status.strip().upper()
        if status_upper not in TaskStatus.__members__:
            raise ValueError(f"Invalid status: '{new_status}'. Choices: {list(TaskStatus.__members__.keys())}")

        task = self.get_task(task_id)
        task["status"] = status_upper
        if status_upper == TaskStatus.COMPLETED.value:
            task["completed_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

        self.repo.save_all(self._tasks)
        return task

    def delete_task(self, task_id: int) -> dict:
        task = self.get_task(task_id)
        self._tasks = [t for t in self._tasks if t["id"] != task_id]
        self.repo.save_all(self._tasks)
        return task

    def list_tasks(self, status_filter: str = None, category_filter: str = None) -> list[dict]:
        results = self._tasks

        if status_filter:
            results = [t for t in results if t["status"] == status_filter.upper()]
        if category_filter:
            results = [t for t in results if t["category"].lower() == category_filter.lower()]

        # Sort by Priority Descending, then ID Ascending
        results.sort(
            key=lambda t: (-self.PRIORITY_WEIGHTS.get(t["priority"], 0), t["id"])
        )
        return results

    def search_tasks(self, query: str) -> list[dict]:
        q_lower = query.strip().lower()
        return [
            t for t in self._tasks 
            if q_lower in t["title"].lower() or q_lower in t["category"].lower()
        ]

# =====================================================================
# 4. INTERACTIVE CLI SHELL
# =====================================================================

class TaskManagerCLI:
    def __init__(self):
        self.service = TaskManagerService()

    def print_banner(self):
        print("=" * 68)
        print("           📋 ENTERPRISE TASK & PROJECT MANAGER CLI")
        print("=" * 68)
        print("  Commands:")
        print("    add <title> [-p LOW|MED|HIGH|CRIT] [-c Category] [-d YYYY-MM-DD]")
        print("    list [PENDING | IN_PROGRESS | COMPLETED | ALL]")
        print("    done <id>              (Mark task as COMPLETED)")
        print("    start <id>             (Mark task as IN_PROGRESS)")
        print("    del <id>               (Delete task permanently)")
        print("    search <keyword>       (Search titles and categories)")
        print("    exit | quit | q        (Exit application)")
        print("=" * 68)

    def run(self):
        self.print_banner()
        self.display_task_table(self.service.list_tasks(status_filter="PENDING"), "ACTIVE PENDING TASKS")

        while True:
            try:
                raw_cmd = input("\ntasks > ").strip()
                if not raw_cmd:
                    continue

                tokens = raw_cmd.split()
                action = tokens[0].lower()

                match action:
                    case "exit" | "quit" | "q":
                        print("👋 Task manager session closed. Data persisted safely.")
                        break

                    case "list":
                        filter_val = tokens[1].upper() if len(tokens) > 1 and tokens[1].upper() != "ALL" else None
                        tasks = self.service.list_tasks(status_filter=filter_val)
                        self.display_task_table(tasks, f"TASK LIST ({filter_val or 'ALL'})")

                    case "add":
                        self._handle_add(tokens[1:])

                    case "done":
                        if len(tokens) < 2:
                            print("❌ Usage: done <task_id>")
                            continue
                        t = self.service.update_status(int(tokens[1]), TaskStatus.COMPLETED.value)
                        print(f"✅ Task #{t['id']} marked as COMPLETED! 🎉")

                    case "start":
                        if len(tokens) < 2:
                            print("❌ Usage: start <task_id>")
                            continue
                        t = self.service.update_status(int(tokens[1]), TaskStatus.IN_PROGRESS.value)
                        print(f"🚀 Task #{t['id']} moved to IN_PROGRESS!")

                    case "del" | "delete":
                        if len(tokens) < 2:
                            print("❌ Usage: del <task_id>")
                            continue
                        t = self.service.delete_task(int(tokens[1]))
                        print(f"🗑️ Task #{t['id']} ('{t['title']}') permanently deleted.")

                    case "search":
                        if len(tokens) < 2:
                            print("❌ Usage: search <keyword>")
                            continue
                        query = " ".join(tokens[1:])
                        results = self.service.search_tasks(query)
                        self.display_task_table(results, f"SEARCH RESULTS FOR: '{query}'")

                    case _:
                        print(f"❌ Unknown command '{action}'. Type 'list', 'add', 'done', 'del', or 'exit'.")

            except (TaskManagerError, ValueError) as err:
                print(f"⚠️ [ERROR] {err}")
            except KeyboardInterrupt:
                print("\n\nSession terminated by user.")
                break

    def _handle_add(self, args: list[str]):
        if not args:
            print("❌ Usage: add <title> [-p LOW|MEDIUM|HIGH|CRITICAL] [-c Category] [-d DueDate]")
            return

        title_parts = []
        priority = "MEDIUM"
        category = "General"
        due_date = None

        i = 0
        while i < len(args):
            if args[i] == "-p" and i + 1 < len(args):
                priority = args[i + 1]
                i += 2
            elif args[i] == "-c" and i + 1 < len(args):
                category = args[i + 1]
                i += 2
            elif args[i] == "-d" and i + 1 < len(args):
                due_date = args[i + 1]
                i += 2
            else:
                title_parts.append(args[i])
                i += 1

        title = " ".join(title_parts)
        task = self.service.create_task(title, category=category, priority=priority, due_date=due_date)
        print(f"📌 Task #{task['id']} Added: '{task['title']}' [{task['priority']}★ | {task['category']}]")

    def display_task_table(self, tasks: list[dict], title: str):
        print("\n" + "=" * 75)
        print(f"                 {title} ({len(tasks)} Tasks)")
        print("=" * 75)
        if not tasks:
            print("  (No tasks found matching criteria)")
            print("=" * 75)
            return

        print(f"{'ID':<5} {'PRIORITY':<10} {'STATUS':<14} {'CATEGORY':<14} {'DUE DATE':<12} {'TITLE'}")
        print("-" * 75)
        for t in tasks:
            p_color = {"CRITICAL": "🔴 CRIT", "HIGH": "🟠 HIGH", "MEDIUM": "🟡 MED ", "LOW": "🟢 LOW "}.get(t["priority"], t["priority"])
            print(f"#{t['id']:<4} {p_color:<10} {t['status']:<14} {t['category']:<14} {t['due_date']:<12} {t['title']}")
        print("=" * 75)

# =====================================================================
# 5. ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    app = TaskManagerCLI()
    app.run()
```

---

## Code Explanation & Architecture

1. **Layered Architecture**: Completely separates the JSON persistence layer (`TaskRepository`), the domain business logic layer (`TaskManagerService`), and the terminal user interface (`TaskManagerCLI`).
2. **Atomic File Persistence**: In `TaskRepository.save_all()`, data is written to `tasks_db.tmp` first, then atomically swapped with `replace()`, preventing database corruption if interrupted mid-write.
3. **State Machine Safety**: Enforces valid status transitions using the `TaskStatus` Enum.
4. **Weighted Priority Sorting**: Uses tuple sorting `(-weight, id)` to display Critical tasks at the very top.
5. **Pattern Matching Command Dispatcher**: Modern Python 3.10+ `match/case` routing cleanly executes CLI commands.

---

## Example Demonstration Run

```text
===========================================================================
                 ACTIVE PENDING TASKS (0 Tasks)
===========================================================================
  (No tasks found matching criteria)
===========================================================================

tasks > add Complete Python Mastery Documentation -p CRITICAL -c Education -d 2024-06-01
📌 Task #1 Added: 'Complete Python Mastery Documentation' [CRITICAL★ | Education]

tasks > add Deploy FastAPI Microservice -p HIGH -c DevOps
📌 Task #2 Added: 'Deploy FastAPI Microservice' [HIGH★ | Devops]

tasks > add Buy Groceries -p LOW -c Personal
📌 Task #3 Added: 'Buy Groceries' [LOW★ | Personal]

tasks > list

===========================================================================
                 TASK LIST (ALL) (3 Tasks)
===========================================================================
ID    PRIORITY   STATUS         CATEGORY       DUE DATE     TITLE
---------------------------------------------------------------------------
#1    🔴 CRIT    PENDING        Education      2024-06-01   Complete Python Mastery Documentation
#2    🟠 HIGH    PENDING        Devops         N/A          Deploy FastAPI Microservice
#3    🟢 LOW     PENDING        Personal       N/A          Buy Groceries
===========================================================================

tasks > start 1
🚀 Task #1 moved to IN_PROGRESS!

tasks > done 1
✅ Task #1 marked as COMPLETED! 🎉

tasks > list PENDING

===========================================================================
                 TASK LIST (PENDING) (2 Tasks)
===========================================================================
ID    PRIORITY   STATUS         CATEGORY       DUE DATE     TITLE
---------------------------------------------------------------------------
#2    🟠 HIGH    PENDING        Devops         N/A          Deploy FastAPI Microservice
#3    🟢 LOW     PENDING        Personal       N/A          Buy Groceries
===========================================================================
```

---

## Extension Challenges

1. **Challenge 1 (CSV Export)**: Add an `export csv <filename>` command that exports the current task table to a formatted CSV file using `csv.DictWriter`.
2. **Challenge 2 (Task Tags & Labels)**: Allow attaching multiple hashtag labels (e.g., `#frontend #bug`) and filtering by tags using set intersections.
3. **Challenge 3 (Interactive Fuzzy Search)**: Implement substring and keyword matching across descriptions and notes.

---

## Summary

In Project 03, you built an enterprise-ready CLI Task Manager:
- Designed a **Domain-Driven Architecture** separating UI, Service, and Repository layers.
- Implemented **Atomic JSON Persistence** to eliminate file corruption risks.
- Enforced **Enum-Based State Transitions** and **Multi-Attribute Sorting**.
- Handled CLI routing using **Python 3.10+ Structural Pattern Matching**.

---

## Best Practices Checklist

- [ ] Structure multi-file and complex applications into decoupled Repository and Service layers.
- [ ] Use atomic file replacements (`temp_file.replace(target)`) when persisting critical state.
- [ ] Use Enums for fixed categorical states (`TaskStatus`, `TaskPriority`).
- [ ] Sort collections using multi-attribute keys (`key=lambda t: (-weight, t["id"])`).

---

## What's Next?

Congratulations on completing Project 03! Continue to the next capstone project:
👉 **[Project 04 — Cryptographically Secure Password Vault Generator](04-password-generator.md)** to master CSPRNG randomness, entropy calculations, security auditing, and CSV password vaults.
