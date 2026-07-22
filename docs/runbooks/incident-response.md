# Incident Response Runbook

## Severity levels

| Level | Example                     | Response time |
| ----- | --------------------------- | ------------- |
| SEV1  | Playback down for all users | 15 min        |
| SEV2  | Billing webhooks failing    | 1 hour        |
| SEV3  | Elevated API 5xx            | 4 hours       |

## Playback outage

1. Check `/ready` on API — database connectivity
2. Check Redis session registry — concurrent stream limits
3. Review CDN signed URL expiry and origin bucket health
4. Inspect QoE event spike (`QoEEvent` table / logs)

## Billing incident

1. Verify Stripe webhook signature secret matches dashboard
2. Check `StripeWebhookEvent` for duplicate processing
3. Reconcile `Subscription` rows against Stripe dashboard

## Rollback

Use CD workflow `rollback` job or redeploy previous container image tag from registry.
