ALTER TABLE "aroll_shots" ADD COLUMN "status" "asset_status" DEFAULT 'MISSING' NOT NULL;--> statement-breakpoint
ALTER TABLE "aroll_shots" ADD COLUMN "local_path" text;