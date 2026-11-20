# New logic ships with its test — in the same change, never offered as a follow-up

[AGENTS.md](../../AGENTS.md) > this file. Owner rule (from bd-pos, adopted here): "always add a test if any new
logic is added".

## The rule

**Any new or changed logic gets a test in the same change that introduces it.** Not "I can add
tests if you want" — the test is part of the work, and the work is not done without it.

Logic means anything that decides something: a branch, a retry, a calculation, a status change,
a filter, a query, a fold, an idempotency or concurrency guard. Pure restyling, copy and config
with no behaviour are exempt.

## What counts as a test for it

- **The path that was the reason for the code must run.** A retry test makes the retry happen;
  a refusal test forces the refusal; a concurrency guard is tested with concurrent calls. A test
  that only walks the happy path around new failure-handling does not count.
- **A raw `sql` fragment is executed against Postgres** (integration, acceptance or an API call
  in e2e) — typechecking it proves nothing.
- **Prove it can fail**: break the logic once, watch the test go red, restore it.
- Pick the cheapest layer that really runs the logic: unit for pure functions, acceptance or
  integration for anything touching the database, e2e only for what needs a browser.

## Reporting

A report that says "done" lists the test that covers each piece of new logic. If a path is
genuinely untestable here (needs hardware, a live provider), say so and add a LEFTOVER row —
never leave it silent or phrase it as an optional extra.
