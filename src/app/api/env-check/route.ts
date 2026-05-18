import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    GROQ_API_KEY: process.env.GROQ_API_KEY ? "✓ SET" : "✗ NOT SET",
    LLM_PROVIDER: process.env.LLM_PROVIDER || "not set",
    LLM_MODEL: process.env.LLM_MODEL || "not set",
    NODE_ENV: process.env.NODE_ENV,
  });
}
