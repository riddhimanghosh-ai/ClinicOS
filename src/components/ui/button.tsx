import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  default:
    "bg-foreground text-background hover:bg-primary hover:border-primary border border-foreground focus-visible:ring-primary/40",
  secondary:
    "bg-secondary text-secondary-foreground border border-border hover:border-foreground focus-visible:ring-primary/30",
  outline:
    "border border-border bg-card hover:bg-secondary focus-visible:ring-primary/30",
  ghost:
    "hover:bg-secondary text-foreground focus-visible:ring-primary/20",
  destructive:
    "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 focus-visible:ring-destructive/40",
  subtle:
    "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 focus-visible:ring-primary/40",
};

const sizes: Record<Size, string> = {
  sm:   "h-8 px-3 text-xs",
  md:   "h-10 px-4 text-sm",
  lg:   "h-11 px-6 text-sm",
  icon: "h-9 w-9",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
