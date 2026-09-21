import { cache } from "react";
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
 *
 * cache() dedupes this across the (app) layout and whichever page renders alongside it in the
 * same request - both call getCurrentUser() independently, and without this they'd each re-run
 * seedBaseline()'s existence checks instead of sharing one result.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const { user, workspace } = await seedBaseline();
  return { id: user.id, email: user.email, displayName: user.displayName, workspaceId: workspace.id };
});
