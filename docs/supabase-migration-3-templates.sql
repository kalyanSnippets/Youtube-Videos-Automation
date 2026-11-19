-- Reply templates for the comment bot + Instagram link on resources.
-- Optional: the app also adds these columns itself on first use. Safe to run more than once.
BEGIN;
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "instagram_url" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bot_templates" jsonb;
INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
SELECT '51f3dea35b6e9a5853b7abca7885ae7122c0b8913fef087806107be12c7aa85b', 1795057961922 WHERE NOT EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = '51f3dea35b6e9a5853b7abca7885ae7122c0b8913fef087806107be12c7aa85b');
COMMIT;
