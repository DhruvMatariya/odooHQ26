import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CreateVehicleInput, UpdateVehicleInput, VehicleQuery } from "../schemas/vehicle.schema.js";
import * as controller from "../controllers/vehicleController.js";

const router = Router();

router.use(requireAuth);

router.get("/", validate(VehicleQuery, { source: "query" }), asyncHandler(controller.listVehicles));
router.get("/available", asyncHandler(controller.listAvailableVehicles));
router.get("/:id", asyncHandler(controller.getVehicle));

router.post("/", requireRole("FLEET_MANAGER"), validate(CreateVehicleInput), asyncHandler(controller.createVehicle));
router.patch("/:id", requireRole("FLEET_MANAGER"), validate(UpdateVehicleInput), asyncHandler(controller.updateVehicle));
router.delete("/:id", requireRole("FLEET_MANAGER"), asyncHandler(controller.retireVehicle));

export default router;
