# Blento Cloudflare cost guardrails

Implemented October 12, 2026. These changes address Blento, not the expensive work in other account projects. They do **not** guarantee a $5 account bill.

## Public traffic

- Zone WAF blocks narrow secret-file, Git/development-tool and WordPress probe families. Expression: `cloudflare-probe-rule.json`. Existing `/inbox` rule remains intact. Incoming URL normalization plus recursive URL decoding cover encoded probes. No blanket dot-path or PHP-extension ban. WordPress families target root paths, so legitimate page names such as `/actor/p/wp-content` remain available.
- `hooks.server.ts` also rejects these families cheaply, before session restoration. This fallback still incurs a Worker invocation when an edge rule is bypassed.
- `/healthz` is a cheap liveness endpoint: no session, actor, database or remote API work. It is not a dependency-health check. Point external uptime monitors here rather than `/`.
- Anonymous rendered HTML uses Cache API for 60 seconds. Keys include incoming origin, effective `X-Custom-Domain`, path (actor/page), representation and Worker version (to avoid stale asset hashes after deployments). Only the two public page routes qualify. Queries, SvelteKit data/subrequests, editing/copying, cookies, authorization and ranges bypass. `Set-Cookie`, private/non-HTML responses and unexpected `Vary` are never stored. Cookie-bearing responses are explicitly private/no-store.
- Browser Cache TTL is set to respect origin headers (`0`) instead of imposing a four-hour minimum. Immutable asset caching and asset-first routing remain enabled.
- **Adapter caveat:** adapter-cloudflare's automatic URL-only cache runs before/after hooks and ignores cookie/domain eligibility. The adapter wrapper disables those generated reads/writes. The build fails closed if an adapter upgrade changes their implementation. Do not remove `scripts/disable-adapter-cache.mjs` without re-verifying this behavior.
- SWR refreshes/misses and page-render misses are coalesced **within an isolate**, with bounded maps and cleanup on failure. They are not distributed locks. Handle resolution caches success for five minutes and definitive nonexistence for one minute; transient failures are not cached as nonexistent actors.

## Screenshots and storage

- Public `GET`/`HEAD .../og-new.png` serves existing bytes only, or redirects to `/og-default.png`. Distinct anonymous URLs cannot initiate rendering.
- Owner-authorized, origin-checked `POST` requests regenerate previews. Home-page saves trigger this request; sub-page saves do not waste the home-preview budget. Legacy editor `DELETE` requests use the same bounded update path, retaining the previous image rather than deleting it first.
- D1 enforces **10 attempts per UTC day globally**, **six-hour per-actor cooldown**, and a **60-second singleton lease** across isolates. Failures count toward the budget. A stale lease token cannot release a newer lease. Quota-table/API failure fails closed. No retries or public per-request accounting writes.
- Browser API requests have a 20-second abort signal, a 15-second navigation timeout and fixed 1200×630 viewport at 1× scale. An abort is not proof of backend cancellation or an account-wide billing cap.
- Screenshot writes are awaited and attached to `waitUntil()`. Generation failure/quota exhaustion keeps the last preview available. New images must have a PNG signature and be at most 8 MiB.
- New payloads go to the private Standard R2 bucket `blento-og-images`, under `og/v1/<encoded DID>.png`. Successful updates replace one object; no timestamp-key accumulation. The `og/` prefix expires after 30 days. Multipart-abort retention remains seven days. See `cloudflare-og-lifecycle.json`.
- Existing `og:` KV images migrate on access. An atomic create-only R2 write cannot overwrite a concurrent owner update. KV deletion occurs only after durable storage exists; failed migrations leave old bytes intact. Cold keys expire under their existing 30-day TTL, so **the 841 MB historical KV footprint will not disappear immediately**. OAuth namespaces and non-image cache prefixes are untouched.
- Staging intentionally has no production image-bucket binding; it cannot spend the production screenshot budget via this route.

## Deployment and monitoring

From `apps/web`:

```sh
# One-time additive table setup; idempotent and does not touch Contrail/OAuth tables.
pnpm exec wrangler d1 execute blento-v3 --remote --file scripts/cost-guardrails.sql

pnpm check
pnpm format
pnpm lint
pnpm test
pnpm deploy

# Read-only warning report: latest three complete UTC days + KV storage snapshot peaks.
pnpm cost:report
# Optional local/CI failure on warnings (no scheduler or paid Worker was added):
pnpm cost:report --fail-on-warning
```

Production CPU limit is 5,000 ms/invocation: well above the inspected sampled maximum of 418 ms for fetch and 49 ms for scheduled work. These are sampled maxima, not proof no legitimate invocation can be slower. Watch errors and cursor progress after deployment rather than assuming the limit is harmless.

Production invocation logs are sampled at 10%; traces remain disabled. The postdeploy redaction script preserves settings and enables query-string redaction through the REST API because the installed Wrangler schema does not support that field. Use `CLOUDFLARE_API_TOKEN` in CI; locally the script reads Wrangler's OAuth credential file without printing it. Alternate profile/path: `WRANGLER_AUTH_FILE`. `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_WORKER_NAME` override the production config target.

Production `workers.dev` and version-preview URLs are disabled. Existing custom-domain routing, bindings, secrets and five-minute ingestion schedule remain intact.

The account already has CPU/request/KV-write/log/browser projection notifications and low-dollar overage notifications; no duplicate policies were added. SQL analytics automatically weight sampled `COUNT`/`SUM`; do not multiply their output by `sampleInterval` again. Full logging is not required for error/usage analytics, but reduced head sampling can still miss rare errors. Existing notification delivery and error/cursor health still need ongoing checks.

The read-only report warns at projected 24 million CPU-ms, 8 million invocations and 800 MB account KV storage. Its KV path uses GraphQL: the newer `states.kvStorage` SQL endpoint returned 503 during implementation. The report is an on-demand/local-CI warning, **not a newly installed scheduled KV email alert**. Analytics are sampled/delayed, not invoices, and invocation counts can include calls with different billing treatment.

## Verification / rollback

Completed: `pnpm check` (0 errors/warnings), `pnpm format`, `pnpm lint`, 98 passing tests, production build/deploy and postdeploy redaction. Live checks confirmed public HTML MISS→HIT, cookie-bearing HTML private/no-store, query bypass, distinct custom-domain content and a repeat-domain HIT, OAuth/discovery/health 200, plain/encoded probe 403, public screenshot fallback, anonymous screenshot POST 401, and disabled workers.dev/old preview 404. A representative legacy screenshot returned identical PNG bytes before/after repeat retrieval and its KV key disappeared only after R2 persistence. The screenshot-generation budget remained unused during public smoke checks. R2 public access is disabled; the deployed CPU limit is 5,000 ms.

The final code upload was `d324d14b-3835-4376-a489-148c678614d9`; applying query redaction creates a derived metadata version. These immediate checks do not establish a safe monthly cost projection.

Live smoke checks should show:

- Plain and encoded probes: edge 403; OAuth/discovery: still 200.
- Anonymous public HTML: MISS then HIT; a cookie/query/edit/data request must not hit that shared cache. Two custom domains must not share content.
- Public screenshot miss: redirect to the static PNG; anonymous POST: 401.
- Existing screenshots: still return PNG and migrate without browser generation.
- `/healthz`: 200; disabled production workers.dev: 404.
- Worker's settings: 10% logs, query redaction, 5,000 ms CPU, no alternate URLs.

Before implementation the active Worker version was `a56619d2-a3ec-4b16-aa96-eadd3208e141`. A full old-version rollback would reintroduce anonymous screenshot generation and unsafe adapter caching; prefer a focused fix. The additive D1 tables and private R2 bucket can remain while rolling back application changes. If old screenshot code is restored, moved KV images would be absent there and could regenerate: do not casually roll back under active crawler traffic.

Observe several complete UTC days after deployment and reconcile account-wide billing when available. Owner login/editing/save flows were unit-tested at their boundaries but still require an interactive signed-in browser check.
