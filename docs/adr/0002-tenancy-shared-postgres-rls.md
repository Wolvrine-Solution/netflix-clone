# 2 · Tenancy is one shared Postgres database with row-level security

- Status: proposed
- Date: 2026-10-28

## Context

Many media companies will run on one deployment. We need isolation that survives application bugs, cheap onboarding of a new tenant, and a connection model that works with a pooler. The sister product bd-pos already runs this pattern.

## Decision

All tenants share one PostgreSQL database and schema. Every tenant-owned table has a `tenant_id` (ULID, char 26) that leads every index. RLS is ENABLE and FORCE on each of those tables with the policy `tenant_id = app_current_tenant()`.

The application connects as a non-owner role without BYPASSRLS. Migrations run as the owner. `withTenant(db, tenantId, fn)` opens a transaction and runs `set_config('app.tenant_id', $1, true)`, so the setting is transaction-local and safe behind PgBouncer in transaction mode. `asSystem` sets a bypass flag for platform jobs only. A list `tenantScopedTables` and a fence test fail the build if a table is in neither the tenant nor the platform list.

## Consequences

- Onboarding a tenant is an insert, not a provisioning job.
- A forgotten filter returns zero rows instead of leaking data.
- Every query must run inside `withTenant`. Code that forgets sees nothing and fails loudly in tests.
- Cross-tenant analytics need `asSystem` and explicit review.
- Noisy-neighbor control is by rate limits and queue caps, not by database separation.
- A regulated tenant that demands its own database is handled later by deploying a separate stack in standalone mode (ADR 0017).

## Alternatives considered

- Database per tenant: strongest isolation, but provisioning, migrations and pooling cost grow with tenant count.
- Schema per tenant: migrations must run N times and connection pooling gets harder.
- Application-only filtering: one missed `WHERE` leaks data. Rejected.
