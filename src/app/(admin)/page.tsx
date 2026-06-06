import {
  Building2, Users, CalendarCheck2, MapPin, Globe, Activity,
  CheckCircle2, Wifi, ChevronRight, Brain, TrendingUp, TrendingDown,
  Stethoscope, Package, AlertCircle, Calendar, Clock, Target, ArrowRight,
} from "lucide-react";
import Link from "next/link";

import {
  clinicFinancialSummary,
  listAllPatients,
  listBranchStats,
  listAllDoctors,
  listClinicStatus,
  getMonthlyRevenue,
  getAppointments,
  getPendingSessionPatients,
} from "@/lib/db";
import { llmStatus } from "@/lib/llm";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inr, pct } from "@/lib/utils";

function StatBox({
  label, value, sub, accent = false, green = false, amber = false,
}: {
  label: string; value: string | number; sub?: string;
  accent?: boolean; green?: boolean; amber?: boolean;
}) {
  return (
    <div className={[
      "border px-5 py-4 space-y-1",
      accent ? "border-primary/30 bg-primary/5" : "border-border bg-card",
    ].join(" ")}>
      <div className={[
        "text-2xl font-bold tabular-nums leading-none",
        accent ? "text-primary" : green ? "text-success" : amber ? "text-muted-foreground" : "text-foreground",
      ].join(" ")}>
        {value}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground font-mono">{sub}</div>}
    </div>
  );
}

function SectionHeading({ children, href, linkLabel }: { children: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
      <h2 className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">{children}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-mono">
          {linkLabel ?? "Open"} <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export default function SuperAdminHome() {
  const fin = clinicFinancialSummary();
  const llm = llmStatus();
  const patients = listAllPatients();
  const branchStats = listBranchStats();
  const doctors = listAllDoctors();
  const clinicStatuses = listClinicStatus();
  const monthlyRevenue = getMonthlyRevenue(3);
  const pendingPatients = getPendingSessionPatients();

  // Today's appointments
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = getAppointments(today);
  const apptByStatus = {
    booked:     todayAppts.filter(a => a.status === "booked").length,
    confirmed:  todayAppts.filter(a => a.status === "confirmed").length,
    arrived:    todayAppts.filter(a => a.status === "arrived").length,
    in_session: todayAppts.filter(a => a.status === "in_session").length,
    converted:  todayAppts.filter(a => a.status === "converted").length,
    no_show:    todayAppts.filter(a => a.status === "no_show").length,
  };
  const liveCount = apptByStatus.arrived + apptByStatus.in_session;
  const conversionRate = todayAppts.length > 0
    ? Math.round((apptByStatus.converted / todayAppts.length) * 100)
    : 0;

  // Zone aggregates
  const zoneMap = new Map<string, {
    zone_name: string;
    zone_manager_name: string | null;
    branches: typeof branchStats;
  }>();
  for (const b of branchStats) {
    const key = b.zone_name ?? "Unassigned";
    if (!zoneMap.has(key)) zoneMap.set(key, { zone_name: key, zone_manager_name: b.zone_manager_name ?? null, branches: [] });
    zoneMap.get(key)!.branches.push(b);
  }

  const zones = Array.from(zoneMap.values()).map(z => {
    const totalPatients    = z.branches.reduce((s, b) => s + b.total_patients, 0);
    const sessionsUsed     = z.branches.reduce((s, b) => s + b.sessions_used, 0);
    const sessionsPending  = z.branches.reduce((s, b) => s + b.sessions_pending, 0);
    const doctorCount      = z.branches.reduce((s, b) => s + b.doctor_count, 0);
    const totalSessions    = sessionsUsed + sessionsPending;
    const utilPct          = totalSessions > 0 ? Math.round((sessionsUsed / totalSessions) * 100) : 0;
    const patientsPerDoc   = doctorCount > 0 ? Math.round(totalPatients / doctorCount) : totalPatients;

    // Today's appts in this zone
    const zoneAppts        = todayAppts.filter(a => z.branches.some(b => b.id === a.branch_id));
    const zoneCompleted    = zoneAppts.filter(a => a.status === "converted").length;
    const zoneConvRate     = zoneAppts.length > 0 ? Math.round((zoneCompleted / zoneAppts.length) * 100) : 0;
    const zoneLive         = zoneAppts.filter(a => a.status === "arrived" || a.status === "in_session").length;

    return {
      ...z,
      totalPatients,
      sessionsUsed,
      sessionsPending,
      totalSessions,
      doctorCount,
      utilPct,
      patientsPerDoc,
      zoneAppts,
      zoneCompleted,
      zoneConvRate,
      zoneLive,
    };
  });

  // Total session stats
  const totalSessionsUsed    = branchStats.reduce((s, b) => s + b.sessions_used, 0);
  const totalSessionsPending = branchStats.reduce((s, b) => s + b.sessions_pending, 0);

  // Insights data
  const overduePatients  = pendingPatients.filter((p: any) => (p.days_since_visit ?? 0) > 90);
  const highValuePats    = pendingPatients.filter((p: any) => p.pending_sessions >= 3);
  const totalUnearned    = fin.package_unearned_balance_inr;
  const patientsWithEmail = patients.filter((p: any) => p.email).length;
  const emailCoverage    = patients.length > 0 ? Math.round((patientsWithEmail / patients.length) * 100) : 0;
  const confirmRate      = todayAppts.length > 0
    ? Math.round((todayAppts.filter((a: any) => ['confirmed','arrived','in_session','converted'].includes(a.status)).length / todayAppts.length) * 100)
    : 0;

  const insights = [
    { icon: AlertCircle, priority: 'high',   color: 'rose',    metric: String(overduePatients.length),         metricLabel: 'overdue',   title: `${overduePatients.length} patients overdue for sessions (90+ days)`,         body: 'These patients paid for sessions but have not returned in 3+ months. High churn risk — priority outreach recommended.', href: '/manager/today', cta: 'View re-engagement list' },
    { icon: TrendingUp,  priority: 'high',   color: 'amber',   metric: `₹${Math.round(totalUnearned/1000)}K`,  metricLabel: 'unearned',  title: `₹${(totalUnearned/100000).toFixed(1)}L unearned package balance`,             body: 'Customers pre-paid for sessions not yet consumed. Scheduling them improves P&L and retention.', href: '/manager/today', cta: 'Schedule pending sessions' },
    { icon: Calendar,    priority: confirmRate >= 70 ? 'low' : 'medium', color: confirmRate >= 70 ? 'emerald' : 'amber', metric: `${confirmRate}%`, metricLabel: 'confirmed', title: `Today's confirmation rate: ${confirmRate}%`, body: `${todayAppts.length - todayAppts.filter((a: any) => ['confirmed','arrived','in_session','converted'].includes(a.status)).length} appointments still at Booked — call before they become no-shows.`, href: '/manager/appointments', cta: 'Open schedule board' },
    { icon: Users,       priority: 'medium', color: 'violet',  metric: String(highValuePats.length),            metricLabel: 'patients',  title: `${highValuePats.length} high-value patients with 3+ pending sessions`,       body: 'Significant unused packages. Represent both a retention opportunity and a scheduling gap.', href: '/manager/today', cta: 'View patients' },
    { icon: Target,      priority: 'low',    color: 'blue',    metric: `${emailCoverage}%`,                     metricLabel: 'coverage',  title: `Email coverage: ${emailCoverage}% (${patientsWithEmail}/${patients.length})`, body: `${patients.length - patientsWithEmail} patients missing email. Enables reminders, campaigns, and digital receipts.`, href: '/manager/patients', cta: 'View patient records' },
  ];
  const insightColor: Record<string, { icon: string; bg: string }> = {
    rose:    { icon: 'text-destructive', bg: 'bg-destructive/10' },
    amber:   { icon: 'text-muted-foreground', bg: 'bg-secondary' },
    emerald: { icon: 'text-success',     bg: 'bg-success/10' },
    violet:  { icon: 'text-primary',     bg: 'bg-primary/10' },
    blue:    { icon: 'text-primary',     bg: 'bg-primary/10' },
  };
  const priorityCls: Record<string, string> = {
    high:   'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-secondary text-muted-foreground border-border',
    low:    'bg-primary/10 text-primary border-primary/20',
  };

  // Revenue trend — most recent month first
  const latestMonth  = monthlyRevenue[0];
  const prevMonth    = monthlyRevenue[1];
  const revDelta     = (latestMonth && prevMonth) ? latestMonth.collection_inr - prevMonth.collection_inr : null;

  // Clinic issues
  const clinicsWithIssues = clinicStatuses.filter(cs =>
    !cs.is_open || !!cs.doctor_on_leave || cs.appliances.some(a => !a.working)
  );

  return (
    <div className="space-y-10 pb-16">
      {/* ── Header ── */}
      <PageHeader
        title="Super Admin"
        subtitle={`KayaOS Network · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={llm.live ? "success" : "outline"} className="gap-1.5">
              <Brain className="h-3 w-3" />
              AI · {llm.mode}
            </Badge>
            <Badge variant={liveCount > 0 ? "default" : "outline"} className="gap-1.5">
              <Activity className="h-3 w-3" />
              {liveCount} live now
            </Badge>
          </div>
        }
      />

      {/* ── Network KPIs ── */}
      <section>
        <SectionHeading>Network financials</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBox label="Total Collection"   value={inr(fin.total_collection_inr)} accent />
          <StatBox label="Net Revenue"         value={inr(fin.total_net_revenue_inr)} sub={`${pct(fin.total_net_revenue_inr, fin.total_collection_inr)} recognised`} green />
          <StatBox label="Unearned Balance"    value={inr(fin.package_unearned_balance_inr)} sub="In unused packages" amber />
          <StatBox label="Total Patients"      value={patients.length} />
          <StatBox label="Sessions Used"       value={totalSessionsUsed} />
          <StatBox label="Sessions Pending"    value={totalSessionsPending} amber />
        </div>
      </section>

      {/* ── Today ── */}
      <section>
        <SectionHeading href="/manager/appointments" linkLabel="Schedule board">
          Today — {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Appointment funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-primary" />
                Appointments — {todayAppts.length} total
                {todayAppts.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground">{conversionRate}% converted</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Booked",     count: apptByStatus.booked,     color: "bg-primary/40" },
                { label: "Confirmed",  count: apptByStatus.confirmed,  color: "bg-primary/70" },
                { label: "Arrived",    count: apptByStatus.arrived,    color: "bg-primary" },
                { label: "In Session", count: apptByStatus.in_session, color: "bg-foreground" },
                { label: "Completed",  count: apptByStatus.converted,  color: "bg-success" },
                { label: "No Show",    count: apptByStatus.no_show,    color: "bg-muted-foreground" },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-muted-foreground shrink-0">{row.label}</div>
                  <div className="flex-1 h-4 bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${row.color} transition-all`}
                      style={{ width: todayAppts.length > 0 ? `${(row.count / todayAppts.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-bold w-5 text-right tabular-nums">{row.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Clinic readiness */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                Clinic readiness
                {clinicsWithIssues.length > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px]">
                    {clinicsWithIssues.length} issue{clinicsWithIssues.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {clinicStatuses.map(cs => {
                const down    = cs.appliances.filter(a => !a.working);
                const onLeave = !!cs.doctor_on_leave;
                const isOpen  = !!cs.is_open;
                const issue   = !isOpen || onLeave || down.length > 0;
                return (
                  <div key={cs.branch_id} className={[
                    "flex items-center gap-2.5 px-3 py-2 text-sm border",
                    issue ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/5",
                  ].join(" ")}>
                    <span className={`h-2 w-2 shrink-0 ${isOpen ? (issue ? "bg-destructive/60" : "bg-success") : "bg-destructive"}`} />
                    <span className="font-medium flex-1 truncate">{cs.branch_name}</span>
                    {!isOpen  && <span className="text-[10px] text-destructive font-mono uppercase tracking-wider">Closed</span>}
                    {onLeave  && <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Dr on leave</span>}
                    {down.length > 0 && <span className="text-[10px] text-destructive font-mono uppercase tracking-wider">{down.length} device{down.length !== 1 ? "s" : ""} down</span>}
                    {!issue   && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                  </div>
                );
              })}
              {clinicStatuses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No clinic status data.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Zone performance (expanded) ── */}
      <section>
        <SectionHeading>Zone performance</SectionHeading>
        <div className="space-y-6">
          {zones.map(z => (
            <div key={z.zone_name} className="border border-border overflow-hidden">
              {/* Zone header bar */}
              <div className="flex items-center gap-3 px-5 py-3 bg-secondary/30 border-b border-border">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-sm">{z.zone_name}</span>
                {z.zone_manager_name && (
                  <span className="text-xs text-muted-foreground">· Zonal Head: <span className="font-medium text-foreground">{z.zone_manager_name}</span></span>
                )}
                <div className="ml-auto flex items-center gap-3 text-xs">
                  {z.zoneLive > 0 && (
                    <span className="flex items-center gap-1 text-primary font-mono text-[10px] uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 bg-primary animate-pulse" />{z.zoneLive} live
                    </span>
                  )}
                  <span className="text-muted-foreground font-mono text-[10px]">{z.zoneAppts.length} appts today</span>
                  {z.zoneConvRate > 0 && (
                    <span className="text-success font-mono text-[10px]">{z.zoneConvRate}% converted</span>
                  )}
                </div>
              </div>

              {/* Zone KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 divide-x divide-border border-b border-border">
                {[
                  { label: "Clinics",           value: z.branches.length },
                  { label: "Doctors",           value: z.doctorCount },
                  { label: "Patients",          value: z.totalPatients },
                  { label: "Pts / Doctor",      value: z.patientsPerDoc },
                  { label: "Sessions Used",     value: z.sessionsUsed },
                  { label: "Sessions Pending",  value: z.sessionsPending },
                ].map(kv => (
                  <div key={kv.label} className="px-4 py-3 text-center">
                    <div className="text-lg font-bold tabular-nums">{kv.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{kv.label}</div>
                  </div>
                ))}
              </div>

              {/* Utilisation bar */}
              <div className="px-5 py-2 bg-card border-b border-border flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-32 shrink-0">Session utilisation</span>
                <div className="flex-1 h-1.5 bg-secondary overflow-hidden">
                  <div className="h-full bg-primary/60" style={{ width: `${z.utilPct}%` }} />
                </div>
                <span className="text-[11px] font-semibold tabular-nums w-8 text-right">{z.utilPct}%</span>
              </div>

              {/* Per-branch table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/20">
                    <tr className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      <th className="text-left px-5 py-2 font-medium">Clinic</th>
                      <th className="text-left px-3 py-2 font-medium">Manager</th>
                      <th className="text-right px-3 py-2 font-medium">Patients</th>
                      <th className="text-right px-3 py-2 font-medium">Doctors</th>
                      <th className="text-right px-3 py-2 font-medium">Used</th>
                      <th className="text-right px-3 py-2 font-medium">Pending</th>
                      <th className="px-4 py-2 font-medium w-28">Utilisation</th>
                      <th className="text-right px-4 py-2 font-medium">Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {z.branches.map(b => {
                      const totalSess = b.sessions_used + b.sessions_pending;
                      const util      = totalSess > 0 ? Math.round((b.sessions_used / totalSess) * 100) : 0;
                      const bAppts    = todayAppts.filter(a => a.branch_id === b.id);
                      const bDoctors  = doctors.filter(d => d.branch_id === b.id);
                      const bLive     = bAppts.filter(a => a.status === "arrived" || a.status === "in_session").length;
                      const bDone     = bAppts.filter(a => a.status === "converted").length;
                      return (
                        <tr key={b.id} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-semibold">{b.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{b.city}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">{b.manager_name ?? "—"}</td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums">{b.total_patients}</td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            <span className="text-xs">{b.doctor_count}</span>
                            {bDoctors.length > 0 && (
                              <div className="text-[10px] text-muted-foreground truncate max-w-[120px] text-right">
                                {bDoctors.slice(0, 2).map(d => d.name.replace(/^Dr\.?\s*/i, "")).join(", ")}
                                {bDoctors.length > 2 ? ` +${bDoctors.length - 2}` : ""}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-success font-medium">{b.sessions_used}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-muted-foreground font-medium">{b.sessions_pending}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-secondary overflow-hidden">
                                <div className="h-full bg-primary/60" style={{ width: `${util}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">{util}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-xs font-medium">{bAppts.length} appts</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {bLive > 0 && <span className="text-primary">{bLive} live · </span>}
                              {bDone > 0 && <span className="text-success">{bDone} done</span>}
                              {bLive === 0 && bDone === 0 && "—"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Insights ── */}
      <section>
        <SectionHeading>
          <span className="flex items-center gap-2"><Brain className="h-3.5 w-3.5 text-accent" />AI Insights</span>
        </SectionHeading>
        <div className="space-y-2.5">
          {insights.map((ins, i) => {
            const c = insightColor[ins.color];
            return (
              <div key={i} className="border border-border bg-card p-4 flex items-start gap-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center border border-border ${c.bg}`}>
                  <ins.icon className={`h-4 w-4 ${c.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{ins.title}</span>
                    <Badge variant="outline" className={`text-[9px] ${priorityCls[ins.priority]}`}>{ins.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ins.body}</p>
                  <Link href={ins.href} className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium hover:underline ${c.icon}`}>
                    {ins.cta} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xl font-bold tabular-nums ${c.icon}`}>{ins.metric}</div>
                  <div className="text-[10px] text-muted-foreground">{ins.metricLabel}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Revenue trend ── */}
      <section>
        <SectionHeading href="/manager/financials" linkLabel="Financials">Revenue trend</SectionHeading>
        <Card>
          <CardContent className="pt-4">
            {latestMonth && prevMonth && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Month-on-month</span>
                {revDelta !== null && (
                  <span className={`flex items-center gap-1 text-sm font-semibold ${revDelta >= 0 ? "text-success" : "text-destructive"}`}>
                    {revDelta >= 0
                      ? <TrendingUp className="h-4 w-4" />
                      : <TrendingDown className="h-4 w-4" />}
                    {inr(Math.abs(revDelta))} {revDelta >= 0 ? "up" : "down"} vs {prevMonth.label}
                  </span>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Month</th>
                    <th className="text-right pb-2 font-medium">Collection</th>
                    <th className="text-right pb-2 font-medium">Net Revenue</th>
                    <th className="text-right pb-2 font-medium">Sessions</th>
                    <th className="pb-2 w-32 pl-4">vs prev</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRevenue.filter(row => row.collection_inr > 0 || row.sessions_consumed_count > 0).map((row, i, arr) => {
                    const prev  = arr[i + 1];
                    const delta = prev ? row.collection_inr - prev.collection_inr : null;
                    const isUp  = delta != null && delta > 0;
                    return (
                      <tr key={row.month} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 font-medium">{row.label}</td>
                        <td className="py-2.5 text-right tabular-nums font-semibold">{inr(row.collection_inr)}</td>
                        <td className="py-2.5 text-right tabular-nums text-success font-semibold">{inr(row.net_revenue_inr)}</td>
                        <td className="py-2.5 text-right tabular-nums">{row.sessions_consumed_count}</td>
                        <td className="py-2.5 pl-4">
                          {delta != null ? (
                            <span className={`text-xs font-medium ${isUp ? "text-success" : "text-destructive"}`}>
                              {isUp ? "▲" : "▼"} {inr(Math.abs(delta))}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
