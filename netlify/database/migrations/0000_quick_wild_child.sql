CREATE TYPE "public"."actor_type" AS ENUM('USER', 'AGENT', 'SYSTEM', 'LOCAL_WORKER');--> statement-breakpoint
CREATE TYPE "public"."agent_name" AS ENUM('ORCHESTRATOR', 'IDEA_RESEARCH', 'COMPETITOR_ANALYST', 'TRUST_CLAIMS_RESEARCHER', 'COMMUNITY_CONSENSUS', 'EXPERIMENT_DESIGNER', 'STORY_WRITER', 'PRODUCTION_DIRECTOR', 'ASSET_PLANNER', 'ASSET_VALIDATOR', 'MOTION_DIRECTOR', 'EDIT_DIRECTOR', 'VIDEO_CRITIC', 'PUBLISHING_STRATEGIST', 'ANALYTICS_REVIEWER');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('MISSING', 'READY', 'GENERATING', 'NEEDS_RECAPTURE', 'PROCESSING', 'INVALID');--> statement-breakpoint
CREATE TYPE "public"."claim_type" AS ENUM('FACT', 'OUR_TEST', 'COMMUNITY', 'OPINION', 'UNVERIFIED');--> statement-breakpoint
CREATE TYPE "public"."consensus_sentiment" AS ENUM('STRONGLY_POSITIVE', 'MOSTLY_POSITIVE', 'MIXED', 'MOSTLY_NEGATIVE', 'WEAK_CONSENSUS');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('experiment', 'comparison', 'tutorial', 'build', 'opinion', 'news_reaction', 'case_study', 'explainer');--> statement-breakpoint
CREATE TYPE "public"."integration_service" AS ENUM('OPENAI', 'ANTHROPIC', 'WEB_RESEARCH', 'YOUTUBE_DATA', 'YOUTUBE_ANALYTICS', 'FILE_STORAGE', 'LOCAL_WORKER', 'WHISPER', 'FFMPEG', 'REMOTION');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('NOT_CONNECTED', 'CONNECTED', 'DEGRADED', 'ERROR', 'COMING_SOON');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('QUEUED', 'RUNNING', 'WAITING_FOR_USER', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('IDEA_RESEARCH', 'COMPETITOR_ANALYSIS', 'CLAIMS_RESEARCH', 'COMMUNITY_CONSENSUS', 'METHODOLOGY_DESIGN', 'SCRIPT_DRAFT', 'PRODUCTION_PLAN', 'ASSET_PLAN', 'ASSET_VALIDATION', 'NARRATION_PROCESS', 'TRANSCRIPTION', 'EDIT_PLAN', 'RENDER_ROUGH', 'RENDER_FINAL', 'VIDEO_QA', 'PUBLISH_PACKAGE', 'ANALYTICS_SYNC');--> statement-breakpoint
CREATE TYPE "public"."motion_intensity" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."qa_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."qa_status" AS ENUM('OPEN', 'ACKNOWLEDGED', 'FIXED', 'WONT_FIX');--> statement-breakpoint
CREATE TYPE "public"."reference_role" AS ENUM('MASTER_REFERENCE', 'SUPPORTING');--> statement-breakpoint
CREATE TYPE "public"."render_job_type" AS ENUM('ROUGH', 'FINAL', 'SHORT');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('IDEA_RESEARCH', 'IDEA_SELECTED', 'REFERENCES_ANALYSED', 'CLAIMS_VERIFIED', 'METHODOLOGY_READY', 'SCRIPT_DRAFTED', 'SCRIPT_APPROVED', 'PRODUCTION_PLAN_READY', 'ASSETS_REQUESTED', 'ASSETS_READY', 'NARRATION_READY', 'TRANSCRIPT_READY', 'EDIT_PLAN_READY', 'ROUGH_RENDERED', 'QA_COMPLETE', 'FINAL_RENDERED', 'PUBLISH_PACKAGE_READY', 'PUBLISHED', 'ANALYTICS_REVIEWED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channel_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"niche" varchar(200) DEFAULT 'AI tools / practical technology' NOT NULL,
	"format" varchar(50) DEFAULT 'faceless' NOT NULL,
	"audience" varchar(200) DEFAULT 'Beginner/intermediate' NOT NULL,
	"narration_style" varchar(100) DEFAULT 'Real human voice' NOT NULL,
	"target_length_min_minutes" integer DEFAULT 6 NOT NULL,
	"target_length_max_minutes" integer DEFAULT 10 NOT NULL,
	"visual_style" varchar(200) DEFAULT 'Premium tech + controlled hyper-motion' NOT NULL,
	"budget_tier" varchar(50) DEFAULT 'low_free_first' NOT NULL,
	"publishing_cadence" varchar(100) DEFAULT 'weekly' NOT NULL,
	"trust_policy" jsonb DEFAULT '{"order":["official_sources","our_controlled_test","community_consensus"]}'::jsonb NOT NULL,
	"asset_priority" jsonb DEFAULT '["real_screen_recording","actual_generated_output","primary_evidence_screenshot","motion_graphic","ai_broll","generic_stock"]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"service" "integration_service" NOT NULL,
	"status" "integration_status" DEFAULT 'NOT_CONNECTED' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"error_message" text,
	"connected_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"job_type" "job_type" NOT NULL,
	"agent_name" "agent_name",
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb,
	"output" jsonb,
	"error_message" text,
	"retries" integer DEFAULT 0 NOT NULL,
	"cost_tokens" integer,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "local_worker_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"machine_id" varchar(200) NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"last_heartbeat_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_worker_nodes_machine_id_unique" UNIQUE("machine_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(200),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_label" varchar(200),
	"action" varchar(200) NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"from_stage" "stage",
	"to_stage" "stage" NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_label" varchar(200),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" varchar(300) NOT NULL,
	"slug" varchar(320) NOT NULL,
	"content_type" "content_type" NOT NULL,
	"seed_idea" text,
	"target_duration_minutes" integer DEFAULT 8 NOT NULL,
	"language" varchar(20) DEFAULT 'en' NOT NULL,
	"budget_tier" varchar(50) DEFAULT 'low_free_first' NOT NULL,
	"evergreen_or_trend" varchar(20) DEFAULT 'evergreen' NOT NULL,
	"face_mode" varchar(20) DEFAULT 'faceless' NOT NULL,
	"research_depth" varchar(20) DEFAULT 'standard' NOT NULL,
	"current_stage" "stage" DEFAULT 'IDEA_RESEARCH' NOT NULL,
	"selected_idea_id" uuid,
	"claim_override_at" timestamp with time zone,
	"claim_override_reason" text,
	"final_render_approved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"youtube_video_id" varchar(100),
	"is_demo" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reference_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" varchar(300) NOT NULL,
	"channel_name" varchar(200),
	"role" "reference_role" DEFAULT 'SUPPORTING' NOT NULL,
	"title_logic" text,
	"thumbnail_logic" text,
	"hook_analysis" text,
	"first_30s_analysis" text,
	"chapter_structure" jsonb DEFAULT '[]'::jsonb,
	"pacing_notes" text,
	"tension_notes" text,
	"proof_sequence_notes" text,
	"payoff_notes" text,
	"cta_notes" text,
	"visual_notes" text,
	"why_it_worked" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"working_title" varchar(300) NOT NULL,
	"hook" text NOT NULL,
	"reference_creator" varchar(200),
	"reference_video_url" text,
	"why_now" text,
	"audience_problem" text,
	"trend_score" integer DEFAULT 0 NOT NULL,
	"evergreen_score" integer DEFAULT 0 NOT NULL,
	"click_potential" integer DEFAULT 0 NOT NULL,
	"evidence_strength" integer DEFAULT 0 NOT NULL,
	"novelty" integer DEFAULT 0 NOT NULL,
	"production_difficulty" integer DEFAULT 0 NOT NULL,
	"sponsor_fit" integer DEFAULT 0 NOT NULL,
	"proof_requirements" jsonb DEFAULT '[]'::jsonb,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"is_selected" boolean DEFAULT false NOT NULL,
	"source_provider" varchar(50) DEFAULT 'MOCK' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"filename" varchar(300) NOT NULL,
	"category" varchar(50) NOT NULL,
	"subject" varchar(300),
	"duration_seconds" integer,
	"resolution" varchar(20),
	"codec" varchar(50),
	"local_path" text,
	"cloud_url" text,
	"status" "asset_status" DEFAULT 'MISSING' NOT NULL,
	"source_type" varchar(50) DEFAULT 'generic_stock' NOT NULL,
	"claim_ids" jsonb DEFAULT '[]'::jsonb,
	"capture_date" timestamp with time zone,
	"checksum" varchar(128),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claim_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"kind" varchar(30) DEFAULT 'OFFICIAL' NOT NULL,
	"title" varchar(300) NOT NULL,
	"publisher" varchar(200),
	"url" text,
	"published_date" timestamp with time zone,
	"retrieved_date" timestamp with time zone DEFAULT now() NOT NULL,
	"relevance" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"claim_text" text NOT NULL,
	"claim_type" "claim_type" DEFAULT 'UNVERIFIED' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"safe_wording" text,
	"forbidden_wording" text,
	"contrary_evidence" text,
	"proof_asset_required" boolean DEFAULT false NOT NULL,
	"proof_asset_id" uuid,
	"source_freshness" varchar(100),
	"checked_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verified_by" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_consensus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"topic" varchar(300) NOT NULL,
	"common_praise" jsonb DEFAULT '[]'::jsonb,
	"common_criticism" jsonb DEFAULT '[]'::jsonb,
	"disagreement" text,
	"frequency_notes" text,
	"sentiment" "consensus_sentiment" DEFAULT 'MIXED' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"source_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "methodologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"same_prompt_or_input" text,
	"number_of_attempts" integer,
	"account_tier" varchar(100),
	"location_region" varchar(100),
	"duration_notes" text,
	"resolution_notes" text,
	"scoring_metrics" jsonb DEFAULT '[]'::jsonb,
	"inclusion_rules" text,
	"exclusion_rules" text,
	"tier_definitions" text,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "methodologies_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"narration_markdown" text NOT NULL,
	"estimated_word_count" integer,
	"estimated_duration_seconds" integer,
	"claim_ids" text[] DEFAULT '{}',
	"approved_at" timestamp with time zone,
	"approved_by" text,
	"overrode_unverified_claims" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"production_scene_id" uuid,
	"shot_list_item_id" uuid,
	"asset_id" uuid,
	"expected_filename" varchar(300) NOT NULL,
	"category" varchar(50) NOT NULL,
	"status" text DEFAULT 'MISSING' NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"script_id" uuid NOT NULL,
	"scene_number" integer NOT NULL,
	"time_estimate_seconds" integer DEFAULT 0 NOT NULL,
	"narration" text NOT NULL,
	"story_purpose" text,
	"viewer_must_see" text,
	"why_this_visual" text,
	"claim_ids" jsonb DEFAULT '[]'::jsonb,
	"proof_required" text,
	"asset_type" varchar(50),
	"asset_filename" varchar(300),
	"tool_to_use" varchar(200),
	"capture_or_generation_steps" text,
	"exact_generation_prompt" text,
	"screen_recording_instructions" text,
	"privacy_warnings" text,
	"motion_component" varchar(100),
	"motion_intensity" "motion_intensity" DEFAULT 'MEDIUM' NOT NULL,
	"on_screen_text" text,
	"caption_emphasis" text,
	"sfx" varchar(200),
	"transition" varchar(100),
	"editor_instruction" text,
	"fallback_if_asset_missing" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shot_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"production_scene_id" uuid,
	"shot_type" text NOT NULL,
	"filename" varchar(300) NOT NULL,
	"software" varchar(200),
	"shortcut" varchar(200),
	"window_setup" text,
	"exact_sequence" text,
	"cursor_behavior" text,
	"duration_seconds" integer,
	"export_format" varchar(50),
	"tool_or_model" varchar(200),
	"prompt" text,
	"negative_prompt" text,
	"aspect_ratio" varchar(20),
	"max_attempts" integer DEFAULT 3,
	"acceptance_criteria" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "edit_plan_scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"production_scene_id" uuid,
	"scene_order" integer NOT NULL,
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"story_function" varchar(100),
	"intensity" "motion_intensity" DEFAULT 'MEDIUM' NOT NULL,
	"primary_asset_id" uuid,
	"backup_asset_id" uuid,
	"component" varchar(100),
	"on_screen_text" text,
	"caption_emphasis" text,
	"camera_motion" varchar(100),
	"transition" varchar(100),
	"sfx" varchar(200),
	"proof_overlay" text,
	"claim_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "motion_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_key" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"category" varchar(100),
	"default_intensity" "motion_intensity" DEFAULT 'MEDIUM' NOT NULL,
	"remotion_component_path" varchar(300),
	"parameters_schema" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "motion_templates_component_key_unique" UNIQUE("component_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qa_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"render_job_id" uuid,
	"time_code_ms" integer,
	"severity" "qa_severity" DEFAULT 'MEDIUM' NOT NULL,
	"problem" text NOT NULL,
	"why_it_hurts" text,
	"fix" text,
	"asset_or_component_needed" varchar(300),
	"status" "qa_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "render_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"render_type" "render_job_type" DEFAULT 'ROUGH' NOT NULL,
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"local_worker_node_id" uuid,
	"edit_plan_snapshot" jsonb,
	"output_path" text,
	"output_url" text,
	"duration_seconds" integer,
	"resolution" varchar(20) DEFAULT '1920x1080' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcript_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transcript_id" uuid NOT NULL,
	"word_index" integer NOT NULL,
	"word" varchar(100) NOT NULL,
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"confidence" real
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"source_audio_asset_id" uuid,
	"provider" varchar(50) DEFAULT 'MOCK' NOT NULL,
	"language" varchar(20) DEFAULT 'en' NOT NULL,
	"full_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"impressions" integer,
	"ctr_percent" real,
	"retention_first_30s_percent" real,
	"average_percentage_viewed" real,
	"average_view_duration_seconds" integer,
	"subscriber_gain" integer,
	"traffic_source_breakdown" jsonb DEFAULT '{}'::jsonb,
	"returning_viewer_percent" real,
	"comments_count" integer,
	"postmortem" text,
	"what_to_repeat" jsonb DEFAULT '[]'::jsonb,
	"what_to_change" jsonb DEFAULT '[]'::jsonb,
	"idea_pattern_learnings" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "publish_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title_options" jsonb DEFAULT '[]'::jsonb,
	"selected_title" varchar(300),
	"thumbnail_concepts" jsonb DEFAULT '[]'::jsonb,
	"description" text,
	"chapters" jsonb DEFAULT '[]'::jsonb,
	"source_list" jsonb DEFAULT '[]'::jsonb,
	"disclosures" text,
	"pinned_comment" text,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"community_post" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "publish_packages_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(300) NOT NULL,
	"source_moment_description" text,
	"script" text,
	"duration_seconds" integer,
	"render_job_id" uuid,
	"status" varchar(30) DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_run_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"job_id" uuid,
	"agent_name" "agent_name" NOT NULL,
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"provider_used" text DEFAULT 'MOCK' NOT NULL,
	"input_summary" text,
	"output_summary" text,
	"tokens_used" integer,
	"cost_usd" real,
	"retries" integer DEFAULT 0 NOT NULL,
	"error_details" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channel_profiles" ADD CONSTRAINT "channel_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "local_worker_nodes" ADD CONSTRAINT "local_worker_nodes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_stage_history" ADD CONSTRAINT "project_stage_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reference_videos" ADD CONSTRAINT "reference_videos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_ideas" ADD CONSTRAINT "video_ideas_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claim_sources" ADD CONSTRAINT "claim_sources_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "claims_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "claims_proof_asset_id_assets_id_fk" FOREIGN KEY ("proof_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_consensus" ADD CONSTRAINT "community_consensus_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "methodologies" ADD CONSTRAINT "methodologies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scripts" ADD CONSTRAINT "scripts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_requirements" ADD CONSTRAINT "asset_requirements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_requirements" ADD CONSTRAINT "asset_requirements_production_scene_id_production_scenes_id_fk" FOREIGN KEY ("production_scene_id") REFERENCES "public"."production_scenes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_requirements" ADD CONSTRAINT "asset_requirements_shot_list_item_id_shot_list_items_id_fk" FOREIGN KEY ("shot_list_item_id") REFERENCES "public"."shot_list_items"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_scenes" ADD CONSTRAINT "production_scenes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "production_scenes" ADD CONSTRAINT "production_scenes_script_id_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shot_list_items" ADD CONSTRAINT "shot_list_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shot_list_items" ADD CONSTRAINT "shot_list_items_production_scene_id_production_scenes_id_fk" FOREIGN KEY ("production_scene_id") REFERENCES "public"."production_scenes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edit_plan_scenes" ADD CONSTRAINT "edit_plan_scenes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edit_plan_scenes" ADD CONSTRAINT "edit_plan_scenes_production_scene_id_production_scenes_id_fk" FOREIGN KEY ("production_scene_id") REFERENCES "public"."production_scenes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edit_plan_scenes" ADD CONSTRAINT "edit_plan_scenes_primary_asset_id_assets_id_fk" FOREIGN KEY ("primary_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edit_plan_scenes" ADD CONSTRAINT "edit_plan_scenes_backup_asset_id_assets_id_fk" FOREIGN KEY ("backup_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qa_issues" ADD CONSTRAINT "qa_issues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qa_issues" ADD CONSTRAINT "qa_issues_render_job_id_render_jobs_id_fk" FOREIGN KEY ("render_job_id") REFERENCES "public"."render_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_local_worker_node_id_local_worker_nodes_id_fk" FOREIGN KEY ("local_worker_node_id") REFERENCES "public"."local_worker_nodes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcript_words" ADD CONSTRAINT "transcript_words_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_source_audio_asset_id_assets_id_fk" FOREIGN KEY ("source_audio_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "publish_packages" ADD CONSTRAINT "publish_packages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shorts" ADD CONSTRAINT "shorts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shorts" ADD CONSTRAINT "shorts_render_job_id_render_jobs_id_fk" FOREIGN KEY ("render_job_id") REFERENCES "public"."render_jobs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
