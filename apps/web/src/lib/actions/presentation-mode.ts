"use server";

import { revalidatePath } from "next/cache";
import { setPresentationMode } from "@yaos/agents";
import { db } from "@yaos/database";
import type { PresentationMode } from "@yaos/shared";

export async function setPresentationModeAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const presentationMode = String(formData.get("presentationMode")) as PresentationMode;
  await setPresentationMode(db, projectId, presentationMode, "User");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/overview`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}
