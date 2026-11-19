ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "resource_title" varchar(200);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "extra_link" varchar(500);