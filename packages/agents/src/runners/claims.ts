import { randomUUID } from "node:crypto";
import { schema } from "@yaos/database";
import type { Database } from "@yaos/database";
import { ClaimSchema, safeValidate, type Claim } from "@yaos/agent-schemas";
import type { AIProviderId } from "@yaos/ai-providers";
import { mockClaims } from "../mock-fixtures";
import { parseJsonLoose } from "../parse-json";
import { runAgent, logActivity } from "../run-agent";

export interface RunClaimsResearchInput {
  db: Database;
  projectId: string;
  topic: string;
  preferredProvider?: AIProviderId;
}

export async function runClaimsResearch({ db, projectId, topic, preferredProvider }: RunClaimsResearchInput) {
  const { value, providerUsed } = await runAgent({
    db,
    projectId,
    agentName: "TRUST_CLAIMS_RESEARCHER",
    preferredProvider,
    userPrompt: `Build the claim ledger for topic "${topic}".`,
    inputSummary: `topic="${topic}"`,
    build: (rawText, providerId) => {
      if (providerId === "MOCK") return { claims: mockClaims(topic) };
      return parseJsonLoose(rawText) as { claims: Claim[] };
    },
    validate: (value) => {
      for (const c of value.claims) {
        const result = safeValidate(ClaimSchema, c);
        if (!result.success) return { success: false, error: result.error };
      }
      return { success: true };
    },
    outputSummaryOf: (value) => `${value.claims.length} claims created`,
  });

  const inserted = [];
  for (const claim of value.claims) {
    const [row] = await db
      .insert(schema.claims)
      .values({
        id: randomUUID(),
        projectId,
        claimText: claim.claimText,
        claimType: claim.claimType,
        confidence: claim.confidence,
        safeWording: claim.safeWording,
        forbiddenWording: claim.forbiddenWording,
        contraryEvidence: claim.contraryEvidence,
        proofAssetRequired: claim.proofAssetRequired,
        sourceFreshness: claim.sourceFreshness,
        checkedAt: new Date(),
      })
      .returning();
    if (claim.sources.length > 0) {
      await db.insert(schema.claimSources).values(
        claim.sources.map((s) => ({
          id: randomUUID(),
          claimId: row.id,
          kind: s.kind,
          title: s.title,
          publisher: s.publisher,
          url: s.url,
          publishedDate: s.publishedDate ? new Date(s.publishedDate) : undefined,
          relevance: s.relevance,
        })),
      );
    }
    inserted.push(row);
  }

  const unverifiedCount = inserted.filter((c) => c.claimType === "UNVERIFIED").length;
  await logActivity(
    db,
    projectId,
    "AGENT",
    "CLAIMS_CREATED",
    `${inserted.length} claims created (${providerUsed}), ${unverifiedCount} require verification.`,
  );

  return inserted;
}
