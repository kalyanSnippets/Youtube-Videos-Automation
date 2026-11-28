ALTER TABLE "video_attachments" ADD COLUMN IF NOT EXISTS "html" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "content_kind" varchar(20);