import { NextRequest, NextResponse } from "next/server";
import { convertAppointmentToCheckIn } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const result = convertAppointmentToCheckIn(Number(params.id));
  if (!result) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
