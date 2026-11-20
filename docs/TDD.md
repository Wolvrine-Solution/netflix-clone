# Technical Design Document (TDD)

## StreamKit (repo: netflix-clone)

| Field      | Value                                                              |
| ---------- | ------------------------------------------------------------------ |
| Status     | Draft v1 for owner review                                          |
| Date       | 2026-10-28                                                         |
| Implements | [SRS.md](./SRS.md) (all FR groups, phased by [PLAN.md](./PLAN.md)) |
| Overview   | [ARCHITECTURE.md](./ARCHITECTURE.md)                               |
| Decisions  | [adr/0002 to 0018](./adr/)                                         |

Owner decisions that bind this document: NestJS 11 on Fastify (D1), Drizzle ORM (D2),
shared-database Postgres RLS tenancy, bun as package manager, $0 self-hosted defaults.

## 1. Goals and non-goals

**Goals**

- Satisfy FR-CORE, FR-TEN, FR-WL, FR-VOD, FR-BIL, FR-LIVE, FR-OPS, FR-LEGAL and FR-GROW in phases.
- Isolate tenants at the database, not only in application code.
- Keep video bytes off the API and off the database.
- Let Sonnet implement each phase from a plan doc with no open questions.
- Run the full stack with `docker compose up` and no paid service.

**Non-goals**

- Database-per-tenant or schema-per-tenant (only for a future regulated tenant, see ADR 0002).
- A microservice split. The API is a modular monolith. Workers are the only separate process type.
- Building DRM license servers. DRM is bought as an add-on.
- Replacing the player engine. We wrap Shaka Player.

## 2. Architecture overview

```text
 clients ──> Caddy ──> web / admin / mobile ──> API (modular monolith) ──> Postgres (RLS)
                                                  |   |   |                   Valkey
                                                  |   |   +─ enqueue ──> workers ──> object storage
                                                  |   +─ outbox ──> Meilisearch
                                                  +─ events ──> NATS ──> ClickHouse
 viewers ──> CDN / storage (segments)      live: encoder ──> MediaMTX ──> LL-HLS ──> CDN
```

**Style:** modular monolith (hexagonal inside each module). One API process type, one worker
process type, one database. Modules talk through their index file only (ADR 0008).

## 3. Technology stack

Target versions checked against vendor release notes on 2026-10-28. "Unverified" means not confirmed from a primary source.

| Layer              | Choice                                                                              | Notes                                                                      |
| ------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Runtime            | Node 24 LTS (Active LTS, EOL 2028-04-30), bun 1.4 as installer and script runner    | bun is the org standard. Node is the runtime for Next, Nest, Expo tooling. |
| API                | NestJS 11 on Fastify 5, nestjs-zod, Zod 4, OpenAPI via @nestjs/swagger              | ADR 0008                                                                   |
| ORM and migrations | Drizzle ORM and drizzle-kit, postgres-js driver                                     | ADR 0009                                                                   |
| Database           | PostgreSQL 18 with RLS, PgBouncer (transaction mode) in front                       | ADR 0002                                                                   |
| Cache, queue       | Valkey (Redis-compatible), ioredis, BullMQ                                          | Replaces `node-cache` (gap G9)                                             |
| Web                | Next.js 16.4, React 19.3, Tailwind 4                                                | ADR 0016. `proxy.ts` replaces middleware.                                  |
| Mobile             | Expo SDK 58, React Native 0.88, expo-video, NativeWind                              | New Architecture is mandatory since SDK 55                                 |
| Player             | Shaka Player 5.2 engine, Video.js 10 UI shell on web                                | Video.js 10 GA 2026-10-01                                                  |
| Video              | FFmpeg (libx264, libx265, libsvtav1), Shaka Packager 3.9                            | ADR 0010                                                                   |
| Live               | MediaMTX 1.21 (SRT, RTMP in, LL-HLS out). SRS 6 if origin clustering is needed.     | ADR 0012                                                                   |
| Storage and CDN    | MinIO (dev), Cloudflare R2 or Backblaze B2 (prod), Bunny CDN optional               | ADR 0013. Paid at scale, needs approval per SKU.                           |
| Edge TLS           | Caddy on-demand TLS with an `ask` endpoint                                          | ADR 0004                                                                   |
| Search             | Meilisearch, one index per tenant                                                   | ADR 0015                                                                   |
| Recommendations    | pgvector in Postgres, nightly co-occurrence job in BullMQ                           | ADR 0015                                                                   |
| Telemetry          | OpenTelemetry SDK and Collector, SigNoz, NATS JetStream, ClickHouse                 | ADR 0014                                                                   |
| Billing            | Stripe Billing (platform plans), Stripe Connect (tenant payouts), BYO keys fallback | ADR 0007                                                                   |
| Flags              | OpenFeature client with Unleash OSS                                                 | ADR 0006                                                                   |
| Lint, format       | Biome 2                                                                             | Replaces ESLint and Prettier                                               |
| Tests              | Vitest 4, Testcontainers, Playwright, k6, fast-check                                |                                                                            |
| Monorepo           | Turborepo 2 with bun workspaces                                                     |                                                                            |

Current repo versions (what the code uses today): Express 4.19, Prisma 5.19, Next 14.2, React 18.3,
Expo 52, React Native 0.76, Zod 3, Vitest 2, hls.js 1.5, pino 9, jose 5, Stripe SDK 16, ioredis 5,
ESLint and Prettier. [plans/01](./plans/01-stack-upgrade.md) to [plans/03](./plans/03-drizzle-migration.md) close the gap.

## 4. Domain modules

API module layout (copied from the bd-pos pattern): `apps/api/src/modules/<name>/{controller,service,repository,dto,module,index}.ts`.
Only `index.ts` may be imported from another module. Drizzle appears only in repositories.

| Module            | Responsibility                                                                     | Today's code it replaces                                                      | FRs                        |
| ----------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| `tenancy`         | Tenant entity, lifecycle guard, host resolution, domains                           | none                                                                          | FR-TEN-1..4, 7             |
| `platform`        | Operator auth, tenants admin, flags, audit, support sessions                       | `routes/admin/*` partly                                                       | FR-TEN-6, 8                |
| `identity`        | Viewer and staff sign-in, refresh tokens, MFA, API keys                            | `routes/auth.ts`, `lib/jwt.ts`, `lib/totp.ts`                                 | FR-CORE-1, 10, FR-TEN-5, 9 |
| `branding`        | Brand tokens, media, legal settings                                                | none                                                                          | FR-WL-1..8                 |
| `catalog`         | Content, seasons, episodes, genres, categories, rows, TMDB import                  | `routes/content.ts`, `rows.ts`, `admin/content.ts`, `services/tmdbService.ts` | FR-CORE-3, 14, FR-WL-6     |
| `assets`          | Upload sessions, asset state machine, renditions, captions, trick-play             | `modules/assets/transcode.ts`                                                 | FR-VOD-1..6, 12            |
| `playback`        | Entitlement check, signed manifest, key delivery, start position, session registry | `modules/playback/service.ts`, `modules/sessions/service.ts`                  | FR-VOD-7, 8, FR-BIL-5      |
| `entitlements`    | `can()` from plan, trial, flag and purchase                                        | `modules/entitlements/service.ts`                                             | FR-BIL-4, 6                |
| `billing`         | Provider interface, Stripe and sandbox providers, webhooks, invoices               | `modules/billing/stripe.ts`, `routes/v1/billing.ts`                           | FR-BIL-1..3, 7..10         |
| `engagement`      | Profiles, My List, watch history, reviews                                          | `routes/profiles.ts`, `myList.ts`, `watchHistory.ts`, `reviews.ts`            | FR-CORE-2, 6, 7, 8         |
| `notifications`   | In-app, email, push fan-out                                                        | `routes/notifications.ts`                                                     | FR-CORE-8, FR-GROW-3       |
| `live`            | Channels, events, ingest keys, playback tokens, archive                            | `modules/live/service.ts`, `routes/v1/live.ts`                                | FR-LIVE-1..8               |
| `search`          | Index writes via outbox, queries                                                   | `modules/search/indexer.ts`, `routes/search.ts`                               | FR-CORE-5, FR-OPS-4        |
| `recommendations` | Embeddings, co-occurrence, rows                                                    | `modules/recommendations/service.ts`                                          | FR-OPS-5                   |
| `analytics`       | QoE ingest, tenant reports, usage metering                                         | `routes/admin/analytics.ts`, model `QoEEvent`                                 | FR-VOD-11, FR-OPS-3, 7     |
| `compliance`      | License windows, consent, DSAR, DMCA                                               | `modules/compliance/service.ts`, `routes/v1/compliance.ts`                    | FR-LEGAL-1..4              |
| `health`          | `/health`, `/ready`, metrics                                                       | `index.ts`                                                                    | FR-CORE-13                 |

Cross-cutting (in `apps/api/src/common`): request ID, pino logger with redaction, OpenTelemetry
interceptor, error filter, rate limiter, env validation (fails fast, no fallback secrets).

Shared packages: `packages/db` (Drizzle schema, migrations, `withTenant`, `asSystem`),
`packages/contracts` (Zod 4 schemas shared by API and clients), `packages/types`, `packages/ui`,
`packages/config`, and later `packages/domain` (pure rules: permissions, plans, addons).

## 5. Data model

### 5.1 Scope classes

Every table is in exactly one class. A fence test fails the build if a table is in neither list.

- **Tenant-scoped:** has `tenant_id`, RLS policy `tenant_id = app_current_tenant()` with ENABLE and FORCE. `tenant_id` is a ULID (char 26) and leads every index.
- **Platform:** no `tenant_id`. Reached only through `asSystem` or the operator auth instance. Includes lookups needed before a tenant is known (host to tenant).

### 5.2 New tables

| Table                                   | Class    | Key columns                                                                                                                                                                                            |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tenant`                                | platform | `id`, `name`, `slug` (unique), `status` (pending, active, suspended, pending_deletion, deleted), `plan_id`, `deploy_mode`, `suspended_at`, `suspension_reason`, `deletion_requested_at`, `created_at`  |
| `tenant_domain`                         | platform | `id`, `tenant_id`, `host` (unique, lower-case), `is_primary`, `verification_token`, `verified_at`, `tls_status`                                                                                        |
| `tenant_branding`                       | tenant   | `tenant_id` (pk), `tokens` jsonb (colors, radius, font ids), `app_name`, `logo_media_id`, `favicon_media_id`, `og_media_id`, `hero_media_id`, `legal_links` jsonb, `support_email`, `default_language` |
| `media`                                 | tenant   | `id`, `tenant_id`, `kind`, `storage_key`, `mime`, `bytes`, `width`, `height`, `created_by`                                                                                                             |
| `tenant_platform`                       | platform | `tenant_id` (pk), `stripe_customer_id`, `stripe_connect_account_id`, `billing_status`, `connect_mode` (connect, byo_keys)                                                                              |
| `plan`                                  | platform | `id`, `code`, `limits` jsonb (storage_gb, transcode_min, concurrent_streams, seats, domains), `features` text[], `stripe_price_id`                                                                     |
| `staff_user`                            | platform | `id`, `email` (unique), `name`, `hashed_password`, `mfa_secret`, `mfa_enabled`, `created_at`                                                                                                           |
| `tenant_member`                         | tenant   | `tenant_id`, `staff_user_id`, `role` (owner, admin, editor, support), `invited_at`, `accepted_at`                                                                                                      |
| `platform_admin_user`                   | platform | separate auth instance: users, sessions, accounts, MFA tables, roles platform_admin and support                                                                                                        |
| `entitlement`                           | tenant   | `id`, `tenant_id`, `subject_type` (tenant, viewer), `subject_id`, `feature`, `limit_value`, `source` (paid, trial, flag, licence, purchase), `expires_at`                                              |
| `flag`, `tenant_flag`                   | platform | flag key, default, rollout percent, per-tenant override                                                                                                                                                |
| `api_key`                               | tenant   | `id`, `tenant_id`, `name`, `prefix`, `key_hash`, `scopes` text[], `last_used_at`, `revoked_at`                                                                                                         |
| `ingest_key`                            | tenant   | `id`, `tenant_id`, `channel_id`, `key_hash`, `rotated_at`                                                                                                                                              |
| `upload_session`                        | tenant   | `id`, `tenant_id`, `asset_id`, `s3_upload_id`, `parts` jsonb, `status`                                                                                                                                 |
| `rendition`                             | tenant   | `id`, `tenant_id`, `asset_id`, `codec`, `width`, `height`, `bitrate`, `playlist_key`, `status`                                                                                                         |
| `usage_counter`                         | tenant   | `tenant_id`, `period`, `metric` (storage_gb, transcode_min, egress_gb, peak_streams), `value`                                                                                                          |
| `audit_log`                             | tenant   | `id`, `tenant_id`, `actor_type`, `actor_id`, `action`, `resource`, `resource_id`, `details`, `ip`, `at` (replaces `AdminLog` for tenant actions)                                                       |
| `platform_audit_log`, `support_session` | platform | operator actions and impersonation sessions (token hashed)                                                                                                                                             |
| `content_embedding`                     | tenant   | `content_id`, `tenant_id`, `embedding` vector, `model`                                                                                                                                                 |

### 5.3 Existing tables (from `packages/db/prisma/schema.prisma`) and their target class

| Existing model                                                           | Target                                | Change                                                                                                                                              |
| ------------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                                                                   | tenant (viewer)                       | Add `tenant_id`. Unique becomes `(tenant_id, email)`. Drop `role` and `mfa*` (staff move to `staff_user`). Keep `is_suspended`, consent timestamps. |
| `Account`, `Session`, `VerificationToken`                                | tenant                                | Add `tenant_id` (NextAuth adapter tables, viewer side).                                                                                             |
| `Profile`                                                                | tenant                                | Add `tenant_id`. Unique `(user_id, name)` stays.                                                                                                    |
| `RefreshToken`                                                           | tenant                                | Add `tenant_id`.                                                                                                                                    |
| `Subscription`                                                           | tenant                                | Add `tenant_id`. Provider ids move to nullable generic columns.                                                                                     |
| `Content`, `Season`, `Episode`                                           | tenant                                | Add `tenant_id`. `tmdb_id` unique becomes `(tenant_id, tmdb_id)`.                                                                                   |
| `VideoFile`                                                              | tenant                                | Add `tenant_id`. Superseded by `rendition` for pipeline output.                                                                                     |
| `Genre`                                                                  | platform (reference)                  | Read-only TMDB genre list, shared.                                                                                                                  |
| `ContentGenre`, `Category`, `ContentCategory`, `Row`, `ContentRow`       | tenant                                | Add `tenant_id`. `Category.name` and `slug` unique per tenant.                                                                                      |
| `MyListItem`, `WatchHistory`, `Review`, `Notification`                   | tenant                                | Add `tenant_id`.                                                                                                                                    |
| `AdminLog`                                                               | split                                 | Becomes tenant `audit_log` and `platform_audit_log`.                                                                                                |
| `Asset`, `Caption`, `TrickPlaySprite`, `LicenseWindow`                   | tenant                                | Add `tenant_id`.                                                                                                                                    |
| `QoEEvent`                                                               | tenant (hot path moves to ClickHouse) | Postgres table kept only for low-volume fallback in dev.                                                                                            |
| `LiveChannel`, `LiveEvent`, `EventEntitlement`                           | tenant                                | Add `tenant_id`. Slug unique per tenant.                                                                                                            |
| `StripeWebhookEvent`                                                     | platform                              | `tenant_id` nullable. Events can belong to the platform or a connected account.                                                                     |
| `Purchase`, `PlaybackSession`                                            | tenant                                | Add `tenant_id`.                                                                                                                                    |
| `OutboxEvent`                                                            | tenant                                | Add `tenant_id`. Processed by workers via `asSystem` and re-entered with `withTenant`.                                                              |
| `DmcaTakedown`, `ConsentRecord`, `DataSubjectRequest`, `DownloadLicense` | tenant                                | Add `tenant_id`.                                                                                                                                    |

### 5.4 Relationship sketch

```text
 tenant ─┬─ tenant_domain (host)           ┌─ staff_user ── tenant_member ─┐
         ├─ tenant_branding ── media       │                               │
         ├─ tenant_platform (billing)      └───────────────────────────────┤
         ├─ entitlement, api_key, usage_counter, audit_log                 │
         ├─ user ── profile ── my_list / watch_history / review            │
         │     └─ subscription, purchase, playback_session, consent, dsar  │
         ├─ content ── season ── episode                                   │
         │     ├─ asset ── upload_session, rendition, caption, trickplay   │
         │     ├─ genre links, category links, row links, license_window   │
         │     └─ content_embedding                                        │
         └─ live_channel ── live_event ── event_entitlement, ingest_key ───┘
 platform: tenant, tenant_domain, plan, flag, tenant_flag, platform_admin_user,
           platform_audit_log, support_session, stripe_webhook_event, genre
```

### 5.5 RLS mechanics

```text
 migration (owner role)           app (role streamkit_app, non-owner, no BYPASSRLS)
 ──────────────────────           ───────────────────────────────────────────────
 ALTER TABLE t ENABLE RLS;        withTenant(db, tenantId, fn):
 ALTER TABLE t FORCE RLS;           BEGIN
 CREATE POLICY tenant_iso ON t      SELECT set_config('app.tenant_id', $1, true)   -- transaction-local
   USING (tenant_id = app_current_tenant())  fn(tx)
   WITH CHECK (tenant_id = app_current_tenant());   COMMIT
 CREATE FUNCTION app_current_tenant() ... current_setting('app.tenant_id', true)
 asSystem(db, fn): sets app.bypass_rls=on for platform jobs only (migrations, outbox, host lookup)
```

`set_config(..., true)` is transaction-local, so PgBouncer transaction pooling is safe. A plain `SET` is not.
`withTenant` also asserts the connection is actually restrained (inserts a probe row and expects zero visible).

## 6. API design

- Base path `/api/v1`. OpenAPI 3.1 generated from Zod schemas and served at `/api/v1/openapi.json`.
- Errors: RFC 9457 problem details. Every response carries `x-request-id`.
- Auth: `Authorization: Bearer <access>`. Access tokens 15 minutes, refresh tokens with server-side revocation. Three issuers (viewer, staff, platform), three secrets.
- Tenant: from `Host` (web) or `x-tenant-id` set by the proxy (internal). Clients cannot choose a tenant by header.
- Pagination: cursor based. Filtering and sorting through typed query DTOs.

Route groups: `/auth`, `/profiles`, `/catalog`, `/rows`, `/search`, `/my-list`, `/history`, `/reviews`,
`/notifications`, `/playback`, `/live`, `/billing`, `/studio/*` (staff), `/platform/*` (operators),
`/public/branding`, `/public/dmca`, `/webhooks/{provider}`, `/health`, `/ready`.

## 7. Runtime views

### 7.1 Tenant signup and first brand

```text
 Owner        Web (marketing)      API                    DB                   Worker
  |  signup form  |                 |                      |                      |
  |-------------->|  POST /platform/signup                 |                      |
  |               |---------------->| asSystem: insert tenant(status=pending),     |
  |               |                 |   staff_user, tenant_member(owner), slug host |
  |               |                 |   <slug>.streamkit.app into tenant_domain     |
  |               |                 | enqueue welcome email, create Stripe customer |
  |  email link   |                 |---------------------------------------------->|
  |-------------->| verify -> tenant.status=active                                   |
  |  studio: brand tokens, logo ---> PUT /studio/branding (withTenant)               |
```

### 7.2 Custom domain verification and TLS

```text
 Owner adds shows.example.com in studio
   -> API inserts tenant_domain(verified_at=null, verification_token=T)
   -> Studio shows: TXT _streamkit-challenge.shows.example.com = T ; CNAME shows -> edge.streamkit.app
 Worker (every 60 s, backoff): DNS lookup TXT + CNAME
   -> match: set verified_at, invalidate Valkey host->tenant cache
 First HTTPS request to shows.example.com reaches Caddy
   -> Caddy on-demand TLS calls  GET /internal/tls/ask?domain=shows.example.com
   -> API: host verified and tenant active? 200 : 404
   -> Caddy obtains the certificate (rate-limited) and serves the request
```

### 7.3 Upload to play (VOD)

```text
 Editor      Studio/API              Object store        Worker(s)                 Viewer / Player
   | new asset |                         |                   |                           |
   |---------->| create asset(UPLOADED), upload_session      |                           |
   |<----------| presigned multipart URLs                    |                           |
   |==== PUT parts directly =============>|                   |                           |
   |  complete |-> complete multipart; asset=QUEUED; enqueue transcode                  |
   |           |                         |<-- fetch master --|                           |
   |           |                         | ffmpeg ladder: 240p..1080p (+HEVC/AV1 by plan)|
   |           |                         |<-- write renditions|  Shaka Packager: CMAF, HLS+DASH, AES-128 keys
   |           |<-- asset=PACKAGED, outbox content.ready ----|  captions + trick-play checked
   |           |   publish allowed only if captions present (FR-VOD-5)                    |
   |           |                                                       press play         |
   |           |<---------------- POST /playback {contentId, profileId, deviceId} --------|
   |           |  TenantGuard -> Auth -> can(play) -> session registry (stream cap)       |
   |           |  sign manifest URL (5 min, tenant+asset bound), return start position    |
   |           |----------------- {manifestUrl, keyUrl, startAt} ------------------------>|
   |                                          segments from CDN / object store, no API    |
```

### 7.4 Live event start

```text
 Producer encoder --SRT/RTMP (ingest key)--> MediaMTX --verify key--> API /internal/live/auth
 API: key valid, event within window, tenant active -> allow publish
 MediaMTX: transcode ladder, write LL-HLS parts to origin; API sets event.status=LIVE
 Viewers: POST /live/events/:id/playback -> geo/blackout + entitlement -> signed LL-HLS URL
 Event ends: status=ENDED, recording copied to storage, enqueue VOD pipeline (archived content)
```

### 7.5 Viewer checkout

```text
 Viewer picks tenant plan -> POST /billing/checkout (withTenant)
   -> BillingProvider.createCheckout (Stripe Checkout on the tenant's connected account)
   -> redirect to provider; payment succeeds
 Provider webhook -> POST /webhooks/stripe (raw body, signature verified)
   -> dedupe on event id (stripe_webhook_event, unique)
   -> asSystem resolves tenant from connected account id -> withTenant
   -> update subscription; EntitlementService.rebuild(viewer) -> entitlement rows
   -> next /playback call sees the new entitlement
```

## 8. Security design

- **Isolation:** RLS plus guard. The fence test lists every tenant table. A negative k6 test requests another tenant's IDs.
- **Tokens:** viewer, staff and platform tokens use different issuers and secrets (jose, HS256 now, EdDSA later). No fallback secret exists (fixes G1).
- **Playback:** signed URLs bind tenant, asset, session and expiry (5 minutes). HLS AES-128 keys are served by `/playback/key` after the same checks.
- **Admin:** TOTP MFA for staff and operators. Impersonation sessions are hashed and audited on every request.
- **Web:** strict CSP, no wildcard image hosts, security headers from Next config and Caddy.
- **Supply chain:** Dependabot, gitleaks and CodeQL run weekly (`security-weekly.yml`).
- **Secrets:** `.env` stays gitignored. The hub `secrets/` vault holds real values.
- **Rate limits:** per tenant and per IP, token bucket in Valkey. Edge limits in Caddy.

## 9. Deployment view

```text
 Host (VM or bare metal)  ── docker compose (profiles: core, media, obs, dev)
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ caddy :80/:443      -> web :3000, admin :3001, api :4000                     │
 │ web, admin, api (x N), worker (x N)                                          │
 │ postgres 18 :5432 <- pgbouncer :6432      valkey :6379                       │
 │ minio :9000/:9001 (dev/self-host)         meilisearch :7700                  │
 │ mediamtx :8554 rtsp, :1935 rtmp, :8890 srt, :8888 hls                        │
 │ nats :4222        clickhouse :8123/:9000  otel-collector :4317  signoz :3301 │
 └─────────────────────────────────────────────────────────────────────────────┘
 Environments: local (compose), staging and production (same compose files, different .env).
 Deploys are manual workflow_dispatch only (hub rule ci-internal-deploys).
 DEPLOY_MODE=cloud | standalone (standalone = one fixed tenant plus licence key, FR-GROW-4).
```

Scale-out: add `api` and `worker` replicas behind Caddy. Move Postgres to a managed or replicated
primary when a read replica is needed (paid, needs approval).

## 10. Scalability hotspots

| Hotspot                 | Why                      | Mitigation                                                                   |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| Playback token endpoint | Burst at live start      | Stateless, Valkey-backed registry, cached entitlements, k6 gate (NFR-PERF-1) |
| Host to tenant lookup   | Every request            | Valkey cache with short TTL and explicit invalidation                        |
| Transcode               | CPU bound, long          | Horizontal workers, idempotent jobs, queue priority per plan                 |
| QoE ingest              | Very high write rate     | NATS then ClickHouse, never Postgres                                         |
| Catalog reads           | Many viewers, same data  | Edge cache with SWR, Meilisearch for search                                  |
| RLS overhead            | Policy per query         | `tenant_id` leads every index, benchmark in NFR-SCALE-2                      |
| Egress cost             | Bandwidth dominates cost | Zero-egress origin or volume CDN, cache key `tenant/asset/rendition/segment` |

## 11. Failure modes and risks

| Failure or risk                       | Effect                                  | Handling                                                                                                         |
| ------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Valkey down                           | No cache, queues stall, rate limits off | API falls back to DB for host lookup with a short in-process cache. Alert. Playback continues for open sessions. |
| Postgres down                         | API fails                               | Readiness fails and Caddy stops routing. Players keep existing segments. Restore from PITR.                      |
| Worker crash mid-transcode            | Partial output                          | Lease expiry, retry, outputs keyed by asset and attempt, cleanup job                                             |
| Webhook replay or out-of-order        | Wrong subscription state                | Event id dedupe, state derived from provider fetch on conflict                                                   |
| Wrong tenant context                  | Data leak                               | RLS FORCE, non-owner role, fence test, negative k6 test                                                          |
| Caddy cert rate limit                 | New domains stall                       | Throttle `ask`, queue verification, optional Cloudflare for SaaS                                                 |
| Hot tenant starves others             | Noisy neighbor                          | Per-tenant rate limits and queue concurrency caps                                                                |
| Ingest key leak                       | Rogue live feed                         | Rotatable keys, event window check, IP allow list option                                                         |
| R2 video terms (unverified)           | Delivery blocked                        | Default to B2 plus Bunny or MinIO until confirmed in writing                                                     |
| FairPlay certificate per legal entity | DRM add-on blocked for a tenant         | Tenant brings its own FPS package (open decision D5)                                                             |
| No open-source QoE product            | Analytics build cost                    | Own NATS to ClickHouse pipeline, budgeted in Phase 6                                                             |
| Drizzle 1.0 still in beta             | API churn                               | Pin exact versions, isolate behind repositories                                                                  |

## 12. Testing strategy

- **Unit:** Vitest 4, domain rules in `packages/domain` at 95 percent, API services at 80 percent.
- **Integration:** Testcontainers (Postgres, Valkey, MinIO). Includes the RLS fence test, webhook idempotency, worker retries.
- **E2E:** Playwright for web and studio. Mobile smoke on the web target plus device runs on demand.
- **Load:** k6 for token burst, catalog and full-play (manifest and segments).
- **Contract:** OpenAPI snapshot test; clients generated from it.
- **Local CI:** `scripts/ci.sh --fast` on commit and the full lane on push. Hosted CI is dispatch only.

## 13. Migration from the current code

| Area          | Today                                               | Target                                                                                    | Plan                                  |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| Toolchain     | Next 14, React 18, Expo 52, Zod 3, Vitest 2, ESLint | Next 16.4, React 19.3, Expo 58, Zod 4, Vitest 4, Biome                                    | [01](./plans/01-stack-upgrade.md)     |
| API           | Express 4, route files, middleware                  | NestJS 11 on Fastify, sealed modules                                                      | [02](./plans/02-nest-fastify-api.md)  |
| Data          | Prisma 5, one migration, no tenant                  | Drizzle with parity first (plan 03), then RLS and tenant_id everywhere (Phase 1, plan 04) | [03](./plans/03-drizzle-migration.md) |
| Playback      | Signing helper plus demo clip fallback              | Real pipeline output                                                                      | Phase 3                               |
| Billing       | Single-tenant Stripe module                         | Two-layer, provider interface                                                             | Phase 4                               |
| Observability | Logs only; `lib/observability.ts` is a stub         | OpenTelemetry to SigNoz                                                                   | Phase 6                               |

## 14. Legal and compliance design (moved from the old ARCHITECTURE.md, still valid)

- License windows are data (territories, start, end). A scheduled job unpublishes at window end. Geo and blackout are enforced when a playback token is issued.
- TMDB: show the required attribution, use it as enrichment only, and get a commercial agreement before a commercial tenant uses it.
- DMCA: intake form on each tenant host, workflow in the studio, repeat-infringer policy per tenant.
- Privacy: consent records, automated export and delete on a grace period, DPAs with processors, no sharing of viewing history without consent (VPPA).
- Minors: kid profiles have no tracking, no purchases, and server-side maturity filtering.
- Accessibility: WCAG 2.1 AA, captions required before publish.
- Payments: card data never touches our servers (hosted checkout). Tax comes from provider configuration.

## 15. Guiding principles (moved from the old ARCHITECTURE.md, still valid)

1. Harden before extend. Fix the gaps in the leftover list before new surface area.
2. Buy the undifferentiated, build the differentiating. Payments, DRM and TV certification are bought. Catalog, tenancy and experience are ours.
3. Entitlement checks live where manifests are issued. Never in the client.
4. Every recurring human process becomes a queue-driven, auditable workflow.
5. The monolith stays until a module's scaling profile forces extraction. First candidates are playback-token issuance and transcode workers.

## 16. Open questions and unverified facts

Tracked in [LEFTOVER_CHECKLIST.md](./LEFTOVER_CHECKLIST.md): R2 video terms, FairPlay per tenant, react-native-video v7 status,
Apple HLS rules for AV1, Drizzle 1.0 timing, Turborepo and Biome exact patch versions.
