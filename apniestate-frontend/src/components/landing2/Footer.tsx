import apniEstateLogo from '@/imports/image.png'

const LINKS = {
  Product: ['Executive Dashboard', 'Site Manager Console', 'Finance & Accounts', 'Material Tracking', 'Labour Management', 'Reports & Analytics'],
  Company: ['About Apni Estate', 'Blog', 'Careers', 'Press', 'Partners', 'Contact Us'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Data Security', 'Cookie Policy'],
}

export default function Footer() {
  return (
    <footer style={{
      background: '#fff',
      borderTop: '1px solid rgba(11,31,77,0.06)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 20px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
          gap: 36, marginBottom: 48,
        }}>
          {/* Brand col */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <img
                src={apniEstateLogo}
                alt="Apni Estate"
                style={{ height: 40, width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <p style={{ fontSize: 13, color: '#B0BBDA', lineHeight: 1.7, marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>
              The premium ERP built for Indian construction and real estate — eliminating wastage, tracking projects, and centralizing operations.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['𝕏', 'in', 'yt'].map(s => (
                <a key={s} href="#" style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid rgba(11,31,77,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#B0BBDA', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0B1F4D'; e.currentTarget.style.color = '#0B1F4D' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,31,77,0.1)'; e.currentTarget.style.color = '#B0BBDA' }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0B1F4D', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {section}
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => (
                  <li key={item}>
                    <a href="#" style={{
                      fontSize: 13, color: '#B0BBDA', textDecoration: 'none',
                      fontFamily: "'Inter', sans-serif", transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#0B1F4D')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#B0BBDA')}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid rgba(11,31,77,0.06)', paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <p style={{ fontSize: 12, color: '#B0BBDA', fontFamily: "'Inter', sans-serif" }}>
            © 2025 Apni Estate. All rights reserved. | Registered under Startup India &amp; Startup Tripura | Recognized by DST
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 12, color: '#B0BBDA', fontFamily: "'Inter', sans-serif" }}>All systems operational</span>
          </div>
        </div>

        <div style={{ height: 72 }} className="hide-desktop" />
      </div>
    </footer>
  )
}
