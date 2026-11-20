# 14 · Observability is OpenTelemetry into SigNoz

- Status: proposed
- Date: 2026-10-28

## Context

Today `lib/observability.ts` only logs that an endpoint is configured. Per-tenant health and playback quality are core to a streaming SaaS.

## Decision

Instrument API, workers and apps with the OpenTelemetry SDK, export OTLP to an OTel Collector, and store traces, metrics and logs in a self-hosted SigNoz (ClickHouse backed). Every span and log carries `tenant_id` and `request_id`. pino remains the logger with PII redaction. Playback quality events (time to first frame, rebuffer, errors) travel by NATS JetStream into ClickHouse. Sentry-compatible error tracking can be GlitchTip. Load tests use k6.

## Consequences

- One store for logs, metrics and traces keeps operations small.
- ClickHouse needs memory; the observability profile in compose is optional.
- No open-source product matches Mux Data. The QoE pipeline is a build item (U5).
- Cardinality of `tenant_id` labels must be watched.

## Alternatives considered

- Grafana LGTM: more mature, four systems to run.
- HyperDX: ClickHouse based, smaller community.
- Datadog or New Relic: paid.
