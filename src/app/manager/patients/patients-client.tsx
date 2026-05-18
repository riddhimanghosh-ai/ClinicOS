"use client";

import { useState, useTransition, useEffect } from "react";
import { Loader2, Search, UserRound, MapPin, MessageSquare, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { inr } from "@/lib/utils";
import type { Patient, PatientPortfolio } from "@/lib/types";
import { useRouter } from "next/navigation";

export function PatientsClient({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<PatientPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, startSend] = useTransition();
  const router = useRouter();

  const filtered = search.trim()
    ? patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
      )
    : patients;

  const loadPortfolio = async (id: number) => {
    setSelectedId(id);
    setLoading(true);
    setPortfolio(null);
    try {
      const res = await fetch(`/api/patients/${id}/portfolio`, { cache: "no-store" });
      const data = await res.json();
      setPortfolio(data.portfolio);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = () => {
    if (!portfolio) return;
    const row = {
      patient_id: portfolio.patient.id,
      patient_name: portfolio.patient.name,
      phone: portfolio.patient.phone,
      branch_name: (portfolio.patient as any).home_branch_name ?? "",
      reason: `Manager outreach to ${portfolio.patient.name}`,
      suggested_discount_pct: 10,
      context: { cohort: "manager" },
    };
    startSend(async () => {
      await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [row] }),
      });
      router.push("/manager/whatsapp");
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Sidebar search */}
      <aside>
        <Card>
          <CardHeader><CardTitle className="text-sm">Search patients</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or phone…" className="pl-9 h-9 text-sm" />
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-0.5">
              {filtered.slice(0, 40).map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPortfolio(p.id)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors text-sm ${
                    selectedId === p.id ? "border-accent bg-accent/10 font-medium" : "border-transparent hover:bg-secondary"
                  }`}
                >
                  <div className="font-medium leading-tight">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.phone}</div>
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{patients.length} patients across all branches</div>
          </CardContent>
        </Card>
      </aside>

      {/* Portfolio */}
      <section>
        {!selectedId && !loading && (
          <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
            <UserRound className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            Search and select a patient to view their full portfolio.
          </CardContent></Card>
        )}
        {loading && (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading portfolio…
          </CardContent></Card>
        )}
        {!loading && portfolio && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
                      <UserRound className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{portfolio.patient.name}</h2>
                        <Badge variant="outline">{portfolio.patient.premium_tier?.toUpperCase()}</Badge>
                        {(portfolio.patient as any).home_branch_name && <Badge variant="accent">{(portfolio.patient as any).home_branch_name}</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                        {portfolio.patient.guest_code && <span className="font-mono font-medium text-foreground">{portfolio.patient.guest_code}</span>}
                        <span className="font-mono">KYA-{String(portfolio.patient.id).padStart(5,"0")}</span>
                        <span>{portfolio.patient.phone}</span>
                        {portfolio.patient.email && <span>{portfolio.patient.email}</span>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {portfolio.patient.gender && <span className="capitalize">{portfolio.patient.gender}</span>}
                        {portfolio.patient.marital_status && <span className="capitalize">{portfolio.patient.marital_status}</span>}
                        {(portfolio.patient.city || portfolio.patient.state) && <span>{[portfolio.patient.city, portfolio.patient.state].filter(Boolean).join(", ")}</span>}
                        {portfolio.patient.dob && <span>DOB {portfolio.patient.dob}</span>}
                      </div>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Sessions", value: portfolio.sessions.length },
                          { label: "Packages", value: portfolio.packages.length },
                          { label: "Products bought", value: portfolio.product_purchases.length },
                          { label: "Photos", value: portfolio.photos.length },
                        ].map(s => (
                          <div key={s.label}>
                            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
                            <div className="text-lg font-semibold">{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={sendWhatsApp} disabled={sending}>
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    Send WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="sessions">
              <TabsList>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              <TabsContent value="sessions">
                <Card>
                  <CardHeader><CardTitle>Sessions consumed (cross-branch)</CardTitle></CardHeader>
                  <CardContent>
                    {portfolio.sessions.length === 0 ? <div className="text-sm text-muted-foreground">No sessions logged.</div> : (
                      <Table>
                        <THead><TR><TH>Date</TH><TH>Type</TH><TH>Service</TH><TH>Branch</TH><TH>Doctor</TH></TR></THead>
                        <TBody>
                          {portfolio.sessions.map(s => {
                            const sType = (s as any).session_type ?? "treatment";
                            return (
                              <TR key={s.id}>
                                <TD className="text-sm">{s.session_date}</TD>
                                <TD><Badge variant={sType === "consultation" ? "outline" : "accent"} className="text-[10px] capitalize">{sType}</Badge></TD>
                                <TD className="font-medium text-sm">{s.service_name_snapshot}</TD>
                                <TD><Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{s.branch_name}</Badge></TD>
                                <TD className="text-sm text-muted-foreground">{s.doctor_name}</TD>
                              </TR>
                            );
                          })}
                        </TBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="packages">
                <Card>
                  <CardHeader><CardTitle>Packages &amp; Net Revenue ledger</CardTitle></CardHeader>
                  <CardContent>
                    {portfolio.packages.length === 0 ? <div className="text-sm text-muted-foreground">No packages.</div> : (
                      <Table>
                        <THead><TR><TH>Service</TH><TH>Purchased</TH><TH>Used / Total</TH><TH>Expiry</TH><TH>Collection</TH><TH>Recognized</TH><TH>Unearned</TH></TR></THead>
                        <TBody>
                          {portfolio.packages.map(pkg => {
                            const per = pkg.collection_paid_inr / pkg.sessions_total;
                            const recognized = Math.round(per * pkg.sessions_used);
                            const unearned = pkg.collection_paid_inr - recognized;
                            const pending = pkg.sessions_total - pkg.sessions_used;
                            return (
                              <TR key={pkg.id}>
                                <TD className="font-medium text-sm">{pkg.service_name}</TD>
                                <TD className="text-sm text-muted-foreground">{pkg.purchase_date}</TD>
                                <TD>
                                  <span className="text-sm">{pkg.sessions_used} / {pkg.sessions_total}</span>
                                  {pending > 0 && <Badge variant="accent" className="ml-2 text-[10px]">{pending} left</Badge>}
                                </TD>
                                <TD className={`text-sm ${pkg.expiry_date && pkg.expiry_date < new Date().toISOString().slice(0,10) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                  {pkg.expiry_date ?? "—"}
                                </TD>
                                <TD className="text-sm">{inr(pkg.collection_paid_inr)}</TD>
                                <TD className="text-sm">{inr(recognized)}</TD>
                                <TD className="text-sm font-medium text-accent">{inr(unearned)}</TD>
                              </TR>
                            );
                          })}
                        </TBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="products">
                <Card>
                  <CardHeader><CardTitle>Product purchases</CardTitle></CardHeader>
                  <CardContent>
                    {portfolio.product_purchases.length === 0 ? <div className="text-sm text-muted-foreground">No product purchases.</div> : (
                      <Table>
                        <THead><TR><TH>Date</TH><TH>Product</TH><TH>Category</TH><TH className="text-center">Qty</TH><TH className="text-right">Paid</TH></TR></THead>
                        <TBody>
                          {portfolio.product_purchases.map(pp => (
                            <TR key={pp.id}>
                              <TD className="text-sm text-muted-foreground">{pp.purchase_date}</TD>
                              <TD className="font-medium text-sm">{(pp as any).product_name ?? pp.name}</TD>
                              <TD className="text-sm">{pp.category}</TD>
                              <TD className="text-center text-sm">{pp.qty}</TD>
                              <TD className="text-right text-sm font-medium">{inr(pp.price_paid_inr * pp.qty)}</TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="summary">
                <ManagerSummaryPane patientId={portfolio.patient.id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </section>
    </div>
  );
}

// ---- Manager Summary Pane --------------------------------------------------

type VisitSummary = {
  date: string; service: string; doctor: string | null;
  sessionType: string; bullets: string[];
  prescription: string | null; tagLine: string | null;
};

function ManagerSummaryPane({ patientId }: { patientId: number }) {
  const [data, setData] = useState<{ narrative: string; visits: VisitSummary[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/summary`, { cache: "no-store" });
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleNote = async () => {
    setGenerating(true);
    try {
      await fetch(`/api/patients/${patientId}/generate-sample-note`, { method: "POST" });
      await load();
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { load(); }, [patientId]);

  if (loading) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Generating visit summaries…
      </CardContent></Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Overall narrative */}
      {data.narrative && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />Clinical narrative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">{data.narrative}</p>
          </CardContent>
        </Card>
      )}

      {/* Per-visit cards */}
      {data.visits.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No visit history found.</CardContent></Card>
      ) : (
        data.visits.map((v, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{v.date}</span>
                <Badge variant={v.sessionType === "consultation" ? "outline" : "accent"} className="text-[10px] capitalize">
                  {v.sessionType}
                </Badge>
                <span className="text-sm font-semibold text-foreground">{v.service}</span>
              </div>
              {v.doctor && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {v.doctor.startsWith("Dr") ? v.doctor : `Dr. ${v.doctor}`}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <ul className="space-y-1.5">
                {v.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <span className="text-foreground leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
              {v.tagLine && (
                <div className="rounded-md bg-rose-50 border border-rose-100 px-3 py-1.5 text-[11px] text-rose-700">
                  {v.tagLine}
                </div>
              )}
              {v.prescription && (
                <div className="rounded-md bg-purple-50 border border-purple-100 px-3 py-1.5 text-[11px] text-purple-700">
                  Rx: {v.prescription}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={generateSampleNote}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 border border-accent/30 rounded-md px-2.5 py-1.5 bg-accent/5 hover:bg-accent/10 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Generate sample post-consult note
        </button>
        <button onClick={load} className="text-xs text-muted-foreground hover:text-foreground underline">Refresh</button>
      </div>
    </div>
  );
}
