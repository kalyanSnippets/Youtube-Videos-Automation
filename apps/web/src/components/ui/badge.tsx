import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "bg-bg-raised text-text-dim border-border",
  cyan: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30",
  purple: "bg-accent-purple/10 text-accent-purple border-accent-purple/30",
  success: "bg-status-success/10 text-status-success border-status-success/30",
  warning: "bg-status-warning/10 text-status-warning border-status-warning/30",
  danger: "bg-status-danger/10 text-status-danger border-status-danger/30",
  info: "bg-status-info/10 text-status-info border-status-info/30",
} as const;

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return <span className={cn("badge border", VARIANTS[variant], className)}>{children}</span>;
}
