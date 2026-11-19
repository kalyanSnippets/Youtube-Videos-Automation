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
];
const MIGRATION = { hash: "51f3dea35b6e9a5853b7abca7885ae7122c0b8913fef087806107be12c7aa85b", createdAt: 1795057961922 };

let applied: Promise<void> | null = null;

export function ensureSchemaPatches(): Promise<void> {
  applied ??= (async () => {
    for (const sql of PATCHES) await pool.query(sql);
    await pool
      .query(
        `INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
         SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = $1)`,
        [MIGRATION.hash, MIGRATION.createdAt],
      )
      .catch(() => undefined); // no Drizzle bookkeeping table (e.g. a fresh local db): nothing to record
  })().catch((error) => {
    applied = null; // try again on the next request
    console.error("[db] schema patch failed", error);
  });
  return applied;
}
