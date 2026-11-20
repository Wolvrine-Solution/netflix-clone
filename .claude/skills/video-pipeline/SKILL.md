---
name: video-pipeline
description: Use for upload, transcode, packaging, captions, trick-play and asset state-machine work in the streaming SaaS. Covers the ABR ladder, ffmpeg and Shaka Packager commands, storage keys, idempotent BullMQ jobs and the asset lifecycle. Triggers on assets, renditions, HLS, DASH, CMAF, ffmpeg, workers.
---

# Video pipeline (ffmpeg workers, Shaka Packager, CMAF)

## Flow

```
presigned multipart upload → UPLOADED → job:probe → job:transcode(rendition) × N
   → job:package (CMAF HLS+DASH) → job:captions/trickplay → READY   (any step → FAILED + reason)
```

States: `UPLOADED → PROBING → TRANSCODING → PACKAGING → READY | FAILED`. Only the asset service
changes state, in one transaction with the outbox event. Workers report results; they never write
state directly.

## Storage keys

`{tenantId}/{assetId}/source/{filename}` (private, lifecycle-expire after READY if the tenant opts in),
`{tenantId}/{assetId}/{renditionId}/seg_%05d.m4s`, `.../init.mp4`, `.../master.m3u8`, `manifest.mpd`.
The CDN cache key is exactly `tenant/asset/rendition/segment`; never vary on cookie or header.

## Default ladder (H.264, entitlement `renditions.basic`)

| Rung | Size | Video kbps | Audio kbps |
|---|---|---|---|
| 240p | 426x240 | 400 | 64 |
| 360p | 640x360 | 800 | 96 |
| 480p | 854x480 | 1400 | 128 |
| 720p | 1280x720 | 2800 | 128 |
| 1080p | 1920x1080 | 5000 | 192 |

HEVC and AV1 (SVT-AV1) rungs are added only when the tenant holds `renditions.advanced`. Never upscale
above the source height. Per-title ladders are a later optimization; keep the ladder in one config module.

## ffmpeg (one rendition)

```bash
ffmpeg -hide_banner -y -i "$SRC" \
  -map 0:v:0 -map 0:a:0 \
  -c:v libx264 -preset medium -profile:v high -b:v 2800k -maxrate 3000k -bufsize 5600k \
  -vf "scale=-2:720" -g 96 -keyint_min 96 -sc_threshold 0 \
  -c:a aac -b:a 128k -ac 2 -movflags +faststart "$OUT/720p.mp4"
```

Fixed GOP (`-g`, `-keyint_min`, `-sc_threshold 0`) at 2 s so keyframes align across rungs; this is
required for clean switching. Pass argv arrays from Node (`execFile`), never a shell string built
from user input.

## Packaging (Shaka Packager)

```bash
packager \
  in=720p.mp4,stream=video,init_segment=720p/init.mp4,segment_template='720p/seg_$Number%05d$.m4s' \
  in=audio.mp4,stream=audio,init_segment=audio/init.mp4,segment_template='audio/seg_$Number%05d$.m4s' \
  --segment_duration 4 --hls_master_playlist_output master.m3u8 --mpd_output manifest.mpd
```

One CMAF output serves HLS and DASH. For AES-128 or ClearKey add `--enable_raw_key_encryption`
(keys from the playback-security flow, never logged). Shaka Packager has a known cbcs subsample
regression in 2026 releases: pin the version in the worker image and cover cbcs with a test.

## Job rules (BullMQ on Valkey)

- Job id = `{assetId}:{step}:{rendition}`; re-adding the same id is a no-op (idempotent).
- A retry replaces its output keys; it never appends. Write to a temp prefix, then rename on success.
- `attempts: 3`, exponential backoff, a failed step records `error` and moves the asset to FAILED
  only after the last attempt.
- Concurrency per worker pod is bounded by CPU count; scale by running more worker containers.
- Every payload carries `tenantId`; the job opens `withTenant` for any database write.

## Captions and trick-play

WebVTT per language, required before publish when the tenant enables `captions.required`. Trick-play:
thumbnails every 10 s into a sprite plus a WebVTT index.

## Tests

- Fixture: a 5 s synthetic clip (`ffmpeg -f lavfi -i testsrc`). Assert with `ffprobe`: rung heights,
  aligned keyframes, segment durations within 0.5 s of target.
- A retry test makes the first attempt fail midway and asserts a single set of outputs afterwards.
