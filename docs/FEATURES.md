# Feature registry — netflix-clone

Living list of what this app can actually do today — not a changelog, not a roadmap. One row per shipped, working feature.

**Keep this in sync:** whenever a `docs/LEFTOVER_CHECKLIST.md` item is checked off `[x]` (done, with proving tests) and it's user-facing, add a one-line row here in the same commit. See [`.cursor/rules/feature-registry.mdc`](../../.cursor/rules/feature-registry.mdc) for the full rule.

_Initial version reverse-engineered from `README.md` — 2026-07-23._

| Feature | Description |
| --- | --- |
| Authentication | Via NextAuth v5 (JWT strategy), with optional Google and GitHub OAuth providers (`apps/web/src/app/(auth)`, `apps/api/src/routes/auth.ts`) |
| Multi-profile support | Per account, including kid profiles |
| Content catalog | Organized into curated rows and categories, with genres, seasons, and episodes for series |
| Server-rendered browse page | The browse experience is a React Server Component that fetches catalog rows server-side |
| Video playback | Via a custom player: native `<video>` element with HLS.js loaded dynamically for `.m3u8` sources, progressive MP4 otherwise; falls back to a demo clip when content has no `videoUrl` |
| Search | Combines local database queries with live TMDB search, cached for one hour |
| My List / watchlist | With optimistic UI updates via TanStack Query |
| Watch history | Tracking per profile |
| Reviews and notifications |  |
| Admin dashboard | For managing users, content, genres, rows, and viewing analytics, with role-based access |
| Subscription and billing scaffolding | `Subscription` model, plan UI, and `STRIPE_*` variables exist, but no real billing is wired up yet |
| Mobile app | Built with Expo Router and NativeWind, sharing types with the web app |
| Content seeding | From TMDB into PostgreSQL via a seed script |
