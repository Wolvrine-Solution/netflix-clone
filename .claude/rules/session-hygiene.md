# Session hygiene — when to warn the owner or suggest splitting

Long sessions drift: a status check on one plan sprawls into other plans, reviews, fixes and
deploy triage across many hours, burning context and forcing a mid-task compaction. The rules
below catch that early instead of after the fact.

## Warn, then keep going unless told to stop

State the warning in 1 line, propose the split/fix, and proceed with the owner's actual request
unless they say to stop — don't block on it.

| Trigger                                                                                                                           | Warn with                                                                                             | Suggested fix                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| A single session is about to touch a 2nd distinct plan doc (`docs/plans/NN-*.md`) beyond the one it opened with                   | "This session started on plan NN; continuing into plan MM here will mix contexts."                    | Offer to start a fresh session for plan MM reading only its plan doc                                    |
| Owner runs `/model` mid-task (not at a natural task boundary)                                                                     | "Switching model mid-task invalidates the prompt cache; the next request rebuilds ~<ctx size>."       | Note it, continue only if asked                                                                         |
| Context is visibly large and a big read/dump is about to be added (>15 KB tool result, or a 3rd full-file Read on the same topic) | "This is about to add a large chunk to context; a fresh session or summarized read would be cheaper." | Summarize instead of dumping full content when the file is a scan/log/list, not code being edited       |
| An "implement all" / "fix all" loop is about to run more than ~10 edit-test cycles in one request stream                          | "This looks like a long loop; expect N+ tool round trips."                                            | Nothing blocking — just flag scale up front so it's not a surprise                                      |
| A tracker write (ClickUp/GitHub/Jira) gets denied by the permission classifier                                                    | "That write was blocked by the auto-mode classifier; retrying serially costs time."                   | Ask once whether to allowlist the specific tool in `.claude/settings.json`, don't loop retries silently |
| Approaching a context-compaction boundary (harness signals it, or session has run many hours across one open thread)              | "Context is near its limit; a compaction is likely soon and will need a 'resume'."                    | Suggest wrapping the current feature and starting fresh for the next one                                |

## Do not

- Do not silently absorb a scope change ("also do plan MM") into an already-long session without
  the 1-line warning above — the owner may not realize the session has drifted.
- Do not retry a blocked tracker write more than once without surfacing it as a roadblock
  (AGENTS.md "Roadblocks go in docs/LEFTOVER_CHECKLIST.md" applies to tool blocks too).
