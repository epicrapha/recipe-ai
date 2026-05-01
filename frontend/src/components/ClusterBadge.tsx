import { Badge } from "@/components/ui/badge";
import { CLUSTER_META } from "@/lib/api";

interface ClusterBadgeProps {
  cluster: number;
  className?: string;
}

export function ClusterBadge({ cluster, className = "" }: ClusterBadgeProps) {
  const meta = CLUSTER_META[cluster] ?? { label: `Cluster ${cluster}`, icon: "📦", color: "secondary" };

  const colorClasses: Record<string, string> = {
    saffron: "bg-saffron/15 text-saffron border-saffron/20 hover:bg-saffron/25",
    ocean: "bg-ocean/15 text-ocean border-ocean/20 hover:bg-ocean/25",
    secondary: "bg-secondary text-secondary-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={`${colorClasses[meta.color] ?? colorClasses.secondary} text-xs font-medium transition-colors ${className}`}
    >
      <span className="mr-1">{meta.icon}</span>
      {meta.label}
    </Badge>
  );
}
