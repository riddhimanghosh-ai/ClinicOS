import { NextRequest, NextResponse } from "next/server";
import { listSavedCohorts, saveCohort, deleteSavedCohort } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ cohorts: listSavedCohorts() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { label, description, filter, discount_pct, patient_count } = body;
  if (!label || !filter) return NextResponse.json({ error: "label and filter required" }, { status: 400 });
  const cohort = saveCohort(label, description ?? "", JSON.stringify(filter), discount_pct ?? 0, patient_count ?? 0);
  return NextResponse.json({ cohort });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteSavedCohort(id);
  return NextResponse.json({ ok: true });
}
