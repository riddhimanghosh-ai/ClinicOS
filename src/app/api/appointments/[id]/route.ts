import { NextRequest, NextResponse } from "next/server";
import { updateAppointmentStatus, updateAppointmentTime } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (body.status) updateAppointmentStatus(Number(params.id), body.status);
  if (body.appointment_ts) updateAppointmentTime(Number(params.id), body.appointment_ts);
  return NextResponse.json({ ok: true });
}
