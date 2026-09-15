import { integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { jobs } from "./core";
import { agentNameEnum, jobStatusEnum } from "./enums";

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  agentName: agentNameEnum("agent_name").notNull(),
  status: jobStatusEnum("status").notNull().default("QUEUED"),
  providerUsed: text("provider_used").notNull().default("MOCK"),
  inputSummary: text("input_summary"),
  outputSummary: text("output_summary"),
  tokensUsed: integer("tokens_used"),
  costUsd: real("cost_usd"),
  retries: integer("retries").notNull().default(0),
  errorDetails: text("error_details"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentMessages = pgTable("agent_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentRunId: uuid("agent_run_id")
    .notNull()
    .references(() => agentRuns.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["system", "user", "assistant", "tool"] }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
