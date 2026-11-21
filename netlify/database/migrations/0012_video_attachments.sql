CREATE TABLE IF NOT EXISTS "video_attachments" (
	"video_id" uuid PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "attachment_name" varchar(300);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "attachment_type" varchar(150);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "attachment_size" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_attachments" ADD CONSTRAINT "video_attachments_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
