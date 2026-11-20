# Project context

[AGENTS.md](../../AGENTS.md) wins on process; this file is the authority on this project's facts.

## Context

- **Project**: white-label, multi-tenant streaming SaaS (VOD and live). Working name StreamKit,
  repo `netflix-clone`. A media company is a tenant: own domain, own brand, own catalog, own billing.
- **Owner**: Sumit Sarkar (Wolvrine Solution). Reference product for the SaaS shape: bd-pos.
- **Stack (decided 2026-10-28)**: NestJS 11 + Fastify + nestjs-zod, Drizzle on Postgres with
  row-level security, Next.js, Expo, bun, Turborepo. See
  [the master plan](../../docs/plans/00-whitelabel-streaming-saas-master-plan.md).
- **State**: mid-migration. `apps/api` is still Express and `packages/db` still Prisma until
  plans 02 and 03 land. A clean tree does not yet pass typecheck or tests (see
  [docs/PROJECT-PITFALLS.md](../../docs/PROJECT-PITFALLS.md) #2).
- **Success**: two tenants on two hostnames, with different branding, cannot read each other's
  rows, play real ABR video, and are billed separately.

## Where things are

| Need                                 | Go to                                                          |
| ------------------------------------ | -------------------------------------------------------------- |
| Index of all docs                    | [docs/README.md](../../docs/README.md)                         |
| Handoff / current state              | [docs/CONTEXT.md](../../docs/CONTEXT.md)                       |
| Phases and done-when                 | [docs/PLAN.md](../../docs/PLAN.md)                             |
| Plans for a cheaper model to execute | [docs/plans/](../../docs/plans/)                               |
| Blockers and deferred work           | [docs/LEFTOVER_CHECKLIST.md](../../docs/LEFTOVER_CHECKLIST.md) |

## Writing conventions

- Docs wrap at ~98 cols, relative markdown links, numerals for numbers.
- Plan docs follow [docs/plans/CONVENTIONS.md](../../docs/plans/CONVENTIONS.md).
- Deliverables are Markdown. Diagrams are ASCII or Mermaid. Never a styled `.html`.
