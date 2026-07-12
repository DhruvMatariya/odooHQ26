import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.js";

// Verifies the Bearer token, attaches { id, role } to req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Unauthorized", "Missing or malformed Authorization header"));
  }
  try {
    const token = header.slice("Bearer ".length);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError(401, "Unauthorized", "Invalid or expired token"));
  }
}

// Use after requireAuth: requireRole("FLEET_MANAGER", "SAFETY_OFFICER")
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden", `Requires one of: ${roles.join(", ")}`));
    }
    next();
  };
}
