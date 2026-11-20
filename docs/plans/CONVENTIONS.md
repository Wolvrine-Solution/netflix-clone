# Execution conventions: read once, applies to every plan 01 onward

Follow these without re-deriving. Where a plan conflicts with this file, the plan wins. Adapted
from bd-pos `docs/plans/CONVENTIONS.md` for the NestJS + Drizzle + bun stack.

## Plan doc shape

`# Plan NN — title (FR ids)`, then: Goal (1 line) · Read first (links) · Decisions already made
(do not reopen) · Files by layer (data model, domain, contracts, API, web, mobile, tests) ·
Ordered steps (Part A, Part B, one commit per part) · Checks (`- [ ]`, each naming the test file
that proves it) · LEFTOVER rows this plan opens · Out of scope · Sources.

## Wiring and code

- **Explicit injection tokens, always**: `constructor(@Inject(FooService) private readonly foo:
FooService)`. tsx and esbuild emit no decorator metadata, so implicit injection arrives
  `undefined` and fails only at the first HTTP call.
- Module layout under `apps/api/src/modules/<name>/`: `<name>.controller.ts` (HTTP only),
  `<name>.service.ts` (all rules), `<name>.repository.ts` (the only place Drizzle appears),
  `<name>.dto.ts` (`createZodDto` over schemas from `packages/contracts`), `<name>.module.ts`,
  `index.ts` (the only file other modules may import). Register in `app.module.ts`.
- Import specifiers are extensionless; never `.js`.
- Every tenant-owned table has `tenant_id` (ULID, char 26) leading every index, is listed in
  `tenantScopedTables`, has an RLS policy in a numbered SQL migration, and is in the fence test.
  Platform tables (no tenant) are listed in `platformTables`. A table in neither fails the fence test.
- All tenant queries run inside `withTenant(db, tenantId, fn)`; system work uses `asSystem`.
  The app connects as a non-owner role; migrations use their own credentials.
- Schema changes: edit `packages/db/src/schema/*.ts`, then `bunx drizzle-kit generate --name <slug>`.
  Hand-written SQL (policies, triggers) is a new numbered file plus a journal entry.
- Money is bigint minor units, string on the wire. IDs are `ulid()`; use `monotonicFactory()`
  where id order is load-bearing.
- Logging: inject `PinoLogger` from `nestjs-pino`, log `logger.info({ event, ...fields }, 'msg')`.
  No `console.*` outside tests and scripts.
- Never commit secrets. `.env.example` keeps non-empty placeholders.

## Tests

- Unit tests beside the code for domain and service logic (Vitest).
- Integration tests (`*.integration.test.ts`) run against a real Postgres (Testcontainers or the
  compose service). RLS is only proven on the non-owner role; assert the policy is on, not only
  that the right rows came back (generic PITFALLS #25).
- Each feature has at least one journey over real HTTP through the composition root.
- Playwright only for what a service-level test cannot see.
- New logic ships with its test in the same change ([.claude/rules/tests-with-logic.md](../../.claude/rules/tests-with-logic.md)).

## Sequencing inside every feature

spec (FR ids in SRS) → tests red → schema + domain → API module → web → mobile → all green →
tick the plan's checks → commit (only when the owner asks). Record blockers in
[LEFTOVER_CHECKLIST.md](../LEFTOVER_CHECKLIST.md); record new mistakes in
[PROJECT-PITFALLS.md](../PROJECT-PITFALLS.md) after running `dup-check.py`.

## Commands

`bun run typecheck` and `bun run lint` after every edit batch; `bun run ci` once before the
commit. Commits: Conventional Commits, no attribution trailers, verify with `git log -1 --format=%B`.
