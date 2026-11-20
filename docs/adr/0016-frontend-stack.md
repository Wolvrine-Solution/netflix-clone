# 16 · Frontend stack: Next.js 16, React 19, Expo 58, Shaka with Video.js 10

- Status: proposed
- Date: 2026-10-28

## Context

The repo is on Next 14, React 18 and Expo 52. White-label theming needs host-aware rendering and current player engines.

## Decision

Move to Next.js 16.4 (Cache Components, Turbopack default, `proxy.ts`), React 19.3 and Tailwind 4 on Node 24 LTS. Mobile moves to Expo SDK 58 with React Native 0.88 and `expo-video` (Widevine, PlayReady and ClearKey on Android, FairPlay on iOS). The web player uses Shaka Player 5.2 as the engine (HLS, DASH, ClearKey and all three DRMs with one API) behind the Video.js 10 UI shell (GA 2026-10-01). hls.js 1.7 remains for simple HLS. TV: `react-native-tvos` for Android TV and tvOS, a Shaka web app for Tizen and webOS. Zod 4, Vitest 4, Biome 2 and Playwright complete the toolchain. See [plans/01](../plans/01-stack-upgrade.md).

## Consequences

- Large upgrade; do it before building new features (Phase 0).
- Video.js 10 is new. Shaka stays the engine, so the shell can change without touching playback.
- Mobile carries a mandatory New Architecture since SDK 55.
- Next 16 renames middleware to `proxy.ts`.

## Alternatives considered

- Stay on Next 14: end of the line, no `proxy.ts` host handling guidance.
- Vidstack: security fixes only until 2028 (absorbed into Video.js 10).
- react-native-video: v7 stable status unverified (U3).
