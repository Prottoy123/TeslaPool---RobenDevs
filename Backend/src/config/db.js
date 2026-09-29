import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import envConfig from "./env.config.js";

const { Pool } = pg;

function resolvePostgresUrl(url) {
  if (!url) {
    return "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
  }
  if (url.startsWith("prisma+postgres://")) {
    try {
      const match = url.match(/api_key=([^&]+)/);
      if (match) {
        const decoded = JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
        if (decoded.databaseUrl) return decoded.databaseUrl;
      }
    } catch {
      // Fallback if parsing fails
    }
    return "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
  }
  return url;
}

const connectionString = resolvePostgresUrl(envConfig.DATABASE_URL);
const pool = new Pool({
  connectionString,
  max: 10,
});

let stmtCounter = 0;
const adapter = new PrismaPg(pool, {
  statementNameGenerator: () => `stmt_${++stmtCounter}_${Date.now()}`,
});

const prisma = new PrismaClient({
  adapter,
  log: envConfig.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

export default prisma;
