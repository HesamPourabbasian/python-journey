# Building Production REST APIs with Flask in Python

## Introduction

In modern web development, **Representational State Transfer (REST)** is the architectural standard for designing networked web APIs. A RESTful API structures server state around **Resources** identified by uniform URIs (nouns) and manipulates them using standard **HTTP Verbs** (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).

While Python offers several web frameworks, **Flask** remains one of the most widely adopted micro-frameworks in the world.

Created by Armin Ronacher, Flask provides a lightweight, un-opinionated **WSGI (Web Server Gateway Interface)** foundation. Unlike monolithic frameworks, Flask gives you total architectural freedom while providing essential primitives: URL routing, request parsing, JSON serialization via **`jsonify`**, error handling middleware, and modular organization via **Blueprints**.

This lesson concludes **Module 8: Networking & REST APIs in Depth**, exploring REST design principles, the **Application Factory Pattern**, Blueprint modularization, JSON schema validation, error handling, and production deployment with **Gunicorn**.

---

## Prerequisites

Before studying Flask REST APIs, ensure you have:

- Completed [HTTP Fundamentals & The Requests Library](http-fundamentals-and-requests.md).
- Completed [Function Decorators & Wrapper Architecture](../decorators/function-decorators.md).
- Familiarity with JSON and Python dictionary manipulation.

---

## Core Concept: REST Architectural Principles & HTTP Verb Mapping

```
                             RESTFUL HTTP CRUD MAPPING MATRIX

    HTTP Verb      URI Pattern                 Action                        Status Code
   ┌────────────┬───────────────────────────┬─────────────────────────────┬─────────────────┐
   │ GET        │ /api/v1/customers         │ List / Paginate Customers   │ 200 OK          │
   ├────────────┼───────────────────────────┼─────────────────────────────┼─────────────────┤
   │ POST       │ /api/v1/customers         │ Create New Customer         │ 201 Created     │
   ├────────────┼───────────────────────────┼─────────────────────────────┼─────────────────┤
   │ GET        │ /api/v1/customers/{id}    │ Retrieve Customer Details   │ 200 OK / 404 NF │
   ├────────────┼───────────────────────────┼─────────────────────────────┼─────────────────┤
   │ PUT        │ /api/v1/customers/{id}    │ Full Replace Customer       │ 200 OK          │
   ├────────────┼───────────────────────────┼─────────────────────────────┼─────────────────┤
   │ PATCH      │ /api/v1/customers/{id}    │ Partial Update Customer     │ 200 OK          │
   ├────────────┼───────────────────────────┼─────────────────────────────┼─────────────────┤
   │ DELETE     │ /api/v1/customers/{id}    │ Delete Customer Record      │ 204 No Content  │
   └────────────┴───────────────────────────┴─────────────────────────────┴─────────────────┘
```

---

## Syntax & Essential Flask Patterns

```python
from flask import Flask, Blueprint, request, jsonify

# 1. Blueprint Modularization (Separating features into independent modules)
users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")

# In-Memory Database Store
DATABASE = {
    101: {"id": 101, "username": "hesamp", "email": "hesam@domain.com"}
}

# 2. RESTful Route Handlers
@users_bp.route("", methods=["GET"])
def list_users():
    return jsonify({"users": list(DATABASE.values()), "count": len(DATABASE)}), 200

@users_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id: int):
    user = DATABASE.get(user_id)
    if not user:
        return jsonify({"error": "NOT_FOUND", "message": f"User #{user_id} not found."}), 404
    return jsonify(user), 200

@users_bp.route("", methods=["POST"])
def create_user():
    payload = request.get_json()
    if not payload or "username" not in payload or "email" not in payload:
        return jsonify({"error": "BAD_REQUEST", "message": "Missing username or email."}), 400

    new_id = max(DATABASE.keys(), default=100) + 1
    new_user = {"id": new_id, "username": payload["username"], "email": payload["email"]}
    DATABASE[new_id] = new_user
    return jsonify(new_user), 201  # 201 Created!

# 3. Application Factory Pattern
def create_app(config_override=None):
    app = Flask(__name__)
    app.register_blueprint(users_bp)
    return app
```

---

## Detailed Explanation

### 1. The Application Factory Pattern (`create_app()`)

In novice tutorials, Flask apps are created as global singletons (`app = Flask(__name__)`).

#### Why Global App Singletons are an Anti-Pattern:
- **Unit Testing**: You cannot spin up isolated test instances with different configurations (e.g. In-Memory SQLite vs Postgres).
- **Circular Imports**: Importing `app` across multiple route files causes circular import crashes.

**The Production Solution: Application Factory**:
Wrap app creation in a function `create_app(config=None)`. This allows tests, CLI commands, and production WSGI servers to instantiate cleanly configured application instances on demand.

---

### 2. Request Parsing & Validation

Flask provides the **`request`** context proxy to inspect incoming HTTP requests:

- **`request.get_json(silent=True)`**: Parses the incoming `application/json` payload into a Python dictionary. Setting `silent=True` returns `None` instead of raising an unhandled exception if the JSON is malformed.
- **`request.args.get("limit", default=10, type=int)`**: Extracts and type-casts URL query parameters (`?limit=10`).
- **`request.headers.get("Authorization")`**: Extracts incoming HTTP headers.

---

### 3. Centralized JSON Error Handling Middleware

By default, when an unhandled error occurs, Flask returns an ugly HTML error page. In a REST API, **all responses—especially errors—must return structured JSON**:

```python
from werkzeug.exceptions import HTTPException

def register_error_handlers(app: Flask):
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Translates all standard HTTP errors into uniform JSON error envelopes."""
        response = e.get_response()
        response.data = jsonify({
            "status_code": e.code,
            "error_name": e.name,
            "description": e.description,
        }).data
        response.content_type = "application/json"
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_server_error(e):
        """Catches unexpected 500 errors and prevents leaking stack traces."""
        return jsonify({
            "status_code": 500,
            "error_name": "Internal Server Error",
            "description": "An unexpected server error occurred. Our engineering team has been notified."
        }), 500
```

---

## Examples

### 1. Simple: Minimal JSON Health Check Endpoint
Creating a minimal Flask endpoint returning status metrics.

```python
from flask import Flask, jsonify
import time

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "HEALTHY",
        "timestamp": time.time(),
        "version": "1.0.0"
    }), 200

# Client test simulation using Flask test_client
client = app.test_client()
res = client.get("/health")
print("Health Check Response:", res.status_code, "->", res.get_json())
```

### 2. Beginner: Complete In-Memory Task Manager REST API
Implementing full CRUD (Create, Read, Update, Delete) endpoints for a task manager.

```python
from flask import Flask, request, jsonify

app = Flask(__name__)
TASKS_DB = {}

@app.route("/api/v1/tasks", methods=["GET"])
def list_tasks():
    # Filter by query param: ?completed=true
    completed_param = request.args.get("completed")
    if completed_param is not None:
        is_completed = completed_param.lower() == "true"
        filtered = [t for t in TASKS_DB.values() if t["completed"] == is_completed]
        return jsonify({"tasks": filtered}), 200
    return jsonify({"tasks": list(TASKS_DB.values())}), 200

@app.route("/api/v1/tasks", methods=["POST"])
def create_task():
    body = request.get_json(silent=True) or {}
    title = body.get("title")
    if not title:
        return jsonify({"error": "Validation failed: 'title' is required."}), 400

    task_id = len(TASKS_DB) + 1
    new_task = {"id": task_id, "title": title, "completed": False}
    TASKS_DB[task_id] = new_task
    return jsonify(new_task), 201

@app.route("/api/v1/tasks/<int:task_id>", methods=["PATCH"])
def update_task_status(task_id: int):
    task = TASKS_DB.get(task_id)
    if not task:
        return jsonify({"error": f"Task #{task_id} not found."}), 404

    body = request.get_json(silent=True) or {}
    if "completed" in body:
        task["completed"] = bool(body["completed"])
    if "title" in body:
        task["title"] = str(body["title"])

    return jsonify(task), 200

@app.route("/api/v1/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id: int):
    if task_id in TASKS_DB:
        del TASKS_DB[task_id]
        return "", 204  # 204 No Content!
    return jsonify({"error": f"Task #{task_id} not found."}), 404
```

### 3. Intermediate: Modular Architecture with Flask Blueprints
Organizing a multi-resource application into modular Blueprint components.

```python
from flask import Flask, Blueprint, jsonify

# Module 1: Auth Blueprint
auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
@auth_bp.route("/login", methods=["POST"])
def login():
    return jsonify({"token": "jwt_token_sample_123"}), 200

# Module 2: Catalog Blueprint
catalog_bp = Blueprint("catalog", __name__, url_prefix="/api/v1/catalog")
@catalog_bp.route("/products", methods=["GET"])
def get_products():
    return jsonify({"products": ["Laptop", "Monitor", "Keyboard"]}), 200

# Application Factory
def create_enterprise_app():
    application = Flask(__name__)
    application.register_blueprint(auth_bp)
    application.register_blueprint(catalog_bp)
    return application

app_instance = create_enterprise_app()
test_client = app_instance.test_client()

print("Auth Route    :", test_client.post("/api/v1/auth/login").get_json())
print("Catalog Route :", test_client.get("/api/v1/catalog/products").get_json())
```

### 4. Real-World: JWT Bearer Authentication Middleware Decorator
Enforcing security authentication on protected endpoints using a reusable custom decorator.

```python
from functools import wraps
from flask import Flask, request, jsonify

app = Flask(__name__)
MOCK_VALID_TOKENS = {"secret_jwt_token_alpha": "user_hesamp"}

def require_jwt_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "error": "UNAUTHORIZED",
                "message": "Missing or malformed Authorization header. Expected 'Bearer <token>'"
            }), 401

        token = auth_header.split(" ")[1]
        username = MOCK_VALID_TOKENS.get(token)
        if not username:
            return jsonify({
                "error": "FORBIDDEN",
                "message": "Invalid or expired JWT token."
            }), 403

        # Attach authenticated user to request context
        request.current_user = username
        return func(*args, **kwargs)
    return wrapper

@app.route("/api/v1/account/billing", methods=["GET"])
@require_jwt_auth
def get_billing_data():
    return jsonify({
        "user": request.current_user,
        "balance": 1500.00,
        "subscription": "ENTERPRISE_TIER"
    }), 200

test_client = app.test_client()

# 1. Unauthenticated Request -> 401 Unauthorized
print("Test 1 (No Auth)   :", test_client.get("/api/v1/account/billing").status_code) # 401

# 2. Authenticated Request -> 200 OK
auth_headers = {"Authorization": "Bearer secret_jwt_token_alpha"}
res = test_client.get("/api/v1/account/billing", headers=auth_headers)
print("Test 2 (With Auth) :", res.status_code, "->", res.get_json())
```

### 5. Advanced: Structured Request Payload Validation with Custom Schemas
Validating JSON payload structures and returning detailed field-level error messages.

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

def validate_user_registration(payload: dict) -> list[str]:
    """Validates schema invariants and returns list of validation error messages."""
    errors = []
    if not isinstance(payload.get("username"), str) or len(payload["username"]) < 3:
        errors.append("Field 'username' must be a string with at least 3 characters.")
    if not isinstance(payload.get("email"), str) or "@" not in payload["email"]:
        errors.append("Field 'email' must be a valid email address.")
    if not isinstance(payload.get("age"), int) or payload["age"] < 18:
        errors.append("Field 'age' must be an integer >= 18.")
    return errors

@app.route("/api/v1/users/register", methods=["POST"])
def register_user():
    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload, dict):
        return jsonify({"error": "BAD_REQUEST", "message": "Invalid JSON body."}), 400

    validation_errors = validate_user_registration(payload)
    if validation_errors:
        return jsonify({
            "error": "UNPROCESSABLE_ENTITY",
            "message": "Input validation failed.",
            "details": validation_errors
        }), 422  # 422 Unprocessable Entity!

    return jsonify({"status": "SUCCESS", "username": payload["username"]}), 201
```

---

## Code Explanation

In Example 5 (`Payload Validation`):
1. `request.get_json(silent=True)` safely parses the input body without throwing unhandled exceptions.
2. `validate_user_registration(payload)` verifies data invariants (type assertions, string lengths, numeric ranges), accumulating errors in a list.
3. If errors are present, the endpoint returns **`HTTP 422 Unprocessable Entity`** with a structured list of field-level descriptions.
4. This enforces the **Fail-Fast Principle** and provides clear, actionable feedback to API consumers (frontends and mobile apps).

---

## Common Mistakes

### Mistake 1: Using Verbs in URI Paths (RPC Anti-Pattern)
Writing paths like `/api/getUserById`, `/api/updateUser`, or `/api/deleteUser` violates REST. Use **Nouns** for URIs and **HTTP Verbs** for actions:
- `GET /api/users/101`
- `PATCH /api/users/101`
- `DELETE /api/users/101`

### Mistake 2: Using `app.run()` in Production
Calling `app.run(debug=True)` runs Flask's single-threaded, development server. In production, this server crashes under concurrency and exposes an interactive debugger security hole. Always run Flask behind a production WSGI server like **Gunicorn** or **uWSGI**.

---

## Best Practices

### Deploy with Gunicorn Behind NGINX
Run your Flask application factory using Gunicorn with pre-forked worker processes:

```bash
# Run Gunicorn with 4 worker processes binding to port 8000:
gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"
```

---

## Performance Considerations

1. **Gunicorn Worker Models**: Use `sync` workers for CPU-bound APIs, and `gevent` or `eventlet` workers for I/O-bound APIs with long-lived network calls.
2. **Response Compression**: Use `Flask-Compress` (Gzip/Brotli) to compress JSON response payloads, reducing network bandwidth by **up to 70%**.

---

## Security Considerations

1. **Cross-Origin Resource Sharing (CORS)**: When frontends reside on a different domain (`app.company.com` vs `api.company.com`), use **`Flask-CORS`** to configure explicit, whitelisted `Access-Control-Allow-Origin` headers.
2. **Rate Limiting**: Protect endpoints against brute-force attacks and abuse using **`Flask-Limiter`** (e.g. `@limiter.limit("5/minute")` on login endpoints).

---

## Real-World Usage

- **Microservice APIs**: Inter-service communication across Docker and Kubernetes clusters.
- **Webhook Handlers**: Receiving and verifying webhook payloads from Stripe, GitHub, and Shopify.
- **Machine Learning Inference Endpoints**: Serving PyTorch and Scikit-Learn predictions via JSON REST APIs.

---

## Comparison: Python Web Frameworks

| Dimension | Flask | FastAPI | Django REST Framework (DRF) |
|---|---|---|---|
| **Architecture** | **WSGI Micro-Framework** | **ASGI Asynchronous Framework** | Full-Stack Monolithic Framework |
| **Learning Curve** | **Low / Minimal** | Moderate | Steep |
| **Type Validation** | Manual / Marshmallow | **Automatic via Pydantic** | Django Serializers |
| **OpenAPI / Docs** | Via extensions | **Automatic (`/docs`)** | Via extensions |
| **Best Used For** | **Microservices, Webhooks, APIs**| **High-Performance Async APIs** | **Large Database-Driven Apps** |

---

## Advanced Concepts: WSGI Architecture & Middleware

Under the hood, Flask is a WSGI application (`def app(environ, start_response)`). You can wrap Flask in custom WSGI middleware to manipulate raw headers before Flask even routes the request:

```python
class CustomHeaderMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            headers.append(("X-Powered-By", "EnterprisePythonFramework"))
            return start_response(status, headers, exc_info)
        return self.wsgi_app(environ, custom_start_response)

# Apply WSGI middleware:
# app.wsgi_app = CustomHeaderMiddleware(app.wsgi_app)
```

---

## Exercises

### Exercise 1 — Beginner
Create a Flask application with a `GET /api/v1/ping` endpoint that returns `{"status": "PONG", "timestamp": ...}` with status code 200. Write a test using `app.test_client()`.

### Exercise 2 — Intermediate
Build a `CustomerBlueprint` with `POST /api/v1/customers` (creating a customer), `GET /api/v1/customers/<int:id>`, and `DELETE /api/v1/customers/<int:id>`. Implement input validation and test all 3 endpoints.

### Exercise 3 — Advanced
Build a global `@app.errorhandler` suite that catches custom domain exceptions (`ResourceNotFoundError`, `DuplicateEntityError`) and translates them into uniform JSON responses following the **RFC 7807 (Problem Details for HTTP APIs)** specification.

---

## Mini Project: Enterprise Modular E-Commerce Inventory & Order REST API

### Requirements
Build an operational REST API service named `ecommerce_api_service.py`. Implement the Application Factory pattern, Blueprint modularization for Inventory and Orders, JSON schema validation, structured error handlers, and comprehensive test suite validation.

### Implementation Blueprint
```python
from flask import Flask, Blueprint, request, jsonify
from datetime import datetime, timezone

# =====================================================================
# 1. INVENTORY BLUEPRINT
# =====================================================================

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/v1/inventory")

INVENTORY_DB = {
    "SKU-001": {"sku": "SKU-001", "name": "Mechanical Keyboard", "price": 140.00, "stock": 25},
    "SKU-002": {"sku": "SKU-002", "name": "4K Ultra Monitor", "price": 450.00, "stock": 10},
}

@inventory_bp.route("", methods=["GET"])
def list_inventory():
    return jsonify({"items": list(INVENTORY_DB.values()), "total": len(INVENTORY_DB)}), 200

@inventory_bp.route("/<string:sku>", methods=["GET"])
def get_item(sku: str):
    item = INVENTORY_DB.get(sku.upper())
    if not item:
        return jsonify({"error": "NOT_FOUND", "message": f"Item '{sku}' does not exist."}), 404
    return jsonify(item), 200

# =====================================================================
# 2. ORDERS BLUEPRINT
# =====================================================================

orders_bp = Blueprint("orders", __name__, url_prefix="/api/v1/orders")
ORDERS_DB = {}

@orders_bp.route("", methods=["POST"])
def place_order():
    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload, dict):
        return jsonify({"error": "BAD_REQUEST", "message": "Invalid JSON body."}), 400

    sku = payload.get("sku", "").upper()
    qty = payload.get("quantity", 0)

    # 1. Validation
    if sku not in INVENTORY_DB:
        return jsonify({"error": "NOT_FOUND", "message": f"Product '{sku}' not found."}), 404
    if not isinstance(qty, int) or qty <= 0:
        return jsonify({"error": "UNPROCESSABLE_ENTITY", "message": "Quantity must be positive int."}), 422

    product = INVENTORY_DB[sku]
    if product["stock"] < qty:
        return jsonify({
            "error": "CONFLICT",
            "message": f"Insufficient stock. Available: {product['stock']}, Requested: {qty}"
        }), 409

    # 2. Deduct Inventory & Create Order
    product["stock"] -= qty
    order_id = f"ORD-{len(ORDERS_DB) + 1:04d}"
    order_record = {
        "order_id": order_id,
        "sku": sku,
        "quantity": qty,
        "total_amount": round(product["price"] * qty, 2),
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    }
    ORDERS_DB[order_id] = order_record
    
    print(f"📦 [ORDER CREATED] {order_id} for {qty}x {sku} (Remaining Stock: {product['stock']})")
    return jsonify(order_record), 201

# =====================================================================
# 3. APPLICATION FACTORY
# =====================================================================

def create_ecommerce_app():
    app = Flask(__name__)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(orders_bp)

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({"error": "NOT_FOUND", "message": "The requested endpoint does not exist."}), 404

    return app

if __name__ == "__main__":
    print("=" * 68)
    print("      ENTERPRISE FLASK REST API INTEGRATION SUITE")
    print("=" * 68)
    
    app = create_ecommerce_app()
    client = app.test_client()
    
    # 1. Query Inventory List
    print("\n1. GET /api/v1/inventory:")
    res = client.get("/api/v1/inventory")
    print("Status:", res.status_code, "->", res.get_json())
    
    # 2. Place Successful Order (2x SKU-001)
    print("\n2. POST /api/v1/orders (Valid):")
    res = client.post("/api/v1/orders", json={"sku": "SKU-001", "quantity": 2})
    print("Status:", res.status_code, "->", res.get_json())
    
    # 3. Place Failed Order (Insufficient Stock)
    print("\n3. POST /api/v1/orders (Exceeds Stock):")
    res = client.post("/api/v1/orders", json={"sku": "SKU-001", "quantity": 100})
    print("Status:", res.status_code, "->", res.get_json())
    
    # 4. Query 404 Unknown Endpoint
    print("\n4. GET /api/v1/unknown_route (404 Handler):")
    res = client.get("/api/v1/unknown_route")
    print("Status:", res.status_code, "->", res.get_json())
    print("\n" + "=" * 68)
```

---

## Summary

In this lesson, you mastered building RESTful APIs with Flask:
- **REST APIs** structure services around **Resources (Nouns)** and standard **HTTP Verbs** (`GET`, `POST`, `PATCH`, `DELETE`).
- Use the **Application Factory Pattern (`create_app()`)** to enable flexible multi-environment configuration and testing.
- Organize features modularly using **Flask Blueprints**.
- Use **`request.get_json(silent=True)`** and validate input payloads to return structured **`422 Unprocessable Entity`** errors.
- Implement **Global Error Handlers (`@app.errorhandler`)** to guarantee all errors return clean JSON.
- Deploy Flask applications using production WSGI servers like **Gunicorn** behind NGINX.

---

## Best Practices Checklist

- [ ] Use nouns for URI endpoints (`/api/v1/orders`), never verbs (`/api/v1/createOrder`).
- [ ] Use standard HTTP status codes (200, 201, 204, 400, 401, 404, 422, 500).
- [ ] Structure applications with the Application Factory pattern (`create_app()`).
- [ ] Modularize route controllers with Flask Blueprints.
- [ ] Implement global error handlers returning uniform JSON envelopes.
- [ ] Never use `app.run()` in production; deploy with Gunicorn.

---

## 🏆 MODULE 8: NETWORKING & REST APIS COMPLETE!

Congratulations! You have completed all 3 comprehensive articles of **Module 8: Networking & REST APIs in Depth**.

### What's Next?
Now advance to **Module 9: Testing & Quality Assurance**:
👉 **[Testing & Quality Assurance Module Overview](../testing/README.md)** to master Unit Testing with `unittest` and `pytest`, Fixtures, Parametrization, Mocking (`unittest.mock`), and Test Coverage!
