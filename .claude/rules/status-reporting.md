# Status reporting — todos / leftovers / "what's the status"

Trigger phrases: "todo list", "what's left", "status", "leftover", "what's done", "give me the
updated list".

## Source of truth, in this order — never regenerate from git log or a session scan

1. Checkbox state in the active [docs/plans/NN-*.md](../../docs/plans/) file(s) (Scope /
   Done-when lists). This is authoritative for feature progress.
2. Open rows (status ≠ closed) in [docs/LEFTOVER_CHECKLIST.md](../../docs/LEFTOVER_CHECKLIST.md). If the project
   tags rows by phase/milestone, filter to the current one unless asked for everything.
3. Tracker (ClickUp/GitHub/Jira) sub-task status, only if the tracker is the thing being asked
   about specifically.

## Output shape

- Report the **diff since last known state** when one is available (this session, or a prior
  memory/plan-doc edit) — not a full re-derivation from scratch.
- Group by plan number. Per plan: ✅ done / 🔧 in progress / ⬜ not started, then unresolved
  LEFTOVER rows for that plan.
- Never invent progress: a checkbox is only ✅ if the plan doc or LEFTOVER row itself says so.
  Do not tick anything on the owner's behalf.

## Maintaining the source

- When a feature's scope changes during implementation, edit the plan doc's checkboxes in the
  same turn — don't let them go stale for the next status ask.
- New blocker found → add the LEFTOVER_CHECKLIST.md row immediately (see AGENTS.md "Roadblocks go in
  docs/LEFTOVER_CHECKLIST.md"), don't hold it for a later summary.
