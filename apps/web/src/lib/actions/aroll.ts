"use server";

import { revalidatePath } from "next/cache";
import { db } from "@yaos/database";
import { markArollShotReady } from "@yaos/agents";
import { checkAndAdvanceToAssetsReady } from "@/lib/project-readiness";

export async function markArollShotReadyAction(arollShotId: string, projectId: string) {
  await markArollShotReady(db, arollShotId, `local://uploaded/${arollShotId}`);
  await checkAndAdvanceToAssetsReady(projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/aroll`);
}
