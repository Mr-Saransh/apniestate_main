import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';

/*
  Final CTA Section:
  Uses the official illuminated high-rise construction background from LoginPage (/branding/login-bg.png)
  with a rich navy gradient overlay, gold primary CTA, and white secondary CTA button.
*/

export default function FinalCTA() {
  return (
    <section className="ae-section" style={{ background: '#FFFFFF', padding: '48px 0' }}>
      <div className="ae-container">
        <div 
          className="ae-final-cta-card"
          style={{
            borderRadius: 32,
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: "linear-gradient(135deg, rgba(11, 19, 43, 0.90) 0%, rgba(11, 19, 43, 0.78) 50%, rgba(11, 19, 43, 0.92) 100%), url('/branding/login-bg.png')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            boxShadow: '0 25px 60px rgba(11, 19, 43, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            margin: '0 auto',
            maxWidth: 1120,
          }}
        >
          {/* Subtle warm glow accents */}
          <div style={{
            position: 'absolute', top: -100, right: -100,
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(38, 72, 231, 0.3) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, left: -80,
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(252, 195, 0, 0.2) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative', zIndex: 2,
            padding: 'clamp(36px, 6vw, 76px) clamp(18px, 4vw, 48px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
              <div className="ae-label" style={{ color: '#FCC300', marginBottom: 14, letterSpacing: '0.08em', textAlign: 'center' }}>
                Start Your Journey
              </div>
              <h2 className="ae-heading-lg" style={{
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                color: '#FFFFFF', marginBottom: 18,
                textAlign: 'center',
                lineHeight: 1.25,
              }}>
                Ready to Build a Smarter<br />
                Construction Business?
              </h2>
              <p style={{
                fontSize: 'clamp(0.95rem, 1.1vw, 1.05rem)', color: '#E2E8F0', lineHeight: 1.75,
                maxWidth: 520, margin: '0 auto 32px',
                textAlign: 'center',
              }}>
                Join builders and contractors who are moving from Excel spreadsheets
                to Apni Estate's unified construction management platform.
              </p>

              <div className="ae-final-cta-buttons" style={{
                display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap',
                margin: '0 auto', width: '100%',
              }}>
                {/* Gold Primary CTA */}
                <Link
                  to="/signup"
                  className="ae-btn ae-btn-gold"
                  style={{
                    fontSize: 16,
                    padding: '14px 32px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 700,
                    color: '#0B132B',
                  }}
                >
                  <span>Start Free Trial</span>
                  <ArrowRight size={18} />
                </Link>

                {/* White Outline Secondary CTA */}
                <a
                  href="tel:+916009396197"
                  className="ae-btn ae-btn-white-outline"
                  style={{
                    fontSize: 15,
                    padding: '14px 28px',
                    color: '#FFFFFF',
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(8px)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 700,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                    e.currentTarget.style.borderColor = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  }}
                >
                  <Phone size={17} style={{ color: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                    Talk to Sales (+91 60093 96197)
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .ae-final-cta-card {
            border-radius: 22px !important;
            margin: 0 auto !important;
          }
          .ae-final-cta-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            max-width: 320px !important;
            margin: 0 auto !important;
          }
          .ae-final-cta-buttons .ae-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 13px 18px !important;
            white-space: normal !important;
            font-size: 14px !important;
            text-align: center !important;
          }
        }
      `}</style>
    </section>
  );
}
