# Production Roadmap

Phased plan to take this codebase from demo to a production streaming service provider (VOD + live). Rationale and design detail for every item is in [ARCHITECTURE.md](./ARCHITECTURE.md); gap IDs (G1–G12) refer to §1.6 there.

Legend: each phase should be releasable on its own. Don't start a later phase while an earlier phase's **Blocker** items are open.

---

## Phase 0 — Hardening the existing app (Blockers)

- [x] Remove `'fallback-secret'` JWT fallbacks; fail fast at boot when `NEXTAUTH_SECRET`/`DATABASE_URL` are missing (G1)
- [x] Mount the global `apiLimiter` on `/api` (it exists but is unused) (G2)
- [x] Switch from `prisma db push` to **Prisma Migrate** with committed migration history (G3)
- [x] Make CORS origins env-configurable allowlist (G8)
- [x] Verify web→API token compatibility (NextAuth `encode` vs `jose.jwtVerify`) with an integration test; unify token issuance (G11)
- [x] Enforce `maturityRating` filtering server-side for kid profiles in rows/search/content endpoints (G5)
- [x] Add request body-size limits, request IDs, and structured logging (pino) to the API
- [x] Add `/ready` endpoint with DB connectivity check
- [x] Remove unused deps (`video.js`, `react-player`, unused `stripe` until Phase 3) or wire them up intentionally

## Phase 1 — Delivery infrastructure & automation

- [x] `docker-compose.yml` for local dev (Postgres, Redis, MinIO) (G7)
- [x] Dockerfiles for `apps/api` (and web/admin if not on Vercel)
- [x] GitHub Actions CI: pnpm cache + `turbo run lint typecheck build test` on every PR, affected-only (G7)
- [x] Playwright e2e job against docker-compose in CI
- [x] CodeQL + gitleaks + Dependabot/Renovate
- [x] CD pipeline: dev → staging → prod promotion, health-gated deploys, one-click rollback
- [x] Terraform for DB, Redis, buckets, CDN, DNS
- [x] Secrets in a secret manager (no `.env` files in prod)
- [x] Sentry on all four apps; centralized structured logs; OpenTelemetry traces + RED metrics dashboards (G10)

## Phase 2 — Real video pipeline (VOD)

- [x] `Asset` lifecycle model (`UPLOADED → TRANSCODING → PACKAGED → READY/FAILED`) + admin upload via S3 presigned multipart URLs
- [x] Transcoding workers (managed first: MediaConvert/Mux; ffmpeg workers later) producing an ABR ladder; persist renditions into the existing `VideoFile` table (G6)
- [x] CMAF packaging → HLS + DASH manifests
- [x] Private origin buckets + CDN with short-lived signed URLs/cookies
- [x] `POST /playback/:contentId` endpoint: entitlement check → signed manifest + start position (replaces `DEMO_SRC`)
- [x] Multi-DRM (Widevine/FairPlay/PlayReady) via a license service; 4K gated to hardware-backed DRM
- [x] Captions pipeline (WebVTT per language) — required before publish; trick-play thumbnails
- [x] QoE analytics events (TTFF, rebuffer, errors) → event pipeline, canary playback probe

## Phase 3 — Billing & entitlements

- [x] Stripe Checkout + Billing integration; local `Subscription` updated only by verified, idempotent webhooks (G4)
- [x] Entitlement service module: `can(user, action, resource)` called at playback-token issuance
- [x] Concurrent-stream limits per plan via Redis session registry with heartbeats (G12)
- [x] Quality caps per plan enforced in manifest issuance
- [x] Refresh tokens + server-side revocation; shorten access-token TTL (G12)
- [x] Dunning, Stripe Tax, regional pricing; billing history page replaces the demo subscription UI
- [x] PPV/TVOD purchase flow for one-off events

## Phase 4 — Live streaming (ESPN+-style)

- [x] `LiveChannel` / `LiveEvent` / `EventEntitlement` domain models + admin scheduling UI
- [x] SRT/RTMP ingest → live transcode → LL-HLS packaging (MediaLive or self-managed)
- [x] DVR window + catch-up; auto-archive ended events through the VOD pipeline
- [x] Geo-restriction/blackout enforcement at CDN + playback-token layer
- [x] Live player UX: latency mode, "go to live", pre/post slates
- [x] Load-test the playback-token path for burst traffic

## Phase 5 — Scale & search

- [x] Redis replaces `node-cache` for TMDB/rows/featured caching (G9)
- [x] CDN caching for anonymous catalog endpoints (`stale-while-revalidate`)
- [x] OpenSearch/Meilisearch catalog index fed by outbox events; TMDB demoted to enrichment
- [x] Postgres read replicas; PITR backups + restore drills
- [x] API versioning (`/api/v1`) + OpenAPI spec generated from Zod schemas
- [x] Module boundaries in the API (catalog/playback/identity/entitlements/engagement/live/admin)

## Phase 6 — Legal & compliance

- [x] License-window model (territories, start/end) with automated unpublish at window end
- [x] TMDB attribution + commercial API terms review
- [x] Privacy: GDPR/CCPA consent, automated DSAR export/delete, DPAs with processors
- [x] ToS + privacy policy at signup; VPPA-safe analytics (no third-party sharing of viewing history)
- [x] Kid profiles: COPPA-safe (no tracking/ads), profile PINs, parental controls
- [x] Accessibility: WCAG 2.1 AA audit; captions/audio-description coverage (CVAA)
- [x] DMCA agent + takedown workflow in admin
- [x] Admin MFA (TOTP/WebAuthn); expand `AdminLog` coverage; incident-response runbook

## Phase 7 — Product growth (post-launch)

- [x] TV apps (tvOS / Android TV / smart-TV web)
- [x] Offline downloads (mobile) with persistent DRM licenses per plan
- [x] Recommendations from watch-history events
- [x] Multi-language UI + metadata localization
- [x] Notifications fan-out (email/push) for new content and live-event start
