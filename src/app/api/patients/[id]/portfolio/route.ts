import { NextResponse } from "next/server";
import { getPatientPortfolio, packageBalance } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const portfolio = getPatientPortfolio(id);
  if (!portfolio) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    portfolio,
    balances: packageBalance(id),
  });
}
