import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "destructive" | "accent" | "success";

const variants: Record<Variant, string> = {
  default:     "bg-primary text-primary-foreground",
  secondary:   "bg-secondary text-secondary-foreground",
  outline:     "border border-border text-foreground",
  destructive: "bg-destructive/10 text-destructive border border-destructive/20",
  accent:      "bg-primary/10 text-primary",
  success:     "bg-success/10 text-success border border-success/20",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium tracking-widest uppercase",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
