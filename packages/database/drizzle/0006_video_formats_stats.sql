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