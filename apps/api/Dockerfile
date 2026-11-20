FROM oven/bun:1.4 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY package.json turbo.json tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/types ./packages/types
COPY packages/config ./packages/config
RUN bun run --filter @netflix/api build

FROM oven/bun:1.4 AS runner
ENV NODE_ENV=production RUN_MIGRATIONS=true
WORKDIR /app/apps/api
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
# dist/main.js resolves migrations at ../../../packages/db/drizzle
COPY --from=builder /app/packages/db/drizzle /app/packages/db/drizzle
EXPOSE 4000
CMD ["bun", "dist/main.js"]
