# Secure Coding Practices & OWASP Top 10 Defenses in Python

## Introduction

Python is celebrated for its simplicity, expressive syntax, and developer velocity. However, this ease of use can create a false sense of security.

In production enterprise systems, Python backends are under continuous automated attack from vulnerability scanners, remote exploit bots, and malicious actors. Subtle coding mistakes can expose organizations to catastrophic vulnerabilities:
- Using standard **`pickle.loads()`** allows attackers to execute arbitrary shell commands on the server with root privileges (**Remote Code Execution**).
- Invoking **`subprocess.run(..., shell=True)`** allows attackers to append bash commands and compromise the operating system (**Command Injection**).
- Naively joining file paths with **`os.path.join()`** allows attackers to read private server files like `/etc/passwd` or AWS API keys (**Path Traversal**).
- Fetching user-supplied URLs without IP filtering allows attackers to extract cloud instance credentials from internal metadata services (**Server-Side Request Forgery - SSRF**).

To write resilient software, senior Python engineers must adopt **Defensive Programming** and implement strict security quality gates based on the **OWASP Top 10 (Open Worldwide Application Security Project)** framework.

This lesson explores Python's most dangerous vulnerability patterns, deconstructs how exploits operate under the hood, and provides production-grade defensive implementations.

---

## Prerequisites

Before studying secure coding practices, ensure you have:

- Completed [File Handling & File Paths](../../beginner/file-handling/README.md).
- Completed [CPython Execution Pipeline & Architecture](../internals/cpython-architecture.md).
- Solid understanding of operating system processes, networking, and JSON serialization.

---

## Core Concept: The Python Security Defense Matrix

```
                        PYTHON VULNERABILITY & DEFENSE MATRIX

       Attack Vector               Dangerous Insecure Pattern          Secure Defensive Pattern
      ┌──────────────────────────┬───────────────────────────────────┬──────────────────────────────────┐
      │ 1. Insecure Deserial     │ pickle.loads(untrusted_bytes)     │ json.loads() or msgpack.unpackb()│
      ├──────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
      │ 2. Command Injection     │ subprocess.run(cmd, shell=True)   │ subprocess.run([args], shell=False│
      ├──────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
      │ 3. Path Traversal        │ os.path.join(upload_dir, filename)│ Path(p).resolve().is_relative_to()│
      ├──────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
      │ 4. SQL Injection         │ cursor.execute(f"WHERE id={uid}") │ cursor.execute("WHERE id=?", (uid│
      ├──────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
      │ 5. SSRF                  │ httpx.get(user_supplied_url)      │ Block private IPs (RFC 1918)     │
      ├──────────────────────────┼───────────────────────────────────┼──────────────────────────────────┤
      │ 6. Dynamic Evaluation    │ eval(user_expression)             │ ast.literal_eval() or AST parser │
      └──────────────────────────┴───────────────────────────────────┴──────────────────────────────────┘
```

---

## Syntax & Essential Secure Coding Patterns

```python
import subprocess
import pathlib
import json
import ipaddress
import urllib.parse

# 1. Defending Against Command Injection (shell=False with argument lists!)
def secure_ping(host_ip: str) -> subprocess.CompletedProcess:
    # ❌ INSECURE: subprocess.run(f"ping -c 1 {host_ip}", shell=True) -> Vulnerable to "8.8.8.8; cat /etc/passwd"!
    # ✅ SECURE: Pass explicit argument list with shell=False!
    return subprocess.run(["ping", "-c", "1", host_ip], capture_output=True, text=True, shell=False)

# 2. Defending Against Path Traversal (pathlib.resolve() and is_relative_to())
def secure_read_user_file(base_directory: pathlib.Path, untrusted_filename: str) -> str:
    # Resolve absolute canonical path, resolving all '../' directory hops
    safe_base = base_directory.resolve()
    target_path = (safe_base / untrusted_filename).resolve()

    # Guard: Target MUST be strictly within safe_base directory!
    if not target_path.is_relative_to(safe_base):
        raise PermissionError(f"Security Alert: Path Traversal Attempt Detected for '{untrusted_filename}'!")

    return target_path.read_text(encoding="utf-8")

# 3. Defending Against SSRF (Blocking Private IP Subnets & Cloud Metadata)
def is_safe_public_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False

    hostname = parsed.hostname
    if not hostname: return False

    # Block AWS / GCP Cloud Metadata IP (169.254.169.254)
    if hostname in ("169.254.169.254", "metadata.google.internal", "localhost"):
        return False

    try:
        ip = ipaddress.ip_address(hostname)
        # Block RFC 1918 Private LANs (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, loopback)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return False
    except ValueError:
        pass # Hostname is a domain name (Resolve and check DNS in production)

    return True
```

---

## Detailed Explanation

### 1. Deconstructing the `pickle` Remote Code Execution Exploit

In Python, `pickle` is designed for serializing arbitrary Python objects. It is **not** a secure data interchange format.

When `pickle.loads()` deserializes bytes, it executes the object's **`__reduce__()`** dunder method. An attacker can craft a malicious pickle payload that executes arbitrary operating system commands:

```python
# 🚨 DEMONSTRATION OF A PICKLE REMOTE CODE EXECUTION EXPLOIT:
import pickle
import os

class MaliciousExploitPayload:
    def __reduce__(self):
        # When unpickled, executes arbitrary bash commands on the victim's server!
        cmd = "echo '🚨 SERVER COMPROMISED: Attacker executed root command!'"
        return (os.system, (cmd,))

# Attacker generates binary payload:
poisoned_bytes = pickle.dumps(MaliciousExploitPayload())

# Victim unpickles untrusted payload:
# pickle.loads(poisoned_bytes) # 💥 BOOM! Executes os.system() instantly!
```

$$\textbf{Golden Rule: NEVER use \texttt{pickle} for untrusted user inputs, caching, or network APIs.}$$

$$\textbf{Always use \texttt{json}, \texttt{msgpack}, or \texttt{protobuf}.}$$

---

### 2. Path Traversal & Canonical Path Resolution

A common mistake is assuming `os.path.join("/var/data", user_input)` is safe:
- If `user_input = "report.pdf"`, target is `/var/data/report.pdf` (Safe).
- If `user_input = "../../../etc/passwd"`, target resolves to `/etc/passwd` (Exploit!).
- If `user_input = "/etc/passwd"` (absolute path), `os.path.join()` **discards the base directory entirely** and returns `/etc/passwd`!

**The Defense**:
Use **`pathlib.Path.resolve()`** to resolve symbolic links and relative hops, then verify that the canonical path **`is_relative_to(base_dir)`**.

---

### 3. Server-Side Request Forgery (SSRF)

When an application accepts a webhook URL from a user and queries it (e.g. `httpx.get(user_webhook_url)`):
- An attacker supplies: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`
- The victim's server queries AWS EC2 metadata and returns **production AWS IAM secret keys directly to the attacker**.

**The Defense**:
Enforce URL scheme allowlists (`https`), resolve the hostname to an IP address, and verify that the target IP is **not private, loopback, or cloud-metadata (`!ip.is_private and !ip.is_loopback`)**.

---

## Examples

### 1. Simple: Defending Against Command Injection in Subprocess
Executing system tools safely without invoking the system shell.

```python
import subprocess

def search_logs_secure(search_term: str, log_file: str) -> str:
    # ❌ VULNERABLE: subprocess.run(f"grep {search_term} {log_file}", shell=True)
    # If search_term is "foo; rm -rf /", shell=True will execute both commands!

    # ✅ SECURE: Arguments are passed as individual array tokens. shell=False by default!
    try:
        res = subprocess.run(
            ["grep", "-i", search_term, log_file],
            capture_output=True,
            text=True,
            shell=False,
            timeout=5.0
        )
        return res.stdout
    except FileNotFoundError:
        return "Log file not found."
    except subprocess.TimeoutExpired:
        return "Search timed out."

print("Secure Subprocess Command Pattern Initialized.")
```

### 2. Beginner: Path Traversal Defense Simulator
Testing a secure file reader against path traversal injection payloads.

```python
import pathlib
import tempfile

def test_path_traversal_guard():
    # Setup temporary safe directory
    with tempfile.TemporaryDirectory() as tmp_dir:
        base_dir = pathlib.Path(tmp_dir)
        safe_file = base_dir / "user_report.txt"
        safe_file.write_text("Confidential User Report Data", encoding="utf-8")

        def read_file_securely(untrusted_filename: str) -> str:
            resolved_base = base_dir.resolve()
            target = (resolved_base / untrusted_filename).resolve()

            if not target.is_relative_to(resolved_base):
                raise PermissionError(f"🚨 Path Traversal Blocked: '{untrusted_filename}' escaped sandbox!")

            return target.read_text(encoding="utf-8")

        # Test 1: Safe File
        print("1. Reading Valid File  :", read_file_securely("user_report.txt"))

        # Test 2: Traversal Attack
        print("2. Testing Traversal Attack ('../../etc/passwd'):")
        try:
            read_file_securely("../../etc/passwd")
        except PermissionError as err:
            print("  ✅ Security Guard Caught Exploit:", err)

test_path_traversal_guard()
```

### 3. Intermediate: Safe JSON Serialization vs Insecure Pickle
Demonstrating secure serialization alternatives.

```python
import json
import base64

# Safe Serialization Protocol
def serialize_session_token(user_id: int, roles: list[str]) -> str:
    payload = {"user_id": user_id, "roles": roles}
    json_bytes = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(json_bytes).decode("utf-8")

def deserialize_session_token(token_str: str) -> dict:
    try:
        json_bytes = base64.urlsafe_b64decode(token_str.encode("utf-8"))
        # JSON parser is 100% safe: It cannot execute code!
        return json.loads(json_bytes.decode("utf-8"))
    except (json.JSONDecodeError, ValueError) as err:
        raise ValueError("Invalid session token payload.") from err

token = serialize_session_token(101, ["USER", "ANALYST"])
print("Generated Safe Token:", token)
print("Decoded Session Data:", deserialize_session_token(token))
```

### 4. Real-World: Production SSRF Webhook Validator
Validating external webhook URLs to prevent internal network scanning and cloud metadata theft.

```python
import urllib.parse
import ipaddress
from dataclasses import dataclass

@dataclass
class SSRFValidationResult:
    is_safe: bool
    reason: str

class EnterpriseSSRFValidator:
    DISALLOWED_SCHEMES = {"file", "ftp", "gopher", "dict", "ldap"}
    CLOUD_METADATA_IPS = {"169.254.169.254", "fd00:ec2::254"}

    @classmethod
    def validate_outbound_url(cls, url: str) -> SSRFValidationResult:
        try:
            parsed = urllib.parse.urlparse(url)
        except Exception:
            return SSRFValidationResult(False, "Malformed URL format.")

        # 1. Scheme Check
        if parsed.scheme.lower() not in ("http", "https"):
            return SSRFValidationResult(False, f"Disallowed URL scheme: '{parsed.scheme}'. Only HTTPS allowed.")

        # 2. Hostname Check
        hostname = parsed.hostname
        if not hostname:
            return SSRFValidationResult(False, "Missing hostname.")

        if hostname.lower() in ("localhost", "metadata.google.internal") or hostname in cls.CLOUD_METADATA_IPS:
            return SSRFValidationResult(False, "Blocked attempt to access local or cloud metadata service.")

        # 3. IP Subnet Validation
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private:
                return SSRFValidationResult(False, f"Blocked Private LAN Subnet IP: {ip}")
            if ip.is_loopback:
                return SSRFValidationResult(False, f"Blocked Loopback IP: {ip}")
            if ip.is_link_local:
                return SSRFValidationResult(False, f"Blocked Link-Local IP: {ip}")
        except ValueError:
            pass  # Domain name

        return SSRFValidationResult(True, "URL is safe for outbound dispatch.")

# Test SSRF Defense
test_urls = [
    "https://api.stripe.com/v1/events",                         # Safe
    "http://169.254.169.254/latest/meta-data/",                 # Cloud Metadata Exploit!
    "http://127.0.0.1:8080/internal/admin",                     # Localhost Loopback!
    "http://192.168.1.1/router/reboot",                         # Private Subnet!
    "file:///etc/passwd",                                       # File Protocol!
]

print("=" * 68)
print("SSRF SECURITY VALIDATOR AUDIT:")
print("=" * 68)
for u in test_urls:
    res = EnterpriseSSRFValidator.validate_outbound_url(u)
    status_icon = "✅ ALLOWED" if res.is_safe else "🚨 BLOCKED"
    print(f"[{status_icon}] {u:<42} -> {res.reason}")
```

### 5. Advanced: Safe Mathematical AST Expression Evaluator
Evaluating mathematical formulas securely without calling dangerous `eval()`.

```python
import ast
import operator
from typing import Union

class SafeMathEvaluator(ast.NodeVisitor):
    """Evaluates mathematical expressions using AST traversal with ZERO eval() execution!"""
    ALLOWED_OPERATORS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
    }

    def evaluate(self, expression_string: str) -> float:
        tree = ast.parse(expression_string, mode="eval")
        return self.visit(tree.body)

    def visit_BinOp(self, node: ast.BinOp) -> Union[int, float]:
        op_type = type(node.op)
        if op_type not in self.ALLOWED_OPERATORS:
            raise ValueError(f"Disallowed operator: {op_type.__name__}")
        left = self.visit(node.left)
        right = self.visit(node.right)
        return self.ALLOWED_OPERATORS[op_type](left, right)

    def visit_UnaryOp(self, node: ast.UnaryOp) -> Union[int, float]:
        op_type = type(node.op)
        if op_type not in self.ALLOWED_OPERATORS:
            raise ValueError(f"Disallowed unary operator: {op_type.__name__}")
        operand = self.visit(node.operand)
        return self.ALLOWED_OPERATORS[op_type](operand)

    def visit_Constant(self, node: ast.Constant) -> Union[int, float]:
        if not isinstance(node.value, (int, float)):
            raise ValueError(f"Disallowed literal: {node.value!r}")
        return node.value

    def generic_visit(self, node):
        raise ValueError(f"Security Alert: Disallowed AST Node Type '{type(node).__name__}'")

evaluator = SafeMathEvaluator()
print("\n--- SAFE AST FORMULA EVALUATION ---")
print("Result of '(10 + 5) * 3' :", evaluator.evaluate("(10 + 5) * 3")) # 45

try:
    evaluator.evaluate("__import__('os').system('ls')")
except ValueError as err:
    print("Security Guard Blocked Injection Attempt:", err)
```

---

## Code Explanation

In Example 5 (`SafeMathEvaluator`):
1. Calling `eval("__import__('os').system('rm -rf /')")` allows attackers to compromise servers.
2. `SafeMathEvaluator` parses the expression into an Abstract Syntax Tree with **`ast.parse(..., mode='eval')`**.
3. It recursively traverses the AST nodes using the Visitor pattern, **explicitly whitelisting only `ast.BinOp` and `ast.Constant` numbers**.
4. If an attacker attempts to inject a function call (`ast.Call`), variable lookup (`ast.Name`), or dunder access (`ast.Attribute`), the evaluator raises `ValueError` immediately.
5. This delivers 100% safe formula evaluation with **zero risk of code injection**.

---

## Common Mistakes

### Mistake 1: Relying on String Replacement for SQL Sanitization
Writing `user_input.replace("'", "")` to sanitize SQL queries. Attackers easily bypass naive string replacement with hexadecimal encodings, comment characters (`--`), or unicode variations. **Always use parameterized queries (`cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))`).**

### Mistake 2: Using `os.path.abspath()` Instead of `Path.resolve()`
`os.path.abspath()` resolves relative paths without resolving **symbolic links**. An attacker creating a symlink pointing to `/etc/passwd` can bypass `abspath` checks. Always use **`pathlib.Path.resolve()`**.

---

## Best Practices

### The Principle of Least Privilege
Configure your application's operating system user, database roles, and cloud IAM credentials with the minimum permissions necessary to perform their function (e.g. read-only database user for reporting endpoints).

Good:
```python
# PostgreSQL role granting read-only permissions
# GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_service_user;
```

---

## Performance Considerations

- **Security Validation Latency**: URL parsing, path canonicalization, and parameterized query compilation add **$< 15\text{ microseconds}$** per request. The performance impact of defensive programming is negligible.

---

## Security Considerations

1. **Static Security Analysis with `bandit`**: Integrate `bandit` into your CI/CD pipeline to automatically scan your Python codebase for hardcoded passwords, `shell=True` calls, and insecure `pickle` usage:
   ```bash
   bandit -r my_project/
   ```

---

## Real-World Usage

- **Fintech & Banking APIs**: Validating payment webhook URLs against private network ranges.
- **Enterprise SaaS Platforms**: Sanitizing multi-tenant file uploads to prevent path traversal leaks.
- **Microservice Gateways**: Enforcing strict JSON schema validation.

---

## Comparison: Vulnerable vs Secure Patterns

| Threat Category | Insecure Code | Secure Defensive Code |
|---|---|---|
| **Serialization** | `pickle.loads(payload)` | `json.loads(payload)` |
| **Command Execution**| `subprocess.run(cmd, shell=True)`| `subprocess.run([args], shell=False)`|
| **File Access** | `open(base + "/" + filename)` | `path.resolve().is_relative_to(base)` |
| **Database Queries** | `db.execute(f"WHERE id={uid}")` | `db.execute("WHERE id=?", (uid,))` |
| **Formula Eval** | `eval(user_formula)` | `ast.literal_eval()` or AST Visitor |

---

## Advanced Concepts: Safe XML Parsing with `defusedxml`

Standard library `xml.etree.ElementTree` is vulnerable to **Billion Laughs XML Bomb Attacks** (recursive entity expansion that exhausts gigabytes of RAM). Always use **`defusedxml`**:

```python
# pip install defusedxml
import defusedxml.ElementTree as SafeET

def parse_incoming_xml(xml_string: str):
    # defusedxml safely defuses entity expansion and DTD attacks!
    root = SafeET.fromstring(xml_string)
    return root
```

---

## Exercises

### Exercise 1 — Beginner
Write a function `safe_execute_command(binary_name, arg_list)` that uses `subprocess.run()` with `shell=False` and a 3-second timeout, handling `TimeoutExpired` cleanly.

### Exercise 2 — Intermediate
Build a `SecureFileUploader` class that validates uploaded filenames (rejecting path traversal strings, null bytes, and non-whitelisted extensions).

### Exercise 3 — Advanced
Build a `ComprehensiveSSRFGuard` that resolves domain names via DNS, inspects all returned A and AAAA records, and blocks any URL resolving to private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16).

---

## Mini Project: Enterprise Application Security Gateway & Input Sanitization Firewall

### Requirements
Build an operational security firewall and sanitization engine named `app_security_firewall.py`. Implement automated defenses against Command Injection, Path Traversal, SSRF attacks, and SQL Injection, producing detailed security audit alert logs for detected threats.

### Implementation Blueprint
```python
import pathlib
import urllib.parse
import ipaddress
import re
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. SECURITY AUDIT LOGGING MODEL
# =====================================================================

@dataclass
class SecurityAuditLog:
    threat_category: str
    is_blocked: bool
    threat_level: str  # LOW, MEDIUM, CRITICAL
    reason: str

# =====================================================================
# 2. APPLICATION SECURITY FIREWALL
# =====================================================================

class EnterpriseSecurityFirewall:
    SQL_INJECTION_PATTERNS = [
        re.compile(r"(\bUNION\b.*\bSELECT\b)", re.IGNORECASE),
        re.compile(r"(--|#|/\*|\*/)", re.IGNORECASE),
        re.compile(r"(\bOR\b\s+\d+=\d+)", re.IGNORECASE),
        re.compile(r"(\bDROP\b\s+\bTABLE\b)", re.IGNORECASE),
    ]

    @classmethod
    def sanitize_file_path(cls, base_dir: pathlib.Path, untrusted_filename: str) -> SecurityAuditLog:
        """Protects against Path Traversal Directory Hopping Attacks."""
        safe_base = base_dir.resolve()
        target = (safe_base / untrusted_filename).resolve()

        if "\x00" in untrusted_filename:
            return SecurityAuditLog("PathTraversal", True, "CRITICAL", "Null Byte injection detected in file path.")

        if not target.is_relative_to(safe_base):
            return SecurityAuditLog("PathTraversal", True, "CRITICAL", f"Path escaped sandbox boundary: '{untrusted_filename}'")

        return SecurityAuditLog("PathTraversal", False, "LOW", "File path verified within safe sandbox.")

    @classmethod
    def sanitize_ssrf_url(cls, url: str) -> SecurityAuditLog:
        """Protects against Server-Side Request Forgery & Cloud Metadata theft."""
        try:
            parsed = urllib.parse.urlparse(url)
        except Exception:
            return SecurityAuditLog("SSRF", True, "MEDIUM", "Malformed URL format.")

        if parsed.scheme.lower() not in ("http", "https"):
            return SecurityAuditLog("SSRF", True, "HIGH", f"Disallowed scheme: '{parsed.scheme}'. Only HTTPS allowed.")

        hostname = parsed.hostname
        if not hostname:
            return SecurityAuditLog("SSRF", True, "HIGH", "Missing hostname in URL.")

        if hostname.lower() in ("localhost", "169.254.169.254", "metadata.google.internal"):
            return SecurityAuditLog("SSRF", True, "CRITICAL", "Attempt to access local host or cloud metadata IP!")

        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback:
                return SecurityAuditLog("SSRF", True, "CRITICAL", f"Attempt to access internal private IP: {ip}")
        except ValueError:
            pass

        return SecurityAuditLog("SSRF", False, "LOW", "URL verified as public outbound endpoint.")

    @classmethod
    def inspect_sql_injection(cls, query_param: str) -> SecurityAuditLog:
        """Detects SQL Injection signature patterns in user input strings."""
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if pattern.search(query_param):
                return SecurityAuditLog("SQLInjection", True, "CRITICAL", f"SQL signature pattern detected: '{pattern.pattern}'")

        return SecurityAuditLog("SQLInjection", False, "LOW", "Input contains clean parameter string.")

# =====================================================================
# 3. VERIFICATION & RUNTIME AUDIT
# =====================================================================

def run_firewall_audit_suite():
    border = "=" * 70
    print(border)
    print("      ENTERPRISE APPLICATION SECURITY FIREWALL AUDIT")
    print(border)

    sandbox_dir = pathlib.Path("/var/app/uploads")

    test_scenarios = [
        ("PathTraversal", lambda: EnterpriseSecurityFirewall.sanitize_file_path(sandbox_dir, "user_invoice.pdf")),
        ("PathTraversal", lambda: EnterpriseSecurityFirewall.sanitize_file_path(sandbox_dir, "../../etc/shadow")),
        ("SSRF", lambda: EnterpriseSecurityFirewall.sanitize_ssrf_url("https://api.github.com/events")),
        ("SSRF", lambda: EnterpriseSecurityFirewall.sanitize_ssrf_url("http://169.254.169.254/latest/meta-data/")),
        ("SSRF", lambda: EnterpriseSecurityFirewall.sanitize_ssrf_url("http://10.0.1.50/admin")),
        ("SQLInjection", lambda: EnterpriseSecurityFirewall.inspect_sql_injection("Hesam_Pourabbasain")),
        ("SQLInjection", lambda: EnterpriseSecurityFirewall.inspect_sql_injection("admin' UNION SELECT password FROM users --")),
    ]

    print(f"{'CATEGORY':<14} {'STATUS':<10} {'LEVEL':<10} {'SECURITY ADVISORY'}")
    print("-" * 70)

    for category, test_fn in test_scenarios:
        log = test_fn()
        status_str = "🛑 BLOCKED" if log.is_blocked else "✅ ALLOWED"
        print(f"{log.threat_category:<14} {status_str:<10} {log.threat_level:<10} {log.reason}")

    print("-" * 70)
    print("🛡️ Security Audit Completed: All Injection Vectors Neutralized.")
    print(border)

if __name__ == "__main__":
    run_firewall_audit_suite()
```

---

## Summary

In this lesson, you mastered secure coding practices and OWASP Top 10 defenses in Python:
- **Never use `pickle`** for untrusted data; replace with **`json`** or **`msgpack`**.
- Defend against **Command Injection** by passing argument lists with **`subprocess.run(..., shell=False)`**.
- Neutralize **Path Traversal** attacks by verifying **`Path.resolve().is_relative_to(base_dir)`**.
- Eliminate **SQL Injection** with **parameterized queries** (`$1`, `?`).
- Prevent **SSRF Attacks** by filtering out private subnets (RFC 1918), loopback addresses, and cloud metadata IPs (`169.254.169.254`).
- Safely parse mathematical formulas using **`ast.NodeVisitor`** instead of dangerous `eval()`.

---

## Best Practices Checklist

- [ ] Eliminate all `shell=True` invocations across `subprocess` calls.
- [ ] Replace `pickle.loads()` with `json.loads()` for external data ingestion.
- [ ] Validate canonical file paths with `Path(p).resolve().is_relative_to(base)`.
- [ ] Block private IP subnets and metadata services in outbound webhook clients.
- [ ] Use `bandit` static security scanner in automated CI/CD pipelines.

---

## What's Next?

Now that you understand OWASP Top 10 defenses, continue to:
👉 **[Modern Cryptography, Password Hashing & Secrets](cryptography-hashing-secrets.md)** to master Argon2id password hashing, AES-256-GCM authenticated encryption, and secrets management!
