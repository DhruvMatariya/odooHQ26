import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CreateTripInput, CompleteTripInput } from "../schemas/trip.schema.js";
import * as controller from "../controllers/tripController.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(controller.listTrips));
router.post("/", requireRole("DRIVER", "FLEET_MANAGER"), validate(CreateTripInput), asyncHandler(controller.createTrip));
router.post("/:id/dispatch", requireRole("DRIVER", "FLEET_MANAGER"), asyncHandler(controller.dispatchTrip));
router.post("/:id/complete", requireRole("DRIVER", "FLEET_MANAGER"), validate(CompleteTripInput), asyncHandler(controller.completeTrip));
router.post("/:id/cancel", requireRole("DRIVER", "FLEET_MANAGER"), asyncHandler(controller.cancelTrip));

export default router;
