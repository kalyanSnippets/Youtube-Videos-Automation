export type Platform = "YOUTUBE" | "INSTAGRAM";

/** One entry in the Google Doc prompt library. */
export interface LibraryEntry {
  /** Canonical keyword (first one listed), upper-cased. */
  keyword: string;
  /** Every keyword/alias that triggers this entry, upper-cased. */
  keywords: string[];
  title: string;
  link?: string;
  /** The prompt / resource text that gets delivered. */
  message: string;
}

export interface PromptLibrary {
  /** Free text before the first KEYWORD block: who you are, what the channel is about, FAQs. Fed to the AI. */
  about: string;
  entries: LibraryEntry[];
  /** Problems found while parsing, shown on the status page so the doc can be fixed. */
  warnings: string[];
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
  action: "KEYWORD" | "AI_ANSWER" | "KEYWORD_AND_ANSWER" | "NONE";
  matchedKeyword?: string;
  /** Posted publicly under the comment. */
  publicReply?: string;
  /** Sent as an Instagram private reply (DM). Never used on YouTube, which has no DMs. */
  privateReply?: string;
  skipReason?: string;
}
