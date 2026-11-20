# 5 · Branding is data: tenant tokens rendered as CSS variables

- Status: proposed
- Date: 2026-10-28

## Context

One codebase must look different per tenant on web and mobile, with no rebuild and no per-tenant fork.

## Decision

A `tenant_branding` row holds design tokens (colors, radius, font ids), app name, media ids (logo, favicon, social image, hero), legal links, support email and default language. The web root layout fetches branding by host, injects CSS custom properties and the Tailwind 4 `@theme` reads them. The mobile app calls `/public/branding` on the tenant host at start and applies the same tokens to NativeWind. The studio validates WCAG AA contrast at save. Media goes through the `media` table to object storage. Per-tenant native builds are a Phase 8 option, not the default.

## Consequences

- Brand changes are instant and need no deploy.
- A single mobile binary means the store listing carries our name. Tenants who need their own store listing wait for Phase 8.
- Fonts are limited to an allow-list (self-hosted files) to protect performance and licensing.
- Branding payload is cached at the edge and must be small.

## Alternatives considered

- Per-tenant builds from day one: heavy CI and store review per tenant.
- Free-form CSS from tenants: security and support risk.
