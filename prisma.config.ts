import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

const nodeEnv = process.env.NODE_ENV ?? "development";

loadEnv({
  path: [
    `.env.${nodeEnv}.local`,
    ...(nodeEnv === "test" ? [] : [".env.local"]),
    `.env.${nodeEnv}`,
    ".env",
  ],
  quiet: true,
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
