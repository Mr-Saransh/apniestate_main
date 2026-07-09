const PERSONAS = [
  {
    role: 'Real Estate Developers',
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=500&fit=crop&auto=format',
    imgAlt: 'Modern high-rise under construction',
    benefits: [
      'Site selection scoring with demand heatmaps',
      'Pre-launch pricing optimization by unit type',
      'Investor-ready feasibility reports in minutes',
      'Live construction pipeline tracking',
    ],
  },
  {
    role: 'Real Estate Agents',
    img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=500&fit=crop&auto=format',
    imgAlt: 'Real estate agent with client',
    benefits: [
      'AI lead scoring ranked by purchase readiness',
      'Automated listing descriptions and price estimates',
      'Smart follow-up sequences that convert',
      'Neighborhood insight cards for every showing',
    ],
  },
  {
    role: 'Asset Managers',
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=500&fit=crop&auto=format',
    imgAlt: 'Financial charts and portfolio data',
    benefits: [
      'Portfolio-wide NOI and yield dashboards',
      'Lease expiry alerts and renewal forecasting',
      'Capital expenditure planning with AI priorities',
      'Benchmarking against comparable asset pools',
    ],
  },
  {
    role: 'PropTech Platforms',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=500&fit=crop&auto=format',
    imgAlt: 'Technology and data visualization',
    benefits: [
      'White-label AI valuation API',
      'Embeddable search and recommendation widgets',
      'Market data enrichment for existing platforms',
      'SDK for custom AI feature development',
    ],
  },
]

export default function WhoWeServe() {
  return (
    <section style={{
      background: 'rgba(201,168,108,0.02)',
      borderTop: '1px solid rgba(201,168,108,0.08)',
      padding: '120px 32px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <span className="gold-line" />
            <span style={{ color: '#C9A86C', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Who We Serve
            </span>
            <span className="gold-line" />
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 800, lineHeight: 1.1,
            color: '#F0EDE8', letterSpacing: '-0.03em',
          }}>
            Built for every real estate professional
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {PERSONAS.map((p, i) => (
            <div key={i} className="card-hover" style={{
              background: '#0F1623',
              border: '1px solid rgba(201,168,108,0.1)',
              borderRadius: 8, overflow: 'hidden',
            }}>
              {/* Image */}
              <div style={{ height: 200, overflow: 'hidden', background: '#141C2E', position: 'relative' }}>
                <img src={p.img} alt={p.imgAlt} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(0deg, rgba(15,22,35,1) 0%, rgba(15,22,35,0) 60%)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 16, left: 20,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18, fontWeight: 700, color: '#F0EDE8',
                }}>
                  {p.role}
                </div>
              </div>

              {/* Benefits */}
              <div style={{ padding: '24px 24px 28px' }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {p.benefits.map((b, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, flexShrink: 0, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l3.5 3.5L12 3" stroke="#C9A86C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 13, color: '#8A96AE', lineHeight: 1.6 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
