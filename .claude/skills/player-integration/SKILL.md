---
name: player-integration
description: Use for the video player on web, mobile and TV in the streaming SaaS. Covers Shaka Player as the engine with a Video.js 10 shell, expo-video on mobile, the QoE event contract, error taxonomy and tenant-branded controls. Triggers on player, playback UI, HLS or DASH in the client, DRM client setup, Cast, TV apps.
---

# Player integration

## Choices

| Surface | Engine and UI | Notes |
|---|---|---|
| Web | Shaka Player (HLS, DASH, EME) behind a Video.js 10 UI shell | hls.js is allowed only as a fallback for HLS-only tenants |
| iOS and Android | `expo-video` | Widevine/ClearKey on Android, FairPlay on iOS; never `expo-av` |
| Android TV, tvOS | `react-native-tvos` using ExoPlayer and AVPlayer | Phase 8 |
| Tizen, webOS | the web player in the platform web runtime | community-supported, test on devices |

## One seam, many engines

Components never import an engine. They use a `PlayerAdapter` interface:

```ts
interface PlayerAdapter {
  load(grant: PlaybackGrant, startSec: number): Promise<void>
  play(): void; pause(): void; seek(sec: number): void
  setMaxHeight(h: number | null): void
  on(event: PlayerEvent, cb: (e: PlayerEventPayload) => void): () => void
  destroy(): void
}
```

`ShakaAdapter` (web) and `ExpoVideoAdapter` (mobile) implement it. The grant comes from
`POST /v1/playback/:contentId` (see playback-security). Attach DRM or ClearKey configuration from
`grant.licenseUrl`; add the grant token as a request header through the engine's request filter.

## Behaviour rules

- Resume from `startPositionSec`; send a heartbeat every 30 s; stop it on pause, end and destroy.
- Handle a 429 from the grant endpoint with a clear "too many streams" screen, not a generic error.
- Autoplay muted only where the browser requires it; always show captions controls when tracks exist.
- Live: default to the low-latency target, offer "go to live", show slates before and after the event.
- Never put the grant token in a URL that is logged or shared; use headers or short-lived cookies.

## QoE events (all adapters emit the same shape)

`{ type, sessionId, tenantId, assetId, tsMs, positionSec, rendition, cdnHost, ...extra }` with `type` in
`startup` (ttffMs), `rebuffer` (durationMs), `bitrate_switch` (from, to), `error` (code, fatal), `end`.
Batch and POST to `/v1/telemetry` every 10 s and on `pagehide`/background using `sendBeacon` or a
queued fetch. Telemetry must never block or break playback; drop on failure.

## Error taxonomy

`GRANT_DENIED`, `STREAM_LIMIT`, `GEO_BLOCKED`, `LICENSE_FAILED`, `NETWORK`, `MEDIA_DECODE`, `UNKNOWN`. Map
engine errors to these once, in the adapter; the UI switches on the taxonomy only.

## Branding

Control colors and logo come from the tenant CSS variables (see whitelabel-theming); the player
never hardcodes brand colors.

## Tests

- Adapter contract test run against a fake engine for both adapters.
- Playwright: start playback on a local fixture manifest, assert startup event, a seek, and heartbeat calls.
