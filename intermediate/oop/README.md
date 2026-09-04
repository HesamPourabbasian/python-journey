# 🏛️ Module 1: Object-Oriented Programming (OOP) in Depth

Welcome to the **Object-Oriented Programming (OOP)** module in Level 2.

In Python, "everything is an object"—from primitive integers and strings to functions, modules, and user-defined classes. While procedural programming groups code into linear routines and functions, Object-Oriented Programming structures software into cohesive, stateful **Entities** that bundle state (attributes) and behavior (methods) together.

---

## 🎯 Module Overview

This module provides a comprehensive deep dive into Python's object model:
- The distinction between classes (blueprints) and instances (objects) in CPython memory.
- Constructor lifecycle (`__new__` and `__init__`), instance dictionaries (`__dict__`), and memory optimization with `__slots__`.
- Encapsulation, name mangling (`_protected`, `__private`), and managed attributes via `@property`.
- Single and multiple inheritance, cooperative `super()`, and the C3 Superclass Linearization (MRO) algorithm.
- Abstract Base Classes (ABCs) and interface enforcement via the `abc` module.
- Python's Rich Dunder Protocol (`__str__`, `__repr__`, `__eq__`, `__len__`, `__getitem__`, `__call__`, etc.).
- Modern declarative data modeling with `@dataclass`, `field()`, and immutability (`frozen=True`).

---

## 📑 Articles in this Module

1. **[Classes & Objects](classes-and-objects.md)**
   - The class statement, instantiation, method binding, and the mandatory `self` explicit receiver.
2. **[Constructors & Instance Attributes](constructors-and-attributes.md)**
   - The dual-stage creation lifecycle (`__new__` allocation + `__init__` initialization), class attributes vs instance attributes, `__dict__`, and memory tuning with `__slots__`.
3. **[Encapsulation & Properties](encapsulation-and-properties.md)**
   - Access control conventions, name mangling, `@property` getters, setters, deleters, and data validation invariants.
4. **[Inheritance & Polymorphism](inheritance-and-polymorphism.md)**
   - Subclassing, method overriding, cooperative `super()`, multiple inheritance, and the C3 Linearization (MRO) algorithm.
5. **[Abstract Base Classes (ABCs)](abstract-base-classes.md)**
   - The `abc` module, `@abstractmethod`, enforcing interface contracts at instantiation time, and virtual subclasses via `.register()`.
6. **[Magic & Dunder Methods](magic-methods-dunder.md)**
   - The complete Python Data Model dunder protocol: string representations (`__repr__`, `__str__`), comparison operators, container emulation, arithmetic overloading, and callable objects (`__call__`).
7. **[Modern Data Modeling with Dataclasses](dataclasses.md)**
   - The `@dataclass` decorator (PEP 557), automatic dunder generation, default factories, post-initialization processing (`__post_init__`), and immutable value objects (`frozen=True`).

---

## 🗺️ Progression Path

```
classes-and-objects.md ──► constructors-and-attributes.md ──► encapsulation-and-properties.md
                                                                       │
                                                                       ▼
abstract-base-classes.md ◄── inheritance-and-polymorphism.md ◄─────────┘
        │
        ▼
magic-methods-dunder.md ──► dataclasses.md ──► [Next Module: Iterators & Generators](../iterators-generators/README.md)
```
