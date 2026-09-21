import { seedBaseline } from "@yaos/database";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  workspaceId: string;
}

/**
 * There is no sign-in flow - this app runs as a single-owner tool. The owner
 * user and workspace are auto-provisioned on first access (see seedBaseline)
 * so there's nothing to configure before the dashboard is usable.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const { user, workspace } = await seedBaseline();
  return { id: user.id, email: user.email, displayName: user.displayName, workspaceId: workspace.id };
}
