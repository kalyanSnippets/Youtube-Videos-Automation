import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseInstagramWebhook, verifyMetaSignature } from "./instagram";
import { createOAuthState, verifyOAuthState } from "./oauth-state";

describe("verifyMetaSignature", () => {
  const body = '{"object":"instagram"}';
  const good = "sha256=" + createHmac("sha256", "s3cret").update(body).digest("hex");
  it("accepts a valid signature", () => expect(verifyMetaSignature(body, good, "s3cret")).toBe(true));
  it("rejects a wrong secret, tampered body or missing header", () => {
    expect(verifyMetaSignature(body, good, "other")).toBe(false);
    expect(verifyMetaSignature(body + " ", good, "s3cret")).toBe(false);
    expect(verifyMetaSignature(body, null, "s3cret")).toBe(false);
  });
});

describe("parseInstagramWebhook", () => {
  const payload = {
    object: "instagram",
    entry: [
      {
        id: "IG_ME",
        time: 1_700_000_000,
        changes: [
          { field: "comments", value: { id: "c1", text: "FABLE", from: { id: "u1", username: "ravi" }, media: { id: "m1" } } },
          { field: "comments", value: { id: "c2", text: "Sent! Check your DMs", from: { id: "IG_ME", username: "me" }, media: { id: "m1" }, parent_id: "c1" } },
          { field: "messages", value: {} },
        ],
      },
    ],
  };
  it("returns other people's comments and drops the account's own replies", () => {
    const events = parseInstagramWebhook(payload);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ accountId: "IG_ME", comment: { commentId: "c1", authorName: "ravi", mediaId: "m1", text: "FABLE" } });
  });
  it("ignores non-instagram payloads", () => expect(parseInstagramWebhook({ object: "page" })).toEqual([]));
});

describe("OAuth state", () => {
  it("round-trips and rejects tampering, wrong platform and old states", () => {
    const now = 1_000_000;
    const s = createOAuthState("YOUTUBE", "k", now);
    expect(verifyOAuthState(s, "YOUTUBE", "k", now + 1000)).toBe(true);
    expect(verifyOAuthState(s, "INSTAGRAM", "k", now)).toBe(false);
    expect(verifyOAuthState(s, "YOUTUBE", "other", now)).toBe(false);
    expect(verifyOAuthState(s, "YOUTUBE", "k", now + 16 * 60 * 1000)).toBe(false);
  });
});
