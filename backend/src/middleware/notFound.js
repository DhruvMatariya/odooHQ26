export function notFound(req, res) {
  res.status(404).json({
    type: "https://api.example.com/errors/not-found",
    title: "Not found",
    status: 404,
    detail: `No route matches ${req.method} ${req.originalUrl}`,
  });
}
