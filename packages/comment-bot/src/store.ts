import { and, desc, eq, gt, inArray, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import type { IncomingComment, Platform } from "./types";

export const MAX_ATTEMPTS = 3;
/** A PROCESSING row older than this is assumed to belong to a crashed run and may be retried. */
const STALE_PROCESSING_MS = 10 * 60 * 1000;

export type CommentRow = typeof schema.commentReplies.$inferSelect;
export type ConnectionRow = typeof schema.socialConnections.$inferSelect;
export type CommentStatus = "PROCESSING" | "REPLIED" | "SKIPPED" | "FAILED" | "DRY_RUN";

export interface CommentPatch {
  status?: CommentStatus;
  action?: string;
  matchedKeyword?: string | null;
  publicReply?: string | null;
  privateReply?: string | null;
  skipReason?: string | null;
  error?: string | null;
}

export interface BotStore {
  /** Atomically take ownership of a comment. Returns the row (with anything already sent) or null if another run owns it / it is done. */
  claim(comment: IncomingComment): Promise<CommentRow | null>;
  update(platform: Platform, commentId: string, patch: CommentPatch): Promise<void>;
  /** Comment ids that need no more work (done, or failed too many times, or in flight). */
  settledIds(platform: Platform, commentIds: string[]): Promise<Set<string>>;
  /** Same author already got this keyword on this media in the last day. */
  alreadyDelivered(platform: Platform, comment: IncomingComment, keyword: string): Promise<boolean>;
  retryable(platform: Platform, limit: number): Promise<CommentRow[]>;
}

export function rowToComment(row: CommentRow): IncomingComment {
  return {
    platform: row.platform as Platform,
    commentId: row.commentId,
    text: row.commentText,
    authorId: row.authorId ?? undefined,
    authorName: row.authorName ?? undefined,
    mediaId: row.mediaId ?? undefined,
    parentCommentId: row.parentCommentId ?? undefined,
    commentedAt: row.commentedAt ?? undefined,
  };
}

const t = schema.commentReplies;

function retryCondition() {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  return and(
    lt(t.attempts, MAX_ATTEMPTS),
    or(eq(t.status, "FAILED"), and(eq(t.status, "PROCESSING"), lt(t.updatedAt, staleBefore))),
  );
}

export const dbStore: BotStore = {
  async claim(comment) {
    const inserted = await db
      .insert(t)
      .values({
        platform: comment.platform,
        commentId: comment.commentId,
        mediaId: comment.mediaId,
        parentCommentId: comment.parentCommentId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        commentText: comment.text,
        commentedAt: comment.commentedAt,
        status: "PROCESSING",
        attempts: 1,
      })
      .onConflictDoNothing({ target: [t.platform, t.commentId] })
      .returning();
    if (inserted[0]) return inserted[0];
    const retried = await db
      .update(t)
      .set({ status: "PROCESSING", attempts: sql`${t.attempts} + 1`, updatedAt: new Date() })
      .where(and(eq(t.platform, comment.platform), eq(t.commentId, comment.commentId), retryCondition()))
      .returning();
    return retried[0] ?? null;
  },

  async update(platform, commentId, patch) {
    await db
      .update(t)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(t.platform, platform), eq(t.commentId, commentId)));
  },

  async settledIds(platform, commentIds) {
    if (!commentIds.length) return new Set();
    const rows = await db
      .select({ commentId: t.commentId, status: t.status, attempts: t.attempts, updatedAt: t.updatedAt })
      .from(t)
      .where(and(eq(t.platform, platform), inArray(t.commentId, commentIds)));
    const staleBefore = Date.now() - STALE_PROCESSING_MS;
    return new Set(
      rows
        .filter((r) => {
          const retry =
            r.attempts < MAX_ATTEMPTS && (r.status === "FAILED" || (r.status === "PROCESSING" && r.updatedAt.getTime() < staleBefore));
          return !retry;
        })
        .map((r) => r.commentId),
    );
  },

  async alreadyDelivered(platform, comment, keyword) {
    if (!comment.authorId) return false;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db
      .select({ id: t.id })
      .from(t)
      .where(
        and(
          eq(t.platform, platform),
          eq(t.authorId, comment.authorId),
          comment.mediaId ? eq(t.mediaId, comment.mediaId) : sql`true`,
          eq(t.matchedKeyword, keyword),
          eq(t.status, "REPLIED"),
          ne(t.commentId, comment.commentId),
          gt(t.createdAt, since),
        ),
      )
      .limit(1);
    return rows.length > 0;
  },

  async retryable(platform, limit) {
    return db
      .select()
      .from(t)
      .where(and(eq(t.platform, platform), retryCondition()))
      .orderBy(t.createdAt)
      .limit(limit);
  },
};

export async function getConnection(platform: Platform): Promise<ConnectionRow | null> {
  const [row] = await db.select().from(schema.socialConnections).where(eq(schema.socialConnections.platform, platform));
  return row ?? null;
}

export async function saveConnection(row: typeof schema.socialConnections.$inferInsert): Promise<void> {
  const now = new Date();
  await db
    .insert(schema.socialConnections)
    .values({ ...row, connectedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.socialConnections.platform,
      set: { ...row, connectedAt: now, updatedAt: now },
    });
}

export async function updateConnectionToken(platform: Platform, accessToken: string, expiresAt: Date): Promise<void> {
  await db
    .update(schema.socialConnections)
    .set({ accessToken, accessTokenExpiresAt: expiresAt, updatedAt: new Date() })
    .where(eq(schema.socialConnections.platform, platform));
}

export async function listConnections(): Promise<ConnectionRow[]> {
  return db.select().from(schema.socialConnections);
}

export async function recentComments(limit = 50): Promise<CommentRow[]> {
  return db.select().from(t).orderBy(desc(t.createdAt)).limit(limit);
}

export async function replyStats(): Promise<Record<string, number>> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ status: t.status, n: sql<number>`count(*)::int` })
    .from(t)
    .where(and(gt(t.createdAt, since), isNotNull(t.status)))
    .groupBy(t.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
