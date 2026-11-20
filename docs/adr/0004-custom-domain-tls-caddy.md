# 4 · Custom-domain TLS uses Caddy on-demand certificates

- Status: proposed
- Date: 2026-10-28

## Context

Tenants bring their own domains. We need certificates for hosts we do not know in advance, at $0, without a per-hostname fee.

## Decision

Caddy fronts the stack with on-demand TLS. Before issuing a certificate it calls an internal `ask` endpoint on the API, which answers 200 only if the host is a verified `tenant_domain` of an active tenant. Ownership is proven by a DNS TXT record `_streamkit-challenge.<host>` and a CNAME to the edge host. A worker checks DNS with backoff. Caddy throttles issuance (about 10 per 10 seconds) and Let's Encrypt limits apply. Cloudflare for SaaS (100 hostnames free, then $0.10 per hostname per month) stays an optional paid alternative that needs owner approval.

## Consequences

- No per-hostname cost and no vendor lock-in for the default path.
- Certificate issuance for a burst of new domains can queue. The studio shows "pending TLS".
- The `ask` endpoint must be unreachable from the public internet and rate limited.
- Wildcard certificates for `*.streamkit.app` use a DNS challenge and need DNS API credentials (secrets vault).

## Alternatives considered

- Cloudflare for SaaS: simpler at scale, paid beyond 100 hostnames, ties delivery to Cloudflare terms.
- Traefik: similar capability, more configuration.
- Manual certificates: does not scale.
