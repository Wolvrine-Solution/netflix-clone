# Architecture overview — netflix-clone

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| One-liner | Netflix Clone |
| Detail design | See [TDD.md](./TDD.md) (modules, APIs, data) |

This file is a **text flowchart overview only** — not a second TDD. Keep it short.

## System context

```text
                  end user / clients
                            |
                            v
                 +----------------------+
                 |   netflix-clone   |
                 |   (this product)     |
                 +----------+-----------+
                            |
            +---------------+---------------+
            |               |               |
            v               v               v
       [ API / app ]   [ Domain ]     [ Store ]
            |               |               |
            +---------------+---------------+
                            |
                            v
              Optional: email / S3 / IdP / …
              (never required for local test)
```

## Request flow (happy path)

```text
Client
  -> HTTP/API (auth)
    -> Application service
      -> Domain rule / use-case
        -> Repository / adapter
          -> DB or file store
    <- DTO / response
```

## Main components

| Box | Responsibility | Owns FRs |
| --- | --- | --- |
| API | Transport, auth, validation | … |
| Domain | Business rules | FR-… |
| Store | Persistence | … |
| Workers (if any) | Async jobs | … |

## Trust / tenancy boundaries

```text
[ Tenant A data ] ----X---- [ Tenant B data ]
         ^                         ^
         +---- enforced in API + store layer ----+
```

## Non-goals for this diagram

- Endpoint catalogs, table DDL, class lists → **TDD.md**
- Phased build order → **PLAN.md**
- Requirement text → **SRS.md**


## Prior architecture notes

Longer/legacy write-up: [`ARCHITECTURE.md`](../ARCHITECTURE.md).
