# 17 · Deployment is docker-compose with a cloud and standalone mode

- Status: proposed
- Date: 2026-10-28

## Context

The org rule is $0 and self-hostable. We also want to sell an on-premise edition.

## Decision

One compose project with profiles (core, media, obs, dev) runs Caddy, web, admin, API, workers, Postgres with PgBouncer, Valkey, MinIO, Meilisearch, MediaMTX, NATS, ClickHouse, the OTel Collector and SigNoz. Images use `oven/bun` or Node 24 slim. `DEPLOY_MODE=cloud` is multi-tenant. `DEPLOY_MODE=standalone` runs one fixed tenant (`STANDALONE_TENANT_ID`) and activates with an Ed25519-signed licence key checked with jose. Deploys are manual `workflow_dispatch` jobs only. Terraform for AWS is kept under `infra/terraform-aws-optional/` and is not used without approval.

## Consequences

- Anyone can run the full product on one machine.
- One host has a ceiling. Scaling out means more API and worker replicas, then a separate database host.
- Backups, restore drills and OS patching are ours.
- Kubernetes is out of scope until needed.

## Alternatives considered

- Kubernetes and Helm: premature.
- Vercel for web: paid beyond hobby use and splits the stack.
- AWS ECS with Terraform: paid.
