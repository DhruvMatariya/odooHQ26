// Wrap async route handlers so a rejected promise reaches errorHandler.js
// instead of crashing the process or hanging the request.
// Usage: router.get("/", asyncHandler(async (req, res) => { ... }));
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
