import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

/*
  HERO: The single most important section.
  - Real Apni Estate product UI screenshots embedded in device mockups
  - Construction site background via CSS gradient + overlay
  - Strong headline, clear positioning, dual CTAs
  - Floating product data chips for credibility
*/
export default function HeroSection() {
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 72,
      background: 'linear-gradient(135deg, #F0F2F8 0%, #FFFFFF 40%, #EEF2FD 100%)',
      overflow: 'hidden',
    }}>
      {/* Full-bleed Construction Development Hero Background */}
      <div style={{
        position: 'absolute', inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <img
          src="/landing/v3/hero_engineer_perfect.jpg"
          alt="Site Engineer in yellow helmet and dark blazer reviewing construction project on smartphone"
          className="ae-hero-bg-img"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 35%',
            opacity: 0.95,
            filter: 'contrast(1.05) saturate(1.12)',
          }}
          loading="eager"
        />
        {/* Architectural Overlay */}
        <div className="ae-hero-overlay" style={{
          position: 'absolute', inset: 0,
          background: `
            linear-gradient(90deg, 
              rgba(255, 255, 255, 0.96) 0%, 
              rgba(255, 255, 255, 0.92) 26%, 
              rgba(255, 255, 255, 0.50) 36%, 
              rgba(255, 255, 255, 0.04) 46%, 
              rgba(255, 255, 255, 0.02) 64%, 
              rgba(255, 255, 255, 0.12) 100%
            ),
            linear-gradient(180deg, 
              rgba(255, 255, 255, 0.50) 0%, 
              transparent 14%, 
              transparent 84%, 
              rgba(248, 250, 252, 0.85) 100%
            )
          `,
        }} />

        {/* Precision Blueprint Grid Texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(38,72,231,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(38,72,231,0.035) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px',
        }} />
      </div>

      {/* Abstract accent glow */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(38,72,231,0.07) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="ae-container" style={{ position: 'relative', zIndex: 2, paddingTop: 20, paddingBottom: 36 }}>
        <div className="ae-hero-grid">

          {/* Text Column */}
          <div className="ae-hero-text-col" style={{ maxWidth: 570, position: 'relative', zIndex: 3 }}>
            {/* Category Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 100,
              background: 'rgba(38,72,231,0.09)',
              border: '1px solid rgba(38,72,231,0.22)',
              marginBottom: 14,
              boxShadow: '0 2px 8px rgba(38,72,231,0.06)',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#2648E7',
                animation: 'ae-pulse-soft 2s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: 11.5, fontWeight: 800, color: '#2648E7',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: 'var(--ae-font-display)',
              }}>
                Construction ERP + Real Estate CRM
              </span>
            </div>

            {/* Headline */}
            <h1 className="ae-heading-xl" style={{
              fontSize: 'clamp(2rem, 4.2vw, 3.6rem)',
              color: '#0B132B',
              marginBottom: 14,
              lineHeight: 1.15,
            }}>
              Build <span style={{ color: '#2648E7' }}>Smarter.</span><br />
              Manage <span style={{ color: '#FCC300' }}>Better.</span><br />
              Grow Faster.
            </h1>

            {/* Subline - Authoritative, High Contrast, 100% Clear */}
            <div style={{ marginBottom: 18, maxWidth: 510 }}>
              <p style={{
                fontSize: 'clamp(0.95rem, 1.3vw, 1.15rem)',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 6,
                lineHeight: 1.45,
                fontFamily: 'var(--ae-font-display)',
              }}>
                The unified Operating System for Indian builders, contractors, and real estate developers.
              </p>
              <p style={{
                fontSize: 'clamp(0.85rem, 1.1vw, 0.975rem)',
                fontWeight: 500,
                color: '#334155',
                lineHeight: 1.6,
                fontFamily: 'var(--ae-font-body)',
              }}>
                Manage projects, material procurement, labour logs, cashbook, and property sales — from groundbreaking to handover.
              </p>
            </div>

            {/* Highlighted Impact Metrics: Compact inline chips */}
            <div className="ae-hero-metrics" style={{
              display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22,
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid rgba(38,72,231,0.25)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}>
                <span style={{ fontSize: 13 }}>⚡</span>
                <span style={{
                  fontSize: 11.5, fontWeight: 800, color: '#2648E7',
                  fontFamily: 'var(--ae-font-display)',
                }}>
                  2x Faster Development
                </span>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid rgba(16,185,129,0.28)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}>
                <span style={{ fontSize: 13 }}>💰</span>
                <span style={{
                  fontSize: 11.5, fontWeight: 800, color: '#059669',
                  fontFamily: 'var(--ae-font-display)',
                }}>
                  10% Cost Reduction
                </span>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid rgba(217,168,0,0.35)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}>
                <span style={{ fontSize: 13 }}>⏱️</span>
                <span style={{
                  fontSize: 11.5, fontWeight: 800, color: '#B45309',
                  fontFamily: 'var(--ae-font-display)',
                }}>
                  On-Time Delivery
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="ae-hero-cta-group" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
              <Link
                to="/signup"
                className="ae-btn ae-btn-primary"
                style={{
                  fontSize: 14.5,
                  padding: '13px 26px',
                  background: '#2648E7',
                  color: '#FFFFFF !important',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 700,
                  boxShadow: '0 6px 20px rgba(38, 72, 231, 0.35)',
                }}
              >
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>Start Free Trial</span>
                <ArrowRight size={16} style={{ color: '#FFFFFF' }} />
              </Link>
              <button
                className="ae-btn ae-btn-outline"
                style={{
                  fontSize: 14.5,
                  padding: '13px 24px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1.5px solid #CBD5E1',
                  color: '#0B132B',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Play size={16} style={{ color: '#2648E7' }} />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '7px 14px', borderRadius: 12,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/branding/startuptripura.png" alt="Startup Tripura" style={{ height: 20, objectFit: 'contain' }} />
                <img src="/branding/startupindia.png" alt="Startup India" style={{ height: 18, objectFit: 'contain' }} />
                <img src="/branding/dit.png" alt="DIT Tripura" style={{ height: 20, objectFit: 'contain' }} />
              </div>
              <span style={{
                fontSize: 10.5, color: '#334155', fontWeight: 700,
                fontFamily: 'var(--ae-font-display)',
              }}>
                Govt. Recognized Construction Tech
              </span>
            </div>
          </div>

          {/* Product Visual Composition */}
          <div className="ae-hero-visual-col" style={{
            position: 'relative',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: 460,
            padding: '20px 0',
          }}>
            {/* Floating Live DPR Sync Badge */}
            <div className="ae-float ae-hide-mobile" style={{
              position: 'absolute', top: -10, right: 30, zIndex: 6,
              padding: '8px 16px', borderRadius: 100,
              background: 'rgba(11,19,43,0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--ae-font-display)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              animationDelay: '1s',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#10B981',
                animation: 'ae-pulse-soft 2s ease-in-out infinite',
              }} />
              <span>Live Site DPR • Downtown Plaza</span>
            </div>

            {/* Mobile Header Badge for the Visual */}
            <div className="ae-hide-desktop" style={{
              position: 'absolute', top: -4, zIndex: 6,
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(11,19,43,0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--ae-font-display)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span>Mobile-First ERP • Live Site DPR Sync</span>
            </div>

            {/* Main Phone Mockup — Real Dashboard Screenshot */}
            <div style={{
              position: 'relative', zIndex: 3,
              width: 'min(280px, 80vw)',
              borderRadius: 36,
              border: '8px solid #1E293B',
              boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
              overflow: 'hidden', background: '#fff',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 100, height: 24,
                background: '#1E293B', borderRadius: '0 0 16px 16px', zIndex: 5,
              }} />
              <img
                src="/landing/v3/media_1789101147463.png"
                alt="Apni Estate Dashboard — Project Progress, Budget, Labour"
                style={{ width: '100%', height: 'auto', display: 'block' }}
                loading="eager"
              />
            </div>

            {/* On Mobile: Floating Engineer Review Chip */}
            <div className="ae-hide-desktop" style={{
              position: 'absolute', bottom: 12, right: 0, zIndex: 5,
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(12px)',
              borderRadius: 14, padding: '7px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(226, 232, 240, 0.9)',
            }}>
              <img
                src="/landing/v3/test_mobile_55.jpg"
                alt="Site Engineer with Yellow Helmet"
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--ae-font-display)' }}>
                  Er. Amit Sharma
                </div>
                <div style={{ fontSize: 9.5, color: '#10B981', fontWeight: 600 }}>
                  ● Site Incharge Verified
                </div>
              </div>
            </div>

            {/* Secondary Phone — Finance Screenshot */}
            <div className="ae-hide-mobile" style={{
              position: 'absolute', right: -60, top: 40, zIndex: 2,
              width: 220, borderRadius: 28,
              border: '6px solid #1E293B',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden', background: '#fff',
              transform: 'rotate(4deg)',
            }}>
              <img
                src="/landing/v3/media_1789101184952.png"
                alt="Apni Estate Finance — Cashbook, Budget, Cash Flow"
                style={{ width: '100%', height: 'auto' }}
                loading="eager"
              />
            </div>

            {/* Floating Chip — Project Progress */}
            <div className="ae-float ae-hide-mobile" style={{
              position: 'absolute', top: 20, left: -20, zIndex: 5,
              padding: '10px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
              animationDelay: '0s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(38,72,231,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2648E7', fontWeight: 900, fontSize: 14,
                fontFamily: 'var(--ae-font-display)',
              }}>
                68%
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--ae-font-display)' }}>Project Progress</div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Downtown Plaza</div>
              </div>
            </div>

            {/* Floating Chip — Cost Saved */}
            <div className="ae-float ae-hide-mobile" style={{
              position: 'absolute', bottom: 60, left: -40, zIndex: 5,
              padding: '10px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
              animationDelay: '2s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#10B981', fontSize: 16,
              }}>
                ₹
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--ae-font-display)' }}>Cost Saved</div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>₹4.2L this quarter</div>
              </div>
            </div>

            {/* Floating Chip — Active Site Team */}
            <div className="ae-float ae-hide-mobile" style={{
              position: 'absolute', bottom: 10, right: -40, zIndex: 5,
              padding: '10px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
              animationDelay: '4s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(252,195,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                👷
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--ae-font-display)' }}>Site Team</div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>24 Active Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Edge */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 1, background: 'linear-gradient(90deg, transparent, #E2E8F0, transparent)',
      }} />

      <style>{`
        .ae-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .ae-hero-grid {
            grid-template-columns: 1fr 1fr;
            gap: 64px;
          }
        }
        @media (max-width: 768px) {
          .ae-hero-bg-img {
            object-position: 55% 15% !important;
            opacity: 0.28 !important;
          }
          .ae-hero-overlay {
            background: linear-gradient(180deg, 
              rgba(255, 255, 255, 0.98) 0%, 
              rgba(255, 255, 255, 0.92) 40%, 
              rgba(255, 255, 255, 0.70) 75%, 
              rgba(248, 250, 252, 0.95) 100%
            ) !important;
          }
          .ae-hero-text-col {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            text-align: left;
          }
          .ae-hero-metrics {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
            margin-bottom: 18px !important;
          }
          .ae-hero-metrics > div {
            padding: 4px 9px !important;
            font-size: 10.5px !important;
            border-radius: 7px !important;
          }
          .ae-hero-cta-group {
            display: grid !important;
            grid-template-columns: 1.15fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
            margin-bottom: 20px !important;
          }
          .ae-hero-cta-group .ae-btn {
            padding: 12px 14px !important;
            font-size: 13.5px !important;
            justify-content: center !important;
            width: 100% !important;
          }
          .ae-hero-visual-col {
            padding: 12px 0 24px !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </section>
  );
}
