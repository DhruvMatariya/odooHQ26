import { prisma } from "../lib/prisma.js";

export async function getKpis(req, res) {
  const [
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    totalVehicles,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: "RETIRED" } } }),
    prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { status: "IN_SHOP" } }),
    prisma.trip.count({ where: { status: "DISPATCHED" } }),
    prisma.trip.count({ where: { status: "DRAFT" } }),
    prisma.driver.count({ where: { status: "ON_TRIP" } }),
    prisma.vehicle.count(),
  ]);

  const fleetUtilizationPct = totalVehicles === 0 ? 0 : Math.round((activeTrips / totalVehicles) * 100);

  res.json({
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilizationPct,
  });
}

// Per-vehicle fuel efficiency, operational cost, and ROI — see CONTRACT.md for formulas.
export async function getVehicleReport(req, res) {
  const vehicleId = req.params.id;

  const [vehicle, trips, fuelLogs, maintenanceLogs] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    prisma.trip.findMany({ where: { vehicleId, status: "COMPLETED" } }),
    prisma.fuelLog.findMany({ where: { vehicleId } }),
    prisma.maintenanceLog.findMany({ where: { vehicleId } }),
  ]);

  const totalDistance = trips.reduce((sum, t) => sum + (t.plannedDistance ?? 0), 0);
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);

  const fuelEfficiency = totalFuelLiters === 0 ? 0 : totalDistance / totalFuelLiters;
  const operationalCost = totalFuelCost + totalMaintenanceCost;

  // No revenue field in the schema yet — plug in a per-trip revenue source
  // once the team decides where that number comes from (flat rate? per km?).
  const revenue = 0;
  const roi = vehicle.acquisitionCost === 0 ? 0 : (revenue - operationalCost) / vehicle.acquisitionCost;

  res.json({ fuelEfficiency, operationalCost, roi });
}
