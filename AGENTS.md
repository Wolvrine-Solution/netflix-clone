# AGENTS.md — netflix-clone

Entry for coding agents. Full human docs: [README.md](./README.md), [DEVELOPER.md](./DEVELOPER.md).

White-label, multi-tenant streaming SaaS (VOD and live), built with Turborepo and bun workspaces.
A media company is a tenant: own domain, own brand, own catalog, own billing. The repo name is
historical; the working product name is StreamKit.

**State: mid-migration.** The target is NestJS 11 on Fastify, Drizzle, Postgres row-level security
and Host-header tenancy. Until plans 02 and 03 land, `apps/api` is still Express 4 and
`packages/db` is still Prisma 5, and the tree does not pass typecheck or tests on a clean install
([docs/PROJECT-PITFALLS.md](./docs/PROJECT-PITFALLS.md) #2). Follow the target rules below for new
code; do not extend the Express or Prisma layers except to keep the port moving.

## Session start

1. This file. 2. [docs/CONTEXT.md](./docs/CONTEXT.md) (current state). 3. The one plan doc being
   executed in [docs/plans/](./docs/plans/), plus [docs/plans/CONVENTIONS.md](./docs/plans/CONVENTIONS.md).
   The `SessionStart` hook prints both pitfalls registers.

## Spec pack (read in order)

1. [docs/PLAN.md](./docs/PLAN.md) — current phase
2. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — text flowchart overview
3. [docs/SRS.md](./docs/SRS.md) — FR-IDs for that phase
4. [docs/TDD.md](./docs/TDD.md) — detailed how
5. [docs/LEFTOVER_CHECKLIST.md](./docs/LEFTOVER_CHECKLIST.md) — do not reopen deferred items casually

Master plan: [docs/plans/00-whitelabel-streaming-saas-master-plan.md](./docs/plans/00-whitelabel-streaming-saas-master-plan.md).

## How each tool gets these rules

| Tool        | Reads                                                                                   |
| ----------- | --------------------------------------------------------------------------------------- |
| Claude Code | `CLAUDE.md` importing this file; `.claude/skills/`, `.claude/agents/`, `.claude/rules/` |
| Cursor      | `.cursor/rules/*.mdc` (hub-generated, do not edit); `.claude/agents/`                   |
| OpenCode    | `opencode.json` instructions (`.cursor/rules/*.mdc` and this file); `.opencode/agents/` |

Edit agents only in `.claude/agents/`, then run `node scripts/sync-opencode-agents.mjs`
(`--check` fails on drift). Memory is per tool; shared facts go in repo files.

## Quick start

```bash
bun install
cp .env.example .env.local        # fill placeholders; real secrets live in the hub vault
docker compose up -d postgres redis minio
bun run db:migrate                # needs DATABASE_URL
bun run db:seed                   # needs TMDB_API_KEY
bun run dev
```

**Apps run on:** `http://localhost:3000` web · `http://localhost:3001` admin ·
`http://localhost:4000` API · `http://localhost:8081` Expo dev server (`bun run mobile`).

## Workspace structure

```
apps/
  web/    — Next.js user-facing app and tenant studio (App Router)
  api/    — REST API (Express 4 today; NestJS 11 + Fastify target)
  admin/  — Next.js platform super-admin
  mobile/ — Expo Router / React Native app (own env: apps/mobile/.env.example)
packages/
  ui/     — Shared React components
  types/  — Shared TypeScript types
  db/     — Schema and client (Prisma 5 today; Drizzle target)
  config/ — Shared lint, Tailwind and TS configs
```

## Required environment variables

| Variable                  | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string (application role, non-owner) |
| `NEXTAUTH_SECRET`         | Random secret: `openssl rand -base64 32`                   |
| `NEXTAUTH_URL`            | App URL (default `http://localhost:3000`)                  |
| `TMDB_API_KEY`            | Free key at themoviedb.org                                 |
| `GOOGLE_CLIENT_ID/SECRET` | Optional: Google OAuth                                     |
| `GITHUB_CLIENT_ID/SECRET` | Optional: GitHub OAuth                                     |
| `NEXT_PUBLIC_API_URL`     | API URL (default `http://localhost:4000`)                  |

## Common commands

```bash
bun run dev                 # start all apps
bun run build               # build all apps
bun run lint                # lint all apps
bun run typecheck           # typecheck all apps
bun run test                # run all tests
bun run ci                  # lint, format check, typecheck, test, build
bun run db:migrate          # apply migrations
bun run db:studio           # database browser
bun run --filter @netflix/web dev
bun run --filter @netflix/api dev
bun run mobile              # expo start
```

## Verify

```bash
bun run typecheck && bun run lint   # after every edit batch
bun run ci                          # once, before the commit
```

## Architecture notes

Target (see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and the ADRs):

- **Tenancy:** one Postgres, `tenant_id` on every tenant row, row-level security with `FORCE`; the
  tenant is resolved from the Host header (custom domains verified in a domains table) and carried
  as `X-Tenant-Id`. Queries run inside `withTenant`; the app role is never the table owner.
- **API:** NestJS 11 on Fastify, `nestjs-zod` contracts, OpenAPI; modules are sealed behind
  `index.ts`; Drizzle appears only in repositories.
- **Entitlements, not plan flags:** features (DRM, live, renditions, concurrent streams) are gated by an
  entitlement table, rebuilt from paid, trial and flag sources.
- **Branding:** per-tenant tokens in the database become CSS variables at request time; mobile reads
  the same payload at boot.
- **Video:** ffmpeg workers (BullMQ) produce the ladder, Shaka Packager emits CMAF HLS and DASH,
  segments sit in object storage behind signed URLs; the API never serves segments.
- **Live:** MediaMTX ingest with per-tenant keys, LL-HLS out, auto-archive to VOD.

Current code that stays until replaced:

- Browse page is a React Server Component; zero client JS for row fetching.
- Web and admin use NextAuth v5 (JWT); the API verifies the same token with `jose`.
- Mobile signs in through the API (`POST /api/auth/signin`, 30-day HS256 JWT in SecureStore).
- Zustand: `useModalStore`, `useProfileStore` (persisted), `usePlayerStore`. My List uses TanStack
  Query optimistic updates.
- Billing and subscription pages are demo-only until the Stripe work in the plan.

## Constraints

- Standalone defaults (no required sibling services)
- Keep `.env.example` complete with non-empty placeholders
- Mark Leftover `[x]` only with proving tests
- No paid cloud, SKU or API tier without a yes in the same session (`.cursor/rules/no-paid-cloud.mdc`)
- Real secrets live in the hub `secrets/netflix-clone/` vault; `.env` stays gitignored
- Deliverables are Markdown in the repo; never an `.html` file or a hosted artifact

## Next.js 16 rules (web, admin)

Source: [Next.js docs](https://nextjs.org/docs) and the [16.4 release](https://nextjs.org/blog/next-16-4).

- Pages and layouts are Server Components by default; add `'use client'` only on the leaf that needs
  state or effects. Check: reviewer plus `bun run lint`.
- Tenant resolution lives in `proxy.ts` (the Next 16 name for middleware); it sets the tenant header
  and never queries the database directly. Check: the tenant-scoping skill and a Playwright
  two-host journey.
- Data caching uses Cache Components (`use cache`) with a tenant-scoped cache key; never cache
  across tenants. Check: an e2e test that loads two hosts and compares branding.
- No secret in a `NEXT_PUBLIC_` variable. Check: gitleaks weekly workflow and `.env.example` review.

## React 19 rules

Source: [react.dev](https://react.dev/blog).

- No `forwardRef` (ref is a prop); no boolean-prop piles; prefer compound components and explicit
  variants (`composition-patterns` skill).
- Effects are for syncing with external systems, not for deriving state. Check: `react-hooks` lint rules.
- Server data goes through TanStack Query or Server Components, not ad hoc `useEffect` fetches.

## NestJS and Fastify rules (apps/api, target)

Source: [NestJS docs](https://docs.nestjs.com) and [Fastify docs](https://fastify.dev/docs/latest/).

- Inject with explicit `@Inject(Token)` because the runtime emits no decorator metadata. Check: the
  first HTTP test of each module.
- Layout: controller (HTTP only), service (rules), repository (only place Drizzle appears), dto,
  module, `index.ts`. Other modules import only `index.ts`. Check: dependency-cruiser rule
  `api-modules-are-sealed` (added with the port).
- Request and response contracts are Zod schemas in `packages/contracts` wrapped by `nestjs-zod`;
  never `as` a value from outside the process (generic PITFALLS #29). Check: typecheck plus contract tests.
- A global tenant guard resolves the tenant and lifecycle state (423 suspended, 410 deleted); routes
  opt out only with an explicit marker. Check: guard integration test.
- Domain errors map to HTTP in one filter, never in controllers (generic PITFALLS #40).
- Register body parsers and CORS through Nest adapters, not on the raw Fastify instance (generic
  PITFALLS #32, #33).

## Drizzle and Postgres RLS rules (packages/db, target)

Source: [Drizzle docs](https://orm.drizzle.team/docs/overview) and [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

- Every tenant table has `tenant_id` first in every index, RLS `ENABLE` and `FORCE`, a policy on
  `app_current_tenant()`, and an entry in `tenantScopedTables`. Check: the fence test fails on any
  unlisted table.
- The application connects as a non-owner role; migrations use separate credentials. Check: a
  startup assertion that the policies restrain the connection (generic PITFALLS #25).
- Tenant context is set with transaction-local `set_config('app.tenant_id', $1, true)` inside
  `withTenant`, which is safe behind PgBouncer transaction mode. Never a plain `SET`.
- Restrict with `REVOKE`, not a narrower `GRANT` (generic PITFALLS #26). Raw `sql` fragments are
  executed against a real Postgres in a test.
- Migrations are generated (`bunx drizzle-kit generate`) and committed; never `push` against shared data.

## Expo and React Native rules (apps/mobile)

Source: [Expo docs](https://docs.expo.dev) and [React Native docs](https://reactnative.dev/docs/getting-started).

- Playback uses `expo-video`; never `expo-av`. DRM-capable sources go through the player seam in the
  `player-integration` skill.
- Tokens are stored in SecureStore, never AsyncStorage. Check: grep in review.
- No browser globals (`window`) in shared code; guard with `Platform.OS`. Check: mobile typecheck.
- Brand comes from the tenant payload at boot, not from a build-time constant.

## Tailwind 4 rules

Source: [Tailwind docs](https://tailwindcss.com/docs).

- Design tokens are CSS variables declared in `@theme`; tenant branding overrides the variables, not
  the utility classes. Check: whitelabel-theming skill contrast check.
- No per-tenant class names or per-tenant stylesheets.

## Turborepo and bun rules

Source: [Turborepo docs](https://turborepo.com/docs) and [bun docs](https://bun.com/docs).

- bun is the package manager: `bun install`, `bun run`, `bun.lock` committed, never npm and never a
  pnpm lockfile (org rule `node-package-manager`). Check: grep for `pnpm` before committing.
- Dockerfiles use `oven/bun` and copy `bun.lock`. Check: image build in the local full lane.
- Task outputs and `dependsOn` are declared in `turbo.json`; a package imports another only through
  its declared workspace dependency. Check: `bun run build`.

## ffmpeg and Shaka Packager rules (video pipeline)

Source: [FFmpeg docs](https://ffmpeg.org/documentation.html) and [Shaka Packager docs](https://shaka-project.github.io/shaka-packager/html/).

- Workers are stateless and idempotent: re-running a job for the same asset and rendition replaces
  the output, never duplicates it. Check: a worker retry test.
- One source encode feeds CMAF segments for both HLS and DASH; keyframes are aligned across
  renditions. Check: ffprobe assertion in the pipeline test.
- Output keys follow `tenant/asset/rendition/segment`; the CDN cache key never varies on cookies.
- Never shell-interpolate user input; pass argv arrays. Check: security review (`owasp-security`).
- Rendition tiers above H.264 (HEVC, AV1) are entitlement-gated.

## Vitest and Playwright rules

Source: [Vitest docs](https://vitest.dev/guide/) and [Playwright docs](https://playwright.dev/docs/intro).

- New logic ships with its test in the same change ([tests-with-logic](.claude/rules/tests-with-logic.md)).
  Check: review against the report listing a test per piece of logic.
- Integration tests use a real Postgres on the non-owner role; a green result must prove the policy is on.
- Playwright covers browser-only behaviour and one journey per feature across the real composition root.
- A test that cannot fail is not a test: break the logic once and watch it go red (generic PITFALLS #15).

## Org process rules (merged from agent-repo-kit)

Selectively merged from [agent-repo-kit](https://github.com/sumitbd/agent-repo-kit) `AGENTS.md`
(pin in `.kit/kit.json`), only the common rules this project needs. This file holds project rules
too, so kit updates are merged by hand.

- **Read lean.** Start from the spec pack, not a directory walk; `rg` for the line and read a range;
  never load `node_modules`, lockfiles, `dist`, `.next` or `.turbo` output.
- **Model split.** The strong model writes short plan docs in `docs/plans/NN-name.md`; Sonnet
  implements from them with no open questions (exact paths, commands, checks).
- **Skills per prompt.** Invoke the 1-2 skills whose description fits; none for plain questions or
  small edits; never a whole pack.
- **Subagents deliberately.** Default to none. When one is right, use the pinned cheap agents in
  `.claude/agents/` (`doc-scout` lookup, `doc-writer` mechanical edits, `repo-analyst` tracing).
- **Short replies.** Lead with the answer or change; numbers as numerals.
- **Automate repeats.** Anything done twice gets a script in `scripts/` or a `bun run` command.
- **Pitfalls.** Generic lessons are in [docs/PITFALLS.md](./docs/PITFALLS.md) (kit-managed, do not
  edit); this project's are in [docs/PROJECT-PITFALLS.md](./docs/PROJECT-PITFALLS.md) as `tell` →
  `cause` → `rule` → `guard`. Run `dup-check.py` before adding one; an entry that can become a check
  becomes one, proven by planting a violation and watching it fail.
- **Build the whole thing, then review.** When a spec, plan or ADR already settles a decision, build
  it without mid-feature checkpoints; still stop for blockers, money, destructive or outward-facing
  actions and tracker writes.
- **Roadblocks** go in [docs/LEFTOVER_CHECKLIST.md](./docs/LEFTOVER_CHECKLIST.md) and the reply, never
  routed around or faked.
- **Commits and pushes** only when the owner asks in that message. Conventional Commits; no
  attribution trailers (`.cursor/rules/no-commit-tags.mdc`); check with `git log -1 --format=%B`.
  "Pushed" means local and remote are identical afterwards. After a push, bump the hub pin and push it.
- **Deliverables** are Markdown in the repo; no hosted artifacts and no `.html` twins (org rule
  `deliverables-markdown-only` overrides the kit's sibling-`.html` allowance).
- **Paid services** never without asking: name the SKU, the monthly cost and the $0 alternative.
- **Kit sync.** `.kit/kit.json` records what was taken. Never run `install.sh` or `kit-sync --apply`
  here. Report with `python3 ~/WorkSpace/codeshipper/agent-repo-kit/scripts/sync-consumers.py`.
