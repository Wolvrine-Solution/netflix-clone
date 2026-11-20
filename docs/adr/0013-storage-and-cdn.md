# 13 · Storage is S3-compatible; delivery uses origin first, CDN optional

- Status: proposed
- Date: 2026-10-28

## Context

Video egress dominates cost. The owner rule is $0 by default and no paid SKU without approval.

## Decision

All code talks S3. Dev and self-host use MinIO. Production candidates are Cloudflare R2 (10 GB free, zero egress, then $0.015 per GB-month) or Backblaze B2 ($6.95 per TB-month, free egress to Cloudflare through the Bandwidth Alliance). Bunny CDN is the optional paid delivery layer (volume network about $5 per TB) using token authentication. The CDN cache key is `tenant/asset/rendition/segment` and never varies on cookies. Cloudflare's terms restrict video on plain CDN plans; R2 delivery is used widely but the exemption is not written, so it is unverified and tracked as U1.

## Consequences

- Local and CI runs need no cloud account.
- A production delivery SKU needs an owner yes with SKU, monthly estimate and the $0 alternative (blocker B1).
- Moving between R2, B2 and MinIO is a configuration change.
- Private buckets only. Public access is never enabled.

## Alternatives considered

- AWS S3 and CloudFront: paid, egress heavy.
- Cloudflare Stream: simple, paid per minute stored and delivered.
- Serve video from the API: rejected, breaks NFR-PERF-2.
