import { NextResponse } from "next/server";
import { recentMessages, queueSummary } from "@/lib/messaging";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as "queued" | "sent" | null;
  const limit = Number(searchParams.get("limit") ?? 100);
  return NextResponse.json({
    summary: queueSummary(),
    messages: recentMessages(limit, status ?? undefined),
  });
}
