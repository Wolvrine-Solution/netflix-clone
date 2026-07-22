# Architecture

This document describes the platform in two parts:

1. **Current architecture** — what is actually implemented in this repository today, verified against the code.
2. **Target architecture** — the production design for evolving this codebase into a general-purpose streaming service provider (VOD + live events, in the spirit of ESPN+ / Paramount+), including the video pipeline, entitlements, security, observability, and the automation required to operate it.

The step-by-step execution plan that bridges the two lives in [ROADMAP.md](./ROADMAP.md).

---

## Part 1 — Current Architecture (as implemented)

### 1.1 System overview

```
                ┌──────────────────────────┐
                │        PostgreSQL        │
                │   (Prisma schema, one    │
                │    DB for everything)    │
                └───────────▲──────────────┘
                            │ @netflix/db (Prisma client singleton)
        ┌───────────────────┼───────────────────────┐
        │                   │                       │
┌───────┴───────┐   ┌───────┴───────┐       ┌───────┴───────┐
│  apps/web     │   │  apps/api     │       │  apps/admin   │
│  Next.js 14   │   │  Express 4    │       │  Next.js 14   │
│  :3000        │   │  :4000        │       │  :3001        │
│  (App Router, │   │  (REST, JWT   │       │  (RBAC via    │
│   NextAuth v5)│──▶│   via jose)   │◀──────│   Role enum)  │
└───────▲───────┘   └───────▲───────┘       └───────────────┘
        │                   │
        │            ┌──────┴────────┐            ┌─────────────┐
     Browser         │  apps/mobile  │            │    TMDB     │
                     │  Expo / RN    │            │  (metadata  │
                     │  :8081 dev    │            │   source)   │
                     └───────────────┘            └──────▲──────┘
                                                         │
                                        seed (packages/db/src/seed.ts)
                                        + live search (apps/api, 1h cache)
```

Four runnable apps and four shared packages in a Turborepo/pnpm monorepo:

| Workspace         | Role                               | Key facts                                                                                                                                   |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`        | User-facing Next.js 14 app         | App Router; browse page is a React Server Component; NextAuth v5 (JWT strategy) issues tokens; TanStack Query + Zustand on the client       |
| `apps/api`        | Express REST API                   | Verifies JWTs with `jose` + `NEXTAUTH_SECRET`; Helmet, CORS, morgan; Zod validation; per-route rate limiting on search                      |
| `apps/admin`      | Next.js 14 admin dashboard         | Content/users/genres/rows CRUD, analytics (Recharts); guarded by `Role.ADMIN` + `adminOnly` middleware; admin actions audited in `AdminLog` |
| `apps/mobile`     | Expo Router / React Native app     | NativeWind, Zustand, TanStack Query; signs in against `POST /api/auth/signin` (API-issued JWT stored in SecureStore)                        |
| `packages/db`     | Prisma schema + client + TMDB seed | Single schema for auth, profiles, catalog, subscriptions, reviews, notifications, audit log                                                 |
| `packages/types`  | Shared TypeScript types            | content, auth, player, admin, notifications, TMDB                                                                                           |
| `packages/ui`     | Shared React hooks/components      | Button/Modal/etc. + `useDebounce`, `useLocalStorage`, `useOnClickOutside`                                                                   |
| `packages/config` | Shared configs                     | ESLint, Tailwind, TS base configs                                                                                                           |

### 1.2 Authentication & authorization

- **Web**: NextAuth v5 with the Prisma adapter; Credentials (bcrypt), Google, and GitHub providers. JWT session strategy; the session callback re-encodes the token and exposes it as `session.accessToken`, which the web API client sends as `Authorization: Bearer …`.
- **Mobile**: calls `POST /api/auth/signin` on the Express API, which verifies credentials against the same `User` table and issues an HS256 JWT (30-day expiry) signed with `NEXTAUTH_SECRET`.
- **API**: `authenticate` middleware verifies the bearer token with `jose.jwtVerify` and puts `userId` on the request. `adminOnly` re-reads the user and requires `role = ADMIN` and not suspended.
- **Admin app**: own NextAuth route + middleware; access guard logic unit-tested in `apps/admin/src/lib/accessGuard.ts`.

### 1.3 Data model (Prisma)

- **Identity**: `User` (role, suspension), `Account`/`Session`/`VerificationToken` (NextAuth), `Profile` (per-user, `isKid`, language).
- **Catalog**: `Content` (movie/tv, TMDB-sourced, `status` DRAFT/PUBLISHED/ARCHIVED, `maturityRating`, cast, studio…), `Season`/`Episode`, `Genre`/`ContentGenre`, `Category`/`ContentCategory`, browse `Row`/`ContentRow` (ordered, curated), `VideoFile` (per-quality URLs — schema exists, largely unused at runtime).
- **Engagement**: `MyListItem`, `WatchHistory` (progress per profile), `Review`, `Notification`.
- **Commerce**: `Subscription` (BASIC/STANDARD/PREMIUM, Stripe columns) — **schema only**, no billing code paths.
- **Operations**: `AdminLog` audit trail.

### 1.4 Content & playback

- Catalog metadata is seeded from TMDB into PostgreSQL (`pnpm db:seed`); browse reads from the DB. Search combines DB queries with live TMDB search, cached ~1 hour in-process (`node-cache`).
- The players (web and mobile) are custom-built: a `<video>` element with hls.js loaded dynamically when the source is an `.m3u8` URL, otherwise progressive MP4. Both fall back to a public-domain demo MP4 (`DEMO_SRC` in `VideoPlayer.tsx`) when content has no `videoUrl`. (`video.js` and `react-player` are declared dependencies but are not used by the player.)
- Watch progress is saved per profile via `PUT /api/profiles/:id/history`.

### 1.5 Testing

- **Unit/integration**: Vitest in web, admin, api; Jest (`jest-expo`) in mobile.
- **E2E**: Playwright suites for web (10 feature specs: landing → subscription) and mobile (web-target smoke specs).

### 1.6 Known gaps & honest limitations (verified in code)

These are the deltas between "demo" and "production" that Part 2 and the roadmap address:

| #   | Gap                                                                                                                                                                                                     | Where                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| G1  | JWT secret falls back to the literal `'fallback-secret'` when `NEXTAUTH_SECRET` is unset                                                                                                                | `apps/api/src/middleware/authenticate.ts`, `apps/api/src/routes/auth.ts` |
| G2  | Global rate limiter (`apiLimiter`) is defined but never mounted; only `/search` is rate-limited                                                                                                         | `apps/api/src/middleware/rateLimiter.ts`                                 |
| G3  | No Prisma **migrations** — schema is applied with `db push`, so there is no migration history for production rollouts                                                                                   | `packages/db`                                                            |
| G4  | Billing is a demo: Stripe SDK is installed but never imported; the subscription page fakes plan changes client-side; plan entitlements (screens, 4K) are not enforced anywhere                          | `apps/web/src/app/(main)/subscription/page.tsx`, `apps/api`              |
| G5  | Kid profiles store `isKid` but the API never filters content by `maturityRating`                                                                                                                        | `apps/api/src/routes/*`                                                  |
| G6  | Playback uses a hardcoded demo MP4; no transcoding, packaging, DRM, signed URLs, or CDN                                                                                                                 | `VideoPlayer.tsx` (web + mobile)                                         |
| G7  | No CI/CD, no Dockerfile, no IaC — nothing runs on push                                                                                                                                                  | repo root (no `.github/`)                                                |
| G8  | CORS origins are hardcoded to localhost ports                                                                                                                                                           | `apps/api/src/index.ts`                                                  |
| G9  | Caches are in-process (`node-cache`), so they don't survive restarts and won't be shared across API replicas                                                                                            | `apps/api/src/services/tmdbService.ts`                                   |
| G10 | Observability is `morgan('dev')` + a `/health` endpoint — no structured logs, metrics, traces, or error tracking                                                                                        | `apps/api/src/index.ts`                                                  |
| G11 | Web→API token compatibility should be verified under test: NextAuth v5 `encode` produces an encrypted token while the API verifies with `jwtVerify` (signed); mobile's API-issued tokens verify cleanly | `apps/web/src/lib/auth.ts` vs `apps/api/src/middleware/authenticate.ts`  |
| G12 | No concurrent-stream/device limits, no session revocation for the 30-day mobile JWTs                                                                                                                    | `apps/api`                                                               |

---

## Part 2 — Target Architecture: a general-purpose streaming provider

**Product goal:** operate this platform as a streaming service provider for any kind of streaming need — subscription VOD, live events and channels (sports, news), and premium catalogs — comparable in shape to ESPN+ or Paramount+. Everything below assumes **licensed content and legally compliant operation**: you stream what you own or have licensed, TMDB is used within its API terms (metadata + attribution, non-commercial key upgraded appropriately), and all automation is of lawful processes (encoding, publishing, billing, moderation workflows) — no scraping or rebroadcasting of third-party streams.

### 2.1 Target system diagram

```
                                   ┌────────────────────────────┐
                                   │        CDN (multi-CDN)     │
                                   │  CloudFront / Fastly /     │
                                   │  Cloudflare — signed URLs  │
                                   └──────▲──────────▲──────────┘
                                          │          │
                              VOD segments│          │Live segments (LL-HLS)
                                          │          │
┌──────────────┐   upload   ┌─────────────┴──┐   ┌───┴─────────────────┐
│ Content ops  │──────────▶│  Origin storage │   │  Live pipeline      │
│ (admin app)  │  S3/GCS    │  (S3 + packager│   │  SRT/RTMP ingest →  │
└──────┬───────┘  multipart │   CMAF output) │   │  transcode → package│
       │                    └─────────▲──────┘   │  (MediaLive/ffmpeg) │
       │ publish/schedule            │           └───────▲─────────────┘
       ▼                              │                   │
┌────────────────┐  jobs   ┌─────────┴──────────┐  DRM keys
│  Catalog/API   │────────▶│ Transcoding workers │◀──────────┐
│  services      │  queue  │ (ffmpeg ABR ladder, │   ┌───────┴────────┐
│  (Express/     │ (SQS/   │  MediaConvert, or   │   │ DRM / license  │
│   NestJS pods) │  BullMQ)│  Mux/Cloudflare as  │   │ server         │
└──▲──────▲──────┘         │  managed alt.)      │   │ (Widevine/     │
   │      │                └────────────────────┘    │  FairPlay/     │
   │      │                                          │  PlayReady)    │
   │      └───────────────┐                          └────────────────┘
   │                      │
┌──┴───────┐   ┌──────────┴─┐   ┌──────────────┐   ┌──────────────────┐
│ Postgres │   │   Redis    │   │ OpenSearch/  │   │ Stripe (billing) │
│ (primary │   │ (cache,    │   │ Meilisearch  │   │ + webhooks →     │
│ + read   │   │  sessions, │   │ (catalog     │   │ entitlement      │
│ replicas)│   │  rate-lim, │   │  search)     │   │ service          │
└──────────┘   │  queues)   │   └──────────────┘   └──────────────────┘
               └────────────┘
Clients: web (Next.js) · mobile (Expo/RN) · TV apps (future) — all through the API gateway
```

### 2.2 Video pipeline (VOD)

The single most important change: **content stops being a URL column and becomes a managed asset lifecycle.**

1. **Ingest** — Admin uploads a mezzanine file via multipart/resumable upload directly to object storage (S3 presigned URLs; the API never proxies video bytes). An `Asset` row tracks state: `UPLOADED → QUEUED → TRANSCODING → PACKAGED → READY / FAILED`.
2. **Transcode** — A worker pool (ffmpeg on ECS/Kubernetes jobs, or AWS MediaConvert / Mux / Cloudflare Stream as managed alternatives) produces an ABR ladder, e.g. 240p/480p/720p/1080p/4K in H.264 + HEVC for premium tiers, plus audio renditions and thumbnail/trick-play sprites.
3. **Package** — CMAF segments packaged for **HLS and DASH** (Shaka Packager / MediaPackage), with per-title encryption.
4. **Protect** — Multi-DRM: Widevine (Chrome/Android), FairPlay (Safari/iOS), PlayReady (Edge/TVs) via a license service (e.g. EZDRM/Axinom/BuyDRM or self-hosted for Widevine-only start). Plan-gated: 4K requires hardware-backed DRM levels.
5. **Deliver** — Manifests and segments served exclusively via CDN with **short-lived signed URLs/cookies** issued by the playback API after an entitlement check. Origin buckets are private.
6. **Play** — The existing hls.js player evolves to request `/playback/:contentId` → receives `{ manifestUrl, drm: { licenseUrl, certificate }, startPosition }`. The `VideoFile` table already anticipates per-quality renditions; it becomes the persisted output of the packaging step.

**Captions & accessibility are part of the pipeline, not an afterthought**: WebVTT/TTML sidecars per language, required before an asset can be published (legal requirement in several jurisdictions — CVAA in the US for content previously aired on TV).

### 2.3 Live streaming (ESPN+-style events & channels)

- **Ingest**: SRT (preferred) or RTMP contribution feeds into redundant ingest endpoints (AWS MediaLive, or self-managed SRT gateway + ffmpeg).
- **Transcode/package**: live ABR ladder to **LL-HLS** (and DASH) with 2s parts for low latency; DVR window (e.g. 4h) via the packager.
- **Event model**: new domain objects — `LiveChannel` (24/7 linear), `LiveEvent` (scheduled start/end, pre/post slates, geo/blackout rules for sports rights), `EventEntitlement` (which plans/PPV purchases can watch).
- **Catch-up/VOD conversion**: on event end, the recording is automatically pushed through the VOD pipeline (this is exactly the kind of _legal process automation_ the platform should excel at).
- **Scale pattern**: live traffic is bursty; the CDN absorbs viewers, the platform only scales the **playback-token issuing** path (stateless, Redis-backed), never the video path.

### 2.4 Entitlements, billing, and plan enforcement

Billing graduates from demo UI to a real subsystem:

- **Stripe Billing** as the source of truth for money; the local `Subscription` table is a projection updated **only** by verified Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`). Idempotent webhook handling with event-ID dedupe.
- **Entitlement service** (initially a module inside the API): answers `can(userId, action, resource)` — e.g. `play(contentId)`, `play4k`, `startStream(deviceId)`. Called by the playback-token endpoint, so entitlement enforcement happens **server-side at manifest issuance**, not in the client.
- **Plan enforcement** (currently marketing copy only, G4):
  - concurrent streams: Redis-based active-session registry with heartbeats; starting stream N+1 kills the oldest or is refused.
  - quality caps: the playback API selects which renditions the signed manifest exposes (or uses DRM output-protection levels for 4K).
  - downloads: license persistence policy per plan.
- **PPV / TVOD** for one-off live events (fights, concerts) — a natural extension of the same entitlement checks.
- Tax (Stripe Tax), dunning (Smart Retries), and regional pricing come from Stripe configuration, not custom code.

### 2.5 Identity & profiles

- Keep NextAuth v5 on web; unify token issuance so **all clients hold the same short-lived signed access token** (15 min) plus refresh tokens with server-side revocation (fixes G11/G12). The API becomes the single verifier.
- Secrets from a secret manager (AWS Secrets Manager/Vault); **fail fast at boot when required env is missing** — no `'fallback-secret'` defaults (G1).
- Profiles gain `maturityLevel` beyond boolean `isKid`; the API filters every catalog/search/rows response by the active profile's level (fixes G5) and requires a profile-scoped claim in the token so the server, not the client, knows the active profile.
- Optional profile PINs; parental controls managed per account.

### 2.6 API & service architecture

- **Stay a modular monolith** (Express API) until scale demands otherwise — but enforce module boundaries now: `catalog`, `playback`, `identity`, `entitlements`, `engagement` (list/history/reviews), `live`, `admin`. Each with its own routes/services/tests; extraction to services later becomes mechanical.
- **Versioned API** (`/api/v1`) with OpenAPI spec generated from Zod schemas (`zod-openapi`) — the spec is the contract for web, mobile, and future TV clients.
- **Global middleware**: mount `apiLimiter` (G2) with Redis store; body-size limits; request IDs; structured logging (pino) with PII redaction.
- **Config-driven CORS** (env allowlist, G8).
- **Caching**: Redis replaces `node-cache` (G9) — TMDB responses, rows, featured content; cache stampede protection; CDN caching for anonymous catalog endpoints with `stale-while-revalidate`.
- **Search**: move from `ILIKE` + TMDB proxy to OpenSearch/Meilisearch indexed from the catalog via outbox events; TMDB remains a metadata _enrichment_ source, used within its terms.

### 2.7 Data architecture

- **Prisma Migrate** with committed migration history (G3); expand-and-contract pattern for zero-downtime schema changes; migrations run as a deploy step, never at app boot.
- Postgres: managed (RDS/Neon/Supabase), PITR backups, read replicas for catalog reads; `WatchHistory` writes batched/debounced (already debounced client-side) and eventually moved to a wide-row store if volume demands.
- **Analytics events** (play start/stop, bitrate switches, errors) go to an event pipeline (Segment/Kinesis/ClickHouse) — not Postgres — powering the admin analytics honestly and enabling QoE monitoring.
- Data retention & deletion workflows per GDPR/CCPA (account deletion cascades already exist in the schema; add scheduled hard-delete + export automation).

### 2.8 Security posture

- All the identity items above (secrets, fail-fast, short-lived tokens, revocation).
- Signed playback URLs + private origins + DRM = content security in depth.
- Next.js apps: strict CSP, no wildcard image domains, security headers via middleware.
- Admin: enforce MFA (TOTP/WebAuthn), IP allowlisting optional, and keep expanding the existing `AdminLog` audit trail (good foundation already).
- Dependency and secret scanning in CI (Dependabot/Renovate + gitleaks); SAST (CodeQL).
- Rate limiting everywhere (Redis-backed), bot mitigation at the edge for credential stuffing (this protects the _service_; it is unrelated to the platform's own lawful automation).
- Regular restore drills for backups; documented incident response runbook.

### 2.9 Observability & operations

- **Logs**: pino structured JSON → centralized (CloudWatch/Loki/Datadog).
- **Metrics**: RED metrics per route (Prometheus/OpenTelemetry), plus streaming QoE metrics: time-to-first-frame, rebuffer ratio, error rate by CDN/ISP.
- **Traces**: OpenTelemetry across web → API → DB.
- **Errors**: Sentry on all four apps.
- **Health**: `/health` (liveness) + `/ready` (DB/Redis checks); synthetic playback probes hitting a canary asset 24/7.
- **SLOs**: e.g. 99.9% playback-token availability, <1% rebuffer ratio, <2s TTFF p75 — alerting wired to these, not raw CPU.

### 2.10 Deployment & automation (CI/CD)

Everything the team does repeatedly gets automated as code — the platform's operating philosophy:

- **CI (GitHub Actions)**: on every PR — install (pnpm cache), `turbo run lint typecheck build test` (affected-only), Playwright e2e against docker-compose (Postgres + API + web), Prisma migration validation, CodeQL + gitleaks. Merge is blocked on green.
- **CD**: build once, promote through `dev → staging → prod`; web/admin on Vercel (or containers), API + workers as containers (ECS/Fly/Kubernetes) with health-gated rolling deploys and one-click rollback; migrations applied via a gated job.
- **IaC**: Terraform for buckets, CDN, DB, Redis, queues, DNS — reviewed in PRs like any code.
- **Ops automation**: content publishing workflows (upload → transcode → QC → publish) as queue-driven state machines; scheduled jobs (cron) for TMDB metadata refresh, cache warming, subscription reconciliation against Stripe, and live-event lifecycle (start ingest, end, archive to VOD).
- **Docker**: dev `docker-compose.yml` (Postgres, Redis, MinIO, mailhog) so `pnpm dev` needs zero manual infra.

### 2.11 Legal & compliance checklist (operating a real streaming service)

Streaming is a rights business; the architecture assumes and enforces this:

- **Content licensing**: only ingest content you own or license; the CMS records license windows (start/end dates, territories) and the API enforces them (auto-unpublish at window end — another automated legal process). Geo-restriction/blackouts at the CDN + playback-token layer for sports rights.
- **TMDB terms**: metadata attribution ("This product uses the TMDB API…"), commercial licensing if the service is commercial, and no serving TMDB images as if they were owned assets at scale — cache/proxy per their terms.
- **DMCA**: registered agent, takedown workflow in the admin app, repeat-infringer policy (relevant once any user-generated content, e.g. reviews with images, exists).
- **Privacy**: GDPR/CCPA — consent management, DSAR export/delete automation, DPA with processors (Stripe, CDN, analytics); privacy policy + ToS surfaced at signup.
- **Minors**: COPPA-conscious kid profiles (no behavioral ads or tracking on kid profiles), maturity gating server-side.
- **Accessibility**: WCAG 2.1 AA for the apps; captions/audio description pipeline (CVAA).
- **Payments**: PCI scope minimized via Stripe Elements/Checkout (card data never touches our servers); regional VAT/GST via Stripe Tax.
- **VPPA (US)**: don't share viewing history with third parties without consent — constrains the analytics pipeline design.

### 2.12 Sequencing & guiding principles

1. **Harden before extend** — fix G1–G3, G7, G8 before building new surface area.
2. **Buy the undifferentiated, build the differentiating** — Stripe for billing, managed transcode/DRM first (Mux/MediaConvert), swap for self-hosted ffmpeg workers when unit economics justify it. The catalog, entitlements, and experience are the product; codecs are not.
3. **Entitlement checks live where manifests are issued** — never in the client.
4. **Every recurring human process becomes a queue-driven, auditable workflow** — publishing, license windows, event archiving, reconciliation.
5. **The monolith stays until a module's scaling profile forces extraction** — the first candidates are playback-token issuance and the transcode workers (already asynchronous by nature).

The phased, checkbox-level plan for all of the above: **[ROADMAP.md](./ROADMAP.md)**.
