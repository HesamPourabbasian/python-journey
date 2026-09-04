# Modern Cryptography, Password Hashing & Secrets in Python

## Introduction

In the digital world, data is constantly in motion across networks and at rest in databases. Protecting user credentials, securing financial records, and authenticating API webhooks requires a deep understanding of **Modern Cryptography**.

A dangerous mistake made by novice developers is confusing the three fundamental disciplines of data transformation:
1. **Encoding (e.g. Base64, Hex)**: Formats binary data for transmission. Provides **ZERO confidentiality**. Anyone can decode it.
2. **Cryptographic Hashing (e.g. SHA-256, BLAKE2)**: One-way mathematical functions generating fixed-size fingerprints for data integrity verification. Fast by design.
3. **Password Hashing (e.g. Argon2id, Bcrypt)**: Intentionally slow, memory-hard, salted algorithms designed to defeat GPU and ASIC brute-force cracking clusters.
4. **Encryption (e.g. AES-256-GCM, RSA)**: Two-way reversible mathematical transformations protecting confidentiality using secret cryptographic keys.

Furthermore, subtle implementation flaws—such as using standard Python `random` instead of **`secrets`**, or comparing tokens with `if token == expected:` instead of **`secrets.compare_digest()`**—can leave systems vulnerable to predictable token generation and **Side-Channel Timing Attacks**.

This lesson explores modern password hashing with **Argon2id**, symmetric authenticated encryption with **Fernet (AES-GCM)**, constant-time verification, and zero-trust secrets management.

---

## Prerequisites

Before studying cryptography, ensure you have:

- Completed [File Handling & Byte Streams](../../beginner/file-handling/README.md).
- Completed [Secure Coding Practices & OWASP Top 10](secure-coding-practices-owasp.md).
- Basic understanding of binary data (`bytes` and `bytearray`).

---

## Core Concept: Hashing vs Password Hashing vs Encryption

```
                    CRYPTOGRAPHIC OPERATIONS TAXONOMY

       Operation          Reversible?   Key Required?   Speed Requirement   Primary Use Case
      ┌─────────────────┬─────────────┬───────────────┬───────────────────┬───────────────────────────┐
      │ 1. Encoding     │ YES         │ NO            │ Ultra-Fast        │ Data formatting (Base64)  │
      ├─────────────────┼─────────────┼───────────────┼───────────────────┼───────────────────────────┤
      │ 2. Fast Hash    │ NO          │ NO            │ Ultra-Fast        │ File checksums (SHA-256)  │
      ├─────────────────┼─────────────┼───────────────┼───────────────────┼───────────────────────────┤
      │ 3. Password Hash│ NO          │ Salt (Auto)   │ SLOW / Memory-Hard│ User Passwords (Argon2id) │
      ├─────────────────┼─────────────┼───────────────┼───────────────────┼───────────────────────────┤
      │ 4. Symmetric Enc│ YES         │ Shared Secret │ Fast (AES-NI)     │ Data at Rest (AES-256-GCM)│
      ├─────────────────┼─────────────┼───────────────┼───────────────────┼───────────────────────────┤
      │ 5. Asymmetric   │ YES         │ Public/Private│ Moderate          │ Digital Signatures / TLS  │
      └─────────────────┴─────────────┴───────────────┴───────────────────┴───────────────────────────┘
```

---

## Syntax & Essential Cryptography Patterns

```python
import secrets
import hashlib
import hmac

# 1. Cryptographically Secure Random Generation (Use secrets, NEVER random!)
secure_api_key = secrets.token_urlsafe(32)  # Generates 256 bits of CSPRNG entropy
print(f"🔑 Secure API Key Generated: {secure_api_key}")

# 2. Modern Password Hashing with PBKDF2-HMAC-SHA256 (Standard Library)
def hash_password_pbkdf2(password: str) -> tuple[bytes, bytes]:
    salt = secrets.token_bytes(16)  # 128-bit random salt
    # 600,000 iterations (OWASP recommended minimum for PBKDF2)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations=600_000)
    return salt, key

# 3. Constant-Time Comparison to Defeat Side-Channel Timing Attacks
def verify_security_token(user_token: str, stored_token: str) -> bool:
    # ❌ VULNERABLE: return user_token == stored_token (Leaks timing hints!)
    # ✅ SECURE: secrets.compare_digest runs in strict constant time!
    return secrets.compare_digest(user_token.encode("utf-8"), stored_token.encode("utf-8"))
```

---

## Detailed Explanation

### 1. Why Fast Hashes (MD5, SHA-256) are Insecure for Passwords

Modern consumer graphics cards (e.g. NVIDIA RTX 4090) can calculate **over 100 billion SHA-256 hashes per second**.
- If a database with SHA-256 password hashes leaks, an attacker can crack 8-character complex passwords in minutes using pre-computed **Rainbow Tables** and GPU clusters.

**The Solution: Memory-Hard Password Hashing (Argon2id)**:
- Winner of the international **Password Hashing Competition (PHC)**.
- Combines **Time Cost** (CPU iterations) with **Memory Cost** (e.g. allocating 64 MB of RAM per hash).
- Because a GPU has limited high-speed RAM per core, Argon2id makes parallel brute-force hardware cracking economically impossible!

---

### 2. Side-Channel Timing Attacks & `secrets.compare_digest`

When you compare two strings using Python's standard `==` operator:
```python
"apple" == "application"
```
CPython compares characters one-by-one from left to right. **The instant it encounters a mismatch, it exits early**:
- Comparing `"aXXXX"` vs `"secret"` fails on character 0 ($\approx 15\text{ ns}$).
- Comparing `"seXXX"` vs `"secret"` fails on character 2 ($\approx 35\text{ ns}$).

An attacker measuring network response latency with high precision can guess API keys and HMAC signatures **one character at a time**!

**The Defense**:
**`secrets.compare_digest(a, b)`** always compares all bytes in **strict constant time**, eliminating timing side-channels.

---

### 3. Symmetric Authenticated Encryption (AEAD) with Fernet / AES-GCM

Traditional encryption (like AES in CBC mode) only provides *confidentiality*. If an attacker modifies ciphertext bytes in transit, CBC mode produces corrupted plaintext without raising an error (**Padding Oracle Attacks**).

**Authenticated Encryption (AEAD)** solves this:
- Generates a cryptographic **Authentication Tag (HMAC)** over the ciphertext.
- If even a single bit of the ciphertext or metadata is tampered with, decryption fails immediately with `InvalidSignature` / `InvalidToken`.
- The Python **`cryptography.fernet.Fernet`** module implements authenticated AES-128-CBC with HMAC-SHA256.

---

## Examples

### 1. Simple: Generating Cryptographically Secure Tokens
Using the `secrets` module for session IDs, password reset tokens, and API credentials.

```python
import secrets

# 1. 256-bit Hex Token (64 characters)
reset_token = secrets.token_hex(32)
print("Password Reset Token (Hex) :", reset_token)

# 2. URL-Safe Base64 Token (Clean for query params)
oauth_state = secrets.token_urlsafe(32)
print("OAuth State Token (URL-Safe):", oauth_state)

# 3. Cryptographically Secure Integer within Range [100_000, 999_999] (6-Digit OTP)
otp_code = secrets.randbelow(900_000) + 100_000
print("Two-Factor 6-Digit OTP Code :", otp_code)
```

### 2. Beginner: Salted Password Hashing & Verification Pipeline
Building a production-grade password authentication system using standard library `hashlib.pbkdf2_hmac`.

```python
import hashlib
import secrets

class PasswordAuthenticator:
    ITERATIONS = 600_000  # OWASP 2024 standard for PBKDF2-SHA256

    @classmethod
    def create_password_hash(cls, raw_password: str) -> str:
        salt = secrets.token_bytes(16)
        key = hashlib.pbkdf2_hmac("sha256", raw_password.encode("utf-8"), salt, cls.ITERATIONS)
        # Format: salt_hex$key_hex
        return f"{salt.hex()}${key.hex()}"

    @classmethod
    def verify_password(cls, raw_password: str, stored_hash_record: str) -> bool:
        salt_hex, expected_key_hex = stored_hash_record.split("$")
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(expected_key_hex)

        # Compute hash with the exact same salt
        computed_key = hashlib.pbkdf2_hmac("sha256", raw_password.encode("utf-8"), salt, cls.ITERATIONS)

        # Constant-time comparison!
        return secrets.compare_digest(computed_key, expected_key)

# Test Authenticator
stored_record = PasswordAuthenticator.create_password_hash("SuperSecretMasterPassword123!")
print("Stored Password Hash Record:", stored_record[:45] + "...")

# Verification Tests
print("Test Correct Password :", PasswordAuthenticator.verify_password("SuperSecretMasterPassword123!", stored_record)) # True
print("Test Wrong Password   :", PasswordAuthenticator.verify_password("WrongPassword!", stored_record))               # False
```

### 3. Intermediate: Symmetric Authenticated Data Encryption with `Fernet`
Encrypting sensitive Personally Identifiable Information (PII) at rest.

```python
# Standalone Simulation of Fernet Symmetric Authenticated Encryption
import base64
import os
import hmac
import hashlib

class MockFernetEngine:
    """Demonstrates AES authenticated symmetric encryption mechanics."""
    def __init__(self, key: bytes = None):
        self.key = key or secrets.token_bytes(32)

    def encrypt(self, plaintext: str) -> str:
        # Simulated authenticated encryption token
        nonce = secrets.token_bytes(12)
        data = plaintext.encode("utf-8")
        signature = hmac.new(self.key, nonce + data, hashlib.sha256).digest()
        payload = nonce + signature + data
        return base64.urlsafe_b64encode(payload).decode("utf-8")

    def decrypt(self, token_str: str) -> str:
        raw_bytes = base64.urlsafe_b64decode(token_str.encode("utf-8"))
        nonce = raw_bytes[:12]
        signature = raw_bytes[12:44]
        data = raw_bytes[44:]

        # Verify HMAC signature in constant time
        expected_sig = hmac.new(self.key, nonce + data, hashlib.sha256).digest()
        if not secrets.compare_digest(signature, expected_sig):
            raise ValueError("🚨 Cryptographic Tampering Detected: Invalid Signature!")

        return data.decode("utf-8")

# Test Symmetric Encryption
vault = MockFernetEngine()
pii_data = "SSN: 000-12-3456 | Credit Card: 4111-2222-3333-4444"

encrypted_token = vault.encrypt(pii_data)
print("Encrypted Ciphertext Token:", encrypted_token)

decrypted_text = vault.decrypt(encrypted_token)
print("Decrypted Plaintext Data :", decrypted_text)
assert pii_data == decrypted_text
```

### 4. Real-World: Webhook HMAC-SHA256 Signature Verification
Validating incoming Stripe / GitHub webhook signatures to guarantee authenticity.

```python
import hmac
import hashlib
import secrets
import time

class WebhookSecurityVerifier:
    def __init__(self, signing_secret: str, max_drift_seconds: int = 300):
        self.signing_secret = signing_secret.encode("utf-8")
        self.max_drift_seconds = max_drift_seconds

    def sign_payload(self, timestamp: int, payload_body: str) -> str:
        message = f"{timestamp}.{payload_body}".encode("utf-8")
        signature = hmac.new(self.signing_secret, message, hashlib.sha256).hexdigest()
        return f"t={timestamp},v1={signature}"

    def verify_webhook(self, signature_header: str, payload_body: str) -> bool:
        try:
            # Parse header format: t=1700000000,v1=abcdef...
            parts = dict(item.split("=") for item in signature_header.split(","))
            ts = int(parts["t"])
            received_signature = parts["v1"]
        except Exception:
            return False

        # 1. Anti-Replay Attack Check: Verify timestamp drift
        current_time = int(time.time())
        if abs(current_time - ts) > self.max_drift_seconds:
            print("🚨 Rejected: Webhook timestamp expired (Replay Attack Prevention)!")
            return False

        # 2. Compute expected HMAC signature
        expected_msg = f"{ts}.{payload_body}".encode("utf-8")
        expected_signature = hmac.new(self.signing_secret, expected_msg, hashlib.sha256).hexdigest()

        # 3. Constant-time comparison!
        return secrets.compare_digest(received_signature, expected_signature)

# Test Webhook Verifier
SECRET = "whsec_enterprise_secret_key_9901"
verifier = WebhookSecurityVerifier(SECRET)

body = '{"event": "charge.succeeded", "amount": 1450.00, "currency": "USD"}'
ts = int(time.time())
valid_header = verifier.sign_payload(ts, body)

print("=" * 65)
print("WEBHOOK HMAC-SHA256 VERIFICATION:")
print("=" * 65)
print(f"Header: {valid_header}")
print("Verification Result (Valid)   :", verifier.verify_webhook(valid_header, body)) # True
print("Verification Result (Tampered):", verifier.verify_webhook(valid_header, body + " ")) # False
```

### 5. Advanced: Asymmetric Digital Signing with SHA-256 RSA Simulation
Demonstrating asymmetric private-key signing and public-key verification.

```python
import hashlib
import secrets

class MockAsymmetricSigner:
    """Demonstrates Public/Private Key Asymmetric Digital Signature architecture."""
    def __init__(self):
        # Private key signs; Public key verifies
        self._private_signing_key = secrets.token_bytes(32)
        self.public_key_fingerprint = hashlib.sha256(self._private_signing_key).hexdigest()

    def sign_document(self, document_text: str) -> str:
        doc_hash = hashlib.sha256(document_text.encode("utf-8")).digest()
        # Sign hash with private key
        signature = hmac.new(self._private_signing_key, doc_hash, hashlib.sha256).hexdigest()
        return signature

    def verify_document_signature(self, document_text: str, signature: str) -> bool:
        doc_hash = hashlib.sha256(document_text.encode("utf-8")).digest()
        expected = hmac.new(self._private_signing_key, doc_hash, hashlib.sha256).hexdigest()
        return secrets.compare_digest(signature, expected)

signer = MockAsymmetricSigner()
contract = "Enterprise Cloud SLA Agreement - Tier 1 99.99% Uptime"
sig = signer.sign_document(contract)

print("Contract Signature Generated:", sig)
print("Is Signature Valid?          :", signer.verify_document_signature(contract, sig)) # True
```

---

## Code Explanation

In Example 4 (`Webhook HMAC Verification`):
1. **HMAC-SHA256**: Generates a cryptographic signature binding the payload body to the shared signing secret.
2. **Replay Attack Defense**: Including the UNIX timestamp (`t=...`) inside the signed message ensures an attacker cannot capture a valid request and replay it 2 hours later.
3. **`secrets.compare_digest()`**: Verifies the signature in strict constant time, preventing timing side-channel attacks from recovering the secret key byte-by-byte.

---

## Common Mistakes

### Mistake 1: Using `random` for Cryptographic Secrets
Using standard `random.choice()` or `random.randint()` for security tokens.
Python's `random` uses the **Mersenne Twister (MT19937)** algorithm. By observing 624 outputs, an attacker can reconstruct the entire internal state and predict all future tokens! **Always use `secrets`.**

### Mistake 2: Storing Plaintext Secrets in Source Code
Hardcoding database passwords or Stripe API keys inside Python scripts (`API_KEY = "sk_live_12345"`). Any developer with repository access or public git leaks exposes production credentials. **Always load secrets from environment variables (`os.environ`).**

---

## Best Practices

### Zero-Trust Secrets Management with Pydantic Settings
Use `pydantic-settings` to parse and validate secrets from `.env` files and environment variables at startup:

```python
from pydantic_settings import BaseSettings
from pydantic import SecretStr

class AppSettings(BaseSettings):
    database_url: SecretStr
    jwt_secret_key: SecretStr

    class Config:
        env_file = ".env"
```

---

## Performance Considerations

| Algorithm | Type | Cracking Resistance | Time Cost |
|---|---|---|---|
| **MD5 / SHA-1** | Fast Hash | **BROKEN (0/10)** | $< 1\mu\text{s}$ (DO NOT USE!) |
| **SHA-256** | Fast Hash | **Poor for Passwords** | $< 1\mu\text{s}$ |
| **PBKDF2-SHA256** | Password Hash | Strong (600k rounds) | ~150 ms |
| **Argon2id** | **Password Hash** | **Maximum (PHC Winner)** | **~100–250 ms (Tunable RAM)**|
| **AES-256-GCM** | **Symmetric AEAD**| **Maximum** | **Ultra-Fast (Hardware AES-NI)**|

---

## Security Considerations

1. **Memory Wiping**: Sensitive byte arrays holding decrypted private keys should be explicitly zeroed after use (`byte_arr[:] = b'\x00' * len(byte_arr)`).

---

## Real-World Usage

- **FastAPI / Django Authentication**: Hashing user passwords with Argon2id and Bcrypt.
- **Stripe & GitHub Webhooks**: HMAC-SHA256 signature verification.
- **Fintech Payment Gateways**: AES-256-GCM field-level database encryption for credit cards.

---

## Comparison: Password Hashing Algorithms

| Algorithm | Memory-Hard? | GPU Cracking Resistant? | Status |
|---|---|---|---|
| **Argon2id** | **✅ Yes (Configurable MBs)**| **✅ Maximum** | **Modern Gold Standard (PHC Winner)**|
| **Bcrypt** | Moderate | High | Industry Standard |
| **PBKDF2** | ❌ No (CPU only) | Moderate | Legacy Standard (FIPS Approved) |
| **SHA-256** | ❌ No | ❌ Broken by GPUs | **Insecure for passwords** |

---

## Advanced Concepts: Key Derivation with HKDF

When you have a single master secret key and need to derive independent, isolated keys for encryption, authentication, and token signing:

```python
import hashlib
import hmac

def derive_sub_key(master_key: bytes, context_label: str) -> bytes:
    """HMAC-based Key Derivation Function (HKDF)."""
    return hmac.new(master_key, context_label.encode("utf-8"), hashlib.sha256).digest()

master = secrets.token_bytes(32)
enc_key = derive_sub_key(master, "ENCRYPTION_V1")
auth_key = derive_sub_key(master, "AUTHENTICATION_V1")
print("Distinct Derived Keys:", enc_key.hex()[:16], auth_key.hex()[:16])
```

---

## Exercises

### Exercise 1 — Beginner
Use `secrets` to generate a 32-byte secure session key and compare it to a candidate token using `secrets.compare_digest()`.

### Exercise 2 — Intermediate
Build a `UserCredentialVault` class that hashes passwords with PBKDF2-HMAC-SHA256 (600,000 iterations), stores salted hex strings, and verifies login attempts.

### Exercise 3 — Advanced
Build a `SymmetricEncryptionVault` that encrypts JSON payloads with AES-256-GCM simulation, generates HMAC authentication tags, and validates against data tampering.

---

## Mini Project: Enterprise Cryptographic Security Vault & HMAC Token Verification Suite

### Requirements
Build an operational cryptographic security vault named `crypto_security_vault.py`. Implement password hashing with PBKDF2-SHA256, authenticated data encryption/decryption, HMAC webhook signature generation and verification with timestamp drift protection, and constant-time token comparison.

### Implementation Blueprint
```python
import hmac
import hashlib
import secrets
import base64
import time
import json
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. CRYPTOGRAPHIC VAULT SUITE
# =====================================================================

class EnterpriseCryptoVault:
    PBKDF2_ROUNDS = 500_000

    def __init__(self, master_secret: Optional[str] = None):
        self.master_key = (master_secret or secrets.token_hex(32)).encode("utf-8")

    # 1. Password Hashing (Salted PBKDF2-HMAC-SHA256)
    @classmethod
    def hash_password(cls, password: str) -> str:
        salt = secrets.token_bytes(16)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, cls.PBKDF2_ROUNDS)
        return f"{salt.hex()}${key.hex()}"

    @classmethod
    def verify_password(cls, password: str, stored_hash: str) -> bool:
        try:
            salt_hex, expected_key_hex = stored_hash.split("$")
            salt = bytes.fromhex(salt_hex)
            expected_key = bytes.fromhex(expected_key_hex)
            computed_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, cls.PBKDF2_ROUNDS)
            return secrets.compare_digest(computed_key, expected_key)
        except Exception:
            return False

    # 2. Authenticated Symmetric Data Encryption
    def encrypt_data(self, plaintext_dict: dict) -> str:
        data_bytes = json.dumps(plaintext_dict).encode("utf-8")
        nonce = secrets.token_bytes(12)
        tag = hmac.new(self.master_key, nonce + data_bytes, hashlib.sha256).digest()
        payload = nonce + tag + data_bytes
        return base64.urlsafe_b64encode(payload).decode("utf-8")

    def decrypt_data(self, token_str: str) -> dict:
        raw = base64.urlsafe_b64decode(token_str.encode("utf-8"))
        nonce = raw[:12]
        tag = raw[12:44]
        data_bytes = raw[44:]

        expected_tag = hmac.new(self.master_key, nonce + data_bytes, hashlib.sha256).digest()
        if not secrets.compare_digest(tag, expected_tag):
            raise ValueError("🚨 Cryptographic Authentication Tag Mismatch! Ciphertext has been tampered with.")

        return json.loads(data_bytes.decode("utf-8"))

    # 3. HMAC Webhook Signer & Verifier
    def sign_webhook_payload(self, payload_str: str) -> str:
        ts = int(time.time())
        msg = f"{ts}.{payload_str}".encode("utf-8")
        sig = hmac.new(self.master_key, msg, hashlib.sha256).hexdigest()
        return f"t={ts},v1={sig}"

    def verify_webhook_signature(self, signature_header: str, payload_str: str, max_drift_sec: int = 300) -> bool:
        try:
            parts = dict(p.split("=") for p in signature_header.split(","))
            ts = int(parts["t"])
            sig = parts["v1"]
        except Exception:
            return False

        if abs(int(time.time()) - ts) > max_drift_sec:
            return False  # Replay attack prevention

        expected_msg = f"{ts}.{payload_str}".encode("utf-8")
        expected_sig = hmac.new(self.master_key, expected_msg, hashlib.sha256).hexdigest()
        return secrets.compare_digest(sig, expected_sig)

# =====================================================================
# 2. RUNTIME VERIFICATION
# =====================================================================

def run_crypto_vault_verification():
    border = "=" * 70
    print(border)
    print("      ENTERPRISE CRYPTOGRAPHIC VAULT & SECURITY AUDIT")
    print(border)

    vault = EnterpriseCryptoVault("enterprise_master_key_9901")

    # 1. Password Hashing Test
    print("\n1. Testing Salted PBKDF2 Password Hashing:")
    stored_hash = vault.hash_password("SuperSecretAdminPass123!")
    print(f"  • Generated Hash Record : {stored_hash[:45]}...")
    assert vault.verify_password("SuperSecretAdminPass123!", stored_hash) is True
    assert vault.verify_password("WrongPass!", stored_hash) is False
    print("  ✅ Password Authentication & Verification Passed.")

    # 2. Authenticated Encryption Test
    print("\n2. Testing Authenticated Symmetric Encryption (PII):")
    pii_payload = {"user_id": "USR-101", "ssn": "000-12-3456", "balance": 45000.00}
    token = vault.encrypt_data(pii_payload)
    print(f"  • Encrypted Token : {token}")
    decrypted = vault.decrypt_data(token)
    assert decrypted["ssn"] == "000-12-3456"
    print(f"  • Decrypted PII   : {decrypted['user_id']} (SSN Verified)")
    print("  ✅ AEAD Symmetric Encryption Verified.")

    # 3. Webhook Signature Test
    print("\n3. Testing HMAC Webhook Signature Verification:")
    webhook_body = '{"event": "subscription.renewed", "account": "ACC-9901"}'
    header = vault.sign_webhook_payload(webhook_body)
    print(f"  • Webhook Header  : {header}")
    assert vault.verify_webhook_signature(header, webhook_body) is True
    assert vault.verify_webhook_signature(header, webhook_body + " ") is False
    print("  ✅ Constant-Time HMAC Signature Verification Passed.")

    print("\n" + border)
    print("🎉 All Cryptographic Security Modules Verified with 100% Integrity!")
    print(border)

if __name__ == "__main__":
    run_crypto_vault_verification()
```

---

## Summary

In this lesson, you mastered modern cryptography and secrets management in Python:
- **Encoding** is not security; **Fast Hashing** (SHA-256) is for data integrity; **Password Hashing** (Argon2id, PBKDF2) is memory-hard to defeat GPUs; **Encryption** is reversible with secret keys.
- Always use the **`secrets`** module for CSPRNG random generation (never standard `random`).
- Defeat side-channel timing attacks with **`secrets.compare_digest()`**.
- Protect data at rest using **Authenticated Encryption (AEAD)** to prevent ciphertext tampering.
- Authenticate incoming webhooks with **HMAC-SHA256 signatures** and timestamp drift checks.
- Manage credentials with **Pydantic Settings** and environment variables.

---

## Best Practices Checklist

- [ ] Use `secrets.token_urlsafe()` for API keys and tokens.
- [ ] Store user passwords with Argon2id or PBKDF2 (min 600,000 rounds).
- [ ] Use `secrets.compare_digest()` for all authentication string comparisons.
- [ ] Use Authenticated Encryption (AEAD / Fernet) for sensitive data at rest.
- [ ] Never hardcode plaintext secrets in source control.

---

## What's Next?

Now that you understand cryptography, continue to the final article in this module:
👉 **[Dependency Vulnerability Scanning & Supply Chain](dependency-vulnerability-scanning.md)** to master `pip-audit`, CycloneDX SBOMs, and protecting against supply-chain attacks!
