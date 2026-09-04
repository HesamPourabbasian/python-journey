# 🛡️ Module 6: Application Security & Cryptography

Welcome to the **Application Security & Cryptography** module in Level 3.

Writing code that functions correctly is only half the battle. In enterprise production environments, software is under continuous automated attack from vulnerability scanners, credential stuffers, remote code execution exploits, and supply-chain malware.

A Principal Engineer must write software that is **secure by design**, embedding defensive security at every layer of the architecture.

---

## 🎯 Module Overview

In this module, you will master:
- **OWASP Top 10 Defenses for Python**: Defending against Command Injection (`subprocess.run(shell=True)`), Path Traversal (`os.path.join` vulnerabilities), Insecure Deserialization (`pickle.loads`), SQL Injection, and Server-Side Request Forgery (SSRF).
- **Modern Cryptography, Hashing & Secrets Management**: Password hashing standards with **Argon2id** and **Bcrypt**, symmetric authenticated encryption with **AES-256-GCM** and **Fernet (`cryptography` library)**, asymmetric RSA/ECDSA digital signatures, and zero-trust secrets management with environment isolation.
- **Dependency & Supply-Chain Security**: Auditing third-party PyPI packages for known CVEs using **`pip-audit`**, Software Bill of Materials (SBOM), hash-checking mode (`--require-hashes`), and defending against typosquatting attacks.

---

## 📑 Articles in this Module

1. **[Secure Coding Practices & OWASP Top 10 Defenses](secure-coding-practices-owasp.md)**
   - Defending against the OWASP Top 10 in Python: Command injection, arbitrary file traversal with `pathlib.resolve()`, safe XML parsing with `defusedxml`, dangerous `eval()`/`exec()` alternatives, and avoiding `pickle` exploits with JSON/MsgPack.
2. **[Modern Cryptography, Password Hashing & Secrets](cryptography-hashing-secrets.md)**
   - Argon2id password hashing, symmetric AES-256-GCM authenticated encryption with the `cryptography` library, asymmetric public/private keys, constant-time comparison (`secrets.compare_digest`), and environment secrets managers.
3. **[Dependency Vulnerability Scanning & Supply Chain](dependency-vulnerability-scanning.md)**
   - Supply-chain attack vectors, automated CVE scanning with `pip-audit`, pip hash-checking mode, generating CycloneDX/SPDX SBOMs, and CI/CD security quality gates.

---

## 🗺️ Progression Path

```
secure-coding-practices-owasp.md ──► cryptography-hashing-secrets.md ──► dependency-vulnerability-scanning.md
                                                                                     │
                                                                                     ▼
                                       [Next Module: Software Architecture & Design Patterns](../architecture/README.md)
```
