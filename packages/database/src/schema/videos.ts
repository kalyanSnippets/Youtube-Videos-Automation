import { bigint, boolean, date, integer, pgTable, real, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

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
    /** YouTube: "LONG" | "SHORT". Instagram: "REEL" | "POST". Null until the sync classifies it. */
    format: varchar("format", { length: 20 }),
    durationSeconds: integer("duration_seconds"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** Upper-cased trigger word, e.g. "EDIT". Unique across videos and resources (enforced by the app). */
    keyword: varchar("keyword", { length: 100 }),
    /** Friendly name for the prompt, used in the bot's messages and on the page ("Fable 5.2 starter prompts"). Falls back to the video title. */
    resourceTitle: varchar("resource_title", { length: 200 }),
    /** Optional extra link shown with the prompt (a tool, a download). */
    extraLink: varchar("extra_link", { length: 500 }),
    /** Prompt text converted from the uploaded doc/file. Null means "Prompt coming soon". */
    prompt: text("prompt"),
    /** "google-doc" | "docx" | "pdf" | "text" */
    promptSource: varchar("prompt_source", { length: 40 }),
    promptFilename: varchar("prompt_filename", { length: 300 }),
    /**
     * The original uploaded document (Word, PDF, ...), sent to viewers as a download instead of
     * pasted text. The bytes live in video_attachments so listing videos stays light.
     */
    attachmentName: varchar("attachment_name", { length: 300 }),
    attachmentType: varchar("attachment_type", { length: 150 }),
    attachmentSize: integer("attachment_size"),
    /** YouTube Analytics, lifetime totals (refreshed every few hours). Null until the first analytics sync. */
    views: integer("views"),
    watchMinutes: integer("watch_minutes"),
    avgViewPercent: real("avg_view_percent"),
    subscribersGained: integer("subscribers_gained"),
    likes: integer("likes"),
    commentsCount: integer("comments_count"),
    statsUpdatedAt: timestamp("stats_updated_at", { withTimezone: true }),
    /** Visits to this video's page on the public site (/v/<slug>). */
    pageViews: integer("page_views").notNull().default(0),
    /** Hidden videos are kept in admin but not shown publicly or used by the bot. */
    hidden: boolean("hidden").notNull().default(false),
    /** The comment bot replies on this video only while this is on. New videos start off. */
    botEnabled: boolean("bot_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    platformExternal: uniqueIndex("videos_platform_external_idx").on(t.platform, t.externalId),
  }),
);

/** One row per platform per day: subscriber/follower counts, so growth can be shown over time. */
export const channelStats = pgTable(
  "channel_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** "YOUTUBE" | "INSTAGRAM" */
    platform: varchar("platform", { length: 20 }).notNull(),
    day: date("day").notNull(),
    /** YouTube subscribers, or Instagram followers. */
    followers: integer("followers"),
    /** Videos on the channel, or posts on the account. */
    posts: integer("posts"),
    /** YouTube total views (Instagram doesn't report this). */
    views: bigint("views", { mode: "number" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ platformDay: uniqueIndex("channel_stats_platform_day_idx").on(t.platform, t.day) }),
);

/** Channel totals per day from YouTube Analytics (last 28+ days), for the Analytics page charts. */
export const channelDaily = pgTable(
  "channel_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: varchar("platform", { length: 20 }).notNull(),
    day: date("day").notNull(),
    views: integer("views"),
    watchMinutes: integer("watch_minutes"),
    subscribersGained: integer("subscribers_gained"),
    subscribersLost: integer("subscribers_lost"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ platformDay: uniqueIndex("channel_daily_platform_day_idx").on(t.platform, t.day) }),
);

/** The bytes of a video's uploaded document (base64), one row per video. */
export const videoAttachments = pgTable("video_attachments", {
  videoId: uuid("video_id")
    .primaryKey()
    .references(() => videos.id, { onDelete: "cascade" }),
  data: text("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
