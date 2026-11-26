CREATE TABLE IF NOT EXISTS "planned_posts" (
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
);
