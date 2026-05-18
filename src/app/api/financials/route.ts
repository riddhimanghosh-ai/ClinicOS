import { NextResponse } from "next/server";
import { clinicFinancialSummary } from "@/lib/db";
import { llmStatus } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    financials: clinicFinancialSummary(),
    llm: llmStatus(),
  });
}
