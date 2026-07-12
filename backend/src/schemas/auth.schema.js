import { z } from "zod";

export const RegisterInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]),
});

export const LoginInput = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});
