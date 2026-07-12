import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CreateFuelLogInput, CreateExpenseInput } from "../schemas/finance.schema.js";
import * as controller from "../controllers/financeController.js";

const fuelRouter = Router();
fuelRouter.use(requireAuth);
fuelRouter.get("/", asyncHandler(controller.listFuelLogs));
fuelRouter.post("/", requireRole("FLEET_MANAGER", "FINANCIAL_ANALYST"), validate(CreateFuelLogInput), asyncHandler(controller.createFuelLog));

const expenseRouter = Router();
expenseRouter.use(requireAuth);
expenseRouter.get("/", asyncHandler(controller.listExpenses));
expenseRouter.post("/", requireRole("FLEET_MANAGER", "FINANCIAL_ANALYST"), validate(CreateExpenseInput), asyncHandler(controller.createExpense));

export { fuelRouter, expenseRouter };
