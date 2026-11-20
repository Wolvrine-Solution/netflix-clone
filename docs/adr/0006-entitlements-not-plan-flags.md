# 6 · Features are gated by entitlements, not by a plan field

- Status: proposed
- Date: 2026-10-28

## Context

Plans, trials, purchases and operator flags all decide what a tenant or viewer may do. A plan enum on the account does not express a trial, a one-off purchase or an operator override. bd-pos found this and solved it with an entitlement table.

## Decision

An `entitlement` table (tenant-scoped) holds `(subject, feature, limit_value, source, expires_at)`. Sources are paid, trial, flag, licence and purchase. `EntitlementService.rebuild(subject)` recomputes rows from those sources. `can(subject, action, resource)` is the only check used by guards and by playback-token issuance. Feature flags are read through an OpenFeature client with Unleash OSS as the provider, so the vendor is swappable. Platform plan limits (storage, transcode minutes, streams, seats, domains) are entitlements of the tenant subject.

## Consequences

- One place answers "may this happen", and it is testable.
- Rebuild must be idempotent and run after every webhook that changes a source.
- Entitlements are cached with short TTL; the playback path reads the cache and falls back to the table.
- UI never decides access; it only hides controls the server would refuse.

## Alternatives considered

- Plan enum on the account: cannot represent trials or purchases cleanly.
- Per-feature booleans on tenant: scatter and drift.
