export const inputClass = "w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-text-dim">{hint}</span>}
    </label>
  );
}
