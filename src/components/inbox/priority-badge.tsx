import { Badge } from "@/components/ui/badge";

export function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority) return null;
  const variant =
    priority === "CRITICAL" ? "critical" :
    priority === "HIGH" ? "warning" :
    priority === "LOW" ? "secondary" :
    "outline";
  return <Badge variant={variant as any}>{priority}</Badge>;
}

export function CategoryBadge({ category }: { category?: string | null }) {
  if (!category) return null;
  return (
    <Badge variant="outline" className="font-medium">
      {category.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}
