/* AI-mesh SVG network background — no stock photos */
function AINetworkBg() {
  const nodes = [
    [10, 15], [50, 8], [88, 18], [25, 42], [65, 38], [90, 55],
    [15, 65], [45, 72], [78, 68], [30, 90], [62, 88], [92, 82],
    [50, 50],
  ]
  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5],
    [3, 6], [4, 7], [5, 8], [6, 7], [7, 8], [6, 9], [7, 10],
    [8, 11], [9, 10], [10, 11], [1, 12], [4, 12], [7, 12],
  ]
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}>
      <defs>
        <radialGradient id="ng" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5B301" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0B1F4D" stopOpacity="0" />
        </radialGradient>
      </defs>
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="#0B1F4D" strokeWidth="0.3" strokeOpacity="0.4"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 12 ? 1.8 : 1} fill="#0B1F4D" opacity={i === 12 ? 0.7 : 0.4} />
      ))}
      <circle cx="50" cy="50" r="48" fill="url(#ng)" />
    </svg>
  )
}

function FloatingDashCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,1)',
      borderRadius: 16,
      padding: '16px 18px',
      boxShadow: '0 20px 60px rgba(11,31,77,0.12), 0 4px 16px rgba(11,31,77,0.06)',
      minWidth: 220,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7BA8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        AI Platform — Live
      </div>
      {[
        { label: 'Properties Analyzed', val: '2.4M+', up: true },
        { label: 'Valuations Today', val: '18,392', up: true },
        { label: 'AI Accuracy Rate', val: '97.3%', up: true },
      ].map(s => (
        <div key={s.label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '7px 0', borderBottom: '1px solid rgba(11,31,77,0.05)',
        }}>
          <span style={{ fontSize: 12, color: '#6B7BA8', fontFamily: "'Inter', sans-serif" }}>{s.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {s.val} <span style={{ color: '#22C55E', fontSize: 10 }}>↑</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function BadgePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(11,31,77,0.1)', borderRadius: 100,
      padding: '5px 12px',
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#0B1F4D', fontFamily: "'Inter', sans-serif" }}>{text}</span>
    </div>
  )
}

export default function Hero() {
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      paddingTop: 80,
      paddingBottom: 80,
      overflow: 'hidden',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #EEF1FB 0%, #F5F7FF 40%, #FFFBEE 100%)',
        }} />
        <AINetworkBg />
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', top: -200, right: -200,
          background: 'radial-gradient(circle, rgba(245,179,1,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%', bottom: -150, left: -150,
          background: 'radial-gradient(circle, rgba(11,31,77,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
          gap: 48, alignItems: 'center',
        }}>
          {/* Left — copy */}
          <div>
            {/* Eyebrow badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,179,1,0.1)', border: '1px solid rgba(245,179,1,0.3)',
              borderRadius: 100, padding: '6px 14px', marginBottom: 24,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5B301', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0B1F4D', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.06em' }}>
                The AI OS for Real Estate
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.06,
              letterSpacing: '-0.04em',
              color: '#0B1F4D',
              marginBottom: 24,
            }}>
              Powering the<br />
              <span style={{
                background: 'linear-gradient(135deg, #F5B301 0%, #E09600 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Future of Real
              </span>
              <br />Estate with AI
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: '#6B7BA8', lineHeight: 1.75, marginBottom: 36,
              fontFamily: "'Inter', sans-serif", fontWeight: 400,
              maxWidth: 500,
            }}>
              PropifyAI is the intelligent infrastructure layer connecting every stakeholder in the real estate and construction ecosystem — from builders to buyers, architects to asset managers.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <a href="#" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#0B1F4D', color: '#fff',
                padding: '14px 28px', borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(11,31,77,0.28)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(11,31,77,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,31,77,0.28)' }}
              >
                Start Free Trial
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="#" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#F5B301', color: '#0B1F4D',
                padding: '14px 28px', borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(245,179,1,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Book a Demo
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <BadgePill icon="🏆" text="PropTech Awards 2024" />
              <BadgePill icon="🔐" text="SOC 2 Certified" />
              <BadgePill icon="⚡" text="10ms Response" />
              <BadgePill icon="🌍" text="40+ Markets" />
            </div>
          </div>

          {/* Right — visual */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }} className="hide-mobile">
            {/* Main dashboard mockup */}
            <div className="animate-float" style={{ width: '100%', maxWidth: 440 }}>
              <div style={{
                background: 'white', borderRadius: 20,
                boxShadow: '0 32px 80px rgba(11,31,77,0.15), 0 8px 24px rgba(11,31,77,0.08)',
                border: '1px solid rgba(11,31,77,0.06)',
                overflow: 'hidden',
              }}>
                {/* Titlebar */}
                <div style={{
                  background: 'linear-gradient(135deg, #0B1F4D, #1A3A8F)',
                  padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", marginLeft: 8 }}>
                    PropifyAI — Intelligence Hub
                  </span>
                </div>

                {/* Dashboard content */}
                <div style={{ padding: '20px' }}>
                  {/* Metric row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Active Listings', val: '14,829', delta: '+12%', color: '#22C55E' },
                      { label: 'AI Valuations', val: '2,304', delta: '+8%', color: '#22C55E' },
                      { label: 'Deal Pipeline', val: '$4.2B', delta: '+18%', color: '#22C55E' },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: '#F5F7FF', borderRadius: 10, padding: '10px 12px',
                      }}>
                        <div style={{ fontSize: 9, color: '#6B7BA8', marginBottom: 4, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{m.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0B1F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.val}</div>
                        <div style={{ fontSize: 10, color: m.color, fontWeight: 600, marginTop: 2 }}>{m.delta}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div style={{
                    background: 'linear-gradient(135deg, #EEF1FB, #F5F7FF)',
                    borderRadius: 12, padding: '16px',
                    marginBottom: 12, position: 'relative', overflow: 'hidden', height: 100,
                  }}>
                    <div style={{ fontSize: 10, color: '#6B7BA8', fontWeight: 600, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Market Intelligence — Last 30 Days</div>
                    <svg viewBox="0 0 300 60" style={{ width: '100%', height: 60 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0B1F4D" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#0B1F4D" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 50 C40 40 60 20 100 25 S160 10 200 15 S260 5 300 8 L300 60 L0 60 Z" fill="url(#chartGrad)" />
                      <path d="M0 50 C40 40 60 20 100 25 S160 10 200 15 S260 5 300 8" fill="none" stroke="#0B1F4D" strokeWidth="2" strokeLinecap="round" />
                      <path d="M0 55 C50 45 90 38 130 35 S200 30 250 28 S280 25 300 22" fill="none" stroke="#F5B301" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
                    </svg>
                  </div>

                  {/* Bottom tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['AI Search Active', 'Valuations Running', 'CRM Synced'].map(t => (
                      <span key={t} style={{
                        fontSize: 10, fontWeight: 600, color: '#0B1F4D',
                        background: 'rgba(245,179,1,0.15)', border: '1px solid rgba(245,179,1,0.3)',
                        borderRadius: 100, padding: '3px 10px',
                        fontFamily: "'Inter', sans-serif",
                      }}>• {t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat card */}
            <div style={{ alignSelf: 'flex-end', marginRight: 16 }}>
              <FloatingDashCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
