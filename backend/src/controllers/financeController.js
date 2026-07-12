import { prisma } from "../lib/prisma.js";

export async function listFuelLogs(req, res) {
  const { vehicleId } = req.query;
  const logs = await prisma.fuelLog.findMany({
    where: { ...(vehicleId && { vehicleId }) },
    orderBy: { date: "desc" },
  });
  res.json(logs);
}

export async function createFuelLog(req, res) {
  const log = await prisma.fuelLog.create({
    data: { ...req.body, date: req.body.date ? new Date(req.body.date) : undefined },
  });
  res.status(201).json(log);
}

export async function listExpenses(req, res) {
  const { vehicleId } = req.query;
  const expenses = await prisma.expense.findMany({
    where: { ...(vehicleId && { vehicleId }) },
    orderBy: { date: "desc" },
  });
  res.json(expenses);
}

export async function createExpense(req, res) {
  const expense = await prisma.expense.create({
    data: { ...req.body, date: req.body.date ? new Date(req.body.date) : undefined },
  });
  res.status(201).json(expense);
}
