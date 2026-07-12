// Generic schema-validation middleware, per the validation-and-transformation skill.
// Usage in a route file:
//   import { validate } from "../middleware/validate.js";
//   router.post("/", validate(CreateOrderInput), asyncHandler(createOrder));
//
// Validates req.body by default. Pass { source: "query" } or { source: "params" }
// for GET-style filters or route params. On success, replaces req[source] with the
// parsed/normalized data (trimmed, coerced, defaulted) so handlers only ever see
// clean data — never touch the raw req.body/query directly in a route handler.
export function validate(schema, { source = "body" } = {}) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        type: "https://api.example.com/errors/validation-failed",
        title: "Validation failed",
        status: 400,
        detail: "One or more fields failed validation",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req[source] = result.data;
    next();
  };
}
