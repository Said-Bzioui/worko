import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file=../../apps/backend_api/.env prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
