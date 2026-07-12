import { Router } from "express";
import health from "./health.js";
import auth from "./auth.js";
import vehicles from "./vehicles.js";
import drivers from "./drivers.js";
import trips from "./trips.js";
import maintenance from "./maintenance.js";
import { fuelRouter, expenseRouter } from "./finance.js";
import dashboard from "./dashboard.js";

const router = Router();

router.use("/health", health);
router.use("/auth", auth);
router.use("/vehicles", vehicles);
router.use("/drivers", drivers);
router.use("/trips", trips);
router.use("/maintenance", maintenance);
router.use("/fuel-logs", fuelRouter);
router.use("/expenses", expenseRouter);
router.use("/dashboard", dashboard);

export default router;
