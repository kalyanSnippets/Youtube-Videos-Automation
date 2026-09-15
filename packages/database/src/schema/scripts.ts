import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const SCRIPT_STATUSES = ["DRAFT", "APPROVED", "SUPERSEDED"] as const;

export const scripts = pgTable("scripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  status: text("status", { enum: SCRIPT_STATUSES }).notNull().default("DRAFT"),
  narrationMarkdown: text("narration_markdown").notNull(),
  estimatedWordCount: integer("estimated_word_count"),
  estimatedDurationSeconds: integer("estimated_duration_seconds"),
  claimIds: text("claim_ids").array().default([]),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: text("approved_by"),
  overrodeUnverifiedClaims: boolean("overrode_unverified_claims").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
