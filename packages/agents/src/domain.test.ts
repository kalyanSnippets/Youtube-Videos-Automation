import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, pool, schema } from "@yaos/database";
import { runIdeaResearch } from "./runners/idea-research";
import { runCompetitorAnalysis } from "./runners/competitor-analysis";
import { runClaimsResearch } from "./runners/claims";
import { runStoryWriter } from "./runners/story";
import { selectIdea, verifyClaim, approveScript, transitionStage } from "./domain";

/**
 * Integration tests against a real local Postgres (see docs/DEVELOPMENT.md
 * for setup). They exercise the same domain functions the web app's server
 * actions call, using the MOCK provider throughout - no external network
 * calls, no API keys required.
 */
describe("project pipeline integration", () => {
  let workspaceId: string;
  let projectId: string;

  beforeAll(async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ id: randomUUID(), email: `test-${randomUUID()}@example.com` })
      .returning();
    const [workspace] = await db.insert(schema.workspaces).values({ id: randomUUID(), name: "Test Workspace", ownerUserId: user.id }).returning();
    workspaceId = workspace.id;

    const [project] = await db
      .insert(schema.projects)
      .values({
        id: randomUUID(),
        workspaceId,
        title: "Integration Test Project",
        slug: `integration-test-${randomUUID().slice(0, 8)}`,
        contentType: "tutorial",
        currentStage: "IDEA_RESEARCH",
      })
      .returning();
    projectId = project.id;
  });

  afterAll(async () => {
    await db.delete(schema.projects).where(eq(schema.projects.id, projectId));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
    await pool.end();
  });

  it("creates idea candidates and advances IDEA_RESEARCH -> IDEA_SELECTED on selection", async () => {
    const ideas = await runIdeaResearch({ db, projectId, topic: "Integration Test Project" });
    expect(ideas.length).toBeGreaterThan(0);

    await selectIdea(db, projectId, ideas[0].id, "Test");
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    expect(project.currentStage).toBe("IDEA_SELECTED");
    expect(project.selectedIdeaId).toBe(ideas[0].id);
  });

  it("reaches REFERENCES_ANALYSED after competitor analysis", async () => {
    await runCompetitorAnalysis({ db, projectId, topic: "Integration Test Project" });
    await transitionStage(db, projectId, "REFERENCES_ANALYSED", "AGENT", "Competitor Analyst");
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    expect(project.currentStage).toBe("REFERENCES_ANALYSED");
  });

  it("blocks script approval while a claim is UNVERIFIED, then allows it once resolved", async () => {
    const claims = await runClaimsResearch({ db, projectId, topic: "Integration Test Project" });
    const unverified = claims.filter((c) => c.claimType === "UNVERIFIED");
    expect(unverified.length).toBeGreaterThan(0);

    const script = await runStoryWriter({ db, projectId, topic: "Integration Test Project" });

    // Approval must fail while claims are unresolved.
    await expect(approveScript(db, projectId, script.id, "Test", false)).rejects.toThrow(/UNVERIFIED/);

    for (const claim of unverified) {
      await verifyClaim(db, claim.id, "OPINION", "Test");
    }

    // Resolving every claim should have auto-advanced the project (tutorial skips METHODOLOGY_READY).
    const [afterVerify] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    expect(afterVerify.currentStage).toBe("CLAIMS_VERIFIED");

    // Re-draft since the earlier draft was created before the project reached CLAIMS_VERIFIED.
    const redraft = await runStoryWriter({ db, projectId, topic: "Integration Test Project" });
    await approveScript(db, projectId, redraft.id, "Test", false);

    const [afterApprove] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    expect(afterApprove.currentStage).toBe("SCRIPT_APPROVED");
  });
});
