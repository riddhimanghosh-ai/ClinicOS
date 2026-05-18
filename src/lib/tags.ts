import { db } from "./db";
import { chatJSON } from "./llm";
import type { ExtractedTags } from "./types";

const TAG_SCHEMA_EXAMPLE = {
  primary_concern: "deep_dermal_melasma",
  barrier_status: "intact | thin | compromised",
  next_recommended_service: "name from services catalog or null",
  product_adherence_score: "integer 0-10",
  active_acne_status: "active | resolving | resolved",
  scar_treatment_candidate: "0 or 1",
  treatment_ready_for: "free-form short tag e.g. Q_Switch_Laser or null",
  free_tags: { any_extra_observations: "as a flat object" },
};

const SYSTEM_PROMPT =
  "You are a clinical NLP extractor for a dermatology chain (Kaya Skin Clinic, India). " +
  "You read short post-consultation notes written by a doctor in free text and extract structured tags. " +
  "Always output a single JSON object that matches the schema below. " +
  "Use null when a field is unknown. Never invent observations.\n" +
  "Schema:\n" +
  JSON.stringify(TAG_SCHEMA_EXAMPLE, null, 2);

export async function extractTags(noteText: string): Promise<ExtractedTags> {
  const user =
    "Extract structured tags from the following post-consultation note. Output JSON only.\n\nNOTE:\n" +
    noteText.trim();
  const raw = await chatJSON(SYSTEM_PROMPT, user, 400);
  return normalize(raw);
}

function strOrNull(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function intOrNull(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function normalize(raw: any): ExtractedTags {
  let scar = raw?.scar_treatment_candidate;
  if (typeof scar === "string") {
    scar = ["1", "true", "yes", "y"].includes(scar.toLowerCase()) ? 1 : 0;
  } else if (typeof scar === "boolean") {
    scar = scar ? 1 : 0;
  } else {
    scar = intOrNull(scar) ?? 0;
  }
  scar = scar ? 1 : 0;

  let freeTags = raw?.free_tags ?? {};
  if (typeof freeTags !== "object" || Array.isArray(freeTags)) {
    freeTags = { raw: String(freeTags) };
  }

  return {
    primary_concern: strOrNull(raw?.primary_concern),
    barrier_status: strOrNull(raw?.barrier_status),
    next_recommended_service: strOrNull(raw?.next_recommended_service),
    product_adherence_score: intOrNull(raw?.product_adherence_score),
    active_acne_status: strOrNull(raw?.active_acne_status),
    scar_treatment_candidate: scar,
    treatment_ready_for: strOrNull(raw?.treatment_ready_for),
    free_tags: freeTags,
  };
}

export type SavedTags = ExtractedTags & {
  id: number;
  patient_id: number;
  session_id: number | null;
};

export function persistTags(
  patientId: number,
  sessionId: number | null,
  rawText: string,
  tags: ExtractedTags
): SavedTags {
  const d = db();
  d.prepare(
    "INSERT INTO doctor_notes_raw (session_id, patient_id, raw_text) VALUES (?, ?, ?)"
  ).run(sessionId, patientId, rawText);
  const info = d
    .prepare(
      `INSERT INTO doctor_tags (patient_id, session_id, primary_concern, barrier_status,
        next_recommended_service, product_adherence_score, active_acne_status,
        scar_treatment_candidate, treatment_ready_for, free_tags_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      patientId,
      sessionId,
      tags.primary_concern,
      tags.barrier_status,
      tags.next_recommended_service,
      tags.product_adherence_score,
      tags.active_acne_status,
      tags.scar_treatment_candidate,
      tags.treatment_ready_for,
      JSON.stringify(tags.free_tags ?? {})
    );
  return { ...tags, id: Number(info.lastInsertRowid), patient_id: patientId, session_id: sessionId };
}

export async function extractAndSave(
  patientId: number,
  sessionId: number | null,
  rawText: string
): Promise<SavedTags> {
  const tags = await extractTags(rawText);
  return persistTags(patientId, sessionId, rawText, tags);
}
