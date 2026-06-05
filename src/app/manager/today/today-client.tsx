"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Phone, Users, CalendarCheck2, TrendingUp, AlertCircle,
  Target, Zap, ArrowRight, MessageCircle, CheckCircle2,
  Loader2, CalendarPlus, ExternalLink, ChevronLeft, TriangleAlert, X,
  ShoppingBag, MessageSquare, Stethoscope, Receipt, KeyRound, Printer,
} from "lucide-react";
import { inr } from "@/lib/utils";
import Link from "next/link";
import type { ConfirmationQueueRow, PendingSessionPatient, ArrivedPatient } from "@/lib/db";
import type { CohortRow } from "@/lib/types";

const PIPELINE = [
  { status: "booked",     label: "Booked",     color: "bg-blue-50 border-blue-200",    dot: "bg-blue-400" },
  { status: "confirmed",  label: "Confirmed",  color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  { status: "arrived",    label: "Arrived",    color: "bg-amber-50 border-amber-200",   dot: "bg-amber-500" },
  { status: "in_session", label: "In Session", color: "bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  { status: "converted",  label: "Completed",  color: "bg-green-50 border-green-200",   dot: "bg-green-600" },
];

const SERVICE_OPTIONS = [
  "Consultation",
  "Acne Clearance Program",
  "Carbon Laser Peel",
  "Chemical Peel",
  "Laser Hair Reduction",
  "Microneedling for Scars",
  "Q-Switch Laser Toning",
];

type Action =
  | { type: "confirm"; appointmentId: number }
  | { type: "schedule" };

type PatientEntry = {
  key: string;
  name: string;
  phone: string;
  branch_name: string;
  context: string[];
  meta?: string;
  action: Action;
};

type Group = {
  key: string;
  label: string;
  description: string;
  script: string;
  icon: React.ElementType;
  borderCls: string;
  tileCls: string;
  badgeCls: string;
  countCls: string;
  entries: PatientEntry[];
};

function formatTime(ts: string) {
  return ts.slice(11, 16);
}

function buildGroups(
  confirmQueue: ConfirmationQueueRow[],
  pendingPatients: PendingSessionPatient[],
  followUp: CohortRow[],
  missedSession: CohortRow[],
  gapCloser: CohortRow[],
  alpha: CohortRow[],
  beta: CohortRow[],
): Group[] {
  return [
    {
      key: "confirmation",
      label: "Confirmation",
      description: "Today's booked appointments needing a confirmation call",
      script: "Script: \"Hi [name], calling from Kaya to confirm your [service] appointment at [time] today. Will you be able to make it?\"",
      icon: CalendarCheck2,
      borderCls: "border-blue-300",
      tileCls: "bg-blue-50 hover:bg-blue-100/80",
      badgeCls: "bg-blue-200 text-blue-800",
      countCls: "text-blue-700",
      entries: confirmQueue.map(r => ({
        key: `confirm-${r.id}`,
        name: r.patient_name,
        phone: r.phone,
        branch_name: r.branch_name,
        context: [
          `${r.service_type} at ${formatTime(r.appointment_ts)}${r.doctor_name ? ` · Dr. ${r.doctor_name}` : ""}`,
          r.pending_sessions > 0
            ? `Has ${r.pending_sessions} unused session${r.pending_sessions > 1 ? "s" : ""} — opportunity to upsell or reschedule`
            : "",
          r.referred_by ? `Referred by ${r.referred_by}` : "",
        ].filter(Boolean),
        meta: formatTime(r.appointment_ts) + " · " + r.service_type,
        action: { type: "confirm", appointmentId: r.id },
      })),
    },
    {
      key: "followup",
      label: "Follow Up",
      description: "Treated 2–10 days ago — check skin response",
      script: "Script: \"Hi [name], this is Kaya following up on your recent [service]. How is your skin feeling? Any redness or concerns?\"",
      icon: MessageCircle,
      borderCls: "border-emerald-300",
      tileCls: "bg-emerald-50 hover:bg-emerald-100/80",
      badgeCls: "bg-emerald-200 text-emerald-800",
      countCls: "text-emerald-700",
      entries: followUp.map(r => ({
        key: `followup-${r.patient_id}`,
        name: r.patient_name,
        phone: r.phone,
        branch_name: r.branch_name,
        context: [r.reason],
        meta: r.context.service_name ?? undefined,
        action: { type: "schedule" },
      })),
    },
    {
      key: "call_queue",
      label: "Call Queue",
      description: "Unused sessions, no upcoming appointment",
      script: "Script: \"Hi [name], you have [N] sessions remaining on your [service] package. Would you like to schedule your next visit this week?\"",
      icon: Phone,
      borderCls: "border-violet-300",
      tileCls: "bg-violet-50 hover:bg-violet-100/80",
      badgeCls: "bg-violet-200 text-violet-800",
      countCls: "text-violet-700",
      entries: pendingPatients.map(p => ({
        key: `queue-${p.id}`,
        name: p.name,
        phone: p.phone,
        branch_name: p.branch_name,
        context: [
          `${p.pending_sessions} pending session${p.pending_sessions > 1 ? "s" : ""} — no upcoming appointment`,
          p.service_names ? `Package: ${p.service_names}` : "",
          p.days_since_visit !== null
            ? `Last visit: ${p.days_since_visit < 1 ? "today" : p.days_since_visit < 30 ? `${p.days_since_visit} days ago` : `${Math.round(p.days_since_visit / 30)} months ago`}`
            : "",
        ].filter(Boolean),
        meta: `${p.pending_sessions} sessions pending`,
        action: { type: "schedule" },
      })),
    },
    {
      key: "missed",
      label: "Missed Session",
      description: "Active packages, last visit 14–120 days ago",
      script: "Script: \"Hi [name], we noticed you haven't visited in a while — you still have sessions remaining on your [service] package. Want to book a slot this week?\"",
      icon: AlertCircle,
      borderCls: "border-amber-300",
      tileCls: "bg-amber-50 hover:bg-amber-100/80",
      badgeCls: "bg-amber-200 text-amber-800",
      countCls: "text-amber-700",
      entries: missedSession.map(r => ({
        key: `missed-${r.patient_id}`,
        name: r.patient_name,
        phone: r.phone,
        branch_name: r.branch_name,
        context: [r.reason],
        meta: r.context.service_name ?? undefined,
        action: { type: "schedule" },
      })),
    },
    {
      key: "gap",
      label: "Gap Closer",
      description: "6+ months inactive with paid balance in unused sessions",
      script: "Script: \"Hi [name], you have [N] sessions worth ₹[X] on your [service] package. We'd hate for them to go unused — shall we get you booked in soon?\"",
      icon: TrendingUp,
      borderCls: "border-orange-300",
      tileCls: "bg-orange-50 hover:bg-orange-100/80",
      badgeCls: "bg-orange-200 text-orange-800",
      countCls: "text-orange-700",
      entries: gapCloser.map(r => ({
        key: `gap-${r.patient_id}`,
        name: r.patient_name,
        phone: r.phone,
        branch_name: r.branch_name,
        context: [r.reason],
        meta: r.context.service_name ?? undefined,
        action: { type: "schedule" },
      })),
    },
    {
      key: "alpha",
      label: "Scar Upsell",
      description: "Acne-cleared, doctor-flagged ready for scar treatment",
      script: "Script: \"Hi [name], great news — your acne has cleared well. Dr. [name] has recommended microneedling for your scarring. We have a 20% offer this month — want to hear more?\"",
      icon: Target,
      borderCls: "border-teal-300",
      tileCls: "bg-teal-50 hover:bg-teal-100/80",
      badgeCls: "bg-teal-200 text-teal-800",
      countCls: "text-teal-700",
      entries: alpha.map(r => ({
        key: `alpha-${r.patient_id}`,
        name: r.patient_name,
        phone: r.phone,
        branch_name: r.branch_name,
        context: [r.reason],
        meta: r.context.next_recommended_service ?? "Microneedling for Scars",
        action: { type: "schedule" },
      })),
    },
    {
      key: "beta",
      label: "Q-Switch Upsell",
      description: "Melasma patients, doctor-flagged laser-ready",
      script: "Script: \"Hi [name], Dr. [name] has flagged you as a great candidate for Q-Switch Laser Toning for your pigmentation. We have a 15% offer — interested in learning more?\"",
      icon: Zap,
      borderCls: "border-indigo-300",
      tileCls: "bg-indigo-50 hover:bg-indigo-100/80",
      badgeCls: "bg-indigo-200 text-indigo-800",
      countCls: "text-indigo-700",
      entries: beta.map(r => ({
        key: `beta-${r.patient_id}`,
        name: r.patient_name,
        phone: r.phone,
        branch_name: r.branch_name,
        context: [r.reason],
        meta: r.context.next_recommended_service ?? "Q-Switch Laser Toning",
        action: { type: "schedule" },
      })),
    },
  ];
}

export function TodayClient({
  pipelineCounts,
  totalToday,
  noShows,
  confirmQueue,
  pendingPatients,
  followUp,
  missedSession,
  gapCloser,
  alpha,
  beta,
  arrivedToday,
}: {
  pipelineCounts: Record<string, number>;
  totalToday: number;
  noShows: number;
  confirmQueue: ConfirmationQueueRow[];
  pendingPatients: PendingSessionPatient[];
  followUp: CohortRow[];
  missedSession: CohortRow[];
  gapCloser: CohortRow[];
  alpha: CohortRow[];
  beta: CohortRow[];
  arrivedToday: ArrivedPatient[];
}) {
  const groups = buildGroups(confirmQueue, pendingPatients, followUp, missedSession, gapCloser, alpha, beta);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedGroup = selectedKey ? groups.find(g => g.key === selectedKey) ?? null : null;

  return (
    <div className="space-y-6">
      {/* Pipeline summary — always visible */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Today&apos;s Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE.map(p => (
            <div key={p.status} className={`rounded-xl border p-4 ${p.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2.5 w-2.5 rounded-full ${p.dot}`} />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {p.label}
                </span>
              </div>
              <div className="text-3xl font-bold tabular-nums">{pipelineCounts[p.status] ?? 0}</div>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">No Show</span>
            </div>
            <div className="text-3xl font-bold tabular-nums text-muted-foreground">{noShows}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{totalToday} total appointments today</span>
          </div>
          <Link href="/manager/appointments" className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
            Open schedule board <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* In Clinic Now */}
      <InClinicSection arrivedToday={arrivedToday} />

      {/* Call queue — tiles or detail view */}
      {selectedGroup ? (
        <GroupDetailView group={selectedGroup} onBack={() => setSelectedKey(null)} />
      ) : (
        <CallQueueGrid groups={groups} onSelect={setSelectedKey} />
      )}
    </div>
  );
}

/* ── Grid of group tiles ──────────────────────────────────────────────────── */

function CallQueueGrid({ groups, onSelect }: { groups: Group[]; onSelect: (key: string) => void }) {
  const totalCallable = groups.reduce((sum, g) => sum + g.entries.length, 0);
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Call Queue</h2>
        <span className="text-xs text-muted-foreground">{totalCallable} patients across {groups.length} groups</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {groups.map(group => (
          <GroupTile key={group.key} group={group} onClick={() => onSelect(group.key)} />
        ))}
      </div>
    </section>
  );
}

function GroupTile({ group, onClick }: { group: Group; onClick: () => void }) {
  const Icon = group.icon;
  const hasPatients = group.entries.length > 0;
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border text-left p-4 transition-all",
        group.tileCls,
        group.borderCls,
        hasPatients
          ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          : "cursor-pointer opacity-75",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {!hasPatients && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
      </div>
      <div className={`text-3xl font-bold tabular-nums mb-1 ${group.countCls}`}>
        {group.entries.length}
      </div>
      <div className="font-semibold text-sm leading-tight">{group.label}</div>
      <div className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">
        {group.description}
      </div>
    </button>
  );
}

/* ── Group detail view ────────────────────────────────────────────────────── */

function GroupDetailView({ group, onBack }: { group: Group; onBack: () => void }) {
  const Icon = group.icon;
  return (
    <section className="space-y-4">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Call Queue
      </button>

      {/* Group header */}
      <div className={`rounded-xl border p-4 ${group.tileCls} ${group.borderCls}`}>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">{group.label}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${group.badgeCls}`}>
                {group.entries.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{group.description}</div>
          </div>
        </div>
      </div>

      {/* Call script hint */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-0.5">Call Script</div>
        <p className="text-xs text-amber-800 italic leading-relaxed">{group.script}</p>
      </div>

      {/* Patient cards */}
      {group.entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
          No patients in this group right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {group.entries.map(entry => (
            <PatientCard key={entry.key} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Patient card ─────────────────────────────────────────────────────────── */

function PatientCard({ entry }: { entry: PatientEntry }) {
  const [bookOpen, setBookOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col overflow-hidden">
      <div className="p-3 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-sm leading-tight">{entry.name}</div>
            <div className="text-[10px] text-muted-foreground">{entry.branch_name}</div>
          </div>
          {entry.meta && (
            <span className="text-[10px] bg-secondary text-muted-foreground rounded-full px-2 py-0.5 font-medium shrink-0">
              {entry.meta}
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          {entry.context.map((line, i) => (
            <div key={i} className="text-xs text-foreground/75 flex items-start gap-1.5">
              <span className="text-muted-foreground shrink-0 mt-px">·</span>
              <span className="leading-snug">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border/60 px-3 py-2 flex items-center gap-2 bg-secondary/20">
        <a
          href={`tel:${entry.phone}`}
          className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors flex-1 justify-center"
        >
          <Phone className="h-3 w-3" />
          {entry.phone}
        </a>
        {entry.action.type === "confirm" ? (
          <ConfirmButton appointmentId={entry.action.appointmentId} />
        ) : (
          <button
            onClick={() => setBookOpen(v => !v)}
            className={[
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              bookOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card hover:bg-secondary",
            ].join(" ")}
          >
            <CalendarPlus className="h-3 w-3" />
            Book
          </button>
        )}
      </div>

      {bookOpen && (
        <QuickBookPanel
          phone={entry.phone}
          patientName={entry.name}
          onClose={() => setBookOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Confirm button ───────────────────────────────────────────────────────── */

function ConfirmButton({ appointmentId }: { appointmentId: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const router = useRouter();

  async function confirm() {
    setState("loading");
    try {
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      setState("done");
      router.refresh();
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium px-2 py-1.5 whitespace-nowrap">
        <CheckCircle2 className="h-3 w-3" /> Confirmed
      </span>
    );
  }

  return (
    <button
      onClick={confirm}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors whitespace-nowrap"
    >
      {state === "loading"
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : <CalendarCheck2 className="h-3 w-3" />
      }
      Confirm
    </button>
  );
}

/* ── Conflict types ───────────────────────────────────────────────────────── */

type ConflictRow = {
  id: number;
  appointment_ts: string;
  service_type: string;
  status: string;
  doctor_name: string | null;
  branch_name: string | null;
  duration_minutes: number;
};

async function fetchConflicts(phone: string, appointment_ts: string): Promise<ConflictRow[]> {
  const res = await fetch(
    `/api/appointments?phone=${encodeURIComponent(phone)}&appointment_ts=${encodeURIComponent(appointment_ts)}`
  );
  if (!res.ok) return [];
  const { conflicts } = await res.json();
  return conflicts ?? [];
}

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked", confirmed: "Confirmed",
  arrived: "Arrived", in_session: "In Session",
};

/* ── Conflict modal ───────────────────────────────────────────────────────── */

function ConflictModal({
  conflicts,
  patientName,
  requestedTs,
  service,
  loading,
  onBookAnyway,
  onCancel,
}: {
  conflicts: ConflictRow[];
  patientName: string;
  requestedTs: string;
  service: string;
  loading: boolean;
  onBookAnyway: () => void;
  onCancel: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-150">
      <div className="bg-card rounded-2xl border-2 border-red-400 shadow-2xl max-w-sm w-full overflow-hidden">

        {/* Red header */}
        <div className="bg-red-600 px-5 py-4 flex items-start gap-3">
          <TriangleAlert className="h-6 w-6 text-white shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-base tracking-tight">Double Booking Alert</div>
            <div className="text-red-100 text-xs mt-0.5 leading-snug">
              {patientName} already has {conflicts.length} active appointment{conflicts.length > 1 ? "s" : ""} within 60 min of {requestedTs.slice(11, 16)}
            </div>
          </div>
          <button onClick={onCancel} className="text-red-200 hover:text-white shrink-0 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conflict list */}
        <div className="px-5 pt-4 pb-2 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-red-600">
            Conflicting Appointments
          </div>
          {conflicts.map(c => (
            <div key={c.id} className="rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-red-900">{c.service_type}</span>
                <span className="text-[10px] rounded-full bg-red-200 text-red-900 px-2 py-0.5 font-bold uppercase tracking-wide">
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <div className="text-xs text-red-700 mt-1 flex flex-wrap gap-2">
                <span className="font-semibold">
                  {c.appointment_ts.replace("T", " ").slice(0, 16)}
                </span>
                {c.doctor_name && <span>· Dr. {c.doctor_name}</span>}
                {c.branch_name && <span>· {c.branch_name}</span>}
                <span>· {c.duration_minutes} min slot</span>
              </div>
            </div>
          ))}
        </div>

        {/* New booking summary */}
        <div className="px-5 py-3">
          <div className="rounded-lg bg-secondary border border-border px-3 py-2 text-xs">
            <span className="text-muted-foreground">Booking request:</span>{" "}
            <span className="font-semibold">{service}</span>
            {" · "}{patientName}{" · "}{requestedTs.slice(0, 10)} at {requestedTs.slice(11, 16)}
          </div>
        </div>

        {/* Acknowledge checkbox */}
        <div className="px-5 pb-3">
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-red-300 accent-red-600 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground leading-snug group-hover:text-foreground transition-colors">
              I understand this will create a duplicate booking for <span className="font-semibold">{patientName}</span>
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Change Time
          </button>
          <button
            onClick={onBookAnyway}
            disabled={!acknowledged || loading}
            className="flex-1 rounded-lg bg-red-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <TriangleAlert className="h-4 w-4" />
            }
            Book Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Day-appointment type ─────────────────────────────────────────────────── */

type DayAppt = {
  id: number;
  appointment_ts: string;
  service_type: string;
  status: string;
  duration_minutes: number;
  doctor_name: string | null;
};

// Clinic hours: 9 AM – 8 PM in 30-min slots
const SLOT_HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9..19

function slotLabel(h: number) {
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function getSlotOccupant(h: number, m: number, appts: DayAppt[]): DayAppt | null {
  const slotMins = h * 60 + m;
  for (const a of appts) {
    const t = a.appointment_ts.replace("T", " ");
    const [ah, am] = t.slice(11, 16).split(":").map(Number);
    const apptMins = ah * 60 + am;
    if (apptMins < slotMins + 30 && apptMins + a.duration_minutes > slotMins) return a;
  }
  return null;
}

/* ── Quick book panel ─────────────────────────────────────────────────────── */

function QuickBookPanel({
  phone,
  patientName,
  onClose,
}: {
  phone: string;
  patientName: string;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  // If it's past 6 PM there are no more slots today — default to tomorrow
  function smartDefaultDate() {
    const now = new Date();
    if (now.getHours() >= 18) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().slice(0, 10);
    }
    return today;
  }

  const [date, setDate] = useState(smartDefaultDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [phase, setPhase] = useState<"idle" | "checking" | "loading" | "done">("idle");
  const [bookedTs, setBookedTs] = useState("");
  const [dayAppts, setDayAppts] = useState<DayAppt[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConflicts, setModalConflicts] = useState<ConflictRow[]>([]);

  // Fetch patient's schedule whenever date changes
  useEffect(() => {
    setLoadingDay(true);
    setSelectedTime(null);
    fetch(`/api/appointments?phone=${encodeURIComponent(phone)}&date=${date}`)
      .then(r => r.json())
      .then(d => setDayAppts(d.appointments ?? []))
      .catch(() => setDayAppts([]))
      .finally(() => setLoadingDay(false));
  }, [date, phone]);

  async function handleSubmit() {
    if (!selectedTime) return;
    const appointment_ts = `${date}T${selectedTime}:00`;
    setPhase("checking");
    const found = await fetchConflicts(phone, appointment_ts);
    if (found.length > 0) {
      setModalConflicts(found);
      setShowModal(true);
      setPhase("idle");
    } else {
      await doBook(appointment_ts);
    }
  }

  async function doBook(appointment_ts: string) {
    setPhase("loading");
    setShowModal(false);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, service_type: service, appointment_ts }),
      });
      if (!res.ok) throw new Error();
      setBookedTs(appointment_ts);
      setPhase("done");
    } catch {
      setPhase("idle");
    }
  }

  if (phase === "done") {
    return (
      <div className="border-t border-border bg-emerald-50 px-3 py-3 space-y-2">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          Booked — {service} on {bookedTs.slice(0, 10)} at {bookedTs.slice(11, 16)}
        </div>
        <Link
          href={`/manager/appointments?date=${bookedTs.slice(0, 10)}`}
          className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
        >
          View on schedule board <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const now = new Date();
  const isToday = date === today;
  const nowMins = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
  const busy = phase === "checking" || phase === "loading";
  const freeSlotCount = SLOT_HOURS.reduce((n, h) =>
    n + [0, 30].filter(m => !getSlotOccupant(h, m, dayAppts) && !(isToday && h * 60 + m < nowMins)).length
  , 0);

  return (
    <>
      {showModal && (
        <ConflictModal
          conflicts={modalConflicts}
          patientName={patientName}
          requestedTs={`${date}T${selectedTime ?? "00:00"}:00`}
          service={service}
          loading={phase === "loading"}
          onBookAnyway={() => doBook(`${date}T${selectedTime ?? "00:00"}:00`)}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="border-t border-border bg-card px-3 py-3 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Book — {patientName}
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Date picker */}
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Time slot grid */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Available Slots
            </span>
            {loadingDay ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                {freeSlotCount} free · {dayAppts.length} booked
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            {loadingDay ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 mx-auto mb-1.5 animate-spin" />
                Checking schedule…
              </div>
            ) : freeSlotCount === 0 && !loadingDay ? (
              <div className="py-6 px-4 text-center space-y-3">
                <div className="text-2xl">😴</div>
                <div className="text-sm font-semibold text-foreground">
                  {isToday ? "No slots left today" : "No free slots on this date"}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {isToday
                    ? `All clinic slots for today (9 AM – 7:30 PM) have passed or are booked.`
                    : `All ${dayAppts.length} slot${dayAppts.length !== 1 ? "s" : ""} on this date are already booked.`}
                </div>
                <button
                  onClick={() => {
                    const next = new Date(date + "T00:00:00");
                    next.setDate(next.getDate() + 1);
                    setDate(next.toISOString().slice(0, 10));
                  }}
                  className="mx-auto flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Try next day →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-52 overflow-y-auto">
                {SLOT_HOURS.map(h => (
                  <div key={h} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-secondary/20">
                    {/* Hour label */}
                    <span className="text-[10px] text-muted-foreground w-9 shrink-0 text-right tabular-nums">
                      {slotLabel(h)}
                    </span>

                    {/* Two half-hour slots */}
                    <div className="flex gap-1.5 flex-1">
                      {[0, 30].map(m => {
                        const slotTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                        const occupant = getSlotOccupant(h, m, dayAppts);
                        const isPast  = isToday && h * 60 + m < nowMins;
                        const isSelected = selectedTime === slotTime;

                        if (occupant) {
                          // Booked slot — red, not clickable
                          return (
                            <div
                              key={slotTime}
                              title={`${occupant.service_type}${occupant.doctor_name ? ` · Dr. ${occupant.doctor_name}` : ""} (${STATUS_LABEL[occupant.status] ?? occupant.status})`}
                              className="flex-1 rounded-md bg-red-50 border border-red-200 px-1.5 py-1 cursor-not-allowed min-h-[40px] flex flex-col justify-center"
                            >
                              <div className="text-[10px] font-semibold text-red-500">{slotTime}</div>
                              <div className="text-[9px] text-red-400 truncate leading-tight mt-0.5">
                                {occupant.service_type.split(" ").slice(0, 2).join(" ")}
                              </div>
                            </div>
                          );
                        }

                        if (isPast) {
                          // Past slot — grayed out
                          return (
                            <div
                              key={slotTime}
                              className="flex-1 rounded-md bg-secondary/30 border border-border px-1.5 py-1 cursor-not-allowed min-h-[40px] flex items-center justify-center opacity-40"
                            >
                              <span className="text-[10px] text-muted-foreground">{slotTime}</span>
                            </div>
                          );
                        }

                        if (isSelected) {
                          // Selected slot — primary
                          return (
                            <button
                              key={slotTime}
                              onClick={() => setSelectedTime(null)}
                              className="flex-1 rounded-md bg-primary border border-primary text-primary-foreground px-1.5 py-1 min-h-[40px] flex flex-col items-center justify-center transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mb-0.5" />
                              <span className="text-[10px] font-bold">{slotTime}</span>
                            </button>
                          );
                        }

                        // Free slot — green, clickable
                        return (
                          <button
                            key={slotTime}
                            onClick={() => setSelectedTime(slotTime)}
                            className="flex-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-1 min-h-[40px] flex items-center justify-center hover:bg-emerald-100 hover:border-emerald-300 transition-colors group"
                          >
                            <span className="text-[10px] font-medium group-hover:font-semibold">{slotTime}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legend — only shown when there are slots to explain */}
            {freeSlotCount > 0 && <div className="flex items-center gap-3 px-3 py-2 bg-secondary/20 border-t border-border/60">
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />
                Free
              </span>
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-red-100 border border-red-300 inline-block" />
                Booked
              </span>
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-primary inline-block" />
                Selected
              </span>
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-secondary border border-border inline-block opacity-40" />
                Past
              </span>
            </div>}
          </div>
        </div>

        {/* Selected slot summary */}
        {selectedTime && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-primary">{selectedTime}</span>
              <span className="text-muted-foreground"> on {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
            </div>
          </div>
        )}

        {/* Service picker */}
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Service</label>
          <select
            value={service}
            onChange={e => setService(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!selectedTime || busy}
            className="flex items-center gap-1.5 flex-1 justify-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <CalendarPlus className="h-3 w-3" />
            }
            {!selectedTime ? "Select a slot above" : busy ? "Checking…" : "Confirm Booking"}
          </button>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Service type badge helper ────────────────────────────────────────────── */

function serviceTypeBadgeCls(serviceType: string): string {
  const s = serviceType.toLowerCase();
  if (s.includes("laser") || s.includes("q-switch") || s.includes("carbon")) return "bg-violet-100 text-violet-700 border-violet-200";
  if (s.includes("peel") || s.includes("peeling")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (s.includes("microneedling")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (s.includes("acne")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (s.includes("prp") || s.includes("gfc") || s.includes("hair")) return "bg-rose-100 text-rose-700 border-rose-200";
  if (s.includes("consultation")) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-secondary text-muted-foreground border-border";
}

/* ── In Clinic Now section ────────────────────────────────────────────────── */

function InClinicSection({ arrivedToday }: { arrivedToday: ArrivedPatient[] }) {
  const [checkoutId, setCheckoutId] = useState<number | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          In Clinic Now
        </h2>
        <span className="text-xs text-muted-foreground">
          {arrivedToday.length} patient{arrivedToday.length !== 1 ? "s" : ""}
        </span>
      </div>

      {arrivedToday.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 py-8 text-center text-sm text-muted-foreground">
          No patients checked in yet today.
        </div>
      ) : (
        <div className="space-y-2">
          {arrivedToday.map(p => {
            const isOpen = checkoutId === p.appointment_id;
            const statusDot: Record<string, string> = {
              arrived: "bg-amber-500",
              in_session: "bg-violet-500",
              converted: "bg-emerald-500",
            };
            const statusLabel: Record<string, string> = {
              arrived: "Arrived",
              in_session: "In Session",
              converted: "Done",
            };
            return (
              <div key={p.appointment_id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Patient header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot[p.appt_status] ?? "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{p.patient_name}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${serviceTypeBadgeCls(p.service_type)}`}>
                        {p.service_type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {statusLabel[p.appt_status] ?? p.appt_status} · {p.appointment_ts.slice(11, 16)}
                      {p.doctor_name ? ` · Dr. ${p.doctor_name}` : ""}
                      {" · "}{p.branch_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.appt_status === "converted" ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </span>
                    ) : (
                      <button
                        onClick={() => setCheckoutId(isOpen ? null : p.appointment_id)}
                        className={[
                          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                          isOpen
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border bg-card hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700",
                        ].join(" ")}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {isOpen ? "Close" : "Checkout →"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Checkout panel */}
                {isOpen && (
                  <div className="border-t border-border bg-secondary/20 px-4 py-4">
                    <CheckoutFlow
                      appointmentId={p.appointment_id}
                      patientId={p.patient_id}
                      patientName={p.patient_name}
                      serviceType={p.service_type}
                      onClose={() => setCheckoutId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ── CheckoutFlow component ───────────────────────────────────────────────── */

type CheckoutPhase = "choose" | "products" | "consultation" | "treatment_otp" | "receipt";

type ReceiptItem = { name: string; cost: number | null };

function CheckoutFlow({
  appointmentId,
  patientId,
  patientName,
  serviceType,
  onClose,
}: {
  appointmentId: number;
  patientId: number;
  patientName: string;
  serviceType: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<CheckoutPhase>("choose");
  const [rxLoading, setRxLoading] = useState(false);
  const [rxItems, setRxItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [otp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const [receiptData, setReceiptData] = useState<{ items: ReceiptItem[]; total: number; type: string } | null>(null);

  const loadRx = async () => {
    setRxLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/portfolio`);
      const data = await res.json();
      const latest = data.portfolio?.prescriptions?.[0];
      const items: any[] = latest?.items ?? [];
      setRxItems(items);
      setSelected(items.map(() => true));
    } catch {}
    setRxLoading(false);
  };

  const goProducts = async () => {
    await loadRx();
    setPhase("products");
  };

  const selectedRxItems = rxItems.filter((_, i) => selected[i]);
  const total = selectedRxItems.reduce((s, it) => s + (Number(it.cost) || 0), 0);

  const collectAndReceipt = (type: "products" | "consultation") => {
    const items: ReceiptItem[] = type === "products"
      ? selectedRxItems.map(it => ({ name: it.product ?? it.name ?? "", cost: it.cost ?? null }))
      : [];
    const amt = type === "products" ? total : 0;
    setReceiptData({ items, total: amt, type });
    setPhase("receipt");
  };

  // ── Choose ──────────────────────────────────────────────────────────────────
  if (phase === "choose") {
    return (
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground">
          What is <span className="font-semibold text-foreground">{patientName}</span> purchasing today?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={goProducts}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-4 py-5 text-emerald-800 transition-colors text-center"
          >
            <ShoppingBag className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-sm">Products only</span>
            <span className="text-[11px] text-emerald-700 leading-snug">Buy items from prescription — not taking treatment today</span>
          </button>
          <button
            onClick={() => setPhase("consultation")}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-5 text-slate-700 transition-colors text-center"
          >
            <MessageSquare className="h-6 w-6 text-slate-500" />
            <span className="font-semibold text-sm">Consultation only</span>
            <span className="text-[11px] text-slate-600 leading-snug">No purchase today — close with ₹0 receipt</span>
          </button>
          <button
            onClick={() => setPhase("treatment_otp")}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 hover:bg-violet-100 px-4 py-5 text-violet-800 transition-colors text-center"
          >
            <Stethoscope className="h-6 w-6 text-violet-600" />
            <span className="font-semibold text-sm">Treatment</span>
            <span className="text-[11px] text-violet-700 leading-snug">Confirm with OTP — then start session</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Products ─────────────────────────────────────────────────────────────
  if (phase === "products") {
    if (rxLoading) {
      return (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading prescription…
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Select items patient is purchasing</span>
          <button onClick={() => setPhase("choose")} className="text-xs text-muted-foreground underline hover:text-foreground">← Back</button>
        </div>
        {rxItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
            No prescription found. Ask the doctor to generate one first.
          </div>
        ) : (
          <div className="space-y-1.5">
            {rxItems.map((it, i) => (
              <label key={i} className={[
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                selected[i] ? "border-emerald-300 bg-emerald-50" : "border-border bg-card opacity-60",
              ].join(" ")}>
                <input
                  type="checkbox"
                  checked={selected[i]}
                  onChange={() => setSelected(s => s.map((v, idx) => idx === i ? !v : v))}
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                <span className="flex-1 text-sm font-medium">{it.product ?? it.name}</span>
                {it.product_detail && <span className="text-xs text-muted-foreground">{it.product_detail}</span>}
                <span className="text-sm font-semibold tabular-nums">
                  {it.cost != null ? inr(it.cost) : <span className="text-muted-foreground">—</span>}
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">{selectedRxItems.length} item{selectedRxItems.length !== 1 ? "s" : ""} · </span>
            <span className="font-bold text-base">{inr(total)}</span>
          </div>
          <button
            onClick={() => collectAndReceipt("products")}
            disabled={selectedRxItems.length === 0}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Receipt className="h-4 w-4" />
            Collect {inr(total)} →
          </button>
        </div>
      </div>
    );
  }

  // ── Consultation only ─────────────────────────────────────────────────────
  if (phase === "consultation") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Consultation only — no purchase</span>
          <button onClick={() => setPhase("choose")} className="text-xs text-muted-foreground underline hover:text-foreground">← Back</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center space-y-1">
          <div className="text-3xl font-bold tabular-nums">₹0</div>
          <div className="text-xs text-muted-foreground">Consultation — no products or treatment taken</div>
        </div>
        <button
          onClick={() => collectAndReceipt("consultation")}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <Receipt className="h-4 w-4" />
          Close &amp; print receipt →
        </button>
      </div>
    );
  }

  // ── Treatment OTP ─────────────────────────────────────────────────────────
  if (phase === "treatment_otp") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Treatment confirmation</span>
          <button onClick={() => setPhase("choose")} className="text-xs text-muted-foreground underline hover:text-foreground">← Back</button>
        </div>
        <div className="rounded-xl border-2 border-violet-200 bg-violet-50 px-6 py-5 text-center space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 mb-3">
            <KeyRound className="h-4 w-4 inline mr-1.5" />
            Patient OTP
          </div>
          <div className="text-5xl font-bold tracking-[0.2em] font-mono text-violet-900">
            {otp.slice(0, 3)}-{otp.slice(3)}
          </div>
          <div className="text-xs text-violet-700 mt-2">
            Read this code to the patient and ask them to confirm it
          </div>
        </div>
        {!otpConfirmed ? (
          <button
            onClick={() => setOtpConfirmed(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-violet-400 bg-white hover:bg-violet-50 text-violet-800 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Patient confirmed OTP ✓
          </button>
        ) : (
          <button
            onClick={() => router.push(`/manager/practitioner/${appointmentId}`)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Stethoscope className="h-4 w-4" />
            Start treatment → Consent · Photos · Session
          </button>
        )}
      </div>
    );
  }

  // ── Receipt ───────────────────────────────────────────────────────────────
  if (phase === "receipt" && receiptData) {
    return (
      <ReceiptView
        patientName={patientName}
        serviceType={serviceType}
        data={receiptData}
        onClose={() => { setPhase("choose"); onClose(); }}
      />
    );
  }

  return null;
}

/* ── ReceiptView component ────────────────────────────────────────────────── */

function ReceiptView({
  patientName,
  serviceType,
  data,
  onClose,
}: {
  patientName: string;
  serviceType: string;
  data: { items: ReceiptItem[]; total: number; type: string };
  onClose: () => void;
}) {
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" /> Payment collected
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-secondary px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            Done ✓
          </button>
        </div>
      </div>

      {/* Receipt document */}
      <div className="rounded-xl border border-border bg-white overflow-hidden text-[#1f2937]">
        {/* Green top bar */}
        <div className="h-1.5 bg-[#1f7a5a]" />
        <div className="px-6 py-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight lowercase">kaya</div>
              <div className="text-[10px] tracking-[0.2em] font-semibold text-[#6b7280] mt-0.5">SKIN · HAIR · BODY</div>
            </div>
            <div className="text-right text-xs text-[#6b7280]">
              <div>{dateStr}</div>
              <div>{timeStr}</div>
            </div>
          </div>

          {/* Patient + type */}
          <div className="border-y border-[#e5e7eb] py-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">Patient</div>
              <div className="font-semibold text-sm">{patientName}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">Service</div>
              <div className="font-semibold text-sm">{serviceType}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">Type</div>
              <div className="font-semibold text-sm capitalize">{data.type === "consultation" ? "Consultation" : "Product purchase"}</div>
            </div>
          </div>

          {/* Items */}
          {data.items.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] border-b border-[#f3f4f6]">
                  <th className="py-1.5 font-semibold">Item</th>
                  <th className="py-1.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, i) => (
                  <tr key={i} className="border-b border-[#f9fafb]">
                    <td className="py-2 text-sm">{it.name}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {it.cost != null ? inr(it.cost) : <span className="text-[#9ca3af]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Total */}
          <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-3">
            <span className="font-bold text-base">Total collected</span>
            <span className="font-bold text-xl text-[#1f7a5a] tabular-nums">{inr(data.total)}</span>
          </div>

          {/* PAID stamp */}
          <div className="text-center">
            <span className="inline-block rounded border-2 border-emerald-500 px-4 py-1 text-emerald-600 font-bold text-lg tracking-widest rotate-[-2deg]">
              PAID
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
