import {
  PrismaClient,
  Role,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  ExpenseType,
} from "@prisma/client";
import bcrypt from "bcryptjs"; // FIX 3: match what authController.js imports (bcryptjs, not bcrypt)

const prisma = new PrismaClient();

// Note: no "id" fields here — Prisma will auto-generate real UUIDs via @default(uuid())
const users = [
  { name: "Arjun Mehta", email: "arjun@transitops.io", role: Role.FLEET_MANAGER, password: "Password1!" },
  { name: "Priya Sharma", email: "priya@transitops.io", role: Role.FLEET_MANAGER, password: "Password1!" },
  { name: "Rohan Das", email: "rohan@transitops.io", role: Role.DRIVER, password: "Password1!" },
  { name: "Sneha Kapoor", email: "sneha@transitops.io", role: Role.DRIVER, password: "Password1!" },
  { name: "Vikram Nair", email: "vikram@transitops.io", role: Role.DRIVER, password: "Password1!" },
  { name: "Anjali Patel", email: "anjali@transitops.io", role: Role.SAFETY_OFFICER, password: "Password1!" },
  { name: "Kiran Bose", email: "kiran@transitops.io", role: Role.SAFETY_OFFICER, password: "Password1!" },
  { name: "Meera Iyer", email: "meera@transitops.io", role: Role.FINANCIAL_ANALYST, password: "Password1!" },
  { name: "Suresh Reddy", email: "suresh@transitops.io", role: Role.FINANCIAL_ANALYST, password: "Password1!" },
  { name: "Divya Choudhary", email: "divya@transitops.io", role: Role.FLEET_MANAGER, password: "Password1!" },
];

// Local keys ("v1", "d1", "t1"...) are ONLY used within this seed script to wire up
// relationships before insert. They are never written to the database.
const vehicles = [
  { key: "v1", registrationNumber: "GJ01AB1234", name: "Thunder Hauler", type: "HEAVY_TRUCK", maxLoadCapacity: 20000, odometer: 84320, acquisitionCost: 3500000, status: VehicleStatus.AVAILABLE },
  { key: "v2", registrationNumber: "GJ01CD5678", name: "Swift Cargo", type: "MEDIUM_TRUCK", maxLoadCapacity: 10000, odometer: 61200, acquisitionCost: 1800000, status: VehicleStatus.ON_TRIP },
  { key: "v3", registrationNumber: "MH02EF9012", name: "Iron Mule", type: "HEAVY_TRUCK", maxLoadCapacity: 18000, odometer: 112540, acquisitionCost: 3200000, status: VehicleStatus.IN_SHOP },
  { key: "v4", registrationNumber: "MH02GH3456", name: "Road Runner", type: "LIGHT_VAN", maxLoadCapacity: 3000, odometer: 43100, acquisitionCost: 750000, status: VehicleStatus.AVAILABLE },
  { key: "v5", registrationNumber: "RJ14IJ7890", name: "Desert Fox", type: "MEDIUM_TRUCK", maxLoadCapacity: 12000, odometer: 98000, acquisitionCost: 2100000, status: VehicleStatus.ON_TRIP },
  { key: "v6", registrationNumber: "RJ14KL2345", name: "Pegasus Freight", type: "HEAVY_TRUCK", maxLoadCapacity: 22000, odometer: 205600, acquisitionCost: 3800000, status: VehicleStatus.RETIRED },
  { key: "v7", registrationNumber: "DL01MN6789", name: "Capital Carrier", type: "LIGHT_VAN", maxLoadCapacity: 2500, odometer: 31400, acquisitionCost: 680000, status: VehicleStatus.AVAILABLE },
  { key: "v8", registrationNumber: "DL01OP0123", name: "Titan Express", type: "HEAVY_TRUCK", maxLoadCapacity: 25000, odometer: 77900, acquisitionCost: 4200000, status: VehicleStatus.IN_SHOP },
  { key: "v9", registrationNumber: "KA03QR4567", name: "Southern Star", type: "MEDIUM_TRUCK", maxLoadCapacity: 9000, odometer: 52300, acquisitionCost: 1950000, status: VehicleStatus.AVAILABLE },
  { key: "v10", registrationNumber: "KA03ST8901", name: "Night Rider", type: "LIGHT_VAN", maxLoadCapacity: 2800, odometer: 19800, acquisitionCost: 720000, status: VehicleStatus.AVAILABLE },
];

const drivers = [
  { key: "d1", name: "Harish Kumar", licenseNumber: "GJ2019001234", licenseCategory: "HMV", licenseExpiryDate: new Date("2026-11-30"), contactNumber: "+91-9876543210", safetyScore: 92, status: DriverStatus.AVAILABLE },
  { key: "d2", name: "Ramesh Yadav", licenseNumber: "MH2018005678", licenseCategory: "HMV", licenseExpiryDate: new Date("2025-03-15"), contactNumber: "+91-9876543211", safetyScore: 74, status: DriverStatus.OFF_DUTY },
  { key: "d3", name: "Sunil Tiwari", licenseNumber: "RJ2020009012", licenseCategory: "LMV", licenseExpiryDate: new Date("2027-06-20"), contactNumber: "+91-9876543212", safetyScore: 88, status: DriverStatus.ON_TRIP },
  { key: "d4", name: "Anil Chauhan", licenseNumber: "DL2021003456", licenseCategory: "HMV", licenseExpiryDate: new Date("2028-01-10"), contactNumber: "+91-9876543213", safetyScore: 95, status: DriverStatus.AVAILABLE },
  { key: "d5", name: "Manoj Pillai", licenseNumber: "KA2017007890", licenseCategory: "LMV", licenseExpiryDate: new Date("2026-09-05"), contactNumber: "+91-9876543214", safetyScore: 81, status: DriverStatus.ON_TRIP },
  { key: "d6", name: "Deepak Verma", licenseNumber: "UP2022001111", licenseCategory: "HMV", licenseExpiryDate: new Date("2029-04-18"), contactNumber: "+91-9876543215", safetyScore: 90, status: DriverStatus.AVAILABLE },
  { key: "d7", name: "Sanjay Mishra", licenseNumber: "TN2016002222", licenseCategory: "HMV", licenseExpiryDate: new Date("2024-12-01"), contactNumber: "+91-9876543216", safetyScore: 67, status: DriverStatus.SUSPENDED },
  { key: "d8", name: "Ravi Shankar", licenseNumber: "WB2023003333", licenseCategory: "LMV", licenseExpiryDate: new Date("2028-07-25"), contactNumber: "+91-9876543217", safetyScore: 85, status: DriverStatus.AVAILABLE },
  { key: "d9", name: "Gopal Krishnan", licenseNumber: "PB2020004444", licenseCategory: "HMV", licenseExpiryDate: new Date("2027-02-14"), contactNumber: "+91-9876543218", safetyScore: 78, status: DriverStatus.OFF_DUTY },
  { key: "d10", name: "Lokesh Negi", licenseNumber: "HR2021005555", licenseCategory: "LMV", licenseExpiryDate: new Date("2026-12-31"), contactNumber: "+91-9876543219", safetyScore: 93, status: DriverStatus.AVAILABLE },
];

const trips = [
  { key: "t1", source: "Ahmedabad", destination: "Mumbai", vehicleKey: "v2", driverKey: "d3", cargoWeight: 8500, plannedDistance: 530, status: TripStatus.DISPATCHED, dispatchedAt: new Date() },
  { key: "t2", source: "Jaipur", destination: "Delhi", vehicleKey: "v5", driverKey: "d5", cargoWeight: 10000, plannedDistance: 280, status: TripStatus.DISPATCHED, dispatchedAt: new Date() },
  { key: "t3", source: "Delhi", destination: "Lucknow", vehicleKey: "v1", driverKey: "d1", cargoWeight: 5000, plannedDistance: 555, status: TripStatus.DRAFT },
  { key: "t4", source: "Mumbai", destination: "Pune", vehicleKey: "v4", driverKey: "d4", cargoWeight: 1800, plannedDistance: 150, status: TripStatus.DRAFT },
  { key: "t5", source: "Bangalore", destination: "Chennai", vehicleKey: "v9", driverKey: "d6", cargoWeight: 7200, plannedDistance: 347, status: TripStatus.DRAFT },
  { key: "t6", source: "Ahmedabad", destination: "Surat", vehicleKey: "v7", driverKey: "d8", cargoWeight: 1200, plannedDistance: 265, finalOdometer: 31665, fuelConsumed: 48.5, status: TripStatus.COMPLETED, dispatchedAt: new Date("2025-06-14"), completedAt: new Date("2025-06-15") },
  { key: "t7", source: "Hyderabad", destination: "Bangalore", vehicleKey: "v10", driverKey: "d10", cargoWeight: 900, plannedDistance: 570, finalOdometer: 20370, fuelConsumed: 102.0, status: TripStatus.COMPLETED, dispatchedAt: new Date("2025-06-25"), completedAt: new Date("2025-06-27") },
  { key: "t8", source: "Kolkata", destination: "Bhubaneswar", vehicleKey: "v6", driverKey: "d9", cargoWeight: 14000, plannedDistance: 440, finalOdometer: 206040, fuelConsumed: 215.0, status: TripStatus.COMPLETED, dispatchedAt: new Date("2025-01-08"), completedAt: new Date("2025-01-10") },
  { key: "t9", source: "Chennai", destination: "Coimbatore", vehicleKey: "v9", driverKey: "d1", cargoWeight: 6000, plannedDistance: 495, status: TripStatus.CANCELLED },
  { key: "t10", source: "Pune", destination: "Nagpur", vehicleKey: "v4", driverKey: "d8", cargoWeight: 2200, plannedDistance: 730, status: TripStatus.CANCELLED },
];

const maintenanceLogs = [
  { vehicleKey: "v3", description: "Engine overhaul — cylinder head gasket replacement", cost: 85000, isActive: true, createdAt: new Date("2025-06-10") },
  { vehicleKey: "v8", description: "Brake system inspection and pad replacement", cost: 22000, isActive: true, createdAt: new Date("2025-06-28") },
  { vehicleKey: "v1", description: "Scheduled 80,000 km service — oil, filters, belts", cost: 15000, isActive: false, createdAt: new Date("2025-04-01") },
  { vehicleKey: "v6", description: "Transmission rebuild", cost: 130000, isActive: false, createdAt: new Date("2025-01-15") },
  { vehicleKey: "v2", description: "Tyre rotation and alignment", cost: 8000, isActive: false, createdAt: new Date("2025-03-20") },
  { vehicleKey: "v5", description: "AC compressor replacement", cost: 31000, isActive: false, createdAt: new Date("2025-05-05") },
  { vehicleKey: "v9", description: "Electrical fault — alternator replacement", cost: 18500, isActive: false, createdAt: new Date("2025-02-18") },
  { vehicleKey: "v4", description: "Windshield crack repair", cost: 6500, isActive: false, createdAt: new Date("2025-06-01") },
  { vehicleKey: "v7", description: "Suspension bush replacement — front axle", cost: 12000, isActive: false, createdAt: new Date("2025-05-22") },
  { vehicleKey: "v10", description: "60,000 km interim service", cost: 9500, isActive: false, createdAt: new Date("2025-04-30") },
];

const fuelLogs = [
  { vehicleKey: "v1", liters: 120.0, cost: 10680, date: new Date("2025-06-25") },
  { vehicleKey: "v2", liters: 95.5, cost: 8500, date: new Date("2025-06-22") },
  { vehicleKey: "v3", liters: 140.0, cost: 12460, date: new Date("2025-05-30") },
  { vehicleKey: "v4", liters: 45.0, cost: 4005, date: new Date("2025-06-18") },
  { vehicleKey: "v5", liters: 110.0, cost: 9790, date: new Date("2025-06-20") },
  { vehicleKey: "v6", liters: 215.0, cost: 19135, date: new Date("2025-01-10") },
  { vehicleKey: "v7", liters: 48.5, cost: 4317, date: new Date("2025-06-15") },
  { vehicleKey: "v9", liters: 88.0, cost: 7832, date: new Date("2025-06-12") },
  { vehicleKey: "v10", liters: 102.0, cost: 9078, date: new Date("2025-06-27") },
  { vehicleKey: "v8", liters: 130.0, cost: 11570, date: new Date("2025-06-05") },
];

const expenses = [
  { vehicleKey: "v1", type: ExpenseType.TOLL, amount: 2800, date: new Date("2025-06-25") },
  { vehicleKey: "v2", type: ExpenseType.TOLL, amount: 1500, date: new Date("2025-06-22") },
  { vehicleKey: "v3", type: ExpenseType.OTHER, amount: 5000, date: new Date("2025-06-10") },
  { vehicleKey: "v4", type: ExpenseType.TOLL, amount: 650, date: new Date("2025-06-18") },
  { vehicleKey: "v5", type: ExpenseType.OTHER, amount: 3200, date: new Date("2025-06-20") },
  { vehicleKey: "v6", type: ExpenseType.TOLL, amount: 4100, date: new Date("2025-01-10") },
  { vehicleKey: "v7", type: ExpenseType.OTHER, amount: 800, date: new Date("2025-06-15") },
  { vehicleKey: "v9", type: ExpenseType.TOLL, amount: 1750, date: new Date("2025-06-12") },
  { vehicleKey: "v10", type: ExpenseType.OTHER, amount: 1100, date: new Date("2025-06-27") },
  { vehicleKey: "v8", type: ExpenseType.TOLL, amount: 2200, date: new Date("2025-06-05") },
];

async function main() {
  // FIX 3: Hash passwords with bcryptjs (same library authController.js uses) before insert.
  // Contract: "password hashed with bcrypt, never returned"
  const hashedUsers = await Promise.all(
    users.map(async (u) => ({ ...u, password: await bcrypt.hash(u.password, 10) }))
  );

  // FIX 2: Run all deletes and creates directly on `prisma` (not inside a $transaction wrapper).
  // A single $transaction around 50+ sequential inserts reliably times out against remote Neon
  // Postgres due to network latency — this is a one-time seed that doesn't need atomicity.

  // Delete in reverse order of dependencies
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Users — no cross-references needed
  await prisma.user.createMany({ data: hashedUsers });

  // Vehicles — insert one at a time to capture generated UUIDs
  const vehicleMap: Record<string, string> = {};
  for (const { key, ...data } of vehicles) {
    const created = await prisma.vehicle.create({ data });
    vehicleMap[key] = created.id;
  }

  // Drivers — same pattern
  const driverMap: Record<string, string> = {};
  for (const { key, ...data } of drivers) {
    const created = await prisma.driver.create({ data });
    driverMap[key] = created.id;
  }

  // Trips — resolve vehicleKey/driverKey to real UUIDs via the maps above
  for (const { key, vehicleKey, driverKey, ...data } of trips) {
    await prisma.trip.create({
      data: { ...data, vehicleId: vehicleMap[vehicleKey], driverId: driverMap[driverKey] },
    });
  }

  // Maintenance logs
  for (const { vehicleKey, ...data } of maintenanceLogs) {
    await prisma.maintenanceLog.create({ data: { ...data, vehicleId: vehicleMap[vehicleKey] } });
  }

  // Fuel logs
  for (const { vehicleKey, ...data } of fuelLogs) {
    await prisma.fuelLog.create({ data: { ...data, vehicleId: vehicleMap[vehicleKey] } });
  }

  // Expenses
  for (const { vehicleKey, ...data } of expenses) {
    await prisma.expense.create({ data: { ...data, vehicleId: vehicleMap[vehicleKey] } });
  }

  console.log("Database seeded successfully — all IDs are real Prisma-generated UUIDs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });