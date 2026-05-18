import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ products: [], services: [] });
  return NextResponse.json(searchCatalog(q));
}
