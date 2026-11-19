ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "instagram_url" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bot_templates" jsonb;