# 10 · VOD uses ffmpeg workers, Shaka Packager and CMAF

- Status: proposed
- Date: 2026-10-28

## Context

Content is currently a URL column. A streaming SaaS needs an owned pipeline: ingest, transcode, package, protect, deliver. Managed encoders bill per minute and lock us in.

## Decision

Editors upload straight to object storage with multipart presigned URLs. A BullMQ job per asset runs on stateless worker containers (the PeerTube runner idea). Workers run FFmpeg to build an ABR ladder (H.264 240p to 1080p by default; HEVC and AV1 by entitlement; per-title tuning later with VMAF), then Shaka Packager writes CMAF fMP4 with one HLS and one DASH manifest. Captions (WebVTT) and trick-play sprites are produced or validated in the same flow. Assets move UPLOADED, QUEUED, TRANSCODING, PACKAGED, READY, FAILED. Every step is idempotent: outputs are keyed by asset and attempt, and a lease timeout lets another worker retry.

## Consequences

- Linear scaling by adding workers; CPU cost is ours (self-hosted or paid VMs need approval).
- Shaka Packager had a reported cbcs subsample regression in mid-2026. Keep Bento4 as a fallback tool and pin the version.
- nginx-vod-module is unmaintained (last commit 2024) and is not used.
- Hardware transcoding is out of scope for v1.

## Alternatives considered

- Managed encoding (Mux, Cloudflare Stream, MediaConvert): quick, paid per minute, optional upgrade.
- Single-rendition MP4: no adaptive playback.
- On-the-fly packaging at the CDN: needs unmaintained tooling.
