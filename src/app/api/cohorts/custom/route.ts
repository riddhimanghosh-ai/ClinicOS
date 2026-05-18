import { NextResponse } from "next/server";
import { customQuery, type CustomFilter } from "@/lib/cohorts";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const f: CustomFilter = body.filter ?? {};
  const discountPct = Number(body.discount_pct ?? 10);
  const label = String(body.label ?? "custom");
  const rows = customQuery(f, discountPct, label);
  return NextResponse.json({ rows });
}
