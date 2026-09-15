import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL ?? "postgresql://yaos:yaos_dev_password@localhost:5432/yaos_dev";

const globalForDb = globalThis as unknown as { yaosPool?: Pool };

export const pool =
  globalForDb.yaosPool ??
  new Pool({
    connectionString,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.yaosPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
