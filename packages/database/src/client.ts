import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

// An explicit DATABASE_URL (Supabase, Neon, local dev, ...) always wins. Otherwise fall back to
// NETLIFY_DB_URL, which Netlify injects when it provisions Netlify DB for the site - see
// docs/DEPLOYMENT.md. DATABASE_URL must win so a Supabase setup isn't silently swapped for an
// empty Netlify DB that Netlify auto-provisioned because @netlify/database is a dependency.
const connectionString =
  process.env.DATABASE_URL ??
  process.env.NETLIFY_DB_URL ??
  "postgresql://yaos:yaos_dev_password@localhost:5432/yaos_dev";

const isLocalConnection = /(^|@)(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);

const globalForDb = globalThis as unknown as { yaosPool?: Pool };

export const pool =
  globalForDb.yaosPool ??
  new Pool({
    connectionString,
    max: 10,
    // Hosted Postgres (Supabase, Neon, RDS, ...) requires SSL on external connections;
    // local dev Postgres doesn't speak SSL at all, so only enable it for non-local hosts.
    // rejectUnauthorized: false because most hosted providers' certs aren't in Node's
    // default trust store and this connection is authenticated by password either way.
    ssl: isLocalConnection ? undefined : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.yaosPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
