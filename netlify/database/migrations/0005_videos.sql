CREATE TABLE IF NOT EXISTS "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(20) NOT NULL,
	"external_id" varchar(200) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"watch_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(1000),
	"published_at" timestamp with time zone,
	"keyword" varchar(100),
	"prompt" text,
	"prompt_source" varchar(40),
	"prompt_filename" varchar(300),
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "videos_platform_external_idx" ON "videos" USING btree ("platform","external_id");