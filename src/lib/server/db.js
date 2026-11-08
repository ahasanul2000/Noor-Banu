import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server process (Next dev hot-reloads modules, so keep it on globalThis).
const globalForPrisma = globalThis;

function createClient() {
    // Always talk to Postgres in UTC: with a non-UTC server timezone (e.g. Postgres.app on a
    // Dhaka Mac) the driver would otherwise read timestamptz values shifted by the offset.
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, options: "-c TimeZone=UTC" });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.__noorBanuPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__noorBanuPrisma = prisma;
