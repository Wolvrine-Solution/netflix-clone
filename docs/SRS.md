# Software Requirements Specification (SRS)

## StreamKit (repo: netflix-clone)

| Field     | Value                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status    | Draft v1 for owner review                                                                                                                                          |
| Date      | 2026-10-28                                                                                                                                                         |
| One-liner | White-label, multi-tenant streaming SaaS (VOD and live). A media company signs up, brands the product, points its own domain at it and streams to its own viewers. |
| Design    | [TDD.md](./TDD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [adr/](./adr/)                                                                                           |
| Plan      | [PLAN.md](./PLAN.md)                                                                                                                                               |

Status legend used in every FR table:

- **Code, unproven**: code exists in this repo from the single-tenant demo. No passing test proves it yet. The baseline in [LEFTOVER_CHECKLIST.md](./LEFTOVER_CHECKLIST.md) shows typecheck and tests failing.
- **Stub**: a model or file exists but it does not do the real work (for example `modules/assets/transcode.ts` only moves a status field).
- **Planned**: nothing exists. The phase in [PLAN.md](./PLAN.md) delivers it.

Nothing is marked "Done" here. An FR becomes done only when its proving test is named in [LEFTOVER_CHECKLIST.md](./LEFTOVER_CHECKLIST.md) and passes.

## 1. Introduction

### 1.1 Purpose

StreamKit lets a media company (a **tenant**) run its own Netflix-style streaming service without
building one. The tenant gets a branded web app and mobile app, a studio to upload and publish
video, billing against its viewers, and live events. The platform operator (us) runs one
deployment for all tenants and sells plans to them.

### 1.2 Scope

**In scope**

- Multi-tenant isolation, tenant lifecycle, custom domains, per-tenant branding.
- VOD pipeline: upload, transcode, package, protect, deliver, play on web and mobile.
- Live streaming: ingest, low-latency delivery, DVR, archive to VOD.
- Two billing layers: tenant pays platform, viewer pays tenant.
- Entitlements, concurrent-stream limits, quality caps.
- Search, recommendations, playback-quality analytics, observability.
- Compliance: consent, data-subject requests, DMCA, kid profiles, accessibility.
- Self-hosted deployment on docker-compose with $0 default services.

**Out of scope (this document)**

- Content licensing deals and rights management beyond license windows.
- A marketplace that mixes tenants' catalogs.
- Per-tenant native store builds (Phase 8 option, see [PLAN.md](./PLAN.md)).
- Paid managed services as defaults (each needs a per-SKU owner approval).

### 1.3 Definitions

| Term              | Meaning                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Tenant            | A media company using the platform. Owns a brand, one or more domains, a catalog, viewers and a plan. |
| Platform operator | Our staff. Runs the deployment, support, plans and flags.                                             |
| Viewer            | An end user of a tenant's service. Scoped to one tenant.                                              |
| Profile           | A viewer's sub-identity (for example a kid profile).                                                  |
| Studio            | The tenant-facing console for brand, domains, team and catalog.                                       |
| Entitlement       | A server-side permission derived from plan, trial, flag or purchase.                                  |
| Asset             | An uploaded source video moving through the pipeline.                                                 |
| ABR ladder        | The set of renditions (resolutions and bitrates) produced per title.                                  |
| CMAF              | Common Media Application Format. One set of fMP4 segments serves HLS and DASH.                        |
| RLS               | PostgreSQL row-level security.                                                                        |
| QoE               | Quality of experience: time to first frame, rebuffering, errors.                                      |
| DRM               | Digital rights management: Widevine, FairPlay, PlayReady.                                             |

## 2. Personas and goals

| Persona                        | Goals                                                                                    | Non-goals                   |
| ------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------- |
| Platform operator              | Onboard tenants quickly, suspend abusers, see usage and health, change plans and flags.  | Editing a tenant's catalog. |
| Tenant owner                   | Brand the service, connect a domain, invite team, pick a plan, see revenue and audience. | Operating servers.          |
| Tenant editor                  | Upload video, add metadata and captions, schedule and publish, run live events.          | Billing and domains.        |
| Tenant support                 | Look up a viewer, reset access, handle takedowns.                                        | Publishing.                 |
| Viewer                         | Sign up, pick a profile, find something, play it anywhere without buffering, resume.     | Seeing other tenants.       |
| Kid viewer (via a kid profile) | Safe, age-appropriate catalog.                                                           | Any tracking or purchases.  |
| Integrator                     | Call a tenant API with an API key to sync catalog or entitlements.                       | UI access.                  |

## 3. Functional requirements

Stable IDs. Never renumber. Retire an ID by marking it `Withdrawn`, not by reusing it.
Each FR names its proving test target in [PLAN.md](./PLAN.md) when its phase starts.

### 3.1 Core (FR-CORE): viewer product that exists today

| ID         | Requirement                                                                                                                                 | Status         | Evidence in repo                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------- |
| FR-CORE-1  | A viewer can register and sign in with email and password, and optionally with Google or GitHub.                                            | Code, unproven | `apps/web/src/app/(auth)`, `apps/api/src/routes/auth.ts` |
| FR-CORE-2  | A viewer account has up to several profiles, each with a name and avatar. A profile can be a kid profile and can have a PIN.                | Code, unproven | `routes/profiles.ts`, model `Profile`                    |
| FR-CORE-3  | The catalog is organized into genres, categories and curated browse rows. Series have seasons and episodes.                                 | Code, unproven | `routes/content.ts`, `routes/rows.ts`                    |
| FR-CORE-4  | The browse page is rendered on the server and needs no client data fetching for rows.                                                       | Code, unproven | `apps/web` browse RSC                                    |
| FR-CORE-5  | A viewer can search the catalog. Results come from the tenant catalog first, then enrichment.                                               | Code, unproven | `routes/search.ts` (DB plus live TMDB)                   |
| FR-CORE-6  | A profile has a My List. Add and remove update the UI instantly and roll back on error.                                                     | Code, unproven | `routes/myList.ts`, `useMyList`                          |
| FR-CORE-7  | Watch progress is saved per profile and playback resumes from it.                                                                           | Code, unproven | `routes/watchHistory.ts`                                 |
| FR-CORE-8  | A viewer can review a title and receive in-app notifications.                                                                               | Code, unproven | `routes/reviews.ts`, `routes/notifications.ts`           |
| FR-CORE-9  | The server filters every catalog, row and search response by the active profile's maturity level. Clients cannot bypass it.                 | Code, unproven | `middleware/kidFilter.ts`, `lib/maturity.ts`             |
| FR-CORE-10 | Sessions use short-lived access tokens and refresh tokens that the server can revoke.                                                       | Code, unproven | `routes/auth.ts`, model `RefreshToken`                   |
| FR-CORE-11 | Staff can manage content, users, genres and rows, see analytics, and every admin action is audited. Admin sign-in supports TOTP MFA.        | Code, unproven | `routes/admin/*`, model `AdminLog`                       |
| FR-CORE-12 | A mobile app provides sign-in, browse, search, My List and playback.                                                                        | Code, unproven | `apps/mobile`                                            |
| FR-CORE-13 | The API exposes liveness and readiness endpoints, request IDs and structured logs, and refuses to boot with missing required configuration. | Code, unproven | `index.ts`, `lib/env.ts`                                 |
| FR-CORE-14 | Catalog metadata can be imported from TMDB by staff, with the required attribution shown.                                                   | Code, unproven | `routes/admin/content.ts`, `services/tmdbService.ts`     |

### 3.2 Tenancy (FR-TEN)

| ID        | Requirement                                                                                                                                                 | Status            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| FR-TEN-1  | A tenant is a first-class entity with a lifecycle: pending, active, suspended, pending_deletion, deleted.                                                   | Planned (Phase 1) |
| FR-TEN-2  | Every tenant-owned row carries a tenant ID and PostgreSQL RLS prevents reading or writing another tenant's rows, even if application code forgets a filter. | Planned (Phase 1) |
| FR-TEN-3  | The tenant is resolved from the request Host header. The same deployment serves many hosts.                                                                 | Planned (Phase 1) |
| FR-TEN-4  | A tenant can add a custom domain, prove ownership by DNS record, and receive a TLS certificate automatically.                                               | Planned (Phase 1) |
| FR-TEN-5  | Tenant staff have roles: owner, admin, editor, support. Roles gate studio actions. One person can staff several tenants.                                    | Planned (Phase 1) |
| FR-TEN-6  | Platform operators have a separate sign-in, separate tables and MFA. Operators can list, suspend, restore and delete tenants and set per-tenant flags.      | Planned (Phase 1) |
| FR-TEN-7  | A suspended tenant's studio is read-only (HTTP 423) and its viewers can keep playing already-licensed content. A deleted tenant returns HTTP 410.           | Planned (Phase 1) |
| FR-TEN-8  | Operator impersonation ("support session") is time-boxed, token-hashed and audited on every request.                                                        | Planned (Phase 1) |
| FR-TEN-9  | A tenant can create API keys with scopes for programmatic access.                                                                                           | Planned (Phase 2) |
| FR-TEN-10 | Tenant data can be exported in full and deleted on request, on a grace period.                                                                              | Planned (Phase 7) |

### 3.3 White-label (FR-WL)

| ID      | Requirement                                                                                                        | Status                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| FR-WL-1 | A tenant defines brand tokens: colors, radius, fonts, app name. Web renders them as CSS variables with no rebuild. | Planned (Phase 2)                              |
| FR-WL-2 | A tenant uploads logo, favicon, social image and hero artwork.                                                     | Planned (Phase 2)                              |
| FR-WL-3 | Legal links, support contact, sender name for email and default language are tenant settings.                      | Planned (Phase 2)                              |
| FR-WL-4 | The studio lets owners edit brand, domains and team, and editors manage the catalog.                               | Planned (Phase 2)                              |
| FR-WL-5 | The mobile app loads the tenant brand at start from the tenant host, with one binary for all tenants.              | Planned (Phase 2)                              |
| FR-WL-6 | A tenant orders and titles its browse rows and picks featured content.                                             | Code, unproven (rows exist, not tenant-scoped) |
| FR-WL-7 | The studio warns when chosen brand colors fail WCAG AA contrast.                                                   | Planned (Phase 2)                              |
| FR-WL-8 | No platform branding appears on a tenant's viewer surfaces unless the plan requires attribution.                   | Planned (Phase 2)                              |

### 3.4 VOD (FR-VOD)

| ID        | Requirement                                                                                                                 | Status                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| FR-VOD-1  | Editors upload a source file straight to object storage with resumable multipart upload. The API never proxies video bytes. | Planned (Phase 3)                                   |
| FR-VOD-2  | An asset moves through UPLOADED, QUEUED, TRANSCODING, PACKAGED, READY or FAILED. Retries are idempotent.                    | Stub (`modules/assets/transcode.ts`, model `Asset`) |
| FR-VOD-3  | Workers transcode each asset into an ABR ladder (H.264 default, HEVC and AV1 by entitlement) plus audio renditions.         | Planned (Phase 3)                                   |
| FR-VOD-4  | Output is CMAF, with one HLS and one DASH manifest per title.                                                               | Planned (Phase 3)                                   |
| FR-VOD-5  | A title cannot publish without captions in at least one language. Captions are WebVTT.                                      | Stub (model `Caption`)                              |
| FR-VOD-6  | Trick-play thumbnails are generated for scrubbing.                                                                          | Stub (model `TrickPlaySprite`)                      |
| FR-VOD-7  | Playback starts with a server call that checks entitlement and returns a signed manifest URL and a start position.          | Code, unproven (`modules/playback/service.ts`)      |
| FR-VOD-8  | Segments are protected by short-lived signed URLs or cookies, AES-128 and, per tenant tier, ClearKey or multi-DRM.          | Code, unproven (signing only)                       |
| FR-VOD-9  | The web player supports adaptive playback, captions, audio tracks, quality choice, keyboard control and resume.             | Code, unproven (`hls.js` basic player)              |
| FR-VOD-10 | The mobile player supports the same, including background audio and picture-in-picture where the OS allows.                 | Code, unproven                                      |
| FR-VOD-11 | Players emit QoE events (time to first frame, rebuffer, bitrate switch, error) tagged with tenant, session and CDN.         | Stub (model `QoEEvent`)                             |
| FR-VOD-12 | Source masters are retained, renditions can be re-generated, and failed jobs can be retried from the studio.                | Planned (Phase 3)                                   |

### 3.5 Billing and entitlements (FR-BIL)

| ID        | Requirement                                                                                                          | Status                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| FR-BIL-1  | Tenants subscribe to platform plans (limits on storage, transcode minutes, streams, seats, features).                | Planned (Phase 4)                                           |
| FR-BIL-2  | A tenant connects its own payment account so viewer money goes to the tenant.                                        | Planned (Phase 4)                                           |
| FR-BIL-3  | Viewers subscribe to tenant plans. The local subscription is updated only by verified, idempotent provider webhooks. | Code, unproven (`modules/billing/stripe.ts`, single tenant) |
| FR-BIL-4  | An entitlement service answers `can(subject, action, resource)` from plan, trial, flag and purchase sources.         | Code, unproven (`modules/entitlements/service.ts`)          |
| FR-BIL-5  | Concurrent streams per account are capped by plan using a session registry with heartbeats.                          | Code, unproven (`modules/sessions/service.ts`)              |
| FR-BIL-6  | The manifest a viewer receives exposes only renditions the plan allows.                                              | Planned (Phase 4)                                           |
| FR-BIL-7  | Pay-per-view and rental purchases unlock a title or live event for one viewer.                                       | Code, unproven (models `Purchase`, `EventEntitlement`)      |
| FR-BIL-8  | Failed payments follow a dunning flow. Tax and regional pricing come from the payment provider configuration.        | Planned (Phase 4)                                           |
| FR-BIL-9  | A billing provider interface hides the vendor. A sandbox provider exists for dev and is refused in production.       | Planned (Phase 4)                                           |
| FR-BIL-10 | Viewers see billing history and can cancel or change plan.                                                           | Code, unproven                                              |

### 3.6 Live (FR-LIVE)

| ID        | Requirement                                                                        | Status                                                                        |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| FR-LIVE-1 | A tenant defines channels and scheduled events.                                    | Code, unproven (`modules/live/service.ts`, models `LiveChannel`, `LiveEvent`) |
| FR-LIVE-2 | Each channel has an ingest key for SRT or RTMP contribution. Keys are rotatable.   | Planned (Phase 5)                                                             |
| FR-LIVE-3 | Live output is low-latency HLS with an adaptive ladder.                            | Planned (Phase 5)                                                             |
| FR-LIVE-4 | A DVR window lets viewers rewind. A "go to live" control returns them.             | Planned (Phase 5)                                                             |
| FR-LIVE-5 | When an event ends the recording is archived and pushed through the VOD pipeline.  | Stub (`/events/:id/archive`)                                                  |
| FR-LIVE-6 | Geo restriction and blackout regions are enforced when a playback token is issued. | Code, unproven                                                                |
| FR-LIVE-7 | Pre-event and post-event slates show when no feed is active.                       | Stub (fields on `LiveEvent`)                                                  |
| FR-LIVE-8 | Event access can require an entitlement or a purchase.                             | Code, unproven                                                                |

### 3.7 Operations and scale (FR-OPS)

| ID       | Requirement                                                                                       | Status                                        |
| -------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| FR-OPS-1 | API, workers and apps emit OpenTelemetry traces and RED metrics, tagged with tenant.              | Stub (`lib/observability.ts` only logs)       |
| FR-OPS-2 | Operators see dashboards and alerts in a self-hosted stack.                                       | Planned (Phase 6)                             |
| FR-OPS-3 | QoE events flow to an analytics store and tenants see audience and quality reports.               | Planned (Phase 6)                             |
| FR-OPS-4 | Catalog search uses a dedicated index per tenant, fed by an outbox.                               | Stub (`modules/search/indexer.ts`, no engine) |
| FR-OPS-5 | "More like this" and "because you watched" rows use embeddings and watch history.                 | Stub (`modules/recommendations/service.ts`)   |
| FR-OPS-6 | Anonymous catalog responses are cacheable at the edge with stale-while-revalidate.                | Planned (Phase 6)                             |
| FR-OPS-7 | Usage per tenant (storage, transcode minutes, egress, streams) is metered for plan limits.        | Planned (Phase 6)                             |
| FR-OPS-8 | Connections are pooled. Backups support point-in-time recovery and a restore drill is documented. | Planned (Phase 6)                             |
| FR-OPS-9 | Load tests for the playback-token path and a full-play flow run on demand and gate releases.      | Planned (Phase 3 and 5)                       |

### 3.8 Legal and compliance (FR-LEGAL)

| ID         | Requirement                                                                                               | Status                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| FR-LEGAL-1 | License windows (territories, start, end) auto-unpublish content at the end of the window.                | Code, unproven (`modules/compliance/service.ts`)              |
| FR-LEGAL-2 | Consent is recorded. Viewers can request export or deletion of their data and it completes automatically. | Code, unproven (models `ConsentRecord`, `DataSubjectRequest`) |
| FR-LEGAL-3 | A takedown (DMCA) intake exists on each tenant host and a workflow in the studio.                         | Code, unproven (model `DmcaTakedown`)                         |
| FR-LEGAL-4 | Kid profiles have no tracking, no purchases and PIN-protected exit.                                       | Code, unproven                                                |
| FR-LEGAL-5 | Web and mobile meet WCAG 2.1 AA. Captions are required.                                                   | Planned (Phase 7)                                             |
| FR-LEGAL-6 | Viewing history is never shared with third parties without consent.                                       | Planned (Phase 7)                                             |
| FR-LEGAL-7 | A DRM add-on seam lets a tenant enable Widevine, FairPlay or PlayReady through a vendor.                  | Planned (Phase 7)                                             |
| FR-LEGAL-8 | Incident response and breach-notification runbooks exist.                                                 | Code, unproven (`runbooks/incident-response.md`)              |

### 3.9 Growth (FR-GROW)

| ID        | Requirement                                                                                  | Status                         |
| --------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| FR-GROW-1 | Smart-TV and set-top apps (Android TV, tvOS, Tizen, webOS).                                  | Planned (Phase 8)              |
| FR-GROW-2 | Offline downloads on mobile with a persistent license per plan.                              | Stub (model `DownloadLicense`) |
| FR-GROW-3 | Notification fan-out by email and push for new content and live start.                       | Planned (Phase 8)              |
| FR-GROW-4 | Standalone mode: one fixed tenant, activated by a signed licence key, for on-premise buyers. | Planned (Phase 8)              |
| FR-GROW-5 | Multi-language UI and localized metadata.                                                    | Planned (Phase 8)              |

## 4. Non-functional requirements

Written as quality-attribute scenarios: **Source, Stimulus, Environment, Response, Measure**.
Each names the check that proves it.

### 4.1 Performance

**NFR-PERF-1: playback-token burst.**

- Source: viewers of a tenant's live event.
- Stimulus: 5,000 playback-token requests per second for 10 minutes at event start.
- Environment: production-like compose stack, three API replicas, warm caches.
- Response: every request is entitlement-checked and answered with a signed manifest URL.
- Measure: p95 below 150 ms, error rate 0. Proof: k6 script `tests/load/playback-token.js`.

**NFR-PERF-2: segment path.**

- Source: any viewer.
- Stimulus: video segment request.
- Environment: normal operation.
- Response: served by origin storage or CDN. It never reaches the API or the database.
- Measure: zero API requests per segment in a full-play test. Proof: k6 HLS script plus API request counter.

**NFR-PERF-3: anonymous catalog.**

- Source: anonymous visitor on a tenant host.
- Stimulus: home page request.
- Environment: edge cache warm.
- Response: cached response with stale-while-revalidate.
- Measure: p95 time to first byte below 300 ms. Proof: k6 and cache-hit ratio metric.

### 4.2 Scalability

**NFR-SCALE-1: transcode throughput.**

- Source: editor uploads a one-hour 1080p source.
- Stimulus: job queued.
- Environment: four worker containers, no other load.
- Response: ladder produced and packaged.
- Measure: ready in under 15 minutes, and throughput grows linearly when workers are added. Proof: worker benchmark in the Phase 3 plan.

**NFR-SCALE-2: tenant growth.**

- Source: platform operator.
- Stimulus: 1,000 active tenants with 100 viewers each.
- Environment: one Postgres primary with PgBouncer.
- Response: no per-tenant schema or database is created. Queries stay indexed by tenant ID.
- Measure: p95 query time under 50 ms for catalog reads. Proof: seeded benchmark.

### 4.3 Availability

**NFR-AVAIL-1: API down.**

- Source: infrastructure failure.
- Stimulus: all API replicas unreachable for 5 minutes.
- Environment: viewers already playing, tokens valid.
- Response: playback continues because segments come from storage or CDN and tokens are self-contained.
- Measure: zero playback errors for already-started sessions during the outage. Proof: chaos test in Phase 6.

**NFR-AVAIL-2: worker crash.**

- Source: transcode worker killed mid-job.
- Stimulus: process exit.
- Response: job lease expires and another worker retries without duplicates.
- Measure: asset reaches READY with exactly one set of renditions. Proof: worker integration test.

### 4.4 Security and isolation

**NFR-SEC-1: cross-tenant read.**

- Source: authenticated viewer or staff of tenant A.
- Stimulus: any request that names a tenant B row ID, including through bugs that omit a filter.
- Environment: application connects as a non-owner database role.
- Response: zero rows returned or written.
- Measure: every tenant-scoped table is in the fence list, and a fence test fails if one is missing. Proof: `packages/db` tenancy integration test and a k6 negative test.

**NFR-SEC-2: concurrent streams.**

- Source: one viewer account.
- Stimulus: starts stream N+1 on a plan that allows N.
- Response: oldest session ends or the request is refused, per plan.
- Measure: registry never shows more than N active sessions. Proof: sessions integration test.

**NFR-SEC-3: secrets.**

- Source: operator.
- Stimulus: API starts with a missing required secret.
- Response: process exits with a clear error. No fallback secret exists anywhere.
- Measure: boot test passes with each required variable removed in turn. Proof: env unit test.

**NFR-SEC-4: token theft window.**

- Source: attacker with a copied playback URL.
- Stimulus: replays it after expiry or from another session.
- Response: CDN or origin rejects it.
- Measure: URLs expire within 5 minutes and are bound to tenant and asset. Proof: playback service test.

### 4.5 Operability and maintainability

**NFR-OPS-1: standalone defaults.** `bun install && docker compose up -d && bun run dev` runs the whole product with no cloud account and no paid service (hub rule: standalone-apps).

**NFR-OPS-2: observability.** Any request can be followed from the edge to the database by one trace ID, and every log line carries tenant ID and request ID.

**NFR-MAINT-1: sealed modules.** An API module can be imported only through its index file. A dependency-cruiser rule fails the build on a violation.

**NFR-MAINT-2: no unproven checkmarks.** A checklist item is marked done only with a named, passing test (hub rule: LEFTOVER_CHECKLIST).

## 5. Constraints and assumptions

- Package manager is bun. Runtime is Node 24 LTS (see [adr/0016](./adr/0016-frontend-stack.md)).
- Hosting defaults to docker-compose on self-hosted or Always Free hardware. Any paid SKU needs an owner yes in the session that names the SKU and its monthly cost.
- No production DRM exists at $0. DRM is an optional paid add-on (see [adr/0011](./adr/0011-protection-tiers.md)).
- Cloudflare R2 video delivery is allowed in practice but not in written terms. Treat as unverified (see [LEFTOVER_CHECKLIST.md](./LEFTOVER_CHECKLIST.md)).
- Viewers are scoped to one tenant. The same email can hold separate accounts on two tenants.
- TMDB is metadata enrichment only. A commercial tenant needs a commercial TMDB agreement.
- Assumption: the owner approves decisions D3 to D7 in [plans/00](./plans/00-whitelabel-streaming-saas-master-plan.md) as recommended unless told otherwise.

## 6. Traceability

| Shipped feature in [FEATURES.md](./FEATURES.md) | FR-IDs                        |
| ----------------------------------------------- | ----------------------------- |
| Authentication                                  | FR-CORE-1, FR-CORE-10         |
| Multi-profile support                           | FR-CORE-2, FR-LEGAL-4         |
| Content catalog                                 | FR-CORE-3, FR-WL-6            |
| Server-rendered browse page                     | FR-CORE-4                     |
| Video playback                                  | FR-VOD-7, FR-VOD-9, FR-VOD-10 |
| Search                                          | FR-CORE-5, FR-OPS-4           |
| My List                                         | FR-CORE-6                     |
| Watch history                                   | FR-CORE-7                     |
| Reviews and notifications                       | FR-CORE-8                     |
| Admin dashboard                                 | FR-CORE-11                    |
| Subscription and billing scaffolding            | FR-BIL-3, FR-BIL-10           |
| Mobile app                                      | FR-CORE-12                    |
| Content seeding                                 | FR-CORE-14                    |
