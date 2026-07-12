// Throw AppError from anywhere (a service, a route) for expected business-rule
// failures — e.g. `throw new AppError(409, "Email already registered")`.
// Anything else thrown (a bug, a DB error) falls through to a generic 500 below,
// per the rest-api-design skill's status-code table and error shape (RFC 9457).
export class AppError extends Error {
  constructor(status, title, detail) {
    super(title);
    this.status = status;
    this.title = title;
    this.detail = detail;
  }
}

// Mount this LAST, after all routes, with 4 args so Express recognizes it as
// an error handler.
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      type: `https://api.example.com/errors/${err.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: err.title,
      status: err.status,
      detail: err.detail,
    });
  }

  // Unexpected error — log full detail server-side, never leak it to the client.
  console.error(err);
  res.status(500).json({
    type: "https://api.example.com/errors/internal-server-error",
    title: "Internal server error",
    status: 500,
    detail: "Something went wrong. Check server logs.",
  });
}
