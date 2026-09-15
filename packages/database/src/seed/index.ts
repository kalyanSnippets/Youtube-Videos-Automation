import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "../client";
import * as schema from "../schema/index";
import { INTEGRATION_SERVICES } from "@yaos/shared";

/**
 * Baseline seeding only: dev owner user, workspace, default channel profile,
 * and NOT_CONNECTED rows for every integration. This file intentionally has
 * no dependency on @yaos/agents (which itself depends on @yaos/database) -
 * demo project scenarios that need agent runners live in packages/seed-scripts
 * to avoid a package dependency cycle.
 */

export const DEV_OWNER_EMAIL = "owner@local.dev";

export async function seedBaseline() {
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, DEV_OWNER_EMAIL));
  if (!user) {
    [user] = await db.insert(schema.users).values({ id: randomUUID(), email: DEV_OWNER_EMAIL, displayName: "Dev Owner" }).returning();
    console.log(`Created dev owner user ${user.email}`);
  }

  let [workspace] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.ownerUserId, user.id));
  if (!workspace) {
    [workspace] = await db.insert(schema.workspaces).values({ id: randomUUID(), name: "My Workspace", ownerUserId: user.id }).returning();
    console.log(`Created workspace ${workspace.name}`);
  }

  const [profile] = await db.select().from(schema.channelProfiles).where(eq(schema.channelProfiles.workspaceId, workspace.id));
  if (!profile) {
    await db.insert(schema.channelProfiles).values({ id: randomUUID(), workspaceId: workspace.id });
    console.log("Created default channel profile");
  }

  const existingIntegrations = await db.select().from(schema.integrationSettings).where(eq(schema.integrationSettings.workspaceId, workspace.id));
  const existingServices = new Set(existingIntegrations.map((s) => s.service));
  const missing = INTEGRATION_SERVICES.filter((s) => !existingServices.has(s));
  if (missing.length > 0) {
    await db.insert(schema.integrationSettings).values(
      missing.map((service) => ({ id: randomUUID(), workspaceId: workspace.id, service, status: "NOT_CONNECTED" as const })),
    );
    console.log(`Seeded ${missing.length} integration status rows.`);
  }

  return { user, workspace };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedBaseline()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
