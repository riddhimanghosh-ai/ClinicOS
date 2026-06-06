"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  branch_id: number;
  branch_name: string;
};

type BranchStat = {
  id: number;
  name: string;
  city: string;
  manager_name: string | null;
  zone_name: string | null;
  zone_manager_name: string | null;
  total_patients: number;
  sessions_used: number;
  sessions_pending: number;
  doctor_count: number;
};

export function StaffRoster({
  doctors,
  branches,
}: {
  doctors: Doctor[];
  branches: BranchStat[];
}) {
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const specialties = Array.from(new Set(doctors.map(d => d.specialty))).sort();

  const filtered = doctors.filter(d => {
    if (branchFilter !== "all" && String(d.branch_id) !== branchFilter) return false;
    if (specialtyFilter !== "all" && d.specialty !== specialtyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !d.specialty.toLowerCase().includes(q) && !d.branch_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Staff Roster
      </h2>
      <div className="flex flex-wrap gap-3">
        <select
          value={branchFilter}
          onChange={e => setBranchFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 appearance-none"
        >
          <option value="all">All branches</option>
          {branches.map(b => (
            <option key={b.id} value={String(b.id)}>{b.name}</option>
          ))}
        </select>
        <select
          value={specialtyFilter}
          onChange={e => setSpecialtyFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 appearance-none"
        >
          <option value="all">All roles</option>
          {specialties.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search doctors…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 min-w-[200px]"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No doctors match the current filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(doc => (
            <Card key={doc.id} className="border border-border/60">
              <CardContent className="pt-4 pb-4 space-y-2">
                <p className="font-medium text-sm leading-tight">{doc.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">{doc.specialty}</Badge>
                  <Badge variant="outline" className="text-xs">{doc.branch_name}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
