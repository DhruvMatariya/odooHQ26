import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/dashboardController.js";

const router = Router();

router.use(requireAuth);
router.get("/kpis", asyncHandler(controller.getKpis));

export default router;
