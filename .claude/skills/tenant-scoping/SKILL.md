---
name: tenant-scoping
description: Use for any database, API or cache change in the multi-tenant streaming SaaS. Covers Host-to-tenant resolution, withTenant and asSystem, RLS policies, the fence test, and the tenant-keyed cache rules. Triggers on new tables, queries, guards, Valkey keys or any "tenant_id" question.
---

# Tenant scoping (Postgres RLS, NestJS, Drizzle)

Isolation is enforced in the database, not in application `where` clauses. A missed `where` must
return zero rows, not another tenant's rows.

## Resolution chain

```
Host header → Valkey cache (host→tenant, 60s) → tenant_domain (verified) → tenant row
   → TenantGuard (lifecycle) → X-Tenant-Id → withTenant(tx) → RLS policy
```

- `tenant_domain(tenant_id, host unique, verified_at, is_primary)`. Unverified hosts resolve to nothing.
- Lifecycle: `pending → active → suspended → pending_deletion → deleted`. Suspended: back office
  returns 423, playback of already-issued tokens continues. Deleted: 410. Enforced once, in the guard.
- Platform routes (super-admin) use a separate auth instance and the `platform` tables; they never
  read tenant tables except through `asSystem`, and every call is written to `audit_log`.

## Writing a new tenant table (checklist, in order)

1. Drizzle table in `packages/db/src/schema/` with `tenant_id char(26) not null` and every index
   leading with `tenant_id`.
2. Add to `tenantScopedTables` (or `platformTables` if it has no tenant).
3. Hand-written numbered SQL migration: `ALTER TABLE x ENABLE ROW LEVEL SECURITY; ALTER TABLE x
   FORCE ROW LEVEL SECURITY; CREATE POLICY tenant_isolation ON x USING (tenant_id =
   app_current_tenant() OR current_setting('app.bypass_rls', true) = 'on')`.
4. Add the table to the fence test list. The fence test lists tables from `information_schema`
   and fails if one is in neither list.
5. Repository method takes a transaction handle, never the global `db`.

## withTenant

```ts
export async function withTenant<T>(db: Db, tenantId: string, fn: (tx: Tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`) // true = txn-local
    return fn(tx)
  })
}
```

- Always `set_config(..., true)`. A session-level `SET` leaks across pooled connections under PgBouncer.
- Connect as the non-owner role. Assert at startup that policies restrain the connection (insert a row
  for tenant A inside `withTenant(B)` and expect a violation). Superusers and `BYPASSRLS` roles skip
  policies silently (generic PITFALLS #25).
- Restrict with `REVOKE`, not a narrower `GRANT` (generic PITFALLS #26).

## Negative tests every tenant feature needs

- Tenant A creates a row; `withTenant(B)` reads zero rows; B updating A's id affects zero rows.
- A request with Host of tenant B and a token of tenant A returns 403.
- Cache keys contain the tenant id: `t:{tenantId}:...`. A cache hit across tenants is a defect.
- Background jobs carry `tenantId` in the payload and open `withTenant` themselves.

## Do not

- Do not add `where tenant_id = ?` as the only protection.
- Do not use `asSystem` in a request path.
- Do not key Valkey, Meilisearch indexes or object-storage paths without the tenant id.
