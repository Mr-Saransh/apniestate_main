function AIGridDecoration() {
  return (
    <svg viewBox="0 0 400 200" style={{ position: 'absolute', right: 0, bottom: 0, width: '55%', height: '100%', opacity: 0.15 }} preserveAspectRatio="xMaxYMax meet">
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 10 }).map((_, col) => {
          const x = col * 44 + 22
          const y = row * 36 + 18
          return (
            <g key={`${row}-${col}`}>
              {col < 9 && <line x1={x} y1={y} x2={x + 44} y2={y} stroke="white" strokeWidth="0.5" />}
              {row < 5 && <line x1={x} y1={y} x2={x} y2={y + 36} stroke="white" strokeWidth="0.5" />}
              {(row + col) % 3 === 0 && <circle cx={x} cy={y} r="2.5" fill="white" />}
            </g>
          )
        })
      )}
    </svg>
  )
}

export default function CTABanner() {
  return (
    <section style={{ padding: 'clamp(40px, 6vw, 80px) 20px', background: '#F5F7FF' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0B1F4D 0%, #162D6E 100%)',
          borderRadius: 24, padding: 'clamp(36px, 6vw, 72px) clamp(24px, 5vw, 64px)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorations */}
          <AIGridDecoration />
          <div style={{
            position: 'absolute', top: -100, left: -100,
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,179,1,0.15), transparent 70%)',
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
            {/* Eyebrow */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,179,1,0.15)', border: '1px solid rgba(245,179,1,0.3)',
              borderRadius: 100, padding: '5px 14px', marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5B301' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F5B301', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Get Started Today
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(28px, 5vw, 56px)',
              fontWeight: 900, lineHeight: 1.1,
              color: '#fff', letterSpacing: '-0.04em', marginBottom: 16,
            }}>
              See PropifyAI in action—<span style={{ color: '#F5B301' }}>no commitment</span> required
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 36, fontFamily: "'Inter', sans-serif" }}>
              Book a 30-minute personalized demo. We'll show exactly how the platform performs on your market, your asset class, and your team structure.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <a href="#" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#F5B301', color: '#0B1F4D',
                padding: '14px 28px', borderRadius: 12,
                fontSize: 15, fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(245,179,1,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(245,179,1,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,179,1,0.4)' }}
              >
                Book a Free Demo
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="#" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1.5px solid rgba(255,255,255,0.25)',
                color: '#fff', padding: '14px 28px', borderRadius: 12,
                fontSize: 15, fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: 'none',
                transition: 'border-color 0.2s, background 0.2s',
                background: 'rgba(255,255,255,0.06)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              >
                View API Documentation
              </a>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['No credit card required', '14-day pilot available', 'Onboarding in 48 hours'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill="rgba(245,179,1,0.2)" />
                    <path d="M4 7l2 2 4-4" stroke="#F5B301" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter', sans-serif" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
