import { describe, expect, it } from "vitest";
import { processComment, type ProcessDeps } from "./processor";
import type { BotStore, CommentPatch, CommentRow } from "./store";
import type { IncomingComment, PromptLibrary } from "./types";

class MemoryStore implements BotStore {
  rows = new Map<string, CommentRow>();
  delivered = false;
  async claim(c: IncomingComment) {
    const existing = this.rows.get(c.commentId);
    if (existing) {
      if (existing.status !== "FAILED" || existing.attempts >= 3) return null;
      existing.status = "PROCESSING";
      existing.attempts++;
      return { ...existing };
    }
    const row = {
      id: c.commentId, platform: c.platform, commentId: c.commentId, mediaId: c.mediaId ?? null, parentCommentId: null,
      authorId: c.authorId ?? null, authorName: c.authorName ?? null, commentText: c.text, commentedAt: null,
      status: "PROCESSING", action: "NONE", matchedKeyword: null, publicReply: null, privateReply: null,
      skipReason: null, error: null, attempts: 1, createdAt: new Date(), updatedAt: new Date(),
    } as CommentRow;
    this.rows.set(c.commentId, row);
    return { ...row };
  }
  async update(_p: string, id: string, patch: CommentPatch) {
    Object.assign(this.rows.get(id)!, patch);
  }
  async settledIds() { return new Set<string>(); }
  async alreadyDelivered() { return this.delivered; }
  async retryable() { return []; }
}

const library: PromptLibrary = { about: "", warnings: [], entries: [{ keyword: "FABLE", keywords: ["FABLE"], title: "Fable", message: "PROMPT" }] };
const comment: IncomingComment = { platform: "INSTAGRAM", commentId: "c1", text: "FABLE", authorId: "u1", authorName: "ravi", mediaId: "m1" };

function setup(opts: { failDM?: number; failPublic?: number; dryRun?: boolean } = {}) {
  const store = new MemoryStore();
  const sent: string[] = [];
  let dmFails = opts.failDM ?? 0;
  let pubFails = opts.failPublic ?? 0;
  const deps: ProcessDeps = {
    store, library, llm: null, dryRun: opts.dryRun,
    senders: {
      async privateReply(_c, text) { if (dmFails-- > 0) throw new Error("dm down"); sent.push(`DM:${text.includes("PROMPT")}`); },
      async publicReply() { if (pubFails-- > 0) throw new Error("reply down"); sent.push("PUBLIC"); },
    },
  };
  return { store, sent, deps };
}

describe("processComment", () => {
  it("sends DM then public reply, once", async () => {
    const { store, sent, deps } = setup();
    expect(await processComment(deps, comment)).toBe("REPLIED");
    expect(await processComment(deps, comment)).toBe("ALREADY_HANDLED");
    expect(sent).toEqual(["DM:true", "PUBLIC"]);
    expect(store.rows.get("c1")).toMatchObject({ status: "REPLIED", action: "KEYWORD", matchedKeyword: "FABLE" });
  });

  it("does not claim 'check your DMs' publicly when the DM failed", async () => {
    const { store, sent, deps } = setup({ failDM: 1 });
    expect(await processComment(deps, comment)).toBe("FAILED");
    expect(sent).toEqual([]);
    expect(store.rows.get("c1")?.error).toBe("dm down");
  });

  it("on retry after a public-reply failure, does not DM twice", async () => {
    const { sent, deps } = setup({ failPublic: 1 });
    expect(await processComment(deps, comment)).toBe("FAILED");
    expect(await processComment(deps, comment)).toBe("REPLIED");
    expect(sent).toEqual(["DM:true", "PUBLIC"]);
  });

  it("skips a repeat keyword from the same person on the same post", async () => {
    const { store, sent, deps } = setup();
    store.delivered = true;
    expect(await processComment(deps, comment)).toBe("SKIPPED");
    expect(sent).toEqual([]);
  });

  it("dry run records the plan and posts nothing", async () => {
    const { store, sent, deps } = setup({ dryRun: true });
    expect(await processComment(deps, comment)).toBe("DRY_RUN");
    expect(sent).toEqual([]);
    expect(store.rows.get("c1")?.privateReply).toContain("PROMPT");
  });
});
