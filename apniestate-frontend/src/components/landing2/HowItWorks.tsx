const STEPS = [
  {
    num: '01',
    title: 'Connect in 48 Hours',
    desc: 'Integrate your MLS feeds, CRM records, property databases, and market data via secure API connectors. Zero engineering team required.',
    bullets: ['Pre-built connectors for 40+ platforms', 'No-code data mapping interface', 'GDPR & SOC 2 compliant from day one'],
    color: '#EEF1FB',
    accent: '#0B1F4D',
  },
  {
    num: '02',
    title: 'AI Calibrates to Your Market',
    desc: 'Our models train on your historical deals, local comparables, and regional data. Within 72 hours, PropifyAI is tuned to your geography and asset class.',
    bullets: ['Hyper-local model fine-tuning', 'Comparable transaction analysis', 'Demand heatmap generation'],
    color: '#FFFBEE',
    accent: '#F5B301',
  },
  {
    num: '03',
    title: 'Deploy Across Your Team',
    desc: 'Every stakeholder gets a tailored experience — agents, developers, asset managers, and analysts all see the intelligence most relevant to their role.',
    bullets: ['Role-based dashboard configuration', 'Web, mobile, and CRM plugin access', 'SSO and enterprise access controls'],
    color: '#EEF1FB',
    accent: '#0B1F4D',
  },
  {
    num: '04',
    title: 'Measure, Learn & Scale',
    desc: 'Track deal velocity, conversion lifts, and valuation accuracy. Monthly AI reports surface patterns and optimize your workflows automatically.',
    bullets: ['Executive analytics dashboard', 'Automated monthly insight reports', 'ROI attribution across all modules'],
    color: '#FFFBEE',
    accent: '#F5B301',
  },
]

export default function HowItWorks() {
  return (
    <section style={{
      background: '#fff',
      borderTop: '1px solid rgba(11,31,77,0.06)',
      padding: 'clamp(60px, 8vw, 120px) 20px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 72px)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(11,31,77,0.06)', borderRadius: 100,
            padding: '5px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1F4D', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              How It Works
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 900, lineHeight: 1.1,
            color: '#0B1F4D', letterSpacing: '-0.03em',
          }}>
            From onboarding to ROI<br />in four steps
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              background: step.color,
              borderRadius: 20, overflow: 'hidden',
              border: '1.5px solid rgba(11,31,77,0.06)',
              minHeight: 200,
            }}>
              {/* Number panel */}
              <div style={{
                padding: 'clamp(28px, 4vw, 48px)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                borderRight: '1px solid rgba(11,31,77,0.06)',
              }}>
                <div>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 'clamp(56px, 8vw, 96px)',
                    fontWeight: 900, lineHeight: 1,
                    color: step.accent === '#F5B301' ? 'rgba(245,179,1,0.2)' : 'rgba(11,31,77,0.08)',
                    display: 'block', marginBottom: 16,
                  }}>
                    {step.num}
                  </span>
                  <h3 style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 'clamp(20px, 3vw, 28px)',
                    fontWeight: 800, color: '#0B1F4D',
                    letterSpacing: '-0.03em', marginBottom: 12,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6B7BA8', lineHeight: 1.75, fontFamily: "'Inter', sans-serif" }}>
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Bullets panel */}
              <div style={{
                padding: 'clamp(28px, 4vw, 48px)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                gap: 12,
              }}>
                {step.bullets.map((b, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                      background: step.accent === '#F5B301' ? 'rgba(245,179,1,0.2)' : 'rgba(11,31,77,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5L4.5 8L9 3" stroke={step.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, color: '#0B1F4D', fontWeight: 500, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                      {b}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
