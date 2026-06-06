"use client";

import { useState, useTransition } from "react";
import { Loader2, Search, MessageSquare, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { inr } from "@/lib/utils";
import type { SalesRecord } from "@/lib/db";
import { useRouter } from "next/navigation";

type TypeFilter = "all" | "session_package" | "product";

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

export function SalesClient({ records }: { records: SalesRecord[] }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, start] = useTransition();

  const filtered = records.filter(r => {
    if (typeFilter !== "all" && r.record_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.patient_name.toLowerCase().includes(q) ||
        r.guest_code.toLowerCase().includes(q) ||
        (r.order_number ?? "").toLowerCase().includes(q) ||
        (r.item_code ?? "").toLowerCase().includes(q) ||
        r.item_name.toLowerCase().includes(q) ||
        r.phone.includes(q)
      );
    }
    return true;
  });

  const totalSessions = records.filter(r => r.record_type === "session_package").reduce((a, r) => a + (r.sessions_total ?? 0), 0);
  const usedSessions = records.filter(r => r.record_type === "session_package").reduce((a, r) => a + (r.sessions_used ?? 0), 0);
  const totalCollection = records.reduce((a, r) => a + r.collection_paid_inr, 0);

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(filtered.map(r => r.sales_id)) : new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const sendToQueue = () => {
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
            reason: `Sales outreach — ${r.item_name}${r.order_number ? ` (${r.order_number})` : ""}`,
            suggested_discount_pct: 10,
            context: { cohort: "sales" },
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
        <Tile label="Total records" value={String(records.length)} />
        <Tile label="Sessions sold" value={String(totalSessions)} />
        <Tile label="Sessions pending" value={String(totalSessions - usedSessions)} accent />
        <Tile label="Total collection" value={inr(totalCollection)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Sales Records</CardTitle>
              <CardDescription>All packages &amp; product sales with Guest Code, Order Number, and Item Code.</CardDescription>
            </div>
            {selected.size > 0 && (
              <Button size="sm" onClick={sendToQueue} disabled={isPending}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                Send WhatsApp to {selected.size} selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FilterPill active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All</FilterPill>
            <FilterPill active={typeFilter === "session_package"} onClick={() => setTypeFilter("session_package")}>
              <ShoppingBag className="h-3 w-3 mr-1" />Sessions
            </FilterPill>
            <FilterPill active={typeFilter === "product"} onClick={() => setTypeFilter("product")}>
              <ShoppingBag className="h-3 w-3 mr-1" />Products
            </FilterPill>
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Guest name, code, order#, item code…" className="pl-9 h-8 text-sm" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH className="w-8">
                    <input type="checkbox" onChange={e => toggleAll(e.target.checked)} />
                  </TH>
                  <TH>Guest Code</TH>
                  <TH>Guest Name</TH>
                  <TH>Phone</TH>
                  <TH>Order #</TH>
                  <TH>Item Code</TH>
                  <TH>Service / Product</TH>
                  <TH>Type</TH>
                  <TH>Branch</TH>
                  <TH className="text-center">Used</TH>
                  <TH className="text-center">Pending</TH>
                  <TH>Date</TH>
                  <TH>Expiry</TH>
                  <TH className="text-right">Amount</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.slice(0, 150).map(r => (
                  <TR key={r.sales_id} className={selected.has(r.sales_id) ? "bg-accent/5" : ""}>
                    <TD><input type="checkbox" checked={selected.has(r.sales_id)} onChange={() => toggleOne(r.sales_id)} /></TD>
                    <TD className="font-mono text-xs text-muted-foreground">{r.guest_code}</TD>
                    <TD className="font-medium text-sm">{r.patient_name}</TD>
                    <TD className="text-muted-foreground text-sm">{r.phone}</TD>
                    <TD className="font-mono text-xs text-muted-foreground">{r.order_number ?? "—"}</TD>
                    <TD className="font-mono text-xs text-muted-foreground">{r.item_code ?? "—"}</TD>
                    <TD className="text-sm max-w-[160px] truncate">{r.item_name}</TD>
                    <TD>
                      {r.record_type === "session_package"
                        ? <Badge variant="accent" className="text-[10px]">Sessions</Badge>
                        : <Badge variant="outline" className="text-[10px]">Product</Badge>}
                    </TD>
                    <TD><Badge variant="outline" className="text-xs">{r.last_visit_branch ?? r.branch_name}</Badge></TD>
                    <TD className="text-center text-sm">{r.sessions_used ?? "—"}</TD>
                    <TD className="text-center">
                      {r.sessions_pending != null
                        ? <Badge variant={r.sessions_pending > 0 ? "accent" : "outline"} className="text-[10px]">{r.sessions_pending}</Badge>
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </TD>
                    <TD className="text-sm text-muted-foreground">{r.purchase_date}</TD>
                    <TD className="text-sm text-muted-foreground">{r.expiry_date ?? "—"}</TD>
                    <TD className="text-right font-medium text-sm">{inr(r.collection_paid_inr)}</TD>
                  </TR>
                ))}
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

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
