# 1. Record architecture decisions

- Status: accepted
- Date: 2026-08-16

## Context

We need a lightweight, durable record of the significant technical decisions in this
project — why a choice was made, what was rejected, and what it commits us to — so agents
and humans opening the repo later understand the "why", not just the "what".

## Decision

We use Architecture Decision Records (MADR-lite). Each significant decision is one file
under `docs/adr/NNNN-title.md`, numbered sequentially, never edited once accepted — a
reversal is a new ADR that supersedes the old one. Keep each ADR to Context / Decision /
Consequences.

## Consequences

- One more small file per significant decision; near-zero maintenance cost.
- The decision trail is greppable and renders on GitHub.
- Superseded decisions stay visible instead of being silently overwritten.
