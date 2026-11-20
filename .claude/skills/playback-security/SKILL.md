---
name: playback-security
description: Use for playback tokens, signed URLs, AES-128 and ClearKey, DRM add-on seams, concurrent-stream limits and geo or blackout rules in the streaming SaaS. Triggers on playback, manifest issuance, entitlements at play time, key delivery, session registry.
---

# Playback security

Protection is tiered per tenant by entitlement. The API issues a short-lived playback grant; the CDN
or origin only validates it. Segments never touch the API or the database.

| Tier | Mechanism | Entitlement |
|---|---|---|
| T0 | Signed URLs or cookie, 5-minute TTL | default |
| T1 | T0 + HLS AES-128 with rotating keys | `protection.aes` |
| T2 | T0 + ClearKey (EME) for non-premium web and mobile | `protection.clearkey` |
| T3 | Multi-DRM add-on (Widevine, FairPlay, PlayReady) through a vendor | `protection.drm` |

There is no free production DRM. T3 is a paid vendor add-on, chosen per tenant; each vendor choice
needs an explicit owner yes (no-paid-cloud). FairPlay needs an Apple certificate per legal entity, so
the tenant brings its own FPS package.

## Issuing a grant: `POST /v1/playback/:contentId`

Order matters; refuse at the first failure.

1. Resolve tenant (guard) and profile; check maturity rating for kid profiles.
2. `can(user, 'play', content)`: subscription or purchase entitlement, license window, territory
   and blackout rules.
3. Concurrent-stream registry: Valkey sorted set `t:{tenantId}:streams:{userId}` of session ids with
   heartbeat timestamps; evict entries older than 90 s; refuse with 429 and a typed error when the
   plan limit is reached.
4. Quality cap: the plan's `maxHeight` filters the master playlist.
5. Return `{ manifestUrl, token, startPositionSec, licenseUrl? }`; record a `playback_session` row.

## Signed URL

HMAC-SHA256 over `path|exp|tenantId|sessionId` with a per-tenant secret; query params `exp`, `sid`,
`sig`. Compare with `timingSafeEqual`. Reject expired and wrong-tenant tokens. Rotate tenant secrets
with a two-key overlap window. Secrets live in the environment, never in the repo or logs.

## AES-128 and ClearKey

- Key endpoint `GET /v1/keys/:assetId/:keyId` requires the grant token; returns 16 raw bytes
  (AES) or a JSON license `{keys:[{kty:'oct',k,kid}]}` (ClearKey).
- Keys are encrypted at rest with an envelope key; never log key material; responses are
  `Cache-Control: no-store`.
- Treat T1 and T2 as soft protection; say so in tenant docs. Do not claim DRM-grade security.

## Heartbeats

The player posts `POST /v1/playback/:sessionId/heartbeat` every 30 s with position. The same call
refreshes the stream-registry entry and writes watch history. Missing heartbeats free the slot.

## Tests

- Token: expired, tampered, wrong tenant, wrong path all return 403; valid passes.
- Registry: the (limit+1)th concurrent session gets 429; a session that stops heartbeating frees a slot.
- Cross-tenant: tenant B cannot fetch tenant A's key even with a valid-looking token.
- Load: the grant endpoint meets NFR-PERF-1 (see the streaming-load-test skill).
