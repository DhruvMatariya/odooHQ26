# Zod v4 — Deep Pattern Reference

Assumes Zod v4 (the default `import { z } from "zod"` since mid-2025; `zod/v3` remains available as an explicit escape hatch if a dependency isn't ready).

## Parsing methods — pick the right one

| Method | Behavior | Use when |
|---|---|---|
| `.parse(data)` | Throws `ZodError` on failure | Startup/config validation, places an exception is genuinely appropriate |
| `.safeParse(data)` | Returns `{ success, data }` or `{ success, error }` | **Request handlers, hot paths** — no exceptions |
| `.parseAsync(data)` | Throws, awaits async refinements | Schemas with async `.refine()` |
| `.safeParseAsync(data)` | Non-throwing async version | Async validation in request handlers |

## Basic building blocks

```ts
import { z } from "zod";

z.string().min(2).max(100)
z.string().trim()               // normalize whitespace
z.string().toLowerCase()        // normalize case
z.number().int().positive()
z.boolean()
z.email()                       // top-level in v4 (was z.string().email())
z.uuid()
z.iso.date()                    // YYYY-MM-DD
z.iso.datetime()                // full ISO 8601
z.iso.duration()
z.url() / z.httpUrl()           // httpUrl() rejects malformed http(s) URLs more strictly
z.enum(["draft", "published", "archived"])
z.literal("admin")
z.array(z.string()).min(1)      // non-empty array (nonempty() was removed, use min(1))
z.record(z.string(), z.number())// v4 requires BOTH key and value schema, not just value
```

## Objects: strip vs strict vs interface

```ts
// Default z.object(): unknown keys are stripped silently
const Loose = z.object({ name: z.string() });
Loose.parse({ name: "a", extra: "b" }); // { name: "a" } — "extra" silently dropped

// Reject unknown keys explicitly — good for catching client bugs / mass-assignment
const Strict = z.object({ name: z.string() }).strict();
Strict.parse({ name: "a", extra: "b" }); // throws

// z.interface(): like z.object() but skips the "strip unknown keys" pass — faster,
// use for internal/server-to-server payloads you fully control
const Internal = z.interface({ name: z.string() });
```

## Transformation

```ts
// Pure reshaping — no validation judgment, just converts the value
const DateFromString = z.string().transform((s) => new Date(s));

// Normalize as part of the schema (transform runs after base validation)
const Email = z.email().trim().toLowerCase();

// Coercion helpers for query params / form data (always strings on the wire)
const PageParam = z.coerce.number().int().positive().default(1);
```

## Validation beyond types: refine / superRefine

```ts
// Single custom rule
const Password = z.string().min(8).refine(
  (val) => /[A-Z]/.test(val),
  { error: "Must contain an uppercase letter" }
);

// Cross-field validation — use superRefine on the object, attach error to a specific path
const SignupForm = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});
```

## Async validation (uniqueness checks, DB lookups)

Prefer keeping DB-dependent checks in your service layer, not the schema (see SKILL.md pitfalls) — but if you do want it schema-level:

```ts
const UniqueEmail = z.email().refine(
  async (email) => !(await userRepo.existsByEmail(email)),
  { error: "Email is already registered" }
);
// Must use parseAsync/safeParseAsync with any async-refined schema
const result = await CreateUserInput.safeParseAsync(body);
```

## Discriminated unions (payloads that vary by a type field)

```ts
const EmailNotification = z.object({
  channel: z.literal("email"),
  emailAddress: z.email(),
});
const SmsNotification = z.object({
  channel: z.literal("sms"),
  phoneNumber: z.string(),
});

const Notification = z.discriminatedUnion("channel", [
  EmailNotification,
  SmsNotification,
]);
```

## Error formatting for API responses

```ts
function toProblemDetails(error: z.ZodError) {
  return {
    type: "https://api.example.com/errors/validation-failed",
    title: "Validation failed",
    status: 400,
    detail: "One or more fields failed validation",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}

// Or use the built-in pretty printer for logs/debugging:
z.prettifyError(result.error); // multi-line human-readable string
z.treeifyError(result.error);  // nested object mirroring the schema shape
```

## Type inference — single source of truth

```ts
const CreateUserInput = z.object({ name: z.string(), email: z.email() });
type CreateUserInput = z.infer<typeof CreateUserInput>; // no separate interface needed
```

## v3 → v4 migration gotchas (if inheriting an older codebase)

- `z.string().email()` / `.uuid()` etc. still work but are deprecated — prefer `z.email()`, `z.uuid()`.
- `z.record(valueSchema)` (single-arg) is **removed**, not deprecated — now requires `z.record(keySchema, valueSchema)`.
- `ZodError.errors` and `.formErrors` were removed — use `.issues` and `z.treeifyError()`/`z.formatError()`.
- Error customization consolidated: `{ required_error, invalid_type_error, message }` → single `{ error: "..." }` param.
- `.nonempty()` on arrays removed — use `.min(1)`.
- `.default()` now only applies when the value is `undefined`, not `null` — check any schema relying on the old behavior.
