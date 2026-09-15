import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { referenceRoleEnum } from "./enums";

export const videoIdeas = pgTable("video_ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  workingTitle: varchar("working_title", { length: 300 }).notNull(),
  hook: text("hook").notNull(),
  referenceCreator: varchar("reference_creator", { length: 200 }),
  referenceVideoUrl: text("reference_video_url"),
  whyNow: text("why_now"),
  audienceProblem: text("audience_problem"),
  trendScore: integer("trend_score").notNull().default(0),
  evergreenScore: integer("evergreen_score").notNull().default(0),
  clickPotential: integer("click_potential").notNull().default(0),
  evidenceStrength: integer("evidence_strength").notNull().default(0),
  novelty: integer("novelty").notNull().default(0),
  productionDifficulty: integer("production_difficulty").notNull().default(0),
  sponsorFit: integer("sponsor_fit").notNull().default(0),
  proofRequirements: jsonb("proof_requirements").$type<string[]>().default([]),
  overallScore: integer("overall_score").notNull().default(0),
  rank: integer("rank"),
  isSelected: boolean("is_selected").notNull().default(false),
  sourceProvider: varchar("source_provider", { length: 50 }).notNull().default("MOCK"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referenceVideos = pgTable("reference_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  channelName: varchar("channel_name", { length: 200 }),
  role: referenceRoleEnum("role").notNull().default("SUPPORTING"),
  titleLogic: text("title_logic"),
  thumbnailLogic: text("thumbnail_logic"),
  hookAnalysis: text("hook_analysis"),
  first30sAnalysis: text("first_30s_analysis"),
  chapterStructure: jsonb("chapter_structure").$type<{ label: string; startSeconds: number }[]>().default([]),
  pacingNotes: text("pacing_notes"),
  tensionNotes: text("tension_notes"),
  proofSequenceNotes: text("proof_sequence_notes"),
  payoffNotes: text("payoff_notes"),
  ctaNotes: text("cta_notes"),
  visualNotes: text("visual_notes"),
  whyItWorked: text("why_it_worked"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
