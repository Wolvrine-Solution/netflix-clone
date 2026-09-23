# Developer Guide

## Prerequisites

- Node.js `>=22` (see `engines` in `package.json`)
- bun `1.3.x` (repo is pinned via `packageManager`)
- A PostgreSQL database (local or remote)
- A [TMDB](https://www.themoviedb.org/) API key (for seeding and live search)
- For mobile development: Expo tooling (`expo start` is invoked via bun scripts; no separate global install is required to run the dev server, but Xcode/Android Studio are needed for simulators)

## Installation

```bash
git clone <repository-url>
cd netflix-clone
bun install
```

The repo uses bun workspaces (`apps/*`, `packages/*`) orchestrated by Turborepo.

After cloning, run `pre-commit install` once to activate this repo's lint/format git hooks.

## Configuration

Copy the root environment file and fill in values:

```bash
cp .env.example .env.local
```

Variables used by the web app, admin app, and API (see `.env.example`):

| Variable                                                                             | Purpose                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `DATABASE_URL`                                                                       | PostgreSQL connection string used by Prisma                              |
| `NEXTAUTH_URL`                                                                       | Base URL of the web app (used by NextAuth)                               |
| `NEXTAUTH_SECRET`                                                                    | Secret used to sign NextAuth JWTs; also used by the API to verify tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                          | Optional Google OAuth credentials                                        |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`                                          | Optional GitHub OAuth credentials                                        |
| `TMDB_API_KEY`                                                                       | API key for The Movie Database, used for seeding and live search         |
| `TMDB_BASE_URL`                                                                      | TMDB REST API base URL                                                   |
| `TMDB_IMAGE_BASE_URL`                                                                | TMDB image CDN base URL                                                  |
| `NEXT_PUBLIC_API_URL`                                                                | URL the web app uses to reach the API server                             |
| `API_SECRET`                                                                         | Shared secret for internal API calls                                     |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional, for Stripe billing                                             |

The mobile app has its own environment file at `apps/mobile/.env.example`:

| Variable              | Purpose                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | Base URL of the API server, reachable from the device/simulator (see comments in the file for iOS simulator, Android emulator, and physical device values) |

Copy it as needed:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

Never commit `.env`, `.env.local`, or any file containing real credentials.

## Running Locally

Push the Prisma schema to your database, then seed content from TMDB:

```bash
bun run db:push
bun run db:seed
```

Start all apps in development mode:

```bash
bun run dev
```

This runs, via Turborepo:

- Web app at `http://localhost:3000` (`next dev -p 3000`)
- Admin dashboard at `http://localhost:3001` (`next dev -p 3001`)
- API server at `http://localhost:4000` (default `PORT`, overridable via the `PORT` env var; health check at `GET /health`)

To run a single app instead of everything:

```bash
bun run --filter @netflix/web dev
bun run --filter @netflix/admin dev
bun run --filter @netflix/api dev
```

For the mobile app:

```bash
bun run mobile          # expo start
bun run mobile:android  # expo start --android
bun run mobile:ios      # expo start --ios
```

Other useful commands:

```bash
bun run build           # Build all apps (turbo run build)
bun run lint            # Lint all apps
bun run typecheck       # Type-check all apps
bun run db:studio       # Open Prisma Studio
```

## Running Tests

Unit/integration tests (Vitest) exist for the web, admin, and API apps; run per app:

```bash
bun run --filter @netflix/web test
bun run --filter @netflix/admin test
bun run --filter @netflix/api test
```

The mobile app uses Jest (via `jest-expo`):

```bash
bun run --filter @netflix/mobile test
```

End-to-end tests (Playwright) exist for the web and mobile apps:

```bash
bun run --filter @netflix/web test:e2e
bun run --filter @netflix/mobile test:e2e
```

## Build/Deploy

No Dockerfile or CI workflow is present in this repository yet (planned — see `ROADMAP.md` Phase 1). Build artifacts are produced per app via Turborepo:

```bash
bun run build
```

- `apps/web` and `apps/admin` build with `next build` and start with `next start` (admin on port 3001).
- `apps/api` builds with `tsup` to `dist/index.js` and starts with `node dist/index.js`.
- `apps/mobile` builds with `expo export` (or `expo export --platform web` for a web build).

## Troubleshooting

- **API rejects requests with CORS errors:** the API's allowed origins are hardcoded in `apps/api/src/index.ts` (`localhost:3000`, `3001`, `8081`, `19006`). If you run an app on a different host/port, requests will be blocked.
- **JWT verification fails between web and API:** the API verifies NextAuth JWTs using `jose` with `NEXTAUTH_SECRET`. Ensure the web app and API use the exact same `NEXTAUTH_SECRET` value.
- **Empty catalog after setup:** the browse page reads from PostgreSQL, not TMDB directly. Run `bun run db:seed` (requires a valid `TMDB_API_KEY`) after `bun run db:push` before expecting content to appear.
