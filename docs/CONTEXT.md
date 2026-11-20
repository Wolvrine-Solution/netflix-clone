# Current context — the handoff file

**This is the state of the project right now.** Any agent on any PC reads this after
[AGENTS.md](../AGENTS.md). Update it at the end of every session (see "How to update").
It is the memory; the tool's own memory (Claude, Cursor, OpenCode) is never relied on.

## Status (2026-10-28)

- Phase: **A (rule compliance) and B (kit selective merge) done or in progress; C (design pack)
  next.** Master plan: [plans/00-whitelabel-streaming-saas-master-plan.md](plans/00-whitelabel-streaming-saas-master-plan.md).
- Product: white-label multi-tenant streaming SaaS. Code is still the single-tenant Netflix demo
  on Express 4 and Prisma 5.
- Baseline on a clean `bun install`: typecheck fails in api, web, admin, mobile; tests fail in api
  (1 file), web (9 tests), mobile. Not yet fixed; see
  [PROJECT-PITFALLS.md](PROJECT-PITFALLS.md) #2.

## Decisions so far

| Date       | Decision                                                                           | Why                                                                                 |
| ---------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 2026-10-28 | API is NestJS 11 on Fastify with nestjs-zod; Express is retired                    | Reuse bd-pos guards, providers and sealed-module lint rules                         |
| 2026-10-28 | ORM is Drizzle; Prisma is retired                                                  | Data layer is rewritten for `tenant_id` anyway; avoids the Prisma 8 extension break |
| 2026-10-28 | Tenancy is shared Postgres with row-level security, tenant resolved by Host header | Proven in bd-pos; white-label needs domain = brand                                  |
| 2026-10-28 | Agent kit adopted by selective merge at `9188079`                                  | Org rule `kit-selective-merge`; project keeps its own AGENTS.md                     |
| 2026-10-28 | Package manager is bun; pnpm is gone from docs, Dockerfiles and CI                 | Org rule `node-package-manager`                                                     |

## Open work (next)

1. Phase C: write SRS, TDD, ARCHITECTURE (with C4Container), ADRs 0002 to 0018, PLAN, LEFTOVER.
2. Phase 0 plans 01 to 03: stack upgrade, NestJS port, Drizzle migration.
3. Make `bun run ci` green on a clean install (fix or record each baseline failure).

## Session log

| Date       | Tool/model | What changed                                                                         | Next                |
| ---------- | ---------- | ------------------------------------------------------------------------------------ | ------------------- |
| 2026-10-28 | Claude     | Audit, master plan, phase A compliance fixes, kit selective merge, AGENTS.md rewrite | Phase C design pack |

## How to update (end of every session, ~1 min)

1. Bump the Status date and 1-3 bullets.
2. Add a Decisions row for anything decided.
3. Rewrite Open work as the next 1-3 steps.
4. Add 1 Session log row. Keep the table under 20 rows; prune old rows.
