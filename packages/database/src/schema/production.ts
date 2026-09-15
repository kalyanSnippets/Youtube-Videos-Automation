import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { scripts } from "./scripts";
import { motionIntensityEnum } from "./enums";

export const productionScenes = pgTable("production_scenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  scriptId: uuid("script_id")
    .notNull()
    .references(() => scripts.id, { onDelete: "cascade" }),
  sceneNumber: integer("scene_number").notNull(),
  timeEstimateSeconds: integer("time_estimate_seconds").notNull().default(0),
  narration: text("narration").notNull(),
  storyPurpose: text("story_purpose"),
  viewerMustSee: text("viewer_must_see"),
  whyThisVisual: text("why_this_visual"),
  claimIds: jsonb("claim_ids").$type<string[]>().default([]),
  proofRequired: text("proof_required"),
  assetType: varchar("asset_type", { length: 50 }),
  assetFilename: varchar("asset_filename", { length: 300 }),
  toolToUse: varchar("tool_to_use", { length: 200 }),
  captureOrGenerationSteps: text("capture_or_generation_steps"),
  exactGenerationPrompt: text("exact_generation_prompt"),
  screenRecordingInstructions: text("screen_recording_instructions"),
  privacyWarnings: text("privacy_warnings"),
  motionComponent: varchar("motion_component", { length: 100 }),
  motionIntensity: motionIntensityEnum("motion_intensity").notNull().default("MEDIUM"),
  onScreenText: text("on_screen_text"),
  captionEmphasis: text("caption_emphasis"),
  sfx: varchar("sfx", { length: 200 }),
  transition: varchar("transition", { length: 100 }),
  editorInstruction: text("editor_instruction"),
  fallbackIfAssetMissing: text("fallback_if_asset_missing"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const SHOT_TYPES = ["SCREEN_RECORDING", "GENERATIVE"] as const;

export const shotListItems = pgTable("shot_list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  productionSceneId: uuid("production_scene_id").references(() => productionScenes.id, { onDelete: "cascade" }),
  shotType: text("shot_type", { enum: SHOT_TYPES }).notNull(),
  filename: varchar("filename", { length: 300 }).notNull(),
  // screen recording fields
  software: varchar("software", { length: 200 }),
  shortcut: varchar("shortcut", { length: 200 }),
  windowSetup: text("window_setup"),
  exactSequence: text("exact_sequence"),
  cursorBehavior: text("cursor_behavior"),
  durationSeconds: integer("duration_seconds"),
  exportFormat: varchar("export_format", { length: 50 }),
  // generative fields
  toolOrModel: varchar("tool_or_model", { length: 200 }),
  prompt: text("prompt"),
  negativePrompt: text("negative_prompt"),
  aspectRatio: varchar("aspect_ratio", { length: 20 }),
  maxAttempts: integer("max_attempts").default(3),
  acceptanceCriteria: text("acceptance_criteria"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const asset_requirementStatuses = ["MISSING", "IN_PROGRESS", "READY"] as const;

export const assetRequirements = pgTable("asset_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  productionSceneId: uuid("production_scene_id").references(() => productionScenes.id, { onDelete: "cascade" }),
  shotListItemId: uuid("shot_list_item_id").references(() => shotListItems.id, { onDelete: "set null" }),
  assetId: uuid("asset_id"),
  expectedFilename: varchar("expected_filename", { length: 300 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  status: text("status", { enum: asset_requirementStatuses }).notNull().default("MISSING"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
