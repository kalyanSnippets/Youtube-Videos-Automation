import { createProject } from "@/lib/actions/projects";

const CONTENT_TYPES = [
  { value: "experiment", label: "Experiment" },
  { value: "comparison", label: "Comparison" },
  { value: "tutorial", label: "Tutorial" },
  { value: "build", label: "Build" },
  { value: "opinion", label: "Opinion" },
  { value: "news_reaction", label: "News / Reaction" },
  { value: "case_study", label: "Case Study" },
  { value: "explainer", label: "Explainer" },
];

export default function NewVideoPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Start New Video</h1>
      <p className="text-sm text-text-dim mb-6">
        We&apos;ll kick off Idea Research immediately based on what you enter here. You can change direction after reviewing the ranked ideas.
      </p>

      <form action={createProject} className="panel p-6 space-y-5">
        <Field label="Seed idea (optional)">
          <input
            name="seedIdea"
            placeholder="e.g. Is Runway's free plan actually usable?"
            className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50"
          />
        </Field>

        <Field label="Content type">
          <select
            name="contentType"
            defaultValue="explainer"
            className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50"
          >
            {CONTENT_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Language">
            <input
              name="language"
              defaultValue="en"
              className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50"
            />
          </Field>
          <Field label="Target duration (minutes)">
            <input
              type="number"
              name="targetDurationMinutes"
              defaultValue={8}
              min={2}
              max={30}
              className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget">
            <select name="budgetTier" defaultValue="low_free_first" className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50">
              <option value="low_free_first">Low / free-first</option>
              <option value="moderate">Moderate</option>
              <option value="flexible">Flexible</option>
            </select>
          </Field>
          <Field label="Evergreen vs Trend">
            <select name="evergreenOrTrend" defaultValue="evergreen" className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50">
              <option value="evergreen">Evergreen</option>
              <option value="trend">Trend</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Face / Faceless">
            <select name="faceMode" defaultValue="faceless" className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50">
              <option value="faceless">Faceless</option>
              <option value="face">Face</option>
            </select>
          </Field>
          <Field label="Research depth">
            <select name="researchDepth" defaultValue="standard" className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50">
              <option value="quick">Quick</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </Field>
        </div>

        <button type="submit" className="w-full rounded-lg bg-accent-cyan text-bg font-medium text-sm py-2.5 hover:brightness-110 transition">
          Start Research
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-text-dim mb-1.5">{label}</span>
      {children}
    </label>
  );
}
