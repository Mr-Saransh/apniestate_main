import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apniEstateLogo from '@/imports/image.png'

const LINKS = ['Platform', 'Solutions', 'Pricing', 'About']

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.35s ease',
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(11,31,77,0.07)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 24px rgba(11,31,77,0.06)' : 'none',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              <img
                src={apniEstateLogo}
                alt="Apni Estate"
                style={{ height: 44, width: 'auto', objectFit: 'contain' }}
              />
            </div>

            {/* Desktop Nav */}
            <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hide-mobile">
              {LINKS.map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} style={{
                  fontSize: 14, fontWeight: 500, color: '#6B7BA8',
                  textDecoration: 'none', transition: 'color 0.2s',
                  fontFamily: "'Inter', sans-serif",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0B1F4D')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7BA8')}
                >
                  {l}
                </a>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="hide-mobile">
              <Link to="/login" style={{
                fontSize: 14, fontWeight: 600, color: '#0B1F4D',
                textDecoration: 'none', padding: '8px 18px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Sign in
              </Link>
              <Link to="/signup" style={{
                fontSize: 14, fontWeight: 700, color: '#fff',
                textDecoration: 'none', padding: '9px 20px',
                background: '#0B1F4D', borderRadius: 10,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 4px 12px rgba(11,31,77,0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(11,31,77,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(11,31,77,0.25)' }}
              >
                Start Free Trial →
              </Link>
            </div>

            {/* Mobile burger */}
            <button onClick={() => setOpen(!open)} className="hide-desktop" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, color: '#0B1F4D',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open
                  ? <><path d="M4 4L18 18"/><path d="M18 4L4 18"/></>
                  : <><path d="M3 6h16"/><path d="M3 11h16"/><path d="M3 16h16"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(11,31,77,0.07)',
            padding: '16px 20px 24px',
          }}>
            {LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{
                display: 'block', padding: '12px 0',
                fontSize: 16, fontWeight: 600, color: '#0B1F4D',
                textDecoration: 'none', borderBottom: '1px solid rgba(11,31,77,0.05)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }} onClick={() => setOpen(false)}>
                {l}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Link to="/login" style={{
                flex: 1, textAlign: 'center', padding: '12px',
                border: '1.5px solid #0B1F4D', borderRadius: 10,
                fontSize: 14, fontWeight: 700, color: '#0B1F4D', textDecoration: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }} onClick={() => setOpen(false)}>Sign In</Link>
              <Link to="/signup" style={{
                flex: 1, textAlign: 'center', padding: '12px',
                background: '#0B1F4D', borderRadius: 10,
                fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }} onClick={() => setOpen(false)}>Start Free Trial</Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
