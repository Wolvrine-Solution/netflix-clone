<br />
<div align="center">
  <h3 align="center">Netflix Clone</h3>

  <p align="center">
    A full-stack, Netflix-style streaming platform with a web app, admin dashboard, mobile app, and REST API in a single Turborepo monorepo
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

Netflix Clone reproduces the core experience of a subscription video-streaming service: user authentication and profiles, a content catalog browsable by row/category, a video player, search, a personal watchlist, and viewing history. It targets developers who want a realistic, end-to-end reference implementation spanning a Next.js web client, an Expo/React Native mobile client, a Next.js admin dashboard for content management, and a dedicated Express API backed by PostgreSQL. Content metadata is sourced from The Movie Database (TMDB) and persisted locally so the catalog can be browsed without hitting TMDB on every request.

Key features:

- **Authentication** via NextAuth v5 (JWT strategy), with optional Google and GitHub OAuth providers.
- **Multi-profile support** per account, including kid profiles.
- **Content catalog** organized into curated rows and categories, with genres, seasons, and episodes for series.
- **Server-rendered browse page** — a React Server Component that fetches catalog rows server-side.
- **Video playback** via a custom player: native `<video>` with HLS.js loaded dynamically for `.m3u8` sources, progressive MP4 otherwise; falls back to a demo clip when content has no `videoUrl`.
- **Search** — combines local database queries with live TMDB search, cached for one hour.
- **My List / watchlist** with optimistic UI updates via TanStack Query.
- **Watch history** tracking per profile.
- **Reviews and notifications.**
- **Admin dashboard** for managing users, content, genres, rows, and viewing analytics, with role-based access.
- **Subscription and billing scaffolding** — a `Subscription` model, plan UI, and `STRIPE_*` variables exist; the Stripe SDK is a dependency but the subscription page fakes plan changes client-side rather than calling real Stripe billing.
- **Mobile app** built with Expo Router and NativeWind, sharing types with the web app.
- **Content seeding** from TMDB into PostgreSQL via a seed script.

This is a Turborepo monorepo with four independently runnable apps and four shared packages. The web and admin apps are separate Next.js applications; the API is a standalone Express server that both the web app and the mobile app call over HTTP. Authentication is issued as a JWT by NextAuth in the web app and independently verified by the API server using the same `NEXTAUTH_SECRET` (via `jose`), so the API does not depend on NextAuth directly. Catalog content is seeded once from TMDB into PostgreSQL; the browse page reads from the local database, while search additionally queries TMDB live with short-term caching.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full current/target architecture, known gaps, and the design for running this as a real streaming service provider (VOD + live events).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* Turborepo, pnpm workspaces
* **Web (`apps/web`):** Next.js 14 (App Router), React 18, NextAuth v5, TanStack Query, Zustand, Tailwind CSS, HLS.js, Zod
* **Admin (`apps/admin`):** Next.js 14, NextAuth v5, TanStack Query, Recharts, Tailwind CSS
* **API (`apps/api`):** Express 4, Helmet, CORS, express-rate-limit, Morgan, `jose` (JWT verification), Stripe SDK, node-cache
* **Mobile (`apps/mobile`):** Expo (SDK 52), Expo Router, React Native 0.76, NativeWind, Zustand, TanStack Query
* PostgreSQL via Prisma ORM (`packages/db`)
* Shared packages: `@netflix/ui`, `@netflix/types`, `@netflix/config`
* Vitest (web, admin, api), Jest + jest-expo (mobile), Playwright (web and mobile e2e)
* TypeScript throughout

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Node.js `>=22`
* pnpm `>=10` (repo pinned to `pnpm@10.33.0` via `packageManager`)
* A PostgreSQL database (local or remote)
* A [TMDB](https://www.themoviedb.org/) API key (for seeding and live search)
* For mobile development: Xcode/Android Studio for simulators (Expo dev server needs no separate global install)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/Wolvrine-Solution/netflix-clone.git
   ```
2. Install dependencies (pnpm workspaces, orchestrated by Turborepo):
   ```sh
   pnpm install
   ```
3. Copy the env file and fill in values (see [DEVELOPER.md](./DEVELOPER.md) for the full variable reference):
   ```sh
   cp .env.example .env.local
   ```
4. Push the DB schema and seed content from TMDB:
   ```sh
   pnpm db:push
   pnpm db:seed
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

Start all apps in dev mode:
```sh
pnpm dev
```

Apps run on:
- `http://localhost:3000` — Main web app
- `http://localhost:3001` — Admin dashboard
- `http://localhost:4000` — REST API
- `http://localhost:8081` — Mobile (Expo dev server, via `pnpm mobile`)

Other common commands:
```sh
pnpm build                  # Build all apps
pnpm lint                   # Lint all apps
pnpm typecheck              # TypeCheck all apps
pnpm db:studio              # Open Prisma Studio
pnpm --filter @netflix/web dev   # Filter to a specific app
pnpm mobile:ios / pnpm mobile:android
```

See [DEVELOPER.md](./DEVELOPER.md) for full setup and configuration detail.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

[ROADMAP.md](./ROADMAP.md) tracks a phased production-readiness plan (Phase 0 hardening through Phase 7 product growth) against gaps identified in [ARCHITECTURE.md](./ARCHITECTURE.md) (G1–G12); all phases are currently checked done there. Note that despite Phase 3 (billing) being marked complete in `ROADMAP.md`, the "Key Features" section of this README and `CLAUDE.md` both still describe subscription/billing as demo-only (Stripe SDK present but not wired to real charges) — treat `ROADMAP.md` vs. actual behavior as something to verify against current code rather than assume.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

TODO — no `LICENSE` file is present in this repository and none is declared elsewhere in the project.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
