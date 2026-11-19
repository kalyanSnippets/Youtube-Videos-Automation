import { boolean, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * One row per video on the creator's YouTube channel or Instagram account. Rows are created and
 * refreshed by the hourly sync (apps/web/src/lib/video-sync.ts). The creator adds the keyword and
 * prompt on the Videos page; the platform never overwrites those.
 */
export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** "YOUTUBE" | "INSTAGRAM" */
    platform: varchar("platform", { length: 20 }).notNull(),
    /** YouTube video id, or Instagram media id. */
    externalId: varchar("external_id", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 300 }).notNull(),
    /** YouTube description, or Instagram caption. */
    description: text("description"),
    /** Where viewers go to watch: youtu.be link or Instagram permalink. */
    watchUrl: varchar("watch_url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** Upper-cased trigger word, e.g. "EDIT". Unique across videos and resources (enforced by the app). */
    keyword: varchar("keyword", { length: 100 }),
    /** Prompt text converted from the uploaded doc/file. Null means "Prompt coming soon". */
    prompt: text("prompt"),
    /** "google-doc" | "docx" | "pdf" | "text" */
    promptSource: varchar("prompt_source", { length: 40 }),
    promptFilename: varchar("prompt_filename", { length: 300 }),
    /** Hidden videos are kept in admin but not shown publicly or used by the bot. */
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    platformExternal: uniqueIndex("videos_platform_external_idx").on(t.platform, t.externalId),
  }),
);
