# 7 · Billing has two layers behind a provider interface

- Status: proposed
- Date: 2026-10-28

## Context

Money moves twice: tenants pay the platform for a plan, and viewers pay tenants. Tenants want their own merchant relationship in a white-label product.

## Decision

Layer 1 (platform to tenant) uses Stripe Billing with our own account. Layer 2 (viewer to tenant) uses Stripe Connect with one connected account per tenant, and a bring-your-own-keys mode as a fallback for tenants who already have an account. All calls go through a `BillingProvider` interface (`createCheckout`, `cancel`, `syncSubscription`, `verifyWebhook`). A sandbox provider exists for development and is refused when `NODE_ENV=production`. Webhooks are verified against the raw body and de-duplicated by event id in `stripe_webhook_event`. A connected-account webhook is mapped to its tenant before any write.

## Consequences

- Tenants hold the merchant relationship; platform revenue share, if any, uses Connect application fees.
- Two webhook sources (platform and connected) need separate signing secrets.
- Stripe Connect onboarding adds a studio flow and compliance steps for tenants.
- Lago or Paddle can replace layer 1 later because of the interface. They are paid or hosted options and need approval.

## Alternatives considered

- Platform collects all money and pays tenants out: makes us the merchant, adds tax and liability.
- Per-tenant API keys only: works, but no platform fees and more support. Kept as the fallback mode.
