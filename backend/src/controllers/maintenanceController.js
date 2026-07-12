import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listMaintenance(req, res) {
  const { vehicleId } = req.query;
  const logs = await prisma.maintenanceLog.findMany({
    where: { ...(vehicleId && { vehicleId }) },
    orderBy: { createdAt: "desc" },
  });
  res.json(logs);
}

// Create — vehicle must not be ON_TRIP. Sets vehicle to IN_SHOP in one transaction,
// which immediately removes it from /vehicles/available.
export async function createMaintenance(req, res) {
  const { vehicleId, description, cost } = req.body;

  const log = await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError(404, "Not found", "Vehicle does not exist");
    if (vehicle.status === "ON_TRIP") {
      throw new AppError(409, "Vehicle on trip", "Cannot start maintenance on a vehicle that is on a trip");
    }

    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: "IN_SHOP" } });
    return tx.maintenanceLog.create({ data: { vehicleId, description, cost, isActive: true } });
  });

  res.status(201).json(log);
}

// Close — restores vehicle to AVAILABLE unless it's RETIRED.
export async function closeMaintenance(req, res) {
  const log = await prisma.$transaction(async (tx) => {
    const existing = await tx.maintenanceLog.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Not found", "Maintenance log does not exist");
    if (!existing.isActive) throw new AppError(409, "Already closed", "This maintenance log is already closed");

    const vehicle = await tx.vehicle.findUnique({ where: { id: existing.vehicleId } });
    if (vehicle.status !== "RETIRED") {
      await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "AVAILABLE" } });
    }

    return tx.maintenanceLog.update({
      where: { id: existing.id },
      data: { isActive: false, closedAt: new Date() },
    });
  });

  res.json(log);
}
