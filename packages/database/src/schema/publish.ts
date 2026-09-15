import { integer, jsonb, pgTable, real, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { renderJobs } from "./postproduction";

export const publishPackages = pgTable("publish_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  titleOptions: jsonb("title_options").$type<{ title: string; score: number; rationale?: string }[]>().default([]),
  selectedTitle: varchar("selected_title", { length: 300 }),
  thumbnailConcepts: jsonb("thumbnail_concepts").$type<{ concept: string; text: string }[]>().default([]),
  description: text("description"),
  chapters: jsonb("chapters").$type<{ label: string; startSeconds: number }[]>().default([]),
  sourceList: jsonb("source_list").$type<{ title: string; url: string }[]>().default([]),
  disclosures: text("disclosures"),
  pinnedComment: text("pinned_comment"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  communityPost: text("community_post"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shorts = pgTable("shorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  sourceMomentDescription: text("source_moment_description"),
  script: text("script"),
  durationSeconds: integer("duration_seconds"),
  renderJobId: uuid("render_job_id").references(() => renderJobs.id, { onDelete: "set null" }),
  status: varchar("status", { length: 30 }).notNull().default("PLANNED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  impressions: integer("impressions"),
  ctrPercent: real("ctr_percent"),
  retentionFirst30sPercent: real("retention_first_30s_percent"),
  averagePercentageViewed: real("average_percentage_viewed"),
  averageViewDurationSeconds: integer("average_view_duration_seconds"),
  subscriberGain: integer("subscriber_gain"),
  trafficSourceBreakdown: jsonb("traffic_source_breakdown").$type<Record<string, number>>().default({}),
  returningViewerPercent: real("returning_viewer_percent"),
  commentsCount: integer("comments_count"),
  postmortem: text("postmortem"),
  whatToRepeat: jsonb("what_to_repeat").$type<string[]>().default([]),
  whatToChange: jsonb("what_to_change").$type<string[]>().default([]),
  ideaPatternLearnings: jsonb("idea_pattern_learnings").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
