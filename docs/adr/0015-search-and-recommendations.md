# 15 · Search is Meilisearch per tenant; recommendations use pgvector

- Status: proposed
- Date: 2026-10-28

## Context

Search is `ILIKE` plus a live TMDB proxy. Tenants need typo-tolerant, filterable search and simple "more like this" rows.

## Decision

Meilisearch holds one index per tenant, filled by the outbox (`content.ready`, `content.updated`, `content.unpublished`). Queries filter by tenant at the index level. Embeddings for title, synopsis and genre go into `content_embedding` with pgvector for "more like this". A nightly BullMQ job computes item-to-item co-occurrence from watch history and writes recommendation rows back to Postgres under RLS. TMDB stays an enrichment source only.

## Consequences

- Search works offline from TMDB.
- A reindex job per tenant is needed after schema changes.
- Recommendation quality is modest by design.
- Typesense is the drop-in alternative if Meilisearch limits appear.

## Alternatives considered

- OpenSearch: powerful, heavy; only if log-scale analytics are needed.
- Postgres full-text only: adequate for tiny catalogs, weak typo tolerance.
- Algolia: paid.
