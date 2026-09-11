import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/shared/Logo';
import { Globe, Mail, MapPin, Phone, Share2, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: '#0B132B',
      color: '#94A3B8',
      paddingTop: 80,
      paddingBottom: 32,
    }}>
      <div className="ae-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48,
          marginBottom: 48,
        }}>
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 1' }}>
            <Logo size="md" variant="light" style={{ marginBottom: 16 }} />
            <p style={{
              fontSize: 13, lineHeight: 1.8, marginBottom: 20, maxWidth: 280,
            }}>
              Construction Management ERP & Real Estate CRM built for Indian builders,
              contractors, and real estate developers.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[Globe, Share2, MessageCircle].map((Icon, i) => (
                <a key={i} href="#" style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94A3B8',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2648E7'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20, fontFamily: 'var(--ae-font-display)' }}>
              Product
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <a href="#features" style={{ color: '#94A3B8', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>Features</a>
              <a href="#solutions" style={{ color: '#94A3B8', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>Solutions</a>
              <a href="#platform" style={{ color: '#94A3B8', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>Platform</a>
              <a href="#pricing" style={{ color: '#94A3B8', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>Pricing</a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20, fontFamily: 'var(--ae-font-display)' }}>
              Company
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <a href="#" style={{ color: '#94A3B8' }}>About Us</a>
              <a href="#" style={{ color: '#94A3B8' }}>Careers</a>
              <a href="#" style={{ color: '#94A3B8' }}>Blog</a>
              <a href="#" style={{ color: '#94A3B8' }}>Contact</a>
            </div>
          </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20, fontFamily: 'var(--ae-font-display)' }}>
                Contact
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                <a href="mailto:apniestateofficial@gmail.com" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#94A3B8', transition: 'color 0.2s' }}
                   onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                   onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                  <Mail size={16} style={{ color: '#FCC300', flexShrink: 0, marginTop: 2 }} />
                  <span>apniestateofficial@gmail.com</span>
                </a>
                <a href="tel:+916009396197" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#94A3B8', transition: 'color 0.2s' }}
                   onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                   onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                  <Phone size={16} style={{ color: '#FCC300', flexShrink: 0, marginTop: 2 }} />
                  <span>+91 60093 96197</span>
                </a>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <MapPin size={16} style={{ color: '#FCC300', flexShrink: 0, marginTop: 2 }} />
                  <span>India</span>
                </div>
              </div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
          fontSize: 12,
        }}>
          <p>© {new Date().getFullYear()} Apni Estate. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: '#64748B' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#64748B' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
