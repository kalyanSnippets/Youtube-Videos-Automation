-- Video formats (Shorts/long, Reels/posts) + follower stats.
-- Run ONCE in Supabase -> SQL Editor -> New query -> Run (after supabase-videos-migration.sql).
BEGIN;
CREATE TABLE IF NOT EXISTS "channel_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(20) NOT NULL,
	"day" date NOT NULL,
	"followers" integer,
	"posts" integer,
	"views" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "format" varchar(20);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "channel_stats_platform_day_idx" ON "channel_stats" USING btree ("platform","day");
INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ('21984e0e52143cbe16ca29040afa7cdb7e8adbd0d406b266d643253603aedee0', 1795056809934);
ALTER TABLE public.channel_stats ENABLE ROW LEVEL SECURITY;
COMMIT;
