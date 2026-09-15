import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { assets } from "./assets";
import { claimTypeEnum, consensusSentimentEnum } from "./enums";

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  claimText: text("claim_text").notNull(),
  claimType: claimTypeEnum("claim_type").notNull().default("UNVERIFIED"),
  confidence: integer("confidence").notNull().default(0),
  safeWording: text("safe_wording"),
  forbiddenWording: text("forbidden_wording"),
  contraryEvidence: text("contrary_evidence"),
  proofAssetRequired: boolean("proof_asset_required").notNull().default(false),
  proofAssetId: uuid("proof_asset_id").references(() => assets.id, { onDelete: "set null" }),
  sourceFreshness: varchar("source_freshness", { length: 100 }),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: varchar("verified_by", { length: 200 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const CLAIM_SOURCE_KINDS = ["OFFICIAL", "INDEPENDENT", "COMMUNITY", "OUR_TEST"] as const;

export const claimSources = pgTable("claim_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id")
    .notNull()
    .references(() => claims.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 30 }).notNull().default("OFFICIAL"),
  title: varchar("title", { length: 300 }).notNull(),
  publisher: varchar("publisher", { length: 200 }),
  url: text("url"),
  publishedDate: timestamp("published_date", { withTimezone: true }),
  retrievedDate: timestamp("retrieved_date", { withTimezone: true }).notNull().defaultNow(),
  relevance: text("relevance"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const methodologies = pgTable("methodologies", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  samePromptOrInput: text("same_prompt_or_input"),
  numberOfAttempts: integer("number_of_attempts"),
  accountTier: varchar("account_tier", { length: 100 }),
  locationRegion: varchar("location_region", { length: 100 }),
  durationNotes: text("duration_notes"),
  resolutionNotes: text("resolution_notes"),
  scoringMetrics: jsonb("scoring_metrics").$type<{ metric: string; weight: number }[]>().default([]),
  inclusionRules: text("inclusion_rules"),
  exclusionRules: text("exclusion_rules"),
  tierDefinitions: text("tier_definitions"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityConsensus = pgTable("community_consensus", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  topic: varchar("topic", { length: 300 }).notNull(),
  commonPraise: jsonb("common_praise").$type<string[]>().default([]),
  commonCriticism: jsonb("common_criticism").$type<string[]>().default([]),
  disagreement: text("disagreement"),
  frequencyNotes: text("frequency_notes"),
  sentiment: consensusSentimentEnum("sentiment").notNull().default("MIXED"),
  confidence: integer("confidence").notNull().default(0),
  sourceCount: integer("source_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
