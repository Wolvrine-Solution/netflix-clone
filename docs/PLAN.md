# Implementation plan — netflix-clone

| Field  | Value                         |
| ------ | ----------------------------- |
| Date   | 2026-07-19                    |
| Source | `docs/SRS.md` + `docs/TDD.md` |

Build **one phase at a time**. Do not start phase N+1 until phase N acceptance passes.

## Phase 0 — Vertical slice (P0)

**FR subset:** FR-CORE-1, …

**Ship**

- [x] Project skeleton + DEVELOPER run/test — pnpm/turborepo monorepo (`apps/web`, `apps/api`, `apps/mobile`, `packages/`), root scripts `pnpm run test` / `ci` match DEVELOPER.md
- [x] Auth, multi-profile, catalog, playback, search, My List, watch history, admin dashboard shipped — per `docs/FEATURES.md`
- [x] Tests proving FR subset — 47 test/spec files across apps, CI (`.github/workflows/ci.yml`) runs them; not run locally (needs pnpm >=10, local is 9.x)

**Done when**

- `…` test command is green
- Health endpoint works locally with standalone defaults

## Phase 1 — …

**FR subset:** …

**Done when:** …

## Phase 2 — …

**FR subset:** …

**Done when:** …

## Deferred / out of plan

Track in `docs/LEFTOVER_CHECKLIST.md` — do not expand scope mid-phase without updating this file.
