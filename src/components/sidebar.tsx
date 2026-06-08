"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity, Stethoscope, Sparkles, LayoutDashboard, Menu, X,
  FlaskConical, Smartphone, ShoppingBag, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",                   label: "Super Admin",    icon: LayoutDashboard },
  { href: "/manager/today",      label: "Clinic Manager", icon: Activity },
  { href: "/doctor",             label: "Doctor Console", icon: Stethoscope },
  { href: "/customer/dashboard", label: "Customer App",   icon: Smartphone },
];

const PORTAL_LABEL: Record<string, string> = {
  "/manager": "Manager Portal",
  "/doctor":  "Doctor Portal",
  "/customer":"Customer App",
};

function NavLinks({ onClick, collapsed }: { onClick?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-px">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : href === "/customer/dashboard"
            ? pathname.startsWith("/customer")
            : href === "/manager/today"
            ? pathname.startsWith("/manager")
            : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onClick}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 text-sm font-medium transition-colors rounded-sm",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "border-l-2 border-primary bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              {!collapsed && label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const base = "/" + (pathname.split("/")[1] ?? "");
  const portalLabel = PORTAL_LABEL[base];

  const [collapsed, setCollapsed] = useState(false);
  // Restore from localStorage after mount
  useEffect(() => {
    try {
      if (localStorage.getItem("sidebar_collapsed") === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed(v => {
      try { localStorage.setItem("sidebar_collapsed", String(!v)); } catch {}
      return !v;
    });
  };

  return (
    <aside className={cn(
      "hidden md:flex md:flex-col md:shrink-0 md:border-r md:border-border md:bg-card transition-all duration-200",
      collapsed ? "md:w-14" : "md:w-60"
    )}>
      {/* Logo + collapse toggle */}
      <div className={cn(
        "flex h-14 items-center border-b border-border",
        collapsed ? "justify-center px-0" : "gap-3 px-4 justify-between"
      )}>
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground bg-foreground text-background font-bold text-sm font-mono">
            K
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight leading-tight truncate" style={{ fontFamily: "Inter Tight, sans-serif", letterSpacing: "-0.02em" }}>Kaya OS</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Clinic Intelligence</div>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggle}
            title="Collapse sidebar"
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Portal eyebrow */}
      {!collapsed && portalLabel && (
        <div className="px-5 py-2.5 border-b border-border">
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">{portalLabel}</span>
        </div>
      )}

      {/* Nav */}
      <nav className={cn("flex-1 py-3 overflow-y-auto", collapsed ? "px-1" : "px-3")}>
        {!collapsed && (
          <div className="mb-2 px-3 text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Portals</div>
        )}
        <NavLinks collapsed={collapsed} />
      </nav>

      {/* Footer / expand button */}
      <div className={cn("border-t border-border", collapsed ? "py-3 flex justify-center" : "px-5 py-4")}>
        {collapsed ? (
          <button
            onClick={toggle}
            title="Expand sidebar"
            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <>
            <div className="text-xs font-semibold text-foreground tracking-tight">Kaya Skin Clinic</div>
            <div className="mt-1 text-[10px] text-muted-foreground font-mono">Bandra 1 · Bandra 2 · Mumbai Zone</div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-success inline-block" />
              <span className="text-[10px] text-muted-foreground font-mono">System online</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50">
              <span className="text-[9px] text-muted-foreground/60 font-mono">* Future scope</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export function MobileTopbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = "/" + (pathname.split("/")[1] ?? "");
  const portalLabel = PORTAL_LABEL[base];

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center border border-foreground bg-foreground text-background text-xs font-bold font-mono">K</div>
          <div>
            <span className="text-sm font-semibold tracking-tight">Kaya OS</span>
            {portalLabel && (
              <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-primary">{portalLabel}</span>
            )}
          </div>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex w-60 flex-col bg-card border-r border-border">
            <div className="flex h-14 items-center gap-3 px-5 border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center border border-foreground bg-foreground text-background text-xs font-bold font-mono">K</div>
              <span className="text-sm font-semibold tracking-tight">Kaya OS</span>
            </div>
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              <div className="mb-2 px-3 text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Portals</div>
              <NavLinks onClick={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
