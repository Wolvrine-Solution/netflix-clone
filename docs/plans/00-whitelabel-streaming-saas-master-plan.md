# Plan 00 — White-label streaming SaaS: compliance, kit adoption, software design

| Field  | Value                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| Date   | 2026-10-28                                                                                                            |
| Status | DRAFT — awaiting owner decisions (§6) before any implementation                                                       |
| Author | Fable 5.1 (planning model); implementation target: Sonnet                                                             |
| Reads  | hub `AGENTS.md`, `docs/AGENTIC_DOC_PACK.md`, `.cursor/rules/*.mdc`, kit @ `9188079`, `~/WorkSpace/codeshipper/bd-pos` |

Goal: turn `netflix-clone` into **StreamKit** (working name) — a multi-tenant, white-label
VOD + live streaming SaaS that any media company can run on its own domain and brand, built
to the org's agentic conventions so Sonnet can implement every phase from plan docs alone.

```
   today                                  target
 ┌──────────────┐                     ┌─────────────────────────────────────────┐
 │ single-tenant│   A: fix rules      │ tenant = brand = domain                 │
 │ Netflix demo │ ─ B: adopt kit ───▶ │ RLS Postgres · ffmpeg/Shaka pipeline    │
 │ pnpm→bun     │   C: design docs    │ ClearKey/AES + signed URLs · Stripe     │
 │ hollow docs  │   D: build phases   │ Connect · OTel/SigNoz · Meilisearch     │
 └──────────────┘                     └─────────────────────────────────────────┘
```

---

## 1. Audit result — what the repo follows today

**Compliant:** `CLAUDE.md` = `@AGENTS.md` stub · `catalog-info.yaml` present · doc-pack files
exist by name · `ci.yml` is `workflow_dispatch`-only · pre-commit + pre-push `bun run ci` ·
`bun.lock` committed · no LICENSE · hub pin `48e7f86` = `origin/main` (not stale) ·
17 hub shared rules propagated into `.cursor/rules/`.

**Hard rule violations (must fix before feature work):**

| #   | Violation                                                                                              | Rule                                               | Evidence                                                        |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------- |
| V1  | `cd.yml` runs on `push: main`                                                                          | `ci-internal-deploys`, `ci-local-cd-remote`        | `.github/workflows/cd.yml`                                      |
| V2  | CodeQL + gitleaks live inside `ci.yml`                                                                 | `ci-local-cd-remote` (own weekly workflow)         | `.github/workflows/ci.yml`                                      |
| V3  | Dockerfiles use `node:22-alpine` + pnpm + `pnpm-lock.yaml` (file no longer exists → images broken)     | `node-package-manager` (`oven/bun`)                | `apps/{api,web,admin}/Dockerfile`                               |
| V4  | `AGENTS.md` says "pnpm workspaces", 20× `pnpm` commands                                                | `node-package-manager`                             | `AGENTS.md`                                                     |
| V5  | No `## <Stack> rules` sections                                                                         | `stack-rules`                                      | `AGENTS.md`                                                     |
| V6  | No `C4Container` Mermaid block                                                                         | `doc-style`                                        | `docs/ARCHITECTURE.md`                                          |
| V7  | `SRS.md`, `TDD.md`, `docs/ARCHITECTURE.md`, `PLAN.md` "done when" are unfilled templates (`…`)         | `docs-first-agentic` / AGENTIC_DOC_PACK            | `docs/*.md`                                                     |
| V8  | `ROADMAP.md` marks Phases 0–7 all `[x]`, but code has no ffmpeg, no OTel, no search engine, no tenancy | `LEFTOVER_CHECKLIST` "[x] only with proving tests" | grep counts: ffmpeg 0, opentelemetry 0, meilisearch 0, tenant 0 |
| V9  | `LEFTOVER_CHECKLIST.md` says "All closed" while G1–G12 gaps + ROADMAP backlog are untracked            | `feature-registry`, doc pack                       | `docs/LEFTOVER_CHECKLIST.md`                                    |
| V10 | 3 shared rules stale vs hub (`env-secret-sync`, `no-commit-tags`, `deliverables-markdown-only`)        | hub propagate                                      | diff vs `../.cursor/rules/`                                     |
| V11 | `infra/terraform` targets AWS; `deploy/SECRETS.md` prescribes AWS Secrets Manager                      | `no-paid-cloud`, hub `secrets/` vault              | `infra/terraform/main.tf`, `deploy/SECRETS.md`                  |
| V12 | `ci` script omits `typecheck` and `format:check`                                                       | `ci-local-cd-remote`                               | `package.json`                                                  |
| V13 | Root `ARCHITECTURE.md` is a second TDD + stale (claims no CI/Dockerfile/migrations)                    | doc pack "ARCHITECTURE is not a TDD"               | `ARCHITECTURE.md`                                               |
| V14 | `catalog-info.yaml` tags `[pnpm, node]`; `.npmrc` `shamefully-hoist` leftover                          | `node-package-manager`                             | root                                                            |

**Kit layer (optional per `kit-selective-merge`, entirely absent):** no `.claude/`, `.kit/kit.json`,
`OPENCODE.md`, `opencode.json`, `.mcp.json`, `docs/CONTEXT.md`, `docs/PITFALLS.md`,
`docs/PROJECT-PITFALLS.md`, `docs/plans/`, `scripts/ci.sh`, `.githooks/`, `biome.json`.
`sync-consumers.py` does not discover this repo.

**Stack is 1–2 majors behind:** Next 14 / React 18 / Expo 52 / RN 0.76 / Prisma 5 / Express 4 /
Zod 3 / Vitest 2 / ESLint+Prettier. Current: Next 16.4, React 19.3, Expo 58, RN 0.88, Node 24 LTS,
Prisma 7 (8 RC), Zod 4, Vitest 4, Biome 2.

---

## 2. Phase A — Rule compliance (1 session, Sonnet, no product change)

Each item is one commit; order matters only where noted.

- [ ] A1 `cd.yml`: remove `push` trigger; keep `workflow_dispatch` with `environment` input (V1)
- [ ] A2 Move CodeQL + gitleaks to `.github/workflows/security-weekly.yml` on `schedule: cron weekly` + dispatch (V2)
- [ ] A3 Rewrite 3 Dockerfiles on `oven/bun:1.4` multi-stage; `COPY bun.lock package.json` + workspace manifests; delete `.npmrc` (V3, V14)
- [ ] A4 `AGENTS.md`: bun everywhere; add `## <Stack> rules` sections (see §4.3); add "Org process rules (merged from agent-repo-kit)" (done in B); keep Spec pack order (V4, V5)
- [ ] A5 `docs/ARCHITECTURE.md`: replace template with real text flowchart + `C4Container` Mermaid; delete root `ARCHITECTURE.md` after moving Part 2 (target design) into `docs/TDD.md` and gaps G1–G12 into `LEFTOVER_CHECKLIST.md` (V6, V13)
- [ ] A6 `ROADMAP.md`: delete; its phases become `docs/PLAN.md` phases (§5) with honest `[ ]`; `LEFTOVER_CHECKLIST.md` lists every unproven item with the test file that would prove it (V8, V9)
- [ ] A7 Hub: `cd .. && bun run propagate-rules` (or equivalent) → re-sync the 3 stale `.mdc` files; commit here as `chore(rules): sync …` (V10)
- [ ] A8 `infra/terraform/` → move to `infra/terraform-aws-optional/` with README "paid, owner approval required"; `deploy/SECRETS.md` → point at hub `secrets/netflix-clone/` vault + `bun run secrets:collect` (V11)
- [ ] A9 `package.json`: `ci` = `lint && format:check && typecheck && test && build`; add `format:check` (V12)
- [ ] A10 `catalog-info.yaml`: tags `[bun, node, nextjs, expo, postgres]`, `deploy-target: docker-compose` (V14)
- [ ] A11 Verify: `bun install && bun run ci` green locally (PLAN.md admits tests were never run locally — this is the first real run; log failures to LEFTOVER, do not mark green by assertion)

**Done when:** `bun run ci` passes; `git diff ../.cursor/rules .cursor/rules` shows only the GENERATED header; `cd.yml` has no `push`.

---

## 3. Phase B — agent-repo-kit selective merge (1 session, Sonnet)

Pin: kit commit `9188079fa21d0b25563e14e86c10fdb58a1492f1` (checkout at
`~/WorkSpace/codeshipper/agent-repo-kit`, clean). Never `install.sh`, never `kit-sync --apply`.
Reference adoption: `../wolverine-solution-landing-page`.

```
 kit/template ──(copy unchanged)──▶ .claude/agents/{doc-scout,doc-writer,repo-analyst}.md
              ──(copy unchanged)──▶ .claude/skills/{tdd,spec-driven,planning,incremental,docs-adrs,composition-patterns,improve}
              ──(copy unchanged)──▶ docs/PITFALLS.md (generic, managed) · scripts/pitfalls-context.sh · scripts/sync-opencode-agents.mjs
              ──(merge by hand)──▶ AGENTS.md § "Org process rules (merged from agent-repo-kit)"
              ──(seed, then ours)─▶ docs/PROJECT-PITFALLS.md · docs/CONTEXT.md · docs/plans/CONVENTIONS.md · .claude/rules/* · .claude/settings.json · opencode.json · OPENCODE.md · .mcp.json
 .kit/kit.json ◀── {repo, ref:main, commit:9188079, $comment: "Selective merge: …list…"}
```

- [ ] B1 Copy agents (3) + skills listed above; run `node scripts/sync-opencode-agents.mjs` → `.opencode/agents/`
- [ ] B2 `AGENTS.md` org-process section — condensed bullets as in landing-page line 152: read lean · skills per prompt · subagents deliberately · short replies · automate repeats · pitfalls (tell/cause/rule/guard, guard proven by planted violation) · build whole then review · roadblocks → `docs/LEFTOVER_CHECKLIST.md` (not `LEFTOVER.md`) · commits/pushes only on ask, Conventional Commits, no trailers · Markdown-only deliverables (org rule beats kit's html-twin allowance) · model split: strong model writes `docs/plans/NN-*.md`, Sonnet implements with zero open questions
- [ ] B3 `.claude/settings.json`: disable plugins as kit; `SessionStart` hook → `scripts/pitfalls-context.sh`; project permissions (bun, turbo, docker compose read-only cmds)
- [ ] B4 `.claude/rules/`: `project-context.md` (this product's facts, phase gate), `status-reporting.md`, `tests-with-logic.md` (from bd-pos), `doc-template.md`, `local-stack.md`
- [ ] B5 Docs: `docs/CONTEXT.md` (handoff), `docs/PROJECT-PITFALLS.md` (empty register, same format), `docs/plans/CONVENTIONS.md` (bd-pos order: spec → red tests → schema+domain → api → web → mobile → green → tick → commit), `docs/README.md` index
- [ ] B6 `opencode.json` = `{"instructions": [".cursor/rules/*.mdc", "AGENTS.md"]}`; `OPENCODE.md` one-liner; `.mcp.json` with github + playwright only (no secrets)
- [ ] B7 Write `.kit/kit.json`; verify: `python3 ~/WorkSpace/codeshipper/agent-repo-kit/scripts/sync-consumers.py` now lists `netflix-clone` as "up to date for the selected paths"
- [ ] B8 Dup-check before adding any PROJECT-PITFALLS entry: `python3 …/dup-check.py docs/PITFALLS.md docs/PROJECT-PITFALLS.md --candidate "<text>"`
- [ ] B9 Lint/format: replace ESLint+Prettier with **Biome 2** (bd-pos standard) + `scripts/ci.sh --fast` pre-commit / full pre-push via `.githooks/` (replaces `.pre-commit-config.yaml`); `post-checkout` sets `core.hooksPath`

**Streaming-platform skills (none exist in kit or bd-pos — create as project-owned
`.claude/skills/`, generic ones upstream to kit by PR later):**

| Skill                 | Trigger                        | Contents                                                                                                                    |
| --------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `tenant-scoping`      | any DB/API change              | `withTenant()` wrapper, RLS fence test, `tenantScopedTables` list, host→tenant resolution, "never query without tenant ctx" |
| `video-pipeline`      | asset/transcode/packaging work | ffmpeg ABR ladder recipe, Shaka Packager CMAF cmd, rendition naming, job states, idempotent retries                         |
| `playback-security`   | playback/token/DRM work        | signed URL/HMAC, AES-128 key rotation, ClearKey license route, DRM add-on seam, concurrent-stream registry                  |
| `player-integration`  | web/mobile/TV player           | Shaka engine + Video.js 10 shell, expo-video, QoE event contract, error taxonomy                                            |
| `qoe-analytics`       | telemetry work                 | event schema, NATS subject naming, ClickHouse MV patterns, dashboards                                                       |
| `whitelabel-theming`  | branding/UI                    | tenant token CSS vars, logo/media, per-tenant Tailwind theme, mobile runtime branding, accessibility contrast check         |
| `streaming-load-test` | perf work                      | k6 HLS manifest/segment script, playback-token burst test, pass thresholds                                                  |

Copy from bd-pos as-is (generic): `owasp-security`, `logging`, `react-best-practices`,
`web-design-guidelines`, `manual-test-pass`.

**Done when:** `sync-consumers.py` discovers the repo; `claude` session start prints both pitfalls
registers; `scripts/ci.sh --fast` runs Biome + tsc + dependency-cruiser.

---

## 4. Software design (summary — full text goes to SRS/TDD/ADRs in Phase C)

### 4.1 Target architecture

```
                 tenant.example.com / brand.streamkit.app
                              │  Host header
                   ┌──────────▼──────────┐
                   │ Caddy (on-demand TLS│ ask→ /tenants/verify-domain      [$0]
                   │  or CF for SaaS)    │                           [opt paid]
                   └──────────┬──────────┘
            ┌─────────────────┼──────────────────┐
   ┌────────▼───────┐ ┌───────▼───────┐ ┌────────▼────────┐
   │ apps/web Next16│ │ apps/api      │ │ apps/admin      │  (admin = platform
   │ proxy.ts: host │ │ NestJS11+Fast.│ │ super-admin +   │   ops; tenant admin
   │ → tenant ctx   │ │ TenantGuard   │ │ tenant console) │   lives in web /studio)
   └────────────────┘ └───────┬───────┘ └─────────────────┘
                              │ withTenant(tx: set_config app.tenant_id)
   ┌──────────────────────────▼───────────────────────────┐
   │ Postgres 18 + RLS (tenant_id on every row, FORCE)     │ PgBouncer txn mode
   │ pgvector (recs)      Valkey (cache, BullMQ, sessions) │
   └───────┬──────────────────────────┬────────────────────┘
           │ BullMQ jobs              │ outbox
   ┌───────▼────────┐        ┌────────▼────────┐    ┌──────────────┐
   │ workers/       │        │ Meilisearch     │    │ NATS → Click │
   │ ffmpeg + Shaka │        │ (index/tenant)  │    │ House (QoE)  │
   │ Packager →CMAF │        └─────────────────┘    └──────────────┘
   └───────┬────────┘
   ┌───────▼────────────────────────────────────────────────┐
   │ Origin: MinIO (dev) / R2 or B2 (prod) · Bunny CDN opt. │
   │ HLS+DASH, AES-128 + signed URLs; ClearKey; DRM add-on  │
   └────────────────────────────────────────────────────────┘
   Live: MediaMTX (SRT/RTMP in → LL-HLS out) per tenant ingest key
   Obs:  OTel SDK → Collector → SigNoz (self-host)
```

### 4.2 Decisions (each becomes an ADR; "mirror bd-pos" = lift its code pattern)

| ADR  | Decision                                                                                                                                                                                                                                                                                | Why                                                                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 0002 | **Tenancy = shared Postgres + RLS**, `tenant_id` ULID leads every index; app role non-owner; `withTenant`/`asSystem`; fence test for unlisted tables — _mirror bd-pos ADR-0006_                                                                                                         | proven in-house; PgBouncer-safe with transaction-local `set_config`                                         |
| 0003 | **Tenant resolution by Host header** (new vs bd-pos session-based): `domains` table (`tenant_id, host, verified, primary`); cache host→tenant in Valkey; `X-Tenant-Id` propagated                                                                                                       | white-label requires domain = brand                                                                         |
| 0004 | **Custom-domain TLS = Caddy on-demand** with `ask` endpoint; Cloudflare for SaaS optional (100 free hostnames)                                                                                                                                                                          | $0 default per no-paid-cloud                                                                                |
| 0005 | **Branding = `tenant_branding` row** (tokens JSON: colors, radius, fonts, logo/favicon/og media ids, legal links, app name) → CSS vars injected in root layout; mobile reads same payload at boot (single binary, runtime brand); per-tenant store builds via `app.config.ts` env later | one codebase, N brands                                                                                      |
| 0006 | **Entitlements, not plan flags** — `entitlement` table rebuilt from paid/trial/flag sources; `can(tenant, feature)` + `can(user, action, resource)`; OpenFeature + Unleash OSS for flags — _mirror bd-pos ADR-0030_                                                                     | gates DRM, live, max renditions, concurrent streams, seats                                                  |
| 0007 | **Billing two-layer**: platform↔tenant = Stripe Billing (our SaaS plans); tenant↔viewer = **Stripe Connect** account per tenant (or BYO keys); `BillingProvider` interface + sandbox provider refused in prod — _mirror bd-pos_                                                         | tenants keep their merchant relationship                                                                    |
| 0008 | **API = NestJS 11 + Fastify + nestjs-zod (Zod 4) + OpenAPI**; modules sealed via dependency-cruiser; Express retired                                                                                                                                                                    | bd-pos parity → Sonnet can lift guards/providers verbatim; alternative Hono+oRPC noted, rejected for parity |
| 0009 | **ORM = Drizzle** (migrate from Prisma 5)                                                                                                                                                                                                                                               | data layer is rewritten anyway for tenant_id; avoids Prisma 8 extension break; bd-pos parity                |
| 0010 | **VOD pipeline = ffmpeg workers (BullMQ) + Shaka Packager CMAF**, ladder: 240p–1080p H.264 default, HEVC/AV1 tiers by entitlement; PeerTube-style stateless runners                                                                                                                     | OSS, horizontally scalable                                                                                  |
| 0011 | **Protection tiers**: T0 signed URLs; T1 AES-128 + key rotation; T2 ClearKey; T3 multi-DRM add-on (Bunny per-license or Axinom; FairPlay cert per tenant legal entity — tenant brings own FPS package)                                                                                  | no $0 production DRM exists                                                                                 |
| 0012 | **Live = MediaMTX** per-tenant ingest keys, LL-HLS; SRS if origin clustering needed; auto-archive to VOD                                                                                                                                                                                | OSS, active                                                                                                 |
| 0013 | **Storage/CDN**: MinIO dev; prod R2 (zero egress) or B2+Bandwidth Alliance; Bunny volume CDN optional with token auth; cache key `tenant/asset/rendition/segment`                                                                                                                       | R2 video delivery is allowed-by-practice, unverified-by-terms → flag                                        |
| 0014 | **Observability**: OTel → SigNoz; pino; per-tenant RED metrics; QoE = player events → NATS JetStream → ClickHouse                                                                                                                                                                       | one self-hosted store                                                                                       |
| 0015 | **Search/recs**: Meilisearch index per tenant; pgvector "more like this"; nightly co-occurrence CF job                                                                                                                                                                                  | cheap, tenant-isolated                                                                                      |
| 0016 | **Frontend**: Next 16.4 (`proxy.ts`, Cache Components), React 19.3, Tailwind 4 `@theme` driven by tenant vars; Video.js 10 shell over Shaka engine; Expo 58 + expo-video; `react-native-tvos` later                                                                                     | current stable                                                                                              |
| 0017 | **Deploy**: docker-compose (postgres, valkey, minio, meilisearch, nats, clickhouse, signoz profile, mediamtx, api, web, admin, worker ×N) behind Caddy; `DEPLOY_MODE=cloud                                                                                                              | standalone` (standalone = one tenant, licence key) — _mirror bd-pos ADR-0019_                               | $0 self-host; standalone sells as on-prem |
| 0018 | **Tenant lifecycle** `pending → active → suspended → pending_deletion → deleted`; one guard; 423/410 semantics — _mirror bd-pos ADR-0031_                                                                                                                                               |                                                                                                             |

### 4.3 `## <Stack> rules` sections to add to AGENTS.md

Next.js 16 · React 19 · NestJS/Fastify · Drizzle/Postgres RLS · Expo 58 · Tailwind 4 · Biome · Turborepo/bun · ffmpeg/Shaka · Vitest/Playwright. Each: what to use, what to avoid, which check enforces it (cite official docs).

### 4.4 Multi-tenant data model (delta on existing schema)

```
 tenant ─┬─ tenant_domain (host, verified_at, is_primary)
         ├─ tenant_branding (tokens jsonb, logo_media_id, …)
         ├─ tenant_platform (stripe_customer, connect_account, billing_status)
         ├─ subscription → entitlement (feature, limit, source)
         ├─ tenant_member (user, role: owner|admin|editor|support)   ← tenant staff
         ├─ viewer (user) ─ profile ─ watch_history / my_list / review   ← existing, +tenant_id
         ├─ content/season/episode/asset/video_file/caption/trickplay/license_window  +tenant_id
         ├─ live_channel/live_event/event_entitlement  +tenant_id
         ├─ purchase/playback_session/qoe_event/outbox  +tenant_id
         └─ ingest_key, api_key (tenant programmatic access)
 platform (no tenant_id, admin auth instance): admin_user, flag, tenant_flag, audit_log, support_session, tenant_usage
```

Rule: every table in `tenantScopedTables` or explicitly in `platformTables`; fence test fails otherwise.

### 4.5 Traffic-handling targets (NFRs → `quality-attribute-scenario` format in SRS)

| ID          | Scenario                                                         | Target                                                          |
| ----------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| NFR-PERF-1  | Playback-token issue p95 under 5k req/s burst (live event start) | < 150 ms, 0 errors; k6 proves                                   |
| NFR-PERF-2  | Segment delivery never touches API/DB                            | CDN/origin only; signed URL verified at edge or Caddy           |
| NFR-PERF-3  | Catalog pages anonymous-cacheable                                | `s-maxage` + SWR; p95 TTFB < 300 ms                             |
| NFR-SCALE-1 | Transcode throughput                                             | linear with worker count; 1h 1080p source < 15 min on 4 workers |
| NFR-AVAIL-1 | API stateless; Valkey + Postgres HA optional                     | degrade: play continues when API down (tokens pre-issued)       |
| NFR-SEC-1   | Cross-tenant read impossible at DB level                         | RLS fence test + k6 negative test                               |
| NFR-SEC-2   | Concurrent-stream cap per plan                                   | Valkey session registry with heartbeat                          |

---

## 5. Product phases (replaces ROADMAP.md; each → `docs/plans/NN-*.md` written by strong model, executed by Sonnet)

| Phase                        | Plan docs                                                                                                                                                                                                                        | FR group | Done when                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| **0 Foundation**             | 01 stack-upgrade (Next16/React19/Expo58/Node24/Biome/Vitest4) · 02 nest-fastify-api (port modules 1:1, Express removed) · 03 drizzle-migration (schema parity, data migration script)                                            | FR-CORE  | `bun run ci` green; all 47 existing tests ported; Playwright e2e green     |
| **1 Tenancy**                | 04 tenant-rls (tables, `withTenant`, fence test) · 05 host-resolution + Caddy on-demand TLS · 06 tenant-lifecycle guard · 07 platform admin (second auth, tenants/flags/audit)                                                   | FR-TEN   | two tenants on two hosts, cross-tenant negative tests pass                 |
| **2 White-label**            | 08 branding tokens + media · 09 tenant console (`/studio`: brand, domains, team, catalog) · 10 mobile runtime branding                                                                                                           | FR-WL    | brand switch without rebuild on web + mobile                               |
| **3 Video pipeline**         | 11 upload (S3 multipart) + asset state machine · 12 ffmpeg worker + ladder · 13 Shaka CMAF + captions + trickplay · 14 playback service (signed URLs, AES-128, ClearKey) · 15 player (Shaka+Video.js 10, expo-video, QoE events) | FR-VOD   | real upload → ABR playback in web+mobile; k6 token burst passes NFR-PERF-1 |
| **4 Billing & entitlements** | 16 platform plans (Stripe Billing) · 17 Stripe Connect per tenant + BYO keys · 18 entitlement service + OpenFeature/Unleash · 19 concurrent streams + quality caps                                                               | FR-BIL   | sandbox→prod provider swap; webhook idempotency tests                      |
| **5 Live**                   | 20 MediaMTX ingest keys · 21 LL-HLS playback + DVR · 22 auto-archive to VOD · 23 live load test                                                                                                                                  | FR-LIVE  | SRT in → viewers on 2 tenants; blackout/geo rules                          |
| **6 Scale & observability**  | 24 OTel→SigNoz · 25 NATS→ClickHouse QoE + dashboards · 26 Meilisearch per tenant · 27 pgvector recs · 28 PgBouncer/read replica/backups-PITR                                                                                     | FR-OPS   | dashboards per tenant; restore drill documented                            |
| **7 Compliance**             | 29 DRM add-on seam (Bunny/Axinom) · 30 GDPR/DSAR/consent (existing models) · 31 DMCA, kid profiles, WCAG audit · 32 admin MFA (exists), runbooks                                                                                 | FR-LEGAL | audit checklist in FEATURES.md                                             |
| **8 Distribution**           | 33 TV (react-native-tvos, Tizen/webOS Shaka wrapper) · 34 offline downloads · 35 notifications fan-out · 36 standalone/on-prem licence mode                                                                                      | FR-GROW  |                                                                            |

Each plan doc follows bd-pos format: Goal · Read first · Decisions already made · Files by layer ·
Ordered steps (Part A/B, one commit each) · Checks `[ ]` naming the proving test ·
LEFTOVER rows opened · Out of scope · Sources.

---

## 6. Owner decisions needed before Phase C/0 starts

| #   | Question                                                                                                              | Recommendation                                             |
| --- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| D1  | API: NestJS+Fastify (bd-pos parity) vs Hono+oRPC (faster, edge-capable)                                               | **NestJS** — Sonnet lifts bd-pos guards/providers directly |
| D2  | ORM: Drizzle (migrate) vs stay Prisma 7                                                                               | **Drizzle** — rewrite is happening anyway for tenant_id    |
| D3  | Product name/repo rename (`netflix-clone` → `streamkit`?) and hub README row                                          | rename after Phase 1; keep submodule path until then       |
| D4  | Delivery: R2 (terms unverified for video) vs Bunny (clear, ~$5/TB) — both are paid at scale → approval needed per SKU | dev = MinIO; prod decision deferred, document both         |
| D5  | DRM add-on vendor and whether tenants bring own FairPlay cert                                                         | ClearKey/AES default; vendor pick at Phase 7               |
| D6  | Keep `apps/admin` as platform super-admin only, tenant admin moves into `apps/web/(studio)`?                          | yes (bd-pos host-split pattern)                            |
| D7  | Mobile white-label: single binary runtime brand (store listing = ours) vs per-tenant store builds                     | runtime first; per-tenant builds Phase 8                   |

---

## 7. Phase C — write the design pack (strong model, 1–2 sessions, after D1–D7)

- [ ] C1 `docs/SRS.md`: personas (platform operator, tenant owner, tenant editor, viewer, kid), FR-CORE/TEN/WL/VOD/BIL/LIVE/OPS/LEGAL/GROW with stable IDs, NFRs from §4.5 as stimulus/response scenarios
- [ ] C2 `docs/ARCHITECTURE.md`: §4.1 diagram + C4Container Mermaid; no TDD content
- [ ] C3 `docs/TDD.md`: §4.2 choices, module map, data model §4.4, request flows (runtime view: signup, domain verify, upload→play, live start, checkout), deployment view, failure modes
- [ ] C4 `docs/adr/0002…0018` per §4.2 (adr-writer format)
- [ ] C5 `docs/PLAN.md` = §5 table with checkboxes; `docs/LEFTOVER_CHECKLIST.md` seeded with G1–G12 + unverified items (R2 terms, Prisma 8, RN-video v7, FairPlay per tenant)
- [ ] C6 `docs/plans/01…03` (Phase 0) written to CONVENTIONS, zero open questions
- [ ] C7 `docs/FEATURES.md` keeps the 13 shipped rows; new rows only when a Leftover closes with a test

Skills to use while writing: `quality-attribute-scenario-writer`, `adr-writer`, `runtime-view-writer`,
`deployment-view-writer`, `scalability-hotspot-detector`, `architecture-risk-assessor`.

---

## 8. Session hygiene / org rules that apply throughout

- Commit only when owner asks; Conventional Commits; no trailers; `git log -1 --format=%B` check.
- After any push here: bump hub pin (`cd .. && bun run bump-pins`) and push hub pointer in the same session (unless this tree is dirty).
- Secrets: `.env` stays gitignored here; real values → hub `secrets/netflix-clone/`, `bun run secrets:collect`.
- No paid SKU without asking (R2/Bunny/B2/CF-for-SaaS/DRM all paid at scale — each needs a yes).
- Deliverables = `.md` in repo. Diagrams ASCII or Mermaid.
- Before adding any pitfall/rule: `dup-check.py` across `docs/PITFALLS.md`, `docs/PROJECT-PITFALLS.md`, kit `template/docs/PITFALLS.md`.
