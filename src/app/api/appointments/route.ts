import { NextRequest, NextResponse } from "next/server";
import { getAppointments } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const branchId = req.nextUrl.searchParams.get("branch_id");
  const rows = getAppointments(date, branchId ? Number(branchId) : undefined);
  return NextResponse.json({ rows });
}
