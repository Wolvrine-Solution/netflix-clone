# Local stack — the project is standalone, the machine stays clean

Rule (kit `local-stack`, project numbers below): a fresh clone runs with `docker compose up -d`,
`bun install` and one dev command. No export, no hosts-file edit, no system service.

- Backing services (Postgres, Valkey or Redis, MinIO, and later Meilisearch, NATS, ClickHouse,
  MediaMTX) run as containers in this repo's `docker-compose.yml`. Pin exact tags, never `latest`;
  `pull_policy: missing`; pin `name:`.
- Current ports (compose today): Postgres 5432, Redis 6379, MinIO 9000/9001, API 4000, web 3000,
  admin 3001, Expo 8081. Move them off the defaults when a collision shows up, and keep the
  numbers in `.env.example` so compose and apps read the same values.
- Configuration is a committed `.env.example` with non-empty placeholders. Real values live in
  the gitignored `.env` and in the hub `secrets/netflix-clone/` vault. No doc tells the reader to
  `export` anything.
- No paid cloud for local work, ever (`no-paid-cloud`).
