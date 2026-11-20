# Plan 01 — Fix the red baseline, then upgrade the toolchain and clients (FR-CORE-1..14)

**Goal:** make typecheck, lint and tests green on today's code, then move to Node 24, Next 16, React 19, Tailwind 4, Expo 58, Zod 4, Vitest 4 and Biome 2 with the same behavior.

**Status: not started.** Part A can start now and does not depend on plans 02 and 03. Parts B to E wait for plan 02 so the API and clients change in a sensible order.

Read first: [CONVENTIONS.md](./CONVENTIONS.md) · [ADR 0016](../adr/0016-frontend-stack.md) · [LEFTOVER_CHECKLIST.md](../LEFTOVER_CHECKLIST.md) section 1 (the measured failures) · [TDD section 3](../TDD.md).

## Decisions already made (do not reopen)

- Runtime is Node 24 LTS (Active LTS, EOL 2028-04-30). Package manager is bun. Pin `.nvmrc`, `engines` and Docker images to 24.
- Lint and format with Biome 2 (replaces ESLint 8/9 and Prettier). If plan 00 Part B already installed Biome, skip that step.
- Next.js 16.x, React 19.x, Tailwind 4, Expo SDK 58 with React Native 0.88, Zod 4, Vitest 4.
- Do not combine upgrades. One major per commit, tests green between steps.
- Web player stays `hls.js` until Phase 3 replaces it with Shaka and Video.js 10. No player work here.
- No feature work. Behavior and URLs stay the same.
- Exact versions come from `bun pm view <pkg> version` at the time of work. The versions named in this repo's docs (Next 16.4, Expo 58, RN 0.88) are from a research brief on 2026-10-28 and are re-checked in Part B. Turborepo, Biome and Playwright patch numbers are unverified (U8).

## Files by layer

**Root:** `.nvmrc`, `package.json` (`engines`, scripts, `overrides` for the Metro pins that only RN 0.76 needed), `turbo.json`, `biome.json`, remove `.prettierrc`, per-app `.eslintrc.json`, `packages/config` ESLint presets, `.pre-commit-config.yaml` hooks that call Prettier or ESLint.

**Web and admin:** `apps/{web,admin}/package.json`, `next.config.mjs`, `tailwind.config.ts` (to CSS `@theme`), `postcss.config.js`, `src/app/**` (async request APIs), `vitest.config.ts`, `vitest.setup.ts`, a `proxy.ts` replacing any `middleware.ts`.

**Mobile:** `apps/mobile/package.json`, `app.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `jest` config, `components/player/VideoPlayer.tsx`, `lib/auth.ts`, `app/(main)/watch/[contentId].tsx`, `components/layout/Navbar.tsx`, `lib/__tests__/api.test.ts`.

**Packages:** `packages/{types,ui,config,contracts}` TypeScript and Zod 4 types.

**Tests:** `apps/web/src/hooks/__tests__/useMyList.test.tsx`, `apps/web/src/store/__tests__/{useProfileStore,usePlayerStore}.test.ts`, `apps/api` tests are owned by plan 02.

## Ordered steps

**Part A: fix the baseline on the current stack (one commit).**

1. Switch to the repo's Node: `nvm use 22` (the `.nvmrc` value today) and re-run `bun run test` in `@netflix/web`. The measured failure `storage.setItem is not a function` was seen on Node 25.9, whose built-in `localStorage` global likely shadows the jsdom one. If the failures vanish on Node 22 or 24, record that, set `.nvmrc` to 24 now and add a `vitest.setup.ts` guard that installs a Storage stub. If they remain, fix the stub in `vitest.setup.ts`. The cause is unconfirmed until this step runs.
2. Web: add `jose` to `apps/web/package.json` (used in `src/lib/auth.ts`). Fix the `usePlayerStore.test.ts` argument type. Make `useMyList.test.tsx` pass (5 failing tests).
3. Admin: add `bcryptjs` and its types. The `@auth/prisma-adapter` error disappears when plan 03 Part C swaps the adapter; until then add the package or skip this error and record it.
4. API: `services/tmdbService.ts` lines 113 and 114 return objects that do not match `VideoFile[]` and `Season[]`. Fix the mapper types (plan 03 Part B replaces them with Drizzle row types, so fix minimally or do this step after plan 03).
5. Mobile: `lib/auth.ts` uses `window`; add a platform guard (`typeof window !== 'undefined'`) and the DOM lib only where needed. Fix the `ContentItem` to `ContentData` casts in `app/(main)/watch/[contentId].tsx` with a proper mapper. `expo-video`'s player has no `paused`; use `player.playing` and events. Fix the `background` style prop in `Navbar.tsx`. Guard the possibly undefined interceptor handlers in `lib/__tests__/api.test.ts`. Make `jest` run (it exits without a summary today).
6. Run `bun run typecheck && bun run lint && bun run test`. Record the results in [LEFTOVER_CHECKLIST.md](../LEFTOVER_CHECKLIST.md) section 1.

**Part B: Node 24, Zod 4, Vitest 4, Biome 2 (one commit each).**

1. Node 24 in `.nvmrc`, `engines`, Dockerfiles. Re-run all tests.
2. Biome 2: add `biome.json` (tabs, single quotes, no semicolons, 100 columns, as bd-pos), remove ESLint and Prettier packages and configs, update `.pre-commit-config.yaml` and `package.json` scripts (`lint`, `format`, `format:check`). Run `bunx biome check --write` once as its own commit.
3. Vitest 4 in api, web, admin, db; fix config breaks.
4. Zod 4 in `packages/contracts` first, then each app. Use the Zod 4 migration guide for `.email()`, error maps and `z.record`.

**Part C: web and admin to Next 16 and React 19 (one commit per app).**

1. `bunx @next/codemod@latest upgrade latest` (verify the exact codemod name in the Next 16 upgrade guide). Review the diff.
2. Async request APIs: `cookies()`, `headers()`, `params`, `searchParams` are awaited. Fix server components and route handlers.
3. Rename any `middleware.ts` to `proxy.ts` and export `proxy`.
4. Tailwind 4: replace `tailwind.config.ts` with CSS `@import "tailwindcss"` and `@theme`. Check `prettier-plugin-tailwindcss` removal (Biome sorts classes via its own rule).
5. React 19: remove `forwardRef` wrappers where possible; fix type breaks from `@types/react` 19.
6. NextAuth v5 beta: confirm it supports Next 16. Pin an exact version. If it does not, record a LEFTOVER row and stop here for the owner.
7. `next build` for both apps with `output: 'standalone'` still working.

**Part D: mobile to Expo SDK 58 (one commit).**

1. `bunx expo install expo@^58 --fix`, then `bunx expo-doctor`.
2. Remove the Metro and Babel `overrides` from the root `package.json` that only RN 0.76 needed, one at a time, and rebuild the bundle.
3. NativeWind 4 and Tailwind 4: check compatibility (unverified). If NativeWind 4 requires Tailwind 3, keep Tailwind 3 in the mobile app only and record it.
4. New Architecture is mandatory since SDK 55; fix native modules that do not support it.
5. `expo-video` stays the player (already a dependency). Confirm DRM props later in Phase 3.

**Part E: acceptance.**

1. `bun run ci` green at the root.
2. Web and mobile Playwright suites run against the compose stack.
3. Update `AGENTS.md`, `DEVELOPER.md` and `README.md` versions.

## Checks

- [ ] `bun run typecheck` passes in `@netflix/{api,web,admin,mobile,db,ui,types}` (baseline: fails in four)
- [ ] `apps/web/src/hooks/__tests__/useMyList.test.tsx` passes (baseline: 5 failures)
- [ ] `apps/web/src/store/__tests__/useProfileStore.test.ts` passes (baseline: 4 failures)
- [ ] `apps/web/src/store/__tests__/usePlayerStore.test.ts` typechecks and passes
- [ ] `apps/mobile` jest suite runs and reports a summary (baseline: does not run)
- [ ] `bunx biome check` passes at the root; no ESLint or Prettier left in any `package.json`
- [ ] `bun pm ls` shows Node 24 `engines`, Next 16.x, React 19.x, Expo ~58, Zod 4, Vitest 4
- [ ] `apps/web` and `apps/admin` `next build` succeed with `output: 'standalone'`
- [ ] `apps/mobile` `bunx expo export --platform android` succeeds
- [ ] `docker compose build web admin` succeeds
- [ ] `apps/web/e2e/features/auth-profile-switch.spec.ts` passes (reopened item R2)

## LEFTOVER rows this plan opens

| What                                           | Why                       | Manual path                                    | Status |
| ---------------------------------------------- | ------------------------- | ---------------------------------------------- | ------ |
| NextAuth v5 beta with Next 16                  | Compatibility unconfirmed | Test in Part C step 6; pin version or escalate | Open   |
| NativeWind 4 with Tailwind 4                   | Unverified                | Test in Part D step 3                          | Open   |
| Exact versions of Turborepo, Biome, Playwright | Unverified (U8)           | Record from install output                     | Open   |
| Metro/Babel overrides in root `package.json`   | Tied to RN 0.76           | Remove in Part D and rebuild                   | Open   |

## Out of scope

- Shaka, Video.js 10 and any player change (Phase 3).
- Tenant-aware theming (Phase 2). Only the Tailwind 4 syntax change happens here.
- `react-native-tvos` and TV clients (Phase 8).
- Anything in `apps/api` beyond what plan 02 and plan 03 already cover.

## Sources

- Next.js 16.4 release notes: https://nextjs.org/blog/next-16-4
- Expo SDK 58 changelog: https://expo.dev/changelog/sdk-58
- React Native blog (0.88): https://reactnative.dev/blog
- React 19.3: https://react.dev/blog
- Node release schedule: https://endoflife.date/nodejs
- Zod 4 migration: https://zod.dev/v4/versioning
- Biome: https://biomejs.dev/
- Tailwind 4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
