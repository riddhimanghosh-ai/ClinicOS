'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SharedNavRail from '../components/NavRail';
import MobileTabBar from '../components/MobileTabBar';
import { PrescriptionDocument } from '@/components/prescription-document';

/* ── Shared Icons ── */
const Icon = ({ children, size = 24, style }: { children: React.ReactNode; size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);
const IconMed = ({ size = 24 }: { size?: number }) => <Icon size={size}><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" /><path d="M8.5 7.5 L15.5 16.5" /></Icon>;
const IconRx = ({ size = 24 }: { size?: number }) => <Icon size={size}><path d="M9 2 H15 L17 4 V7 H7 V4 Z" /><rect x="5" y="7" width="14" height="15" rx="1" /><path d="M9 11 H15 M9 14 H13" /></Icon>;
const IconBell = ({ size = 24, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Icon>;
const IconSearch = ({ size = 24, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>;
const IconDoc = ({ size = 24 }: { size?: number }) => <Icon size={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></Icon>;
const IconChevron = ({ size = 24, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M6 9 L12 15 L18 9" /></Icon>;


const NavRail = ({ active }: { active: string }) => <SharedNavRail active={active} />;

const Topbar = ({ subtitle = '', title = '', right }: { subtitle?: string; title?: string; right?: React.ReactNode }) => (
  <div style={{ padding: 'var(--pad-3) var(--pad-4)', borderBottom: '1px solid var(--hair)', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: 12, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4, color: 'var(--ink)' }}>{title}</div>
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {right}
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}><IconSearch size={20} style={{ color: 'var(--mute-2)' }} /></button>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}><IconBell size={20} style={{ color: 'var(--mute-2)' }} /></button>
    </div>
  </div>
);

const MobileShell = ({ active = '', children }: { children: React.ReactNode; active?: string }) => (
  <div className="frame" style={{ display: 'flex', flexDirection: 'column' }}>
    <div className="statusbar"><span>9:41</span><span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ display: 'inline-block', width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} /><span style={{ display: 'inline-block', width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} /><span style={{ display: 'inline-block', width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} /><svg width="16" height="11" viewBox="0 0 16 11" fill="none"><rect x="0.5" y="0.5" width="13" height="10" rx="2" stroke="currentColor" /><rect x="2" y="2" width="9" height="7" fill="currentColor" /><rect x="14" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" /></svg></span></div>
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
    <MobileTabBar active={active} />
  </div>
);


const MEDS = [
  { name: 'Tretinoin 0.025% Cream',     dose: '0.025%', form: 'cream',     sched: 'PM · nightly',          start: 'Apr 02', streak: 14, isLow: true,  earlyEmpty: false, qty: '15g',  daysSupply: 30, active: true, kind: 'rx',  nextDose: '21:00', logsToday: false },
  { name: 'Azelaic Acid 15% Gel',       dose: '15%',    form: 'gel',       sched: 'PM · spot treatment',   start: 'Apr 16', streak: 8,  isLow: true,  earlyEmpty: true,  qty: '20g',  daysSupply: 30, active: true, kind: 'rx',  nextDose: '21:00', logsToday: true  },
  { name: 'Kaya Niacinamide 10% Serum', dose: '10%',    form: 'serum',     sched: 'Morning & Night',       start: 'Mar 14', streak: 22, isLow: false, earlyEmpty: false, qty: '30ml', daysSupply: 45, active: true, kind: 'otc', nextDose: '08:00', logsToday: true  },
  { name: 'Kaya Antox Vit-C Serum',     dose: '15%',    form: 'serum',     sched: 'Every morning',         start: 'Mar 14', streak: 18, isLow: false, earlyEmpty: false, qty: '30ml', daysSupply: 45, active: true, kind: 'otc', nextDose: '08:00', logsToday: false },
  { name: 'Kaya Daily Shield SPF 50',   dose: 'PA++++', form: 'sunscreen', sched: 'AM · reapply every 2h', start: 'Mar 14', streak: 30, isLow: true,  earlyEmpty: false, qty: '50ml', daysSupply: 30, active: true, kind: 'otc', nextDose: '08:00', logsToday: true  },
];

const PAST_MEDS = [
  { name: 'Hydroquinone 4% Cream', dose: '4%', period: 'Jan 18 – Mar 14', adh: 87, reason: 'Completed pre-protocol phase' },
  { name: 'Doxycycline 100mg', dose: '100mg', period: 'Dec 02 – Jan 14', adh: 100, reason: 'Acute flare resolved' },
  { name: 'Adapalene 0.1% Gel', dose: '0.1%', period: 'Sep – Nov 2024', adh: 78, reason: 'Switched to Tretinoin' },
];

/* ── Prescription data (RxRow shape) ── */
const PRESCRIPTIONS_DATA = [
  {
    id: 1,
    date: '2025-05-13',
    label: 'Phase 3 regimen',
    doctor: 'Dr. Ananya Sharma',
    specialty: 'Dermatology',
    clinicalRecommendation: 'Continuing with maintenance regimen post Phase 2 peels. Emphasis on daily sun protection and nightly retinoid to sustain PIH improvement. Add niacinamide as a barrier-support step.',
    items: [
      { problem: 'Post-inflammatory hyperpigmentation', problem_type: 'chronic' as const, product: 'Tretinoin 0.025% Cream',        product_detail: '15g tube',  dosage: 'Apply pea-sized amount',  dosage_detail: 'PM · nightly · avoid eye area',     cost: 580 },
      { problem: 'Active acne (hormonal)',              problem_type: 'acute' as const,   product: 'Azelaic Acid 15% Gel',          product_detail: '20g tube',  dosage: 'Spot treatment',          dosage_detail: 'PM · on active lesions only',        cost: 490 },
      { problem: 'Brightening + antioxidant',           problem_type: null,               product: 'Kaya Antox Vit-C Serum',        product_detail: '30ml',      dosage: '3–4 drops',               dosage_detail: 'AM · before moisturiser',            cost: 420 },
      { problem: 'Sun protection (mandatory)',           problem_type: null,               product: 'Kaya Daily Shield SPF 50 PA++++', product_detail: '50ml',    dosage: 'Generous application',    dosage_detail: 'AM · reapply every 2h outdoors',    cost: 650 },
    ],
  },
  {
    id: 2,
    date: '2025-03-14',
    label: 'Initial prescription',
    doctor: 'Dr. Ananya Sharma',
    specialty: 'Dermatology',
    clinicalRecommendation: 'Starting regimen for mild PIH and hormonal acne. Keep routine minimal — focus on actives that target pigment and barrier. Introduce retinoid slowly (every other night for 2 weeks).',
    items: [
      { problem: 'Post-inflammatory hyperpigmentation', problem_type: 'chronic' as const, product: 'Kaya Niacinamide 10% Serum',   product_detail: '30ml',      dosage: '2–3 drops',               dosage_detail: 'AM + PM · mix with moisturiser',    cost: null },
      { problem: 'Active acne',                         problem_type: 'acute' as const,   product: 'Kaya Clarifying Face Wash',    product_detail: '100ml',     dosage: 'Twice daily',             dosage_detail: 'AM + PM · gentle lather, rinse cool', cost: null },
      { problem: 'Sun protection (mandatory)',           problem_type: null,               product: 'Kaya Daily Shield SPF 50 PA++++', product_detail: '50ml',   dosage: 'Generous application',    dosage_detail: 'AM · every morning without fail',   cost: 650 },
    ],
  },
];

const PATIENT_STUB = { name: 'Priya R.', dob: '1993-04-12', guest_code: 'GDRC10001', gender: 'F' };

/* ── Prescription accordion list ── */
function RxTimeline() {
  const [expanded, setExpanded] = useState<number | null>(PRESCRIPTIONS_DATA[0]?.id ?? null);
  return (
    <div style={{ border: '1px solid var(--hair)', overflow: 'hidden' }}>
      {PRESCRIPTIONS_DATA.map((rx, i) => {
        const open = expanded === rx.id;
        const total = rx.items.reduce((s, it) => s + (it.cost ?? 0), 0);
        return (
          <div key={rx.id} style={{ borderBottom: i < PRESCRIPTIONS_DATA.length - 1 ? '1px solid var(--hair)' : 'none' }}>
            {/* Row header */}
            <div
              onClick={() => setExpanded(open ? null : rx.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                cursor: 'pointer', background: open ? 'var(--paper-2)' : 'var(--paper)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{rx.label}</span>
                  {i === 0 && (
                    <span style={{ background: 'var(--brand)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px' }}>LATEST</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 3 }}>
                  {rx.date} · {rx.doctor} · {rx.items.length} items
                  {total > 0 && ` · ₹${total.toLocaleString('en-IN')}`}
                </div>
              </div>
              <IconChevron size={14} style={{ flexShrink: 0, color: 'var(--mute)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {/* Expanded body: full prescription document */}
            {open && (
              <div style={{ borderTop: '1px solid var(--hair)', background: 'var(--paper)' }}>
                <PrescriptionDocument
                  patient={PATIENT_STUB}
                  doctorName={rx.doctor}
                  doctorSpecialty={rx.specialty}
                  clinicalRecommendation={rx.clinicalRecommendation}
                  items={rx.items}
                  createdAt={rx.date}
                  dispensingFeeInr={60}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Medication card ── */
function MedCard({ m, onRemove }: { m: typeof MEDS[0]; onRemove: () => void }) {
  const [logged, setLogged] = useState(m.logsToday);
  const isRx = m.kind === 'rx';
  const accentColor = isRx ? 'var(--brand)' : 'var(--gold)';
  const adherencePct = Math.round((m.streak / m.daysSupply) * 100);
  const daysLeft = Math.max(0, m.daysSupply - m.streak);

  return (
    <div style={{
      border: '1px solid var(--hair)',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 2,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Left accent stripe */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accentColor }} />

      {/* Card body */}
      <div style={{ padding: '16px 18px 16px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{m.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '0.08em',
                padding: '2px 7px', border: `1px solid ${accentColor}`,
                color: accentColor, borderRadius: 2,
              }}>{isRx ? 'Rx' : 'OTC'}</span>
              {m.isLow && (
                <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 2 }}>LOW</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--mute)' }}>
              <span style={{ fontFamily: 'var(--mono)', marginRight: 6 }}>{m.dose}</span>
              {m.form} · {m.qty} · since {m.start}
            </div>
          </div>
          {/* Streak bubble */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: m.streak >= 20 ? 'var(--gold)' : m.streak >= 10 ? '#FEF3C7' : 'var(--hair-2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--mono)', lineHeight: 1, color: m.streak >= 20 ? '#fff' : m.streak >= 10 ? '#92400E' : 'var(--mute)' }}>{m.streak}</div>
            <div style={{ fontSize: 8, fontFamily: 'var(--mono)', color: m.streak >= 20 ? 'rgba(255,255,255,0.8)' : 'var(--mute)', letterSpacing: '0.05em' }}>days</div>
          </div>
        </div>

        {/* Schedule pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper-2)', padding: '7px 11px', borderRadius: 2 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{m.sched}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--mute)' }}>{m.nextDose}</span>
        </div>

        {/* 7-bar streak visualization */}
        <div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {Array.from({ length: 7 }).map((_, di) => {
              const filled = di < Math.min(m.streak, 7);
              const isToday = di === Math.min(m.streak - 1, 6);
              return (
                <div key={di} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', height: 24, background: filled ? accentColor : 'var(--hair-2)', borderRadius: 3, opacity: filled ? 1 : 0.4, position: 'relative', transition: 'background 0.2s' }}>
                    {isToday && <div style={{ position: 'absolute', top: 2, bottom: 2, left: 2, right: 2, borderRadius: 2, border: '1.5px solid rgba(255,255,255,0.5)' }} />}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--mute)', fontFamily: 'var(--mono)' }}>
                    {['M','T','W','T','F','S','S'][di]}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--mute)' }}>{adherencePct}% adherence this supply</span>
            <span style={{ fontSize: 10, color: daysLeft <= 5 ? 'var(--warn)' : 'var(--mute)', fontFamily: 'var(--mono)', fontWeight: daysLeft <= 5 ? 600 : 400 }}>{daysLeft}d remaining</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => setLogged(v => !v)}
            className="btn ghost sm"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: logged ? '#F0FDF4' : undefined, color: logged ? '#166534' : undefined, border: logged ? '1px solid #BBF7D0' : undefined }}
          >
            {logged ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Logged</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Log dose</>
            )}
          </button>
          {m.isLow && (
            <button className="btn sm" style={{ flex: 1, background: '#F59E0B', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>
              Refill now
            </button>
          )}
          <button
            onClick={onRemove}
            className="btn ghost sm"
            style={{ padding: '6px 12px', fontSize: 11, color: 'var(--mute)', border: '1px solid var(--hair)' }}
          >
            Empty
          </button>
        </div>
      </div>

    </div>
  );
}

/* ── Medications card grid ── */
function MedAccordion({ cols = 2 }: { cols?: number }) {
  const [removed, setRemoved] = useState<number[]>([]);
  const visible = MEDS.filter((_, i) => !removed.includes(i));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
      {visible.map((m, vi) => {
        const origIdx = MEDS.indexOf(m);
        return <MedCard key={origIdx} m={m} onRemove={() => setRemoved(r => [...r, origIdx])} />;
      })}
    </div>
  );
}

/* ── Tab bar ── */
function TabBar({ active, onSwitch }: { active: 'medications' | 'prescriptions'; onSwitch: (t: 'medications' | 'prescriptions') => void }) {
  const tab = (id: 'medications' | 'prescriptions', label: string, Icon: any) => (
    <button
      onClick={() => onSwitch(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        border: 'none', borderBottom: active === id ? '2px solid var(--ink)' : '2px solid transparent',
        background: 'none', color: active === id ? 'var(--ink)' : 'var(--mute)',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--hair)', marginBottom: 28 }}>
      {tab('medications', 'Medications', IconMed)}
      {tab('prescriptions', 'Prescriptions', IconRx)}
    </div>
  );
}

/* ── Desktop view ── */
function PrescriptionsDesktop({ defaultTab }: { defaultTab: 'medications' | 'prescriptions' }) {
  const [tab, setTab] = useState<'medications' | 'prescriptions'>(defaultTab);
  const router = useRouter();
  const adhColor = (pct: number) => pct >= 90 ? 'var(--ok)' : pct >= 75 ? '#CA8A04' : 'var(--warn)';

  const handleTab = (t: 'medications' | 'prescriptions') => {
    setTab(t);
    router.replace(`/customer/prescriptions?tab=${t}`, { scroll: false });
  };

  return (
    <div className="frame" style={{ display: 'flex' }}>
      <NavRail active={tab === 'prescriptions' ? 'prescriptions' : 'medications'} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          subtitle={tab === 'prescriptions' ? 'Prescriptions' : 'Medications'}
          title="Medications and prescriptions"
          right={tab === 'prescriptions' ? <button className="btn ghost sm"><IconDoc size={14} /> Download</button> : undefined}
        />

        {/* Stat band — only for medications */}
        {tab === 'medications' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--hair)' }}>
            {[
              { label: 'Active meds', value: '5', sub: '5 products in regimen', color: 'var(--ink)' },
              { label: '14-day adherence', value: '94%', sub: 'Last reading: today 14:00', color: 'var(--ok)' },
              { label: 'Refills needed', value: '3', sub: 'Tretinoin · Azelaic · SPF', color: 'var(--warn)' },
              { label: 'Next dose', value: '21:00', sub: 'Azelaic acid · PM application', color: 'var(--ink)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid var(--hair)' : 'none' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, padding: '28px 32px 48px', overflow: 'auto' }}>
          <TabBar active={tab} onSwitch={handleTab} />

          {tab === 'medications' ? (
            <>
              {/* Active regimen */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Active regimen</div>
                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>5 medications · prescribed by Dr. Ananya Sharma</div>
                </div>
              </div>
              <MedAccordion />

              {/* Past medications */}
              <div style={{ marginTop: 36 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Past medications</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 16 }}>Completed or discontinued</div>
                <div style={{ border: '1px solid var(--hair)' }}>
                  {PAST_MEDS.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < PAST_MEDS.length - 1 ? '1px solid var(--hair)' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name} <span style={{ color: 'var(--mute)', fontWeight: 400 }}>· {p.dose}</span></div>
                        <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{p.period}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: adhColor(p.adh) }}>{p.adh}%</div>
                        <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2, fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>{p.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Prescriptions tab */
            <RxTimeline />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mobile view ── */
function PrescriptionsMobile({ defaultTab }: { defaultTab: 'medications' | 'prescriptions' }) {
  const [tab, setTab] = useState<'medications' | 'prescriptions'>(defaultTab);
  const adhColor = (pct: number) => pct >= 90 ? 'var(--ok)' : pct >= 75 ? '#CA8A04' : 'var(--warn)';

  return (
    <MobileShell active="home">
      <div style={{ padding: '14px 16px 100px', height: '100%', overflow: 'auto' }}>
        <div className="display" style={{ fontSize: 26 }}>
          Medications <span style={{ color: 'var(--brand)' }}>&amp;</span> prescriptions
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>
          {tab === 'medications' ? '5 active · 5 products in regimen' : 'From your doctor'}
        </div>

        <TabBar active={tab} onSwitch={setTab} />

        {tab === 'medications' ? (
          <>
            <div className="panel" style={{ marginTop: 4, padding: 18, background: 'var(--brand-tint-2)', borderColor: 'transparent' }}>
              <div className="row between center">
                <div><div className="eyebrow brand">Today · regimen</div><div className="h4" style={{ marginTop: 6, fontSize: 18 }}>4 of 6 taken</div></div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `conic-gradient(var(--brand) 0% 66%, var(--paper-2) 66% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-tint-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>66%</div>
                </div>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Next dose · Azelaic acid · 21:00</div>
            </div>
            <div className="eyebrow" style={{ marginTop: 22 }}>Active medications</div>
            <div style={{ marginTop: 12 }}>
              <MedAccordion cols={1} />
            </div>
          </>
        ) : (
          <RxTimeline />
        )}
      </div>
    </MobileShell>
  );
}

/* ── Inner component that reads search params ── */
function PrescriptionsInner() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const defaultTab: 'medications' | 'prescriptions' = rawTab === 'prescriptions' ? 'prescriptions' : 'medications';

  return (
    <>
      <div className="desktop-only"><PrescriptionsDesktop key={defaultTab} defaultTab={defaultTab} /></div>
      <div className="mobile-only"><PrescriptionsMobile key={defaultTab} defaultTab={defaultTab} /></div>
    </>
  );
}

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={null}>
      <PrescriptionsInner />
    </Suspense>
  );
}
