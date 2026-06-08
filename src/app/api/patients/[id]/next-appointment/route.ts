import { NextRequest, NextResponse } from "next/server";
import { getNextAppointment } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const appt = getNextAppointment(Number(params.id));
  return NextResponse.json({ appointment: appt ?? null });
}
