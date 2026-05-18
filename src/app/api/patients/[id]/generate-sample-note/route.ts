import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const SAMPLE_NOTES: Record<string, string[]> = {
  consultation: [
    "Initial comprehensive skin assessment completed. Patient presents with Grade 2 inflammatory acne across forehead and bilateral cheeks with 6 active papules and scattered comedones. Fitzpatrick Type IV. Skin barrier intact, hydration levels satisfactory. Prescribed benzoyl peroxide 2.5% PM wash, non-comedogenic moisturiser AM/PM, and SPF 50 daily. Counselled on dietary triggers and avoiding manual extraction. Follow-up in 4 weeks.",
    "Patient presented for initial consultation with chief concern of persistent hyperpigmentation and melasma. Wood's lamp examination confirms deep dermal pattern on bilateral malar region, MASI score 14. Previous OTC brightening products — partial response only. Treatment plan: glycolic peel series × 4 monthly sessions, followed by Q-Switch Laser Toning assessment at 3 months. Prescribed brightening serum AM, pigmentation corrector PM, SPF 50+ strict compliance.",
  ],
  "acne clearance program": [
    "Session 2 follow-up. Significant improvement noted — active papule count reduced from 6 to 2, no new pustules this cycle. Comedone load reduced by approximately 40%. Barrier remains intact. Patient compliant with benzoyl peroxide and SPF protocol. Added salicylic acid 2% AM wash to regimen. Discussed timeline for scar intervention — minimum 3 months of full clearance required. Continue current protocol, review in 3 weeks.",
    "Acne fully resolved. Skin surface smooth, no active lesions, barrier excellent with good hydration and elasticity. Confirmed scar treatment candidacy — rolling scars Grade 2 on bilateral cheeks and one boxcar scar left temple. RF Microneedling series of 4 sessions recommended at 4-week intervals. First session to be scheduled within 2 weeks. Discontinue benzoyl peroxide, maintain SPF 50 and peptide barrier cream. Excellent patient compliance throughout clearance phase.",
  ],
  "microneedling for scars": [
    "First microneedling session completed. Topical anaesthesia applied 30 minutes pre-procedure. Dermapen at 1.5 mm depth across scar zones — bilateral cheeks and left temple. Pinpoint bleeding observed, consistent with adequate perforation depth. Platelet-rich plasma serum applied immediately post-needling for enhanced collagen stimulation. Ice compress applied. Prescribed growth factor serum AM, occlusive barrier cream PM for 5 days. No picking, no actives for 1 week. Follow-up in 4 weeks to assess collagen remodelling initiation.",
    "Session 3 of 4 Microneedling series. Progressive improvement noted — scar depth reduced visibly on left temple boxcar. Patient reports improved skin texture overall. Depth increased to 2.0 mm this session for deeper remodelling. Proceeded with combination needle + radiofrequency for thermal dermal tightening. Serum penetration enhanced. Patient tolerating well. Two sessions remaining. Photos taken for comparison documentation. Continue SPF and peptide cream daily.",
  ],
  "q-switch laser toning": [
    "First Q-Switch Laser Toning session completed. 532 nm wavelength, 3-pass technique, fluence 2.5 J/cm² across bilateral malar melasma zones. Mild erythema post-treatment — expected. Patient tolerated procedure comfortably. Strict post-procedure protocol: physical SPF 50+ within 30 minutes, no actives for 48 hours, avoid direct sunlight. Pigmentation corrector to resume day 3. Next session in 4 weeks. Progress photos documented.",
    "Q-Switch Session 3 of 4. MASI score now 8 (baseline 14) — 43% reduction, excellent response. Bilateral malar melasma significantly lightened. Freckle component on nose bridge also fading. Fluence maintained at 2.5 J/cm². Patient reporting high satisfaction with results. SPF compliance confirmed as excellent. Maintenance protocol discussed — monthly single sessions after completing primary course. Final session to be scheduled in 4 weeks.",
  ],
  default: [
    "Doctor reviewed overall skin health and documented current condition comprehensively. Skin showing consistent improvement trajectory since treatment initiation. Treatment plan progressing on schedule with positive patient response. Adherence to home regimen confirmed as satisfactory. Next session booked; patient to continue with prescribed morning and evening skincare protocol.",
    "Session completed as planned with no adverse events. Doctor assessed treatment response and noted continued positive progression. Minor adjustments made to home regimen to optimise results. Patient counselled on sun protection and lifestyle factors. Progress photographs taken for clinical documentation. Follow-up appointment scheduled; interim concerns to be communicated via clinic contact.",
  ],
};

function getSampleNote(serviceType: string): string {
  const key = serviceType.toLowerCase();
  for (const [k, notes] of Object.entries(SAMPLE_NOTES)) {
    if (key.includes(k)) {
      return notes[Math.floor(Math.random() * notes.length)];
    }
  }
  const defaults = SAMPLE_NOTES.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const patientId = Number(params.id);
  const d = db();

  // Find latest session for this patient
  const latestSession = d.prepare(`
    SELECT s.id, s.session_date, s.service_name_snapshot, s.doctor_id
    FROM sessions_consumed s
    WHERE s.patient_id = ?
    ORDER BY s.session_date DESC, s.id DESC
    LIMIT 1
  `).get(patientId) as any;

  const serviceType = latestSession?.service_name_snapshot ?? "consultation";
  const sampleText = getSampleNote(serviceType);
  const doctorId = latestSession?.doctor_id ?? 1;
  const sessionId = latestSession?.id ?? null;

  d.prepare(
    "INSERT INTO doctor_notes_raw (session_id, doctor_id, patient_id, raw_text, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
  ).run(sessionId, doctorId, patientId, sampleText);

  return NextResponse.json({ ok: true, service: serviceType });
}
