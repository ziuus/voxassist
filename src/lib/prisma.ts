
import { PrismaClient } from "@prisma/client";

// Check for required env variable before initializing Prisma
if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error("❌ DATABASE_URL environment variable is missing. The app cannot connect to the database.");
  throw new Error("DATABASE_URL environment variable is missing. Set it in your environment or .env file.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
