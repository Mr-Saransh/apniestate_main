const STAKEHOLDERS = [
  { role: 'Developers', icon: '🏗️', desc: 'Site scoring, pre-launch pricing, pipeline management' },
  { role: 'Architects', icon: '📐', desc: 'Design-stage feasibility and zoning AI analysis' },
  { role: 'Contractors', icon: '🔧', desc: 'Project timeline forecasting and supplier intelligence' },
  { role: 'Agents', icon: '🤝', desc: 'AI lead scoring, auto follow-up, smart CRM' },
  { role: 'Asset Managers', icon: '📊', desc: 'Portfolio dashboards, yield optimization, alerts' },
  { role: 'Civil Engineers', icon: '⚙️', desc: 'Infrastructure assessment and impact analysis' },
  { role: 'Interior Designers', icon: '🎨', desc: 'Unit specification intelligence and trend analysis' },
  { role: 'Investors', icon: '💹', desc: 'Market forecasting, ROI modeling, deal sourcing' },
  { role: 'Consultants', icon: '📋', desc: 'Client report generation and due diligence AI' },
  { role: 'Material Suppliers', icon: '📦', desc: 'Demand prediction and project pipeline visibility' },
  { role: 'Channel Partners', icon: '🔗', desc: 'Co-brokerage tools and referral tracking' },
  { role: 'Property Managers', icon: '🏠', desc: 'Tenant intelligence, maintenance forecasting' },
]

function AIOrbit() {
  const orbitItems = STAKEHOLDERS.slice(0, 8)
  const cx = 50, cy = 50, r = 38

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', aspectRatio: '1', display: 'block' }}>
        <defs>
          <radialGradient id="orbitGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,179,1,0.15)" />
            <stop offset="60%" stopColor="rgba(11,31,77,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Background rings */}
        {[38, 28, 18].map((radius, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius}
            fill="none" stroke="rgba(11,31,77,0.06)" strokeWidth="0.5"
            strokeDasharray={i === 0 ? "2 2" : undefined}
          />
        ))}
        <circle cx={cx} cy={cy} r={48} fill="url(#orbitGrad)" />

        {/* Orbit nodes */}
        {orbitItems.map((item, i) => {
          const angle = (i / orbitItems.length) * 2 * Math.PI - Math.PI / 2
          const x = cx + r * Math.cos(angle)
          const y = cy + r * Math.sin(angle)
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(11,31,77,0.08)" strokeWidth="0.3" />
              <circle cx={x} cy={y} r={4} fill="#fff"
                stroke="rgba(11,31,77,0.12)" strokeWidth="0.5" />
              <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="3.5">
                {item.icon}
              </text>
            </g>
          )
        })}

        {/* Center node */}
        <circle cx={cx} cy={cy} r={10} fill="linear-gradient(135deg, #0B1F4D, #162D6E)"
          stroke="#F5B301" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={10} fill="#0B1F4D" />
        <circle cx={cx} cy={cy} r={10} stroke="#F5B301" strokeWidth="0.8" fill="none" />
        <text x={cx} y={cy - 1.5} textAnchor="middle" fontSize="4" fill="#F5B301" fontWeight="bold">AI</text>
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize="2.5" fill="rgba(255,255,255,0.6)">HUB</text>
      </svg>
    </div>
  )
}

export default function Ecosystem() {
  return (
    <section style={{ padding: 'clamp(60px, 8vw, 120px) 20px', background: '#F5F7FF' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,179,1,0.12)', border: '1px solid rgba(245,179,1,0.25)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1F4D', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              The Full Ecosystem
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 900, lineHeight: 1.1,
            color: '#0B1F4D', letterSpacing: '-0.03em', marginBottom: 16,
          }}>
            One platform.<br />Every stakeholder.
          </h2>
          <p style={{ fontSize: 16, color: '#6B7BA8', maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
            PropifyAI is the intelligence layer connecting every professional in the real estate and construction ecosystem — from planning to project completion.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: 40, alignItems: 'center',
        }}>
          {/* Orbit diagram */}
          <div className="hide-mobile">
            <AIOrbit />
          </div>

          {/* Stakeholder grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
            gap: 10,
          }}>
            {STAKEHOLDERS.map((s, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 14,
                padding: '14px 16px',
                border: '1.5px solid rgba(11,31,77,0.06)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(245,179,1,0.4)'
                  el.style.transform = 'translateY(-3px)'
                  el.style.boxShadow = '0 12px 32px rgba(11,31,77,0.08)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(11,31,77,0.06)'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F4D', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s.role}
                </div>
                <div style={{ fontSize: 11, color: '#6B7BA8', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
