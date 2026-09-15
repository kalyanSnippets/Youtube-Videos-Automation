import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { assets } from "./assets";
import { productionScenes } from "./production";
import { localWorkerNodes } from "./core";
import { jobStatusEnum, motionIntensityEnum, qaSeverityEnum, qaStatusEnum, renderJobTypeEnum } from "./enums";

export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sourceAudioAssetId: uuid("source_audio_asset_id").references(() => assets.id, { onDelete: "set null" }),
  provider: varchar("provider", { length: 50 }).notNull().default("MOCK"),
  language: varchar("language", { length: 20 }).notNull().default("en"),
  fullText: text("full_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transcriptWords = pgTable("transcript_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  transcriptId: uuid("transcript_id")
    .notNull()
    .references(() => transcripts.id, { onDelete: "cascade" }),
  wordIndex: integer("word_index").notNull(),
  word: varchar("word", { length: 100 }).notNull(),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  confidence: real("confidence"),
});

export const motionTemplates = pgTable("motion_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  componentKey: varchar("component_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  defaultIntensity: motionIntensityEnum("default_intensity").notNull().default("MEDIUM"),
  remotionComponentPath: varchar("remotion_component_path", { length: 300 }),
  parametersSchema: jsonb("parameters_schema").$type<Record<string, unknown>>().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const editPlanScenes = pgTable("edit_plan_scenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  productionSceneId: uuid("production_scene_id").references(() => productionScenes.id, { onDelete: "set null" }),
  sceneOrder: integer("scene_order").notNull(),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  storyFunction: varchar("story_function", { length: 100 }),
  intensity: motionIntensityEnum("intensity").notNull().default("MEDIUM"),
  primaryAssetId: uuid("primary_asset_id").references(() => assets.id, { onDelete: "set null" }),
  backupAssetId: uuid("backup_asset_id").references(() => assets.id, { onDelete: "set null" }),
  component: varchar("component", { length: 100 }),
  onScreenText: text("on_screen_text"),
  captionEmphasis: text("caption_emphasis"),
  cameraMotion: varchar("camera_motion", { length: 100 }),
  transition: varchar("transition", { length: 100 }),
  sfx: varchar("sfx", { length: 200 }),
  proofOverlay: text("proof_overlay"),
  claimIds: jsonb("claim_ids").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const renderJobs = pgTable("render_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  renderType: renderJobTypeEnum("render_type").notNull().default("ROUGH"),
  status: jobStatusEnum("status").notNull().default("QUEUED"),
  localWorkerNodeId: uuid("local_worker_node_id").references(() => localWorkerNodes.id, { onDelete: "set null" }),
  editPlanSnapshot: jsonb("edit_plan_snapshot").$type<Record<string, unknown>>(),
  outputPath: text("output_path"),
  outputUrl: text("output_url"),
  durationSeconds: integer("duration_seconds"),
  resolution: varchar("resolution", { length: 20 }).notNull().default("1920x1080"),
  progressPercent: integer("progress_percent").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const qaIssues = pgTable("qa_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  renderJobId: uuid("render_job_id").references(() => renderJobs.id, { onDelete: "cascade" }),
  timeCodeMs: integer("time_code_ms"),
  severity: qaSeverityEnum("severity").notNull().default("MEDIUM"),
  problem: text("problem").notNull(),
  whyItHurts: text("why_it_hurts"),
  fix: text("fix"),
  assetOrComponentNeeded: varchar("asset_or_component_needed", { length: 300 }),
  status: qaStatusEnum("status").notNull().default("OPEN"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
