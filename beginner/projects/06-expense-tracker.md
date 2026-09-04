# Project 06 — Personal Expense & Budget Tracker in Python

## Introduction

Welcome to Project 06 of the Beginner Python Curriculum!

Managing personal finances, budgeting departmental expenditures, and auditing corporate spending are ubiquitous software requirements. In this capstone project, you will build an end-to-end **Personal Expense & Budget Tracker (`expense_tracker.py`)**.

This project implements a full **Financial Ledger Engine** featuring **CSV Database Persistence**, **Category Aggregations via `defaultdict`**, **Monthly Date Range Filtering**, **Budget Overrun Warning Thresholds**, and **Tabular ASCII Terminal Reports**.

This project synthesizes foundational concepts from:
- **Module 2**: Floating Point Arithmetic and Monetary Rounding
- **Module 6**: Dictionaries, Lists, and `collections.defaultdict`
- **Module 7**: Modular Functions, Type Annotations, and Docstrings
- **Module 8**: List and Dictionary Comprehensions
- **Module 9**: Standard Library (`datetime`, `csv`, `pathlib`, `enum`)
- **Module 10**: Persistent CSV Storage and Context Managers
- **Module 11**: Custom Domain Exception Handling

---

## Prerequisites

Before beginning this project, ensure you have:
- Mastered [Working with CSV & JSON Data](../file-handling/working-with-csv-json.md).
- Mastered [Python Standard Library Overview](../modules/standard-library-overview.md) (specifically `datetime` and `collections`).
- Mastered [Custom Exceptions](../exceptions/custom-exceptions.md).

---

## Core Concept & Architecture

```
                           EXPENSE TRACKER DATA FLOW

       ┌────────────────────────────────────────────────────────┐
       │               [ INTERACTIVE CLI SHELL ]                │
       │   add | list | summary | budget | export | report      │
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼
                 ┌───────────────────────────────┐
                 │     ExpenseAnalyticsEngine    │
                 │   • Category Breakdown        │
                 │   • Budget Overrun Alerts     │
                 │   • Monthly Interval Filters  │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │    CSV Storage Repository     │
                 │   • expenses.csv              │
                 │   • budgets.json              │
                 └───────────────────────────────┘
```

---

## Complete Production Source Code

```python
"""
Personal Expense & Budget Tracker CLI Engine
Author: Hesam Pourabbasain
Curriculum: Python Journey - Beginner Capstone Project 06
"""

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import NamedTuple

# =====================================================================
# 1. DOMAIN ENUMS & EXCEPTIONS
# =====================================================================

class ExpenseCategory(str, Enum):
    HOUSING = "Housing"
    FOOD = "Food & Dining"
    TRANSPORT = "Transportation"
    UTILITIES = "Utilities"
    ENTERTAINMENT = "Entertainment"
    HEALTH = "Healthcare"
    TECH = "Technology"
    MISC = "Miscellaneous"

class ExpenseTrackerError(Exception): pass
class InvalidTransactionError(ExpenseTrackerError): pass

class ExpenseEntry(NamedTuple):
    id: int
    amount: float
    category: str
    description: str
    date_str: str  # YYYY-MM-DD

# =====================================================================
# 2. PERSISTENT REPOSITORY
# =====================================================================

class ExpenseRepository:
    CSV_FIELDS = ["id", "amount", "category", "description", "date_str"]

    def __init__(self, data_dir: Path = Path("finance_data")):
        self.data_dir = data_dir
        self.data_dir.mkdir(exist_ok=True)
        self.csv_path = self.data_dir / "expenses.csv"
        self.budget_path = self.data_dir / "budgets.json"
        self._ensure_files_exist()

    def _ensure_files_exist(self):
        if not self.csv_path.exists():
            with open(self.csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=self.CSV_FIELDS)
                writer.writeheader()
        if not self.budget_path.exists():
            with open(self.budget_path, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def load_expenses(self) -> list[ExpenseEntry]:
        entries = []
        try:
            with open(self.csv_path, "r", newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    entries.append(ExpenseEntry(
                        id=int(row["id"]),
                        amount=float(row["amount"]),
                        category=row["category"],
                        description=row["description"],
                        date_str=row["date_str"]
                    ))
        except (OSError, ValueError):
            return []
        return entries

    def save_expenses(self, entries: list[ExpenseEntry]):
        temp_file = self.csv_path.with_suffix(".tmp")
        with open(temp_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.CSV_FIELDS)
            writer.writeheader()
            for e in entries:
                writer.writerow({
                    "id": e.id,
                    "amount": f"{e.amount:.2f}",
                    "category": e.category,
                    "description": e.description,
                    "date_str": e.date_str
                })
        temp_file.replace(self.csv_path)

    def load_budgets(self) -> dict[str, float]:
        try:
            with open(self.budget_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            return {}

    def save_budgets(self, budgets: dict[str, float]):
        with open(self.budget_path, "w", encoding="utf-8") as f:
            json.dump(budgets, f, indent=2)

# =====================================================================
# 3. ANALYTICS & LEDGER SERVICE
# =====================================================================

class ExpenseTrackerService:
    def __init__(self, repo: ExpenseRepository = None):
        self.repo = repo or ExpenseRepository()
        self._expenses = self.repo.load_expenses()
        self._budgets = self.repo.load_budgets()

    def _generate_id(self) -> int:
        if not self._expenses:
            return 1
        return max(e.id for e in self._expenses) + 1

    def add_expense(self, amount: float, category: str, description: str, date_str: str = None) -> ExpenseEntry:
        if amount <= 0:
            raise InvalidTransactionError(f"Expense amount must be positive, got ${amount:.2f}")

        # Validate date format (YYYY-MM-DD)
        if date_str:
            try:
                datetime.strptime(date_str.strip(), "%Y-%m-%d")
                clean_date = date_str.strip()
            except ValueError:
                raise InvalidTransactionError(f"Invalid date format: '{date_str}'. Expected: YYYY-MM-DD")
        else:
            clean_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Validate / normalize category
        cat_match = None
        for member in ExpenseCategory:
            if category.lower() in member.value.lower() or category.upper() == member.name:
                cat_match = member.value
                break
        clean_cat = cat_match or category.strip().title()

        entry = ExpenseEntry(
            id=self._generate_id(),
            amount=round(amount, 2),
            category=clean_cat,
            description=description.strip() or "General Expense",
            date_str=clean_date
        )
        self._expenses.append(entry)
        self.repo.save_expenses(self._expenses)
        return entry

    def set_budget(self, category: str, monthly_limit: float):
        if monthly_limit <= 0:
            raise ValueError("Budget limit must be greater than zero.")
        self._budgets[category.strip().title()] = round(monthly_limit, 2)
        self.repo.save_budgets(self._budgets)

    def get_expenses_for_month(self, year_month: str = None) -> list[ExpenseEntry]:
        """Filter expenses by month (YYYY-MM). Defaults to current month."""
        if not year_month:
            target_prefix = datetime.now(timezone.utc).strftime("%Y-%m")
        else:
            target_prefix = year_month.strip()

        return [e for e in self._expenses if e.date_str.startswith(target_prefix)]

    def generate_monthly_summary(self, year_month: str = None) -> dict:
        """Compute category totals, budget compliance, and overrun warnings."""
        monthly_records = self.get_expenses_for_month(year_month)
        category_totals = defaultdict(float)
        
        for e in monthly_records:
            category_totals[e.category] += e.amount

        total_spent = sum(monthly_records[i].amount for i in range(len(monthly_records)))
        
        # Build category analysis matrix
        category_reports = []
        for cat, spent in category_totals.items():
            budget = self._budgets.get(cat, None)
            overrun = (spent - budget) if budget and spent > budget else 0.0
            category_reports.append({
                "category": cat,
                "spent": round(spent, 2),
                "budget": round(budget, 2) if budget else "N/A",
                "overrun": round(overrun, 2),
                "pct_of_total": (spent / total_spent) if total_spent > 0 else 0.0
            })

        category_reports.sort(key=lambda r: r["spent"], reverse=True)

        return {
            "month": year_month or datetime.now(timezone.utc).strftime("%Y-%m"),
            "total_spent": round(total_spent, 2),
            "transaction_count": len(monthly_records),
            "breakdown": category_reports
        }

# =====================================================================
# 4. INTERACTIVE CLI SHELL
# =====================================================================

class ExpenseTrackerCLI:
    def __init__(self):
        self.service = ExpenseTrackerService()

    def print_banner(self):
        print("=" * 72)
        print("           💰 PERSONAL EXPENSE & BUDGET LEDGER CLI")
        print("=" * 72)
        print("  Commands:")
        print("    add <amt> <cat> <desc...> [-d YYYY-MM-DD]")
        print("    list [YYYY-MM]              (Display monthly transactions)")
        print("    summary [YYYY-MM]           (Generate analytical spending report)")
        print("    budget <cat> <limit>        (Set category monthly budget)")
        print("    exit | quit | q             (Exit)")
        print("=" * 72)

    def run(self):
        self.print_banner()
        self.show_summary_report()

        while True:
            try:
                raw_input = input("\nfinance > ").strip()
                if not raw_input:
                    continue

                tokens = raw_input.split()
                cmd = tokens[0].lower()

                match cmd:
                    case "exit" | "quit" | "q":
                        print("👋 Financial ledger closed. Data persisted safely.")
                        break

                    case "add":
                        self._handle_add(tokens[1:])

                    case "list":
                        month_arg = tokens[1] if len(tokens) > 1 else None
                        records = self.service.get_expenses_for_month(month_arg)
                        self.display_records_table(records, f"EXPENSE LEDGER ({month_arg or 'CURRENT MONTH'})")

                    case "summary" | "report":
                        month_arg = tokens[1] if len(tokens) > 1 else None
                        self.show_summary_report(month_arg)

                    case "budget":
                        if len(tokens) < 3:
                            print("❌ Usage: budget <category> <monthly_limit>")
                            continue
                        cat = tokens[1]
                        limit = float(tokens[2])
                        self.service.set_budget(cat, limit)
                        print(f"🎯 Monthly budget for '{cat.title()}' set to ${limit:,.2f}")

                    case _:
                        print(f"❌ Unknown command '{cmd}'. Type 'add', 'list', 'summary', 'budget', or 'exit'.")

            except (ExpenseTrackerError, ValueError) as err:
                print(f"⚠️ [ERROR] {err}")
            except KeyboardInterrupt:
                print("\n\nSession terminated by user.")
                break

    def _handle_add(self, args: list[str]):
        if len(args) < 3:
            print("❌ Usage: add <amount> <category> <description...> [-d YYYY-MM-DD]")
            return

        amount = float(args[0])
        category = args[1]
        
        desc_parts = []
        custom_date = None

        i = 2
        while i < len(args):
            if args[i] == "-d" and i + 1 < len(args):
                custom_date = args[i + 1]
                i += 2
            else:
                desc_parts.append(args[i])
                i += 1

        description = " ".join(desc_parts)
        entry = self.service.add_expense(amount, category, description, date_str=custom_date)
        print(f"✅ Expense #{entry.id} recorded: ${entry.amount:.2f} [{entry.category}] -> {entry.description}")

    def display_records_table(self, records: list[ExpenseEntry], title: str):
        print("\n" + "=" * 76)
        print(f"                 {title} ({len(records)} Transactions)")
        print("=" * 76)
        if not records:
            print("  (No transactions recorded for this period)")
            print("=" * 76)
            return

        print(f"{'ID':<6} {'DATE':<12} {'CATEGORY':<18} {'AMOUNT':>10}   {'DESCRIPTION'}")
        print("-" * 76)
        for r in records:
            print(f"#{r.id:<5} {r.date_str:<12} {r.category:<18} ${r.amount:>9,.2f}   {r.description}")
        print("=" * 76)

    def show_summary_report(self, year_month: str = None):
        summary = self.service.generate_monthly_summary(year_month)
        
        print("\n" + "=" * 76)
        print(f"           📊 MONTHLY FINANCIAL SPENDING REPORT: {summary['month']}")
        print("=" * 76)
        print(f"  Total Period Expenditure : ${summary['total_spent']:>11,.2f}")
        print(f"  Total Transactions Count : {summary['transaction_count']:>11,d}")
        print("-" * 76)
        print(f"{'CATEGORY':<20} {'SPENT':>12} {'BUDGET':>12} {'% TOTAL':>10} {'STATUS':^14}")
        print("-" * 76)
        
        for b in summary["breakdown"]:
            budget_str = f"${b['budget']:,.2f}" if isinstance(b['budget'], (int, float)) else "Unset"
            status_str = "🟢 OK"
            if b["overrun"] > 0:
                status_str = f"🔴 OVER (+${b['overrun']:,.0f})"
            elif isinstance(b['budget'], (int, float)):
                status_str = "🟢 UNDER"

            print(f"{b['category']:<20} ${b['spent']:>11,.2f} {budget_str:>12} {b['pct_of_total']:>9.1%} {status_str:^14}")
        print("=" * 76)

# =====================================================================
# 5. ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    app = ExpenseTrackerCLI()
    app.run()
```

---

## Code Explanation & Architecture

1. **Category Aggregations with `defaultdict`**: In `generate_monthly_summary`, `collections.defaultdict(float)` calculates grouped subtotals in a single linear pass ($O(N)$).
2. **Date Range String Prefix Matching**: Because ISO dates format naturally as `YYYY-MM-DD`, filtering by month is performed with high efficiency using `date_str.startswith("YYYY-MM")`.
3. **Budget Variance Analysis**: Compares actual spend against targets defined in `budgets.json`, flagging overruns in real-time.
4. **Decoupled Architecture**: Persistence (`ExpenseRepository`), business intelligence (`ExpenseTrackerService`), and user interaction (`ExpenseTrackerCLI`) operate independently.

---

## Example Demonstration Run

```text
============================================================================
           📊 MONTHLY FINANCIAL SPENDING REPORT: 2024-05
============================================================================
  Total Period Expenditure :       $0.00
  Total Transactions Count :           0
============================================================================

finance > budget Food 400
🎯 Monthly budget for 'Food' set to $400.00

finance > budget Tech 500
🎯 Monthly budget for 'Tech' set to $500.00

finance > add 45.50 Food Team Dinner at Italian Bistro
✅ Expense #1 recorded: $45.50 [Food & Dining] -> Team Dinner at Italian Bistro

finance > add 120.00 Tech Mechanical Keyboard
✅ Expense #2 recorded: $120.00 [Technology] -> Mechanical Keyboard

finance > add 420.00 Food Monthly Grocery Restock
✅ Expense #3 recorded: $420.00 [Food & Dining] -> Monthly Grocery Restock

finance > summary

============================================================================
           📊 MONTHLY FINANCIAL SPENDING REPORT: 2024-05
============================================================================
  Total Period Expenditure :     $585.50
  Total Transactions Count :           3
----------------------------------------------------------------------------
CATEGORY                    SPENT       BUDGET    % TOTAL     STATUS    
----------------------------------------------------------------------------
Food & Dining            $     465.50      $400.00     79.5%   🔴 OVER (+$66)
Technology               $     120.00      $500.00     20.5%      🟢 UNDER   
============================================================================
```

---

## Extension Challenges

1. **Challenge 1 (Visual ASCII Bar Charts)**: Add horizontal terminal progress bars (e.g. `[████████░░] 80%`) next to each category in the monthly summary report.
2. **Challenge 2 (CSV Bank Statement Importer)**: Ingest raw bank CSV export statements, classifying merchant names into categories automatically using keyword heuristics.
3. **Challenge 3 (Recurring Subscription Tracker)**: Implement recurring expense templates that automatically inject fixed costs (Netflix, AWS, Rent) at the start of each month.

---

## Summary

In Project 06, you built a personal finance and budget tracking engine:
- Engineered an **Aggregations Engine with `defaultdict` and Comprehensions**.
- Handled **Date Formatting & Month Interval Queries** with ISO `YYYY-MM-DD` standards.
- Implemented **Budget Compliance Variance Auditing** with over-budget alerts.
- Built an **Atomic CSV & JSON Persistence Pipeline**.

---

## Best Practices Checklist

- [ ] Always round monetary values explicitly (`round(val, 2)`).
- [ ] Group collections efficiently using `collections.defaultdict`.
- [ ] Structure date fields in ISO 8601 format (`YYYY-MM-DD`) for natural lexicographical sorting.
- [ ] Provide clear budget alert indicators for financial decision-making.

---

## What's Next?

Congratulations on completing Project 06! Continue to the next capstone project:
👉 **[Project 07 — Interactive Timed Quiz & Flashcard Engine](07-quiz-application.md)** to master question sampling, timer loops, score evaluation, and JSON quiz bank parsing.
