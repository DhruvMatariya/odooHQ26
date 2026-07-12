---
name: validation-and-transformation
description: Use this skill whenever writing request/response handling for a backend — validating incoming data (required fields, types, formats, business rules), coercing/normalizing input, or mapping between API DTOs, domain models, and database entities. Trigger this any time the user is defining a schema (Zod, Pydantic, class-validator, Joi), writing a POST/PUT/PATCH handler, building a form/API input pipeline, or asks for "input validation," "request validation," "sanitize input," "parse this payload," or a "production-ready" / hackathon-ready backend. Pairs with the rest-api-design skill — use both together when building full endpoints. Covers Node/TypeScript (Zod v4), Python (Pydantic v2 / FastAPI), and framework-agnostic layering that applies anywhere.
---

# Validation & Transformation

Two different jobs that get conflated constantly. Keep them conceptually separate even when the code lives in the same schema:

- **Validation** = "is this input acceptable?" — a gate that accepts or rejects, with a reason.
- **Transformation** = "what shape should this data be in?" — converting between representations (wire format ↔ domain model ↔ storage ↔ response), with no judgment about correctness.

Getting the *order* right matters more than most people think: **normalize/transform for shape before you validate for correctness**, but **validate for trust before you transform for business logic**. Concretely: trim and lowercase an email (transform) before checking it's a valid, non-taken email (validate) — otherwise `" Foo@Bar.com "` and `"foo@bar.com"` silently become two different accounts.

## How to use this skill

1. Building a new endpoint? Read section 1 (layering) first, then jump to your stack's section (2 for Node/Zod, 3 for Python/Pydantic) for copy-pasteable patterns.
2. Already have Zod or Pydantic schemas and want the deep pattern reference (async validation, discriminated unions, refine/superRefine, computed fields)? Go straight to `references/zod-patterns.md` or `references/pydantic-patterns.md`.
3. In a hackathon and need speed over ceremony? See "Hackathon mode" near the bottom — it tells you what to skip safely and what never to skip.

---

## 1. The layering model (framework-agnostic)

Every mutating endpoint should pass data through up to four distinct shapes. Skipping layers is fine in a hackathon; just know what you're skipping.

```
Wire JSON → [Input DTO / schema]  →  [Validated + normalized data]  →  [Domain/DB model]  →  [Response DTO]
             ↑ syntactic + format      ↑ business-rule validation        ↑ your ORM entity     ↑ what the
               validation lives here     + transformation lives here                             client sees
```

- **Input DTO / schema** — the shape you *accept*. Defined with Zod/Pydantic/class-validator. Catches missing fields, wrong types, bad formats (email, UUID, date) before any of your code runs.
- **Business-rule validation** — things a schema library can't check alone: uniqueness, referenced IDs existing, quantity in stock, permission to set a field. Runs after schema validation, usually in a service function, often needs the DB or auth context.
- **Domain/DB model** — your internal representation (ORM entity, internal type). Never expose this directly as a response — it usually carries fields (password hashes, internal flags, foreign keys) the client shouldn't see.
- **Response DTO** — an explicit, separate schema for what goes back out. Renames/hides/computes fields. This is where `passwordHash` gets dropped and `createdAt` gets ISO-formatted.

**The rule that prevents the most production incidents: never pass a raw domain/DB object straight into a JSON response.** Always map through an explicit response shape, even if it feels redundant for a small object today — it's the thing that stops a new column you added to the `users` table from silently appearing in an API response tomorrow.

## 2. Node / TypeScript — Zod v4

Zod v4 (the default `zod` import since mid-2025) is the standard choice for TypeScript APIs — deep ecosystem integration (tRPC, Hono, Drizzle, react-hook-form) and it infers static types directly from the schema, so you get validation and typing from one source of truth.

```ts
import { z } from "zod"; // resolves to Zod v4

// 1. Input schema — validation + light transformation together
const CreateUserInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(), // z.email(), not z.string().email(), in v4
  age: z.number().int().positive().optional(),
});

// 2. Parse at the boundary — safeParse, never bare parse, in request handlers
export function handleCreateUser(body: unknown) {
  const result = CreateUserInput.safeParse(body);
  if (!result.success) {
    return { status: 400, body: toProblemDetails(result.error) }; // see section 4
  }
  const input = result.data; // fully typed, trimmed, lowercased

  // 3. Business-rule validation (not expressible in the schema alone)
  // await assertEmailNotTaken(input.email) — throws a domain error → mapped to 409

  // 4. Map to domain/DB model, then to response DTO (see UserResponse below)
}

// 5. Response schema — separate from the input schema, controls what leaves the server
const UserResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
});
```

Key v4-specific things worth knowing (full detail in `references/zod-patterns.md`):
- Use `.safeParse()` in request handlers, not `.parse()` — you want a result object, not a thrown exception, in the hot path.
- String format validators moved to the top level in v4: `z.email()`, `z.uuid()`, `z.iso.datetime()`, not the old chained `z.string().email()` (the chained form still works but is deprecated).
- `z.prettifyError(result.error)` / `z.treeifyError(result.error)` give you structured or human-readable error output without a third-party package.
- Zod v4 is ~6.5x faster on `safeParse` and the core bundle is ~57% smaller than v3 — no reason to still be on v3 for a new project.
- Use `.transform()` for pure reshaping (string → Date, string → number) and `.refine()` / `.superRefine()` for validation that depends on the value or multiple fields (password confirmation, date-range ordering).

## 3. Python — Pydantic v2 (FastAPI)

Pydantic v2's Rust-based core is 5–50x faster than v1 and is the default for FastAPI request/response models.

```python
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from datetime import datetime

class CreateUserInput(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)
    email: str
    age: int | None = Field(default=None, gt=0)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # lets you build this straight from an ORM object

    id: str
    name: str
    email: str
    created_at: datetime
```

Key v2-specific things worth knowing (full detail in `references/pydantic-patterns.md`):
- **`ConfigDict(strict=True)` for anything sensitive** (money, IDs, auth) — by default Pydantic coerces types (`"29.99"` → `29.99`), which is convenient but can silently accept malformed input. Turn it on deliberately, not everywhere.
- **`extra="forbid"`** rejects unexpected fields instead of silently dropping them — catches client bugs and mass-assignment attempts early.
- **`@field_validator`** for single-field checks/normalization, **`@model_validator(mode="after")`** for cross-field rules (date ranges, password confirmation) — this replaces v1's `@validator`/`@root_validator`, which are gone, not just deprecated.
- **`@computed_field`** for response-only derived values (totals, counts) that aren't stored — keeps computation out of the request handler.
- FastAPI validates the input model automatically from the request body; a **separate** response model (`response_model=UserResponse` on the route) is what enforces the output shape — don't return the DB entity directly.

## 4. Consistent error shape (ties into REST API design)

Whatever stack, map validation failures to the same error envelope used across your API — RFC 9457 Problem Details (see the `rest-api-design` skill's error section) with a field-level array:

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more fields failed validation",
  "errors": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "age", "message": "must be greater than 0" }
  ]
}
```

Write one small mapper function per stack (`zodErrorToProblemDetails`, a FastAPI exception handler for `RequestValidationError`) and reuse it everywhere — don't let each endpoint format its own error body.

## 5. Common pitfalls

- **Validating in the wrong layer.** Business rules (uniqueness, stock levels, permissions) don't belong in the schema — schemas validate *shape*, services validate *state*. Trying to cram a DB lookup into a Zod `.refine()` or Pydantic validator works but tangles concerns and makes testing harder.
- **Trusting client-supplied IDs for ownership.** Validating that a field is a well-formed UUID is not the same as validating the current user is allowed to act on that ID — that's an authorization check, not input validation, and it's easy to forget once the schema "passes."
- **Returning the ORM/domain object directly.** The #1 way internal fields leak into API responses. Always map through an explicit response schema.
- **Coercion surprises.** Both Zod and Pydantic will silently convert types by default (`"3"` → `3`, `"true"` → `true`). Fine for query params, risky for money/IDs/auth fields — use strict mode there deliberately.
- **Re-validating the same data twice with slightly different rules** (once in a schema, once by hand in a service) — the two drift apart over time. Keep one source of truth per rule.

## Hackathon mode

What to keep even under time pressure (cheap, prevents the worst bugs):
- Schema-validate every request body — five minutes of setup, saves hours of "why is `undefined` in my database" debugging.
- Always use a separate response shape for anything with a password/token/internal field, even a one-liner `.omit()`/`exclude` — leaking a password hash is the one hackathon bug that's actually embarrassing, not just buggy.
- Use `safeParse`/`try+except` and return a real error status, not a 500 — judges and teammates hitting your API with bad input is guaranteed to happen live.

What's safe to skip for a hackathon:
- Full RFC 9457 error envelope — a simple `{ "error": "message" }` is fine if you're not building an ecosystem of clients.
- Strict mode / `extra=forbid` on every model — turn it on for auth/payment-adjacent endpoints, skip it elsewhere to move faster.
- Async uniqueness/business-rule validators wired elegantly into the schema layer — just check-and-throw in the handler, it's fine.

## Review checklist

- [ ] Every request body is schema-validated before touching business logic (no `req.body.foo` used raw)
- [ ] Normalization (trim/lowercase/coerce) happens before comparison/uniqueness checks
- [ ] Business-rule validation (uniqueness, ownership, stock, permissions) is separate from schema validation
- [ ] Sensitive fields (money, IDs, auth) use strict typing, not default coercion
- [ ] Every endpoint returns an explicit response DTO — never a raw ORM/domain object
- [ ] Validation errors map to one consistent error shape across the whole API
