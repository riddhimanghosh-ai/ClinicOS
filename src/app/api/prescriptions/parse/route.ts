import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/llm";
import { lookupCatalogPrice } from "@/lib/db";
import type { RxRow } from "@/lib/types";

const SYSTEM = `You are a clinical assistant for Kaya Skin Clinic (India), a dermatology and trichology chain.
Parse a doctor's spoken prescription dictation into a structured treatment plan.
The dictation may be in Hindi, English, or a mix (Hinglish). Always output ALL fields in English only — translate any Hindi/regional language content.

Return ONLY valid JSON — no markdown, no prose, no explanation:
{
  "clinical_recommendation": string,
  "items": [{
    "problem": string | null,
    "problem_type": "chronic" | "acute" | null,
    "product": string,
    "product_detail": string | null,
    "dosage": string,
    "dosage_detail": string | null
  }]
}

Rules:
- ALL output must be in English only, regardless of the language of the dictation. Translate Hindi, Hinglish, or any other language to English.
- clinical_recommendation: a short narrative paragraph in English of the doctor's overall advice (lifestyle, monitoring, follow-up). Empty string if none stated.
- problem: the condition this row addresses in English (e.g. "Androgenic Alopecia", "Acne Vulgaris"). null if not stated.
- problem_type: "chronic" if long-standing (pattern hair loss, melasma), "acute" if recent/short-term, else null.
- product: medicine or product name in English. Translate/transliterate Hindi names (e.g. "मिनॉक्सिडेल" → "Minoxidil", "बायोटीन" → "Biotin").
- product_detail: strength / form / count in English (e.g. "5% solution · 60 ml", "5000 mcg · 30 ct"). null if not stated.
- dosage: how/when to use in English (e.g. "1 tablet once daily at bedtime").
- dosage_detail: extra timing/instruction in English. null if none.
- Common abbreviations: BD = twice daily, OD/QD = once daily, HS = at bedtime, TDS = three times daily.
- Common Kaya treatments: PRP, GFC therapy, Laser Toning, Microneedling, Hydrafacial, Minoxidil, Biotin, Retinol, Hydroquinone, SPF/Sunscreen, Anti-hair-fall serum, Ozosupplements.
- Each distinct product/medicine is a separate item. Do NOT include cost.`;

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const voiceText: string = body.voice_text ?? "";
  if (!voiceText.trim()) return NextResponse.json({ items: [], clinical_recommendation: "" });

  const result = await chatJSON(
    SYSTEM,
    `Parse this prescription dictation:\n\n"${voiceText}"`,
    900
  );

  let items: RxRow[] = [];
  if (Array.isArray(result.items) && result.items.length > 0) {
    items = result.items.map(toRow).filter((it: RxRow) => it.product);
  }

  // Fallback for mock/offline mode — line/semicolon split into product + dosage.
  if (!items.length && voiceText.trim()) {
    items = voiceText
      .split(/\n|;/)
      .map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return toRow({ product: parts[0] ?? line.trim(), dosage: parts[1] ?? "" });
      })
      .filter((it) => it.product);
  }

  // Auto-fill cost from the catalog where the product name matches.
  items = items.map((it) => ({ ...it, cost: lookupCatalogPrice(it.product) }));

  const clinical_recommendation =
    typeof result.clinical_recommendation === "string"
      ? result.clinical_recommendation.trim()
      : "";

  return NextResponse.json({ items, clinical_recommendation });
}
