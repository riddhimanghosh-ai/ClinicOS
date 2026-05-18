import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn(accent && "border-accent/40 bg-accent/5", className)}>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={cn("mt-2 text-2xl font-semibold tracking-tight", accent && "text-accent")}>
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
