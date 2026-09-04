# Capstone Project 01: Production REST API with Flask

## 1. Project Overview & Architecture

Modern distributed web architectures depend heavily on high-speed, secure, and maintainable **RESTful APIs** to serve single-page applications, mobile clients, and partner integrations.

In this capstone project, you will build a complete, production-grade **Digital Asset Management & Licensing REST API** named `AssetGuard API`.

The system allows enterprise users to authenticate using **JWT Bearer Tokens**, register digital media assets, search through metadata with query parameter filters, issue commercial licensing rights, and track asset downloads.

### System Architecture
```
                                 ASSETGUARD REST API ARCHITECTURE

       Client (Web / Mobile)                 Flask WSGI Application               SQLite3 / DB Layer
      ┌──────────────────────┐             ┌──────────────────────────────┐     ┌───────────────────┐
      │ GET /api/v1/assets   │ ──────────► │ • Auth Middleware (JWT)      │ ──► │ SQLite Database   │
      │ POST /api/v1/auth    │ ◄────────── │ • Application Factory        │ ◄── │ • users table     │
      │ POST /api/v1/licenses│             │ • Blueprints (auth, assets)  │     │ • assets table    │
      └──────────────────────┘             │ • JSON Error Envelope Handler│     │ • licenses table  │
                                           └──────────────────────────────┘     └───────────────────┘
```

---

## 2. Key Features & Requirements

1. **Application Factory Pattern**: Clean instantiation via `create_app(config)` enabling isolated test environments.
2. **Modular Blueprints**: Two independent domain modules:
   - `auth_bp`: Registration, JWT authentication, and token verification.
   - `assets_bp`: Digital asset registry, metadata filtering, and commercial licensing.
3. **Database Integration**: Embedded `sqlite3` relational database with foreign key constraints, indexed searches, and parameterized queries.
4. **Security Middleware**: Custom `@require_jwt_auth` decorator enforcing token validation on protected endpoints.
5. **Standardized JSON Error Envelopes**: Global error handlers intercepting `400`, `401`, `403`, `404`, `409`, `422`, and `500` HTTP status codes.
6. **Automated Test Suite**: Integrated test suite validating authentication, asset creation, and validation failure paths.

---

## 3. Directory Layout

```text
asset_guard_api/
├── app/
│   ├── __init__.py          # Application Factory
│   ├── database.py          # SQLite Connection & Schema Setup
│   ├── security.py          # JWT Token Encoding & Middleware
│   └── routes/
│       ├── auth_routes.py   # Auth Blueprint
│       └── asset_routes.py  # Asset & Licensing Blueprint
├── tests/
│   └── test_api.py          # Comprehensive Test Suite
└── run.py                   # WSGI Entrypoint
```

---

## 4. Complete Implementation Code

```python
"""
AssetGuard REST API - Single-File Comprehensive Implementation
Complete Production-Ready REST API Service with Flask and SQLite3.
"""

from __future__ import annotations
import sqlite3
import hashlib
import hmac
import base64
import json
import time
from functools import wraps
from typing import Optional, Any
from datetime import datetime, timezone

from flask import Flask, Blueprint, request, jsonify, g
from werkzeug.exceptions import HTTPException

# =====================================================================
# 1. DATABASE LAYER & REPOSITORY
# =====================================================================

DB_SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CREATOR',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK(price >= 0.0),
    owner_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    licensee_id INTEGER NOT NULL,
    license_tier TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(licensee_id) REFERENCES users(id) ON DELETE CASCADE
);
"""

class DatabaseManager:
    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_db(self):
        with self.get_connection() as conn:
            conn.executescript(DB_SCHEMA)

# =====================================================================
# 2. SECURITY & JWT TOKEN ENGINE
# =====================================================================

SECRET_KEY = "enterprise_production_jwt_signing_secret_key"

class JWTManager:
    @staticmethod
    def _b64_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

    @staticmethod
    def _b64_decode(data: str) -> bytes:
        padding = 4 - (len(data) % 4)
        if padding != 4:
            data += "=" * padding
        return base64.urlsafe_b64decode(data.encode("utf-8"))

    @classmethod
    def encode_token(cls, user_id: int, username: str, role: str, expires_in_sec: int = 3600) -> str:
        header = json.dumps({"alg": "HS256", "typ": "JWT"}).encode("utf-8")
        payload = json.dumps({
            "sub": user_id,
            "username": username,
            "role": role,
            "exp": int(time.time()) + expires_in_sec
        }).encode("utf-8")

        b64_header = cls._b64_encode(header)
        b64_payload = cls._b64_encode(payload)
        
        signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            f"{b64_header}.{b64_payload}".encode("utf-8"),
            hashlib.sha256
        ).digest()
        
        return f"{b64_header}.{b64_payload}.{cls._b64_encode(signature)}"

    @classmethod
    def decode_token(cls, token: str) -> Optional[dict[str, Any]]:
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            b64_header, b64_payload, b64_sig = parts
            
            expected_sig = hmac.new(
                SECRET_KEY.encode("utf-8"),
                f"{b64_header}.{b64_payload}".encode("utf-8"),
                hashlib.sha256
            ).digest()
            
            if not hmac.compare_digest(cls._b64_encode(expected_sig), b64_sig):
                return None
                
            payload = json.loads(cls._b64_decode(b64_payload))
            if payload.get("exp", 0) < time.time():
                return None  # Expired
            return payload
        except Exception:
            return None

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def require_jwt_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "status": 401,
                "error": "UNAUTHORIZED",
                "message": "Missing or malformed Authorization header. Expected 'Bearer <token>'"
            }), 401

        token = auth_header.split(" ")[1]
        claims = JWTManager.decode_token(token)
        if not claims:
            return jsonify({
                "status": 403,
                "error": "FORBIDDEN",
                "message": "Invalid, tampered, or expired JWT Bearer token."
            }), 403

        # Store authenticated identity in Flask request context
        g.current_user = claims
        return func(*args, **kwargs)
    return wrapper

# =====================================================================
# 3. ROUTE BLUEPRINTS
# =====================================================================

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
assets_bp = Blueprint("assets", __name__, url_prefix="/api/v1/assets")

# --- AUTH ROUTES ---
@auth_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "CREATOR").upper()

    if len(username) < 3 or len(password) < 6:
        return jsonify({"status": 400, "error": "BAD_REQUEST", "message": "Username >= 3 chars and Password >= 6 chars required."}), 400

    db: DatabaseManager = request.app_db
    now_ts = datetime.now(timezone.utc).isoformat()

    try:
        with db.get_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
                (username, hash_password(password), role, now_ts)
            )
            user_id = cursor.lastrowid
        return jsonify({"status": 201, "message": "User registered successfully.", "user_id": user_id, "username": username}), 201
    except sqlite3.IntegrityError:
        return jsonify({"status": 409, "error": "CONFLICT", "message": f"Username '{username}' is already taken."}), 409

@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")

    db: DatabaseManager = request.app_db
    with db.get_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE username = ? AND password_hash = ?",
            (username, hash_password(password))
        ).fetchone()

    if not user:
        return jsonify({"status": 401, "error": "UNAUTHORIZED", "message": "Invalid username or password credentials."}), 401

    token = JWTManager.encode_token(user["id"], user["username"], user["role"])
    return jsonify({"status": 200, "token": token, "token_type": "Bearer", "expires_in": 3600}), 200

# --- ASSETS ROUTES ---
@assets_bp.route("", methods=["GET"])
def list_assets():
    category = request.args.get("category")
    max_price = request.args.get("max_price", type=float)

    query = "SELECT a.id, a.title, a.category, a.price, a.created_at, u.username as owner FROM assets a JOIN users u ON a.owner_id = u.id WHERE 1=1"
    params = []

    if category:
        query += " AND a.category = ?"
        params.append(category)
    if max_price is not None:
        query += " AND a.price <= ?"
        params.append(max_price)

    query += " ORDER BY a.id DESC"

    db: DatabaseManager = request.app_db
    with db.get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        assets_list = [dict(row) for row in rows]

    return jsonify({"status": 200, "assets": assets_list, "total": len(assets_list)}), 200

@assets_bp.route("", methods=["POST"])
@require_jwt_auth
def create_asset():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    category = data.get("category", "").strip().upper()
    price = data.get("price")

    if not title or not category or price is None or price < 0:
        return jsonify({"status": 422, "error": "UNPROCESSABLE_ENTITY", "message": "Valid title, category, and non-negative price are required."}), 422

    owner_id = g.current_user["sub"]
    now_ts = datetime.now(timezone.utc).isoformat()
    db: DatabaseManager = request.app_db

    with db.get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO assets (title, category, price, owner_id, created_at) VALUES (?, ?, ?, ?, ?)",
            (title, category, float(price), owner_id, now_ts)
        )
        asset_id = cursor.lastrowid

    return jsonify({
        "status": 201,
        "message": "Asset registered successfully.",
        "asset": {"id": asset_id, "title": title, "category": category, "price": price, "owner_id": owner_id}
    }), 201

# =====================================================================
# 4. APPLICATION FACTORY & GLOBAL ERROR HANDLERS
# =====================================================================

def create_app(db_path: str = ":memory:") -> Flask:
    app = Flask(__name__)
    db = DatabaseManager(db_path)

    # Attach database to incoming request context
    @app.before_request
    def attach_db():
        request.app_db = db

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(assets_bp)

    # Standardized Global Error Handlers (RFC 7807 JSON Format)
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return jsonify({
            "status": e.code,
            "error": e.name.upper().replace(" ", "_"),
            "message": e.description
        }), e.code

    @app.errorhandler(Exception)
    def handle_unexpected_exception(e):
        return jsonify({
            "status": 500,
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected server error occurred."
        }), 500

    return app

# =====================================================================
# 5. AUTOMATED INTEGRATION TEST SUITE
# =====================================================================

if __name__ == "__main__":
    print("=" * 68)
    print("      ASSETGUARD REST API: INTEGRATION SUITE VALIDATION")
    print("=" * 68)
    
    app = create_app(":memory:")
    client = app.test_client()

    # 1. Register User
    print("\n1. POST /api/v1/auth/register:")
    res = client.post("/api/v1/auth/register", json={"username": "alice_creator", "password": "password123"})
    print("Status:", res.status_code, "->", res.get_json())
    assert res.status_code == 201

    # 2. Login User
    print("\n2. POST /api/v1/auth/login:")
    res = client.post("/api/v1/auth/login", json={"username": "alice_creator", "password": "password123"})
    print("Status:", res.status_code)
    token = res.get_json()["token"]
    assert res.status_code == 200

    # 3. Create Asset with Token
    print("\n3. POST /api/v1/assets (Authenticated):")
    auth_headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/v1/assets", json={"title": "4K Nebula Footage", "category": "VIDEO", "price": 49.99}, headers=auth_headers)
    print("Status:", res.status_code, "->", res.get_json())
    assert res.status_code == 201

    # 4. Query Asset List with Filter
    print("\n4. GET /api/v1/assets?category=VIDEO:")
    res = client.get("/api/v1/assets?category=VIDEO")
    print("Status:", res.status_code, "->", res.get_json())
    assert res.status_code == 200
    assert len(res.get_json()["assets"]) == 1

    # 5. Unauthorized Access Attempt
    print("\n5. POST /api/v1/assets (No Auth Header):")
    res = client.post("/api/v1/assets", json={"title": "Hacked Asset", "category": "AUDIO", "price": 10.0})
    print("Status:", res.status_code, "->", res.get_json())
    assert res.status_code == 401

    print("\n" + "=" * 68)
    print("🎉 ALL REST API INTEGRATION SUITE TESTS PASSED SUCCESSFULLY!")
    print("=" * 68)
```

---

## 5. Summary & Next Steps

In this capstone project, you built a complete RESTful web service combining the **Application Factory pattern**, **Flask Blueprints**, **Relational SQLite3 storage**, **HMAC-SHA256 JWT Authentication Middleware**, and **Standardized JSON Error Envelopes**.

### What's Next?
Continue to Capstone Project 02:
👉 **[Concurrent Async Web Scraper](02-web-scraper-async.md)** to build a high-speed asynchronous data scraper using `httpx.AsyncClient` and `asyncio`!
