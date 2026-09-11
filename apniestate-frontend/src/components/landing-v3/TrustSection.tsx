import React from 'react';

/*
  Recognition & Trust Section:
  Exact 3-card layout as provided in the user's reference:
  1. Startup Tripura
  2. Startup India
  3. DIT Tripura
  Clean white cards with genuine full-color logos and verified government accreditation copy.
*/

const RECOGNITIONS = [
  {
    id: 'startup-tripura',
    logo: '/branding/startuptripura.png',
    logoHeight: 64,
    title: 'Startup Tripura',
    desc: "Recognized by the Government of Tripura's Startup policy, reflecting our commitment to enterprise-grade innovation in the region.",
  },
  {
    id: 'startup-india',
    logo: '/branding/startupindia.png',
    logoHeight: 38,
    title: 'Startup India',
    desc: "Officially recognized by the Government of India's Startup India initiative — validating our legitimate, high-growth trajectory.",
  },
  {
    id: 'dit-tripura',
    logo: '/branding/dit.png',
    logoHeight: 74,
    title: 'DIT Tripura',
    desc: 'Acknowledged by the Directorate of Information Technology (Govt. of Tripura) for technological advancement in construction.',
  },
];

export default function TrustSection() {
  return (
    <section id="recognition" className="ae-section" style={{ background: '#F8FAFC' }}>
      <div className="ae-container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="ae-label" style={{ color: '#2648E7', marginBottom: 12 }}>
            Government Accreditations & Trust
          </div>
          <h2 className="ae-heading-lg" style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            color: '#0B132B',
            marginBottom: 16,
          }}>
            Backed & Recognized by <span style={{ color: '#2648E7' }}>Government Institutions</span>
          </h2>
          <p className="ae-body" style={{ maxWidth: 580, margin: '0 auto', fontSize: 16 }}>
            Apni Estate is officially recognized for driving indigenous digital transformation
            in Indian construction management and real estate operations.
          </p>
        </div>

        {/* 3 Recognition Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 28,
          alignItems: 'stretch',
        }}>
          {RECOGNITIONS.map((rec) => (
            <div
              key={rec.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 24,
                padding: '40px 32px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(38, 72, 231, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(38, 72, 231, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              {/* Logo Container with Fixed Height for Alignment */}
              <div style={{
                height: 90,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <img
                  src={rec.logo}
                  alt={rec.title}
                  style={{
                    maxHeight: rec.logoHeight,
                    maxWidth: 180,
                    objectFit: 'contain',
                  }}
                  loading="lazy"
                />
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#0B132B',
                fontFamily: 'var(--ae-font-display)',
                marginBottom: 16,
              }}>
                {rec.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: 14,
                color: '#64748B',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {rec.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
