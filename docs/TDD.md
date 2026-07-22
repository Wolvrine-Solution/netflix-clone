# Technical Design Document (TDD)

## netflix-clone

| Field      | Value         |
| ---------- | ------------- |
| Status     | Draft         |
| Date       | 2026-07-19    |
| Implements | `docs/SRS.md` |

## 1. Goals / non-goals

**Goals**

- Satisfy FR-… for phase 0

**Non-goals**

- …

## 2. Architecture overview

```text
[Client] → [API] → [Domain services] → [Store]
```

Style (pick one and stick to it): modular monolith / hexagonal / …

## 3. Technology stack

| Layer                | Choice                 | Notes               |
| -------------------- | ---------------------- | ------------------- |
| Runtime              |                        |                     |
| API                  |                        |                     |
| Data (default)       | SQLite / memory / file | Standalone-friendly |
| Data (prod optional) | Postgres etc.          | Behind env flag     |
| Tests                |                        |                     |

## 4. Domain modules

| Module | Responsibility | Key FRs |
| ------ | -------------- | ------- |
|        |                |         |

## 5. Data model

Entities, ownership/tenancy, important invariants.

## 6. API sketch

| Method | Path     | Purpose  | Auth |
| ------ | -------- | -------- | ---- |
| GET    | /healthz | Liveness | none |

## 7. Security & tenancy

- …

## 8. Testing strategy

| Layer       | What         | Maps to |
| ----------- | ------------ | ------- |
| Unit        | Domain rules | FR-…    |
| Integration | API + store  | FR-…    |

## 9. Deployment notes

Local: `DEVELOPER.md`. Prod: optional; do not block phase 0.
