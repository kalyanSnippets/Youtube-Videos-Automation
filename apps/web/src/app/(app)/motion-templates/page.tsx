import { db, schema } from "@yaos/database";
import { Badge } from "@/components/ui/badge";

export default async function MotionTemplatesPage() {
  const templates = await db.select().from(schema.motionTemplates).orderBy(schema.motionTemplates.category);

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold mb-1">Motion Templates</h1>
        <p className="text-sm text-text-dim">Reusable Remotion component catalog. The Edit Director selects component keys from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {templates.map((t) => (
          <div key={t.id} className="panel p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium font-mono">{t.componentKey}</p>
              <Badge variant={t.isActive ? "success" : "default"}>{t.isActive ? "Implemented" : "Planned"}</Badge>
            </div>
            <p className="text-xs text-text-dim">{t.description}</p>
            <div className="flex items-center gap-2">
              <Badge variant="default">{t.category}</Badge>
              <Badge variant={t.defaultIntensity === "HIGH" ? "danger" : t.defaultIntensity === "MEDIUM" ? "warning" : "default"}>
                {t.defaultIntensity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
