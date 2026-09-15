import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { integrationServiceEnum, integrationStatusEnum, jobStatusEnum, jobTypeEnum, agentNameEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const channelProfiles = pgTable("channel_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  niche: varchar("niche", { length: 200 }).notNull().default("AI tools / practical technology"),
  format: varchar("format", { length: 50 }).notNull().default("faceless"),
  audience: varchar("audience", { length: 200 }).notNull().default("Beginner/intermediate"),
  narrationStyle: varchar("narration_style", { length: 100 }).notNull().default("Real human voice"),
  targetLengthMinMinutes: integer("target_length_min_minutes").notNull().default(6),
  targetLengthMaxMinutes: integer("target_length_max_minutes").notNull().default(10),
  visualStyle: varchar("visual_style", { length: 200 }).notNull().default("Premium tech + controlled hyper-motion"),
  budgetTier: varchar("budget_tier", { length: 50 }).notNull().default("low_free_first"),
  publishingCadence: varchar("publishing_cadence", { length: 100 }).notNull().default("weekly"),
  trustPolicy: jsonb("trust_policy")
    .notNull()
    .$type<{ order: string[] }>()
    .default({ order: ["official_sources", "our_controlled_test", "community_consensus"] }),
  assetPriority: jsonb("asset_priority")
    .notNull()
    .$type<string[]>()
    .default([
      "real_screen_recording",
      "actual_generated_output",
      "primary_evidence_screenshot",
      "motion_graphic",
      "ai_broll",
      "generic_stock",
    ]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const integrationSettings = pgTable("integration_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  service: integrationServiceEnum("service").notNull(),
  status: integrationStatusEnum("status").notNull().default("NOT_CONNECTED"),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  errorMessage: text("error_message"),
  connectedAt: timestamp("connected_at", { withTimezone: true }),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const localWorkerNodes = pgTable("local_worker_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  machineId: varchar("machine_id", { length: 200 }).notNull().unique(),
  isOnline: boolean("is_online").notNull().default(false),
  capabilities: jsonb("capabilities").$type<string[]>().default([]),
  lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: uuid("project_id"),
  jobType: jobTypeEnum("job_type").notNull(),
  agentName: agentNameEnum("agent_name"),
  status: jobStatusEnum("status").notNull().default("QUEUED"),
  input: jsonb("input").$type<Record<string, unknown>>().default({}),
  output: jsonb("output").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  retries: integer("retries").notNull().default(0),
  costTokens: integer("cost_tokens"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
