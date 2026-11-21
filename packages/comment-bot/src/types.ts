export type Platform = "YOUTUBE" | "INSTAGRAM";

/** One resource from the in-app Resources editor, as the bot sees it. */
export interface LibraryEntry {
  /** Canonical keyword (first one listed), upper-cased. */
  keyword: string;
  /** Every keyword/alias that triggers this entry, upper-cased. */
  keywords: string[];
  title: string;
  link?: string;
  /** The prompt / resource text that gets delivered. */
  message: string;
  /** Public page for this resource on the site, e.g. https://site/r/fable. Linked in every delivery. */
  url?: string;
  /** Video/post ids this entry belongs to. When two entries share a keyword, a comment on one of these wins. */
  mediaIds?: string[];
  /** An uploaded document sent as a download link instead of the prompt text. */
  file?: { name: string; url: string };
  /** Keyword is set but the prompt isn't added yet: reply with the page link and "coming soon". */
  comingSoon?: boolean;
}

export interface PromptLibrary {
  /** "About me" notes from Site settings: who you are, gear, schedule, FAQs. Fed to the AI, never shown publicly. */
  about: string;
  entries: LibraryEntry[];
  /** Problems worth showing on the Comment Bot page (e.g. no resources yet). */
  warnings: string[];
  /** Reply wording from the admin "Reply messages" page; defaults when absent. */
  templates?: import("./templates").ReplyTemplates;
  /** Home page of the public site, for {site} in messages. */
  siteUrl?: string;
  /**
   * Video / post ids whose bot switch is on. When set, comments on anything else get no reply.
   * Left out (tests, old setups) means every video is on.
   */
  enabledMediaIds?: Set<string>;
}

/** A comment normalised across platforms. */
export interface IncomingComment {
  platform: Platform;
  commentId: string;
  text: string;
  authorId?: string;
  authorName?: string;
  mediaId?: string;
  /** Set when this comment is a reply inside a thread rather than a top-level comment. */
  parentCommentId?: string;
  commentedAt?: Date;
}

export interface MediaContext {
  title?: string;
  /** YouTube description or Instagram caption. */
  description?: string;
  url?: string;
}

/** What the bot decided to say. Either side may be absent. */
export interface ReplyPlan {
  action: "KEYWORD" | "AI_ANSWER" | "KEYWORD_AND_ANSWER" | "GENERAL" | "NONE";
  matchedKeyword?: string;
  /** Posted publicly under the comment. */
  publicReply?: string;
  /** Sent as an Instagram private reply (DM). Never used on YouTube, which has no DMs. */
  privateReply?: string;
  skipReason?: string;
}
