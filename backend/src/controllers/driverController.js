import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listDrivers(req, res) {
  const { status } = req.query;
  const drivers = await prisma.driver.findMany({
    where: { ...(status && { status }) },
    orderBy: { createdAt: "desc" },
  });
  res.json(drivers);
}

// Powers the dropdown in Trip creation — excludes suspended AND expired-license drivers.
export async function listAvailableDrivers(req, res) {
  const drivers = await prisma.driver.findMany({
    where: { status: "AVAILABLE", licenseExpiryDate: { gt: new Date() } },
  });
  res.json(drivers);
}

export async function createDriver(req, res) {
  // Pre-check for a clean 409 — the try/catch below also catches the P2002 that
  // can slip through if two requests race between this check and the insert.
  const existing = await prisma.driver.findUnique({ where: { licenseNumber: req.body.licenseNumber } });
  if (existing) {
    throw new AppError(409, "License number in use", `${req.body.licenseNumber} is already registered`);
  }

  try {
    const driver = await prisma.driver.create({
      data: { ...req.body, licenseExpiryDate: new Date(req.body.licenseExpiryDate) },
    });
    res.status(201).json(driver);
  } catch (err) {
    // P2002 = unique constraint violation — handles the race between the findUnique above and the insert.
    if (err?.code === "P2002") {
      throw new AppError(409, "License number in use", `${req.body.licenseNumber} is already registered`);
    }
    throw err;
  }
}

export async function getDriver(req, res) {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new AppError(404, "Not found", `No driver with id ${req.params.id}`);
  res.json(driver);
}

export async function updateDriver(req, res) {
  const data = { ...req.body };
  if (data.licenseExpiryDate) data.licenseExpiryDate = new Date(data.licenseExpiryDate);
  const driver = await prisma.driver.update({ where: { id: req.params.id }, data });
  res.json(driver);
}

export async function suspendDriver(req, res) {
  const driver = await prisma.driver.update({ where: { id: req.params.id }, data: { status: "SUSPENDED" } });
  res.json(driver);
}
