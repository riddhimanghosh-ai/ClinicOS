import { NextResponse } from "next/server";
import { extractAndSave } from "@/lib/tags";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { patient_id, session_id, note } = await req.json();
  if (!patient_id || typeof note !== "string") {
    return NextResponse.json({ error: "patient_id and note are required" }, { status: 400 });
  }
  const saved = await extractAndSave(Number(patient_id), session_id ?? null, note);
  return NextResponse.json({ saved });
}
