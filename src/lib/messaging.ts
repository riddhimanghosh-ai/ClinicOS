import crypto from "node:crypto";
import { db } from "./db";
import { chatText } from "./llm";
import type { CohortRow, WhatsAppMessage } from "./types";

const SYSTEM_PROMPT =
  "You write short, premium-brand WhatsApp messages for Kaya Skin Clinic — a high-end " +
  "doctor-led dermatology chain in India. Constraints:\n" +
  "- Maximum 4 short sentences.\n" +
  "- Open with 'Hi <FirstName>,'\n" +
  "- Sound clinical and respectful — NEVER spammy, NEVER discount-led in the opening.\n" +
  "- Always reference the doctor's specific clinical reason (given in the prompt).\n" +
  "- Surface the offer near the end, not the start.\n" +
  "- Close with a clear, single-tap CTA: 'Reply YES to book' or 'Tap here to schedule'.\n" +
  "- Never use emojis. Never use ALL CAPS. Never make medical guarantees.\n" +
  "Output: the message body only. No preamble, no signoff line, no quotation marks.";

function discountCode(cohort: string): string {
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `KAYA-${cohort.toUpperCase()}-${suffix}`;
}

export async function generateMessage(row: CohortRow): Promise<{ body: string; code: string }> {
  const code = discountCode(row.context?.cohort ?? "custom");
  const nextSvc =
    row.context?.next_recommended_service ?? "the next recommended treatment";
  const userPrompt =
    `Patient: ${row.patient_name}\n` +
    `Branch: ${row.branch_name}\n` +
    `Cohort: ${row.context?.cohort}\n` +
    `Clinical reason: ${row.reason}\n` +
    `Next recommended service: ${nextSvc}\n` +
    `Offer: ${row.suggested_discount_pct}% off, code ${code}\n` +
    `Write the WhatsApp message body now.`;
  let body = await chatText(SYSTEM_PROMPT, userPrompt, 220, 0.6);
  if (!body || body.length < 20) {
    const first = row.patient_name.split(/\s+/)[0];
    body =
      `Hi ${first}, this is Kaya. Based on your last consultation — ${row.reason} ` +
      `— your dermatologist recommends ${nextSvc} as the next step. ` +
      `As a clinic offer, you'll receive ${row.suggested_discount_pct}% off using code ${code}. ` +
      `Reply YES to book.`;
  }
  return { body: body.trim(), code };
}

export async function queueForCohort(rows: CohortRow[]): Promise<Array<{
  id: number;
  patient_id: number;
  patient_name: string;
  phone: string;
  message_body: string;
  discount_code: string;
  cohort_name: string;
  status: "queued";
}>> {
  const queued: Array<{
    id: number;
    patient_id: number;
    patient_name: string;
    phone: string;
    message_body: string;
    discount_code: string;
    cohort_name: string;
    status: "queued";
  }> = [];
  const d = db();
  const insert = d.prepare(
    "INSERT INTO whatsapp_queue (patient_id, cohort_name, message_body, discount_code) VALUES (?, ?, ?, ?)"
  );
  for (const row of rows) {
    const { body, code } = await generateMessage(row);
    const info = insert.run(row.patient_id, row.context?.cohort ?? "custom", body, code);
    queued.push({
      id: Number(info.lastInsertRowid),
      patient_id: row.patient_id,
      patient_name: row.patient_name,
      phone: row.phone,
      message_body: body,
      discount_code: code,
      cohort_name: row.context?.cohort ?? "custom",
      status: "queued",
    });
  }
  return queued;
}

export function markSent(ids: number[]): number {
  if (!ids.length) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const info = db()
    .prepare(
      `UPDATE whatsapp_queue SET status='sent', sent_at=?
       WHERE id IN (${placeholders}) AND status='queued'`
    )
    .run(new Date().toISOString(), ...ids);
  return info.changes;
}

export function queueSummary(): { queued: number; sent: number } {
  const d = db();
  const q = d
    .prepare("SELECT COUNT(*) AS c FROM whatsapp_queue WHERE status='queued'")
    .get() as any;
  const s = d
    .prepare("SELECT COUNT(*) AS c FROM whatsapp_queue WHERE status='sent'")
    .get() as any;
  return { queued: q.c ?? 0, sent: s.c ?? 0 };
}

export type QueuedMessage = WhatsAppMessage & {
  patient_name: string;
  phone: string;
};

export function recentMessages(limit = 50, status?: "queued" | "sent"): QueuedMessage[] {
  if (status) {
    return db()
      .prepare(
        `SELECT wq.*, p.name AS patient_name, p.phone
         FROM whatsapp_queue wq JOIN patients p ON p.id = wq.patient_id
         WHERE wq.status = ? ORDER BY wq.generated_at DESC LIMIT ?`
      )
      .all(status, limit) as any[];
  }
  return db()
    .prepare(
      `SELECT wq.*, p.name AS patient_name, p.phone
       FROM whatsapp_queue wq JOIN patients p ON p.id = wq.patient_id
       ORDER BY wq.generated_at DESC LIMIT ?`
    )
    .all(limit) as any[];
}
