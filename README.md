# KayaOS v3 — Working Prototype (Next.js)

Premium clinic operating system for Kaya Skin Clinic. Three role surfaces
(Clinic Manager, Doctor, Patient Copilot) over a unified SQLite store, with
LLM-driven doctor-note tag extraction and cohort-aware WhatsApp copy generation.

## Stack

- **Next.js 14** (App Router, Server Components) + **TypeScript**
- **Tailwind CSS** with shadcn-style UI primitives (no Radix dependency)
- **better-sqlite3** — single-file relational store at `data/kaya.db`
- **OpenAI SDK** pointed at OpenRouter or Groq, with deterministic mock fallback
- **lucide-react** icons

## Run locally

```bash
cd /Users/riddhiman/Documents/Kaya
npm install
npm run seed          # generates data/kaya.db + 90+ SVG skin-photo placeholders
npm run dev           # http://localhost:3000
```

Open <http://localhost:3000> for the landing page; the three role surfaces are at
`/manager`, `/doctor`, `/patient`.

### LLM configuration (optional)

The prototype boots offline with a deterministic mock. To wire live inference:

```bash
cp .env.example .env.local
# Edit .env.local — uncomment one provider block and add your key.
```

### Reset data

```bash
npm run reset
```

## Modules implemented

### Module 1 — Cohort Engine + WhatsApp Automation (`/manager`)

- **Recipe Alpha** — Acne → Scar transition: completed Acne/Peel package in last 45
  days AND doctor tags `active_acne_status: resolved`, `scar_treatment_candidate: 1`,
  `barrier_status: intact|stable`. Suggested 20% off.
- **Recipe Beta** — Pigmentation layering: bought a Pigmentation-category product AND
  tags `primary_concern: deep_dermal_melasma`, `treatment_ready_for: Q_Switch_Laser`.
  Suggested 15% off.
- **Recipe Gap-Closer** — Periodic drop-off: multi-session package with sessions
  remaining AND days-since-last-session ≥ 1.3 × expected cadence (21 or 30 days).
  Discount scales with locked unearned balance.
- **Custom builder** — mix DB fields with extracted tags via the manager UI.
- **WhatsApp message generation** — per-patient, cohort-specific copy that opens
  with the doctor's clinical reason (not the discount), generates a discount code,
  queues to the DB, supports simulated send.
- **Instant catalog lookup** — full-text search over products + services so the
  manager never leaves the screen mid-call.

### Module 2 — Doctor Portfolio + Post-Consult Capture (`/doctor`)

- Unified cross-branch patient portfolio that opens at check-in.
- Chronological visual skin timeline (before/after auto-pair).
- Async post-consultation chat that compresses doctor notes into the structured
  `doctor_tags` schema (`primary_concern`, `barrier_status`,
  `next_recommended_service`, `product_adherence_score`, `active_acne_status`,
  `scar_treatment_candidate`, `treatment_ready_for`, `free_tags`).
- **Token discipline:** the running chat is not persisted; only the compressed
  JSON tags flow downstream into the cohort engine.
- Prescription history + new-prescription form.

### Module 3 — Patient AI Copilot (`/patient`)

- Package balance with Net Revenue ledger transparency.
- Visual healing journey (before/after + full grid).
- Chat router for sessions-remaining, price queries, and next-step questions.

## Production dispatch

WhatsApp send is **simulated** in the prototype via the `whatsapp_queue` table.
For production, swap the `mark_sent` path for a Make.com webhook or direct
WhatsApp Business API call — the queue table already carries everything the
downstream system needs (`patient_id`, `message_body`, `discount_code`, status).

## File map

```
src/
  app/
    page.tsx                    # Landing
    manager/page.tsx            # Clinic Manager
    doctor/page.tsx             # Doctor Console
    patient/page.tsx            # Patient Copilot
    api/
      cohorts/[recipe]/route.ts
      cohorts/custom/route.ts
      messages/generate/route.ts
      messages/queue/route.ts
      messages/send/route.ts
      tags/extract/route.ts
      catalog/search/route.ts
      financials/route.ts
      patients/route.ts
      patients/[id]/portfolio/route.ts
  components/
    ui/                         # button, card, tabs, table, input, select, badge, progress, textarea
    sidebar.tsx
    metric-card.tsx
  lib/
    db.ts                       # SQLite layer
    cohorts.ts                  # Recipe Alpha/Beta/Gap + custom DSL
    tags.ts                     # Note → structured tags
    messaging.ts                # WhatsApp gen + queue
    llm.ts                      # OpenRouter/Groq + mock
    utils.ts                    # cn helper
    types.ts
scripts/
  seed.ts                       # Synthetic Indian patient dataset
public/
  photos/                       # Generated SVG skin-photo placeholders
data/
  kaya.db                       # SQLite store
```
