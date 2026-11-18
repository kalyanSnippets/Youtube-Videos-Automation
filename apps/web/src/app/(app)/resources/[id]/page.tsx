import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@yaos/database";
import { siteBaseUrl } from "@yaos/comment-bot";
import { deleteResource } from "@/lib/actions/resources";
import { ResourceForm, type ResourceFormValues } from "../resource-form";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let values: ResourceFormValues = { title: "", slug: "", keywords: "", summary: "", body: "", link: "", videoUrl: "", published: true, sortOrder: 0 };
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const [r] = await db.select().from(schema.resources).where(eq(schema.resources.id, id));
    if (!r) notFound();
    values = {
      id: r.id,
      title: r.title,
      slug: r.slug,
      keywords: (r.keywords ?? []).join(", "),
      summary: r.summary ?? "",
      body: r.body,
      link: r.link ?? "",
      videoUrl: r.videoUrl ?? "",
      published: r.published,
      sortOrder: r.sortOrder,
    };
  }
  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">{values.id ? "Edit resource" : "New resource"}</h1>
      <ResourceForm values={values} siteUrl={siteBaseUrl() ?? ""} />
      {values.id && (
        <form action={deleteResource} className="pt-2">
          <input type="hidden" name="id" value={values.id} />
          <button className="text-sm text-status-danger hover:underline">Delete this resource</button>
        </form>
      )}
    </div>
  );
}
