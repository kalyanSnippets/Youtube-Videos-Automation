import { redirect } from "next/navigation";

/** Prompts now live on each video card (Videos & prompts). Old links land there. */
export default function ResourcesPage() {
  redirect("/videos");
}
