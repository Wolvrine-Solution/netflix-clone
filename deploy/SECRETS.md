# Secrets management (production)

Do not commit `.env` files in production. Inject secrets from:

- **AWS Secrets Manager** — `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_*`, `CDN_SIGNING_SECRET`
- **Kubernetes External Secrets** — sync from Secrets Manager to pod env
- **Terraform** — outputs connection strings to secret store, never to git

Local development uses `.env` (gitignored) or `docker-compose.yml` defaults.
