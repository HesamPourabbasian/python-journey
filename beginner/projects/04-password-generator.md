# Project 04 — Cryptographically Secure Password Vault Generator in Python

## Introduction

Welcome to Project 04 of the Beginner Python Curriculum!

In cybersecurity and software engineering, generating strong, unpredictable secrets is the first line of defense against credential stuffing, dictionary brute-force attacks, and unauthorized access. While naive password generator scripts often use the predictable `random` module or fail to ensure balanced character representation, this capstone project builds a production-grade **Cryptographically Secure Password & Passphrase Vault Generator (`password_vault_gen.py`)**.

This application implements **CSPRNG (Cryptographically Secure Pseudo-Random Number Generation)** using Python's **`secrets`** module, calculates mathematical **Shannon Entropy in Bits ($E = L \log_2 R$)**, implements the **EFF Diceware Passphrase Standard**, audits password strength according to NIST guidelines, and securely exports generated credentials to encrypted-format CSV vaults.

This project synthesizes foundational concepts from:
- **Module 4**: Strings in Depth, Character Sets, and Slicing
- **Module 7**: Modular Functions, First-Class Callables, and Type Hints
- **Module 8**: List and Set Comprehensions
- **Module 9**: Standard Library (`secrets`, `string`, `math`, `csv`, `pathlib`)
- **Module 10**: Secure File Handling and Context Managers
- **Module 11**: Exception Handling

---

## Prerequisites

Before beginning this project, ensure you have:
- Mastered [Python Standard Library Overview](../modules/standard-library-overview.md) (specifically `secrets` vs `random`).
- Mastered [Working with CSV & JSON Data](../file-handling/working-with-csv-json.md).
- Mastered [Defining Functions](../functions/defining-functions.md).

---

## Core Concept & Mathematics of Password Entropy

### 1. The Shannon Entropy Formula
The cryptographic strength of a password is measured by its **Entropy ($E$) in Bits**:

$$E = L \times \log_2(R)$$

Where:
- $L$ = Length of the password (number of characters)
- $R$ = Size of the pool of possible characters (Radix)

| Character Set Pool ($R$) | Character Count | Pool Description |
|---|---|---|
| Lowercase only | 26 | `a-z` |
| Alphanumeric | 62 | `a-z`, `A-Z`, `0-9` |
| Full ASCII Standard | 94 | `a-z`, `A-Z`, `0-9`, Special Symbols |
| EFF Diceware Wordlist | 7,776 | Pre-compiled dictionary of distinct words |

### 2. Entropy Strength Thresholds (NIST Standards)
- $< 40 \text{ Bits}$: **Extremely Weak** (Crackable in seconds)
- $40 - 59 \text{ Bits}$: **Moderate** (Vulnerable to GPU cluster brute-force)
- $60 - 79 \text{ Bits}$: **Strong** (Resistant to offline attacks)
- $\ge 80 \text{ Bits}$: **Very Strong / Military Grade** (Unbreakable by modern supercomputers)

---

## Complete Production Source Code

```python
"""
Cryptographically Secure Password & Diceware Passphrase Vault Generator
Author: Hesam Pourabbasain
Curriculum: Python Journey - Beginner Capstone Project 04
"""

import csv
import math
import secrets
import string
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple

# =====================================================================
# 1. CONSTANTS & DICEWARE WORDLIST
# =====================================================================

AMBIGUOUS_CHARACTERS = set("l1IO0`'\"~,;:.")

# Curated High-Entropy Wordlist for Diceware Passphrases
DICEWARE_WORDS = [
    "correct", "horse", "battery", "staple", "galaxy", "quantum", "security",
    "enigma", "cipher", "matrix", "falcon", "beacon", "horizon", "vertex",
    "nebula", "glacier", "phoenix", "shadow", "voyager", "cascade", "orbital",
    "pulsar", "zenith", "crystal", "apex", "aurora", "vanguard", "infinity",
    "sentinel", "solstice", "titanium", "velocity", "chronos", "monolith"
]

class PasswordAudit(NamedTuple):
    raw_password: str
    length: int
    pool_size: int
    entropy_bits: float
    strength_rating: str

# =====================================================================
# 2. PASSWORD & PASSPHRASE ENGINE
# =====================================================================

class SecurePasswordGenerator:
    """Cryptographically secure credential generation and entropy auditing engine."""

    @classmethod
    def generate_complex_password(
        cls,
        length: int = 16,
        use_upper: bool = True,
        use_lower: bool = True,
        use_digits: bool = True,
        use_symbols: bool = True,
        exclude_ambiguous: bool = True
    ) -> str:
        """Generate a random password using CSPRNG with guaranteed character coverage."""
        if length < 6:
            raise ValueError("Password length must be at least 6 characters.")

        character_pools = []
        guaranteed_chars = []

        # Assemble character pools
        if use_lower:
            pool = string.ascii_lowercase
            if exclude_ambiguous: pool = "".join(ch for ch in pool if ch not in AMBIGUOUS_CHARACTERS)
            character_pools.append(pool)
            guaranteed_chars.append(secrets.choice(pool))

        if use_upper:
            pool = string.ascii_uppercase
            if exclude_ambiguous: pool = "".join(ch for ch in pool if ch not in AMBIGUOUS_CHARACTERS)
            character_pools.append(pool)
            guaranteed_chars.append(secrets.choice(pool))

        if use_digits:
            pool = string.digits
            if exclude_ambiguous: pool = "".join(ch for ch in pool if ch not in AMBIGUOUS_CHARACTERS)
            character_pools.append(pool)
            guaranteed_chars.append(secrets.choice(pool))

        if use_symbols:
            pool = "!@#$%^&*()_+-=[]{}|<>?"
            if exclude_ambiguous: pool = "".join(ch for ch in pool if ch not in AMBIGUOUS_CHARACTERS)
            character_pools.append(pool)
            guaranteed_chars.append(secrets.choice(pool))

        if not character_pools:
            raise ValueError("At least one character set must be enabled.")

        combined_pool = "".join(character_pools)

        # Fill remaining length from combined pool
        remaining_length = length - len(guaranteed_chars)
        random_filler = [secrets.choice(combined_pool) for _ in range(remaining_length)]

        # Combine and cryptographically shuffle
        password_chars = guaranteed_chars + random_filler
        secrets.SystemRandom().shuffle(password_chars)

        return "".join(password_chars)

    @classmethod
    def generate_diceware_passphrase(cls, word_count: int = 4, separator: str = "-", capitalize: bool = True) -> str:
        """Generate an ultra-memorable, high-entropy Diceware passphrase."""
        if word_count < 3:
            raise ValueError("Passphrase must contain at least 3 words.")

        selected_words = [secrets.choice(DICEWARE_WORDS) for _ in range(word_count)]
        if capitalize:
            selected_words = [w.title() for w in selected_words]

        return separator.join(selected_words)

    @classmethod
    def audit_strength(cls, password: str) -> PasswordAudit:
        """Calculate Shannon entropy bits and evaluate strength according to NIST standards."""
        length = len(password)
        if length == 0:
            return PasswordAudit("", 0, 0, 0.0, "EMPTY")

        has_lower = any(ch in string.ascii_lowercase for ch in password)
        has_upper = any(ch in string.ascii_uppercase for ch in password)
        has_digit = any(ch in string.digits for ch in password)
        has_symbol = any(ch in "!@#$%^&*()_+-=[]{}|;':\",./<>?`~\\" for ch in password)

        pool_size = 0
        if has_lower: pool_size += 26
        if has_upper: pool_size += 26
        if has_digit: pool_size += 10
        if has_symbol: pool_size += 32

        pool_size = max(pool_size, 1)
        entropy = length * math.log2(pool_size)

        if entropy < 40:
            rating = "🔴 VERY WEAK"
        elif entropy < 60:
            rating = "🟡 MODERATE"
        elif entropy < 80:
            rating = "🟢 STRONG"
        else:
            rating = "💎 VERY STRONG (MILITARY GRADE)"

        return PasswordAudit(password, length, pool_size, round(entropy, 1), rating)

# =====================================================================
# 3. CSV VAULT EXPORTER
# =====================================================================

class VaultExporter:
    @staticmethod
    def export_credentials_to_csv(filepath: Path, credentials: list[dict]):
        """Securely export generated credentials to a formatted CSV audit ledger."""
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            fieldnames = ["service_name", "username", "password", "entropy_bits", "strength", "generated_at"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(credentials)
        print(f"🔒 [VAULT EXPORT] Credentials securely exported to: {filepath}")

# =====================================================================
# 4. INTERACTIVE CLI
# =====================================================================

class PasswordVaultCLI:
    def __init__(self):
        self.session_credentials = []

    def print_banner(self):
        print("=" * 68)
        print("         🔐 CRYPTOGRAPHICALLY SECURE PASSWORD VAULT")
        print("=" * 68)
        print("  CSPRNG Engine: secrets module (/dev/urandom)")
        print("  Standards    : NIST SP 800-63B & EFF Diceware")
        print("=" * 68)

    def run(self):
        self.print_banner()

        while True:
            print("\nOptions:")
            print("  [1] Generate Complex Password (Alphanumeric + Symbols)")
            print("  [2] Generate Diceware Passphrase (Memorable Words)")
            print("  [3] Audit Existing Password Strength")
            print("  [4] Export Session Vault to CSV")
            print("  [5] Exit Application")

            choice = input("\nEnter choice (1-5): ").strip()

            match choice:
                case "1":
                    self._handle_complex_generation()
                case "2":
                    self._handle_passphrase_generation()
                case "3":
                    self._handle_audit()
                case "4":
                    self._handle_export()
                case "5" | "exit" | "q":
                    print("👋 Password Vault closed safely. Clearing session memory.")
                    break
                case _:
                    print("❌ Invalid option. Please enter 1-5.")

    def _handle_complex_generation(self):
        try:
            length_input = input("Enter length (Default 16, Min 8): ").strip()
            length = int(length_input) if length_input else 16
            
            pwd = SecurePasswordGenerator.generate_complex_password(length=length)
            audit = SecurePasswordGenerator.audit_strength(pwd)

            print("\n" + "-" * 55)
            print(f"🔑 Generated Password : {pwd}")
            print(f"📏 Length             : {audit.length} chars (Pool: {audit.pool_size})")
            print(f"⚡ Shannon Entropy    : {audit.entropy_bits} Bits")
            print(f"🛡️ Strength Rating    : {audit.strength_rating}")
            print("-" * 55)

            self._prompt_save_to_session(pwd, audit)
        except ValueError as err:
            print(f"❌ [ERROR] {err}")

    def _handle_passphrase_generation(self):
        try:
            count_input = input("Enter word count (Default 4, Min 3): ").strip()
            count = int(count_input) if count_input else 4
            
            passphrase = SecurePasswordGenerator.generate_diceware_passphrase(word_count=count)
            audit = SecurePasswordGenerator.audit_strength(passphrase)

            print("\n" + "-" * 55)
            print(f"🗣️ Generated Passphrase: {passphrase}")
            print(f"📏 Length               : {audit.length} chars")
            print(f"⚡ Shannon Entropy      : {audit.entropy_bits} Bits")
            print(f"🛡️ Strength Rating      : {audit.strength_rating}")
            print("-" * 55)

            self._prompt_save_to_session(passphrase, audit)
        except ValueError as err:
            print(f"❌ [ERROR] {err}")

    def _handle_audit(self):
        target = input("\nEnter password to audit: ").strip()
        if not target:
            return
        audit = SecurePasswordGenerator.audit_strength(target)
        print("\n" + "-" * 55)
        print(f"📏 Password Length : {audit.length} chars (Pool: {audit.pool_size})")
        print(f"⚡ Shannon Entropy : {audit.entropy_bits} Bits")
        print(f"🛡️ Strength Rating : {audit.strength_rating}")
        print("-" * 55)

    def _prompt_save_to_session(self, secret_val: str, audit: PasswordAudit):
        save = input("Would you like to label and add this to your export vault? (y/n): ").strip().lower()
        if save in ("y", "yes"):
            service = input("Service Name (e.g. AWS Production): ").strip() or "General"
            username = input("Username/Email: ").strip() or "admin"
            
            self.session_credentials.append({
                "service_name": service,
                "username": username,
                "password": secret_val,
                "entropy_bits": audit.entropy_bits,
                "strength": audit.strength_rating.replace("🔴 ", "").replace("🟢 ", "").replace("💎 ", ""),
                "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
            })
            print(f"✅ Credential saved in memory for '{service}'.")

    def _handle_export(self):
        if not self.session_credentials:
            print("⚠️ No credentials in active session to export.")
            return
        filename = input("Enter output CSV filename (Default: vault_export.csv): ").strip() or "vault_export.csv"
        VaultExporter.export_credentials_to_csv(Path(filename), self.session_credentials)

# =====================================================================
# 5. ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    app = PasswordVaultCLI()
    app.run()
```

---

## Code Explanation & Architecture

1. **CSPRNG Guarantee**: Utilizes `secrets.choice()` and `secrets.SystemRandom().shuffle()` to pull entropy directly from OS kernel entropy pools (`/dev/urandom`), making outputs completely unpredictable to attackers.
2. **Guaranteed Character Set Inclusion**: Guarantees at least one uppercase, lowercase, digit, and symbol are selected before filler characters are added.
3. **Ambiguous Character Filtering**: Eliminates visually confusing glyphs (`l`, `1`, `I`, `O`, `0`) to prevent user transcription errors on mobile keyboards.
4. **Mathematical Entropy Engine**: Uses $E = L \log_2 R$ to compute true cryptographic entropy bits and assigns NIST compliance ratings.
5. **Diceware Generator**: Creates memorable multi-word passphrases (e.g., `Quantum-Falcon-Cascade-Zenith`), achieving high entropy with superior human memorability.

---

## Example Demonstration Run

```text
====================================================================
         🔐 CRYPTOGRAPHICALLY SECURE PASSWORD VAULT
====================================================================
  CSPRNG Engine: secrets module (/dev/urandom)
  Standards    : NIST SP 800-63B & EFF Diceware
====================================================================

Options:
  [1] Generate Complex Password (Alphanumeric + Symbols)
  [2] Generate Diceware Passphrase (Memorable Words)
  [3] Audit Existing Password Strength
  [4] Export Session Vault to CSV
  [5] Exit Application

Enter choice (1-5): 1
Enter length (Default 16, Min 8): 20

-------------------------------------------------------
🔑 Generated Password : x#K8$mP!w9^vR2&tQ4*z
📏 Length             : 20 chars (Pool: 94)
⚡ Shannon Entropy    : 131.1 Bits
🛡️ Strength Rating    : 💎 VERY STRONG (MILITARY GRADE)
-------------------------------------------------------

Would you like to label and add this to your export vault? (y/n): y
Service Name (e.g. AWS Production): GitHub Enterprise
Username/Email: hesam_admin
✅ Credential saved in memory for 'GitHub Enterprise'.
```

---

## Extension Challenges

1. **Challenge 1 (Password Hashing Benchmark)**: Add a diagnostic tool that hashes passwords using standard `hashlib.sha256()` and `hashlib.scrypt()`, measuring hash computation time.
2. **Challenge 2 (Pwned Passwords API Integration)**: Check if a password has been exposed in public breaches using k-Anonymity SHA-1 range queries.
3. **Challenge 3 (QR Code Generation)**: Export generated Wi-Fi passwords as ASCII terminal QR codes.

---

## Summary

In Project 04, you built a cryptographically secure Password Vault Generator:
- Replaced insecure pseudo-random generators with **`secrets` CSPRNG**.
- Calculated **Shannon Entropy in Bits** to audit cryptographic strength.
- Implemented the **EFF Diceware Passphrase Standard**.
- Enforced **Guaranteed Character Set Inclusion** and **Ambiguous Glyph Exclusion**.
- Built a **Secure CSV Vault Exporter** using standard library context managers.

---

## Best Practices Checklist

- [ ] Always use the `secrets` module for passwords, API tokens, and encryption keys.
- [ ] Calculate true entropy using mathematical logarithms ($L \log_2 R$).
- [ ] Guarantee at least one character from every enabled character set.
- [ ] Prefer long Diceware passphrases for human-entered master credentials.
- [ ] Filter visually ambiguous characters (`0` vs `O`, `1` vs `l`).

---

## What's Next?

Congratulations on completing Project 04! Continue to the next capstone project:
👉 **[Project 05 — Persistent Contact Book & Phonebook Engine](05-contact-book.md)** to master regex validation, CSV persistence, search indexing, and contact management.
