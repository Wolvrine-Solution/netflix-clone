# Plan 03 — Drizzle replaces Prisma, schema parity first (FR-CORE-1..14, groundwork for FR-TEN-2)

**Goal:** remove Prisma from every package and run the same tables through Drizzle, with no behavior change and no tenant column yet.

**Status: in progress.** `packages/db` already contains the Drizzle port (see "State of the tree"). The API, web and admin call sites are not ported. The checks below are all unticked until a test passes.

Read first: [CONVENTIONS.md](./CONVENTIONS.md) · [ADR 0009](../adr/0009-orm-drizzle.md) · [TDD section 5](../TDD.md) · [LEFTOVER_CHECKLIST.md](../LEFTOVER_CHECKLIST.md) section 1.

## Decisions already made (do not reopen)

- ORM is Drizzle (`drizzle-orm` 0.45, `drizzle-kit` 0.31, `postgres` 3.4 driver). Owner decision D2, 2026-10-28.
- **Parity first.** Table names (`"Account"`, `"Content"`), column names (`userId`) and enum names (`"Plan"`) stay exactly as Prisma created them. Because of this an existing database needs no data move, only a baseline marker.
- `tenant_id`, RLS, `withTenant` and `asSystem` are **not** in this plan. They arrive in Phase 1 (plan 04), where the single `schema.ts` is split into `schema/*.ts` and the table names may be normalized.
- Connection uses `prepare: false` so PgBouncer transaction mode works later.
- `db` is a lazy proxy: importing the package opens no connection (tests, builds).
- Repositories (API) and server components (web, admin) are the only code that imports tables.
- Pin exact versions of `drizzle-orm` and `drizzle-kit`. Drizzle 1.0 is still beta.

## State of the tree (read before editing)

| Item                                                          | Where                                                    | State               |
| ------------------------------------------------------------- | -------------------------------------------------------- | ------------------- |
| 38 tables and 13 enums in one introspected schema             | `packages/db/src/schema.ts`, `enums.ts`                  | written             |
| Relations                                                     | `packages/db/src/relations.ts`                           | written             |
| Row type aliases named like the old Prisma types              | `packages/db/src/types.ts`                               | written             |
| Lazy client and `pingDb`, `closeDb`                           | `packages/db/src/client.ts`                              | written             |
| Baseline migration (490 lines, journal entry `0000_baseline`) | `packages/db/drizzle/`                                   | written             |
| Migrator                                                      | `packages/db/src/migrate.ts`                             | written             |
| Seed (TMDB)                                                   | `packages/db/src/seed.ts`                                | rewritten, untested |
| Prisma schema, migration and lock file                        | `packages/db/prisma/`                                    | deleted             |
| 36 non-test API files still reference Prisma                  | `apps/api/src/**`                                        | **not ported**      |
| 13 web and admin files import `prisma`                        | see Files by layer                                       | **not ported**      |
| NextAuth uses `PrismaAdapter`                                 | `apps/web/src/lib/auth.ts`, `apps/admin/src/lib/auth.ts` | **not ported**      |

## Files by layer

**Data model (`packages/db`)**

- `src/schema.ts`, `src/enums.ts`, `src/relations.ts`, `src/types.ts`, `src/client.ts`, `src/migrate.ts`, `src/seed.ts`, `drizzle.config.ts`, `drizzle/0000_baseline.sql`
- New: `src/baseline.ts` (marks the baseline as applied on a database that Prisma created), `src/schema.parity.test.ts`, `src/migrate.integration.test.ts`
- `package.json` scripts: `db:generate` (drizzle-kit generate, creates SQL, not a client), `db:migrate`, `db:push` (dev only), `db:studio`, `db:seed`, new `db:baseline`

**API (`apps/api`)**

- Each Prisma call moves into a repository file inside the module being created by plan 02. Do not port Express route files; port logic into repositories and let plan 02 wire controllers.
- Files with Prisma today: `routes/{auth,content,rows,search,profiles,myList,watchHistory,reviews,notifications}.ts`, `routes/admin/{analytics,content,genres,mfa,notifications,rows,users}.ts`, `routes/v1/{assets,billing,compliance,live,playback,recommendations}.ts`, `modules/{assets,billing,compliance,entitlements,live,playback,recommendations,search,sessions}/*`, `services/tmdbService.ts`, `lib/{contentMapper,maturity,profileAccess}.ts`, `middleware/{adminOnly,authenticate,kidFilter}.ts`.

**Web and admin**

- Server components that query the database: `apps/web/src/app/(main)/{browse/page,browse/tv/page,browse/movies/page,watch/[contentId]/page}.tsx`, `apps/web/src/app/api/register/route.ts`, `apps/admin/src/app/{page,analytics/page,users/page,content/page,content/[id]/page}.tsx`.
- `apps/web/src/lib/auth.ts` and `apps/admin/src/lib/auth.ts`: replace `PrismaAdapter(prisma)` with `DrizzleAdapter(db, { usersTable, accountsTable, sessionsTable, verificationTokensTable })` from `@auth/drizzle-adapter`, passing our existing tables. Verify the adapter's expected column names against its docs; our `Account` columns (`refresh_token`, `expires_at`, ...) already match the Auth.js shape.
- Missing dependencies that cause today's typecheck failures: `jose` (web), `bcryptjs` and the adapter (admin). Add them with `bun add` in the same change.

**Build and CI**

- Remove `bun run --filter @netflix/db db:generate` from `apps/{api,web,admin}/Dockerfile` and `bunx prisma db push` from `.github/workflows/ci.yml`. With Drizzle, `db:generate` creates migrations and must not run in an image build. Replace with `db:migrate` in the compose startup, not in the image.

## Ordered steps

**Part A: package parity (packages/db).**

1. Run `bun install`, then `DATABASE_URL=... bunx drizzle-kit check` to confirm the snapshot and journal agree.
2. Write `schema.parity.test.ts`: it reads `information_schema` from a database built by `0000_baseline.sql` and compares every table, column, type, nullability, default and index against a checked-in JSON golden file produced from the old Prisma migration (`git show HEAD:packages/db/prisma/migrations/20260717000000_production_roadmap/migration.sql`).
3. Write `migrate.integration.test.ts` (Testcontainers Postgres 18): empty database, run `migrate`, assert schema equals golden, run twice, assert no change.
4. Write `baseline.ts` and `db:baseline`: on a database that already has the tables, insert the baseline hash into `drizzle.__drizzle_migrations` without executing SQL. Test on a database created from the old Prisma SQL.
5. Seed: run `bun run db:seed` against an empty database with `TMDB_API_KEY` set. Assert counts of genres and content. Use a recorded TMDB fixture in tests so CI needs no key.
6. Commit when A is green (owner asks first).

**Part B: API call sites (with plan 02).**

1. For each module, create `<name>.repository.ts` with the queries moved over. Use the helper re-exports in `packages/db/src/index.ts` (`eq`, `and`, `inArray`, `sql`, `count`...).
2. Port in this order: `engagement` (profiles, myList, watchHistory, reviews), `catalog` (content, rows, search, genres), `identity` (auth, refresh tokens, users, MFA), `notifications`, `playback` and `sessions`, `billing`, `assets`, `live`, `compliance`, `recommendations`, `analytics`.
3. Keep BigInt behavior: `VideoFile.size` is `bigint`. Serialize as string on the wire and add a mapper test.
4. Replace transaction code (`prisma.$transaction`) with `db.transaction`.
5. Re-run every existing test after each module. Existing tests mock Prisma; replace the mock with a repository fake, and add one integration test per module against Postgres.

**Part C: web and admin.**

1. Swap the NextAuth adapter in both apps. Keep the JWT session strategy.
2. Replace direct `prisma` calls in the 13 files with `db` queries. Prefer calling the API for anything that changes data; server components may read through `db`.
3. Add missing dependencies. Run `bun run typecheck` for both apps.

**Part D: remove Prisma completely.**

1. Delete `@prisma/client`, `prisma` and `@auth/prisma-adapter` from every `package.json` and from `trustedDependencies` and the root overrides if only Prisma needed them.
2. `grep -ri prisma` in the repo (excluding `node_modules`, `bun.lock` and this plan) returns nothing.
3. Update the Dockerfiles and `ci.yml` as listed above. Update `DEVELOPER.md`, `README.md` and `AGENTS.md` command tables (`db:push` stays for local dev only).
4. Add pitfall to [PROJECT-PITFALLS.md](../PROJECT-PITFALLS.md) after `dup-check.py`: "`db:generate` means different things in Prisma and Drizzle; an image build must never run it".

## Checks

- [ ] `packages/db/src/schema.parity.test.ts`: new baseline equals the old Prisma schema
- [ ] `packages/db/src/migrate.integration.test.ts`: migrate on empty database, idempotent second run
- [ ] `packages/db/src/baseline.test.ts`: baseline marker on a Prisma-created database, no SQL executed
- [ ] `packages/db/src/seed.test.ts`: seed against fixture creates expected rows
- [ ] `apps/api/src/modules/playback/service.test.ts` (renamed `playback.service.test.ts` by plan 02) loads and passes. It fails today because `@prisma/client` is not generated
- [ ] `apps/api` repository integration tests, one file per module
- [ ] `apps/web/src/lib/auth.test.ts` and `apps/admin/src/lib/auth.test.ts`: sign-in through the Drizzle adapter
- [ ] `bun run typecheck` passes in `@netflix/db`, `@netflix/api`, `@netflix/web`, `@netflix/admin`
- [ ] `rg -i prisma` finds nothing outside lock files and this plan
- [ ] `docker compose build api web admin` succeeds and `docker compose up` migrates a fresh database

## LEFTOVER rows this plan opens

| What                                        | Why                                   | Manual path                                                                | Status |
| ------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- | ------ |
| Existing databases need the baseline marker | Prisma recorded its own history table | Run `bun run db:baseline` once per environment                             | Open   |
| Normalize PascalCase table names            | Parity kept them to avoid a data move | Done in plan 04 together with `tenant_id`, as an explicit rename migration | Open   |
| Drizzle 1.0 beta not GA                     | API may change                        | Revisit at GA, versions pinned                                             | Open   |

## Out of scope

- `tenant_id`, RLS policies, `withTenant`, `asSystem`, the fence test (plan 04).
- Splitting `schema.ts` into a directory (plan 04).
- Changing any column type, name or default.
- New tables.

## Sources

- Drizzle ORM docs: https://orm.drizzle.team/docs/overview and the drizzle-kit pull and migrate pages.
- Auth.js Drizzle adapter: https://authjs.dev/getting-started/adapters/drizzle (verify column names before relying on it).
- Prisma 7 and 8 notes used for ADR 0009: https://www.prisma.io/docs/orm/v8 (release-candidate as of 2026-10-28, unverified GA).
- RLS pattern with transaction-local `set_config`: https://atlasgo.io/guides/orms/prisma/row-level-security
- bd-pos ADR 0006 (`~/WorkSpace/codeshipper/bd-pos/docs/adr/0006-tenancy-rls.md`).
