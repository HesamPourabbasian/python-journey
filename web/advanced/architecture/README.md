# 🏛️ Module 7: Software Architecture & Design Patterns

Welcome to the **Software Architecture & Design Patterns** module in Level 3.

As applications scale from single-developer prototypes to multi-team enterprise ecosystems, raw coding ability is no longer enough. The longevity, testability, and maintainability of a system depend on its **Software Architecture**.

This module bridges computer science theory and production systems engineering, exploring how to structure decoupled, testable, and highly resilient Python applications.

---

## 🎯 Module Overview

In this module, you will master:
- **Clean Architecture & Domain-Driven Design (DDD)**: Hexagonal / Onion / Clean Architecture layers (Entities, Use Cases, Interface Adapters, Frameworks), Dependency Inversion Principle, Repository Pattern, and Unit of Work.
- **Pythonic Design Patterns**: Implementing classic Gang of Four (GoF) patterns tailored for Python's dynamic language features (Factory, Strategy, Observer, Adapter, Decorator, Builder).
- **Microservices & Event-Driven Systems**: Distributed system boundaries, event-driven message brokers (Kafka/RabbitMQ), Command Query Responsibility Segregation (CQRS), and Saga distributed transactions.

---

## 📑 Articles in this Module

1. **[Clean Architecture & Domain-Driven Design](clean-architecture-and-ddd.md)**
   - The Dependency Rule, Hexagonal / Onion Architecture, Domain-Driven Design (Entities, Value Objects, Aggregates, Domain Events), Repository Pattern, and decoupling business logic from databases and web frameworks.
2. **[Pythonic Design Patterns](design-patterns-in-python.md)**
   - Gang of Four (GoF) design patterns reimagined in Python: Factory Method, Strategy with first-class functions, Observer with weak references, Adapter, and Unit of Work.
3. **[Microservices & Event-Driven Architecture](microservices-event-driven-architecture.md)**
   - Event-driven microservice patterns, asynchronous message brokers (Kafka/RabbitMQ), Event Sourcing, CQRS (Command Query Responsibility Segregation), and Saga orchestration vs choreography.

---

## 🗺️ Progression Path

```
clean-architecture-and-ddd.md ──► design-patterns-in-python.md ──► microservices-event-driven-architecture.md
                                                                                  │
                                                                                  ▼
                                         [Next Module: DevOps, Containerization & Observability](../devops/README.md)
```
