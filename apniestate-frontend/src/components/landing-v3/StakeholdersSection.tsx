import React from 'react';
import { ArrowRight } from 'lucide-react';

const STAKEHOLDERS = [
  { id: 'builders', title: 'Builders & Developers', tagline: 'Complete project control', img: 'stakeholder_builders.jpg', span: 'tall' },
  { id: 'contractors', title: 'Contractors', tagline: 'On-site efficiency', img: 'stakeholder_contractors.jpg', span: 'normal' },
  { id: 'architects', title: 'Architects', tagline: 'Design collaboration', img: 'stakeholder_architects.jpg', span: 'normal' },
  { id: 'managers', title: 'Project Managers', tagline: 'Real-time dashboards', img: 'stakeholder_managers.jpg', span: 'normal' },
  { id: 'interior', title: 'Interior Designers', tagline: 'Material & vendor mgmt', img: 'stakeholder_interior.jpg', span: 'tall' },
  { id: 'suppliers', title: 'Suppliers & Vendors', tagline: 'PO & delivery tracking', img: 'stakeholder_suppliers.jpg', span: 'normal' },
  { id: 'investors', title: 'Investors', tagline: 'Financial transparency', img: 'stakeholder_investors.jpg', span: 'normal' },
  { id: 'owners', title: 'Property Owners', tagline: 'Hassle-free handover', img: 'stakeholder_owners.jpg', span: 'normal' },
];

export default function StakeholderSection() {
  return (
    <section id="solutions" className="ae-section" style={{ background: '#F8FAFC' }}>
      <div className="ae-container">
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 48, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div className="ae-label" style={{ color: '#2648E7', marginBottom: 12 }}>Who We Serve</div>
            <h2 className="ae-heading-lg" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: '#0B132B' }}>
              Built for Every <span style={{ color: '#2648E7' }}>Stakeholder.</span>
            </h2>
          </div>
          <a href="#platform" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 700, color: '#2648E7',
            fontFamily: 'var(--ae-font-display)',
          }}>
            View All Capabilities <ArrowRight size={16} />
          </a>
        </div>

        {/* Masonry-style Grid */}
        <div className="ae-stakeholders-grid">
          {STAKEHOLDERS.map((s, i) => (
            <div
              key={s.id}
              className={`ae-stakeholder-card ${s.span === 'tall' ? 'ae-card-tall' : ''}`}
              style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <img
                src={`/landing/v3/${s.img}`}
                alt={s.title}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s ease',
                }}
                loading="lazy"
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
              {/* Gradient Overlay */}
              <div className="ae-stakeholder-overlay" style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(11,19,43,0.88) 0%, rgba(11,19,43,0.3) 40%, transparent 70%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: 20,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#FCC300',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 4,
                  fontFamily: 'var(--ae-font-display)',
                }}>
                  {s.tagline}
                </span>
                <h3 style={{
                  fontSize: 18, fontWeight: 800, color: '#fff',
                  fontFamily: 'var(--ae-font-display)',
                  lineHeight: 1.3,
                }}>
                  {s.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .ae-stakeholders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          grid-auto-rows: 200px;
        }
        .ae-card-tall {
          grid-row: span 2;
        }
        @media (max-width: 640px) {
          .ae-stakeholders-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 175px;
            gap: 10px;
          }
          .ae-card-tall {
            grid-row: span 1;
          }
          .ae-stakeholder-card h3 {
            font-size: 14px !important;
            line-height: 1.25 !important;
          }
          .ae-stakeholder-card span {
            font-size: 9px !important;
            margin-bottom: 2px !important;
          }
          .ae-stakeholder-overlay {
            padding: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
