import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Comment auto-reply bot (packages/comment-bot). One row per connected social account.
 * `platform` is the primary key because the bot serves a single owner: one YouTube
 * channel and one Instagram professional account.
 */
export const socialConnections = pgTable("social_connections", {
  /** "YOUTUBE" | "INSTAGRAM" */
  platform: varchar("platform", { length: 20 }).primaryKey(),
  /** YouTube channel id, or the Instagram professional account id that webhooks carry as entry.id. */
  accountId: varchar("account_id", { length: 100 }).notNull(),
  accountName: varchar("account_name", { length: 200 }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Every comment the bot has seen, and what it did about it. The (platform, comment_id)
 * unique index is what makes processing idempotent: webhook retries and overlapping
 * polls can never reply twice to the same comment.
 */
export const commentReplies = pgTable(
  "comment_replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: varchar("platform", { length: 20 }).notNull(),
    commentId: varchar("comment_id", { length: 200 }).notNull(),
    /** YouTube video id or Instagram media id. */
    mediaId: varchar("media_id", { length: 200 }),
    parentCommentId: varchar("parent_comment_id", { length: 200 }),
    authorId: varchar("author_id", { length: 200 }),
    authorName: varchar("author_name", { length: 200 }),
    commentText: text("comment_text").notNull(),
    commentedAt: timestamp("commented_at", { withTimezone: true }),
    /** PROCESSING | REPLIED | SKIPPED | FAILED */
    status: varchar("status", { length: 20 }).notNull().default("PROCESSING"),
    /** KEYWORD | AI_ANSWER | KEYWORD_AND_ANSWER | NONE */
    action: varchar("action", { length: 30 }).notNull().default("NONE"),
    matchedKeyword: varchar("matched_keyword", { length: 100 }),
    publicReply: text("public_reply"),
    privateReply: text("private_reply"),
    skipReason: text("skip_reason"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    platformComment: uniqueIndex("comment_replies_platform_comment_idx").on(t.platform, t.commentId),
    statusIdx: index("comment_replies_status_idx").on(t.status),
    createdIdx: index("comment_replies_created_idx").on(t.createdAt),
  }),
);
