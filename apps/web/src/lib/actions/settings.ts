"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";

export async function updateChannelProfile(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId"));
  await db
    .update(schema.channelProfiles)
    .set({
      niche: String(formData.get("niche")),
      format: String(formData.get("format")),
      audience: String(formData.get("audience")),
      narrationStyle: String(formData.get("narrationStyle")),
      targetLengthMinMinutes: Number(formData.get("targetLengthMinMinutes")),
      targetLengthMaxMinutes: Number(formData.get("targetLengthMaxMinutes")),
      visualStyle: String(formData.get("visualStyle")),
      budgetTier: String(formData.get("budgetTier")),
      publishingCadence: String(formData.get("publishingCadence")),
      updatedAt: new Date(),
    })
    .where(eq(schema.channelProfiles.workspaceId, workspaceId));

  revalidatePath("/settings");
}
