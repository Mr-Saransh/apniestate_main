import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient, pool: Pool };

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter, log: ["error"] });
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ["error"] });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
