CREATE TABLE IF NOT EXISTS "comment_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(20) NOT NULL,
	"comment_id" varchar(200) NOT NULL,
	"media_id" varchar(200),
	"parent_comment_id" varchar(200),
	"author_id" varchar(200),
	"author_name" varchar(200),
	"comment_text" text NOT NULL,
	"commented_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'PROCESSING' NOT NULL,
	"action" varchar(30) DEFAULT 'NONE' NOT NULL,
	"matched_keyword" varchar(100),
	"public_reply" text,
	"private_reply" text,
	"skip_reason" text,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_connections" (
	"platform" varchar(20) PRIMARY KEY NOT NULL,
	"account_id" varchar(100) NOT NULL,
	"account_name" varchar(200),
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "comment_replies_platform_comment_idx" ON "comment_replies" USING btree ("platform","comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_replies_status_idx" ON "comment_replies" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_replies_created_idx" ON "comment_replies" USING btree ("created_at");