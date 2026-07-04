# Netflix Clone

A full-stack, Netflix-style streaming platform with a web app, admin dashboard, mobile app, and REST API in a single Turborepo monorepo.

## Overview

Netflix Clone reproduces the core experience of a subscription video-streaming service: user authentication and profiles, a content catalog browsable by row/category, a video player, search, a personal watchlist, and viewing history. It targets developers who want a realistic, end-to-end reference implementation spanning a Next.js web client, an Expo/React Native mobile client, a Next.js admin dashboard for content management, and a dedicated Express API backed by PostgreSQL. Content metadata is sourced from The Movie Database (TMDB) and persisted locally so the catalog can be browsed without hitting TMDB on every request.

## Key Features

- **Authentication** via NextAuth v5 (JWT strategy), with optional Google and GitHub OAuth providers (`apps/web/src/app/(auth)`, `apps/api/src/routes/auth.ts`)
- **Multi-profile support** per account, including kid profiles (`Profile` model in `packages/db/prisma/schema.prisma`)
- **Content catalog** organized into curated rows and categories, with genres, seasons, and episodes for series (`Content`, `Row`, `Season`, `Episode` models; `apps/api/src/routes/content.ts`, `rows.ts`)
- **Server-rendered browse page** — the browse experience is a React Server Component that fetches catalog rows server-side (per `CLAUDE.md` architecture notes)
- **Video playback** using HLS.js and Video.js/React Player wrappers (`apps/web/src/components/player`)
- **Search** — combines local database queries with live TMDB search, cached for one hour (`apps/api/src/routes/search.ts`)
- **My List / watchlist** with optimistic UI updates via TanStack Query (`apps/web/src/store`, `apps/api/src/routes/myList.ts`)
- **Watch history** tracking per profile (`apps/api/src/routes/watchHistory.ts`, `WatchHistory` model)
- **Reviews and notifications** (`apps/api/src/routes/reviews.ts`, `notifications.ts`)
- **Admin dashboard** for managing users, content, genres, rows, and viewing analytics, with role-based access (`Role` enum, `apps/admin`, `apps/api/src/routes/admin`)
- **Subscription and billing scaffolding** via Stripe (`Subscription` model, `STRIPE_*` variables)
- **Mobile app** built with Expo Router and NativeWind, sharing types with the web app (`apps/mobile`)
- **Content seeding** from TMDB into PostgreSQL via a seed script (`packages/db/src/seed.ts`)

## Tech Stack

- **Monorepo tooling:** Turborepo, pnpm workspaces
- **Web app (`apps/web`):** Next.js 14 (App Router), React 18, NextAuth v5, TanStack Query, Zustand, Tailwind CSS, HLS.js, Video.js, react-player, Zod
- **Admin dashboard (`apps/admin`):** Next.js 14, NextAuth v5, TanStack Query, Recharts, Tailwind CSS
- **API (`apps/api`):** Express 4, Helmet, CORS, express-rate-limit, Morgan, `jose` (JWT verification), Stripe SDK, node-cache
- **Mobile (`apps/mobile`):** Expo (SDK 52), Expo Router, React Native 0.76, NativeWind, Zustand, TanStack Query
- **Database:** PostgreSQL via Prisma ORM (`packages/db`)
- **Shared packages:** `@netflix/ui` (shared React hooks/components), `@netflix/types` (shared TypeScript types), `@netflix/config` (shared ESLint/Tailwind/TypeScript configs)
- **Testing:** Vitest (web, admin, api), Jest + jest-expo (mobile), Playwright (web and mobile end-to-end)
- **Language:** TypeScript throughout

## Architecture

This is a Turborepo monorepo with four independently runnable apps and four shared packages. The web and admin apps are separate Next.js applications; the API is a standalone Express server that both the web app and the mobile app call over HTTP. Authentication is issued as a JWT by NextAuth in the web app and independently verified by the API server using the same `NEXTAUTH_SECRET` (via `jose`), so the API does not depend on NextAuth directly. All apps and the seed script share a single Prisma schema and client (`@netflix/db`). Catalog content is seeded once from TMDB into PostgreSQL; the browse page reads from the local database, while search additionally queries TMDB live with short-term caching.

## Repository Structure

```
apps/
  web/      Next.js 14 user-facing app (App Router) — browsing, playback, auth, search
  admin/    Next.js 14 admin dashboard — content, user, and genre management, analytics
  api/      Express REST API — auth verification, content, rows, search, my list, admin endpoints
  mobile/   Expo Router / React Native mobile app
packages/
  db/       Prisma schema, generated client, and TMDB seed script
  types/    Shared TypeScript types (content, auth, player, admin, notifications, TMDB)
  ui/       Shared React hooks (useLocalStorage, useDebounce, useOnClickOutside)
  config/   Shared ESLint, Tailwind, and TypeScript base configs
```

## Getting Started

See [DEVELOPER.md](./DEVELOPER.md) for prerequisites, installation, configuration, and run instructions.
