# Netflix Clone — Monorepo

Full Netflix-style streaming application built with Turborepo + pnpm workspaces.

## Quick Start

```bash
# Install all dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env.local

# Push DB schema (requires DATABASE_URL)
pnpm db:push

# Seed content from TMDB (requires TMDB_API_KEY)
pnpm db:seed

# Start all apps in dev mode
pnpm dev
```

**Apps run on:**
- `http://localhost:3000` — Main web app
- `http://localhost:3001` — Admin dashboard
- `http://localhost:4000` — REST API
- `http://localhost:8081` — Mobile (Expo dev server, via `pnpm mobile`)

## Workspace Structure

```
apps/
  web/    — Next.js 14 user-facing app (App Router)
  api/    — Express REST API
  admin/  — Next.js 14 admin dashboard
  mobile/ — Expo Router / React Native app (own env: apps/mobile/.env.example)
packages/
  ui/     — Shared React components
  types/  — Shared TypeScript types
  db/     — Prisma schema + client singleton
  config/ — Shared ESLint, Tailwind, TS configs
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL (default: `http://localhost:3000`) |
| `TMDB_API_KEY` | Get free key at themoviedb.org |
| `GOOGLE_CLIENT_ID/SECRET` | Optional — Google OAuth |
| `GITHUB_CLIENT_ID/SECRET` | Optional — GitHub OAuth |
| `NEXT_PUBLIC_API_URL` | API URL (default: `http://localhost:4000`) |

## Common Commands

```bash
pnpm dev                    # Start all apps
pnpm build                  # Build all apps
pnpm lint                   # Lint all apps
pnpm typecheck              # TypeCheck all apps
pnpm db:push                # Sync Prisma schema to DB
pnpm db:seed                # Seed content from TMDB
pnpm db:studio              # Open Prisma Studio

# Filter to specific app
pnpm --filter @netflix/web dev
pnpm --filter @netflix/api dev

# Mobile
pnpm mobile                 # expo start
pnpm mobile:ios / mobile:android
```

## Architecture Notes

- **Browse page** is a React Server Component — fetches all rows server-side, zero client JS for data fetching
- **Auth** uses NextAuth v5 with JWT strategy; token embeds `userId` for the API server to verify
- **API server** validates JWT using `jose` with the same `NEXTAUTH_SECRET`
- **Zustand stores**: `useModalStore` (modal open/close), `useProfileStore` (active profile, persisted to localStorage), `usePlayerStore` (player state)
- **My List** uses TanStack Query optimistic updates — UI updates instantly, rolls back on API error
- **Video player** uses a public domain `.mp4` as demo source. Replace `DEMO_SRC` in `VideoPlayer.tsx` with your actual HLS stream URL
- **TMDB data** is seeded into the DB once via `pnpm db:seed`. Browse page reads from DB (fast). Search also hits TMDB live with 1h caching in the API server
- **Mobile auth** doesn't use NextAuth — it calls `POST /api/auth/signin` on the Express API, which issues its own 30-day HS256 JWT (stored in SecureStore)
- **Subscription/billing is demo-only** — Stripe is a dependency but not wired up; the subscription page fakes plan changes client-side

See `ARCHITECTURE.md` for the full current/target architecture and `ROADMAP.md` for the production-readiness plan.
