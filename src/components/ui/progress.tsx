import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full bg-accent transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
