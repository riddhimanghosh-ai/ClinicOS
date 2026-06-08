"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Zap, FlaskConical, Activity, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/manager/today",        label: "Daily Ops",                    icon: Zap },
  { href: "/manager/appointments", label: "Schedule Board",               icon: CalendarDays },
  { href: "/manager/ops",          label: "Treatment & FnO",              icon: FlaskConical },
  { href: "/manager/catalog",      label: "Catalogue and Recommendations", icon: ShoppingBag },
  { href: "/manager/clinic-status",label: "Clinic Ops",                   icon: Activity },
  { href: "/manager",              label: "Cohorts & Outreach *",          icon: Sparkles },
];

export function ManagerNav() {
  const pathname = usePathname();

  return (
    <div className="flex overflow-x-auto border-b border-border -mx-4 md:-mx-8 px-4 md:px-8 scrollbar-none">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/manager"
          ? pathname === "/manager"
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
