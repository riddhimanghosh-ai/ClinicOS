import { NextRequest, NextResponse } from "next/server";
import { getPatientPortfolio } from "@/lib/db";
import { chatText } from "@/lib/llm";

export const dynamic = "force-dynamic";

const SYSTEM = `You are Kaya AI — the intelligent assistant for Kaya Skin Clinic.
You speak with the warmth and authority of a senior dermatologist, but in plain conversational language.
You have access to the patient's full clinical history below.
Guidelines:
- Address the patient by first name
- Be concise (2-4 sentences max unless a detailed question warrants more)
- Stay grounded in the documented clinical history — do not invent findings
- For treatment recommendations, reference what the doctor has already noted
- For pricing, direct to the clinic if unsure
- For urgent medical concerns, always say "please contact the clinic or emergency services immediately"
- Never use medical jargon without explaining it
- Respond only in English`;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const portfolio = getPatientPortfolio(id);
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { message, history = [] } = await req.json() as { message: string; history: { role: string; content: string }[] };

  const p = portfolio.patient;
  const firstName = p.name.split(/\s+/)[0];
  const t = portfolio.tags[0];
  const activePkgs = portfolio.packages.filter(pk => (pk as any).sessions_used < (pk as any).sessions_total);

  const context = [
    `Patient: ${p.name} | Gender: ${p.gender ?? "—"} | DOB: ${p.dob ?? "—"}`,
    `Primary skin concern: ${t?.primary_concern?.replace(/_/g, " ") ?? "not yet recorded"}`,
    `Skin barrier: ${t?.barrier_status ?? "—"} | Acne status: ${t?.active_acne_status ?? "—"}`,
    `Product adherence: ${t?.product_adherence_score != null ? `${t.product_adherence_score}/10` : "—"}`,
    `Treatment ready for: ${t?.treatment_ready_for?.replace(/_/g, " ") ?? "—"}`,
    `Next recommended service: ${t?.next_recommended_service ?? "—"}`,
    `Recent sessions: ${portfolio.sessions.slice(0, 6).map(s => `${s.session_date}: ${s.service_name_snapshot}`).join(" | ") || "none"}`,
    `Active packages: ${activePkgs.map((pk: any) => `${pk.service_name} (${pk.sessions_total - pk.sessions_used} sessions left)`).join(" | ") || "none"}`,
    `Latest doctor note: ${portfolio.notes[0]?.raw_text?.slice(0, 300) ?? "none on file"}`,
  ].join("\n");

  const historyText = history.length
    ? history.map(m => `${m.role === "user" ? firstName : "Kaya AI"}: ${m.content}`).join("\n") + "\n"
    : "";

  const userPrompt = `${context}\n\n${historyText}${firstName}: ${message}\nKaya AI:`;

  const reply = await chatText(SYSTEM, userPrompt, 350, 0.65);
  return NextResponse.json({ reply });
}
