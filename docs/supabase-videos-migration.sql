-- Videos feature: run this ONCE in Supabase -> SQL Editor -> New query -> Run.
-- It adds the videos table and records the migration so future `pnpm db:migrate` runs skip it.
BEGIN;
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
INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ('0aa9c5bed86f7aa454cabc44c9148e75662c4e076972acd60bd061ee05dccbe9', 1795056012817);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
COMMIT;
