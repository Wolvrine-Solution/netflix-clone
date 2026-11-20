# 3 · Tenant is resolved from the request Host header

- Status: proposed
- Date: 2026-10-28

## Context

White-label means the brand is the domain. bd-pos resolves a tenant from the session, which is not enough for anonymous pages such as the home page, sign-up and takedown forms.

## Decision

A platform table `tenant_domain(host unique, tenant_id, verified_at, is_primary)` maps host to tenant. The web `proxy.ts` (Next 16) and the API `TenantGuard` look the host up (Valkey cache, short TTL, invalidated on change) and run the request in that tenant's context. Internal calls carry `x-tenant-id` set by the proxy. Clients cannot choose a tenant by sending a header. Sign-in is checked against the same tenant, so a viewer token from tenant A is useless on tenant B's host. The default host for each tenant is `<slug>.streamkit.app`.

## Consequences

- Anonymous pages are branded and isolated before any login.
- The lookup is on the hot path, so the cache and its invalidation are part of the design (see TDD section 10).
- Unknown or unverified hosts return 404 before any tenant data is touched.
- Path-based tenancy (`/t/acme`) is not supported.

## Alternatives considered

- Tenant from session only: cannot serve anonymous branded pages.
- Tenant in the URL path: breaks the white-label promise and cookie scoping.
- Tenant from a client header: spoofable.
