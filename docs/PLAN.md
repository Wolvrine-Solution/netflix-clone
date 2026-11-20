# Implementation plan — StreamKit (netflix-clone)

| Field           | Value                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Date            | 2026-10-28 (replaces the 2026-07-19 template plan)                                                |
| Source          | [SRS.md](./SRS.md) and [TDD.md](./TDD.md)                                                         |
| Owner decisions | NestJS 11 + Fastify, Drizzle, Postgres RLS tenancy, bun, $0 self-hosted defaults                  |
| Detail          | one plan doc per step in [plans/](./plans/), written for Sonnet to execute with no open questions |

Build **one phase at a time**. Do not start phase N+1 until phase N acceptance passes.
A box is ticked only when the named test passes. No box is ticked on assertion.

The earlier version of this file claimed Phase 0 was shipped with passing CI tests. That claim
was never verified: the measured baseline on 2026-10-28 shows failing typecheck and tests
(see [LEFTOVER_CHECKLIST.md](./LEFTOVER_CHECKLIST.md)). Phase 0 therefore starts unchecked.

## Housekeeping before Phase 0 (tracked in [plans/00](./plans/00-whitelabel-streaming-saas-master-plan.md))

- [ ] Phase A: rule compliance (workflows, Dockerfiles, docs, rule sync)
- [ ] Phase B: agent-repo-kit selective merge
- [ ] Phase C: this design pack (SRS, TDD, ARCHITECTURE, ADRs, plans 01 to 03) written and approved

## Phase 0 — Foundation (stack, API framework, ORM)

**FR subset:** FR-CORE-1..14 re-proven on the new stack.

**Plans:** [01 stack upgrade](./plans/01-stack-upgrade.md), [02 NestJS and Fastify API](./plans/02-nest-fastify-api.md), [03 Drizzle migration](./plans/03-drizzle-migration.md)

**Ship**

- [ ] Baseline failures fixed: typecheck green in api, web, admin, mobile (`bun run typecheck`)
- [ ] Next 16, React 19, Expo 58, Zod 4, Vitest 4, Biome 2 on Node 24 (plan 01)
- [ ] Express removed. NestJS on Fastify serves every route that exists today at the same paths (plan 02)
- [ ] Prisma removed. Drizzle schema equals the old schema, with a data migration script (plan 03)
- [ ] Every existing test ported and green. New tests for env fail-fast, rate limiting and `/ready`
- [ ] Docker images build with `oven/bun` and `docker compose up` serves web, admin and api
- [ ] Playwright e2e for web passes against compose

**Done when**

- `bun run ci` is green locally (lint, format check, typecheck, test, build)
- `curl localhost:4000/health` and `/ready` return 200 against compose
- LEFTOVER rows for Phase 0 are closed with named tests

## Phase 1 — Tenancy

**FR subset:** FR-TEN-1..8

**Plans:** 04 tenant-rls, 05 host-resolution-and-tls, 06 tenant-lifecycle, 07 platform-admin (to be written by the planning model when Phase 0 is accepted)

**Ship**

- [ ] `tenant`, `tenant_domain`, `staff_user`, `tenant_member` tables and `tenant_id` on every tenant table
- [ ] `withTenant`, `asSystem`, non-owner database role, RLS ENABLE and FORCE on all tenant tables
- [ ] Fence test: any table missing from the tenant or platform list fails the build
- [ ] Host header resolves the tenant (Valkey cached, invalidated on change)
- [ ] Caddy on-demand TLS with the `ask` endpoint
- [ ] Lifecycle guard: 423 for suspended, 410 for deleted
- [ ] Operator console on a separate auth instance with MFA

**Done when:** two tenants on two hosts, and a negative test proves tenant A cannot read tenant B through any API route.

## Phase 2 — White-label

**FR subset:** FR-WL-1..8, FR-TEN-9

**Plans:** 08 branding-tokens-and-media, 09 tenant-studio, 10 mobile-runtime-branding

**Ship**

- [ ] `tenant_branding` and `media` with CSS-variable theming in web
- [ ] Studio: brand, domains, team, catalog management
- [ ] Mobile loads the brand at start from the tenant host
- [ ] Contrast check at brand save
- [ ] API keys with scopes

**Done when:** changing a tenant's brand changes web and mobile with no rebuild, verified by Playwright on two tenants.

## Phase 3 — Video pipeline (VOD)

**FR subset:** FR-VOD-1..12, FR-OPS-9 (token path)

**Plans:** 11 upload-and-asset-state, 12 ffmpeg-worker-ladder, 13 packager-captions-trickplay, 14 playback-service, 15 player-web-mobile

**Ship**

- [ ] Resumable multipart upload to object storage
- [ ] Asset state machine with idempotent retries (worker crash test)
- [ ] ABR ladder and CMAF packaging, HLS and DASH
- [ ] Captions required to publish; trick-play sprites
- [ ] Playback service: entitlement, signed URL, AES-128 key, ClearKey tier
- [ ] Shaka-based web player and expo-video mobile player
- [ ] k6 token-burst test meets NFR-PERF-1

**Done when:** a real upload plays back adaptively on web and mobile, and the segment path shows zero API calls.

## Phase 4 — Billing and entitlements

**FR subset:** FR-BIL-1..10

**Plans:** 16 platform-plans, 17 connect-per-tenant, 18 entitlement-service-and-flags, 19 stream-limits-and-quality-caps

**Ship**

- [ ] Platform plans and limits enforced
- [ ] Billing provider interface with Stripe and sandbox providers
- [ ] Connected account per tenant, BYO-keys fallback
- [ ] Webhook idempotency, dunning, billing history
- [ ] Concurrent-stream cap and quality cap in the manifest

**Done when:** sandbox to Stripe test mode swap works, and replayed webhooks change nothing.

## Phase 5 — Live

**FR subset:** FR-LIVE-1..8

**Plans:** 20 ingest-keys, 21 ll-hls-playback-dvr, 22 archive-to-vod, 23 live-load-test

**Ship**

- [ ] MediaMTX with per-channel ingest keys verified by the API
- [ ] LL-HLS playback with DVR and go-to-live
- [ ] Geo and blackout rules at token issue
- [ ] Auto-archive through the VOD pipeline
- [ ] Load test for event-start burst

**Done when:** an SRT feed reaches viewers on two tenants and the archive plays as VOD.

## Phase 6 — Scale and observability

**FR subset:** FR-OPS-1..8

**Plans:** 24 otel-signoz, 25 nats-clickhouse-qoe, 26 meilisearch-per-tenant, 27 pgvector-recommendations, 28 pgbouncer-replica-backups

**Ship**

- [ ] Traces and RED metrics tagged with tenant
- [ ] QoE pipeline and tenant reports
- [ ] Meilisearch index per tenant fed by outbox
- [ ] Recommendations rows
- [ ] PgBouncer, backups with PITR, restore drill documented
- [ ] Chaos test for NFR-AVAIL-1

**Done when:** dashboards show per-tenant health, and a restore drill is recorded in a runbook.

## Phase 7 — Compliance and DRM add-on

**FR subset:** FR-LEGAL-1..8, FR-TEN-10

**Plans:** 29 drm-addon-seam, 30 privacy-dsar-consent, 31 dmca-kids-wcag, 32 mfa-and-runbooks

**Ship**

- [ ] DRM seam with one vendor chosen by the owner (paid; approval needed)
- [ ] Automated export and delete, consent records, VPPA-safe analytics
- [ ] DMCA workflow, kid profile rules, WCAG 2.1 AA audit
- [ ] Incident and breach runbooks

**Done when:** the compliance checklist in [FEATURES.md](./FEATURES.md) is filled with proving tests.

## Phase 8 — Distribution and growth

**FR subset:** FR-GROW-1..5

**Plans:** 33 tv-clients, 34 offline-downloads, 35 notification-fanout, 36 standalone-licence-mode

**Ship**

- [ ] Android TV and tvOS via react-native-tvos; Tizen and webOS via the Shaka web wrapper
- [ ] Offline downloads with persistent license
- [ ] Email and push fan-out
- [ ] Standalone mode with signed licence key
- [ ] Localization

**Done when:** each client passes the playback smoke test on a real device or emulator.

## Deferred / out of plan

Track in [LEFTOVER_CHECKLIST.md](./LEFTOVER_CHECKLIST.md). Do not expand scope mid-phase without updating this file.
Per-tenant native store builds are a Phase 8 option and need an owner decision (D7).
