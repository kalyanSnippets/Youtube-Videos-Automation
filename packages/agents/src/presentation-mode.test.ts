import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, pool, schema } from "@yaos/database";
import { runIdeaResearch } from "./runners/idea-research";
import { runCompetitorAnalysis } from "./runners/competitor-analysis";
import { runClaimsResearch } from "./runners/claims";
import { runStoryWriter } from "./runners/story";
import { runProductionDirector } from "./runners/production";
import { runAssetPlanner } from "./runners/assets";
import { runExperimentDesigner } from "./runners/methodology";
import { selectIdea, verifyClaim, approveScript, transitionStage, setPresentationMode } from "./domain";

/**
 * Integration coverage for the presentation-mode system: FACE_LED/HYBRID
 * projects get an A-roll shot list and ON_CAMERA scenes; FACELESS projects
 * never do. Also covers that selecting an idea only refines an
 * un-overridden recommendation, never a mode the creator explicitly chose.
 */
describe("presentation modes", () => {
  let workspaceId: string;
  const projectIds: string[] = [];

  beforeAll(async () => {
    const [user] = await db.insert(schema.users).values({ id: randomUUID(), email: `test-${randomUUID()}@example.com` }).returning();
    const [workspace] = await db.insert(schema.workspaces).values({ id: randomUUID(), name: "Test Workspace", ownerUserId: user.id }).returning();
    workspaceId = workspace.id;
  });

  afterAll(async () => {
    for (const id of projectIds) {
      await db.delete(schema.projects).where(eq(schema.projects.id, id));
    }
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId));
    await pool.end();
  });

  async function driveToProductionPlan(contentType: "tutorial" | "comparison", presentationModeOverride?: "FACE_LED" | "HYBRID" | "FACELESS") {
    const [project] = await db
      .insert(schema.projects)
      .values({
        id: randomUUID(),
        workspaceId,
        title: `Presentation Mode Test ${randomUUID().slice(0, 8)}`,
        slug: `presentation-mode-test-${randomUUID().slice(0, 8)}`,
        contentType,
        currentStage: "IDEA_RESEARCH",
      })
      .returning();
    projectIds.push(project.id);

    if (presentationModeOverride) {
      await setPresentationMode(db, project.id, presentationModeOverride, "Test");
    }

    const ideas = await runIdeaResearch({ db, projectId: project.id, topic: project.title });
    await selectIdea(db, project.id, ideas[0].id, "Test");

    await runCompetitorAnalysis({ db, projectId: project.id, topic: project.title });
    await transitionStage(db, project.id, "REFERENCES_ANALYSED", "AGENT", "Competitor Analyst");

    const claims = await runClaimsResearch({ db, projectId: project.id, topic: project.title });
    for (const claim of claims.filter((c) => c.claimType === "UNVERIFIED")) {
      await verifyClaim(db, claim.id, "OPINION", "Test");
    }

    if (contentType === "comparison") {
      await runExperimentDesigner({ db, projectId: project.id, topic: project.title });
    }

    const script = await runStoryWriter({ db, projectId: project.id, topic: project.title });
    await approveScript(db, project.id, script.id, "Test", false);
    await transitionStage(db, project.id, "PRODUCTION_PLAN_READY", "AGENT", "Production Director");

    const scenes = await runProductionDirector({ db, projectId: project.id, scriptId: script.id, topic: project.title });
    await runAssetPlanner({ db, projectId: project.id, topic: project.title });

    const [finalProject] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    const arollShots = await db.select().from(schema.arollShots).where(eq(schema.arollShots.projectId, project.id));

    return { project: finalProject, scenes, arollShots };
  }

  it("never plans ON_CAMERA scenes or A-roll shots for a FACELESS project", async () => {
    const { project, scenes, arollShots } = await driveToProductionPlan("tutorial", "FACELESS");
    expect(project.presentationMode).toBe("FACELESS");
    expect(scenes.every((s) => s.segmentType !== "ON_CAMERA")).toBe(true);
    expect(arollShots.length).toBe(0);
  });

  it("plans ON_CAMERA scenes with a matching A-roll shot list for a HYBRID project", async () => {
    const { project, scenes, arollShots } = await driveToProductionPlan("comparison", "HYBRID");
    expect(project.presentationMode).toBe("HYBRID");
    const onCameraScenes = scenes.filter((s) => s.segmentType === "ON_CAMERA");
    expect(onCameraScenes.length).toBeGreaterThan(0);
    expect(arollShots.length).toBe(onCameraScenes.length);
    // Every A-roll shot links back to the production scene it was planned for.
    for (const shot of arollShots) {
      expect(onCameraScenes.some((s) => s.id === shot.productionSceneId)).toBe(true);
    }
  });

  it("adopts the selected idea's recommended mode only while the project's mode is still a recommendation", async () => {
    const [project] = await db
      .insert(schema.projects)
      .values({
        id: randomUUID(),
        workspaceId,
        title: `Mode Adoption Test ${randomUUID().slice(0, 8)}`,
        slug: `mode-adoption-test-${randomUUID().slice(0, 8)}`,
        contentType: "tutorial",
        currentStage: "IDEA_RESEARCH",
      })
      .returning();
    projectIds.push(project.id);
    expect(project.presentationModeIsRecommended).toBe(true);

    const ideas = await runIdeaResearch({ db, projectId: project.id, topic: project.title });
    await selectIdea(db, project.id, ideas[0].id, "Test");
    const [afterSelect] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(afterSelect.presentationMode).toBe(ideas[0].recommendedPresentationMode);
    expect(afterSelect.presentationModeIsRecommended).toBe(true);
  });

  it("never overrides a presentation mode the creator explicitly chose", async () => {
    const [project] = await db
      .insert(schema.projects)
      .values({
        id: randomUUID(),
        workspaceId,
        title: `Mode Override Test ${randomUUID().slice(0, 8)}`,
        slug: `mode-override-test-${randomUUID().slice(0, 8)}`,
        contentType: "tutorial",
        currentStage: "IDEA_RESEARCH",
      })
      .returning();
    projectIds.push(project.id);

    await setPresentationMode(db, project.id, "FACE_LED", "Test");
    const ideas = await runIdeaResearch({ db, projectId: project.id, topic: project.title });
    await selectIdea(db, project.id, ideas[0].id, "Test");

    const [afterSelect] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(afterSelect.presentationMode).toBe("FACE_LED");
    expect(afterSelect.presentationModeIsRecommended).toBe(false);
  });
});
