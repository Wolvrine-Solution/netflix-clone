# Doc template — use whenever the owner says "make docs", "write the X doc", "doc for CTO"

Once this project has written a doc following this template, point future docs at it as the
reference implementation (e.g. `docs/ARCHITECTURE.md`, a research teardown, a plan doc) instead
of re-deriving the shape each time.

## Shape (in this order, nothing else)

1. `# Title — what it decides/explains` (1 line)
2. **Purpose** paragraph: why the doc exists, who reads it, which docs it is built from (links).
3. Legend line: `**Read the diagrams, skim the tables.** ✅ decided · 🟡 recommended · ❓ unverified`
4. **Decision asked** block (≤ 3 numbered lines) when the doc needs approval.
5. `---` then numbered `## N.` sections. **Every section = 1 Mermaid diagram first, then 1
   table.** Prose ≤ 3 lines between them. Use `>` callouts only for a warning.
6. Options docs: draw every option at the **same level of detail**, then a weighted trade-off
   matrix (weight column, 1–5 scores, weighted total, 1-line decision under it).
7. Any choice → a table with columns `Choice | Rejected | Why`.
8. `## Risks` table: `# | Risk | Likelihood | Impact | Mitigation / check | When`.
9. `## Decisions → ADRs` table when decisions are made, with status column.
10. `## Sources` — grouped by theme, inline links, plus project docs used.

## Diagram rules

- Mermaid only (`flowchart`, `sequenceDiagram`, `erDiagram`, `gantt`); no external images.
- Palette (fill/stroke): red `#7f1d1d/#f87171` (hard, danger, rejected) · amber
  `#713f12/#fbbf24` (medium, unverified) · green `#064e3b/#34d399` (good, decided, external
  OK) · purple `#312e81/#a78bfa` (ours, recommended) · deep purple `#1e1b4b` (our system
  boundary) · blue `#0c4a6e/#38bdf8` (data stores) · orange `#7c2d12/#fb923c` (core / event
  path) · grey `#374151/#9ca3af` (neutral, done). Always `color:#fff`.
- Node text: `<b>name</b><br/>2–3 short lines`, an emoji leading each box, `<i>` for asides.
- 1 diagram = 1 idea. Max ~12 nodes; split otherwise.

## Text rules

- Wrap at ~98 cols, relative links, numerals (`3 files`). Use the project's own currency
  symbol and minor-unit convention if money is involved — don't default to one.
- Mark every unverified claim with ❓ and, if it blocks work, add a LEFTOVER row.
- No filler ("in today's fast-paced world"), no restating the previous section.
- Lead with the decision; alternatives after.
- **Spell out every acronym in full on first use in a doc, including inside Mermaid diagrams**
  — a diagram node is not exempt. Even ones that feel standard (PRD → Product Requirements
  Document, ADR → Architecture Decision Record, ERD → Entity Relationship Diagram,
  DoD → Definition of Done). In prose: `**PRD** (Product Requirements Document)`. In a diagram
  node, put the expansion on its own short line: `<b>PRD</b><br/>(Product Requirements
Document)<br/>...`. Whichever comes first in reading order — prose or diagram — carries the
  expansion; everywhere after, the bare acronym is fine.

## After writing

1. Index the file in [docs/README.md](../../docs/README.md).
2. Add decision rows + a session-log row to [docs/CONTEXT.md](../../docs/CONTEXT.md).
3. **Markdown only, never HTML.** No `.html` sibling files, no `doc-html`/render scripts, no
   hosted artifact — not even when the doc is for the CTO or a boss. The `.md` file with its
   Mermaid blocks is the deliverable; it renders directly in GitHub, most editors and Claude
   Code's own viewer. This was tried once and explicitly reverted by the owner.
4. Mermaid gotchas that break rendering: no `;` inside sequence messages, no `()`/`→` in gantt
   section names, no `<code>` inside node labels, quote every label that has punctuation.
5. A markdown formatter runs on save in this repo and mangles 2 things — never start a wrapped
   line with `+ ` (becomes a list item) and never write `~300` next to another `~` on the line
   (`~~` becomes strikethrough). Write "and", "about", "approx." instead.
