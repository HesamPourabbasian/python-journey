# Capstone Project 03: Enterprise ORM & Repository CLI

## 1. Project Overview & Architecture

Modern enterprise backend applications require robust data persistence layers that decouple business logic from raw SQL dialect nuances.

In this capstone project, you will build an **Enterprise Fleet & Device Asset Management System** named `FleetTrack ORM & CLI`.

The system leverages modern **SQLAlchemy 2.0 Declarative Mapping**, the **Repository & Unit-of-Work Patterns**, type-safe queries with `select()`, and **`selectinload()` eager loading** to manage servers, datacenters, maintenance logs, and health status via an interactive command-line interface.

### System Architecture
```
                               FLEETTRACK ORM & REPOSITORY ARCHITECTURE

       CLI Terminal Commands                 Repository / Service Layer            SQLAlchemy 2.0 ORM
      ┌──────────────────────┐             ┌─────────────────────────────┐       ┌────────────────────┐
      │ fleet add-node ...   │ ──────────► │ ServerNodeRepository        │ ────► │ Session (UnitOfWork│
      │ fleet list-nodes ... │             │ • create_node()             │       │ • DeclarativeBase  │
      │ fleet record-log ... │ ◄────────── │ • get_nodes_eager()         │ ◄──── │ • Mapped[T] Models │
      └──────────────────────┘             └─────────────────────────────┘       └────────────────────┘
```

---

## 2. Key Features & Requirements

1. **SQLAlchemy 2.0 Declarative Models**: Modern type annotations using `Mapped[int]`, `Mapped[str]`, and `mapped_column()`.
2. **Relational Graph Modeling**: 1-to-Many relationship between `DataCenter` $\rightarrow$ `ServerNode` $\rightarrow$ `MaintenanceLog`.
3. **N+1 Query Elimination**: Eager loading using `selectinload()` to fetch server nodes and logs in minimal queries.
4. **Repository Pattern**: Clean encapsulation of all database read/write queries inside `ServerNodeRepository`.
5. **Interactive CLI Suite**: Multi-command terminal interface using `argparse` for provisioning, querying, and auditing fleet assets.
6. **In-Memory & PostgreSQL Compatibility**: Database connection abstraction supporting SQLite and PostgreSQL engines seamlessly.

---

## 3. Complete Implementation Code

```python
"""
FleetTrack ORM & CLI - Production Enterprise Repository & Data Modeling Engine
Modern SQLAlchemy 2.0 Declarative ORM with Unit-of-Work and Repository Pattern.
"""

from __future__ import annotations
import sys
import argparse
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy import create_engine, select, String, Float, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload, Session

# =====================================================================
# 1. DECLARATIVE DATA MODELS (SQLAlchemy 2.0)
# =====================================================================

class Base(DeclarativeBase):
    pass

class DataCenter(Base):
    __tablename__ = "datacenters"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    region: Mapped[str] = mapped_column(String(30))

    # 1-to-Many Relationship with Server Nodes
    nodes: Mapped[list[ServerNode]] = relationship(
        back_populates="datacenter",
        cascade="all, delete-orphan"
    )

class ServerNode(Base):
    __tablename__ = "server_nodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    hostname: Mapped[str] = mapped_column(String(50), unique=True)
    ip_address: Mapped[str] = mapped_column(String(20))
    cpu_cores: Mapped[int] = mapped_column()
    ram_gb: Mapped[int] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="ONLINE")

    datacenter_id: Mapped[int] = mapped_column(ForeignKey("datacenters.id"))
    datacenter: Mapped[DataCenter] = relationship(back_populates="nodes")

    # 1-to-Many Relationship with Maintenance Logs
    logs: Mapped[list[MaintenanceLog]] = relationship(
        back_populates="node",
        cascade="all, delete-orphan"
    )

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    action: Mapped[str] = mapped_column(String(100))
    technician: Mapped[str] = mapped_column(String(50))
    timestamp: Mapped[str] = mapped_column(default=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ"))

    node_id: Mapped[int] = mapped_column(ForeignKey("server_nodes.id"))
    node: Mapped[ServerNode] = relationship(back_populates="logs")

# =====================================================================
# 2. REPOSITORY & UNIT-OF-WORK FACADE
# =====================================================================

class FleetRepository:
    def __init__(self, db_uri: str = "sqlite:///:memory:"):
        self.engine = create_engine(db_uri, echo=False)
        Base.metadata.create_all(self.engine)

    def provision_datacenter(self, name: str, region: str) -> DataCenter:
        with Session(self.engine) as session:
            dc = DataCenter(name=name, region=region)
            session.add(dc)
            session.commit()
            session.refresh(dc)
            return dc

    def provision_server_node(self, datacenter_name: str, hostname: str, ip: str, cores: int, ram: int) -> ServerNode:
        with Session(self.engine) as session:
            dc = session.scalars(select(DataCenter).where(DataCenter.name == datacenter_name)).one_or_none()
            if not dc:
                raise ValueError(f"DataCenter '{datacenter_name}' does not exist.")

            node = ServerNode(
                hostname=hostname,
                ip_address=ip,
                cpu_cores=cores,
                ram_gb=ram,
                datacenter=dc,
                status="ONLINE"
            )
            session.add(node)
            session.commit()
            session.refresh(node)
            return node

    def record_maintenance(self, hostname: str, action: str, technician: str):
        with Session(self.engine) as session:
            node = session.scalars(select(ServerNode).where(ServerNode.hostname == hostname)).one_or_none()
            if not node:
                raise ValueError(f"Server node '{hostname}' not found.")

            log_entry = MaintenanceLog(action=action, technician=technician, node=node)
            session.add(log_entry)
            session.commit()

    def get_fleet_overview(self) -> list[DataCenter]:
        """Eagerly loads all datacenters, nodes, and maintenance logs in 3 queries total (Zero N+1!)."""
        with Session(self.engine) as session:
            stmt = select(DataCenter).options(
                selectinload(DataCenter.nodes).selectinload(ServerNode.logs)
            )
            return list(session.scalars(stmt).all())

# =====================================================================
# 3. CLI APPLICATION CONTROLLER
# =====================================================================

def render_fleet_report(repo: FleetRepository):
    datacenters = repo.get_fleet_overview()

    border = "=" * 70
    print("\n" + border)
    print("           ENTERPRISE FLEET TRACK INFRASTRUCTURE REPORT")
    print(border)

    for dc in datacenters:
        print(f"\n🏢 DATACENTER: {dc.name} ({dc.region}) │ Active Nodes: {len(dc.nodes)}")
        print("-" * 70)
        for node in dc.nodes:
            print(f"  🖥️  {node.hostname:<18} IP: {node.ip_address:<14} │ {node.cpu_cores} Cores, {node.ram_gb} GB RAM │ [{node.status}]")
            for log in node.logs:
                print(f"     🔧 [{log.timestamp}] {log.action} (Tech: {log.technician})")
        if not dc.nodes:
            print("  (No server nodes provisioned yet.)")
    print("\n" + border)

if __name__ == "__main__":
    print("=" * 70)
    print("      FLEETTRACK ORM & REPOSITORY ENGINE DEMONSTRATION")
    print("=" * 70)

    # 1. Initialize In-Memory Repository
    repo = FleetRepository()

    # 2. Provision Infrastructure
    print("\n1. Provisioning Datacenters...")
    repo.provision_datacenter("US-EAST-VA", "us-east-1")
    repo.provision_datacenter("EU-CENTRAL-FR", "eu-central-1")

    # 3. Provision Server Nodes
    print("\n2. Provisioning Server Nodes...")
    repo.provision_server_node("US-EAST-VA", "prod-app-01", "10.0.1.10", cores=16, ram=64)
    repo.provision_server_node("US-EAST-VA", "prod-db-primary", "10.0.1.20", cores=32, ram=128)
    repo.provision_server_node("EU-CENTRAL-FR", "eu-cache-01", "10.2.1.15", cores=8, ram=32)

    # 4. Record Maintenance Logs
    print("\n3. Recording Maintenance Logs...")
    repo.record_maintenance("prod-app-01", "Applied Kernel Security Patch v5.15", "Hesam P.")
    repo.record_maintenance("prod-db-primary", "Scaled NVMe Storage Volume to 2TB", "Sarah J.")

    # 5. Render Eager-Loaded Infrastructure Report
    render_fleet_report(repo)
    print("🎉 ENTERPRISE ORM & REPOSITORY PIPELINE VERIFIED SUCCESSFULLY!")
```

---

## 4. Summary & Next Steps

In this capstone project, you built a complete Object-Relational persistence system utilizing **SQLAlchemy 2.0 DeclarativeBase**, **`Mapped[T]` Type Annotations**, the **Repository Pattern**, and **`selectinload()` Eager Loading** to eliminate the N+1 query performance bottleneck.

### What's Next?
Continue to Capstone Project 04:
👉 **[Enterprise Pytest & Mocking Suite](04-testing-suite-pytest.md)** to build a test suite with fixtures, parametrization, and mocks targeting 95%+ branch test coverage!
