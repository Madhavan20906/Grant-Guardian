import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const isPostgresUrlConfigured = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("127.0.0.1:5432") &&
  !process.env.DATABASE_URL.includes("localhost:5432")
);

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/grant_guardian";

export const isDatabaseConfigured = isPostgresUrlConfigured;

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: parseInt(process.env.PG_CONNECT_TIMEOUT_MS || "1000", 10),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "./seed";
