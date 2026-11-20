#!/usr/bin/env bash
# Print the pitfalls registers so every session starts with them in context (SessionStart hook).
#
# Compact on purpose (plan 53, budget ≤ 4k tokens via `bun run context:budget`): an entry with no
# automated guard prints its title and its `rule:` line — the part that changes what a session
# does. An entry whose `guard:` names a real check is enforced by that check, so it is listed by
# number only. The full entry (tell, cause, rule, guard) is `rg -n -A4 '^### N ·' <file>` away.
#
# Why a hook and not a line in AGENTS.md: PITFALLS #14 — a register read only when remembered is
# a register that is not read.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

emit() {
  [ -f "$1" ] || return 0
  printf '\n== %s (full entry: rg -n -A4 "^### N ·" %s)\n' "${1#"$ROOT"/}" "${1#"$ROOT"/}"
  awk '
    function flush() {
      if (title == "") return
      if (guarded) guardedList = guardedList (guardedList == "" ? "" : ", ") num
      else printf "%s\n%s", title, rules
      title = ""; rules = ""; guarded = 0
    }
    /^### / {
      flush()
      title = $0
      num = $2
      next
    }
    title != "" && /^- rule:/ { rules = rules substr($0, 3) "\n"; next }
    title != "" && /^- guard:/ {
      g = substr($0, 10)
      guarded = (g !~ /^[[:space:]]*(none|—|n\/a)/)
      next
    }
    END {
      flush()
      if (guardedList != "") printf "guarded by a check (title only in the file): %s\n", guardedList
    }
  ' "$1"
}

printf 'Mistakes already made here. Each rule cost real time once; apply it before you act.\n'
emit "$ROOT/docs/PITFALLS.md"
emit "$ROOT/docs/PROJECT-PITFALLS.md"
