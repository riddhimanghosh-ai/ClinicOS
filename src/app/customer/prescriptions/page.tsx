'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SharedNavRail from '../components/NavRail';
import MobileTabBar from '../components/MobileTabBar';
import { PrescriptionDocument } from '@/components/prescription-document';

const DEMO_PATIENT_ID = 1;

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

const AnimatedMeter = ({ pct, gold = false }: { pct: number; gold?: boolean }) => (
  <div style={{ height: 4, background: 'var(--hair-2)', borderRadius: 2, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${pct}%`, background: gold ? 'var(--gold)' : 'var(--ink)', transition: 'width 1s ease' }} />
  </div>
);

const MEDS = [
  { name: 'Tretinoin 0.025% Cream', dose: '0.025%', form: 'cream', sched: 'PM · nightly', start: 'Apr 02', adh: 94, daysLeft: 12, total: 30, qty: '15g', active: true, kind: 'rx' },
  { name: 'Azelaic Acid 15% Gel', dose: '15%', form: 'gel', sched: 'PM · spot treatment', start: 'Apr 16', adh: 88, daysLeft: 8, total: 30, qty: '20g', active: true, kind: 'rx' },
  { name: 'Kaya Niacinamide 10% Serum', dose: '10%', form: 'serum', sched: 'Morning & Night', start: 'Mar 14', adh: 96, daysLeft: 22, total: 60, qty: '30ml', active: true, kind: 'otc' },
  { name: 'Kaya Antox Vit-C Serum', dose: '15%', form: 'serum', sched: 'Every morning', start: 'Mar 14', adh: 91, daysLeft: 18, total: 60, qty: '30ml', active: true, kind: 'otc' },
  { name: 'Kaya Daily Shield SPF 50', dose: 'PA++++', form: 'sunscreen', sched: 'AM · reapply every 2h', start: 'Mar 14', adh: 100, daysLeft: 5, total: 30, qty: '50ml', active: true, kind: 'otc' },
];

const PAST_MEDS = [
  { name: 'Hydroquinone 4% Cream', dose: '4%', period: 'Jan 18 – Mar 14', adh: 87, reason: 'Completed pre-protocol phase' },
  { name: 'Doxycycline 100mg', dose: '100mg', period: 'Dec 02 – Jan 14', adh: 100, reason: 'Acute flare resolved' },
  { name: 'Adapalene 0.1% Gel', dose: '0.1%', period: 'Sep – Nov 2024', adh: 78, reason: 'Switched to Tretinoin' },
];

/* ── Prescription documents from DB ── */
function CustomerRxSection() {
  const [data, setData] = useState<{ patient: any; prescriptions: any[] } | null>(null);
  useEffect(() => {
    fetch(`/api/patients/${DEMO_PATIENT_ID}/prescriptions`).then(r => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data?.patient) return <div style={{ color: 'var(--mute)', fontSize: 13, padding: '32px 0' }}>Loading prescriptions…</div>;
  const list = data.prescriptions?.length ? data.prescriptions : [null];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {list.map((rx: any, i: number) => (
        <PrescriptionDocument
          key={rx?.id ?? i}
          patient={data.patient}
          items={rx?.items ?? []}
          clinicalRecommendation={rx?.clinical_recommendation ?? null}
          dispensingFeeInr={rx?.dispensing_fee_inr ?? null}
          createdAt={rx?.created_at ?? null}
        />
      ))}
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
          title={tab === 'prescriptions' ? 'Your prescriptions' : 'Active regimen'}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {MEDS.map((m, i) => {
                  const isLow = m.daysLeft < 15;
                  const pct = (m.daysLeft / m.total) * 100;
                  return (
                    <div key={i} style={{ border: '1px solid ' + (isLow ? 'rgba(192,57,43,0.3)' : 'var(--hair)'), background: isLow ? '#FEF9F9' : 'var(--paper)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{m.name}</div>
                        {isLow && <span style={{ background: '#FEE2E2', color: 'var(--warn)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '0.08em', padding: '3px 8px', flexShrink: 0, marginLeft: 8 }}>LOW</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--mute)', marginBottom: 14 }}>{m.form} · {m.qty} · started {m.start}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--paper-2)', marginBottom: 14 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{m.sched}</span>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Adherence</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: adhColor(m.adh), fontFamily: 'var(--mono)' }}>{m.adh}%</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--hair-2)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${m.adh}%`, background: adhColor(m.adh), borderRadius: 2, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Supply</span>
                          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: isLow ? 'var(--warn)' : 'var(--ink)', fontWeight: 600 }}>{m.daysLeft} <span style={{ fontWeight: 400, color: 'var(--mute)' }}>/ {m.total} days</span></span>
                        </div>
                        <div style={{ height: 5, background: 'var(--hair-2)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isLow ? 'var(--warn)' : 'var(--ok)', borderRadius: 2, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button className="btn ghost sm" style={{ flex: 1 }}>Log dose</button>
                        {isLow && <button className="btn sm" style={{ flex: 1 }}>Refill now</button>}
                      </div>
                    </div>
                  );
                })}
              </div>

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
            <CustomerRxSection />
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
        <div className="display" style={{ fontSize: 28 }}>
          {tab === 'medications' ? <>Your <span style={{ color: 'var(--brand)' }}>medications</span></> : <>Your <span style={{ color: 'var(--brand)' }}>prescriptions</span></>}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>
          {tab === 'medications' ? '5 active · 94% adherence (14d)' : 'From your doctor'}
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
            <div className="col" style={{ marginTop: 12, gap: 10 }}>
              {MEDS.slice(0, 4).map((m, i) => (
                <div key={i} className="panel" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconMed size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row between center">
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                      <div className="num" style={{ fontSize: 11, color: m.adh >= 90 ? 'var(--mint)' : 'var(--brand)' }}>{m.adh}%</div>
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>{m.dose} · {m.sched}</div>
                    <div style={{ marginTop: 6 }}><AnimatedMeter pct={m.adh} gold={m.adh >= 90} /></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <CustomerRxSection />
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
      <div className="desktop-only"><PrescriptionsDesktop defaultTab={defaultTab} /></div>
      <div className="mobile-only"><PrescriptionsMobile defaultTab={defaultTab} /></div>
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
