import { PrismaClient } from "@prisma/client";

// Singleton so hot-reload (nodemon) doesn't spawn a new pool of connections
// to Neon on every file save.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
