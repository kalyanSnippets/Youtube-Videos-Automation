CREATE TYPE "public"."presentation_mode" AS ENUM('FACE_LED', 'HYBRID', 'FACELESS');--> statement-breakpoint
CREATE TYPE "public"."segment_type" AS ENUM('ON_CAMERA', 'VOICEOVER', 'SCREEN_RECORDING', 'PRODUCT_RESULT', 'B_ROLL', 'MOTION_GRAPHIC', 'SCREENSHOT');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aroll_shots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"production_scene_id" uuid,
	"shot_number" integer NOT NULL,
	"narration" text NOT NULL,
	"shot_type" varchar(100),
	"camera_position" varchar(100),
	"framing" varchar(100),
	"energy" varchar(100),
	"duration_min_seconds" integer,
	"duration_max_seconds" integer,
	"delivery" varchar(150),
	"standing_or_seated" varchar(20),
	"background_suggestion" text,
	"props" text,
	"screen_insert_interrupts" boolean DEFAULT false NOT NULL,
	"punch_in" boolean DEFAULT false NOT NULL,
	"captions_on_screen" boolean DEFAULT true NOT NULL,
	"camera_guidance" text,
	"filename" varchar(300) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "presentation_mode" "presentation_mode" DEFAULT 'HYBRID' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "presentation_mode_is_recommended" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reference_videos" ADD COLUMN "presentation_mode" "presentation_mode" DEFAULT 'HYBRID' NOT NULL;--> statement-breakpoint
ALTER TABLE "reference_videos" ADD COLUMN "on_camera_segments" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "video_ideas" ADD COLUMN "recommended_presentation_mode" "presentation_mode" DEFAULT 'HYBRID' NOT NULL;--> statement-breakpoint
ALTER TABLE "production_scenes" ADD COLUMN "segment_type" "segment_type" DEFAULT 'SCREEN_RECORDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "production_scenes" ADD COLUMN "screen_insert_interrupts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "production_scenes" ADD COLUMN "punch_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "production_scenes" ADD COLUMN "picture_in_picture_layout" varchar(50);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aroll_shots" ADD CONSTRAINT "aroll_shots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aroll_shots" ADD CONSTRAINT "aroll_shots_production_scene_id_production_scenes_id_fk" FOREIGN KEY ("production_scene_id") REFERENCES "public"."production_scenes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN IF EXISTS "face_mode";