# Pitfalls — generic register (managed by agent-repo-kit)

Machine-readable. One entry = `tell` (how it presents) → `cause` (mechanism) → `rule`
(imperative) → `guard` (what enforces it, if anything). No prose. One `rule:` per entry (≤ 110
chars, printed at session start); further detail goes in `also:` lines, read on demand.

**This file must stay project-agnostic** — it is `managed` in `.kit/manifest.txt` and is
overwritten on every `kit:sync`. Anything naming this project's tables, services, libraries or
files goes in `docs/PROJECT-PITFALLS.md`, which the kit never touches.

Add an entry the day something bites. **An entry that can become a check must become one in the
same session** — a rule that recurs did not need better wording, it needed to stop being a rule.

**Master rule, from which most of this file follows:** a check whose result does not depend on
the thing it claims to check will pass forever. Prove every new guard by planting a violation,
watching it fail, and removing it.

---

## Shell and repo

### 1 · A `cd` outlives the command that needed it
- tell: an install rewrites a sibling repo's `package.json` and lockfile
- cause: the harness shell keeps its working directory across tool calls
- rule: read other repos by absolute path or `(cd /abs && cmd)`; never a bare `cd`
- also: every writing command (`install`, `add`, `generate`, `migrate`, `commit`) carries its own `cd /abs &&`
- also: print `pwd` after any excursion, before the next write

### 2 · `find` exits non-zero on a missing directory and `pipefail` believes it
- tell: a stage silently finds nothing and reports success
- rule: filter the list first — keep paths where `[ -d "$dir" ]`
- also: a stage that finds nothing must print why; verify a skip against a case where work exists
- tell (same family): a check fails once in a while and passes on rerun — `producer | grep -q …` under `pipefail` returns 141 (SIGPIPE) whenever the producer is still writing, because `-q` exits at the first match
- also: under `pipefail` do not end a pipeline in `grep -q` (or `head -1`, `awk … exit`); drop `-q` and send grep's output to `/dev/null` so it reads to the end. Explain a flaky check, do not rerun it until green
- guard: a ratchet check over shell scripts (baseline of legacy uses may only shrink)

### 3 · Formatters rewrite vendored files
- rule: write the formatter ignore list (vendored, generated, lockfiles, `.claude`, `.kit`) before the first run
- also: write the ignore list before the first run — `node_modules`, build output, lockfiles, generated migrations, `.claude`, `.cursor`, `.kit`, and `docs/` if hand-wrapped
- also: read `git status` before staging; anything outside your edit is a config miss
- also: restore with `git checkout -- <dir>`, never by hand

### 4 · Git hooks assume a terminal
- rule: no `/dev/tty` in a hook; write to stdout
- also: test every hook non-interactively, the way it is actually invoked
- also: a hook is one call into `scripts/`, so the logic is debuggable alone

### 5 · A tool that "supports TypeScript" may not support yours
- rule: on a version warning, plant a violation it should catch, confirm red, remove it
- also: log the limitation with evidence; never silence the warning to get a clean log

### 6 · A new compiler major removes options quietly
- rule: run the tool once on a trivial file immediately after pinning a major
- also: TypeScript 7 `paths` must be relative — `"@x/*": ["./packages/x/*"]`

### 7 · Coverage thresholds are a gate, not a suggestion
- rule: meet the number or change it by recorded decision; never edit it in passing
- cause: untested branches are guards and error paths — the code that runs on a bad day

## Runtime and verification

### 8 · Verifying a tool is not verifying the runtime you run
- tell: a check is green; the server fails on the same file
- rule: run the check through the same loader the server uses (tsx/SWC/esbuild/Bun differ)
- also: prefer explicit wiring (`@Inject(Class)`) over compiler metadata
- also: at least one test must boot the real composition root over the real transport
- also: a health check that touches nothing detects nothing

### 9 · A crash with no output at all
- tell: suite dies, zero bytes, no stack
- cause: usually a native addon (`build/Release/*.node`) failing at load
- rule: it is an environment fault until proven otherwise — `git stash push -u`, re-run at HEAD, `git stash pop` before reading your diff
- also: bisect by importing, not running — `await import('<pkg>')` under the same loader, then bare `node -e "require('<pkg>')"` to rule the loader in or out
- also: rebuild with `npx node-gyp rebuild`; a `try/catch` around the require is not protection
- guard: a postinstall script that loads each fragile addon in a child process and rebuilds what fails

### 10 · A type error in a file no one wrote
- cause: stale generated artifacts (`.next/`, `dist/`, `.turbo/`)
- rule: delete the directory and re-run before reading your own diff
- also: a generated file two commands write differently does not belong in git

### 11 · A check nobody runs is already failing
- cause: a path with no automated check rots, and faults stack because each hides the next
- rule: deployment faults are found only by deploying; tests build their own environment
- also: deployment faults are found by deploying — no unit/acceptance/integration coverage substitutes, because those build the environment themselves
- also: make the check one command, cheap enough to actually run

### 12 · Killing a process you did not start
- rule: before any `kill`, confirm via the parent chain that this session started it; otherwise ask
- also: before any `kill`, walk the parent chain (`ps -o pid=,ppid=,cmd= -p <pid>`) and confirm the ancestor is this session's shell; an unrecognised ancestor means ask, not clean up
- also: `pkill -f <pattern>` matches across every session on the machine — prefer a verified PID
- also: a concurrent pipeline run is a blocker to surface, not to clear; it needs exclusive ports and Docker
- also: a failure that arrived during a collision proves nothing — re-run alone before believing it, never tick a checkbox on it
- also: killing a Testcontainers run leaks containers (Ryuk reaps on exit, not `SIGKILL`) — check `docker ps --filter label=org.testcontainers` after any interrupt

### 13 · A damaged `node_modules` reports green in 0 seconds
- cause: a skip justified by absence rather than by a reason
- rule: if `node_modules` exists, a missing tool means a broken install — fail, never skip
- also: ask of every guard that prints SKIP which of the two cases it is detecting
- guard: a preflight walking `node_modules/.bin` that fails by name on any dangling symlink

### 14 · A hydration mismatch that names an attribute nobody's code wrote
- tell: Next.js "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties", with a diff showing one unfamiliar attribute added on `<body>` — `cz-shortcut-listen="true"` (ColorZilla), `data-gr-ext-installed` (Grammarly), `data-darkreader-mode` (Dark Reader)
- cause: the extension writes onto `document.body` as soon as the page loads, before React hydrates; the server never saw that attribute, so React treats it as a mismatch and discards + rebuilds the subtree
- rule: an attribute your code never sets is a browser extension, not a bug — `suppressHydrationWarning` on that element
- also: check the diff names an attribute your own code never sets before treating it as a bug — it reproduces only in the browser that has the extension installed, never in a clean profile or in CI
- also: `suppressHydrationWarning` on the one element the extension touches (usually `<body>`) silences it correctly — it only covers that element's own attributes, children still hydrate and warn normally
- guard: none yet — nothing short of running the app in a browser with the extension installed reproduces it

## Tests that prove nothing

### 53 · A `Before` with no `After` hangs the run silently
- tell: "N scenarios (N passed)" then an indefinite stall
- cause: a per-scenario pool left open; the process will not exit
- rule: write the `After` in the same edit as the `Before`, not after it passes
- also: a stall past 2× the stage's usual time is a leaked resource, not slowness — check the stage process is still alive after its own "done" line
- guard: a unit test reading every step file — anything opening a connection must register `After` and close it

### 15 · A regression test that passed for the wrong reason
- rule: a regression test is finished when it has been **seen to fail with the fix removed**, not when it passes
- also: when several rules reject the same input, "rejected" proves nothing — build the input so exactly one rule can fire
- also: with layered validation (schema → service → constraint), revert every layer; if it still passes it is measuring a different layer

### 16 · An endpoint with no integration test is an endpoint nobody has run
- rule: count endpoints, not tests — list a module's public methods and check each is called somewhere
- cause: the untested method is disproportionately the one whose behaviour is hard to assert
- also: raw-SQL and serialization faults at the database or HTTP edge are invisible to unit tests that call services directly

### 17 · A test whose "today" is not the database's today
- rule: never assert on a day bucket unless the test controls the timestamp that created the row
- also: assert the window total, the series shape, or a row count instead
- cause: an injected clock covers the application, not `DEFAULT now()`, triggers or `current_date`
- also: when a date assertion fails by exactly one bucket, check `date -u` against `date` first

### 18 · A fixture clock frozen to a literal, checked against a real one
- rule: freeze a fixture's time only if nothing downstream compares it to a real clock
- also: before freezing a fixture's time, ask whether anything downstream compares it to a real clock — a signature expiry, a database `now()`, an external API. If so it must be live
- also: "so nothing depends on when it runs" is a per-call-site claim; grep every use before trusting the comment
- also: a check that can only fail after enough real time has passed will never fail in review, only weeks later, looking like flakiness

### 19 · A latency assertion that timed a network round trip
- rule: a timed block that awaits a network or container measures the network, not the code
- also: if the timed block awaits anything over a network or container, the number is not about the code the spec describes — read the block, not the variable name
- also: when new tests make an old assertion fail, suspect the assertion before the load; a genuine flake moves around, a mismeasured budget fails whenever the machine is busy

### 20 · A redaction test that could pass or fail for an unrelated reason
- rule: assert a secret's absence with a value only that field could produce
- also: assert a secret's absence with a value only the field under test could produce (`'PIN-9f3e7c1a'`, not `'1234'`), or assert the parsed field directly

### 21 · Asserting configuration instead of effect
- rule: assert the effect (make the request, count lines), never the option that should cause it
- also: assert the effect, never the option. Checking `options.autoLogging` is set proves nothing; making a request and counting lines proves the thing that matters
- also: any config meaning "and this does not happen" (route not logged, field redacted) needs a test of the negative case — the failure mode is silence, and silence is what success looks like

### 22 · A gate that skipped because a tool was a shell function
- rule: pipeline gates use POSIX tools that always exist (`grep`, `find`, `awk`) — never `rg`/`fd`/`jq` unless a declared dependency
- also: prove every new gate by planting a violation in the same session

### 23 · Fire-and-forget telemetry that reported success while rejected
- rule: verify a telemetry pipeline at the destination, never at the sender — a client reporting success proves only it did not crash
- also: for an error tracker, analytics call, webhook or queue publish, the acceptance check is a row on the other side, run by hand the first time it is wired

### 24 · An acceptance scenario that loops single-row inserts
- rule: one `insert().values(array)` is one round trip; the loop is one per row inside a transaction over a container network
- also: put scale in a pure unit test; an acceptance scenario proves the wiring on the smallest fixture that shows it
- also: a slow test and a hung test are identical through a pipe — keep stages fast enough that the question never arises

### 54 · A browser test for a "stale answer" race that passes with the race still in
- tell: the test is green with the fix removed, 4 rewrites in a row
- cause: 3 separate ways the "stale" answer was not stale: dev-mode React runs a mount effect twice and ignores the first (cancelled) request, so holding only the first held the wrong one; the request was issued after the click, so the server already had the new value; and Playwright's `route.fetch()` does not send the browser's cookies, so the replayed answer was a 401 the page correctly ignored
- rule: test stale-answer races with a hand-written held response naming the old value; hold every match
- also: to test "an old answer must not undo a newer action", fulfil the held request with a hand-written body naming the old value — never replay the server; hold every matching request, not the first
- also: plant the bug and watch the test fail before trusting it (master rule)
- guard: none generic; a project's own race test names this entry when it was proven this way

## Database and permissions

### 25 · Row-level security does not apply to the role running the tests
- tell: policies present, a direct probe correct, the server returning every tenant's rows
- cause: connected as a superuser or `BYPASSRLS` role; Postgres reports nothing when policies do not apply
- rule: the application connects as an unprivileged role **always** — tests, e2e launcher, dev, deployment
- also: migrations get their own credentials, not extra rights on the shared one
- also: make the fence check its own footing — refuse to run tenant work on a connection the policies cannot restrain
- also: when a control is invisible in the happy path, test that it is **on**, not that the right rows came back
- also: never let the application connect as the role that owns its tables

### 26 · A narrower `GRANT` used as a restriction
- rule: to restrict, `REVOKE` — a narrower `GRANT` restricts nothing
- also: grep for `alter default privileges` before writing any grant meant as a limit; there the starting point is "everything already granted"
- also: a permission you have not seen refused is untested — any "nothing can X" invariant needs a test that *tries* to X

### 27 · A backup that restores cleanly and cannot be read
- cause: `pg_dump --no-privileges` drops the grants the application role depends on
- rule: never dump with `--no-privileges` where the app runs as a role other than the owner (`--no-owner` is fine)
- also: a restore drill must restore **and then use** the result — exercise the application, or you are testing `pg_dump`, not recovery
- also: take the drill's dump with the same flags as the real backup, from the same script

### 28 · A reset that left the migration journal behind
- rule: a reset dropping a schema must drop the bookkeeping schema in the same statement — both or neither
- also: "migrations applied" is a statement about the journal, not the database; assert a table exists, not that the migrator exited zero

### 29 · Never `as` a value from outside the process
- rule: parse jsonb columns, request bodies and environment variables; let schema defaults work
- also: be forgiving about form, strict about money, loud about what was refused — a dropped record must be logged with its id, or a crash was traded for a silence

## Wiring and configuration

### 30 · A whole-config parse inside a provider factory
- tell: an untouched suite starts demanding a database URL
- rule: validate the whole config once at the composition root; inside a provider read only what that provider uses
- also: a narrow config parse should be incapable of throwing — every field optional or defaulted
- also: when an untouched suite fails after you add a module import, look for a factory reading the environment before reading your own change

### 31 · A variable naming a port that two processes read
- rule: a port variable belongs to exactly one process; any second process gets its port explicitly on the command line
- also: moving config from a per-command export into a shared file widens its blast radius — re-check every name for a second meaning first
- also: a dev command should free its own ports before starting

### 32 · Registering a parser on the raw server instance
- rule: use the framework's own seam before the adapter's
- also: anything registered on the raw instance from the composition root runs before the framework has finished configuring itself; routes are additive and fine, parsers and error handlers are one-per-key and are not
- also: start the server after any composition-root change, even one scoped to a single route

### 33 · CORS defaults differ per adapter
- rule: spell out `methods` explicitly rather than trusting adapter defaults — the difference only shows for verbs the codebase has not used yet
- also: a request that never reaches the server is not one that failed — check the preflight before the handler
- also: a first `PUT`/`HEAD`/`OPTIONS` in a codebase is worth a thought about the proxy and the CORS layer

### 34 · A subdomain is a different site, and `SameSite=Lax` knows
- rule: introducing a subdomain changes which cookies are sent — work out where the session cookie comes from before splitting a UI onto its own host
- also: "signed in, then immediately not" is the signature of a cookie set but not sent — inspect the request that fails, not the sign-in that succeeds
- also: prefer same-origin between a UI and its API

### 35 · Parallelising CI stages
- rule: parallelise only provably independent stages — own database, own ports, no shared row
- also: a fixed latency budget has less headroom once its stage no longer runs alone; widen deliberately and say so, never chase noise
- also: before trusting a parallel result, pass or fail, check for a stray process from a prior run on the same ports

### 35b · A benchmark that timed a crash and called it a speedup
- tell: a config variant "runs 45x faster" (37 ms against 1700 ms) in a timing loop
- cause: the run exited non-zero on an unknown flag and executed no tests; the loop timed the
  process, redirected its output to /dev/null, and never looked at the exit code or the count
- rule: a timing loop must assert the work happened — capture the passing-test count alongside
  the duration and compare it against the baseline, every variant
- also: a result that is far better than the mechanism can explain is a broken measurement until
  proven otherwise; the burden of proof rises with the size of the win
- also: measure a config option by setting it in the config file, not by guessing a CLI spelling
- guard: none yet — but the master rule at the top of this file is the general case

### 36 · Retry or coalescing added to a shared worker
- rule: separate callers that carry information from ones that are merely periodic — periodic skips when busy, explicit gets queued
- also: a unit test cannot see "the interval is shorter than the work"; only integration under real concurrency shows it

### 37 · An async context bound where the framework continues past it
- rule: never `enterWith` from a guard or interceptor; open the scope in middleware with `run(store, next)`
- also: prove it with a request travelling middleware → guard → handler over real HTTP — a test that does not boot the full app cannot see this

### 38 · A fetch-on-dependency-change that races itself
- rule: an effect re-fetching on a changing dependency needs a staleness guard (request-id ref or `AbortController`)
- also: any effect re-fetching on a changing dependency needs a staleness guard — a request-id ref or an `AbortController` tied to cleanup. A bare `await` inside the effect never is
- also: before writing a load-dependent failure off as contention, ask whether two requests from the same component can be in flight at once
- also: filterable list screens carry this by copy-paste — sweep every sibling when you find one

### 39 · A dependency array holding a value object
- rule: a dependency array holds primitives, or objects with stable identity; key on the primitive and rebuild the object inside the memo
- also: read any memo or effect owning state as "this state is thrown away whenever one of these changes", and ask whether each is stable

### 40 · A domain error crossing a controller boundary
- rule: map a domain refusal to an HTTP exception at the call site — a refusal the user caused is a 4xx that says why, never a 5xx
- also: a test asserting only the message cannot see this; assert the status where the boundary matters

### 41 · A managed file that a project quietly added its own content to
- tell: a routine `kit:sync` deletes working code — here, two whole pipeline gates and two test stages vanished from `scripts/ci.sh`
- cause: `ci.sh` is `managed`, so the kit's copy replaces it wholesale. The project had added its own stages to it over months, and nothing in the file, the manifest or the sync output said that was fatal
- rule: **before `kit:sync --apply`, diff every managed file you have ever edited** — `kit:sync --diff` in full, not the first screen. A managed file is not yours; anything of yours in it is already scheduled for deletion
- also: **read a diff to its end before calling it safe.** A hunk of comment changes at the top says nothing about the hunk 150 lines down that removes a function
- also: a managed file that a project genuinely needs to extend needs a **seam** — an optional local file the managed one sources — not edits to the managed file itself
- also: `kit:sync --apply` is reversible only while the tree is clean and the change uncommitted. Run it on a clean tree, review `git diff`, and revert per file rather than wholesale
- guard: `scripts/ci.sh` now sources `scripts/ci-local.sh` for a project's own gates and suites, so the common case has somewhere safe to live. The general case still has none — the sync tool cannot know which of a managed file's lines a project added

## Operating live machines

Found while fixing real workstations over SSH and a desktop session. The first six are shell and
service habits; the last four are about how to diagnose.

### 42 · A policy change applied to one install path
- tell: something was removed or forbidden, then came back on the next sync / enforcement run
- cause: it was removed where it was noticed; the repo had several paths that install or require it (package list, sync script, enforcement script, docs, rules)
- rule: removing or forbidding anything → search **every** path for the name and fix each hit before saying done; keep one "removed" list and have CI fail if a listed name appears in any install path. A rename is the same change — search the old name too
- guard: a CI check over install verbs and list items, proved with a planted violation

### 43 · Stop → edit → start with no restore on failure
- tell: after a failed run a service stays down (here: remote access, until someone noticed)
- cause: `set -e` exits between the stop and the start
- rule: put `trap '<start it>' EXIT` immediately after the stop, clear it after the start, and wait for the service's port instead of a fixed sleep
- guard: CI flags a script that stops and starts the same unit without a `trap`

### 44 · Host detection that knows only today's names
- tell: a script works on the live machines and says "unknown host" on a fresh install
- cause: the live hostnames differ from the names the provisioning inventory sets
- rule: every host `case` / tuple lists both; a new host name is added in one place per script
- guard: CI flags a host match containing one name of a known pair without the other

### 45 · A secret on stdin plus a heredoc
- tell: `sudo -S` (password piped in) runs but the code it was meant to execute never does; no error
- cause: stdin is the password, so a heredoc for the interpreter is never read
- rule: pass the code with `-c`, or write it to a temp file and `sudo install` / run it
- guard: CI flags `sudo -S` / `SUDO` helpers followed by `<<`

### 46 · Installing a file onto itself, or over a running script
- tell: an autostart dies at login with `cp: 'x' and 'x' are the same file` (`set -e` ends the script), or a running shell script starts reading new bytes mid-run
- cause: the installed copy self-installs from a path that resolves to itself; `cp` rewrites the inode a running `bash` still reads
- rule: use `install` (new inode), skip when source and destination resolve to the same file, never self-install from the installed location, resolve helper scripts repo → installed → known checkout
- guard: CI flags `cp` into the user's bin directory

### 47 · An autostart that assumes its service is already up
- tell: after reboot the machine is unreachable until someone opens the app by hand; process list looks fine
- cause: the user-session autostart ran seconds before the system daemon, found no IPC port, never retried; the daemon only goes online when the client connects
- rule: wait on the service's own port (poll with a timeout) before starting the client; verify the **reachable** state after a real reboot, not that a process exists
- guard: a health check that reads the daemon's own "online since boot" evidence

### 48 · `pkill -f` matching the agent's own command line
- tell: a tool call dies with no output (exit 144) and the shell session is gone
- cause: `-f` matches full command lines; the agent's own `bash -c '…'` contains the pattern. The `[x]` trick only hides the pattern's own text, not other mentions of the name in the same command
- rule: never `pkill -f` / `pgrep -f` from a command that names the target anywhere else; build the name from a variable, use `-x`, or kill by PID from a separate call
- guard: none (agent behaviour)

### 49 · A long-lived socket with no liveness check
- tell: after one side reboots the other shows "connected" forever and nothing flows
- cause: the program only writes on change, so a peer that vanished without a FIN is never noticed; the server accepted a new peer only when it had none
- rule: application heartbeat + TCP keepalive + "a new connection replaces the old one"
- guard: test by pausing the peer (`SIGSTOP`) and watching the reconnect

### 50 · A hardware/display/driver config shipped on reasoning alone
- tell: "fixed" settings made things worse after the next restart (a removed scan-rate range fell back to stricter built-ins and dropped every screen to 720p)
- cause: the change was reasoned about, not run; the fallback behaviour was assumed
- rule: restart once, read the result back, keep a `.bak` beside the file and state the rollback command **before** restarting
- guard: a post-reboot health check that asserts the expected modes/rates

### 51 · A theory before the thrown error
- tell: two plausible root causes were fixed in turn; neither was it
- cause: "it started too early" fit the symptom; the journal had the real exception all along (a D-Bus property type mismatch)
- rule: read the actual error text (including the line the framework logs just before "unhandled rejection") before proposing a cause; when logs cannot name the culprit, ship a probe that records it next time instead of guessing
- guard: none (agent behaviour)

### 52 · A register "loaded at session start" that the loader silently truncates
- tell: every session start prints `Output too large (NN KB). Full output saved to: …` plus a short preview; the rules in the register never influence the work
- cause: a SessionStart hook `cat`s the registers. Claude Code keeps hook output past its cap in a file and injects only a preview (here 2 KB of 81 KB). The kit's own generic register (24 KB) is already past it, so every consumer is affected, not only large ones
- rule: any load-at-start mechanism needs a size check against the cap and a test that the **last** entry is visible, not the first. Put the always-loaded text under the rules directory (loaded in full), generated from the registers: first rule per entry for older entries, titles for the rest; keep the hook to a short pointer
- guard: a generator plus a CI check that the generated digest equals the registers (stale digest fails CI)

### 55 · A pre-commit formatter that restaged another session's lines
- tell: a commit carries lines nobody staged — tests for code that is not in the commit, rows from another plan — and the hook printed `restaged after formatting` for those files
- cause: the hook re-ran `git add <file>` on every staged file the formatter touched, which stages the whole working-tree file; a file staged by hunk (`git add -p`, an index blob, a 2nd session sharing the clone) loses the split and the commit goes out with half-finished work
- rule: a hook restages only files that had no unstaged edits before it ran; a partially staged file is named and left alone
- also: after any hook that rewrites files, read `git show --stat HEAD` before pushing; a file count higher than what you staged is this
- guard: `.githooks/pre-commit` snapshots `git diff --name-only` before formatting and skips those files with a ⚠ line; proven 2026-11-03 on a planted partial stage (old hook committed the unstaged line, new hook did not)
