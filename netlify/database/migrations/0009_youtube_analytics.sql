CREATE TABLE IF NOT EXISTS "channel_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(20) NOT NULL,
	"day" date NOT NULL,
	"views" integer,
	"watch_minutes" integer,
	"subscribers_gained" integer,
	"subscribers_lost" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "views" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "watch_minutes" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "avg_view_percent" real;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "subscribers_gained" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "likes" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "comments_count" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "stats_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "page_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "channel_daily_platform_day_idx" ON "channel_daily" USING btree ("platform","day");