import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let loggedMissingDatabaseUrl = false;

export function getPrismaClient(): PrismaClient | null {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (!process.env.DATABASE_URL) {
    if (!loggedMissingDatabaseUrl) {
      // eslint-disable-next-line no-console
      console.error(
        "DATABASE_URL is missing. MongoDB features are disabled until it is configured."
      );
      loggedMissingDatabaseUrl = true;
    }
    return null;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}
