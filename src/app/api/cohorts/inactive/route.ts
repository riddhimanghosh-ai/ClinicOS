import { NextRequest, NextResponse } from "next/server";
import { recipeInactiveUsers } from "@/lib/cohorts";

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get("days") ?? "90");
  const rows = recipeInactiveUsers(Math.max(1, days));
  return NextResponse.json({ rows });
}
