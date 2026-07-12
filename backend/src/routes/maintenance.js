import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CreateMaintenanceInput } from "../schemas/maintenance.schema.js";
import * as controller from "../controllers/maintenanceController.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(controller.listMaintenance));
router.post("/", requireRole("FLEET_MANAGER"), validate(CreateMaintenanceInput), asyncHandler(controller.createMaintenance));
router.post("/:id/close", requireRole("FLEET_MANAGER"), asyncHandler(controller.closeMaintenance));

export default router;
