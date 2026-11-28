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
  // 0009: YouTube Analytics
  `CREATE TABLE IF NOT EXISTS "channel_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(20) NOT NULL,
	"day" date NOT NULL,
	"views" integer,
	"watch_minutes" integer,
	"subscribers_gained" integer,
	"subscribers_lost" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "views" integer`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "watch_minutes" integer`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "avg_view_percent" real`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "subscribers_gained" integer`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "likes" integer`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "comments_count" integer`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "stats_updated_at" timestamp with time zone`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "page_views" integer DEFAULT 0 NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "channel_daily_platform_day_idx" ON "channel_daily" USING btree ("platform","day")`,
  // 0010: site logo
  `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logo_data" text`,
  // 0011: per-video comment bot switch (existing keyword videos are switched on once)
  `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'videos' AND column_name = 'bot_enabled') THEN
    ALTER TABLE "videos" ADD COLUMN "bot_enabled" boolean DEFAULT false NOT NULL;
    -- Once, when the switch is added: videos that already had a keyword keep replying.
    UPDATE "videos" SET "bot_enabled" = true WHERE "keyword" IS NOT NULL AND btrim("keyword") <> '';
  END IF;
END $$;`,
  // 0012: uploaded documents sent as downloads
  `CREATE TABLE IF NOT EXISTS "video_attachments" (
	"video_id" uuid PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "attachment_name" varchar(300)`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "attachment_type" varchar(150)`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "attachment_size" integer`,
  `DO $$ BEGIN
 ALTER TABLE "video_attachments" ADD CONSTRAINT "video_attachments_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$`,
  // 0013: upload packages waiting for their videos
  `CREATE TABLE IF NOT EXISTS "planned_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(300) NOT NULL,
	"youtube_title" varchar(300),
	"instagram_caption" text,
	"keywords" varchar(300) NOT NULL,
	"prompt_name" varchar(200),
	"prompt" text NOT NULL,
	"extra_link" varchar(500),
	"matched_video_ids" text[] DEFAULT '{}' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  // 0014: prompt vs resource wording, formatted Word documents
  `ALTER TABLE "video_attachments" ADD COLUMN IF NOT EXISTS "html" text`,
  `ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "content_kind" varchar(20)`,
  // Tables added by these patches after the first setup: keep them closed to Supabase's Data API
  // like the rest (the app connects as the table owner, which RLS doesn't restrict).
  `DO $$ DECLARE t record; BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
  END $$`,
];
// Newest first. A new patch MUST come with its migration added at the top: the fast path in
// ensureSchemaPatches skips every patch once the newest hash is recorded.
const MIGRATIONS = [
  { hash: "4ec800fa75073f36af6829d50000d8177e86aa3df0017cde5e6ff2dc2255437b", createdAt: 1795830460478 },
  { hash: "6de8ac25eb3910549521420f33f81d7421d557db16c07d643306d8117054bbdf", createdAt: 1795667530871 },
  { hash: "f9b08cd7a8044a022e8ca1546d79bdfc67c06a63477206c46b351e7ff57b1a82", createdAt: 1795287698555 },
  { hash: "26288163fe3d474693ec16dca26ce105a59025a09674602ace5c6a9131d9774a", createdAt: 1795280043342 },
  { hash: "595e0bb7af0fc1261cb0558e80bd6e17f0786621a6d3902a139f59e3d1024771", createdAt: 1795134560534 },
  { hash: "810a7078ba04471780ad6cdda2995e060aefe2f21d9171aab603a72a286f4837", createdAt: 1795133040078 },
  { hash: "51f3dea35b6e9a5853b7abca7885ae7122c0b8913fef087806107be12c7aa85b", createdAt: 1795057961922 },
  { hash: "e21c0cbd32b31e4c0afde5e80482000c47fa270c80f86aad7d7a17418ee7ea85", createdAt: 1795060954864 },
];

let applied: Promise<void> | null = null;

export function ensureSchemaPatches(): Promise<void> {
  applied ??= (async () => {
    // Fast path: the newest migration is already recorded, so every patch above has run before.
    // One quick query instead of ~25 (each a round trip to the database) on every cold start.
    const newest = MIGRATIONS[0]!;
    const done = await pool
      .query(`SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = $1 LIMIT 1`, [newest.hash])
      .then((r) => (r.rowCount ?? 0) > 0)
      .catch(() => false);
    if (done) return;
    // All statements in one round trip (simple query protocol runs them in order).
    await pool.query(PATCHES.map((sql) => `${sql};`).join("\n"));
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
