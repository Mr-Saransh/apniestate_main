import { useState } from 'react'

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="rgba(11,31,77,0.06)" />
        <circle cx="16" cy="13" r="4" stroke="#0B1F4D" strokeWidth="1.5" />
        <path d="M9 26c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#0B1F4D" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="9" r="3.5" fill="#F5B301" />
        <path d="M22.5 9h3M24 7.5v3" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    tag: 'Search & Discovery',
    title: 'AI Property Intelligence',
    desc: 'Natural language queries surface exactly matched properties in milliseconds. Semantic AI understands buyer intent, not just keywords.',
    highlight: 'Used by 80K+ agents monthly',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="rgba(245,179,1,0.1)" />
        <path d="M6 22L12 14l5 4 5-8 4 6" stroke="#F5B301" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 8h20" stroke="rgba(11,31,77,0.15)" strokeWidth="1" />
        <path d="M6 13h20" stroke="rgba(11,31,77,0.08)" strokeWidth="1" />
      </svg>
    ),
    tag: 'Market Intelligence',
    title: 'Predictive Market Analytics',
    desc: 'Forecast price movements, demand shifts, and investment opportunities before they materialize. Trained on 10 years of hyper-local transaction data.',
    highlight: '6-month lead time on market shifts',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="rgba(11,31,77,0.06)" />
        <rect x="8" y="14" width="5" height="10" rx="1.5" fill="rgba(11,31,77,0.3)" />
        <rect x="14" y="10" width="5" height="14" rx="1.5" fill="rgba(11,31,77,0.5)" />
        <rect x="20" y="7" width="5" height="17" rx="1.5" fill="#0B1F4D" />
        <circle cx="24" cy="8" r="3.5" fill="#F5B301" />
        <path d="M22.5 8h3M24 6.5v3" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    tag: 'Valuation Engine',
    title: 'Automated Valuation Model',
    desc: 'Instant AVM reports with 97% accuracy across residential, commercial, and industrial assets. Comparable analysis, yield forecasting, and risk scoring in one report.',
    highlight: '97% accuracy, 4-second delivery',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="rgba(245,179,1,0.1)" />
        <rect x="7" y="9" width="18" height="14" rx="3" stroke="#F5B301" strokeWidth="1.5" />
        <path d="M11 14h10M11 18h7" stroke="#F5B301" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        <circle cx="25" cy="8" r="3" fill="#0B1F4D" />
        <path d="M24 8h2" stroke="white" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    tag: 'Agent Productivity',
    title: 'Smart CRM & Lead AI',
    desc: 'AI-ranked leads, deal probability scoring, and automated follow-up sequences. Know exactly when to reach out, and what to say, for every prospect.',
    highlight: '3.2× average conversion uplift',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="rgba(11,31,77,0.06)" />
        <path d="M16 6L26 12V20L16 26L6 20V12L16 6Z" stroke="#0B1F4D" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 6v20M6 12l20 8M26 12L6 20" stroke="rgba(11,31,77,0.2)" strokeWidth="0.8" />
        <circle cx="16" cy="16" r="3" fill="#F5B301" />
      </svg>
    ),
    tag: 'Virtual Experience',
    title: 'AI-Narrated 3D Tours',
    desc: 'Remote buyers qualify properties via AI-guided virtual tours with live data overlays — pricing, comparables, and neighborhood insights embedded in the walkthrough.',
    highlight: '60% fewer physical site visits',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="rgba(245,179,1,0.1)" />
        <circle cx="16" cy="16" r="9" stroke="#F5B301" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="16" cy="16" r="5" stroke="#F5B301" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" fill="#F5B301" />
        <path d="M16 7V5M16 27v-2M7 16H5M27 16h-2" stroke="#F5B301" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    tag: 'Asset Management',
    title: 'Portfolio Intelligence Hub',
    desc: 'Track NOI, occupancy, lease expiries, and renovation ROI across your entire portfolio from one command center. AI surfaces priority actions every morning.',
    highlight: 'Supports 50K+ unit portfolios',
  },
]

export default function Features() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section style={{ padding: 'clamp(60px, 8vw, 120px) 20px', background: '#F5F7FF' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 72px)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(11,31,77,0.06)', borderRadius: 100,
            padding: '5px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1F4D', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Platform Capabilities
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 900, lineHeight: 1.1,
            color: '#0B1F4D', letterSpacing: '-0.03em',
            marginBottom: 16,
          }}>
            Six AI modules.<br />One unified platform.
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: '#6B7BA8', maxWidth: 520, margin: '0 auto', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
            Every tool your real estate business needs — designed to work together seamlessly, powered by AI at every layer.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 16,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: '#fff',
                border: `1.5px solid ${hovered === i ? 'rgba(245,179,1,0.5)' : 'rgba(11,31,77,0.06)'}`,
                borderRadius: 20,
                padding: 'clamp(20px, 3vw, 28px)',
                cursor: 'default',
                transition: 'all 0.25s ease',
                transform: hovered === i ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hovered === i
                  ? '0 20px 48px rgba(11,31,77,0.1), 0 4px 12px rgba(245,179,1,0.08)'
                  : '0 2px 12px rgba(11,31,77,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                {f.icon}
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#6B7BA8',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {f.tag}
                </span>
              </div>

              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 17, fontWeight: 800, color: '#0B1F4D',
                letterSpacing: '-0.02em', marginBottom: 10,
              }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, color: '#6B7BA8', lineHeight: 1.7, marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
                {f.desc}
              </p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(245,179,1,0.1)', borderRadius: 8, padding: '5px 10px',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F5B301', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1F4D', fontFamily: "'Inter', sans-serif" }}>{f.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
