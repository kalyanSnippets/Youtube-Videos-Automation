import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { workspaces } from "./core";
import { actorTypeEnum, contentTypeEnum, stageEnum } from "./enums";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 320 }).notNull().unique(),
  contentType: contentTypeEnum("content_type").notNull(),
  seedIdea: text("seed_idea"),
  targetDurationMinutes: integer("target_duration_minutes").notNull().default(8),
  language: varchar("language", { length: 20 }).notNull().default("en"),
  budgetTier: varchar("budget_tier", { length: 50 }).notNull().default("low_free_first"),
  evergreenOrTrend: varchar("evergreen_or_trend", { length: 20 }).notNull().default("evergreen"),
  faceMode: varchar("face_mode", { length: 20 }).notNull().default("faceless"),
  researchDepth: varchar("research_depth", { length: 20 }).notNull().default("standard"),
  currentStage: stageEnum("current_stage").notNull().default("IDEA_RESEARCH"),
  selectedIdeaId: uuid("selected_idea_id"),
  claimOverrideAt: timestamp("claim_override_at", { withTimezone: true }),
  claimOverrideReason: text("claim_override_reason"),
  finalRenderApprovedAt: timestamp("final_render_approved_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  youtubeVideoId: varchar("youtube_video_id", { length: 100 }),
  isDemo: boolean("is_demo").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectStageHistory = pgTable("project_stage_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fromStage: stageEnum("from_stage"),
  toStage: stageEnum("to_stage").notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorLabel: varchar("actor_label", { length: 200 }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectActivity = pgTable("project_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorLabel: varchar("actor_label", { length: 200 }),
  action: varchar("action", { length: 200 }).notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
