# 12 · Live uses MediaMTX for ingest and LL-HLS

- Status: proposed
- Date: 2026-10-28

## Context

We need SRT and RTMP contribution and low-latency HLS without a paid managed live service.

## Decision

Run MediaMTX (MIT, Go; v1.21 as of 2026-10-08) as the live ingest and packaging node. A per-channel ingest key is verified by an internal API call before publishing is allowed. MediaMTX writes LL-HLS parts to the origin and an FFmpeg sidecar builds the live ladder. The API tracks event status (SCHEDULED, LIVE, ENDED, CANCELLED), geo and blackout rules at token issue, and DVR window length. When an event ends the recording is copied to storage and pushed through the VOD pipeline. If origin clustering is needed later, SRS 6 replaces MediaMTX behind the same interface.

## Consequences

- No license cost; MediaMTX has no UI, so the studio owns all controls.
- A single node is a single point of failure for live. Redundant ingest is a later task.
- Sub-second latency (WebRTC, OvenMediaEngine, AGPL) is out of scope.

## Alternatives considered

- SRS: better clustering, more complexity. Kept as the upgrade path.
- OvenMediaEngine: AGPL and sub-second latency we do not need.
- Owncast: single streamer per instance, not multi-tenant.
- AWS MediaLive or Cloudflare Stream: paid.
