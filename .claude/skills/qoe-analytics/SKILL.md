---
name: qoe-analytics
description: Use for viewing telemetry, quality-of-experience metrics and per-tenant analytics in the streaming SaaS. Covers the event schema, NATS JetStream subjects, ClickHouse tables and materialized views, retention and dashboards. Triggers on telemetry, QoE, rebuffer, startup time, analytics dashboards, ClickHouse, NATS.
---

# QoE analytics (player events → NATS → ClickHouse)

There is no open-source equivalent of Mux Data, so this pipeline is a build item. Keep it small.

```
player → POST /v1/telemetry (batch, validated) → NATS JetStream subject qoe.{tenantId}
   → consumer → ClickHouse qoe_events (MergeTree) → materialized views → dashboards / SigNoz
```

## Ingest endpoint

- Validates the batch with a Zod schema (max 100 events, max 64 KB), resolves the tenant from the
  Host header, ignores any client-sent tenant id, and publishes to `qoe.{tenantId}`. Returns 202 at once.
- Per-tenant rate limit in Valkey (token bucket). Over-limit batches are dropped with 429, never queued.
- No personal data: the session id is a random per-playback id; user ids are not sent. This keeps
  analytics VPPA-safe (no sharing of viewing history).

## ClickHouse

```sql
CREATE TABLE qoe_events (
  tenant_id FixedString(26), session_id String, asset_id String,
  ts DateTime64(3), type LowCardinality(String), position_sec Float32,
  rendition LowCardinality(String), cdn_host LowCardinality(String),
  ttff_ms UInt32 DEFAULT 0, rebuffer_ms UInt32 DEFAULT 0,
  error_code LowCardinality(String) DEFAULT '', platform LowCardinality(String)
) ENGINE = MergeTree
PARTITION BY toYYYYMM(ts) ORDER BY (tenant_id, asset_id, ts)
TTL ts + INTERVAL 90 DAY;
```

Materialized views per tenant/day/asset: p50/p95 `ttff_ms`, rebuffer ratio (`sum(rebuffer_ms)` over
watch time), error rate by code, plays, unique sessions. Always filter `tenant_id` first.

## Tenant isolation here

ClickHouse has no RLS in this setup: every query goes through one analytics repository that injects
`WHERE tenant_id = {tenantId:FixedString(26)}` as a bound parameter. No raw query is exposed to the web.
Add a test that a query for tenant B returns none of tenant A's rows.

## Operational traces vs QoE

OpenTelemetry (API, workers) goes to the Collector then SigNoz. QoE events are product data and go to
ClickHouse through NATS. Do not mix them.

## Alerts

Per tenant: error rate above 2% for 5 minutes, p95 startup above 4 s, rebuffer ratio above 1%. Fire to
the platform admin and surface in the tenant studio.
