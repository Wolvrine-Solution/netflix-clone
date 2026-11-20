# 18 · Tenants move through five lifecycle states enforced in one guard

- Status: proposed
- Date: 2026-10-28

## Context

Non-payment, abuse and deletion need predictable behavior for tenants and their viewers. bd-pos solved this with explicit states (ADR 0031 there).

## Decision

States: pending, active, suspended, pending_deletion, deleted. A single `TenantLifecycleGuard` applies the rule. Suspended: the studio and write APIs return 423, while viewers keep playing already-licensed content for a grace period. Pending deletion: reads allowed for export, writes refused, a 30-day grace timer runs. Deleted: HTTP 410 and a job removes data and storage. Dunning moves a tenant to suspended after a 7-day grace. Operators change state with an audited action. Constants (`TRIAL_DAYS`, `DUNNING_GRACE_DAYS`, `DELETION_GRACE_DAYS`) live in `packages/domain`.

## Consequences

- Behavior is uniform and testable in one place.
- Deletion is irreversible after the grace period; the studio must warn clearly.
- Viewers are not punished immediately for a tenant's billing problem.
- Export (FR-TEN-10) must be ready before deletion is enabled.

## Alternatives considered

- Boolean `active` flag: cannot express grace periods.
- Per-route checks: drift and missed routes.
