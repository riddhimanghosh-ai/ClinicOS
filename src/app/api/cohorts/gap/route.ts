import { NextRequest, NextResponse } from "next/server";
import { recipeGapCloser } from "@/lib/cohorts";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") ?? "180");
  const months = Math.max(1, Math.round(days / 30));
  const rows = recipeGapCloser(months);
  return NextResponse.json({ rows });
}
