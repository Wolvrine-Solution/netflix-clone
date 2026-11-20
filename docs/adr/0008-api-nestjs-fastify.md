# 8 · The API is NestJS 11 on Fastify with nestjs-zod and OpenAPI

- Status: accepted
- Date: 2026-10-28

## Context

The current API is Express 4 with route files and middleware, 71 source files and 16 test files. It needs tenant guards, sealed modules and an OpenAPI contract. The owner chose to port to NestJS (decision D1, 2026-10-28). bd-pos already uses NestJS 11 with Fastify, so its guards, providers and lint rules can be reused.

## Decision

Use NestJS 11 on the Fastify adapter. Validation uses Zod 4 through nestjs-zod, which also feeds OpenAPI via @nestjs/swagger. Each module has `controller`, `service`, `repository`, `dto`, `module` and `index` files. Only `index.ts` is importable from outside a module, enforced by a dependency-cruiser rule. Drizzle appears only in repositories (ADR 0009). Global providers: `TenantGuard`, `AuthGuard`, `PermissionGuard`, request ID, pino logging, OpenTelemetry interceptor, problem-details error filter and a rate limiter. Existing paths and payloads stay the same so web, admin and mobile keep working.

## Consequences

- bd-pos code (tenant guard, route markers, permission guard, billing provider, support-session provider) can be copied with small changes.
- Enforced module boundaries help a cheaper model write code safely.
- More boilerplate than Hono and a heavier framework. Fastify keeps the HTTP layer fast.
- REST plus OpenAPI keeps web, admin and mobile call sites mostly unchanged. A typed RPC client (oRPC) would have forced every client call to change.
- Express and its middleware are removed. Business logic in `modules/*/service.ts` is kept and adapted to take tenant context.

## Alternatives considered

- Hono with oRPC: smaller, edge capable, good end-to-end types. Rejected for this repo because it rewrites guards instead of reusing bd-pos and changes every client call. Edge runtime is not needed since the API depends on Postgres, Valkey, BullMQ and ffmpeg workers.
- Stay on Express 4: no module enforcement, v4 is in maintenance.
- Fastify alone: fine, but no DI or structure for a team of one plus a cheaper model.
