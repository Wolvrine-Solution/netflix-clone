# Secrets management

Org rule (hub `env-secret-sync`): real secrets are committed once, in plaintext, in the private
hub vault at `secrets/netflix-clone/<path>`. This repo keeps `.env` gitignored and ships only
`.env.example` with non-empty placeholders.

- Changed or added a secret: run `bun run secrets:collect` in the hub, commit, push, same session.
- New machine: `scripts/bootstrap-env.sh` in the hub restores them; `bun run sync` does it after pulls.
- Production on the self-hosted compose stack reads `.env` restored from the vault.
- AWS Secrets Manager or Kubernetes External Secrets only if the optional AWS stack is approved.
