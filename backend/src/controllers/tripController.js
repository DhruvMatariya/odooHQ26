import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listTrips(req, res) {
  const { status } = req.query;
  const trips = await prisma.trip.findMany({
    where: { ...(status && { status }) },
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(trips);
}

// Create — DRAFT. All the "can this trip even happen" business rules live here,
// checked once at creation so dispatch doesn't have to re-derive them.
export async function createTrip(req, res) {
  const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError(404, "Not found", "Vehicle does not exist");
  if (vehicle.status !== "AVAILABLE") {
    throw new AppError(409, "Vehicle unavailable", `Vehicle is ${vehicle.status}, not AVAILABLE`);
  }
  if (cargoWeight > vehicle.maxLoadCapacity) {
    return res.status(400).json({
      type: "https://api/errors/validation-failed",
      title: "Validation failed",
      status: 400,
      detail: "Cargo weight exceeds vehicle capacity",
      errors: [{ field: "cargoWeight", message: `exceeds max load capacity of ${vehicle.maxLoadCapacity}` }],
    });
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new AppError(404, "Not found", "Driver does not exist");
  if (driver.status !== "AVAILABLE") {
    throw new AppError(409, "Driver unavailable", `Driver is ${driver.status}, not AVAILABLE`);
  }
  if (driver.licenseExpiryDate < new Date()) {
    throw new AppError(409, "License expired", "Driver's license has expired");
  }

  const trip = await prisma.trip.create({
    data: { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status: "DRAFT" },
  });
  res.status(201).json(trip);
}

// Dispatch — DRAFT -> DISPATCHED. Re-checks availability (race guard: two trips
// could be created against the same vehicle before either dispatches) and flips
// vehicle + driver to ON_TRIP in one transaction so they can't half-apply.
export async function dispatchTrip(req, res) {
  const trip = await prisma.$transaction(async (tx) => {
    const existing = await tx.trip.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Not found", "Trip does not exist");
    if (existing.status !== "DRAFT") {
      throw new AppError(409, "Invalid trip state", `Trip is ${existing.status}, not DRAFT`);
    }

    const vehicle = await tx.vehicle.findUnique({ where: { id: existing.vehicleId } });
    const driver = await tx.driver.findUnique({ where: { id: existing.driverId } });
    if (vehicle.status !== "AVAILABLE" || driver.status !== "AVAILABLE") {
      throw new AppError(409, "No longer available", "Vehicle or driver was assigned elsewhere in the meantime");
    }

    await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "ON_TRIP" } });
    await tx.driver.update({ where: { id: driver.id }, data: { status: "ON_TRIP" } });
    return tx.trip.update({
      where: { id: existing.id },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
    });
  });
  res.json(trip);
}

// Complete — DISPATCHED -> COMPLETED. Records final odometer/fuel, frees both
// vehicle and driver back to AVAILABLE.
export async function completeTrip(req, res) {
  const { finalOdometer, fuelConsumed } = req.body;

  const trip = await prisma.$transaction(async (tx) => {
    const existing = await tx.trip.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Not found", "Trip does not exist");
    if (existing.status !== "DISPATCHED") {
      throw new AppError(409, "Invalid trip state", `Trip is ${existing.status}, not DISPATCHED`);
    }

    await tx.vehicle.update({
      where: { id: existing.vehicleId },
      data: { status: "AVAILABLE", odometer: finalOdometer },
    });
    await tx.driver.update({ where: { id: existing.driverId }, data: { status: "AVAILABLE" } });

    return tx.trip.update({
      where: { id: existing.id },
      data: { status: "COMPLETED", finalOdometer, fuelConsumed, completedAt: new Date() },
    });
  });
  res.json(trip);
}

// Cancel — only valid from DISPATCHED per the brief. Restores both to AVAILABLE.
export async function cancelTrip(req, res) {
  const trip = await prisma.$transaction(async (tx) => {
    const existing = await tx.trip.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Not found", "Trip does not exist");
    if (existing.status !== "DISPATCHED") {
      throw new AppError(409, "Invalid trip state", `Trip is ${existing.status}, not DISPATCHED`);
    }

    await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { status: "AVAILABLE" } });
    await tx.driver.update({ where: { id: existing.driverId }, data: { status: "AVAILABLE" } });

    return tx.trip.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });
  });
  res.json(trip);
}
