"use client";

import { useState, useTransition } from "react";
import { Loader2, Search, MessageSquare, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { inr } from "@/lib/utils";
import type { SalesRecord } from "@/lib/db";
import { useRouter } from "next/navigation";

type UsageFilter = "all" | "unused" | "used";
type ExpiryFilter = "all" | "expiring30" | "expiring7" | "expired";

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function SessionsClient({ records }: { records: SalesRecord[] }) {
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, start] = useTransition();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const categories = Array.from(new Set(records.map(r => r.category))).sort();

  const filtered = records.filter(r => {
    if (usageFilter === "unused" && !((r.sessions_pending ?? 0) > 0)) return false;
    if (usageFilter === "used" && (r.sessions_pending ?? 0) > 0) return false;
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (expiryFilter === "expiring30" && !(r.expiry_date && r.expiry_date >= today && r.expiry_date <= new Date(Date.now() + 30*86400000).toISOString().slice(0,10) && (r.sessions_pending ?? 0) > 0)) return false;
    if (expiryFilter === "expiring7"  && !(r.expiry_date && r.expiry_date >= today && r.expiry_date <= new Date(Date.now() + 7*86400000).toISOString().slice(0,10) && (r.sessions_pending ?? 0) > 0)) return false;
    if (expiryFilter === "expired"    && !(r.expiry_date && r.expiry_date < today)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.patient_name.toLowerCase().includes(q) ||
        r.guest_code.toLowerCase().includes(q) ||
        (r.item_code ?? "").toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.item_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSessions  = records.reduce((a, r) => a + (r.sessions_total ?? 0), 0);
  const usedSessions   = records.reduce((a, r) => a + (r.sessions_used  ?? 0), 0);
  const unusedSessions = totalSessions - usedSessions;
  const expiringSoon   = records.filter(r =>
    r.expiry_date && r.expiry_date >= today &&
    r.expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) &&
    (r.sessions_pending ?? 0) > 0
  ).length;

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(filtered.map(r => r.sales_id)) : new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const sendToWhatsApp = () => {
    const sel = filtered.filter(r => selected.has(r.sales_id));
    if (!sel.length) return;
    start(async () => {
      await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: sel.map(r => ({
            patient_id: r.patient_id,
            patient_name: r.patient_name,
            phone: r.phone,
            branch_name: r.branch_name,
            reason: `${r.sessions_pending} unused session${(r.sessions_pending ?? 0) !== 1 ? "s" : ""} on ${r.item_name}`,
            suggested_discount_pct: 10,
            context: { cohort: "sessions" },
          })),
        }),
      });
      setSelected(new Set());
      router.push("/manager/whatsapp");
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Total packages" value={String(records.length)} />
        <Tile label="Sessions sold" value={String(totalSessions)} />
        <Tile label="Unused sessions" value={String(unusedSessions)} sub={`${usedSessions} consumed`} accent />
        <Tile label="Expiring in 30d" value={String(expiringSoon)} warn={expiringSoon > 0} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Session Packages</CardTitle>
              <CardDescription>Filter by usage, session type, or search by guest code / item code.</CardDescription>
            </div>
            {selected.size > 0 && (
              <Button size="sm" onClick={sendToWhatsApp} disabled={isPending}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                Send WhatsApp to {selected.size} selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill active={usageFilter === "all"}    onClick={() => setUsageFilter("all")}>All</FilterPill>
            <FilterPill active={usageFilter === "unused"} onClick={() => setUsageFilter("unused")}>
              Unused ({records.filter(r => (r.sessions_pending ?? 0) > 0).length})
            </FilterPill>
            <FilterPill active={usageFilter === "used"}   onClick={() => setUsageFilter("used")}>
              Fully Used ({records.filter(r => (r.sessions_pending ?? 0) === 0).length})
            </FilterPill>
            <FilterPill active={expiryFilter === "all"}        onClick={() => setExpiryFilter("all")}>All expiry</FilterPill>
            <FilterPill active={expiryFilter === "expiring7"}  onClick={() => setExpiryFilter("expiring7")}>Expiring in 7d</FilterPill>
            <FilterPill active={expiryFilter === "expiring30"} onClick={() => setExpiryFilter("expiring30")}>Expiring in 30d</FilterPill>
            <FilterPill active={expiryFilter === "expired"}    onClick={() => setExpiryFilter("expired")}>Expired</FilterPill>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-7 rounded-full border border-border bg-secondary text-xs font-medium px-3 text-muted-foreground focus:outline-none"
            >
              <option value="">All types</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Guest code, name, item code…" className="pl-9 h-8 text-sm" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH className="w-8"><input type="checkbox" onChange={e => toggleAll(e.target.checked)} /></TH>
                  <TH>Guest Code</TH>
                  <TH>Guest Name</TH>
                  <TH>Phone</TH>
                  <TH>Item Code</TH>
                  <TH>Service</TH>
                  <TH>Type</TH>
                  <TH>Last Branch Visited</TH>
                  <TH className="text-center">Used</TH>
                  <TH className="text-center">Total</TH>
                  <TH className="text-center">Unused</TH>
                  <TH>Date of Billing</TH>
                  <TH>Expiry</TH>
                  <TH className="text-right">Paid</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.slice(0, 150).map(r => {
                  const expired = r.expiry_date && r.expiry_date < today;
                  const expiring = r.expiry_date && !expired &&
                    r.expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) &&
                    (r.sessions_pending ?? 0) > 0;
                  return (
                    <TR key={r.sales_id} className={selected.has(r.sales_id) ? "bg-accent/5" : ""}>
                      <TD><input type="checkbox" checked={selected.has(r.sales_id)} onChange={() => toggleOne(r.sales_id)} /></TD>
                      <TD className="font-mono text-xs text-muted-foreground">{r.guest_code}</TD>
                      <TD className="font-medium text-sm">{r.patient_name}</TD>
                      <TD className="text-sm text-muted-foreground">{r.phone}</TD>
                      <TD className="font-mono text-xs text-muted-foreground">{r.item_code ?? "—"}</TD>
                      <TD className="text-sm max-w-[140px] truncate">{r.item_name}</TD>
                      <TD><Badge variant="outline" className="text-[10px]">{r.category}</Badge></TD>
                      <TD><Badge variant="outline" className="text-xs">{r.last_visit_branch ?? r.branch_name}</Badge></TD>
                      <TD className="text-center text-sm">{r.sessions_used}</TD>
                      <TD className="text-center text-sm">{r.sessions_total}</TD>
                      <TD className="text-center">
                        {(r.sessions_pending ?? 0) > 0
                          ? <Badge variant="accent" className="text-[10px]">{r.sessions_pending}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </TD>
                      <TD className="text-sm text-muted-foreground whitespace-nowrap">{r.purchase_date}</TD>
                      <TD className={`text-sm whitespace-nowrap ${expired ? "text-destructive font-medium" : expiring ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                        {r.expiry_date
                          ? <span className="flex items-center gap-1">
                              {(expired || expiring) && <AlertTriangle className="h-3 w-3 shrink-0" />}
                              {r.expiry_date}
                            </span>
                          : "—"}
                      </TD>
                      <TD className="text-right text-sm font-medium">{inr(r.collection_paid_inr)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
          {filtered.length > 150 && (
            <p className="text-xs text-muted-foreground text-center">Showing first 150 of {filtered.length}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ label, value, sub, accent, warn }: { label: string; value: string; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-accent/30 bg-accent/5" : warn ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent ? "text-accent" : warn ? "text-amber-600" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
