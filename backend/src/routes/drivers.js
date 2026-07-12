import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CreateDriverInput, UpdateDriverInput, DriverQuery } from "../schemas/driver.schema.js";
import * as controller from "../controllers/driverController.js";

const router = Router();

router.use(requireAuth);

router.get("/", validate(DriverQuery, { source: "query" }), asyncHandler(controller.listDrivers));
router.get("/available", asyncHandler(controller.listAvailableDrivers));
router.get("/:id", asyncHandler(controller.getDriver));

router.post("/", requireRole("FLEET_MANAGER"), validate(CreateDriverInput), asyncHandler(controller.createDriver));
router.patch("/:id", requireRole("FLEET_MANAGER"), validate(UpdateDriverInput), asyncHandler(controller.updateDriver));
router.post("/:id/suspend", requireRole("SAFETY_OFFICER"), asyncHandler(controller.suspendDriver));

export default router;
