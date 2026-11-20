---
name: kit-upstream
description: "Send a generic lesson (pitfall, rule, skill fix) from a project up to the shared kit and merge it with no duplicate entry and no number collision. Use for 'push this pitfall to the kit', 'upstream this', 'merge the kit branch', a LEFTOVER row about an unpushed kit change, or before writing any new entry in the kit's generic register."
---

# Kit upstream

A generic entry lives in the kit once; the project keeps its evidence and links to it
(`generic PITFALLS #N`). Two sessions numbering from their own stale view is how duplicates and
collisions happen, so the number is taken from `origin/main` **and every open PR**, never from a
local copy.

## Steps

1. **Check first.** Write the candidate entry (`### N · title` + tell/cause/rule/guard) to a scratch
   file, then run, from the kit clone:
   `bash <skill dir>/check.sh <kit dir> <candidate file>`
   (`<skill dir>` is the base directory shown when this skill loads.) It fetches origin, lists
   open PRs, prints what each one claims, any `COLLISION`, the `next free:` number, and runs
   `scripts/dup-check.py --candidate` against main plus every open PR's register.
   - exit 1 on a near-duplicate: do not add an entry; extend the existing one with another
     `- rule:` / `- also:` line instead.
   - exit 1 on a collision: renumber the newer, **unpushed** one; never renumber a merged entry.
   - exit 2: open PRs could not be listed (gh missing or logged out). Stop; that is a roadblock,
     not a free number.
2. **Branch from `origin/main`**, one topic per branch, title `### <next free> · …`. Commit with
   Conventional Commits, no attribution trailers. Run the kit's tests (`bash tests/*.sh`).
3. **Pairwise check** on the result: `python3 scripts/dup-check.py template/docs/PITFALLS.md`.
   The flagged pairs must be the same as on main; a new pair is a duplicate you added.
4. **Push and open the PR** (`git push -u origin <branch>`, `gh pr create`). The body states
   the number, the dup-check score and why that number (e.g. "56 is held by open PR #9").
5. **Merge only when the owner said so in this session.** `gh pr merge <n> --squash`. Never
   `--force`, never `--admin`, never push `main` by hand. A second branch that was cut before
   the first merged: rebase it on the new `origin/main` while it is still unpushed, rerun its
   tests, then push.
6. **Sync consumers, same session.** `python3 scripts/sync-consumers.py` (report), then
   `--apply --only <changed managed paths>`. Report every CONFLICT with its line counts; never
   overwrite one. New managed files need `--include-new` and an owner yes per repo.
7. **Close the loop in the project:** its entry links `generic PITFALLS #N`, its LEFTOVER row
   is closed with the PR number, and its own CI digest/registers are regenerated.

## Never

- Number from the project's vendored copy of the register: it is behind `origin/main`.
- Add a project noun (host, product, person, client, tracker) to a kit file.
- Treat a refused push as permission to route around it; report it.
