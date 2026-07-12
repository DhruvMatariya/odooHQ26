# The HTTP QUERY Method (RFC 10008)

Read this file in full before implementing any search, complex-filter, or large-read-only-query endpoint.

## What it is

`QUERY` is a new HTTP request method, standardized by the IETF as **RFC 10008** (published mid-June 2026, after IESG approval in November 2025 — an eleven-year journey from first draft). It fills the actual gap in HTTP: a method that is **safe and idempotent like `GET`**, but **carries a request body like `POST`**.

```
QUERY /orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/json

{ "status": "shipped", "customerId": 42, "sort": "-createdAt" }
```

It was deliberately given a clean new method name rather than reusing `SEARCH`, `REPORT`, or `PROPFIND` (existing safe/idempotent methods from WebDAV) — the working group wanted a generic method not tied to XML/WebDAV history, and "QUERY" reads naturally against a URI's query component.

## Why it exists — the two broken alternatives it replaces

1. **`GET` with a body.** Technically possible on the wire, but never standardized: proxies, caches, and many server frameworks silently strip or reject bodies on `GET`. Not reliable in production.
2. **`POST /resource/search`.** Works everywhere, but is semantically wrong — `POST` is neither safe nor idempotent nor cacheable, so:
   - Browsers/proxies won't safely retry it on network failure.
   - HTTP caches skip it entirely (or need bespoke cache-busting logic).
   - CSRF protections designed for state-changing requests engage unnecessarily.
   - It signals "this creates/changes something" to every piece of middleware and monitoring that inspects methods, which is misleading for a pure read.

`QUERY` fixes all of this while still letting you send arbitrarily large, structured, nested filter/sort/pagination objects that don't fit cleanly in a query string.

## Key semantics from the spec

- **Safe + idempotent**, same guarantees as `GET`. Clients and intermediaries may retry it automatically on failure.
- **Cacheable** — but the cache key must include the request body/content, not just the URL. A cache that hashes or normalizes the body incorrectly opens the door to cache poisoning or cache deception, so caching layers need to be `QUERY`-aware, not just reused unmodified from `GET`/`POST` logic.
- **`Accept-Query` response header** lets a server advertise which query body formats it understands, e.g.:
  ```
  Accept-Query: "application/json", "application/x-www-form-urlencoded"
  ```
  Clients can send `OPTIONS` or `HEAD` first to discover `QUERY` support/format before committing to a full request.
- **`Content-Location` and `Location` headers** on a `QUERY` response serve distinct purposes:
  - `Content-Location: /orders/stored-results/17` — a follow-up plain `GET` retrieves the same result set without resending the query.
  - `Location: /orders/stored-queries/42` — lets the client re-run the same *query definition* later without resending the body.
- **Not a CORS-safelisted method.** Unlike simple `GET`/`POST` requests, browser JavaScript issuing `QUERY` requires a CORS preflight (`OPTIONS`) — factor this into API gateway/CORS config, it will not "just work" like `GET` does cross-origin.
- **Privacy benefit over `GET`:** because the query content lives in the body, not the URL, it avoids the sensitive-data-in-URL-logging problem that large `GET` query strings have (server access logs, browser history, proxy logs typically capture full URLs).

## Client/runtime support (as of mid-2026 — verify current state before relying on this)

- Node.js has parsed `QUERY` requests natively since early 2024, ahead of the RFC's formal publication.
- .NET 10 (LTS, released November 2025) has built-in `QUERY` support on both client (`HttpClient`) and server (ASP.NET Core minimal APIs / MVC) sides.
- OpenAPI 3.2+ can document `QUERY` operations natively in specs.
- Support is uneven elsewhere: many WAFs, older reverse proxies, load balancers, and framework versions predate the RFC and may reject, mis-route, or mis-inspect `QUERY` requests. **Do not assume `QUERY` works end-to-end through your infrastructure without testing the full path** (client → gateway/WAF → load balancer → app server → cache layer).

Before adopting `QUERY` in a given codebase, check that specific version's changelog/docs (web search `"<framework/runtime> QUERY method support"`) rather than assuming from this list — this is a fast-moving compatibility landscape.

## Security considerations to review before shipping `QUERY`

These come directly from post-RFC security analysis, since a brand-new method means older assumptions baked into infra may not have caught up yet:

- **WAF/proxy rules** written to match on `GET`/`POST`/`PUT`/`DELETE` may not recognize `QUERY` at all — audit rule sets rather than assuming coverage.
- **Cache key correctness** — any caching layer (CDN, reverse proxy, app-level cache) must include the request body in the cache key for `QUERY`, or you risk serving one user's query results to another (cache poisoning) or bypassing cache entirely in a way that looks like a bug.
- **CORS** — `QUERY` triggers preflight; confirm your CORS middleware allows the `QUERY` method explicitly, it won't be covered by "simple request" allowances.
- Treat it as safe/read-only in your own authorization logic (no side effects), but don't assume every piece of *third-party* infrastructure in the request path already treats it that way — verify.

## Decision tree

1. Can the query be expressed as simple flat key/value filters that fit comfortably in a URL (a few params, no deep nesting, well under typical URL length limits)? → **`GET` with query string.**
2. Is the query complex/nested/large (structured filter objects, multi-field sort with directions, saved-search-style payloads), and does your full request path (client, gateway, WAF, cache, server framework) support `QUERY`? → **`QUERY`.**
3. Same as above, but `QUERY` isn't yet supported somewhere in the path (legacy infra, unverified WAF/proxy behavior)? → **`POST /{resource}/search`** as a pragmatic, explicitly-named exception. Document in the API spec that it deviates from safe/idempotent semantics for this reason, and revisit once infra support catches up.
4. Never use bare `GET` with a body — unreliable across proxies/frameworks, not standardized.

## Source

RFC 10008, "The HTTP QUERY Method," IETF, June 2026. Authors: J. Reschke, A. Malhotra, J.M. Snell, M. Bishop. https://www.rfc-editor.org/info/rfc10008/
