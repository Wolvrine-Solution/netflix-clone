# Developer Guide

## Prerequisites

- Node.js `>=22` (see `engines` in `package.json`)
- pnpm `>=10` (repo is pinned to `pnpm@10.33.0` via `packageManager`)
- A PostgreSQL database (local or remote)
- A [TMDB](https://www.themoviedb.org/) API key (for seeding and live search)
- For mobile development: Expo tooling (`expo start` is invoked via pnpm scripts; no separate global install is required to run the dev server, but Xcode/Android Studio are needed for simulators)

## Installation

```bash
git clone <repository-url>
cd netflix-clone
pnpm install
```

The repo uses pnpm workspaces (`apps/*`, `packages/*`) orchestrated by Turborepo.

## Configuration

Copy the root environment file and fill in values:

```bash
cp .env.example .env.local
```

Variables used by the web app, admin app, and API (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `NEXTAUTH_URL` | Base URL of the web app (used by NextAuth) |
| `NEXTAUTH_SECRET` | Secret used to sign NextAuth JWTs; also used by the API to verify tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth credentials |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth credentials |
| `TMDB_API_KEY` | API key for The Movie Database, used for seeding and live search |
| `TMDB_BASE_URL` | TMDB REST API base URL |
| `TMDB_IMAGE_BASE_URL` | TMDB image CDN base URL |
| `NEXT_PUBLIC_API_URL` | URL the web app uses to reach the API server |
| `API_SECRET` | Shared secret for internal API calls |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional, for Stripe billing |

The mobile app has its own environment file at `apps/mobile/.env.example`:

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the API server, reachable from the device/simulator (see comments in the file for iOS simulator, Android emulator, and physical device values) |

Copy it as needed:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

Never commit `.env`, `.env.local`, or any file containing real credentials.

## Running Locally

Push the Prisma schema to your database, then seed content from TMDB:

```bash
pnpm db:push
pnpm db:seed
```

Start all apps in development mode:

```bash
pnpm dev
```

This runs, via Turborepo:
- Web app at `http://localhost:3000` (`next dev -p 3000`)
- Admin dashboard at `http://localhost:3001` (`next dev -p 3001`)
- API server at `http://localhost:4000` (default `PORT`, overridable via the `PORT` env var; health check at `GET /health`)

To run a single app instead of everything:

```bash
pnpm --filter @netflix/web dev
pnpm --filter @netflix/admin dev
pnpm --filter @netflix/api dev
```

For the mobile app:

```bash
pnpm mobile          # expo start
pnpm mobile:android  # expo start --android
pnpm mobile:ios      # expo start --ios
```

Other useful commands:

```bash
pnpm build           # Build all apps (turbo run build)
pnpm lint            # Lint all apps
pnpm typecheck       # Type-check all apps
pnpm db:studio       # Open Prisma Studio
```

## Running Tests

Unit/integration tests (Vitest) exist for the web, admin, and API apps; run per app:

```bash
pnpm --filter @netflix/web test
pnpm --filter @netflix/admin test
pnpm --filter @netflix/api test
```

The mobile app uses Jest (via `jest-expo`):

```bash
pnpm --filter @netflix/mobile test
```

End-to-end tests (Playwright) exist for the web and mobile apps:

```bash
pnpm --filter @netflix/web test:e2e
pnpm --filter @netflix/mobile test:e2e
```

## Build/Deploy

No Dockerfile or CI workflow is present in this repository. Build artifacts are produced per app via Turborepo:

```bash
pnpm build
```

- `apps/web` and `apps/admin` build with `next build` and start with `next start` (admin on port 3001).
- `apps/api` builds with `tsup` to `dist/index.js` and starts with `node dist/index.js`.
- `apps/mobile` builds with `expo export` (or `expo export --platform web` for a web build).

## Troubleshooting

- **API rejects requests with CORS errors:** the API's allowed origins are hardcoded in `apps/api/src/index.ts` (`localhost:3000`, `3001`, `8081`, `19006`). If you run an app on a different host/port, requests will be blocked.
- **JWT verification fails between web and API:** the API verifies NextAuth JWTs using `jose` with `NEXTAUTH_SECRET`. Ensure the web app and API use the exact same `NEXTAUTH_SECRET` value.
- **Empty catalog after setup:** the browse page reads from PostgreSQL, not TMDB directly. Run `pnpm db:seed` (requires a valid `TMDB_API_KEY`) after `pnpm db:push` before expecting content to appear.
