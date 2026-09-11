import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/shared/Logo';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Platform', href: '#platform' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(226,232,240,0.6)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <nav className="ae-container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 72, gap: 32,
      }}>
        {/* Logo */}
        <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Logo size="sm" variant="default" />
        </Link>

        {/* Desktop Nav */}
        <div className="ae-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 32, flex: 1, justifyContent: 'center' }}>
          {links.map(l => (
            <a key={l.label} href={l.href} style={{
              fontSize: 14, fontWeight: 600, color: '#475569',
              transition: 'color 0.2s',
              fontFamily: 'var(--ae-font-display)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2648E7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="ae-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <Link to="/login" style={{
            fontSize: 14, fontWeight: 700, color: '#0F172A',
            padding: '10px 20px', borderRadius: 10,
            fontFamily: 'var(--ae-font-display)',
            transition: 'color 0.2s',
          }}>
            Log In
          </Link>
          <Link to="/signup" className="ae-btn ae-btn-gold" style={{
            padding: '10px 24px', fontSize: 14,
          }}>
            Get Started Free
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="ae-hide-desktop"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            width: 40, height: 40, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
          aria-label="Toggle menu"
        >
          <span style={{
            width: 22, height: 2, background: '#0F172A', borderRadius: 1,
            transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(2.5px, 2.5px)' : 'none',
          }} />
          <span style={{
            width: 22, height: 2, background: '#0F172A', borderRadius: 1,
            transition: 'all 0.3s', opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            width: 22, height: 2, background: '#0F172A', borderRadius: 1,
            transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(2.5px, -2.5px)' : 'none',
          }} />
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="ae-hide-desktop" style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid #E2E8F0',
          padding: '24px',
          display: 'flex', flexDirection: 'column', gap: 16,
          animation: 'ae-fade-up 0.2s ease',
        }}>
          {links.map(l => (
            <a key={l.label} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', fontFamily: 'var(--ae-font-display)' }}
            >
              {l.label}
            </a>
          ))}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--ae-font-display)' }}>
              Log In
            </Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} className="ae-btn ae-btn-gold" style={{ textAlign: 'center' }}>
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
