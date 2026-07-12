import { z } from "zod";

export const CreateFuelLogInput = z.object({
  vehicleId: z.uuid(),
  liters: z.number().positive(),
  cost: z.number().nonnegative(),
  date: z.iso.datetime().optional(),
});

export const CreateExpenseInput = z.object({
  vehicleId: z.uuid(),
  type: z.enum(["TOLL", "OTHER"]),
  amount: z.number().nonnegative(),
  date: z.iso.datetime().optional(),
});
