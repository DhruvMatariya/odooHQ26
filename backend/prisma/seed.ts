import {
  PrismaClient,
  Role,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  ExpenseType,
} from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { id: "u1", name: "Arjun Mehta", email: "arjun@transitops.io", role: Role.FLEET_MANAGER, password: "Password1!" },
  { id: "u2", name: "Priya Sharma", email: "priya@transitops.io", role: Role.FLEET_MANAGER, password: "Password1!" },
  { id: "u3", name: "Rohan Das", email: "rohan@transitops.io", role: Role.DRIVER, password: "Password1!" },
  { id: "u4", name: "Sneha Kapoor", email: "sneha@transitops.io", role: Role.DRIVER, password: "Password1!" },
  { id: "u5", name: "Vikram Nair", email: "vikram@transitops.io", role: Role.DRIVER, password: "Password1!" },
  { id: "u6", name: "Anjali Patel", email: "anjali@transitops.io", role: Role.SAFETY_OFFICER, password: "Password1!" },
  { id: "u7", name: "Kiran Bose", email: "kiran@transitops.io", role: Role.SAFETY_OFFICER, password: "Password1!" },
  { id: "u8", name: "Meera Iyer", email: "meera@transitops.io", role: Role.FINANCIAL_ANALYST, password: "Password1!" },
  { id: "u9", name: "Suresh Reddy", email: "suresh@transitops.io", role: Role.FINANCIAL_ANALYST, password: "Password1!" },
  { id: "u10", name: "Divya Choudhary", email: "divya@transitops.io", role: Role.FLEET_MANAGER, password: "Password1!" },
];

const vehicles = [
  { id: "v1", registrationNumber: "GJ01AB1234", name: "Thunder Hauler", type: "HEAVY_TRUCK", maxLoadCapacity: 20000, odometer: 84320, acquisitionCost: 3500000, status: VehicleStatus.AVAILABLE },
  { id: "v2", registrationNumber: "GJ01CD5678", name: "Swift Cargo", type: "MEDIUM_TRUCK", maxLoadCapacity: 10000, odometer: 61200, acquisitionCost: 1800000, status: VehicleStatus.ON_TRIP },
  { id: "v3", registrationNumber: "MH02EF9012", name: "Iron Mule", type: "HEAVY_TRUCK", maxLoadCapacity: 18000, odometer: 112540, acquisitionCost: 3200000, status: VehicleStatus.IN_SHOP },
  { id: "v4", registrationNumber: "MH02GH3456", name: "Road Runner", type: "LIGHT_VAN", maxLoadCapacity: 3000, odometer: 43100, acquisitionCost: 750000, status: VehicleStatus.AVAILABLE },
  { id: "v5", registrationNumber: "RJ14IJ7890", name: "Desert Fox", type: "MEDIUM_TRUCK", maxLoadCapacity: 12000, odometer: 98000, acquisitionCost: 2100000, status: VehicleStatus.ON_TRIP },
  { id: "v6", registrationNumber: "RJ14KL2345", name: "Pegasus Freight", type: "HEAVY_TRUCK", maxLoadCapacity: 22000, odometer: 205600, acquisitionCost: 3800000, status: VehicleStatus.RETIRED },
  { id: "v7", registrationNumber: "DL01MN6789", name: "Capital Carrier", type: "LIGHT_VAN", maxLoadCapacity: 2500, odometer: 31400, acquisitionCost: 680000, status: VehicleStatus.AVAILABLE },
  { id: "v8", registrationNumber: "DL01OP0123", name: "Titan Express", type: "HEAVY_TRUCK", maxLoadCapacity: 25000, odometer: 77900, acquisitionCost: 4200000, status: VehicleStatus.IN_SHOP },
  { id: "v9", registrationNumber: "KA03QR4567", name: "Southern Star", type: "MEDIUM_TRUCK", maxLoadCapacity: 9000, odometer: 52300, acquisitionCost: 1950000, status: VehicleStatus.AVAILABLE },
  { id: "v10", registrationNumber: "KA03ST8901", name: "Night Rider", type: "LIGHT_VAN", maxLoadCapacity: 2800, odometer: 19800, acquisitionCost: 720000, status: VehicleStatus.AVAILABLE },
];

const drivers = [
  { id: "d1", name: "Harish Kumar", licenseNumber: "GJ2019001234", licenseCategory: "HMV", licenseExpiryDate: new Date("2026-11-30"), contactNumber: "+91-9876543210", safetyScore: 92, status: DriverStatus.AVAILABLE },
  { id: "d2", name: "Ramesh Yadav", licenseNumber: "MH2018005678", licenseCategory: "HMV", licenseExpiryDate: new Date("2025-03-15"), contactNumber: "+91-9876543211", safetyScore: 74, status: DriverStatus.OFF_DUTY },
  { id: "d3", name: "Sunil Tiwari", licenseNumber: "RJ2020009012", licenseCategory: "LMV", licenseExpiryDate: new Date("2027-06-20"), contactNumber: "+91-9876543212", safetyScore: 88, status: DriverStatus.ON_TRIP },
  { id: "d4", name: "Anil Chauhan", licenseNumber: "DL2021003456", licenseCategory: "HMV", licenseExpiryDate: new Date("2028-01-10"), contactNumber: "+91-9876543213", safetyScore: 95, status: DriverStatus.AVAILABLE },
  { id: "d5", name: "Manoj Pillai", licenseNumber: "KA2017007890", licenseCategory: "LMV", licenseExpiryDate: new Date("2026-09-05"), contactNumber: "+91-9876543214", safetyScore: 81, status: DriverStatus.ON_TRIP },
  { id: "d6", name: "Deepak Verma", licenseNumber: "UP2022001111", licenseCategory: "HMV", licenseExpiryDate: new Date("2029-04-18"), contactNumber: "+91-9876543215", safetyScore: 90, status: DriverStatus.AVAILABLE },
  { id: "d7", name: "Sanjay Mishra", licenseNumber: "TN2016002222", licenseCategory: "HMV", licenseExpiryDate: new Date("2024-12-01"), contactNumber: "+91-9876543216", safetyScore: 67, status: DriverStatus.SUSPENDED },
  { id: "d8", name: "Ravi Shankar", licenseNumber: "WB2023003333", licenseCategory: "LMV", licenseExpiryDate: new Date("2028-07-25"), contactNumber: "+91-9876543217", safetyScore: 85, status: DriverStatus.AVAILABLE },
  { id: "d9", name: "Gopal Krishnan", licenseNumber: "PB2020004444", licenseCategory: "HMV", licenseExpiryDate: new Date("2027-02-14"), contactNumber: "+91-9876543218", safetyScore: 78, status: DriverStatus.OFF_DUTY },
  { id: "d10", name: "Lokesh Negi", licenseNumber: "HR2021005555", licenseCategory: "LMV", licenseExpiryDate: new Date("2026-12-31"), contactNumber: "+91-9876543219", safetyScore: 93, status: DriverStatus.AVAILABLE },
];

const trips = [
  { id: "t1", source: "Ahmedabad", destination: "Mumbai", vehicleId: "v2", driverId: "d3", cargoWeight: 8500, plannedDistance: 530, status: TripStatus.DISPATCHED },
  { id: "t2", source: "Jaipur", destination: "Delhi", vehicleId: "v5", driverId: "d5", cargoWeight: 10000, plannedDistance: 280, status: TripStatus.DISPATCHED },
  { id: "t3", source: "Delhi", destination: "Lucknow", vehicleId: "v1", driverId: "d1", cargoWeight: 5000, plannedDistance: 555, status: TripStatus.DRAFT },
  { id: "t4", source: "Mumbai", destination: "Pune", vehicleId: "v4", driverId: "d4", cargoWeight: 1800, plannedDistance: 150, status: TripStatus.DRAFT },
  { id: "t5", source: "Bangalore", destination: "Chennai", vehicleId: "v9", driverId: "d6", cargoWeight: 7200, plannedDistance: 347, status: TripStatus.DRAFT },
  { id: "t6", source: "Ahmedabad", destination: "Surat", vehicleId: "v7", driverId: "d8", cargoWeight: 1200, plannedDistance: 265, finalOdometer: 31665, fuelConsumed: 48.5, status: TripStatus.COMPLETED },
  { id: "t7", source: "Hyderabad", destination: "Bangalore", vehicleId: "v10", driverId: "d10", cargoWeight: 900, plannedDistance: 570, finalOdometer: 20370, fuelConsumed: 102.0, status: TripStatus.COMPLETED },
  { id: "t8", source: "Kolkata", destination: "Bhubaneswar", vehicleId: "v6", driverId: "d9", cargoWeight: 14000, plannedDistance: 440, finalOdometer: 206040, fuelConsumed: 215.0, status: TripStatus.COMPLETED },
  { id: "t9", source: "Chennai", destination: "Coimbatore", vehicleId: "v9", driverId: "d1", cargoWeight: 6000, plannedDistance: 495, status: TripStatus.CANCELLED },
  { id: "t10", source: "Pune", destination: "Nagpur", vehicleId: "v4", driverId: "d8", cargoWeight: 2200, plannedDistance: 730, status: TripStatus.CANCELLED },
];

const maintenanceLogs = [
  { id: "m1", vehicleId: "v3", description: "Engine overhaul — cylinder head gasket replacement", cost: 85000, isActive: true, createdAt: new Date("2025-06-10") },
  { id: "m2", vehicleId: "v8", description: "Brake system inspection and pad replacement", cost: 22000, isActive: true, createdAt: new Date("2025-06-28") },
  { id: "m3", vehicleId: "v1", description: "Scheduled 80,000 km service — oil, filters, belts", cost: 15000, isActive: false, createdAt: new Date("2025-04-01") },
  { id: "m4", vehicleId: "v6", description: "Transmission rebuild", cost: 130000, isActive: false, createdAt: new Date("2025-01-15") },
  { id: "m5", vehicleId: "v2", description: "Tyre rotation and alignment", cost: 8000, isActive: false, createdAt: new Date("2025-03-20") },
  { id: "m6", vehicleId: "v5", description: "AC compressor replacement", cost: 31000, isActive: false, createdAt: new Date("2025-05-05") },
  { id: "m7", vehicleId: "v9", description: "Electrical fault — alternator replacement", cost: 18500, isActive: false, createdAt: new Date("2025-02-18") },
  { id: "m8", vehicleId: "v4", description: "Windshield crack repair", cost: 6500, isActive: false, createdAt: new Date("2025-06-01") },
  { id: "m9", vehicleId: "v7", description: "Suspension bush replacement — front axle", cost: 12000, isActive: false, createdAt: new Date("2025-05-22") },
  { id: "m10", vehicleId: "v10", description: "60,000 km interim service", cost: 9500, isActive: false, createdAt: new Date("2025-04-30") },
];

const fuelLogs = [
  { id: "f1", vehicleId: "v1", liters: 120.0, cost: 10680, date: new Date("2025-06-25") },
  { id: "f2", vehicleId: "v2", liters: 95.5, cost: 8500, date: new Date("2025-06-22") },
  { id: "f3", vehicleId: "v3", liters: 140.0, cost: 12460, date: new Date("2025-05-30") },
  { id: "f4", vehicleId: "v4", liters: 45.0, cost: 4005, date: new Date("2025-06-18") },
  { id: "f5", vehicleId: "v5", liters: 110.0, cost: 9790, date: new Date("2025-06-20") },
  { id: "f6", vehicleId: "v6", liters: 215.0, cost: 19135, date: new Date("2025-01-10") },
  { id: "f7", vehicleId: "v7", liters: 48.5, cost: 4317, date: new Date("2025-06-15") },
  { id: "f8", vehicleId: "v9", liters: 88.0, cost: 7832, date: new Date("2025-06-12") },
  { id: "f9", vehicleId: "v10", liters: 102.0, cost: 9078, date: new Date("2025-06-27") },
  { id: "f10", vehicleId: "v8", liters: 130.0, cost: 11570, date: new Date("2025-06-05") },
];

const expenses = [
  { id: "e1", vehicleId: "v1", type: ExpenseType.TOLL, amount: 2800, date: new Date("2025-06-25") },
  { id: "e2", vehicleId: "v2", type: ExpenseType.TOLL, amount: 1500, date: new Date("2025-06-22") },
  { id: "e3", vehicleId: "v3", type: ExpenseType.OTHER, amount: 5000, date: new Date("2025-06-10") },
  { id: "e4", vehicleId: "v4", type: ExpenseType.TOLL, amount: 650, date: new Date("2025-06-18") },
  { id: "e5", vehicleId: "v5", type: ExpenseType.OTHER, amount: 3200, date: new Date("2025-06-20") },
  { id: "e6", vehicleId: "v6", type: ExpenseType.TOLL, amount: 4100, date: new Date("2025-01-10") },
  { id: "e7", vehicleId: "v7", type: ExpenseType.OTHER, amount: 800, date: new Date("2025-06-15") },
  { id: "e8", vehicleId: "v9", type: ExpenseType.TOLL, amount: 1750, date: new Date("2025-06-12") },
  { id: "e9", vehicleId: "v10", type: ExpenseType.OTHER, amount: 1100, date: new Date("2025-06-27") },
  { id: "e10", vehicleId: "v8", type: ExpenseType.TOLL, amount: 2200, date: new Date("2025-06-05") },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    // Delete in reverse order of dependencies
    await tx.expense.deleteMany();
    await tx.fuelLog.deleteMany();
    await tx.maintenanceLog.deleteMany();
    await tx.trip.deleteMany();
    await tx.driver.deleteMany();
    await tx.vehicle.deleteMany();
    await tx.user.deleteMany();

    // Create in order of dependencies
    await tx.user.createMany({ data: users });
    await tx.vehicle.createMany({ data: vehicles });
    await tx.driver.createMany({ data: drivers });
    await tx.trip.createMany({ data: trips });
    await tx.maintenanceLog.createMany({ data: maintenanceLogs });
    await tx.fuelLog.createMany({ data: fuelLogs });
    await tx.expense.createMany({ data: expenses });
  }, {
    timeout: 20000
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
