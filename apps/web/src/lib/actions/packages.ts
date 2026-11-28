"use server";

import { revalidatePath } from "next/cache";
import { refreshPublicSite } from "@/lib/public-data";
import { requireAdmin } from "@/lib/admin";
import { MAX_UPLOAD_BYTES } from "@/lib/prompt-import";
import { deletePlannedPost, importUploadPackage, linkPlannedPost, type ImportSummary } from "@/lib/upload-packages";

export interface PackageImportState {
  error?: string;
  summary?: ImportSummary;
}

function refresh() {
  revalidatePath("/videos");
  revalidatePath("/videos/packages");
  revalidatePath("/", "layout");
  refreshPublicSite();
}

/** Paste the package Claude wrote, or upload it as a .md / .txt file. */
export async function importPackageAction(_prev: PackageImportState, form: FormData): Promise<PackageImportState> {
  try {
    await requireAdmin();
    let text = String(form.get("text") ?? "").trim();
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD_BYTES) return { error: "That file is over 5 MB." };
      if (!/\.(md|markdown|txt)$/i.test(file.name)) {
        return { error: "Upload the package as a .md or .txt file, or paste its text. (Word and PDF lose the layout the importer reads.)" };
      }
      text = (await file.text()).trim();
    }
    if (!text) return { error: "Paste the upload package or choose its file first." };
    const summary = await importUploadPackage(text);
    refresh();
    if (!summary.added.length) {
      return {
        error:
          "Didn't find any video that offers something in the comments (a keyword plus the prompt to send). Ask Claude to add the Comment keyword block shown below, then import again.",
        summary,
      };
    }
    return { summary };
  } catch (error) {
    console.error("[packages] import failed", error);
    return { error: `Couldn't import: ${(error as Error).message}` };
  }
}

export async function linkPlannedPostAction(form: FormData): Promise<void> {
  await requireAdmin();
  const postId = String(form.get("postId") ?? "");
  const videoId = String(form.get("videoId") ?? "");
  if (postId && videoId) await linkPlannedPost(postId, videoId);
  refresh();
}

export async function deletePlannedPostAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (id) await deletePlannedPost(id);
  refresh();
}
