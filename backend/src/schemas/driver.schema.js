import { z } from "zod";

export const CreateDriverInput = z.object({
  name: z.string().trim().min(1),
  licenseNumber: z.string().trim().min(1),
  licenseCategory: z.string().trim().min(1),
  licenseExpiryDate: z.iso.date(),
  contactNumber: z.string().trim().min(1),
});

export const UpdateDriverInput = CreateDriverInput.partial();

export const DriverQuery = z.object({
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
});
