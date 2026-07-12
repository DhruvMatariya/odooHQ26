import { z } from "zod";

export const CreateVehicleInput = z.object({
  registrationNumber: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.string().trim().min(1),
  maxLoadCapacity: z.number().positive(),
  odometer: z.number().nonnegative().default(0),
  acquisitionCost: z.number().nonnegative(),
});

// status is intentionally excluded — it only changes via trip/maintenance actions
export const UpdateVehicleInput = CreateVehicleInput.partial();

export const VehicleQuery = z.object({
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).optional(),
  type: z.string().optional(),
});
