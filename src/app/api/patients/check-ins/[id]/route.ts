import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { status } = await req.json();

  db().prepare("UPDATE check_ins SET status = ? WHERE id = ?").run(status, id);

  return NextResponse.json({ ok: true });
}
