---
name: logging
description: How to add a log line, a log event or a redaction path in the streaming SaaS API and workers. Pino via nestjs-pino with structured bindings, tenant context carried automatically, OpenTelemetry trace ids, and a never-log list. Use when adding logging, tracing a flow, or replacing a console call.
---

# Logging

Adapted from the bd-pos `logging` skill, trimmed to what this repo needs. The server logger is
pino through `nestjs-pino` (target API). The Express API today already uses pino; keep its call
shape so the port is mechanical.

## The rules

1. **Bindings first, message second.** `logger.info({ event, ...fields }, 'message')`. A line with
   no structured fields cannot be filtered.
2. **`event` is a stable dotted name** (`asset.transcode.failed`, `playback.grant.denied`). Keep the
   list in `packages/logging/events.ts` once that package exists, so names stay consistent.
3. **Field names are shared**, not invented per call site: `tenantId`, `userId`, `assetId`,
   `sessionId`, `requestId`, `durationMs`, `err`. Two spellings of one idea split a tenant's history.
4. **Errors go in `err`.** `logger.error({ event: 'asset.package.failed', err }, '...')`; never a
   stringified error.
5. **No `console.*`** outside tests and scripts, and never `@nestjs/common`'s `Logger`.
6. **Never log a value you would not paste into a ticket.**

## Server (NestJS target)

```ts
@Injectable()
export class PlaybackService {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    this.logger.setContext(PlaybackService.name)
  }
  grant(...) {
    this.logger.info({ event: 'playback.grant.issued', assetId, plan }, 'grant issued')
  }
}
```

`tenantId`, `userId`, `requestId` and `trace_id` are attached once per request by the tenant guard
and carried through `AsyncLocalStorage`; never pass them by hand. Workers open their own context
from the job payload (`tenantId`, `assetId`, `jobId`).

## What not to log

Passwords, tokens, session cookies, playback grant tokens, signed-URL signatures, AES or ClearKey key
material, DRM license payloads, card data, viewer emails, request bodies. Redact at the logger
(`redact` paths) as a backstop, not as permission.

## Levels

`error` only for something that needs a human. `warn` for degraded but handled (provider slow,
retry). `info` for business events. `debug` is off in production.

## Traces

OpenTelemetry spans wrap HTTP requests, queue jobs and external calls; the log line carries
`trace_id` so a log links to its trace in SigNoz. Viewer QoE events are not logs: see the
`qoe-analytics` skill.

## Testing a log line

Build the logger with an in-memory stream in the test, run the code, and assert on the parsed line
(`event`, `tenantId`, absence of secrets). A redaction test must plant a real secret and prove it is
absent from the output (generic PITFALLS #20).
