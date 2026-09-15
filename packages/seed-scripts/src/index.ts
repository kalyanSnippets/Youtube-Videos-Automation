import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool, schema, seedBaseline } from "@yaos/database";
import { MOTION_TEMPLATE_CATALOG } from "@yaos/remotion";
import {
  runIdeaResearch,
  runCompetitorAnalysis,
  runClaimsResearch,
  runStoryWriter,
  runProductionDirector,
  runAssetPlanner,
  runExperimentDesigner,
  selectIdea,
  verifyClaim,
  approveScript,
  transitionStage,
  logActivity,
  setPresentationMode,
} from "@yaos/agents";
import type { ContentType, PresentationMode } from "@yaos/shared";

async function seedMotionTemplates() {
  const existing = await db.select().from(schema.motionTemplates);
  const existingKeys = new Set(existing.map((t) => t.componentKey));
  const missing = MOTION_TEMPLATE_CATALOG.filter((t) => !existingKeys.has(t.key));
  if (missing.length === 0) {
    console.log(`Motion templates already up to date (${existing.length}).`);
    return;
  }
  await db.insert(schema.motionTemplates).values(
    missing.map((t) => ({
      id: randomUUID(),
      componentKey: t.key,
      name: t.name,
      description: t.description,
      category: t.category,
      defaultIntensity: t.defaultIntensity,
      remotionComponentPath: t.implemented ? `packages/remotion/src/components/${t.key}.tsx` : null,
      isActive: t.implemented,
    })),
  );
  console.log(`Seeded ${missing.length} new motion template${missing.length === 1 ? "" : "s"} (${existing.length + missing.length} total).`);
}

function slugify(title: string): string {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 6)}`;
}

type TargetStage = "REFERENCES_ANALYSED" | "SCRIPT_APPROVED" | "ASSETS_REQUESTED";

async function seedDemoProject(opts: { workspaceId: string; title: string; contentType: ContentType; presentationMode: PresentationMode; targetStage: TargetStage }) {
  const existing = await db.select().from(schema.projects).where(eq(schema.projects.title, opts.title));
  if (existing.length > 0) {
    console.log(`Demo project "${opts.title}" already exists, skipping.`);
    return;
  }

  const [project] = await db
    .insert(schema.projects)
    .values({
      id: randomUUID(),
      workspaceId: opts.workspaceId,
      title: opts.title,
      slug: slugify(opts.title),
      contentType: opts.contentType,
      seedIdea: opts.title,
      isDemo: true,
      currentStage: "IDEA_RESEARCH",
    })
    .returning();

  // Demo projects pick their presentation mode explicitly, the way a creator would in the wizard,
  // so the seeded data shows all three modes running side by side (per the product spec's example).
  await setPresentationMode(db, project.id, opts.presentationMode, "Seed Script");

  await logActivity(db, project.id, "SYSTEM", "PROJECT_CREATED", `Demo project "${opts.title}" seeded.`);

  const ideas = await runIdeaResearch({ db, projectId: project.id, topic: opts.title });
  await selectIdea(db, project.id, ideas[0].id, "Seed Script");

  await runCompetitorAnalysis({ db, projectId: project.id, topic: opts.title });
  await transitionStage(db, project.id, "REFERENCES_ANALYSED", "AGENT", "Competitor Analyst");

  if (opts.targetStage === "REFERENCES_ANALYSED") {
    console.log(`Seeded "${opts.title}" at REFERENCES_ANALYSED.`);
    return;
  }

  const claims = await runClaimsResearch({ db, projectId: project.id, topic: opts.title });
  for (const claim of claims) {
    if (claim.claimType === "UNVERIFIED") {
      await verifyClaim(db, claim.id, "OPINION", "Seed Script");
    }
  }

  if (opts.contentType === "comparison" || opts.contentType === "experiment" || opts.contentType === "case_study") {
    await runExperimentDesigner({ db, projectId: project.id, topic: opts.title });
  }

  const script = await runStoryWriter({ db, projectId: project.id, topic: opts.title });
  await approveScript(db, project.id, script.id, "Seed Script", false);

  if (opts.targetStage === "SCRIPT_APPROVED") {
    console.log(`Seeded "${opts.title}" at SCRIPT_APPROVED.`);
    return;
  }

  await runProductionDirector({ db, projectId: project.id, scriptId: script.id, topic: opts.title });
  await transitionStage(db, project.id, "PRODUCTION_PLAN_READY", "AGENT", "Production Director");

  await runAssetPlanner({ db, projectId: project.id, topic: opts.title });
  await transitionStage(db, project.id, "ASSETS_REQUESTED", "AGENT", "Asset Planner");

  console.log(`Seeded "${opts.title}" at ASSETS_REQUESTED.`);
}

async function main() {
  const { workspace } = await seedBaseline();
  await seedMotionTemplates();

  await seedDemoProject({
    workspaceId: workspace.id,
    title: "DEMO — ChatGPT vs Claude",
    contentType: "comparison",
    presentationMode: "FACELESS",
    targetStage: "REFERENCES_ANALYSED",
  });

  await seedDemoProject({
    workspaceId: workspace.id,
    title: "DEMO — Claude Editing Agent",
    contentType: "tutorial",
    presentationMode: "FACE_LED",
    targetStage: "SCRIPT_APPROVED",
  });

  await seedDemoProject({
    workspaceId: workspace.id,
    title: "DEMO — AI Video Generator Comparison",
    contentType: "comparison",
    presentationMode: "HYBRID",
    targetStage: "ASSETS_REQUESTED",
  });

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
