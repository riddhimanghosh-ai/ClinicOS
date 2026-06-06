'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedNavRail from '../components/NavRail';
import MobileTabBar from '../components/MobileTabBar';

const Icon = ({ size = 18, children, stroke = 1.4, style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}>
    {children}
  </svg>
);

const G = ({ cx, cy, r = 1.6 }: any) => <circle cx={cx} cy={cy} r={r} fill="var(--gold)" stroke="none" />;
const IconSearch   = (p: any) => <Icon {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15 L20 20" /></Icon>;
const IconBell     = (p: any) => <Icon {...p}><path d="M6 16 V11 C6 7.5 8.5 5 12 5 C15.5 5 18 7.5 18 11 V16 L19.5 18 H4.5 Z" /><path d="M10 20 C10.5 21 11.2 21.5 12 21.5 C12.8 21.5 13.5 21 14 20" /><G cx={17} cy={7} /></Icon>;
const IconCalendar = (p: any) => <Icon {...p}><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5 H20.5" /><path d="M8 3.5 V6.5 M16 3.5 V6.5" /><G cx={16} cy={14.5} /></Icon>;
const IconTag      = (p: any) => <Icon {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></Icon>;
const IconCopy     = (p: any) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>;
const IconCheck    = (p: any) => <Icon {...p}><path d="M4 12 L9.5 17.5 L20 7" /></Icon>;
const IconStar     = (p: any) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>;

/* ---- DATA ---- */
const SESSION_OFFERS = [
  {
    id: 's1',
    title: 'HydraFacial',
    subtitle: 'Deep cleanse · Exfoliation · Hydration infusion',
    tag: 'Members save 15%',
    price: '₹2,720',
    mrp: '₹3,200',
    duration: '60 min',
    badge: 'Most booked',
    color: '#eef6ff',
    accent: '#2563eb',
  },
  {
    id: 's2',
    title: 'Chemical Peel (TCA)',
    subtitle: 'Hyperpigmentation · Acne scarring · Texture',
    tag: 'Prescribed for you',
    price: '₹2,380',
    mrp: '₹2,800',
    duration: '45 min',
    badge: 'Prescribed',
    color: '#fff8ee',
    accent: '#b45309',
  },
  {
    id: 's3',
    title: 'Laser Treatment',
    subtitle: 'Targeted pigment & texture correction',
    tag: 'Members save 10%',
    price: '₹4,050',
    mrp: '₹4,500',
    duration: '45 min',
    badge: null,
    color: '#f5f0ff',
    accent: '#7c3aed',
  },
  {
    id: 's4',
    title: 'Acne Clearing Session',
    subtitle: 'Medical-grade treatment & prevention plan',
    tag: 'Members save 10%',
    price: '₹1,620',
    mrp: '₹1,800',
    duration: '30 min',
    badge: null,
    color: '#f0faf2',
    accent: '#15803d',
  },
];

const PRODUCT_OFFERS = [
  {
    id: 'p1',
    name: 'Kaya Antox Vit-C Serum',
    category: 'Brightening · 30 ml',
    desc: 'Fades dark spots, boosts radiance. Vitamin C + ferulic acid.',
    code: 'KAYA-VIT-C18',
    saving: '18% off at clinic',
    prescribed: true,
    color: '#fff8ee',
  },
  {
    id: 'p2',
    name: 'Kaya Niacinamide 10% Serum',
    category: 'Pore-minimising · 30 ml',
    desc: 'Sebum control, pore refinement. 10% niacinamide + zinc PCA.',
    code: 'KAYA-NIA-15',
    saving: '15% off at clinic',
    prescribed: true,
    color: '#eef4ff',
  },
  {
    id: 'p3',
    name: 'Kaya Daily Shield SPF 50',
    category: 'Sunscreen · 50 ml',
    desc: 'Broad-spectrum PA++++. Invisible finish, no white cast.',
    code: 'KAYA-SPF-12',
    saving: '12% off at clinic',
    prescribed: true,
    color: '#f0faf2',
  },
  {
    id: 'p4',
    name: 'Kaya Replenishing Night Cream',
    category: 'Barrier repair · 50 g',
    desc: 'Ceramide + peptide complex. Overnight restoration.',
    code: 'KAYA-NIGHT-10',
    saving: '10% off at clinic',
    prescribed: false,
    color: '#f5f0ff',
  },
];

/* ---- BOOKING MODAL (lightweight) ---- */
const BookingModal = ({ offer, onClose }: { offer: any; onClose: () => void }) => {
  const [done, setDone] = useState(false);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--paper)', width: '100%', maxWidth: 420, borderRadius: 'var(--r-4)', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow brand dot">Book a session</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{offer.title}</div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{offer.subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontSize: 22, lineHeight: 1, padding: '0 4px', marginTop: -2 }}>×</button>
        </div>

        {!done ? (
          <div style={{ padding: 24 }}>
            <div style={{ background: 'var(--paper-2)', borderRadius: 'var(--r-3)', padding: '14px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{offer.duration}</div>
                <div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{offer.price}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--mute)', textDecoration: 'line-through' }}>{offer.mrp}</div>
                <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, marginTop: 2 }}>{offer.tag}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 20, lineHeight: 1.6 }}>
              Our team will confirm your preferred date and time within 2 hours. Pick up where you left off — your treatment plan is already on file.
            </div>
            <button className="btn" style={{ width: '100%' }} onClick={() => setDone(true)}>
              <IconCalendar size={14} /> Request appointment
            </button>
          </div>
        ) : (
          <div style={{ padding: '24px 24px 28px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <IconCheck size={22} style={{ color: 'white' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Request received</div>
            <div style={{ fontSize: 12, color: 'var(--mute)', lineHeight: 1.7 }}>
              We'll confirm your {offer.title} appointment<br />shortly via SMS and email.
            </div>
            <button className="btn ghost sm" style={{ marginTop: 18 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---- COUPON CARD ---- */
const CouponCard = ({ p }: { p: any }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(p.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ border: '1px solid var(--hair)', background: p.color, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', flex: 1 }}>
        {p.prescribed && (
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--brand)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>Prescribed for you</div>
        )}
        <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{p.category}</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{p.name}</div>
        <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 5, lineHeight: 1.5 }}>{p.desc}</div>
      </div>
      {/* Coupon strip */}
      <div style={{ borderTop: '1px dashed var(--hair-2)', margin: '0 12px' }} />
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--mute)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Clinic code · {p.saving}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', marginTop: 2, color: 'var(--ink)' }}>{p.code}</div>
        </div>
        <button
          onClick={handleCopy}
          style={{ background: copied ? 'var(--ink)' : 'var(--paper)', border: '1px solid var(--hair-2)', borderRadius: 'var(--r-2)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: copied ? 'var(--paper)' : 'var(--ink)', transition: 'all 0.15s', flexShrink: 0 }}
        >
          {copied ? <><IconCheck size={11} /> Copied</> : <><IconCopy size={11} /> Copy</>}
        </button>
      </div>
    </div>
  );
};

/* ---- SESSION OFFER CARD ---- */
const SessionCard = ({ s, onBook }: { s: any; onBook: () => void }) => (
  <div style={{ border: '1px solid var(--hair)', background: s.color, overflow: 'hidden' }}>
    <div style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {s.badge && (
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', color: s.badge === 'Prescribed' ? 'var(--brand)' : s.accent, fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: 5 }}>{s.badge}</div>
          )}
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{s.title}</div>
          <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 3, lineHeight: 1.4 }}>{s.subtitle}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{s.price}</div>
          <div style={{ fontSize: 11, color: 'var(--mute)', textDecoration: 'line-through', marginTop: 1 }}>{s.mrp}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--mute)', letterSpacing: '0.05em' }}>{s.duration}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--mute)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: s.accent, fontWeight: 600 }}>{s.tag}</span>
        </div>
        <button className="btn sm" style={{ fontSize: 11 }} onClick={onBook}>
          <IconCalendar size={12} /> Book
        </button>
      </div>
    </div>
  </div>
);

/* ---- MOBILE SHELL ---- */
const MobileShell = ({ children }: any) => (
  <div className="frame" style={{ display: 'flex', flexDirection: 'column' }}>
    <div className="statusbar">
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ display: 'inline-block', width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} />
        <span style={{ display: 'inline-block', width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} />
        <span style={{ display: 'inline-block', width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} />
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><rect x="0.5" y="0.5" width="13" height="10" rx="2" stroke="currentColor" /><rect x="2" y="2" width="9" height="7" fill="currentColor" /><rect x="14" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" /></svg>
      </span>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
    <MobileTabBar active="home" />
  </div>
);

/* ---- DESKTOP ---- */
const OffersDesktop = () => {
  const [booking, setBooking] = useState<any>(null);
  const [tab, setTab] = useState<'sessions' | 'products'>('sessions');

  return (
    <div className="frame" style={{ display: 'flex' }}>
      <SharedNavRail active="products" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="eyebrow gold dot">Member benefits</div>
            <div className="h3" style={{ marginTop: 6 }}>Exclusive Offers</div>
          </div>
          <div className="row center" style={{ gap: 10 }}>
            <button className="btn ghost sm"><IconSearch size={14} /> Search</button>
            <button className="btn ghost sm" style={{ position: 'relative' }}>
              <IconBell size={14} />
              <span style={{ position: 'absolute', top: 4, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex', gap: 6, padding: '14px var(--pad-4)', borderBottom: '1px solid var(--hair)' }}>
          {(['sessions', 'products'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              appearance: 'none', padding: '6px 16px',
              background: tab === t ? 'var(--ink)' : 'transparent',
              color: tab === t ? 'var(--paper)' : 'var(--ink)',
              border: '1px solid ' + (tab === t ? 'var(--ink)' : 'var(--hair-2)'),
              font: '500 11px var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              {t === 'sessions' ? 'Book a session' : 'Products at clinic'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--pad-4)' }}>
          {tab === 'sessions' && (
            <>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Sessions · Member pricing</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {SESSION_OFFERS.map(s => (
                  <SessionCard key={s.id} s={s} onBook={() => setBooking(s)} />
                ))}
              </div>
              <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--paper-2)', border: '1px solid var(--hair)', fontSize: 12, color: 'var(--mute)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--ink)' }}>How member pricing works.</strong> As a Kaya member, you get preferential rates on all in-clinic treatments. Prices shown are your member rate — applied automatically when you book through this app. No code needed.
              </div>
            </>
          )}
          {tab === 'products' && (
            <>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Products · Show code at clinic</div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 18, lineHeight: 1.5 }}>
                Your doctor-recommended products are available at any Kaya clinic at member price. Show the code below at the dispensary counter when you visit.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {PRODUCT_OFFERS.filter(p => p.prescribed).map(p => <CouponCard key={p.id} p={p} />)}
              </div>
              {PRODUCT_OFFERS.filter(p => !p.prescribed).length > 0 && (
                <>
                  <div className="eyebrow" style={{ margin: '28px 0 14px' }}>Also recommended</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                    {PRODUCT_OFFERS.filter(p => !p.prescribed).map(p => <CouponCard key={p.id} p={p} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      {booking && <BookingModal offer={booking} onClose={() => setBooking(null)} />}
    </div>
  );
};

/* ---- MOBILE ---- */
const OffersMobile = () => {
  const [booking, setBooking] = useState<any>(null);
  const [tab, setTab] = useState<'sessions' | 'products'>('sessions');

  return (
    <MobileShell>
      {booking && <BookingModal offer={booking} onClose={() => setBooking(null)} />}
      <div style={{ height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} /> Member benefits
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Exclusive Offers</div>
          <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>Yours as a Kaya member</div>
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 20px', borderBottom: '1px solid var(--hair)' }}>
          {(['sessions', 'products'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0, appearance: 'none', padding: '5px 14px',
              background: tab === t ? 'var(--ink)' : 'transparent',
              color: tab === t ? 'var(--paper)' : 'var(--ink)',
              border: '1px solid ' + (tab === t ? 'var(--ink)' : 'var(--hair-2)'),
              font: '500 11px var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              {t === 'sessions' ? 'Sessions' : 'Products'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'sessions' && (
            <>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Book at member price</div>
              {SESSION_OFFERS.map(s => <SessionCard key={s.id} s={s} onBook={() => setBooking(s)} />)}
              <div style={{ marginTop: 6, padding: '12px 14px', background: 'var(--paper-2)', border: '1px solid var(--hair)', fontSize: 11, color: 'var(--mute)', lineHeight: 1.7 }}>
                Member rates applied automatically. No code needed when you book here.
              </div>
            </>
          )}
          {tab === 'products' && (
            <>
              <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.6, marginBottom: 4 }}>
                Show your code at the dispensary counter when you visit any Kaya clinic.
              </div>
              {PRODUCT_OFFERS.filter(p => p.prescribed).map(p => <CouponCard key={p.id} p={p} />)}
              {PRODUCT_OFFERS.filter(p => !p.prescribed).length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginTop: 8 }}>Also recommended</div>
                  {PRODUCT_OFFERS.filter(p => !p.prescribed).map(p => <CouponCard key={p.id} p={p} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default function OffersPage() {
  return (
    <>
      <div className="desktop-only"><OffersDesktop /></div>
      <div className="mobile-only"><OffersMobile /></div>
    </>
  );
}
