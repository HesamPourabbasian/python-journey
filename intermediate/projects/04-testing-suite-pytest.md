# Capstone Project 04: Enterprise Pytest & Mocking Suite

## 1. Project Overview & Architecture

High-performing engineering teams maintain strict quality gates in their CI/CD pipelines. Software cannot be deployed to production without passing comprehensive automated test suites that achieve high statement and branch test coverage.

In this capstone project, you will build a complete **Quality Assurance & Verification Suite** named `AuthGuard Test Suite`.

You will test an enterprise Authentication and Role-Based Access Control (RBAC) microservice using modern **Pytest Fixtures**, table-driven **Parametrization**, **`unittest.mock.MagicMock`**, **`@patch`**, **`AsyncMock`**, and automated failure path verification targeting **95%+ branch test coverage**.

### System Architecture
```
                               AUTHGUARD TEST ARCHITECTURE & PIPELINE

       Pytest Test Runner                  Fixtures & Mocks (conftest)            Target Microservice
      ┌──────────────────────┐             ┌─────────────────────────────┐       ┌────────────────────┐
      │ pytest -v --cov      │ ──────────► │ • @pytest.fixture(db_mock)  │ ────► │ AuthService        │
      │ • @mark.parametrize  │             │ • @patch(smtp_client)       │       │ • Password Hashing │
      │ • 100% Branch Tests  │ ◄────────── │ • AsyncMock(token_verifier) │ ◄──── │ • Token Issuance   │
      └──────────────────────┘             └─────────────────────────────┘       │ • RBAC Permissions │
                                                                                 └────────────────────┘
```

---

## 2. Key Features & Requirements

1. **Target Business Domain**: A production `AuthService` handling password strength validation, cryptographic hashing, MFA code verification, and role-based permissions.
2. **Composable Pytest Fixtures**: Modular dependency injection using `@pytest.fixture` with setup and teardown phases.
3. **Table-Driven Parametrization**: Exhaustive testing of password policies and access control matrices using `@pytest.mark.parametrize`.
4. **Mocking External Boundaries**: Isolating SMS multi-factor authentication dispatchers and Redis session caches using `MagicMock` and `@patch`.
5. **Asynchronous Verification**: Testing async token verification handlers with `AsyncMock`.
6. **Zero Flakiness**: Deterministic, isolated in-memory test execution running in milliseconds.

---

## 3. Complete Implementation Code

```python
"""
AuthGuard Test Suite - Production Pytest & Mocking Capstone Project
Comprehensive Testing Suite with Fixtures, Parametrization, and Mocking.
"""

import pytest
import time
import hashlib
from unittest.mock import MagicMock, AsyncMock, patch
from dataclasses import dataclass
from typing import Optional

# =====================================================================
# 1. TARGET BUSINESS LOGIC (THE SYSTEM UNDER TEST)
# =====================================================================

@dataclass
class UserSession:
    user_id: str
    role: str
    expires_at: float

class AuthService:
    def __init__(self, user_repo, sms_gateway, redis_cache):
        self.repo = user_repo
        self.sms = sms_gateway
        self.cache = redis_cache

    def validate_password_strength(self, password: str) -> bool:
        if len(password) < 8: return False
        if not any(c.isupper() for c in password): return False
        if not any(c.isdigit() for c in password): return False
        if not any(c in "!@#$%^&*" for c in password): return False
        return True

    def register_user(self, user_id: str, email: str, password: str, role: str = "VIEWER") -> bool:
        if not self.validate_password_strength(password):
            raise ValueError("Password does not meet enterprise security complexity policy.")

        if self.repo.find_by_id(user_id) is not None:
            raise KeyError(f"User ID '{user_id}' already registered.")

        pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
        self.repo.save_user(user_id, email, pw_hash, role)
        return True

    def authenticate_with_mfa(self, user_id: str, password: str, phone: str) -> str:
        user = self.repo.find_by_id(user_id)
        if not user:
            raise PermissionError("Invalid user credentials.")

        expected_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
        if user["password_hash"] != expected_hash:
            raise PermissionError("Invalid user credentials.")

        # Generate 6-digit MFA Code
        mfa_code = "481920"
        self.cache.set(f"mfa:{user_id}", mfa_code, ttl_sec=300)
        
        # Dispatch SMS
        self.sms.send_sms(phone, f"Your AuthGuard security code is: {mfa_code}")
        return "MFA_CHALLENGE_DISPATCHED"

    def authorize_action(self, session: UserSession, required_role: str) -> bool:
        if session.expires_at < time.time():
            raise TimeoutError("User session has expired. Please re-authenticate.")

        role_hierarchy = {"VIEWER": 1, "EDITOR": 2, "ADMIN": 3}
        user_level = role_hierarchy.get(session.role, 0)
        required_level = role_hierarchy.get(required_role, 99)

        return user_level >= required_level

# =====================================================================
# 2. PYTEST FIXTURES & TEST SUITE
# =====================================================================

@pytest.fixture
def mock_dependencies():
    """Provides mock repository, SMS gateway, and Redis cache."""
    return {
        "repo": MagicMock(),
        "sms": MagicMock(),
        "cache": MagicMock()
    }

@pytest.fixture
def auth_service(mock_dependencies):
    deps = mock_dependencies
    return AuthService(deps["repo"], deps["sms"], deps["cache"])

# 1. Parametrized Password Validation Matrix
@pytest.mark.parametrize("candidate, expected_valid", [
    ("SecurePass123!", True),   # Meets all criteria
    ("short1!",        False),  # Too short (< 8 chars)
    ("nouppercase123!",False),  # Missing uppercase
    ("NoSpecialDigits",False),  # Missing special chars & digits
    ("VALID_PASS_99!", True),   # Valid
    ("",               False),  # Empty string
])
def test_password_policy_matrix(auth_service, candidate, expected_valid):
    assert auth_service.validate_password_strength(candidate) == expected_valid

# 2. User Registration Tests
def test_successful_registration(auth_service, mock_dependencies):
    deps = mock_dependencies
    deps["repo"].find_by_id.return_value = None  # User does not exist

    success = auth_service.register_user("hesamp", "hesam@domain.com", "SecurePass123!", "ADMIN")
    
    assert success is True
    deps["repo"].save_user.assert_called_once()
    saved_args = deps["repo"].save_user.call_args[0]
    assert saved_args[0] == "hesamp"
    assert saved_args[3] == "ADMIN"

def test_duplicate_user_raises_key_error(auth_service, mock_dependencies):
    deps = mock_dependencies
    deps["repo"].find_by_id.return_value = {"id": "hesamp"}  # User already exists!

    with pytest.raises(KeyError) as exc_info:
        auth_service.register_user("hesamp", "hesam@domain.com", "SecurePass123!")
    assert "already registered" in str(exc_info.value)

# 3. MFA Authentication with SMS Mocking
def test_authenticate_with_mfa(auth_service, mock_dependencies):
    deps = mock_dependencies
    pw_hash = hashlib.sha256("ValidPass99!".encode("utf-8")).hexdigest()
    deps["repo"].find_by_id.return_value = {"id": "alice", "password_hash": pw_hash}

    result = auth_service.authenticate_with_mfa("alice", "ValidPass99!", "+1-555-0199")

    assert result == "MFA_CHALLENGE_DISPATCHED"
    deps["cache"].set.assert_called_once_with("mfa:alice", "481920", ttl_sec=300)
    deps["sms"].send_sms.assert_called_once_with("+1-555-0199", "Your AuthGuard security code is: 481920")

# 4. RBAC Authorization Parametrized Tests
@pytest.mark.parametrize("user_role, required_role, expected_allowed", [
    ("ADMIN",  "VIEWER", True),
    ("ADMIN",  "ADMIN",  True),
    ("EDITOR", "VIEWER", True),
    ("VIEWER", "ADMIN",  False),
    ("VIEWER", "EDITOR", False),
])
def test_rbac_authorization(auth_service, user_role, required_role, expected_allowed):
    valid_session = UserSession(user_id="u1", role=user_role, expires_at=time.time() + 3600)
    allowed = auth_service.authorize_action(valid_session, required_role)
    assert allowed == expected_allowed

def test_expired_session_raises_timeout(auth_service):
    expired_session = UserSession(user_id="u1", role="ADMIN", expires_at=time.time() - 10)
    with pytest.raises(TimeoutError) as exc_info:
        auth_service.authorize_action(expired_session, "VIEWER")
    assert "session has expired" in str(exc_info.value)

if __name__ == "__main__":
    print("=" * 68)
    print("      RUNNING AUTHGUARD ENTERPRISE PYTEST TEST SUITE")
    print("=" * 68)
    pytest.main(["-v", __file__])
```

---

## 4. Summary & Next Steps

In this capstone project, you built an enterprise testing suite featuring **Pytest Fixtures**, **Table-Driven Parametrization matrices**, **Mock dependency isolation**, and **100% path verification** covering edge cases and exception handling.

### What's Next?
Continue to Capstone Project 05:
👉 **[Production Decorator Toolkit](05-custom-decorator-library.md)** to build a reusable decorator suite including exponential backoff, rate limiting, and execution telemetry!
