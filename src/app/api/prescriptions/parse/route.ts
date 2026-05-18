import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/llm";

const SYSTEM = `You are a medical assistant for Kaya Skin Clinic. Parse a doctor's prescription dictation into structured items.
Return ONLY valid JSON: { "items": [{ "name": string, "instructions": string, "duration_days": number }] }
Rules:
- name: product or medicine name exactly as mentioned
- instructions: how/when to apply (e.g. "apply once at night", "use twice daily on affected area")
- duration_days: integer days (0 if not mentioned)
- BD = twice daily, OD / QD = once daily, HS = at bedtime, TDS = three times daily
- Each distinct product/medicine is a separate item
- Keep instructions concise but complete`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const voiceText: string = body.voice_text ?? "";
  if (!voiceText.trim()) return NextResponse.json({ items: [] });

  const result = await chatJSON(SYSTEM, `Parse this prescription dictation into items:\n\n"${voiceText}"`, 800);
  let items: Array<{ name: string; instructions: string; duration_days: number }> = [];

  if (Array.isArray(result.items) && result.items.length > 0) {
    items = result.items.map((it: any) => ({
      name: String(it.name ?? "").trim(),
      instructions: String(it.instructions ?? "").trim(),
      duration_days: Number(it.duration_days) || 0,
    })).filter(it => it.name);
  }

  // Fallback for mock/offline mode — simple comma-split
  if (!items.length && voiceText.trim()) {
    items = voiceText.split(/\n|;/).map(line => {
      const parts = line.split(",").map(s => s.trim());
      return {
        name: parts[0] ?? line.trim(),
        instructions: parts[1] ?? "",
        duration_days: parseInt(parts[2] ?? "0") || 0,
      };
    }).filter(it => it.name);
  }

  return NextResponse.json({ items });
}
