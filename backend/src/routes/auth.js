import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RegisterInput, LoginInput } from "../schemas/auth.schema.js";
import { register, login, me } from "../controllers/authController.js";

const router = Router();
 
router.post("/register", validate(RegisterInput), asyncHandler(register));
router.post("/login", validate(LoginInput), asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
