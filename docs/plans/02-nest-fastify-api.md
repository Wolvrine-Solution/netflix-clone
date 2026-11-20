# Plan 02 — Express 4 becomes NestJS 11 on Fastify (FR-CORE-1..14, FR-CORE-13, NFR-MAINT-1)

**Goal:** serve every route the Express API serves today, at the same paths with the same payloads, from sealed NestJS modules on the Fastify adapter, using Zod 4 for validation and OpenAPI.

**Status: in progress.** The main session is porting `apps/api` while this plan is read. Checks stay unticked until a named test passes. The call-site ports of plan 03 Part B happen module by module inside this plan.

Read first: [CONVENTIONS.md](./CONVENTIONS.md) · [ADR 0008](../adr/0008-api-nestjs-fastify.md) · [plan 03](./03-drizzle-migration.md) · [TDD section 4 and 6](../TDD.md) · bd-pos `apps/api` (`tenant.guard.ts`, `route-markers.ts`, `permission.guard.ts`, `modules/billing/billing-provider.ts`).

## Decisions already made (do not reopen)

- NestJS 11 with `@nestjs/platform-fastify` (Fastify 5). Owner decision D1, 2026-10-28.
- Validation with `nestjs-zod` and Zod 4. Schemas live in `packages/contracts` so web and mobile can import them.
- **Explicit injection tokens**: `constructor(@Inject(FooService) private readonly foo: FooService)`. The build uses tsup (esbuild), which emits no decorator metadata. Implicit injection fails only at the first request.
- Same URL space: legacy `/api/*` and versioned `/api/v1/*` both stay mounted, plus `/health`, `/ready` and `/webhooks/stripe`. Clients change nothing.
- Module layout and the single-entry-point import rule come from [CONVENTIONS.md](./CONVENTIONS.md). A dependency-cruiser rule enforces them.
- Logging is `nestjs-pino`. No `console.*`.
- Tenancy is not added here. `TenantGuard` and `withTenant` arrive in plan 04. Write repositories so a tenant context can be added without changing controller code.
- No fallback secrets. Config validation fails at boot.

## Files by layer

**Mapping from the current Express code (71 TypeScript files, 16 test files) to Nest modules**

| Current file                                                                                                                                     | Nest target                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `index.ts` (helmet, cors, body limit, raw body for Stripe, request log, `/health`, `/ready`, mounts, 60 s background loop)                       | `main.ts`, `app.module.ts`, `health/`, scheduler (below)                                                          |
| `routes/index.ts` cache-control rule (`public, max-age=60, stale-while-revalidate=300` for `/content`, `/rows`, `/search`, `no-store` elsewhere) | `CacheControlInterceptor` with the same rule and a test                                                           |
| `routes/auth.ts` (`POST /auth/signin`, `/refresh`, `/revoke`), `lib/jwt.ts`, `lib/totp.ts`, `lib/adminMfaSession.ts`                             | `modules/identity` (`AuthController`, `TokenService`, `MfaService`)                                               |
| `middleware/authenticate.ts`, `optionalAuth.ts`                                                                                                  | `AuthGuard` plus `@Public()` and `@OptionalAuth()` route markers                                                  |
| `middleware/adminOnly.ts`                                                                                                                        | `AdminGuard` (re-reads the user, requires admin role and not suspended)                                           |
| `middleware/kidFilter.ts`, `lib/maturity.ts`, `lib/profileAccess.ts`                                                                             | `MaturityInterceptor` plus `ProfileAccessService` in `modules/engagement`                                         |
| `middleware/validate.ts`                                                                                                                         | `ZodValidationPipe` from nestjs-zod, DTOs via `createZodDto`                                                      |
| `middleware/errorHandler.ts`                                                                                                                     | `AllExceptionsFilter` returning problem details, never leaking internals                                          |
| `middleware/requestId.ts`                                                                                                                        | Fastify `genReqId` plus `x-request-id` header interceptor                                                         |
| `middleware/rateLimiter.ts` (`apiLimiter`, `searchLimiter`)                                                                                      | `@fastify/rate-limit` with the Valkey store, per-route override for search                                        |
| `lib/env.ts`                                                                                                                                     | `ConfigModule` with a Zod schema; process exits on invalid config                                                 |
| `lib/redis.ts`                                                                                                                                   | `RedisModule` (ioredis provider, health probe)                                                                    |
| `lib/logger.ts`, `lib/observability.ts`                                                                                                          | `nestjs-pino` plus an OpenTelemetry stub kept until Phase 6                                                       |
| `routes/content.ts`, `routes/rows.ts`, `routes/admin/{content,genres,rows}.ts`, `services/tmdbService.ts`, `lib/contentMapper.ts`                | `modules/catalog` (public controller, admin controller, TMDB client, mapper)                                      |
| `routes/search.ts`, `modules/search/indexer.ts`                                                                                                  | `modules/search`                                                                                                  |
| `routes/profiles.ts`, `myList.ts`, `watchHistory.ts`, `reviews.ts`                                                                               | `modules/engagement` (four controllers)                                                                           |
| `routes/notifications.ts`, `routes/admin/notifications.ts`                                                                                       | `modules/notifications`                                                                                           |
| `routes/admin/users.ts`, `routes/admin/mfa.ts`                                                                                                   | `modules/identity` admin controllers                                                                              |
| `routes/admin/analytics.ts`                                                                                                                      | `modules/analytics`                                                                                               |
| `routes/v1/playback.ts`, `modules/playback/service.ts`, `modules/sessions/service.ts`                                                            | `modules/playback` (sessions registry inside)                                                                     |
| `modules/entitlements/service.ts`                                                                                                                | `modules/entitlements`                                                                                            |
| `routes/v1/billing.ts`, `modules/billing/stripe.ts` and `/webhooks/stripe`                                                                       | `modules/billing` (`BillingProvider` interface, `StripeProvider`, `SandboxProvider`, raw-body webhook controller) |
| `routes/v1/assets.ts`, `modules/assets/transcode.ts`                                                                                             | `modules/assets`                                                                                                  |
| `routes/v1/live.ts`, `modules/live/service.ts`                                                                                                   | `modules/live`                                                                                                    |
| `routes/v1/compliance.ts`, `modules/compliance/service.ts`                                                                                       | `modules/compliance`                                                                                              |
| `routes/v1/recommendations.ts`, `modules/recommendations/service.ts`                                                                             | `modules/recommendations`                                                                                         |
| `routes/v1/index.ts` `/openapi.json` (a four-path hand-written stub)                                                                             | generated by `@nestjs/swagger` plus nestjs-zod, served at `/api/v1/openapi.json`                                  |
| `setInterval(runBackgroundJobs, 60_000)` (unpublish expired licenses, process outbox)                                                            | `@nestjs/schedule` cron providers now; BullMQ repeatable jobs in Phase 3                                          |

**Packages and config**

- New `packages/contracts` (Zod 4 schemas, DTO shapes shared with clients).
- `apps/api/package.json`: remove `express`, `cors`, `morgan`, `express-rate-limit`, `helmet` (use `@fastify/helmet`, `@fastify/cors`), `@types/express`, `supertest`, ESLint packages. Add `@nestjs/{common,core,platform-fastify,config,swagger,schedule}`, `nestjs-zod`, `nestjs-pino`, `@fastify/{helmet,cors,rate-limit}`, `reflect-metadata`, `zod@4`.
- Build: keep `tsup` (cjs) with `entry: src/main.ts`; start `node dist/main.js`. Dev: `tsx watch src/main.ts`.
- Add `.dependency-cruiser.cjs` rule `api-modules-are-sealed` and the `bun run check` step.

## Ordered steps

**Part A: skeleton.**

1. Add dependencies. Create `main.ts` (Fastify adapter, `bodyLimit` from env, `rawBody: true` for the webhook route, CORS allow-list from `CORS_ORIGINS`, helmet).
2. `ConfigModule` with Zod env schema equal to today's `lib/env.ts` plus a test that each required variable missing aborts boot.
3. `HealthModule`: `/health` returns `{status:'ok'}`; `/ready` runs `pingDb()` and a Valkey ping, returns 503 with `{status:'not_ready'}` on failure. Same JSON as today.
4. `RedisModule`, `LoggerModule` (nestjs-pino with redaction of `authorization`, `password`, cookies), request ID.
5. Global `AllExceptionsFilter`, `ZodValidationPipe`, `CacheControlInterceptor`, rate limiter (global plus search override).
6. Test: boot the app with `Test.createTestingModule` and `app.inject`; `/health`, `/ready`, 404 shape, 429 after the limit, request ID echo.

**Part B: identity and guards.** Port token issue and verify (`jose`, HS256, `NEXTAUTH_SECRET` unchanged so existing mobile and web tokens keep working), refresh and revoke, `AuthGuard`, `@Public`, `@OptionalAuth`, `AdminGuard`, TOTP and the MFA session. Keep `jwt.integration.test.ts` passing unchanged in behavior; extend it with a real NextAuth v5 session token (closes gap G11).

**Part C: public viewer modules** in this order, each with repository (plan 03 Part B), controller, DTOs, tests: `engagement` (profiles, PIN, My List, history, reviews), `catalog` (content, featured, rows), `search`, `notifications`.

**Part D: admin modules**: catalog admin (content CRUD, import, TMDB search, videos, seasons, episodes, featured), genres, rows (reorder, content membership), users (list, update, delete, grant subscription), notifications broadcast, analytics, MFA.

**Part E: v1 modules**: `playback` (token, DRM stub route, sessions registry with heartbeats), `entitlements`, `billing` (provider interface, Stripe provider, sandbox provider refused in production, raw-body webhook with signature check and event-id dedupe), `assets`, `live`, `compliance`, `recommendations`.

**Part F: contract and cleanup.**

1. Generate OpenAPI and write a snapshot test (`openapi.snapshot.test.ts`).
2. Delete `src/routes`, `src/middleware`, Express imports. `rg "from 'express'"` returns nothing.
3. Update `Dockerfile` (`CMD ["bun", "dist/main.js"]` or `node`), `docker-compose.yml` healthcheck on `/ready`, `DEVELOPER.md` and `AGENTS.md` command tables.
4. Run the web, admin and mobile e2e suites unchanged against the new API. They are the proof that paths and payloads did not change.

## Checks

- [ ] `apps/api/src/common/config.test.ts`: boot fails with each required variable removed (NFR-SEC-3, gap G1)
- [ ] `apps/api/src/health/health.controller.test.ts`: `/health` 200, `/ready` 200 and 503
- [ ] `apps/api/src/common/rate-limit.test.ts`: 429 after the window limit; search limit separate (gap G2)
- [ ] `apps/api/src/common/cache-control.interceptor.test.ts`: header rule matches today's table
- [ ] `apps/api/src/modules/identity/token.integration.test.ts`: NextAuth v5 session token and API-issued token both verify (gap G11)
- [ ] `apps/api/src/modules/identity/*.test.ts`: signin, refresh, revoke, MFA (ports of `routes/auth.test.ts`, `routes/admin/mfa.test.ts`)
- [ ] `apps/api/src/modules/engagement/*.test.ts`: ports of `profiles`, `myList`, `reviews` tests, plus maturity filter per endpoint (gap G5)
- [ ] `apps/api/src/modules/catalog/*.test.ts`: ports of `content.test.ts`, `admin/content.test.ts`, `contentMapper.test.ts`
- [ ] `apps/api/src/modules/notifications/notifications.controller.test.ts`
- [ ] `apps/api/src/modules/playback/playback.service.test.ts`: signed URL expiry and binding
- [ ] `apps/api/src/modules/billing/webhook.test.ts`: replayed event id changes nothing
- [ ] `apps/api/src/modules/recommendations/recommendations.controller.test.ts`
- [ ] `apps/api/src/app.journey.test.ts`: register, sign in, create profile, browse, add to My List, play, over real HTTP and a real Postgres
- [ ] `apps/api/src/openapi.snapshot.test.ts`
- [ ] `bun run check` (Biome, tsc, dependency-cruiser sealed-module rule) passes
- [ ] `rg "from 'express'" apps/api` finds nothing
- [ ] Web and mobile Playwright suites pass against the Nest API

## LEFTOVER rows this plan opens

| What                                              | Why                           | Manual path                                                                                   | Status |
| ------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| Existing passing tests mock the ORM               | They prove routing, not SQL   | Replace mocks with repository fakes and add integration tests                                 | Open   |
| Decorator metadata absent under tsup              | Implicit DI breaks at runtime | Keep `@Inject(Token)` everywhere; add a lint rule or a boot test that resolves every provider | Open   |
| bd-pos code reuse unproven (U10)                  | Not tried yet                 | Port `route-markers.ts` and the permission guard as the first spike                           | Open   |
| `/openapi.json` was a hand-written four-path stub | Clients may rely on it        | Confirm no client reads it, then replace                                                      | Open   |

## Out of scope

- Tenant resolution, RLS and `TenantGuard` (plan 04).
- New endpoints, changed payloads or renamed paths.
- Real transcoding, DRM, live ingest and Stripe Connect (later phases).
- Moving background jobs to BullMQ (Phase 3).
- Hono, oRPC or any other framework (rejected in ADR 0008).

## Sources

- NestJS Fastify adapter: https://docs.nestjs.com/techniques/performance
- nestjs-zod: https://github.com/BenLorantfy/nestjs-zod
- nestjs-pino: https://github.com/iamolegga/nestjs-pino
- `@fastify/rate-limit`: https://github.com/fastify/fastify-rate-limit
- bd-pos reference: `~/WorkSpace/codeshipper/bd-pos/apps/api` and ADR 0008 in [../adr/](../adr/0008-api-nestjs-fastify.md).
- Decorator metadata and esbuild: see [CONVENTIONS.md](./CONVENTIONS.md) (wiring rule).
