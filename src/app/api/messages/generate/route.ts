import { NextResponse } from "next/server";
import { queueForCohort } from "@/lib/messaging";
import type { CohortRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const rows: CohortRow[] = body.rows ?? [];
  if (!rows.length) {
    return NextResponse.json({ queued: [] });
  }
  const queued = await queueForCohort(rows);
  return NextResponse.json({ queued });
}
