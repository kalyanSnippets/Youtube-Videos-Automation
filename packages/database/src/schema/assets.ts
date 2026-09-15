import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { assetStatusEnum } from "./enums";

export const ASSET_CATEGORIES = [
  "on_camera",
  "screen_recording",
  "screenshot",
  "generated_result",
  "broll",
  "logo",
  "music",
  "sfx",
  "narration",
  "other",
] as const;

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 300 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 300 }),
  durationSeconds: integer("duration_seconds"),
  resolution: varchar("resolution", { length: 20 }),
  codec: varchar("codec", { length: 50 }),
  localPath: text("local_path"),
  cloudUrl: text("cloud_url"),
  status: assetStatusEnum("status").notNull().default("MISSING"),
  sourceType: varchar("source_type", { length: 50 }).notNull().default("generic_stock"),
  claimIds: jsonb("claim_ids").$type<string[]>().default([]),
  captureDate: timestamp("capture_date", { withTimezone: true }),
  checksum: varchar("checksum", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
