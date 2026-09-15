import { cn } from "@/lib/utils";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-bg-raised overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
