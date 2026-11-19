import { pool } from "./client";

/**
 * Small additive schema changes the app applies to itself on first use, so a deploy never breaks
 * the live site while waiting for someone to run the SQL by hand. Every statement is idempotent
 * (IF NOT EXISTS), and the migration is recorded for Drizzle so `pnpm db:migrate` skips it later.
 * Runs once per server instance.
 */
const PATCHES = [
  `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "instagram_url" varchar(500)`,
  `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bot_templates" jsonb`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "resource_title" varchar(200)`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "extra_link" varchar(500)`,
];
const MIGRATIONS = [
  { hash: "51f3dea35b6e9a5853b7abca7885ae7122c0b8913fef087806107be12c7aa85b", createdAt: 1795057961922 },
  { hash: "e21c0cbd32b31e4c0afde5e80482000c47fa270c80f86aad7d7a17418ee7ea85", createdAt: 1795060954864 },
];

let applied: Promise<void> | null = null;

export function ensureSchemaPatches(): Promise<void> {
  applied ??= (async () => {
    for (const sql of PATCHES) await pool.query(sql);
    for (const m of MIGRATIONS) {
      await pool
        .query(
          `INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
           SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = $1)`,
          [m.hash, m.createdAt],
        )
        .catch(() => undefined); // no Drizzle bookkeeping table (e.g. a fresh local db): nothing to record
    }
  })().catch((error) => {
    applied = null; // try again on the next request
    console.error("[db] schema patch failed", error);
  });
  return applied;
}
