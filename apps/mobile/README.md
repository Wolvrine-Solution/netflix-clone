# @netflix/mobile

React Native (Expo) mobile app for the Netflix Clone.

## Tech Stack

- **Expo SDK 51** + expo-router (file-based navigation)
- **React Native Reanimated** — spring animations, press scaling
- **expo-blur** — glassmorphism tab bar on iOS
- **expo-linear-gradient** — cinematic hero scrims
- **expo-image** — performant image loading with transitions
- **@expo/vector-icons** (Ionicons) — icons
- **Moti** — declarative animations

## Running

```bash
# From repo root
pnpm install
pnpm --filter @netflix/mobile dev

# Or from this directory
cd apps/mobile
npx expo start
```

Open in Expo Go (scan QR), iOS Simulator, or Android Emulator.

## Design Tokens

See `theme.ts` for all colors, spacing, radii, typography, and shadow presets. Every screen and component imports from this file to stay consistent.

## Mock Data

`lib/mockData.ts` provides TMDB-style Title objects with picsum.photos poster/backdrop URLs. Swap in real API calls once the backend is wired up.

## Structure

```
app/
  _layout.tsx        — Root stack, safe-area provider, gesture handler
  (tabs)/
    _layout.tsx      — Glassy bottom tab bar (5 tabs)
    index.tsx        — Home: Hero + content rows
    search.tsx       — Search with genre filters + grid
    new.tsx          — New & Hot vertical feed
    list.tsx         — My List grid
    profile.tsx      — Profile & settings
components/
  Hero.tsx           — Full-bleed hero with gradient scrims + CTA buttons
  ContentRow.tsx     — Horizontal scrollable row
  PosterCard.tsx     — Poster card with press animation + progress bar
  Top10Row.tsx       — Top 10 ranking row with big overlay numbers
  SectionHeader.tsx  — Row title with optional See All link
lib/
  mockData.ts        — Mock titles (no API needed)
theme.ts             — Design tokens
```
