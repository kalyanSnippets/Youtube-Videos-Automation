import { AlertTriangle } from "lucide-react";

export function NotConnectedPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel p-10 text-center space-y-2">
      <AlertTriangle className="mx-auto text-status-warning" size={20} />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-text-dim max-w-md mx-auto">{description}</p>
    </div>
  );
}
