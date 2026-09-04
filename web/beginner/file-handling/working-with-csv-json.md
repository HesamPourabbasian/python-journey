# Working with CSV & JSON Data in Python

## Introduction

In modern software development, data rarely exists in isolation. Applications constantly exchange information with external relational databases, third-party REST APIs, payment gateways, machine learning datasets, and analytical spreadsheets. To facilitate interoperability across disparate operating systems and programming languages, the industry relies on standardized text-based serialization formats: **CSV (Comma-Separated Values)** and **JSON (JavaScript Object Notation)**.

- **CSV**: The universal standard for **flat, tabular data** (rows and columns). It is the backbone of financial spreadsheets, database exports, and data science pipelines.
- **JSON**: The universal standard for **hierarchical, structured documents** and the lingua franca of modern RESTful web services and NoSQL databases.

Python provides dedicated, high-performance standard library modules—**`csv`** and **`json`**—designed to parse, validate, and serialize structured data seamlessly without installing third-party packages.

Mastering CSV and JSON handling requires understanding the mandatory `newline=""` parameter in CSV file streams, using `csv.DictReader` and `csv.DictWriter` for header-driven parsing, managing Python-to-JSON data type mappings, building custom encoders for non-standard types (such as `datetime` and `Decimal`), and protecting systems from **CSV Formula Injection attacks**.

This lesson builds directly upon [Reading & Writing Files](reading-writing-files.md) and [Context Managers](context-managers-with-statement.md), advancing your data engineering capabilities.

---

## Prerequisites

Before studying CSV and JSON handling, ensure you have:

- Completed [Reading & Writing Files](reading-writing-files.md) and [Context Managers](context-managers-with-statement.md).
- Completed [Dictionaries & Hash Tables](../collections/dictionaries.md) and [Lists & Dynamic Arrays](../collections/lists.md).
- A solid grasp of Python string manipulation methods (`.split()`, `.strip()`, `.join()`).

---

## Core Concept: Tabular vs Hierarchical Serialization

```
                            CSV vs JSON DATA REPRESENTATION

      TABULAR FORMAT: CSV (csv module)                 HIERARCHICAL FORMAT: JSON (json module)
   ┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
   │ id,name,role,salary                    │       │ {                                      │
   │ 101,Hesam,Admin,140000                 │       │   "id": 101,                           │
   │ 102,Sarah,Editor,110000                │       │   "name": "Hesam",                     │
   └────────────────────────────────────────┘       │   "roles": ["Admin", "Security"],      │
   • Flat 2D rows and columns                       │   "metadata": {"active": true}         │
   • Untyped (All values read as strings)           │ }                                      │
   • Ideal for spreadsheets & databases             └────────────────────────────────────────┘
                                                    • Nested hierarchical trees
                                                    • Strongly typed (bool, int, null, list)
                                                    • Ideal for REST APIs & Web Apps
```

---

## Syntax & Essential Operations

### 1. CSV Processing with `csv.DictReader` and `csv.DictWriter`
```python
import csv

# Writing CSV with DictWriter
employees = [
    {"id": "101", "name": "Hesam", "dept": "Engineering", "salary": "140000"},
    {"id": "102", "name": "Sarah", "dept": "Design", "salary": "110000"},
]

# NOTE: Always use newline="" when opening files for the csv module!
with open("employees.csv", "w", newline="", encoding="utf-8") as f:
    fields = ["id", "name", "dept", "salary"]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(employees)

# Reading CSV with DictReader
with open("employees.csv", "r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"Employee: {row['name']} ({row['dept']}) -> ${int(row['salary']):,d}")
```

### 2. JSON Processing with `json`
```python
import json

payload = {
    "service": "BillingAPI",
    "version": 2.4,
    "active": True,
    "endpoints": ["/invoices", "/charges"],
    "rate_limit": None
}

# 1. Serialization (Python Dict -> JSON String)
json_str = json.dumps(payload, indent=2)

# 2. File Writing (Python Dict -> JSON File)
with open("service_config.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2)

# 3. Deserialization (JSON String -> Python Dict)
data_from_str = json.loads(json_str)

# 4. File Reading (JSON File -> Python Dict)
with open("service_config.json", "r", encoding="utf-8") as f:
    data_from_file = json.load(f)
```

---

## Detailed Explanation

### 1. The Mandatory `newline=""` Rule in CSV Files

When reading or writing CSV files in Python 3, you **must open the file with `newline=""`**:

```python
with open("data.csv", "w", newline="", encoding="utf-8") as f:  # MANDATORY newline=""
    writer = csv.writer(f)
```

#### Why?
The `csv` module implements its own internal newline handling according to RFC 4180 (which mandates `\r\n` carriage returns). If you omit `newline=""`, Python's default text translation layer intercepts `\r\n` and translates it into `\r\r\n` on Windows, causing **blank lines to appear between every row** in the generated CSV file.

---

### 2. Python to JSON Type Mapping Matrix

JSON and Python share similar data models, but their native data types map differently:

| Python Type | JSON Type | Notes |
|---|---|---|
| `dict` | **Object (`{}`)** | Keys in JSON must always be strings! |
| `list`, `tuple` | **Array (`[]`)** | Tuples are serialized to JSON arrays |
| `str` | **String (`""`)** | Unicode strings |
| `int`, `float` | **Number** | IEEE 754 floats / Integers |
| `True` / `False` | **`true` / `false`** | Lowercase in JSON |
| `None` | **`null`** | Null value in JSON |
| `set`, `datetime`, `Decimal`| **NOT SUPPORTED** | **Raises `TypeError` without custom serializer!** |

---

### 3. Custom JSON Encoders for `datetime` and `Decimal`

Attempting to serialize a Python `datetime` or `decimal.Decimal` with standard `json.dumps()` raises `TypeError: Object of type datetime is not JSON serializable`.

To serialize custom types, supply a custom fallback callable via the **`default=`** parameter:

```python
import json
from datetime import datetime, timezone
from decimal import Decimal

def custom_json_serializer(obj):
    """Custom serializer for non-standard JSON types."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

payload = {
    "timestamp": datetime.now(timezone.utc),
    "balance": Decimal("14500.50"),
    "status": "APPROVED"
}

# Serialize using custom default handler
json_output = json.dumps(payload, default=custom_json_serializer, indent=2)
print("Custom Serialized JSON:\n", json_output)
```

---

## Examples

### 1. Simple: Reading and Writing Tabular CSV Data
Generating a sales ledger CSV with `csv.writer` and reading it with `csv.reader`.

```python
import csv

sales_data = [
    ["Transaction_ID", "Product", "Units", "Unit_Price"],
    ["TX-1001", "Mechanical Keyboard", 3, 120.00],
    ["TX-1002", "Ultra-Wide Monitor", 1, 450.00],
    ["TX-1003", "Ergonomic Mouse", 5, 45.50],
]

# Write CSV
with open("sales_report.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(sales_data)

# Read CSV and calculate total revenue
total_revenue = 0.0
with open("sales_report.csv", "r", newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header row
    for row in reader:
        tx_id, product, units, price = row[0], row[1], int(row[2]), float(row[3])
        subtotal = units * price
        total_revenue += subtotal
        print(f"[{tx_id}] {product:<20} x {units} = ${subtotal:>8.2f}")

print(f"Total Sales Revenue: ${total_revenue:,.2f}")
```

### 2. Beginner: Parsing Delimited Data with Custom Delimiters (TSV / Pipe)
Processing a Pipe-Delimited (`|`) file using custom `delimiter` parameters.

```python
import csv

pipe_data = """USER_ID|USERNAME|ROLE|STATUS
1001|hesamp|SUPERUSER|ACTIVE
1002|sarahk|EDITOR|ACTIVE
1003|alexdev|VIEWER|PENDING"""

with open("users.psv", "w", newline="", encoding="utf-8") as f:
    f.write(pipe_data)

# Read pipe-delimited file using DictReader
with open("users.psv", "r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="|")
    for user in reader:
        print(f"User #{user['USER_ID']}: {user['USERNAME']} [{user['ROLE']}] -> {user['STATUS']}")
```

### 3. Intermediate: Resilient JSON REST API Response Ingestion
Parsing JSON responses from an API with validation and `json.JSONDecodeError` handling.

```python
import json

def parse_api_payload(raw_json_response: str) -> dict | None:
    try:
        data = json.loads(raw_json_response)
        
        # Schema validation
        if not isinstance(data, dict) or "status" not in data:
            raise ValueError("Malformed API schema: Missing 'status' field.")
            
        return data
    except json.JSONDecodeError as decode_err:
        print(f"🚨 [JSON SYNTAX ERROR] Failed to parse JSON at line {decode_err.lineno}, col {decode_err.colno}: {decode_err.msg}")
        return None
    except ValueError as val_err:
        print(f"⚠️ [SCHEMA ERROR] {val_err}")
        return None

# Test valid and invalid payloads
print("Valid Payload   :", parse_api_payload('{"status": "SUCCESS", "records": [1, 2, 3]}'))
print("Corrupted Syntax:", parse_api_payload('{"status": "SUCCESS", "records": [1, 2, ')) # Missing closing bracket
```

### 4. Real-World: Converting CSV Reports to Hierarchical JSON
Building an automated ETL pipeline that converts flat CSV spreadsheets into nested JSON documents.

```python
import csv
import json

def convert_csv_to_json(csv_filepath: str, json_filepath: str):
    """Convert flat CSV rows into a structured hierarchical JSON file."""
    records = []
    
    with open(csv_filepath, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Transform and type-cast flat string fields
            record = {
                "id": int(row["id"]),
                "product_info": {
                    "title": row["name"].strip(),
                    "category": row["category"].strip()
                },
                "pricing": {
                    "price_usd": float(row["price"]),
                    "in_stock": row["in_stock"].strip().lower() in ("true", "1", "yes")
                }
            }
            records.append(record)
            
    with open(json_filepath, "w", encoding="utf-8") as f:
        json.dump({"catalog_count": len(records), "items": records}, f, indent=2)
        
    print(f"✅ Converted {len(records)} CSV records -> {json_filepath}")

# Create mock source CSV
with open("inventory.csv", "w", newline="", encoding="utf-8") as f:
    f.write("id,name,category,price,in_stock\n")
    f.write("101,Developer Laptop,Electronics,1299.99,true\n")
    f.write("102,Wireless Mouse,Accessories,45.00,true\n")
    f.write("103,USB Desk Fan,Office,18.50,false\n")

convert_csv_to_json("inventory.csv", "inventory_nested.json")

# Verify JSON output
with open("inventory_nested.json", "r", encoding="utf-8") as f:
    print("Generated Nested JSON Preview:\n", f.read())
```

### 5. Advanced: Automatic Dialect Detection with `csv.Sniffer`
Using Python's built-in `csv.Sniffer` utility to automatically detect file delimiters (comma, tab, semicolon, pipe) and header presence without hardcoded assumptions.

```python
import csv

raw_sample_data = "timestamp;server;cpu_usage;memory_usage\n2024-05-18;srv-01;45.2;68.1\n2024-05-18;srv-02;89.0;92.4\n"

with open("telemetry.log", "w", newline="", encoding="utf-8") as f:
    f.write(raw_sample_data)

# Sniff dialect dynamically
with open("telemetry.log", "r", newline="", encoding="utf-8") as f:
    sample_chunk = f.read(1024)
    f.seek(0)
    
    # 1. Detect Delimiter & Dialect
    sniffer = csv.Sniffer()
    dialect = sniffer.sniff(sample_chunk)
    has_header = sniffer.has_header(sample_chunk)
    
    print(f"🔍 [SNIFFER] Detected Delimiter : '{dialect.delimiter}'")
    print(f"🔍 [SNIFFER] Has Header Row?   : {has_header}")
    
    # 2. Parse using detected dialect
    reader = csv.DictReader(f, dialect=dialect)
    for row in reader:
        print(f"  -> Server: {row['server']}, CPU: {row['cpu_usage']}%, RAM: {row['memory_usage']}%")
```

---

## Code Explanation

In Example 5 (`csv.Sniffer`):
1. `csv.Sniffer().sniff(sample)` analyzes character distributions and patterns within a 1KB file sample to determine the delimiter (comma, semicolon, tab, pipe) and quote character.
2. `sniffer.has_header(sample)` checks whether the first row consists of strings while subsequent rows contain numbers, determining if a header exists.
3. Passing `dialect=dialect` into `csv.DictReader` instructs Python to use the detected formatting rules dynamically.
4. This allows building universal CSV parsers capable of ingesting arbitrary user-uploaded data files automatically.

---

## Common Mistakes

### Mistake 1: Forgetting `newline=""` in CSV Files
Omitting `newline=""` causes Windows machines to write duplicate `\r\r\n` newlines, rendering CSV files unreadable in Microsoft Excel.

### Mistake 2: Confusing `json.dump()` with `json.dumps()`
- **`json.dump(obj, file_stream)`**: Writes directly to a file object (no 's' at the end).
- **`json.dumps(obj) -> str`**: Serializes to a Python **String** ('s' stands for string).

---

## Best Practices

### Always Use `DictReader` and `DictWriter` for Tabular Files
Avoid accessing columns by magic integer indices (`row[3]`). Using `DictReader` binds values to header names (`row["salary"]`), making code self-documenting and resilient to column re-ordering.

Good:
```python
reader = csv.DictReader(f)
for row in reader:
    email = row["email"]
```

Avoid:
```python
reader = csv.reader(f)
for row in reader:
    email = row[3]  # Fragile magic number index!
```

---

## Performance Considerations

1. **Streaming Large CSV Files**: `csv.DictReader` processes files line-by-line in $O(1)$ memory. Never read entire 50 GB CSVs into memory at once.
2. **Third-Party JSON Accelerators (`orjson` / `ujson`)**: Python's standard `json` module is fast for standard workloads. In high-throughput async microservices handling 50,000 requests/second, third-party C/Rust-accelerated libraries (such as `orjson`) provide **5x to 10x faster** serialization.

---

## Security Considerations: CSV Formula Injection (DDE)

If user-controlled text (e.g., a username or comment) begins with `=`, `+`, `-`, or `@`, spreadsheet software (such as Microsoft Excel or Google Sheets) will **execute the cell contents as an executable formula** (e.g., `=cmd|' /C calc'!A0`) when an administrator opens the exported CSV file!

**The Security Fix**: Prepend a single quote `'` or tab to any field starting with formula trigger characters before writing to CSV:

```python
def sanitize_csv_field(val: str) -> str:
    """Neutralize spreadsheet formula injection vulnerabilities."""
    if isinstance(val, str) and val.startswith(("=", "+", "-", "@")):
        return f"'{val}"  # Escape formula execution in Excel
    return val
```

---

## Real-World Usage

- **E-Commerce Inventory Exports**: Generating daily catalog spreadsheets for logistics and warehouse management.
- **REST API Payload Handling**: Serializing JSON webhooks in FastAPI and Django REST Framework.
- **Data Engineering Ingestion**: Parsing customer transactions and loading into Amazon Redshift or Snowflake data warehouses.

---

## Comparison: CSV vs JSON

| Metric | CSV (`csv` module) | JSON (`json` module) |
|---|---|---|
| **Data Structure** | 2D Tabular (Rows & Columns)| Hierarchical (Nested Trees) |
| **Typing Support** | Untyped (All strings) | **Strongly Typed** (Numbers, Booleans, Null)|
| **File Size** | **Compact (No key duplication)**| Larger (Keys repeated per record)|
| **Excel Compatibility**| **Native 1-Click Open** | Requires parsing |
| **Best For** | Bulk tabular reports, datasets| REST APIs, configs, polymorphic docs |

---

## Advanced Concepts: JSON Object Hook Custom Deserialization

Using `object_hook`, you can automatically convert JSON objects into custom Python domain dataclasses during `json.loads()`:

```python
from dataclasses import dataclass

@dataclass
class UserProfile:
    id: int
    name: str
    role: str

def user_profile_decoder(dict_payload: dict):
    if "id" in dict_payload and "name" in dict_payload and "role" in dict_payload:
        return UserProfile(dict_payload["id"], dict_payload["name"], dict_payload["role"])
    return dict_payload

raw_json = '{"id": 1042, "name": "Hesam", "role": "Admin"}'
user_obj = json.loads(raw_json, object_hook=user_profile_decoder)

print("Deserialized Object Type:", type(user_obj))  # <class '__main__.UserProfile'>
print("User Name                :", user_obj.name)  # "Hesam"
```

---

## Exercises

### Exercise 1 — Beginner
Create a list of 4 user dictionaries with fields `user_id`, `username`, `email`, and `is_active`. Write this data to a CSV file named `users.csv` using `csv.DictWriter`. Re-read the file with `csv.DictReader` and print the active users.

### Exercise 2 — Intermediate
Write a function `validate_json_config(filepath: str, required_keys: list[str]) -> bool` that loads a JSON configuration file, catches `JSONDecodeError` if invalid, and verifies that all `required_keys` are present in the top-level dictionary.

### Exercise 3 — Advanced
Build a `CSVToJSONStreamingConverter` class that streams a 100,000-row CSV file line by line, groups transactions by customer ID, and writes a grouped JSON file where each customer maps to an array of their purchased transactions.

---

## Mini Project: Enterprise E-Commerce Order Importer & Tabular Converter Pipeline

### Requirements
Build an end-to-end data processing engine named `ecommerce_etl_pipeline.py` that ingests raw customer order CSV spreadsheets, sanitizes formula injection risks, computes order subtotals and discounts, converts records into nested JSON documents, and exports summary audit reports.

### Implementation Blueprint
```python
import csv
import json
from datetime import datetime, timezone

class ECommerceETLPipeline:
    @staticmethod
    def sanitize_field(val: any) -> any:
        """Prevent CSV formula injection."""
        if isinstance(val, str) and val.startswith(("=", "+", "-", "@")):
            return f"'{val}"
        return val

    @classmethod
    def process_orders_csv_to_json(cls, csv_filepath: str, json_output_filepath: str) -> dict:
        print("=" * 65)
        print("           E-COMMERCE CSV TO JSON ETL PIPELINE")
        print("=" * 65)
        
        orders_by_customer = {}
        total_gross_revenue = 0.0
        total_orders_processed = 0
        
        with open(csv_filepath, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                total_orders_processed += 1
                cust_id = row["customer_id"].strip()
                item_name = cls.sanitize_field(row["item_name"].strip())
                qty = int(row["quantity"])
                unit_price = float(row["unit_price"])
                subtotal = qty * unit_price
                total_gross_revenue += subtotal
                
                order_entry = {
                    "order_id": row["order_id"].strip(),
                    "item": item_name,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "subtotal": round(subtotal, 2)
                }
                
                # Group orders by customer
                orders_by_customer.setdefault(cust_id, []).append(order_entry)
                
        # Construct final structured JSON payload
        export_payload = {
            "metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "total_orders": total_orders_processed,
                "total_gross_revenue": round(total_gross_revenue, 2)
            },
            "customers": [
                {
                    "customer_id": cid,
                    "order_count": len(orders),
                    "total_spend": round(sum(o["subtotal"] for o in orders), 2),
                    "orders": orders
                }
                for cid, orders in orders_by_customer.items()
            ]
        }
        
        with open(json_output_filepath, "w", encoding="utf-8") as f:
            json.dump(export_payload, f, indent=2)
            
        print(f"✅ Processed {total_orders_processed} orders across {len(orders_by_customer)} customers.")
        print(f"💰 Total Gross Revenue: ${total_gross_revenue:,.2f}")
        print(f"📦 Exported Structured JSON: {json_output_filepath}")
        print("=" * 65)
        
        return export_payload

if __name__ == "__main__":
    sample_csv = "raw_daily_orders.csv"
    output_json = "daily_orders_hierarchical.json"
    
    # Generate sample raw CSV
    with open(sample_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["order_id", "customer_id", "item_name", "quantity", "unit_price"])
        writer.writerow(["ORD-01", "CUST-901", "Developer Keyboard", 2, 140.00])
        writer.writerow(["ORD-02", "CUST-902", "4K Ultra-Wide Monitor", 1, 450.00])
        writer.writerow(["ORD-03", "CUST-901", "Thunderbolt 4 Cable", 3, 25.00])
        writer.writerow(["ORD-04", "CUST-903", "USB-C Hub", 1, 35.00])
        
    # Execute Pipeline
    result = ECommerceETLPipeline.process_orders_csv_to_json(sample_csv, output_json)
```

---

## Summary

In this lesson, you mastered Python's CSV and JSON serialization processing:
- Always use **`newline=""`** and explicit **`encoding="utf-8"`** when opening CSV files in Python.
- Prefer **`csv.DictReader`** and **`csv.DictWriter`** for self-documenting header-driven tabular parsing.
- Use **`json.dump()` / `json.load()`** for file streams and **`json.dumps()` / `json.loads()`** for in-memory strings.
- Pass **`default=custom_serializer`** to `json.dumps()` to serialize `datetime`, `Decimal`, and custom objects.
- Protect CSV exports from **Formula Injection attacks** by sanitizing leading `=`, `+`, `-`, or `@` characters.
- Use **`csv.Sniffer`** to auto-detect delimiters and header presence dynamically.

---

## Best Practices Checklist

- [ ] Always specify `newline=""` on CSV `open()` calls.
- [ ] Use `DictReader` and `DictWriter` instead of index-based row readers.
- [ ] Format human-readable JSON files with `indent=2`.
- [ ] Sanitize user strings before writing to CSV to prevent spreadsheet formula injection.
- [ ] Handle `json.JSONDecodeError` defensively when parsing external API responses.

---

## What's Next?

Now that you understand structured data files, continue to the final article in this module:
👉 **[Modern Filesystem Operations with `pathlib`](pathlib-module.md)** to master object-oriented path manipulation, cross-platform path arithmetic with `/`, and directory traversal.
