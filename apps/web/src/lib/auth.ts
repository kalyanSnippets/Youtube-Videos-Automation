import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";

export const DEV_OWNER_EMAIL = "owner@local.dev";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  workspaceId: string;
  isDevMode: boolean;
}

/**
 * Resolves the signed-in user for this request. When Supabase Auth is
 * configured, this reflects a real session. Otherwise the app runs in local
 * single-owner dev mode against the seeded dev owner account - this is
 * explicitly surfaced in the UI (see the AuthModeBadge component) rather
 * than silently pretending to be a real authenticated session.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (!user?.email) return null;

    let [dbUser] = await db.select().from(schema.users).where(eq(schema.users.email, user.email));
    if (!dbUser) {
      [dbUser] = await db.insert(schema.users).values({ id: user.id, email: user.email }).returning();
    }
    const [workspace] = await bootstrapWorkspace(dbUser.id);
    return { id: dbUser.id, email: dbUser.email, displayName: dbUser.displayName, workspaceId: workspace.id, isDevMode: false };
  }

  // Local dev mode: single seeded owner account, no real auth session.
  const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.email, DEV_OWNER_EMAIL));
  if (!dbUser) return null;
  const [workspace] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.ownerUserId, dbUser.id));
  if (!workspace) return null;
  return { id: dbUser.id, email: dbUser.email, displayName: dbUser.displayName, workspaceId: workspace.id, isDevMode: true };
}

async function bootstrapWorkspace(userId: string) {
  const existing = await db.select().from(schema.workspaces).where(eq(schema.workspaces.ownerUserId, userId));
  if (existing.length > 0) return existing;
  return db.insert(schema.workspaces).values({ name: "My Workspace", ownerUserId: userId }).returning();
}
