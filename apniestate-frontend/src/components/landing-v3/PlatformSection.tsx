import React, { useState } from 'react';
import {
  BarChart3, ShoppingCart, Users, Wallet, TrendingUp, Building2, Target, UserCheck,
  Layers, Sparkles, ArrowLeftRight
} from 'lucide-react';

/*
  ERP + CRM Platform Section:
  Shows REAL product modules from the existing application:
  - ERP modules & real ERP dashboard screenshot
  - CRM modules & real CRM Command Center screenshot (user provided)
  - Seamless sidebar switch showcase in the middle with the actual sidebar screenshot
*/

const ERP_MODULES = [
  { icon: BarChart3, label: 'Dashboard', desc: 'Project intelligence, progress tracking, budget overview, weather, and alerts — all in one view.', color: '#2648E7' },
  { icon: ShoppingCart, label: 'Procurement', desc: 'BOQ → Material Requests → Quotations → Purchase Orders → Received → Inventory. Complete supply chain.', color: '#F59E0B' },
  { icon: Wallet, label: 'Finance', desc: 'Cashbook, Expenses, Invoices, Quotations, Budgets. Money In, Money Out, Balance — full financial visibility.', color: '#10B981' },
  { icon: Users, label: 'Operations', desc: 'Labour attendance, equipment tracking, contractor management, and site operations from one workspace.', color: '#7C3AED' },
  { icon: TrendingUp, label: 'Progress', desc: 'Timeline, Milestones, DPR (Daily Progress Reports), Calendar. Stay on schedule with visual tracking.', color: '#EF4444' },
];

const CRM_MODULES = [
  { icon: Target, label: 'Leads & Pipeline', desc: 'Capture incoming inquiries, assign telecallers, manage Kanban stages, and track conversion ratios in real time.', color: '#2648E7' },
  { icon: UserCheck, label: 'Customers & Team', desc: 'Detailed customer histories, hierarchy permissions for sales executives, and telecaller team monitoring.', color: '#10B981' },
  { icon: Building2, label: 'Bookings & Inventory', desc: 'Lock available units, log client booking advances, record closed deal values, and generate agreements.', color: '#FCC300' },
];

export default function PlatformSection() {
  const [view, setView] = useState<'erp' | 'crm'>('erp');

  return (
    <section id="platform" className="ae-section" style={{ background: '#0B132B', color: '#fff' }}>
      <div className="ae-container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="ae-label" style={{ color: '#FCC300', marginBottom: 12 }}>
            One Platform. Two Powerhouses.
          </div>
          <h2 className="ae-heading-lg" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', marginBottom: 16 }}>
            Construction <span style={{ color: '#2648E7' }}>ERP</span> +
            Real Estate <span style={{ color: '#FCC300' }}>CRM</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 620, margin: '0 auto', lineHeight: 1.8 }}>
            Eliminate fragmented tools. Manage on-site execution and customer sales
            from a single unified platform built specifically for Indian builders and developers.
          </p>
        </div>

        {/* Sidebar Switcher Highlight Banner in Middle */}
        <div style={{
          maxWidth: 720,
          margin: '0 auto 40px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 20,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(38, 72, 231, 0.2)',
              color: '#3B82F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--ae-font-display)' }}>
                Instant Sidebar Mode Switcher
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                One tap in the sidebar toggles your team between Site ERP and Sales CRM
              </div>
            </div>
          </div>

          {/* Real Mini Mode Switcher Pill */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <button
              onClick={() => setView('erp')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: view === 'erp' ? '#FFFFFF' : 'transparent',
                color: view === 'erp' ? '#2648E7' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: view === 'erp' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <Layers size={13} />
              <span>ERP</span>
            </button>
            <button
              onClick={() => setView('crm')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: view === 'crm' ? '#FCC300' : 'transparent',
                color: view === 'crm' ? '#0D1117' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: view === 'crm' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <Sparkles size={13} />
              <span>CRM</span>
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          marginBottom: 56,
        }}>
          {(view === 'erp' ? ERP_MODULES : CRM_MODULES).map((mod) => {
            const Icon = mod.icon;
            const accentColor: string = 'color' in mod ? (mod as any).color : '#FCC300';
            return (
              <div
                key={mod.label}
                style={{
                  padding: 24,
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = `${accentColor}50`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${accentColor}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, color: accentColor,
                  border: `1px solid ${accentColor}30`,
                }}>
                  <Icon size={22} />
                </div>
                <h4 style={{
                  fontSize: 17, fontWeight: 700, marginBottom: 8,
                  fontFamily: 'var(--ae-font-display)',
                }}>
                  {mod.label}
                </h4>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                  {mod.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Real Product Devices Showcase: ERP + Sidebar Switch + CRM */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 28,
          flexWrap: 'wrap',
        }}>
          {/* Main Selected Workspace Device (Phone Mockup) */}
          <div style={{
            width: '100%',
            maxWidth: 320,
            borderRadius: 36,
            border: '8px solid #1E293B',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            background: '#fff',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 90, height: 20,
              background: '#1E293B', borderRadius: '0 0 14px 14px', zIndex: 5,
            }} />
            <img
              src={view === 'erp' ? '/landing/v3/media_1789101147463.png' : '/landing/v3/crm_command_center.png'}
              alt={view === 'erp' ? 'Apni Estate ERP Project Intelligence' : 'Apni Estate Real Estate CRM Command Center'}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              loading="lazy"
            />
          </div>

          {/* Sidebar Switcher Phone Mockup — Showing Easy Switch in Action */}
          <div className="ae-hide-mobile" style={{
            width: '100%',
            maxWidth: 290,
            borderRadius: 36,
            border: '8px solid #1E293B',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            background: '#fff',
            position: 'relative',
            opacity: 0.92,
            transform: 'scale(0.96)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 90, height: 20,
              background: '#1E293B', borderRadius: '0 0 14px 14px', zIndex: 5,
            }} />
            <img
              src={view === 'erp' ? '/landing/v3/media_1789101196992.png' : '/landing/v3/crm_sidebar.png'}
              alt={view === 'erp' ? 'Apni Estate ERP Sidebar Navigation' : 'Apni Estate CRM Sidebar Navigation'}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              loading="lazy"
            />
            {/* Overlay hint badge */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              background: 'rgba(11, 19, 43, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FCC300' }}>
                ⚡ One-tap switch inside sidebar
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
