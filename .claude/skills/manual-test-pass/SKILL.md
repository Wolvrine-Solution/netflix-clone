---
name: manual-test-pass
description: Build or refresh the human test pass for a phase — a deterministic seeded dev shop plus click-by-click walkthrough docs, one per plan/spec, so a person can open a browser and verify a feature by hand. Use when asked to "write manual testing docs", "make a walkthrough guide", "build a testing doc for QA", "make a seeder for dev/testing", or when a batch of plans just went from built to needing a human check.
---

# Manual test pass

Produces two things together, because neither is useful alone: a **deterministic seeded dev
shop** and **click-by-click walkthrough docs** built from the same specs the seed data has to
support. Ran once for phase 1 → `packages/db/seed-demo.ts` + `docs/manual-testing/`. Re-run this
skill's steps whenever a new plan/spec ships and needs its own walkthrough, or the seed no longer
covers a scenario a spec added.

## When to use
Trigger phrases: "manual testing docs", "walkthrough guide", "make a seeder for dev/testing",
"testing doc feature by feature", "QA pass docs", "human test pass". Not for automated test
authoring — that is `test-driven-development`; this skill's output is for a person with a
browser and a mouse.

## Inputs this skill reads (in order)

1. `docs/README.md` — the doc index, to find the specs/plans/wireframes paths for this project.
2. `docs/specs/*.md` (or wherever this repo's Gherkin/BDD specs live) — the scenarios are the
   walkthrough's source of truth. Every `Given`/`When`/`Then` becomes a "do this → expect that"
   row. Never invent behaviour a spec doesn't name.
3. `docs/plans/*.md` — what was actually built vs deferred. Cross-check against `LEFTOVER.md`
   (or equivalent) so the walkthrough never asks a tester to verify something already recorded as
   a known gap — that wastes their time and produces a false defect report.
4. `docs/WIREFRAMES.md` (or equivalent) — screen layout and labels, so "do this" names real UI
   elements.
5. The schema (`packages/db/schema.ts` or equivalent) and any existing minimal seed
   (`packages/db/seed.ts`) — read before writing a new seed; extend it, never replace it.

## Steps

### 1. Build the seed data, not the docs, first

The docs are worthless without a shop to test against, and every number a walkthrough quotes
must come from the fixture, not be invented.

- **Extend the existing minimal seed rather than duplicating it.** If a small "walking skeleton"
  seed already exists (one item, one till, one owner — proves the wiring), layer a richer
  fixture on top of it in a separate function/file. Don't touch what already works.
- **No faker/random-name libraries.** Use a small seeded PRNG (mulberry32 is 4 lines) so the
  same seed produces the same shop on every machine — a walkthrough that says "X shows 41 on
  hand" must stay true forever. Check whether the repo already has one (`scripts/seed-volume.ts`
  or similar) and reuse its generator rather than inventing a second one.
- **Cover every awkward case a spec names, not just the happy path**: an item sold by weight, a
  tax-exempt item, a non-stock-tracked item, a multi-variant item, a composite/bundle, a tender
  that demands a reference, a deactivated staff member, a duplicate-key customer, stock already
  below its reorder point, at least one refund, at least one closed shift with a variance. Build
  the item/fixture list directly from scanning every spec file for a named example.
- **Write history (sales, shifts, events) straight into the read/fold tables**, not by replaying
  it through the write path — the write path has its own tests, and a person needs a shop with a
  past in seconds, not minutes. Every fold-owned row still needs whatever the schema's foreign
  keys require (an `event` row, an aggregate id) even when synthesised this way.
- **Make it idempotent for the setup rows, and skip-once for history.** Setup (catalogue, staff,
  tax rates) upserts by a fixed id so re-running is a no-op. History (sales) cannot be upserted
  safely — check whether it already exists and skip generating it again rather than duplicating
  years of data on every re-run.
- **Provide a one-command reset** that drops the schema, migrates from zero and reseeds. Verify
  it end to end — don't trust it after one edit. **Watch for a stale migration journal**: an ORM
  that tracks applied migrations in its own schema (e.g. drizzle's `drizzle` schema) will report
  "migrations applied" over an empty database if only the app schema was dropped. Drop both, or
  the reset silently produces a broken shop that looks successful.
- **Verify by running it**, not by reading it: migrate → seed → reseed (idempotency) → full reset
  → boot the app against it → spot-check row counts and a couple of screens. Fix and re-verify
  until this is real, before writing a single walkthrough doc.

### 2. Write the walkthrough index first

One `README.md` in the docs folder covering: how to stand up the seeded environment (exact
commands), who to sign in as and how (every seeded account, its credentials/PIN, what it can
do), what's in the seeded shop (a table of the fixture's notable numbers so a tester can
sanity-check the environment before starting), how to run a walkthrough, and how to report a
defect (map "contradicts a spec scenario" → defect, "marked as a known gap" → note against the
existing blocker record, "not covered by any spec" → question for the owner, not a defect).

### 3. Write one walkthrough file per plan/feature

Match this repo's doc-writing conventions (check for a `.claude/rules/doc-template.md` or
similar house style first — table format, link style, ✅/🟡/❓ markers, etc.) but the shape that
has worked well is:

- A short purpose line naming which plan/spec it's built from.
- Numbered `##` sections, each one coherent behaviour, each a table: `# | Do this | Expect`.
- Every expected value is a **real number from the seed**, computed by hand from the fixture,
  not an approximation ("total 10.35" not "some total").
- Call out the money/integrity checks explicitly — a SQL query or equivalent the tester can run
  to prove sums/balances reconcile (payments = sale total, points ledger sums to displayed
  balance, refund cap never exceeded). These catch the defects that matter most.
- A "known gaps" section per file, sourced directly from the blocker register, each marked with
  the same icon system as the rest of the docs — never let a tester discover a known gap by
  filing a duplicate report.
- A result table at the end for the tester to fill in (section, pass/fail/blocked, note).

### 4. Wire it into the doc set

- Add the new folder to the doc index (`docs/README.md`) with a one-line description.
- Link it from the test-strategy doc (`docs/TESTING.md` or equivalent) as the human half of the
  pyramid — explicit about precedence: when a walkthrough and an automated spec disagree, the
  spec wins and the walkthrough is the bug, never the reverse.
- Add a session-log / CONTEXT row noting what was built and any pitfall hit along the way.
- If a reset/fixture bug was found and fixed (e.g. the stale-migration-journal trap above),
  record it in the project's pitfalls register — it's exactly the "green check inspecting
  nothing" class of failure that register exists for.

### 5. Run the gate lane and confirm cleanly

Format/lint/typecheck the new seed code, fix anything flagged (watch for
`noAssignInExpressions`-style rules if using a compact counter pattern), and leave the local
dev database container **stopped** unless the user is about to use it — this is scratch
infrastructure, not something to leave running silently in the background.

## Anti-patterns

- Writing the walkthrough docs before the seed data is verified to actually produce those
  numbers — always seed and verify first, document second.
- Inventing scenarios not in any spec — a walkthrough is a rendering of existing behaviour
  contracts, not a place to freelance new requirements.
- Using a random-data library — breaks the "the same number tomorrow" property the whole
  approach depends on.
- Replacing an existing minimal/CI-facing seed instead of layering on top of it.
- Skipping the end-to-end verification of the reset script — an untested reset script is the
  single most likely place for a silent-failure defect (see the migration-journal trap above).
