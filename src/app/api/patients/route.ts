import { NextResponse } from "next/server";
import { listAllPatients, listLiveCheckIns } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    patients: listAllPatients(),
    check_ins: listLiveCheckIns(),
  });
}
