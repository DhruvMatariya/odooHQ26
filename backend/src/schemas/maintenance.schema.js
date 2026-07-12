import { z } from "zod";

export const CreateMaintenanceInput = z.object({
  vehicleId: z.uuid(),
  description: z.string().trim().min(1),
  cost: z.number().nonnegative(),
});
