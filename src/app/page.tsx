import { Building2, Users, CalendarCheck2, TrendingUp, UserCog, ShieldCheck, MapPin, Globe, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  clinicFinancialSummary,
  listAllPatients,
  listBranchStats,
  listAllDoctors,
} from "@/lib/db";
import { llmStatus } from "@/lib/llm";
import { RECIPES } from "@/lib/cohorts";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inr, pct } from "@/lib/utils";
import { StaffRoster } from "./staff-roster";

export default function Home() {
  const fin = clinicFinancialSummary();
  const llm = llmStatus();
  const patients = listAllPatients();
  const branchStats = listBranchStats();
  const doctors = listAllDoctors();

  // Group branches by zone
  const zoneMap = new Map<string, {
    zone_name: string;
    zone_manager_name: string | null;
    branches: typeof branchStats;
  }>();
  for (const b of branchStats) {
    const key = b.zone_name ?? "Unassigned";
    if (!zoneMap.has(key)) {
      zoneMap.set(key, { zone_name: key, zone_manager_name: b.zone_manager_name ?? null, branches: [] });
    }
    zoneMap.get(key)!.branches.push(b);
  }
  const zones = Array.from(zoneMap.values());

  return (
    <div className="space-y-10">
      <PageHeader
        title="KayaOS — Head Office"
        subtitle="Zone performance · Staff roster · Cohort engine"
        actions={
          <Badge variant={llm.live ? "success" : "outline"}>
            <ShieldCheck className="mr-1.5 h-3 w-3" />
            LLM · {llm.mode} · {llm.provider}
          </Badge>
        }
      />

      {/* ── Clinic-wide metrics ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Clinic-wide metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Collection" value={inr(fin.total_collection_inr)} />
          <MetricCard
            label="Net Revenue"
            value={inr(fin.total_net_revenue_inr)}
            hint={`${pct(fin.total_net_revenue_inr, fin.total_collection_inr)} of collection`}
          />
          <MetricCard
            label="Unearned Balance"
            value={inr(fin.package_unearned_balance_inr)}
            hint="Cash collected on unused sessions"
            accent
          />
          <MetricCard label="Total Patients" value={patients.length} />
        </div>
      </section>

      {/* ── Zones & Clinics ── */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Zones &amp; Clinics
        </h2>
        {zones.map(zone => (
          <div key={zone.zone_name} className="space-y-3">
            {/* Zone header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Globe className="h-4 w-4 text-accent" />
                <span className="font-semibold text-base">{zone.zone_name}</span>
                {zone.zone_manager_name && (
                  <span className="text-sm text-muted-foreground">
                    — Zonal Head: <span className="text-foreground font-medium">{zone.zone_manager_name}</span>
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {zone.branches.length} {zone.branches.length === 1 ? "clinic" : "clinics"}
              </Badge>
            </div>

            {/* Branch cards in this zone */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-6 border-l-2 border-accent/20">
              {zone.branches.map(branch => {
                const totalSessions = branch.sessions_used + branch.sessions_pending;
                const utilPct = totalSessions > 0 ? branch.sessions_used / totalSessions : 0;
                return (
                  <Card key={branch.id} className="border border-border/70">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{branch.name}</CardTitle>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{branch.city}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {branch.doctor_count} {branch.doctor_count === 1 ? "doctor" : "doctors"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {branch.manager_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserCog className="h-3.5 w-3.5 shrink-0" />
                          <span>Clinic Manager: <span className="text-foreground font-medium">{branch.manager_name}</span></span>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Users className="h-3 w-3" />
                            Patients
                          </div>
                          <p className="font-semibold">{branch.total_patients}</p>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <CalendarCheck2 className="h-3 w-3" />
                            Sessions Used
                          </div>
                          <p className="font-semibold">{branch.sessions_used}</p>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <TrendingUp className="h-3 w-3" />
                            Pending
                          </div>
                          <p className="font-semibold text-accent">{branch.sessions_pending}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Session utilisation</span>
                          <span>{Math.round(utilPct * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${Math.round(utilPct * 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ── Cohort Engine ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cohort Engine
          </h2>
          <Link
            href="/manager"
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            Open in Manager console <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(["alpha", "beta", "gap"] as const).map(key => {
            const recipe = RECIPES[key];
            const colors: Record<string, { bg: string; border: string; badge: string }> = {
              alpha: { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-700" },
              beta:  { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700" },
              gap:   { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
            };
            const c = colors[key];
            return (
              <Card key={key} className={`border ${c.border} ${c.bg}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">{recipe.label}</CardTitle>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${c.badge}`}>
                      {recipe.defaultDiscountPct > 0 ? `${recipe.defaultDiscountPct}% offer` : "Re-engage"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">{recipe.description}</p>
                  <Link
                    href="/manager"
                    className="mt-3 flex items-center gap-1 text-xs font-medium text-foreground hover:text-accent transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    Build cohort &amp; send WhatsApp
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Staff Roster ── */}
      <StaffRoster doctors={doctors} branches={branchStats} />
    </div>
  );
}
