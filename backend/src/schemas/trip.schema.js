import { z } from "zod";

export const CreateTripInput = z.object({
  source: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  vehicleId: z.uuid(),
  driverId: z.uuid(),
  cargoWeight: z.number().positive(),
  plannedDistance: z.number().positive(),
});

export const CompleteTripInput = z.object({
  finalOdometer: z.number().nonnegative(),
  fuelConsumed: z.number().nonnegative(),
});
