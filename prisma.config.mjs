import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "node prisma/seed.mjs",
    },
    // Read without env(): `prisma generate` (run on every install/build) doesn't need a database,
    // so a missing DATABASE_URL must not fail the build. Migrations still need it.
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
