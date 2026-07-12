import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listVehicles(req, res) {
  const { status, type } = req.query;
  const vehicles = await prisma.vehicle.findMany({
    where: { ...(status && { status }), ...(type && { type }) },
    orderBy: { createdAt: "desc" },
  });
  res.json(vehicles);
}

// Powers the dropdown in Trip creation — never returns IN_SHOP/RETIRED/ON_TRIP vehicles.
export async function listAvailableVehicles(req, res) {
  const vehicles = await prisma.vehicle.findMany({ where: { status: "AVAILABLE" } });
  res.json(vehicles);
}

export async function createVehicle(req, res) {
  const existing = await prisma.vehicle.findUnique({
    where: { registrationNumber: req.body.registrationNumber },
  });
  if (existing) {
    throw new AppError(409, "Registration number in use", `${req.body.registrationNumber} is already registered`);
  }
  const vehicle = await prisma.vehicle.create({ data: req.body });
  res.status(201).json(vehicle);
}

export async function getVehicle(req, res) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new AppError(404, "Not found", `No vehicle with id ${req.params.id}`);
  res.json(vehicle);
}

export async function updateVehicle(req, res) {
  const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
  res.json(vehicle);
}

// Soft delete — vehicles are referenced by trips/logs, never hard-delete them.
export async function retireVehicle(req, res) {
  await prisma.vehicle.update({ where: { id: req.params.id }, data: { status: "RETIRED" } });
  res.status(204).send();
}
