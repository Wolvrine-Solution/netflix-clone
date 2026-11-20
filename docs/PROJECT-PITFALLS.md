# Project pitfalls — this project's own, machine-readable

Same format as [PITFALLS.md](PITFALLS.md): `tell` (how it presents) → `cause` (the mechanism) →
`rule` (the imperative) → `guard` (what enforces it, if anything). No prose.

**This file is yours.** It is `seed` in the kit manifest, so it arrives once and is **never**
overwritten by `kit:sync`. Anything naming this project's tables, services, screens or libraries
belongs here. Anything generic enough for another project belongs in [PITFALLS.md](PITFALLS.md),
which is managed and syncs everywhere. **When in doubt, it is project-specific.**

Both files are loaded into every session by the `SessionStart` hook
(`scripts/pitfalls-context.sh`), so nobody has to remember to open them.

Numbering is stable — append, never renumber.

Duplicate check: `python3 ~/WorkSpace/codeshipper/agent-repo-kit/scripts/dup-check.py docs/PITFALLS.md docs/PROJECT-PITFALLS.md --allow 'PITFALLS.md#28~PROJECT-PITFALLS.md#1' --allow 'PITFALLS.md#15~PITFALLS.md#20'` (both pairs reviewed: shared words, different mechanism).

---

## Build and docs

### 1 · A package-manager migration that left the Dockerfiles behind

- tell: `COPY pnpm-lock.yaml` fails; `apps/{api,web,admin}/Dockerfile` still used corepack pnpm after commit 33a1d75 moved the repo to bun and deleted the pnpm lockfile
- cause: the migration changed `package.json` and the lockfile only; images build only in the deploy workflow, which nobody ran after the change
- rule: a package-manager change updates every Dockerfile, CI workflow, `catalog-info.yaml` tag and doc in the same commit; grep for the old manager's name before committing
- guard: none yet (the local `ci.sh` full lane will build the images once the port finishes)

### 2 · A plan checkbox ticked, and a doc saying CI runs tests, on a tree that was never run

- tell: `docs/PLAN.md` said "47 test/spec files, not run locally"; a clean `bun install` then showed failing typecheck in api, web, admin and mobile, and failing tests in api (1 file), web (9 tests) and mobile
- cause: checkboxes were reconciled from the file list, not from command output; `ROADMAP.md` ticked 8 phases whose code (ffmpeg, OpenTelemetry, search engine, tenancy) does not exist
- rule: tick a box only after the proving command's output was seen in that session; "not run" means the box stays open and a LEFTOVER row is added
- guard: none yet (generic PITFALLS #11 covers a check nobody runs; the `ci` script now includes typecheck and format check)
