# 🚢 Module 8: DevOps, Containerization & Observability

Welcome to the **DevOps, Containerization & Observability** module in Level 3.

Writing high-quality Python code is only the first step. In enterprise software delivery, applications must be packaged into secure, lightweight container images, automatically tested and deployed across global environments via CI/CD pipelines, and continuously observed in production through structured logging, metrics, and distributed tracing.

---

## 🎯 Module Overview

In this module, you will master:
- **Production Containerization with Docker**: Multi-stage Docker builds, slimming image sizes from 1.2 GB to $< 100\text{ MB}$, running under non-root security contexts (`USER appuser`), layer caching optimization, and production `.dockerignore` patterns.
- **Continuous Integration & Delivery (CI/CD)**: Building enterprise-grade GitHub Actions workflows, matrix testing across Python versions, automated linting/type-checking, and zero-downtime deployment pipelines.
- **Production Observability (The 3 Pillars)**: Structured JSON logging with **`structlog`**, application performance metrics with **Prometheus**, and distributed context tracing across microservices with **OpenTelemetry**.

---

## 📑 Articles in this Module

1. **[Dockerizing Python Applications: Multi-Stage Builds & Security](dockerizing-python-applications.md)**
   - Multi-stage Dockerfile architecture, optimizing layer caching, non-root user permissions, `.dockerignore` rules, minimizing image size with Alpine vs Debian-Slim, and healthchecks.
2. **[CI/CD with GitHub Actions: Testing, Linting & Deployment](ci-cd-github-actions.md)**
   - Automated CI/CD pipelines, matrix test runners, caching pip dependencies, security linting gates (Ruff, Mypy, Bandit), and automated Docker container builds.
3. **[Observability: Structured Logging, Metrics & OpenTelemetry](logging-monitoring-observability.md)**
   - Structured JSON logging with `structlog`, Prometheus metrics exporter (Counters, Gauges, Histograms), and OpenTelemetry (OTel) distributed span tracing.

---

## 🗺️ Progression Path

```
dockerizing-python-applications.md ──► ci-cd-github-actions.md ──► logging-monitoring-observability.md
                                                                                  │
                                                                                  ▼
                                           [Next Module: Data Engineering & AI](../data-science-ai/README.md)
```
