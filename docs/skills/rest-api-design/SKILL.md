---
name: rest-api-design
description: Use this skill whenever designing, building, reviewing, or refactoring a REST API — new endpoints, resource models, URL/route structure, HTTP method choice, status codes, pagination, filtering, versioning, error responses, idempotency, or search/query endpoints. Trigger this proactively any time the user is writing backend route handlers, an OpenAPI spec, an API controller, or asks for a "production-grade" / "production-ready" API, even if they don't say "REST" explicitly. Also trigger when the user needs a search or complex-filter endpoint (POST /search anti-pattern), since this skill covers the new HTTP QUERY method (RFC 10008) as the correct fix. Covers Node/Express, Go, Python/FastAPI, and generic conventions.
---

# Production-Grade REST API Design

A checklist-driven skill for designing REST APIs that don't need to be redesigned in six months. Use this as a review lens on existing code and as a generation guide for new endpoints. When in doubt, prefer boring, predictable, well-documented conventions over clever ones — consistency across an API matters more than any single "correct" choice.

## How to use this skill

1. **New API / new resource** → walk through sections 1–7 in order before writing route handlers.
2. **Reviewing existing code** → run the "Review checklist" at the bottom against the diff.
3. **Search/filter endpoint that needs a body** → jump straight to section 3 (HTTP methods) and `references/http-query-method.md`.
4. **Don't re-derive conventions per endpoint.** Pick the pattern once for the whole API (pagination style, error shape, versioning scheme) and apply it uniformly. Inconsistency between endpoints is the most common production API smell.

---

## 1. Resource modeling & URL structure

- Model **nouns, not verbs**. `/orders`, not `/getOrders` or `/createOrder`.
- Use **plural nouns** for collections: `/users`, `/users/{id}`, `/users/{id}/orders`.
- Nest only one level deep for ownership; beyond that, use top-level resources with filters: prefer `/orders?customerId=42` over `/customers/42/orders/items/9/lines`.
- Lowercase, hyphenated paths (`/order-items`, not `/orderItems` or `/order_items`).
- No trailing slashes; no file extensions in paths (`.json` etc.).
- Actions that don't map to CRUD on a resource (e.g. "send password reset email") are modeled as a sub-resource verb-noun, not a verb on the resource: `POST /users/{id}/password-reset-emails`, not `POST /users/{id}/resetPassword`.

## 2. Choosing status codes

| Situation | Code |
|---|---|
| Successful GET/PUT/PATCH | `200 OK` |
| Successful POST that creates a resource | `201 Created` + `Location` header |
| Successful POST that doesn't create a resource (e.g. triggers a process) | `200 OK` or `202 Accepted` |
| Successful DELETE | `204 No Content` |
| Async/queued work accepted but not done | `202 Accepted` |
| Client sent malformed request (bad JSON, wrong types) | `400 Bad Request` |
| Authentication missing/invalid | `401 Unauthorized` |
| Authenticated but not allowed | `403 Forbidden` |
| Resource doesn't exist | `404 Not Found` |
| Method not allowed on this resource | `405 Method Not Allowed` |
| Semantically valid request, fails business rules (e.g. duplicate email) | `409 Conflict` or `422 Unprocessable Content` |
| Rate limited | `429 Too Many Requests` + `Retry-After` header |
| Unhandled server error | `500 Internal Server Error` |
| Upstream dependency failed | `502`/`503`/`504` as appropriate |

Never return `200 OK` with an error payload in the body — status codes are part of the contract and let clients/proxies/caches branch correctly without parsing the body.

## 3. Choosing the HTTP method

| Method | Safe? | Idempotent? | Has body? | Use for |
|---|---|---|---|---|
| `GET` | Yes | Yes | No | Fetch a resource/collection by URL + simple query params |
| `QUERY` (RFC 10008, new) | Yes | Yes | Yes | Complex/large read-only queries that don't fit in a URL — see below |
| `POST` | No | No | Yes | Create a resource, or trigger a non-idempotent action |
| `PUT` | No | Yes | Yes | Full replace of a resource at a known URL |
| `PATCH` | No | No* | Yes | Partial update |
| `DELETE` | No | Yes | Usually no | Remove a resource |

**The `POST /search` anti-pattern:** the most common REST design smell is a search/filter endpoint implemented as `POST /orders/search` because `GET` can't carry a body and the filter object is too big or nested for query params. This works but is semantically wrong: `POST` is neither safe nor idempotent nor cacheable, so proxies, browsers, and HTTP caches all treat it conservatively (no caching, no safe-retry, CSRF protections engage where they shouldn't need to).

**Use `QUERY` instead when available in your stack.** `QUERY` is a real, standardized HTTP method (RFC 10008, published by IETF in June 2026) built exactly for this: it is safe and idempotent like `GET`, but carries a request body like `POST`.

```
QUERY /orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/json

{ "status": "shipped", "customerId": 42, "sort": "-createdAt", "page": 2 }
```

Full details — caching semantics, `Accept-Query` header, client/framework support, security considerations, and a decision tree for `QUERY` vs `GET` vs `POST /search` — are in `references/http-query-method.md`. **Read that file before implementing any search/filter/complex-read endpoint.** If the target runtime doesn't support `QUERY` yet, fall back to `POST /{resource}/search` explicitly named as a search action (not a bare `POST /{resource}`) and document that it's a pragmatic exception to safe/idempotent semantics.

*`PATCH` is idempotent when the payload is a full replacement of specific fields (JSON Merge Patch), but not when it's an operation like "increment counter." Document which semantics your `PATCH` uses.

## 4. Pagination, filtering, sorting

- **Never return unbounded collections.** Default + max page size, always.
- Prefer **cursor-based pagination** (`?cursor=abc123&limit=50`) for anything that can grow or mutate between requests; offset-based (`?page=2&limit=50`) is fine for small, stable datasets and is easier for clients to jump around in.
- Return pagination metadata in the response, not just headers, so clients don't have to special-case: `{ "data": [...], "meta": { "nextCursor": "...", "hasMore": true } }`.
- Filtering: `?status=shipped&customerId=42` for simple flat filters. For nested/complex filters, don't invent a bespoke query language in query-string form — use `QUERY` with a JSON body instead (see section 3).
- Sorting: `?sort=-createdAt,name` (leading `-` for descending) is a common, learnable convention.
- Sparse fieldsets for large resources: `?fields=id,name,email`.

## 5. Versioning

- Version the API, not individual endpoints. Pick one strategy and apply it everywhere:
  - **URL path** (`/v1/orders`) — most visible, easiest to route/cache/debug, most common in practice. Default recommendation unless the team has a strong reason otherwise.
  - **Header** (`Accept: application/vnd.example.v1+json`) — cleaner URLs, harder to explore/debug/curl.
- Only bump the major version for breaking changes (removed fields, changed types, changed semantics). Additive changes (new optional fields, new endpoints) don't need a version bump.
- Support at most 2 versions concurrently in production; publish a deprecation date and `Deprecation`/`Sunset` headers (RFC 8594) on the old version's responses.

## 6. Error responses

Use one consistent error shape across every endpoint. A widely-adopted, ready-made standard is **RFC 9457 (Problem Details for HTTP APIs)** — don't invent your own error envelope:

```json
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Insufficient funds",
  "status": 409,
  "detail": "Account 42 has balance 12.50, which is less than the requested 50.00",
  "instance": "/accounts/42/withdrawals/8821"
}
```

- `type` is a stable, dereferenceable identifier for the error category (clients can branch on it); `title` is a fixed human summary; `detail` is instance-specific.
- For validation errors, extend with a field-level array (e.g. `"errors": [{"field": "email", "message": "must be a valid email"}]`) — this is a common, compatible extension of RFC 9457.
- Never leak stack traces, SQL, or internal exception messages in `detail` for `5xx` responses.
- Set `Content-Type: application/problem+json` on error responses.

## 7. Idempotency, caching, and safety

- For `POST` endpoints that create resources and might be retried by flaky clients (payments, orders), support an `Idempotency-Key` request header: store the key with the response for a time window, and replay the stored response instead of re-executing on retry.
- `GET` and `QUERY` responses should set proper caching headers (`Cache-Control`, `ETag`, `Last-Modified`) — don't leave caching to accident. Note `QUERY`'s cache key must include the request body, not just the URL (see reference doc).
- `PUT` must be a full, idempotent replace — calling it twice with the same body must produce the same state. If your "update" isn't naturally idempotent, it's a `PATCH` or a `POST` action, not a `PUT`.
- Use `ETag` + `If-Match` for optimistic concurrency control on updates to avoid lost-update races.

## 8. Auth, rate limiting, and docs (baseline expectations)

- Authn via `Authorization: Bearer <token>` (OAuth2/JWT) for user-facing APIs, or signed API keys for service-to-service. Never accept credentials in query params (they end up in logs).
- Rate limit and return `429` + `Retry-After` + `X-RateLimit-Limit`/`X-RateLimit-Remaining` headers.
- Every endpoint should be described in an **OpenAPI 3.x spec** kept in the repo and generated/validated as part of CI, not hand-written docs that drift. OpenAPI 3.2+ can document the `QUERY` method natively.

---

## Review checklist (apply to any endpoint being added/changed)

- [ ] URL is a noun-based resource path, plural collection, no verbs
- [ ] HTTP method matches the semantics table in section 3 (especially: no `POST /search` if `QUERY` is available)
- [ ] Status code matches the table in section 2, including on error paths
- [ ] Error body follows the RFC 9457 problem+json shape
- [ ] Collections are paginated with a documented default/max page size
- [ ] Filtering/sorting follows the project's existing convention, not a new one-off
- [ ] Versioning strategy matches the rest of the API
- [ ] Mutating endpoints that could be retried have an idempotency story
- [ ] Auth applied, no secrets in query strings or logs
- [ ] OpenAPI spec updated in the same change
