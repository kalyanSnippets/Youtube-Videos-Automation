import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-accent-cyan text-bg hover:brightness-110",
  secondary: "bg-bg-raised text-text border border-border hover:border-accent-cyan/40",
  danger: "bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger/20",
  ghost: "text-text-dim hover:text-text hover:bg-bg-raised",
} as const;

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
