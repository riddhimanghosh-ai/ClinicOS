import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/llm";
import { lookupCatalogPrice } from "@/lib/db";
import type { RxRow } from "@/lib/types";

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM = `You are a clinical assistant for Kaya Skin Clinic (India), a dermatology chain.
Extract a structured prescription from a doctor's dictation. Output ONLY valid JSON — no markdown, no prose.

CRITICAL RULES — read every one before responding:
1. EVERY distinct medicine or product = ONE separate item in the array. NEVER combine two medicines.
2. If the doctor mentions 3 medicines, return exactly 3 items. If 5, return 5.
3. Translate ALL Hindi/Hinglish to English. Never return Hindi characters in any field.
4. Output ALL text in English only.

JSON schema:
{
  "clinical_recommendation": "<one paragraph of overall advice in English, empty string if none>",
  "items": [
    {
      "problem": "<condition in English, null if not stated>",
      "problem_type": "chronic" | "acute" | null,
      "product": "<full medicine/product name in English>",
      "product_detail": "<strength/form/pack size in English, null if not stated>",
      "dosage": "<instruction in English e.g. Apply 1 ml to scalp twice daily>",
      "dosage_detail": "<extra timing note in English, null if none>"
    }
  ]
}

Hindi → English translations:
- दो बार / BD / BID = twice daily
- एक बार / OD / QD = once daily
- सुबह = morning, रात = night/bedtime, खाने के बाद = after meals
- बाल झड़ना = hair loss, मुंहासे = acne, पिगमेंटेशन = pigmentation
- मिनॉक्सिडेल = Minoxidil, बायोटीन = Biotin, सनस्क्रीन = Sunscreen

EXAMPLE — doctor says: "Biotin 5000 mcg, ek tablet daily at bedtime. Minoxidil 5% solution, 1 ml scalp pe lagao dono time. SPF 50 sunscreen every morning."

CORRECT output (3 separate items):
{
  "clinical_recommendation": "Patient prescribed Biotin, Minoxidil and SPF protection. Follow up in 6 weeks.",
  "items": [
    { "problem": "Hair loss", "problem_type": "chronic", "product": "Biotin 5000 mcg", "product_detail": "30 tablets", "dosage": "1 tablet daily at bedtime", "dosage_detail": "Take with food" },
    { "problem": "Hair loss", "problem_type": "chronic", "product": "Minoxidil 5% Solution", "product_detail": "60 ml", "dosage": "Apply 1 ml to scalp twice daily", "dosage_detail": "Leave on, do not rinse" },
    { "problem": "Sun protection", "problem_type": null, "product": "SPF 50 Sunscreen", "product_detail": "50 ml", "dosage": "Apply generously every morning", "dosage_detail": "Reapply every 2 hours outdoors" }
  ]
}

WRONG output (never do this):
{
  "items": [{ "product": "Biotin 5000 mcg, Minoxidil 5%, SPF 50 Sunscreen", ... }]
}`;

function toRow(it: any): RxRow {
  return {
    problem: it.problem ? String(it.problem).trim() : null,
    problem_type:
      it.problem_type === "chronic" || it.problem_type === "acute" ? it.problem_type : null,
    product: String(it.product ?? it.name ?? "").trim(),
    product_detail: it.product_detail ? String(it.product_detail).trim() : null,
    dosage: String(it.dosage ?? it.instructions ?? "").trim(),
    dosage_detail: it.dosage_detail ? String(it.dosage_detail).trim() : null,
    cost: null,
  };
}

async function callAnthropic(voiceText: string): Promise<Record<string, any> | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        temperature: 0,
        system: SYSTEM,
        messages: [{ role: "user", content: `Parse this prescription dictation into separate items for each medicine:\n\n"${voiceText}"` }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "{}";
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const voiceText: string = body.voice_text ?? "";
  if (!voiceText.trim()) return NextResponse.json({ items: [], clinical_recommendation: "" });

  // 1. Try Anthropic directly if key is available (most accurate)
  let result: Record<string, any> | null = await callAnthropic(voiceText);

  // 2. Fall back to configured LLM (Groq/LLaMA via existing env vars) — always works
  if (!result || !Array.isArray(result.items) || result.items.length === 0) {
    result = await chatJSON(
      SYSTEM,
      `Parse this prescription dictation into separate items for each medicine:\n\n"${voiceText}"`,
      1500
    );
  }

  let items: RxRow[] = [];
  if (Array.isArray(result?.items) && result.items.length > 0) {
    items = result.items.map(toRow).filter((it: RxRow) => it.product);
  }

  // 3. Last-resort fallback for mock/offline mode — split by line/semicolon
  if (!items.length && voiceText.trim()) {
    items = voiceText
      .split(/\n|;/)
      .map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return toRow({ product: parts[0] ?? line.trim(), dosage: parts[1] ?? "" });
      })
      .filter((it) => it.product);
  }

  items = items.map((it) => ({ ...it, cost: lookupCatalogPrice(it.product) }));

  const clinical_recommendation =
    typeof result?.clinical_recommendation === "string"
      ? result.clinical_recommendation.trim()
      : "";

  return NextResponse.json({ items, clinical_recommendation });
}
