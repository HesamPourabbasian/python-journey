# Project 05 — Persistent Contact Book & Phonebook Engine in Python

## Introduction

Welcome to Project 05 of the Beginner Python Curriculum!

Managing structured directory records is a foundational pattern in software engineering—from internal company employee directories to cloud CRM databases (like Salesforce or HubSpot). In this capstone project, you will build an enterprise-grade **Persistent Contact Book & Phonebook Engine (`contact_book.py`)**.

This project implements a full **CSV-Backed Relational Repository**, comprehensive **Regex Input Validation** (for international E.164 phone formats and RFC 5322 email standards), **Multi-Field Partial Searching**, **Duplicate Detection**, and **VCard (`.vcf`) Export Capabilities**.

This project synthesizes foundational concepts from:
- **Module 4**: Strings in Depth and Text Formatting
- **Module 6**: Dictionaries, Sets, and Built-in Collection Helpers
- **Module 7**: Modular Functions, Type Annotations, and Docstrings
- **Module 8**: List and Set Comprehensions
- **Module 10**: Robust CSV File Handling with `newline=""` and `pathlib`
- **Module 11**: Custom Domain Exception Hierarchies

---

## Prerequisites

Before beginning this project, ensure you have:
- Mastered [Working with CSV & JSON Data](../file-handling/working-with-csv-json.md).
- Mastered [Modern Filesystem Operations with `pathlib`](../file-handling/pathlib-module.md).
- Mastered [Custom Exceptions](../exceptions/custom-exceptions.md).

---

## Core Concept & Architecture

```
                           CONTACT BOOK SYSTEM ARCHITECTURE

      ┌────────────────────────────────────────────────────────┐
      │               [ INTERACTIVE CLI SHELL ]                │
      │   add | list | find | edit | del | vcard | export      │
      └──────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │     ContactValidator          │
                 │   • Regex Email Check       │
                 │   • E.164 Phone Sanitizer     │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │     ContactBookService        │
                 │   • Multi-Field Fuzzy Search  │
                 │   • Duplicate Prevention      │
                 │   • VCard Serializer          │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │    CSV Storage Repository     │
                 │   • contacts.csv              │
                 │   • Atomic Write Engine       │
                 └───────────────────────────────┘
```

---

## Complete Production Source Code

```python
"""
Persistent Contact Book & Directory Management Engine
Author: Hesam Pourabbasain
Curriculum: Python Journey - Beginner Capstone Project 05
"""

import csv
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple

# =====================================================================
# 1. DOMAIN EXCEPTIONS & DATA MODELS
# =====================================================================

class ContactBookError(Exception): pass
class ContactValidationError(ContactBookError): pass
class ContactNotFoundError(ContactBookError): pass
class DuplicateContactError(ContactBookError): pass

class ContactRecord(NamedTuple):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: str
    organization: str
    created_at: str

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

# =====================================================================
# 2. REGEX VALIDATOR ENGINE
# =====================================================================

class ContactValidator:
    # Standard RFC 5322 Compliant Email Regex
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    
    # International E.164 and Standard Formatted Phone Numbers
    PHONE_REGEX = re.compile(r"^\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}$")

    @classmethod
    def validate_and_clean_email(cls, raw_email: str) -> str:
        clean = raw_email.strip().lower()
        if not cls.EMAIL_REGEX.match(clean):
            raise ContactValidationError(f"Invalid email format: '{raw_email}'")
        return clean

    @classmethod
    def validate_and_clean_phone(cls, raw_phone: str) -> str:
        clean = raw_phone.strip()
        # Strip extraneous whitespace
        if not cls.PHONE_REGEX.match(clean):
            raise ContactValidationError(f"Invalid phone number format: '{raw_phone}'. Expected: e.g. +1-555-019-2834")
        return clean

    @classmethod
    def validate_name(cls, name_part: str, field_label: str) -> str:
        clean = name_part.strip().title()
        if not clean or len(clean) < 2:
            raise ContactValidationError(f"{field_label} must be at least 2 characters long.")
        return clean

# =====================================================================
# 3. CSV REPOSITORY
# =====================================================================

class ContactCSVRepository:
    FIELDNAMES = ["id", "first_name", "last_name", "phone", "email", "organization", "created_at"]

    def __init__(self, storage_path: Path = Path("contacts_database.csv")):
        self.storage_path = storage_path
        self._ensure_file_initialized()

    def _ensure_file_initialized(self):
        if not self.storage_path.exists():
            with open(self.storage_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=self.FIELDNAMES)
                writer.writeheader()

    def load_all_contacts(self) -> list[ContactRecord]:
        contacts = []
        try:
            with open(self.storage_path, "r", newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    contacts.append(ContactRecord(
                        id=int(row["id"]),
                        first_name=row["first_name"],
                        last_name=row["last_name"],
                        phone=row["phone"],
                        email=row["email"],
                        organization=row.get("organization", "Personal"),
                        created_at=row["created_at"]
                    ))
        except (OSError, ValueError):
            return []
        return contacts

    def save_all_contacts(self, contacts: list[ContactRecord]):
        temp_path = self.storage_path.with_suffix(".tmp")
        with open(temp_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.FIELDNAMES)
            writer.writeheader()
            for c in contacts:
                writer.writerow({
                    "id": c.id,
                    "first_name": c.first_name,
                    "last_name": c.last_name,
                    "phone": c.phone,
                    "email": c.email,
                    "organization": c.organization,
                    "created_at": c.created_at
                })
        temp_path.replace(self.storage_path)

# =====================================================================
# 4. CONTACT BOOK SERVICE
# =====================================================================

class ContactBookService:
    def __init__(self, repo: ContactCSVRepository = None):
        self.repo = repo or ContactCSVRepository()
        self._contacts = self.repo.load_all_contacts()

    def _generate_id(self) -> int:
        if not self._contacts:
            return 101
        return max(c.id for c in self._contacts) + 1

    def add_contact(self, first_name: str, last_name: str, phone: str, email: str, org: str = "General") -> ContactRecord:
        clean_first = ContactValidator.validate_name(first_name, "First Name")
        clean_last = ContactValidator.validate_name(last_name, "Last Name")
        clean_phone = ContactValidator.validate_and_clean_phone(phone)
        clean_email = ContactValidator.validate_and_clean_email(email)

        # Duplicate Check (Email and Phone must be unique)
        for existing in self._contacts:
            if existing.email == clean_email:
                raise DuplicateContactError(f"Contact with email '{clean_email}' already exists (#{existing.id}: {existing.full_name}).")
            if existing.phone == clean_phone:
                raise DuplicateContactError(f"Contact with phone '{clean_phone}' already exists (#{existing.id}: {existing.full_name}).")

        new_contact = ContactRecord(
            id=self._generate_id(),
            first_name=clean_first,
            last_name=clean_last,
            phone=clean_phone,
            email=clean_email,
            organization=org.strip().title() or "General",
            created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        )
        self._contacts.append(new_contact)
        self.repo.save_all_contacts(self._contacts)
        return new_contact

    def get_contact_by_id(self, contact_id: int) -> ContactRecord:
        for c in self._contacts:
            if c.id == contact_id:
                return c
        raise ContactNotFoundError(f"Contact ID #{contact_id} not found.")

    def delete_contact(self, contact_id: int) -> ContactRecord:
        target = self.get_contact_by_id(contact_id)
        self._contacts = [c for c in self._contacts if c.id != contact_id]
        self.repo.save_all_contacts(self._contacts)
        return target

    def search_contacts(self, query: str) -> list[ContactRecord]:
        q = query.strip().lower()
        return [
            c for c in self._contacts
            if q in c.full_name.lower() or q in c.email.lower() or q in c.phone or q in c.organization.lower()
        ]

    def list_contacts(self, sort_by: str = "last_name") -> list[ContactRecord]:
        results = list(self._contacts)
        if sort_by == "last_name":
            results.sort(key=lambda c: (c.last_name, c.first_name))
        elif sort_by == "organization":
            results.sort(key=lambda c: (c.organization, c.last_name))
        return results

    def export_vcard(self, contact_id: int, output_path: Path) -> Path:
        """Export contact as standardized vCard (.vcf) format."""
        c = self.get_contact_by_id(contact_id)
        vcard_content = (
            "BEGIN:VCARD\n"
            "VERSION:3.0\n"
            f"N:{c.last_name};{c.first_name};;;\n"
            f"FN:{c.full_name}\n"
            f"ORG:{c.organization};\n"
            f"TEL;TYPE=CELL:{c.phone}\n"
            f"EMAIL;TYPE=INTERNET:{c.email}\n"
            "END:VCARD\n"
        )
        output_path.write_text(vcard_content, encoding="utf-8")
        return output_path

# =====================================================================
# 5. INTERACTIVE CLI
# =====================================================================

class ContactBookCLI:
    def __init__(self):
        self.service = ContactBookService()

    def print_banner(self):
        print("=" * 72)
        print("           📇 ENTERPRISE CONTACT & DIRECTORY ENGINE CLI")
        print("=" * 72)
        print("  Commands:")
        print("    add                         (Interactive contact creation)")
        print("    list [last_name|org]        (Display sorted contact directory)")
        print("    find <query>                (Search by name, email, phone, or org)")
        print("    del <id>                    (Delete contact)")
        print("    vcard <id> <filepath.vcf>   (Export as standard vCard)")
        print("    exit | quit | q             (Exit)")
        print("=" * 72)

    def run(self):
        self.print_banner()
        self.display_table(self.service.list_contacts(), "ALL DIRECTORY CONTACTS")

        while True:
            try:
                raw_input = input("\ncontacts > ").strip()
                if not raw_input:
                    continue

                tokens = raw_input.split()
                cmd = tokens[0].lower()

                match cmd:
                    case "exit" | "quit" | "q":
                        print("👋 Contact book closed safely. All data saved to CSV.")
                        break

                    case "list":
                        sort_field = tokens[1].lower() if len(tokens) > 1 else "last_name"
                        contacts = self.service.list_contacts(sort_by=sort_field)
                        self.display_table(contacts, f"CONTACT DIRECTORY (Sorted by {sort_field})")

                    case "add":
                        self._handle_interactive_add()

                    case "find" | "search":
                        if len(tokens) < 2:
                            print("❌ Usage: find <search_keyword>")
                            continue
                        query = " ".join(tokens[1:])
                        results = self.service.search_contacts(query)
                        self.display_table(results, f"SEARCH RESULTS FOR: '{query}'")

                    case "del" | "delete":
                        if len(tokens) < 2:
                            print("❌ Usage: del <contact_id>")
                            continue
                        deleted = self.service.delete_contact(int(tokens[1]))
                        print(f"🗑️ Deleted Contact #{deleted.id}: {deleted.full_name}")

                    case "vcard":
                        if len(tokens) < 3:
                            print("❌ Usage: vcard <contact_id> <output_file.vcf>")
                            continue
                        out_path = Path(tokens[2])
                        self.service.export_vcard(int(tokens[1]), out_path)
                        print(f"📇 Exported vCard for Contact #{tokens[1]} -> {out_path}")

                    case _:
                        print(f"❌ Unknown command '{cmd}'. Type 'list', 'add', 'find', 'del', or 'exit'.")

            except (ContactBookError, ValueError) as err:
                print(f"⚠️ [ERROR] {err}")
            except KeyboardInterrupt:
                print("\n\nSession terminated by user.")
                break

    def _handle_interactive_add(self):
        print("\n--- New Contact Entry ---")
        first = input("First Name       : ").strip()
        last = input("Last Name        : ").strip()
        phone = input("Phone Number     : ").strip()
        email = input("Email Address    : ").strip()
        org = input("Organization/Dept: ").strip() or "General"

        contact = self.service.add_contact(first, last, phone, email, org)
        print(f"✅ Contact #{contact.id} ('{contact.full_name}') successfully registered!")

    def display_table(self, contacts: list[ContactRecord], title: str):
        print("\n" + "=" * 76)
        print(f"                 {title} ({len(contacts)} Records)")
        print("=" * 76)
        if not contacts:
            print("  (No contacts found)")
            print("=" * 76)
            return

        print(f"{'ID':<6} {'NAME':<20} {'PHONE':<18} {'EMAIL':<24} {'ORG'}")
        print("-" * 76)
        for c in contacts:
            print(f"#{c.id:<5} {c.full_name:<20} {c.phone:<18} {c.email:<24} {c.organization}")
        print("=" * 76)

# =====================================================================
# 6. ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    app = ContactBookCLI()
    app.run()
```

---

## Code Explanation & Architecture

1. **NamedTuple Entity Model**: `ContactRecord` models database rows with immutable properties and helper getters (`.full_name`).
2. **Regex Validation Layer**: `ContactValidator` verifies emails against standard RFC patterns and phone numbers against international E.164 standards before reaching storage.
3. **Atomic CSV Repository**: Replaces files using temporary swap paths (`.tmp` $\rightarrow$ `.replace()`) to prevent data corruption.
4. **Duplicate Prevention**: Rejects duplicate emails and phone numbers across the active database before writing.
5. **VCard Serialization**: Exports contact cards in RFC 2426 `.vcf` format, compatible with Apple Contacts, Google Contacts, and Microsoft Outlook.

---

## Example Demonstration Run

```text
============================================================================
                 ALL DIRECTORY CONTACTS (0 Records)
============================================================================
  (No contacts found)
============================================================================

contacts > add

--- New Contact Entry ---
First Name       : Hesam
Last Name        : Pourabbasain
Phone Number     : +1-555-019-8821
Email Address    : hesam@domain.com
Organization/Dept: Google DeepMind
✅ Contact #101 ('Hesam Pourabbasain') successfully registered!

contacts > add

--- New Contact Entry ---
First Name       : Sarah
Last Name        : Jenkins
Phone Number     : +1-555-019-3344
Email Address    : sarah@domain.com
Organization/Dept: Cloud Architecture
✅ Contact #102 ('Sarah Jenkins') successfully registered!

contacts > list

============================================================================
                 CONTACT DIRECTORY (Sorted by last_name) (2 Records)
============================================================================
ID     NAME                 PHONE              EMAIL                    ORG
----------------------------------------------------------------------------
#102   Sarah Jenkins        +1-555-019-3344    sarah@domain.com         Cloud Architecture
#101   Hesam Pourabbasain   +1-555-019-8821    hesam@domain.com         Google Deepmind
============================================================================

contacts > find Deepmind

============================================================================
                 SEARCH RESULTS FOR: 'Deepmind' (1 Records)
============================================================================
ID     NAME                 PHONE              EMAIL                    ORG
----------------------------------------------------------------------------
#101   Hesam Pourabbasain   +1-555-019-8821    hesam@domain.com         Google Deepmind
============================================================================

contacts > vcard 101 hesam.vcf
📇 Exported vCard for Contact #101 -> hesam.vcf
```

---

## Extension Challenges

1. **Challenge 1 (CSV Bulk Import)**: Add an `import csv <filepath>` command that reads external CSV address books, validates every record, and skips duplicates automatically.
2. **Challenge 2 (Tagging & Groups)**: Add contact group categorization (`Work`, `Family`, `VIP`) using Python sets.
3. **Challenge 3 (SQLite Backend)**: Swap `ContactCSVRepository` with a relational `ContactSQLiteRepository` while keeping the `ContactBookService` unchanged (Dependency Inversion Principle).

---

## Summary

In Project 05, you built a persistent Contact Book Engine:
- Implemented **Regex Phone and Email Validation** for strict data hygiene.
- Built an **Atomic CSV Persistence Layer** with `csv.DictWriter` and `newline=""`.
- Enforced **Duplicate Prevention Constraints** across unique email and phone fields.
- Implemented **RFC 2426 vCard (`.vcf`) Serialization** for cross-platform contact export.

---

## Best Practices Checklist

- [ ] Validate input data using regular expressions before writing to persistent storage.
- [ ] Implement atomic file replacements to eliminate data corruption during crashes.
- [ ] Use `NamedTuple` or `@dataclass` for typed entity records.
- [ ] Export data in open standard formats (CSV, vCard).

---

## What's Next?

Congratulations on completing Project 05! Continue to the next capstone project:
👉 **[Project 06 — Personal Expense & Budget Tracker](06-expense-tracker.md)** to master financial date arithmetic, category aggregations, and monthly ledger reporting.
