import { NextResponse } from "next/server";
import { markSent } from "@/lib/messaging";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const ids = (body.ids ?? []).map(Number).filter(Number.isFinite);
  const changed = markSent(ids);
  return NextResponse.json({ changed });
}
