---
name: streaming-load-test
description: Use for load and burst testing of the streaming SaaS with k6: playback-grant bursts, HLS manifest and segment fetch scripts, multi-tenant isolation under load, thresholds and how to report results. Triggers on load test, performance, NFR-PERF, burst traffic, live event start, capacity.
---

# Streaming load test (k6)

Goal: prove the NFRs in [docs/SRS.md](../../../docs/SRS.md), not to produce big numbers. Run against the
local compose stack or a staging stack; never against someone else's service.

## What to test

| Scenario | Target (NFR) | Notes |
|---|---|---|
| Playback grant burst | p95 < 150 ms at 5k req/s, 0 errors | the live-event-start spike |
| Catalog page, anonymous | p95 TTFB < 300 ms with CDN cache headers | check `s-maxage` |
| Manifest + segment fetch | origin or CDN only; API request count stays flat | proves segments bypass the API |
| Cross-tenant isolation under load | 0 cross-tenant rows | two tenants, mixed traffic |
| Concurrent-stream cap | the (limit+1)th session gets 429 | at concurrency |

## k6 skeleton

```js
import http from 'k6/http'
import { check } from 'k6'
export const options = {
  scenarios: { burst: { executor: 'ramping-arrival-rate', startRate: 100, timeUnit: '1s',
    preAllocatedVUs: 500, maxVUs: 5000,
    stages: [{ target: 5000, duration: '30s' }, { target: 5000, duration: '2m' }] } },
  thresholds: { http_req_failed: ['rate<0.001'], 'http_req_duration{name:grant}': ['p(95)<150'] },
}
export default function () {
  const t = TENANTS[__VU % TENANTS.length]
  const r = http.post(`${__ENV.API}/v1/playback/${t.contentId}`, null,
    { headers: { Host: t.host, Authorization: `Bearer ${t.token}` }, tags: { name: 'grant' } })
  check(r, { 'grant 200': (x) => x.status === 200 || x.status === 429 })
}
```

HLS script: fetch master, pick a rendition, fetch 10 segments at real-time pace with the grant token,
tag requests by `name` so thresholds stay per endpoint.

## Rules

- Seed tenants and tokens with a script; the test never creates data through the UI.
- Keep Valkey and Postgres pooled (PgBouncer transaction mode) in the target stack, or results lie.
- Record: git SHA, stack versions, machine size, thresholds, pass or fail. Save the summary JSON in
  `docs/runbooks/load-test-<date>.md`. A threshold that was not run is not a pass (generic PITFALLS #11, #19).
- Load generators on the same machine as the system under test distort results; say so in the report.
