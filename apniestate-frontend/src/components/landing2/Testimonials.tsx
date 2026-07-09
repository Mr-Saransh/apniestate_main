import { useState } from 'react'

const QUOTES = [
  {
    text: "PropifyAI's valuation engine cut our pre-approval cycle from 3 days to under 4 hours. Our entire underwriting team now trusts the AI-generated comps over manual research. It's completely transformed our deal flow.",
    name: 'Sarah Mitchell',
    title: 'Chief Investment Officer',
    company: 'Meridian Capital Partners',
    initials: 'SM',
    color: '#EEF1FB',
    rating: 5,
  },
  {
    text: "We rolled PropifyAI across 340 agents. Within 90 days, deal close time dropped 23% and lead conversion jumped from 4% to 11%. The ROI calculation was immediate. This is the infrastructure every agency needs.",
    name: 'James Okafor',
    title: 'Head of Digital Innovation',
    company: 'Premier Realty Group',
    initials: 'JO',
    color: '#FFFBEE',
    rating: 5,
  },
  {
    text: "Managing 6 concurrent developments is only possible with PropifyAI's portfolio intelligence dashboard. Real-time presales velocity, pricing performance, and construction cost tracking — all in one command center.",
    name: 'Priya Sharma',
    title: 'Managing Director',
    company: 'Apex Properties',
    initials: 'PS',
    color: '#EEF1FB',
    rating: 5,
  },
  {
    text: "The market forecasting called an emerging corridor 6 months before traditional reports. We acquired early and saw 38% appreciation on exit. That single insight alone paid for 5 years of the platform subscription.",
    name: 'Thomas Brennan',
    title: 'Portfolio Manager',
    company: 'Brennan Asset Management',
    initials: 'TB',
    color: '#FFFBEE',
    rating: 5,
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#F5B301">
          <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.2l-3.7 2.1.7-4.1L1 5.3l4.2-.7L7 1Z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const [active, setActive] = useState(0)
  const q = QUOTES[active]

  return (
    <section style={{
      background: '#fff',
      borderTop: '1px solid rgba(11,31,77,0.06)',
      padding: 'clamp(60px, 8vw, 120px) 20px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(11,31,77,0.06)', borderRadius: 100,
            padding: '5px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1F4D', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Client Stories
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 900, lineHeight: 1.1,
            color: '#0B1F4D', letterSpacing: '-0.03em',
          }}>
            Trusted by the industry's best
          </h2>
        </div>

        {/* Active quote */}
        <div style={{
          background: q.color, borderRadius: 24,
          padding: 'clamp(28px, 5vw, 56px)',
          border: '1.5px solid rgba(11,31,77,0.06)',
          marginBottom: 20,
          transition: 'all 0.3s ease',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative quote mark */}
          <div style={{
            position: 'absolute', top: 20, right: 28,
            fontSize: 120, lineHeight: 1, color: 'rgba(11,31,77,0.04)',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900,
            userSelect: 'none', pointerEvents: 'none',
          }}>
            "
          </div>

          <Stars count={q.rating} />
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(16px, 2.5vw, 22px)',
            fontWeight: 600, lineHeight: 1.6,
            color: '#0B1F4D', marginBottom: 28,
            letterSpacing: '-0.01em',
          }}>
            "{q.text}"
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0B1F4D, #1A3A8F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 4px 12px rgba(11,31,77,0.2)',
              flexShrink: 0,
            }}>
              {q.initials}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{q.name}</div>
              <div style={{ fontSize: 12, color: '#6B7BA8', fontFamily: "'Inter', sans-serif" }}>{q.title} · {q.company}</div>
            </div>
          </div>
        </div>

        {/* Selector dots / names */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {QUOTES.map((item, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              background: i === active ? '#0B1F4D' : '#fff',
              border: `1.5px solid ${i === active ? '#0B1F4D' : 'rgba(11,31,77,0.1)'}`,
              borderRadius: 12, padding: '10px 16px',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: i === active ? 'rgba(245,179,1,0.3)' : 'rgba(11,31,77,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: i === active ? '#F5B301' : '#6B7BA8',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {item.initials}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: i === active ? '#fff' : '#0B1F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 10, color: i === active ? 'rgba(255,255,255,0.6)' : '#6B7BA8', fontFamily: "'Inter', sans-serif" }}>
                  {item.company}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
