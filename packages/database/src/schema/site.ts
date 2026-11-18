import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Public resources site. Each resource is a prompt/template viewers can open at /r/<slug>,
 * and its keywords are what the comment bot listens for ("comment FABLE to get it").
 */
export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  /** Upper-cased trigger words, e.g. ["FABLE", "FABLE5"]. Unique across resources (enforced by the app). */
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
  /** One or two lines shown on the card and at the top of the page. */
  summary: text("summary"),
  /** The prompt / resource text itself. This is what gets copied and sent. */
  body: text("body").notNull(),
  /** Optional external link (a tool, a download, the video). */
  link: varchar("link", { length: 500 }),
  /** Optional video this resource belongs to (YouTube or Instagram URL). */
  videoUrl: varchar("video_url", { length: 500 }),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Single-row table (id = 1) for the public site's branding and the bot's "about me" notes. */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  siteName: varchar("site_name", { length: 120 }).notNull().default("AI with Kalyan"),
  tagline: varchar("tagline", { length: 300 }).notNull().default("Free AI prompts and templates from my videos. Copy, paste, create."),
  /** Notes the comment bot's AI uses to answer questions in your voice: gear, schedule, FAQs. Never shown publicly. */
  about: text("about").notNull().default(""),
  youtubeUrl: varchar("youtube_url", { length: 300 }),
  instagramUrl: varchar("instagram_url", { length: 300 }),
  newsletterEnabled: boolean("newsletter_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Resource slug (or "home") where they signed up. */
  source: varchar("source", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
