# Leftover Checklist — StreamKit (netflix-clone)

| Field  | Value                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Date   | 2026-10-28                                                                                                                                  |
| Status | **Open.** The earlier "All closed" status was wrong and is withdrawn.                                                                       |
| Rule   | Mark `[x]` only with a named test that passes. Add a row to [FEATURES.md](./FEATURES.md) in the same commit when a user-facing item closes. |

Roadblocks (things that cannot be done without the owner) go in the last section with evidence.

## 1. Measured baseline, 2026-10-28 (before any change in this plan)

Commands were run per package with `bunx turbo run <task> --filter=<package>` after `bun install --frozen-lockfile` (bun 1.4.2, Node 25.9 on the dev machine).
Nothing here was fixed. These numbers are the starting line.

| Package                                        | typecheck                                                                                                                                                                                                                        | lint              | test                                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netflix/api`                                 | **FAIL**: `src/services/tmdbService.ts` lines 113 and 114, mapped objects do not match `VideoFile[]` and `Season[]`                                                                                                              | pass, 19 warnings | **1 file fails, 89 tests pass.** `modules/playback/service.test.ts` cannot load `@prisma/client` (client not generated).                                                                          |
| `@netflix/web`                                 | **FAIL**: `src/lib/auth.ts` cannot find module `jose`; `usePlayerStore.test.ts` type error                                                                                                                                       | pass              | **2 files fail, 9 tests fail, 36 pass.** `useMyList.test.tsx` (5 failures) and `useProfileStore.test.ts` (4 failures, `storage.setItem is not a function`, localStorage in the test environment). |
| `@netflix/admin`                               | **FAIL**: cannot find `@auth/prisma-adapter` and `bcryptjs`                                                                                                                                                                      | pass              | pass, 4 files, 50 tests                                                                                                                                                                           |
| `@netflix/mobile`                              | **FAIL**: `lib/auth.ts` uses `window` (no DOM lib); `ContentItem` and `ContentData` casts in `watch/[contentId].tsx`; `VideoPlayer` has no `paused` property; `Navbar` style prop `background`; `api.test.ts` possibly undefined | pass, 13 warnings | **does not run** (jest exits with failure, no test summary)                                                                                                                                       |
| `@netflix/db`, `@netflix/ui`, `@netflix/types` | pass                                                                                                                                                                                                                             | pass              | pass (no tests)                                                                                                                                                                                   |

Consequences:

- The previous PLAN.md line "47 test/spec files, CI runs them" was never verified. CI is dispatch only and the pre-push hook cannot have been green.
- API tests that pass mock Prisma. They prove route logic, not database behavior.
- `bun run ci` has never been shown green on this tree.

Local run commands: `bun install --frozen-lockfile`, then `bun run typecheck`, `bun run lint`, `bun run test`.

## 2. Reopened items (previously `[x]`, now unproven)

| #   | Item                                                                | Why reopened                                                                                                    | Proving test needed                                         |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| R1  | [ ] Streaming CDN / signed URL                                      | `modules/playback/service.test.ts` fails to load                                                                | Same file passing after Prisma client is replaced (plan 03) |
| R2  | [ ] Auth and profile switch end to end                              | `apps/web/e2e/features/auth-profile-switch.spec.ts` never run against a stack in this audit                     | That spec passing in Playwright against compose             |
| R3  | [ ] README, DEVELOPER, AGENTS, SRS, TDD, ARCHITECTURE, PLAN present | SRS, TDD, ARCHITECTURE and PLAN were templates. Now written (this change). AGENTS and DEVELOPER still say pnpm. | `bun run doctor` in the hub plus a docs link check          |
| R4  | [ ] `.env.example` complete                                         | Not re-checked after bun move                                                                                   | A boot test that reads `.env.example` and starts the API    |

## 3. Known gaps G1 to G12 (carried from the old ARCHITECTURE.md, with current evidence)

| #   | Gap                            | Evidence today                                                                                                                                                                    | Status                                                                               |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| G1  | JWT secret fallback            | No `fallback-secret` in non-test source. `lib/env.ts` validates env. Test files still use a literal test secret.                                                                  | [ ] Needs an env test: boot fails with each required variable missing (NFR-SEC-3)    |
| G2  | Rate limiter not mounted       | `index.ts` mounts `apiLimiter` on `/api` and `/api/v1`                                                                                                                            | [ ] Needs a test that the 101st request in a window gets 429. Port to Nest (plan 02) |
| G3  | No migration history           | One migration `20260717000000_production_roadmap`. CI still runs `prisma db push`.                                                                                                | [ ] Replaced by drizzle-kit migrations (plan 03)                                     |
| G4  | Billing is a demo              | Stripe module and webhook route exist. Plan enforcement and tenant payouts do not.                                                                                                | [ ] Phase 4                                                                          |
| G5  | Kid profiles not filtered      | `middleware/kidFilter.ts` and `lib/maturity.ts` exist                                                                                                                             | [ ] Needs a route test per endpoint (content, rows, search)                          |
| G6  | Demo MP4 playback              | `DEMO_SRC` still in `modules/playback/service.ts`, web and mobile `VideoPlayer.tsx`                                                                                               | [ ] Phase 3                                                                          |
| G7  | No CI/CD, Dockerfile, IaC      | Workflows and Dockerfiles exist but CD ran on push and Dockerfiles used pnpm (plan 00 Phase A fixes). Terraform targets paid AWS and is moved to `infra/terraform-aws-optional/`. | [ ] Compose build and smoke test pass                                                |
| G8  | Hardcoded CORS                 | `getCorsOrigins()` reads env                                                                                                                                                      | [ ] Needs a test with two origins                                                    |
| G9  | In-process cache               | `node-cache` no longer imported in `apps/api/src`. `lib/redis.ts` used by tmdbService.                                                                                            | [ ] Needs a test that the cache survives an API restart (Valkey)                     |
| G10 | No observability               | `lib/observability.ts` only logs that DSN or endpoint is set. No `@sentry/*` or `@opentelemetry/*` dependency.                                                                    | [ ] Phase 6                                                                          |
| G11 | Token compatibility web to API | `__tests__/jwt.integration.test.ts` passes (2 tests). It does not exercise a NextAuth v5 session token.                                                                           | [ ] Extend to the real web token path                                                |
| G12 | Device limits and revocation   | `RefreshToken`, `modules/sessions/service.ts` exist                                                                                                                               | [ ] Phase 4 test: stream N+1 refused or oldest ended                                 |

## 4. Old ROADMAP items that are not implemented (the roadmap marked all of them done)

These were all `[x]` in the deleted `ROADMAP.md`. The code check below is what the tree shows today.

### Delivery infrastructure

- [ ] GitHub Actions CI is dispatch only by design (hub rule). Local pre-push `bun run ci` is the real gate and is not green yet.
- [ ] Playwright e2e job against compose
- [ ] CD with promotion and rollback. Current `cd.yml` is a smoke test stub. Real promotion is a Phase 0 non-goal.
- [ ] Secrets in a secret manager: replaced by the hub vault policy. Document in `deploy/SECRETS.md` (done in plan 00).
- [ ] Sentry on all four apps (no dependency installed)
- [ ] OpenTelemetry traces and RED dashboards (no dependency installed). Phase 6.

### Video pipeline

- [ ] `Asset` lifecycle is a status field only (`modules/assets/transcode.ts`). No ffmpeg, no packager. Phase 3.
- [ ] Admin upload with presigned multipart URLs
- [ ] ABR ladder persisted into renditions
- [ ] CMAF packaging, HLS and DASH manifests
- [ ] Private origin bucket with CDN signed URLs. Signing helper exists in `modules/playback/service.ts`.
- [ ] Multi-DRM license service. Only a DRM route stub exists at `routes/v1/playback.ts`.
- [ ] Captions pipeline, trick-play generation
- [ ] QoE analytics pipeline and canary probe

### Billing and entitlements

- [ ] Verified idempotent Stripe webhooks (code exists in `modules/billing/stripe.ts`, test missing)
- [ ] `can(user, action, resource)` called at token issue (service exists, test missing)
- [ ] Concurrent-stream limit via Valkey registry with heartbeats (service exists, test missing)
- [ ] Quality caps in the manifest
- [ ] Dunning, tax, regional pricing; billing history page
- [ ] PPV and TVOD purchase flow

### Live

- [ ] SRT and RTMP ingest, live transcode, LL-HLS packaging. Only models and a service stub exist.
- [ ] DVR window and catch-up; auto-archive through VOD
- [ ] Live player UX (latency mode, go to live, slates)
- [ ] Load test of the token path for burst

### Scale and search

- [ ] CDN caching for anonymous catalog endpoints
- [ ] Search engine index (`modules/search/indexer.ts` has no engine behind it)
- [ ] Read replicas, PITR backups and a restore drill
- [ ] OpenAPI generated from Zod (`/api/v1/openapi.json` route exists; correctness untested)

### Legal and compliance

- [ ] License-window auto-unpublish job (service exists, scheduling and test unproven)
- [ ] TMDB attribution surfaced in web and mobile
- [ ] DSAR export and delete automation
- [ ] COPPA-safe kid profile rules (no tracking, PIN parental controls)
- [ ] WCAG 2.1 AA audit
- [ ] DMCA takedown workflow in admin UI
- [ ] Admin MFA (route test `routes/admin/mfa.test.ts` passes 3 tests, mocked)

### Growth

- [ ] TV apps, offline downloads, recommendations, localization, notification fan-out

## 5. New-product gaps (not in the old roadmap)

- [ ] Multi-tenancy: no tenant concept anywhere in schema or code (Phase 1)
- [ ] White-label branding and custom domains (Phase 2)
- [ ] Drizzle replaces Prisma, NestJS replaces Express (Phase 0, plans 02 and 03)
- [ ] Rule compliance items V1 to V14 (owned by plan 00 Phase A)

## 6. Unverified facts and decisions that need evidence

| #   | Item                                                                       | Why unverified                                                                                                                                                                         | Needed to close                                                                    |
| --- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| U1  | Cloudflare R2 for HLS video delivery                                       | Cloudflare's CDN terms restrict video on Free, Pro and Business plans unless delivered through a Developer Platform product. The exemption for R2 is reported informally, not written. | Written confirmation from Cloudflare support, or default to B2 plus Bunny or MinIO |
| U2  | Prisma 8 timing                                                            | Irrelevant now. Drizzle replaces Prisma (ADR 0009).                                                                                                                                    | Closed when Prisma is removed                                                      |
| U3  | react-native-video v7 stable                                               | README still shows beta. We use expo-video instead.                                                                                                                                    | Only matters if TV clients choose react-native-video                               |
| U4  | FairPlay certificate per tenant                                            | Apple FPS packages are per legal entity                                                                                                                                                | Owner decision D5: tenant brings its own package                                   |
| U5  | No open-source QoE analytics product                                       | Research found none comparable to Mux Data                                                                                                                                             | Budget the NATS to ClickHouse build in Phase 6                                     |
| U6  | Apple HLS rules for AV1                                                    | Not re-checked                                                                                                                                                                         | Check before enabling AV1 tier                                                     |
| U7  | Drizzle 1.0 release timing                                                 | 0.45 stable, 1.0 in beta                                                                                                                                                               | Pin versions; revisit at 1.0 GA                                                    |
| U8  | Exact patch versions of Turborepo 2.11, Biome 2.4, Playwright 1.58 to 1.60 | Not confirmed from primary sources                                                                                                                                                     | Pin from `bun install` output in plan 01                                           |
| U9  | Widevine Cloud License Service retirement (reported 2027-04-13)            | Single secondary source                                                                                                                                                                | Confirm with vendor before choosing a DRM add-on                                   |
| U10 | bd-pos patterns are copyable as-is                                         | Not tried here                                                                                                                                                                         | Port one guard in plan 02 as a spike                                               |

## 7. Roadblocks needing the owner

| #   | What is blocked                                            | Why (evidence)                                            | Manual path                                    | Owner | Status |
| --- | ---------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- | ----- | ------ |
| B1  | Production delivery SKU (R2, B2, Bunny)                    | Each bills at scale; hub rule `no-paid-cloud`             | Owner approves one SKU with a monthly estimate | owner | Open   |
| B2  | DRM vendor                                                 | No $0 production tier; needs vendor and FairPlay decision | Owner picks vendor in Phase 7                  | owner | Open   |
| B3  | Domain for the platform (`streamkit.app` is a placeholder) | No domain chosen                                          | Owner registers or chooses                     | owner | Open   |
| B4  | Product name and repo rename                               | D3 undecided                                              | Owner decides after Phase 1                    | owner | Open   |
